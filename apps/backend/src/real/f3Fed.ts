import type { EventItem, FedRateDistribution, UnavailableReason } from "@gold-terminal/contracts";
import { UNAVAILABLE_SOURCE } from "@gold-terminal/contracts";
import { fetchEffrRate } from "../providers/nyFed";
import { fetchLatestObservations, FredApiError } from "../providers/fred";
import { fetchInvestingFedRateMonitor } from "../providers/investingFedRateMonitor";
import { fetchPolymarketFedDecision } from "../providers/polymarketFedDecision";
import { getState, recordAttempt, recordFailure, recordSuccess } from "../db/ingestionState";
import { getEventsInRange } from "../db/macroEvents";
import { insertObservationIfChanged, type KpiObservationInput } from "../db/kpiObservations";
import { rememberLatestValueFromObservation } from "../db/kpiLatestValues";
import { cached, invalidateCacheKeys } from "./cache";
import { loadPersistedFedRateDistribution, persistFedRateDistribution } from "./fedRateDistributionStore";
import { unavailableOverride, type FamilyOverrideResult, type KpiOverride } from "./types";

// F3 Fed / Rate Pricing.
//
// f3-target-lower / f3-target-upper are real, unchanged: NY Fed's
// unsecured-rates EFFR entry's targetRateFrom/targetRateTo.
//
// ------------------------------------------------------------------------
// Meeting-probability distribution — REMOVED homemade calculation,
// REPLACED with a real third-party source.
//
// The former f3-dist-hold / f3-dist-25bp / f3-dist-50bp KPIs computed an
// implied meeting-rate distribution from CME ZQ futures settlements +
// NY Fed EFFR (see the now-deleted providers/cmeFedwatch.ts and
// real/fedwatchCalc.ts). That homemade "unblend the monthly average"
// calculation had a CONFIRMED BUG producing wrong probabilities (e.g.
// showing 48% when wrong) — this is a final product-owner decision, not
// up for revisiting: no more homemade FedWatch-equivalent math, ever.
//
// CME's own free FedWatch page explicitly prohibits automated/scripted
// access in its own Terms of Use — ruled out entirely, not used, not
// paid for either.
//
// The replacement is investing.com's public "Fed Rate Monitor" tool
// (apps/backend/src/providers/investingFedRateMonitor.ts) — a THIRD PARTY
// DISPLAYING CME-futures-derived numbers, read via a real headless
// browser (Cloudflare blocks plain HTTP fetches; confirmed live). This is
// an honest copy of what the page itself shows, not a recomputation:
// `sourceTag` is always "INVESTING_FED_RATE_MONITOR", never a
// CME-attributed tag.
//
// The KPI model's old fixed Hold/-25bp/-50bp three-bucket scheme could not
// represent a real source's arbitrary bucket count, so this is no longer
// modeled as individual CanonicalKpi ids at all — see `FedRateDistribution`
// in @gold-terminal/contracts (an N-bucket structured list attached to
// F3's family snapshot, the same "family-level structured extra" pattern
// already used by `nextEvents`/`activeCatalyst`).
//
// f3-repricing and f3-path-6m stay UNAVAILABLE (NO_SOURCE), unrelated to
// the removal above — deliberately, not from a fetch failure: neither was
// ever computed from the homemade CME calculation to begin with (see the
// prior milestone's notes, preserved in git history), and no free source
// for either was found this pass either.
const TTL_MS = 60 * 60_000; // 1h — daily-cadence source (target range, EFFR)
// FRED, not NY Fed — bug found live 2026-09-17, right after a real FOMC
// decision (hike, 2026-09-16, effective 2026-09-17): NY Fed's
// rates/unsecured/all/latest.json targetRateFrom/targetRateTo is derived
// from the EFFR print, which needs a FULL DAY of actual overnight trading
// under the new range before it's published — so on the very day a new
// range takes effect, NY Fed's "latest" still showed the OLD 3.50-3.75
// range (Sept 16's print, published the morning of the 17th but describing
// the 16th, before the hike took effect). FRED's DFEDTARL/DFEDTARU are the
// Fed's own DIRECTLY ANNOUNCED target range (not trading-derived) and
// already carried 2026-09-17 = 3.75/4.00 the same day — confirmed live via
// a direct curl to FRED during that session. `fetchEffrRate` below
// (NY-Fed-sourced) is intentionally untouched: f8-effr-iorb genuinely wants
// the traded EFFR print itself, where that same day-behind cadence is
// correct, not a bug.
const TARGET_RANGE_SOURCE_TAG = "FRED";
const FRED_TARGET_LOWER_SERIES = "DFEDTARL";
const FRED_TARGET_UPPER_SERIES = "DFEDTARU";

