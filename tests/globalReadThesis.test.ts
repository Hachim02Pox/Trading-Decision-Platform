import assert from "node:assert/strict";
import { test } from "node:test";
import { evaluateThesis, evaluateCondition } from "../apps/backend/src/intelligence/globalRead/thesis";
import type { GlobalReadAdmission, GlobalReadProposal, GlobalReadFact } from "../packages/contracts/src/globalRead";

const now = "2026-09-05T12:00:00.000Z";
const fact = (ref: string, value: number, role: GlobalReadFact["role"]): GlobalReadAdmission => ({ ref, status: "VERIFIED", terminalValue: value, admittedValue: value, reason: "fixture", observations: [], selected: {
  ref, value, role, metric: "US2Y", unit: "%", period: "2026-09-04", definition: "fixture", instrument: "US", transform: "PAR_YIELD", seasonality: "NA", vintage: now, knownAt: now, observationAt: now, retrievedAt: now, latestCheckedAt: now, expectedCadence: "DAILY", effectiveFreshnessStatus: "CURRENT", sourceUrl: "https://home.treasury.gov/", sourceType: "PRIMARY", verification: "STRUCTURED", dependencyRefs: [], releaseGroup: "fixture-release",
} });
const proposal = (): GlobalReadProposal => ({ thesis: "GOLD_SUPPORTIVE", marginalDriver: "Conditional policy repricing", background: "background", catalystRefs: ["release"], expectationRefs: ["expectation"], repricingRefs: ["repricing"], transmissionRefs: ["transmission"], decisionCriticalRefs: ["release", "expectation", "repricing", "transmission", "baseline"], priced: "Measured expectation", incrementalSurprise: "Incremental path revision", remainingEdge: "Conditional further repricing", positioning: "Optional", validWhile: ["Transmission persists"], invalidations: [{ description: "Transmission reverses beyond its evidenced baseline", leftRef: "transmission", operator: "GT", rightRef: "baseline" }], flip: { thesis: "UNCLEAR", conditions: [], newEvidenceRefs: [], rationale: "No new opposite cause" }, scenarios: ["BASE", "ALTERNATIVE", "ADVERSE"].map((kind) => ({ kind: kind as "BASE", description: "Conditional", catalystRefs: [], expectedObservations: ["Observe"], invalidatedBy: "Condition" })), webCandidates: [], contradictions: [] });
const evidence = () => [fact("release", 0.3, "CATALYST"), fact("expectation", 4, "EXPECTATION"), fact("repricing", 3.8, "REPRICING"), fact("transmission", 3.8, "TRANSMISSION"), fact("baseline", 4, "TRANSMISSION")];
const input = () => ({ proposal: proposal(), evidence: evidence(), now, priceTest: { state: "CONFIRMS" as const, reason: "fixture configured methodology", reference: "fixture", from: now, to: now, change: 1, sourceUrl: "https://example.com" }, catalysts: [], eventGuardSeconds: 600, isolationControlled: true, calendarComplete: true });

test("clean complete causal core can be OPPORTUNITY, optional gaps do not veto", () => {
  assert.equal(evaluateThesis(input()).readiness, "OPPORTUNITY");
  const data = input();
  data.evidence.push({ ...fact("optional", 1, "POSITIONING"), status: "UNAVAILABLE", selected: null });
  assert.equal(evaluateThesis(data).readiness, "OPPORTUNITY");
});
test("critical conflict and fake/omitted chain refs cannot produce opportunity", () => {
  const data = input(); data.evidence[0] = { ...data.evidence[0], status: "CONFLICT", selected: null };
  assert.equal(evaluateThesis(data).readiness, "NO_OPPORTUNITY");
  const omitted = input(); omitted.proposal.decisionCriticalRefs = [];
  assert.equal(evaluateThesis(omitted).readiness, "NO_OPPORTUNITY");
});
test("CPI imminent yields WATCH with concrete resolver, not invalidation or a forced flip", () => {
  const result = evaluateThesis({ ...input(), catalysts: [{ ref: "cpi", title: "CPI", scheduledAt: "2026-09-05T12:05:00.000Z", sourceUrl: "https://www.bls.gov/", verified: true, group: "CPI", phase: "RELEASE" }] });
  assert.equal(result.readiness, "WATCH"); assert.ok(result.blockers.some((b) => b.resolver?.includes("CPI")));
  assert.equal(result.thesis, "GOLD_SUPPORTIVE");
});
test("already true or invented invalidation is rejected", () => {
  const data = input(); data.proposal.invalidations[0].operator = "LT";
  assert.equal(evaluateThesis(data).readiness, "NO_OPPORTUNITY");
  assert.equal(evaluateCondition({ description: "invented", leftRef: "transmission", rightRef: "3.95", operator: "GT" }, evidence()), "UNDEFINED");
});
test("extension alone is not a trap and missing core cannot become endless WATCH", () => {
  assert.equal(evaluateThesis(input()).trap, "NOT_ESTABLISHED");
  const result = evaluateThesis({ ...input(), priceTest: { ...input().priceTest, state: "INCONCLUSIVE", reason: "UNDEFINED reference" } });
  assert.equal(result.readiness, "NO_OPPORTUNITY");
});
test("price moving opposite does not manufacture an independently supported flip", () => {
  const data = input(); data.proposal.flip = { thesis: "GOLD_ADVERSE", conditions: [], newEvidenceRefs: ["repricing"], rationale: "price fell" };
  assert.equal(evaluateThesis(data).flip, null);
});
