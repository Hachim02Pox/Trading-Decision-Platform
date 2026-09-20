import type { FinalRead } from "../sundayRead/schema";

export const V3_PRESENTATION_SECTIONS = ["market_story", "horizons", "priced_in", "asymmetry", "direction_state", "scenario_tree_v3", "walkthrough", "opportunity_quality", "execution_readiness"] as const;

export function presentationCompleteness(read: FinalRead): { presentation_complete: boolean; missing_presentation_sections: string[] } {
  if (read.presentation?.version !== 3) return { presentation_complete: true, missing_presentation_sections: [] };
  const missing = V3_PRESENTATION_SECTIONS.flatMap((section) => (["fr", "en"] as const).filter((locale) => !(read.presentation?.[locale] as Record<string, unknown> | undefined)?.[section]).map((locale) => `${locale}.${section}`));
  return { presentation_complete: missing.length === 0, missing_presentation_sections: missing };
}
