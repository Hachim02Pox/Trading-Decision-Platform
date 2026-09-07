import test from "node:test";
import assert from "node:assert/strict";
import { buildGlobalReadRebuildDecision } from "../apps/backend/src/intelligence/globalRead/rebuildPipeline";
import type { GlobalReadIndependentAnalysis } from "../packages/contracts/src/globalRead";

const familyKeys = ["RATES", "FED_PRICING", "USD_FX", "INFLATION", "EMPLOYMENT_GROWTH", "RISK_CREDIT_VOL", "LIQUIDITY_FUNDING", "STRUCTURAL", "TREASURY_FISCAL", "GOLD_OPTIONS_VOL", "FLOWS_POSITIONING"] as const;
function analysis(analyst: "A" | "B"): GlobalReadIndependentAnalysis { return { analyst, facts: ["fact"], interpretations: ["interpretation"], hypotheses: ["hypothesis"],
  familyAnalyses: familyKeys.map((family) => ({ family, state: "state", goldImplicationCeterisParibus: "UNCLEAR", marginalChange: "change", alreadyPricedAssessment: "unknown", causalMechanism: "mechanism", naturalHorizon: "days", forwardCatalysts: [], contradictions: [], missingEvidence: [], confidenceBasis: "source", role: "BIAS", factRefs: [] })),
  questionAnswers: Array.from({ length: 18 }, (_, i) => ({ question: i + 1, answer: "answer", factRefs: [], unknowns: [] })), thesis: "UNCLEAR", marginalDriver: "not established", crossFamilySynthesis: "two scenarios remain", contradictions: [], webCandidates: [],
  selfAudit: { outcome: "REVISED", checks: [{ code: "UNVERIFIED_FACT", action: "REMOVE", finding: "unsupported claim removed", affectedRefs: [] }], revisions: ["Removed unsupported claim"], remainingRisks: ["data gap"] },
  exploitability: { state: "UNCLEAR", rationale: "No positioning edge established", factRefs: [] },
  broadScan: { searchedAt: "2026-09-05T00:00:00.000Z", discoveryQueries: ["latest gold market catalysts"], missedItems: [], forwardLookingItems: ["next catalyst"], revisions: [], conclusion: "No material omission established" },
  scenarios: ["BASE", "ALTERNATIVE", "ADVERSE"].map((kind, i) => ({ kind: kind as "BASE", id: `${kind.toLowerCase()}-${i}`, status: "PROPOSED", description: "scenario", mechanism: "mechanism", evidenceRefs: [], contradictions: [], whatIsPriced: "unknown", whatCouldReprice: "event", triggerRefs: [], triggerConditions: [], catalystRefs: [], expectedObservations: ["observe"], weakeningConditions: [], weakeningComparisons: [], invalidationRefs: [], invalidationConditions: [], invalidatedBy: "evidence", flipConditions: [], timestamp: "2026-09-05T00:00:00.000Z", sourceRunId: "pending" })) }; }
const review = (analyst: "A" | "B") => ({ analyst, items: Array.from({ length: 18 }, (_, i) => ({ question: i + 1, verdict: "UNRESOLVED", reason: "insufficient", evidenceRefs: [], changeOfMindEvidence: "new official evidence" })), postDebateAudit: { thesisStillSupported: false, convergenceBasis: "UNRESOLVED", weakenedPremises: ["missing evidence"], unsupportedPremises: [], alternativeExplanation: "alternative remains", dangerousGap: "data gap", resolver: "new official evidence" } });

test("pipeline verifies first, runs two analyses independently, then debate and final scan", async () => {
  const phases: string[] = [];
  let verified = false;
  const decision = await buildGlobalReadRebuildDecision([], "FR", ["claude-cli", "codex-cli"], null, {
    verify: async () => { verified = true; return []; }, calendars: async () => ({ events: [], warnings: ["partial"], complete: false }), web: async () => [],
    runCli: async (request) => { assert.equal(verified, true); phases.push(request.phase); return { provider: request.provider, phase: request.phase, output: request.phase === "ANALYSIS_A" ? analysis("A") : request.phase === "ANALYSIS_B" ? analysis("B") : request.phase === "DEBATE_A" || request.phase === "REPLY_A" ? review("A") : request.phase === "DEBATE_B" || request.phase === "REPLY_B" ? review("B") : { candidates: [] }, trace: [], durationMs: 1, isolation: "CONTROLLED", error: null }; }
  });
  assert.deepEqual(phases.slice(0, 2).sort(), ["ANALYSIS_A", "ANALYSIS_B"]);
  assert.deepEqual(phases.slice(2, 4).sort(), ["DEBATE_A", "DEBATE_B"]);
  assert.deepEqual(phases.slice(4, 6).sort(), ["REPLY_A", "REPLY_B"]);
  assert.equal(phases.at(-1), "FINAL_SCAN");
  assert.equal(decision.rebuild?.debateResolution, "UNRESOLVED");
  assert.equal(decision.rebuild?.operationalAction, "NO_CLEAN_EDGE");
  assert.ok(decision.rebuild?.causalGraph.nodes.some((node) => node.kind === "DRIVER"));
  assert.ok(decision.rebuild?.causalGraph.edges.some((edge) => edge.relation === "BRANCHES"));
});

