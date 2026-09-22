export const V3_PRESENTATION_SECTIONS = ["market_story", "horizons", "priced_in", "asymmetry", "direction_state", "scenario_tree_v3", "walkthrough", "opportunity_quality", "execution_readiness"] as const;
export const V4_PRESENTATION_SECTIONS = [...V3_PRESENTATION_SECTIONS, "market_story.chronology", "market_story.causal_assessment", "verdict_explanations"] as const;

export type PresentationRenderPlan = {
  kind: "v4" | "v3" | "legacy";
  presentation: Record<string, unknown> | undefined;
  complete: boolean;
  missingSections: readonly string[];
};

/** Keeps legacy adaptation structurally separate from V3's final-copy contract. */
export function getPresentationRenderPlan(read: { presentation?: { version?: number; fr?: Record<string, unknown>; en?: Record<string, unknown> } }, locale: "fr" | "en"): PresentationRenderPlan {
  const presentation = read.presentation;
  if (presentation?.version !== 3 && presentation?.version !== 4) {
    return { kind: "legacy", presentation: presentation?.version === 2 ? presentation[locale] : undefined, complete: true, missingSections: [] };
  }
  const localized = presentation[locale];
  const sections = presentation.version === 4 ? V4_PRESENTATION_SECTIONS : V3_PRESENTATION_SECTIONS;
  const missingSections = sections.filter((section) => !section.split(".").reduce<unknown>((value, key) => value && typeof value === "object" ? (value as Record<string, unknown>)[key] : undefined, localized));
  return { kind: presentation.version === 4 ? "v4" : "v3", presentation: localized, complete: missingSections.length === 0, missingSections };
}
