import { randomUUID } from "node:crypto";
import type { Pool } from "pg";
import { getPool } from "./pool";

// sunday_reads — see migrations/005_sunday_reads.sql. Data-access layer for
// the Drive-ingested Sunday Read pipeline (apps/backend/src/sundayRead/ingestion/**).
// Follows this codebase's existing no-ORM/raw-pg convention (see db/journalEntries.ts,
// db/globalReadRuns.ts).

export type SundayReadStatus = "VALID" | "PUBLISHED" | "REJECTED" | "SUPERSEDED";

export interface SundayReadRow {
  id: string;
  runDate: string;
  contentHash: string;
  status: SundayReadStatus;
  dataMode: string | null;
  schemaVersion: string | null;
  generatedAt: Date | null;
  asOf: string | null;
  jsonPayload: unknown | null;
  humanReport: string | null;
  runReport: string | null;
  validationReport: string | null;
  driveJsonFileId: string | null;
  driveJsonModifiedTime: string | null;
  driveMarkdownFileId: string | null;
  driveRunReportFileId: string | null;
  driveValidationReportFileId: string | null;
  errorCode: string | null;
  errorMessage: string | null;
  ingestedAt: Date | null;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

interface SundayReadDbRow {
  id: string;
  run_date: Date;
  content_hash: string;
  status: SundayReadStatus;
  data_mode: string | null;
  schema_version: string | null;
  generated_at: Date | null;
  as_of: string | null;
  json_payload: unknown | null;
  human_report: string | null;
  run_report: string | null;
  validation_report: string | null;
  drive_json_file_id: string | null;
  drive_json_modified_time: string | null;
  drive_markdown_file_id: string | null;
  drive_run_report_file_id: string | null;
  drive_validation_report_file_id: string | null;
  error_code: string | null;
  error_message: string | null;
  ingested_at: Date | null;
  published_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

const SELECT_COLUMNS = `
  id, run_date, content_hash, status, data_mode, schema_version, generated_at, as_of,
  json_payload, human_report, run_report, validation_report,
  drive_json_file_id, drive_json_modified_time, drive_markdown_file_id,
  drive_run_report_file_id, drive_validation_report_file_id,
  error_code, error_message, ingested_at, published_at, created_at, updated_at
`;

function toRow(row: SundayReadDbRow): SundayReadRow {
  return {
    id: row.id,
    runDate: row.run_date.toISOString().slice(0, 10),
    contentHash: row.content_hash,
    status: row.status,
    dataMode: row.data_mode,
    schemaVersion: row.schema_version,
    generatedAt: row.generated_at,
    asOf: row.as_of,
    jsonPayload: row.json_payload,
    humanReport: row.human_report,
    runReport: row.run_report,
    validationReport: row.validation_report,
    driveJsonFileId: row.drive_json_file_id,
    driveJsonModifiedTime: row.drive_json_modified_time,
    driveMarkdownFileId: row.drive_markdown_file_id,
    driveRunReportFileId: row.drive_run_report_file_id,
    driveValidationReportFileId: row.drive_validation_report_file_id,
    errorCode: row.error_code,
    errorMessage: row.error_message,
    ingestedAt: row.ingested_at,
    publishedAt: row.published_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** Any row already known for this exact Drive content (by run_date + sha256) — the idempotency boundary: re-ingesting byte-identical content is always a no-op. */
export async function findExistingByRunDateAndHash(runDate: string, contentHash: string, pool: Pool = getPool()): Promise<SundayReadRow | null> {
  const result = await pool.query<SundayReadDbRow>(
    `select ${SELECT_COLUMNS} from public.sunday_reads where run_date = $1 and content_hash = $2`,
    [runDate, contentHash]
  );
  return result.rows[0] ? toRow(result.rows[0]) : null;
}

/** Most recently created row for this run_date, regardless of hash/status — used to cheaply skip re-downloading a Drive file whose (id, modifiedTime) we've already fully resolved. */
export async function findLatestForRunDate(runDate: string, pool: Pool = getPool()): Promise<SundayReadRow | null> {
  const result = await pool.query<SundayReadDbRow>(
    `select ${SELECT_COLUMNS} from public.sunday_reads where run_date = $1 order by created_at desc limit 1`,
    [runDate]
  );
  return result.rows[0] ? toRow(result.rows[0]) : null;
}

export interface InsertSundayReadRowInput {
  runDate: string;
  contentHash: string;
  status: "VALID" | "REJECTED";
  dataMode: string | null;
  generatedAt: string | null;
  asOf: string | null;
  jsonPayload: unknown | null;
  humanReport: string | null;
  runReport: string | null;
  validationReport: string | null;
  driveJsonFileId: string;
  driveJsonModifiedTime: string;
  driveMarkdownFileId: string | null;
  driveRunReportFileId: string | null;
  driveValidationReportFileId: string | null;
  errorCode: string | null;
  errorMessage: string | null;
}

/** Inserts a new terminal-or-pending row (VALID awaiting publication, or REJECTED with its reason). Never publishes by itself — see publishSundayReadRow. */
export async function insertSundayReadRow(input: InsertSundayReadRowInput, pool: Pool = getPool()): Promise<SundayReadRow> {
  const id = randomUUID();
  const result = await pool.query<SundayReadDbRow>(
    `insert into public.sunday_reads (
      id, run_date, content_hash, status, data_mode, generated_at, as_of,
      json_payload, human_report, run_report, validation_report,
      drive_json_file_id, drive_json_modified_time, drive_markdown_file_id,
      drive_run_report_file_id, drive_validation_report_file_id,
      error_code, error_message
    ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
    returning ${SELECT_COLUMNS}`,
    [
      id,
      input.runDate,
      input.contentHash,
      input.status,
      input.dataMode,
      input.generatedAt ? new Date(input.generatedAt) : null,
      input.asOf,
      input.jsonPayload !== null ? JSON.stringify(input.jsonPayload) : null,
      input.humanReport,
      input.runReport,
      input.validationReport,
      input.driveJsonFileId,
      input.driveJsonModifiedTime,
      input.driveMarkdownFileId,
      input.driveRunReportFileId,
      input.driveValidationReportFileId,
      input.errorCode,
      input.errorMessage,
    ]
  );
  return toRow(result.rows[0]);
}

/**
 * Promotes a VALID row to PUBLISHED and, in the same transaction, supersedes
 * whatever row was previously PUBLISHED for this run_date (if any and if
 * different from `id`) — this is what lets a corrected same-Sunday run
 * safely replace the one currently live without ever having two PUBLISHED
 * rows for the same run_date (also enforced by the DB's partial unique
 * index; see migrations/005_sunday_reads.sql).
 */
export async function publishSundayReadRow(id: string, runDate: string, pool: Pool = getPool()): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      `update public.sunday_reads set status = 'SUPERSEDED', updated_at = now()
       where run_date = $1 and status = 'PUBLISHED' and id <> $2`,
      [runDate, id]
    );
    await client.query(
      `update public.sunday_reads set status = 'PUBLISHED', published_at = now(),
         ingested_at = coalesce(ingested_at, now()), updated_at = now()
       where id = $1`,
      [id]
    );
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

export async function findLatestPublishedSundayRead(pool: Pool = getPool()): Promise<SundayReadRow | null> {
  const result = await pool.query<SundayReadDbRow>(
    `select ${SELECT_COLUMNS} from public.sunday_reads where status = 'PUBLISHED' order by run_date desc, published_at desc limit 1`
  );
  return result.rows[0] ? toRow(result.rows[0]) : null;
}

export async function findPublishedSundayReadByRunDate(runDate: string, pool: Pool = getPool()): Promise<SundayReadRow | null> {
  const result = await pool.query<SundayReadDbRow>(
    `select ${SELECT_COLUMNS} from public.sunday_reads where run_date = $1 and status = 'PUBLISHED' limit 1`,
    [runDate]
  );
  return result.rows[0] ? toRow(result.rows[0]) : null;
}
