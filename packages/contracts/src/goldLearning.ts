// Public allowlist contract derived from Brain da8eb64959b6c026128bde254c8d1703e419f19c. Audit references are intentionally absent.
export type PublicGoldLearningExperience = {
  version: "1.0";
  context: {
    mode: "FULL_RECAP" | "MANUAL_DELTA";
    inherited_run_id: string | null;
    scope_fr: string;
    limitation_fr: string;
  };
  headline: { title_fr: string; summary_fr: string; next_question_fr: string };
  facts: Array<{
    id: string;
    family_id: "F1" | "F2" | "F3" | "F4" | "F5" | "F6";
    title_fr: string;
    observation_fr: string;
    limits_fr: string;
    measurement_as_of: string | string | null;
    measurement_precision: "INTRADAY" | "DAILY" | "PERIOD" | "UNAVAILABLE";
    measurement_window_fr: string;
    checked_at: string;
    status: "OBSERVED" | "UNVERIFIED" | "NOT_APPLICABLE";
  }>;
  mechanisms: Array<{
    id: string;
    title_fr: string;
    summary_fr: string;
    first_principle_fr: string;
    actor_fr: string;
    incentive_fr: string;
    transmission_fr: string;
    current_application_fr: string;
    alternative_fr: string;
    confirmation_fr: string;
    invalidation_fr: string;
    horizon_fr: string;
    limits_fr: string;
    fact_refs: Array<string>;
    concept_refs: Array<string>;
    examples: Array<{ kind: "ILLUSTRATIVE" | "OBSERVED"; text_fr: string }>;
  }>;
  causal_links: Array<{
    id: string;
    from_id: string;
    to_id: string;
    relation: "SUPPORTS" | "OPPOSES" | "CONDITIONAL" | "SHARED_DRIVER";
    explanation_fr: string;
    dependency_group: string;
    fact_refs: Array<string>;
  }>;
  synthesis: {
    pieces: Array<{
      family_id: "F1" | "F2" | "F3" | "F4" | "F5" | "F6";
      title_fr: string;
      summary_fr: string;
      role_fr: string;
      fact_refs: Array<string>;
      mechanism_refs: Array<string>;
      coverage: "REVIEWED" | "PARTIALLY_REVIEWED" | "INHERITED_NOT_RECHECKED";
    }>;
    connections: Array<{
      from_family_id: "F1" | "F2" | "F3" | "F4" | "F5" | "F6";
      to_family_id: "F1" | "F2" | "F3" | "F4" | "F5" | "F6";
      why_fr: string;
      limit_fr: string;
      mechanism_refs: Array<string>;
    }>;
    joint_reading_fr: string;
    dominant_driver_fr: string;
    counter_case_fr: string;
    why_preferred_or_mixed_fr: string;
    priced_in_fr: string;
    conditional_outlook_fr: string;
    unresolved_fr: string;
    next_checks_fr: string;
    mechanism_refs: Array<string>;
  };
  changes: {
    baseline_run_id: string | null;
    summary_fr: string;
    comparison_limit_fr: string;
    items: Array<{
      title_fr: string;
      before_fr: string;
      after_fr: string;
      why_fr: string;
      consequence_fr: string;
      fact_refs: Array<string>;
      mechanism_refs: Array<string>;
    }>;
  };
  scenario_explanations: Array<{
    node_id: string;
    title_fr: string;
    summary_fr: string;
    first_principle_fr: string;
    actor_fr: string;
    why_now_fr: string;
    limits_fr: string;
    fact_refs: Array<string>;
    mechanism_refs: Array<string>;
  }>;
  concepts: Array<{
    id: string;
    term_fr: string;
    definition_fr: string;
    why_it_matters_fr: string;
    current_application_fr: string;
    example_fr: string;
    misconception_fr: string;
    limits_fr: string;
    example_kind: "ILLUSTRATIVE" | "OBSERVED";
    fact_refs: Array<string>;
  }>;
  lessons: Array<{
    id: string;
    question_fr: string;
    answer_fr: string;
    reasoning_fr: string;
    limit_fr: string;
    concept_refs: Array<string>;
    fact_refs: Array<string>;
  }>;
};
export type GoldLearningExperienceStatus =
  "AVAILABLE" | "ABSENT" | "UNSUPPORTED_VERSION";
