import { createHash } from "node:crypto";
import { findGoldStateByRunId } from "../db/goldMarketStates";
import { claimNextEdgeCheck, completeEdgeCheck, createOrFindEdgeCheck, failEdgeCheck, findEdgeCheck, findLatestEdgeCheck, renewEdgeCheckLease, type EdgeCheckRow } from "../db/goldEdgeChecks";
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
  const created = await createOrFindEdgeCheck({ holderId, idempotencyKey, baseRunId: state.runId, baseContentHash: state.contentHash, baseInformationCutoff: state.evidenceCutoffEnd, inheritedState: { ...direction, opportunity_quality: baseRead.opportunity_quality, execution_readiness: baseRead.execution_readiness, invalidations: baseRead.invalidations, catalysts: baseRead.catalysts, unknowns: baseRead.unknowns, source_window_start: windowStart }, requestPayload: request, sourceWindowStart: windowStart });
  if (created.created) lastRequestedAt.set(holderId, now);
  return created;
}
export async function getEdgeCheck(id: string): Promise<EdgeCheckRow | null> { return findEdgeCheck(id); }
export async function getLatestEdgeCheck(baseRunId: string): Promise<EdgeCheckRow | null> { return findLatestEdgeCheck(baseRunId); }
export function edgeCheckResponse(row: EdgeCheckRow): Record<string, unknown> { return { check_id: row.id, request_id: row.requestId, base_run_id: row.baseRunId, status: row.status, source_window_start: row.sourceWindowStart?.toISOString() ?? null, source_window_end: row.sourceWindowEnd?.toISOString() ?? null, result: row.result, error: row.errorMessage ? { code: "EDGE_CHECK_FAILED", message: "The edge check could not be completed." } : null, created_at: row.createdAt.toISOString(), completed_at: row.completedAt?.toISOString() ?? null }; }

const resultKeys = new Set(["document_type","frontend_eligible","check_id","request_id","base_run_id","base_content_hash","started_at","completed_at","source_window_start","source_window_end","inherited_edge","result","material_change_detected","materiality_explanation","thesis_components_tested","triggered_invalidations","new_material_facts","non_material_items_ignored","critical_unknowns","sources","full_intermediate_recap_required","expires_when_base_state_changes"]);
function date(value: unknown): number | null { return typeof value === "string" && !Number.isNaN(Date.parse(value)) ? Date.parse(value) : null; }
export function validateRunnerResult(job: EdgeCheckRow, value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new EdgeCheckError("INVALID_RESULT", "Result must be an object.");
  const result = value as Record<string, unknown>;
  if (Object.keys(result).some((key) => !resultKeys.has(key))) throw new EdgeCheckError("INVALID_RESULT", "Result contains unsupported fields.");
  const required = [...resultKeys]; if (required.some((key) => !(key in result))) throw new EdgeCheckError("INVALID_RESULT", "Result is incomplete.");
  if (result.document_type !== "GOLD_EDGE_CHECK_RESULT" || result.frontend_eligible !== true || result.expires_when_base_state_changes !== true) throw new EdgeCheckError("INVALID_RESULT", "Result contract mismatch.");
  if (result.check_id !== job.id || result.request_id !== job.requestId || result.base_run_id !== job.baseRunId || result.base_content_hash !== job.baseContentHash) throw new EdgeCheckError("RESULT_LINEAGE_MISMATCH", "Result does not match the claimed job.");
  if (!["EDGE_UNCHANGED","EDGE_INVALIDATED","REASSESSMENT_REQUIRED"].includes(String(result.result))) throw new EdgeCheckError("INVALID_RESULT", "Unsupported conclusion.");
  if (typeof result.material_change_detected !== "boolean" || typeof result.materiality_explanation !== "string" || !result.materiality_explanation.trim()) throw new EdgeCheckError("INVALID_RESULT", "Materiality fields are invalid.");
  if (result.result === "EDGE_INVALIDATED" && result.material_change_detected !== true) throw new EdgeCheckError("INVALID_RESULT", "Invalidated edge requires a material change.");
  if (result.result === "EDGE_UNCHANGED" && (result.material_change_detected !== false || result.full_intermediate_recap_required !== false)) throw new EdgeCheckError("INVALID_RESULT", "Unchanged edge contract mismatch.");
  for (const key of ["thesis_components_tested","triggered_invalidations","new_material_facts","non_material_items_ignored","critical_unknowns","sources"]) if (!Array.isArray(result[key])) throw new EdgeCheckError("INVALID_RESULT", "Result arrays are invalid.");
  const start=date(result.started_at), end=date(result.completed_at), sourceStart=date(result.source_window_start), sourceEnd=date(result.source_window_end);
  if (start===null || end===null || sourceStart===null || sourceEnd===null || start>end || sourceStart>sourceEnd || sourceStart < (job.sourceWindowStart ?? job.baseInformationCutoff).getTime()) throw new EdgeCheckError("INVALID_RESULT_CHRONOLOGY", "Result chronology is invalid.");
  if (result.inherited_edge !== (job.inheritedState.edge ?? result.inherited_edge)) throw new EdgeCheckError("RESULT_LINEAGE_MISMATCH", "Inherited edge does not match the base state.");
  return result;
}
export function runnerPayload(row: EdgeCheckRow): Record<string, unknown> { return { check_id: row.id, request_id: row.requestId, base_run_id: row.baseRunId, requested_at: row.createdAt.toISOString(), base_information_cutoff: row.baseInformationCutoff.toISOString(), source_window_start: row.sourceWindowStart?.toISOString() ?? row.baseInformationCutoff.toISOString(), inherited_state: row.inheritedState, request_contract: row.requestPayload, output_contract: "GOLD_EDGE_CHECK_RESULT", lineage: { base_content_hash: row.baseContentHash, idempotency: "repeat an identical result only" } }; }
export async function claimForRunner(workerId: string, leaseSeconds: number): Promise<EdgeCheckRow | null> { return claimNextEdgeCheck(workerId, leaseSeconds); }
export async function renewForRunner(id: string, workerId: string, leaseSeconds: number): Promise<EdgeCheckRow | null> { return renewEdgeCheckLease(id, workerId, leaseSeconds); }
export async function submitForRunner(id: string, workerId: string, value: unknown): Promise<EdgeCheckRow> { const job=await findEdgeCheck(id); if (!job) throw new EdgeCheckError("EDGE_CHECK_NOT_FOUND", "Job not found."); if (job.status === "COMPLETED") { const validated=validateRunnerResult(job,value); if (JSON.stringify(job.result) === JSON.stringify(validated)) return job; throw new EdgeCheckError("CONFLICTING_RESULT", "A different result already exists."); } const result=validateRunnerResult(job,value); const completed=await completeEdgeCheck(id,workerId,result); if (!completed) throw new EdgeCheckError("ILLEGAL_TRANSITION", "Job is not held by this worker."); return completed; }
export async function failForRunner(id:string,workerId:string,code:string,message:string):Promise<EdgeCheckRow>{if(!/^[A-Z_]{3,64}$/.test(code)||!/^.{1,300}$/.test(message))throw new EdgeCheckError("INVALID_FAILURE","Failure is invalid.");const failed=await failEdgeCheck(id,workerId,code,message);if(!failed)throw new EdgeCheckError("ILLEGAL_TRANSITION","Job is not held by this worker.");return failed;}
