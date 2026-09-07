import type { ProviderDefinition, SmokeTestResult } from "./types";
import { buildProviderStatus } from "./statusHelpers";

// Milestone 2A — placeholder registry entries for sources that appeared in
// the original provider list / are needed by locked cockpit KPIs, but were
// explicitly NOT researched this round. Per the research file's closing
// "Gaps" section: do not guess an endpoint for any of these. Each is
// registered here purely so it is visible/documented in the provider
// status surface and docs/PROVIDER_SETUP.md, with status reflecting
// NEEDS_RESEARCH rather than a fabricated READY/CONNECTED state.
//
// Note: Atlanta Fed / GDPNow is deliberately NOT one of these placeholders
// — GDPNow is pulled via FRED's own `GDPNOW` series (see
// apps/backend/src/providers/fred.ts), not a separate Atlanta Fed adapter.

function needsResearchDefinition(params: {
  id: string;
  displayName: string;
  capability: string;
  note: string;
}): ProviderDefinition {
  async function runSmokeTest(): Promise<SmokeTestResult> {
    return {
      configured: false,
      auth: "N/A",
      request: "N/A",
      capabilities: [{ label: "SOURCE NOT YET RESEARCHED", result: "N/A" }],
      sampleValue: null,
      latencyMs: null,
      result: "NOT_CONFIGURED",
      safeReason: params.note,
    };
  }

  return {
    id: params.id,
    displayName: params.displayName,
    capability: params.capability,
    requiresCredential: false,
    isConfigured: () => false,
    getStatus: () =>
      buildProviderStatus({
        providerId: params.id,
        displayName: params.displayName,
        configured: false,
        environment: null,
        unavailableMessage: params.note,
      }),
    runSmokeTest,
  };
}

export const ismProvider = needsResearchDefinition({
  id: "ism",
  displayName: "ISM Services / Manufacturing",
  capability: "F5 Employment/Growth cockpit KPIs — ISM Services and Manufacturing PMI.",
  note: "Source not yet researched — do not activate. No free/public API confirmed this session.",
});

export const moveIndexProvider = needsResearchDefinition({
  id: "moveIndex",
  displayName: "MOVE Index",
  capability: "F7 Risk/Credit/Vol cockpit KPI — ICE BofA MOVE index (bond market volatility).",
  note: "Source not yet researched — do not activate. Likely a proprietary ICE BofA index; no free/public API confirmed this session.",
});

export const gvzProvider = needsResearchDefinition({
  id: "gvz",
  displayName: "GVZ (CBOE Gold Volatility Index)",
  capability: "F11 Gold Options/Vol — CBOE Gold ETF Volatility Index.",
  note: "Source not yet researched — do not activate. May be available via CBOE directly or a market-data reseller, unconfirmed.",
});

export const fomcCalendarProvider = needsResearchDefinition({
  id: "fomcCalendar",
  displayName: "FOMC Meeting Calendar",
  capability: "F3/F13 — structured FOMC meeting calendar/statement schedule.",
  note: "Source not yet researched — do not activate. federalreserve.gov appears to publish this as HTML/PDF only; no structured feed confirmed.",
});

export const releaseCalendarsProvider = needsResearchDefinition({
  id: "releaseCalendars",
  displayName: "BLS / BEA Release Calendars",
  capability: "F13 — structured 'next CPI/NFP release' scheduling data (currently mocked).",
  note: "Source not yet researched — do not activate. BLS and BEA publish static release-schedule pages, but no API confirmed this session.",
});

export const NEEDS_RESEARCH_PROVIDERS: ProviderDefinition[] = [
  ismProvider,
  moveIndexProvider,
  gvzProvider,
  fomcCalendarProvider,
  releaseCalendarsProvider,
];
