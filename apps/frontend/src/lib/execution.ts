// Pure helpers for the Execution tab (unit-tested in tests/execution-helpers.test.ts).

/**
 * Share of a loss allowance already used that switches the display state.
 * These are display aids of this terminal, NOT FundedNext rules (see
 * docs/EXECUTION_REBUILD_PROGRESS.md, section "Spécification de la page").
 */
export const RISK_WATCH_RATIO = 0.5;
export const RISK_CRITICAL_RATIO = 0.8;

export type RiskState = "ok" | "watch" | "critical";

/** `used` and `limit` are FundedNext's figures; returns null when the ratio cannot be computed. */
export function riskUsage(used: number | null, limit: number): { ratio: number; state: RiskState } | null {
  if (used === null || !Number.isFinite(used) || !Number.isFinite(limit) || limit <= 0) return null;
  const ratio = Math.min(Math.max(used / limit, 0), 1);
  const state: RiskState = ratio >= RISK_CRITICAL_RATIO ? "critical" : ratio >= RISK_WATCH_RATIO ? "watch" : "ok";
  return { ratio, state };
}

export interface CumulativePoint { date: string; value: number }

/** Running total of daily net P&L, one point per day that has trades (weekends and empty days are skipped). */
export function cumulativePnl(days: ReadonlyArray<{ date: string; netPnl: number; trades: number }>): CumulativePoint[] {
  let total = 0;
  const points: CumulativePoint[] = [];
  for (const day of [...days].sort((a, b) => a.date.localeCompare(b.date))) {
    if (day.trades === 0) continue;
    total += day.netPnl;
    points.push({ date: day.date, value: Math.round((total + Number.EPSILON) * 100) / 100 });
  }
  return points;
}

/** "2026-09" + 1 → "2026-10". */
export function shiftMonth(month: string, delta: number): string {
  const [year, monthIndex] = month.split("-").map(Number);
  const shifted = new Date(Date.UTC(year, monthIndex - 1 + delta, 1));
  return `${shifted.getUTCFullYear()}-${String(shifted.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function currentMonthKey(now: Date = new Date()): string {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

/** Weekday index of the 1st of `month` with Monday = 0, used to align the calendar grid. */
export function firstWeekdayOffset(month: string): number {
  const [year, monthIndex] = month.split("-").map(Number);
  return (new Date(Date.UTC(year, monthIndex - 1, 1)).getUTCDay() + 6) % 7;
}