const ALWAYS_UNAVAILABLE_KPI_IDS = ["f3-path-6m", "f3-repricing"];

async function fetchCurrentRateFallback(): Promise<number | null> {
  const { value: effr } = await cached("nyFed:effr", TTL_MS, fetchEffrRate);
  return effr?.rate ?? null;
}

interface FredTargetRange {
  lower: number;
  upper: number;
  effectiveDateIso: string;
}

/** Fetches both legs of the FOMC target range from FRED. Effective date defensively takes the more recent of the two legs' own dates, in case FRED ever publishes a revision to one leg a beat before the other. */
async function fetchTargetRangeFromFred(): Promise<FredTargetRange | null> {
  const [lowerObs, upperObs] = await Promise.all([
    fetchLatestObservations(FRED_TARGET_LOWER_SERIES, 1),
    fetchLatestObservations(FRED_TARGET_UPPER_SERIES, 1),
  ]);
  const lower = lowerObs[0];
  const upper = upperObs[0];
  if (!lower || !upper) return null;
  const effectiveDateIso = new Date(lower.date >= upper.date ? lower.date : upper.date).toISOString();
  return { lower: lower.value, upper: upper.value, effectiveDateIso };
}

/**
 * Overnight session 2026-09-16: f3-target-lower/upper never called any
 * persistence function before (docs/PREVIOUS_VALUE_PERSISTENCE_NEXT_STEPS.md
 * §3.3 explicitly names this file as one of the 3 not-yet-wired additions).
 * Best-effort, mirrors every other family's `persistObservation` — a DB
 * hiccup (including DB simply not being configured) must never affect a
 * successful NY Fed fetch.
 */
async function persistTargetRangeObservation(input: KpiObservationInput): Promise<void> {
  try {
    await insertObservationIfChanged(input);
  } catch (err) {
    console.error(`[real-data] F3 failed to persist kpi_observations row for ${input.kpiId}:`, err instanceof Error ? err.message : err);
  }
  try {
    await rememberLatestValueFromObservation(input);
  } catch (err) {
    console.error(`[real-data] F3 failed to persist kpi_latest_values row for ${input.kpiId}:`, err instanceof Error ? err.message : err);
  }
}

