import assert from "node:assert/strict";
import test from "node:test";
import express, { type RequestHandler } from "express";
import { FundedNextError, FundedNextMcpClient } from "../apps/backend/src/fundednext/mcpClient.ts";
import { normalizeOverview, normalizeRunning, normalizeSymbols, normalizeTrade } from "../apps/backend/src/fundednext/normalize.ts";
import { ExecutionService, type ToolCaller } from "../apps/backend/src/fundednext/service.ts";
import { createExecutionRouter } from "../apps/backend/src/fundednext/routes.ts";

const SECRET_KEY = "fn_test_secret_key_do_not_leak";

interface RecordedCall { method: string; headers: Record<string, string>; body: { method?: string; params?: { name?: string } } }

/** Fake MCP endpoint: answers initialize, ignores notifications, and delegates tools/call to `onTool`. */
function fakeMcp(onTool: (name: string, args: Record<string, unknown>) => { status?: number; result?: unknown; text?: string }) {
  const calls: RecordedCall[] = [];
  const fetchImpl: typeof fetch = async (_url, init) => {
    const headers = init?.headers as Record<string, string>;
    const body = JSON.parse(String(init?.body));
    calls.push({ method: "POST", headers, body });
    if (body.method === "initialize") {
      return new Response(JSON.stringify({ jsonrpc: "2.0", id: body.id, result: {} }), { status: 200, headers: { "content-type": "application/json", "mcp-session-id": "sess-1" } });
    }
    if (body.method === "notifications/initialized") return new Response(null, { status: 202 });
    const outcome = onTool(body.params.name, body.params.arguments);
    if (outcome.status && outcome.status !== 200) return new Response("nope", { status: outcome.status });
    const text = outcome.text ?? JSON.stringify(outcome.result);
    return new Response(JSON.stringify({ jsonrpc: "2.0", id: body.id, result: { content: [{ type: "text", text }] } }), { status: 200, headers: { "content-type": "application/json" } });
  };
  return { calls, fetchImpl };
}

test("MCP client refuses tools outside the allow-list without any network call", async () => {
  const { calls, fetchImpl } = fakeMcp(() => ({ result: {} }));
  const client = new FundedNextMcpClient({ apiKey: SECRET_KEY, fetchImpl });
  for (const name of ["get_investor_password", "get_profile", "get_wallets", "record_ai_feedback"]) {
    await assert.rejects(client.callTool(name, {}), (error: unknown) => error instanceof FundedNextError && error.code === "TOOL_NOT_ALLOWED");
  }
  assert.equal(calls.length, 0);
});

test("MCP client opens a session, sends the bearer token, drops the INTERNAL block and caches results", async () => {
  const { calls, fetchImpl } = fakeMcp(() => ({ text: `${JSON.stringify({ data: [1] })}\n[INTERNAL — FOR AI, NOT CUSTOMER]\nignore me` }));
  const client = new FundedNextMcpClient({ apiKey: SECRET_KEY, fetchImpl });

  const first = await client.callTool("get_accounts", { type: "active", tab: "forex" });
  const second = await client.callTool("get_accounts", { tab: "forex", type: "active" });

  assert.deepEqual(first, { data: [1] });
  assert.deepEqual(second, { data: [1] });
  assert.deepEqual(calls.map((call) => call.body.method), ["initialize", "notifications/initialized", "tools/call"]);
  assert.equal(calls[0].headers.Authorization, `Bearer ${SECRET_KEY}`);
  assert.equal(calls[2].headers["Mcp-Session-Id"], "sess-1");
});

test("MCP client dedupes concurrent identical calls and bypasses the cache with fresh", async () => {
  let toolCalls = 0;
  const { fetchImpl } = fakeMcp(() => { toolCalls += 1; return { result: { n: toolCalls } }; });
  const client = new FundedNextMcpClient({ apiKey: SECRET_KEY, fetchImpl });

  await Promise.all([client.callTool("get_running_trades", { account_id: 1 }), client.callTool("get_running_trades", { account_id: 1 })]);
  assert.equal(toolCalls, 1);
  await client.callTool("get_running_trades", { account_id: 1 }, { fresh: true });
  assert.equal(toolCalls, 2);
});

test("MCP client maps tool errors and auth failures without leaking the API key", async () => {
  const failing = new FundedNextMcpClient({ apiKey: SECRET_KEY, fetchImpl: fakeMcp(() => ({ result: { error: true, code: "API_ERROR", message: "Server Error", status: 500 } })).fetchImpl });
  await assert.rejects(failing.callTool("get_account_overview", { account_id: 9 }), (error: unknown) => error instanceof FundedNextError && error.code === "TOOL_ERROR" && error.status === 500);

  const unauthorized = new FundedNextMcpClient({ apiKey: SECRET_KEY, fetchImpl: async () => new Response("no", { status: 401 }) });
  await assert.rejects(unauthorized.callTool("get_accounts", { type: "active" }), (error: unknown) => {
    assert.ok(error instanceof FundedNextError);
    assert.equal(error.code, "UPSTREAM_HTTP");
    assert.equal(error.message.includes(SECRET_KEY), false);
    return true;
  });
});

