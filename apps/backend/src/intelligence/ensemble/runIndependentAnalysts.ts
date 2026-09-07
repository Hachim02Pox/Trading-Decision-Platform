import type { AnalysisPolicy, AnalystConclusion, DisplayRelationship, Language } from "@gold-terminal/contracts";
import type { ScenarioContent } from "../mockScenarios";
import { ANALYSIS_POLICIES } from "./policies";

// Milestone 1D — independent analyst stage. Each role's conclusion is
// derived ONLY from the shared context package + scenario content passed
// in here — never from another role's output. This is deliberately
// structured as N separate pure calls (not "generate A, feed A into B")
// even though today's mock generation is synchronous/deterministic, so
// swapping in real, genuinely-parallel model calls later requires no
// restructuring of this pipeline.

export interface AnalystInputs {
  policy: AnalysisPolicy;
  /** The base (pre-ensemble) lean for CONTEXTUAL_AI KPIs, or the mapped mechanical read for MECHANICAL_RULE KPIs. */
  baseFinalGoldRead: DisplayRelationship;
  scenario: ScenarioContent;
  evidenceIsLimited: boolean;
  /**
   * Which language `scenario` (and therefore the generic hedge prefixes
   * below) is authored in. French-translation-completeness fix: this used
   * to be omitted, and the hedge prefixes were English literals regardless
   * of the requested language — they now match `scenario`'s language
   * exactly so a French primary read never gets an English prefix spliced
   * into a generically-synthesized analyst's text.
   */
  language: Language;
  /** Hand-authored, illustrative-KPI-only override (role order A/B/C). When present and long enough for the policy, used verbatim (identity bound here). */
  explicit?: Array<Omit<AnalystConclusion, "modelIdentity">>;
}

const ROLE_ORDER: readonly ("A" | "B" | "C")[] = ["A", "B", "C"];

// Distinct prefixes per hedging role index so a second and third generic
// analyst never render identical text even when they draw on the same
// underlying uncertainty note — each still independently re-derives its
// conclusion from a different facet of the same shared evidence bundle,
// never from another role's output. Authored per-language (not machine
// translated) — see AnalystInputs.language.
const HEDGE_PREFIX_BY_INDEX: Record<Language, readonly string[]> = {
  EN: ["", "A second independent read: ", "A third independent take: "],
  FR: ["", "Une deuxième lecture indépendante : ", "Un troisième avis indépendant : "],
};

// Mock pipeline never performs a real web search — always disclosed as such
// rather than left blank, so a viewer can't mistake generic/mock content for
// a genuinely verified read (see AnalystConclusion.dataVerification).
const MOCK_DATA_VERIFICATION_DISCLOSURE: Record<Language, string> = {
  EN: "Mock/development content — no live web verification was performed.",
  FR: "Contenu mock/développement — aucune vérification web réelle n'a été effectuée.",
};

function buildHedgedConclusion(
  scenario: ScenarioContent,
  roleIndex: number,
  language: Language
): { shortConclusion: string; keyPoints: string[] } {
  // Every analyst after the first independently re-derives a conclusion
  // from a different facet of the same shared evidence bundle (whyNow +
  // a rotating uncertainty note, so a 3rd analyst doesn't just repeat the
  // 2nd's exact sentence) rather than restating role A verbatim — a
  // deterministic but genuinely distinct synthesis path.
  const uncertaintyIndex = (roleIndex - 1) % Math.max(scenario.uncertaintyOrUnknowns.length, 1);
  const uncertainty = scenario.uncertaintyOrUnknowns[uncertaintyIndex];
  const prefixes = HEDGE_PREFIX_BY_INDEX[language];
  const prefix = prefixes[Math.min(roleIndex, prefixes.length - 1)];
  return {
    shortConclusion: uncertainty ? `${prefix}${scenario.whyNow} ${uncertainty}` : `${prefix}${scenario.whyNow}`,
    keyPoints: [scenario.whyNow, ...(uncertainty ? [uncertainty] : [])],
  };
}

function synthesizeGenericConclusion(
  role: "A" | "B" | "C",
  roleIndex: number,
  inputs: AnalystInputs
): Omit<AnalystConclusion, "modelIdentity"> {
  if (roleIndex === 0) {
    return {
      role,
      finalGoldRead: inputs.baseFinalGoldRead,
      shortConclusion: inputs.scenario.currentReadShort,
      keyPoints: inputs.scenario.causalChain.slice(0, 2).map((c) => c.statement),
      dataVerification: MOCK_DATA_VERIFICATION_DISCLOSURE[inputs.language],
    };
  }

  // Subsequent analysts hedge toward CONTEXTUAL when the shared evidence is
  // LIMITED — a deterministic, evidence-driven source of genuine
  // disagreement, not a random coin flip. This is what lets the
  // adjudicator's disagreement-preservation rule actually trigger for
  // realistic (thin-evidence) KPIs instead of always rubber-stamping a
  // single-model lean.
  const { shortConclusion, keyPoints } = buildHedgedConclusion(inputs.scenario, roleIndex, inputs.language);
  return {
    role,
    finalGoldRead: inputs.evidenceIsLimited ? "CONTEXTUAL" : inputs.baseFinalGoldRead,
    shortConclusion,
    keyPoints,
    dataVerification: MOCK_DATA_VERIFICATION_DISCLOSURE[inputs.language],
  };
}

export function runIndependentAnalysts(inputs: AnalystInputs): AnalystConclusion[] {
  const config = ANALYSIS_POLICIES[inputs.policy];
  const roleCount = config.analysts.length;
  const roles = ROLE_ORDER.slice(0, roleCount);
  const explicit = inputs.explicit ?? [];

  // Milestone 1D fix: an illustrative KPI's hand-authored `explicit` list
  // may be authored for a smaller policy than the one actually assigned
  // (e.g. 2 hand-authored roles for a KPI later promoted to HIGH_SCRUTINY's
  // 3-analyst policy). Use the hand-authored content per role wherever it
  // exists, and only synthesize generically for the remaining role(s) —
  // never discard hand-authored content just because the count falls short,
  // and never let two generic roles collapse onto identical text.
  const drafts: Array<Omit<AnalystConclusion, "modelIdentity">> = roles.map((role, index) =>
    explicit[index] ?? synthesizeGenericConclusion(role, index, inputs)
  );

  return drafts.map((draft, index) => ({
    ...draft,
    modelIdentity: config.analysts[index],
  }));
}
