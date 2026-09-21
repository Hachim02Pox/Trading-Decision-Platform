// DTOs returned by /api/execution/*. Deliberately narrow: nothing from a raw
// FundedNext payload is passed through (the overview contains password fields).
// Mirrored by apps/frontend/src/lib/api/executionClient.ts — keep both in sync.

export type ExecutionPlatform = "cfd" | "futures";
export type ExecutionAccountStatus = "active" | "inactive" | "breached";

export interface ExecutionAccount {
  id: number;
  login: number;
  title: string;
  platform: ExecutionPlatform;
  server: string | null;
  status: ExecutionAccountStatus;
  balance: number;
  equity: number;
  startingBalance: number | null;
  createdAt: string | null;
}

/** One independently-fetched slice of the dashboard: a failing FundedNext endpoint never blanks the page. */
export interface Section<T> {
  status: "ok" | "unavailable";
  data: T | null;
  message: string | null;
}

/** A loss allowance in account currency. `used`/`remaining` are FundedNext's own figures, never recomputed here. */
export interface LimitMeter {
  limit: number;
  limitPercent: number | null;
  /** Allowance consumed, >= 0, capped at `limit`. */
  used: number | null;
  /** Signed P&L recorded for the period (negative = loss); may overshoot `limit` on a breached account. */
  recorded: number | null;
  remaining: number | null;
}

export interface ProgressMeter {
  target: number;
  current: number;
}

export interface OverviewDto {
  accountStatus: string | null;
  sizeLabel: string | null;
  initialBalance: number | null;
  balance: number | null;
  equity: number | null;
  profit: number | null;
  drawdown: number | null;
  dailyLoss: LimitMeter | null;
  overallLoss: LimitMeter | null;
  profitTarget: (ProgressMeter & { percent: number | null }) | null;
  tradingDays: ProgressMeter | null;
  cycle: { startingDate: string | null; endingDate: string | null; payoutEligibleDate: string | null };
  riskFlags: {
    quickStrike: { violation: string | null; percentage: number | null; maxPercentage: number | null } | null;
    riskLimit: { violation: string | null; currentPercent: number | null; highestRisk: number | null } | null;
    newsTrade: { count: number | null; eligibleProfitPercentage: number | null } | null;
  };
  consistency: { applicable: boolean; status: string | null } | null;
  profitSplitPercent: number | null;
}

export interface StatsDto {
  trades: number;
  lots: number | null;
  winRate: number | null;
  lossRate: number | null;
  profitFactor: number | null;
  averageWin: number | null;
  averageLoss: number | null;
  averageRr: string | null;
  bestTrade: number | null;
  worstTrade: number | null;
  grossProfit: number | null;
  grossLoss: number | null;
}

export interface TradeDto {
  id: string;
  symbol: string;
  side: "buy" | "sell" | null;
  size: number | null;
  openPrice: number | null;
  closePrice: number | null;
  openTime: string | null;
  closeTime: string | null;
  /** CFD: profit + commission + swap. Futures: net_pnl. Same rule FundedNext documents for daily P&L. */
  netPnl: number | null;
  stopLoss: number | null;
  takeProfit: number | null;
  duration: string | null;
  pnlPercent: number | null;
  rr: string | null;
  isNews: boolean;
}

export interface TradesPageDto {
  trades: TradeDto[];
  page: number;
  lastPage: number;
  total: number;
}

export interface CalendarDayDto {
  date: string;
  isWeekend: boolean;
  netPnl: number;
  trades: number;
  winRate: number | null;
}

export interface SymbolPerformanceDto {
  symbol: string;
  trades: number;
  wins: number;
  losses: number;
  lots: number | null;
  profit: number;
  sharePercent: number | null;
}

export interface BreachDto {
  reason: string;
  date: string | null;
  balance: number | null;
  equity: number | null;
}

export interface RuleDto {
  condition: string;
  label: string;
  value: string;
}

export interface ExecutionDashboard {
  account: ExecutionAccount;
  fetchedAt: string;
  overview: Section<OverviewDto>;
  stats: Section<StatsDto>;
  running: Section<TradeDto[]>;
  history: Section<TradesPageDto>;
  calendar: Section<{ month: string; days: CalendarDayDto[] }>;
  symbols: Section<SymbolPerformanceDto[]>;
  breaches: Section<BreachDto[]> | null;
  rules: Section<RuleDto[]> | null;
}

export interface PositionSizeDto {
  symbol: string;
  riskAmount: number;
  stopDistance: number;
  lossPerLot: number | null;
  recommendedLots: number | null;
}
