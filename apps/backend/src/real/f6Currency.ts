import { fetchLatestObservations, FredApiError, type FredObservation } from "../providers/fred";
import { fetchYahooChart, YahooFinanceError, type YahooChartResult } from "../providers/yahooFinance";
import { cached } from "./cache";
import { loadAppConfig } from "../config/env";
import { insertObservationIfChanged, type KpiObservationInput } from "../db/kpiObservations";
import { rememberLatestValueFromObservation } from "../db/kpiLatestValues";
import { earliestIso, round, toObservationIso, unavailableOverride, type FamilyOverrideResult, type KpiOverride } from "./types";

function isDbConfigured(): boolean {
  return loadAppConfig().db !== null;
}

/** Persists one observation to `kpi_observations` (best-effort — durable "previous value" history, see kpiHistory.ts's DB-backed lookup) — never turns a successful fetch into a failed one. */
async function persistObservation(input: KpiObservationInput): Promise<void> {
  if (!isDbConfigured()) return;
  try {
    await insertObservationIfChanged(input);
  } catch (err) {
    console.error(`[real-data] F6 failed to persist kpi_observations row for ${input.kpiId}:`, err instanceof Error ? err.message : err);
  }
  try {
    await rememberLatestValueFromObservation(input);
  } catch (err) {
    console.error(`[real-data] F6 failed to persist kpi_latest_values row for ${input.kpiId}:`, err instanceof Error ? err.message : err);
  }
}

// F6 real-mode — Yahoo-direct DXY pass. `buildF6Overrides` below is the
// ACTIVE implementation, wired into apps/backend/src/real/buildRealOverrides.ts
// unchanged (same export name), and sources `f6-dxy-recon-level`/
// `f6-dxy-recon-today`/`f6-dxy-recon-5d`/`f6-usd-state` from Yahoo Finance's
// public chart endpoint (symbol `DX-Y.NYB`) — a genuine DIRECT reading of
// the ICE US Dollar Index, not a reconstruction. See
// apps/backend/src/providers/yahooFinance.ts for the endpoint client and
// its validation notes (live-verified this pass, correctly labeled "US
// Dollar Index" / "ICE US Dollar Index", cross-checked against an
// independent source).
//
// KPI IDS KEPT AS-IS ("f6-dxy-recon-*"): these ids literally say
// "reconstruction," which is no longer accurate now that the source is
// direct — but the ids are referenced from several other files
// (apps/backend/src/intelligence/kpiDependencyMap.ts,
// apps/backend/src/intelligence/mockScenarios.ts,
// apps/frontend/src/content/knowledge/knowledgeMap.ts) outside this
// change's declared scope. Renaming the id would require touching all of
// those in the same pass to avoid dangling references, which is a larger,
// riskier blast radius than this pass's brief calls for. Deliberately kept
// unchanged; the user-facing `label` ("DXY") and `driverSummary` (see
// apps/backend/src/mock/fixtures.ts) already read correctly regardless of
// the internal id string.
//
// NO FALLBACK ON FAILURE: if the Yahoo fetch fails for any reason, all 4 F6
// KPIs go UNAVAILABLE — never a silent revert to the deprecated
// reconstruction formula below, per explicit product-owner instruction.
//
// ---------------------------------------------------------------------------
// DEPRECATED, KEPT FOR REFERENCE ONLY — six-FX-leg RECONSTRUCTED_DXY.
// ---------------------------------------------------------------------------
// Everything from here down to "END DEPRECATED" is the PRIOR pass's
// six-FRED-FX-leg reconstruction of a DXY-equivalent (ICE USDX's own
// published geometric-weighted methodology). It is mathematically valid
// (verified live against FRED's H.10 release) but was ~10 days stale in
// practice and is no longer what the product owner wants now that a
// validated DIRECT source exists (Yahoo, above). It is intentionally left
// in place, unused/uncalled, rather than deleted, in case Yahoo's feed
// needs to be dropped later and this needs to be revived as a fallback.
//
// If this is ever reactivated as a live KPI source again, its correct
// shape is DIFFERENT from a direct reading:
//   - `provenance: "derived"` (it is computed from 6 other series, not
//     observed directly), and
//   - `proxyFor: "ICE DXY"` (see the `proxyFor` field on `CanonicalKpi` in
//     packages/contracts/src/index.ts — it stands in for the real ICE DXY
//     the same way GVZ stands in for true Gold options volatility/CVOL).
// It must NOT be wired back in with `provenance: "observed"` — that would
// misrepresent a computed reconstruction as a direct reading.
//
// FORMULA (verified live via web search this pass, not from memory — ICE's
// published USDX methodology, geometric-weighted, unchanged since the
// index's 1973 creation apart from the Euro-introduction leg swap):
//
//   DXY = 50.14348112
//         × EURUSD^(-0.576) × USDJPY^(0.136) × GBPUSD^(-0.119)
//         × USDCAD^(0.091)  × USDSEK^(0.042) × USDCHF^(0.036)
//
// LEGS/SOURCE (verified live this pass with the real FRED key — all 6
// returned real, current observations): every one of the 6 ICE USDX legs is
// available, cleanly and directly (no inversion needed), from FRED's H.10
// series — a single Federal Reserve release, so all 6 legs are published on
// the same set of US business days:
//   EUR/USD -> DEXUSEU (USD per EUR — already EUR/USD)
//   USD/JPY -> DEXJPUS (JPY per USD — already USD/JPY)
//   GBP/USD -> DEXUSUK (USD per GBP — already GBP/USD)
//   USD/CAD -> DEXCAUS (CAD per USD — already USD/CAD)
//   USD/SEK -> DEXSDUS (SEK per USD — already USD/SEK; FRED DOES cover SEK,
//              resolving the "does FRED have a USD/SEK series" open question
//              from the strategy stub's comment)
//   USD/CHF -> DEXSZUS (CHF per USD — already USD/CHF)
// Massive's free Forex Basic tier was NOT needed — FRED alone cleanly
// covers all 6 legs, so there is no mixed-source provenance to track; every
// F6 KPI's `sourceTag` is a single "FRED".
//
// EOD-ONLY HONESTY: FRED's H.10 release is itself EOD (one observation per
// US business day, typically a few days behind "today" due to publication
// lag — same lag profile as every other FRED-backed family in this
// codebase). "Today %" here is genuinely "latest EOD vs prior EOD", NOT an
// intraday change — same honesty standard already applied to F2/F7/F8/F11's
// FRED-backed KPIs. "5D %" is "latest EOD vs the 5th-most-recent common EOD
// observation across all 6 legs" (i.e. ~5 US business days back), not a
// calendar-week difference.
const DEPRECATED_TTL_MS = 60 * 60_000; // 1h — daily-cadence source, matches every other FRED-backed real family
const DEPRECATED_SOURCE_TAG = "FRED";
const DEPRECATED_HISTORY_LIMIT = 12; // >6 trading days of buffer per leg, cheap (one call/leg/hour)

