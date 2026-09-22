import type { FinalRead } from "../sundayRead/schema";

export const V3_PRESENTATION_SECTIONS = ["market_story", "horizons", "priced_in", "asymmetry", "direction_state", "scenario_tree_v3", "walkthrough", "opportunity_quality", "execution_readiness"] as const;
export const V4_PRESENTATION_SECTIONS = [...V3_PRESENTATION_SECTIONS, "market_story.chronology", "market_story.causal_assessment", "verdict_explanations"] as const;

export function presentationCompleteness(read: FinalRead): { presentation_complete: boolean; missing_presentation_sections: string[] } {
  if (read.presentation?.version !== 3 && read.presentation?.version !== 4) return { presentation_complete: true, missing_presentation_sections: [] };
  const sections = read.presentation.version === 4 ? V4_PRESENTATION_SECTIONS : V3_PRESENTATION_SECTIONS;
  const missing = sections.flatMap((section) => (["fr", "en"] as const).filter((locale) => !section.split(".").reduce<unknown>((value, key) => value && typeof value === "object" ? (value as Record<string, unknown>)[key] : undefined, read.presentation?.[locale])).map((locale) => `${locale}.${section}`));
  return { presentation_complete: missing.length === 0, missing_presentation_sections: missing };
}
