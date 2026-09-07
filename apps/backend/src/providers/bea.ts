import { loadAppConfig } from "../config/env";
import type { ProviderDefinition, SmokeTestResult } from "./types";
import { fetchJson, elapsedMs } from "./httpClient";
import { buildProviderStatus, recordSmokeTestOutcome } from "./statusHelpers";

// BEA (apps.bea.gov/api) — F4 Inflation (PCE). API key required, free
// self-serve signup.
//
// The PCE table id is now CONFIRMED live: a real GetParameterValues call
// enumerated 253 real NIPA table ids, and "T20804" (Table 2.8.4 — "Price
// Indexes for Personal Consumption Expenditures by Major Type of Product,
// Monthly") was the prior research pass's guess, now verified correct —
// GetData against T20804 returns real, current monthly index values, with
// LineNumber "1" = headline PCE price index and LineNumber "25" =
// "PCE excluding food and energy" (core PCE price index). See
// fetchNipaMonthlyTableData below and apps/backend/src/real/f4Inflation.ts,
// and docs/PROVIDER_SETUP.md.
const PROVIDER_ID = "bea";
const DISPLAY_NAME = "BEA (Bureau of Economic Analysis)";
const BASE_URL = "https://apps.bea.gov/api/data/";

interface BeaGetParameterValuesResponse {
  BEAAPI?: {
    Results?: {
      ParamValue?: Array<{ TableName?: string; Description?: string; Key?: string }>;
      Error?: { APIErrorCode?: string; APIErrorDescription?: string };
    };
  };
}

/** CONFIRMED live (see top-of-file comment) — Table 2.8.4, monthly PCE price indexes. Line 1 = headline, line 25 = "PCE excluding food and energy" (core). */
export const PCE_TABLE_ID = "T20804";
export const PCE_HEADLINE_LINE_NUMBER = "1";
export const PCE_CORE_LINE_NUMBER = "25";

/**
 * CONFIRMED live via a direct GetData pull (accuracy-investigation pass,
 * 2026-08-30) — Table 2.8.7, "Percent Change From Preceding Period in
 * Prices for Personal Consumption Expenditures by Major Type of Product,
 * Monthly." BEA publishes this MoM percent change ALREADY COMPUTED (line
 * numbers match T20804: line 1 = headline, line 25 = core) — this is BEA's
 * own official figure, the one financial media quote, and it is NOT always
 * reproducible by re-deriving from T20804's *published* (3-decimal-rounded)
 * index and rounding to 2dp: e.g. for 2026M07 core PCE, T20804's rounded
 * index gives (130.658/130.338-1)*100 = 0.2455% -> naively rounds to 0.25%,
 * while T20807 reports the official 0.2% for the same month (BEA computes
 * the percent change from unrounded internal index values, not the
 * published rounded ones). Re-deriving from the rounded index and rounding
 * to 1dp (matching this table's own precision) happens to reproduce T20807
 * exactly across the 8 most recent months checked, but reading T20807
 * directly is strictly more accurate/authoritative and removes any
 * possibility of that mismatch recurring in a month where it wouldn't.
 * There is no equivalent official *year-over-year* percent-change-in-
 * prices table at monthly frequency (2.8.11 is the closest by name but
 * covers REAL/volume PCE, not the price index) — YoY PCE inflation stays
 * index-derived from T20804.
 */
export const PCE_PCT_CHANGE_TABLE_ID = "T20807";

interface BeaGetDataResponse {
  BEAAPI?: {
    Results?: {
      Data?: Array<{ TimePeriod?: string; LineNumber?: string; DataValue?: string }>;
      Error?: { APIErrorCode?: string; APIErrorDescription?: string };
    };
  };
}

/** One (TimePeriod, LineNumber) cell from a BEA NIPA GetData response. `timePeriod` is BEA's monthly format, e.g. "2026M07". */
export interface BeaDataPoint {
  timePeriod: string;
  lineNumber: string;
  dataValue: number;
}

function isConfigured(): boolean {
  return loadAppConfig().providers.bea !== null;
}

function buildGetParameterValuesUrl(apiKey: string): string {
  const params = new URLSearchParams({
    UserID: apiKey,
    method: "GetParameterValues",
    datasetname: "NIPA",
    ParameterName: "TableName",
    ResultFormat: "json",
  });
  return `${BASE_URL}?${params.toString()}`;
}

function buildGetDataUrl(apiKey: string, tableName: string, years: string[]): string {
  const params = new URLSearchParams({
    UserID: apiKey,
    method: "GetData",
    datasetname: "NIPA",
    TableName: tableName,
    Frequency: "M",
    Year: years.join(","),
    ResultFormat: "json",
  });
  return `${BASE_URL}?${params.toString()}`;
}

