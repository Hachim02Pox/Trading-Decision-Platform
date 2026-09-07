import { loadAppConfig } from "../config/env";
import type { ProviderDefinition, SmokeTestResult } from "./types";
import { fetchJson, elapsedMs } from "./httpClient";
import { buildProviderStatus, recordSmokeTestOutcome } from "./statusHelpers";

// Massive (formerly Polygon.io, rebranded Oct 30 2025) — F3 Fed Funds
// futures (ZQ). API key required (`MASSIVE_API_KEY`); the `apiKey` query
// parameter convention is CONFIRMED (every call below authenticates fine
// with it).
//
// CME/CBOT ZQ (30-Day Fed Funds futures) reference coverage is now
// CONFIRMED live: `/futures/v1/contracts?ticker=<X>` returns real, correctly
// -dated outright contract metadata for e.g. ZQU6 (Sep 2026), ZQV6 (Oct
// 2026), ZQX6 (Nov 2026) — settlement dates land on the first business day
// of the following month, matching ZQ's real settlement convention.
// HOWEVER, actual pricing data is NOT usable under this API key's plan:
// `/futures/v1/trades`, `/futures/v1/quotes`, and `/futures/v1/snapshot`
// all return HTTP 403 "You are not entitled to this data. Please upgrade
// your plan" (confirmed endpoints, confirmed entitlement gap — not a 404).
// No `/futures/v1/aggs` path variant tried returned anything but 404, so an
// aggregates fallback isn't available either. Net effect: this ZQ pricing
// gap is never wired on a guess — F3's meeting-probability distribution
// now comes from a different real source entirely (investing.com's Fed
// Rate Monitor, via a headless browser — see real/f3Fed.ts and
// providers/investingFedRateMonitor.ts), so this instrument's confirmed-
// but-unusable pricing is now purely informational/unused, not a gap this
// codebase is waiting to fill. See docs/PROVIDER_SETUP.md.
const PROVIDER_ID = "massive";
const DISPLAY_NAME = "Massive (formerly Polygon.io)";
const BASE_URL = "https://api.massive.com";

interface MassiveExchangesResponse {
  status?: string;
  results?: Array<{ acronym?: string; name?: string; asset_class?: string }>;
}

function isConfigured(): boolean {
  return loadAppConfig().providers.massive !== null;
}

function buildExchangesUrl(apiKey: string): string {
  const params = new URLSearchParams({ asset_class: "fut", locale: "us", apiKey });
  return `${BASE_URL}/v3/reference/exchanges?${params.toString()}`;
}

// CME futures month codes (Jan..Dec), used to compute a near-dated ZQ
// outright ticker for the smoke test — VERIFIED naming convention:
// "ZQ" + month code + last digit of year (e.g. "ZQU6" = Sep 2026).
const CME_MONTH_CODES = ["F", "G", "H", "J", "K", "M", "N", "Q", "U", "V", "X", "Z"];

/** A near-dated (next calendar month) ZQ outright ticker — comfortably avoids querying an already-expired front-month contract. */
function currentZqTicker(): string {
  const now = new Date();
  const target = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
  return `ZQ${CME_MONTH_CODES[target.getUTCMonth()]}${String(target.getUTCFullYear()).slice(-1)}`;
}

function buildZqContractUrl(apiKey: string, ticker: string): string {
  const params = new URLSearchParams({ ticker, apiKey });
  return `${BASE_URL}/futures/v1/contracts?${params.toString()}`;
}

function buildZqPricingProbeUrl(apiKey: string, ticker: string): string {
  const params = new URLSearchParams({ ticker, limit: "1", apiKey });
  return `${BASE_URL}/futures/v1/trades?${params.toString()}`;
}

