import { createClient } from "@/lib/supabase/client";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4001";

// Types mirror apps/backend/src/fundednext/types.ts — keep both in sync.
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

export interface Section<T> { status: "ok" | "unavailable"; data: T | null; message: string | null }
export interface LimitMeter { limit: number; limitPercent: number | null; used: number | null; recorded: number | null; remaining: number | null }
export interface ProgressMeter { target: number; current: number }

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
  netPnl: number | null;
  stopLoss: number | null;
  takeProfit: number | null;
  duration: string | null;
  pnlPercent: number | null;
  rr: string | null;
  isNews: boolean;
}

export type TradeReason = "TECHNICAL" | "MACRO" | "NEWS" | "FLOW" | "RISK" | "OTHER";
export interface TradeAnnotationDto { accountId: number; tradeId: string; reason: TradeReason; createdAt: string; updatedAt: string }

export interface TradesPageDto { trades: TradeDto[]; page: number; lastPage: number; total: number }
export interface CalendarDayDto { date: string; isWeekend: boolean; netPnl: number; trades: number; winRate: number | null }
export interface SymbolPerformanceDto { symbol: string; trades: number; wins: number; losses: number; lots: number | null; profit: number; sharePercent: number | null }
export interface BreachDto { reason: string; date: string | null; balance: number | null; equity: number | null }
export interface RuleDto { condition: string; label: string; value: string }

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

export interface PositionSizeDto { symbol: string; riskAmount: number; stopDistance: number; lossPerLot: number | null; recommendedLots: number | null }

/** Carries the backend error code so the page can tell "not the owner" from "FundedNext is down". */
export class ExecutionApiError extends Error {
  constructor(readonly code: string, message: string, readonly status: number) {
    super(message);
    this.name = "ExecutionApiError";
  }
}

async function authHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await createClient().auth.getSession();
  return session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {};
}

async function request<T>(path: string, params: Record<string, string | number | undefined> = {}): Promise<T> {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) if (value !== undefined) query.set(key, String(value));
  const suffix = query.size > 0 ? `?${query.toString()}` : "";
  const headers = await authHeaders();
  if (!headers.Authorization) throw new ExecutionApiError("SIGN_IN_REQUIRED", "Sign in required.", 401);

  let res: Response;
  try {
    res = await fetch(`${BACKEND_URL}/api/execution${path}${suffix}`, { cache: "no-store", headers });
  } catch {
    throw new ExecutionApiError("NETWORK", "Backend unreachable.", 0);
  }
  if (!res.ok) {
    let code = "REQUEST_FAILED";
    let message = `Request failed (${res.status}).`;
    try {
      const body = (await res.json()) as { error?: { code?: string; message?: string } };
      code = body.error?.code ?? code;
      message = body.error?.message ?? message;
    } catch { /* keep the generic message */ }
    throw new ExecutionApiError(code, message, res.status);
  }
  return (await res.json()) as T;
}

export async function fetchExecutionAccounts(refresh = false): Promise<ExecutionAccount[]> {
  const body = await request<{ accounts: ExecutionAccount[] }>("/accounts", { refresh: refresh ? 1 : undefined });
  return body.accounts;
}

export function fetchExecutionDashboard(accountId: number, options: { month?: string; page?: number; refresh?: boolean } = {}): Promise<ExecutionDashboard> {
  return request<ExecutionDashboard>(`/accounts/${accountId}/dashboard`, { month: options.month, page: options.page, refresh: options.refresh ? 1 : undefined });
}

export async function fetchPositionSize(input: { symbol: string; balance: number; riskPercent: number; entry: number; stop: number }): Promise<PositionSizeDto> {
  const body = await request<{ result: PositionSizeDto }>("/position-size", input);
  return body.result;
}

export async function fetchTradeAnnotations(accountId: number): Promise<TradeAnnotationDto[]> {
  const body = await request<{ annotations: TradeAnnotationDto[] }>(`/accounts/${accountId}/trade-annotations`);
  return body.annotations;
}

export async function saveTradeAnnotation(accountId: number, tradeId: string, reason: TradeReason): Promise<TradeAnnotationDto> {
  const auth = await authHeaders();
  if (!auth.Authorization) throw new ExecutionApiError("SIGN_IN_REQUIRED", "Sign in required.", 401);
  const headers = { ...auth, "Content-Type": "application/json" };
  const response = await fetch(`${BACKEND_URL}/api/execution/accounts/${accountId}/trades/${encodeURIComponent(tradeId)}/annotation`, { method: "PUT", headers, body: JSON.stringify({ reason }) });
  if (!response.ok) throw new ExecutionApiError("ANNOTATION_FAILED", "Could not save trade follow-up.", response.status);
  return ((await response.json()) as { annotation: TradeAnnotationDto }).annotation;
}