// ---------------------------------------------------------------------------
// Real data-fetching function (F4 Inflation — PCE). VERIFIED live per the
// top-of-file comment. Returns `null` on any failure (not configured,
// network error, malformed response) rather than throwing — matches the
// BLS adapter's convention (apps/backend/src/providers/bls.ts), which
// apps/backend/src/real/f4Inflation.ts's try/catch-per-fetch pattern
// already expects.
// ---------------------------------------------------------------------------
export async function fetchNipaMonthlyTableData(tableName: string, years: string[]): Promise<BeaDataPoint[] | null> {
  const config = loadAppConfig().providers.bea;
  if (!config) return null;

  const res = await fetchJson<BeaGetDataResponse>(buildGetDataUrl(config.apiKey, tableName, years));
  if (!res.ok || res.body?.BEAAPI?.Results?.Error) return null;

  const rows = res.body?.BEAAPI?.Results?.Data;
  if (!Array.isArray(rows)) return null;

  const points: BeaDataPoint[] = [];
  for (const row of rows) {
    if (!row.TimePeriod || !row.LineNumber || row.DataValue == null) continue;
    const value = Number(row.DataValue.replace(/,/g, ""));
    if (!Number.isFinite(value)) continue;
    points.push({ timePeriod: row.TimePeriod, lineNumber: row.LineNumber, dataValue: value });
  }
  return points;
}

async function runSmokeTest(): Promise<SmokeTestResult> {
  const config = loadAppConfig().providers.bea;
  if (!config) {
    return {
      configured: false,
      auth: "N/A",
      request: "N/A",
      capabilities: [{ label: "PCE TABLE DISCOVERY (GetParameterValues)", result: "N/A" }],
      sampleValue: null,
      latencyMs: null,
      result: "NOT_CONFIGURED",
      safeReason: "BEA_API_KEY is not set",
    };
  }

  const startedAt = performance.now();
  try {
    const res = await fetchJson<BeaGetParameterValuesResponse>(buildGetParameterValuesUrl(config.apiKey));
    const latencyMs = elapsedMs(startedAt);

    const apiError = res.body?.BEAAPI?.Results?.Error;
    const authFailed = !res.ok || !!apiError;

    if (authFailed) {
      recordSmokeTestOutcome({
        providerId: PROVIDER_ID,
        status: "ERROR",
        markSuccessfulRequest: false,
        latencyMs,
        errorCode: apiError?.APIErrorCode ?? "REQUEST_FAILED",
        safeErrorMessage: "authentication rejected or GetParameterValues call failed",
      });
      return {
        configured: true,
        auth: "FAIL",
        request: "FAIL",
        capabilities: [{ label: "PCE TABLE DISCOVERY (GetParameterValues)", result: "FAIL" }],
        sampleValue: null,
        latencyMs,
        result: "FAIL",
        safeReason: "authentication rejected or GetParameterValues call failed",
      };
    }

    const tableCount = res.body?.BEAAPI?.Results?.ParamValue?.length ?? 0;

    // Auth + parameter discovery both worked. Now confirm the PCE table
    // itself (T20804, line 1 = headline PCE price index) actually returns
    // real data via GetData — this is genuinely confirmed live now (see the
    // top-of-file comment), so a successful GetData pull is a real PASS,
    // not a fabricated one.
    const currentYear = new Date().getUTCFullYear();
    const points = await fetchNipaMonthlyTableData(PCE_TABLE_ID, [String(currentYear - 1), String(currentYear)]);
    const headlinePoint = points?.find((p) => p.lineNumber === PCE_HEADLINE_LINE_NUMBER);
    const found = !!headlinePoint;

    recordSmokeTestOutcome({
      providerId: PROVIDER_ID,
      status: found ? "CONNECTED" : "ERROR",
      markSuccessfulRequest: found,
      latencyMs,
      errorCode: found ? null : "SERIES_NOT_FOUND",
      safeErrorMessage: found ? null : `GetData for table ${PCE_TABLE_ID} returned no usable headline PCE line`,
    });

    return {
      configured: true,
      auth: "PASS",
      request: "PASS",
      capabilities: [
        { label: `PCE TABLE DISCOVERY (GetParameterValues) — ${tableCount} NIPA tables enumerated`, result: "PASS" },
        {
          label: `TABLE ${PCE_TABLE_ID} GetData — line ${PCE_HEADLINE_LINE_NUMBER} (headline PCE price index)`,
          result: found ? "PASS" : "FAIL",
        },
      ],
      sampleValue: headlinePoint
        ? `${PCE_TABLE_ID} line ${PCE_HEADLINE_LINE_NUMBER} (${headlinePoint.timePeriod}) = ${headlinePoint.dataValue}`
        : null,
      latencyMs,
      result: found ? "PASS" : "FAIL",
      safeReason: found ? null : `GetData for table ${PCE_TABLE_ID} returned no usable headline PCE line`,
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
      configured: true,
      auth: "FAIL",
      request: "FAIL",
      capabilities: [{ label: "PCE TABLE DISCOVERY (GetParameterValues)", result: "FAIL" }],
      sampleValue: null,
      latencyMs,
      result: "FAIL",
      safeReason,
    };
  }
}

export const beaProvider: ProviderDefinition = {
  id: PROVIDER_ID,
  displayName: DISPLAY_NAME,
  capability:
    "F4 Inflation (PCE) — NIPA dataset via GetData, table T20804 (Table 2.8.4, monthly PCE price indexes) confirmed live: line 1 = headline PCE, line 25 = core PCE. API key required.",
  requiresCredential: true,
  isConfigured,
  getStatus: () =>
    buildProviderStatus({
      providerId: PROVIDER_ID,
      displayName: DISPLAY_NAME,
      configured: isConfigured(),
      environment: null,
      notConfiguredMessage: "BEA_API_KEY is not set",
    }),
  runSmokeTest,
};
