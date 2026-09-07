import { loadAppConfig } from "../config/env";
import type { ProviderDefinition, SmokeTestResult } from "./types";
import { fetchJson, elapsedMs } from "./httpClient";
import { buildProviderStatus, recordSmokeTestOutcome } from "./statusHelpers";

// BLS (api.bls.gov) — F4 Inflation, F5 Employment. A key is OPTIONAL for
// single-series unauthenticated GET (VERIFIED — works without a key); a
// free registration key raises limits and unlocks multi-series/POST. Unlike
// every other credentialed provider in this registry, BLS's adapter works
// (and its smoke test runs and can PASS) with no key at all — `configured`
// here means "a key is present for higher limits," not "required to
// function." See docs/PROVIDER_SETUP.md.
const PROVIDER_ID = "bls";
const DISPLAY_NAME = "BLS (Bureau of Labor Statistics)";
const BASE_URL = "https://api.bls.gov/publicAPI/v2/timeseries/data";

/** A representative sample series used only for the smoke test. */
const SMOKE_TEST_SERIES_ID = "LNS14000000";

interface BlsTimeseriesResponse {
  status: string;
  Results?: {
    series?: Array<{
      seriesID: string;
      data: Array<{ year: string; period: string; periodName?: string; value: string }>;
    }>;
  };
}

function isConfigured(): boolean {
  return loadAppConfig().providers.bls !== null;
}

function buildUrl(seriesId: string, apiKey?: string): string {
  const url = `${BASE_URL}/${seriesId}`;
  if (!apiKey) return url;
  const params = new URLSearchParams({ registrationkey: apiKey });
  return `${url}?${params.toString()}`;
}

async function runSmokeTest(): Promise<SmokeTestResult> {
  const config = loadAppConfig().providers.bls;
  const startedAt = performance.now();
  try {
    const res = await fetchJson<BlsTimeseriesResponse>(buildUrl(SMOKE_TEST_SERIES_ID, config?.apiKey));
    const latencyMs = elapsedMs(startedAt);

    const series = res.body?.Results?.series?.[0];
    const observation = series?.data?.[0];
    const found = res.ok && res.body?.status === "REQUEST_SUCCEEDED" && !!observation;

    recordSmokeTestOutcome({
      providerId: PROVIDER_ID,
      status: found ? "CONNECTED" : "ERROR",
      markSuccessfulRequest: found,
      latencyMs,
      errorCode: found ? null : "SERIES_NOT_FOUND",
      safeErrorMessage: found ? null : "series id not confirmed or request rejected",
    });

    return {
      configured: config !== null,
      auth: config ? (found ? "PASS" : "FAIL") : "N/A",
      request: res.ok ? "PASS" : "FAIL",
      capabilities: [{ label: `SERIES: ${SMOKE_TEST_SERIES_ID} — FOUND`, result: found ? "PASS" : "FAIL" }],
      sampleValue: found
        ? `${SMOKE_TEST_SERIES_ID} = ${observation!.value} (${observation!.periodName ?? observation!.period} ${observation!.year})`
        : null,
      latencyMs,
      result: found ? "PASS" : "FAIL",
      safeReason: found ? null : "series id not confirmed or request rejected",
    };
  } catch (err) {
    const latencyMs = elapsedMs(startedAt);
    const safeReason = "network request failed or timed out";
    recordSmokeTestOutcome({
      providerId: PROVIDER_ID,
      status: "ERROR",
      markSuccessfulRequest: false,
      latencyMs,
      errorCode: "NETWORK_ERROR",
      safeErrorMessage: safeReason,
    });
    return {
      configured: config !== null,
      auth: config ? "FAIL" : "N/A",
      request: "FAIL",
      capabilities: [{ label: `SERIES: ${SMOKE_TEST_SERIES_ID}`, result: "FAIL" }],
      sampleValue: null,
      latencyMs,
      result: "FAIL",
      safeReason,
    };
  }
}

