import { loadAppConfig } from "../config/env";
import type { ProviderDefinition, SmokeTestResult } from "./types";
import { fetchJson, elapsedMs } from "./httpClient";
import { buildProviderStatus, recordSmokeTestOutcome } from "./statusHelpers";

// FRED (api.stlouisfed.org) — F2 Rates, F7 Risk, F8 Liquidity, F5 GDPNow.
// API key required (VERIFIED — unauthenticated call returns a clear 400).
// Series IDs are all VERIFIED live with the real key: VIXCLS, BAMLH0A0HYM2,
// SOFR, RRPONTSYD, WALCL, WRBWFRBL, GDPNOW, and IORB all returned real,
// current observations in this pass (IORB was explicitly re-verified per
// the milestone brief rather than assumed). See docs/PROVIDER_SETUP.md.
const PROVIDER_ID = "fred";
const DISPLAY_NAME = "FRED (St. Louis Fed)";
const BASE_URL = "https://api.stlouisfed.org/fred/series/observations";

/** A representative sample series used only for the smoke test. */
const SMOKE_TEST_SERIES_ID = "DGS10";

interface FredObservationsResponse {
  observations?: Array<{ date: string; value: string; realtime_start?: string }>;
  error_code?: number;
  error_message?: string;
}

function isConfigured(): boolean {
  return loadAppConfig().providers.fred !== null;
}

function buildUrl(seriesId: string, apiKey: string, limit: number = 1): string {
  const params = new URLSearchParams({
    series_id: seriesId,
    api_key: apiKey,
    file_type: "json",
    sort_order: "desc",
    limit: String(limit),
  });
  return `${BASE_URL}?${params.toString()}`;
}

async function runSmokeTest(): Promise<SmokeTestResult> {
  const config = loadAppConfig().providers.fred;
  if (!config) {
    return {
      configured: false,
      auth: "N/A",
      request: "N/A",
      capabilities: [{ label: `SERIES: ${SMOKE_TEST_SERIES_ID}`, result: "N/A" }],
      sampleValue: null,
      latencyMs: null,
      result: "NOT_CONFIGURED",
      safeReason: "FRED_API_KEY is not set",
    };
  }

  const startedAt = performance.now();
  try {
    const res = await fetchJson<FredObservationsResponse>(buildUrl(SMOKE_TEST_SERIES_ID, config.apiKey));
    const latencyMs = elapsedMs(startedAt);

    if (res.status === 400 || res.body?.error_code) {
      recordSmokeTestOutcome({
        providerId: PROVIDER_ID,
        status: "ERROR",
        markSuccessfulRequest: false,
        latencyMs,
        errorCode: "AUTH_REJECTED",
        safeErrorMessage: "authentication rejected",
      });
      return {
        configured: true,
        auth: "FAIL",
        request: "FAIL",
        capabilities: [{ label: `SERIES: ${SMOKE_TEST_SERIES_ID}`, result: "FAIL" }],
        sampleValue: null,
        latencyMs,
        result: "FAIL",
        safeReason: "authentication rejected",
      };
    }

    const observation = res.body?.observations?.[0];
    const found = res.ok && !!observation;

    recordSmokeTestOutcome({
      providerId: PROVIDER_ID,
      status: found ? "CONNECTED" : "ERROR",
      markSuccessfulRequest: found,
      latencyMs,
      errorCode: found ? null : "SERIES_NOT_FOUND",
      safeErrorMessage: found ? null : "series id not confirmed",
    });

    return {
      configured: true,
      auth: "PASS",
      request: res.ok ? "PASS" : "FAIL",
      capabilities: [{ label: `SERIES: ${SMOKE_TEST_SERIES_ID} — FOUND`, result: found ? "PASS" : "FAIL" }],
      sampleValue: found ? `${SMOKE_TEST_SERIES_ID} = ${observation!.value} (as of ${observation!.date})` : null,
      latencyMs,
      result: found ? "PASS" : "FAIL",
      safeReason: found ? null : "series id not confirmed",
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
      capabilities: [{ label: `SERIES: ${SMOKE_TEST_SERIES_ID}`, result: "FAIL" }],
      sampleValue: null,
      latencyMs,
      result: "FAIL",
      safeReason,
    };
  }
}

/**
 * Fetches the latest observation for a FRED series. Real, callable client
 * function — NOT wired into the KPI-intelligence generation path this
 * milestone (that stays fully mock, per DataMode). Returns null if FRED is
 * not configured or the request fails, rather than throwing. Kept for
 * backward compatibility with its original (string value, null-on-failure)
 * shape; internally now a thin wrapper over `fetchLatestObservations`.
 */
