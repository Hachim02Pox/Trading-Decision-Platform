import type { PublicGoldLearningExperience, GoldLearningExperienceStatus } from "@gold-terminal/contracts";
import { projectPublicLearning, validateRichEditorial } from "./learning";
import { editorialProblems } from "./brain/editorial";
import { createHash } from "node:crypto";

export interface GoldEditorialV6 {
  document_type: "GOLD_MARKET_STATE";
  format_version: "6.0";
  frontend_eligible: true;
  meta: {
    run_id: string; run_type: "SUNDAY" | "INTERMEDIATE"; data_mode: "REAL" | "FIXTURE";
    status: "COMPLETE" | "PARTIAL"; parent_run_id: string | null; origin_sunday_run_id: string;
    week_of: string; generated_at: string; evidence_cutoff_start: string; evidence_cutoff_end: string;
  };
  time_scope: { evidence_cutoff_utc: string };
  weekly_cycle: { origin_run_id: string; intermediate_index: number };
  consumed_handoff?: { handoff_id: string; handoff_version: number; content_sha256: string };
  [key: string]: unknown;
}

/**
 * The public editorial contract.  This is intentionally a projection, rather
 * than an alias for the stored Brain document: research/audit/source material
 * must remain available for admission and traceability without becoming an
 * accidental API response.
 */
export interface PublicGoldEditorialV6 {
  document_type: "GOLD_MARKET_STATE";
  format_version: "6.0";
  frontend_eligible: true;
  learning_experience?: PublicGoldLearningExperience;
  learning_experience_status: GoldLearningExperienceStatus;
  title_fr: string;
  meta: Pick<GoldEditorialV6["meta"], "run_id" | "run_type" | "status" | "parent_run_id" | "origin_sunday_run_id" | "week_of" | "generated_at" | "evidence_cutoff_start" | "evidence_cutoff_end">;
  time_scope: Record<string, unknown>;
  weekly_cycle: Record<string, unknown>;
  reading_order: unknown[];
  opening_thesis: Array<Record<string, unknown>>;
  decision_panel: Record<string, unknown>;
  six_judgments: Array<Record<string, unknown>>;
  horizons: Record<string, unknown>;
  calendar: Array<Record<string, unknown>>;
  scenario_tree: { root_id: unknown; nodes: Array<Record<string, unknown>>; edges: Array<Record<string, unknown>> };
  family_readouts: Array<Record<string, unknown>>;
  chronology: Array<Record<string, unknown>>;
  exogenous_review: Array<Record<string, unknown>>;
  glossary_fr: Record<string, unknown>;
  weekly_bridge?: Record<string, unknown>;
  evolution_review?: Record<string, unknown>;
}

const REQUIRED = ["document_type", "format_version", "frontend_eligible", "meta", "title_fr", "time_scope", "weekly_cycle", "reading_order", "opening_thesis", "decision_panel", "six_judgments", "horizons", "calendar", "scenario_tree", "family_readouts", "chronology", "exogenous_review", "datasets", "glossary_fr", "sources", "research_audit", "procedural_audit", "content_preview"];
const ROOT_KEYS = new Set([...REQUIRED, "weekly_bridge", "evolution_review", "consumed_handoff", "fixture_notice", "learning_experience"]);
const isObject = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);
const nonEmpty = (value: unknown): value is string => typeof value === "string" && value.trim().length > 0;
const validTime = (value: unknown): boolean => nonEmpty(value) && !Number.isNaN(Date.parse(value));
const pick = (value: unknown, keys: readonly string[]): Record<string, unknown> => {
  if (!isObject(value)) return {};
  return Object.fromEntries(keys.filter((key) => key in value).map((key) => [key, value[key]]));
};
const pickMany = (value: unknown, keys: readonly string[]): Array<Record<string, unknown>> => Array.isArray(value) ? value.map((item) => pick(item, keys)) : [];

