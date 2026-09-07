export interface GlobalReadMethod {
  referenceSymbol: "GC=F" | "XAUUSD=X" | null;
  reactionWindowSeconds: number | null;
  materialityPct: number | null;
  maxBarDistanceSeconds: number | null;
  eventGuardSeconds: number | null;
  maxReportAgeSeconds: number | null;
  adaptiveLookbackSessions: number | null;
  adaptivePercentile: number | null;
  referenceSourceAccepted: boolean;
}
function nonnegative(value: string | undefined): number | null {
  if (!value?.trim()) return null;
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : null;
}
function positiveInteger(value: string | undefined): number | null {
  const number = nonnegative(value);
  return number !== null && Number.isInteger(number) && number > 0 ? number : null;
}
function percentile(value: string | undefined): number | null {
  const number = nonnegative(value);
  return number !== null && number > 0 && number <= 100 ? number : null;
}
export function loadGlobalReadMethod(env: NodeJS.ProcessEnv = process.env): GlobalReadMethod {
  return { referenceSymbol: env.GLOBAL_READ_REFERENCE_SYMBOL === "GC=F" || env.GLOBAL_READ_REFERENCE_SYMBOL === "XAUUSD=X" ? env.GLOBAL_READ_REFERENCE_SYMBOL : null,
    reactionWindowSeconds: nonnegative(env.GLOBAL_READ_REACTION_WINDOW_SECONDS), materialityPct: nonnegative(env.GLOBAL_READ_MATERIALITY_PCT),
    maxBarDistanceSeconds: nonnegative(env.GLOBAL_READ_MAX_BAR_DISTANCE_SECONDS), eventGuardSeconds: nonnegative(env.GLOBAL_READ_EVENT_GUARD_SECONDS),
    maxReportAgeSeconds: nonnegative(env.GLOBAL_READ_MAX_REPORT_AGE_SECONDS), adaptiveLookbackSessions: positiveInteger(env.GLOBAL_READ_ADAPTIVE_LOOKBACK_SESSIONS),
    adaptivePercentile: percentile(env.GLOBAL_READ_ADAPTIVE_PERCENTILE), referenceSourceAccepted: env.GLOBAL_READ_ACCEPT_UNOFFICIAL_REFERENCE === "true" };
}
export function undefinedMethodFields(method: GlobalReadMethod): string[] {
  return Object.entries(method).filter(([key, value]) => value === null || (key === "referenceSourceAccepted" && value === false)).map(([key]) => key);
}
