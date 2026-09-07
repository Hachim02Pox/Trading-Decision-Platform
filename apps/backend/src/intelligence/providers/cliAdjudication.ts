import type { AnalystConclusion, DisplayRelationship, EvidenceState } from "@gold-terminal/contracts";
import { computeModelAgreement } from "../ensemble/runAdjudicator";
import type { AdjudicatorLlmRequest, AdjudicatorLlmResult, ChallengeLlmRequest, ChallengeLlmResult } from "./llmProvider";

// ADJUDICATION APPROACH CHOSEN for the CLI-provider path
// (claudeCliLlmProvider.ts/codexCliLlmProvider.ts): a lightweight,
// purely-local, rule-based synthesis — option (b) from the feature spec —
// rather than a third CLI subprocess call (option (a)). Rationale: two full
// agentic, web-searching CLI sessions already run in parallel and can each
// take up to ~90-120s; a third slow call to arbitrate between them would
// push a single on-demand click toward several minutes of wall-clock time
// and a third slice of the user's subscription quota, for a synthesis step
// that reduces, by design, to one simple rule once both analysts' actual
// conclusions already exist: do they agree? This mirrors
// ensemble/runAdjudicator.ts's own mock-pipeline rule EXACTLY (unanimous ->
// adopt the shared read; disagreement -> CONTEXTUAL, evidence marked
// CONFLICTED, never a forced false consensus) via the same
// `computeModelAgreement` helper, so a CLI-sourced interpretation classifies
// agreement/disagreement identically to every other pipeline in this
// codebase — no new decision rule was invented for this path, and no
// subprocess is spawned by either function below.

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

// User-facing text never names the underlying provider (claude-cli/
// codex-cli) — just the generic role label ("Agent A"/"Agent B"). Which
// role maps to which CLI is an internal implementation detail (see
// onDemandAnalysis.ts's CLI_PROVIDER_IDS ordering: claude-cli is always
// Agent A, codex-cli is always Agent B when both are available).
function summarizeConclusions(conclusions: AnalystConclusion[]): string {
  return conclusions.map((c) => `[Agent ${c.role}] ${c.shortConclusion}`).join(" ");
}

function collectKeyPoints(conclusions: AnalystConclusion[]): string[] {
  return conclusions.flatMap((c) => c.keyPoints);
}

export function synthesizeCliAdjudication(req: AdjudicatorLlmRequest): AdjudicatorLlmResult {
  const modelAgreement = computeModelAgreement(req.analystConclusions);
  const isMechanical = req.mechanicalRelationship !== null && req.mechanicalFinalGoldRead !== null;

  let finalGoldRead: DisplayRelationship;
  let evidenceState: EvidenceState;
  let adjudicatorNotes: string;

  if (isMechanical) {
    // realInterpretationGenerator.ts already discards/overrides finalGoldRead
    // for mechanical KPIs regardless of what any adjudicator (real or
    // rule-based) returns here — mirrored for consistency, not relied upon.
    finalGoldRead = req.mechanicalFinalGoldRead as DisplayRelationship;
    evidenceState = "MODERATE";
    adjudicatorNotes =
      `Mechanical rule applies (${req.mechanicalRelationship}) — this CLI-path rule-based adjudicator's ` +
      "finalGoldRead mirrors it; the authoritative override happens upstream regardless.";
  } else if (modelAgreement === "UNANIMOUS" || modelAgreement === "SINGLE_ANALYST") {
    finalGoldRead = req.analystConclusions[0]?.finalGoldRead ?? "CONTEXTUAL";
    evidenceState = req.analystConclusions.length > 1 ? "MODERATE" : "LIMITED";
    adjudicatorNotes =
      req.analystConclusions.length > 1
        ? "CLI analysts agreed — rule-based adjudication (no third CLI call) adopted the shared read."
        : "Only one CLI analyst was available this run — rule-based adjudication adopted its read as a SINGLE_ANALYST result.";
  } else if (modelAgreement === "MAJORITY") {
    finalGoldRead = majorityRead(req.analystConclusions);
    evidenceState = "MODERATE";
    adjudicatorNotes = "CLI analysts split but a majority read exists — rule-based adjudication adopted it without forcing full consensus.";
  } else {
    // MIXED — no majority either. Never force a false consensus.
    finalGoldRead = "CONTEXTUAL";
    evidenceState = "CONFLICTED";
    adjudicatorNotes =
      "CLI analysts disagreed with no majority and no third CLI call arbitrated — preserved as CONTEXTUAL/CONFLICTED " +
      "rather than forcing a false consensus, matching ensemble/runAdjudicator.ts's disagreement-preservation rule.";
  }

  const detailed = summarizeConclusions(req.analystConclusions);
  const keyPoints = collectKeyPoints(req.analystConclusions);

  return {
    currentReadShort: req.analystConclusions[0]?.shortConclusion ?? detailed,
    currentReadDetailed: detailed,
    whyNow: keyPoints[0] ?? detailed,
    causalChain: keyPoints.slice(0, 3).map((statement) => ({ statement, status: "INFERENCE" as const })),
    uncertaintyOrUnknowns:
      modelAgreement === "MIXED" ? ["The CLI analysts did not converge on the same read this run."] : [],
    whatWouldStrengthen: [],
    whatWouldWeakenOrInvalidate: [],
    finalGoldRead,
    evidenceState,
    adjudicatorNotes,
    previousReadSummary: req.previousInterpretation?.currentRead ?? null,
    whatChangedSincePreviousRead: null,
    currentRead: detailed,
  };
}

/** Same no-extra-subprocess rationale as the adjudicator above — a genuine disagreement between analysts IS itself the most useful "challenge" signal available without a third CLI call, so it is surfaced as a finding rather than skipped. */
export function synthesizeCliChallengeFindings(req: ChallengeLlmRequest): ChallengeLlmResult {
  const agreement = computeModelAgreement(req.analystConclusions);
  if (agreement === "UNANIMOUS" || agreement === "SINGLE_ANALYST" || req.analystConclusions.length < 2) return { findings: [] };

  const [first, second] = req.analystConclusions;
  return {
    findings: [
      {
        targetRole: second.role,
        concern:
          `Analyst ${second.role}'s read (${second.finalGoldRead}) diverges from analyst ${first.role}'s ` +
          `(${first.finalGoldRead}); no third CLI call arbitrated this — see the interpretation's adjudicatorNotes.`,
        epistemicStatus: "UNKNOWN",
      },
    ],
  };
}
