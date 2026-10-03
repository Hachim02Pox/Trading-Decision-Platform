import Ajv2020 from "ajv/dist/2020";
import addFormats from "ajv-formats";
import schema from "./brain/gold_editorial.schema.json";
import learningSchema from "./brain/gold_learning_experience.schema.json";
import { learningProblems } from "./brain/learning-experience";
import {
  renderEditorialMarkdown,
  sha256,
  editorialProblems,
} from "./brain/editorial";
import type { PublicGoldLearningExperience } from "@gold-terminal/contracts";
const ajv = new Ajv2020({
  allErrors: true,
  strict: true,
  allowUnionTypes: true,
});
addFormats(ajv);
const validateEditorial = ajv.compile(schema);
const validateLearning = ajv.compile(learningSchema);
export function validateLearningDocument(value: Record<string, any>): string[] {
  if (!validateLearning(value.learning_experience))
    return (validateLearning.errors ?? []).map(
      (e) => `learning schema ${e.instancePath} ${e.message}`,
    );
  return learningProblems(value);
}
export function validateRichEditorial(value: Record<string, any>): string[] {
  const unsupported =
    value.learning_experience && value.learning_experience.version !== "1.0";
  // An unknown extension is stored intact but cannot participate in decoding.
  const { learning_experience: omitted, ...canonical } = value;
  const document = unsupported ? canonical : value;
  if (!validateEditorial(document))
    return (validateEditorial.errors ?? []).map(
      (e) => `v6 schema ${e.instancePath} ${e.message}`,
    );
  const problems = editorialProblems(document, undefined).filter(
    (problem: string) =>
      problem !== "REAL intermediate requires supplied parent" &&
      (!unsupported || problem !== "Markdown/JSON exact parity"),
  );
  const markdown = renderEditorialMarkdown(document);
  const preview = value.content_preview as { markdown: string; sha256: string };
  // Unknown renderers cannot be reconstructed, but their stored UTF-8 report
  // must still match its declared digest before canonical fallback is admitted.
  if (preview.sha256 !== sha256(preview.markdown))
    problems.push("v6 Markdown SHA-256 mismatch");
  if (
    !unsupported &&
    (preview.markdown !== markdown || preview.sha256 !== sha256(markdown))
  )
    problems.push("v6 Markdown/JSON exact parity");
  return problems;
}
export function projectPublicLearning(
  value: any,
): PublicGoldLearningExperience {
  return {
    version: value.version,
    context: {
      mode: value.context.mode,
      inherited_run_id: value.context.inherited_run_id,
      scope_fr: value.context.scope_fr,
      limitation_fr: value.context.limitation_fr,
    },
    headline: {
      title_fr: value.headline.title_fr,
      summary_fr: value.headline.summary_fr,
      next_question_fr: value.headline.next_question_fr,
    },
    facts: value.facts.map((item: any) => ({
      id: item.id,
      family_id: item.family_id,
      title_fr: item.title_fr,
      observation_fr: item.observation_fr,
      limits_fr: item.limits_fr,
      measurement_as_of: item.measurement_as_of,
      measurement_precision: item.measurement_precision,
      measurement_window_fr: item.measurement_window_fr,
      checked_at: item.checked_at,
      status: item.status,
    })),
    mechanisms: value.mechanisms.map((item: any) => ({
      id: item.id,
      title_fr: item.title_fr,
      summary_fr: item.summary_fr,
      first_principle_fr: item.first_principle_fr,
      actor_fr: item.actor_fr,
      incentive_fr: item.incentive_fr,
      transmission_fr: item.transmission_fr,
      current_application_fr: item.current_application_fr,
      alternative_fr: item.alternative_fr,
      confirmation_fr: item.confirmation_fr,
      invalidation_fr: item.invalidation_fr,
      horizon_fr: item.horizon_fr,
      limits_fr: item.limits_fr,
      fact_refs: item.fact_refs.map((item: any) => item),
      concept_refs: item.concept_refs.map((item: any) => item),
      examples: item.examples.map((item: any) => ({
        kind: item.kind,
        text_fr: item.text_fr,
      })),
    })),
    causal_links: value.causal_links.map((item: any) => ({
      id: item.id,
      from_id: item.from_id,
      to_id: item.to_id,
      relation: item.relation,
      explanation_fr: item.explanation_fr,
      dependency_group: item.dependency_group,
      fact_refs: item.fact_refs.map((item: any) => item),
    })),
    synthesis: {
      pieces: value.synthesis.pieces.map((item: any) => ({
        family_id: item.family_id,
        title_fr: item.title_fr,
        summary_fr: item.summary_fr,
        role_fr: item.role_fr,
        fact_refs: item.fact_refs.map((item: any) => item),
        mechanism_refs: item.mechanism_refs.map((item: any) => item),
        coverage: item.coverage,
      })),
      connections: value.synthesis.connections.map((item: any) => ({
        from_family_id: item.from_family_id,
        to_family_id: item.to_family_id,
        why_fr: item.why_fr,
        limit_fr: item.limit_fr,
        mechanism_refs: item.mechanism_refs.map((item: any) => item),
      })),
      joint_reading_fr: value.synthesis.joint_reading_fr,
      dominant_driver_fr: value.synthesis.dominant_driver_fr,
      counter_case_fr: value.synthesis.counter_case_fr,
      why_preferred_or_mixed_fr: value.synthesis.why_preferred_or_mixed_fr,
      priced_in_fr: value.synthesis.priced_in_fr,
      conditional_outlook_fr: value.synthesis.conditional_outlook_fr,
      unresolved_fr: value.synthesis.unresolved_fr,
      next_checks_fr: value.synthesis.next_checks_fr,
      mechanism_refs: value.synthesis.mechanism_refs.map((item: any) => item),
    },
    changes: {
      baseline_run_id: value.changes.baseline_run_id,
      summary_fr: value.changes.summary_fr,
      comparison_limit_fr: value.changes.comparison_limit_fr,
      items: value.changes.items.map((item: any) => ({
        title_fr: item.title_fr,
        before_fr: item.before_fr,
        after_fr: item.after_fr,
        why_fr: item.why_fr,
        consequence_fr: item.consequence_fr,
        fact_refs: item.fact_refs.map((item: any) => item),
        mechanism_refs: item.mechanism_refs.map((item: any) => item),
      })),
    },
    scenario_explanations: value.scenario_explanations.map((item: any) => ({
      node_id: item.node_id,
      title_fr: item.title_fr,
      summary_fr: item.summary_fr,
      first_principle_fr: item.first_principle_fr,
      actor_fr: item.actor_fr,
      why_now_fr: item.why_now_fr,
      limits_fr: item.limits_fr,
      fact_refs: item.fact_refs.map((item: any) => item),
      mechanism_refs: item.mechanism_refs.map((item: any) => item),
    })),
    concepts: value.concepts.map((item: any) => ({
      id: item.id,
      term_fr: item.term_fr,
      definition_fr: item.definition_fr,
      why_it_matters_fr: item.why_it_matters_fr,
      current_application_fr: item.current_application_fr,
      example_fr: item.example_fr,
      misconception_fr: item.misconception_fr,
      limits_fr: item.limits_fr,
      example_kind: item.example_kind,
      fact_refs: item.fact_refs.map((item: any) => item),
    })),
    lessons: value.lessons.map((item: any) => ({
      id: item.id,
      question_fr: item.question_fr,
      answer_fr: item.answer_fr,
      reasoning_fr: item.reasoning_fr,
      limit_fr: item.limit_fr,
      concept_refs: item.concept_refs.map((item: any) => item),
      fact_refs: item.fact_refs.map((item: any) => item),
    })),
  };
}
