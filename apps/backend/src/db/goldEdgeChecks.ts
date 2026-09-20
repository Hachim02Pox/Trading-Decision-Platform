import { randomUUID } from "node:crypto";
import type { Pool } from "pg";
import { getPool } from "./pool";

export type EdgeCheckJobStatus = "QUEUED" | "RUNNING" | "COMPLETED" | "FAILED";
export interface EdgeCheckRow { id: string; requestId: string; baseRunId: string; baseContentHash: string; status: EdgeCheckJobStatus; sourceWindowStart: Date | null; sourceWindowEnd: Date | null; result: unknown | null; errorMessage: string | null; createdAt: Date; completedAt: Date | null; }
interface DbRow { id: string; request_id: string; base_run_id: string; base_content_hash: string; status: EdgeCheckJobStatus; source_window_start: Date | null; source_window_end: Date | null; result: unknown | null; error_message: string | null; created_at: Date; completed_at: Date | null; }
const COLUMNS = "id, request_id, base_run_id, base_content_hash, status, source_window_start, source_window_end, result, error_message, created_at, completed_at";
const toRow = (row: DbRow): EdgeCheckRow => ({ id: row.id, requestId: row.request_id, baseRunId: row.base_run_id, baseContentHash: row.base_content_hash, status: row.status, sourceWindowStart: row.source_window_start, sourceWindowEnd: row.source_window_end, result: row.result, errorMessage: row.error_message, createdAt: row.created_at, completedAt: row.completed_at });
export interface CreateEdgeCheckInput { holderId: string; idempotencyKey: string; baseRunId: string; baseContentHash: string; baseInformationCutoff: string; inheritedState: Record<string, unknown>; requestPayload: Record<string, unknown>; }
export async function createOrFindEdgeCheck(input: CreateEdgeCheckInput, pool: Pool = getPool()): Promise<{ row: EdgeCheckRow; created: boolean }> {
  const existing = await pool.query<DbRow>(`select ${COLUMNS} from public.gold_edge_checks where requested_by = $1 and idempotency_key = $2 limit 1`, [input.holderId, input.idempotencyKey]);
  if (existing.rows[0]) return { row: toRow(existing.rows[0]), created: false };
  const id = randomUUID(); const requestId = randomUUID();
  const inserted = await pool.query<DbRow>(`insert into public.gold_edge_checks (id, request_id, requested_by, idempotency_key, base_run_id, base_content_hash, base_information_cutoff, inherited_state, status, request_payload) values ($1,$2,$3,$4,$5,$6,$7,$8,'QUEUED',$9) returning ${COLUMNS}`, [id, requestId, input.holderId, input.idempotencyKey, input.baseRunId, input.baseContentHash, input.baseInformationCutoff, JSON.stringify(input.inheritedState), JSON.stringify(input.requestPayload)]);
  return { row: toRow(inserted.rows[0]), created: true };
}
export async function findEdgeCheck(id: string, pool: Pool = getPool()): Promise<EdgeCheckRow | null> { const result = await pool.query<DbRow>(`select ${COLUMNS} from public.gold_edge_checks where id = $1`, [id]); return result.rows[0] ? toRow(result.rows[0]) : null; }
export async function findLatestEdgeCheck(baseRunId: string, pool: Pool = getPool()): Promise<EdgeCheckRow | null> { const result = await pool.query<DbRow>(`select ${COLUMNS} from public.gold_edge_checks where base_run_id = $1 order by created_at desc limit 1`, [baseRunId]); return result.rows[0] ? toRow(result.rows[0]) : null; }
