import Ajv2020 from "ajv/dist/2020";
import addFormats from "ajv-formats";
import { createHash } from "node:crypto";
import receiptSchema from "../schemas/runCompletionRecord.schema.json";
import handoffSchema from "../schemas/nextGoldRecap.schema.json";
import { canonicalSha256, type GoldEditorialV6 } from "../v6";

export interface ControlFile { id: string; name: string; modifiedTime: string; }
export interface ControlReader {
  listRunRecords: () => Promise<ControlFile[]>;
  downloadText: (fileId: string) => Promise<string>;
  /** Operational handoff; never substituted for historical evidence. */
  readCurrentHandoff: () => Promise<unknown>;
  findHandoffSnapshot?: (identity: { handoff_id: string; handoff_version: number; content_sha256: string }) => Promise<unknown | null>;
}

const object = (value: unknown): value is Record<string, any> => typeof value === "object" && value !== null && !Array.isArray(value);
const time = (value: unknown): number => typeof value === "string" ? Date.parse(value) : NaN;
const ajv = new Ajv2020({ strict: false, allErrors: true });
addFormats(ajv);
const validReceipt = ajv.compile<Record<string, any>>(receiptSchema);
const validHandoff = ajv.compile<Record<string, any>>(handoffSchema);
const phases = ["market_state_validation", "drive_readback", "handoff_generation", "handoff_validation"] as const;

/** Pinned Brain completionRecordProblems: the immutable receipt attests order.
 * A historical run does not depend on a subsequently renewed live handoff. */
export function validateV6PublicationSeal(state: GoldEditorialV6, receipt: unknown, _legacyCurrentHandoff?: unknown): string[] {
  if (!object(receipt) || receipt.document_type !== "GOLD_RUN_COMPLETION_RECORD" || receipt.frontend_eligible !== false || receipt.storage_plane !== "CONTROL") return ["CONTROL_RECEIPT_INVALID"];
  if (!validReceipt(receipt)) return ["CONTROL_RECEIPT_SCHEMA_INVALID"];
  const errors: string[] = [];
  for (const key of ["run_id", "run_type", "origin_sunday_run_id", "parent_run_id"] as const)
    if (receipt[key] !== state.meta[key]) errors.push("CONTROL_RECEIPT_LINEAGE_MISMATCH");
  if (receipt.market_state.run_id !== state.meta.run_id || receipt.market_state.content_sha256 !== canonicalSha256(state)) errors.push("CONTROL_RECEIPT_MARKET_STATE_HASH_MISMATCH");
  const roles = ["MARKET_STATE_JSON", "HUMAN_REPORT", "VALIDATION_REPORT", "RUN_REPORT"];
  const files = receipt.market_state.published_files as Array<Record<string, any>>;
  if (files.length !== 4 || roles.some((role) => files.filter((file) => file.role === role).length !== 1)) errors.push("CONTROL_RECEIPT_DELIVERABLES_UNSEALED");
  if (files.find((file) => file.role === "MARKET_STATE_JSON")?.content_sha256 !== receipt.market_state.content_sha256) errors.push("CONTROL_RECEIPT_JSON_READBACK_HASH_MISMATCH");
  let previousEnd = -Infinity;
  for (const id of phases) {
    const phase = receipt.phases[id];
    const start = time(phase?.started_at); const end = time(phase?.completed_at);
    if (phase?.status !== "COMPLETE" || !Number.isFinite(start) || !Number.isFinite(end) || end < start || start < previousEnd) errors.push("CONTROL_PHASE_" + id + "_INCOMPLETE_OR_UNORDERED");
    previousEnd = end;
  }
  const readback = receipt.phases.drive_readback;
  for (const file of files) {
    const upload = time(file.uploaded_at); const back = time(file.readback_at);
    if (/NEXT_GOLD_RECAP|RUN_COMPLETION_RECORD|HANDOFF/i.test(file.name) || file.readback_verified !== true || upload < time(receipt.phases.market_state_validation?.completed_at) || upload < time(readback?.started_at) || back < upload || back > time(readback?.completed_at)) errors.push("CONTROL_RECEIPT_DELIVERABLES_UNSEALED");
  }
  const h = receipt.handoff; const generation = receipt.phases.handoff_generation;
  if (h.created_by_run_id !== state.meta.run_id || h.parent_state_run_id !== state.meta.run_id || h.origin_sunday_run_id !== state.meta.origin_sunday_run_id || h.post_write_parse_valid !== true || h.active_handoff_count_after !== 1 || h.previous_handoff_id === h.handoff_id || time(h.pre_write_readback_at) < time(generation?.started_at) || time(h.post_write_readback_at) < time(h.pre_write_readback_at) || time(h.post_write_readback_at) > time(generation?.completed_at)) errors.push("CONTROL_RECEIPT_HANDOFF_UNSEALED");
  const built = object(state.procedural_audit) ? time(state.procedural_audit.phases?.json_and_reports?.completed_at) : NaN;
  if (Number.isFinite(built) && time(receipt.phases.market_state_validation?.started_at) < built) errors.push("CONTROL_VALIDATION_BEFORE_BUILD");
  if (state.meta.run_type === "INTERMEDIATE" && (h.write_mode !== "UPDATED_IN_PLACE" || (state.format_version === "6.0" && (!state.consumed_handoff || h.handoff_id === state.consumed_handoff.handoff_id)))) errors.push("CONTROL_CONSUMED_HANDOFF_INVALID");
  return [...new Set(errors)];
}

