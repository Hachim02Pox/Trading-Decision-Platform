export const SUNDAY_JOBS = [
  "weekly_recap",
  "family_1_fed",
  "family_2_rates",
  "family_3_usd",
  "family_4_macro",
  "family_5_flows",
  "family_6_structural",
] as const;
export type SundayJob = (typeof SUNDAY_JOBS)[number];
export type EvidenceStatus = "ANSWERED" | "PARTIAL" | "UNKNOWN";
export type NodeStatus =
  "CONFIRMED" | "WATCH" | "PENDING" | "UNKNOWN" | "CONTRADICTED";
export type TerminalOutcome = "BULLISH" | "BEARISH" | "NO_EDGE" | "UNRESOLVED";

export interface Source {
  source_id: string;
  title: string;
  publisher: string | null;
  author: string | null;
  published_at: string | null;
  url: string;
  ultimate_origin: string | null;
  syndication_notes: string | null;
  retrieved_at: string;
  provider: string;
}
export interface Evidence {
  id: string;
  family: SundayJob;
  owner: string;
  statement: string;
  value: string | number | null;
  unit: string | null;
  as_of: string | null;
  measurement_window: string | null;
  status: EvidenceStatus;
  type: "EVENT_FACT" | "STATE" | "REPORTED_LINK";
  epistemic_status:
    | "OBSERVED"
    | "DECLARED"
    | "PUBLISHED"
    | "ESTIMATED"
    | "INFERRED"
    | "CALCULATED"
    | "QUALITATIVE"
    | "UNKNOWN";
  change_status: string;
  source_refs: string[];
  reported_link_type:
    "REACTION_TO_EVENT" | "ANTICIPATION_AHEAD_OF_EVENT" | "OTHER" | "UNCLEAR";
  notes: string;
}
export interface EvidenceDocument {
  job: SundayJob;
  status: "SUCCEEDED" | "PARTIAL" | "FAILED";
  evidence: Evidence[];
  sources: Source[];
  provider_metadata?: Record<string, unknown>;
}
export interface ScenarioNode {
  id: string;
  label: string;
  description: string;
  type:
    | "FACT"
    | "STATE"
    | "DRIVER"
    | "TRANSMISSION"
    | "CATALYST"
    | "CONDITION"
    | "POSITIONING"
    | "FUNDING"
    | "OPTIONS"
    | "ASYMMETRY_GATE"
    | "TERMINAL";
  status: NodeStatus;
  evidence_refs: string[];
  terminal_outcome?: TerminalOutcome;
  primary_value?: string;
  as_of?: string;
  measurement_window?: string;
  family_refs?: SundayJob[];
  owner?: string;
  change?: string;
  role_in_story?: string;
  contradictions?: string[];
  trigger_condition?: string;
  evidence_gap?: string;
}
export interface ScenarioExplanation {
  id: string;
  title: string;
  summary: string;
  meaning: string;
  waits_for: string[];
  invalidations: string[];
  branch_node_ids: string[];
}
export interface SundayReadLocalizedGlossaryEntry {
  term: string;
  short_definition: string;
  why_it_matters: string;
  context_here: string;
}
export interface SundayReadGlossaryEntry {
  id: string;
  fr: SundayReadLocalizedGlossaryEntry;
  en: SundayReadLocalizedGlossaryEntry;
}
export interface SundayReadHorizonPresentation {
  summary: string;
  supporting_points: string[];
  counter_case: string;
  invalidation_explained: string;
}
export interface SundayReadSurprisePresentation {
  title: string;
  baseline_explained: string;
  surprise_explained: string;
  transmission_explained: string;
  gold_confirmation: string;
}
export interface SundayReadAsymmetryPresentation {
  headline: string;
  summary: string;
  why: string;
  what_would_change_it: string;
}
export interface SundayReadLocalizedScenarioNodeCopy {
  node_id: string;
  label: string;
  description: string;
}
export interface SundayReadLocalizedScenarioEdgeCopy {
  edge_id: string;
  label: string;
  explanation: string;
}
export interface SundayReadWalkthroughStep {
  id: string;
  node_refs: string[];
  edge_refs: string[];
  text: string;
  glossary_refs?: string[];
}

