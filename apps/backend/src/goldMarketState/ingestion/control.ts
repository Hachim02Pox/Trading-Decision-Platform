import { canonicalSha256, type GoldEditorialV6 } from "../v6";

export interface ControlFile { id: string; name: string; modifiedTime: string; }
export interface ControlReader {
  listRunRecords: () => Promise<ControlFile[]>;
  downloadText: (fileId: string) => Promise<string>;
  /** The exact, current Control-plane handoff; it is never inferred from Output. */
  readCurrentHandoff: () => Promise<unknown>;
}

const object = (value: unknown): value is Record<string, any> => typeof value === "object" && value !== null && !Array.isArray(value);
const nonEmpty = (value: unknown): value is string => typeof value === "string" && value.trim().length > 0;
const sha = (value: unknown): value is string => typeof value === "string" && /^[a-f0-9]{64}$/i.test(value);

/** Validates only a sealed Control receipt. It deliberately has no fallback:
 * an unavailable, malformed or renewed handoff is a publication refusal. */
export function validateV6PublicationSeal(state: GoldEditorialV6, receipt: unknown, handoff: unknown): string[] {
  const errors: string[] = [];
  if (!object(receipt) || receipt.document_type !== "GOLD_RUN_COMPLETION_RECORD" || receipt.frontend_eligible !== false || receipt.storage_plane !== "CONTROL") return ["CONTROL_RECEIPT_INVALID"];
  if (receipt.run_id !== state.meta.run_id || receipt.origin_sunday_run_id !== state.meta.origin_sunday_run_id || receipt.parent_run_id !== state.meta.parent_run_id) errors.push("CONTROL_RECEIPT_LINEAGE_MISMATCH");
  if (!object(receipt.market_state) || receipt.market_state.run_id !== state.meta.run_id || receipt.market_state.content_sha256 !== canonicalSha256(state)) errors.push("CONTROL_RECEIPT_MARKET_STATE_HASH_MISMATCH");
  const roles = new Set(["MARKET_STATE_JSON", "HUMAN_REPORT", "VALIDATION_REPORT", "RUN_REPORT"]);
  const files = receipt.market_state?.published_files;
  if (!Array.isArray(files) || files.length !== 4 || files.some((file: any) => !object(file) || !roles.delete(file.role) || !sha(file.content_sha256) || file.readback_verified !== true)) errors.push("CONTROL_RECEIPT_DELIVERABLES_UNSEALED");
  for (const phase of ["market_state_validation", "drive_readback", "handoff_generation", "handoff_validation"]) if (!object(receipt.phases?.[phase]) || receipt.phases[phase].status !== "COMPLETE") errors.push(`CONTROL_PHASE_${phase}_INCOMPLETE`);
  if (!object(receipt.handoff) || receipt.handoff.created_by_run_id !== state.meta.run_id || receipt.handoff.parent_state_run_id !== state.meta.run_id || receipt.handoff.origin_sunday_run_id !== state.meta.origin_sunday_run_id || receipt.handoff.post_write_parse_valid !== true) errors.push("CONTROL_RECEIPT_HANDOFF_UNSEALED");
  const currentHandoff = object(handoff) ? handoff : null;
  if (!currentHandoff || currentHandoff.handoff_id !== receipt.handoff?.handoff_id || currentHandoff.handoff_version !== receipt.handoff?.handoff_version || currentHandoff.created_by_run_id !== state.meta.run_id) errors.push("CONTROL_CURRENT_HANDOFF_MISMATCH");
  if (state.meta.run_type === "INTERMEDIATE") {
    const consumed = state.consumed_handoff;
    if (!consumed || !nonEmpty(consumed.handoff_id) || !sha(consumed.content_sha256) || currentHandoff?.handoff_id === consumed.handoff_id) errors.push("CONTROL_CONSUMED_HANDOFF_INVALID");
  }
  return [...new Set(errors)];
}

export async function findV6PublicationSeal(reader: ControlReader, state: GoldEditorialV6): Promise<string[]> {
  let files: ControlFile[]; let handoff: unknown;
  try { [files, handoff] = await Promise.all([reader.listRunRecords(), reader.readCurrentHandoff()]); } catch { return ["CONTROL_UNAVAILABLE"]; }
  const matching = files.filter((file) => file.name.includes(state.meta.run_id));
  if (matching.length !== 1) return ["CONTROL_RECEIPT_NOT_FOUND"];
  try { return validateV6PublicationSeal(state, JSON.parse(await reader.downloadText(matching[0].id)), handoff); } catch { return ["CONTROL_RECEIPT_UNREADABLE"]; }
}
