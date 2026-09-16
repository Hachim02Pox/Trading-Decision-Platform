import { fetchLatestObservations, FredApiError, type FredObservation } from "../providers/fred";
import { fetchLatestParYield, fetchLatestRealParYield, type ParYieldPoint, type RealParYieldPoint } from "../providers/treasury";
import { cached, type CachedResult } from "./cache";
import { loadAppConfig } from "../config/env";
import { insertObservationIfChanged, type KpiObservationInput } from "../db/kpiObservations";
import { rememberLatestValueFromObservation } from "../db/kpiLatestValues";
import { runTrackedIngestion } from "../db/ingestionRunner";
import { round, toObservationIso, unavailableOverride, type FamilyOverrideResult, type KpiOverride } from "./types";

// F2 Rates — source-decisions pass. Per this project's standing priority
// order (DIRECT OFFICIAL > DIRECT FREE RELIABLE > DETERMINISTIC DERIVED >
// PROXY > ESTIMATE), F2's two headline yields move OFF FRED and back onto
// the U.S. Treasury's own Daily Par Yield Curve — the direct official
// source — as their SOLE primary (no FRED fallback: per the no-cross-
// provider-fallback policy, a Treasury fetch failure makes these KPIs
// UNAVAILABLE, never silently re-sourced from FRED). The underlying CSV
// adapter (apps/backend/src/providers/treasury.ts's `fetchLatestParYield`)
// previously went orphaned when an earlier pass moved F2 onto FRED — this
// pass live-tested it fresh, confirmed it returns correct current 2Y/10Y
// values (cross-checked against FRED's DGS2/DGS10 the same day, landing
// within the expected small same-day/lag difference), and reinstates it.
//
// f2-10y-real: Treasury also publishes a Daily Par REAL Yield Curve
// (TIPS-derived) with a clean 10Y point. Live-tested this pass: the CSV is
// cleanly parseable (header uses all-caps "10 YR", unlike the nominal
// curve's "10 Yr" — confirmed from the live response, not assumed) and its
// 10Y value landed within ~0.02pp of FRED's DFII10 the same day. Per "direct
// official over direct free reliable," this becomes the new primary,
// replacing FRED DFII10 (no fallback between the two — one is primary, full
// stop).
//
// f2-be10: FRED publishes T10YIE directly as 10Y breakeven inflation.
// Live-tested this pass: current value ~2.31%, squarely in the normal
// 2-3% range, and the series is exactly the intended metric. Per "direct
// over derived when a good direct series exists," this replaces the prior
// `DGS10 - DFII10` computation — f2-be10 is now `provenance: "observed"`,
// not "derived".
//
// f2-5y5y (T5YIFR) — unchanged from the prior pass: direct FRED series,
// already correct.
//
// f2-2s10s — VERIFIED live this pass: FRED publishes the 2s10s spread
// directly as its own series (T10Y2Y, "10-Year Treasury Constant Maturity
// Minus 2-Year Treasury Constant Maturity"), confirmed returning values
// matching our own from-scratch (10Y-2Y) Treasury computation within
// ~1-3bps the same day (e.g. 0.40-0.43 vs our own ~40-41bps). Per "direct
// official/free-reliable over derived when a good direct series exists,"
// this replaces the prior `parYield.y10 - parYield.y2` computation —
// f2-2s10s is now `provenance: "observed"`, not "derived", and no longer
// depends on the Treasury par-yield fetch at all (no cross-provider
// fallback: a T10Y2Y fetch failure makes this KPI UNAVAILABLE on its own).
const TREASURY_TTL_MS = 15 * 60_000;
const FRED_TTL_MS = 15 * 60_000;
const SOURCE_TAG_TREASURY = "US_TREASURY";
const SOURCE_TAG_FRED = "FRED";

