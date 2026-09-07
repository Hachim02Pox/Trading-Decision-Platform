import type { ProviderStatus, ProviderStatusState } from "@gold-terminal/contracts";
import { readStoredStatus, writeStoredStatus } from "./statusStore";

// Milestone 2A — shared logic for turning "configured + last stored smoke
// test outcome" into the `ProviderStatus` shape the frontend consumes via
// `GET /api/providers/status`. No adapter builds a `ProviderStatus` object
// by hand — they all go through `buildProviderStatus` so the "never a
// secret field, only a configured boolean" rule is enforced by construction
// in exactly one place.

export function buildProviderStatus(params: {
  providerId: string;
  displayName: string;
  configured: boolean;
  environment: string | null;
  /** Set when the provider is a defined-but-inactive/NOT_IMPLEMENTED entry regardless of credential state (e.g. WGC, DXY DIRECT_DXY, NEEDS_RESEARCH placeholders). */
  unavailableMessage?: string | null;
  notConfiguredMessage?: string | null;
  /**
   * False for providers that genuinely function without a credential (e.g.
   * BLS's unauthenticated single-series calls) — for those, `configured:
   * false` still allows the status to reflect a real stored smoke-test
   * outcome instead of being forced to "NOT_CONFIGURED". Defaults to true
   * (the common case: no credential means the provider cannot be reached
   * at all).
   */
  credentialRequiredToOperate?: boolean;
}): ProviderStatus {
  const stored = readStoredStatus(params.providerId);
  const requiresCredentialToOperate = params.credentialRequiredToOperate ?? true;

  let status: ProviderStatusState;
  let safeErrorMessage: string | null;

  if (params.unavailableMessage) {
    status = "UNAVAILABLE";
    safeErrorMessage = params.unavailableMessage;
  } else if (!params.configured && requiresCredentialToOperate) {
    status = "NOT_CONFIGURED";
    safeErrorMessage = params.notConfiguredMessage ?? null;
  } else if (stored) {
    status = stored.status;
    safeErrorMessage = stored.safeErrorMessage;
  } else {
    status = "READY";
    safeErrorMessage = null;
  }

  return {
    providerId: params.providerId,
    displayName: params.displayName,
    configured: params.configured,
    status,
    environment: params.environment,
    lastSuccessfulRequestAt: stored?.lastSuccessfulRequestAt ?? null,
    lastCheckedAt: stored?.lastCheckedAt ?? null,
    latencyMs: stored?.latencyMs ?? null,
    errorCode: stored?.errorCode ?? null,
    safeErrorMessage,
  };
}

/** Called at the end of every adapter's `runSmokeTest()` to persist the outcome for the status route to reflect later, without re-running a live call. */
export function recordSmokeTestOutcome(params: {
  providerId: string;
  status: ProviderStatusState;
  markSuccessfulRequest: boolean;
  latencyMs: number | null;
  errorCode: string | null;
  safeErrorMessage: string | null;
}): void {
  const now = new Date().toISOString();
  const previous = readStoredStatus(params.providerId);
  writeStoredStatus(params.providerId, {
    status: params.status,
    lastSuccessfulRequestAt: params.markSuccessfulRequest ? now : previous?.lastSuccessfulRequestAt ?? null,
    lastCheckedAt: now,
    latencyMs: params.latencyMs,
    errorCode: params.errorCode,
    safeErrorMessage: params.safeErrorMessage,
  });
}
