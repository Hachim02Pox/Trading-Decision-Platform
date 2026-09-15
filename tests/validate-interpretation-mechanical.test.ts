import assert from "node:assert/strict";
import test from "node:test";
import type { KpiInterpretation } from "../packages/contracts/src/index";
import { validateInterpretation } from "../apps/backend/src/intelligence/validateInterpretation.ts";

function baseInterpretation(overrides: Partial<KpiInterpretation> = {}): KpiInterpretation {
  return {
    kpiId: "f2-10y-real",
    familyId: "F2",
    interpretationAnalyzedAt: "2026-09-14T00:00:00.000Z",
    dataAsOf: "2026-09-14T00:00:00.000Z",
    evidenceLatestPublishedAt: null,
    comparison: {
      previous: { value: 1.8, unit: "%", observationAt: "2026-09-13T00:00:00.000Z", retrievedAt: "2026-09-13T00:00:00.000Z" },
      current: { value: 1.5, unit: "%", observationAt: "2026-09-14T00:00:00.000Z", retrievedAt: "2026-09-14T00:00:00.000Z" },
    },
    language: "EN",
    currentReadShort: "10Y real yield fell.",
    currentReadDetailed: "10Y real yield fell from 1.8% to 1.5%, lowering Gold's opportunity cost.",
    previousReadSummary: null,
    whatChangedSincePreviousRead: null,
    currentRead: "10Y real yield fell.",
    relationshipBasis: "MECHANICAL_RULE",
    mechanicalGoldRead: "SUPPORTIVE",
    finalGoldRead: "SUPPORTIVE",
    whyNow: "Real yields fell.",
    causalChain: [{ statement: "Real yield fell.", status: "FACT" }],
    supportingEvidenceIds: [],
    contradictingEvidenceIds: [],
    uncertaintyOrUnknowns: [],
    whatWouldStrengthen: [],
    whatWouldWeakenOrInvalidate: [],
    relevantRecentDevelopmentIds: [],
    researchSourceIds: [],
    evidenceState: "MODERATE",
    modelIdentity: { provider: "mock", model: "dev-fixture-v1" },
    promptVersion: "v1",
    isMock: true,
    sessionId: "test-session",
    auditTrail: {
      policy: "STANDARD",
      analystConclusions: [],
      challengeFindings: [],
      modelAgreement: "SINGLE_ANALYST",
      adjudicatorNotes: "test",
    },
    ...overrides,
  };
}

test("a well-formed MECHANICAL_RULE interpretation passes validation cleanly", () => {
  const { valid, issues } = validateInterpretation(baseInterpretation());
  assert.equal(valid, true);
  assert.deepEqual(issues, []);
});

test("a well-formed CONTEXTUAL_AI interpretation passes validation cleanly", () => {
  const { valid, issues } = validateInterpretation(
    baseInterpretation({ mechanicalGoldRead: "CONTEXTUAL", relationshipBasis: "CONTEXTUAL_AI", finalGoldRead: "CONTEXTUAL" })
  );
  assert.equal(valid, true);
  assert.deepEqual(issues, []);
});

test("relationshipBasis/mechanicalGoldRead inconsistency is detected", () => {
  const { valid, issues } = validateInterpretation(baseInterpretation({ relationshipBasis: "CONTEXTUAL_AI" }));
  assert.equal(valid, false);
  assert.ok(issues.some((i) => i.field === "relationshipBasis"));
});

test("finalGoldRead may never flip a SUPPORTIVE mechanicalGoldRead to ADVERSE", () => {
  const { valid, issues } = validateInterpretation(baseInterpretation({ finalGoldRead: "ADVERSE" }));
  assert.equal(valid, false);
  assert.ok(issues.some((i) => i.field === "finalGoldRead" && i.message.includes("SUPPORTIVE")));
});

test("finalGoldRead may never flip an ADVERSE mechanicalGoldRead to SUPPORTIVE", () => {
  const { valid, issues } = validateInterpretation(
    baseInterpretation({ mechanicalGoldRead: "ADVERSE", finalGoldRead: "SUPPORTIVE" })
  );
  assert.equal(valid, false);
  assert.ok(issues.some((i) => i.field === "finalGoldRead" && i.message.includes("ADVERSE")));
});

test("finalGoldRead may DEGRADE a mechanical read to CONTEXTUAL without an issue", () => {
  const { valid, issues } = validateInterpretation(baseInterpretation({ finalGoldRead: "CONTEXTUAL" }));
  assert.equal(valid, true);
  assert.deepEqual(issues, []);
});

test("an invalid mechanicalGoldRead enum value is rejected", () => {
  const { valid, issues } = validateInterpretation(baseInterpretation({ mechanicalGoldRead: "BULLISH" as never }));
  assert.equal(valid, false);
  assert.ok(issues.some((i) => i.field === "mechanicalGoldRead"));
});
