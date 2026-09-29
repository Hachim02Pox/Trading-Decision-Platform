import type { FinalRead } from "../sundayRead/schema";
import { isGoldEditorialV6, type GoldEditorialV6 } from "./v6";

export const V3_PRESENTATION_SECTIONS = ["market_story", "horizons", "priced_in", "asymmetry", "direction_state", "scenario_tree_v3", "walkthrough", "opportunity_quality", "execution_readiness"] as const;
export const V4_PRESENTATION_SECTIONS = [...V3_PRESENTATION_SECTIONS, "market_story.chronology", "market_story.causal_assessment", "verdict_explanations", "conditional_verdicts", "annotations", "priced_in.already_priced_analysis"] as const;
const V4_VERDICTS = ["macro_direction", "directional_asymmetry", "positioning_asymmetry", "edge", "opportunity_quality", "execution_readiness"] as const;
const V4_VERDICT_FIELDS = ["verdict", "observations", "mechanism", "supporting_evidence", "contrary_evidence", "unknowns", "practical_meaning", "would_change", "insufficient_alone"] as const;
const V4_PRICED_IN_FIELDS = ["prior_expectation", "observed_outcome", "verified_reaction", "now_priced", "still_repriceable", "evidence_used", "unknowns_or_limits", "as_of"] as const;

export type PresentationRead = FinalRead | GoldEditorialV6;
const object = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);
const nonEmptyText = (value: unknown): boolean => typeof value === "string" && value.trim().length > 0;

function v6PresentationCompleteness(read: GoldEditorialV6): { presentation_complete: boolean; missing_presentation_sections: string[] } {
  const missing: string[] = [];
  const requireArray = (key: string, value: unknown) => { if (!Array.isArray(value) || value.length === 0) missing.push(key); };
  requireArray("opening_thesis", read.opening_thesis);
  if (!object(read.decision_panel) || !nonEmptyText(read.decision_panel.title_fr) || !Array.isArray(read.decision_panel.instruments) || read.decision_panel.instruments.length < 2) missing.push("decision_panel");
  requireArray("six_judgments", read.six_judgments);
  if (!Array.isArray(read.six_judgments) || read.six_judgments.some((judgment) => !object(judgment) || !nonEmptyText(judgment.id) || !nonEmptyText(judgment.title) || !nonEmptyText(judgment.display) || !nonEmptyText(judgment.body))) missing.push("six_judgments.detail");
  if (!object(read.horizons) || !nonEmptyText(read.horizons.tactical) || !nonEmptyText(read.horizons.medium) || !nonEmptyText(read.horizons.structural)) missing.push("horizons");
  requireArray("calendar", read.calendar); requireArray("scenario_tree.nodes", read.scenario_tree && (read.scenario_tree as Record<string, unknown>).nodes); requireArray("family_readouts", read.family_readouts); requireArray("chronology", read.chronology); requireArray("exogenous_review", read.exogenous_review);
  if (!object(read.glossary_fr) || Object.keys(read.glossary_fr).length === 0) missing.push("glossary_fr");
  if (read.meta.run_type === "SUNDAY" && !object(read.weekly_bridge)) missing.push("weekly_bridge");
  if (read.meta.run_type === "INTERMEDIATE" && !object(read.evolution_review)) missing.push("evolution_review");
  return { presentation_complete: missing.length === 0, missing_presentation_sections: [...new Set(missing)] };
}

export function presentationCompleteness(read: PresentationRead): { presentation_complete: boolean; missing_presentation_sections: string[] } {
  if (isGoldEditorialV6(read)) return v6PresentationCompleteness(read);
  if (read.presentation?.version !== 3 && read.presentation?.version !== 4) return { presentation_complete: false, missing_presentation_sections: ["presentation"] };
  const sections = read.presentation.version === 4 ? V4_PRESENTATION_SECTIONS : V3_PRESENTATION_SECTIONS;
  const missing = sections.flatMap((section) => (["fr", "en"] as const).filter((locale) => !section.split(".").reduce<unknown>((value, key) => value && typeof value === "object" ? (value as Record<string, unknown>)[key] : undefined, read.presentation?.[locale])).map((locale) => `${locale}.${section}`));
  if (read.presentation.version === 4) for (const locale of ["fr", "en"] as const) {
    const presentation = read.presentation[locale] as Record<string, any> | undefined;
    for (const verdict of V4_VERDICTS) for (const field of V4_VERDICT_FIELDS) if (presentation?.verdict_explanations?.[verdict]?.[field] === undefined) missing.push(`${locale}.verdict_explanations.${verdict}.${field}`);
    for (const item of presentation?.priced_in?.already_priced_analysis ?? []) for (const field of V4_PRICED_IN_FIELDS) if (item?.[field] === undefined) missing.push(`${locale}.priced_in.already_priced_analysis.${field}`);
  }
  return { presentation_complete: missing.length === 0, missing_presentation_sections: [...new Set(missing)] };
}
