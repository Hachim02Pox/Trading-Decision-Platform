import type { FinalRead } from "../sundayRead/schema";

export const V3_PRESENTATION_SECTIONS = ["market_story", "horizons", "priced_in", "asymmetry", "direction_state", "scenario_tree_v3", "walkthrough", "opportunity_quality", "execution_readiness"] as const;
export const V4_PRESENTATION_SECTIONS = [...V3_PRESENTATION_SECTIONS, "market_story.chronology", "market_story.causal_assessment", "verdict_explanations", "conditional_verdicts", "annotations", "priced_in.already_priced_analysis"] as const;
const V4_VERDICTS = ["macro_direction", "directional_asymmetry", "positioning_asymmetry", "edge", "opportunity_quality", "execution_readiness"] as const;
const V4_VERDICT_FIELDS = ["verdict", "observations", "mechanism", "supporting_evidence", "contrary_evidence", "unknowns", "practical_meaning", "would_change", "insufficient_alone"] as const;
const V4_PRICED_IN_FIELDS = ["prior_expectation", "observed_outcome", "verified_reaction", "now_priced", "still_repriceable", "evidence_used", "unknowns_or_limits", "as_of"] as const;

export function presentationCompleteness(read: FinalRead): { presentation_complete: boolean; missing_presentation_sections: string[] } {
  if (read.presentation?.version !== 3 && read.presentation?.version !== 4) return { presentation_complete: true, missing_presentation_sections: [] };
  const sections = read.presentation.version === 4 ? V4_PRESENTATION_SECTIONS : V3_PRESENTATION_SECTIONS;
  const missing = sections.flatMap((section) => (["fr", "en"] as const).filter((locale) => !section.split(".").reduce<unknown>((value, key) => value && typeof value === "object" ? (value as Record<string, unknown>)[key] : undefined, read.presentation?.[locale])).map((locale) => `${locale}.${section}`));
  if (read.presentation.version === 4) for (const locale of ["fr", "en"] as const) {
    const presentation = read.presentation[locale] as Record<string, any> | undefined;
    for (const verdict of V4_VERDICTS) for (const field of V4_VERDICT_FIELDS) if (presentation?.verdict_explanations?.[verdict]?.[field] === undefined) missing.push(`${locale}.verdict_explanations.${verdict}.${field}`);
    for (const item of presentation?.priced_in?.already_priced_analysis ?? []) for (const field of V4_PRICED_IN_FIELDS) if (item?.[field] === undefined) missing.push(`${locale}.priced_in.already_priced_analysis.${field}`);
  }
  return { presentation_complete: missing.length === 0, missing_presentation_sections: [...new Set(missing)] };
}
