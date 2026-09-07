import type { ProviderDefinition, SmokeTestResult } from "./types";
import { fetchJson, elapsedMs } from "./httpClient";
import { buildProviderStatus, recordSmokeTestOutcome } from "./statusHelpers";

// CFTC Commitment of Traders (Socrata) — F10 Flows/Positioning. No API key
// required (VERIFIED live). Dataset 72hh-3qpy ("Disaggregated Futures
// Only") is the correct one — the Legacy report (6dca-aqww) has no Managed
// Money breakout. See docs/PROVIDER_SETUP.md.
const PROVIDER_ID = "cftc";
const DISPLAY_NAME = "CFTC Commitment of Traders";
const DATASET_URL = "https://publicreporting.cftc.gov/resource/72hh-3qpy.json";

interface CotRecord {
  report_date_as_yyyy_mm_dd: string;
  contract_market_name: string;
  m_money_positions_long_all: string;
  m_money_positions_short_all: string;
}

function buildQueryUrl(): string {
  const params = new URLSearchParams({
    $where: "contract_market_name='GOLD'",
    $order: "report_date_as_yyyy_mm_dd DESC",
    $limit: "1",
  });
  return `${DATASET_URL}?${params.toString()}`;
}

async function runSmokeTest(): Promise<SmokeTestResult> {
  const startedAt = performance.now();
  try {
    const res = await fetchJson<CotRecord[]>(buildQueryUrl());
    const latencyMs = elapsedMs(startedAt);

    const record = res.ok && Array.isArray(res.body) && res.body.length > 0 ? res.body[0] : null;
    const found = record !== null && typeof record.m_money_positions_long_all === "string";

    recordSmokeTestOutcome({
      providerId: PROVIDER_ID,
      status: found ? "CONNECTED" : "ERROR",
      markSuccessfulRequest: found,
      latencyMs,
      errorCode: found ? null : "SERIES_NOT_FOUND",
      safeErrorMessage: found ? null : "no GOLD contract_market_name record returned from dataset 72hh-3qpy",
    });

    return {
      configured: true,
      auth: "N/A",
      request: res.ok ? "PASS" : "FAIL",
      capabilities: [
        { label: "DATASET: 72hh-3qpy (Disaggregated Futures Only)", result: res.ok ? "PASS" : "FAIL" },
        { label: "INSTRUMENT: GOLD — Managed Money long/short", result: found ? "PASS" : "FAIL" },
      ],
      sampleValue: found
        ? `GOLD Managed Money long=${record!.m_money_positions_long_all} short=${record!.m_money_positions_short_all} (as of ${record!.report_date_as_yyyy_mm_dd})`
        : null,
      latencyMs,
      result: found ? "PASS" : "FAIL",
      safeReason: found ? null : "GOLD Managed Money record not found in the latest COT pull",
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
      capabilities: [{ label: "DATASET: 72hh-3qpy (Disaggregated Futures Only)", result: "FAIL" }],
      sampleValue: null,
      latencyMs,
      result: "FAIL",
      safeReason,
    };
  }
}

// ---------------------------------------------------------------------------
// Milestone 2B — real data-fetching function (F10 Flows/Positioning).
// VERIFIED live: dataset 72hh-3qpy DOES include a total-open-interest field
// (`open_interest_all`), so "Managed Money net % of total futures OI" is
// computable — per the task's explicit instruction, this would otherwise
// have to become UNAVAILABLE rather than estimated from elsewhere.
// ---------------------------------------------------------------------------

interface CotRecordFull {
  report_date_as_yyyy_mm_dd: string;
  open_interest_all?: string;
  m_money_positions_long_all?: string;
  m_money_positions_short_all?: string;
}

export interface CotReport {
  reportDateIso: string;
  openInterestAll: number | null;
  managedMoneyLong: number | null;
  managedMoneyShort: number | null;
}

function toNumberOrNull(raw: string | undefined): number | null {
  if (raw === undefined) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

/** Most recent `limit` weekly GOLD COT reports, newest first. Returns `null` on any network/shape failure; never throws. */
export async function fetchRecentGoldCotReports(limit: number): Promise<CotReport[] | null> {
  const params = new URLSearchParams({
    $where: "contract_market_name='GOLD'",
    $order: "report_date_as_yyyy_mm_dd DESC",
    $limit: String(limit),
  });
  const res = await fetchJson<CotRecordFull[]>(`${DATASET_URL}?${params.toString()}`);
  if (!res.ok || !Array.isArray(res.body)) return null;

  return res.body.map((record) => ({
    reportDateIso: new Date(record.report_date_as_yyyy_mm_dd).toISOString(),
    openInterestAll: toNumberOrNull(record.open_interest_all),
    managedMoneyLong: toNumberOrNull(record.m_money_positions_long_all),
    managedMoneyShort: toNumberOrNull(record.m_money_positions_short_all),
  }));
}

/**
 * Milestone 2C — F10's 156-week (~3 year) percentile KPI needs a longer
 * history than the 2-report window `fetchRecentGoldCotReports` fetches for
 * the existing net-%/WoW-Δ KPIs. Deliberately a SEPARATE function (not a
 * bigger shared `limit`) so the two call sites' intent stays obvious and so
 * this one bulk historical fetch is the only place requesting a large page
 * — matching the milestone brief's "one bulk historical fetch... not 156
 * separate calls" instruction. Socrata's `$limit` comfortably supports this
 * in one request (no documented rate limit for this free, unauthenticated
 * endpoint, but a single generous-but-bounded page is still the
 * well-behaved choice). Returns `null` on any network/shape failure; never
 * throws.
 */
export async function fetchGoldCotHistory(weeks: number): Promise<CotReport[] | null> {
  const params = new URLSearchParams({
    $where: "contract_market_name='GOLD'",
    $order: "report_date_as_yyyy_mm_dd DESC",
    $limit: String(weeks),
  });
  const res = await fetchJson<CotRecordFull[]>(`${DATASET_URL}?${params.toString()}`);
  if (!res.ok || !Array.isArray(res.body)) return null;

  return res.body.map((record) => ({
    reportDateIso: new Date(record.report_date_as_yyyy_mm_dd).toISOString(),
    openInterestAll: toNumberOrNull(record.open_interest_all),
    managedMoneyLong: toNumberOrNull(record.m_money_positions_long_all),
    managedMoneyShort: toNumberOrNull(record.m_money_positions_short_all),
  }));
}

export const cftcProvider: ProviderDefinition = {
  id: PROVIDER_ID,
  displayName: DISPLAY_NAME,
  capability:
    "F10 Flows/Positioning — Managed Money long/short/spread positioning for GOLD (COMEX 100oz, code 088691) from the Disaggregated Futures Only COT report, plus a 156-week trailing history for the percentile KPI. No API key required.",
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