const FRED_SERIES = {
  // 5Y5Y forward inflation expectation — explicit product-owner addition
  // (not an invented KPI), the Fed's own preferred medium-term
  // inflation-expectations gauge. Unchanged this pass.
  T5YIFR: "T5YIFR",
  // 10Y breakeven inflation, direct — see this file's top-of-file comment.
  T10YIE: "T10YIE",
  // 2s10s spread, direct — see this file's top-of-file comment. FRED
  // reports this in percentage points (e.g. 0.43 == 43bps); this KPI's
  // fixture convention is bps, hence the ×100 in buildF2Overrides below
  // (same convention as F7's HY/IG OAS bps conversion).
  T10Y2Y: "T10Y2Y",
} as const;

function logFredFailure(seriesId: string, err: unknown): void {
  const detail =
    err instanceof FredApiError ? `[${err.code}] ${err.message}` : err instanceof Error ? err.message : String(err);
  console.error(`[real-data] F2 (FRED) fetch failed for series ${seriesId}: ${detail}`);
}

// ---------------------------------------------------------------------------
// MySQL persistence / ingestion tracking. Runs ONLY inside a fetcher passed
// to `cached()` — i.e. only on a genuine cache-miss real fetch, never on
// every HTTP request that happens to hit a warm cache entry. This is also
// where the retrievedAt-bug fix lives: `cached()` already returns the ACTUAL
// fetch timestamp (`fetchedAtMs`) rather than "now" — every KpiOverride
// below is built from that value, not from `Date.now()` at request-serve
// time, so `retrievedAt` only changes when a real fetch actually happened.
// ---------------------------------------------------------------------------

function isDbConfigured(): boolean {
  return loadAppConfig().db !== null;
}

/** Persists one observation, swallowing (and logging) any DB error — persistence is best-effort bookkeeping and must never turn a successful provider fetch into a failed one. */
async function persistObservation(input: KpiObservationInput): Promise<void> {
  if (!isDbConfigured()) return;
  try {
    await insertObservationIfChanged(input);
  } catch (err) {
    console.error(`[real-data] F2 failed to persist kpi_observations row for ${input.kpiId}:`, err instanceof Error ? err.message : err);
  }
  try {
    await rememberLatestValueFromObservation(input);
  } catch (err) {
    console.error(`[real-data] F2 failed to persist kpi_latest_values row for ${input.kpiId}:`, err instanceof Error ? err.message : err);
  }
}

/** Wraps a fetcher with ingestion_state attempt/success/failure tracking — skipped gracefully when DB isn't configured, so persistence is purely additive and never blocks a real-data fetch. */
async function trackedFetch<T>(jobKey: string, fetcher: () => Promise<T>): Promise<T> {
  if (!isDbConfigured()) return fetcher();
  return runTrackedIngestion(jobKey, fetcher);
}

async function fetchTreasuryParYieldTracked(): Promise<ParYieldPoint | null> {
  return trackedFetch("treasury:par-yield", async () => {
    const point = await fetchLatestParYield();
    if (point) {
      const observationAt = new Date(point.dateIso);
      const retrievedAt = new Date();
      await persistObservation({
        kpiId: "f2-2y",
        observationAt,
        retrievedAt,
        numericValue: round(point.y2, 3),
        sourceTag: SOURCE_TAG_TREASURY,
        provenance: "observed",
      });
      await persistObservation({
        kpiId: "f2-10y",
        observationAt,
        retrievedAt,
        numericValue: round(point.y10, 3),
        sourceTag: SOURCE_TAG_TREASURY,
        provenance: "observed",
      });
    }
    return point;
  });
}

async function fetchTreasuryRealParYieldTracked(): Promise<RealParYieldPoint | null> {
  return trackedFetch("treasury:par-yield-real", async () => {
    const point = await fetchLatestRealParYield();
    if (point) {
      await persistObservation({
        kpiId: "f2-10y-real",
        observationAt: new Date(point.dateIso),
        retrievedAt: new Date(),
        numericValue: round(point.y10, 3),
        sourceTag: SOURCE_TAG_TREASURY,
        provenance: "observed",
      });
    }
    return point;
  });
}