/** Runtime whitelist used by every public Gold-read route for a v6 document. */
export function projectPublicGoldEditorialV6(value: GoldEditorialV6): PublicGoldEditorialV6 {
  const scenario = pick(value.scenario_tree, ["root_id"]);
  const panel = pick(value.decision_panel, ["title_fr", "title_en", "as_of", "horizon", "scope", "instruments", "recheck_fr", "scheduled_expiry", "earlier_expiry", "separate_choices_fr", "limit_fr"]);
  panel.instruments = pickMany((value.decision_panel as Record<string, unknown>)?.instruments, ["instrument", "eligible_direction", "long_eligible", "short_eligible", "answer_fr", "gate", "mechanism_fr", "strongest_contradiction_fr", "flip_fr"]);
  const projectEvolution = (evolution: unknown): Record<string, unknown> => {
    const result = pick(evolution, ["parent_run_id", "parent_cutoff", "summary_fr"]);
    for (const name of ["still_true", "new_observations", "strengthened", "weakened", "invalidated", "exogenous_factors", "unresolved", "next_checks"])
      result[name] = pickMany((evolution as Record<string, unknown>)?.[name], ["title_fr", "body_fr"]);
    result.judgment_changes = pickMany((evolution as Record<string, unknown>)?.judgment_changes, ["judgment_id", "previous_state", "current_state", "reason_fr", "consequence_fr"]);
    result.scenario_transitions = pickMany((evolution as Record<string, unknown>)?.scenario_transitions, ["scenario_id", "status", "explanation_fr"]);
    return result;
  };
  const projected: PublicGoldEditorialV6 = {
    document_type: value.document_type, format_version: value.format_version, frontend_eligible: value.frontend_eligible,
    learning_experience_status: !value.learning_experience ? "ABSENT" : isObject(value.learning_experience) && value.learning_experience.version === "1.0" ? "AVAILABLE" : "UNSUPPORTED_VERSION",
    title_fr: String(value.title_fr ?? ""),
    meta: pick(value.meta, ["run_id", "run_type", "status", "parent_run_id", "origin_sunday_run_id", "week_of", "generated_at", "evidence_cutoff_start", "evidence_cutoff_end"]) as PublicGoldEditorialV6["meta"],
    time_scope: pick(value.time_scope, ["evidence_cutoff_utc", "evidence_cutoff_ny", "generated_at", "reviewed_week_start", "reviewed_week_end", "upcoming_week_start", "upcoming_week_end", "market_session_cutoff"]),
    weekly_cycle: pick(value.weekly_cycle, ["origin_run_id", "intermediate_index"]),
    reading_order: Array.isArray(value.reading_order) ? [...value.reading_order] : [],
    opening_thesis: pickMany(value.opening_thesis, ["title_fr", "body_fr", "epistemic_type"]), decision_panel: panel,
    six_judgments: pickMany(value.six_judgments, ["id", "title", "state", "display", "body", "en"]),
    horizons: pick(value.horizons, ["tactical", "medium", "structural"]),
    calendar: pickMany(value.calendar, ["at", "event", "expected", "watch"]),
    scenario_tree: { ...scenario, nodes: pickMany((value.scenario_tree as Record<string, unknown>)?.nodes, ["id", "parent_id", "title_fr", "condition_fr", "causal_path_fr", "observable_confirmation_fr", "time_window_fr", "opposing_evidence_fr", "invalidation_fr", "practical_interpretation_fr", "summary_en"]), edges: pickMany((value.scenario_tree as Record<string, unknown>)?.edges, ["id", "from_id", "to_id", "label", "status", "observable_condition_fr", "causal_explanation_fr"]) } as PublicGoldEditorialV6["scenario_tree"],
    family_readouts: pickMany(value.family_readouts, ["id", "title_fr", "local_interpretation_fr", "questions"]),
    chronology: pickMany(value.chronology, ["date_label_fr", "event_fr"]),
    exogenous_review: pickMany(value.exogenous_review, ["category", "status", "finding"]),
    glossary_fr: isObject(value.glossary_fr) ? { ...value.glossary_fr } : {},
  };
  projected.family_readouts = projected.family_readouts.map((family) => ({ ...pick(family, ["title_fr", "local_interpretation_fr"]), ...(["F1", "F2", "F3", "F4", "F5", "F6"].includes(String(family.id)) ? { id: family.id } : {}), questions: pickMany(family.questions, ["question_fr", "question_en", "status", "as_of", "answer_fr", "answer_en", "missing_observation", "refresh_status", "checked_at"]).map((question) => ({ ...question, missing_observation: pick(question.missing_observation, ["obstacle", "consequence_fr", "next_recovery_action_fr"]) })) }));
  if (value.weekly_bridge) projected.weekly_bridge = pick(value.weekly_bridge, ["prior_run_id", "prior_cutoff", "comparison_limit_fr", "changes", "surviving_conclusions", "resolved_expectations", "failed_expectations"]);
  if (value.evolution_review) projected.evolution_review = projectEvolution(value.evolution_review);
  if (isObject(value.learning_experience) && value.learning_experience.version === "1.0") projected.learning_experience = projectPublicLearning(value.learning_experience);
  return projected;
}
const isNonEmptyArray = (value: unknown): value is unknown[] => Array.isArray(value) && value.length > 0;
const objectArray = (value: unknown, label: string, errors: string[]): Record<string, unknown>[] => {
  if (!isNonEmptyArray(value) || !value.every(isObject)) { errors.push(`v6 ${label} must be a non-empty array of objects.`); return []; }
  return value;
};
const requireText = (value: unknown, label: string, errors: string[]): void => { if (!nonEmpty(value)) errors.push(`v6 ${label} must be non-empty text.`); };

