import type {
  GlobalReadAgentOutput,
  GlobalReadAsymmetryCombined,
  GlobalReadAsymmetryVerdict,
  GlobalReadBlockId,
  GlobalReadComponentId,
  GlobalReadHorizon,
  GlobalReadHorizonVerdict,
  GlobalReadInterpretation,
  Language,
  ModelAgreement,
} from "@gold-terminal/contracts";
import { GLOBAL_READ_BLOCK_IDS, GLOBAL_READ_COMPONENT_IDS } from "./providers/globalReadSchema";
import type { GlobalReadCliRunResult } from "./providers/globalReadCliRunner";

// Global Read combiner — the SAME "no third slow LLM call, structurally
// combine instead" philosophy already established by
// providers/cliAdjudication.ts for the per-KPI/per-family path: every
// narrative field is a plain "[Agent A] ... [Agent B] ..." concatenation
// (never a synthesized rewrite that could quietly drop or reword what an
// agent actually said), and every categorical field (horizon verdicts,
// asymmetry verdict) follows the same disagreement-preservation rule used
// everywhere else in this codebase — agree -> adopt the shared value;
// disagree -> never fake a consensus, pick the more cautious/neutral
// reading and say so explicitly.

const ASYMMETRY_CAUTION_ORDER: readonly GlobalReadAsymmetryVerdict[] = ["STRONG", "MEDIUM", "WEAK", "TRAP"];

function agentLabel(role: "A" | "B"): string {
  return `[Agent ${role}]`;
}

function combineText(runs: readonly { role: "A" | "B"; text: string }[]): string {
  return runs.map((r) => `${agentLabel(r.role)} ${r.text}`).join(" ");
}

function combineBlockReadings(successful: readonly { role: "A" | "B"; output: Omit<GlobalReadAgentOutput, "role" | "modelIdentity"> }[]): GlobalReadInterpretation["blockReadings"] {
  return GLOBAL_READ_BLOCK_IDS.map((blockId: GlobalReadBlockId) => ({
    blockId,
    combinedReading: combineText(
      successful.map((s) => ({ role: s.role, text: s.output.blockReadings.find((b) => b.blockId === blockId)?.reading ?? "(missing)" }))
    ),
  }));
}

function combineComponentDeepDives(successful: readonly { role: "A" | "B"; output: Omit<GlobalReadAgentOutput, "role" | "modelIdentity"> }[]): GlobalReadInterpretation["componentDeepDives"] {
  return GLOBAL_READ_COMPONENT_IDS.map((componentId: GlobalReadComponentId) => ({
    componentId,
    combinedFindings: combineText(
      successful.map((s) => ({ role: s.role, text: s.output.componentDeepDives.find((c) => c.componentId === componentId)?.findings ?? "(missing)" }))
    ),
  }));
}

function combineHorizonVerdicts(successful: readonly { role: "A" | "B"; output: Omit<GlobalReadAgentOutput, "role" | "modelIdentity"> }[]): GlobalReadHorizonVerdict[] {
  const horizons: GlobalReadHorizon[] = ["INTRADAY", "SWING", "STRUCTURAL"];
  return horizons.map((horizon) => {
    const perAgent = successful.map((s) => ({ role: s.role, v: s.output.horizonVerdicts.find((h) => h.horizon === horizon) }));
    const withVerdict = perAgent.filter((p): p is { role: "A" | "B"; v: NonNullable<typeof p.v> } => p.v !== undefined);

    const rationale = combineText(withVerdict.map((p) => ({ role: p.role, text: p.v.rationale })));
    const invalidationLevel = combineText(withVerdict.map((p) => ({ role: p.role, text: p.v.invalidationLevel })));

    if (withVerdict.length === 0) {
      return { horizon, verdict: "NEUTRAL", confidence: "LOW", rationale: "(no agent produced a usable verdict for this horizon)", invalidationLevel: "N/A" };
    }
    if (withVerdict.length === 1) {
      return { horizon, verdict: withVerdict[0].v.verdict, confidence: withVerdict[0].v.confidence, rationale, invalidationLevel };
    }

    const [first, second] = withVerdict;
    if (first.v.verdict === second.v.verdict) {
      const confidenceOrder = { HIGH: 2, MEDIUM: 1, LOW: 0 } as const;
      const lowerConfidence = confidenceOrder[first.v.confidence] <= confidenceOrder[second.v.confidence] ? first.v.confidence : second.v.confidence;
      return { horizon, verdict: first.v.verdict, confidence: lowerConfidence, rationale, invalidationLevel };
    }
    // Disagreement — never force a false consensus: NEUTRAL, LOW confidence, the rationale text itself names both agents' actual verdicts.
    return {
      horizon,
      verdict: "NEUTRAL",
      confidence: "LOW",
      rationale: `Agents disagreed on this horizon (${first.role}: ${first.v.verdict}, ${second.role}: ${second.v.verdict}) — no forced consensus. ${rationale}`,
      invalidationLevel,
    };
  });
}

