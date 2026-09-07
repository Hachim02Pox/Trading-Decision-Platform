import OpenAI, { AuthenticationError } from "openai";
import { loadAppConfig } from "../config/env";
import type { ProviderDefinition, SmokeTestResult } from "./types";
import { elapsedMs } from "./httpClient";
import { buildProviderStatus, recordSmokeTestOutcome } from "./statusHelpers";

// OpenAI — intelligence-provider connectivity check ONLY. This adapter is
// NOT wired into the actual KPI-intelligence generation path this milestone
// (that stays fully mock, per apps/backend/src/intelligence/dataMode.ts).
// `models.list()` is metadata-only, no generation tokens billed — the
// documented cheap smoke-test call (research file, VERIFIED against
// current official sources). See docs/PROVIDER_SETUP.md.
const PROVIDER_ID = "openai";
const DISPLAY_NAME = "OpenAI";

function isConfigured(): boolean {
  return loadAppConfig().providers.openai !== null;
}

async function runSmokeTest(): Promise<SmokeTestResult> {
  const config = loadAppConfig().providers.openai;
  if (!config) {
    return {
      configured: false,
      auth: "N/A",
      request: "N/A",
      capabilities: [{ label: "models.list()", result: "N/A" }],
      sampleValue: null,
      latencyMs: null,
      result: "NOT_CONFIGURED",
      safeReason: "OPENAI_API_KEY is not set",
    };
  }

  const startedAt = performance.now();
  try {
    const client = new OpenAI({ apiKey: config.apiKey });
    const page = await client.models.list();
    const latencyMs = elapsedMs(startedAt);
    const firstModel = page.data?.[0];
    const found = !!firstModel;

    recordSmokeTestOutcome({
      providerId: PROVIDER_ID,
      status: found ? "CONNECTED" : "ERROR",
      markSuccessfulRequest: found,
      latencyMs,
      errorCode: found ? null : "EMPTY_RESPONSE",
      safeErrorMessage: found ? null : "models.list() returned no models",
    });

    return {
      configured: true,
      auth: "PASS",
      request: "PASS",
      capabilities: [{ label: "models.list()", result: found ? "PASS" : "FAIL" }],
      sampleValue: found ? `${page.data.length} model(s), e.g. ${firstModel!.id}` : null,
      latencyMs,
      result: found ? "PASS" : "FAIL",
      safeReason: found ? null : "models.list() returned no models",
    };
  } catch (err) {
    const latencyMs = elapsedMs(startedAt);
    const isAuthError = err instanceof AuthenticationError;
    const safeReason = isAuthError ? "authentication rejected" : "request failed or timed out";
    recordSmokeTestOutcome({
      providerId: PROVIDER_ID,
      status: "ERROR",
      markSuccessfulRequest: false,
      latencyMs,
      errorCode: isAuthError ? "AUTH_REJECTED" : "REQUEST_FAILED",
      safeErrorMessage: safeReason,
    });
    return {
      configured: true,
      auth: isAuthError ? "FAIL" : "N/A",
      request: "FAIL",
      capabilities: [{ label: "models.list()", result: "FAIL" }],
      sampleValue: null,
      latencyMs,
      result: "FAIL",
      safeReason: safeReason,
    };
  }
}

export const openaiProvider: ProviderDefinition = {
  id: PROVIDER_ID,
  displayName: DISPLAY_NAME,
  capability:
    "Intelligence provider connectivity check only (models.list()) — NOT wired into KPI-intelligence generation this milestone. API key required.",
  requiresCredential: true,
  isConfigured,
  getStatus: () =>
    buildProviderStatus({
      providerId: PROVIDER_ID,
      displayName: DISPLAY_NAME,
      configured: isConfigured(),
      environment: null,
      notConfiguredMessage: "OPENAI_API_KEY is not set",
    }),
  runSmokeTest,
};
