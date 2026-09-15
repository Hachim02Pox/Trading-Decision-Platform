import type { MechanicalChannelId, MechanicalRuleDefinition } from "@gold-terminal/contracts";

// The mechanical relationship registry — one entry per cockpit KPI id
// (F2-F12; F13 has no `CanonicalKpi` at all). This is the single source of
// truth for HOW a KPI's mechanical read is computed, kept strictly
// backend-only (never in packages/contracts, never in mock/fixtures.ts) so
// "display schema" (fixtures) and "mechanical behavior" (this file) stay
// separate concerns. See docs/REGLES_MECANIQUES_KPI.md for the prose
// rulebook this registry implements.
//
// A KPI id missing from this table is a bug, not a valid "no rule" state —
// `getRuleForKpi` throws rather than silently defaulting, and
// tests/mechanical-rule-registry-completeness.test.ts locks every
// cockpit-visible id down. Every other (deep/event-tier) fixture id is also
// listed below, since `CanonicalKpi.mechanicalGoldRead`/`mechanicalEvaluation`
// are non-optional on every KPI object the backend produces, not just the
// cockpit-visible ones.
export const MECHANICAL_RULES: Record<string, MechanicalRuleDefinition> = {
  // ------------------------------------------- F12: Physical / Structural Gold
  "f12-cb-net-buying": { kpiId: "f12-cb-net-buying", familyId: "F12", mode: "OBSERVATION_DELTA", supportiveDirection: "UP", channelId: null },
  "f12-quarterly-demand": { kpiId: "f12-quarterly-demand", familyId: "F12", mode: "CONTEXTUAL", supportiveDirection: null, channelId: null },

  // --------------------------------------------------------------- F2: Rates
  // 2Y/10Y nominal are directional fallback confirmation channels for the
  // real-yield opportunity-cost mechanism (see families/f2.ts) — a rising
  // nominal yield is the same "higher opportunity cost" story as a rising
  // real yield, just a less precise proxy for it (hence SECONDARY/fallback,
  // never PRIMARY).
  "f2-2y": { kpiId: "f2-2y", familyId: "F2", mode: "OBSERVATION_DELTA", supportiveDirection: "DOWN", channelId: "NOMINAL_2Y" },
  "f2-10y": { kpiId: "f2-10y", familyId: "F2", mode: "OBSERVATION_DELTA", supportiveDirection: "DOWN", channelId: "NOMINAL_10Y" },
  "f2-10y-real": { kpiId: "f2-10y-real", familyId: "F2", mode: "OBSERVATION_DELTA", supportiveDirection: "DOWN", channelId: "REAL_YIELDS" },
  "f2-be10": { kpiId: "f2-be10", familyId: "F2", mode: "CONTEXTUAL", supportiveDirection: null, channelId: null },
  "f2-5y5y": { kpiId: "f2-5y5y", familyId: "F2", mode: "CONTEXTUAL", supportiveDirection: null, channelId: null },
  "f2-2s10s": { kpiId: "f2-2s10s", familyId: "F2", mode: "CONTEXTUAL", supportiveDirection: null, channelId: null },

  // ------------------------------------------------- F3: Fed / Rate Pricing
  // Lower/upper share ONE POLICY_RATES channel decision — they move together
  // as a single FOMC target-range change, never voted on independently (see
  // families/f3.ts, which computes lower's evaluation once and copies it).
  // A falling target range (rate cuts) is supportive for Gold.
  "f3-target-lower": { kpiId: "f3-target-lower", familyId: "F3", mode: "OBSERVATION_DELTA", supportiveDirection: "DOWN", channelId: "POLICY_RATES" },
  "f3-target-upper": { kpiId: "f3-target-upper", familyId: "F3", mode: "OBSERVATION_DELTA", supportiveDirection: "DOWN", channelId: "POLICY_RATES" },
  // Permanently UNAVAILABLE (NO_SOURCE) — see real/f3Fed.ts. Kept out of the
  // POLICY_RATES channel per the plan: these are separate contextual signals,
  // not part of the target-range decision itself.
  "f3-path-6m": { kpiId: "f3-path-6m", familyId: "F3", mode: "OBSERVATION_DELTA", supportiveDirection: "DOWN", channelId: null },
  "f3-repricing": { kpiId: "f3-repricing", familyId: "F3", mode: "OBSERVATION_DELTA", supportiveDirection: "DOWN", channelId: null },

  // ---------------------------------------------------------- F4: Inflation
  "f4-core-cpi-mom": { kpiId: "f4-core-cpi-mom", familyId: "F4", mode: "CONTEXTUAL", supportiveDirection: null, channelId: null },
  "f4-core-cpi-yoy": { kpiId: "f4-core-cpi-yoy", familyId: "F4", mode: "CONTEXTUAL", supportiveDirection: null, channelId: null },
  "f4-headline-cpi-mom": { kpiId: "f4-headline-cpi-mom", familyId: "F4", mode: "CONTEXTUAL", supportiveDirection: null, channelId: null },
  "f4-headline-cpi-yoy": { kpiId: "f4-headline-cpi-yoy", familyId: "F4", mode: "CONTEXTUAL", supportiveDirection: null, channelId: null },
  "f4-core-pce-mom": { kpiId: "f4-core-pce-mom", familyId: "F4", mode: "CONTEXTUAL", supportiveDirection: null, channelId: null },
  "f4-core-pce-yoy": { kpiId: "f4-core-pce-yoy", familyId: "F4", mode: "CONTEXTUAL", supportiveDirection: null, channelId: null },
  "f4-headline-pce-yoy": { kpiId: "f4-headline-pce-yoy", familyId: "F4", mode: "CONTEXTUAL", supportiveDirection: null, channelId: null },
  "f4-core-cpi-3m-ann": { kpiId: "f4-core-cpi-3m-ann", familyId: "F4", mode: "CONTEXTUAL", supportiveDirection: null, channelId: null },
  "f4-ppi-final-demand": { kpiId: "f4-ppi-final-demand", familyId: "F4", mode: "CONTEXTUAL", supportiveDirection: null, channelId: null },

  // ---------------------------------------------- F5: Employment / Growth
  "f5-unemployment": { kpiId: "f5-unemployment", familyId: "F5", mode: "CONTEXTUAL", supportiveDirection: null, channelId: null },
  "f5-payrolls-latest": { kpiId: "f5-payrolls-latest", familyId: "F5", mode: "CONTEXTUAL", supportiveDirection: null, channelId: null },
  "f5-payrolls-3m": { kpiId: "f5-payrolls-3m", familyId: "F5", mode: "CONTEXTUAL", supportiveDirection: null, channelId: null },
  "f5-claims-4w": { kpiId: "f5-claims-4w", familyId: "F5", mode: "CONTEXTUAL", supportiveDirection: null, channelId: null },
  "f5-claims-initial": { kpiId: "f5-claims-initial", familyId: "F5", mode: "CONTEXTUAL", supportiveDirection: null, channelId: null },
  "f5-claims-continuing": { kpiId: "f5-claims-continuing", familyId: "F5", mode: "CONTEXTUAL", supportiveDirection: null, channelId: null },
  "f5-ahe-mom": { kpiId: "f5-ahe-mom", familyId: "F5", mode: "CONTEXTUAL", supportiveDirection: null, channelId: null },
  "f5-payrolls-revision-2m": { kpiId: "f5-payrolls-revision-2m", familyId: "F5", mode: "CONTEXTUAL", supportiveDirection: null, channelId: null },
  "f5-ism-services": { kpiId: "f5-ism-services", familyId: "F5", mode: "CONTEXTUAL", supportiveDirection: null, channelId: null },
  "f5-ism-manufacturing": { kpiId: "f5-ism-manufacturing", familyId: "F5", mode: "CONTEXTUAL", supportiveDirection: null, channelId: null },
  "f5-gdpnow": { kpiId: "f5-gdpnow", familyId: "F5", mode: "CONTEXTUAL", supportiveDirection: null, channelId: null },

  // -------------------------------------------------------- F6: USD / FX
  // All three share ONE USD channel — a stronger dollar is adverse for Gold
  // regardless of which of the three KPIs shows it (see families/f6.ts).
  // Bug fix vs. the prior static fixtures: Today %/5D % previously carried
  // CONTRADICTORY tags (support vs. adverse) for the same instrument; both
  // are now DOWN, consistent with the level.
  "f6-dxy-recon-level": { kpiId: "f6-dxy-recon-level", familyId: "F6", mode: "OBSERVATION_DELTA", supportiveDirection: "DOWN", channelId: "USD" },
  "f6-dxy-recon-today": { kpiId: "f6-dxy-recon-today", familyId: "F6", mode: "CURRENT_SIGN", supportiveDirection: "DOWN", channelId: "USD" },
  "f6-dxy-recon-5d": { kpiId: "f6-dxy-recon-5d", familyId: "F6", mode: "CURRENT_SIGN", supportiveDirection: "DOWN", channelId: "USD" },
  "f6-usd-state": { kpiId: "f6-usd-state", familyId: "F6", mode: "CONTEXTUAL", supportiveDirection: null, channelId: null },

  // ------------------------------------------------ F7: Risk / Credit / Vol
  "f7-vix": { kpiId: "f7-vix", familyId: "F7", mode: "CONTEXTUAL", supportiveDirection: null, channelId: null },
  "f7-vix-1d": { kpiId: "f7-vix-1d", familyId: "F7", mode: "CONTEXTUAL", supportiveDirection: null, channelId: null },
  "f7-move": { kpiId: "f7-move", familyId: "F7", mode: "CONTEXTUAL", supportiveDirection: null, channelId: null },
  "f7-move-1d": { kpiId: "f7-move-1d", familyId: "F7", mode: "CONTEXTUAL", supportiveDirection: null, channelId: null },
  "f7-hy-oas": { kpiId: "f7-hy-oas", familyId: "F7", mode: "CONTEXTUAL", supportiveDirection: null, channelId: null },
  "f7-hy-oas-1d": { kpiId: "f7-hy-oas-1d", familyId: "F7", mode: "CONTEXTUAL", supportiveDirection: null, channelId: null },
  "f7-ig-oas": { kpiId: "f7-ig-oas", familyId: "F7", mode: "CONTEXTUAL", supportiveDirection: null, channelId: null },

  // ------------------------------------------------ F8: Liquidity / Funding
  "f8-reserves-level": { kpiId: "f8-reserves-level", familyId: "F8", mode: "CONTEXTUAL", supportiveDirection: null, channelId: null },
  "f8-reserves-wow": { kpiId: "f8-reserves-wow", familyId: "F8", mode: "CONTEXTUAL", supportiveDirection: null, channelId: null },
  "f8-tga-level": { kpiId: "f8-tga-level", familyId: "F8", mode: "CONTEXTUAL", supportiveDirection: null, channelId: null },
  "f8-tga-daily": { kpiId: "f8-tga-daily", familyId: "F8", mode: "CONTEXTUAL", supportiveDirection: null, channelId: null },
  "f8-funding-microstate": { kpiId: "f8-funding-microstate", familyId: "F8", mode: "CONTEXTUAL", supportiveDirection: null, channelId: null },
  "f8-sofr-iorb": { kpiId: "f8-sofr-iorb", familyId: "F8", mode: "CONTEXTUAL", supportiveDirection: null, channelId: null },
  "f8-effr-iorb": { kpiId: "f8-effr-iorb", familyId: "F8", mode: "CONTEXTUAL", supportiveDirection: null, channelId: null },

  // ------------------------------------------------- F9: Treasury / Fiscal
  "f9-qra-borrowing": { kpiId: "f9-qra-borrowing", familyId: "F9", mode: "CONTEXTUAL", supportiveDirection: null, channelId: null },
  "f9-qra-revision": { kpiId: "f9-qra-revision", familyId: "F9", mode: "CONTEXTUAL", supportiveDirection: null, channelId: null },
  "f9-auction-high-yield": { kpiId: "f9-auction-high-yield", familyId: "F9", mode: "CONTEXTUAL", supportiveDirection: null, channelId: null },
  "f9-auction-btc": { kpiId: "f9-auction-btc", familyId: "F9", mode: "CONTEXTUAL", supportiveDirection: null, channelId: null },
  "f9-auction-indirect": { kpiId: "f9-auction-indirect", familyId: "F9", mode: "CONTEXTUAL", supportiveDirection: null, channelId: null },

  // ---------------------------------------------- F10: Flows / Positioning
  // MM net %/WoW share FUTURES_POSITIONING; ETF holdings/delta share
  // ETF_FLOWS. Rising net length / rising ETF holdings is supportive
  // (standard convention — not separately quantified in the product spec,
  // documented here as a judgment call). See families/f10.ts.
  "f10-mm-net-pct": { kpiId: "f10-mm-net-pct", familyId: "F10", mode: "OBSERVATION_DELTA", supportiveDirection: "UP", channelId: "FUTURES_POSITIONING" },
  "f10-mm-wow-pp": { kpiId: "f10-mm-wow-pp", familyId: "F10", mode: "CURRENT_SIGN", supportiveDirection: "UP", channelId: "FUTURES_POSITIONING" },
  "f10-mm-percentile": { kpiId: "f10-mm-percentile", familyId: "F10", mode: "CONTEXTUAL", supportiveDirection: null, channelId: null },
  "f10-etf-holdings": { kpiId: "f10-etf-holdings", familyId: "F10", mode: "OBSERVATION_DELTA", supportiveDirection: "UP", channelId: "ETF_FLOWS" },
  "f10-etf-delta": { kpiId: "f10-etf-delta", familyId: "F10", mode: "CURRENT_SIGN", supportiveDirection: "UP", channelId: "ETF_FLOWS" },
  "f10-etf-delta-5d": { kpiId: "f10-etf-delta-5d", familyId: "F10", mode: "CONTEXTUAL", supportiveDirection: null, channelId: null },
  "f10-etf-delta-20d": { kpiId: "f10-etf-delta-20d", familyId: "F10", mode: "CONTEXTUAL", supportiveDirection: null, channelId: null },
  "f10-etf-flow-z60": { kpiId: "f10-etf-flow-z60", familyId: "F10", mode: "CONTEXTUAL", supportiveDirection: null, channelId: null },
  "f10-etf-flow-percentile": { kpiId: "f10-etf-flow-percentile", familyId: "F10", mode: "CONTEXTUAL", supportiveDirection: null, channelId: null },
  "f10-gld-return-5d": { kpiId: "f10-gld-return-5d", familyId: "F10", mode: "CONTEXTUAL", supportiveDirection: null, channelId: null },
  "f10-gld-return-20d": { kpiId: "f10-gld-return-20d", familyId: "F10", mode: "CONTEXTUAL", supportiveDirection: null, channelId: null },

  // ------------------------------------------------- F11: Gold Options / Vol
  "f11-gvz": { kpiId: "f11-gvz", familyId: "F11", mode: "CONTEXTUAL", supportiveDirection: null, channelId: null },
  "f11-gvz-1d": { kpiId: "f11-gvz-1d", familyId: "F11", mode: "CONTEXTUAL", supportiveDirection: null, channelId: null },
  "f11-gvz-5d": { kpiId: "f11-gvz-5d", familyId: "F11", mode: "CONTEXTUAL", supportiveDirection: null, channelId: null },
};

/** Throws (rather than silently defaulting) when a KPI id has no registry entry — a missing rule is a bug to fix, never a valid "no rule" state. */
export function getRuleForKpi(kpiId: string): MechanicalRuleDefinition {
  const rule = MECHANICAL_RULES[kpiId];
  if (!rule) throw new Error(`getRuleForKpi: no MechanicalRuleDefinition registered for KPI id "${kpiId}".`);
  return rule;
}

/** Every KPI id sharing a given channel, in registry order. */
export function channelMembers(channelId: MechanicalChannelId): string[] {
  return Object.values(MECHANICAL_RULES)
    .filter((rule) => rule.channelId === channelId)
    .map((rule) => rule.kpiId);
}
