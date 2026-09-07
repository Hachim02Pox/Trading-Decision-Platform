import type {
  CalendarDaySummary,
  CalendarEventItem,
  CalendarIngestionStatus,
  CalendarWeekResponse,
  EventItem,
  FamilyId,
} from "@gold-terminal/contracts";
import { getEventsInRange, type MacroEventRow } from "../db/macroEvents";
import { getState } from "../db/ingestionState";
import { runF13CalendarIngestion, F13_INGESTION_JOB_KEY } from "../jobs/f13CalendarIngestion";
import { detectCadence, lookupOfficialSource, resolveEventValueUnit } from "./f13EventTypes";
import type { FamilyOverrideResult, KpiOverride } from "./types";

// F13 real economic calendar — reads `macro_events` (populated by
// jobs/f13CalendarIngestion.ts) and builds (a) the lightweight
// nextEvents/activeCatalyst fields apps/backend/src/cache/snapshotCache.ts
// wires onto F13's CanonicalFamilySnapshot, and (b) the richer
// CalendarWeekResponse/CalendarDaySummary shapes for the dedicated
// /api/calendar/* routes the new week-strip frontend calls. This module
// does NOT call JBlanked itself — every entry point here first asks
// runF13CalendarIngestion() whether a fetch is due (guarded, see that
// module), then reads whatever is currently in the DB either way. REAL mode
// rule: a fetch failure or "never run yet" renders as genuinely empty/
// UNAVAILABLE here — never a fallback to the old mock fixture events.

// Product-owner bug report (2026-09-01): the cockpit-visible calendar was
// showing Medium-impact rows on the week/day view even though the cockpit
// "nextEvents" surface was already High-only, and was USD-only despite Gold
// having real USD *and* JPY (dollar/BOJ carry-trade) sensitivity. Every
// cockpit-visible F13 surface — nextEvents/activeCatalyst AND the week/day
// calendar strip — now uses the SAME High-impact, USD+JPY filter. Medium
// (and Low/None) impact rows may still be stored in `macro_events` (see
// f13CalendarIngestion.ts's KEPT_IMPACTS, unchanged) for completeness/future
// use — this filter only governs what's ever read back out for display.
const COCKPIT_CURRENCIES = ["USD", "JPY"];
const COCKPIT_IMPACTS = ["High"];
const MAX_COCKPIT_EVENTS = 3;
const RECENT_INGESTION_FRESH_MS = 36 * 60 * 60_000; // a bit over a day — covers the once-daily cadence with buffer

function findKpiOverride(overrides: Partial<Record<FamilyId, FamilyOverrideResult>>, kpiId: string): KpiOverride | null {
  for (const family of Object.values(overrides)) {
    const override = family?.kpiOverrides[kpiId];
    if (override) return override;
  }
  return null;
}

