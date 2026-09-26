import { createHash } from "node:crypto";
import { loadAppConfig } from "../config/env";
import { findGoldStateByRunId } from "../db/goldMarketStates";
import { claimNextEdgeCheck, completeEdgeCheck, createOrFindEdgeCheck, failEdgeCheck, findEdgeCheck, findLatestEdgeCheck, renewEdgeCheckLease, type EdgeCheckRow } from "../db/goldEdgeChecks";
import { getCurrentGoldRead } from "../goldMarketState/store";

const RATE_WINDOW_MS = 60_000;
const lastRequestedAt = new Map<string, number>();
export class EdgeCheckError extends Error { constructor(public readonly code: string, message: string) { super(message); } }
export type ManualOptionObservation = {
  instrument: string; source: string; proof_url: string; observed_at: string; expiry: string;
  metric: "IV" | "SKEW" | "GEX"; value: number; unit: string; methodology?: string;
  gex_basis?: "ESTIMATED" | "DEALER_OBSERVED";
};

export function validateManualOptions(value: unknown): ManualOptionObservation[] {
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.length < 1 || value.length > 6) throw new EdgeCheckError("INVALID_MANUAL_OPTIONS", "Manual option observations are invalid.");
  return value.map((item): ManualOptionObservation => {
    if (!item || typeof item !== "object" || Array.isArray(item)) throw new EdgeCheckError("INVALID_MANUAL_OPTIONS", "Manual option observations are invalid.");
    const row = item as Record<string, unknown>;
    const instrument = typeof row.instrument === "string" ? row.instrument.trim().toUpperCase() : "";
    const source = typeof row.source === "string" ? row.source.trim() : "";
    const proofUrl = typeof row.proof_url === "string" ? row.proof_url.trim() : "";
    const observedAt = typeof row.observed_at === "string" ? row.observed_at : "";
    const expiry = typeof row.expiry === "string" ? row.expiry : "";
    const metric = row.metric;
    const unit = typeof row.unit === "string" ? row.unit.trim() : "";
    const methodology = typeof row.methodology === "string" && row.methodology.trim() ? row.methodology.trim() : undefined;
    const gexBasis = row.gex_basis;
    if (!/^(GC|MGC)[A-Z0-9]{1,12}$/.test(instrument) || !source || source.length > 200 || !/^https:\/\//i.test(proofUrl) || Number.isNaN(Date.parse(observedAt)) || !/^\d{4}-\d{2}-\d{2}$/.test(expiry) || !["IV", "SKEW", "GEX"].includes(String(metric)) || typeof row.value !== "number" || !Number.isFinite(row.value) || !unit || unit.length > 80 || (metric === "GEX" && !["ESTIMATED", "DEALER_OBSERVED"].includes(String(gexBasis)))) throw new EdgeCheckError("INVALID_MANUAL_OPTIONS", "Manual option observations are invalid.");
    return { instrument, source, proof_url: proofUrl, observed_at: observedAt, expiry, metric: metric as ManualOptionObservation["metric"], value: row.value, unit, ...(methodology ? { methodology } : {}), ...(metric === "GEX" ? { gex_basis: gexBasis as ManualOptionObservation["gex_basis"] } : {}) };
  });
}
export function edgeCheckAnalysisAvailable(): boolean { const providers = loadAppConfig().providers; return Boolean(providers.groq && providers.tavily); }
function isDirectionState(value: unknown): value is Record<string, string> { return !!value && typeof value === "object"; }
function sha256(value: unknown): string { return createHash("sha256").update(JSON.stringify(value)).digest("hex"); }
export async function requestEdgeCheck(holderId: string, idempotencyKey: string, manualOptions?: unknown): Promise<{ row: EdgeCheckRow; created: boolean }> {
  if (!/^[A-Za-z0-9._:-]{16,200}$/.test(idempotencyKey)) throw new EdgeCheckError("INVALID_IDEMPOTENCY_KEY", "idempotency_key is invalid.");
  const options = validateManualOptions(manualOptions);
  if (!edgeCheckAnalysisAvailable()) throw new EdgeCheckError("EDGE_CHECK_ANALYSIS_UNAVAILABLE", "The edge-check analysis worker is not configured.");
  const now = Date.now(); const last = lastRequestedAt.get(holderId);
  if (last && now - last < RATE_WINDOW_MS) throw new EdgeCheckError("EDGE_CHECK_RATE_LIMITED", "Please wait before starting another edge check.");
  const { envelope } = await getCurrentGoldRead();
  if (!envelope) throw new EdgeCheckError("GOLD_READ_NOT_FOUND", "No validated Gold market state is available.");
  const state = await findGoldStateByRunId(envelope.meta.run_id);
  if (!state || state.status !== "PUBLISHED" || !state.contentHash || !state.evidenceCutoffEnd) throw new EdgeCheckError("INVALID_BASE_STATE", "The current Gold market state cannot be used for an edge check.");
  const direction = envelope.run.direction_state;
  if (!isDirectionState(direction) || !direction.macro_direction || !direction.directional_asymmetry || !direction.positioning_asymmetry || !direction.edge) throw new EdgeCheckError("INVALID_BASE_STATE", "The current Gold market state is missing inherited edge fields.");
  const prior = await findLatestEdgeCheck(state.runId, holderId);
  const windowStart = prior?.status === "COMPLETED" && prior.sourceWindowEnd ? prior.sourceWindowEnd.toISOString() : state.evidenceCutoffEnd;
  const request = { document_type: "GOLD_EDGE_CHECK_REQUEST", request_id: "generated-server-side", requested_at: new Date().toISOString(), requested_by: holderId, base_run_id: state.runId, base_content_hash: state.contentHash, base_information_cutoff: state.evidenceCutoffEnd, inherited_direction: direction.macro_direction, inherited_directional_asymmetry: direction.directional_asymmetry, inherited_positioning_asymmetry: direction.positioning_asymmetry, inherited_edge: direction.edge, status: "QUEUED", idempotency_key: idempotencyKey, frontend_eligible: false, ...(options.length ? { manual_options: options } : {}) };
  const baseRead = envelope.run as unknown as Record<string, unknown>;
  const created = await createOrFindEdgeCheck({ holderId, idempotencyKey, baseRunId: state.runId, baseContentHash: state.contentHash, baseInformationCutoff: state.evidenceCutoffEnd, inheritedState: { ...direction, opportunity_quality: baseRead.opportunity_quality, execution_readiness: baseRead.execution_readiness, invalidations: baseRead.invalidations, catalysts: baseRead.catalysts, unknowns: baseRead.unknowns, source_window_start: windowStart }, requestPayload: request, sourceWindowStart: windowStart });
  if (created.created) lastRequestedAt.set(holderId, now);
  return created;
}
export async function getEdgeCheck(id: string, holderId: string): Promise<EdgeCheckRow | null> { return findEdgeCheck(id, holderId); }
export async function getLatestEdgeCheck(baseRunId: string, holderId: string): Promise<EdgeCheckRow | null> { return findLatestEdgeCheck(baseRunId, holderId); }
export function edgeCheckResponse(row: EdgeCheckRow): Record<string, unknown> { return { check_id: row.id, request_id: row.requestId, base_run_id: row.baseRunId, status: row.status, source_window_start: row.sourceWindowStart?.toISOString() ?? null, source_window_end: row.sourceWindowEnd?.toISOString() ?? null, manual_options: (row.requestPayload as Record<string, unknown>).manual_options ?? [], result: row.result, error: row.errorMessage ? { code: "EDGE_CHECK_FAILED", message: "The edge check could not be completed." } : null, created_at: row.createdAt.toISOString(), completed_at: row.completedAt?.toISOString() ?? null }; }