const DEPRECATED_LEG_SERIES = {
  EURUSD: "DEXUSEU",
  USDJPY: "DEXJPUS",
  GBPUSD: "DEXUSUK",
  USDCAD: "DEXCAUS",
  USDSEK: "DEXSDUS",
  USDCHF: "DEXSZUS",
} as const;

type DeprecatedLegKey = keyof typeof DEPRECATED_LEG_SERIES;
const DEPRECATED_LEG_KEYS = Object.keys(DEPRECATED_LEG_SERIES) as DeprecatedLegKey[];

const DEPRECATED_DXY_CONSTANT = 50.14348112;
const DEPRECATED_DXY_EXPONENTS: Record<DeprecatedLegKey, number> = {
  EURUSD: -0.576,
  USDJPY: 0.136,
  GBPUSD: -0.119,
  USDCAD: 0.091,
  USDSEK: 0.042,
  USDCHF: 0.036,
};

function logDeprecatedFredFailure(seriesId: string, err: unknown): void {
  const detail =
    err instanceof FredApiError ? `[${err.code}] ${err.message}` : err instanceof Error ? err.message : String(err);
  console.error(`[real-data] F6 DEPRECATED reconstruction (FRED) fetch failed for series ${seriesId}: ${detail}`);
}

/** Fetches (and caches) one FX leg's recent history, catching and logging any failure. Returns null on failure or an empty result. DEPRECATED — see file header. */
async function fetchDeprecatedLegHistorySafe(seriesId: string): Promise<FredObservation[] | null> {
  try {
    const { value } = await cached(`fred:${seriesId}`, DEPRECATED_TTL_MS, () => fetchLatestObservations(seriesId, DEPRECATED_HISTORY_LIMIT));
    return value.length > 0 ? value : null;
  } catch (err) {
    logDeprecatedFredFailure(seriesId, err);
    return null;
  }
}

/** date (YYYY-MM-DD) -> value, for one leg's history. DEPRECATED — see file header. */
function toDeprecatedDateMap(history: FredObservation[]): Map<string, number> {
  return new Map(history.map((obs) => [obs.date, obs.value]));
}

