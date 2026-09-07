import { loadAppConfig } from "../config/env";
import type { ProviderDefinition, SmokeTestResult } from "./types";
import { fetchJson, elapsedMs } from "./httpClient";
import { buildProviderStatus, recordSmokeTestOutcome } from "./statusHelpers";

// Tavily (research provider) — F13/cross-family news research. API key
// required, format `tvly-...`, `Authorization: Bearer tvly-...` (VERIFIED
// via docs.tavily.com). A new, real, connectivity-testable implementation
// of the ResearchProvider-shaped interface — NOT wired into the actual
// research pipeline's execution path this milestone (that stays mock, per
// DataMode). See docs/PROVIDER_SETUP.md.
//
// UNRESOLVED per the research file: whether each result carries a
// per-article `published_date` field is unconfirmed from the docs excerpt
// reviewed — this matters for the (currently mock) research pipeline's
// recency-prioritization logic. The smoke test below actively checks for
// the field's presence on a real response and reports it, rather than
// leaving it as a permanent unknown.
const PROVIDER_ID = "tavily";
const DISPLAY_NAME = "Tavily";
const SEARCH_URL = "https://api.tavily.com/search";

interface TavilyResult {
  title: string;
  url: string;
  content: string;
  score: number;
  published_date?: string;
}

interface TavilySearchResponse {
  results?: TavilyResult[];
  answer?: string;
}

function isConfigured(): boolean {
  return loadAppConfig().providers.tavily !== null;
}

async function runSmokeTest(): Promise<SmokeTestResult> {
  const config = loadAppConfig().providers.tavily;
  if (!config) {
    return {
      configured: false,
      auth: "N/A",
      request: "N/A",
      capabilities: [{ label: "SEARCH: one live query", result: "N/A" }],
      sampleValue: null,
      latencyMs: null,
      result: "NOT_CONFIGURED",
      safeReason: "TAVILY_API_KEY is not set",
    };
  }

  const startedAt = performance.now();
  try {
    const res = await fetchJson<TavilySearchResponse>(SEARCH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        query: "gold price today",
        search_depth: "basic",
        max_results: 1,
        topic: "finance",
      }),
    });
    const latencyMs = elapsedMs(startedAt);

    if (res.status === 401 || res.status === 403) {
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
        capabilities: [{ label: "SEARCH: one live query", result: "FAIL" }],
        sampleValue: null,
        latencyMs,
        result: "FAIL",
        safeReason: "authentication rejected",
      };
    }

    const result = res.body?.results?.[0];
    const found = res.ok && !!result;
    const hasPublishedDate = typeof result?.published_date === "string" && result.published_date.length > 0;

    recordSmokeTestOutcome({
      providerId: PROVIDER_ID,
      status: found ? "CONNECTED" : "ERROR",
      markSuccessfulRequest: found,
      latencyMs,
      errorCode: found ? null : "REQUEST_FAILED",
      safeErrorMessage: found
        ? `per-result published_date ${hasPublishedDate ? "IS present" : "is NOT present"} on this response`
        : "search request failed",
    });

    return {
      configured: true,
      auth: "PASS",
      request: res.ok ? "PASS" : "FAIL",
      capabilities: [
        { label: "SEARCH: one live query", result: found ? "PASS" : "FAIL" },
        {
          label: `PER-RESULT published_date field — ${hasPublishedDate ? "present" : "absent"}`,
          result: found ? "PASS" : "N/A",
        },
      ],
      sampleValue: found ? `${result!.title} — score ${result!.score}` : null,
      latencyMs,
      result: found ? "PASS" : "FAIL",
      safeReason: found ? null : "search request failed",
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
      capabilities: [{ label: "SEARCH: one live query", result: "FAIL" }],
      sampleValue: null,
      latencyMs,
      result: "FAIL",
      safeReason,
    };
  }
}

export const tavilyProvider: ProviderDefinition = {
  id: PROVIDER_ID,
  displayName: DISPLAY_NAME,
  capability:
    "F13/cross-family research — POST /search (query, search_depth, max_results, topic=\"finance\"). API key required. Per-result published_date availability is unconfirmed until the first real smoke test.",
  requiresCredential: true,
  isConfigured,
  getStatus: () =>
    buildProviderStatus({
      providerId: PROVIDER_ID,
      displayName: DISPLAY_NAME,
      configured: isConfigured(),
      environment: null,
      notConfiguredMessage: "TAVILY_API_KEY is not set",
    }),
  runSmokeTest,
};