// V3 presentation contract (GOLD_PRESENTATION_V3_SPEC.md) — additive to the
// V2 shapes above. A V3 document must NOT use the legacy `[[ID|text]]` inline
// markup; instead every locale block below carries plain, final copy plus
// structured `glossary_refs`/`annotations`. See validateFinalRead's V3 audit
// (human-copy scan) for how this is enforced at ingestion time.
export interface SundayReadAnnotation {
  visible_text: string;
  glossary_id: string;
}
export interface SundayReadV4Annotation {
  id: string;
  locale: "fr" | "en";
  path: string;
  anchor: string;
  glossary_id: string;
  occurrence?: number;
}
export interface SundayReadV4VerdictExplanation {
  verdict: string; observations: string[]; mechanism: string; supporting_evidence: string[];
  contrary_evidence: string[]; unknowns: string[]; practical_meaning: string;
  would_change: string; insufficient_alone: string;
}
export interface SundayReadV4Horizon extends SundayReadHorizonPresentation {
  state: string; drivers: string[]; transmission: string; supporting_evidence: string[];
  contradictions: string[]; counter_scenario: string; confirmation: string;
  invalidation: string; week_ahead_implication: string;
}
export interface DirectionState {
  macro_direction: "BULLISH" | "BEARISH" | "MIXED" | "UNCLEAR";
  directional_asymmetry: "BULLISH" | "BEARISH" | "BALANCED" | "UNKNOWN";
  positioning_asymmetry: "BULLISH" | "BEARISH" | "BALANCED" | "CROWDED" | "LATE" | "UNKNOWN";
  edge: "BULLISH" | "BEARISH" | "NO_EDGE" | "UNKNOWN";
}
export interface DirectionEdgeDisplay {
  value: string;
  display: string;
  explanation: string;
  glossary_refs?: string[];
  annotations?: SundayReadAnnotation[];
}
export interface DirectionStatePresentation {
  macro_direction: DirectionEdgeDisplay;
  directional_asymmetry: DirectionEdgeDisplay;
  positioning_asymmetry: DirectionEdgeDisplay;
  edge: DirectionEdgeDisplay;
}
export interface V3ScenarioNodeCopy {
  node_id: string;
  display_title: string;
  display_body: string;
  why_it_matters: string;
  confirmation_needed: string;
  display_status: string;
  display_category: string;
  glossary_refs?: string[];
  annotations?: SundayReadAnnotation[];
}
export interface V3ScenarioEdgeCopy {
  edge_id: string;
  from_node_id: string;
  to_node_id: string;
  display_label: string;
  display_explanation: string;
  confirmation_needed: string;
  glossary_refs?: string[];
  annotations?: SundayReadAnnotation[];
}
export interface ScenarioTreeLocalizationV3 {
  nodes: V3ScenarioNodeCopy[];
  edges: V3ScenarioEdgeCopy[];
}
export type FamilyAuditStatus = "UPDATED" | "UNCHANGED" | "PARTIAL" | "NOT_DUE" | "UNKNOWN" | "INVALIDATED";
export interface FamilyAuditEntry {
  status: FamilyAuditStatus;
  checked_against_new_evidence?: boolean;
  notes?: string;
}
export interface FamilyAudit {
  F1?: FamilyAuditEntry;
  F2?: FamilyAuditEntry;
  F3?: FamilyAuditEntry;
  F4?: FamilyAuditEntry;
  F5?: FamilyAuditEntry;
  F6?: FamilyAuditEntry;
}
export type ScenarioTransitionState =
  | "NOT_TESTED"
  | "CONDITION_TRIGGERED"
  | "TRANSMISSION_PARTIAL"
  | "TRANSMISSION_CONFIRMED"
  | "FLOW_CONFIRMATION_PENDING"
  | "FLOW_CONFIRMED"
  | "CONTRADICTED"
  | "INVALIDATED"
  | "EXPIRED"
  | "SCENARIO_VALIDATED";
export interface ScenarioTransition {
  scenario_ref: string;
  transition_state: ScenarioTransitionState;
  evidence_refs: string[];
}

export interface SundayReadPresentationLocale {
  title: string;
  subtitle: string;
  market_story?: { past_week?: string; current_setup?: string; week_ahead?: string; glossary_refs?: string[]; annotations?: SundayReadAnnotation[] };
  horizons?: Partial<Record<"tactical" | "medium" | "structural", SundayReadHorizonPresentation>>;
  priced_in?: { already_priced?: string[]; surprises?: SundayReadSurprisePresentation[] };
  asymmetry?: SundayReadAsymmetryPresentation;
  scenario_tree?: { nodes?: SundayReadLocalizedScenarioNodeCopy[]; edges?: SundayReadLocalizedScenarioEdgeCopy[] };
  walkthrough?: { intro: string; steps: SundayReadWalkthroughStep[] };
  /** V3 only (presentation.version === 3). */
  direction_state?: DirectionStatePresentation;
  /** V3 only (presentation.version === 3) — standalone-readable node/edge display copy. */
  scenario_tree_v3?: ScenarioTreeLocalizationV3;
  annotations?: SundayReadV4Annotation[];
  conditional_verdicts?: Array<Record<string, unknown>>;
  verdict_explanations?: Partial<Record<"macro_direction" | "directional_asymmetry" | "positioning_asymmetry" | "edge" | "opportunity_quality" | "execution_readiness", SundayReadV4VerdictExplanation>>;
}
export interface SundayReadPresentationScope {
  reviewed_week_start: string;
  reviewed_week_end: string;
  upcoming_week_start: string;
  upcoming_week_end: string;
}
export interface SundayReadPresentation {
  version: 2 | 3 | 4;
  scope: SundayReadPresentationScope;
  fr: SundayReadPresentationLocale;
  en: SundayReadPresentationLocale;
}
export interface FinalRead {
  meta: {
    run_id: string;
    week_of: string;
    generated_at: string;
    data_mode: "FIXTURE" | "REAL";
    status: "COMPLETE" | "PARTIAL";
    as_of?: string;
    gold_price_change?: string;
    /**
     * Continuous-recap lineage (GOLD_CONTINUOUS_RECAP_PROTOCOL.md), optional
     * for backward compatibility — absent on every historical V1/V2 document.
     * When `run_type` is present, the other lineage fields below and a
     * top-level `direction_state` become required (enforced in
     * validateFinalRead, mirroring sunday_read.schema.json's allOf/if/then).
     */
    document_type?: "GOLD_MARKET_STATE";
    frontend_eligible?: boolean;
    run_type?: "SUNDAY" | "INTERMEDIATE";
    parent_run_id?: string | null;
    origin_sunday_run_id?: string;
    evidence_cutoff_start?: string;
    evidence_cutoff_end?: string;
  };
  /** Analytical direction/asymmetry/edge state, kept separate from `asymmetry` — see GOLD_CONTINUOUS_RECAP_PROTOCOL.md §10. Required when meta.run_type is present. */
  direction_state?: DirectionState;
  family_audit?: FamilyAudit;
  scenario_transitions?: ScenarioTransition[];
  /** Set on an intermediate run once it has consumed a NEXT_GOLD_RECAP.json handoff — never itself frontend content. */
  consumed_handoff_id?: string;
  handoff_version?: number;
  handoff_content_hash?: string;
  executive_narrative: string;
  what_changed_this_week?: string[];
  qualitative_confidence?:
    | "CLEAR"
    | "LIKELY"
    | "PLAUSIBLE"
    | "MIXED"
    | "INSUFFICIENT_EVIDENCE"
    | "UNKNOWN";
  competing_hypotheses?: {
    id: string;
    thesis: string;
    evidence_for: string[];
    evidence_against: string[];
    status: string;
  }[];
  cross_asset_reality_test?: {
    summary: string;
    matching_hypothesis_ids: string[];
    conflicting_observations: string[];
  };
  dominant_driver?: string;
  transmission_chains?: string[];
  late?: {
    status: "EARLY" | "BALANCED" | "CROWDED" | "LATE" | "UNKNOWN";
    reason: string;
  };
  event_expiry?: { expires_at: string | null; reason: string | null };
  contexts: Record<
    "tactical" | "medium" | "structural",
    {
      orientation: "BULLISH" | "BEARISH" | "MIXED" | "UNCLEAR";
      why: string;
      evidence_refs: string[];
      competing_thesis: string;
      invalidation: string;
    }
  >;
  priced_in: {
    already_priced: string[];
    surprise_candidates: {
      baseline: string;
      surprise_condition: string;
      first_channel: string;
      branch_refs: string[];
    }[];
    status: "KNOWN" | "PARTIAL" | "UNKNOWN";
  };
  scenario_tree: {
    nodes: ScenarioNode[];
    edges: {
      id?: string;
      from: string;
      to: string;
      label?: string;
      status?: NodeStatus;
    }[];
  };
  scenario_explanations: ScenarioExplanation[];
  asymmetry: {
    summary: string;
    opportunity: "EARLY" | "BALANCED" | "CROWDED" | "LATE" | "UNKNOWN";
    edge: "BULLISH" | "BEARISH" | "NO_EDGE" | "UNKNOWN";
  };
  catalysts: {
    event: string;
    date_time: string | null;
    expectation: string;
    question: string;
    branch_refs: string[];
    tier: "TIER_1" | "TIER_2";
  }[];
  invalidations: string[];
  contradictions: string[];
  anomalies: string[];
  unknowns: string[];
  weekly_timeline: {
    date: string;
    price_fact: string;
    events: string[];
    cross_asset_move: string;
    reported_attribution: string;
  }[];
  evidence: Evidence[];
  sources: Source[];
  glossary?: SundayReadGlossaryEntry[];
  presentation?: SundayReadPresentation;
  family_readouts?: unknown[];
  global_synthesis?: Record<string, unknown>;
  evolution_review?: Record<string, unknown>;
  weekly_bridge?: Record<string, unknown>;
}

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