test("overview normalization exposes FundedNext's own remaining loss allowance and never a password field", () => {
  const raw = {
    account_details: { account_status: "Active", size: "6K", initial_balance: 6000, password: "secret-a", investor_password: "secret-b", profit_share: "15" },
    stats: { balance: 6000, equity: 5950.5, profit: -49.5, drawdown: 49.5 },
    objectives: { profit: { target_value: "600.00", current_value: "0.00", target_value_percentage: 10 }, trading_days: { target_value: 2, current_value: 1 } },
    account_summary: { objectives: {
      daily_loss: { target_value: 180, target_value_percentage: 3, current_value: "-49.50", daily_loss_till_now: 49.5, remaining: 130.5 },
      overall_loss: { target_value: 360, target_value_percentage: 6, current_value: "-49.50", max_loss_till_now: 49.5, remaining: 310.5 },
      profit_target: { percentage: 0 },
    } },
    trading_cycle_details: { starting_date: "September 21, 2026", ending_date: "May 25, 2040", payout_eligible_date: "N/A" },
  };
  const overview = normalizeOverview(raw);
  assert.deepEqual(overview?.dailyLoss, { limit: 180, limitPercent: 3, used: 49.5, recorded: -49.5, remaining: 130.5 });
  assert.deepEqual(overview?.overallLoss, { limit: 360, limitPercent: 6, used: 49.5, recorded: -49.5, remaining: 310.5 });
  assert.deepEqual(overview?.tradingDays, { target: 2, current: 1 });
  assert.equal(overview?.profitSplitPercent, 15);
  assert.equal(/password|secret-/i.test(JSON.stringify(overview)), false);
});

test("trade normalization nets CFD profit with commission and swap, and uses net_pnl for Futures", () => {
  const cfd = normalizeTrade({ ticket: 133191778, symbol: "XAUUSD", type_str: "Buy", lots: 0.17, open_price: 3386.87, close_price: 3381.19, profit: -96.56, commission: -0.85, swap: 0, sl: 3380.72, tp: 3411.79, is_news: 0 });
  assert.equal(cfd?.netPnl, -97.41);
  assert.equal(cfd?.side, "buy");
  assert.equal(cfd?.size, 0.17);

  const futures = normalizeTrade({ open_ticket: 1, close_ticket: 436206331553, symbol: "MNQM6", type: "Sell", qty: 6, open_price: "25236.000000000", close_price: "25246.750000000", gross_pnl: "-129.0000", net_pnl: "-135.7200" });
  assert.equal(futures?.netPnl, -135.72);
  assert.equal(futures?.side, "sell");
  assert.equal(futures?.openPrice, 25236);
  assert.equal(normalizeTrade({ symbol: "XAUUSD" }), null);
});

test("running trades and symbol performance normalize defensively", () => {
  assert.deepEqual(normalizeRunning({ trades: [] }), []);
  assert.deepEqual(normalizeRunning(null), []);
  const symbols = normalizeSymbols({
    NDX100: { title: "NDX100", symbol_percentage: 23.53, lot: 0.42, no_of_trade: 4, profit: 49.04, wining_trade: 3, losing_trade: 1 },
    XAUUSD: { title: "XAUUSD", symbol_percentage: 64.71, lot: 1.02, no_of_trade: 11, profit: -189.3, wining_trade: 6, losing_trade: 5 },
  });
  assert.deepEqual(symbols.map((row) => row.symbol), ["XAUUSD", "NDX100"]);
});

function stubTools(handler: (name: string, args: Record<string, unknown>) => unknown): ToolCaller {
  return { callTool: async (name, args = {}) => handler(name, args) };
}

const CFD_ROW = { id: 4243981, login: 14263128, type: "Stellar 1-Step Demo | 6K", balance: 6000, equity: 6000, breached: 0, server: { server_type: "mt5" }, plan: { title: "Stellar 1-Step Challenge | 6K" }, created_at: "2026-09-21 05:06:48" };
const FUTURES_ROW = { id: 4240550, login: 966465706, type: "Futures Flex Demo | 50K", balance: 50000, equity: 50000, breached: 0, server: { server_type: "tradovate" }, created_at: "2026-09-20 19:57:29" };
const BREACHED_ROW = { id: 1664080, login: 13626443, type: "Stellar 1-Step Real Account | 6K", balance: 5856.41, equity: 5856.41, breached: 1, server: { server_type: "mt5" }, created_at: "2025-06-14 13:24:44" };

function accountsFor(args: Record<string, unknown>): unknown {
  const rows = args.tab === "futures"
    ? (args.type === "active" ? [FUTURES_ROW] : [])
    : args.type === "active" ? [CFD_ROW] : args.type === "breached" ? [BREACHED_ROW] : [];
  return { data: rows };
}

