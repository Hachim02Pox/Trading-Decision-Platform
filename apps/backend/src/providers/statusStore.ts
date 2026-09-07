import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { ProviderStatusState } from "@gold-terminal/contracts";
import { RUNTIME_DIR } from "../intelligence/sessionGuard";

// Milestone 2A — persists each provider's LAST smoke-test outcome so
// `GET /api/providers/status` can reflect "last-known state" without
// triggering a live network call on every page load (per the spec: status
// reflects the last-known state; smoke tests run only via the CLI). Reuses
// the same `.runtime/` ephemeral-cache convention as the rest of this
// backend (see docs/KPI_INTELLIGENCE_ARCHITECTURE.md §4) — this is not
// durable storage, just a dev-loop convenience, and it never holds a
// credential value, only pass/fail/timestamp/latency metadata.

const PROVIDER_STATUS_DIR = join(RUNTIME_DIR, "providerStatus");

export interface StoredProviderStatus {
  status: ProviderStatusState;
  lastSuccessfulRequestAt: string | null;
  lastCheckedAt: string;
  latencyMs: number | null;
  errorCode: string | null;
  safeErrorMessage: string | null;
}

function ensureDir(): void {
  if (!existsSync(PROVIDER_STATUS_DIR)) {
    mkdirSync(PROVIDER_STATUS_DIR, { recursive: true });
  }
}

function filePathFor(providerId: string): string {
  return join(PROVIDER_STATUS_DIR, `${providerId}.json`);
}

export function readStoredStatus(providerId: string): StoredProviderStatus | null {
  const path = filePathFor(providerId);
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, "utf-8")) as StoredProviderStatus;
  } catch (err) {
    console.warn(
      JSON.stringify({
        msg: "malformed provider status cache, ignoring",
        providerId,
        error: err instanceof Error ? err.message : String(err),
      })
    );
    return null;
  }
}

export function writeStoredStatus(providerId: string, status: StoredProviderStatus): void {
  try {
    ensureDir();
    writeFileSync(filePathFor(providerId), JSON.stringify(status, null, 2), "utf-8");
  } catch (err) {
    // Best-effort only — failing to persist the last-known status must never
    // crash the CLI or block the smoke-test result from being printed.
    console.warn(
      JSON.stringify({
        msg: "failed to persist provider status cache",
        providerId,
        error: err instanceof Error ? err.message : String(err),
      })
    );
  }
}