async function runSmokeTest(): Promise<SmokeTestResult> {
  const config = loadAppConfig().providers.massive;
  if (!config) {
    return {
      configured: false,
      auth: "N/A",
      request: "N/A",
      capabilities: [{ label: "INSTRUMENT: ZQ (30-Day Fed Funds futures)", result: "N/A" }],
      sampleValue: null,
      latencyMs: null,
      result: "NOT_CONFIGURED",
      safeReason: "MASSIVE_API_KEY is not set",
    };
  }

  const startedAt = performance.now();
  try {
    const authRes = await fetchJson<MassiveExchangesResponse>(buildExchangesUrl(config.apiKey));
    const authOk = authRes.status !== 401 && authRes.status !== 403 && authRes.ok;

    if (!authOk) {
      const latencyMs = elapsedMs(startedAt);
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
        capabilities: [{ label: "INSTRUMENT: ZQ (30-Day Fed Funds futures)", result: "N/A" }],
        sampleValue: null,
        latencyMs,
        result: "FAIL",
        safeReason: "authentication rejected",
      };
    }

    // Auth confirmed. ZQ contract *reference* coverage is now genuinely
    // confirmed (see top-of-file comment) — check the near-dated outright
    // contract exists, then separately probe pricing, which is known to be
    // gated behind a plan upgrade (403, not 404). Both are reported
    // honestly: the reference check can PASS for real; the pricing probe
    // can only ever be PASS or the documented NOT_ENTITLED failure.
    const ticker = currentZqTicker();
    const [contractRes, pricingRes] = await Promise.all([
      fetchJson<{ results?: Array<{ ticker?: string; active?: boolean }> }>(buildZqContractUrl(config.apiKey, ticker)),
      fetchJson<{ error?: string }>(buildZqPricingProbeUrl(config.apiKey, ticker)),
    ]);
    const latencyMs = elapsedMs(startedAt);

    const contractFound = contractRes.ok && (contractRes.body?.results?.length ?? 0) > 0;
    const pricingEntitled = pricingRes.ok;
    const notEntitled = pricingRes.status === 403;
    const pricingStatus = pricingRes.status;

    const overallPass = contractFound && pricingEntitled;
    const safeReason = overallPass
      ? null
      : !contractFound
        ? `ZQ contract ${ticker} not found in Massive's futures reference data`
        : notEntitled
          ? `ZQ (${ticker}) contract confirmed listed, but live/historical pricing is not entitled under this API key's plan (HTTP 403)`
          : `ZQ pricing endpoint returned HTTP ${pricingStatus}; no usable price data was available`;

    recordSmokeTestOutcome({
      providerId: PROVIDER_ID,
      status: overallPass ? "CONNECTED" : contractFound ? "DEGRADED" : "ERROR",
      markSuccessfulRequest: contractFound,
      latencyMs,
      errorCode: overallPass ? null : notEntitled ? "NOT_ENTITLED" : "PRICING_UNAVAILABLE",
      safeErrorMessage: safeReason,
    });

    return {
      configured: true,
      auth: "PASS",
      request: "PASS",
      capabilities: [
        { label: `INSTRUMENT: ZQ (30-Day Fed Funds futures) — contract ${ticker} listed`, result: contractFound ? "PASS" : "FAIL" },
        {
          label: "PRICING: trades/quotes/snapshot",
          result: pricingEntitled ? "PASS" : notEntitled ? "FAIL" : "FAIL",
        },
      ],
      sampleValue: contractFound ? `${ticker} confirmed listed; pricing ${pricingEntitled ? "available" : `unavailable (HTTP ${pricingStatus})`}` : null,
      latencyMs,
      result: overallPass ? "PASS" : "FAIL",
      safeReason,
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
      capabilities: [{ label: "INSTRUMENT: ZQ (30-Day Fed Funds futures)", result: "N/A" }],
      sampleValue: null,
      latencyMs,
      result: "FAIL",
      safeReason,
    };
  }
}

export const massiveProvider: ProviderDefinition = {
  id: PROVIDER_ID,
  displayName: DISPLAY_NAME,
  capability:
    "F3 Fed Funds futures (ZQ) — reference/contracts CONFIRMED live (real outright contracts, correct settlement dates). Pricing (trades/quotes/snapshot/aggs) is NOT entitled under this API key's plan (HTTP 403), so this instrument's pricing is unused (F3's real meeting-probability distribution now comes from investing.com's Fed Rate Monitor instead — see providers/investingFedRateMonitor.ts). Also provides Massive's \"Economy\" endpoints (fed/v1/treasury-yields, fed/v1/inflation, fed/v1/labor-market), CONFIRMED live and used ONLY as a fallback for select F2/F4/F5 KPIs when their primary FRED/BLS/BEA source fails — see fetchMassiveTreasuryYields/fetchMassiveInflationHistory/fetchMassiveLaborMarketHistory below. API key required.",
  requiresCredential: true,
  isConfigured,
  getStatus: () =>
    buildProviderStatus({
      providerId: PROVIDER_ID,
      displayName: DISPLAY_NAME,
      configured: isConfigured(),
      environment: null,
      notConfiguredMessage: "MASSIVE_API_KEY is not set",
    }),
  runSmokeTest,
};

