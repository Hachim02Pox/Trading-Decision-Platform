import { fetchForexFactoryThisWeek, ForexFactoryApiError, type ForexFactoryRawEvent } from "../providers/forexFactory";
import { upsertMacroEvent } from "../db/macroEvents";
import { getState, recordAttempt, recordFailure, recordSuccess, type IngestionState } from "../db/ingestionState";
import { normalizeEventType } from "../real/f13EventTypes";
import { hourInTimeZone } from "../lib/timeZoneHour";

// F13 calendar ingestion job — the ONLY code path allowed to call
// providers/forexFactory.ts's `fetchForexFactoryThisWeek`. Switched
// 2026-09-14 from JBlanked (paid-tier-blocked, see providers/jblanked.ts's
// header and docs/PROVIDER_SETUP.md) to Forex Factory's free public feed
// (see providers/forexFactory.ts's header for the full reasoning and
// tradeoffs). The once-per-week/cooldown/target-hour guard below is kept
// EXACTLY as conservative as it was for JBlanked — if anything, being a good
// citizen of a free, unofficial, keyless feed deserves MORE restraint, not
// less, even though this feed has no documented formal quota.
//
// Window: the complete Monday-Sunday UTC week containing the ingestion date
// (the feed itself only ever returns "this week" — there is no from/to
// range parameter to request further ahead, unlike JBlanked).
//
// Impact filter: the feed returns every country/impact with no server-side
// filter; this job discards non-USD rows and Low-impact rows itself (kept:
// High + Medium, matching the previous JBlanked-era behavior).
export const F13_INGESTION_JOB_KEY = "forexfactory:calendar";

const KEPT_CURRENCY = "USD";
const KEPT_IMPACTS = new Set(["High", "Medium"]);
// Don't hammer the feed on a FAILED attempt — retry at most once per hour,
// not on every request that happens to ask for a fresh snapshot.
const FAILURE_RETRY_COOLDOWN_MS = 60 * 60_000;

// Product-owner bug report (2026-09-01, JBlanked era): JOLTS/ISM (both
// scheduled 10:00 ET) still showed no Actual hours after release. Root cause
// confirmed directly against `macro_events`/`ingestion_state`: this
// codebase's ingestion is lazy/request-triggered (see the module doc
// comment above and db/ingestionRunner.ts — no cron/poller by design), so
// the week's single call fires on whatever request happens to be first.
// Fix: gate the first attempt of a new week behind a target ingestion hour
// in America/New_York, so it more often lands after common release windows.
// Kept unchanged for the Forex Factory source — still the right behavior
// for the same reason, and this feed carries no "actual" values at all now
// (see providers/forexFactory.ts), so this gate mainly just avoids
// ingesting before the week's own forecast/previous values have settled.
const TARGET_INGESTION_HOUR_ET = 11;

function startOfUtcWeek(date: Date): Date {
  const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const daysSinceMonday = (start.getUTCDay() + 6) % 7;
  start.setUTCDate(start.getUTCDate() - daysSinceMonday);
  return start;
}

function isSameUtcWeek(a: Date, b: Date): boolean {
  return startOfUtcWeek(a).getTime() === startOfUtcWeek(b).getTime();
}

/** Current hour-of-day (0-23) in America/New_York for `date`, DST-aware (see lib/timeZoneHour.ts). */
function etHourOf(date: Date): number {
  return hourInTimeZone(date, "America/New_York");
}

/**
 * Pure decision logic (no I/O) — the once-weekly/cooldown/target-hour
 * guard, given whatever `ingestion_state` row (or `null`, if the job has
 * never run at all) already exists. Separated from
 * `shouldAttemptCalendarIngestion` below purely so it can be unit-tested
 * with fabricated state objects, without needing a live DB connection —
 * see tests/f13-calendar-normalization.test.ts.
 */