export async function buildF3Overrides(): Promise<FamilyOverrideResult> {
  const nowIso = new Date().toISOString();
  const kpiOverrides: Record<string, KpiOverride> = {};
  for (const id of ALWAYS_UNAVAILABLE_KPI_IDS) kpiOverrides[id] = unavailableOverride(nowIso, "NO_SOURCE");

  try {
    const { value: target, fetchedAtMs } = await cached("fred:targetRange", TTL_MS, fetchTargetRangeFromFred);
    if (!target) throw new Error("FRED response missing a usable DFEDTARL/DFEDTARU observation");

    const retrievedAtIso = new Date(fetchedAtMs).toISOString();
    kpiOverrides["f3-target-lower"] = {
      value: target.lower,
      sourceTag: TARGET_RANGE_SOURCE_TAG,
      dataState: "REAL",
      observationAtIso: target.effectiveDateIso,
      retrievedAtIso,
    };
    kpiOverrides["f3-target-upper"] = {
      value: target.upper,
      sourceTag: TARGET_RANGE_SOURCE_TAG,
      dataState: "REAL",
      observationAtIso: target.effectiveDateIso,
      retrievedAtIso,
    };

    const targetObservationAt = new Date(target.effectiveDateIso);
    const targetRetrievedAt = new Date(retrievedAtIso);
    await persistTargetRangeObservation({
      kpiId: "f3-target-lower",
      observationAt: targetObservationAt,
      retrievedAt: targetRetrievedAt,
      numericValue: target.lower,
      sourceTag: TARGET_RANGE_SOURCE_TAG,
      provenance: "observed",
    });
    await persistTargetRangeObservation({
      kpiId: "f3-target-upper",
      observationAt: targetObservationAt,
      retrievedAt: targetRetrievedAt,
      numericValue: target.upper,
      sourceTag: TARGET_RANGE_SOURCE_TAG,
      provenance: "observed",
    });
  } catch (err) {
    const detail = err instanceof FredApiError ? `[${err.code}] ${err.message}` : err instanceof Error ? err.message : err;
    console.error("[real-data] F3 (FRED target range) fetch failed:", detail);
    kpiOverrides["f3-target-lower"] = unavailableOverride(nowIso);
    kpiOverrides["f3-target-upper"] = unavailableOverride(nowIso);
  }

  const fedRateDistribution = await buildFedRateDistribution();

  // F2/F8-source-decisions-pass-style fix: F3's family-level `nextEvents`
  // (the generic cockpit EventItem, distinct from `fedRateDistribution`
  // itself) was previously never overridden here at all, so it silently
  // fell through to mock/events.ts's fixture — a fake `Date.now()+21d`
  // "Next FOMC Decision" placeholder — even on a fully REAL F3 family that
  // already computes a genuine next-meeting date above. Build the real
  // event from `fedRateDistribution.nextMeetingAt` when known; `[]` (never
  // the mock placeholder) when it genuinely isn't, matching the F4/F5/F9
  // "no fabricated date" convention.
  const nextEvents: EventItem[] = fedRateDistribution.nextMeetingAt
    ? [{ id: "f3-ev-fomc", title: "Next FOMC Decision", scheduledAt: fedRateDistribution.nextMeetingAt }]
    : [];

  return { kpiOverrides, fedRateDistribution, nextEvents };
}

// ---------------------------------------------------------------------------
// Investing.com Fed Rate Monitor — cadence-gated, restart-safe orchestration.
// ---------------------------------------------------------------------------

const FED_RATE_MONITOR_JOB_KEY = "investing:fed-rate-monitor";
const FED_RATE_MONITOR_SOURCE_TAG = "INVESTING_FED_RATE_MONITOR";
// Free, no-auth fallback (see providers/polymarketFedDecision.ts's file
// header) — only used when Investing.com's scrape itself fails this
// attempt. Never persisted into fedRateDistributionStore's reuse cache
// (that cache has no per-entry source tag of its own — reusePersistedDistribution
// always relabels it FED_RATE_MONITOR_SOURCE_TAG — so mixing a Polymarket
// reading into it would silently mislabel it as Investing.com later).
const POLYMARKET_SOURCE_TAG = "POLYMARKET_FED_DECISION";

// Tightened twice the same day (2026-09-16) per explicit product-owner
// request: 5h -> 3h -> 1h. On a real FOMC decision day, 3h left a multi-hour
// window where the displayed odds/target could lag a real market move (the
// page rolling over to the next meeting right after a decision, etc.) —
// checking hourly bounds that gap much tighter. This is still a plain
// interval, not a London/NY-market-hours guard — this app's fetch model
// stays request-triggered/lazy (see real/cache.ts's header), so nothing
// actually refetches unless a real page load/auto-poll lands after the
// interval has elapsed.
const FED_RATE_MONITOR_CADENCE_MS = 60 * 60_000;

// Cooldown after an attempt whose outcome was never confirmed as a SUCCESS
// — covers both a genuine scrape failure AND a process restart/crash that
// abandoned an in-flight scrape before it could record anything (bug found
// live 2026-09-16: `npm run dev` restarted mid-scrape left `ingestion_state`
// with a fresh `last_attempt_at` but a stale `last_status`/`last_success_at`
// from the PRIOR run — `recentlyAttempted` then held for the full cadence
// window even though nothing was actually in flight, and the persisted
// fallback was already too old to reuse, so F3 stayed UNAVAILABLE for
// hours no matter how many times the page was reloaded). Short and
// separate from the success cadence, mirroring jobs/f13CalendarIngestion.ts's
// `FAILURE_RETRY_COOLDOWN_MS` / jobs/goldOvernightAutoRecap.ts's own
// failure cooldown — both already make this same distinction.
const RETRY_COOLDOWN_MS = 30 * 60_000;

