import { fetchLatestObservations, FredApiError, type FredObservation } from "../providers/fred";
import { fetchEffrRate, type EffrRate } from "../providers/nyFed";
import { fetchTgaBalanceHistory, type TgaBalancePoint } from "../providers/treasury";
import { cached, type CachedResult } from "./cache";
import { loadAppConfig } from "../config/env";
import { insertObservationIfChanged, type KpiObservationInput } from "../db/kpiObservations";
import { rememberLatestValueFromObservation } from "../db/kpiLatestValues";
import { runTrackedIngestion } from "../db/ingestionRunner";
import { earliestIso, round, toObservationIso, unavailableOverride, type FamilyOverrideResult, type KpiOverride } from "./types";

// F8 Liquidity / Funding — source-decisions pass.
//
// TGA (f8-tga-level/f8-tga-daily): switched OFF FRED's WDTGAL proxy and ONTO
// the U.S. Treasury Fiscal Data's own Daily Treasury Statement, Operating
// Cash Balance dataset (`dts/operating_cash_balance`) — the direct official
// figure the product owner asked for, per DIRECT OFFICIAL > PROXY. No FRED
// fallback: a Treasury fetch failure makes both TGA KPIs UNAVAILABLE.
// Live-inspected this pass (see apps/backend/src/providers/treasury.ts's
// top-of-file comment on this dataset for the full writeup): the current
// account_type value is "Treasury General Account (TGA) Closing Balance"
// (an older "Federal Reserve Account" label is retired), and — a genuine
// schema quirk confirmed live, not assumed — `close_today_bal` is always
// null in this table; the real figure lives in `open_today_bal` regardless
// of the row's Opening/Closing wording. Because of that, the milestone
// brief's first candidate formula (`close_today_bal - open_today_bal`,
// same day) is not available; `f8-tga-daily` instead uses the documented
// fallback — latest "Closing Balance" reading minus the previous business
// day's "Closing Balance" reading — mirroring `f8-reserves-wow`'s existing
// day-over-day pattern.
//
// Reserves (f8-reserves-level/f8-reserves-wow): CORRECTED — switched from
// FRED `WRESBAL` to `WRBWFRBL`. Verified live against FRED's own series
// metadata: WRESBAL is "Reserve Balances with Federal Reserve Banks: Week
// Average" (a weekly AVERAGE), while WRBWFRBL is "...: Wednesday Level" (the
// actual point-in-time level as of Wednesday each week) — this was the
// specific trap flagged when the source was first chosen: a week-over-week
// change computed on a weekly average smooths over/masks the real point-to-
// point move, unlike TGA's daily change (a genuine level-to-level diff).
// WRBWFRBL is what f8-reserves-level/f8-reserves-wow now read; still bucketed
// "weekly" in apps/backend/src/cache/snapshotCache.ts's REAL_KPI_CADENCE
// (unchanged — still genuinely weekly-cadence, unlike TGA).
//
// SOFR-IORB / EFFR-IORB: both remain intrinsically DERIVED spreads.
// f8-sofr-iorb draws BOTH legs from FRED (SOFR, IORB) — genuinely
// single-provider, so it keeps a single `sourceTag: "FRED"` with no
// `sourceTags` array needed. f8-effr-iorb genuinely draws from TWO
// providers (NY Fed for EFFR, FRED for IORB) — this is the one that gets
// the new `sourceTags: ["NY_FED", "FRED"]` field (see
// packages/contracts/src/index.ts's `CanonicalKpi.sourceTags`), while
// `sourceTag` stays "NY_FED" as the existing primary/summary value for
// backward compatibility.
//
// f8-funding-microstate: unchanged NORMAL/ANOMALOUS ±5bps logic
// (FUNDING_ANOMALY_THRESHOLD_BPS below), still driven off the SOFR-IORB
// spread — verified still correct given the changes above (SOFR-IORB's own
// computation is untouched).
//
// retrievedAt bug fix: same pattern as real/f2Rates.ts — every KpiOverride
// below uses the ACTUAL fetch timestamp returned by `cached()`
// (`fetchedAtMs`), not `Date.now()` at request-serve time, so `retrievedAt`
// only advances when a genuine new fetch happened. For a derived (two-leg)
// KPI, the later of the two legs' fetch times is used (the earliest point at
// which the derived value could actually have been computed).
const FRED_TTL_MS = 60 * 60_000; // 1h — daily-cadence FRED series (SOFR, IORB)
const RESERVES_TTL_MS = 6 * 60 * 60_000; // 6h — WRESBAL is a weekly series
const EFFR_TTL_MS = 60 * 60_000; // 1h — daily-cadence NY Fed series
const TGA_TTL_MS = 60 * 60_000; // 1h — daily-cadence Treasury DTS series
const SOURCE_TAG_FRED = "FRED";
const SOURCE_TAG_NY_FED = "NY_FED";
const SOURCE_TAG_TREASURY = "US_TREASURY";