async function readReceipt(reader: ControlReader, files: ControlFile[], runId: string): Promise<unknown | null> {
  const matching = files.filter((file) => file.name === "RUN_COMPLETION_RECORD_" + runId + ".json");
  if (matching.length !== 1) return null;
  return JSON.parse(await reader.downloadText(matching[0].id));
}

async function consumedHandoffErrors(reader: ControlReader, files: ControlFile[], state: GoldEditorialV6): Promise<string[]> {
  const consumed = state.consumed_handoff;
  if (!consumed || !reader.findHandoffSnapshot || !state.meta.parent_run_id) return ["CONTROL_CONSUMED_HANDOFF_SNAPSHOT_UNAVAILABLE"];
  const [snapshot, parentReceipt] = await Promise.all([
    reader.findHandoffSnapshot(consumed), readReceipt(reader, files, state.meta.parent_run_id),
  ]);
  if (!object(snapshot) || !validHandoff(snapshot)) return ["CONTROL_CONSUMED_HANDOFF_SNAPSHOT_INVALID"];
  if (!object(parentReceipt) || !validReceipt(parentReceipt)) return ["CONTROL_PARENT_RECEIPT_INVALID"];
  if (snapshot.handoff_id !== consumed.handoff_id || snapshot.handoff_version !== consumed.handoff_version || canonicalSha256(snapshot) !== consumed.content_sha256 || snapshot.created_by_run_id !== state.meta.parent_run_id || snapshot.parent_state_run_id !== state.meta.parent_run_id || snapshot.origin_sunday_run_id !== state.meta.origin_sunday_run_id || parentReceipt.run_id !== state.meta.parent_run_id || parentReceipt.handoff.handoff_id !== snapshot.handoff_id || parentReceipt.handoff.handoff_version !== snapshot.handoff_version) return ["CONTROL_CONSUMED_HANDOFF_SNAPSHOT_MISMATCH"];
  return [];
}

async function outputReadbackErrors(receipt: Record<string, any>, output: { files: ControlFile[]; downloadText: (id: string) => Promise<string> }): Promise<string[]> {
  for (const artifact of receipt.market_state.published_files) {
    const matches = output.files.filter((file) => file.name === artifact.name);
    if (matches.length !== 1) return ["CONTROL_OUTPUT_ARTIFACT_NOT_FOUND_OR_DUPLICATE"];
    const raw = await output.downloadText(matches[0].id);
    const hash = artifact.role === "MARKET_STATE_JSON" ? canonicalSha256(JSON.parse(raw)) : createHash("sha256").update(raw, "utf8").digest("hex");
    if (hash !== artifact.content_sha256) return ["CONTROL_OUTPUT_ARTIFACT_HASH_MISMATCH"];
  }
  return [];
}

export async function findV6PublicationSeal(reader: ControlReader, state: GoldEditorialV6, output?: { files: ControlFile[]; downloadText: (id: string) => Promise<string> }): Promise<string[]> {
  let files: ControlFile[];
  try { files = await reader.listRunRecords(); } catch { return ["CONTROL_UNAVAILABLE"]; }
  try {
    const receipt = await readReceipt(reader, files, state.meta.run_id);
    if (!receipt) return ["CONTROL_RECEIPT_NOT_FOUND"];
    const errors = validateV6PublicationSeal(state, receipt);
    if (errors.length) return errors;
    if (output) {
      const readbackErrors = await outputReadbackErrors(receipt as Record<string, any>, output);
      if (readbackErrors.length) return readbackErrors;
    }
    if (state.meta.run_type !== "INTERMEDIATE" || state.format_version !== "6.0") return [];
    return await consumedHandoffErrors(reader, files, state);
  } catch { return ["CONTROL_RECEIPT_UNREADABLE"]; }
}