test("one missing independent analysis fails closed before debate", async () => {
  const phases: string[] = [];
  const decision = await buildGlobalReadRebuildDecision([], "FR", ["claude-cli", "codex-cli"], null, {
    verify: async () => [], calendars: async () => ({ events: [], warnings: [], complete: true }), web: async () => [],
    runCli: async (request) => { phases.push(request.phase); return { provider: request.provider, phase: request.phase, output: request.phase === "ANALYSIS_A" ? analysis("A") : null, trace: [], durationMs: 1, isolation: "CONTROLLED", error: request.phase === "ANALYSIS_B" ? "failed" : null }; }
  });
  assert.deepEqual(phases.sort(), ["ANALYSIS_A", "ANALYSIS_B"]);
  assert.equal(decision.readiness, "NO_OPPORTUNITY");
  assert.ok(decision.blockers.some((blocker) => blocker.code === "ANALYSIS_REQUIRED"));
});

test("one available agent completes an explicitly unilateral read without simulating debate", async () => {
  const phases: string[] = [];
  const decision = await buildGlobalReadRebuildDecision([], "FR", ["claude-cli"], null, {
    verify: async () => [], calendars: async () => ({ events: [], warnings: [], complete: false }), web: async () => [],
    runCli: async (request) => { phases.push(request.phase); return { provider: request.provider, phase: request.phase, output: request.phase === "ANALYSIS_A" ? analysis("A") : { candidates: [] }, trace: [{ kind: "SEARCHED", url: null, query: "latest gold" }], durationMs: 1, isolation: "CONTROLLED", error: null }; }
  });
  assert.deepEqual(phases, ["ANALYSIS_A", "FINAL_SCAN"]);
  assert.equal(decision.rebuild?.debateResolution, "ONE_SIDE_INVALIDATED");
  assert.match(decision.rebuild?.debateSummary ?? "", /Unilateral read/);
  assert.equal(decision.rebuild?.audit.independentAnalyses.length, 1);
  assert.equal(decision.rebuild?.audit.debateReviews.length, 0);
});

test("two agents agreeing without evidence cannot manufacture convergence or opportunity", async () => {
  const unsupportedReview = (analyst: "A" | "B") => ({ ...review(analyst), items: Array.from({ length: 18 }, (_, i) => ({ question: i + 1, verdict: "ACCEPT", reason: "we agree", evidenceRefs: [], changeOfMindEvidence: "none" })), postDebateAudit: { thesisStillSupported: true, convergenceBasis: "REASONING_ONLY", weakenedPremises: [], unsupportedPremises: [], alternativeExplanation: "alternative", dangerousGap: "agreement has no evidence", resolver: "admitted evidence" } });
  const directional = (analyst: "A" | "B") => ({ ...analysis(analyst), thesis: "GOLD_SUPPORTIVE" as const, selfAudit: { outcome: "KEPT" as const, checks: [], revisions: [], remainingRisks: [] }, exploitability: { state: "FAVORABLE" as const, rationale: "claimed", factRefs: [] } });
  const decision = await buildGlobalReadRebuildDecision([], "FR", ["claude-cli", "codex-cli"], null, {
    verify: async () => [], calendars: async () => ({ events: [], warnings: [], complete: true }), web: async () => [], price: async () => ({ state: "CONFIRMS", reason: "confirmed", reference: "GC", from: "a", to: "b", change: 1, sourceUrl: "https://example.com" }),
    runCli: async (request) => ({ provider: request.provider, phase: request.phase, output: request.phase === "ANALYSIS_A" ? directional("A") : request.phase === "ANALYSIS_B" ? directional("B") : request.phase === "DEBATE_A" ? unsupportedReview("A") : request.phase === "DEBATE_B" ? unsupportedReview("B") : { candidates: [] }, trace: [], durationMs: 1, isolation: "CONTROLLED", error: null })
  });
  assert.equal(decision.rebuild?.debateResolution, "UNRESOLVED");
  assert.notEqual(decision.readiness, "OPPORTUNITY");
});