function toFiniteNumber(value: string | null): number | null {
  if (value === null) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

/**
 * Part 4 of the milestone brief: prefer an already-fetched official-source
 * KPI value over JBlanked's own `actual` once the release has genuinely
 * happened. `officialOverrides` is THIS SAME REQUEST's already-computed
 * `buildRealFamilyOverrides()` result (passed in by the caller) — this
 * function makes no new provider/network call of its own, read-only
 * cross-reference only.
 */
function resolveDisplayActual(
  row: MacroEventRow,
  officialOverrides: Partial<Record<FamilyId, FamilyOverrideResult>>,
  now: Date
): { actualValue: number | null; actualSource: string | null } {
  const alreadyReleased = row.scheduledAtUtc.getTime() <= now.getTime();
  // Live-observed quirk (2026-09-01 ingestion): JBlanked returns a literal
  // `0` (not null/absent) for an event's Actual field before it has
  // released — e.g. a future Nonfarm Payrolls row came back with
  // `Actual: 0`, which is indistinguishable from a genuine zero print by
  // value alone. Never trust ANY actual (JBlanked's own, or an official-
  // source cross-reference) for an event whose scheduled time is still in
  // the future, regardless of what raw value is stored.
  if (!alreadyReleased) {
    return { actualValue: null, actualSource: null };
  }

  const cadence = detectCadence(row.name);
  const mapping = lookupOfficialSource(row.normalizedEventType, cadence);
  if (mapping) {
    const override = findKpiOverride(officialOverrides, mapping.kpiId);
    if (override && override.dataState === "REAL" && override.value !== null) {
      return { actualValue: override.value, actualSource: mapping.source };
    }
  }

  const jblankedActual = toFiniteNumber(row.actualValue);
  // Same quirk as above, observed to also leak through AFTER release (live,
  // 2026-09-01 data-layer audit pass): JBlanked's `Actual` field is a
  // literal `0` placeholder that does not always flip to the real print the
  // instant `scheduledAtUtc` passes — e.g. an ISM Manufacturing PMI /
  // JOLTS row several hours past its scheduled release time still reading
  // `Actual: 0`, which for these event types (never genuinely zero — a PMI
  // or job-openings count of exactly 0 is not a real economic outcome) is
  // unambiguously "not populated yet," not a real print. Since a
  // fabricated-looking "the print was zero" is a worse failure than an
  // honest gap (this codebase's "never simulated" rule outranks "never
  // silently missing" when the two conflict), treat a literal `0` the same
  // as absent here too — it will resolve to the genuine value on a later
  // refresh once JBlanked actually populates it.
  if (jblankedActual === 0) {
    return { actualValue: null, actualSource: null };
  }
  return { actualValue: jblankedActual, actualSource: jblankedActual !== null ? "JBLANKED" : null };
}

function computeSurprise(actual: number | null, forecast: number | null): number | null {
  if (actual === null || forecast === null) return null;
  const diff = actual - forecast;
  return Number.isFinite(diff) ? diff : null;
}

function timezoneLabelFor(currency: string): string {
  // USD events render America/New_York ("ET"); JPY events (added per the
  // milestone brief's USD+JPY expansion — dollar/BOJ carry-trade relevance
  // to Gold) render Asia/Tokyo ("JST"). Kept as a currency-keyed function
  // (not a hardcoded literal) so a future currency added to the filter
  // fails loudly (falls back to the raw currency code) instead of silently
  // mislabeling.
  if (currency === "USD") return "ET";
  if (currency === "JPY") return "JST";
  return currency;
}

/**
 * Converts stored rows into the richer `CalendarEventItem` shape, marking
 * exactly one "NEXT" event — the single soonest `scheduledAtUtc > now`
 * among the rows PASSED IN. Callers decide the row set (cockpit: a wide
 * forward window; week/day views: just that window) so "NEXT" is always
 * relative to what's actually being displayed.
 */
function buildCalendarEvents(
  rows: readonly MacroEventRow[],
  officialOverrides: Partial<Record<FamilyId, FamilyOverrideResult>>,
  now: Date
): CalendarEventItem[] {
  const sorted = [...rows].sort((a, b) => a.scheduledAtUtc.getTime() - b.scheduledAtUtc.getTime());
  const nextRow = sorted.find((row) => row.scheduledAtUtc.getTime() > now.getTime());

  return sorted.map((row) => {
    const { actualValue, actualSource } = resolveDisplayActual(row, officialOverrides, now);
    const forecastValue = toFiniteNumber(row.forecastValue);
    const isUpcoming = row.scheduledAtUtc.getTime() > now.getTime();
    const state: CalendarEventItem["state"] = !isUpcoming ? "RELEASED" : row.id === nextRow?.id ? "NEXT" : "UPCOMING";

    return {
      id: String(row.id),
      normalizedEventType: row.normalizedEventType,
      name: row.name,
      currency: row.currency,
      impact: row.impact === "High" ? "High" : "Medium",
      scheduledAtUtc: row.scheduledAtUtc.toISOString(),
      timezoneLabel: timezoneLabelFor(row.currency),
      unit: resolveEventValueUnit(row.normalizedEventType),
      previousValue: toFiniteNumber(row.previousValue),
      forecastValue,
      actualValue,
      actualSource,
      surprise: computeSurprise(actualValue, forecastValue),
      state,
    };
  });
}

async function resolveIngestionStatus(now: Date): Promise<{ status: CalendarIngestionStatus; lastIngestionAt: string | null }> {
  let state: Awaited<ReturnType<typeof getState>>;
  try {
    state = await getState(F13_INGESTION_JOB_KEY);
  } catch (err) {
    // Same rule as every other DB read in this file: a MySQL outage degrades
    // this to an honest "FAILED" status (surfaced to the frontend as
    // refreshFailed/no-data), never an uncaught rejection that crashes the
    // /api/calendar/* route calling this.
    console.error("[f13-calendar] getState failed for ingestion status:", err instanceof Error ? err.message : err);
    return { status: "FAILED", lastIngestionAt: null };
  }
  if (!state || state.lastStatus === "NEVER_RUN") {
    return { status: "NEVER_RUN", lastIngestionAt: null };
  }
  if (state.lastStatus === "FAILED") {
    return { status: "FAILED", lastIngestionAt: state.lastSuccessAt?.toISOString() ?? null };
  }
  const ageMs = state.lastSuccessAt ? now.getTime() - state.lastSuccessAt.getTime() : Infinity;
  return {
    status: ageMs < RECENT_INGESTION_FRESH_MS ? "OK" : "STALE",
    lastIngestionAt: state.lastSuccessAt?.toISOString() ?? null,
  };
}

/** Attempts the guarded ingestion (a no-op network-wise on every call after the day's first success) then always reports the resulting DB/ingestion state — errors are swallowed here because a fetch failure must degrade to "empty/UNAVAILABLE," never crash the snapshot/route that called this. */
async function ensureIngestedBestEffort(): Promise<void> {
  try {
    await runF13CalendarIngestion();
  } catch (err) {
    console.error("[f13-calendar] ingestion attempt threw unexpectedly:", err instanceof Error ? err.message : err);
  }
}

/**
 * F13's cockpit-face data: up to 3 soonest High-impact USD events as
 * `nextEvents`, and the single soonest of those as `activeCatalyst` (null
 * when there are none — e.g. ingestion has never run/succeeded). Called
 * from snapshotCache.ts additively for the F13 family only.
 */
export async function buildF13CockpitEvents(
  officialOverrides: Partial<Record<FamilyId, FamilyOverrideResult>>,
  now: Date = new Date()
): Promise<{ nextEvents: EventItem[]; activeCatalyst: EventItem | null }> {
  await ensureIngestedBestEffort();

  const from = new Date(now.getTime() - 24 * 60 * 60_000); // include "today" even if it's earlier UTC-day-wise
  const to = new Date(now.getTime() + 30 * 24 * 60 * 60_000);

  let rows: MacroEventRow[] = [];
  try {
    rows = await getEventsInRange(from, to, { currencies: COCKPIT_CURRENCIES, impacts: COCKPIT_IMPACTS });
  } catch (err) {
    // DB not configured/unreachable — genuinely empty, never mock fallback.
    console.error("[f13-calendar] getEventsInRange failed for cockpit events:", err instanceof Error ? err.message : err);
    return { nextEvents: [], activeCatalyst: null };
  }

  const upcoming = rows
    .filter((row) => row.scheduledAtUtc.getTime() > now.getTime())
    .sort((a, b) => a.scheduledAtUtc.getTime() - b.scheduledAtUtc.getTime())
    .slice(0, MAX_COCKPIT_EVENTS);

  const nextEvents: EventItem[] = upcoming.map((row) => ({
    id: `f13-macro-${row.id}`,
    title: row.name,
    scheduledAt: row.scheduledAtUtc.toISOString(),
  }));

  const activeCatalyst: EventItem | null = nextEvents[0] ?? null;
  // officialOverrides is accepted for symmetry with the week/day builders
  // and future use (e.g. an "actual just landed" catalyst upgrade) — not
  // used to alter the cockpit's title-only EventItem shape today.
  void officialOverrides;

  return { nextEvents, activeCatalyst };
}

function startOfUtcWeek(now: Date): Date {
  const day = now.getUTCDay(); // 0 = Sunday
  const daysSinceMonday = (day + 6) % 7;
  const monday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  monday.setUTCDate(monday.getUTCDate() - daysSinceMonday);
  return monday;
}

function groupByUtcDate(events: readonly CalendarEventItem[]): Map<string, CalendarEventItem[]> {
  const map = new Map<string, CalendarEventItem[]>();
  for (const event of events) {
    const dateKey = event.scheduledAtUtc.slice(0, 10);
    const bucket = map.get(dateKey);
    if (bucket) bucket.push(event);
    else map.set(dateKey, [event]);
  }
  return map;
}

function buildDaySummary(dateKey: string, events: CalendarEventItem[], neverConfirmed: boolean): CalendarDaySummary {
  return {
    date: dateKey,
    eventCount: events.length,
    hasHighImpact: events.some((e) => e.impact === "High"),
    events,
    refreshFailed: events.length === 0 && neverConfirmed,
  };
}

/** Builds the full current-week (Mon..Sun, UTC) response for the frontend week-strip. */
export async function buildCalendarWeekResponse(
  officialOverrides: Partial<Record<FamilyId, FamilyOverrideResult>>,
  now: Date = new Date()
): Promise<CalendarWeekResponse> {
  await ensureIngestedBestEffort();

  const weekStart = startOfUtcWeek(now);
  const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60_000 - 1000);

  const { status: ingestionStatus, lastIngestionAt } = await resolveIngestionStatus(now);
  const neverConfirmed = ingestionStatus === "NEVER_RUN" || ingestionStatus === "FAILED";

  let rows: MacroEventRow[] = [];
  try {
    rows = await getEventsInRange(weekStart, weekEnd, { currencies: COCKPIT_CURRENCIES, impacts: COCKPIT_IMPACTS });
  } catch (err) {
    console.error("[f13-calendar] getEventsInRange failed for week view:", err instanceof Error ? err.message : err);
  }

  const events = buildCalendarEvents(rows, officialOverrides, now);
  const byDate = groupByUtcDate(events);

  const days: CalendarDaySummary[] = [];
  for (let i = 0; i < 7; i++) {
    const day = new Date(weekStart.getTime() + i * 24 * 60 * 60_000);
    const dateKey = day.toISOString().slice(0, 10);
    days.push(buildDaySummary(dateKey, byDate.get(dateKey) ?? [], neverConfirmed));
  }

  return {
    generatedAt: now.toISOString(),
    days,
    ingestionStatus,
    lastIngestionAt,
  };
}

