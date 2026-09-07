import Anthropic, { AuthenticationError } from "@anthropic-ai/sdk";
import { loadAppConfig } from "../config/env";
import type { ProviderDefinition, SmokeTestResult } from "./types";
import { elapsedMs } from "./httpClient";
import { buildProviderStatus, recordSmokeTestOutcome } from "./statusHelpers";

// Anthropic — intelligence-provider connectivity check ONLY. This adapter
// is NOT wired into the actual KPI-intelligence generation path this
// milestone (that stays fully mock, per
// apps/backend/src/intelligence/dataMode.ts, and the ensemble's
// ModelRoleIdentity role configuration in
// apps/backend/src/intelligence/ensemble/policies.ts, which is left
// unchanged). `models.list()` is metadata-only, no generation tokens
// billed — the documented cheap smoke-test call. See
// docs/PROVIDER_SETUP.md.
const PROVIDER_ID = "anthropic";
const DISPLAY_NAME = "Anthropic";

function isConfigured(): boolean {
  return loadAppConfig().providers.anthropic !== null;
}

async function runSmokeTest(): Promise<SmokeTestResult> {
  const config = loadAppConfig().providers.anthropic;
  if (!config) {
    return {
      configured: false,
      auth: "N/A",
      request: "N/A",
      capabilities: [{ label: "models.list()", result: "N/A" }],
      sampleValue: null,
      latencyMs: null,
      result: "NOT_CONFIGURED",
      safeReason: "ANTHROPIC_API_KEY is not set",
    };
  }

  const startedAt = performance.now();
  try {
    const client = new Anthropic({
      apiKey: config.apiKey,
      timeout: 30_000,
      maxRetries: 0,
      defaultHeaders: config.workspaceId ? { "anthropic-workspace-id": config.workspaceId } : undefined,
    });
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

export const anthropicProvider: ProviderDefinition = {
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
      notConfiguredMessage: "ANTHROPIC_API_KEY is not set",
    }),
  runSmokeTest,
};
