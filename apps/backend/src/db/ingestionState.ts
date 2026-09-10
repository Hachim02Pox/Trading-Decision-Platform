import type { Pool } from "pg";
import { getPool } from "./pool";

// ingestion_state helpers — one row per named ingestion job. See
// ingestionRunner.ts for the generic wrapper that calls these three in
// sequence around a fetch.

export type IngestionStatus = "SUCCESS" | "FAILED" | "NEVER_RUN";

export interface IngestionState {
  jobKey: string;
  lastAttemptAt: Date | null;
  lastSuccessAt: Date | null;
  lastStatus: IngestionStatus;
  lastError: string | null;
  expectedNextAt: Date | null;
}

interface IngestionStateRow {
  job_key: string;
  last_attempt_at: Date | null;
  last_success_at: Date | null;
  last_status: IngestionStatus;
  last_error: string | null;
  expected_next_at: Date | null;
}

// last_error is varchar(512) — truncate defensively so a caller passing an
// unexpectedly long message never fails the INSERT. Callers are still
// responsible for passing a SAFE message (never a full stack trace, never a
// secret) — this is a length safeguard only, not a sanitizer.
const MAX_ERROR_LENGTH = 500;

function truncateError(message: string): string {
  return message.length > MAX_ERROR_LENGTH ? `${message.slice(0, MAX_ERROR_LENGTH)}…` : message;
}

/** Marks a job as about to run. Call this before attempting the actual fetch. */
export async function recordAttempt(jobKey: string, pool: Pool = getPool()): Promise<void> {
  const now = new Date();
  await pool.query(
    `insert into public.ingestion_state (job_key, last_attempt_at, last_status)
     values ($1, $2, 'NEVER_RUN')
     on conflict (job_key) do update set last_attempt_at = excluded.last_attempt_at`,
    [jobKey, now]
  );
}

/** Marks a job's most recent attempt as successful and clears any prior error. */
export async function recordSuccess(jobKey: string, expectedNextAt: Date | null = null, pool: Pool = getPool()): Promise<void> {
  const now = new Date();
  await pool.query(
    `insert into public.ingestion_state (job_key, last_attempt_at, last_success_at, last_status, last_error, expected_next_at)
     values ($1, $2, $3, 'SUCCESS', NULL, $4)
     on conflict (job_key) do update set
       last_attempt_at = excluded.last_attempt_at,
       last_success_at = excluded.last_success_at,
       last_status = 'SUCCESS',
       last_error = NULL,
       expected_next_at = excluded.expected_next_at`,
    [jobKey, now, now, expectedNextAt]
  );
}

/**
 * Marks a job's most recent attempt as failed. `safeErrorMessage` must be a
 * short, safe summary — NEVER a full stack trace or anything that could
 * contain a secret (e.g. an API key embedded in a request URL). This
 * function only guards against excessive LENGTH (see truncateError); the
 * caller is responsible for the "safe" part.
 */
export async function recordFailure(jobKey: string, safeErrorMessage: string, pool: Pool = getPool()): Promise<void> {
  const now = new Date();
  const safeMessage = truncateError(safeErrorMessage);
  await pool.query(
    `insert into public.ingestion_state (job_key, last_attempt_at, last_status, last_error)
     values ($1, $2, 'FAILED', $3)
     on conflict (job_key) do update set
       last_attempt_at = excluded.last_attempt_at,
       last_status = 'FAILED',
       last_error = excluded.last_error`,
    [jobKey, now, safeMessage]
  );
}

export async function getState(jobKey: string, pool: Pool = getPool()): Promise<IngestionState | null> {
  const result = await pool.query<IngestionStateRow>(
    `select job_key, last_attempt_at, last_success_at, last_status, last_error, expected_next_at
     from public.ingestion_state where job_key = $1`,
    [jobKey]
  );
  const row = result.rows[0];
  if (!row) return null;
  return {
    jobKey: row.job_key,
    lastAttemptAt: row.last_attempt_at,
    lastSuccessAt: row.last_success_at,
    lastStatus: row.last_status,
    lastError: row.last_error,
    expectedNextAt: row.expected_next_at,
  };
}
