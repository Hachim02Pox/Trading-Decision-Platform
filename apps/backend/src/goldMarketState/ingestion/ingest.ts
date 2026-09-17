import { runTrackedIngestion } from "../../db/ingestionRunner";
import {
  findGoldStateByRunIdAndHash,
  insertGoldMarketStateRow,
  publishGoldMarketStateRow,
  type InsertGoldMarketStateInput,
} from "../../db/goldMarketStates";
import { validateFinalRead, type FinalRead } from "../../sundayRead/schema";
import { sha256Hex } from "../../sundayRead/ingestion/hash";
import { downloadGoldDriveFileText, listGoldOutputDriveFiles } from "./driveClient";
import { listGoldStateCandidates, type DriveFileRef, type GoldStateCandidate } from "./discovery";

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

// Comfortably covers a full week of Sunday + intermediate uploads without
// unbounded work if the Output folder accumulates a long history.
const MAX_CANDIDATES_PER_POLL = 40;

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
}

async function processCandidate(candidate: GoldStateCandidate, deps: Required<GoldMarketStateIngestionDeps>): Promise<GoldStateRunOutcome> {
  const { key, json, markdown, kind } = candidate;
  log("candidate_file_found", { key, driveJsonFileId: json.id, modifiedTime: json.modifiedTime, kind });

  const rawText = await deps.downloadFileText(json.id);
  const contentHash = sha256Hex(rawText);
  log("downloaded", { key, contentHash, bytes: rawText.length });

  const insertRejected = async (runId: string | null, code: string, message: string, extra: Partial<InsertGoldMarketStateInput> = {}): Promise<GoldStateRunOutcome> => {
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

  const read = parsed as Partial<FinalRead>;
  const runId = typeof read.meta?.run_id === "string" && read.meta.run_id.trim() ? read.meta.run_id.trim() : null;
  if (!runId) {
    return insertRejected(null, "MISSING_RUN_ID", "meta.run_id is required.", { jsonPayload: parsed });
  }

  const existing = await findGoldStateByRunIdAndHash(runId, contentHash);
  if (existing) {
    log("duplicate_content_hash", { key, runId, contentHash, status: existing.status });
    if (existing.status === "PUBLISHED") return { key, runId, outcome: "ALREADY_PUBLISHED" };
    if (existing.status === "REJECTED") return { key, runId, outcome: "REJECTED", reason: existing.errorMessage ?? "Previously rejected." };
    await publishGoldMarketStateRow(existing.id);
    log("published", { key, runId, contentHash });
    return { key, runId, outcome: "PUBLISHED" };
  }

  // Layer 1: canonical schema/structural validation, including the V3
  // human-copy audit and (when meta.run_type is present) the lineage/
  // direction_state requirements — see sundayRead/schema.ts's validateFinalRead.
  const schemaErrors = validateFinalRead(parsed);
  if (schemaErrors.length > 0) {
    return insertRejected(runId, "SCHEMA_INVALID", schemaErrors.join("; ").slice(0, 480), { jsonPayload: parsed });
  }

  // Layer 2: data_mode gate — never auto-publish a FIXTURE/demo run.
  const dataMode = read.meta?.data_mode ?? null;
  if (dataMode !== "REAL") {
    return insertRejected(runId, "DATA_MODE_NOT_REAL", `Refusing to publish a non-REAL run (data_mode=${String(dataMode)}).`, { jsonPayload: parsed });
  }

  // Layer 3: eligibility gate. A document carrying meta.run_type MUST also
  // be an explicitly frontend_eligible GOLD_MARKET_STATE (schema validation
  // above already enforces this — this is deliberate defense-in-depth, never
  // the only check). A document WITHOUT meta.run_type is a legacy V1/V2
  // Sunday Read; it is grandfathered in only when it arrived under the
  // canonical Sunday filename convention (never the intermediate one, which
  // always requires full lineage metadata).
  const runType = read.meta?.run_type ?? null;
  if (runType) {
    if (read.meta?.document_type !== "GOLD_MARKET_STATE" || read.meta?.frontend_eligible !== true) {
      return insertRejected(runId, "NOT_FRONTEND_ELIGIBLE", "Document carries meta.run_type but is not an explicitly frontend_eligible GOLD_MARKET_STATE.", { jsonPayload: parsed });
    }
  } else if (kind !== "SUNDAY_FILENAME") {
    return insertRejected(runId, "MISSING_LINEAGE_METADATA", "Non-Sunday-filename document without meta.run_type lineage metadata.", { jsonPayload: parsed });
  }

  const humanReport = markdown
    ? await deps.downloadFileText(markdown.id).catch((err) => {
        log("markdown_download_failed", { key, error: safeErrorMessage(err) });
        return null;
      })
    : null;

  const row = await insertGoldMarketStateRow({
    runId,
    contentHash,
    status: "VALID",
    runType,
    documentType: read.meta?.document_type ?? null,
    frontendEligible: read.meta?.frontend_eligible ?? (runType ? null : true),
    parentRunId: read.meta?.parent_run_id ?? null,
    originSundayRunId: read.meta?.origin_sunday_run_id ?? null,
    evidenceCutoffStart: read.meta?.evidence_cutoff_start ?? null,
    evidenceCutoffEnd: read.meta?.evidence_cutoff_end ?? null,
    dataMode,
    generatedAt: read.meta?.generated_at ?? null,
    asOf: read.meta?.as_of ?? null,
    presentationVersion: read.presentation?.version ?? null,
    directionState: read.direction_state ?? null,
    jsonPayload: parsed,
    humanReport,
    runReport: null,
    validationReport: null,
    driveJsonFileId: json.id,
    driveJsonModifiedTime: json.modifiedTime,
    driveMarkdownFileId: markdown?.id ?? null,
    errorCode: null,
    errorMessage: null,
  });
  log("valid", { key, runId, contentHash });

  await publishGoldMarketStateRow(row.id);
  log("published", { key, runId, contentHash });

  return { key, runId, outcome: "PUBLISHED" };
}

async function discoverAndProcess(deps: Required<GoldMarketStateIngestionDeps>): Promise<GoldMarketStateIngestionSummary> {
  const files = await deps.listFiles();
  log("drive_listed", { fileCount: files.length });

  const candidates = listGoldStateCandidates(files).slice(0, MAX_CANDIDATES_PER_POLL);

  const runs: GoldStateRunOutcome[] = [];
  for (const candidate of candidates) {
    // Sequential on purpose — a handful of files per poll; easier to reason
    // about DB writes without concurrent interleaving (mirrors
    // sundayRead/ingestion/ingest.ts).
    // eslint-disable-next-line no-await-in-loop
    runs.push(await processCandidate(candidate, deps));
  }

  return { filesSeen: files.length, candidatesConsidered: candidates.length, runs };
}

let inFlight: Promise<GoldMarketStateIngestionSummary> | null = null;

export async function runGoldMarketStateIngestion(deps: GoldMarketStateIngestionDeps = {}): Promise<GoldMarketStateIngestionSummary> {
  if (inFlight) return inFlight;

  const resolvedDeps: Required<GoldMarketStateIngestionDeps> = {
    listFiles: deps.listFiles ?? listGoldOutputDriveFiles,
    downloadFileText: deps.downloadFileText ?? downloadGoldDriveFileText,
  };

  const task = runTrackedIngestion(GOLD_MARKET_STATE_INGEST_JOB_KEY, () => discoverAndProcess(resolvedDeps));
  inFlight = task;
  try {
    return await task;
  } finally {
    inFlight = null;
  }
}