// ---------------------------------------------------------------------------
// Milestone 2B — real data-fetching function (F4 Inflation, F5 Employment).
// Reuses `buildUrl`/`isConfigured` above. VERIFIED live: the unauthenticated
// single-series endpoint returns ~20-30 monthly observations by default
// (well over the 13-14 months needed for MoM/YoY/3M-annualized), in
// reverse-chronological order (index 0 = latest). A handful of 2025-10
// observations return `"value": "-"` with a footnote ("lapse in
// appropriations") — this is surfaced as `value: null` here rather than
// silently coerced to 0 or dropped from the array (dropping would corrupt
// the fixed monthly-index lookback used for YoY/3M-annualized math).
// ---------------------------------------------------------------------------

export interface BlsObservation {
  year: string;
  /** BLS period code, e.g. "M07" for July. */
  period: string;
  /** `null` when BLS reports a non-numeric placeholder (e.g. "-") for this month. */
  value: number | null;
}

const NUMERIC_PATTERN = /^-?\d+(\.\d+)?$/;

/** Returns `null` on any network/shape failure; never throws. */
export async function fetchSeriesHistory(seriesId: string, apiKey?: string): Promise<BlsObservation[] | null> {
  const res = await fetchJson<BlsTimeseriesResponse>(buildUrl(seriesId, apiKey));
  if (!res.ok || !res.body || res.body.status !== "REQUEST_SUCCEEDED") return null;
  const series = res.body.Results?.series?.find((s) => s.seriesID === seriesId) ?? res.body.Results?.series?.[0];
  if (!series || !Array.isArray(series.data)) return null;

  return series.data.map((observation) => ({
    year: observation.year,
    period: observation.period,
    value: NUMERIC_PATTERN.test(observation.value) ? Number(observation.value) : null,
  }));
}

// ---------------------------------------------------------------------------
// Bug A follow-up pass — BLS v2 POST timeseries/data with `calculations:
// true`, LIVE-VERIFIED (not assumed) against CUSR0000SA0L1E, CUSR0000SA0,
// CES0000000001, LNS14000000, CES0500000003, and WPSFD4. Findings:
//   - Index-type series (CPI core/headline, PPI final demand) NEVER get
//     `net_changes` from BLS ("BLS does not produce net change calculations
//     for Series ...") but DO get exact `pct_changes` for the 1/3/6/12-month
//     lookbacks — e.g. CUSR0000SA0L1E's 12-month pct_change for 2026-07 was
//     confirmed live at 2.5, and CUSR0000SA0's at 3.3 — this is Bug A's
//     actual fix target (the app was showing 2.8/3.5, computed via array-
//     offset lookback rather than this exact BLS-native figure or an
//     exact-calendar-period derivation).
//   - Level-type series (nonfarm payrolls, AHE) get BOTH `net_changes` (a
//     real level delta, e.g. payrolls' 1-month net_change) and `pct_changes`.
// A registration key is required in practice for any meaningful daily
// volume on the multi-series POST endpoint (unauthenticated POST has a much
// lower daily quota) — this project always has BLS_API_KEY configured.
// ---------------------------------------------------------------------------

export type BlsCalcLookback = "1" | "3" | "6" | "12";

export interface BlsCalculations {
  netChanges: Partial<Record<BlsCalcLookback, number>>;
  pctChanges: Partial<Record<BlsCalcLookback, number>>;
}

/** One observation plus BLS's own `calculations` block, when the POST request asked for one — `calculations: null` means BLS returned no calculations object at all for this row (distinct from an empty/partial one). */
export interface BlsObservationWithCalculations extends BlsObservation {
  calculations: BlsCalculations | null;
}

interface BlsCalcSeriesResponse {
  seriesID: string;
  data?: Array<{
    year: string;
    period: string;
    value: string;
    calculations?: {
      net_changes?: Record<string, string>;
      pct_changes?: Record<string, string>;
    };
  }>;
}

