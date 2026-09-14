import assert from "node:assert/strict";
import { test } from "node:test";
import {
  createFixtureFinalRead,
  validateFinalRead,
  validateEvidenceDocument,
} from "../apps/backend/src/sundayRead/schema";
import { normalizedSourceKey } from "../apps/backend/src/sundayRead/provenance";

test("fixture final read is valid and every directional terminal follows an asymmetry gate", () => {
  const read = createFixtureFinalRead();
  assert.deepEqual(validateFinalRead(read), []);
  assert.ok(
    read.scenario_tree.nodes.some((node) => node.type === "ASYMMETRY_GATE"),
  );
  assert.ok(
    read.scenario_tree.nodes.filter((node) => node.type === "TERMINAL")
      .length >= 3,
  );
  assert.ok(read.scenario_tree.edges.some((edge) => edge.label));
  assert.equal(read.competing_hypotheses?.length, 2);
  assert.equal(read.cross_asset_reality_test?.summary.includes("DEMO"), true);
  assert.equal(read.scenario_explanations.length, 3);
  assert.ok(
    read.scenario_explanations.every(
      (explanation) =>
        explanation.summary &&
        explanation.meaning &&
        explanation.waits_for.length > 0 &&
        explanation.invalidations.length > 0 &&
        explanation.branch_node_ids.length > 0,
    ),
  );
});

test("final read rejects an incomplete branch explanation", () => {
  const read = createFixtureFinalRead();
  read.scenario_explanations[0] = {
    ...read.scenario_explanations[0],
    waits_for: "missing array" as unknown as string[],
  };
  assert.match(validateFinalRead(read).join("\n"), /scenario explanation/i);
});

test("final read rejects a directional terminal without an asymmetry ancestor", () => {
  const read = createFixtureFinalRead();
  const terminal = read.scenario_tree.nodes.find(
    (node) => node.id === "bull-terminal",
  );
  if (terminal) terminal.terminal_outcome = "BULLISH";
  read.scenario_tree.edges = read.scenario_tree.edges.filter(
    (edge) => edge.from !== "bull-gate",
  );
  assert.match(validateFinalRead(read).join("\n"), /asymmetry gate/i);
});

test("evidence accepts unknown facts without inventing a value", () => {
  assert.deepEqual(
    validateEvidenceDocument({
      job: "family_1_fed",
      status: "PARTIAL",
      evidence: [
        {
          id: "x",
          family: "family_1_fed",
          owner: "research",
          statement: "Unavailable",
          value: null,
          unit: null,
          as_of: null,
          measurement_window: null,
          status: "UNKNOWN",
          type: "STATE",
          epistemic_status: "UNKNOWN",
          change_status: "UNKNOWN",
          source_refs: [],
          reported_link_type: "UNCLEAR",
          notes: "Not returned",
        },
      ],
      sources: [],
    }),
    [],
  );
});

test("source normalization removes tracking parameters without claiming independent provenance", () => {
  assert.equal(
    normalizedSourceKey("https://Example.com/a/?utm_source=x#section"),
    "https://example.com/a",
  );
});
