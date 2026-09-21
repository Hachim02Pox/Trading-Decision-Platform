// Defensive mappers from raw FundedNext MCP payloads to the narrow DTOs in
// types.ts. Field names come from responses verified live on 2026-09-21 (see
// docs/EXECUTION_REBUILD_PROGRESS.md). Everything is optional-chained: FundedNext
// sends numbers as strings on some endpoints, and shapes differ between CFD and
// Futures. Nothing not explicitly copied below (notably `password` and
// `investor_password` in the overview) ever reaches a DTO.

import type {
  BreachDto, CalendarDayDto, ExecutionAccount, ExecutionAccountStatus, ExecutionPlatform, LimitMeter, OverviewDto,
  PositionSizeDto, ProgressMeter, RuleDto, StatsDto, SymbolPerformanceDto, TradeDto, TradesPageDto,
} from "./types";

type Raw = Record<string, unknown>;

export function asRecord(value: unknown): Raw | null {
  return value !== null && typeof value === "object" && !Array.isArray(value) ? (value as Raw) : null;
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

export function num(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function str(value: unknown): string | null {
  if (typeof value === "string" && value.trim() !== "") return value;
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return null;
}

function money(value: number | null): number | null {
  return value === null ? null : Math.round((value + Number.EPSILON) * 100) / 100;
}

export function normalizeAccount(raw: unknown, platform: ExecutionPlatform, status: ExecutionAccountStatus): ExecutionAccount | null {
  const row = asRecord(raw);
  const id = num(row?.id);
  const login = num(row?.login);
  if (!row || id === null || login === null) return null;
  const plan = asRecord(row.plan);
  const server = asRecord(row.server);
  return {
    id,
    login,
    title: str(plan?.title) ?? str(row.type) ?? `Account ${login}`,
    platform,
    server: str(server?.server_type),
    status,
    balance: money(num(row.balance)) ?? 0,
    equity: money(num(row.equity)) ?? 0,
    startingBalance: num(row.starting_balance),
    createdAt: str(row.created_at),
  };
}

export function normalizeAccountList(raw: unknown, platform: ExecutionPlatform, status: ExecutionAccountStatus): ExecutionAccount[] {
  return asArray(asRecord(raw)?.data)
    .map((row) => normalizeAccount(row, platform, status))
    .filter((account): account is ExecutionAccount => account !== null);
}

function limitMeter(objective: Raw | null, fallback: Raw | null): LimitMeter | null {
  const source = objective ?? fallback;
  const limit = num(source?.target_value);
  if (!source || limit === null) return null;
  // `current_value` is the signed P&L recorded (negative = loss, can overshoot the
  // limit on a breached account); `*_till_now` is the allowance consumed, capped at
  // the limit, and is what `remaining` (limit - used) is computed from by FundedNext.
  const recorded = num(source.current_value);
  const consumed = num(source.daily_loss_till_now) ?? num(source.max_loss_till_now);
  return {
    limit,
    limitPercent: num(source.target_value_percentage),
    used: consumed ?? (recorded === null ? null : Math.max(0, -recorded)),
    recorded,
    remaining: num(objective?.remaining),
  };
}

function progress(raw: Raw | null): ProgressMeter | null {
  const target = num(raw?.target_value);
  const current = num(raw?.current_value);
  return raw && target !== null && current !== null ? { target, current } : null;
}

export function normalizeOverview(raw: unknown, profitSplitPercent: number | null = null): OverviewDto | null {
  const root = asRecord(raw);
  if (!root) return null;
  const details = asRecord(root.account_details);
  const stats = asRecord(root.stats);
  const objectives = asRecord(root.objectives);
  const summary = asRecord(asRecord(root.account_summary)?.objectives);
  const cycle = asRecord(root.trading_cycle_details);
  const risk = asRecord(root.risk_parameters);
  const quick = asRecord(risk?.quick_strike);
  const riskLimit = asRecord(risk?.risk_limit);
  const news = asRecord(risk?.news_trade);
  const consistency = asRecord(root.consistency);
  const profit = asRecord(objectives?.profit);
  const profitSummary = asRecord(summary?.profit_target);
  const profitTarget = progress(profit);

  return {
    accountStatus: str(details?.account_status),
    sizeLabel: str(details?.size),
    initialBalance: num(details?.initial_balance),
    balance: money(num(stats?.balance)),
    equity: money(num(stats?.equity)),
    profit: money(num(stats?.profit)),
    drawdown: money(num(stats?.drawdown)),
    dailyLoss: limitMeter(asRecord(summary?.daily_loss), asRecord(objectives?.daily_loss)),
    overallLoss: limitMeter(asRecord(summary?.overall_loss), asRecord(objectives?.overall_loss)),
    profitTarget: profitTarget ? { ...profitTarget, percent: num(profitSummary?.percentage) } : null,
    tradingDays: progress(asRecord(objectives?.trading_days)),
    cycle: {
      startingDate: str(cycle?.starting_date),
      endingDate: str(cycle?.ending_date),
      payoutEligibleDate: str(cycle?.payout_eligible_date),
    },
    riskFlags: {
      quickStrike: quick ? { violation: str(quick.violation), percentage: num(quick.quick_strike_percentage), maxPercentage: num(quick.max_percentage) } : null,
      riskLimit: riskLimit ? { violation: str(riskLimit.violation), currentPercent: num(riskLimit.current_risk_limit), highestRisk: num(riskLimit.highest_risk) } : null,
      newsTrade: news ? { count: num(news.news_trade), eligibleProfitPercentage: num(news.eligible_profit_percentage) } : null,
    },
    consistency: consistency ? { applicable: true, status: str(root.consistency_status) } : null,
    profitSplitPercent: profitSplitPercent ?? num(details?.profit_share),
  };
}

export function normalizeStats(raw: unknown): StatsDto | null {
  const stats = asRecord(asRecord(raw)?.stats);
  if (!stats) return null;
  return {
    trades: num(stats.trades) ?? 0,
    lots: num(stats.lots),
    winRate: num(stats.win_rate),
    lossRate: num(stats.loss_rate),
    profitFactor: num(stats.profit_factor),
    averageWin: num(stats.average_wing),
    averageLoss: num(stats.average_loss),
    averageRr: str(stats.average_rrr),
    bestTrade: num(stats.best_trade),
    worstTrade: num(stats.worst_trade),
    grossProfit: num(stats.gross_profit),
    grossLoss: num(stats.gross_loss),
  };
}

export function normalizeTrade(raw: unknown): TradeDto | null {
  const row = asRecord(raw);
  if (!row) return null;
  const isFutures = "net_pnl" in row;
  const id = str(row.ticket) ?? str(row.close_ticket) ?? str(row.open_ticket) ?? str(row.id);
  const symbol = str(row.symbol);
  if (!id || !symbol) return null;
  const sideRaw = (str(row.type_str) ?? str(row.type) ?? "").toLowerCase();
  const profit = num(row.profit);
  const netPnl = isFutures
    ? num(row.net_pnl)
    : profit === null ? null : profit + (num(row.commission) ?? 0) + (num(row.swap) ?? 0);
  return {
    id,
    symbol,
    side: sideRaw === "buy" ? "buy" : sideRaw === "sell" ? "sell" : null,
    size: num(row.lots) ?? num(row.qty),
    openPrice: num(row.open_price),
    closePrice: num(row.close_price),
    openTime: str(row.open_time_str) ?? str(row.open_time),
    closeTime: str(row.close_time_str) ?? str(row.close_time),
    netPnl: money(netPnl),
    stopLoss: num(row.sl),
    takeProfit: num(row.tp),
    duration: str(row.trade_duration),
    pnlPercent: num(row.pnl_percentage),
    rr: str(row.rr_ratio),
    isNews: num(row.is_news) === 1,
  };
}

function tradeRows(raw: unknown): TradeDto[] {
  return asArray(raw).map(normalizeTrade).filter((trade): trade is TradeDto => trade !== null);
}

export function normalizeTradesPage(raw: unknown): TradesPageDto | null {
  const trades = asRecord(raw)?.trades;
  // An account with no trade yet answers `trades: []` instead of a paginated object.
  if (Array.isArray(trades)) return { trades: tradeRows(trades), page: 1, lastPage: 1, total: trades.length };
  const page = asRecord(trades);
  if (!page) return null;
  return {
    trades: tradeRows(page.data),
    page: num(page.current_page) ?? 1,
    lastPage: num(page.last_page) ?? 1,
    total: num(page.total) ?? 0,
  };
}

/** `get_running_trades` → `{trades: [...]}`; the row shape of an open position has not been observed yet (no open trades on the tested accounts). */
export function normalizeRunning(raw: unknown): TradeDto[] {
  const root = asRecord(raw);
  const rows = Array.isArray(root?.trades) ? root.trades : asArray(asRecord(root?.trades)?.data);
  return tradeRows(rows);
}

export function normalizeCalendar(raw: unknown): { month: string; days: CalendarDayDto[] } | null {
  const root = asRecord(raw);
  const month = str(root?.month);
  if (!root || !month) return null;
  const days = asArray(root.days).flatMap((entry): CalendarDayDto[] => {
    const day = asRecord(entry);
    const date = str(day?.date);
    if (!day || !date) return [];
    return [{
      date,
      isWeekend: day.is_weekend === true,
      netPnl: money(num(day.net_pnl)) ?? 0,
      trades: num(day.total_trades) ?? 0,
      winRate: num(day.win_rate),
    }];
  });
  return { month, days };
}

export function normalizeSymbols(raw: unknown): SymbolPerformanceDto[] {
  const root = asRecord(raw);
  if (!root) return [];
  return Object.values(root)
    .flatMap((entry): SymbolPerformanceDto[] => {
      const row = asRecord(entry);
      const symbol = str(row?.title);
      if (!row || !symbol) return [];
      return [{
        symbol,
        trades: num(row.no_of_trade) ?? 0,
        wins: num(row.wining_trade) ?? 0,
        losses: num(row.losing_trade) ?? 0,
        lots: num(row.lot),
        profit: money(num(row.profit)) ?? 0,
        sharePercent: num(row.symbol_percentage),
      }];
    })
    .sort((a, b) => b.trades - a.trades);
}

export function normalizeBreaches(raw: unknown): BreachDto[] {
  return asArray(raw).flatMap((entry): BreachDto[] => {
    const row = asRecord(entry);
    const reason = str(row?.breach_reason);
    if (!row || !reason) return [];
    return [{ reason, date: str(row.breach_date), balance: num(row.balance), equity: num(row.equity) }];
  });
}

export function normalizeRules(raw: unknown): RuleDto[] {
  return asArray(asRecord(raw)?.rules).flatMap((entry): RuleDto[] => {
    const row = asRecord(entry);
    const condition = str(row?.condition);
    const label = str(row?.label);
    if (!row || !condition || !label) return [];
    return [{ condition, label, value: str(row.value) ?? "" }];
  });
}

export function normalizePositionSize(raw: unknown): PositionSizeDto | null {
  const row = asRecord(raw);
  const riskAmount = num(row?.risk_amount);
  const stopDistance = num(row?.stop_distance);
  if (!row || riskAmount === null || stopDistance === null) return null;
  return {
    symbol: str(row.symbol) ?? "",
    riskAmount,
    stopDistance,
    lossPerLot: num(row.loss_per_lot),
    recommendedLots: num(row.recommended_lots),
  };
}