export function computeIngestionDecision(state: IngestionState | null, now: Date, force = false): { attempt: boolean; reason: string } {
  if (force) return { attempt: true, reason: "manual refresh requested" };
  const targetHourReached = etHourOf(now) >= TARGET_INGESTION_HOUR_ET;

  if (!state || state.lastStatus === "NEVER_RUN") {
    if (!targetHourReached) {
      return {
        attempt: false,
        reason: `never run yet — waiting for the target ingestion hour (${TARGET_INGESTION_HOUR_ET}:00 ET) so this week's early releases are more often already reflected`,
      };
    }
    return { attempt: true, reason: "never run" };
  }
  if (state.lastStatus === "SUCCESS") {
    const alreadyRanThisWeek = !!state.lastSuccessAt && isSameUtcWeek(state.lastSuccessAt, now);
    if (alreadyRanThisWeek) {
      return { attempt: false, reason: `already succeeded this UTC week (last success ${state.lastSuccessAt?.toISOString()})` };
    }
    if (!targetHourReached) {
      return {
        attempt: false,
        reason: `last success was in a previous UTC week — waiting for the target ingestion hour (${TARGET_INGESTION_HOUR_ET}:00 ET) before spending this week's single call`,
      };
    }
    return { attempt: true, reason: "last success was on a previous UTC day and the target ingestion hour has been reached" };
  }
  // FAILED — retry cooldown is a distinct concern from the target-hour gate
  // above (an error retry isn't about catching same-week releases, it's
  // about not hammering the feed after a failure), so it stays ungated.
  const lastAttemptMs = state.lastAttemptAt?.getTime() ?? 0;
  const withinCooldown = now.getTime() - lastAttemptMs < FAILURE_RETRY_COOLDOWN_MS;
  return withinCooldown
    ? { attempt: false, reason: `last attempt failed recently (${state.lastError ?? "unknown error"}) — cooling down` }
    : { attempt: true, reason: "last attempt failed and the retry cooldown has elapsed" };
}

/**
 * The persisted, cross-restart weekly guard. Exported so tests and the
 * status surface can inspect the decision without duplicating its logic.
 */
export async function shouldAttemptCalendarIngestion(now: Date = new Date()): Promise<{ attempt: boolean; reason: string }> {
  const state = await getState(F13_INGESTION_JOB_KEY);
  return computeIngestionDecision(state, now);
}

