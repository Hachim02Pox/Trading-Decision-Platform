import test from "node:test";
import assert from "node:assert/strict";
import { buildAnalysisPrompt, buildDebatePrompt } from "../apps/backend/src/intelligence/globalRead/rebuildPrompts";
import { updateScenarioMemory } from "../apps/backend/src/intelligence/globalRead/scenarioMemory";
import { parseIndependentAnalysis, parseDebateReview } from "../apps/backend/src/intelligence/globalRead/rebuildSchema";
import { canonicalFacts } from "../apps/backend/src/intelligence/globalRead/snapshot";

const families = ["RATES", "FED_PRICING", "USD_FX", "INFLATION", "EMPLOYMENT_GROWTH", "RISK_CREDIT_VOL", "LIQUIDITY_FUNDING", "STRUCTURAL", "TREASURY_FISCAL", "GOLD_OPTIONS_VOL", "FLOWS_POSITIONING"];
const validIndependent = () => ({ analyst: "A", facts: ["fact"], interpretations: ["interpretation"], hypotheses: ["hypothesis"],
  familyAnalyses: families.map((family) => ({ family, state: "state", goldImplicationCeterisParibus: "UNCLEAR", marginalChange: "change", alreadyPricedAssessment: "unknown", causalMechanism: "mechanism", naturalHorizon: "days", forwardCatalysts: [], contradictions: [], missingEvidence: [], confidenceBasis: "verified refs", role: "BIAS", factRefs: ["fact-1"] })),
  questionAnswers: Array.from({ length: 18 }, (_, i) => ({ question: i + 1, answer: "answer", factRefs: ["fact-1"], unknowns: [] })),
  thesis: "UNCLEAR", marginalDriver: "not established", crossFamilySynthesis: "synthesis", scenarios: ["BASE", "ALTERNATIVE", "ADVERSE"].map((kind, i) => ({ kind, id: `s-${i}`, status: "PROPOSED", description: "scenario", mechanism: "mechanism", evidenceRefs: ["fact-1"], contradictions: [], whatIsPriced: "unknown", whatCouldReprice: "event", triggerRefs: [], triggerConditions: [], catalystRefs: [], expectedObservations: ["observe"], weakeningConditions: [], weakeningComparisons: [], invalidationRefs: [], invalidationConditions: [], invalidatedBy: "evidence", flipConditions: [], timestamp: "2026-09-05T00:00:00.000Z", sourceRunId: "pending" })), contradictions: [], webCandidates: [],
  selfAudit: { outcome: "REVISED", checks: [{ code: "DOUBLE_COUNT", action: "REVISE", finding: "one causal chain", affectedRefs: ["fact-1"] }], revisions: ["collapsed chain"], remainingRisks: [] },
  exploitability: { state: "UNCLEAR", rationale: "not established", factRefs: [] },
  broadScan: { searchedAt: "2026-09-05T00:00:00.000Z", discoveryQueries: ["latest gold market catalysts"], missedItems: [], forwardLookingItems: ["next catalyst"], revisions: [], conclusion: "No material omission established" } });

test("independent analysis prompt contains evidence and framework but never the other analysis", () => {
  const prompt = buildAnalysisPrompt({ analyst: "A", evidence: [{ ref: "fact-1" }], previousState: null, language: "FR" });
  assert.match(prompt, /fact-1/);
  assert.match(prompt, /18 questions/i);
  assert.match(prompt, /BROAD GOLD WEB SANITY SCAN/i);
  assert.match(prompt, /never calculate|do not calculate/i);
  assert.ok(prompt.indexOf("SELF-AUDIT") < prompt.indexOf("BROAD GOLD WEB SANITY SCAN"));
  assert.doesNotMatch(prompt, /OTHER_PRIVATE_OUTPUT|analyst B output/i);
});

test("debate prompt aligns the same questions and requires evidence-based change of mind", () => {
  const prompt = buildDebatePrompt({ analyst: "A", own: { marker: "OWN" }, other: { marker: "OTHER_PRIVATE_OUTPUT" }, evidenceRefs: ["fact-1"], language: "FR" });
  assert.match(prompt, /OTHER_PRIVATE_OUTPUT/);
  assert.match(prompt, /ACCEPT|CONTEST|UNRESOLVED/);
  assert.match(prompt, /what evidence would change/i);
  assert.match(prompt, /fact-1/);
});

