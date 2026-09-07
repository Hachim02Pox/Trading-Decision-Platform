import type { ProviderDefinition, SmokeTestResult } from "./types";
import { fetchJson, elapsedMs } from "./httpClient";
import { buildProviderStatus, recordSmokeTestOutcome } from "./statusHelpers";

// NY Fed Markets Data API — F8 Liquidity/Funding. No API key required
// (VERIFIED live in the research pass). See docs/PROVIDER_SETUP.md.
const PROVIDER_ID = "nyFed";
const DISPLAY_NAME = "NY Fed Markets Data";
const SECURED_RATES_URL = "https://markets.newyorkfed.org/api/rates/secured/all/latest.json";
const UNSECURED_RATES_URL = "https://markets.newyorkfed.org/api/rates/unsecured/all/latest.json";

interface SecuredRatesResponse {
  refRates: Array<{ type: string; percentRate?: number; effectiveDate: string }>;
}

interface UnsecuredRatesResponse {
  refRates: Array<{
    type: string;
    percentRate?: number;
    targetRateFrom?: number;
    targetRateTo?: number;
    effectiveDate: string;
  }>;
}

export interface EffrRate {
  rate: number;
  /** ISO date the EFFR reading is effective as of (UTC midnight). */
  effectiveDateIso: string;
}

async function runSmokeTest(): Promise<SmokeTestResult> {
  const startedAt = performance.now();
  try {
    const res = await fetchJson<SecuredRatesResponse>(SECURED_RATES_URL);
    const latencyMs = elapsedMs(startedAt);

    const sofr = res.body?.refRates?.find((r) => r.type === "SOFR");
    const found = res.ok && !!sofr && typeof sofr.percentRate === "number";

    recordSmokeTestOutcome({
      providerId: PROVIDER_ID,
      status: found ? "CONNECTED" : "ERROR",
      markSuccessfulRequest: found,
      latencyMs,
      errorCode: found ? null : "SERIES_NOT_FOUND",
      safeErrorMessage: found ? null : "SOFR entry not present in rates/secured/all/latest.json response",
    });

    return {
      configured: true,
      auth: "N/A",
      request: res.ok ? "PASS" : "FAIL",
      capabilities: [{ label: "SERIES: SOFR (secured rates)", result: found ? "PASS" : "FAIL" }],
      sampleValue: found ? `SOFR = ${sofr!.percentRate}% (effective ${sofr!.effectiveDate})` : null,
      latencyMs,
      result: found ? "PASS" : "FAIL",
      safeReason: found ? null : "SOFR entry not present in the latest secured-rates response",
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
      auth: "N/A",
      request: "FAIL",
      capabilities: [{ label: "SERIES: SOFR (secured rates)", result: "FAIL" }],
      sampleValue: null,
      latencyMs,
      result: "FAIL",
      safeReason,
    };
  }
}

// ---------------------------------------------------------------------------
// Milestone 2B — real data-fetching function (F3 Fed / Rate Pricing, target
// range only). VERIFIED live: rates/unsecured/all/latest.json's EFFR entry
// carries `targetRateFrom`/`targetRateTo` fields alongside the rate itself —
// the FOMC target range is not a separate endpoint.
// ---------------------------------------------------------------------------

export interface TargetRange {
  lower: number;
  upper: number;
  /** ISO date the EFFR/target-range reading is effective as of (UTC midnight). */
  effectiveDateIso: string;
}

export async function fetchTargetRange(): Promise<TargetRange | null> {
  const res = await fetchJson<UnsecuredRatesResponse>(UNSECURED_RATES_URL);
  if (!res.ok || !res.body || !Array.isArray(res.body.refRates)) return null;
  const effr = res.body.refRates.find((r) => r.type === "EFFR");
  if (!effr || typeof effr.targetRateFrom !== "number" || typeof effr.targetRateTo !== "number" || !effr.effectiveDate) {
    return null;
  }
  return {
    lower: effr.targetRateFrom,
    upper: effr.targetRateTo,
    effectiveDateIso: new Date(effr.effectiveDate).toISOString(),
  };
}

/**
 * Fetches the EFFR (Effective Federal Funds Rate) print itself — VERIFIED
 * live: the same `rates/unsecured/all/latest.json` entry used by
 * `fetchTargetRange` above also carries `percentRate` (e.g. 3.63). Added for
 * F8's `f8-effr-iorb` (EFFR minus IORB) so that calculation reuses this
 * already-integrated endpoint rather than guessing at a second source.
 */
export async function fetchEffrRate(): Promise<EffrRate | null> {
  const res = await fetchJson<UnsecuredRatesResponse>(UNSECURED_RATES_URL);
  if (!res.ok || !res.body || !Array.isArray(res.body.refRates)) return null;
  const effr = res.body.refRates.find((r) => r.type === "EFFR");
  if (!effr || typeof effr.percentRate !== "number" || !effr.effectiveDate) return null;
  return { rate: effr.percentRate, effectiveDateIso: new Date(effr.effectiveDate).toISOString() };
}

export const nyFedProvider: ProviderDefinition = {
  id: PROVIDER_ID,
  displayName: DISPLAY_NAME,
  capability:
    "F8 Liquidity/Funding — SOFR/SOFRAI/TGCR/BGCR (rates/secured), EFFR/OBFR (rates/unsecured), SOMA holdings summary, ON RRP operations. No API key required. Reserve balances are NOT here — see FRED's WRESBAL.",
  requiresCredential: false,
  isConfigured: () => true,
  getStatus: () =>
    buildProviderStatus({
      providerId: PROVIDER_ID,
      displayName: DISPLAY_NAME,
      configured: true,
      environment: null,
    }),
  runSmokeTest,
};
