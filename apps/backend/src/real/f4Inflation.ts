import { loadAppConfig } from "../config/env";
import { fetchSeriesHistoryWithCalculations, type BlsObservationWithCalculations } from "../providers/bls";
import {
  fetchNipaMonthlyTableData,
  PCE_TABLE_ID,
  PCE_HEADLINE_LINE_NUMBER,
  PCE_CORE_LINE_NUMBER,
  PCE_PCT_CHANGE_TABLE_ID,
} from "../providers/bea";
import { cached } from "./cache";
import { runTrackedIngestion } from "../db/ingestionRunner";
import { recordAttempt, recordSuccess, recordFailure } from "../db/ingestionState";
import { computeCpiCalc, lastDayOfMonthIso, resolvePctChange, persistObservation } from "./blsMonthly";
import type { BlsObservation } from "../providers/bls";
import { round, unavailableOverride, type FamilyOverrideResult, type KpiOverride } from "./types";

// F4 Inflation.
//
// BUG A (P0) FIX PASS — see real/blsMonthly.ts's top-of-file comment for the
// full root-cause writeup. In short: every MoM/YoY/3M-annualized figure here
// used to be computed by ARRAY OFFSET (`history[1]`/`history[12]`/
// `history[3]`), inherited from the (now fully removed) Massive fallback
// code path's pattern — silently wrong whenever the fetched series had a
// gap. Fixed: every BLS-derived figure below is now either (a) BLS's own
// `calculations` block, read directly for the EXACT period it applies to
// (`provenance: "observed"`), or (b) an explicit calendar-period-matched
// derivation (`provenance: "derived"`, real/blsMonthly.ts's computeCpiCalc/
// resolvePctChange) — never array-offset in either path.
//
// BLS `calculations: true` — LIVE-VERIFIED this pass (see
// providers/bls.ts's fetchSeriesHistoryWithCalculations doc comment):
//   - f4-core-cpi-mom / f4-headline-cpi-mom / f4-ppi-final-demand: BLS's own
//     1-month pct_change is exact and used directly.
//   - f4-core-cpi-yoy / f4-headline-cpi-yoy: BLS's own 12-month pct_change
//     is exact and used directly — this IS the Bug A fix target (app showed
//     2.8/3.5 from array-offset math; BLS's own calculations block for the
//     SA series, 2026-07, gave 2.5/3.3).
//   - f4-core-cpi-3m-ann: BLS's 3-month `calculations` lookback is a
//     CUMULATIVE 3-month % change, not ANNUALIZED — stays derived via
//     computeCpiCalc's `((latest/3-months-ago)^4 - 1) * 100`, using exact
//     calendar periods.
//
// SECOND-PASS CORRECTION — NSA vs SA for YoY (see CORE_CPI_NSA_SERIES's doc
// comment): the Bug A fix above computed YoY from the SEASONALLY ADJUSTED
// series (CUSR0000SA0/CUSR0000SA0L1E), matching what BLS's own calculations
// block returns for that series — but BLS's OFFICIALLY PUBLISHED 12-month
// change is computed from the NOT-seasonally-adjusted series instead
// (verified live against bls.gov/news.release/cpi.nr0.htm's July 2026
// release: official headline YoY = 3.4%, vs 3.3% from the SA series'
// own calculations block for the same month — a real mismatch, not
// rounding). YoY below now reads CUUR0000SA0/CUUR0000SA0L1E (NSA) instead;
// MoM and 3M-annualized correctly stay on the SA series per BLS's own
// convention (1-month changes ARE reported seasonally adjusted).
//
// CORE_CPI_SERIES, HEADLINE_CPI_SERIES, PPI_FINAL_DEMAND_SERIES, and the two
// NSA series are all fetched together in ONE BLS POST call
// (`fetchSeriesHistoryWithCalculations`) instead of separate GETs — this
// also reduces BLS daily-quota pressure (previously flagged as a real
// constraint; see docs/PROVIDER_SETUP.md).
//
// f4-core-pce-mom/yoy, f4-headline-pce-yoy: BEA NIPA table T20804 (monthly
// PCE price indexes; line 1 = headline, line 25 = core) + T20807 (BEA's own
// published MoM %-change table) — both RE-VERIFIED live this pass, table
// ids/line numbers unchanged from the prior accuracy-investigation pass
// (see PCE_PCT_CHANGE_TABLE_ID's doc comment in providers/bea.ts). YoY has
// no equivalent official monthly %-change-in-prices BEA table, so it stays
// index-derived — now via the same calendar-exact `computeCpiCalc` as
// everything else in this file (it always was correct here in practice
// since BEA's TimePeriod strings are contiguous, but it's no longer relying
// on that being true).
//
// No-fallback policy (unchanged): every KPI below reports UNAVAILABLE, full
// stop, on a primary-source failure — no Massive, no cross-provider rescue.
//
// Persistence (this pass): every REAL value computed below is now persisted
// via kpiObservations's insert-if-changed helper (append-only revision
// history), and every BLS/BEA fetch attempt updates ingestion_state via a
// per-source job_key ("bls:cpi-ppi", "bea:pce-index", "bea:pce-pctchange").
// A DB hiccup never blocks real-data serving — see blsMonthly.ts's
// persistObservation and this file's trackedNullableFetch, both fully
// try/catch-guarded.
//
// Mock next-event fallback removed: F4 previously always showed a fixture
// "Next CPI Release" event dated `Date.now() + 9 days` with zero real
// grounding (apps/backend/src/mock/events.ts's FAMILY_EVENTS.F4) — there is
// no real BLS/BEA release-calendar integration this pass (see
// docs/PROVIDER_SETUP.md's "releaseCalendars" NEEDS_RESEARCH entry), so per
// "never a fake Date.now()+9d-style placeholder," `nextEvents` below is now
// an explicit empty array, which overrides (not merges with) that mock
// fixture in cache/snapshotCache.ts.
const TTL_MS = 6 * 60 * 60_000; // 6h — monthly-cadence source
const BEA_TTL_MS = 6 * 60 * 60_000; // 6h — monthly-cadence source
const SOURCE_TAG = "BLS";
const BEA_SOURCE_TAG = "BEA";
const CORE_CPI_SERIES = "CUSR0000SA0L1E";
const HEADLINE_CPI_SERIES = "CUSR0000SA0";
// Re-confirmed live this pass via a real calculations:true POST call (see
// providers/bls.ts) — returns real current index values and pct_changes,
// same catalog id ("PPI Commodity data for Final demand, seasonally
// adjusted") as the prior pass's finding.
const PPI_FINAL_DEMAND_SERIES = "WPSFD4";
// NSA (not-seasonally-adjusted) counterparts, used ONLY for the 12-month/YoY
// figures below — verified live against BLS's own July 2026 CPI Summary
// release (bls.gov/news.release/cpi.nr0.htm): the official published 12-month
// change is computed from the NSA series (headline 3.4% for 2026-07), while
// the SA series' (CUSR0000SA0) own BLS-returned 12-month pct_change for the
// same month is 3.3% — a real, measurable mismatch, not a rounding artifact.
// MoM and the 3-month-annualized trend correctly stay on the SA series
// (CORE_CPI_SERIES/HEADLINE_CPI_SERIES above) — BLS reports those on a
// seasonally adjusted basis by convention; only YoY switches base series.
const CORE_CPI_NSA_SERIES = "CUUR0000SA0L1E";
const HEADLINE_CPI_NSA_SERIES = "CUUR0000SA0";