/**
 * Dates present in EVERY leg's history, newest-first. DEPRECATED — see file
 * header.
 */
function deprecatedCommonDatesDesc(legMaps: ReadonlyMap<DeprecatedLegKey, Map<string, number>>): string[] {
  const maps = [...legMaps.values()];
  if (maps.length === 0) return [];
  const [first, ...rest] = maps;
  return [...first.keys()].filter((date) => rest.every((m) => m.has(date))).sort((a, b) => (a < b ? 1 : a > b ? -1 : 0));
}

/** The ICE USDX geometric-weighted reconstruction formula for one date's 6 leg values. DEPRECATED — see file header. */
function computeDeprecatedDxy(legsForDate: Record<DeprecatedLegKey, number>): number {
  return DEPRECATED_LEG_KEYS.reduce(
    (product, leg) => product * Math.pow(legsForDate[leg], DEPRECATED_DXY_EXPONENTS[leg]),
    DEPRECATED_DXY_CONSTANT
  );
}

/**
 * Sign-based plain-language USD state text — used by BOTH the deprecated
 * reconstruction path and the active Yahoo-direct path below (the
 * computation is purely a function of Today%/5D%'s signs, independent of
 * which source produced them). English-only by design (see fixtures.ts's
 * UNLOCALIZED_SENTINEL_IDS — this is a computed sentinel, not static
 * authored prose).
 */
export function computeUsdStateText(todayPct: number, fiveDPct: number): string {
  const todayUp = todayPct >= 0;
  const fiveDUp = fiveDPct >= 0;
  if (todayUp === fiveDUp) {
    return todayUp
      ? "Aligned: firmer both intraday and over 5 days."
      : "Aligned: weaker both intraday and over 5 days.";
  }
  return todayUp
    ? "Divergent: firmer intraday, weaker over 5 days — no clean single-direction read."
    : "Divergent: weaker intraday, firmer over 5 days — no clean single-direction read.";
}

/**
 * DEPRECATED — the six-FX-leg reconstruction, kept unused for reference.
 * See file header for why this is no longer called and what would need to
 * change (`provenance: "derived"`, `proxyFor: "ICE DXY"`) if it were ever
 * revived.
 */
export async function buildF6OverridesReconstructedDeprecated(): Promise<FamilyOverrideResult> {
  const nowIso = new Date().toISOString();
  const retrievedAtIso = nowIso;

  const histories = await Promise.all(DEPRECATED_LEG_KEYS.map((leg) => fetchDeprecatedLegHistorySafe(DEPRECATED_LEG_SERIES[leg])));

  if (histories.some((h) => h === null)) {
    return {
      kpiOverrides: {
        "f6-dxy-recon-level": unavailableOverride(nowIso),
        "f6-dxy-recon-today": unavailableOverride(nowIso),
        "f6-dxy-recon-5d": unavailableOverride(nowIso),
        "f6-usd-state": { ...unavailableOverride(nowIso), driverSummary: null },
      },
    };
  }

  const legMaps = new Map<DeprecatedLegKey, Map<string, number>>(
    DEPRECATED_LEG_KEYS.map((leg, i) => [leg, toDeprecatedDateMap(histories[i] as FredObservation[])])
  );
  const dates = deprecatedCommonDatesDesc(legMaps);

  if (dates.length === 0) {
    return {
      kpiOverrides: {
        "f6-dxy-recon-level": unavailableOverride(nowIso),
        "f6-dxy-recon-today": unavailableOverride(nowIso),
        "f6-dxy-recon-5d": unavailableOverride(nowIso),
        "f6-usd-state": { ...unavailableOverride(nowIso), driverSummary: null },
      },
    };
  }

  const dxyForDate = (date: string): number => {
    const legsForDate = Object.fromEntries(DEPRECATED_LEG_KEYS.map((leg) => [leg, legMaps.get(leg)!.get(date)!])) as Record<
      DeprecatedLegKey,
      number
    >;
    return computeDeprecatedDxy(legsForDate);
  };

  const kpiOverrides: Record<string, KpiOverride> = {};

  const latestDate = dates[0];
  const latestDxy = dxyForDate(latestDate);
  kpiOverrides["f6-dxy-recon-level"] = {
    value: round(latestDxy, 2),
    sourceTag: DEPRECATED_SOURCE_TAG,
    dataState: "REAL",
    observationAtIso: toObservationIso(latestDate),
    retrievedAtIso,
    provenance: "derived",
  };

  let todayPct: number | null = null;
  if (dates.length > 1) {
    const priorDate = dates[1];
    const priorDxy = dxyForDate(priorDate);
    todayPct = round(((latestDxy - priorDxy) / priorDxy) * 100, 2);
    kpiOverrides["f6-dxy-recon-today"] = {
      value: todayPct,
      sourceTag: DEPRECATED_SOURCE_TAG,
      dataState: "REAL",
      observationAtIso: earliestIso([toObservationIso(latestDate), toObservationIso(priorDate)]),
      retrievedAtIso,
      provenance: "derived",
    };
  } else {
    kpiOverrides["f6-dxy-recon-today"] = unavailableOverride(nowIso);
  }

  let fiveDPct: number | null = null;
  if (dates.length > 5) {
    const fiveDaysAgoDate = dates[5];
    const fiveDaysAgoDxy = dxyForDate(fiveDaysAgoDate);
    fiveDPct = round(((latestDxy - fiveDaysAgoDxy) / fiveDaysAgoDxy) * 100, 2);
    kpiOverrides["f6-dxy-recon-5d"] = {
      value: fiveDPct,
      sourceTag: DEPRECATED_SOURCE_TAG,
      dataState: "REAL",
      observationAtIso: earliestIso([toObservationIso(latestDate), toObservationIso(fiveDaysAgoDate)]),
      retrievedAtIso,
      provenance: "derived",
    };
  } else {
    kpiOverrides["f6-dxy-recon-5d"] = unavailableOverride(nowIso);
  }

  kpiOverrides["f6-usd-state"] =
    todayPct != null && fiveDPct != null
      ? {
          value: null,
          sourceTag: DEPRECATED_SOURCE_TAG,
          dataState: "REAL",
          observationAtIso: kpiOverrides["f6-dxy-recon-today"].observationAtIso,
          retrievedAtIso,
          provenance: "derived",
          driverSummary: computeUsdStateText(todayPct, fiveDPct),
        }
      : { ...unavailableOverride(nowIso), driverSummary: null };

  return { kpiOverrides };
}
// ---------------------------------------------------------------------------
// END DEPRECATED
// ---------------------------------------------------------------------------

