import assert from "node:assert/strict";
import test from "node:test";
import { adaptLearningScenarioTree } from "../apps/frontend/src/lib/sundayRead/learningScenarioTree.ts";

test("v6 adaptation preserves canonical titles, topology and conditional status without evidence", () => {
  const canonical = { root_id: "root", nodes: [{ id: "child", parent_id: "root", title_fr: "USD", condition_fr: "Si…", causal_path_fr: "Parce que…" }, { id: "root", parent_id: null, title_fr: "Racine", condition_fr: "Au cutoff", causal_path_fr: "Canaux" }], edges: [{ from_id: "root", to_id: "child", observable_condition_fr: "Observable", causal_explanation_fr: "Transmission" }] };
  const result = adaptLearningScenarioTree(canonical);
  assert.deepEqual(result.tree.nodes.map(n => n.id), ["root", "child"]);
  assert.equal(result.tree.nodes[1].label, "USD");
  assert.ok(result.tree.nodes.every(n => n.status === "CONDITIONAL" && n.evidence_refs.length === 0));
  assert.deepEqual(result.tree.edges.map(e => [e.from, e.to]), [["root", "child"]]);
  assert.equal(result.presentation.edges[0].explanation, "Transmission");
});
