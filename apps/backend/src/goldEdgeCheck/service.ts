import { createHash } from "node:crypto";
import { findGoldStateByRunId } from "../db/goldMarketStates";
import { createOrFindEdgeCheck, findEdgeCheck, findLatestEdgeCheck, type EdgeCheckRow } from "../db/goldEdgeChecks";
import { getCurrentGoldRead } from "../goldMarketState/store";

const RATE_WINDOW_MS = 60_000;
const lastRequestedAt = new Map<string, number>();
export class EdgeCheckError extends Error { constructor(public readonly code: string, message: string) { super(message); } }
function isDirectionState(value: unknown): value is Record<string, string> { return !!value && typeof value === "object"; }
function sha256(value: unknown): string { return createHash("sha256").update(JSON.stringify(value)).digest("hex"); }
export async function requestEdgeCheck(holderId: string, idempotencyKey: string): Promise<{ row: EdgeCheckRow; created: boolean }> {
  if (!/^[A-Za-z0-9._:-]{16,200}$/.test(idempotencyKey)) throw new EdgeCheckError("INVALID_IDEMPOTENCY_KEY", "idempotency_key is invalid.");
  const now = Date.now(); const last = lastRequestedAt.get(holderId);
  if (last && now - last < RATE_WINDOW_MS) throw new EdgeCheckError("EDGE_CHECK_RATE_LIMITED", "Please wait before starting another edge check.");
  const { envelope } = await getCurrentGoldRead();
  if (!envelope) throw new EdgeCheckError("GOLD_READ_NOT_FOUND", "No validated Gold market state is available.");
  const state = await findGoldStateByRunId(envelope.meta.run_id);
  if (!state || state.status !== "PUBLISHED" || !state.contentHash || !state.evidenceCutoffEnd) throw new EdgeCheckError("INVALID_BASE_STATE", "The current Gold market state cannot be used for an edge check.");
  const direction = envelope.run.direction_state;
  if (!isDirectionState(direction) || !direction.macro_direction || !direction.directional_asymmetry || !direction.positioning_asymmetry || !direction.edge) throw new EdgeCheckError("INVALID_BASE_STATE", "The current Gold market state is missing inherited edge fields.");
  const prior = await findLatestEdgeCheck(state.runId);
  const windowStart = prior?.status === "COMPLETED" && prior.sourceWindowEnd ? prior.sourceWindowEnd.toISOString() : state.evidenceCutoffEnd;
  const request = { document_type: "GOLD_EDGE_CHECK_REQUEST", request_id: "generated-server-side", requested_at: new Date().toISOString(), requested_by: holderId, base_run_id: state.runId, base_content_hash: state.contentHash, base_information_cutoff: state.evidenceCutoffEnd, inherited_direction: direction.macro_direction, inherited_directional_asymmetry: direction.directional_asymmetry, inherited_positioning_asymmetry: direction.positioning_asymmetry, inherited_edge: direction.edge, status: "QUEUED", idempotency_key: idempotencyKey, frontend_eligible: false };
  const baseRead = envelope.run as unknown as Record<string, unknown>;
  const created = await createOrFindEdgeCheck({ holderId, idempotencyKey, baseRunId: state.runId, baseContentHash: state.contentHash, baseInformationCutoff: state.evidenceCutoffEnd, inheritedState: { ...direction, opportunity_quality: baseRead.opportunity_quality, execution_readiness: baseRead.execution_readiness, invalidations: baseRead.invalidations, catalysts: baseRead.catalysts, unknowns: baseRead.unknowns, source_window_start: windowStart }, requestPayload: request });
  if (created.created) lastRequestedAt.set(holderId, now);
  return created;
}
export async function getEdgeCheck(id: string): Promise<EdgeCheckRow | null> { return findEdgeCheck(id); }
export async function getLatestEdgeCheck(baseRunId: string): Promise<EdgeCheckRow | null> { return findLatestEdgeCheck(baseRunId); }
export function edgeCheckResponse(row: EdgeCheckRow): Record<string, unknown> { return { check_id: row.id, request_id: row.requestId, base_run_id: row.baseRunId, status: row.status, source_window_start: row.sourceWindowStart?.toISOString() ?? null, source_window_end: row.sourceWindowEnd?.toISOString() ?? null, result: row.result, error: row.errorMessage ? { code: "EDGE_CHECK_FAILED", message: "The edge check could not be completed." } : null, created_at: row.createdAt.toISOString(), completed_at: row.completedAt?.toISOString() ?? null }; }
