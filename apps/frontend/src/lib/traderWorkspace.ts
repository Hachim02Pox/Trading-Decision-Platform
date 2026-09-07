export interface RiskPlanInput {
  accountBalance: number;
  riskPercent: number;
  entryPrice: number;
  stopPrice: number;
}

export interface RiskPlan {
  riskAmount: number;
  stopDistance: number;
  approximateUnits: number;
}

export type TradeDirection = "LONG" | "SHORT" | "NO_TRADE";

export interface JournalEntry {
  id: string;
  createdAt: string;
  tradedAt: string;
  instrument: string;
  direction: TradeDirection;
  setup: string;
  thesis: string;
  invalidation: string;
  outcomeR: number | null;
  followedPlan: boolean;
  notes: string;
}

export interface JournalSummary {
  totalEntries: number;
  closedTrades: number;
  winRatePercent: number | null;
  totalR: number | null;
  averageR: number | null;
  planAdherencePercent: number | null;
}

function round(value: number, decimals = 2): number {
  const factor = 10 ** decimals;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

export function calculateRiskPlan(input: RiskPlanInput): RiskPlan | null {
  const values = [input.accountBalance, input.riskPercent, input.entryPrice, input.stopPrice];
  if (values.some((value) => !Number.isFinite(value))) return null;
  if (input.accountBalance <= 0 || input.riskPercent <= 0 || input.riskPercent > 100) return null;
  if (input.entryPrice <= 0 || input.stopPrice <= 0) return null;

  const stopDistance = Math.abs(input.entryPrice - input.stopPrice);
  if (stopDistance === 0) return null;
  const riskAmount = input.accountBalance * (input.riskPercent / 100);

  return {
    riskAmount: round(riskAmount),
    stopDistance: round(stopDistance),
    approximateUnits: round(riskAmount / stopDistance, 4),
  };
}

export function summarizeJournal(entries: readonly JournalEntry[]): JournalSummary {
  if (entries.length === 0) {
    return { totalEntries: 0, closedTrades: 0, winRatePercent: null, totalR: null, averageR: null, planAdherencePercent: null };
  }

  const outcomes = entries
    .map((entry) => entry.outcomeR)
    .filter((outcome): outcome is number => outcome !== null && Number.isFinite(outcome));
  const totalR = outcomes.reduce((sum, outcome) => sum + outcome, 0);
  const wins = outcomes.filter((outcome) => outcome > 0).length;
  const followed = entries.filter((entry) => entry.followedPlan).length;

  return {
    totalEntries: entries.length,
    closedTrades: outcomes.length,
    winRatePercent: outcomes.length > 0 ? round((wins / outcomes.length) * 100) : null,
    totalR: outcomes.length > 0 ? round(totalR) : null,
    averageR: outcomes.length > 0 ? round(totalR / outcomes.length) : null,
    planAdherencePercent: round((followed / entries.length) * 100),
  };
}