export async function fetchLatestFredObservation(
  seriesId: string
): Promise<{ date: string; value: string } | null> {
  const config = loadAppConfig().providers.fred;
  if (!config) return null;
  try {
    const [latest] = await fetchLatestObservations(seriesId, 1);
    return latest ? { date: latest.date, value: String(latest.value) } : null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Milestone 2C — F2 Rates real-data integration. `fetchLatestObservations`
// is the function apps/backend/src/real/f2Rates.ts uses to source DGS2,
// DGS10, and DFII10. Unlike `fetchLatestFredObservation` above (which
// swallows every failure into `null`, appropriate for a best-effort smoke
// test helper), this function THROWS a specific `FredApiError` on every
// failure mode so the caller can distinguish "not configured" / "auth
// rejected" / "network failure" / "malformed response" and produce an
// honest UNAVAILABLE state rather than crashing or fabricating a value.
// ---------------------------------------------------------------------------

export type FredApiErrorCode = "NOT_CONFIGURED" | "AUTH_REJECTED" | "NETWORK_ERROR" | "API_ERROR" | "MALFORMED_RESPONSE";

export class FredApiError extends Error {
  readonly code: FredApiErrorCode;
  constructor(code: FredApiErrorCode, message: string) {
    super(message);
    this.name = "FredApiError";
    this.code = code;
  }
}

export interface FredObservation {
  /** ISO date (YYYY-MM-DD) of this observation, as published by FRED. */
  date: string;
  value: number;
  /**
   * FRED's `realtime_start` (YYYY-MM-DD) — when this specific vintage of the
   * value was published/last revised. For most series this tracks `date`
   * closely, but for a series like GDPNOW, `date` is the *target quarter's*
   * start (not a publication date) while `realtime_start` is the actual
   * as-of day of this reading — the field a freshness check should use for
   * such series. See apps/backend/src/real/f5Employment.ts.
   */
  realtimeStart?: string;
}

/**
 * Fetches up to `limit` most-recent observations for `seriesId` (newest
 * first, via `sort_order=desc`), filtering out FRED's "." sentinel for
 * missing/non-trading-day values and parsing the rest to numbers. Throws a
 * specific `FredApiError` (never a generic Error, never swallowed to null)
 * so callers in apps/backend/src/real/f2Rates.ts can mark the affected
 * KPI(s) UNAVAILABLE with a clear internal log line rather than crashing or
 * falling back to a stale/mock value.
 */
export async function fetchLatestObservations(seriesId: string, limit: number): Promise<FredObservation[]> {
  const config = loadAppConfig().providers.fred;
  if (!config) {
    throw new FredApiError("NOT_CONFIGURED", "FRED_API_KEY is not set");
  }

  let res: Awaited<ReturnType<typeof fetchJson<FredObservationsResponse>>>;
  try {
    res = await fetchJson<FredObservationsResponse>(buildUrl(seriesId, config.apiKey, limit));
  } catch (err) {
    throw new FredApiError(
      "NETWORK_ERROR",
      `network request to FRED failed for series ${seriesId}: ${err instanceof Error ? err.message : String(err)}`
    );
  }

  if (res.body?.error_code) {
    // FRED returns HTTP 400 + error_code 400 for both a bad/missing api_key
    // and a bad series_id; distinguish using error_message text since FRED
    // does not use a distinct error_code per cause.
    const message = res.body.error_message ?? "";
    const isAuthFailure = /api_key/i.test(message);
    throw new FredApiError(
      isAuthFailure ? "AUTH_REJECTED" : "API_ERROR",
      `FRED rejected the request for series ${seriesId} (error_code=${res.body.error_code}): ${message || "no error_message provided"}`
    );
  }

  if (!res.ok) {
    throw new FredApiError("API_ERROR", `FRED returned HTTP ${res.status} for series ${seriesId}`);
  }

  if (!res.body || !Array.isArray(res.body.observations)) {
    throw new FredApiError("MALFORMED_RESPONSE", `FRED response for series ${seriesId} had no observations array`);
  }

  // "." is FRED's documented sentinel for a missing/non-trading-day value —
  // filter it out rather than parsing it to NaN. Already newest-first thanks
  // to sort_order=desc, so no re-sort is needed.
  return res.body.observations
    .filter((obs) => obs.value !== ".")
    .map((obs) => ({ date: obs.date, value: Number(obs.value), realtimeStart: obs.realtime_start }))
    .filter((obs) => Number.isFinite(obs.value));
}

export const fredProvider: ProviderDefinition = {
  id: PROVIDER_ID,
  displayName: DISPLAY_NAME,
  capability:
    "F2 Rates, F7 Risk, F8 Liquidity, F5 GDPNow — series/observations (DGS2, DGS10, DFII10, VIXCLS, BAMLH0A0HYM2, SOFR, IORB, WRBWFRBL, GDPNOW; RRPONTSYD/WALCL enumerated but not currently wired to a KPI). API key required.",
  requiresCredential: true,
  isConfigured,
  getStatus: () =>
    buildProviderStatus({
      providerId: PROVIDER_ID,
      displayName: DISPLAY_NAME,
      configured: isConfigured(),
      environment: null,
      notConfiguredMessage: "FRED_API_KEY is not set",
    }),
  runSmokeTest,
};