/** Builds a single day's full event list — cockpit filter (High-impact, USD+JPY) applied, matching the week view — for the day-detail view. */
export async function buildCalendarDayResponse(
  dateYmd: string,
  officialOverrides: Partial<Record<FamilyId, FamilyOverrideResult>>,
  now: Date = new Date()
): Promise<CalendarDaySummary> {
  await ensureIngestedBestEffort();

  const dayStart = new Date(`${dateYmd}T00:00:00.000Z`);
  if (Number.isNaN(dayStart.getTime())) {
    return { date: dateYmd, eventCount: 0, hasHighImpact: false, events: [], refreshFailed: true };
  }
  const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60_000 - 1000);

  const { status: ingestionStatus } = await resolveIngestionStatus(now);
  const neverConfirmed = ingestionStatus === "NEVER_RUN" || ingestionStatus === "FAILED";

  let rows: MacroEventRow[] = [];
  try {
    rows = await getEventsInRange(dayStart, dayEnd, { currencies: COCKPIT_CURRENCIES, impacts: COCKPIT_IMPACTS });
  } catch (err) {
    console.error("[f13-calendar] getEventsInRange failed for day view:", err instanceof Error ? err.message : err);
  }

  const events = buildCalendarEvents(rows, officialOverrides, now);
  return buildDaySummary(dateYmd, events, neverConfirmed);
}