function combineAsymmetry(successful: readonly { role: "A" | "B"; output: Omit<GlobalReadAgentOutput, "role" | "modelIdentity"> }[]): GlobalReadAsymmetryCombined {
  const combinedNotes = combineText(successful.map((s) => ({ role: s.role, text: s.output.asymmetryNotes })));
  const verdicts = successful.map((s) => s.output.asymmetryVerdict);
  if (verdicts.length === 0) return { combinedNotes, verdict: "WEAK" };
  if (verdicts.length === 1) return { combinedNotes, verdict: verdicts[0] };
  if (verdicts[0] === verdicts[1]) return { combinedNotes, verdict: verdicts[0] };
  // Disagreement: adopt whichever of the two is more cautious rather than averaging or picking arbitrarily.
  const mostCautious = ASYMMETRY_CAUTION_ORDER.find((v) => verdicts.includes(v)) ?? "MEDIUM";
  return {
    combinedNotes: `Agents disagreed on asymmetry (${verdicts.join(" vs ")}) — the more cautious reading was kept. ${combinedNotes}`,
    verdict: mostCautious,
  };
}

/**
 * Combines every successfully-completed CLI run into one GlobalReadInterpretation.
 * Returns null only when EVERY run failed (caller reports UNAVAILABLE) —
 * a single successful agent is enough to produce a (SINGLE_ANALYST) report,
 * same graceful-degradation policy as the per-KPI/per-family buttons.
 */
export function combineGlobalReadRuns(
  runs: readonly GlobalReadCliRunResult[],
  language: Language,
  sessionId: string
): GlobalReadInterpretation | null {
  const successful = runs
    .filter((r): r is GlobalReadCliRunResult & { output: NonNullable<GlobalReadCliRunResult["output"]> } => r.output !== null)
    .map((r) => ({ role: r.role, output: r.output }));

  if (successful.length === 0) return null;

  const modelAgreement: ModelAgreement =
    successful.length === 1
      ? "SINGLE_ANALYST"
      : successful[0].output.horizonVerdicts.every((h) => {
            const other = successful[1].output.horizonVerdicts.find((oh) => oh.horizon === h.horizon);
            return other?.verdict === h.verdict;
          })
        ? "UNANIMOUS"
        : "MIXED";

  const competingHypotheses = successful.flatMap((s) => s.output.competingHypotheses.map((h) => `${agentLabel(s.role)} ${h}`));
  const contradictions = successful.flatMap((s) => s.output.contradictions.map((c) => `${agentLabel(s.role)} ${c}`));

  return {
    interpretationAnalyzedAt: new Date().toISOString(),
    language,
    sessionId,
    isMock: false,
    blockReadings: combineBlockReadings(successful),
    componentDeepDives: combineComponentDeepDives(successful),
    dataVerificationNotes: combineText(successful.map((s) => ({ role: s.role, text: s.output.dataVerificationNotes }))),
    competingHypotheses,
    dominantDriver: combineText(successful.map((s) => ({ role: s.role, text: s.output.dominantDriver }))),
    independenceTestNotes: combineText(successful.map((s) => ({ role: s.role, text: s.output.independenceTestNotes }))),
    contradictions,
    adversarialCase: combineText(successful.map((s) => ({ role: s.role, text: s.output.adversarialCase }))),
    horizonVerdicts: combineHorizonVerdicts(successful),
    asymmetry: combineAsymmetry(successful),
    auditTrail: {
      agentOutputs: runs
        .filter((r): r is GlobalReadCliRunResult & { output: NonNullable<GlobalReadCliRunResult["output"]> } => r.output !== null)
        .map((r) => ({ role: r.role, modelIdentity: r.modelIdentity, ...r.output })),
      modelAgreement,
    },
  };
}