function apiKey(): string | undefined {
  return loadAppConfig().providers.bls?.apiKey;
}

/** BEA's GetData supports comma-separated years; requesting the current + prior 2 calendar years comfortably covers the 13 months of history MoM/YoY math needs, at any point in the year. */
function pceYearsWindow(): string[] {
  const currentYear = new Date().getUTCFullYear();
  return [currentYear - 2, currentYear - 1, currentYear].map(String);
}

/** Adapts one BEA NIPA line's cells into the `BlsObservation` shape so `computeCpiCalc`'s calendar-exact MoM/YoY/3M-annualized math can be reused as-is. BEA's `TimePeriod` ("2026M07") already matches BLS's year+period convention byte-for-byte once split. */
function toIndexObservations(points: readonly { timePeriod: string; lineNumber: string; dataValue: number }[], lineNumber: string): BlsObservation[] {
  return points
    .filter((p) => p.lineNumber === lineNumber)
    .sort((a, b) => (a.timePeriod < b.timePeriod ? 1 : -1)) // newest first; fixed-width "YYYYMNN" sorts lexically == chronologically
    .map((p) => ({ year: p.timePeriod.slice(0, 4), period: p.timePeriod.slice(4), value: p.dataValue }));
}

/**
 * `fetchNipaMonthlyTableData` (providers/bea.ts) returns `null` on failure
 * rather than throwing (an older convention this file doesn't want to
 * change, since providers/bea.ts's own smoke test also relies on it) — this
 * wraps a null-returning fetcher with the same recordAttempt/recordSuccess/
 * recordFailure bookkeeping `db/ingestionRunner.ts`'s `runTrackedIngestion`
 * gives a throwing fetcher, treating a `null` result as a recorded failure
 * rather than a false "SUCCESS". Never throws itself from the bookkeeping
 * side — only a genuine fetcher failure propagates.
 */
