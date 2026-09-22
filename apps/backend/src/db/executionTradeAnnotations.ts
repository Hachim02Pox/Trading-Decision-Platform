import type { Pool } from "pg";
import { getPool } from "./pool";

export const TRADE_REASON_VALUES = ["TECHNICAL", "MACRO", "NEWS", "FLOW", "RISK", "OTHER"] as const;
export type TradeReason = (typeof TRADE_REASON_VALUES)[number];

export interface TradeAnnotation {
  accountId: number;
  tradeId: string;
  reason: TradeReason;
  createdAt: Date;
  updatedAt: Date;
}

interface TradeAnnotationRow {
  fundednext_account_id: number;
  fundednext_trade_id: string;
  reason: TradeReason;
  created_at: Date;
  updated_at: Date;
}

function toAnnotation(row: TradeAnnotationRow): TradeAnnotation {
  return { accountId: row.fundednext_account_id, tradeId: row.fundednext_trade_id, reason: row.reason, createdAt: row.created_at, updatedAt: row.updated_at };
}

export async function listTradeAnnotations(holderId: string, accountId: number, pool: Pool = getPool()): Promise<TradeAnnotation[]> {
  const result = await pool.query<TradeAnnotationRow>(
    `select fundednext_account_id, fundednext_trade_id, reason, created_at, updated_at
     from public.execution_trade_annotations
     where holder_id = $1 and fundednext_account_id = $2`,
    [holderId, accountId],
  );
  return result.rows.map(toAnnotation);
}

export async function upsertTradeAnnotation(input: { holderId: string; accountId: number; tradeId: string; reason: TradeReason }, pool: Pool = getPool()): Promise<TradeAnnotation> {
  const result = await pool.query<TradeAnnotationRow>(
    `insert into public.execution_trade_annotations (holder_id, fundednext_account_id, fundednext_trade_id, reason)
     values ($1, $2, $3, $4)
     on conflict (holder_id, fundednext_account_id, fundednext_trade_id)
     do update set reason = excluded.reason, updated_at = now()
     returning fundednext_account_id, fundednext_trade_id, reason, created_at, updated_at`,
    [input.holderId, input.accountId, input.tradeId, input.reason],
  );
  return toAnnotation(result.rows[0]!);
}
