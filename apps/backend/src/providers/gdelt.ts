import type { ProviderDefinition, SmokeTestResult } from "./types";
import { fetchJson, elapsedMs } from "./httpClient";
import { buildProviderStatus, recordSmokeTestOutcome } from "./statusHelpers";

// GDELT Project — F13/exogenous news, cross-family research. Genuinely
// public, no-key API (VERIFIED live). This is a new, real, connectivity-
// testable implementation of the ResearchProvider-shaped interface — it is
// NOT wired into the actual research pipeline's execution path this
// milestone (that stays mock, per the DataMode gate). See
// docs/PROVIDER_SETUP.md and docs/KPI_INTELLIGENCE_ARCHITECTURE.md.
const PROVIDER_ID = "gdelt";
const DISPLAY_NAME = "GDELT Project";
const DOC_API_URL = "https://api.gdeltproject.org/api/v2/doc/doc";

interface GdeltArticle {
  url: string;
  title: string;
  seendate: string;
  domain: string;
}

interface GdeltResponse {
  articles?: GdeltArticle[];
}

function buildQueryUrl(): string {
  const params = new URLSearchParams({
    query: "gold",
    mode: "artlist",
    format: "json",
    maxrecords: "3",
  });
  return `${DOC_API_URL}?${params.toString()}`;
}

async function runSmokeTest(): Promise<SmokeTestResult> {
  const startedAt = performance.now();
  try {
    const res = await fetchJson<GdeltResponse>(buildQueryUrl());
    const latencyMs = elapsedMs(startedAt);

    const articles = res.body?.articles ?? [];
    const found = res.ok && articles.length > 0;

    recordSmokeTestOutcome({
      providerId: PROVIDER_ID,
      status: found ? "CONNECTED" : "ERROR",
      markSuccessfulRequest: found,
      latencyMs,
      errorCode: found ? null : "NO_ARTICLES",
      safeErrorMessage: found ? null : "doc/doc query returned no articles",
    });

    return {
      configured: true,
      auth: "N/A",
      request: res.ok ? "PASS" : "FAIL",
      capabilities: [{ label: "QUERY: gold (artlist)", result: found ? "PASS" : "FAIL" }],
      sampleValue: found ? `${articles[0].title} — ${articles[0].domain} (${articles[0].seendate})` : null,
      latencyMs,
      result: found ? "PASS" : "FAIL",
      safeReason: found ? null : "no articles returned — GDELT rate-limits are undocumented, this may be transient",
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
      capabilities: [{ label: "QUERY: gold (artlist)", result: "FAIL" }],
      sampleValue: null,
      latencyMs,
      result: "FAIL",
      safeReason,
    };
  }
}

export const gdeltProvider: ProviderDefinition = {
  id: PROVIDER_ID,
  displayName: DISPLAY_NAME,
  capability:
    "F13/cross-family research — public news-article search (doc/doc endpoint). No API key required. Real ResearchProvider-shaped connectivity check only; not wired into the mock research pipeline this milestone.",
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
