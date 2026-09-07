import type { ProviderDefinition, SmokeTestResult } from "../types";
import { buildProviderStatus } from "../statusHelpers";

// Milestone 2A, section 16 — DXY strategy pattern; updated for the
// Yahoo-DXY pass. `DIRECT_DXY` is now canonical/active: Yahoo Finance's
// public (unofficial, undocumented) chart endpoint, symbol `DX-Y.NYB`, was
// live-verified this pass to return genuine, correctly-labeled ("US Dollar
// Index" / "ICE US Dollar Index") current data, cross-checked against an
// independent source — see apps/backend/src/real/f6Currency.ts and
// apps/backend/src/providers/yahooFinance.ts, which is the module that
// actually performs the live fetch (this file remains status/metadata
// only). This supersedes the PRIOR milestone's audit finding that neither
// Financial Modeling Prep nor Twelve Data offered a genuine direct ICE
// USDX/DXY feed — that finding is unchanged and still correct for those two
// specific providers, Yahoo is simply a different, working direct source
// that was not evaluated in that earlier audit. `RECONSTRUCTED_DXY` (six FX
// legs) is now deprecated/inactive — its code is kept, unused, in
// f6Currency.ts, in case Yahoo's feed needs to be dropped later.

export type DxyStrategy = "DIRECT_DXY" | "RECONSTRUCTED_DXY";

/** Locked selection — do not change without a new audit overturning this one. */
export const CANONICAL_DXY_STRATEGY: DxyStrategy = "DIRECT_DXY";

export interface DxyStrategyImplementation {
  id: DxyStrategy;
  displayName: string;
  active: boolean;
  description: string;
}

export const RECONSTRUCTED_DXY_STRATEGY: DxyStrategyImplementation = {
  id: "RECONSTRUCTED_DXY",
  displayName: "Reconstructed DXY (six FX legs)",
  active: false,
  description:
    "DEPRECATED/inactive as of the Yahoo-DXY pass — superseded by DIRECT_DXY now that a validated direct source exists. Was canonical/active and genuinely implemented (six FRED FX legs, ICE USDX geometric-weighted formula, live-verified) immediately before this pass. Code kept unused (not deleted) in apps/backend/src/real/f6Currency.ts as `buildF6OverridesReconstructedDeprecated`, in case Yahoo's feed needs to be dropped later. If ever reactivated, its correct KPI shape is `provenance: \"derived\"`, `proxyFor: \"ICE DXY\"` — it reconstructs a DXY-equivalent, it does not observe the real index directly.",
};

export const DIRECT_DXY_STRATEGY: DxyStrategyImplementation = {
  id: "DIRECT_DXY",
  displayName: "Direct DXY feed (Yahoo Finance, unofficial)",
  active: true,
  description:
    "Canonical, active strategy as of the Yahoo-DXY pass. Yahoo Finance's public chart endpoint (symbol DX-Y.NYB) is unofficial/undocumented (Yahoo shut down its official public API in 2017) but was live-verified this pass to return genuine, correctly-labeled current data, cross-checked against an independent source. This is a different (and working) direct source from the Financial Modeling Prep / Twelve Data dead end flagged by the prior milestone's audit — that audit's conclusion about those two specific providers is unchanged.",
};

export const DXY_STRATEGIES: Record<DxyStrategy, DxyStrategyImplementation> = {
  RECONSTRUCTED_DXY: RECONSTRUCTED_DXY_STRATEGY,
  DIRECT_DXY: DIRECT_DXY_STRATEGY,
};

/** Returns the currently-selected (canonical) strategy implementation. */
export function getActiveDxyStrategy(): DxyStrategyImplementation {
  return DXY_STRATEGIES[CANONICAL_DXY_STRATEGY];
}

const PROVIDER_ID = "dxy";
const DISPLAY_NAME = "DXY / USD Index Strategy";

async function runSmokeTest(): Promise<SmokeTestResult> {
  // This smoke test reports strategy metadata only and makes no network
  // call of its own — the actual live fetch happens in
  // apps/backend/src/providers/yahooFinance.ts, exercised via the
  // snapshot path (apps/backend/src/real/f6Currency.ts), not via
  // `npm run provider:test -- dxy`.
  return {
    configured: false,
    auth: "N/A",
    request: "N/A",
    capabilities: [
      { label: `STRATEGY: ${CANONICAL_DXY_STRATEGY} (canonical, active)`, result: "N/A" },
      { label: "STRATEGY: RECONSTRUCTED_DXY (deprecated, inactive)", result: "N/A" },
    ],
    sampleValue: null,
    latencyMs: null,
    result: "NOT_CONFIGURED",
    safeReason:
      "Strategy metadata only — this entry does not perform the live fetch itself; see apps/backend/src/providers/yahooFinance.ts / apps/backend/src/real/f6Currency.ts for the module that does.",
  };
}

export const dxyStrategyProvider: ProviderDefinition = {
  id: PROVIDER_ID,
  displayName: DISPLAY_NAME,
  capability:
    "F6 USD/FX — strategy pattern for DXY sourcing. DIRECT_DXY (Yahoo Finance, unofficial) is canonical/active; RECONSTRUCTED_DXY (six FX legs via FRED) is deprecated/inactive. This entry reports metadata only — the live fetch itself lives in apps/backend/src/providers/yahooFinance.ts / apps/backend/src/real/f6Currency.ts.",
  requiresCredential: false,
  isConfigured: () => false,
  getStatus: () =>
    buildProviderStatus({
      providerId: PROVIDER_ID,
      displayName: DISPLAY_NAME,
      configured: false,
      environment: null,
      unavailableMessage:
        "Strategy metadata only — DIRECT_DXY (Yahoo Finance) is canonical/active and live-wired via f6Currency.ts, not via this registry entry.",
    }),
  runSmokeTest,
};
