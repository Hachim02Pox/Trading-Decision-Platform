import { runTrackedIngestion } from "../../db/ingestionRunner";
import {
  findGoldStateByRunIdAndHash,
  listPublishedGoldStates,
  insertGoldMarketStateRow,
  publishGoldMarketStateRow,
  revalidateRejectedGoldMarketStateRow,
  rejectUnpublishedGoldMarketStateRow,
  type InsertGoldMarketStateInput,
  type GoldMarketStateRow,
} from "../../db/goldMarketStates";
import { validateFinalRead, type FinalRead } from "../../sundayRead/schema";
import { sha256Hex } from "../../sundayRead/ingestion/hash";
import { createGoldControlReader, downloadGoldDriveFileText, listGoldOutputDriveFiles } from "./driveClient";
import { findV6PublicationSeal, type ControlReader } from "./control";
import { listGoldStateCandidates, type DriveFileRef, type GoldStateCandidate } from "./discovery";
import { isGoldEditorialV6, validateGoldEditorialV6, validateGoldEditorialV6Parent, type GoldEditorialV6 } from "../v6";

// The unified Gold market-state ingestion pipeline: Drive -> validate -> DB
// -> publish. Handles BOTH Sunday Reads (V2 legacy and V3) and V3
// intermediate recaps, writing to public.gold_market_states
// (009_gold_market_states.sql) — ADDITIVE to, and independent of, the
// pre-existing apps/backend/src/sundayRead/ingestion/ingest.ts pipeline
// (which keeps serving GET /api/sunday-read* from public.sunday_reads
// unchanged). Every step follows this codebase's existing conventions:
// - wrapped in runTrackedIngestion (ingestion_state bookkeeping);
// - a same-process single-flight guard;
// - never throws past the job-level wrapper for a single bad candidate —
//   only a genuine Drive/DB-layer failure fails the whole job; a malformed
//   or ineligible CANDIDATE is recorded REJECTED and processing continues;
// - a PUBLISHED row is immutable and is never touched by a later candidate
//   (see db/goldMarketStates.ts's header comment — no supersede here).

export const GOLD_MARKET_STATE_INGEST_JOB_KEY = "gold-market-state:drive-sync";

export type GoldStateRunOutcome =
  | { key: string; runId: string; outcome: "PUBLISHED" }
  | { key: string; runId: string; outcome: "ALREADY_PUBLISHED" }
  | { key: string; runId?: string; outcome: "REJECTED"; reason: string };

export interface GoldMarketStateIngestionSummary {
  filesSeen: number;
  candidatesConsidered: number;
  runs: GoldStateRunOutcome[];
}

function log(event: string, fields: Record<string, unknown> = {}): void {
  // Structured, single-line logs — never a secret, credential, or full
  // document body, only run/file-id/status-shaped fields.
  console.log(JSON.stringify({ scope: "gold-market-state-ingestion", event, ...fields, at: new Date().toISOString() }));
}

function safeErrorMessage(err: unknown): string {
  const message = err instanceof Error ? err.message : String(err);
  return message.split("\n")[0].slice(0, 300);
}

/** Injectable Drive I/O — defaults to the real client; tests supply fakes (mirrors sundayRead/ingestion/ingest.ts's convention). */
export interface GoldMarketStateIngestionDeps {
  listFiles?: () => Promise<DriveFileRef[]>;
  downloadFileText?: (fileId: string) => Promise<string>;
  controlReader?: ControlReader;
}

