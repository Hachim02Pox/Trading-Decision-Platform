/** Versioned Global Read evidence contract. Model output never supplies verification. */
export type GlobalReadThesis = "GOLD_SUPPORTIVE" | "GOLD_ADVERSE" | "UNCLEAR";
export type GlobalReadReadiness = "OPPORTUNITY" | "WATCH" | "NO_OPPORTUNITY";
export type GlobalReadDataRole = "BACKGROUND" | "CATALYST" | "EXPECTATION" | "REPRICING" | "TRANSMISSION" | "POSITIONING" | "PRICE" | "FORWARD";
export type GlobalReadFamilyKey = "RATES" | "FED_PRICING" | "USD_FX" | "INFLATION" | "EMPLOYMENT_GROWTH" | "RISK_CREDIT_VOL" | "LIQUIDITY_FUNDING" | "STRUCTURAL" | "TREASURY_FISCAL" | "GOLD_OPTIONS_VOL" | "FLOWS_POSITIONING";
export type GlobalReadScenarioStatus = "PROPOSED" | "WATCHING" | "ACTIVE" | "STRENGTHENING" | "WEAKENING" | "INVALIDATED" | "SUPERSEDED";
export type GlobalReadOperationalAction = "CONSIDER_SUPPORTIVE_SETUPS" | "CONSIDER_ADVERSE_SETUPS" | "WAIT_FOR_TRIGGER" | "NO_CLEAN_EDGE";
export interface GlobalReadFact {
  ref: string;
  metric: string;
  definition: string;
  value: number | string | null;
  unit: string;
  period: string;
  instrument: string;
  transform: string;
  seasonality: string;
  vintage: string;
  observationAt: string;
  /** Conservative information-availability bound, NOT observation period. */
  knownAt: string;
  retrievedAt: string;
  latestCheckedAt: string | null;
  expectedCadence: "INTRADAY" | "DAILY" | "WEEKLY" | "MONTHLY" | "QUARTERLY" | "EVENT" | "UNKNOWN";
  effectiveFreshnessStatus: "CURRENT" | "STALE" | "UNAVAILABLE" | "UNKNOWN";
  sourceUrl: string | null;
  sourceType: "PRIMARY" | "SECONDARY" | "UNOFFICIAL" | "UNKNOWN";
  verification: "NONE" | "STRUCTURED" | "QUOTE_MATCH";
  role: GlobalReadDataRole;
  dependencyRefs: string[];
  releaseGroup: string | null;
}
export interface GlobalReadAdmission {
  ref: string;
  status: "VERIFIED" | "CORRECTED" | "UNVERIFIED" | "CONFLICT" | "NOT_COMPARABLE" | "LOOKAHEAD" | "UNAVAILABLE";
  terminalValue: number | string | null;
  admittedValue: number | string | null;
  reason: string;
  selected: GlobalReadFact | null;
  observations: GlobalReadFact[];
  provenance: "TERMINAL_VERIFIED" | "TERMINAL_CORRECTED" | "WEB_ONLY_VERIFIED" | "WEB_ONLY_CONFLICTED" | "UNVERIFIED";
}
export interface GlobalReadSelfAudit {
  outcome: "KEPT" | "REVISED" | "REMOVED";
  checks: Array<{ code: string; action: "KEEP" | "REVISE" | "REMOVE"; finding: string; affectedRefs: string[] }>;
  revisions: string[];
  remainingRisks: string[];
}
export interface GlobalReadExploitability {
  state: "FAVORABLE" | "UNFAVORABLE" | "UNCLEAR";
  rationale: string;
  factRefs: string[];
}
export interface GlobalReadBroadScan {
  searchedAt: string;
  discoveryQueries: string[];
  missedItems: string[];
  forwardLookingItems: string[];
  revisions: string[];
  conclusion: string;
}
export interface GlobalReadPriorManifest {
  informationSetAt: string;
  mode: "PROSPECTIVE" | "RETROSPECTIVE";
  priorPurity: "CLEAN" | "PARTIALLY_CONTAMINATED" | "CONTAMINATED";
  baselineQuality: "COARSE" | "MISSING";
  includedRefs: string[];
  excluded: Array<{ ref: string; reason: string }>;
  hash: string;
  caveats: string[];
}
export interface GlobalReadHypothesis {
  id: string;
  thesis: GlobalReadThesis;
  mechanism: string;
  supportRefs: string[];
  expectedObservations: string[];
  falsifier: string;
}
export interface GlobalReadPrior {
  hypotheses: GlobalReadHypothesis[];
  decisionCriticalRefs: string[];
  researchQuestions: string[];
}
export interface GlobalReadCondition {
  description: string;
  leftRef: string;
  operator: "GT" | "LT" | "EQ";
  /** Compare with an actual evidence value, never a model-invented numerical threshold. */
  rightRef: string;
}
export interface GlobalReadScenario {
  kind: "BASE" | "ALTERNATIVE" | "ADVERSE" | "CONDITIONAL";
  description: string;
  catalystRefs: string[];
  expectedObservations: string[];
  invalidatedBy: string;
  id?: string;
  status?: GlobalReadScenarioStatus;
  mechanism?: string;
  evidenceRefs?: string[];
  contradictions?: string[];
  whatIsPriced?: string;
  whatCouldReprice?: string;
  triggerRefs?: string[];
  triggerConditions?: GlobalReadCondition[];
  weakeningConditions?: string[];
  weakeningComparisons?: GlobalReadCondition[];
  invalidationRefs?: string[];
  invalidationConditions?: GlobalReadCondition[];
  flipConditions?: string[];
  timestamp?: string;
  sourceRunId?: string;
}

