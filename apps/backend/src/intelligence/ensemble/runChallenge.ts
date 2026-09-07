import type { AnalystConclusion, ChallengeFinding, Language } from "@gold-terminal/contracts";

// Milestone 1D — challenge stage. Only ever invoked under HIGH_SCRUTINY
// (see policies.ts). Addresses things like unsupported causal claims,
// non-independent sources, or a mechanical-vs-current-causality confusion.
// Mock/hand-authored is fine for this milestone, but at least one
// illustrative KPI (f7-hy-oas, via its `challengeFindings` in
// mockScenarios.ts) is genuinely substantive rather than a placeholder.

// French-translation-completeness fix: this generic fallback (used by any
// HIGH_SCRUTINY KPI without hand-authored challengeFindings, e.g. f2-10y
// and f5-payrolls-latest, which only hand-author analystConclusions) was
// previously a hardcoded English literal regardless of `?lang=`.
const GENERIC_FALLBACK_CONCERN: Record<Language, string> = {
  EN: "No explicit challenge scenario authored yet for this KPI — flagging analyst independence as a structural placeholder only, not a substantive finding.",
  FR: "Aucun scénario de contre-analyse explicite n'a encore été rédigé pour ce KPI — l'indépendance des analystes est signalée comme un simple espace réservé structurel, pas comme un constat substantiel.",
};

export function runChallenge(
  analystConclusions: AnalystConclusion[],
  explicit: ChallengeFinding[] | undefined,
  language: Language
): ChallengeFinding[] {
  if (explicit) return explicit;

  // Generic fallback for HIGH_SCRUTINY KPIs without hand-authored findings
  // (keeps the pipeline total if that set ever grows without every entry
  // immediately getting bespoke challenge content).
  const targetRole = analystConclusions[analystConclusions.length - 1]?.role ?? "A";
  return [
    {
      targetRole,
      concern: GENERIC_FALLBACK_CONCERN[language],
      epistemicStatus: "UNKNOWN",
    },
  ];
}
