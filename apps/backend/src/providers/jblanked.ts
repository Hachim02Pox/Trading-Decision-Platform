import { loadAppConfig } from "../config/env";
import { getState } from "../db/ingestionState";
import type { ProviderDefinition, SmokeTestResult } from "./types";
import { fetchJson, elapsedMs } from "./httpClient";
import { buildProviderStatus } from "./statusHelpers";

// JBlanked (jblanked.com) — F13 real economic-calendar source.
//
// Endpoint choice: JBlanked exposes the SAME calendar under three different
// upstream sources (mql5 / forex-factory / fxstreet), each with its own
// event naming and, per their own docs, ITS OWN independent id space. Mixing
// sources across ingestion runs would risk two different id/casing schemes
// silently colliding or diverging in `macro_events` over time. This adapter
// therefore commits to exactly ONE source — `mql5` — for the entire
// lifetime of this integration. Endpoint (confirmed against the live docs at
// https://www.jblanked.com/news/api/docs/calendar/ this pass):
//
//   GET https://www.jblanked.com/news/api/mql5/calendar/range/?from=YYYY-MM-DD&to=YYYY-MM-DD&currency=USD
//
// Auth: `Authorization: Api-Key <JBLANKED_API_KEY>` header (NOT a query
// param — the key is never appended to a URL, so it can never leak into a
// log line that only captures the request URL).
//
// Rate limit: the docs state the free tier is 1 request/day. This adapter
// itself does not enforce that — apps/backend/src/jobs/f13CalendarIngestion.ts
// is the ONLY caller of `fetchCalendarRange`, and it enforces the daily cap
// via `ingestion_state` (persisted in MySQL, so the guard survives process
// restarts) BEFORE ever reaching this module. Nothing else in this codebase
// may call `fetchCalendarRange` directly.
//
// Deliberately NOT filtering by `impact` in the request: the docs describe
// `impact` as an optional filter, and requesting the unfiltered response
// costs nothing extra against the 1/day quota while returning Medium (and
// Low/None) impact events alongside High — the ingestion job stores High
// and Medium (see f13EventTypes.ts) and discards Low/None, all from this
// one call.
//
// Currency: f13CalendarIngestion.ts now requests "USD,JPY" as a single
// comma-joined `currency` value (product-owner ask: Gold's dollar AND yen/
// BOJ carry-trade sensitivity). This is NOT independently confirmed against
// JBlanked's own docs — no multi-currency example exists anywhere in this
// file's referenced doc page — so `currency` here stays a plain passthrough
// string rather than a typed enum; if JBlanked doesn't actually support a
// comma-joined value, the caller degrades safely (see
// f13CalendarIngestion.ts's doc comment on `fetchRaw` for the exact failure
// modes), never silently wrong data.
const PROVIDER_ID = "jblanked";
const DISPLAY_NAME = "JBlanked (Economic Calendar)";
const BASE_URL = "https://www.jblanked.com/news/api/mql5/calendar/range/";

export interface JblankedRawEvent {
  Name: string;
  Currency: string;
  Impact: string;
  /** JBlanked's own local time string, format "YYYY.MM.DD HH:MM:SS" — see f13Calendar.ts's timezone-conversion comment for the confirmed offset. Never treated as UTC as-is. */
  Date: string;
  Actual: number | string | null;
  Forecast: number | string | null;
  Previous: number | string | null;
  Category?: string;
  Outcome?: string;
  Strength?: string;
  Quality?: string;
}

export type JblankedApiErrorCode =
  | "NOT_CONFIGURED"
  | "AUTH_REJECTED"
  | "QUOTA_EXCEEDED"
  | "NETWORK_ERROR"
  | "API_ERROR"
  | "MALFORMED_RESPONSE";

export class JblankedApiError extends Error {
  readonly code: JblankedApiErrorCode;
  constructor(code: JblankedApiErrorCode, message: string) {
    super(message);
    this.name = "JblankedApiError";
    this.code = code;
  }
}

function isConfigured(): boolean {
  return loadAppConfig().providers.jblanked !== null;
}

function buildUrl(fromYmd: string, toYmd: string, currency: string): string {
  const params = new URLSearchParams({ from: fromYmd, to: toYmd, currency });
  return `${BASE_URL}?${params.toString()}`;
}

function buildHeaders(apiKey: string): HeadersInit {
  return {
    "Content-Type": "application/json",
    Authorization: `Api-Key ${apiKey}`,
  };
}

/**
 * Fetches every USD calendar event (any impact) whose scheduled date falls
 * within [fromYmd, toYmd] (inclusive, "YYYY-MM-DD", JBlanked's own local
 * calendar day — see f13Calendar.ts for why the ingestion job's window is
 * deliberately widened by a couple of days to absorb this). Throws a typed
 * `JblankedApiError` on every failure mode rather than swallowing to null —
 * the ONLY caller (f13CalendarIngestion.ts) is responsible for the
 * once-per-day rate-limit guard; this function makes exactly one HTTP
 * request per call, no retries.
 */
