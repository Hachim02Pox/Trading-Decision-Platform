import type {
  AnalysisPolicy,
  AnalystConclusion,
  ChallengeFinding,
  DisplayRelationship,
  EvidenceState,
  InterpretationAuditTrail,
  Language,
  ModelAgreement,
} from "@gold-terminal/contracts";

// Milestone 1D — adjudicator stage. Given the context package, evidence,
// analyst conclusions, and challenge findings (if any), produces the final
// `finalGoldRead` / `evidenceState` / `auditTrail`. Explicit rules:
//
// 1. `mechanicalGoldRead` is NEVER silently overwritten: whenever it is not
//    "CONTEXTUAL", `finalGoldRead` mirrors it UNLESS
//    `forceContextualDespiteMechanical` explicitly flags the rare,
//    documented demonstration KPI (see mockScenarios.ts).
// 2. Disagreement is preserved, never forced into a false consensus: if
//    analysts materially disagree (not unanimous) and the evidence doesn't
//    clearly resolve it, `finalGoldRead` becomes "CONTEXTUAL".
//
// Note on evidenceState: the milestone spec describes the disagreement
// outcome as evidenceState "MIXED", but the `EvidenceState` contract type
// (unchanged this milestone) only defines STRONG/MODERATE/LIMITED/
// CONFLICTED — no new literal was introduced. "CONFLICTED" is the existing
// enum value that already means "the evidence base doesn't cleanly
// resolve," so analyst disagreement maps onto it rather than onto a new,
// unlisted "MIXED" value. See docs/KPI_INTELLIGENCE_ARCHITECTURE.md.
//
// -----------------------------------------------------------------------
// "Previous interpretation is context, not anchor" (timestamp-independence
// pass). `KpiContextPackage.previousInterpretation` (contextPackageBuilder.ts)
// is available to a real prompt purely to identify WHAT CHANGED since the
// last read — never as a target the new interpretation must remain
// consistent with. A KPI's raw canonical value can be perfectly unchanged
// (e.g. Core CPI's official print is weeks old) while its interpretation
// still legitimately changes, because new evidence, new Fed communication,
// or a related market move altered the read. This adjudicator (and any
// future real-LLM prompt built on this pipeline) MUST re-evaluate from
// CURRENT canonical data and CURRENT evidence every time, and is free to
// fully confirm, partially revise, or outright reject the prior read —
// never forced to preserve it for the sake of continuity. The mock
// generator demonstrates this concretely via `MockScenario.continuity`
// (mockScenarios.ts) on the illustrative `f2-10y` KPI, wiring
// `previousReadSummary`/`whatChangedSincePreviousRead`/`currentRead`.
// -----------------------------------------------------------------------
export const PREVIOUS_INTERPRETATION_CONTEXT_RULE =
  "The previous interpretation (if any) is supplied to you as CONTEXT ONLY, to help you identify what has changed " +
  "since it was written. It is NOT an anchor: you must re-evaluate this KPI from the current canonical data and " +
  "current evidence exactly as if starting fresh, and you are free to fully confirm, partially revise, or " +
  "outright reject the previous read. A KPI's raw value can be unchanged while your interpretation legitimately " +
  "changes because new evidence or context has emerged. Never preserve the previous conclusion merely for the " +
  "sake of consistency.";

export interface AdjudicatorInputs {
  policy: AnalysisPolicy;
  /** Threaded through only to author bilingual `adjudicatorNotes` — does not affect any decision logic. */
  language: Language;
  /** The KPI's current deterministic mechanical read — "CONTEXTUAL" means no active mechanical constraint (always a valid, expected value, not a fallback). */
  mechanicalGoldRead: DisplayRelationship;
  /** Rare, explicit override: this specific KPI demonstrates a mechanical channel judged CONTEXTUAL. */
  forceContextualDespiteMechanical: boolean;
  scenarioEvidenceState: EvidenceState;
  hasContradictingEvidence: boolean;
  analystConclusions: AnalystConclusion[];
  challengeFindings: ChallengeFinding[];
}

export interface AdjudicatorResult {
  finalGoldRead: DisplayRelationship;
  evidenceState: EvidenceState;
  auditTrail: InterpretationAuditTrail;
}

// Exported for reuse by the real intelligence pilot's
// realInterpretationGenerator.ts, which needs the identical
// agreement-classification logic when assembling a real interpretation's
// auditTrail — never reimplemented, so mock and real interpretations always
// classify "how closely the analysts agreed" the same way.
export function computeModelAgreement(conclusions: AnalystConclusion[]): ModelAgreement {
  if (conclusions.length <= 1) return "SINGLE_ANALYST";
  const counts = new Map<DisplayRelationship, number>();
  for (const c of conclusions) counts.set(c.finalGoldRead, (counts.get(c.finalGoldRead) ?? 0) + 1);
  if (counts.size === 1) return "UNANIMOUS";
  const maxCount = Math.max(...counts.values());
  return maxCount > conclusions.length / 2 ? "MAJORITY" : "MIXED";
}

