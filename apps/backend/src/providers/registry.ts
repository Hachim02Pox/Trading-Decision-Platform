import type { ProviderDefinition } from "./types";
import { fredProvider } from "./fred";
import { treasuryProvider } from "./treasury";
import { nyFedProvider } from "./nyFed";
import { fedBoardProvider } from "./fedBoard";
import { blsProvider } from "./bls";
import { beaProvider } from "./bea";
import { cftcProvider } from "./cftc";
import { spdrGldProvider } from "./spdrGld";
import { investingFedRateMonitorProvider } from "./investingFedRateMonitor";
import { massiveProvider } from "./massive";
import { tavilyProvider } from "./tavily";
import { gdeltProvider } from "./gdelt";
import { openaiProvider } from "./openai";
import { anthropicProvider } from "./anthropic";
import { geminiProvider } from "./gemini";
import { jblankedProvider } from "./jblanked";
import { dxyStrategyProvider } from "./dxy/strategy";
import { NEEDS_RESEARCH_PROVIDERS } from "./needsResearch";

// Milestone 2A — the single assembly point for every provider adapter.
// Individual React components must never know provider-specific details —
// the frontend only ever sees `ProviderStatus[]` (via GET
// /api/providers/status) or a CLI smoke-test's printed result, both derived
// from this registry. See docs/PROVIDER_SETUP.md for the full activation
// order and per-provider setup instructions.
export const PROVIDER_REGISTRY: ProviderDefinition[] = [
  // PHASE B — easy official macro
  treasuryProvider,
  fredProvider,
  blsProvider,
  beaProvider,
  nyFedProvider,
  fedBoardProvider,
  // PHASE C — specialized
  massiveProvider,
  cftcProvider,
  spdrGldProvider,
  investingFedRateMonitorProvider,
  jblankedProvider,
  ...NEEDS_RESEARCH_PROVIDERS,
  // PHASE D — research
  tavilyProvider,
  gdeltProvider,
  // PHASE E — intelligence
  openaiProvider,
  anthropicProvider,
  geminiProvider,
  // F6 backend strategy scaffolding
  dxyStrategyProvider,
];

export function findProvider(id: string): ProviderDefinition | undefined {
  return PROVIDER_REGISTRY.find((provider) => provider.id === id);
}