// ---------------------------------------------------------------------------
// Fallback-only "Economy" data functions — F2/F4/F5 resilience pass.
//
// Massive's free tier (CONFIRMED live via real calls with the configured
// MASSIVE_API_KEY) includes a Fed/Treasury/inflation/labor "Economy" product,
// entirely separate from the F3 futures capability above:
//   - GET /fed/v1/treasury-yields  -> {date, yield_1_month..yield_30_year}
//     Daily Treasury par yields. yield_2_year/yield_10_year are the same
//     statistic FRED publishes as DGS2/DGS10 (used by F2), just from a
//     different distribution channel.
//   - GET /fed/v1/inflation -> {date, cpi, cpi_core, pce, pce_core,
//     pce_spending} (cpi_core/pce/pce_spending only populated on recent rows
//     — older history only has `cpi`). Confirmed by exact value match against
//     this codebase's own BEA-sourced numbers: 2026-07 pce_core=130.658 and
//     2026-06 pce_core=130.338 are the EXACT figures f4Inflation.ts's own
//     comments cite from BEA table T20804 — i.e. `pce`/`pce_core` are the
//     same BEA PCE price index series already used for F4, and `cpi`/
//     `cpi_core` track FRED's CPIAUCSL/CPILFESL (same underlying BLS
//     CUSR0000SA0/CUSR0000SA0L1E statistic F4 already sources).
//   - GET /fed/v1/labor-market -> {date, unemployment_rate,
//     labor_force_participation_rate, avg_hourly_earnings, job_openings}.
//     unemployment_rate and avg_hourly_earnings are the same statistics as
//     BLS LNS14000000 and CES0500000003 (used by F5); there is no payrolls
//     LEVEL field, so F5's payrolls KPIs have no Massive equivalent.
//
// These are deliberately used ONLY as a second attempt after the primary
// FRED/BLS/BEA fetch has already failed (see apps/backend/src/real/f2Rates.ts,
// f4Inflation.ts, f5Employment.ts) — never as a replacement for the normal,
// almost-always-successful primary path. Free-tier rate limit is 5 calls/min;
// since this path is only exercised on primary failure (already rare) and
// each of the 3 endpoints below is wrapped in the same `cached()` TTL helper
// every other real-data source uses, actual call volume stays negligible.
// ---------------------------------------------------------------------------

export type MassiveApiErrorCode = "NOT_CONFIGURED" | "AUTH_REJECTED" | "NETWORK_ERROR" | "API_ERROR" | "MALFORMED_RESPONSE";

export class MassiveApiError extends Error {
  readonly code: MassiveApiErrorCode;
  constructor(code: MassiveApiErrorCode, message: string) {
    super(message);
    this.name = "MassiveApiError";
    this.code = code;
  }
}

interface MassiveEconomyResponse<T> {
  status?: string;
  results?: T[];
}

function buildEconomyUrl(path: string, apiKey: string, limit: number): string {
  const params = new URLSearchParams({ limit: String(limit), sort: "date.desc", apiKey });
  return `${BASE_URL}/fed/v1/${path}?${params.toString()}`;
}

/**
 * Fetches up to `limit` most-recent rows (newest-first, via `sort=date.desc`)
 * from one Massive "Economy" endpoint. Throws a specific `MassiveApiError`
 * (mirroring `FredApiError`'s convention in providers/fred.ts) on every
 * failure mode rather than swallowing to null/undefined, so callers can log
 * a clear reason and honestly fall through to UNAVAILABLE if this fallback
 * also fails.
 */