test("clear direction with unfavorable positioning is not exploitable", async () => {
  const directional = (analyst: "A" | "B") => ({ ...analysis(analyst), thesis: "GOLD_SUPPORTIVE" as const, selfAudit: { outcome: "KEPT" as const, checks: [], revisions: [], remainingRisks: [] }, exploitability: { state: "UNFAVORABLE" as const, rationale: "positioning extended with no marginal flow", factRefs: [] } });
  const decision = await buildGlobalReadRebuildDecision([], "FR", ["claude-cli", "codex-cli"], null, {
    verify: async () => [], calendars: async () => ({ events: [], warnings: [], complete: true }), web: async () => [], price: async () => ({ state: "CONFIRMS", reason: "confirmed", reference: "GC", from: "a", to: "b", change: 1, sourceUrl: "https://example.com" }),
    runCli: async (request) => ({ provider: request.provider, phase: request.phase, output: request.phase === "ANALYSIS_A" ? directional("A") : request.phase === "ANALYSIS_B" ? directional("B") : request.phase === "DEBATE_A" || request.phase === "REPLY_A" ? review("A") : request.phase === "DEBATE_B" || request.phase === "REPLY_B" ? review("B") : { candidates: [] }, trace: [], durationMs: 1, isolation: "CONTROLLED", error: null })
  });
  assert.notEqual(decision.readiness, "OPPORTUNITY");
  assert.ok(decision.blockers.some((blocker) => blocker.code === "ASYMMETRY_NOT_ESTABLISHED"));
  assert.equal(decision.thesis, "UNCLEAR");
  assert.equal(decision.marginalDriver, "Not established after post-debate audit.");
});

test("terminal provider failure does not stop analysis when an authority recovers the fact", async () => {
  const phases: string[] = [];
  const recovered = { ref: "f2-10y-real", status: "VERIFIED", terminalValue: null, admittedValue: 1.8,
    reason: "Terminal source unavailable; recovered from Treasury.", provenance: "WEB_ONLY_VERIFIED",
    selected: { ref: "f2-10y-real", metric: "US10Y_REAL", definition: "10Y real yield", value: 1.8, unit: "%", period: "2026-09-05", instrument: "US", transform: "LEVEL", seasonality: "NSA", vintage: "current", observationAt: "2026-09-05T00:00:00.000Z", knownAt: "2026-09-05T12:00:00.000Z", retrievedAt: "2026-09-05T12:00:00.000Z", latestCheckedAt: "2026-09-05T12:00:00.000Z", expectedCadence: "DAILY", effectiveFreshnessStatus: "CURRENT", sourceUrl: "https://home.treasury.gov/resource-center/data-chart-center/interest-rates", sourceType: "PRIMARY", verification: "STRUCTURED", role: "TRANSMISSION", dependencyRefs: [], releaseGroup: "TREASURY:2026-09-05" }, observations: [] } as const;
  await buildGlobalReadRebuildDecision([], "FR", ["claude-cli", "codex-cli"], null, {
    verify: async () => [recovered], calendars: async () => ({ events: [], warnings: [], complete: false }), web: async () => [],
    runCli: async (request) => { phases.push(request.phase); return { provider: request.provider, phase: request.phase, output: request.phase === "ANALYSIS_A" ? analysis("A") : request.phase === "ANALYSIS_B" ? analysis("B") : request.phase === "DEBATE_A" || request.phase === "REPLY_A" ? review("A") : request.phase === "DEBATE_B" || request.phase === "REPLY_B" ? review("B") : { candidates: [] }, trace: [], durationMs: 1, isolation: "CONTROLLED", error: null }; }
  });
  assert.ok(phases.includes("ANALYSIS_A") && phases.includes("ANALYSIS_B"));
});

test("a claimed broad scan without an actual web-search trace cannot produce opportunity", async () => {
  const source = analysis("A");
  assert.ok(source.broadScan.discoveryQueries.length > 0);
  const decision = await buildGlobalReadRebuildDecision([], "FR", ["claude-cli", "codex-cli"], null, {
    verify: async () => [], calendars: async () => ({ events: [], warnings: [], complete: true }), web: async () => [],
    runCli: async (request) => ({ provider: request.provider, phase: request.phase, output: request.phase === "ANALYSIS_A" ? analysis("A") : request.phase === "ANALYSIS_B" ? analysis("B") : request.phase === "DEBATE_A" || request.phase === "REPLY_A" ? review("A") : request.phase === "DEBATE_B" || request.phase === "REPLY_B" ? review("B") : { candidates: [] }, trace: [], durationMs: 1, isolation: "CONTROLLED", error: null })
  });
  assert.ok(decision.blockers.some((blocker) => blocker.code === "BROAD_SCAN_REQUIRED"));
  assert.notEqual(decision.readiness, "OPPORTUNITY");
});
