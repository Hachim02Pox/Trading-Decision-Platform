export const judgmentKeys = ["macro_direction", "directional_asymmetry", "positioning_asymmetry", "edge", "opportunity_quality", "execution_readiness"] as const;
export type JudgmentKey = typeof judgmentKeys[number];
export type Language = "FR" | "EN";

function copy(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

export function verdictDetail(presentation: any, key: JudgmentKey): { verdict: string | null; explanation: string | null } {
  // Current-state presentation is authoritative. Historical V4 verdict prose can
  // still describe the Sunday state after the intermediate verdict has changed.
  const current = key === "opportunity_quality" ? presentation?.opportunity_quality
    : key === "execution_readiness" ? presentation?.execution_readiness
    : presentation?.direction_state?.[key];
  const historical = presentation?.verdict_explanations?.[key];
  return {
    verdict: copy(current?.display) ?? copy(historical?.verdict),
    explanation: copy(current?.explanation) ?? copy(historical?.mechanism) ?? copy(historical?.practical_meaning),
  };
}

export function rawJudgment(read: any, key: JudgmentKey): string | null {
  const raw = key === "opportunity_quality" || key === "execution_readiness"
    ? read?.[key]?.value : read?.direction_state?.[key];
  return typeof raw === "string" ? raw : null;
}

export function matchingIntermediateSummary(read: any, parentRunId: string | null | undefined): any | null {
  const summary = read?.intermediate_summary;
  return parentRunId && summary?.parent_run_id === parentRunId ? summary : null;
}

export function judgmentEvolution(
  read: any,
  previous: any,
  presentation: any,
  previousPresentation: any,
  language: Language,
  labels: Record<JudgmentKey, string>,
): { changed: string[]; remains: string[] } {
  if (!previous) return { changed: [], remains: [] };
  const changed: string[] = [];
  const remains: string[] = [];
  for (const key of judgmentKeys) {
    const before = rawJudgment(previous, key);
    const after = rawJudgment(read, key);
    if (!before || !after) continue;
    const oldCopy = verdictDetail(previousPresentation, key).verdict;
    const now = verdictDetail(presentation, key);
    if (before !== after) {
      changed.push(`${labels[key]} : ${oldCopy ?? before} → ${now.verdict ?? after}.${now.explanation ? ` ${now.explanation}` : ""}`);
    } else if (now.explanation) {
      remains.push(`${now.verdict ?? labels[key]} : ${now.explanation}`);
    }
  }
  return { changed, remains };
}