const YAHOO_SOURCE_TAG = "YAHOO_FINANCE_UNOFFICIAL";
// DXY trades continuously intraday, but the freshness bucket this KPI is
// judged against (REAL_KPI_CADENCE in snapshotCache.ts) is "daily" — same
// as every other real family here — so there is no benefit to polling more
// often than every fifteen minutes; this stays conservative with an
// unofficial, rate-limit-unknown endpoint while making an intraday value
// meaningfully fresher.
const YAHOO_TTL_MS = 15 * 60_000;
const DXY_SYMBOL = "DX-Y.NYB";

function epochSecToIso(sec: number): string {
  return new Date(sec * 1000).toISOString();
}

/** Returns `fetchedAtMs` alongside the chart (previously discarded — see the retrievedAt bug this fixes in buildF6Overrides below: retrievedAtIso was silently set to "now" at every request instead of the actual last-fetch time, so the freshness label always looked deceptively fresh regardless of how long the 1h cache had actually been holding this value). Persists the level reading to `kpi_observations` INSIDE the fetcher passed to `cached()` — only on a genuine cache-miss real fetch, matching f2Rates.ts's pattern. */
async function fetchDxyChartSafe(): Promise<{ chart: YahooChartResult; fetchedAtMs: number } | null> {
  try {
    const { value, fetchedAtMs } = await cached(`yahoo:${DXY_SYMBOL}`, YAHOO_TTL_MS, async () => {
      const chart = await fetchYahooChart(DXY_SYMBOL, "1mo", "1d");
      await persistObservation({
        kpiId: "f6-dxy-recon-level",
        observationAt: new Date(epochSecToIso(chart.meta.regularMarketTime)),
        retrievedAt: new Date(),
        numericValue: round(chart.meta.regularMarketPrice, 2),
        sourceTag: YAHOO_SOURCE_TAG,
        provenance: "observed",
      });
      return chart;
    });
    return { chart: value, fetchedAtMs };
  } catch (err) {
    const detail =
      err instanceof YahooFinanceError ? `[${err.code}] ${err.message}` : err instanceof Error ? err.message : String(err);
    console.error(`[real-data] F6 (Yahoo Finance) fetch failed for symbol ${DXY_SYMBOL}: ${detail}`);
    return null;
  }
}