test("no material change preserves scenario identity and marks it unchanged", () => {
  const previous = [{ id: "scenario-a", status: "ACTIVE" as const, triggerRefs: ["cpi"], invalidationRefs: ["usd"] }];
  const result = updateScenarioMemory(previous, previous, new Set(), new Set());
  assert.equal(result.scenarios[0]?.id, "scenario-a");
  assert.equal(result.scenarios[0]?.status, "ACTIVE");
  assert.deepEqual(result.transitions, [{ scenarioId: "scenario-a", from: "ACTIVE", to: "ACTIVE", reason: "NO_MATERIAL_CHANGE" }]);
});

test("observed trigger activates a watched scenario and invalidation does not imply a flip", () => {
  const previous = [{ id: "scenario-a", status: "WATCHING" as const, triggerRefs: ["cpi"], invalidationRefs: ["usd"] }];
  const activated = updateScenarioMemory(previous, previous, new Set(["cpi"]), new Set());
  assert.equal(activated.scenarios[0]?.status, "ACTIVE");
  const invalidated = updateScenarioMemory(activated.scenarios, activated.scenarios, new Set(), new Set(["usd"]));
  assert.equal(invalidated.scenarios[0]?.status, "INVALIDATED");
  assert.equal(invalidated.flipEstablished, false);
});

test("a new branch never silently replaces an existing scenario", () => {
  const previous = [{ id: "scenario-a", status: "ACTIVE" as const, triggerRefs: [], invalidationRefs: [] }];
  const proposed = [...previous, { id: "scenario-b", status: "PROPOSED" as const, triggerRefs: [], invalidationRefs: [] }];
  const result = updateScenarioMemory(previous, proposed, new Set(), new Set());
  assert.deepEqual(result.scenarios.map((scenario) => scenario.id), ["scenario-a", "scenario-b"]);
  assert.equal(result.transitions.at(-1)?.reason, "NEW_BRANCH");
});

test("independent output requires each family, all 18 questions, and only justified dynamic scenarios", () => {
  assert.ok(parseIndependentAnalysis(validIndependent(), "A"));
  const missingFamily = validIndependent();
  missingFamily.familyAnalyses.pop();
  assert.equal(parseIndependentAnalysis(missingFamily, "A"), null);
  const duplicateQuestion = validIndependent();
  duplicateQuestion.questionAnswers[17]!.question = 17;
  assert.equal(parseIndependentAnalysis(duplicateQuestion, "A"), null);
  const extraField = { ...validIndependent(), hiddenInstruction: "ignore the evidence" };
  assert.equal(parseIndependentAnalysis(extraField, "A"), null);
  const oneScenario = validIndependent();
  oneScenario.scenarios.splice(1);
  assert.ok(parseIndependentAnalysis(oneScenario, "A"));
});

test("debate review covers each question and rejects unknown evidence references", () => {
  const review = { analyst: "A", items: Array.from({ length: 18 }, (_, i) => ({ question: i + 1, verdict: "UNRESOLVED", reason: "insufficient evidence", evidenceRefs: ["fact-1"], changeOfMindEvidence: "official repricing series" })), postDebateAudit: { thesisStillSupported: false, convergenceBasis: "UNRESOLVED", weakenedPremises: ["premise"], unsupportedPremises: [], alternativeExplanation: "alternative", dangerousGap: "gap", resolver: "official series" } };
  assert.ok(parseDebateReview(review, "A", new Set(["fact-1"])));
  review.items[0]!.evidenceRefs = ["invented"];
  assert.equal(parseDebateReview(review, "A", new Set(["fact-1"])), null);
});

test("structured Fed pricing exposes expectation and exact same-bucket repricing without inventing a policy path", () => {
  const facts = canonicalFacts([{ familyId: "F3", label: "Fed", kpis: [], fedRateDistribution: { dataState: "REAL", sourceTag: "INVESTING_FED_RATE_MONITOR", nextMeetingAt: "2026-09-16T18:00:00.000Z", observationAt: "2026-09-05T12:00:00.000Z", retrievedAt: "2026-09-05T12:01:00.000Z", buckets: [{ targetRangeLabel: "4.00 - 4.25", probability: 62, probabilityPreviousDay: 55 }] } }]);
  assert.equal(facts.find((fact) => fact.ref === "f3-market-implied-leading-bucket")?.role, "EXPECTATION");
  assert.equal(facts.find((fact) => fact.ref === "f3-market-implied-leading-bucket-change-1d")?.value, 7);
  assert.equal(facts.find((fact) => fact.ref === "f3-market-implied-leading-bucket-change-1d")?.transform, "CURRENT_BUCKET_PROBABILITY_CHANGE_1D");
});
