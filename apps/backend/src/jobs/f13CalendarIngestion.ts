import { fetchCalendarRange, JblankedApiError, type JblankedRawEvent } from "../providers/jblanked";
import { upsertMacroEvent } from "../db/macroEvents";
import { getState, recordAttempt, recordFailure, recordSuccess, type IngestionState } from "../db/ingestionState";
import { normalizeEventType, parseJblankedLocalDateToUtc, JBLANKED_SOURCE_TIMEZONE_LABEL } from "../real/f13EventTypes";

// F13 calendar ingestion job — the ONLY code path allowed to call
// providers/jblanked.ts's `fetchCalendarRange`. JBlanked's free tier is
// documented (and live-confirmed, see f13EventTypes.ts's timezone comment)
// as extremely rate-limited, so the guard below is enforced against
// `ingestion_state` (persisted in MySQL) BEFORE any network call is made —
// it survives process restarts, unlike an in-memory flag alone.
//
// Window: `today - 2 days` through `today + 9 days`. The 2-day lookback
// picks up an `actual` that landed since yesterday's run and repairs a
// missed day; the 9-day lookahead comfortably covers "this week and next
// week's early releases" for the frontend's week-strip view.
//
// Impact filter: NONE is sent to JBlanked itself (see providers/jblanked.ts
// top-of-file comment — requesting unfiltered impact costs nothing extra
// against the quota and returns Medium-impact rows the product may also
// want to store); this job keeps High and Medium, discards Low/None.
export const F13_INGESTION_JOB_KEY = "jblanked:calendar";

const KEPT_IMPACTS = new Set(["High", "Medium"]);
// Don't hammer JBlanked on a FAILED attempt (including the live-confirmed
// QUOTA_EXCEEDED case) — retry at most once per hour, not on every request
// that happens to ask for a fresh snapshot.
const FAILURE_RETRY_COOLDOWN_MS = 60 * 60_000;
const LOOKBACK_DAYS = 2;
const LOOKAHEAD_DAYS = 9;

// Product-owner bug report (2026-09-01): JOLTS/ISM (both scheduled 10:00 ET)
// still showed no Actual hours after release. Root cause confirmed directly
// against `macro_events`/`ingestion_state`: this codebase's ingestion is
// lazy/request-triggered (see the module doc comment above and
// db/ingestionRunner.ts — no cron/poller by design), so the day's single
// JBlanked call fires on whatever request happens to be the first of the
// UTC day. On 2026-09-01 that was 13:25:08Z (09:25 ET) — before BOTH the
// 08:30 ET and 10:00 ET release windows — so JOLTS/ISM were still showing
// JBlanked's own "not released yet" placeholder (see f13Calendar.ts's
// literal-`0` handling) when ingested; this was never a display bug.
// Fix: gate the day's first attempt behind a target ingestion hour in
// America/New_York, so the once-daily call more often lands after both
// common release windows. This does NOT add a second call — it only delays
// *when* the existing single daily call fires; if no request ever comes in
// after the target hour on a given day, that day's ingestion simply never
// happens (an accepted tradeoff of this lazy/request-triggered design,
// unchanged from before this fix).
const TARGET_INGESTION_HOUR_ET = 11;

function isSameUtcDay(a: Date, b: Date): boolean {
  return a.getUTCFullYear() === b.getUTCFullYear() && a.getUTCMonth() === b.getUTCMonth() && a.getUTCDate() === b.getUTCDate();
}

/** Current hour-of-day (0-23) in America/New_York for `date`, DST-aware via Intl (never a fixed UTC offset). */
function etHourOf(date: Date): number {
  const formatted = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    hour: "2-digit",
    hour12: false,
  }).format(date);
  const hour = Number(formatted);
  return hour === 24 ? 0 : hour; // some ICU implementations format midnight as "24"
}

/**
 * Pure decision logic (no I/O) — the once-daily/cooldown/target-hour guard,
 * given whatever `ingestion_state` row (or `null`, if the job has never run
 * at all) already exists. Separated from `shouldAttemptJblankedIngestion`
 * below purely so it can be unit-tested with fabricated state objects,
 * without needing a live MySQL connection — see
 * tests/f13-calendar-normalization.test.ts.
 */
