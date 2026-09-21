// Aggregates FundedNext MCP tool calls into the ExecutionDashboard the
// Execution tab renders. Every dashboard slice is fetched independently so a
// FundedNext-side failure (e.g. the Futures Flex overview currently answers
// HTTP 500) degrades one card, not the whole page.

import { FundedNextError, type CallOptions } from "./mcpClient";
import {
  normalizeAccountList, normalizeBreaches, normalizeCalendar, normalizeOverview, normalizePositionSize, normalizeRules,
  normalizeRunning, normalizeStats, normalizeSymbols, normalizeTradesPage,
} from "./normalize";
import type {
  ExecutionAccount, ExecutionAccountStatus, ExecutionDashboard, ExecutionPlatform, PositionSizeDto, Section,
} from "./types";

export interface ToolCaller {
  callTool(name: string, args?: Record<string, unknown>, options?: CallOptions): Promise<unknown>;
}

export interface DashboardQuery {
  /** YYYY-MM, defaults to the current UTC month. */
  month?: string;
  page?: number;
  fresh?: boolean;
}

export interface PositionSizeInput {
  symbol: string;
  accountBalance: number;
  riskPercent: number;
  entryPrice: number;
  stopPrice: number;
}

const ACCOUNT_STATUSES: ExecutionAccountStatus[] = ["active", "inactive", "breached"];
const ACCOUNT_TABS: Array<{ tab: "forex" | "futures"; platform: ExecutionPlatform }> = [
  { tab: "forex", platform: "cfd" },
  { tab: "futures", platform: "futures" },
];
const FUTURES_TRADES_PER_PAGE = 10;

function failureMessage(error: unknown): string {
  return error instanceof FundedNextError ? error.message : "Unexpected error while reading FundedNext.";
}

async function section<T>(run: () => Promise<T | null>): Promise<Section<T>> {
  try {
    const data = await run();
    if (data === null) return { status: "unavailable", data: null, message: "FundedNext returned an unexpected format." };
    return { status: "ok", data, message: null };
  } catch (error) {
    return { status: "unavailable", data: null, message: failureMessage(error) };
  }
}

export function currentMonth(now: Date = new Date()): string {
  return now.toISOString().slice(0, 7);
}

export class ExecutionService {
  constructor(private readonly tools: ToolCaller) {}

  /** All accounts (active, inactive, breached; CFD + Futures). Partial failures are tolerated, a total failure throws. */
  async listAccounts(fresh = false): Promise<ExecutionAccount[]> {
    const jobs = ACCOUNT_TABS.flatMap(({ tab, platform }) =>
      ACCOUNT_STATUSES.map(async (status) => {
        const raw = await this.tools.callTool("get_accounts", { type: status, tab, limit: 50 }, { fresh });
        return normalizeAccountList(raw, platform, status);
      }),
    );
    const settled = await Promise.allSettled(jobs);
    const fulfilled = settled.filter((result): result is PromiseFulfilledResult<ExecutionAccount[]> => result.status === "fulfilled");
    if (fulfilled.length === 0) {
      const first = settled.find((result): result is PromiseRejectedResult => result.status === "rejected");
      throw first?.reason ?? new FundedNextError("BAD_RESPONSE", "No account list could be read.");
    }
    return fulfilled
      .flatMap((result) => result.value)
      .sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));
  }

  async getDashboard(accountId: number, query: DashboardQuery = {}): Promise<ExecutionDashboard | null> {
    const fresh = query.fresh === true;
    const account = (await this.listAccounts(fresh)).find((candidate) => candidate.id === accountId);
    if (!account) return null;

    const call = (name: string, args: Record<string, unknown>) => this.tools.callTool(name, args, { fresh });
    const id = { account_id: account.id };
    const month = query.month ?? currentMonth();
    const page = query.page ?? 1;
    const isFutures = account.platform === "futures";

    const [overview, stats, running, history, calendar, symbols, breaches, rules] = await Promise.all([
      section(async () => normalizeOverview(await call("get_account_overview", id))),
      section(async () => normalizeStats(await call("get_trading_overview", { ...id, type: "stats" }))),
      section(async () => normalizeRunning(await call("get_running_trades", id))),
      section(async () => normalizeTradesPage(
        isFutures
          ? await call("get_futures_trade_history", { ...id, page, per_page: FUTURES_TRADES_PER_PAGE })
          : await call("get_trading_history", { ...id, page }),
      )),
      section(async () => normalizeCalendar(await call("get_trading_calendar_month", { ...id, month }))),
      section(async () => normalizeSymbols(await call("get_trading_overview", { ...id, type: "symbol-performance" }))),
      account.status === "breached"
        ? section(async () => normalizeBreaches(await call("get_rule_breach_history", { id: account.id })))
        : Promise.resolve(null),
      isFutures ? section(async () => normalizeRules(await call("get_account_applicable_rules", id))) : Promise.resolve(null),
    ]);

    return { account, fetchedAt: new Date().toISOString(), overview, stats, running, history, calendar, symbols, breaches, rules };
  }

  async positionSize(input: PositionSizeInput): Promise<PositionSizeDto | null> {
    const raw = await this.tools.callTool("position_size_calculator", {
      symbol: input.symbol,
      account_balance: input.accountBalance,
      risk_percentage: input.riskPercent,
      entry_price: input.entryPrice,
      stop_loss_price: input.stopPrice,
    });
    return normalizePositionSize(raw);
  }
}