const RESERVES_SERIES = "WRBWFRBL";
const SOFR_SERIES = "SOFR";
const IORB_SERIES = "IORB";
const RESERVES_HISTORY_LIMIT = 5; // a few weekly points, enough for a WoW diff
const RATE_HISTORY_LIMIT = 3; // small safety margin over "just the latest"
const TGA_HISTORY_LIMIT = 5; // a few daily points, enough for a day-over-day diff across a weekend/holiday gap

/**
 * A funding spread within ±this many bps of zero is treated as "NORMAL"
 * money-market plumbing noise; anything wider is flagged "ANOMALOUS". This
 * is a presentation judgment call, not a precise financial threshold — SOFR
 * and EFFR both ordinarily trade a few bps either side of IORB, and a
 * double-digit-bps move is the kind of thing that shows up in Fed
 * commentary on money-market stress (e.g. September 2019's repo spike).
 */
const FUNDING_ANOMALY_THRESHOLD_BPS = 5;

function logFredFailure(seriesId: string, err: unknown): void {
  const detail =
    err instanceof FredApiError ? `[${err.code}] ${err.message}` : err instanceof Error ? err.message : String(err);
  console.error(`[real-data] F8 (FRED) fetch failed for series ${seriesId}: ${detail}`);
}

// ---------------------------------------------------------------------------
// MySQL persistence / ingestion tracking — same pattern as real/f2Rates.ts:
// runs only inside a fetcher passed to `cached()`, i.e. only on a genuine
// cache-miss real fetch, never on every HTTP request.
// ---------------------------------------------------------------------------

function isDbConfigured(): boolean {
  return loadAppConfig().db !== null;
}

async function persistObservation(input: KpiObservationInput): Promise<void> {
  if (!isDbConfigured()) return;
  try {
    await insertObservationIfChanged(input);
  } catch (err) {
    console.error(`[real-data] F8 failed to persist kpi_observations row for ${input.kpiId}:`, err instanceof Error ? err.message : err);
  }
  try {
    await rememberLatestValueFromObservation(input);
  } catch (err) {
    console.error(`[real-data] F8 failed to persist kpi_latest_values row for ${input.kpiId}:`, err instanceof Error ? err.message : err);
  }
}

async function trackedFetch<T>(jobKey: string, fetcher: () => Promise<T>): Promise<T> {
  if (!isDbConfigured()) return fetcher();
  return runTrackedIngestion(jobKey, fetcher);
}

/** Wraps a `cached()` call so no rejection (network throw, or a DB error surfacing through `runTrackedIngestion`) ever propagates out of this family's builder. */
async function safeCached<T>(promise: Promise<CachedResult<T | null>>, logLabel: string): Promise<CachedResult<T | null>> {
  try {
    return await promise;
  } catch (err) {
    console.error(`[real-data] F8 fetch failed for ${logLabel}:`, err instanceof Error ? err.message : err);
    return { value: null, fetchedAtMs: Date.now() };
  }
}