const resultKeys = new Set(["document_type","frontend_eligible","check_id","request_id","base_run_id","base_content_hash","checked_at","source_window_start","source_window_end","inherited_edge","verdict","game_changer","core_premise_affected","causal_transmission","verified_sources","ordinary_market_context","full_intermediate_recap_required","operational_decision","expires_when_base_state_changes"]);
function date(value: unknown): number | null { return typeof value === "string" && !Number.isNaN(Date.parse(value)) ? Date.parse(value) : null; }
export function validateRunnerResult(job: EdgeCheckRow, value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new EdgeCheckError("INVALID_RESULT", "Result must be an object.");
  const result = value as Record<string, unknown>;
  if (Object.keys(result).some((key) => !resultKeys.has(key))) throw new EdgeCheckError("INVALID_RESULT", "Result contains unsupported fields.");
  const required = [...resultKeys]; if (required.some((key) => !(key in result))) throw new EdgeCheckError("INVALID_RESULT", "Result is incomplete.");
  if (result.document_type !== "GOLD_EDGE_CHECK_RESULT" || result.frontend_eligible !== true || result.expires_when_base_state_changes !== true) throw new EdgeCheckError("INVALID_RESULT", "Result contract mismatch.");
  if (result.check_id !== job.id || result.request_id !== job.requestId || result.base_run_id !== job.baseRunId || result.base_content_hash !== job.baseContentHash) throw new EdgeCheckError("RESULT_LINEAGE_MISMATCH", "Result does not match the claimed job.");
  if (!["NO_GAME_CHANGER","GAME_CHANGER_DETECTED","INSUFFICIENT_EVIDENCE","FAILED"].includes(String(result.verdict))) throw new EdgeCheckError("INVALID_RESULT", "Unsupported verdict.");
  if (!Array.isArray(result.verified_sources) || typeof result.ordinary_market_context !== "string" || !result.ordinary_market_context.trim()) throw new EdgeCheckError("INVALID_RESULT", "Evidence fields are invalid.");
  const checked=date(result.checked_at), sourceStart=date(result.source_window_start), sourceEnd=date(result.source_window_end);
  if (checked===null || sourceStart===null || sourceEnd===null || sourceStart>sourceEnd || sourceStart < (job.sourceWindowStart ?? job.baseInformationCutoff).getTime()) throw new EdgeCheckError("INVALID_RESULT_CHRONOLOGY", "Result chronology is invalid.");
  if (result.inherited_edge !== (job.inheritedState.edge ?? result.inherited_edge)) throw new EdgeCheckError("RESULT_LINEAGE_MISMATCH", "Inherited edge does not match the base state.");
  const verdict=String(result.verdict), decision=String(result.operational_decision);
  if (verdict === "GAME_CHANGER_DETECTED") {
    if (!result.game_changer || typeof result.core_premise_affected !== "string" || !result.core_premise_affected.trim() || typeof result.causal_transmission !== "string" || !result.causal_transmission.trim() || !result.verified_sources.length || result.full_intermediate_recap_required !== true || decision !== "EDGE_SUSPENDED_PENDING_FULL_REVIEW") throw new EdgeCheckError("MATERIALITY_TEST_FAILED", "A game changer requires NEW, VERIFIED, CORE_PREMISE_LINK and CAUSAL_BREAK evidence.");
  }
  if (verdict === "NO_GAME_CHANGER" && (result.game_changer !== null || result.full_intermediate_recap_required !== false || decision !== "EDGE_REMAINS_VALID")) throw new EdgeCheckError("INVALID_RESULT", "No-game-changer contract mismatch.");
  if (verdict === "INSUFFICIENT_EVIDENCE" && decision !== "WAIT_FOR_CONFIRMATION") throw new EdgeCheckError("INVALID_RESULT", "Insufficient-evidence contract mismatch.");
  if (verdict === "FAILED" && decision !== "CHECK_FAILED") throw new EdgeCheckError("INVALID_RESULT", "Failed contract mismatch.");
  return result;
}
export function runnerPayload(row: EdgeCheckRow): Record<string, unknown> { return { check_id: row.id, request_id: row.requestId, base_run_id: row.baseRunId, requested_at: row.createdAt.toISOString(), base_information_cutoff: row.baseInformationCutoff.toISOString(), source_window_start: row.sourceWindowStart?.toISOString() ?? row.baseInformationCutoff.toISOString(), inherited_state: row.inheritedState, request_contract: row.requestPayload, output_contract: "GOLD_EDGE_CHECK_RESULT", lineage: { base_content_hash: row.baseContentHash, idempotency: "repeat an identical result only" } }; }
export async function claimForRunner(workerId: string, leaseSeconds: number): Promise<EdgeCheckRow | null> { return claimNextEdgeCheck(workerId, leaseSeconds); }
export async function renewForRunner(id: string, workerId: string, leaseSeconds: number): Promise<EdgeCheckRow | null> { return renewEdgeCheckLease(id, workerId, leaseSeconds); }
export async function submitForRunner(id: string, workerId: string, value: unknown): Promise<EdgeCheckRow> { const job=await findEdgeCheck(id); if (!job) throw new EdgeCheckError("EDGE_CHECK_NOT_FOUND", "Job not found."); if (job.status === "COMPLETED") { const validated=validateRunnerResult(job,value); if (JSON.stringify(job.result) === JSON.stringify(validated)) return job; throw new EdgeCheckError("CONFLICTING_RESULT", "A different result already exists."); } const result=validateRunnerResult(job,value); const completed=await completeEdgeCheck(id,workerId,result); if (!completed) throw new EdgeCheckError("ILLEGAL_TRANSITION", "Job is not held by this worker."); return completed; }
export async function failForRunner(id:string,workerId:string,code:string,message:string):Promise<EdgeCheckRow>{if(!/^[A-Z_]{3,64}$/.test(code)||!/^.{1,300}$/.test(message))throw new EdgeCheckError("INVALID_FAILURE","Failure is invalid.");const failed=await failEdgeCheck(id,workerId,code,message);if(!failed)throw new EdgeCheckError("ILLEGAL_TRANSITION","Job is not held by this worker.");return failed;}