// If a previously-persisted distribution is older than this, it is no
// longer honestly reusable as "the current cadence window's reading" (this
// would only happen after several consecutive fetch failures) — served as
// UNAVAILABLE instead of quietly going stale-forever.
const PERSISTED_STALE_AFTER_MS = FED_RATE_MONITOR_CADENCE_MS * 3;

// Convention landed by the sibling F13 real-calendar task (see
// apps/backend/src/real/f13EventTypes.ts's `NormalizedEventType`). Read
// here as a plain string literal (not an imported type) deliberately, to
// avoid coupling this module to that in-flight sibling module's internals
// — this is a read-only, best-effort lookup over already-ingested data,
// never a dependency on F13's fetch/ingestion code path.
const FOMC_NORMALIZED_EVENT_TYPE = "FOMC_RATE_DECISION";

function buildUnavailableDistribution(reason: UnavailableReason): FedRateDistribution {
  const nowIso = new Date().toISOString();
  return {
    buckets: [],
    nextMeetingAt: null,
    dataState: "UNAVAILABLE",
    unavailableReason: reason,
    sourceTag: UNAVAILABLE_SOURCE,
    observationAt: nowIso,
    retrievedAt: nowIso,
  };
}

/**
 * Real F13 calendar lookup for the next FOMC Rate Decision, per the
 * milestone brief: "do not duplicate JBlanked-fetching logic yourself, do
 * not make your own JBlanked API call." Reads the sibling F13 task's
 * already-ingested `macro_events` rows via its own `getEventsInRange` read
 * surface. Returns `null` (never throws) when the table has no matching
 * row yet — expected while the sibling task is still in flight, or simply
 * because no FOMC meeting falls within the queried window — so the caller
 * can fall back to the Fed Rate Monitor page's own displayed meeting date.
 */
async function getNextFomcMeetingFromCalendar(): Promise<string | null> {
  try {
    const now = new Date();
    // ~13 months out comfortably covers "the next meeting" under any
    // realistic FOMC cadence (8 meetings/year) without querying an
    // unbounded range.
    const horizon = new Date(now.getTime() + 400 * 24 * 60 * 60_000);
    const events = await getEventsInRange(now, horizon, { currency: "USD" });
    const nextFomc = events.find((event) => event.normalizedEventType === FOMC_NORMALIZED_EVENT_TYPE);
    return nextFomc ? nextFomc.scheduledAtUtc.toISOString() : null;
  } catch (err) {
    console.error("[real-data] F3 next-FOMC calendar lookup failed:", err instanceof Error ? err.message : err);
    return null;
  }
}

async function getIngestionStateSafe(jobKey: string) {
  try {
    return await getState(jobKey);
  } catch (err) {
    console.error("[real-data] F3 (Investing.com Fed Rate Monitor) ingestion-state read failed:", err instanceof Error ? err.message : err);
    return null;
  }
}

async function recordAttemptSafe(jobKey: string): Promise<void> {
  try {
    await recordAttempt(jobKey);
  } catch (err) {
    console.error("[real-data] F3 (Investing.com Fed Rate Monitor) could not record ingestion attempt:", err instanceof Error ? err.message : err);
  }
}

async function recordSuccessSafe(jobKey: string, expectedNextAt: Date): Promise<void> {
  try {
    await recordSuccess(jobKey, expectedNextAt);
  } catch (err) {
    console.error("[real-data] F3 (Investing.com Fed Rate Monitor) could not record ingestion success:", err instanceof Error ? err.message : err);
  }
}

async function recordFailureSafe(jobKey: string, safeMessage: string): Promise<void> {
  try {
    await recordFailure(jobKey, safeMessage);
  } catch (err) {
    console.error("[real-data] F3 (Investing.com Fed Rate Monitor) could not record ingestion failure:", err instanceof Error ? err.message : err);
  }
}