/** Forecast/Previous are always strings in this feed, possibly empty — normalized to a trimmed string or null for macro_events' VARCHAR columns. */
function toStoredValue(value: string | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/** A stable-enough external key for audit/debugging (NOT the DB uniqueness boundary — see macroEvents.ts's doc comment on why (normalized_event_type, scheduled_at_utc, currency) is used instead). */
function buildExternalKey(raw: ForexFactoryRawEvent): string {
  return `${raw.country}|${raw.title}|${raw.date}`.slice(0, 255);
}

async function normalizeAndUpsertAll(
  events: readonly ForexFactoryRawEvent[]
): Promise<{ upserted: number; skippedLowImpact: number; skippedWrongCurrency: number; skippedUnparseableDate: number }> {
  let upserted = 0;
  let skippedLowImpact = 0;
  let skippedWrongCurrency = 0;
  let skippedUnparseableDate = 0;

  for (const raw of events) {
    if (raw.country !== KEPT_CURRENCY) {
      skippedWrongCurrency++;
      continue;
    }
    if (!KEPT_IMPACTS.has(raw.impact)) {
      skippedLowImpact++;
      continue;
    }

    // The feed's `date` is already a proper ISO-8601 string with a real UTC
    // offset applied — unlike JBlanked's ambiguous local-time format, no
    // custom timezone conversion is needed here.
    const scheduledAtUtc = new Date(raw.date);
    if (Number.isNaN(scheduledAtUtc.getTime())) {
      console.error(`[f13-calendar-ingestion] skipping event "${raw.title}" — unparseable date "${raw.date}"`);
      skippedUnparseableDate++;
      continue;
    }

    try {
      // eslint-disable-next-line no-await-in-loop -- sequential is fine: at most a few dozen rows, once/week.
      await upsertMacroEvent({
        source: "forexfactory",
        externalKey: buildExternalKey(raw),
        name: raw.title,
        normalizedEventType: normalizeEventType(raw.title),
        scheduledAtUtc,
        originalTimezone: "FOREXFACTORY_FEED_UTC_OFFSET",
        currency: raw.country,
        impact: raw.impact,
        previousValue: toStoredValue(raw.previous),
        forecastValue: toStoredValue(raw.forecast),
        // This feed carries no "actual" (released) value at all — always
        // null, never fabricated. See providers/forexFactory.ts's header.
        actualValue: null,
        scheduleSource: "FOREXFACTORY",
        forecastSource: "FOREXFACTORY",
        actualSource: null,
      });
      upserted++;
    } catch (err) {
      console.error(`[f13-calendar-ingestion] failed to upsert "${raw.title}" (${raw.date}):`, err instanceof Error ? err.message : err);
    }
  }

  return { upserted, skippedLowImpact, skippedWrongCurrency, skippedUnparseableDate };
}

export interface F13IngestionResult {
  /** False when the weekly/cooldown guard skipped this call without touching the network — the normal case for every request after the week's first. */
  ran: boolean;
  upserted: number;
  reason: string;
}

// Single-flight guard: if two requests race in the same Node process before
// `ingestion_state` reflects the first one's attempt, only ONE actually
// calls the network — the second awaits the first's in-flight promise
// instead of starting a duplicate real call. `ingestion_state` itself is the
// cross-process/cross-restart guard (see shouldAttemptCalendarIngestion);
// this is a same-process belt-and-suspenders addition.
let inFlight: Promise<F13IngestionResult> | null = null;

/**
 * Runs the guarded Forex Factory ingestion IF one is due (see
 * `shouldAttemptCalendarIngestion`); otherwise returns immediately with
 * `ran: false` and no network call. Safe to call on every
 * `/api/market/snapshot` / `/api/calendar/*` request — see
 * apps/backend/src/real/f13Calendar.ts, which does exactly that.
 *
 * `deps.fetchRaw` is an injectable override (defaults to the real
 * `fetchForexFactoryThisWeek`) used by tests so they never make a live call.
 */
export async function runF13CalendarIngestion(
  deps: {
    fetchRaw?: () => Promise<ForexFactoryRawEvent[]>;
    now?: Date;
    force?: boolean;
  } = {}
): Promise<F13IngestionResult> {
  if (inFlight) return inFlight;

  const task = (async (): Promise<F13IngestionResult> => {
    const now = deps.now ?? new Date();
    const decision = deps.force
      ? computeIngestionDecision(null, now, true)
      : await shouldAttemptCalendarIngestion(now);
    if (!decision.attempt) {
      return { ran: false, upserted: 0, reason: decision.reason };
    }

    const fetchRaw = deps.fetchRaw ?? fetchForexFactoryThisWeek;

    await recordAttempt(F13_INGESTION_JOB_KEY);
    try {
      const raw = await fetchRaw();
      const { upserted, skippedLowImpact, skippedWrongCurrency, skippedUnparseableDate } = await normalizeAndUpsertAll(raw);
      const expectedNextAt = new Date(now.getTime() + 7 * 24 * 60 * 60_000);
      await recordSuccess(F13_INGESTION_JOB_KEY, expectedNextAt);
      return {
        ran: true,
        upserted,
        reason: `ingested ${upserted} event(s) this week (${skippedLowImpact} low-impact skipped, ${skippedWrongCurrency} non-USD skipped, ${skippedUnparseableDate} unparseable dates skipped)`,
      };
    } catch (err) {
      const safeMessage =
        err instanceof ForexFactoryApiError
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
