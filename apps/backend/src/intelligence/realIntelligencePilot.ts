import { policyForKpi } from "./ensemble/policies";
import { realProviderIdsForPolicy } from "./ensemble/realPolicies";
import { isRealLlmProviderConfigured } from "./providers/realLlmProviderRegistry";

// Real-intelligence activation — deliberate, cost-conscious PILOT.
//
// This is the FIRST real-money AI/research activation in this project.
// Firing real generation calls for all ~29 cockpit KPIs at once would be
// both expensive and risky to get right on the first try, so real
// generation is gated to exactly this small, hardcoded set of KPI ids.
// Every other cockpit-visible KPI keeps using the existing mock generator
// unconditionally, even once DATA_MODE=REAL is set — see
// apps/backend/src/intelligence/bootstrap.ts's routing logic and
// docs/KPI_INTELLIGENCE_ARCHITECTURE.md's "Real intelligence pilot" section.
//
// These five ids are exactly the pre-existing HIGH_SCRUTINY_KPI_IDS set
// (apps/backend/src/intelligence/ensemble/policies.ts) — chosen because they
// already carry the richest hand-authored mock content and the full
// 3-analyst + challenger + adjudicator ensemble treatment, making them the
// best real-vs-mock comparison baseline.
//
// To expand the pilot later: add more kpi ids to this array (and, if a
// newly-added id's AnalysisPolicy differs from what's already covered,
// confirm apps/backend/src/intelligence/ensemble/realPolicies.ts has a
// sensible REAL_ANALYSIS_POLICY_ASSIGNMENTS entry for that policy). No other
// file needs to change to grow the pilot.
export const REAL_INTELLIGENCE_PILOT_KPI_IDS: readonly string[] = [
  "f2-10y",
  "f4-core-cpi-mom",
  "f7-hy-oas",
  "f5-payrolls-latest",
  "f8-tga-daily",
];

export function isPilotKpi(kpiId: string): boolean {
  return REAL_INTELLIGENCE_PILOT_KPI_IDS.includes(kpiId);
}

/**
 * True only when EVERY real provider this KPI's policy would actually call
 * (analysts + challenger + adjudicator) has a present credential. This is a
 * clean, explicit, all-or-nothing pre-flight check: a pilot KPI with even
 * one missing provider falls back to the ordinary mock generator for its
 * ENTIRE interpretation, never a partial-real/partial-mock result — see
 * bootstrap.ts's routing.
 */
export function arePilotProvidersConfigured(kpiId: string): boolean {
  const policy = policyForKpi(kpiId);
  return realProviderIdsForPolicy(policy).every((providerId) => isRealLlmProviderConfigured(providerId));
}