/** T10Y2Y is fetched/persisted separately from the generic FRED helper below because its stored/displayed value needs the raw percentage-point reading ×100 (bps) — the generic helper persists `round(value, decimals)` verbatim, which would silently persist the wrong unit for this one KPI. */
async function fetchT10Y2YTracked(): Promise<FredObservation[] | null> {
  return trackedFetch(`fred:${FRED_SERIES.T10Y2Y.toLowerCase()}`, async () => {
    try {
      const observations = await fetchLatestObservations(FRED_SERIES.T10Y2Y, 3);
      const latest = observations[0];
      if (latest) {
        await persistObservation({
          kpiId: "f2-2s10s",
          observationAt: new Date(toObservationIso(latest.date)),
          retrievedAt: new Date(),
          numericValue: round(latest.value * 100, 0),
          sourceTag: SOURCE_TAG_FRED,
          provenance: "observed",
        });
      }
      return observations.length > 0 ? observations : null;
    } catch (err) {
      logFredFailure(FRED_SERIES.T10Y2Y, err);
      return null;
    }
  });
}

async function cachedT10Y2Y(): Promise<CachedResult<FredObservation[] | null>> {
  return safeCached(cached(`fred:${FRED_SERIES.T10Y2Y}`, FRED_TTL_MS, fetchT10Y2YTracked), `fred:${FRED_SERIES.T10Y2Y}`);
}

async function fetchFredSeriesTracked(seriesId: string, kpiId: string, decimals: number): Promise<FredObservation[] | null> {
  return trackedFetch(`fred:${seriesId.toLowerCase()}`, async () => {
    try {
      const observations = await fetchLatestObservations(seriesId, 3);
      const latest = observations[0];
      if (latest) {
        await persistObservation({
          kpiId,
          observationAt: new Date(toObservationIso(latest.date)),
          retrievedAt: new Date(),
          numericValue: round(latest.value, decimals),
          sourceTag: SOURCE_TAG_FRED,
          provenance: "observed",
        });
      }
      return observations.length > 0 ? observations : null;
    } catch (err) {
      logFredFailure(seriesId, err);
      return null;
    }
  });
}

/**
 * Wraps a `cached()` call so that ANY rejection (a network-level throw that
 * escapes a provider adapter, or a DB error surfacing through
 * `runTrackedIngestion`'s own `recordAttempt`/`recordSuccess` calls) never
 * propagates out of this family's builder — matches
 * `buildRealOverrides.ts`'s "a single family's (or single KPI's) provider
 * failure never throws out of this function" invariant. On rejection, this
 * synthesizes a null-value result with `fetchedAtMs: Date.now()` so the
 * caller's normal null-handling (-> `unavailableOverride`) applies uniformly.
 */
async function safeCached<T>(promise: Promise<CachedResult<T | null>>, logLabel: string): Promise<CachedResult<T | null>> {
  try {
    return await promise;
  } catch (err) {
    console.error(`[real-data] F2 fetch failed for ${logLabel}:`, err instanceof Error ? err.message : err);
    return { value: null, fetchedAtMs: Date.now() };
  }
}

async function cachedTreasuryParYield(): Promise<CachedResult<ParYieldPoint | null>> {
  return safeCached(cached("treasury:par-yield", TREASURY_TTL_MS, fetchTreasuryParYieldTracked), "treasury:par-yield");
}

async function cachedTreasuryRealParYield(): Promise<CachedResult<RealParYieldPoint | null>> {
  return safeCached(cached("treasury:par-yield-real", TREASURY_TTL_MS, fetchTreasuryRealParYieldTracked), "treasury:par-yield-real");
}

async function cachedFredSeries(seriesId: string, kpiId: string, decimals: number): Promise<CachedResult<FredObservation[] | null>> {
  return safeCached(
    cached(`fred:${seriesId}`, FRED_TTL_MS, () => fetchFredSeriesTracked(seriesId, kpiId, decimals)),
    `fred:${seriesId}`
  );
}