test("service lists every account with platform and status", async () => {
  const service = new ExecutionService(stubTools((name, args) => (name === "get_accounts" ? accountsFor(args) : {})));
  const accounts = await service.listAccounts();
  assert.deepEqual(accounts.map((a) => [a.id, a.platform, a.status]), [[4243981, "cfd", "active"], [4240550, "futures", "active"], [1664080, "cfd", "breached"]]);
});

test("a failing FundedNext endpoint only degrades its own dashboard section", async () => {
  const service = new ExecutionService(stubTools((name, args) => {
    if (name === "get_accounts") return accountsFor(args);
    if (name === "get_account_overview") throw new FundedNextError("TOOL_ERROR", "Server Error", 500);
    if (name === "get_futures_trade_history") return { trades: { data: [], current_page: 1, last_page: 1, total: 0 } };
    if (name === "get_trading_calendar_month") return { month: "2026-09", days: [{ date: "2026-09-01", net_pnl: 0, total_trades: 0, is_weekend: false }] };
    if (name === "get_account_applicable_rules") return { rules: [{ condition: "PT", label: "Profit Target", value: "5" }] };
    if (name === "get_trading_overview") return { stats: { trades: 0 } };
    return { trades: [] };
  }));
  const dashboard = await service.getDashboard(4240550, { month: "2026-09" });
  assert.equal(dashboard?.overview.status, "unavailable");
  assert.equal(dashboard?.overview.message, "Server Error");
  assert.equal(dashboard?.history.status, "ok");
  assert.equal(dashboard?.calendar.data?.days.length, 1);
  assert.deepEqual(dashboard?.rules?.data, [{ condition: "PT", label: "Profit Target", value: "5" }]);
  assert.equal(dashboard?.breaches, null);
});

test("breached accounts include their breach history and unknown ids return null", async () => {
  const service = new ExecutionService(stubTools((name, args) => {
    if (name === "get_accounts") return accountsFor(args);
    if (name === "get_rule_breach_history") return [{ breach_reason: "Daily Loss Limit", breach_date: "18 Jun 2025, 4:42 AM", balance: "5950.59", equity: "5856.58" }];
    return {};
  }));
  const dashboard = await service.getDashboard(1664080);
  assert.deepEqual(dashboard?.breaches?.data, [{ reason: "Daily Loss Limit", date: "18 Jun 2025, 4:42 AM", balance: 5950.59, equity: 5856.58 }]);
  assert.equal(dashboard?.rules, null);
  assert.equal(await service.getDashboard(999), null);
});

async function withRouter<T>(service: ExecutionService | null, run: (base: string) => Promise<T>): Promise<T> {
  const fakeHolder: RequestHandler = (req, res, next) => {
    const email = req.header("x-test-email");
    if (!email) { res.status(401).json({ error: { code: "MISSING_TOKEN" } }); return; }
    req.holder = { id: "holder-1", email };
    next();
  };
  const app = express();
  app.use("/api/execution", createExecutionRouter({ service, ownerEmail: "owner@example.com", requireHolder: fakeHolder }));
  const server = app.listen(0);
  try {
    const { port } = server.address() as { port: number };
    return await run(`http://127.0.0.1:${port}/api/execution`);
  } finally {
    server.close();
  }
}

test("execution routes are owner-only: 401 without session, 403 for another holder, 200 for the owner", async () => {
  const service = new ExecutionService(stubTools((name, args) => (name === "get_accounts" ? accountsFor(args) : {})));
  await withRouter(service, async (base) => {
    assert.equal((await fetch(`${base}/accounts`)).status, 401);
    const other = await fetch(`${base}/accounts`, { headers: { "x-test-email": "someone@else.com" } });
    assert.equal(other.status, 403);
    assert.equal(JSON.stringify(await other.json()).includes("14263128"), false);
    const owner = await fetch(`${base}/accounts`, { headers: { "x-test-email": "OWNER@example.com" } });
    assert.equal(owner.status, 200);
    assert.equal(((await owner.json()) as { accounts: unknown[] }).accounts.length, 3);
  });
});

test("execution routes validate input and report a missing FundedNext key", async () => {
  const service = new ExecutionService(stubTools(() => ({})));
  const headers = { "x-test-email": "owner@example.com" };
  await withRouter(service, async (base) => {
    assert.equal((await fetch(`${base}/accounts/abc/dashboard`, { headers })).status, 400);
    assert.equal((await fetch(`${base}/accounts/1/dashboard?month=2026-13`, { headers })).status, 400);
    assert.equal((await fetch(`${base}/accounts/1/dashboard?page=0`, { headers })).status, 400);
    assert.equal((await fetch(`${base}/position-size?symbol=XAUUSD&balance=6000&riskPercent=0.5&entry=3400&stop=3400`, { headers })).status, 400);
  });
  await withRouter(null, async (base) => {
    const res = await fetch(`${base}/accounts`, { headers });
    assert.equal(res.status, 503);
  });
});