/** Exact recursive serialization used by Brain's procedural-audit.mjs. */
export function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (isObject(value)) return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(",")}}`;
  return JSON.stringify(value);
}
export const canonicalSha256 = (value: unknown): string => createHash("sha256").update(canonicalJson(value)).digest("hex");

export function isGoldEditorialV6(value: unknown): value is GoldEditorialV6 {
  return isObject(value) && value.document_type === "GOLD_MARKET_STATE" && value.format_version === "6.0" && value.frontend_eligible === true;
}

/** A fail-closed admission gate for v6. The complete audit remains stored unchanged; this gate validates identity, lineage and the mandatory editorial surface before publication. */
export function validateGoldEditorialV6(value: unknown): string[] {
  if (!isGoldEditorialV6(value)) return ["Not a v6 GOLD_MARKET_STATE document."];
  const errors: string[] = [];
  if ("learning_experience" in value) {
    if (!isObject(value.learning_experience) || !nonEmpty(value.learning_experience.version)) errors.push("v6 learning_experience must have an explicit version.");

  }
  errors.push(...validateRichEditorial(value));
  for (const key of REQUIRED) if (!(key in value)) errors.push(`v6 missing ${key}.`);
  for (const key of Object.keys(value)) if (!ROOT_KEYS.has(key)) errors.push(`v6 has unknown root property ${key}.`);
  const meta = value.meta;
  if (!isObject(meta)) return [...errors, "v6 meta must be an object."];
  const metaKeys = ["run_id", "run_type", "data_mode", "status", "parent_run_id", "origin_sunday_run_id", "week_of", "generated_at", "evidence_cutoff_start", "evidence_cutoff_end"];
  for (const key of metaKeys) if (!(key in meta)) errors.push(`v6 meta missing ${key}.`);
  if (!nonEmpty(meta.run_id) || !["SUNDAY", "INTERMEDIATE"].includes(String(meta.run_type)) || !["REAL", "FIXTURE"].includes(String(meta.data_mode)) || !["COMPLETE", "PARTIAL"].includes(String(meta.status))) errors.push("v6 meta identity is invalid.");
  if (!validTime(meta.generated_at) || !validTime(meta.evidence_cutoff_start) || !validTime(meta.evidence_cutoff_end)) errors.push("v6 meta cutoff timestamps are invalid.");
  if (validTime(meta.evidence_cutoff_start) && validTime(meta.evidence_cutoff_end) && Date.parse(String(meta.evidence_cutoff_end)) < Date.parse(String(meta.evidence_cutoff_start))) errors.push("v6 evidence cutoff end precedes start.");
  if (meta.run_type === "SUNDAY" && (meta.parent_run_id !== null || meta.origin_sunday_run_id !== meta.run_id)) errors.push("v6 Sunday lineage is invalid.");
  if (meta.run_type === "INTERMEDIATE" && (!nonEmpty(meta.parent_run_id) || !nonEmpty(meta.origin_sunday_run_id) || !isObject(value.consumed_handoff))) errors.push("v6 intermediate requires parent lineage and consumed_handoff.");
  if (isObject(value.consumed_handoff) && (!nonEmpty(value.consumed_handoff.handoff_id) || !Number.isInteger(value.consumed_handoff.handoff_version) || !/^[a-f0-9]{64}$/i.test(String(value.consumed_handoff.content_sha256)))) errors.push("v6 consumed_handoff is invalid.");
  if (!Array.isArray(value.six_judgments) || value.six_judgments.length !== 6) errors.push("v6 requires six judgments.");
  else {
    const judgments = objectArray(value.six_judgments, "six_judgments", errors);
    const expected = ["macro_direction", "directional_asymmetry", "positioning_asymmetry", "evidence_quality", "analysis_scope", "fundamental_conclusion"];
    const ids = judgments.map((item) => item.id);
    if (new Set(ids).size !== expected.length || expected.some((id) => !ids.includes(id))) errors.push("v6 six_judgments identities are invalid.");
    for (const judgment of judgments) { requireText(judgment.title, "judgment title", errors); requireText(judgment.display, "judgment display", errors); requireText(judgment.body, "judgment body", errors); }
  }
  const opening = objectArray(value.opening_thesis, "opening_thesis", errors);
  for (const item of opening) { requireText(item.title_fr, "opening thesis title", errors); requireText(item.body_fr, "opening thesis body", errors); }
  if (!isObject(value.decision_panel)) errors.push("v6 decision_panel must be an object.");
  else { requireText(value.decision_panel.title_fr, "decision panel title", errors); if (!isNonEmptyArray(value.decision_panel.instruments)) errors.push("v6 decision_panel instruments must be non-empty."); }
  if (!isObject(value.scenario_tree) || !isNonEmptyArray(value.scenario_tree.nodes) || !isNonEmptyArray(value.scenario_tree.edges)) errors.push("v6 scenario_tree requires non-empty nodes and edges.");
  else {
    const nodes = objectArray(value.scenario_tree.nodes, "scenario_tree nodes", errors);
    const nodeIds = new Set(nodes.map((node) => node.id));
    if (!nonEmpty(value.scenario_tree.root_id) || !nodeIds.has(value.scenario_tree.root_id)) errors.push("v6 scenario_tree root is invalid.");
    for (const node of nodes) { requireText(node.id, "scenario node id", errors); requireText(node.title_fr, "scenario node title", errors); }
    for (const edge of objectArray(value.scenario_tree.edges, "scenario_tree edges", errors)) if (!nodeIds.has(edge.from_id) || !nodeIds.has(edge.to_id)) errors.push("v6 scenario_tree edge has an unknown endpoint.");
  }
  for (const [key, array] of Object.entries({ horizons: value.horizons, calendar: value.calendar, family_readouts: value.family_readouts, chronology: value.chronology, exogenous_review: value.exogenous_review, sources: value.sources })) {
    if (key === "horizons") { if (!isObject(array) || Object.keys(array).length === 0) errors.push("v6 horizons must be populated."); }
    else objectArray(array, key, errors);
  }
  if (!isObject(value.research_audit) || !isNonEmptyArray(value.research_audit.request_log)) errors.push("v6 research_audit request_log must be populated.");
  if (!isObject(value.procedural_audit) || !isObject(value.procedural_audit.phases) || !isNonEmptyArray(value.procedural_audit.question_coverage)) errors.push("v6 procedural_audit must be populated.");
  if (!isObject(value.content_preview) || !nonEmpty(value.content_preview.markdown) || !/^[a-f0-9]{64}$/i.test(String(value.content_preview.sha256))) errors.push("v6 content_preview is invalid.");
  return errors;
}

/** Parent-dependent checks run only after canonical admission and exact parent lookup. */
export function validateGoldEditorialV6Parent(child: GoldEditorialV6, parent: GoldEditorialV6): string[] {
  const learning = isObject(child.learning_experience) && child.learning_experience.version !== "1.0";
  const { learning_experience: omitted, ...canonical } = child;
  return editorialProblems(learning ? canonical : child, parent).filter((problem: string) => !learning || problem !== "Markdown/JSON exact parity");
}
