import { PCE_TABLE_ID, PCE_PCT_CHANGE_TABLE_ID } from "../providers/bea";
import { invalidateCacheKeys } from "../real/cache";
import { getMarketSnapshot } from "../cache/snapshotCache";
import { getEventsInRange, type MacroEventRow } from "../db/macroEvents";
import { getState, recordAttempt, recordFailure, recordSuccess } from "../db/ingestionState";

// Pre-fetches F4 (CPI/PPI/PCE) and F5 (Employment Situation) right after
// their official BLS/BEA release, instead of waiting for the next lazy
// request after these families' multi-hour TTL (real/f4Inflation.ts,
// real/f5Employment.ts) to happen to land. Publication times verified live
// 2026-09-16 against bls.gov/schedule/news_release and bea.gov/news/schedule:
// CPI/PPI/Employment Situation (BLS) and PCE/GDP (BEA) all publish at
// 8:30 AM ET — but this job does NOT hardcode that time. It reads the exact
// `scheduled_at_utc` JBlanked already gave us for each real event instance
// (via F13's calendar ingestion, apps/backend/src/jobs/f13CalendarIngestion.ts
// -> macro_events), so it stays correct even if a specific release shifts
// (which happens a few times a year) without needing a code change.
//
// See docs/AUDIT_QUOTAS_APPELS_API.md and AI_REPORTS_STATUS.md for why this
// is scoped to ONLY the monthly/event-driven families: every other family
// already has a large quota margin under its existing lazy TTL (per the
// audit), so this targeted pre-fetch — not a full active-scheduler rewrite
// of every family — is the only piece worth the added complexity.
//
// GDP is intentionally NOT included: this codebase has no canonical GDP
// "actual" KPI wired at all (only GDPNow, a nowcast — see
// GUIDE_FONCTIONNEMENT_DONNEES.md §12, F9), so pre-fetching a GDP release
// would invalidate nothing anything reads.
const CACHE_KEYS_BY_EVENT_TYPE: Readonly<Record<string, readonly string[]>> = {
  CPI: ["bls:calc:f4-cpi-ppi"],
  CORE_CPI: ["bls:calc:f4-cpi-ppi"],
  PPI: ["bls:calc:f4-cpi-ppi"],
  CORE_PPI: ["bls:calc:f4-cpi-ppi"],
  PCE: [`bea:${PCE_TABLE_ID}`, `bea:${PCE_PCT_CHANGE_TABLE_ID}`],
  CORE_PCE: [`bea:${PCE_TABLE_ID}`, `bea:${PCE_PCT_CHANGE_TABLE_ID}`],
  NONFARM_PAYROLLS: ["bls:calc:f5-employment"],
  UNEMPLOYMENT_RATE: ["bls:calc:f5-employment"],
  AVERAGE_HOURLY_EARNINGS: ["bls:calc:f5-employment"],
};

// A release is considered "due" 2 minutes after its scheduled time — a
// small buffer for the source's own publication lag, not a guess at the
// publication time itself (that comes from `scheduled_at_utc`).
const DUE_BUFFER_MS = 2 * 60_000;
// How far back to look for a release we might have missed an hourly tick
// for (e.g. a brief backend outage) — generous, but per-event ingestion_state
// dedup below means re-scanning old events already prefetched is a cheap no-op.
const LOOKBACK_MS = 3 * 24 * 60 * 60_000;

export interface DueRelease {
  jobKey: string;
  normalizedEventType: string;
  scheduledAtUtc: Date;
  cacheKeys: readonly string[];
}

/** Pure — which of `events` are tracked release types whose due time has passed. Exported for unit testing without a DB. */
export function computeDueReleases(events: readonly Pick<MacroEventRow, "normalizedEventType" | "scheduledAtUtc">[], now: Date): DueRelease[] {
  const due: DueRelease[] = [];
  for (const event of events) {
    const cacheKeys = CACHE_KEYS_BY_EVENT_TYPE[event.normalizedEventType];
    if (!cacheKeys) continue;
    if (now.getTime() - event.scheduledAtUtc.getTime() < DUE_BUFFER_MS) continue;
    due.push({
      jobKey: `prefetch:${event.normalizedEventType}:${event.scheduledAtUtc.toISOString()}`,
      normalizedEventType: event.normalizedEventType,
      scheduledAtUtc: event.scheduledAtUtc,
      cacheKeys,
    });
  }
  return due;
}

export interface MonthlyReleasePrefetchSummary {
  checked: number;
  prefetched: string[]; // normalizedEventType values actually refreshed this run
  reason: string;
}

/**
 * Safe to ping on every cron tick (see .github/workflows/monthly-release-prefetch.yml):
 * each real release instance is deduped via `ingestion_state` (one row per
 * `(normalizedEventType, scheduledAtUtc)` pair — see `computeDueReleases`'s
 * `jobKey`), so re-checking an already-prefetched release is a cheap no-op,
 * never a duplicate fetch.
 */
export async function runMonthlyReleasePrefetch(now: Date = new Date()): Promise<MonthlyReleasePrefetchSummary> {
  const events = await getEventsInRange(new Date(now.getTime() - LOOKBACK_MS), now, { currency: "USD" });
  const due = computeDueReleases(events, now);
  const prefetched: string[] = [];

  for (const release of due) {
    // eslint-disable-next-line no-await-in-loop -- at most a handful of releases per run, sequential is clearer to reason about than Promise.all here.
    const state = await getState(release.jobKey);
    if (state?.lastStatus === "SUCCESS") continue; // already prefetched this exact release

    // eslint-disable-next-line no-await-in-loop -- see above.
    await recordAttempt(release.jobKey);
    try {
      invalidateCacheKeys(release.cacheKeys);
      // eslint-disable-next-line no-await-in-loop -- see above.
      await getMarketSnapshot();
      // eslint-disable-next-line no-await-in-loop -- see above.
      await recordSuccess(release.jobKey);
      prefetched.push(release.normalizedEventType);
    } catch (err) {
      const safeMessage = err instanceof Error ? err.message : String(err);
      // eslint-disable-next-line no-await-in-loop -- see above.
      await recordFailure(release.jobKey, safeMessage);
    }
  }

  return {
    checked: due.length,
    prefetched,
    reason: prefetched.length > 0 ? `prefetched ${prefetched.join(", ")}` : "no due, un-prefetched release found",
  };
}