// Mirrors the Brain V5 admission gate. Keep this dependency-free: Drive
// snapshots are immutable and older publications must remain readable.
const V5_EFFECTIVE_AT = Date.parse("2026-09-25T04:00:00Z");
const V5_FAMILY_QUESTIONS: Record<string, readonly string[]> = {
  F1: ["F1_FED_PRICING", "F1_US2Y", "F1_FED_COMMUNICATION", "F1_NEXT_FOMC"],
  F2: ["F2_REAL_10Y", "F2_RATE_DECOMPOSITION", "F2_CURVE_LEADERSHIP", "F2_2S10S", "F2_EVENT_DYNAMICS", "F2_MOVE"],
  F3: ["F3_DXY", "F3_GOLD_DXY_30D", "F3_USDJPY", "F3_USDCNH", "F3_USD_LIQUIDITY"],
  F4: ["F4_RELEASES", "F4_OIL", "F4_AUCTIONS_FISCAL", "F4_CREDIT"],
  F5: ["F5_COT", "F5_OPEN_INTEREST", "F5_ETF_FLOWS", "F5_OPTIONS", "F5_MARGINAL_FLOW", "F5_FORCED_ACTOR", "F5_FUNDING", "F5_FUSE", "F5_PRICE_FLOW_DIVERGENCE"],
  F6: ["F6_CENTRAL_BANKS", "F6_CHINA_PHYSICAL", "F6_DEDOLLARIZATION", "F6_DEBASEMENT"],
};
const v5Text = (value: unknown) => isObject(value) && ["fr", "en"].every((locale) => typeof value[locale] === "string" && (value[locale] as string).trim().length >= 12);
const v5Narrative = (value: unknown, ids: Set<string>) => isObject(value) && v5Text(value) && Array.isArray(value.evidence_refs) && value.evidence_refs.every((id) => typeof id === "string" && ids.has(id));
function validateV5Readout(value: Record<string, unknown>, errors: string[]) {
  const meta = value.meta as Record<string, unknown> | undefined;
  if (!meta || meta.data_mode !== "REAL" || !["SUNDAY", "INTERMEDIATE"].includes(String(meta.run_type)) || Date.parse(String(meta.generated_at)) < V5_EFFECTIVE_AT) return;
  const evidenceIds = new Set(Array.isArray(value.evidence) ? value.evidence.filter(isObject).map((item) => item.id).filter((id): id is string => typeof id === "string") : []);
  if (meta.run_type === "SUNDAY") {
    if (!Array.isArray(value.family_readouts)) { errors.push("V5 Sunday requires family_readouts for F1–F6."); return; }
    const families = new Set<string>();
    for (const family of value.family_readouts) {
      if (!isObject(family) || typeof family.family_id !== "string" || !V5_FAMILY_QUESTIONS[family.family_id]) { errors.push("Invalid V5 family_readouts family."); continue; }
      families.add(family.family_id);
      if (!v5Text(family.title)) errors.push(`V5 ${family.family_id} requires bilingual title.`);
      const questions = Array.isArray(family.questions) ? family.questions : [];
      const ids = new Set(questions.filter(isObject).map((q) => q.question_id));
      for (const id of V5_FAMILY_QUESTIONS[family.family_id]) if (!ids.has(id)) errors.push(`V5 ${family.family_id} missing ${id}.`);
      for (const question of questions) {
        if (!isObject(question) || !v5Text(question.question) || !v5Text(question.answer) || !["ANSWERED", "PARTIAL", "UNKNOWN", "NOT_APPLICABLE"].includes(String(question.status))) { errors.push(`Invalid V5 question in ${family.family_id}.`); continue; }
        const refs = question.evidence_refs;
        if (!Array.isArray(refs) || !refs.every((id) => typeof id === "string" && evidenceIds.has(id))) errors.push(`V5 ${family.family_id} question has unresolved evidence.`);
        if (question.status === "ANSWERED" && (!question.as_of || !Array.isArray(refs) || refs.length === 0)) errors.push(`V5 ${family.family_id} answered question requires date and evidence.`);
        if (question.status !== "ANSWERED" && (!isObject(question.unknown_reason) || !["AWAITING_PUBLICATION", "SOURCE_NOT_RETRIEVED", "SOURCE_INACCESSIBLE", "COMPARABILITY_FAILED", "METHODOLOGY_NOT_VERIFIED", "STRUCTURALLY_UNOBSERVABLE", "CAUSE_UNDETERMINED", "NOT_MATERIAL"].includes(String(question.unknown_reason.reason_kind)) || !v5Text(question.unknown_reason.explanation) || !v5Text(question.unknown_reason.checked) || !v5Text(question.unknown_reason.next_action))) errors.push(`V5 ${family.family_id} unknown question requires explained gap.`);
      }
      for (const key of ["established", "mechanism", "counterevidence", "limits", "forward_test"]) if (!v5Narrative((family.family_reasoning as Record<string, unknown> | undefined)?.[key], evidenceIds)) errors.push(`V5 ${family.family_id} missing reasoning.${key}.`);
    }
    for (const family of Object.keys(V5_FAMILY_QUESTIONS)) if (!families.has(family)) errors.push(`V5 Sunday missing ${family}.`);
    for (const key of ["causal_chain", "alternatives", "contradictions", "priced_in", "forward_conditions", "invalidation", "unknowns", "edge_reasoning"]) if (!v5Narrative((value.global_synthesis as Record<string, unknown> | undefined)?.[key], evidenceIds)) errors.push(`V5 Sunday missing global_synthesis.${key}.`);
    if (!isObject(value.weekly_bridge)) errors.push("V5 Sunday requires weekly_bridge.");
    else for (const key of ["comparison_limit", "differences", "surviving_conclusions", "resolved_expectations", "failed_expectations"]) if (!v5Narrative(value.weekly_bridge[key], evidenceIds)) errors.push(`V5 weekly_bridge missing ${key}.`);
  } else {
    const review = value.evolution_review;
    if (!isObject(review) || review.parent_run_id !== meta.parent_run_id) errors.push("V5 intermediate requires evolution_review tied to meta.parent_run_id.");
    else {
      if (!["INTACT", "STRENGTHENED", "WEAKENED", "CHANGED", "INVALIDATED", "UNCLEAR"].includes(String(review.thesis_status))) errors.push("V5 evolution_review has invalid thesis_status.");
      for (const key of ["narrative", "still_true", "new_observations", "strengthened", "weakened", "invalidated", "exogenous_factors", "unresolved", "next_checks"]) if (!v5Narrative(review[key], evidenceIds)) errors.push(`V5 evolution_review missing ${key}.`);
    }
  }
}
export function validateEvidenceDocument(value: unknown): string[] {
  if (!isObject(value)) return ["Evidence document must be an object."];
  const errors: string[] = [];
  if (!SUNDAY_JOBS.includes(value.job as SundayJob))
    errors.push("Invalid evidence job.");
  if (!Array.isArray(value.evidence)) errors.push("evidence must be an array.");
  else
    value.evidence.forEach((item, index) => {
      if (
        !isObject(item) ||
        typeof item.id !== "string" ||
        typeof item.statement !== "string" ||
        !["ANSWERED", "PARTIAL", "UNKNOWN"].includes(String(item.status))
      )
        errors.push(`Invalid evidence item ${index}.`);
    });
  if (!Array.isArray(value.sources)) errors.push("sources must be an array.");
  return errors;
}
export function validateFinalRead(value: unknown): string[] {
  if (!isObject(value)) return ["Final output must be an object."];
  const errors: string[] = [];
  for (const key of [
    "meta",
    "executive_narrative",
    "contexts",
    "priced_in",
    "scenario_tree",
    "scenario_explanations",
    "asymmetry",
    "catalysts",
    "invalidations",
    "contradictions",
    "anomalies",
    "unknowns",
    "weekly_timeline",
    "evidence",
    "sources",
  ])
    if (!(key in value)) errors.push(`Missing ${key}.`);
  const explanations = value.scenario_explanations;
  if (!Array.isArray(explanations))
    errors.push("scenario_explanations must be an array.");
  else
    explanations.forEach((item, index) => {
      if (
        !isObject(item) ||
        typeof item.id !== "string" ||
        typeof item.title !== "string" ||
        typeof item.summary !== "string" ||
        typeof item.meaning !== "string" ||
        !Array.isArray(item.waits_for) ||
        !Array.isArray(item.invalidations) ||
        !Array.isArray(item.branch_node_ids)
      )
        errors.push(`Invalid scenario explanation ${index}.`);
    });
  const tree = value.scenario_tree;
  if (
    !isObject(tree) ||
    !Array.isArray(tree.nodes) ||
    !Array.isArray(tree.edges)
  )
    return [...errors, "scenario_tree must contain nodes and edges."];
  const nodes = tree.nodes as Record<string, unknown>[];
  const edges = tree.edges as Record<string, unknown>[];
  const byId = new Map(
    nodes
      .filter((node) => typeof node.id === "string")
      .map((node) => [node.id as string, node]),
  );
  if (value.presentation !== undefined) {
    const presentation = value.presentation;
    if (!isObject(presentation) || (presentation.version !== 2 && presentation.version !== 3 && presentation.version !== 4)) {
      errors.push("Invalid presentation (must be version 2, 3 or 4).");
    } else {
      const glossaryIds = new Set<string>();
      if (value.glossary !== undefined) {
        if (!Array.isArray(value.glossary)) errors.push("glossary must be an array.");
        else {
          const validLocaleEntry = (locale: unknown) =>
            isObject(locale) &&
            typeof locale.term === "string" &&
            typeof locale.short_definition === "string";
          value.glossary.forEach((entry) => {
            if (
              !isObject(entry) ||
              typeof entry.id !== "string" ||
              !validLocaleEntry(entry.fr) ||
              !validLocaleEntry(entry.en)
            )
              errors.push("Invalid glossary entry.");
            else if (glossaryIds.has(entry.id)) errors.push(`Duplicate glossary id ${entry.id}.`);
            else glossaryIds.add(entry.id);
          });
        }
      }
      const token = /\[\[([^|\]]+)\|[^\]]+\]\]/g;
      const checkText = (text: unknown) => {
        if (typeof text !== "string") return;
        for (const match of text.matchAll(token)) if (!glossaryIds.has(match[1])) errors.push(`Unresolved glossary token ${match[1]}.`);
      };
      const edgeIds = new Set(edges.map((edge) => edge.id).filter((id): id is string => typeof id === "string"));
      for (const locale of [presentation.fr, presentation.en]) {
        if (!locale || !isObject(locale)) continue;
        const steps = isObject(locale.walkthrough) && Array.isArray(locale.walkthrough.steps) ? locale.walkthrough.steps : undefined;
        if (Array.isArray(steps)) steps.forEach((step) => {
          if (!isObject(step) || !Array.isArray(step.node_refs) || typeof step.text !== "string") errors.push("Invalid walkthrough step.");
          else {
            checkText(step.text);
            step.node_refs.forEach((id) => { if (typeof id !== "string" || !byId.has(id)) errors.push(`Unresolved walkthrough node ${String(id)}.`); });
            if (Array.isArray(step.edge_refs)) step.edge_refs.forEach((id) => { if (typeof id !== "string" || !edgeIds.has(id)) errors.push(`Unresolved walkthrough edge ${String(id)}.`); });
          }
        });
      }

      // V3-only checks (GOLD_PRESENTATION_V3_SPEC.md): the direction/edge
      // display block and the standalone node/edge display copy are
      // mandatory in both locales, raw [[ID|text]] markup is forbidden
      // outright (not merely "unresolved"), and no literal scenario
      // node/edge id may leak into human-facing copy.
      if (presentation.version === 3 || presentation.version === 4) {
        const STRUCTURAL_REF_KEYS = new Set([
          "node_id", "edge_id", "from_node_id", "to_node_id", "node_refs", "edge_refs",
          "glossary_refs", "branch_refs", "branch_node_ids", "id", "value",
        ]);
        const collectHumanCopyStrings = (node: unknown, keyName: string | undefined, out: string[]): void => {
          if (keyName && STRUCTURAL_REF_KEYS.has(keyName)) return;
          if (typeof node === "string") { out.push(node); return; }
          if (Array.isArray(node)) { node.forEach((item) => collectHumanCopyStrings(item, keyName, out)); return; }
          if (isObject(node)) { for (const [k, v] of Object.entries(node)) collectHumanCopyStrings(v, k, out); }
        };
        const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const nodeEdgeIds = [
          ...nodes.map((n) => n.id).filter((id): id is string => typeof id === "string"),
          ...edges.map((e) => e.id).filter((id): id is string => typeof id === "string"),
        ];
        const requireDisplay = (label: string, block: unknown) => {
          if (!isObject(block) || typeof block.value !== "string" || typeof block.display !== "string" || typeof block.explanation !== "string")
            errors.push(`Invalid V3 ${label} display block.`);
        };
        const requireV3Node = (index: number, node: unknown) => {
          if (
            !isObject(node) ||
            typeof node.node_id !== "string" ||
            typeof node.display_title !== "string" ||
            typeof node.display_body !== "string" ||
            typeof node.why_it_matters !== "string" ||
            typeof node.confirmation_needed !== "string" ||
            typeof node.display_status !== "string" ||
            typeof node.display_category !== "string"
          )
            errors.push(`Invalid V3 scenario_tree_v3 node ${index}.`);
        };
        const requireV3Edge = (index: number, edge: unknown) => {
          if (
            !isObject(edge) ||
            typeof edge.edge_id !== "string" ||
            typeof edge.from_node_id !== "string" ||
            typeof edge.to_node_id !== "string" ||
            typeof edge.display_label !== "string" ||
            typeof edge.display_explanation !== "string" ||
            typeof edge.confirmation_needed !== "string"
          )
            errors.push(`Invalid V3 scenario_tree_v3 edge ${index}.`);
        };
        for (const [localeName, locale] of [["fr", presentation.fr], ["en", presentation.en]] as const) {
          if (!isObject(locale)) { errors.push(`Missing presentation.${localeName} for V3.`); continue; }
          if (!isObject(locale.direction_state)) errors.push(`Missing presentation.${localeName}.direction_state (V3).`);
          else {
            requireDisplay(`${localeName}.direction_state.macro_direction`, locale.direction_state.macro_direction);
            requireDisplay(`${localeName}.direction_state.directional_asymmetry`, locale.direction_state.directional_asymmetry);
            requireDisplay(`${localeName}.direction_state.positioning_asymmetry`, locale.direction_state.positioning_asymmetry);
            requireDisplay(`${localeName}.direction_state.edge`, locale.direction_state.edge);
          }
          if (presentation.version === 4) {
            const marketStory = locale.market_story;
            if (!isObject(marketStory) || !Array.isArray(marketStory.chronology) || !isObject(marketStory.causal_assessment)) errors.push(`Missing presentation.${localeName} V4 market-story detail.`);
            const verdicts = locale.verdict_explanations;
            for (const verdict of ["macro_direction", "directional_asymmetry", "positioning_asymmetry", "edge", "opportunity_quality", "execution_readiness"]) {
              const detail = isObject(verdicts) ? verdicts[verdict] : undefined;
              for (const field of ["verdict", "observations", "mechanism", "supporting_evidence", "contrary_evidence", "unknowns", "practical_meaning", "would_change", "insufficient_alone"]) if (!isObject(detail) || detail[field] === undefined) errors.push(`Missing presentation.${localeName}.verdict_explanations.${verdict}.${field} (V4).`);
            }
          }
          if (!isObject(locale.scenario_tree_v3) || !Array.isArray(locale.scenario_tree_v3.nodes) || !Array.isArray(locale.scenario_tree_v3.edges)) {
            errors.push(`Missing presentation.${localeName}.scenario_tree_v3 (V3).`);
          } else {
            locale.scenario_tree_v3.nodes.forEach((n: unknown, i: number) => requireV3Node(i, n));
            locale.scenario_tree_v3.edges.forEach((e: unknown, i: number) => requireV3Edge(i, e));
          }
          const strings: string[] = [];
          collectHumanCopyStrings(locale, undefined, strings);
          for (const text of strings) {
            if (token.test(text)) errors.push(`Raw [[GLOSSARY_ID|...]] markup is forbidden in V3 presentation.${localeName} copy.`);
            token.lastIndex = 0;
            for (const id of nodeEdgeIds) {
              const boundary = new RegExp(`(?<![A-Za-z0-9_])${escapeRegExp(id)}(?![A-Za-z0-9_])`);
              if (boundary.test(text)) errors.push(`Internal id "${id}" leaked into presentation.${localeName} human-facing copy.`);
            }
          }
        }
      }
    }
  }

  // Continuous-recap lineage (meta.run_type present) — mirrors
  // sunday_read.schema.json's allOf/if/then: a document participating in the
  // rolling lineage must carry full lineage metadata and an analytical
  // direction_state. Historical documents without meta.run_type are
  // completely unaffected by this block.
  if (isObject(value.meta) && (value.meta.run_type === "SUNDAY" || value.meta.run_type === "INTERMEDIATE")) {
    const meta = value.meta;
    if (!("parent_run_id" in meta)) errors.push("meta.parent_run_id is required when meta.run_type is set.");
    if (typeof meta.origin_sunday_run_id !== "string") errors.push("meta.origin_sunday_run_id is required when meta.run_type is set.");
    if (typeof meta.evidence_cutoff_start !== "string") errors.push("meta.evidence_cutoff_start is required when meta.run_type is set.");
    if (typeof meta.evidence_cutoff_end !== "string") errors.push("meta.evidence_cutoff_end is required when meta.run_type is set.");
    if (typeof meta.evidence_cutoff_start === "string" && typeof meta.evidence_cutoff_end === "string" && Date.parse(meta.evidence_cutoff_start) > Date.parse(meta.evidence_cutoff_end)) errors.push("meta.evidence_cutoff_end must not precede meta.evidence_cutoff_start.");
    if (meta.run_type === "SUNDAY" && meta.parent_run_id !== null) errors.push("Sunday meta.parent_run_id must be null.");
    if (meta.run_type === "SUNDAY" && meta.origin_sunday_run_id !== meta.run_id) errors.push("Sunday meta.origin_sunday_run_id must equal meta.run_id.");
    if (meta.run_type === "INTERMEDIATE" && (typeof meta.parent_run_id !== "string" || !meta.parent_run_id)) errors.push("Intermediate meta.parent_run_id must identify its parent state.");
    if (meta.document_type !== "GOLD_MARKET_STATE") errors.push('meta.document_type must be "GOLD_MARKET_STATE" when meta.run_type is set.');
    if (meta.frontend_eligible !== true) errors.push("meta.frontend_eligible must be true when meta.run_type is set.");
    const direction = value.direction_state;
    const enums = {
      macro_direction: ["BULLISH", "BEARISH", "MIXED", "UNCLEAR"],
      directional_asymmetry: ["BULLISH", "BEARISH", "BALANCED", "UNKNOWN"],
      positioning_asymmetry: ["BULLISH", "BEARISH", "BALANCED", "CROWDED", "LATE", "UNKNOWN"],
      edge: ["BULLISH", "BEARISH", "NO_EDGE", "UNKNOWN"],
    } as const;
    if (!isObject(direction)) errors.push("Top-level direction_state is required when meta.run_type is set.");
    else
      for (const [field, allowed] of Object.entries(enums))
        if (!(allowed as readonly string[]).includes(String((direction as Record<string, unknown>)[field])))
          errors.push(`Invalid direction_state.${field}.`);
  }
  for (const node of nodes) {
    if (
      node.type === "TERMINAL" &&
      ["BULLISH", "BEARISH"].includes(String(node.terminal_outcome))
    ) {
      let cursor = node.id as string;
      const seen = new Set<string>();
      let gated = false;
      while (cursor && !seen.has(cursor)) {
        seen.add(cursor);
        const parent = edges.find((edge) => edge.to === cursor)?.from;
        if (typeof parent !== "string") break;
        if (byId.get(parent)?.type === "ASYMMETRY_GATE") {
          gated = true;
          break;
        }
        cursor = parent;
      }
      if (!gated)
        errors.push(
          `Directional terminal ${String(node.id)} must follow an asymmetry gate.`,
        );
    }
  }
  validateV5Readout(value, errors);
  return errors;
}

