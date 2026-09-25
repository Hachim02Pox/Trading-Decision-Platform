import assert from "node:assert/strict";
import test from "node:test";
import { validateFinalRead } from "../apps/backend/src/sundayRead/schema.ts";

test("new REAL Sunday states require the V5 family and synthesis contract", () => {
  const state: any = { meta: { run_id: "v5", week_of: "2026-09-27", generated_at: "2026-09-25T04:00:00Z", data_mode: "REAL", status: "COMPLETE", run_type: "SUNDAY", document_type: "GOLD_MARKET_STATE", frontend_eligible: true, parent_run_id: null, origin_sunday_run_id: "v5", evidence_cutoff_start: "2026-09-20T00:00:00Z", evidence_cutoff_end: "2026-09-25T00:00:00Z" }, executive_narrative: "x", contexts: {}, priced_in: {}, scenario_tree: { nodes: [], edges: [] }, scenario_explanations: [], asymmetry: {}, catalysts: [], invalidations: [], contradictions: [], anomalies: [], unknowns: [], weekly_timeline: [], evidence: [], sources: [], direction_state: { macro_direction: "MIXED", directional_asymmetry: "BALANCED", positioning_asymmetry: "UNKNOWN", edge: "NO_EDGE" } };
  assert.ok(validateFinalRead(state).some((message) => message.includes("family_readouts")));
});

test("new REAL intermediates require an evolution review tied to their immediate parent", () => {
  const state: any = { meta: { run_id: "v5-i", week_of: "2026-09-27", generated_at: "2026-09-25T04:00:00Z", data_mode: "REAL", status: "COMPLETE", run_type: "INTERMEDIATE", document_type: "GOLD_MARKET_STATE", frontend_eligible: true, parent_run_id: "v5", origin_sunday_run_id: "v5", evidence_cutoff_start: "2026-09-25T00:00:00Z", evidence_cutoff_end: "2026-09-26T00:00:00Z" }, executive_narrative: "x", contexts: {}, priced_in: {}, scenario_tree: { nodes: [], edges: [] }, scenario_explanations: [], asymmetry: {}, catalysts: [], invalidations: [], contradictions: [], anomalies: [], unknowns: [], weekly_timeline: [], evidence: [], sources: [], direction_state: { macro_direction: "MIXED", directional_asymmetry: "BALANCED", positioning_asymmetry: "UNKNOWN", edge: "NO_EDGE" } };
  assert.ok(validateFinalRead(state).some((message) => message.includes("evolution_review")));
});