interface BlsCalcApiResponse {
  status: string;
  message?: string[];
  Results?: { series?: BlsCalcSeriesResponse[] };
}

const CALC_LOOKBACKS: readonly BlsCalcLookback[] = ["1", "3", "6", "12"];

function parseCalcMap(raw: Record<string, string> | undefined): Partial<Record<BlsCalcLookback, number>> {
  const out: Partial<Record<BlsCalcLookback, number>> = {};
  if (!raw) return out;
  for (const key of CALC_LOOKBACKS) {
    const value = raw[key];
    if (value != null && NUMERIC_PATTERN.test(value)) out[key] = Number(value);
  }
  return out;
}

/**
 * BLS v2 POST timeseries/data with `calculations: true` for one or more
 * series at once. Unlike `fetchSeriesHistory` above (which returns `null` on
 * failure, an older convention in this file), this THROWS a descriptive
 * Error on any failure — matching providers/fred.ts's more recent pattern —
 * so callers (real/f4Inflation.ts, real/f5Employment.ts, both via
 * real/blsMonthly.ts's resolvePctChange/resolveNetChange) can cleanly
 * distinguish "BLS's own calculation is usable directly" (provenance
 * "observed") from "fall back to an explicit calendar-period-matched
 * derivation from the raw values" (provenance "derived") without silently
 * treating a fetch failure as "no calculations available."
 */
export async function fetchSeriesHistoryWithCalculations(
  seriesIds: string[],
  apiKey: string | undefined,
  yearsBack: number = 2
): Promise<Record<string, BlsObservationWithCalculations[]>> {
  const currentYear = new Date().getUTCFullYear();
  const body: Record<string, unknown> = {
    seriesid: seriesIds,
    startyear: String(currentYear - yearsBack),
    endyear: String(currentYear),
    calculations: true,
  };
  if (apiKey) body.registrationkey = apiKey;

  const res = await fetchJson<BlsCalcApiResponse>(`${BASE_URL}/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok || !res.body || res.body.status !== "REQUEST_SUCCEEDED") {
    throw new Error(
      `BLS calculations POST failed for [${seriesIds.join(", ")}] (http=${res.status}, status=${res.body?.status ?? "n/a"}, message=${res.body?.message?.join("; ") ?? "n/a"})`
    );
  }

  const seriesList = res.body.Results?.series;
  if (!Array.isArray(seriesList) || seriesList.length === 0) {
    throw new Error(`BLS calculations POST for [${seriesIds.join(", ")}] returned no series data`);
  }

  const out: Record<string, BlsObservationWithCalculations[]> = {};
  for (const series of seriesList) {
    if (!Array.isArray(series.data)) continue;
    out[series.seriesID] = series.data.map((obs) => ({
      year: obs.year,
      period: obs.period,
      value: NUMERIC_PATTERN.test(obs.value) ? Number(obs.value) : null,
      calculations: obs.calculations
        ? { netChanges: parseCalcMap(obs.calculations.net_changes), pctChanges: parseCalcMap(obs.calculations.pct_changes) }
        : null,
    }));
  }
  return out;
}

export const blsProvider: ProviderDefinition = {
  id: PROVIDER_ID,
  displayName: DISPLAY_NAME,
  capability:
    "F4 Inflation, F5 Employment — timeseries/data single-series GET (CUUR0000SA0, CUSR0000SA0, CUUR0000SA0L1E, CUSR0000SA0L1E, LNS14000000, CES0000000001) plus multi-series POST with calculations:true (live-verified — see fetchSeriesHistoryWithCalculations). Key optional for GET — unauthenticated single-series GET works; a free key raises limits and is required in practice for POST at any real volume.",
  requiresCredential: false,
  isConfigured,
  getStatus: () =>
    buildProviderStatus({
      providerId: PROVIDER_ID,
      displayName: DISPLAY_NAME,
      configured: isConfigured(),
      environment: null,
      notConfiguredMessage: null,
      credentialRequiredToOperate: false,
    }),
  runSmokeTest,
};
