import type { GlobalReadDebateReview, GlobalReadIndependentAnalysis } from "@gold-terminal/contracts/dist/globalRead";

export const FAMILY_KEYS = ["RATES", "FED_PRICING", "USD_FX", "INFLATION", "EMPLOYMENT_GROWTH", "RISK_CREDIT_VOL", "LIQUIDITY_FUNDING", "STRUCTURAL", "TREASURY_FISCAL", "GOLD_OPTIONS_VOL", "FLOWS_POSITIONING"] as const;
const THESIS = new Set(["GOLD_SUPPORTIVE", "GOLD_ADVERSE", "UNCLEAR"]);
const SCENARIO_KINDS = new Set(["BASE", "ALTERNATIVE", "ADVERSE", "CONDITIONAL"]);
const SCENARIO_STATES = new Set(["PROPOSED", "WATCHING", "ACTIVE", "STRENGTHENING", "WEAKENING", "INVALIDATED", "SUPERSEDED"]);
const DEBATE = new Set(["ACCEPT", "CONTEST", "UNRESOLVED"]);
const FAMILY_ROLES = new Set(["BIAS", "TRANSMISSION", "EXPLOITABILITY", "BACKGROUND"]);

const record = (value: unknown): value is Record<string, unknown> => value !== null && typeof value === "object" && !Array.isArray(value);
const text = (value: unknown, max = 4000): value is string => typeof value === "string" && value.trim().length > 0 && value.length <= max;
const strings = (value: unknown, max = 24): value is string[] => Array.isArray(value) && value.length <= max && value.every((item) => text(item, 500));
const exactKeys = (value: Record<string, unknown>, keys: readonly string[]) => Object.keys(value).length === keys.length && keys.every((key) => Object.prototype.hasOwnProperty.call(value, key));
const numbered18 = (items: unknown[]): boolean => items.length === 18 && items.every((item, index) => record(item) && item.question === index + 1);
const enumHas = (values: ReadonlySet<string>, value: unknown): value is string => typeof value === "string" && values.has(value);
const validConditions = (value: unknown): boolean => Array.isArray(value) && value.length <= 8 && value.every((item) => record(item) &&
  exactKeys(item, ["description", "leftRef", "operator", "rightRef"]) && text(item.description) && text(item.leftRef, 500) && text(item.rightRef, 500) && enumHas(new Set(["GT", "LT", "EQ"]), item.operator));