export function computeIngestionDecision(state: IngestionState | null, now: Date): { attempt: boolean; reason: string } {
  const targetHourReached = etHourOf(now) >= TARGET_INGESTION_HOUR_ET;

  if (!state || state.lastStatus === "NEVER_RUN") {
    if (!targetHourReached) {
      return {
        attempt: false,
        reason: `never run yet — waiting for the target ingestion hour (${TARGET_INGESTION_HOUR_ET}:00 ET) so today's 08:30/10:00 ET releases are more often already out`,
      };
    }
    return { attempt: true, reason: "never run" };
  }
  if (state.lastStatus === "SUCCESS") {
    const alreadyRanToday = !!state.lastSuccessAt && isSameUtcDay(state.lastSuccessAt, now);
    if (alreadyRanToday) {
      return { attempt: false, reason: `already succeeded today (last success ${state.lastSuccessAt?.toISOString()})` };
    }
    if (!targetHourReached) {
      return {
        attempt: false,
        reason: `last success was on a previous UTC day — waiting for the target ingestion hour (${TARGET_INGESTION_HOUR_ET}:00 ET) before spending today's single call`,
      };
    }
    return { attempt: true, reason: "last success was on a previous UTC day and the target ingestion hour has been reached" };
  }
  // FAILED — retry cooldown is a distinct concern from the target-hour gate
  // above (an error retry isn't about catching same-day releases, it's
  // about not hammering JBlanked after a failure), so it stays ungated.
  const lastAttemptMs = state.lastAttemptAt?.getTime() ?? 0;
  const withinCooldown = now.getTime() - lastAttemptMs < FAILURE_RETRY_COOLDOWN_MS;
  return withinCooldown
    ? { attempt: false, reason: `last attempt failed recently (${state.lastError ?? "unknown error"}) — cooling down` }
    : { attempt: true, reason: "last attempt failed and the retry cooldown has elapsed" };
}

/**
 * The persisted, cross-restart daily guard. Exported so tests and the
 * status surface can inspect the decision without duplicating its logic.
 */
export async function shouldAttemptJblankedIngestion(now: Date = new Date()): Promise<{ attempt: boolean; reason: string }> {
  const state = await getState(F13_INGESTION_JOB_KEY);
  return computeIngestionDecision(state, now);
}

