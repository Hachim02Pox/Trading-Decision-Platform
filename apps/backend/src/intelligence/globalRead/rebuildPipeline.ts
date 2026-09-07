import { randomUUID } from "node:crypto";
import type { CanonicalFamilySnapshot, Language } from "@gold-terminal/contracts";
import type { GlobalReadAdmission, GlobalReadCausalGraph, GlobalReadCondition, GlobalReadDecision, GlobalReadIndependentAnalysis, GlobalReadScenario, GlobalReadWebCandidate } from "@gold-terminal/contracts/dist/globalRead";
import { canonicalFacts, freezePriorView } from "./snapshot";
import { globalReadSnapshotHash } from "./pipeline";
import { verifyPrimaryFacts } from "./primaryData";
import { fetchGlobalReadCalendars } from "./calendar";
import { verifyWebCandidates } from "./safeFetch";
import { runSecureGlobalReadCli, type SecureGlobalReadRequest, type SecureGlobalReadResult } from "../providers/globalReadSecureCli";
import { buildAnalysisPrompt, buildDebatePrompt, buildFinalScanPrompt, buildReplyPrompt } from "./rebuildPrompts";
import { DEBATE_REVIEW_SCHEMA, INDEPENDENT_ANALYSIS_SCHEMA, WEB_CANDIDATE_SCHEMA, parseDebateReview, parseIndependentAnalysis } from "./rebuildSchema";
import { updateScenarioMemory, type RememberedScenario } from "./scenarioMemory";
import { isAdmitted } from "./evidence";
import { evaluateCondition } from "./thesis";
import { loadGlobalReadMethod, undefinedMethodFields } from "./method";
import { fetchPriceTest } from "./priceTest";
import { assessGlobalReadEventGuard } from "./eventGuard";

export const GLOBAL_READ_REBUILD_VERSION = "global-read-rebuild-1.3.0";
const FAMILY_MAP = { F2: "RATES", F3: "FED_PRICING", F4: "INFLATION", F5: "EMPLOYMENT_GROWTH", F6: "USD_FX", F7: "RISK_CREDIT_VOL",
  F8: "LIQUIDITY_FUNDING", F9: "TREASURY_FISCAL", F10: "FLOWS_POSITIONING", F11: "GOLD_OPTIONS_VOL", F12: "STRUCTURAL", F13: "CATALYST_CALENDAR" } as const;
const FINAL_SCAN_SCHEMA = { type: "object", additionalProperties: false, required: ["candidates"], properties: { candidates: { type: "array", maxItems: 12, items: WEB_CANDIDATE_SCHEMA } } };

export interface RebuildDeps {
  runCli: (request: SecureGlobalReadRequest) => Promise<SecureGlobalReadResult>;
  verify: typeof verifyPrimaryFacts;
  calendars: typeof fetchGlobalReadCalendars;
  web: typeof verifyWebCandidates;
  price: typeof fetchPriceTest;
}
const defaults = (): RebuildDeps => ({ runCli: runSecureGlobalReadCli, verify: verifyPrimaryFacts, calendars: fetchGlobalReadCalendars, web: verifyWebCandidates, price: fetchPriceTest });

function validWebCandidates(raw: unknown): GlobalReadWebCandidate[] | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw) || Object.keys(raw).some((key) => key !== "candidates") || !Array.isArray((raw as { candidates?: unknown }).candidates)) return null;
  const rawCandidates = (raw as { candidates: unknown[] }).candidates;
  const candidates = rawCandidates.filter((item): item is GlobalReadWebCandidate => {
    if (!item || typeof item !== "object") return false;
    const value = item as Record<string, unknown>;
    return [value.ref, value.url, value.quote].every((field) => typeof field === "string") &&
      ["OFFICIAL_GUIDANCE", "FORWARD_CATALYST", "COUNTEREVIDENCE", "CONTEXT"].includes(String(value.purpose));
  }).slice(0, 12);
  return candidates.length === rawCandidates.length ? candidates : null;
}

function cliAudit(run: SecureGlobalReadResult) {
  return { provider: run.provider, phase: run.phase, durationMs: run.durationMs, isolation: run.isolation, error: run.error, trace: run.trace };
}

