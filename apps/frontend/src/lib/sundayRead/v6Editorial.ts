/**
 * Public v6 reader contract.  This is deliberately a whitelist: audit data
 * remains in the stored state but cannot accidentally enter the reader.
 */
export type V6EditorialState = {
  document_type: "GOLD_MARKET_STATE";
  format_version: "6.0";
  frontend_eligible: true;
  title_fr: string;
  meta: { run_type: "SUNDAY" | "INTERMEDIATE"; evidence_cutoff_end?: string };
  opening_thesis: Array<{ title_fr: string; body_fr: string }>;
  decision_panel: { title_fr: string; horizon: string; recheck_fr: string; scheduled_expiry?: string; earlier_expiry?: string; limit_fr?: string; instruments: Array<{ instrument: string; eligible_direction: string; answer_fr: string; mechanism_fr: string; strongest_contradiction_fr: string; flip_fr: string }> };
  six_judgments: Array<{ id: string; title: string; display: string; body: string }>;
  horizons: Record<string, string>;
  calendar: Array<{ at: string; event: string; expected?: string; watch: string }>;
  scenario_tree: { nodes: Array<{ id: string; parent_id: string | null; title_fr: string; condition_fr: string; causal_path_fr: string; observable_confirmation_fr: string; time_window_fr: string; opposing_evidence_fr: string; invalidation_fr: string; practical_interpretation_fr: string }>; edges: Array<{ from_id: string; to_id: string; observable_condition_fr: string; causal_explanation_fr: string }> };
  family_readouts: Array<{ id: string; title_fr: string; local_interpretation_fr: string; questions: Array<{ id: string; question_fr: string; status: string; as_of: string; answer_fr: string; refresh_status?: string; checked_at?: string }> }>;
  chronology: Array<{ date_label_fr: string; event_fr: string }>;
  exogenous_review: Array<{ category: string; status: string; finding: string }>;
  evolution_review?: { summary_fr: string; still_true: NarrativeCard[]; new_observations: NarrativeCard[]; strengthened: NarrativeCard[]; weakened: NarrativeCard[]; invalidated: NarrativeCard[]; exogenous_factors: NarrativeCard[]; unresolved: NarrativeCard[]; next_checks: NarrativeCard[]; judgment_changes: Array<{ judgment_id: string; previous_state: string; current_state: string; reason_fr: string; consequence_fr: string }>; scenario_transitions: Array<{ scenario_id: string; status: string; explanation_fr: string }> };
};

export type NarrativeCard = { title_fr: string; body_fr: string };

export function isV6EditorialState(value: unknown): value is V6EditorialState {
  const state = value as Partial<V6EditorialState> | null;
  return state?.document_type === "GOLD_MARKET_STATE" && state.format_version === "6.0" && state.frontend_eligible === true && Array.isArray(state.opening_thesis) && Array.isArray(state.six_judgments);
}

export const v6JudgmentOrder = ["macro_direction", "directional_asymmetry", "positioning_asymmetry", "evidence_quality", "analysis_scope", "fundamental_conclusion"] as const;