async function processCandidate(candidate: GoldStateCandidate, deps: Required<GoldMarketStateIngestionDeps>): Promise<GoldStateRunOutcome> {
  const { key, json, markdown, kind } = candidate;
  log("candidate_file_found", { key, driveJsonFileId: json.id, modifiedTime: json.modifiedTime, kind });

  const rawText = await deps.downloadFileText(json.id);
  const contentHash = sha256Hex(rawText);
  log("downloaded", { key, contentHash, bytes: rawText.length });

  let existing: GoldMarketStateRow | null = null;
  const insertRejected = async (runId: string | null, code: string, message: string, extra: Partial<InsertGoldMarketStateInput> = {}): Promise<GoldStateRunOutcome> => {
    // Keep a rejected hash idempotent as well; a failed revalidation updates
    // its diagnostic instead of violating the (run_id, content_hash) key.
    if (existing && existing.status !== "PUBLISHED") {
      await rejectUnpublishedGoldMarketStateRow(existing.id, code, message);
      return { key, runId: runId ?? undefined, outcome: "REJECTED", reason: message };
    }
    await insertGoldMarketStateRow({
      runId: runId ?? `unresolved:${key}:${contentHash.slice(0, 12)}`,
      contentHash,
      status: "REJECTED",
      runType: null,
      documentType: null,
      frontendEligible: null,
      parentRunId: null,
      originSundayRunId: null,
      evidenceCutoffStart: null,
      evidenceCutoffEnd: null,
      dataMode: null,
      generatedAt: null,
      asOf: null,
      presentationVersion: null,
      directionState: null,
      jsonPayload: null,
      humanReport: null,
      runReport: null,
      validationReport: null,
      driveJsonFileId: json.id,
      driveJsonModifiedTime: json.modifiedTime,
      driveMarkdownFileId: markdown?.id ?? null,
      errorCode: code,
      errorMessage: message,
      ...extra,
    });
    log("rejected", { key, runId, code, message });
    return { key, runId: runId ?? undefined, outcome: "REJECTED", reason: message };
  };

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawText);
  } catch (err) {
    return insertRejected(null, "INVALID_JSON", safeErrorMessage(err));
  }

  const v6 = isGoldEditorialV6(parsed);
  const read = parsed as Partial<FinalRead>;
  const v6Read = parsed as Partial<GoldEditorialV6>;
  const runId = typeof (v6 ? v6Read.meta?.run_id : read.meta?.run_id) === "string" && (v6 ? v6Read.meta?.run_id : read.meta?.run_id)?.trim() ? (v6 ? v6Read.meta!.run_id.trim() : read.meta!.run_id.trim()) : null;
  if (!runId) {
    return insertRejected(null, "MISSING_RUN_ID", "meta.run_id is required.", { jsonPayload: parsed });
  }

  existing = await findGoldStateByRunIdAndHash(runId, contentHash);
  if (existing) {
    log("duplicate_content_hash", { key, runId, contentHash, status: existing.status });
    if (existing.status === "PUBLISHED") return { key, runId, outcome: "ALREADY_PUBLISHED" };
    // A rejected immutable Drive blob can become valid after a contract
    // upgrade. Deliberately fall through and re-run every current validator.
    // VALID interrupted rows also run current schema, seal and lineage checks;
    // a crash between storage and publication is never permission to bypass them.
    if (existing.status === "REJECTED" && !["SCHEMA_INVALID", "CONTROL_SEAL_INVALID", "LINEAGE_PARENT_NOT_FOUND", "MARKDOWN_PARITY_INVALID"].includes(existing.errorCode ?? ""))
      return { key, runId, outcome: "REJECTED", reason: existing.errorMessage ?? existing.errorCode ?? "Previously rejected immutable content." };
  }

  // Layer 1: canonical schema/structural validation, including the V3
  // human-copy audit and (when meta.run_type is present) the lineage/
  // direction_state requirements — see sundayRead/schema.ts's validateFinalRead.
  const schemaErrors = v6 ? validateGoldEditorialV6(parsed) : validateFinalRead(parsed);
  if (schemaErrors.length > 0) {
    return insertRejected(runId, "SCHEMA_INVALID", schemaErrors.join("; ").slice(0, 480), { jsonPayload: parsed });
  }

  // Layer 2: data_mode gate — never auto-publish a FIXTURE/demo run.
  const dataMode = (v6 ? v6Read.meta?.data_mode : read.meta?.data_mode) ?? null;
  if (dataMode !== "REAL") {
    return insertRejected(runId, "DATA_MODE_NOT_REAL", `Refusing to publish a non-REAL run (data_mode=${String(dataMode)}).`, { jsonPayload: parsed });
  }

  // v6 publication is sealed in the separate Control plane. Output content
  // alone can never authorize publication (including rejected-row retries).
  if (v6) {
    const sealErrors = await findV6PublicationSeal(deps.controlReader, parsed as GoldEditorialV6, { files: await deps.listFiles(), downloadText: deps.downloadFileText });
    if (sealErrors.length > 0) return insertRejected(runId, "CONTROL_SEAL_INVALID", sealErrors.join("; "), { jsonPayload: parsed });
  }

  // Layer 3: eligibility gate. A document carrying meta.run_type MUST also
  // be an explicitly frontend_eligible GOLD_MARKET_STATE (schema validation
  // above already enforces this — this is deliberate defense-in-depth, never
  // the only check). A document WITHOUT meta.run_type is a legacy V1/V2
  // Sunday Read; it is grandfathered in only when it arrived under the
  // canonical Sunday filename convention (never the intermediate one, which
  // always requires full lineage metadata).
  const runType = (v6 ? v6Read.meta?.run_type : read.meta?.run_type) ?? null;
  if (runType) {
    const documentType = v6 ? v6Read.document_type : read.meta?.document_type;
    const frontendEligible = v6 ? v6Read.frontend_eligible : read.meta?.frontend_eligible;
    if (documentType !== "GOLD_MARKET_STATE" || frontendEligible !== true) {
      return insertRejected(runId, "NOT_FRONTEND_ELIGIBLE", "Document carries meta.run_type but is not an explicitly frontend_eligible GOLD_MARKET_STATE.", { jsonPayload: parsed });
    }
  } else if (kind !== "SUNDAY_FILENAME") {
    return insertRejected(runId, "MISSING_LINEAGE_METADATA", "Non-Sunday-filename document without meta.run_type lineage metadata.", { jsonPayload: parsed });
  }

  // New lineage documents must attach to an already published, immutable
  // parent. Historical rows remain readable; only bad new ingestion is
  // rejected. A consumed handoff is one-shot across this state store.
  if (runType === "INTERMEDIATE") {
    const published = await listPublishedGoldStates();
    const parentRunId = v6 ? v6Read.meta?.parent_run_id : read.meta?.parent_run_id;
    const originSundayRunId = v6 ? v6Read.meta?.origin_sunday_run_id : read.meta?.origin_sunday_run_id;
    const cutoffEnd = v6 ? v6Read.meta?.evidence_cutoff_end : read.meta?.evidence_cutoff_end;
    const parent = published.find((row) => row.runId === parentRunId);
    if (!parent) return insertRejected(runId, "LINEAGE_PARENT_NOT_FOUND", "Intermediate parent_run_id does not identify a published state.", { jsonPayload: parsed });
    if (v6) {
      // The pinned Brain permits a legacy parent only with its explicit
      // migration/correction explanation. Let that semantic validator decide.
      const parentErrors = validateGoldEditorialV6Parent(parsed as GoldEditorialV6, parent.jsonPayload as GoldEditorialV6);
      if (parentErrors.length) return insertRejected(runId, "SCHEMA_INVALID", parentErrors.join("; ").slice(0, 480), { jsonPayload: parsed });
      const parentSealErrors = await findV6PublicationSeal(deps.controlReader, parent.jsonPayload as GoldEditorialV6, { files: await deps.listFiles(), downloadText: deps.downloadFileText });
      if (parentSealErrors.length) return insertRejected(runId, "CONTROL_SEAL_INVALID", `Exact parent seal: ${parentSealErrors.join("; ")}`, { jsonPayload: parsed });
    }
    if (parent.originSundayRunId !== originSundayRunId && parent.runId !== originSundayRunId) return insertRejected(runId, "LINEAGE_ORIGIN_MISMATCH", "Intermediate origin_sunday_run_id does not match its parent lineage.", { jsonPayload: parsed });
    const parentCutoff = parent.evidenceCutoffEnd ? Date.parse(parent.evidenceCutoffEnd) : NaN;
    const cutoff = cutoffEnd ? Date.parse(cutoffEnd) : NaN;
    const cutoffStart = v6 ? v6Read.meta?.evidence_cutoff_start : read.meta?.evidence_cutoff_start;
    if (Number.isFinite(parentCutoff) && (!cutoffStart || Date.parse(cutoffStart) !== parentCutoff)) return insertRejected(runId, "LINEAGE_CUTOFF_START_MISMATCH", "Intermediate evidence_cutoff_start must equal its exact parent cutoff.", { jsonPayload: parsed });
    if (!Number.isNaN(parentCutoff) && !Number.isNaN(cutoff) && cutoff <= parentCutoff) return insertRejected(runId, "LINEAGE_CUTOFF_NOT_ADVANCED", "Intermediate evidence cutoff must advance beyond its parent.", { jsonPayload: parsed });
    const consumedHandoffId = v6 ? v6Read.consumed_handoff?.handoff_id : read.consumed_handoff_id;
    const handoffHash = v6 ? v6Read.consumed_handoff?.content_sha256 : read.handoff_content_hash;
    if (consumedHandoffId) {
      const reused = published.some((row) => {
        const prior = row.jsonPayload as Partial<FinalRead> | null;
        const priorV6 = prior as Partial<GoldEditorialV6>;
        return prior?.consumed_handoff_id === consumedHandoffId || priorV6?.consumed_handoff?.handoff_id === consumedHandoffId || (!!handoffHash && (prior?.handoff_content_hash === handoffHash || priorV6?.consumed_handoff?.content_sha256 === handoffHash));
      });
      if (reused) return insertRejected(runId, "HANDOFF_ALREADY_CONSUMED", "The supplied handoff_id or handoff_content_hash was already consumed.", { jsonPayload: parsed });
    }
  }

  const humanReport = markdown
    ? await deps.downloadFileText(markdown.id).catch((err) => {
        log("markdown_download_failed", { key, error: safeErrorMessage(err) });
        return null;
      })
    : null;
  if (v6) {
    const preview = (parsed as GoldEditorialV6).content_preview as { markdown?: unknown } | undefined;
    if (humanReport === null || humanReport !== preview?.markdown) return insertRejected(runId, "MARKDOWN_PARITY_INVALID", "The published Markdown must be available and equal content_preview.markdown byte for byte.", { jsonPayload: parsed });
  }

  const input: InsertGoldMarketStateInput = {
    runId,
    contentHash,
    status: "VALID",
    runType,
    documentType: v6 ? v6Read.document_type ?? null : read.meta?.document_type ?? null,
    frontendEligible: v6 ? v6Read.frontend_eligible ?? null : read.meta?.frontend_eligible ?? (runType ? null : true),
    parentRunId: v6 ? v6Read.meta?.parent_run_id ?? null : read.meta?.parent_run_id ?? null,
    originSundayRunId: v6 ? v6Read.meta?.origin_sunday_run_id ?? null : read.meta?.origin_sunday_run_id ?? null,
    evidenceCutoffStart: v6 ? v6Read.meta?.evidence_cutoff_start ?? null : read.meta?.evidence_cutoff_start ?? null,
    evidenceCutoffEnd: v6 ? v6Read.meta?.evidence_cutoff_end ?? null : read.meta?.evidence_cutoff_end ?? null,
    dataMode,
    generatedAt: v6 ? v6Read.meta?.generated_at ?? null : read.meta?.generated_at ?? null,
    asOf: v6 ? v6Read.meta?.evidence_cutoff_end ?? null : read.meta?.as_of ?? null,
    presentationVersion: v6 ? 6 : read.presentation?.version ?? null,
    directionState: v6 ? null : read.direction_state ?? null,
    jsonPayload: parsed,
    humanReport,
    runReport: null,
    validationReport: null,
    driveJsonFileId: json.id,
    driveJsonModifiedTime: json.modifiedTime,
    driveMarkdownFileId: markdown?.id ?? null,
    errorCode: null,
    errorMessage: null,
  };
  // Revalidation is only possible after all current validation and lineage
  // checks above have passed. It preserves content hash/idempotency and never
  // mutates an immutable published row.
  if (existing?.status === "REJECTED") {
    await revalidateRejectedGoldMarketStateRow(existing.id, input);
    await publishGoldMarketStateRow(existing.id);
    log("revalidated_and_published", { key, runId, contentHash });
    return { key, runId, outcome: "PUBLISHED" };
  }
  if (existing?.status === "VALID") {
    await publishGoldMarketStateRow(existing.id);
    return { key, runId, outcome: "PUBLISHED" };
  }
  const row = await insertGoldMarketStateRow(input);
  log("valid", { key, runId, contentHash });

  await publishGoldMarketStateRow(row.id);
  log("published", { key, runId, contentHash });

  return { key, runId, outcome: "PUBLISHED" };
}

