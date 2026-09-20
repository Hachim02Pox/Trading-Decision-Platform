export const V3_PRESENTATION_SECTIONS = ["market_story", "horizons", "priced_in", "asymmetry", "direction_state", "scenario_tree_v3", "walkthrough", "opportunity_quality", "execution_readiness"] as const;

export type PresentationRenderPlan = {
  kind: "v3" | "legacy";
  presentation: Record<string, unknown> | undefined;
  complete: boolean;
  missingSections: readonly string[];
};

/** Keeps legacy adaptation structurally separate from V3's final-copy contract. */
export function getPresentationRenderPlan(read: { presentation?: { version?: number; fr?: Record<string, unknown>; en?: Record<string, unknown> } }, locale: "fr" | "en"): PresentationRenderPlan {
  const presentation = read.presentation;
  if (presentation?.version !== 3) {
    return { kind: "legacy", presentation: presentation?.version === 2 ? presentation[locale] : undefined, complete: true, missingSections: [] };
  }
  const localized = presentation[locale];
  const missingSections = V3_PRESENTATION_SECTIONS.filter((section) => !localized?.[section]);
  return { kind: "v3", presentation: localized, complete: missingSections.length === 0, missingSections };
}
