import type { GoldOvernightRecap, Language } from "@gold-terminal/contracts";
import type { GoldOvernightCliRunResult } from "./providers/goldOvernightCliRunner";

function agentLabel(role: "A" | "B"): string {
  return `[Agent ${role}]`;
}

export function combineGoldOvernightRuns(runs: readonly GoldOvernightCliRunResult[], language: Language, sessionId: string): GoldOvernightRecap | null {
  const successful = runs.filter((r): r is GoldOvernightCliRunResult & { output: NonNullable<GoldOvernightCliRunResult["output"]> } => r.output !== null);
  if (successful.length === 0) return null;

  return {
    interpretationAnalyzedAt: new Date().toISOString(),
    language,
    sessionId,
    isMock: false,
    combinedSummary: successful.map((r) => `${agentLabel(r.role)} ${r.output.summary}`).join("\n\n"),
    combinedKeyMoves: successful.flatMap((r) => r.output.keyMoves.map((m) => `${agentLabel(r.role)} ${m}`)),
    combinedCatalysts: successful.flatMap((r) => r.output.catalysts.map((c) => `${agentLabel(r.role)} ${c}`)),
    sources: successful.flatMap((r) => r.output.sources),
    agentOutputs: successful.map((r) => ({ role: r.role, modelIdentity: r.modelIdentity, ...r.output })),
  };
}
