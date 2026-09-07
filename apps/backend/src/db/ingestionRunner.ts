import { recordAttempt, recordFailure, recordSuccess } from "./ingestionState";

// Generic ingestion/scheduling helper — the shared wrapper every family's
// real ingestion job (once migrated onto MySQL in a later phase) is expected
// to use around its own fetch. Deliberately does NOT itself schedule/poll
// anything (no setInterval/cron) — matches this codebase's existing
// lazy-refresh-on-request style (see apps/backend/src/real/cache.ts's
// top-of-file comment) rather than introducing a background poller this
// foundation phase was not asked to build.

/** Reduces any thrown value to a short, single-line, safe-to-store summary — never a full stack trace, matching ingestion_state.last_error's contract. */
function toSafeErrorMessage(err: unknown): string {
  const message = err instanceof Error ? err.message : String(err);
  return message.split("\n")[0].slice(0, 300);
}

/**
 * Records an attempt, runs `fetcher`, then records success or failure
 * against `ingestion_state`. Rethrows on failure (after recording it) so
 * callers keep their existing try/catch-driven UNAVAILABLE handling
 * unchanged — this wrapper only adds persistence-layer bookkeeping around
 * the same fetch a caller would otherwise run directly.
 */
export async function runTrackedIngestion<T>(jobKey: string, fetcher: () => Promise<T>, expectedNextAt?: Date | null): Promise<T> {
  await recordAttempt(jobKey);
  try {
    const result = await fetcher();
    await recordSuccess(jobKey, expectedNextAt ?? null);
    return result;
  } catch (err) {
    await recordFailure(jobKey, toSafeErrorMessage(err));
    throw err;
  }
}
