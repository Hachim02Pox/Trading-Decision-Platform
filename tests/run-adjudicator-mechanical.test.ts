import assert from "node:assert/strict";
import test from "node:test";
import type { AnalystConclusion } from "../packages/contracts/src/index";
import { runAdjudicator } from "../apps/backend/src/intelligence/ensemble/runAdjudicator.ts";

function analyst(role: "A" | "B" | "C", finalGoldRead: "SUPPORTIVE" | "ADVERSE" | "CONTEXTUAL"): AnalystConclusion {
  return {
    role,
    modelIdentity: { provider: "mock", model: "mock", promptVersion: "v1" },
    finalGoldRead,
    shortConclusion: `mock says ${finalGoldRead}`,
    keyPoints: [],
    dataVerification: "mock verification",
  };
}

test("a MECHANICAL_RULE KPI (mechanicalGoldRead SUPPORTIVE) ignores unanimous ADVERSE analyst votes", () => {
  const result = runAdjudicator({
    policy: "STANDARD",
    language: "EN",
    mechanicalGoldRead: "SUPPORTIVE",
    forceContextualDespiteMechanical: false,
    scenarioEvidenceState: "STRONG",
    hasContradictingEvidence: false,
    analystConclusions: [analyst("A", "ADVERSE"), analyst("B", "ADVERSE")],
    challengeFindings: [],
  });
  assert.equal(result.finalGoldRead, "SUPPORTIVE");
});

test("a MECHANICAL_RULE KPI (mechanicalGoldRead ADVERSE) ignores unanimous SUPPORTIVE analyst votes", () => {
  const result = runAdjudicator({
    policy: "STANDARD",
    language: "EN",
    mechanicalGoldRead: "ADVERSE",
    forceContextualDespiteMechanical: false,
    scenarioEvidenceState: "STRONG",
    hasContradictingEvidence: false,
    analystConclusions: [analyst("A", "SUPPORTIVE")],
    challengeFindings: [],
  });
  assert.equal(result.finalGoldRead, "ADVERSE");
});

test("forceContextualDespiteMechanical explicitly sets aside an active mechanical read for CONTEXTUAL", () => {
  const result = runAdjudicator({
    policy: "STANDARD",
    language: "EN",
    mechanicalGoldRead: "SUPPORTIVE",
    forceContextualDespiteMechanical: true,
    scenarioEvidenceState: "STRONG",
    hasContradictingEvidence: false,
    analystConclusions: [analyst("A", "SUPPORTIVE")],
    challengeFindings: [],
  });
  assert.equal(result.finalGoldRead, "CONTEXTUAL");
});

test("a mechanically CONTEXTUAL KPI applies the existing UNANIMOUS/MAJORITY/disagreement analyst logic freely", () => {
  const unanimous = runAdjudicator({
    policy: "STANDARD",
    language: "EN",
    mechanicalGoldRead: "CONTEXTUAL",
    forceContextualDespiteMechanical: false,
    scenarioEvidenceState: "STRONG",
    hasContradictingEvidence: false,
    analystConclusions: [analyst("A", "SUPPORTIVE"), analyst("B", "SUPPORTIVE")],
    challengeFindings: [],
  });
  assert.equal(unanimous.finalGoldRead, "SUPPORTIVE");

  const disagreement = runAdjudicator({
    policy: "STANDARD",
    language: "EN",
    mechanicalGoldRead: "CONTEXTUAL",
    forceContextualDespiteMechanical: false,
    scenarioEvidenceState: "LIMITED",
    hasContradictingEvidence: false,
    analystConclusions: [analyst("A", "SUPPORTIVE"), analyst("B", "ADVERSE")],
    challengeFindings: [],
  });
  assert.equal(disagreement.finalGoldRead, "CONTEXTUAL");
});