function baseDecision(families: readonly CanonicalFamilySnapshot[]): GlobalReadDecision {
  const now = new Date().toISOString();
  const method = loadGlobalReadMethod();
  return { methodVersion: GLOBAL_READ_REBUILD_VERSION, runId: randomUUID(), asOf: now, snapshotHash: globalReadSnapshotHash(families, method),
    readiness: "NO_OPPORTUNITY", thesis: "UNCLEAR", lifecycle: "FORMATION", decisionUse: "AS_OF_SNAPSHOT", expiresAt: null,
    marginalDriver: "No validated marginal driver.", priced: "UNKNOWN", remainingEdge: "Not established", positioning: "Not yet evaluated after a supported thesis.",
    trap: "NOT_ESTABLISHED", keyFacts: [], decisionCriticalRefs: [], validWhile: [], invalidations: [], flip: null, nextCatalysts: [], scenarios: [], blockers: [], warnings: [],
    audit: { prior: null, priorManifest: freezePriorView(canonicalFacts(families), now, false).manifest, priorHash: null, proposal: null, evidence: [], web: [],
      priceTest: { state: "INCONCLUSIVE", reason: "No independently verified event reaction test in this run.", reference: method.referenceSymbol, from: null, to: null, change: null, sourceUrl: null },
      timingsMs: {}, cli: [], undefinedConfig: undefinedMethodFields(method) } };
}

function normalizeScenarios(analyses: readonly GlobalReadIndependentAnalysis[], previous: GlobalReadDecision | null, runId: string): GlobalReadScenario[] {
  const previousByKind = new Map((previous?.rebuild?.scenarioTree ?? []).map((scenario) => [scenario.kind, scenario]));
  const source = analyses[0]?.scenarios ?? [];
  return source.map((scenario, index) => {
    const other = analyses[1]?.scenarios.find((candidate) => candidate.kind === scenario.kind);
    const mergeText = (left: string, right?: string) => !right || left === right ? left : `${left}\nUnresolved alternative: ${right}`;
    const union = (left: string[] = [], right: string[] = []) => [...new Set([...left, ...right])];
    const conditionUnion = (left = scenario.triggerConditions ?? [], right = other?.triggerConditions ?? []) =>
      [...new Map([...left, ...right].map((condition) => [JSON.stringify(condition), condition])).values()];
    return { ...scenario, description: mergeText(scenario.description, other?.description), mechanism: mergeText(scenario.mechanism ?? "UNKNOWN", other?.mechanism),
      evidenceRefs: union(scenario.evidenceRefs, other?.evidenceRefs), contradictions: union(scenario.contradictions, other?.contradictions),
      triggerRefs: union(scenario.triggerRefs, other?.triggerRefs), catalystRefs: union(scenario.catalystRefs, other?.catalystRefs),
      triggerConditions: conditionUnion(scenario.triggerConditions, other?.triggerConditions),
      expectedObservations: union(scenario.expectedObservations, other?.expectedObservations), weakeningConditions: union(scenario.weakeningConditions, other?.weakeningConditions),
      weakeningComparisons: conditionUnion(scenario.weakeningComparisons, other?.weakeningComparisons),
      invalidationRefs: union(scenario.invalidationRefs, other?.invalidationRefs), invalidationConditions: conditionUnion(scenario.invalidationConditions, other?.invalidationConditions), flipConditions: union(scenario.flipConditions, other?.flipConditions),
      id: previousByKind.get(scenario.kind)?.id ?? scenario.id ?? `${scenario.kind.toLowerCase()}-${index}`,
      status: scenario.status ?? "PROPOSED", timestamp: new Date().toISOString(), sourceRunId: runId };
  });
}

function synthesizeFamilies(analyses: readonly GlobalReadIndependentAnalysis[]) {
  return analyses[0].familyAnalyses.map((first) => {
    const second = analyses[1]?.familyAnalyses.find((candidate) => candidate.family === first.family) ?? first;
    const text = (left: string, right: string) => left === right ? left : `${left}\nUnresolved alternative: ${right}`;
    const list = (left: string[], right: string[]) => [...new Set([...left, ...right])];
    return { ...first, state: text(first.state, second.state), marginalChange: text(first.marginalChange, second.marginalChange),
      alreadyPricedAssessment: text(first.alreadyPricedAssessment, second.alreadyPricedAssessment), causalMechanism: text(first.causalMechanism, second.causalMechanism),
      naturalHorizon: text(first.naturalHorizon, second.naturalHorizon), forwardCatalysts: list(first.forwardCatalysts, second.forwardCatalysts),
      contradictions: list(first.contradictions, second.contradictions), missingEvidence: list(first.missingEvidence, second.missingEvidence),
      confidenceBasis: text(first.confidenceBasis, second.confidenceBasis), factRefs: list(first.factRefs, second.factRefs),
      goldImplicationCeterisParibus: first.goldImplicationCeterisParibus === second.goldImplicationCeterisParibus ? first.goldImplicationCeterisParibus : "UNCLEAR" as const,
      role: first.role === second.role ? first.role : "BACKGROUND" as const };
  });
}

