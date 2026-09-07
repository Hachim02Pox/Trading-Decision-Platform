import { GoogleGenAI, ApiError } from "@google/genai";
import { loadAppConfig } from "../config/env";
import type { ProviderDefinition, SmokeTestResult } from "./types";
import { elapsedMs } from "./httpClient";
import { buildProviderStatus, recordSmokeTestOutcome } from "./statusHelpers";

// Google Gemini — intelligence-provider connectivity check ONLY. This
// adapter is NOT wired into the actual KPI-intelligence generation path
// this milestone (that stays fully mock, per
// apps/backend/src/intelligence/dataMode.ts). Uses the current unified
// `@google/genai` SDK (NOT the deprecated `@google/generative-ai`), per the
// research file. `ai.models.list()` is metadata-only, no generation tokens
// billed. See docs/PROVIDER_SETUP.md.
const PROVIDER_ID = "gemini";
const DISPLAY_NAME = "Google Gemini";

function isConfigured(): boolean {
  return loadAppConfig().providers.gemini !== null;
}

async function runSmokeTest(): Promise<SmokeTestResult> {
  const config = loadAppConfig().providers.gemini;
  if (!config) {
    return {
      configured: false,
      auth: "N/A",
      request: "N/A",
      capabilities: [{ label: "models.list()", result: "N/A" }],
      sampleValue: null,
      latencyMs: null,
      result: "NOT_CONFIGURED",
      safeReason: "GEMINI_API_KEY (or GOOGLE_API_KEY) is not set",
    };
  }

  const startedAt = performance.now();
  try {
    const ai = new GoogleGenAI({ apiKey: config.apiKey });
    const pager = await ai.models.list();
    const latencyMs = elapsedMs(startedAt);
    const firstModel = pager.page?.[0];
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
      sampleValue: found ? `${pager.page.length} model(s), e.g. ${firstModel!.name ?? firstModel!.displayName}` : null,
      latencyMs,
      result: found ? "PASS" : "FAIL",
      safeReason: found ? null : "models.list() returned no models",
    };
  } catch (err) {
    const latencyMs = elapsedMs(startedAt);
    const isAuthError = err instanceof ApiError && (err.status === 401 || err.status === 403);
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

export const geminiProvider: ProviderDefinition = {
  id: PROVIDER_ID,
  displayName: DISPLAY_NAME,
  capability:
    "Intelligence provider connectivity check only (models.list()) — NOT wired into KPI-intelligence generation this milestone. API key required (GEMINI_API_KEY or GOOGLE_API_KEY).",
  requiresCredential: true,
  isConfigured,
  getStatus: () =>
    buildProviderStatus({
      providerId: PROVIDER_ID,
      displayName: DISPLAY_NAME,
      configured: isConfigured(),
      environment: null,
      notConfiguredMessage: "GEMINI_API_KEY (or GOOGLE_API_KEY) is not set",
    }),
  runSmokeTest,
};