export function createFixtureFinalRead(): FinalRead {
  const now = new Date().toISOString();
  const source: Source = {
    source_id: "fixture-wgc",
    title: "Fixture-only evidence",
    publisher: "Fixture",
    author: null,
    published_at: now,
    url: "https://example.invalid/fixture",
    ultimate_origin: null,
    syndication_notes: "DEMO only.",
    retrieved_at: now,
    provider: "fixture",
  };
  const evidence: Evidence = {
    id: "fixture-weekly",
    family: "weekly_recap",
    owner: "fixture",
    statement: "DEMO evidence only — no real market fact.",
    value: null,
    unit: null,
    as_of: now,
    measurement_window: "fixture",
    status: "PARTIAL",
    type: "STATE",
    epistemic_status: "QUALITATIVE",
    change_status: "FIXTURE",
    source_refs: [source.source_id],
    reported_link_type: "UNCLEAR",
    notes: "End-to-end visual test only.",
  };
  const node = (
    id: string,
    label: string,
    type: ScenarioNode["type"],
    status: NodeStatus,
    description: string,
    extras: Partial<ScenarioNode> = {},
  ): ScenarioNode => ({
    id,
    label,
    type,
    status,
    description,
    evidence_refs: [evidence.id],
    owner: "fixture",
    family_refs: ["weekly_recap"],
    ...extras,
  });
  return {
    meta: {
      run_id: "fixture-2026-09-12",
      week_of: "2026-09-07",
      generated_at: now,
      data_mode: "FIXTURE",
      status: "PARTIAL",
      as_of: "DEMO / no market timestamp",
    },
    executive_narrative:
      "DEMO / FIXTURE — Cette narration multi-paragraphe vérifie le rendu pédagogique sans constituer une analyse réelle. Les chemins ne représentent ni prix ni causalité observée.\n\nLe lecteur voit une souche commune, deux conditions alternatives et les portes d’asymétrie qui empêchent toute conclusion automatique.",
    what_changed_this_week: [
      "DEMO: branchement dynamique activé",
      "DEMO: preuves volontairement inconnues",
    ],
    qualitative_confidence: "INSUFFICIENT_EVIDENCE",
    dominant_driver: "DEMO: aucune lecture de marché réelle",
    transmission_chains: [
      "Fixture state → catalyst → conditional transmission → asymmetry",
    ],
    competing_hypotheses: [
      {
        id: "soft",
        thesis: "DEMO: condition A",
        evidence_for: [evidence.id],
        evidence_against: ["Aucune donnée réelle"],
        status: "PENDING",
      },
      {
        id: "hot",
        thesis: "DEMO: condition B",
        evidence_for: [evidence.id],
        evidence_against: ["Aucune donnée réelle"],
        status: "PENDING",
      },
    ],
    cross_asset_reality_test: {
      summary: "DEMO: aucun cross-asset observé.",
      matching_hypothesis_ids: [],
      conflicting_observations: ["Données absentes par conception."],
    },
    late: { status: "UNKNOWN", reason: "Fixture sans positionnement réel." },
    event_expiry: { expires_at: null, reason: "DEMO" },
    contexts: {
      tactical: {
        orientation: "UNCLEAR",
        why: "Fixture sans conclusion réelle.",
        evidence_refs: [evidence.id],
        competing_thesis: "Aucune thèse réelle.",
        invalidation: "Recherche réelle validée.",
      },
      medium: {
        orientation: "MIXED",
        why: "Démonstration du rendu.",
        evidence_refs: [evidence.id],
        competing_thesis: "Données insuffisantes.",
        invalidation: "Recherche réelle validée.",
      },
      structural: {
        orientation: "UNCLEAR",
        why: "Démonstration du rendu.",
        evidence_refs: [evidence.id],
        competing_thesis: "Aucune donnée structurelle.",
        invalidation: "Recherche réelle validée.",
      },
    },
    priced_in: {
      already_priced: ["UNKNOWN / DEMO"],
      surprise_candidates: [
        {
          baseline: "DEMO",
          surprise_condition: "Condition A ou B",
          first_channel: "Transmission explicitement libellée",
          branch_refs: ["soft-condition", "hot-condition"],
        },
      ],
      status: "UNKNOWN",
    },
    scenario_tree: {
      nodes: [
        node(
          "state",
          "CURRENT STATE / DEMO",
          "STATE",
          "CONFIRMED",
          "Souche commune de démonstration.",
          { primary_value: "FIXTURE ONLY", as_of: "DEMO" },
        ),
        node(
          "driver",
          "UNRESOLVED DRIVER",
          "DRIVER",
          "WATCH",
          "Le facteur dominant n’est pas établi.",
          { primary_value: "UNKNOWN" },
        ),
        node(
          "catalyst",
          "NEXT CATALYST",
          "CATALYST",
          "PENDING",
          "L’événement futur sépare les branches.",
          { trigger_condition: "DEMO condition only" },
        ),
        node(
          "soft-condition",
          "CONDITION A",
          "CONDITION",
          "PENDING",
          "Première branche de démonstration.",
        ),
        node(
          "soft-flow",
          "POSITIONING INPUT",
          "POSITIONING",
          "UNKNOWN",
          "Les données de positionnement manquent volontairement.",
          { evidence_gap: "DEMO: no COT / ETF evidence" },
        ),
        node(
          "soft-gate",
          "ASYMMETRY / EDGE",
          "ASYMMETRY_GATE",
          "WATCH",
          "La direction ne suffit pas à établir une opportunité.",
        ),
        node(
          "soft-terminal",
          "NO EDGE",
          "TERMINAL",
          "CONFIRMED",
          "Démonstration d’une sortie neutre.",
          { terminal_outcome: "NO_EDGE" },
        ),
        node(
          "hot-condition",
          "CONDITION B",
          "CONDITION",
          "PENDING",
          "Seconde branche de démonstration.",
        ),
        node(
          "hot-funding",
          "FUNDING / OPTIONS",
          "FUNDING",
          "UNKNOWN",
          "Le financement et les options ne sont pas renseignés.",
        ),
        node(
          "hot-gate",
          "ASYMMETRY / EDGE",
          "ASYMMETRY_GATE",
          "WATCH",
          "Porte obligatoire avant toute conclusion directionnelle.",
        ),
        node(
          "hot-terminal",
          "BEARISH",
          "TERMINAL",
          "WATCH",
          "Terminal conditionnel de démonstration.",
          { terminal_outcome: "BEARISH" },
        ),
        node(
          "bull-gate",
          "ASYMMETRY / EDGE",
          "ASYMMETRY_GATE",
          "PENDING",
          "Branche supplémentaire pour tester un terminal bullish.",
        ),
        node(
          "bull-terminal",
          "BULLISH",
          "TERMINAL",
          "PENDING",
          "Terminal conditionnel de démonstration.",
          { terminal_outcome: "BULLISH" },
        ),
      ],
      edges: [
        { id: "e1", from: "state", to: "driver", label: "sets context" },
        {
          id: "e2",
          from: "driver",
          to: "catalyst",
          label: "awaits resolution",
        },
        {
          id: "e3",
          from: "catalyst",
          to: "soft-condition",
          label: "condition A",
        },
        {
          id: "e4",
          from: "soft-condition",
          to: "soft-flow",
          label: "requires flows",
        },
        { id: "e5", from: "soft-flow", to: "soft-gate", label: "tests edge" },
        {
          id: "e6",
          from: "soft-gate",
          to: "soft-terminal",
          label: "no asymmetry",
        },
        {
          id: "e7",
          from: "catalyst",
          to: "hot-condition",
          label: "condition B",
        },
        {
          id: "e8",
          from: "hot-condition",
          to: "hot-funding",
          label: "transmits through",
        },
        { id: "e9", from: "hot-funding", to: "hot-gate", label: "tests edge" },
        {
          id: "e10",
          from: "hot-gate",
          to: "hot-terminal",
          label: "conditional outcome",
        },
        {
          id: "e11",
          from: "soft-condition",
          to: "bull-gate",
          label: "alternative confirmation",
        },
        {
          id: "e12",
          from: "bull-gate",
          to: "bull-terminal",
          label: "conditional outcome",
        },
      ],
    },
    scenario_explanations: [
      {
        id: "demo-no-edge",
        title: "CONDITION A / NO EDGE",
        summary: "DEMO: la branche se termine sans asymétrie exploitable.",
        meaning:
          "DEMO: une direction possible ne constitue pas à elle seule une décision.",
        waits_for: ["Données réelles de flux et de positionnement."],
        invalidations: ["Preuve réelle d’une asymétrie mesurable."],
        branch_node_ids: [
          "soft-condition",
          "soft-flow",
          "soft-gate",
          "soft-terminal",
        ],
      },
      {
        id: "demo-bearish",
        title: "CONDITION B / BEARISH",
        summary: "DEMO: la branche baissière reste entièrement conditionnelle.",
        meaning:
          "DEMO: le terminal ne devient lisible qu’après la porte d’asymétrie.",
        waits_for: ["Données réelles de financement et d’options."],
        invalidations: [
          "Échec de la condition B ou porte d’asymétrie non validée.",
        ],
        branch_node_ids: [
          "hot-condition",
          "hot-funding",
          "hot-gate",
          "hot-terminal",
        ],
      },
      {
        id: "demo-bullish",
        title: "CONDITION A / BULLISH",
        summary:
          "DEMO: l’alternative haussière exige une confirmation distincte.",
        meaning:
          "DEMO: un terminal haussier est une fin de branche, pas une prédiction automatique.",
        waits_for: ["Confirmation alternative et porte d’asymétrie."],
        invalidations: ["Absence de confirmation ou asymétrie défavorable."],
        branch_node_ids: ["soft-condition", "bull-gate", "bull-terminal"],
      },
    ],
    asymmetry: {
      summary:
        "DEMO: les portes d’asymétrie restent visibles avant chaque terminal.",
      opportunity: "UNKNOWN",
      edge: "NO_EDGE",
    },
    catalysts: [
      {
        event: "Fixture validation",
        date_time: null,
        expectation: "UNKNOWN",
        question: "Le renderer dynamique reste-t-il lisible ?",
        branch_refs: ["catalyst"],
        tier: "TIER_1",
      },
    ],
    invalidations: ["Fixture non utilisable comme analyse."],
    contradictions: ["Preuves réelles absentes."],
    anomalies: ["Aucune."],
    unknowns: ["Données de marché, COT, ETF, options et funding."],
    weekly_timeline: [
      {
        date: "FIXTURE",
        price_fact: "Aucun prix réel.",
        events: ["Fixture pipeline"],
        cross_asset_move: "UNKNOWN",
        reported_attribution: "Fixture uniquement.",
      },
    ],
    evidence: [evidence],
    sources: [source],
  };
}