// Deliberately does NOT persist a kpi_observations row itself: every series
// this fetches (WRESBAL, SOFR, IORB) feeds a KPI value that needs its own
// unit conversion or cross-series combination (WRESBAL -> $B; SOFR/IORB ->
// a derived bps spread) before it matches what's actually shown — so
// persistence happens explicitly, once per KPI, at the point in
// `buildF8Overrides` below where that final value is computed. This avoids
// silently persisting a raw, unconverted provider unit under a KPI id whose
// canonical value is in different units.
async function fetchFredHistoryTracked(seriesId: string, limit: number): Promise<FredObservation[] | null> {
  return trackedFetch(`fred:${seriesId.toLowerCase()}`, async () => {
    try {
      const observations = await fetchLatestObservations(seriesId, limit);
      return observations.length > 0 ? observations : null;
    } catch (err) {
      logFredFailure(seriesId, err);
      return null;
    }
  });
}

async function fetchEffrTracked(): Promise<EffrRate | null> {
  return trackedFetch("nyFed:effr", async () => {
    try {
      const effr = await fetchEffrRate();
      // No KPI-level persistence here — EFFR alone isn't a canonical KPI
      // value in this family, only an input to f8-effr-iorb's derived
      // spread (persisted below once IORB is also known).
      return effr;
    } catch (err) {
      console.error("[real-data] F8 (NY Fed EFFR) fetch failed:", err instanceof Error ? err.message : err);
      return null;
    }
  });
}

async function fetchTgaHistoryTracked(): Promise<TgaBalancePoint[] | null> {
  return trackedFetch("treasury:dts-tga", async () => {
    const history = await fetchTgaBalanceHistory(TGA_HISTORY_LIMIT);
    const latest = history[0];
    if (latest) {
      await persistObservation({
        kpiId: "f8-tga-level",
        observationAt: new Date(latest.dateIso),
        retrievedAt: new Date(),
        numericValue: round(latest.closeBalanceMillions / 1000, 0),
        sourceTag: SOURCE_TAG_TREASURY,
        provenance: "observed",
      });
    }
    return history.length > 0 ? history : null;
  });
}

async function cachedFredHistory(seriesId: string, ttlMs: number, limit: number) {
  return safeCached(cached(`fred:${seriesId}`, ttlMs, () => fetchFredHistoryTracked(seriesId, limit)), `fred:${seriesId}`);
}

async function cachedEffr() {
  return safeCached(cached("nyFed:effr", EFFR_TTL_MS, fetchEffrTracked), "nyFed:effr");
}

async function cachedTgaHistory() {
  return safeCached(cached("treasury:dts-tga", TGA_TTL_MS, fetchTgaHistoryTracked), "treasury:dts-tga");
}

