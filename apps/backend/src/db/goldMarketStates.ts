import { randomUUID } from "node:crypto";
import type { Pool } from "pg";
import { getPool } from "./pool";

// gold_market_states — see migrations/009_gold_market_states.sql. Data-access
// layer for the unified Gold market-state Drive pipeline (Sunday Reads V2/V3
// + intermediate recaps), apps/backend/src/goldMarketState/ingestion/**.
// Follows this codebase's existing no-ORM/raw-pg convention (see
// db/sundayReads.ts, db/journalEntries.ts). Every PUBLISHED row is
// immutable/permanent — see the migration's header comment for why this
// differs from sunday_reads' per-run_date supersede model.

export type GoldMarketStateStatus = "VALID" | "PUBLISHED" | "REJECTED";
export type GoldRunType = "SUNDAY" | "INTERMEDIATE" | null;

export interface GoldMarketStateRow {
  id: string;
  runId: string;
  contentHash: string;
  status: GoldMarketStateStatus;
  runType: GoldRunType;
  documentType: string | null;
  frontendEligible: boolean | null;
  parentRunId: string | null;
  originSundayRunId: string | null;
  evidenceCutoffStart: string | null;
  evidenceCutoffEnd: string | null;
  dataMode: string | null;
  generatedAt: Date | null;
  asOf: string | null;
  presentationVersion: number | null;
  directionState: unknown | null;
  jsonPayload: unknown | null;
  humanReport: string | null;
  runReport: string | null;
  validationReport: string | null;
  driveJsonFileId: string | null;
  driveJsonModifiedTime: string | null;
  driveMarkdownFileId: string | null;
  errorCode: string | null;
  errorMessage: string | null;
  ingestedAt: Date | null;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

interface GoldMarketStateDbRow {
  id: string;
  run_id: string;
  content_hash: string;
  status: GoldMarketStateStatus;
  run_type: GoldRunType;
  document_type: string | null;
  frontend_eligible: boolean | null;
  parent_run_id: string | null;
  origin_sunday_run_id: string | null;
  evidence_cutoff_start: string | null;
  evidence_cutoff_end: string | null;
  data_mode: string | null;
  generated_at: Date | null;
  as_of: string | null;
  presentation_version: number | null;
  direction_state: unknown | null;
  json_payload: unknown | null;
  human_report: string | null;
  run_report: string | null;
  validation_report: string | null;
  drive_json_file_id: string | null;
  drive_json_modified_time: string | null;
  drive_markdown_file_id: string | null;
  error_code: string | null;
  error_message: string | null;
  ingested_at: Date | null;
  published_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

const SELECT_COLUMNS = `
  id, run_id, content_hash, status, run_type, document_type, frontend_eligible,
  parent_run_id, origin_sunday_run_id, evidence_cutoff_start, evidence_cutoff_end,
  data_mode, generated_at, as_of, presentation_version, direction_state, json_payload,
  human_report, run_report, validation_report,
  drive_json_file_id, drive_json_modified_time, drive_markdown_file_id,
  error_code, error_message, ingested_at, published_at, created_at, updated_at
`;

function toRow(row: GoldMarketStateDbRow): GoldMarketStateRow {
  return {
    id: row.id,
    runId: row.run_id,
    contentHash: row.content_hash,
    status: row.status,
    runType: row.run_type,
    documentType: row.document_type,
    frontendEligible: row.frontend_eligible,
    parentRunId: row.parent_run_id,
    originSundayRunId: row.origin_sunday_run_id,
    evidenceCutoffStart: row.evidence_cutoff_start,
    evidenceCutoffEnd: row.evidence_cutoff_end,
    dataMode: row.data_mode,
    generatedAt: row.generated_at,
    asOf: row.as_of,
    presentationVersion: row.presentation_version,
    directionState: row.direction_state,
    jsonPayload: row.json_payload,
    humanReport: row.human_report,
    runReport: row.run_report,
    validationReport: row.validation_report,
    driveJsonFileId: row.drive_json_file_id,
    driveJsonModifiedTime: row.drive_json_modified_time,
    driveMarkdownFileId: row.drive_markdown_file_id,
    errorCode: row.error_code,
    errorMessage: row.error_message,
    ingestedAt: row.ingested_at,
    publishedAt: row.published_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** Idempotency boundary: re-ingesting byte-identical Drive content for the same run_id is always a no-op. */
export async function findGoldStateByRunIdAndHash(runId: string, contentHash: string, pool: Pool = getPool()): Promise<GoldMarketStateRow | null> {
  const result = await pool.query<GoldMarketStateDbRow>(
    `select ${SELECT_COLUMNS} from public.gold_market_states where run_id = $1 and content_hash = $2`,
    [runId, contentHash]
  );
  return result.rows[0] ? toRow(result.rows[0]) : null;
}

export async function findGoldStateByRunId(runId: string, pool: Pool = getPool()): Promise<GoldMarketStateRow | null> {
  const result = await pool.query<GoldMarketStateDbRow>(
    `select ${SELECT_COLUMNS} from public.gold_market_states where run_id = $1 order by created_at desc limit 1`,
    [runId]
  );
  return result.rows[0] ? toRow(result.rows[0]) : null;
}

/** Every PUBLISHED row — the input to the lineage-tip "current state" selection (see goldMarketState/selection.ts). Deliberately unfiltered here; filtering by document_type/frontend_eligible happens in application code so the selection algorithm stays unit-testable without the DB. */
export async function listPublishedGoldStates(pool: Pool = getPool()): Promise<GoldMarketStateRow[]> {
  const result = await pool.query<GoldMarketStateDbRow>(
    `select ${SELECT_COLUMNS} from public.gold_market_states where status = 'PUBLISHED' order by created_at desc`
  );
  return result.rows.map(toRow);
}

export interface InsertGoldMarketStateInput {
  runId: string;
  contentHash: string;
  status: "VALID" | "REJECTED";
  runType: GoldRunType;
  documentType: string | null;
  frontendEligible: boolean | null;
  parentRunId: string | null;
  originSundayRunId: string | null;
  evidenceCutoffStart: string | null;
  evidenceCutoffEnd: string | null;
  dataMode: string | null;
  generatedAt: string | null;
  asOf: string | null;
  presentationVersion: number | null;
  directionState: unknown | null;
  jsonPayload: unknown | null;
  humanReport: string | null;
  runReport: string | null;
  validationReport: string | null;
  driveJsonFileId: string;
  driveJsonModifiedTime: string;
  driveMarkdownFileId: string | null;
  errorCode: string | null;
  errorMessage: string | null;
}

export async function insertGoldMarketStateRow(input: InsertGoldMarketStateInput, pool: Pool = getPool()): Promise<GoldMarketStateRow> {
  const id = randomUUID();
  const result = await pool.query<GoldMarketStateDbRow>(
    `insert into public.gold_market_states (
      id, run_id, content_hash, status, run_type, document_type, frontend_eligible,
      parent_run_id, origin_sunday_run_id, evidence_cutoff_start, evidence_cutoff_end,
      data_mode, generated_at, as_of, presentation_version, direction_state, json_payload,
      human_report, run_report, validation_report,
      drive_json_file_id, drive_json_modified_time, drive_markdown_file_id,
      error_code, error_message
    ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25)
    returning ${SELECT_COLUMNS}`,
    [
      id,
      input.runId,
      input.contentHash,
      input.status,
      input.runType,
      input.documentType,
      input.frontendEligible,
      input.parentRunId,
      input.originSundayRunId,
      input.evidenceCutoffStart,
      input.evidenceCutoffEnd,
      input.dataMode,
      input.generatedAt ? new Date(input.generatedAt) : null,
      input.asOf,
      input.presentationVersion,
      input.directionState !== null ? JSON.stringify(input.directionState) : null,
      input.jsonPayload !== null ? JSON.stringify(input.jsonPayload) : null,
      input.humanReport,
      input.runReport,
      input.validationReport,
      input.driveJsonFileId,
      input.driveJsonModifiedTime,
      input.driveMarkdownFileId,
      input.errorCode,
      input.errorMessage,
    ]
  );
  return toRow(result.rows[0]);
}

/** Promotes a VALID row to PUBLISHED. Published market states are immutable/permanent (see migration header) — this never supersedes another row. */
export async function publishGoldMarketStateRow(id: string, pool: Pool = getPool()): Promise<void> {
  await pool.query(
    `update public.gold_market_states set status = 'PUBLISHED', published_at = now(),
       ingested_at = coalesce(ingested_at, now()), updated_at = now()
     where id = $1`,
    [id]
  );
}

/** Re-admits a byte-identical rejected Drive document after validator upgrades.
 * PUBLISHED rows are deliberately excluded: their immutable payload is never rewritten. */
export async function revalidateRejectedGoldMarketStateRow(id: string, input: InsertGoldMarketStateInput, pool: Pool = getPool()): Promise<void> {
  await pool.query(
    `update public.gold_market_states set status = 'VALID', run_type = $2, document_type = $3, frontend_eligible = $4,
      parent_run_id = $5, origin_sunday_run_id = $6, evidence_cutoff_start = $7, evidence_cutoff_end = $8,
      data_mode = $9, generated_at = $10, as_of = $11, presentation_version = $12, direction_state = $13,
      json_payload = $14, human_report = $15, drive_json_file_id = $16, drive_json_modified_time = $17,
      drive_markdown_file_id = $18, error_code = null, error_message = null, updated_at = now() where id = $1 and status = 'REJECTED'`,
    [id, input.runType, input.documentType, input.frontendEligible, input.parentRunId, input.originSundayRunId,
      input.evidenceCutoffStart, input.evidenceCutoffEnd, input.dataMode, input.generatedAt ? new Date(input.generatedAt) : null,
      input.asOf, input.presentationVersion, input.directionState === null ? null : JSON.stringify(input.directionState),
      input.jsonPayload === null ? null : JSON.stringify(input.jsonPayload), input.humanReport, input.driveJsonFileId,
      input.driveJsonModifiedTime, input.driveMarkdownFileId]
  );
}