/** Drive listing order is not lineage order. Read only identity metadata first and
 * topologically order candidates so a parent and child discovered in one poll
 * never fail merely because Drive returned the child first. */
export async function parentsFirst(candidates: GoldStateCandidate[], deps: Required<GoldMarketStateIngestionDeps>): Promise<GoldStateCandidate[]> {
  const identities = await Promise.all(candidates.map(async (candidate) => {
    try {
      const doc = JSON.parse(await deps.downloadFileText(candidate.json.id)) as { meta?: { run_id?: string; parent_run_id?: string | null } };
      return { candidate, runId: doc.meta?.run_id, parentRunId: doc.meta?.parent_run_id ?? null };
    } catch { return { candidate, runId: undefined, parentRunId: null }; }
  }));
  const byRun = new Map(identities.filter((x) => x.runId).map((x) => [x.runId!, x]));
  const ordered: GoldStateCandidate[] = [];
  const emitted = new Set<GoldStateCandidate>();
  const visit = (entry: typeof identities[number], visiting = new Set<string>()) => {
    if (emitted.has(entry.candidate)) return;
    if (entry.runId && visiting.has(entry.runId)) return; // cyclic lineage stays deterministic and is rejected by validation.
    const next = new Set(visiting); if (entry.runId) next.add(entry.runId);
    const parent = entry.parentRunId ? byRun.get(entry.parentRunId) : undefined;
    if (parent) visit(parent, next);
    emitted.add(entry.candidate); ordered.push(entry.candidate);
  };
  identities.sort((a, b) => a.candidate.key.localeCompare(b.candidate.key)).forEach((entry) => visit(entry));
  return ordered;
}

