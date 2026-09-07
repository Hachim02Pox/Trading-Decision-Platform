import type { AnalysisPolicy, ModelRoleIdentity } from "@gold-terminal/contracts";

// Milestone 1D — multi-model ensemble architecture (mock only). See
// docs/KPI_INTELLIGENCE_ARCHITECTURE.md section (d). `provider`/`model` are
// open strings in the contract on purpose — never hardcode real provider
// names (`"anthropic"`/`"openai"`/`"gemini"`) here as if they were wired
// up. Every identity below is a `"mock"` placeholder; swapping in real
// models later is a values-only change to this file, not a restructuring
// of the pipeline.

export interface PolicyConfig {
  analysts: ModelRoleIdentity[];
  challenger: ModelRoleIdentity | null;
  adjudicator: ModelRoleIdentity;
}

const ANALYST_A: ModelRoleIdentity = { provider: "mock", model: "analyst-a-v1", promptVersion: "v1" };
const ANALYST_B: ModelRoleIdentity = { provider: "mock", model: "analyst-b-v1", promptVersion: "v1" };
const ANALYST_C: ModelRoleIdentity = { provider: "mock", model: "analyst-c-v1", promptVersion: "v1" };
const CHALLENGER: ModelRoleIdentity = { provider: "mock", model: "challenger-v1", promptVersion: "v1" };
const ADJUDICATOR: ModelRoleIdentity = { provider: "mock", model: "adjudicator-v1", promptVersion: "v1" };

// STANDARD = 2 analysts + adjudicator, no challenger. HIGH_SCRUTINY = 3
// analysts + challenger + adjudicator. Policy-per-family assignment is a
// future benchmarking decision, not locked in this milestone — see
// HIGH_SCRUTINY_KPI_IDS below for today's small illustrative subset.
export const ANALYSIS_POLICIES: Record<AnalysisPolicy, PolicyConfig> = {
  STANDARD: {
    analysts: [ANALYST_A, ANALYST_B],
    challenger: null,
    adjudicator: ADJUDICATOR,
  },
  HIGH_SCRUTINY: {
    analysts: [ANALYST_A, ANALYST_B, ANALYST_C],
    challenger: CHALLENGER,
    adjudicator: ADJUDICATOR,
  },
};

// The small illustrative subset (3-5 KPIs) that runs HIGH_SCRUTINY end to
// end, chosen from KPIs that already carry rich hand-authored mock content
// so the challenge stage has something substantive to work with. Every
// other cockpit-visible KPI defaults to STANDARD.
export const HIGH_SCRUTINY_KPI_IDS: readonly string[] = [
  "f2-10y",
  "f4-core-cpi-mom",
  "f7-hy-oas",
  "f5-payrolls-latest",
  "f8-tga-daily",
];

export function policyForKpi(kpiId: string): AnalysisPolicy {
  return HIGH_SCRUTINY_KPI_IDS.includes(kpiId) ? "HIGH_SCRUTINY" : "STANDARD";
}
