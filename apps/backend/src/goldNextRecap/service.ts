import { createHash } from "node:crypto";
import { loadAppConfig } from "../config/env";
import { downloadGoldDriveFileText } from "../goldMarketState/ingestion/driveClient";
import { listPublishedGoldStates } from "../db/goldMarketStates";

export type NextRecapStatus = "SCHEDULED" | "DUE" | "CONSUMED" | "EXPIRED" | "CANCELLED" | "INVALID" | "UNAVAILABLE";
export interface NextRecapPublic { status: NextRecapStatus; requested_at: string | null; timezone: "America/New_York"; reason: string | null; reason_fr: string | null; reason_en: string | null; minimum_confirmation_delay: { fr: string | null; en: string | null } | null; parent_state_run_id: string | null; retrieved_at: string; }

type Handoff = { document_type?: unknown; frontend_eligible?: unknown; handoff_id?: unknown; handoff_version?: unknown; parent_state_run_id?: unknown; next_execution?: { requested_at?: unknown; timezone?: unknown; reason?: unknown; reason_fr?: unknown; reason_en?: unknown; minimum_confirmation_delay?: unknown; minimum_confirmation_delay_fr?: unknown; minimum_confirmation_delay_en?: unknown }; expiry?: { expires_at?: unknown; cancelled?: unknown; status?: unknown } };
const iso = (value: unknown): string | null => typeof value === "string" && !Number.isNaN(Date.parse(value)) ? value : null;
const canonicalRequired = ["document_type", "frontend_eligible", "handoff_id", "handoff_version", "created_at", "created_by_run_id", "origin_sunday_run_id", "parent_state_run_id", "prior_cutoff", "next_execution", "inherited_state", "scenario_checks", "family_audit", "new_information_policy", "exogenous_scan", "required_process", "output_contract", "expiry"] as const;

function valid(h: Handoff): h is Required<Pick<Handoff, "handoff_id" | "handoff_version" | "parent_state_run_id">> & Handoff {
  return canonicalRequired.every((key) => key in h) && h.document_type === "NEXT_GOLD_RECAP_HANDOFF" && h.frontend_eligible === false && typeof h.handoff_id === "string" && h.handoff_id.length > 0 && Number.isInteger(h.handoff_version) && (h.handoff_version as number) > 0 && typeof h.parent_state_run_id === "string" && !!iso(h.next_execution?.requested_at) && typeof h.next_execution?.reason === "string" && !!iso(h.expiry?.expires_at);
}

const localizedText = (value: unknown): string | null => typeof value === "string" && value.trim() ? value : null;
const unavailable = (status: NextRecapStatus, retrieved_at: string): NextRecapPublic => ({ status, requested_at: null, timezone: "America/New_York", reason: null, reason_fr: null, reason_en: null, minimum_confirmation_delay: null, parent_state_run_id: null, retrieved_at });

function wasConsumed(handoff: Required<Pick<Handoff, "handoff_id" | "handoff_version">>, hash: string, states: readonly { jsonPayload: unknown }[]): boolean {
  return states.some(({ jsonPayload }) => {
    const state = jsonPayload as Record<string, unknown> | null;
    const audit = state?.procedural_audit as { idempotence?: { consumed_handoff?: Record<string, unknown> } } | undefined;
    const consumed = audit?.idempotence?.consumed_handoff;
    return state?.consumed_handoff_id === handoff.handoff_id && state?.handoff_version === handoff.handoff_version && state?.handoff_content_hash === hash || consumed?.handoff_id === handoff.handoff_id && consumed?.handoff_version === handoff.handoff_version && consumed?.content_sha256 === hash;
  });
}

export function deriveNextRecap(raw: string, states: readonly { jsonPayload: unknown }[], now = new Date(), retrievedAt = now.toISOString()): NextRecapPublic {
  let handoff: Handoff;
  try { handoff = JSON.parse(raw) as Handoff; } catch { return unavailable("INVALID", retrievedAt); }
  if (!valid(handoff)) return unavailable("INVALID", retrievedAt);
  const requested = iso(handoff.next_execution?.requested_at)!;
  const expires = iso(handoff.expiry?.expires_at)!;
  const base = { requested_at: requested, timezone: "America/New_York" as const, reason: handoff.next_execution?.reason as string, reason_fr: localizedText(handoff.next_execution?.reason_fr), reason_en: localizedText(handoff.next_execution?.reason_en), minimum_confirmation_delay: { fr: localizedText(handoff.next_execution?.minimum_confirmation_delay_fr) ?? localizedText(handoff.next_execution?.minimum_confirmation_delay), en: localizedText(handoff.next_execution?.minimum_confirmation_delay_en) ?? localizedText(handoff.next_execution?.minimum_confirmation_delay) }, parent_state_run_id: handoff.parent_state_run_id as string, retrieved_at: retrievedAt };
  if (handoff.expiry?.cancelled === true || handoff.expiry?.status === "CANCELLED") return { ...base, status: "CANCELLED" };
  if (wasConsumed(handoff, createHash("sha256").update(raw).digest("hex"), states)) return { ...base, status: "CONSUMED" };
  if (Date.parse(expires) <= now.getTime()) return { ...base, status: "EXPIRED" };
  return { ...base, status: Date.parse(requested) > now.getTime() ? "SCHEDULED" : "DUE" };
}

export async function getNextRecap(): Promise<NextRecapPublic> {
  const retrievedAt = new Date().toISOString();
  const fileId = loadAppConfig().goldNextRecap?.fileId;
  if (!fileId) return unavailable("UNAVAILABLE", retrievedAt);
  try { return deriveNextRecap(await downloadGoldDriveFileText(fileId), await listPublishedGoldStates(), new Date(), retrievedAt); }
  catch { return unavailable("UNAVAILABLE", retrievedAt); }
}
