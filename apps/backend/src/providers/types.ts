import type { ProviderStatus } from "@gold-terminal/contracts";

// Milestone 2A — shared provider-adapter shapes. See docs/PROVIDER_SETUP.md
// and apps/backend/src/providers/registry.ts. Every adapter in this
// directory exports exactly one `ProviderDefinition`; the registry
// assembles them into `PROVIDER_REGISTRY`. Nothing outside this directory
// (and the CLI/route that consume the registry) may know a provider's
// internal request shape, base URL, or credential fields.

export type TriState = "PASS" | "FAIL" | "N/A";

export type CapabilityResult = "PASS" | "FAIL" | "NEEDS_VALIDATION" | "N/A";

/** One capability-specific line in the smoke-test output, e.g. `{ label: "SERIES: DGS10", result: "PASS" }`. */
export interface CapabilityCheck {
  label: string;
  result: CapabilityResult;
}

export interface SmokeTestResult {
  configured: boolean;
  auth: TriState;
  request: TriState;
  capabilities: CapabilityCheck[];
  sampleValue: string | null;
  latencyMs: number | null;
  /**
   * A provider is only "PASS" if BOTH auth (where applicable) AND every
   * required capability check succeeded. An auth-only success with a failed
   * or not-yet-validated capability check must render as "FAIL", never a
   * bare "PASS" — see docs/PROVIDER_SETUP.md and the CLI format spec.
   */
  result: "PASS" | "FAIL" | "NOT_CONFIGURED";
  safeReason: string | null;
}

export interface ProviderDefinition {
  id: string;
  displayName: string;
  /** Short human-readable description of what this provider supplies (e.g. "F2 Rates — FRED series/observations"). */
  capability: string;
  requiresCredential: boolean;
  isConfigured: () => boolean;
  getStatus: () => ProviderStatus;
  runSmokeTest: () => Promise<SmokeTestResult>;
}