function toYmd(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function ingestionWindow(now: Date): { fromYmd: string; toYmd: string } {
  const from = new Date(now.getTime());
  from.setUTCDate(from.getUTCDate() - LOOKBACK_DAYS);
  const to = new Date(now.getTime());
  to.setUTCDate(to.getUTCDate() + LOOKAHEAD_DAYS);
  return { fromYmd: toYmd(from), toYmd: toYmd(to) };
}

/** JBlanked's Actual/Forecast/Previous come back as number, string, or null/absent — normalized to a trimmed string or null for macro_events' VARCHAR columns. */
function toStoredValue(value: number | string | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/** A stable-enough external key for audit/debugging (NOT the DB uniqueness boundary — see macroEvents.ts's doc comment on why (normalized_event_type, scheduled_at_utc, currency) is used instead). */
function buildExternalKey(raw: JblankedRawEvent): string {
  return `${raw.Currency}|${raw.Name}|${raw.Date}`.slice(0, 255);
}

async function normalizeAndUpsertAll(events: readonly JblankedRawEvent[]): Promise<{ upserted: number; skippedLowImpact: number; skippedUnparseableDate: number }> {
  let upserted = 0;
  let skippedLowImpact = 0;
  let skippedUnparseableDate = 0;

  for (const raw of events) {
    if (!KEPT_IMPACTS.has(raw.Impact)) {
      skippedLowImpact++;
      continue;
    }

    const scheduledAtUtc = parseJblankedLocalDateToUtc(raw.Date);
    if (!scheduledAtUtc) {
      console.error(`[f13-calendar-ingestion] skipping event "${raw.Name}" — unparseable Date "${raw.Date}"`);
      skippedUnparseableDate++;
      continue;
    }

    const actualValue = toStoredValue(raw.Actual);
    try {
      // eslint-disable-next-line no-await-in-loop -- sequential is fine: at most a few dozen rows, once/day.
      await upsertMacroEvent({
        source: "jblanked",
        externalKey: buildExternalKey(raw),
        name: raw.Name,
        normalizedEventType: normalizeEventType(raw.Name),
        scheduledAtUtc,
        originalTimezone: JBLANKED_SOURCE_TIMEZONE_LABEL,
        currency: raw.Currency,
        impact: raw.Impact,
        previousValue: toStoredValue(raw.Previous),
        forecastValue: toStoredValue(raw.Forecast),
        actualValue,
        scheduleSource: "JBLANKED",
        forecastSource: "JBLANKED",
        actualSource: actualValue !== null ? "JBLANKED" : null,
      });
      upserted++;
    } catch (err) {
      console.error(`[f13-calendar-ingestion] failed to upsert "${raw.Name}" (${raw.Date}):`, err instanceof Error ? err.message : err);
    }
  }

  return { upserted, skippedLowImpact, skippedUnparseableDate };
}

export interface F13IngestionResult {
  /** False when the daily/cooldown guard skipped this call without touching the network — the normal case for every request after the day's first. */
  ran: boolean;
  upserted: number;
  reason: string;
}

// Single-flight guard: if two requests race in the same Node process before
// `ingestion_state` reflects the first one's attempt, only ONE actually
// calls the network — the second awaits the first's in-flight promise
// instead of starting a duplicate real call. `ingestion_state` itself is the
// cross-process/cross-restart guard (see shouldAttemptJblankedIngestion);
// this is a same-process belt-and-suspenders addition.
let inFlight: Promise<F13IngestionResult> | null = null;

/**
 * Runs the guarded JBlanked ingestion IF one is due (see
 * `shouldAttemptJblankedIngestion`); otherwise returns immediately with
 * `ran: false` and no network call. Safe to call on every
 * `/api/market/snapshot` / `/api/calendar/*` request — see
 * apps/backend/src/real/f13Calendar.ts, which does exactly that.
 *
 * `deps.fetchRaw` is an injectable override (defaults to the real
 * `fetchCalendarRange`) used only by tests and by the one-time manual
 * verification run this milestone performed — see docs/PROVIDER_SETUP.md's
 * F13 section for why that run's captured response was replayed here
 * instead of issuing a second live call.
 */
export async function runF13CalendarIngestion(
  deps: {
    fetchRaw?: (fromYmd: string, toYmd: string) => Promise<JblankedRawEvent[]>;
    now?: Date;
  } = {}
): Promise<F13IngestionResult> {
  if (inFlight) return inFlight;

  const task = (async (): Promise<F13IngestionResult> => {
    const now = deps.now ?? new Date();
    const decision = await shouldAttemptJblankedIngestion(now);
    if (!decision.attempt) {
      return { ran: false, upserted: 0, reason: decision.reason };
    }

    const { fromYmd, toYmd: toYmdStr } = ingestionWindow(now);
    // Product-owner bug report (2026-09-01): expand currency scope from
    // USD-only to USD+JPY (Gold's dollar and yen carry-trade/BOJ
    // sensitivity), WITHOUT spending a second call against JBlanked's
    // 1-request/day free-tier budget. Passed as one comma-joined value on
    // the existing single request's `currency` query param — this mirrors
    // the common REST convention for a multi-value filter, but is NOT
    // live-confirmed against JBlanked's own docs (no multi-currency example
    // exists in providers/jblanked.ts's top-of-file doc comment, and today's
    // single call was already spent — see docs/PROVIDER_SETUP.md — before
    // this fix was written, so it could not be tested live this pass). If
    // JBlanked does not actually support a comma-joined value, the next
    // real ingestion attempt (tomorrow) will surface it as either a
    // JblankedApiError (safe: existing DB rows are kept, never fabricated)
    // or a response containing only USD rows (also safe, just narrower than
    // intended) — either way, never a silent wrong-data outcome. Flagged
    // here for a human to verify against a real response before relying on
    // JPY rows being present.
    const fetchRaw = deps.fetchRaw ?? ((from: string, to: string) => fetchCalendarRange(from, to, "USD,JPY"));

    await recordAttempt(F13_INGESTION_JOB_KEY);
    try {
      const raw = await fetchRaw(fromYmd, toYmdStr);
      const { upserted, skippedLowImpact, skippedUnparseableDate } = await normalizeAndUpsertAll(raw);
      const expectedNextAt = new Date(now.getTime() + 24 * 60 * 60_000);
      await recordSuccess(F13_INGESTION_JOB_KEY, expectedNextAt);
      return {
        ran: true,
        upserted,
        reason: `ingested ${upserted} event(s) for ${fromYmd}..${toYmdStr} (${skippedLowImpact} low-impact skipped, ${skippedUnparseableDate} unparseable dates skipped)`,
      };
    } catch (err) {
      const safeMessage =
        err instanceof JblankedApiError
          ? `[${err.code}] ${err.message}`
          : err instanceof Error
            ? err.message
            : String(err);
      await recordFailure(F13_INGESTION_JOB_KEY, safeMessage);
      console.error("[f13-calendar-ingestion] fetch failed:", safeMessage);
      return { ran: true, upserted: 0, reason: safeMessage };
    }
  })();

  inFlight = task;
  try {
    return await task;
  } finally {
    inFlight = null;
  }
}