async function discoverAndProcess(deps: Required<GoldMarketStateIngestionDeps>): Promise<GoldMarketStateIngestionSummary> {
  const files = await deps.listFiles();
  log("drive_listed", { fileCount: files.length });

  // Order the whole lineage before processing. Truncating newest files before
  // sorting stranded older parents and imposed an accidental intermediate cap.
  const texts = new Map<string, Promise<string>>();
  const snapshotDeps = {
    ...deps, listFiles: async () => files,
    downloadFileText: (id: string) => {
      let text = texts.get(id);
      if (!text) { text = deps.downloadFileText(id); texts.set(id, text); }
      return text;
    },
  };
  const candidates = await parentsFirst(listGoldStateCandidates(files), snapshotDeps);

  const runs: GoldStateRunOutcome[] = [];
  for (const candidate of candidates) {
    // Sequential on purpose — a handful of files per poll; easier to reason
    // about DB writes without concurrent interleaving (mirrors
    // sundayRead/ingestion/ingest.ts).
    // eslint-disable-next-line no-await-in-loop
    runs.push(await processCandidate(candidate, snapshotDeps));
  }

  return { filesSeen: files.length, candidatesConsidered: candidates.length, runs };
}

let inFlight: Promise<GoldMarketStateIngestionSummary> | null = null;

export async function runGoldMarketStateIngestion(deps: GoldMarketStateIngestionDeps = {}): Promise<GoldMarketStateIngestionSummary> {
  if (inFlight) return inFlight;

  let controlReader: ControlReader | undefined = deps.controlReader;
  const control = () => controlReader ??= createGoldControlReader();
  const resolvedDeps: Required<GoldMarketStateIngestionDeps> = {
    listFiles: deps.listFiles ?? listGoldOutputDriveFiles,
    downloadFileText: deps.downloadFileText ?? downloadGoldDriveFileText,
    controlReader: deps.controlReader ?? {
      listRunRecords: () => control().listRunRecords(),
      downloadText: (fileId) => control().downloadText(fileId),
      readCurrentHandoff: () => control().readCurrentHandoff(),
      findHandoffSnapshot: (identity) => control().findHandoffSnapshot!(identity),
    },
  };

  const task = runTrackedIngestion(GOLD_MARKET_STATE_INGEST_JOB_KEY, () => discoverAndProcess(resolvedDeps));
  inFlight = task;
  try {
    return await task;
  } finally {
    inFlight = null;
  }
}