export function parseIndependentAnalysis(raw: unknown, analyst: "A" | "B"): GlobalReadIndependentAnalysis | null {
  const topKeys = ["analyst", "facts", "interpretations", "hypotheses", "familyAnalyses", "questionAnswers", "thesis", "marginalDriver", "crossFamilySynthesis", "scenarios", "contradictions", "webCandidates", "selfAudit", "exploitability", "broadScan"];
  if (!record(raw) || !exactKeys(raw, topKeys) || raw.analyst !== analyst || !Array.isArray(raw.familyAnalyses) || !Array.isArray(raw.questionAnswers) || !Array.isArray(raw.scenarios)) return null;
  const familySet = new Set(raw.familyAnalyses.map((item) => record(item) ? item.family : null));
  if (raw.familyAnalyses.length !== FAMILY_KEYS.length || FAMILY_KEYS.some((family) => !familySet.has(family))) return null;
  if (!numbered18(raw.questionAnswers) || raw.scenarios.length < 1 || raw.scenarios.length > 8 ||
    !raw.scenarios.some((item) => record(item) && item.kind === "BASE") ||
    new Set(raw.scenarios.map((item) => record(item) ? item.id : null)).size !== raw.scenarios.length) return null;
  if (!enumHas(THESIS, raw.thesis) || !text(raw.marginalDriver) || !text(raw.crossFamilySynthesis) || !strings(raw.facts) || !strings(raw.interpretations) || !strings(raw.hypotheses) || !strings(raw.contradictions) || !Array.isArray(raw.webCandidates)) return null;
  for (const item of raw.familyAnalyses) {
    if (!record(item) || !exactKeys(item, ["family", "state", "goldImplicationCeterisParibus", "marginalChange", "alreadyPricedAssessment", "causalMechanism", "naturalHorizon", "forwardCatalysts", "contradictions", "missingEvidence", "confidenceBasis", "role", "factRefs"]) || !FAMILY_KEYS.includes(item.family as typeof FAMILY_KEYS[number]) || !enumHas(THESIS, item.goldImplicationCeterisParibus) || !enumHas(FAMILY_ROLES, item.role) ||
      ![item.state, item.marginalChange, item.alreadyPricedAssessment, item.causalMechanism, item.naturalHorizon, item.confidenceBasis].every((v) => text(v)) ||
      ![item.forwardCatalysts, item.contradictions, item.missingEvidence, item.factRefs].every((v) => strings(v))) return null;
  }
  for (const item of raw.questionAnswers) if (!record(item) || !exactKeys(item, ["question", "answer", "factRefs", "unknowns"]) || !text(item.answer) || !strings(item.factRefs) || !strings(item.unknowns)) return null;
  for (const scenario of raw.scenarios) {
    if (!record(scenario) || !exactKeys(scenario, ["kind", "id", "status", "description", "mechanism", "evidenceRefs", "contradictions", "whatIsPriced", "whatCouldReprice", "triggerRefs", "triggerConditions", "catalystRefs", "expectedObservations", "weakeningConditions", "weakeningComparisons", "invalidationRefs", "invalidationConditions", "invalidatedBy", "flipConditions", "timestamp", "sourceRunId"]) || !enumHas(SCENARIO_KINDS, scenario.kind) || !text(scenario.id, 160) || !enumHas(SCENARIO_STATES, scenario.status) ||
      ![scenario.description, scenario.mechanism, scenario.whatIsPriced, scenario.whatCouldReprice, scenario.invalidatedBy, scenario.timestamp, scenario.sourceRunId].every((v) => text(v)) ||
      ![scenario.evidenceRefs, scenario.contradictions, scenario.triggerRefs, scenario.catalystRefs, scenario.expectedObservations, scenario.weakeningConditions, scenario.invalidationRefs, scenario.flipConditions].every((v) => strings(v)) ||
      ![scenario.triggerConditions, scenario.weakeningComparisons, scenario.invalidationConditions].every(validConditions)) return null;
  }
  for (const candidate of raw.webCandidates) {
    if (!record(candidate) || !exactKeys(candidate, ["ref", "url", "quote", "purpose"]) || !text(candidate.ref, 500) || !text(candidate.url, 2048) || !text(candidate.quote) || !enumHas(new Set(["OFFICIAL_GUIDANCE", "FORWARD_CATALYST", "COUNTEREVIDENCE", "CONTEXT"]), candidate.purpose)) return null;
  }
  if (!record(raw.selfAudit) || !exactKeys(raw.selfAudit, ["outcome", "checks", "revisions", "remainingRisks"]) ||
    !enumHas(new Set(["KEPT", "REVISED", "REMOVED"]), raw.selfAudit.outcome) || !Array.isArray(raw.selfAudit.checks) ||
    !strings(raw.selfAudit.revisions) || !strings(raw.selfAudit.remainingRisks)) return null;
  for (const check of raw.selfAudit.checks) if (!record(check) || !exactKeys(check, ["code", "action", "finding", "affectedRefs"]) ||
    !text(check.code, 100) || !enumHas(new Set(["KEEP", "REVISE", "REMOVE"]), check.action) || !text(check.finding) || !strings(check.affectedRefs)) return null;
  if (!record(raw.exploitability) || !exactKeys(raw.exploitability, ["state", "rationale", "factRefs"]) ||
    !enumHas(new Set(["FAVORABLE", "UNFAVORABLE", "UNCLEAR"]), raw.exploitability.state) || !text(raw.exploitability.rationale) || !strings(raw.exploitability.factRefs)) return null;
  if (!record(raw.broadScan) || !exactKeys(raw.broadScan, ["searchedAt", "discoveryQueries", "missedItems", "forwardLookingItems", "revisions", "conclusion"]) ||
    !text(raw.broadScan.searchedAt, 100) || !strings(raw.broadScan.discoveryQueries) || !strings(raw.broadScan.missedItems) ||
    !strings(raw.broadScan.forwardLookingItems) || !strings(raw.broadScan.revisions) || !text(raw.broadScan.conclusion)) return null;
  return raw as unknown as GlobalReadIndependentAnalysis;
}

export function parseDebateReview(raw: unknown, analyst: "A" | "B", allowedRefs: ReadonlySet<string>): GlobalReadDebateReview | null {
  if (!record(raw) || !exactKeys(raw, ["analyst", "items", "postDebateAudit"]) || raw.analyst !== analyst || !Array.isArray(raw.items) || !numbered18(raw.items)) return null;
  for (const item of raw.items) {
    if (!record(item) || !exactKeys(item, ["question", "verdict", "reason", "evidenceRefs", "changeOfMindEvidence"]) || !enumHas(DEBATE, item.verdict) || !text(item.reason) || !text(item.changeOfMindEvidence) || !strings(item.evidenceRefs) || (item.evidenceRefs as string[]).some((ref) => !allowedRefs.has(ref))) return null;
  }
  const audit = raw.postDebateAudit;
  if (!record(audit) || !exactKeys(audit, ["thesisStillSupported", "convergenceBasis", "weakenedPremises", "unsupportedPremises", "alternativeExplanation", "dangerousGap", "resolver"]) ||
    typeof audit.thesisStillSupported !== "boolean" || !enumHas(new Set(["EVIDENCE", "REASONING_ONLY", "UNRESOLVED"]), audit.convergenceBasis) ||
    !strings(audit.weakenedPremises) || !strings(audit.unsupportedPremises) || !text(audit.alternativeExplanation) || !text(audit.dangerousGap) || !text(audit.resolver)) return null;
  return raw as unknown as GlobalReadDebateReview;
}