/**
 * Reuses the last persisted successful fetch, honestly labeled with ITS
 * own observation/retrieval timestamps (never "now") — used when
 * `ingestion_state` shows an attempt already happened within this
 * cadence's window (this process, or another instance/a prior process
 * life before a restart), so a browser is never launched more often than
 * the cadence allows. `null` if nothing usable is persisted, or what is
 * persisted is old enough to no longer honestly represent "this cadence
 * window's reading" (see `PERSISTED_STALE_AFTER_MS`).
 */
async function reusePersistedDistribution(): Promise<FedRateDistribution | null> {
  const persisted = await loadPersistedFedRateDistribution();
  if (!persisted) return null;

  const ageMs = Date.now() - new Date(persisted.retrievedAt).getTime();
  if (ageMs > PERSISTED_STALE_AFTER_MS) return null;

  const calendarMeetingAt = await getNextFomcMeetingFromCalendar();
  return {
    buckets: persisted.buckets.map((b) => ({ targetRangeLabel: b.targetRangeLabel, probability: b.probability })),
    nextMeetingAt: calendarMeetingAt ?? persisted.nextMeetingAt,
    dataState: "REAL",
    sourceTag: FED_RATE_MONITOR_SOURCE_TAG,
    observationAt: persisted.observationAt,
    retrievedAt: persisted.retrievedAt,
  };
}

/** Launches the headless-browser scrape, persists on success, and honestly reports UNAVAILABLE (never a fallback to the deleted homemade calc, never a stale cache) on any failure. */
async function runFreshFetch(): Promise<FedRateDistribution> {
  await recordAttemptSafe(FED_RATE_MONITOR_JOB_KEY);

  try {
    const scraped = await fetchInvestingFedRateMonitor();
    if (!scraped || scraped.buckets.length === 0) {
      throw new Error("Investing.com Fed Rate Monitor scrape returned no usable buckets");
    }

    const calendarMeetingAt = await getNextFomcMeetingFromCalendar();
    const nowIso = new Date().toISOString();
    const distribution: FedRateDistribution = {
      buckets: scraped.buckets.map((b) => ({
        targetRangeLabel: b.targetRangeLabel,
        probability: b.currentProbabilityPct,
        probabilityPreviousDay: b.previousDayProbabilityPct,
        probabilityPreviousWeek: b.previousWeekProbabilityPct,
      })),
      nextMeetingAt: calendarMeetingAt ?? scraped.nextMeetingDateIso,
      dataState: "REAL",
      sourceTag: FED_RATE_MONITOR_SOURCE_TAG,
      observationAt: scraped.pageUpdatedAtIso ?? scraped.scrapedAtIso,
      retrievedAt: nowIso,
    };

    await recordSuccessSafe(FED_RATE_MONITOR_JOB_KEY, new Date(Date.now() + FED_RATE_MONITOR_CADENCE_MS));
    await persistFedRateDistribution(distribution);
    return distribution;
  } catch (err) {
    const safeMessage = err instanceof Error ? err.message : String(err);
    console.error("[real-data] F3 (Investing.com Fed Rate Monitor) fetch failed:", safeMessage);
    // Investing.com's own ingestion_state still records this attempt as
    // FAILED (not the fallback's success) — this keeps the SHORT retry
    // cooldown active so the primary source is retried again soon, rather
    // than waiting the full hourly cadence, while the fallback below still
    // gets a real reading to the user in the meantime.
    await recordFailureSafe(FED_RATE_MONITOR_JOB_KEY, safeMessage);
    const fallback = await tryPolymarketFallback();
    return fallback ?? buildUnavailableDistribution("FETCH_FAILED");
  }
}

/** Best-effort fallback when Investing.com's scrape itself failed this attempt — never persisted into fedRateDistributionStore's reuse cache (see POLYMARKET_SOURCE_TAG's doc comment). Returns `null` (never throws) if Polymarket also has nothing usable, so the caller falls through to UNAVAILABLE honestly rather than fabricating anything. */
async function tryPolymarketFallback(): Promise<FedRateDistribution | null> {
  const polymarket = await fetchPolymarketFedDecision();
  if (!polymarket || polymarket.buckets.length === 0) return null;

  const calendarMeetingAt = await getNextFomcMeetingFromCalendar();
  const nowIso = new Date().toISOString();
  return {
    buckets: polymarket.buckets.map((b) => ({
      targetRangeLabel: b.label,
      probability: b.probabilityPct,
    })),
    nextMeetingAt: calendarMeetingAt ?? polymarket.meetingEndDateIso,
    dataState: "REAL",
    sourceTag: POLYMARKET_SOURCE_TAG,
    observationAt: nowIso,
    retrievedAt: nowIso,
  };
}