function synthesizeQuestions(analyses: readonly GlobalReadIndependentAnalysis[]) {
  return analyses[0].questionAnswers.map((first) => {
    const second = analyses[1]?.questionAnswers[first.question - 1] ?? first;
    return { question: first.question, answer: first.answer === second.answer ? first.answer : `${first.answer}\nUnresolved alternative: ${second.answer}`,
      factRefs: [...new Set([...first.factRefs, ...second.factRefs])], unknowns: [...new Set([...first.unknowns, ...second.unknowns])] };
  });
}

function buildCausalGraph(analyses: readonly GlobalReadIndependentAnalysis[], scenarios: readonly GlobalReadScenario[], previous: GlobalReadDecision | null): GlobalReadCausalGraph {
  const previousNodes = new Map((previous?.rebuild?.causalGraph?.nodes ?? []).map((node) => [node.id, node]));
  const families = synthesizeFamilies(analyses);
  const rawNodes: GlobalReadCausalGraph["nodes"] = [
    ...families.map((family) => ({ id: `family:${family.family}`, kind: "FAMILY" as const, label: family.family, detail: family.state,
      status: family.contradictions.length ? "UNRESOLVED" as const : "UNCHANGED" as const, evidenceRefs: family.factRefs })),
    { id: "driver:current", kind: "DRIVER" as const, label: "Marginal driver", detail: analyses.map((item) => item.marginalDriver).join(" | "), status: "UNCHANGED" as const,
      evidenceRefs: [...new Set(analyses.flatMap((item) => item.familyAnalyses.flatMap((family) => family.factRefs)))] },
    ...scenarios.map((scenario) => ({ id: `scenario:${scenario.id ?? scenario.kind}`, kind: "SCENARIO" as const, label: scenario.kind, detail: scenario.description,
      status: scenario.status === "INVALIDATED" ? "INVALIDATED" as const : scenario.status === "WEAKENING" ? "WEAKENED" as const : "UNCHANGED" as const,
      evidenceRefs: scenario.evidenceRefs ?? [] })),
  ];
  const nodes = rawNodes.map((node) => {
    const old = previousNodes.get(node.id);
    if (!old) return { ...node, status: "NEW" as const };
    return old.detail === node.detail && old.status === node.status ? node : { ...node, status: node.status === "UNCHANGED" ? "STRENGTHENED" as const : node.status };
  });
  const edges: GlobalReadCausalGraph["edges"] = [
    ...families.map((family) => ({ id: `edge:${family.family}:driver`, from: `family:${family.family}`, to: "driver:current", relation: "CONTRIBUTES" as const,
      status: family.contradictions.length ? "CONTESTED" as const : family.factRefs.length ? "ESTABLISHED" as const : "HYPOTHESIS" as const })),
    ...scenarios.map((scenario) => ({ id: `edge:driver:${scenario.id ?? scenario.kind}`, from: "driver:current", to: `scenario:${scenario.id ?? scenario.kind}`,
      relation: "BRANCHES" as const, status: (scenario.evidenceRefs?.length ?? 0) > 0 ? "ESTABLISHED" as const : "HYPOTHESIS" as const })),
  ];
  return { nodes, edges, changed: nodes.some((node) => node.status !== "UNCHANGED") };
}

function evidenceRefs(analysis: GlobalReadIndependentAnalysis): string[] {
  return [...analysis.familyAnalyses.flatMap((family) => family.factRefs), ...analysis.questionAnswers.flatMap((answer) => answer.factRefs),
    ...analysis.scenarios.flatMap((scenario) => [...(scenario.evidenceRefs ?? []), ...(scenario.catalystRefs ?? []), ...(scenario.triggerRefs ?? []),
      ...(scenario.invalidationRefs ?? []), ...(scenario.triggerConditions ?? []).flatMap((condition) => [condition.leftRef, condition.rightRef]),
      ...(scenario.weakeningComparisons ?? []).flatMap((condition) => [condition.leftRef, condition.rightRef]),
      ...(scenario.invalidationConditions ?? []).flatMap((condition) => [condition.leftRef, condition.rightRef])])];
}
function coreEvidenceRefs(analysis: GlobalReadIndependentAnalysis): string[] {
  return [...analysis.familyAnalyses.flatMap((family) => family.factRefs), ...analysis.questionAnswers.flatMap((answer) => answer.factRefs),
    ...analysis.scenarios.flatMap((scenario) => scenario.evidenceRefs ?? [])];
}