async function fetchEconomyRows<T>(path: string, limit: number): Promise<T[]> {
  const config = loadAppConfig().providers.massive;
  if (!config) {
    throw new MassiveApiError("NOT_CONFIGURED", "MASSIVE_API_KEY is not set");
  }

  let res: Awaited<ReturnType<typeof fetchJson<MassiveEconomyResponse<T>>>>;
  try {
    res = await fetchJson<MassiveEconomyResponse<T>>(buildEconomyUrl(path, config.apiKey, limit));
  } catch (err) {
    throw new MassiveApiError(
      "NETWORK_ERROR",
      `network request to Massive failed for fed/v1/${path}: ${err instanceof Error ? err.message : String(err)}`
    );
  }

  if (res.status === 401 || res.status === 403) {
    throw new MassiveApiError("AUTH_REJECTED", `Massive rejected the request for fed/v1/${path} (HTTP ${res.status})`);
  }
  if (!res.ok) {
    throw new MassiveApiError("API_ERROR", `Massive returned HTTP ${res.status} for fed/v1/${path}`);
  }
  if (!res.body || !Array.isArray(res.body.results)) {
    throw new MassiveApiError("MALFORMED_RESPONSE", `Massive response for fed/v1/${path} had no results array`);
  }

  return res.body.results;
}

export interface MassiveTreasuryYieldRow {
  /** Plain "YYYY-MM-DD". */
  date: string;
  yield2Year: number | null;
  yield10Year: number | null;
}

interface RawTreasuryYieldRow {
  date: string;
  yield_2_year?: number;
  yield_10_year?: number;
}

/** F2 fallback source for f2-2y/f2-10y — CONFIRMED live, same tenors as FRED's DGS2/DGS10. */
export async function fetchMassiveTreasuryYields(limit = 3): Promise<MassiveTreasuryYieldRow[]> {
  const rows = await fetchEconomyRows<RawTreasuryYieldRow>("treasury-yields", limit);
  return rows.map((r) => ({
    date: r.date,
    yield2Year: r.yield_2_year ?? null,
    yield10Year: r.yield_10_year ?? null,
  }));
}

export interface MassiveInflationRow {
  /** Plain "YYYY-MM-DD" (always the 1st of the month). */
  date: string;
  /** Headline CPI-U index level (SA) — tracks FRED CPIAUCSL / BLS CUSR0000SA0. Populated on every row. */
  cpi: number | null;
  /** Core CPI-U (ex food & energy) index level (SA) — tracks FRED CPILFESL / BLS CUSR0000SA0L1E. Only populated on recent rows. */
  cpiCore: number | null;
  /** Headline PCE price index level — same BEA NIPA T20804 line 1 series F4 already uses. Only populated on recent rows. */
  pce: number | null;
  /** Core PCE price index level — same BEA NIPA T20804 line 25 series F4 already uses. Only populated on recent rows. */
  pceCore: number | null;
}

interface RawInflationRow {
  date: string;
  cpi?: number;
  cpi_core?: number;
  pce?: number;
  pce_core?: number;
}

/** F4 fallback source for f4-{headline,core}-cpi-{mom,yoy}, f4-core-cpi-3m-ann, f4-headline-pce-yoy, f4-core-pce-{mom,yoy} — CONFIRMED live. No PPI field, so f4-ppi-final-demand has no Massive fallback. */
export async function fetchMassiveInflationHistory(limit = 15): Promise<MassiveInflationRow[]> {
  const rows = await fetchEconomyRows<RawInflationRow>("inflation", limit);
  return rows.map((r) => ({
    date: r.date,
    cpi: r.cpi ?? null,
    cpiCore: r.cpi_core ?? null,
    pce: r.pce ?? null,
    pceCore: r.pce_core ?? null,
  }));
}

export interface MassiveLaborMarketRow {
  /** Plain "YYYY-MM-DD" (always the 1st of the month). */
  date: string;
  /** Tracks BLS LNS14000000 (used by f5-unemployment). */
  unemploymentRate: number | null;
  /** Dollar level, "total private" — tracks BLS CES0500000003 (used by f5-ahe-mom). */
  avgHourlyEarnings: number | null;
}

interface RawLaborMarketRow {
  date: string;
  unemployment_rate?: number;
  avg_hourly_earnings?: number;
}

/** F5 fallback source for f5-unemployment and f5-ahe-mom — CONFIRMED live. No payrolls LEVEL field, so f5-payrolls-latest/f5-payrolls-3m have no Massive fallback. */
export async function fetchMassiveLaborMarketHistory(limit = 15): Promise<MassiveLaborMarketRow[]> {
  const rows = await fetchEconomyRows<RawLaborMarketRow>("labor-market", limit);
  return rows.map((r) => ({
    date: r.date,
    unemploymentRate: r.unemployment_rate ?? null,
    avgHourlyEarnings: r.avg_hourly_earnings ?? null,
  }));
}