/**
 * Cadence-gated resolution: checks `ingestion_state.last_attempt_at`
 * BEFORE deciding whether to launch a new browser instance — this is the
 * restart-safety the milestone brief requires (an in-memory-only interval
 * would reset on every process restart and could launch a browser far
 * more often than intended across restarts).
 */
/**
 * Pure (no I/O) — which cooldown applies before a fresh attempt is
 * permitted. `lastAttemptAt` newer than `lastSuccessAt` means the most
 * recent attempt's outcome was NOT a confirmed success (an explicit
 * failure only updates `lastAttemptAt`/`lastStatus`, never `lastSuccessAt`
 * — and an attempt abandoned by a process crash/restart only ever updates
 * `lastAttemptAt`, via `recordAttempt`, before anything else runs) — in
 * either case, wait only `RETRY_COOLDOWN_MS`, not the full multi-hour
 * `FED_RATE_MONITOR_CADENCE_MS`. Exported for unit testing without a DB —
 * see tests/f3-fed-rate-monitor.test.ts.
 */
export function shouldReuseWithoutFetching(lastAttemptAt: Date | null, lastSuccessAt: Date | null, now: Date): boolean {
  if (!lastAttemptAt) return false;
  const attemptUnconfirmed = lastAttemptAt.getTime() > (lastSuccessAt?.getTime() ?? 0);
  const cooldownMs = attemptUnconfirmed ? RETRY_COOLDOWN_MS : FED_RATE_MONITOR_CADENCE_MS;
  return now.getTime() - lastAttemptAt.getTime() < cooldownMs;
}

async function resolveFedRateDistribution(): Promise<FedRateDistribution> {
  const state = await getIngestionStateSafe(FED_RATE_MONITOR_JOB_KEY);
  const recentlyAttempted = shouldReuseWithoutFetching(state?.lastAttemptAt ?? null, state?.lastSuccessAt ?? null, new Date());

  if (recentlyAttempted) {
    const reused = await reusePersistedDistribution();
    return reused ?? buildUnavailableDistribution("FETCH_FAILED");
  }

  return runFreshFetch();
}

const FED_RATE_MONITOR_CACHE_KEY = "f3:investingFedRateMonitor";

async function buildFedRateDistribution(): Promise<FedRateDistribution> {
  try {
    // In-process TTL cache on top of the DB-backed cadence gate: avoids a
    // MySQL round-trip on every single API request within the same
    // cadence window, while `resolveFedRateDistribution` itself still
    // re-checks `ingestion_state` on every cache-expiry/process-restart
    // boundary — never relying on the in-memory cache alone for cadence
    // correctness.
    const { value } = await cached(FED_RATE_MONITOR_CACHE_KEY, FED_RATE_MONITOR_CADENCE_MS, resolveFedRateDistribution);
    // Bug found live 2026-09-17: real/cache.ts's cached() only skips
    // caching a null/undefined/NaN result (see its "Bug B" comment) — a
    // well-formed UNAVAILABLE FedRateDistribution isn't any of those, so a
    // single interrupted/failed attempt (e.g. this dev server restarting
    // mid-scrape) got frozen behind this cache's full hourly TTL, reading
    // UNAVAILABLE for up to an hour even though a retry moments later
    // would have succeeded. Invalidating here means the NEXT request
    // re-runs resolveFedRateDistribution(), whose OWN ingestion_state gate
    // already applies the correct short RETRY_COOLDOWN_MS for an
    // unconfirmed/failed attempt instead of the long success cadence.
    if (value.dataState !== "REAL") invalidateCacheKeys([FED_RATE_MONITOR_CACHE_KEY]);
    return value;
  } catch (err) {
    console.error("[real-data] F3 (Investing.com Fed Rate Monitor) unexpected failure:", err instanceof Error ? err.message : err);
    return buildUnavailableDistribution("FETCH_FAILED");
  }
}