function majorityRead(conclusions: AnalystConclusion[]): DisplayRelationship {
  const counts = new Map<DisplayRelationship, number>();
  for (const c of conclusions) counts.set(c.finalGoldRead, (counts.get(c.finalGoldRead) ?? 0) + 1);
  let best: DisplayRelationship = "CONTEXTUAL";
  let bestCount = -1;
  for (const [read, count] of counts) {
    if (count > bestCount) {
      best = read;
      bestCount = count;
    }
  }
  return best;
}

// French-translation-completeness fix: `adjudicatorNotes` was previously
// hardcoded English regardless of `?lang=`. These are genuinely,
// independently-authored French sentences (same standard as
// mockScenarios.ts's ScenarioContent), not a machine-translated pass.
const ADJUDICATOR_NOTES_FR = {
  forceContextual: (mechanicalGoldRead: DisplayRelationship) =>
    `Le canal mécanique (${mechanicalGoldRead}) existe et n'est PAS écrasé — il est explicitement mis de côté ` +
    "pour cette seule séance, conformément au scénario de divergence illustratif rédigé pour ce KPI. " +
    "Il s'agit d'une exception rare et documentée, pas d'un bug.",
  mechanicalRuleApplies: (mechanicalGoldRead: DisplayRelationship) =>
    `La règle mécanique s'applique — finalGoldRead reflète la lecture mécanique actuelle (${mechanicalGoldRead}), sans altération.`,
  unanimous: "Analystes unanimes — adoption de la lecture contextuelle sur laquelle ils s'accordent.",
  majorityStrong: "Les analystes sont partagés mais l'ensemble de preuves est assez SOLIDE pour soutenir la lecture majoritaire sans forcer un faux consensus.",
  disagreementPreserved:
    "Les analystes sont en désaccord marqué et les preuves ne tranchent pas clairement — la lecture est préservée comme CONTEXTUELLE plutôt que de forcer un faux consensus.",
};

export function runAdjudicator(inputs: AdjudicatorInputs): AdjudicatorResult {
  const isFr = inputs.language === "FR";
  const modelAgreement = computeModelAgreement(inputs.analystConclusions);
  let evidenceState: EvidenceState = inputs.hasContradictingEvidence ? "CONFLICTED" : inputs.scenarioEvidenceState;
  let finalGoldRead: DisplayRelationship;
  let adjudicatorNotes: string;

  if (inputs.mechanicalGoldRead !== "CONTEXTUAL") {
    if (inputs.forceContextualDespiteMechanical) {
      finalGoldRead = "CONTEXTUAL";
      adjudicatorNotes = isFr
        ? ADJUDICATOR_NOTES_FR.forceContextual(inputs.mechanicalGoldRead)
        : `Mechanical channel (${inputs.mechanicalGoldRead}) exists and is NOT overwritten — it is explicitly ` +
          `set aside for this session only, per the illustrative divergence scenario authored for this KPI. ` +
          "This is a rare, documented exception, not a bug.";
    } else {
      finalGoldRead = inputs.mechanicalGoldRead;
      adjudicatorNotes = isFr
        ? ADJUDICATOR_NOTES_FR.mechanicalRuleApplies(inputs.mechanicalGoldRead)
        : `Mechanical rule applies — finalGoldRead mirrors the current mechanicalGoldRead (${inputs.mechanicalGoldRead}), unaltered.`;
    }
  } else if (modelAgreement === "UNANIMOUS") {
    finalGoldRead = inputs.analystConclusions[0]?.finalGoldRead ?? "CONTEXTUAL";
    adjudicatorNotes = isFr ? ADJUDICATOR_NOTES_FR.unanimous : "Analysts unanimous — adopting the agreed-upon contextual read.";
  } else if (modelAgreement === "MAJORITY" && evidenceState === "STRONG") {
    finalGoldRead = majorityRead(inputs.analystConclusions);
    adjudicatorNotes = isFr
      ? ADJUDICATOR_NOTES_FR.majorityStrong
      : "Analysts split but evidence is STRONG enough to back the majority read without forcing a false consensus.";
  } else {
    // MIXED, or a MAJORITY not backed by strong evidence — the
    // disagreement-preservation rule: never force a false consensus.
    finalGoldRead = "CONTEXTUAL";
    evidenceState = evidenceState === "STRONG" ? "MODERATE" : "CONFLICTED";
    adjudicatorNotes = isFr
      ? ADJUDICATOR_NOTES_FR.disagreementPreserved
      : "Analysts materially disagree and the evidence doesn't clearly resolve it — preserved as CONTEXTUAL rather than forcing a false consensus.";
  }

  const auditTrail: InterpretationAuditTrail = {
    policy: inputs.policy,
    analystConclusions: inputs.analystConclusions,
    challengeFindings: inputs.challengeFindings,
    modelAgreement,
    adjudicatorNotes,
  };

  return { finalGoldRead, evidenceState, auditTrail };
}