export interface GlobalReadFamilyAnalysis {
  family: GlobalReadFamilyKey;
  state: string;
  goldImplicationCeterisParibus: GlobalReadThesis;
  marginalChange: string;
  alreadyPricedAssessment: string;
  causalMechanism: string;
  naturalHorizon: string;
  forwardCatalysts: string[];
  contradictions: string[];
  missingEvidence: string[];
  confidenceBasis: string;
  role: "BIAS" | "TRANSMISSION" | "EXPLOITABILITY" | "BACKGROUND";
  factRefs: string[];
}

export interface GlobalReadQuestionAnswer { question: number; answer: string; factRefs: string[]; unknowns: string[] }
export interface GlobalReadIndependentAnalysis {
  analyst: "A" | "B";
  facts: string[];
  interpretations: string[];
  hypotheses: string[];
  familyAnalyses: GlobalReadFamilyAnalysis[];
  questionAnswers: GlobalReadQuestionAnswer[];
  thesis: GlobalReadThesis;
  marginalDriver: string;
  crossFamilySynthesis: string;
  scenarios: GlobalReadScenario[];
  contradictions: string[];
  webCandidates: GlobalReadWebCandidate[];
  selfAudit: GlobalReadSelfAudit;
  exploitability: GlobalReadExploitability;
  broadScan: GlobalReadBroadScan;
}
export interface GlobalReadDebateItem {
  question: number;
  verdict: "ACCEPT" | "CONTEST" | "UNRESOLVED";
  reason: string;
  evidenceRefs: string[];
  changeOfMindEvidence: string;
}
export interface GlobalReadPostDebateAudit {
  thesisStillSupported: boolean;
  convergenceBasis: "EVIDENCE" | "REASONING_ONLY" | "UNRESOLVED";
  weakenedPremises: string[];
  unsupportedPremises: string[];
  alternativeExplanation: string;
  dangerousGap: string;
  resolver: string;
}
export interface GlobalReadDebateReview { analyst: "A" | "B"; items: GlobalReadDebateItem[]; postDebateAudit: GlobalReadPostDebateAudit }
export interface GlobalReadStateTransition {
  scenarioId: string;
  from: GlobalReadScenarioStatus | null;
  to: GlobalReadScenarioStatus;
  reason: string;
}
export interface GlobalReadCausalNode {
  id: string;
  kind: "FAMILY" | "DRIVER" | "SCENARIO";
  label: string;
  detail: string;
  status: "NEW" | "UNCHANGED" | "STRENGTHENED" | "WEAKENED" | "INVALIDATED" | "UNRESOLVED";
  evidenceRefs: string[];
}
export interface GlobalReadCausalEdge {
  id: string;
  from: string;
  to: string;
  relation: "CONTRIBUTES" | "TRANSMITS" | "BRANCHES" | "CONTRADICTS";
  status: "ESTABLISHED" | "HYPOTHESIS" | "CONTESTED";
}
export interface GlobalReadCausalGraph { nodes: GlobalReadCausalNode[]; edges: GlobalReadCausalEdge[]; changed: boolean }
export interface GlobalReadRebuildState {
  previousRunId: string | null;
  whatChanged: string[];
  dataChanges: string[];
  newCatalysts: string[];
  scenarioTransitions: GlobalReadStateTransition[];
  scenarioTree: GlobalReadScenario[];
  debateResolution: "CONVERGED" | "PARTIALLY_CONVERGED" | "UNRESOLVED" | "ONE_SIDE_INVALIDATED";
  debateSummary: string;
  solidPoints: string[];
  disputedPoints: string[];
  whatWillDecide: string[];
  operationalAction: GlobalReadOperationalAction;
  overview: string;
  assembly: string;
  weakening: string[];
  synthesizedFamilies: GlobalReadFamilyAnalysis[];
  synthesizedQuestions: GlobalReadQuestionAnswer[];
  causalGraph: GlobalReadCausalGraph;
  audit: {
    independentAnalyses: GlobalReadIndependentAnalysis[];
    debateReviews: GlobalReadDebateReview[];
    finalWebCandidates: GlobalReadWebCandidate[];
  };
}
export interface GlobalReadWebCandidate {
  ref: string;
  url: string;
  quote: string;
  purpose: "OFFICIAL_GUIDANCE" | "FORWARD_CATALYST" | "COUNTEREVIDENCE" | "CONTEXT";
}
/** Hypothesis/inference supplied by a model, not a backend-certified fact. */
export interface GlobalReadProposal {
  thesis: GlobalReadThesis;
  marginalDriver: string;
  background: string;
  catalystRefs: string[];
  expectationRefs: string[];
  repricingRefs: string[];
  transmissionRefs: string[];
  decisionCriticalRefs: string[];
  priced: string;
  incrementalSurprise: string;
  remainingEdge: string;
  positioning: string;
  validWhile: string[];
  invalidations: GlobalReadCondition[];
  flip: { thesis: GlobalReadThesis; conditions: GlobalReadCondition[]; newEvidenceRefs: string[]; rationale: string };
  scenarios: GlobalReadScenario[];
  webCandidates: GlobalReadWebCandidate[];
  contradictions: string[];
}
export interface GlobalReadPriceTest {
  state: "CONFIRMS" | "FAILS_TO_CONFIRM" | "CONTRADICTS" | "INCONCLUSIVE";
  reason: string;
  reference: string | null;
  from: string | null;
  to: string | null;
  change: number | null;
  sourceUrl: string | null;
}
export interface GlobalReadCatalyst {
  ref: string;
  title: string;
  scheduledAt: string;
  sourceUrl: string | null;
  verified: boolean;
  group: string;
  phase: string;
}
export interface GlobalReadDecision {
  methodVersion: string;
  runId: string;
  asOf: string;
  snapshotHash: string;
  readiness: GlobalReadReadiness;
  thesis: GlobalReadThesis;
  lifecycle: "FORMATION" | "ACTIVE" | "WEAKENED" | "INVALIDATED";
  decisionUse: "AS_OF_SNAPSHOT" | "HISTORICAL_ONLY";
  expiresAt: string | null;
  marginalDriver: string;
  priced: string;
  remainingEdge: string;
  positioning: string;
  trap: "TRAP_CANDIDATE" | "NOT_ESTABLISHED";
  keyFacts: GlobalReadAdmission[];
  decisionCriticalRefs: string[];
  validWhile: string[];
  invalidations: GlobalReadCondition[];
  flip: GlobalReadProposal["flip"] | null;
  nextCatalysts: GlobalReadCatalyst[];
  scenarios: GlobalReadScenario[];
  blockers: Array<{ code: string; detail: string; recoverable: boolean; resolver: string | null }>;
  warnings: string[];
  /** New authority-compliant report. Legacy fields above remain during API migration only. */
  rebuild?: GlobalReadRebuildState;
  audit: {
    prior: GlobalReadPrior | null;
    priorManifest: GlobalReadPriorManifest;
    priorHash: string | null;
    proposal: GlobalReadProposal | null;
    evidence: GlobalReadAdmission[];
    web: Array<{ candidate: GlobalReadWebCandidate; status: "SEARCHED" | "FETCHED" | "QUOTE_MATCH" | "REJECTED"; resolvedSourceType: string; contentHash: string | null; reason: string }>;
    priceTest: GlobalReadPriceTest;
    timingsMs: Record<string, number>;
    cli: Array<{ provider: string; phase: string; durationMs: number; isolation: string; error: string | null; trace?: Array<{ kind: string; url: string | null; query: string | null }> }>;
    undefinedConfig: string[];
  };
}