// CLI-level schema constrains every nested object; semantic parsers still enforce exact coverage and known refs.
const s = { type: "string", minLength: 1, maxLength: 4000 } as const;
const short = { type: "string", minLength: 1, maxLength: 500 } as const;
const sl = { type: "array", items: short, maxItems: 24 } as const;
const strictObject = (properties: Record<string, unknown>) => ({ type: "object", additionalProperties: false, required: Object.keys(properties), properties });
export const WEB_CANDIDATE_SCHEMA = strictObject({ ref: short, url: { type: "string", minLength: 1, maxLength: 2048 }, quote: s,
  purpose: { type: "string", enum: ["OFFICIAL_GUIDANCE", "FORWARD_CATALYST", "COUNTEREVIDENCE", "CONTEXT"] } });
const familySchema = strictObject({ family: { type: "string", enum: [...FAMILY_KEYS] }, state: s,
  goldImplicationCeterisParibus: { type: "string", enum: [...THESIS] }, marginalChange: s, alreadyPricedAssessment: s,
  causalMechanism: s, naturalHorizon: s, forwardCatalysts: sl, contradictions: sl, missingEvidence: sl, confidenceBasis: s,
  role: { type: "string", enum: [...FAMILY_ROLES] }, factRefs: sl });
const answerSchema = strictObject({ question: { type: "integer", minimum: 1, maximum: 18 }, answer: s, factRefs: sl, unknowns: sl });
const conditionSchema = strictObject({ description: s, leftRef: short, operator: { type: "string", enum: ["GT", "LT", "EQ"] }, rightRef: short });
const scenarioSchema = strictObject({ kind: { type: "string", enum: [...SCENARIO_KINDS] }, id: short,
  status: { type: "string", enum: [...SCENARIO_STATES] }, description: s, mechanism: s, evidenceRefs: sl, contradictions: sl,
  whatIsPriced: s, whatCouldReprice: s, triggerRefs: sl, triggerConditions: { type: "array", items: conditionSchema, maxItems: 8 }, catalystRefs: sl, expectedObservations: sl, weakeningConditions: sl,
  weakeningComparisons: { type: "array", items: conditionSchema, maxItems: 8 }, invalidationRefs: sl, invalidationConditions: { type: "array", items: conditionSchema, maxItems: 8 }, invalidatedBy: s, flipConditions: sl, timestamp: short, sourceRunId: short });
export const INDEPENDENT_ANALYSIS_SCHEMA = {
  type: "object", additionalProperties: false,
  required: ["analyst", "facts", "interpretations", "hypotheses", "familyAnalyses", "questionAnswers", "thesis", "marginalDriver", "crossFamilySynthesis", "scenarios", "contradictions", "webCandidates", "selfAudit", "exploitability", "broadScan"],
  properties: { analyst: { type: "string", enum: ["A", "B"] }, facts: sl, interpretations: sl, hypotheses: sl,
    familyAnalyses: { type: "array", minItems: 11, maxItems: 11, items: familySchema },
    questionAnswers: { type: "array", minItems: 18, maxItems: 18, items: answerSchema },
    thesis: { type: "string", enum: [...THESIS] }, marginalDriver: s, crossFamilySynthesis: s,
    scenarios: { type: "array", minItems: 1, maxItems: 8, items: scenarioSchema }, contradictions: sl,
    webCandidates: { type: "array", maxItems: 12, items: WEB_CANDIDATE_SCHEMA },
    selfAudit: strictObject({ outcome: { type: "string", enum: ["KEPT", "REVISED", "REMOVED"] }, checks: { type: "array", maxItems: 24, items: strictObject({ code: short, action: { type: "string", enum: ["KEEP", "REVISE", "REMOVE"] }, finding: s, affectedRefs: sl }) }, revisions: sl, remainingRisks: sl }),
    exploitability: strictObject({ state: { type: "string", enum: ["FAVORABLE", "UNFAVORABLE", "UNCLEAR"] }, rationale: s, factRefs: sl }),
    broadScan: strictObject({ searchedAt: short, discoveryQueries: sl, missedItems: sl, forwardLookingItems: sl, revisions: sl, conclusion: s }) }
};
const debateItemSchema = strictObject({ question: { type: "integer", minimum: 1, maximum: 18 }, verdict: { type: "string", enum: [...DEBATE] },
  reason: s, evidenceRefs: sl, changeOfMindEvidence: s });
export const DEBATE_REVIEW_SCHEMA = { type: "object", additionalProperties: false, required: ["analyst", "items", "postDebateAudit"], properties: {
  analyst: { type: "string", enum: ["A", "B"] }, items: { type: "array", minItems: 18, maxItems: 18, items: debateItemSchema },
  postDebateAudit: strictObject({ thesisStillSupported: { type: "boolean" }, convergenceBasis: { type: "string", enum: ["EVIDENCE", "REASONING_ONLY", "UNRESOLVED"] }, weakenedPremises: sl, unsupportedPremises: sl, alternativeExplanation: s, dangerousGap: s, resolver: s })
} };