async function trackedNullableFetch<T>(jobKey: string, fetcher: () => Promise<T | null>): Promise<T | null> {
  try {
    await recordAttempt(jobKey);
  } catch (err) {
    console.error(`[real-data] ingestion_state recordAttempt failed for ${jobKey}:`, err instanceof Error ? err.message : err);
  }

  const result = await fetcher();

  try {
    if (result == null) await recordFailure(jobKey, "fetch returned no usable data");
    else await recordSuccess(jobKey);
  } catch (err) {
    console.error(`[real-data] ingestion_state record failed for ${jobKey}:`, err instanceof Error ? err.message : err);
  }

  return result;
}

const F4_CPI_PPI_KPI_IDS = [
  "f4-core-cpi-mom",
  "f4-core-cpi-yoy",
  "f4-core-cpi-3m-ann",
  "f4-headline-cpi-mom",
  "f4-headline-cpi-yoy",
  "f4-ppi-final-demand",
] as const;

export async function buildF4Overrides(): Promise<FamilyOverrideResult> {
  const nowIso = new Date().toISOString();
  const kpiOverrides: Record<string, KpiOverride> = {};

  try {
    const { value: bundle, fetchedAtMs } = await cached("bls:calc:f4-cpi-ppi", TTL_MS, () =>
      runTrackedIngestion("bls:cpi-ppi", () =>
        fetchSeriesHistoryWithCalculations(
          [CORE_CPI_SERIES, HEADLINE_CPI_SERIES, PPI_FINAL_DEMAND_SERIES, CORE_CPI_NSA_SERIES, HEADLINE_CPI_NSA_SERIES],
          apiKey()
        )
      )
    );
    const retrievedAtIso = new Date(fetchedAtMs).toISOString();

    const coreHistory: BlsObservationWithCalculations[] | null = bundle[CORE_CPI_SERIES] ?? null;
    const coreCalc = computeCpiCalc(coreHistory);
    if (!coreCalc.observationAtIso) throw new Error("core CPI series returned no usable latest observation");

    const coreMom = resolvePctChange(coreHistory, "1");
    kpiOverrides["f4-core-cpi-mom"] = coreMom
      ? {
          value: round(coreMom.value, 1),
          sourceTag: SOURCE_TAG,
          dataState: "REAL",
          observationAtIso: coreCalc.observationAtIso,
          retrievedAtIso,
          provenance: coreMom.provenance,
        }
      : unavailableOverride(nowIso);

    // YoY uses the NSA series, not `coreHistory`/`coreCalc` above (SA) — see
    // CORE_CPI_NSA_SERIES's doc comment: BLS's own official 12-month change
    // is computed on the not-seasonally-adjusted index.
    const coreNsaHistory: BlsObservationWithCalculations[] | null = bundle[CORE_CPI_NSA_SERIES] ?? null;
    const coreNsaCalc = computeCpiCalc(coreNsaHistory);
    const coreYoy = resolvePctChange(coreNsaHistory, "12");
    kpiOverrides["f4-core-cpi-yoy"] = coreYoy && coreNsaCalc.observationAtIso
      ? {
          value: round(coreYoy.value, 1),
          sourceTag: SOURCE_TAG,
          dataState: "REAL",
          observationAtIso: coreNsaCalc.observationAtIso,
          retrievedAtIso,
          provenance: coreYoy.provenance,
        }
      : unavailableOverride(nowIso);

    kpiOverrides["f4-core-cpi-3m-ann"] =
      coreCalc.ann3mPct != null
        ? {
            value: round(coreCalc.ann3mPct, 1),
            sourceTag: SOURCE_TAG,
            dataState: "REAL",
            observationAtIso: coreCalc.observationAtIso,
            retrievedAtIso,
            provenance: "derived",
          }
        : unavailableOverride(nowIso);

    const headlineHistory: BlsObservationWithCalculations[] | null = bundle[HEADLINE_CPI_SERIES] ?? null;
    const headlineCalc = computeCpiCalc(headlineHistory);
    if (!headlineCalc.observationAtIso) throw new Error("headline CPI series returned no usable latest observation");

    const headlineMom = resolvePctChange(headlineHistory, "1");
    kpiOverrides["f4-headline-cpi-mom"] = headlineMom
      ? {
          value: round(headlineMom.value, 1),
          sourceTag: SOURCE_TAG,
          dataState: "REAL",
          observationAtIso: headlineCalc.observationAtIso,
          retrievedAtIso,
          provenance: headlineMom.provenance,
        }
      : unavailableOverride(nowIso);

    // YoY uses the NSA series — same reasoning as core CPI YoY above.
    const headlineNsaHistory: BlsObservationWithCalculations[] | null = bundle[HEADLINE_CPI_NSA_SERIES] ?? null;
    const headlineNsaCalc = computeCpiCalc(headlineNsaHistory);
    const headlineYoy = resolvePctChange(headlineNsaHistory, "12");
    kpiOverrides["f4-headline-cpi-yoy"] = headlineYoy && headlineNsaCalc.observationAtIso
      ? {
          value: round(headlineYoy.value, 1),
          sourceTag: SOURCE_TAG,
          dataState: "REAL",
          observationAtIso: headlineNsaCalc.observationAtIso,
          retrievedAtIso,
          provenance: headlineYoy.provenance,
        }
      : unavailableOverride(nowIso);

    const ppiHistory: BlsObservationWithCalculations[] | null = bundle[PPI_FINAL_DEMAND_SERIES] ?? null;
    const ppiCalc = computeCpiCalc(ppiHistory);
    const ppiMom = resolvePctChange(ppiHistory, "1");
    kpiOverrides["f4-ppi-final-demand"] =
      ppiMom && ppiCalc.observationAtIso
        ? {
            value: round(ppiMom.value, 1),
            sourceTag: SOURCE_TAG,
            dataState: "REAL",
            observationAtIso: ppiCalc.observationAtIso,
            retrievedAtIso,
            provenance: ppiMom.provenance,
          }
        : unavailableOverride(nowIso);

    await Promise.all(
      F4_CPI_PPI_KPI_IDS.filter((id) => kpiOverrides[id]?.dataState === "REAL").map((id) => {
        const override = kpiOverrides[id];
        return persistObservation({
          kpiId: id,
          observationAtIso: override.observationAtIso,
          retrievedAtIso: override.retrievedAtIso,
          numericValue: override.value as number,
          sourceTag: override.sourceTag,
          provenance: override.provenance ?? "derived",
        });
      })
    );
  } catch (err) {
    console.error("[real-data] F4 CPI/PPI (BLS) fetch failed:", err instanceof Error ? err.message : err);
    for (const id of F4_CPI_PPI_KPI_IDS) kpiOverrides[id] = unavailableOverride(nowIso);
  }

  try {
    const [{ value: indexPoints, fetchedAtMs: indexFetchedAtMs }, { value: pctChangePoints, fetchedAtMs: pctFetchedAtMs }] = await Promise.all([
      cached(`bea:${PCE_TABLE_ID}`, BEA_TTL_MS, () => trackedNullableFetch("bea:pce-index", () => fetchNipaMonthlyTableData(PCE_TABLE_ID, pceYearsWindow()))),
      cached(`bea:${PCE_PCT_CHANGE_TABLE_ID}`, BEA_TTL_MS, () =>
        trackedNullableFetch("bea:pce-pctchange", () => fetchNipaMonthlyTableData(PCE_PCT_CHANGE_TABLE_ID, pceYearsWindow()))
      ),
    ]);
    if (!indexPoints) throw new Error(`BEA NIPA table ${PCE_TABLE_ID} fetch failed or returned no data`);
    if (!pctChangePoints) throw new Error(`BEA NIPA table ${PCE_PCT_CHANGE_TABLE_ID} fetch failed or returned no data`);
    const retrievedAtIso = new Date(Math.min(indexFetchedAtMs, pctFetchedAtMs)).toISOString();

    // YoY has no official monthly percent-change-in-prices BEA table (see
    // PCE_PCT_CHANGE_TABLE_ID's doc comment in providers/bea.ts), so it
    // stays index-derived from T20804 (now via calendar-exact computeCpiCalc).
    const headline = computeCpiCalc(toIndexObservations(indexPoints, PCE_HEADLINE_LINE_NUMBER));
    const core = computeCpiCalc(toIndexObservations(indexPoints, PCE_CORE_LINE_NUMBER));

    // MoM reads BEA's own officially-published percent-change table
    // (T20807) directly — see PCE_PCT_CHANGE_TABLE_ID's doc comment for why
    // this is more accurate than re-deriving from T20804's rounded index.
    const coreMomLatest = toIndexObservations(pctChangePoints, PCE_CORE_LINE_NUMBER)[0] ?? null;

    kpiOverrides["f4-headline-pce-yoy"] =
      headline.yoyPct != null && headline.observationAtIso
        ? { value: round(headline.yoyPct, 1), sourceTag: BEA_SOURCE_TAG, dataState: "REAL", observationAtIso: headline.observationAtIso, retrievedAtIso, provenance: "derived" }
        : unavailableOverride(nowIso);

    kpiOverrides["f4-core-pce-mom"] =
      coreMomLatest?.value != null
        ? {
            value: round(coreMomLatest.value, 1),
            sourceTag: BEA_SOURCE_TAG,
            dataState: "REAL",
            observationAtIso: lastDayOfMonthIso(coreMomLatest.year, coreMomLatest.period),
            retrievedAtIso,
            provenance: "observed",
          }
        : unavailableOverride(nowIso);

    kpiOverrides["f4-core-pce-yoy"] =
      core.yoyPct != null && core.observationAtIso
        ? { value: round(core.yoyPct, 1), sourceTag: BEA_SOURCE_TAG, dataState: "REAL", observationAtIso: core.observationAtIso, retrievedAtIso, provenance: "derived" }
        : unavailableOverride(nowIso);

    await Promise.all(
      (["f4-headline-pce-yoy", "f4-core-pce-mom", "f4-core-pce-yoy"] as const)
        .filter((id) => kpiOverrides[id]?.dataState === "REAL")
        .map((id) => {
          const override = kpiOverrides[id];
          return persistObservation({
            kpiId: id,
            observationAtIso: override.observationAtIso,
            retrievedAtIso: override.retrievedAtIso,
            numericValue: override.value as number,
            sourceTag: override.sourceTag,
            provenance: override.provenance ?? "derived",
          });
        })
    );
  } catch (err) {
    console.error("[real-data] F4 PCE (BEA) fetch failed:", err instanceof Error ? err.message : err);
    kpiOverrides["f4-headline-pce-yoy"] = unavailableOverride(nowIso);
    kpiOverrides["f4-core-pce-mom"] = unavailableOverride(nowIso);
    kpiOverrides["f4-core-pce-yoy"] = unavailableOverride(nowIso);
  }

  // See top-of-file comment: no real release-calendar source exists this
  // pass, so this is an explicit empty list rather than the old
  // Date.now()+9d mock placeholder.
  return { kpiOverrides, nextEvents: [] };
}
