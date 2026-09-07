import type { ProviderDefinition, SmokeTestResult } from "./types";
import { fetchText, elapsedMs } from "./httpClient";
import { buildProviderStatus, recordSmokeTestOutcome } from "./statusHelpers";

// Federal Reserve Board H.15 Selected Interest Rates — F3 context. No API
// key/REST API concept; the H.15 XML feed is the correct integration path
// (VERIFIED live). The legacy "Data Download Program" query-builder is
// explicitly NOT used here — see docs/PROVIDER_SETUP.md and the research
// notes on its planned Nov 2026 partial retirement.
const PROVIDER_ID = "fedBoard";
const DISPLAY_NAME = "Federal Reserve Board (H.15)";
const H15_URL = "https://www.federalreserve.gov/feeds/data/H15_H15.XML";

/**
 * Deliberately a light regex extraction, not a full XML parser (no new
 * dependency, per "no overengineering") — this is a connectivity/shape
 * smoke test, not a production H.15 data pipeline. Extracts the first
 * <item>'s <title> and <cb:value> as a sample; a real F3-context integration
 * would map specific <cb:coverage> values to the series this terminal needs
 * (not confirmed field-by-field in the research pass — see docs/PROVIDER_SETUP.md).
 */
function extractFirstItemSample(xml: string): { title: string; value: string } | null {
  const itemMatch = xml.match(/<item\b[\s\S]*?<\/item>/);
  if (!itemMatch) return null;
  const item = itemMatch[0];
  const titleMatch = item.match(/<title>([^<]*)<\/title>/);
  const valueMatch = item.match(/<cb:value[^>]*>([^<]*)<\/cb:value>/);
  if (!titleMatch || !valueMatch) return null;
  return { title: titleMatch[1], value: valueMatch[1] };
}

async function runSmokeTest(): Promise<SmokeTestResult> {
  const startedAt = performance.now();
  try {
    const res = await fetchText(H15_URL);
    const latencyMs = elapsedMs(startedAt);
    const looksLikeFeed = res.ok && res.raw.includes("<rdf:RDF") && res.raw.includes("H15");
    const sample = looksLikeFeed ? extractFirstItemSample(res.raw) : null;

    const found = looksLikeFeed && sample !== null;

    recordSmokeTestOutcome({
      providerId: PROVIDER_ID,
      status: found ? "CONNECTED" : "ERROR",
      markSuccessfulRequest: found,
      latencyMs,
      errorCode: found ? null : "FEED_UNPARSEABLE",
      safeErrorMessage: found ? null : "H.15 XML feed did not return the expected RDF item structure",
    });

    return {
      configured: true,
      auth: "N/A",
      request: looksLikeFeed ? "PASS" : "FAIL",
      capabilities: [{ label: "FEED: H.15 XML (RDF/RSS 1.0)", result: found ? "PASS" : "FAIL" }],
      sampleValue: sample ? `${sample.title} = ${sample.value}` : null,
      latencyMs,
      result: found ? "PASS" : "FAIL",
      safeReason: found ? null : "could not parse a data item out of the H.15 feed",
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
      capabilities: [{ label: "FEED: H.15 XML (RDF/RSS 1.0)", result: "FAIL" }],
      sampleValue: null,
      latencyMs,
      result: "FAIL",
      safeReason,
    };
  }
}

export const fedBoardProvider: ProviderDefinition = {
  id: PROVIDER_ID,
  displayName: DISPLAY_NAME,
  capability:
    "F3 context — H.15 Selected Interest Rates XML feed. No API key/REST API concept. FOMC calendar is NOT covered here (see the fomcCalendar placeholder entry) — appears to be HTML/PDF only, NEEDS_RESEARCH.",
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