export async function fetchCalendarRange(fromYmd: string, toYmd: string, currency = "USD"): Promise<JblankedRawEvent[]> {
  const config = loadAppConfig().providers.jblanked;
  if (!config) {
    throw new JblankedApiError("NOT_CONFIGURED", "JBLANKED_API_KEY is not set");
  }

  type RawResponseBody = JblankedRawEvent[] | { results?: JblankedRawEvent[]; message?: string; detail?: string };
  let res: Awaited<ReturnType<typeof fetchJson<RawResponseBody>>>;
  try {
    res = await fetchJson(buildUrl(fromYmd, toYmd, currency), { headers: buildHeaders(config.apiKey) }, 20_000);
  } catch (err) {
    throw new JblankedApiError(
      "NETWORK_ERROR",
      `network request to JBlanked failed: ${err instanceof Error ? err.message : String(err)}`
    );
  }

  if (res.status === 401 || res.status === 403) {
    // JBlanked distinguishes "bad/missing key" from "valid key, no
    // credits/quota left" using the SAME HTTP 401 status — only the body
    // message differs (live-confirmed 2026-09-01: this exact message came
    // back for /calendar/range/, /calendar/week/, and /calendar/today/, all
    // with the real key from apps/backend/.env). Distinguishing them here
    // matters: QUOTA_EXCEEDED means the key IS valid, so surfacing it as a
    // generic "auth rejected" would be misleading during troubleshooting.
    const bodyMessage = (!Array.isArray(res.body) && res.body?.message) || "";
    if (/requires credits/i.test(bodyMessage) || /you currently do not have any/i.test(bodyMessage)) {
      throw new JblankedApiError("QUOTA_EXCEEDED", `JBlanked: ${bodyMessage || "no free quota/credits available for this API key"}`);
    }
    throw new JblankedApiError("AUTH_REJECTED", `JBlanked rejected the API key (HTTP ${res.status})`);
  }

  if (!res.ok) {
    throw new JblankedApiError("API_ERROR", `JBlanked returned HTTP ${res.status}`);
  }

  const body = res.body;
  // Documented shape is a flat array; defensively also accept a wrapper
  // object with a `results` array in case the live response differs from
  // the docs, rather than crashing the one call/day this milestone allows.
  const events = Array.isArray(body) ? body : Array.isArray((body as { results?: JblankedRawEvent[] } | null)?.results) ? (body as { results: JblankedRawEvent[] }).results : null;

  if (!events) {
    throw new JblankedApiError("MALFORMED_RESPONSE", "JBlanked response was not a JSON array of events (and had no .results array)");
  }

  return events;
}

/**
 * Smoke test deliberately does NOT call the live API — JBlanked's free tier
 * is 1 request/day and that single call is reserved for the real ingestion
 * job (see f13CalendarIngestion.ts). Instead this reflects configuration
 * status plus the last recorded ingestion outcome from `ingestion_state`,
 * which is exactly what a human running `npm run provider:test -- jblanked`
 * actually wants to know ("is this wired up, and did it last work") without
 * ever risking burning the daily quota on a manual check.
 */
async function runSmokeTest(): Promise<SmokeTestResult> {
  const config = loadAppConfig().providers.jblanked;
  if (!config) {
    return {
      configured: false,
      auth: "N/A",
      request: "N/A",
      capabilities: [{ label: "CALENDAR: mql5/range", result: "N/A" }],
      sampleValue: null,
      latencyMs: null,
      result: "NOT_CONFIGURED",
      safeReason: "JBLANKED_API_KEY is not set",
    };
  }

  const startedAt = performance.now();
  try {
    const state = await getState("jblanked:calendar");
    const latencyMs = elapsedMs(startedAt);

    if (!state || state.lastStatus === "NEVER_RUN") {
      return {
        configured: true,
        auth: "N/A",
        request: "N/A",
        capabilities: [{ label: "CALENDAR: mql5/range — ingestion has not run yet", result: "NEEDS_VALIDATION" }],
        sampleValue: null,
        latencyMs,
        result: "FAIL",
        safeReason: "configured, but the once-daily ingestion job has not run yet (this check never triggers it, by design — see top-of-file comment)",
      };
    }

    const ok = state.lastStatus === "SUCCESS";
    return {
      configured: true,
      auth: ok ? "PASS" : "FAIL",
      request: ok ? "PASS" : "FAIL",
      capabilities: [
        {
          label: `CALENDAR: mql5/range — last ingestion ${state.lastStatus} at ${state.lastSuccessAt ?? state.lastAttemptAt ?? "unknown"}`,
          result: ok ? "PASS" : "FAIL",
        },
      ],
      sampleValue: ok ? `last successful ingestion at ${state.lastSuccessAt?.toISOString() ?? "unknown"}` : null,
      latencyMs,
      result: ok ? "PASS" : "FAIL",
      safeReason: ok ? null : state.lastError ?? "last ingestion attempt failed",
    };
  } catch (err) {
    return {
      configured: true,
      auth: "FAIL",
      request: "FAIL",
      capabilities: [{ label: "CALENDAR: mql5/range", result: "FAIL" }],
      sampleValue: null,
      latencyMs: elapsedMs(startedAt),
      result: "FAIL",
      safeReason: `could not read ingestion_state (DB not configured or unreachable): ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

export const jblankedProvider: ProviderDefinition = {
  id: PROVIDER_ID,
  displayName: DISPLAY_NAME,
  capability: "F13 Economic Calendar — schedule/forecast/previous (and best-effort actual) for USD High/Medium-impact macro releases. MQL5 source only. Free tier: 1 request/day, enforced via ingestion_state.",
  requiresCredential: true,
  isConfigured,
  getStatus: () =>
    buildProviderStatus({
      providerId: PROVIDER_ID,
      displayName: DISPLAY_NAME,
      configured: isConfigured(),
      environment: null,
      notConfiguredMessage: "JBLANKED_API_KEY is not set",
    }),
  runSmokeTest,
};