function describeDataChanges(previous: GlobalReadDecision | null, current: readonly GlobalReadAdmission[]): string[] {
  if (!previous) return ["Initial verified evidence baseline created."];
  const before = new Map(previous.audit.evidence.map((item) => [item.ref, item]));
  return current.flatMap((item) => {
    const old = before.get(item.ref);
    if (!old && isAdmitted(item)) return [`${item.ref}: newly admitted.`];
    if (old && (old.status !== item.status || old.admittedValue !== item.admittedValue || old.selected?.vintage !== item.selected?.vintage))
      return [`${item.ref}: ${old.status}/${String(old.admittedValue)} → ${item.status}/${String(item.admittedValue)}.`];
    return [];
  });
}

export async function buildGlobalReadRebuildDecision(families: readonly CanonicalFamilySnapshot[], language: Language,
  providers: readonly ("claude-cli" | "codex-cli")[], previous: GlobalReadDecision | null,
  overrides: Partial<RebuildDeps> = {}): Promise<GlobalReadDecision> {
  const deps = { ...defaults(), ...overrides };
  const started = performance.now();
  let decision = baseDecision(families);
  const facts = canonicalFacts(families);
  const verifyStarted = performance.now();
  const [admissions, calendar] = await Promise.all([deps.verify(facts, facts.map((fact) => fact.ref)), deps.calendars()]);
  decision = { ...decision, nextCatalysts: calendar.events.filter((event) => event.scheduledAt >= decision.asOf).slice(0, 12), warnings: [...calendar.warnings],
    audit: { ...decision.audit, evidence: admissions, timingsMs: { verification: Math.round(performance.now() - verifyStarted) } } };
  if (providers.length < 1) return { ...decision, blockers: [{ code: "INTERPRETATION_AGENTS_UNAVAILABLE", detail: "Both interpretation agents are unavailable.", recoverable: true, resolver: "Sign in to Claude Code or Codex CLI, then run again." }],
    audit: { ...decision.audit, timingsMs: { ...decision.audit.timingsMs, total: Math.round(performance.now() - started) } } };

  const admittedPayload = { admissions: admissions.map(({ observations: _observations, ...admission }) => admission),
    verifiedCatalysts: calendar.events.filter((event) => event.verified), calendarComplete: calendar.complete, calendarWarnings: calendar.warnings,
    familyManifest: families.map((family) => ({ familyId: family.familyId, familyKey: FAMILY_MAP[family.familyId], label: family.label,
      evidenceRefs: facts.filter((fact) => fact.ref.startsWith(`${family.familyId.toLowerCase()}-`)).map((fact) => fact.ref) })) };
  const priorState = previous?.rebuild ? (() => { const { audit: _audit, ...state } = previous.rebuild!; return { runId: previous.runId, snapshotHash: previous.snapshotHash, state }; })() : null;
  const analystLabels = (providers.length > 1 ? ["A", "B"] : ["A"]) as readonly ("A" | "B")[];
  const unilateral = analystLabels.length === 1;
  const analysisRuns = await Promise.all(analystLabels.map((analyst, index) => deps.runCli({ provider: providers[index]!, phase: `ANALYSIS_${analyst}`,
    prompt: buildAnalysisPrompt({ analyst, evidence: admittedPayload, previousState: priorState, language }), schema: INDEPENDENT_ANALYSIS_SCHEMA })));
  decision = { ...decision, audit: { ...decision.audit, cli: [...analysisRuns.map(cliAudit)], timingsMs: { ...decision.audit.timingsMs, independentAnalysis: Math.max(...analysisRuns.map((run) => run.durationMs)) } } };
  const analyses = analysisRuns.map((run, index) => run.isolation === "CONTROLLED" ? parseIndependentAnalysis(run.output, index === 0 ? "A" : "B") : null);
  if (analyses.some((analysis) => !analysis)) return { ...decision, blockers: [{ code: "ANALYSIS_REQUIRED", detail: "The available analysis was unavailable, unisolated or structurally invalid.", recoverable: true, resolver: "Check subscription login/quota and retry manually." }],
    audit: { ...decision.audit, timingsMs: { ...decision.audit.timingsMs, total: Math.round(performance.now() - started) } } };
  const independent = analyses as GlobalReadIndependentAnalysis[];
  const referencedCatalysts = new Set(independent.flatMap((analysis) => analysis.scenarios.flatMap((scenario) => scenario.catalystRefs)));
  const reactionCatalyst = [...calendar.events].filter((event) => event.verified && event.scheduledAt <= new Date().toISOString() && referencedCatalysts.has(event.ref))
    .sort((a, b) => b.scheduledAt.localeCompare(a.scheduledAt))[0];
  const method = loadGlobalReadMethod();
  const proposedThesis = independent.every((analysis) => analysis.thesis === independent[0].thesis) ? independent[0].thesis : "UNCLEAR";
  const priceTest = await deps.price(reactionCatalyst?.scheduledAt ?? null, proposedThesis, method);
  decision = { ...decision, audit: { ...decision.audit, priceTest } };
  const webVerificationStarted = performance.now();
  const candidateVerification = await deps.web(independent.flatMap((analysis) => analysis.webCandidates));
  const broadScanExecuted = analysisRuns.every((run) => run.trace.some((event) => event.kind === "SEARCHED"));
  const allowedRefs = new Set([...admissions.filter(isAdmitted).map((admission) => admission.ref), ...calendar.events.filter((event) => event.verified).map((event) => event.ref)]);
  const debateRuns = unilateral ? [] : await Promise.all(independent.map((own, index) => deps.runCli({ provider: providers[index]!, phase: index === 0 ? "DEBATE_A" : "DEBATE_B",
    prompt: buildDebatePrompt({ analyst: own.analyst, own, other: independent[index === 0 ? 1 : 0], evidenceRefs: [...allowedRefs], priceTest, webVerification: candidateVerification, language }), schema: DEBATE_REVIEW_SCHEMA })));
  const firstReviews = debateRuns.map((run, index) => run.isolation === "CONTROLLED" ? parseDebateReview(run.output, index === 0 ? "A" : "B", allowedRefs) : null);
  decision = { ...decision, audit: { ...decision.audit, cli: [...decision.audit.cli, ...debateRuns.map(cliAudit)], web: candidateVerification,
    timingsMs: { ...decision.audit.timingsMs, familyAnalysisAndWebExploration: Math.max(...analysisRuns.map((run) => run.durationMs)),
      webCandidateVerification: Math.round(performance.now() - webVerificationStarted), debate: debateRuns.length ? Math.max(...debateRuns.map((run) => run.durationMs)) : 0 } } };
  if (!unilateral && (!firstReviews[0] || !firstReviews[1])) return { ...decision, blockers: [{ code: "DEBATE_REQUIRED", detail: "Question-by-question cross-examination was unavailable or invalid.", recoverable: true, resolver: "Retry after both subscription CLIs are available." }],
    audit: { ...decision.audit, timingsMs: { ...decision.audit.timingsMs, total: Math.round(performance.now() - started) } } };
  const materialDispute = !unilateral && firstReviews.some((review) => review!.items.some((item) => item.verdict !== "ACCEPT"));
  const replyRuns = materialDispute ? await Promise.all(independent.map((own, index) => deps.runCli({ provider: providers[index]!, phase: index === 0 ? "REPLY_A" : "REPLY_B",
    prompt: buildReplyPrompt({ analyst: own.analyst, own, other: independent[index === 0 ? 1 : 0], ownReview: firstReviews[index], otherReview: firstReviews[index === 0 ? 1 : 0], evidenceRefs: [...allowedRefs], language }), schema: DEBATE_REVIEW_SCHEMA }))) : [];
  const replyReviews = replyRuns.map((run, index) => run.isolation === "CONTROLLED" ? parseDebateReview(run.output, index === 0 ? "A" : "B", allowedRefs) : null);
  const reviews = (materialDispute && replyReviews[0] && replyReviews[1] ? replyReviews : firstReviews).filter((review): review is NonNullable<typeof review> => review !== null);
  const finalRun = await deps.runCli({ provider: providers[0]!, phase: "FINAL_SCAN", prompt: buildFinalScanPrompt({ analyses: independent, reviews, candidates: candidateVerification, catalysts: decision.nextCatalysts }, language), schema: FINAL_SCAN_SCHEMA });
  const parsedFinalCandidates = finalRun.isolation === "CONTROLLED" ? validWebCandidates(finalRun.output) : null;
  const finalCandidates = parsedFinalCandidates ?? [];
  const finalScanComplete = parsedFinalCandidates !== null;
  const finalVerification = await deps.web(finalCandidates);
  decision = { ...decision, audit: { ...decision.audit, cli: [...decision.audit.cli, ...replyRuns.map(cliAudit), cliAudit(finalRun)], web: [...candidateVerification, ...finalVerification],
    timingsMs: { ...decision.audit.timingsMs, reply: replyRuns.length ? Math.max(...replyRuns.map((run) => run.durationMs)) : 0, finalWebScan: finalRun.durationMs } } };

  const sameThesis = independent.every((analysis) => analysis.thesis === independent[0].thesis);
  const verdicts = reviews.flatMap((review) => review!.items.map((item) => item.verdict));
  const evidencedAgreement = !unilateral && reviews.every((review) => review.postDebateAudit.convergenceBasis === "EVIDENCE" &&
    review.postDebateAudit.thesisStillSupported && review.postDebateAudit.unsupportedPremises.length === 0) &&
    reviews.flatMap((review) => review.items.filter((item) => item.verdict === "ACCEPT")).every((item) => item.evidenceRefs.length > 0);
  const resolution = unilateral ? "ONE_SIDE_INVALIDATED" : !sameThesis || verdicts.includes("UNRESOLVED") || (verdicts.every((verdict) => verdict === "ACCEPT") && !evidencedAgreement) ? "UNRESOLVED" : verdicts.every((verdict) => verdict === "ACCEPT") ? "CONVERGED" : "PARTIALLY_CONVERGED";
  const scenarioProposals = normalizeScenarios(independent, previous, decision.runId).map((scenario) => {
    const allTrue = (conditions: GlobalReadCondition[] = []) => conditions.length > 0 && conditions.every((condition) => evaluateCondition(condition, admissions) === "TRUE");
    const anyTrue = (conditions: GlobalReadCondition[] = []) => conditions.some((condition) => evaluateCondition(condition, admissions) === "TRUE");
    const status = anyTrue(scenario.invalidationConditions) ? "INVALIDATED" : allTrue(scenario.triggerConditions) ? "ACTIVE" :
      anyTrue(scenario.weakeningComparisons) ? "WEAKENING" : scenario.status;
    return { ...scenario, status };
  });
  const previousScenarios = (previous?.rebuild?.scenarioTree ?? []).filter((scenario): scenario is GlobalReadScenario & Required<Pick<GlobalReadScenario, "id" | "status">> => Boolean(scenario.id && scenario.status));
  const memory = updateScenarioMemory(previousScenarios.map((scenario) => ({ id: scenario.id, status: scenario.status, triggerRefs: scenario.triggerRefs ?? [], invalidationRefs: scenario.invalidationRefs ?? [] })),
    scenarioProposals.map((scenario) => ({ id: scenario.id!, status: scenario.status!, triggerRefs: scenario.triggerRefs ?? [], invalidationRefs: scenario.invalidationRefs ?? [] })), new Set(), new Set());
  const scenarioById = new Map(scenarioProposals.map((scenario) => [scenario.id, scenario]));
  const scenarioTree = memory.scenarios.map((remembered) => ({ ...(scenarioById.get(remembered.id) ?? previousScenarios.find((scenario) => scenario.id === remembered.id)!), status: remembered.status }));
  const causalGraph = buildCausalGraph(independent, scenarioTree, previous);
  const eventGuard = assessGlobalReadEventGuard(decision.asOf, calendar.events);
  const knownRefs = new Set([...facts.map((fact) => fact.ref), ...calendar.events.map((event) => event.ref)]);
  const unknownRefs = independent.flatMap(evidenceRefs).filter((ref) => !knownRefs.has(ref));
  const unadmittedCoreRefs = independent.flatMap(coreEvidenceRefs).filter((ref) => !allowedRefs.has(ref));
  const usedRefs = new Set(independent.flatMap(evidenceRefs));
  const roles = new Set(admissions.filter((admission) => isAdmitted(admission) && usedRefs.has(admission.ref)).map((admission) => admission.selected?.role));
  const causalEvidenceComplete = ["EXPECTATION", "REPRICING", "TRANSMISSION"].every((role) => roles.has(role as never));
  const directional = sameThesis && independent[0].thesis !== "UNCLEAR";
  const postAuditSurvived = unilateral ? independent[0].selfAudit.outcome !== "REMOVED" && independent[0].selfAudit.remainingRisks.length === 0 :
    reviews.every((review) => review.postDebateAudit.thesisStillSupported && review.postDebateAudit.unsupportedPremises.length === 0);
  const selfAuditsClean = independent.every((analysis) => analysis.selfAudit.outcome !== "REMOVED" && analysis.selfAudit.remainingRisks.length === 0) && postAuditSurvived;
  const exploitability = independent.every((analysis) => analysis.exploitability.state === "FAVORABLE") &&
    independent.flatMap((analysis) => analysis.exploitability.factRefs).every((ref) => allowedRefs.has(ref));
  const clean = directional && (resolution === "CONVERGED" || unilateral) && selfAuditsClean && exploitability && broadScanExecuted && unknownRefs.length === 0 && unadmittedCoreRefs.length === 0 && causalEvidenceComplete && calendar.complete && priceTest.state === "CONFIRMS" && finalScanComplete;
  const operationalAction = clean && !eventGuard.blocksOpportunity ? (independent[0].thesis === "GOLD_SUPPORTIVE" ? "CONSIDER_SUPPORTIVE_SETUPS" : "CONSIDER_ADVERSE_SETUPS") :
    directional && unknownRefs.length === 0 && unadmittedCoreRefs.length === 0 && causalEvidenceComplete ? "WAIT_FOR_TRIGGER" : "NO_CLEAN_EDGE";
  const dataChanges = describeDataChanges(previous, admissions);
  const previousCatalysts = new Set((previous?.nextCatalysts ?? []).map((event) => `${event.ref}:${event.scheduledAt}`));
  const newCatalysts = decision.nextCatalysts.filter((event) => !previousCatalysts.has(`${event.ref}:${event.scheduledAt}`)).map((event) => `${event.title} — ${event.scheduledAt}`);
  const changes = !previous ? ["First Read: initial scenario map created.", ...dataChanges] :
    previous.snapshotHash === decision.snapshotHash && !dataChanges.length && !newCatalysts.length ? ["No material change detected; scenario identities were preserved."] :
      ["The prior state was reassessed against the new information set.", ...dataChanges, ...newCatalysts.map((event) => `New verified catalyst: ${event}`)];
  const blockers = [
    ...(!sameThesis ? [{ code: "MATERIAL_DISAGREEMENT", detail: "The two independent analyses retain different theses.", recoverable: true, resolver: "Wait for the evidence identified in What will decide." }] : []),
    ...(unknownRefs.length ? [{ code: "UNKNOWN_ANALYSIS_REFS", detail: `${new Set(unknownRefs).size} unsupported evidence reference(s) cannot support the synthesis.`, recoverable: false, resolver: null }] : []),
    ...(unadmittedCoreRefs.length ? [{ code: "UNADMITTED_CORE_REFS", detail: `${new Set(unadmittedCoreRefs).size} known but unverified reference(s) were used in core reasoning.`, recoverable: false, resolver: null }] : []),
    ...(!causalEvidenceComplete ? [{ code: "CAUSAL_CHAIN_INCOMPLETE", detail: "Verified expectation, repricing and transmission evidence are not all available.", recoverable: false, resolver: null }] : []),
    ...(!calendar.complete ? [{ code: "CALENDAR_COVERAGE", detail: "Official calendar coverage is incomplete.", recoverable: true, resolver: "Restore official calendar access and rerun." }] : []),
    ...(priceTest.state !== "CONFIRMS" ? [{ code: "PRICE_RESPONSE", detail: priceTest.reason, recoverable: true, resolver: "Configure the reference methodology or wait for a verified catalyst reaction, then rerun." }] : []),
    ...(!finalScanComplete ? [{ code: "FINAL_SCAN_REQUIRED", detail: "The final freshness/objection scan was unavailable or invalid.", recoverable: true, resolver: "Retry the final scan when the subscription CLI is available." }] : []),
    ...(!selfAuditsClean ? [{ code: "SELF_AUDIT_UNRESOLVED", detail: "At least one pre/post-debate audit retains an unsupported premise or material risk.", recoverable: true, resolver: "Resolve the evidence gap named by the audits and rerun." }] : []),
    ...(!exploitability ? [{ code: "ASYMMETRY_NOT_ESTABLISHED", detail: "Directional context is not enough: favorable positioning or marginal-flow asymmetry was not established with admitted evidence.", recoverable: true, resolver: "Wait for verifiable positioning/flow asymmetry or a new marginal catalyst." }] : []),
    ...(!broadScanExecuted ? [{ code: "BROAD_SCAN_REQUIRED", detail: "At least one independent analyst did not produce an auditable web-search trace before debate.", recoverable: true, resolver: "Rerun when independent web search is available." }] : []),
    ...eventGuard.blockers,
  ];
  const readiness = operationalAction.startsWith("CONSIDER") ? "OPPORTUNITY" : operationalAction === "WAIT_FOR_TRIGGER" && blockers.every((blocker) => blocker.recoverable) ? "WATCH" : "NO_OPPORTUNITY";
  const finalThesis = sameThesis && postAuditSurvived ? independent[0].thesis : "UNCLEAR";
  const auditAlternatives = [...new Set(reviews.map((review) => review.postDebateAudit.alternativeExplanation))];
  decision = { ...decision, readiness, thesis: finalThesis, lifecycle: readiness === "OPPORTUNITY" ? "ACTIVE" : "FORMATION",
    marginalDriver: !postAuditSurvived ? "Not established after post-debate audit." : sameThesis ? independent[0].marginalDriver : "Material disagreement: competing marginal drivers remain.", priced: independent.map((analysis) => analysis.familyAnalyses.map((family) => family.alreadyPricedAssessment).join("; ")).join(" | "),
    remainingEdge: operationalAction, positioning: independent.map((analysis) => analysis.familyAnalyses.find((family) => family.family === "FLOWS_POSITIONING")?.state ?? "UNKNOWN").join(" | "),
    scenarios: scenarioTree, blockers, keyFacts: admissions.filter(isAdmitted).slice(0, 8), warnings: [...decision.warnings, ...eventGuard.warnings, "LLM interpretations and causal mechanisms are hypotheses, not verified facts."],
    rebuild: { previousRunId: previous?.runId ?? null, whatChanged: changes, dataChanges, newCatalysts,
      scenarioTransitions: memory.transitions, scenarioTree, debateResolution: resolution, debateSummary: unilateral ? `Unilateral read: ${providers[0]} completed the full analysis and self-audit; the second agent was unavailable, so no inter-agent debate was simulated.` : sameThesis ? "The analysts share a directional frame but unresolved items remain visible." : "Material thesis disagreement is preserved.",
      solidPoints: unilateral ? independent[0].selfAudit.revisions : (reviews[0]?.items ?? []).filter((item, index) => item.verdict === "ACCEPT" && reviews[1]?.items[index]?.verdict === "ACCEPT").map((item) => item.reason),
      disputedPoints: reviews.flatMap((review) => review!.items.filter((item) => item.verdict !== "ACCEPT").map((item) => item.reason)),
      whatWillDecide: reviews.flatMap((review) => review!.items.filter((item) => item.verdict !== "ACCEPT").map((item) => item.changeOfMindEvidence)),
      operationalAction, overview: postAuditSurvived ? independent.map((analysis) => analysis.crossFamilySynthesis).join("\n\n") : `Post-debate audit rejected the central synthesis. Credible alternatives retained: ${auditAlternatives.join(" | ")}`,
      assembly: postAuditSurvived ? independent.map((analysis) => analysis.marginalDriver).join(" | ") : "Central causal assembly withheld because it did not survive the post-debate audit.",
      weakening: independent.flatMap((analysis) => analysis.scenarios.flatMap((scenario) => scenario.weakeningConditions ?? [])),
      synthesizedFamilies: synthesizeFamilies(independent), synthesizedQuestions: synthesizeQuestions(independent),
      causalGraph,
      audit: { independentAnalyses: independent, debateReviews: [...firstReviews, ...(materialDispute ? reviews : [])] as NonNullable<typeof reviews[number]>[], finalWebCandidates: finalCandidates } },
    audit: { ...decision.audit, timingsMs: { ...decision.audit.timingsMs, synthesis: 0, total: Math.round(performance.now() - started) } } };
  return decision;
}