export async function buildF8Overrides(): Promise<FamilyOverrideResult> {
  const nowIso = new Date().toISOString();
  const kpiOverrides: Record<string, KpiOverride> = {};

  const [reservesResult, sofrResult, iorbResult, tgaResult, effrResult] = await Promise.all([
    cachedFredHistory(RESERVES_SERIES, RESERVES_TTL_MS, RESERVES_HISTORY_LIMIT),
    cachedFredHistory(SOFR_SERIES, FRED_TTL_MS, RATE_HISTORY_LIMIT),
    cachedFredHistory(IORB_SERIES, FRED_TTL_MS, RATE_HISTORY_LIMIT),
    cachedTgaHistory(),
    cachedEffr(),
  ]);

  const reservesHistory = reservesResult.value;
  const reservesRetrievedAtIso = new Date(reservesResult.fetchedAtMs).toISOString();
  const sofrHistory = sofrResult.value;
  const sofrRetrievedAtIso = new Date(sofrResult.fetchedAtMs).toISOString();
  const iorbHistory = iorbResult.value;
  const iorbRetrievedAtIso = new Date(iorbResult.fetchedAtMs).toISOString();
  const tgaHistory = tgaResult.value;
  const tgaRetrievedAtIso = new Date(tgaResult.fetchedAtMs).toISOString();
  const effr = effrResult.value;
  const effrRetrievedAtIso = new Date(effrResult.fetchedAtMs).toISOString();

  // --- TGA (level, $B) + day-over-day change — U.S. Treasury DTS, sole primary ---
  const tgaLatest = tgaHistory?.[0] ?? null;
  const tgaPrev = tgaHistory?.[1] ?? null;

  kpiOverrides["f8-tga-level"] = tgaLatest
    ? {
        value: round(tgaLatest.closeBalanceMillions / 1000, 0),
        sourceTag: SOURCE_TAG_TREASURY,
        dataState: "REAL",
        observationAtIso: tgaLatest.dateIso,
        retrievedAtIso: tgaRetrievedAtIso,
        provenance: "observed",
      }
    : unavailableOverride(nowIso);

  if (tgaLatest && tgaPrev) {
    const tgaDailyValue = round((tgaLatest.closeBalanceMillions - tgaPrev.closeBalanceMillions) / 1000, 0);
    kpiOverrides["f8-tga-daily"] = {
      value: tgaDailyValue,
      sourceTag: SOURCE_TAG_TREASURY,
      dataState: "REAL",
      observationAtIso: tgaLatest.dateIso,
      retrievedAtIso: tgaRetrievedAtIso,
      provenance: "derived",
    };
    await persistObservation({
      kpiId: "f8-tga-daily",
      observationAt: new Date(tgaLatest.dateIso),
      retrievedAt: new Date(tgaRetrievedAtIso),
      numericValue: tgaDailyValue,
      sourceTag: SOURCE_TAG_TREASURY,
      provenance: "derived",
    });
  } else {
    kpiOverrides["f8-tga-daily"] = unavailableOverride(nowIso);
  }

  // --- Reserves (level, $B) + WoW change — FRED WRBWFRBL (Wednesday level, not WRESBAL's weekly average) ---
  const reservesLatest = reservesHistory?.[0] ?? null;
  const reservesPrev = reservesHistory?.[1] ?? null;

  if (reservesLatest) {
    const reservesLevelValue = round(reservesLatest.value / 1000, 0);
    kpiOverrides["f8-reserves-level"] = {
      value: reservesLevelValue,
      sourceTag: SOURCE_TAG_FRED,
      dataState: "REAL",
      observationAtIso: toObservationIso(reservesLatest.date),
      retrievedAtIso: reservesRetrievedAtIso,
      provenance: "observed",
    };
    await persistObservation({
      kpiId: "f8-reserves-level",
      observationAt: new Date(toObservationIso(reservesLatest.date)),
      retrievedAt: new Date(reservesRetrievedAtIso),
      numericValue: reservesLevelValue,
      sourceTag: SOURCE_TAG_FRED,
      provenance: "observed",
    });
  } else {
    kpiOverrides["f8-reserves-level"] = unavailableOverride(nowIso);
  }

  if (reservesLatest && reservesPrev) {
    const reservesWowValue = round((reservesLatest.value - reservesPrev.value) / 1000, 0);
    kpiOverrides["f8-reserves-wow"] = {
      value: reservesWowValue,
      sourceTag: SOURCE_TAG_FRED,
      dataState: "REAL",
      observationAtIso: toObservationIso(reservesLatest.date),
      retrievedAtIso: reservesRetrievedAtIso,
      provenance: "derived",
    };
    await persistObservation({
      kpiId: "f8-reserves-wow",
      observationAt: new Date(toObservationIso(reservesLatest.date)),
      retrievedAt: new Date(reservesRetrievedAtIso),
      numericValue: reservesWowValue,
      sourceTag: SOURCE_TAG_FRED,
      provenance: "derived",
    });
  } else {
    kpiOverrides["f8-reserves-wow"] = unavailableOverride(nowIso);
  }

  // --- SOFR - IORB (bps) — both legs from FRED, single-provider spread ---
  const sofrLatest = sofrHistory?.[0] ?? null;
  const iorbLatest = iorbHistory?.[0] ?? null;

  let sofrIorbBps: number | null = null;
  if (sofrLatest && iorbLatest) {
    sofrIorbBps = round((sofrLatest.value - iorbLatest.value) * 100, 0);
    const sofrIorbRetrievedAtIso = sofrRetrievedAtIso > iorbRetrievedAtIso ? sofrRetrievedAtIso : iorbRetrievedAtIso;
    kpiOverrides["f8-sofr-iorb"] = {
      value: sofrIorbBps,
      sourceTag: SOURCE_TAG_FRED,
      dataState: "REAL",
      observationAtIso: earliestIso([toObservationIso(sofrLatest.date), toObservationIso(iorbLatest.date)]),
      retrievedAtIso: sofrIorbRetrievedAtIso,
      provenance: "derived",
    };
    await persistObservation({
      kpiId: "f8-sofr-iorb",
      observationAt: new Date(kpiOverrides["f8-sofr-iorb"].observationAtIso),
      retrievedAt: new Date(sofrIorbRetrievedAtIso),
      numericValue: sofrIorbBps,
      sourceTag: SOURCE_TAG_FRED,
      provenance: "derived",
    });
  } else {
    kpiOverrides["f8-sofr-iorb"] = unavailableOverride(nowIso);
  }

  // --- EFFR - IORB (bps) — EFFR from NY Fed, IORB from FRED: genuinely
  // two-provider, so this KPI carries `sourceTags` alongside `sourceTag`.
  if (effr && iorbLatest) {
    const effrIorbBps = round((effr.rate - iorbLatest.value) * 100, 0);
    const effrIorbRetrievedAtIso = effrRetrievedAtIso > iorbRetrievedAtIso ? effrRetrievedAtIso : iorbRetrievedAtIso;
    kpiOverrides["f8-effr-iorb"] = {
      value: effrIorbBps,
      sourceTag: SOURCE_TAG_NY_FED,
      sourceTags: [SOURCE_TAG_NY_FED, SOURCE_TAG_FRED],
      dataState: "REAL",
      observationAtIso: earliestIso([effr.effectiveDateIso, toObservationIso(iorbLatest.date)]),
      retrievedAtIso: effrIorbRetrievedAtIso,
      provenance: "derived",
    };
    await persistObservation({
      kpiId: "f8-effr-iorb",
      observationAt: new Date(kpiOverrides["f8-effr-iorb"].observationAtIso),
      retrievedAt: new Date(effrIorbRetrievedAtIso),
      numericValue: effrIorbBps,
      sourceTag: SOURCE_TAG_NY_FED,
      provenance: "derived",
    });
  } else {
    kpiOverrides["f8-effr-iorb"] = unavailableOverride(nowIso);
  }

  // --- Funding microstate sentinel (driverSummary only; `value` always stays null, per fixture) ---
  if (sofrIorbBps != null) {
    kpiOverrides["f8-funding-microstate"] = {
      value: null,
      sourceTag: SOURCE_TAG_FRED,
      dataState: "REAL",
      observationAtIso: kpiOverrides["f8-sofr-iorb"].observationAtIso,
      retrievedAtIso: kpiOverrides["f8-sofr-iorb"].retrievedAtIso,
      provenance: "derived",
      driverSummary: Math.abs(sofrIorbBps) <= FUNDING_ANOMALY_THRESHOLD_BPS ? "NORMAL" : "ANOMALOUS",
    };
  } else {
    // Real inputs unavailable — explicitly clear the fixture's static
    // "NORMAL" mock sentinel rather than let it linger as an unearned claim.
    kpiOverrides["f8-funding-microstate"] = { ...unavailableOverride(nowIso), driverSummary: null };
  }

  return { kpiOverrides };
}
