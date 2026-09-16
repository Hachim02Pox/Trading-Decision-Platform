import { getState, recordAttempt, recordFailure, recordSuccess, type IngestionState } from "../db/ingestionState";
import { hourInTimeZone, calendarDateInTimeZone } from "../lib/timeZoneHour";
import { runGoldOvernightAutoRecap } from "../intelligence/goldOvernightAnalysis";

// Auto-generates the Night Recap once a day, around a target local hour,
// without any per-user timezone configuration yet (single-user app today —
// see docs/AI_REPORTS_STATUS.md for the multi-timezone extension path).
// Mirrors jobs/f13CalendarIngestion.ts's guard shape exactly (same
// ingestion_state table, same DST-aware target-hour gate via
// lib/timeZoneHour.ts) but daily instead of weekly, and pinged HOURLY by
// .github/workflows/night-recap.yml rather than once — the target-hour gate
// below is what actually decides whether a given ping does real work, so a
// fixed UTC cron never drifts across the EDT/EST transition.
export const GOLD_OVERNIGHT_AUTO_JOB_KEY = "gold-overnight:auto-recap";

const TARGET_TIMEZONE = "America/New_York"; // Hachim's timezone (Quebec, Canada shares the ET clock). Europe/other timezones deliberately out of scope for now (2026-09-15 decision) — single-user app.
const TARGET_HOUR = 9;
const FAILURE_RETRY_COOLDOWN_MS = 60 * 60_000;

/**
 * Pure decision logic (no I/O) — once-a-day/target-hour/failure-cooldown
 * guard, mirroring f13CalendarIngestion.ts's `computeIngestionDecision`.
 * Separated for unit testing without a live DB — see
 * tests/gold-overnight-auto-recap.test.ts.
 */
export function computeAutoRecapDecision(state: IngestionState | null, now: Date, force = false): { attempt: boolean; reason: string } {
  if (force) return { attempt: true, reason: "manual refresh requested" };
  const targetHourReached = hourInTimeZone(now, TARGET_TIMEZONE) >= TARGET_HOUR;

  if (!state || state.lastStatus === "NEVER_RUN") {
    return targetHourReached
      ? { attempt: true, reason: "never run" }
      : { attempt: false, reason: `never run yet — waiting for the target hour (${TARGET_HOUR}:00 ${TARGET_TIMEZONE})` };
  }
  if (state.lastStatus === "SUCCESS") {
    const alreadyRanToday = !!state.lastSuccessAt && calendarDateInTimeZone(state.lastSuccessAt, TARGET_TIMEZONE) === calendarDateInTimeZone(now, TARGET_TIMEZONE);
    if (alreadyRanToday) return { attempt: false, reason: `already succeeded today (last success ${state.lastSuccessAt?.toISOString()})` };
    return targetHourReached
      ? { attempt: true, reason: "last success was on a previous local day and the target hour has been reached" }
      : { attempt: false, reason: `last success was on a previous local day — waiting for the target hour (${TARGET_HOUR}:00 ${TARGET_TIMEZONE})` };
  }
  // FAILED — retry cooldown, independent of the target-hour gate.
  const lastAttemptMs = state.lastAttemptAt?.getTime() ?? 0;
  const withinCooldown = now.getTime() - lastAttemptMs < FAILURE_RETRY_COOLDOWN_MS;
  return withinCooldown
    ? { attempt: false, reason: `last attempt failed recently (${state.lastError ?? "unknown error"}) — cooling down` }
    : { attempt: true, reason: "last attempt failed and the retry cooldown has elapsed" };
}

export interface GoldOvernightAutoRunSummary {
  ran: boolean;
  reason: string;
}

let inFlight: Promise<GoldOvernightAutoRunSummary> | null = null;

/** Runs the guarded auto-recap IF one is due; otherwise returns `ran: false` with no network call. Safe to ping on every cron tick. */
export async function runGuardedGoldOvernightAutoRecap(deps: { sessionId: string; now?: Date; force?: boolean }): Promise<GoldOvernightAutoRunSummary> {
  if (inFlight) return inFlight;

  const task = (async (): Promise<GoldOvernightAutoRunSummary> => {
    const now = deps.now ?? new Date();
    const decision = deps.force
      ? computeAutoRecapDecision(null, now, true)
      : computeAutoRecapDecision(await getState(GOLD_OVERNIGHT_AUTO_JOB_KEY), now);
    if (!decision.attempt) return { ran: false, reason: decision.reason };

    await recordAttempt(GOLD_OVERNIGHT_AUTO_JOB_KEY);
    try {
      const result = await runGoldOvernightAutoRecap({ sessionId: deps.sessionId });
      if (!result.ran) {
        // Not configured — not a failure to retry-cooldown, just nothing to do yet.
        return { ran: false, reason: result.reason };
      }
      const expectedNextAt = new Date(now.getTime() + 24 * 60 * 60_000);
      await recordSuccess(GOLD_OVERNIGHT_AUTO_JOB_KEY, expectedNextAt);
      return { ran: true, reason: result.reason };
    } catch (err) {
      const safeMessage = err instanceof Error ? err.message : String(err);
      await recordFailure(GOLD_OVERNIGHT_AUTO_JOB_KEY, safeMessage);
      return { ran: false, reason: `failed: ${safeMessage}` };
    }
  })();

  inFlight = task;
  try {
    return await task;
  } finally {
    inFlight = null;
  }
}
