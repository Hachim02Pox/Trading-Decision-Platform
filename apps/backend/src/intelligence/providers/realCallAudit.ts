// Cost safety (docs/KPI_INTELLIGENCE_ARCHITECTURE.md, "Real intelligence
// pilot" section) — a simple, server-side-only, per-process count of every
// real LLM call actually attempted, so spend is auditable from server logs.
// Never exposed to the frontend/API surface.
let callCount = 0;

export interface RealLlmCallInfo {
  provider: string;
  model: string;
  role: string;
  kpiId: string;
  attempt: number; // 1 = first attempt, 2 = the single allowed retry
}

export function recordRealLlmCall(info: RealLlmCallInfo): void {
  callCount += 1;
  console.log(
    JSON.stringify({
      msg: "real intelligence LLM call",
      ...info,
      cumulativeCallCount: callCount,
    })
  );
}

export function getRealLlmCallCount(): number {
  return callCount;
}

/** Test-only escape hatch. */
export function __resetRealLlmCallCountForTests(): void {
  callCount = 0;
}
