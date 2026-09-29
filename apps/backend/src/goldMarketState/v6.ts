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

const REQUIRED = ["document_type", "format_version", "frontend_eligible", "meta", "title_fr", "time_scope", "weekly_cycle", "reading_order", "opening_thesis", "decision_panel", "six_judgments", "horizons", "calendar", "scenario_tree", "family_readouts", "chronology", "exogenous_review", "datasets", "glossary_fr", "sources", "research_audit", "procedural_audit", "content_preview"];
const ROOT_KEYS = new Set([...REQUIRED, "weekly_bridge", "evolution_review", "consumed_handoff", "fixture_notice"]);
const isObject = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);
const nonEmpty = (value: unknown): value is string => typeof value === "string" && value.trim().length > 0;
const validTime = (value: unknown): boolean => nonEmpty(value) && !Number.isNaN(Date.parse(value));

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
  if (!isObject(value.scenario_tree) || !Array.isArray(value.scenario_tree.nodes) || !Array.isArray(value.scenario_tree.edges)) errors.push("v6 scenario_tree is invalid.");
  return errors;
}