export async function buildF2Overrides(): Promise<FamilyOverrideResult> {
  const nowIso = new Date().toISOString();
  const kpiOverrides: Record<string, KpiOverride> = {};

  const [parYieldResult, realParYieldResult, t5yifrResult, t10yieResult, t10y2yResult] = await Promise.all([
    cachedTreasuryParYield(),
    cachedTreasuryRealParYield(),
    cachedFredSeries(FRED_SERIES.T5YIFR, "f2-5y5y", 2),
    cachedFredSeries(FRED_SERIES.T10YIE, "f2-be10", 3),
    cachedT10Y2Y(),
  ]);

  const parYield = parYieldResult.value;
  const parYieldRetrievedAtIso = new Date(parYieldResult.fetchedAtMs).toISOString();

  const realParYield = realParYieldResult.value;
  const realParYieldRetrievedAtIso = new Date(realParYieldResult.fetchedAtMs).toISOString();

  const t5yifr = t5yifrResult.value?.[0] ?? null;
  const t5yifrRetrievedAtIso = new Date(t5yifrResult.fetchedAtMs).toISOString();

  const t10yie = t10yieResult.value?.[0] ?? null;
  const t10yieRetrievedAtIso = new Date(t10yieResult.fetchedAtMs).toISOString();

  const t10y2y = t10y2yResult.value?.[0] ?? null;
  const t10y2yRetrievedAtIso = new Date(t10y2yResult.fetchedAtMs).toISOString();

  // --- 2Y / 10Y nominal — Treasury Daily Par Yield Curve, sole primary ---
  kpiOverrides["f2-2y"] = parYield
    ? {
        value: round(parYield.y2, 3),
        sourceTag: SOURCE_TAG_TREASURY,
        dataState: "REAL",
        observationAtIso: parYield.dateIso,
        retrievedAtIso: parYieldRetrievedAtIso,
        provenance: "observed",
      }
    : unavailableOverride(nowIso);

  kpiOverrides["f2-10y"] = parYield
    ? {
        value: round(parYield.y10, 3),
        sourceTag: SOURCE_TAG_TREASURY,
        dataState: "REAL",
        observationAtIso: parYield.dateIso,
        retrievedAtIso: parYieldRetrievedAtIso,
        provenance: "observed",
      }
    : unavailableOverride(nowIso);

  // --- 10Y Real — Treasury Daily Par REAL (TIPS) Yield Curve, sole primary ---
  kpiOverrides["f2-10y-real"] = realParYield
    ? {
        value: round(realParYield.y10, 3),
        sourceTag: SOURCE_TAG_TREASURY,
        dataState: "REAL",
        observationAtIso: realParYield.dateIso,
        retrievedAtIso: realParYieldRetrievedAtIso,
        provenance: "observed",
      }
    : unavailableOverride(nowIso);

  // --- 2s10s spread — direct FRED T10Y2Y, no longer computed from the
  // Treasury par-yield legs (see this file's top-of-file comment).
  kpiOverrides["f2-2s10s"] = t10y2y
    ? {
        value: round(t10y2y.value * 100, 0),
        sourceTag: SOURCE_TAG_FRED,
        dataState: "REAL",
        observationAtIso: toObservationIso(t10y2y.date),
        retrievedAtIso: t10y2yRetrievedAtIso,
        provenance: "observed",
      }
    : unavailableOverride(nowIso);

  // --- 5Y5Y forward inflation expectation (T5YIFR) — direct FRED series ---
  kpiOverrides["f2-5y5y"] = t5yifr
    ? {
        value: round(t5yifr.value, 2),
        sourceTag: SOURCE_TAG_FRED,
        dataState: "REAL",
        observationAtIso: toObservationIso(t5yifr.date),
        retrievedAtIso: t5yifrRetrievedAtIso,
        provenance: "observed",
      }
    : unavailableOverride(nowIso);

  // --- Breakeven inflation (BE10) — direct FRED T10YIE, no longer derived ---
  kpiOverrides["f2-be10"] = t10yie
    ? {
        value: round(t10yie.value, 3),
        sourceTag: SOURCE_TAG_FRED,
        dataState: "REAL",
        observationAtIso: toObservationIso(t10yie.date),
        retrievedAtIso: t10yieRetrievedAtIso,
        provenance: "observed",
      }
    : unavailableOverride(nowIso);

  return { kpiOverrides };
}
