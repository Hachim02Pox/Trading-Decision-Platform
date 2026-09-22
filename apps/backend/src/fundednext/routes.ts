// /api/execution/* — read-only FundedNext account data for the Execution tab.
//
// Access control (fail closed): the FundedNext key is ONE trader's personal
// key held in the backend env, while the terminal has several signed-in
// holders. So every route requires a valid holder session AND that holder's
// email to equal FUNDEDNEXT_OWNER_EMAIL; anyone else gets 403. This is the same
// class of bug as the journal leak fixed on 2026-09-20 (docs/JOURNAL_FEATURE.md).

import { Router, type NextFunction, type Request, type RequestHandler, type Response } from "express";
import { FundedNextError } from "./mcpClient";
import { currentMonth, type ExecutionService } from "./service";
import { listTradeAnnotations, TRADE_REASON_VALUES, upsertTradeAnnotation, type TradeReason } from "../db/executionTradeAnnotations";

const MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;
const SYMBOL_PATTERN = /^[A-Za-z0-9._-]{2,20}$/;
const MAX_PAGE = 500;
const TRADE_ID_PATTERN = /^[A-Za-z0-9._:-]{1,160}$/;

export interface ExecutionRouterDeps {
  /** `null` when FUNDEDNEXT_API_KEY is not configured. */
  service: ExecutionService | null;
  ownerEmail: string;
  requireHolder: RequestHandler;
}

function sendError(res: Response, status: number, code: string, message: string): void {
  res.status(status).json({ error: { code, message } });
}

function ownerOnly(ownerEmail: string): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.holder?.email?.toLowerCase() !== ownerEmail.toLowerCase()) {
      sendError(res, 403, "NOT_OWNER", "This section is restricted to the account owner.");
      return;
    }
    next();
  };
}

function handleUpstreamError(res: Response, error: unknown): void {
  if (error instanceof FundedNextError) {
    const status = error.code === "UPSTREAM_TIMEOUT" ? 504 : 502;
    sendError(res, status, error.code, error.message);
    return;
  }
  sendError(res, 500, "EXECUTION_FAILED", "Could not read FundedNext data.");
}

function queryString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function positiveNumber(value: unknown): number | null {
  const parsed = Number(queryString(value));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

export function createExecutionRouter(deps: ExecutionRouterDeps): Router {
  const router = Router();
  const { service } = deps;

  router.use(deps.requireHolder);
  router.use((_req, res, next) => {
    if (!service) {
      sendError(res, 503, "FUNDEDNEXT_NOT_CONFIGURED", "FUNDEDNEXT_API_KEY is not set on the backend.");
      return;
    }
    next();
  });
  router.use(ownerOnly(deps.ownerEmail));

  router.get("/accounts", async (req, res) => {
    try {
      const accounts = await service!.listAccounts(queryString(req.query.refresh) === "1");
      res.json({ accounts, fetchedAt: new Date().toISOString() });
    } catch (error) {
      handleUpstreamError(res, error);
    }
  });

  router.get("/accounts/:id/dashboard", async (req, res) => {
    const accountId = Number(req.params.id);
    if (!Number.isInteger(accountId) || accountId <= 0) {
      sendError(res, 400, "INVALID_ACCOUNT_ID", "Invalid account id.");
      return;
    }
    const month = queryString(req.query.month) ?? currentMonth();
    if (!MONTH_PATTERN.test(month)) {
      sendError(res, 400, "INVALID_MONTH", "month must be YYYY-MM.");
      return;
    }
    const pageRaw = queryString(req.query.page);
    const page = pageRaw === undefined ? 1 : Number(pageRaw);
    if (!Number.isInteger(page) || page < 1 || page > MAX_PAGE) {
      sendError(res, 400, "INVALID_PAGE", `page must be an integer between 1 and ${MAX_PAGE}.`);
      return;
    }
    try {
      const dashboard = await service!.getDashboard(accountId, { month, page, fresh: queryString(req.query.refresh) === "1" });
      if (!dashboard) {
        sendError(res, 404, "ACCOUNT_NOT_FOUND", "No FundedNext account with this id.");
        return;
      }
      res.json(dashboard);
    } catch (error) {
      handleUpstreamError(res, error);
    }
  });

  // Personal context is deliberately separate from FundedNext's facts. It is
  // scoped to the authenticated holder and can never create/modify an order.
  router.get("/accounts/:id/trade-annotations", async (req, res) => {
    const accountId = Number(req.params.id);
    if (!Number.isInteger(accountId) || accountId <= 0) {
      sendError(res, 400, "INVALID_ACCOUNT_ID", "Invalid account id.");
      return;
    }
    try {
      const annotations = await listTradeAnnotations(req.holder!.id, accountId);
      res.json({ annotations });
    } catch {
      sendError(res, 503, "ANNOTATIONS_UNAVAILABLE", "Could not load trade follow-ups.");
    }
  });

  router.put("/accounts/:id/trades/:tradeId/annotation", async (req, res) => {
    const accountId = Number(req.params.id);
    const tradeId = typeof req.params.tradeId === "string" ? req.params.tradeId : "";
    const reason = typeof req.body?.reason === "string" ? req.body.reason : "";
    if (!Number.isInteger(accountId) || accountId <= 0 || !TRADE_ID_PATTERN.test(tradeId)) {
      sendError(res, 400, "INVALID_TRADE", "Invalid account or trade id.");
      return;
    }
    if (!(TRADE_REASON_VALUES as readonly string[]).includes(reason)) {
      sendError(res, 400, "INVALID_REASON", "Invalid trade reason.");
      return;
    }
    try {
      const annotation = await upsertTradeAnnotation({ holderId: req.holder!.id, accountId, tradeId, reason: reason as TradeReason });
      res.json({ annotation });
    } catch {
      sendError(res, 503, "ANNOTATIONS_UNAVAILABLE", "Could not save trade follow-up.");
    }
  });

  router.get("/position-size", async (req, res) => {
    const symbol = queryString(req.query.symbol) ?? "";
    const accountBalance = positiveNumber(req.query.balance);
    const riskPercent = positiveNumber(req.query.riskPercent);
    const entryPrice = positiveNumber(req.query.entry);
    const stopPrice = positiveNumber(req.query.stop);
    if (!SYMBOL_PATTERN.test(symbol) || accountBalance === null || riskPercent === null || riskPercent > 100 || entryPrice === null || stopPrice === null || entryPrice === stopPrice) {
      sendError(res, 400, "INVALID_INPUT", "symbol, balance, riskPercent (0-100], entry and stop (different) are required.");
      return;
    }
    try {
      const result = await service!.positionSize({ symbol, accountBalance, riskPercent, entryPrice, stopPrice });
      if (!result) {
        sendError(res, 502, "BAD_RESPONSE", "FundedNext returned an unexpected format.");
        return;
      }
      res.json({ result });
    } catch (error) {
      handleUpstreamError(res, error);
    }
  });

  return router;
}