/**
 * ACTIVE F6 implementation. Sources DXY directly from Yahoo Finance's
 * unofficial public chart endpoint (symbol `DX-Y.NYB`) — see file header
 * and apps/backend/src/providers/yahooFinance.ts. On any fetch failure, all
 * 4 F6 KPIs go UNAVAILABLE; there is deliberately no fallback to the
 * deprecated reconstruction above.
 */
export async function buildF6Overrides(): Promise<FamilyOverrideResult> {
  const nowIso = new Date().toISOString();
  const fetched = await fetchDxyChartSafe();

  if (!fetched) {
    return {
      kpiOverrides: {
        "f6-dxy-recon-level": unavailableOverride(nowIso),
        "f6-dxy-recon-today": unavailableOverride(nowIso),
        "f6-dxy-recon-5d": unavailableOverride(nowIso),
        "f6-usd-state": { ...unavailableOverride(nowIso), driverSummary: null },
      },
    };
  }

  const retrievedAtIso = new Date(fetched.fetchedAtMs).toISOString();
  const { meta, history } = fetched.chart;
  const latestIndex = history.length - 1;
  const kpiOverrides: Record<string, KpiOverride> = {};

  // Direct, observed reading — not derived/reconstructed from other series.
  kpiOverrides["f6-dxy-recon-level"] = {
    value: round(meta.regularMarketPrice, 2),
    sourceTag: YAHOO_SOURCE_TAG,
    dataState: "REAL",
    observationAtIso: epochSecToIso(meta.regularMarketTime),
    retrievedAtIso,
    provenance: "observed",
  };

  // "Today %" = live price vs the most recent prior daily close in the same
  // history array (no second call needed).
  let todayPct: number | null = null;
  if (latestIndex >= 1) {
    const prior = history[latestIndex - 1];
    todayPct = round(((meta.regularMarketPrice - prior.close) / prior.close) * 100, 2);
    const observationAtIso = earliestIso([epochSecToIso(meta.regularMarketTime), epochSecToIso(prior.timestampSec)]);
    kpiOverrides["f6-dxy-recon-today"] = {
      value: todayPct,
      sourceTag: YAHOO_SOURCE_TAG,
      dataState: "REAL",
      observationAtIso,
      retrievedAtIso,
      provenance: "derived",
    };
    // User-requested 2026-09-16: previous/current for the delta KPIs too,
    // not just levels — same `persistObservation` helper already used for
    // f6-dxy-recon-level above (dedups an identical repeat value, so it's
    // safe/cheap to call every request rather than gating on cache-miss,
    // matching blsMonthly.ts's persistObservation convention).
    await persistObservation({
      kpiId: "f6-dxy-recon-today",
      observationAt: new Date(observationAtIso),
      retrievedAt: new Date(retrievedAtIso),
      numericValue: todayPct,
      sourceTag: YAHOO_SOURCE_TAG,
      provenance: "derived",
    });
  } else {
    kpiOverrides["f6-dxy-recon-today"] = unavailableOverride(nowIso);
  }

  // "5D %" = live price vs the close from 5 trading sessions back.
  let fiveDPct: number | null = null;
  if (latestIndex >= 5) {
    const fiveDaysAgo = history[latestIndex - 5];
    fiveDPct = round(((meta.regularMarketPrice - fiveDaysAgo.close) / fiveDaysAgo.close) * 100, 2);
    const observationAtIso = earliestIso([epochSecToIso(meta.regularMarketTime), epochSecToIso(fiveDaysAgo.timestampSec)]);
    kpiOverrides["f6-dxy-recon-5d"] = {
      value: fiveDPct,
      sourceTag: YAHOO_SOURCE_TAG,
      dataState: "REAL",
      observationAtIso,
      retrievedAtIso,
      provenance: "derived",
    };
    await persistObservation({
      kpiId: "f6-dxy-recon-5d",
      observationAt: new Date(observationAtIso),
      retrievedAt: new Date(retrievedAtIso),
      numericValue: fiveDPct,
      sourceTag: YAHOO_SOURCE_TAG,
      provenance: "derived",
    });
  } else {
    kpiOverrides["f6-dxy-recon-5d"] = unavailableOverride(nowIso);
  }

  kpiOverrides["f6-usd-state"] =
    todayPct != null && fiveDPct != null
      ? {
          value: null,
          sourceTag: YAHOO_SOURCE_TAG,
          dataState: "REAL",
          observationAtIso: kpiOverrides["f6-dxy-recon-today"].observationAtIso,
          retrievedAtIso,
          provenance: "derived",
          driverSummary: computeUsdStateText(todayPct, fiveDPct),
        }
      : { ...unavailableOverride(nowIso), driverSummary: null };

  return { kpiOverrides };
}
