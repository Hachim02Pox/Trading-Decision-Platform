import type { Pool, RowDataPacket } from "mysql2/promise";
import { getPool } from "./pool";

// kpi_observations helpers — append-only history of canonical KPI readings.
// See migrations/001_init.sql's doc comment for why there is deliberately no
// unique constraint on (kpi_id, observation_at): deduplication of identical
// repeat reads happens here, in application code, while a genuine revision
// (same key, different value) always gets a new row.

export interface KpiObservationInput {
  kpiId: string;
  /** The data's own as-of date/time. */
  observationAt: Date;
  /** When THIS backend actually fetched it. */
  retrievedAt: Date;
  numericValue?: number | null;
  textValue?: string | null;
  sourceTag: string;
  provenance: string;
  /** Set when this KPI's stored reading is a documented proxy for a different (unavailable) series — omit/null otherwise. */
  proxyFor?: string | null;
  /** Freeform, whatever the source provides (e.g. "preliminary" / "final") — null when the source doesn't distinguish. */
  status?: string | null;
}

function toMysqlDatetime(date: Date): string {
  return date.toISOString().slice(0, 19).replace("T", " ");
}

function isSameValue(existingNumeric: number | null, existingText: string | null, input: KpiObservationInput): boolean {
  const incomingNumeric = input.numericValue ?? null;
  const incomingText = input.textValue ?? null;
  return existingNumeric === incomingNumeric && existingText === incomingText;
}

interface LatestValueRow extends RowDataPacket {
  numeric_value: number | null;
  text_value: string | null;
}

/**
 * Inserts one KPI observation row UNLESS the latest existing row for the
 * same (kpi_id, observation_at) already holds an identical value — in that
 * case this is a no-op (returns false). A DIFFERENT value for an
 * already-seen (kpi_id, observation_at) — i.e. a source revision — always
 * inserts a NEW row rather than updating/destroying the earlier one, so
 * revision history is never silently lost.
 *
 * Returns true if a new row was inserted, false if it was a deduplicated
 * repeat.
 */
export async function insertObservationIfChanged(input: KpiObservationInput, pool: Pool = getPool()): Promise<boolean> {
  const observationAt = toMysqlDatetime(input.observationAt);

  const [rows] = await pool.query<LatestValueRow[]>(
    `SELECT numeric_value, text_value FROM kpi_observations
     WHERE kpi_id = ? AND observation_at = ?
     ORDER BY retrieved_at DESC, id DESC
     LIMIT 1`,
    [input.kpiId, observationAt]
  );

  const existing = rows[0];
  if (existing && isSameValue(existing.numeric_value, existing.text_value, input)) {
    return false;
  }

  await pool.query(
    `INSERT INTO kpi_observations (
      kpi_id, observation_at, retrieved_at, numeric_value, text_value,
      source_tag, provenance, proxy_for, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      input.kpiId,
      observationAt,
      toMysqlDatetime(input.retrievedAt),
      input.numericValue ?? null,
      input.textValue ?? null,
      input.sourceTag,
      input.provenance,
      input.proxyFor ?? null,
      input.status ?? null,
    ]
  );
  return true;
}

interface ObservationDateRow extends RowDataPacket {
  observation_at: Date;
  numeric_value: number | null;
  text_value: string | null;
}

/**
 * Historical bootstrap helper for issuer archives. Inserts only dates not
 * already stored for the same KPI/source and never updates existing rows.
 * Values are parameterized and written in bounded batches.
 */
export async function insertMissingHistoricalObservations(
  inputs: readonly KpiObservationInput[],
  pool: Pool = getPool()
): Promise<number> {
  if (inputs.length === 0) return 0;
  const kpiId = inputs[0].kpiId;
  const sourceTag = inputs[0].sourceTag;
  if (inputs.some((input) => input.kpiId !== kpiId || input.sourceTag !== sourceTag)) {
    throw new Error("historical observation batch must contain one KPI and one source");
  }

  const [existingRows] = await pool.query<ObservationDateRow[]>(
    `SELECT observation_at, numeric_value, text_value FROM kpi_observations WHERE kpi_id = ? AND source_tag = ?`,
    [kpiId, sourceTag]
  );
  const existingValues = new Set(existingRows.map((row) => `${toMysqlDatetime(row.observation_at)}|${row.numeric_value ?? ""}|${row.text_value ?? ""}`));
  const missing = inputs.filter((input) => !existingValues.has(`${toMysqlDatetime(input.observationAt)}|${input.numericValue ?? ""}|${input.textValue ?? ""}`));
  const batchSize = 250;

  for (let offset = 0; offset < missing.length; offset += batchSize) {
    const batch = missing.slice(offset, offset + batchSize);
    const placeholders = batch.map(() => "(?, ?, ?, ?, ?, ?, ?, ?, ?)").join(", ");
    const params = batch.flatMap((input) => [
      input.kpiId,
      toMysqlDatetime(input.observationAt),
      toMysqlDatetime(input.retrievedAt),
      input.numericValue ?? null,
      input.textValue ?? null,
      input.sourceTag,
      input.provenance,
      input.proxyFor ?? null,
      input.status ?? null,
    ]);
    await pool.query(
      `INSERT INTO kpi_observations (
        kpi_id, observation_at, retrieved_at, numeric_value, text_value,
        source_tag, provenance, proxy_for, status
      ) VALUES ${placeholders}`,
      params
    );
  }
  return missing.length;
}

export interface StoredKpiObservation {
  kpiId: string;
  observationAt: Date;
  retrievedAt: Date;
  numericValue: number | null;
  textValue: string | null;
  sourceTag: string;
  provenance: string;
  proxyFor: string | null;
  status: string | null;
}

interface FullObservationRow extends RowDataPacket {
  kpi_id: string;
  observation_at: Date;
  retrieved_at: Date;
  numeric_value: number | null;
  text_value: string | null;
  source_tag: string;
  provenance: string;
  proxy_for: string | null;
  status: string | null;
}

function toStoredObservation(row: FullObservationRow): StoredKpiObservation {
  return {
    kpiId: row.kpi_id,
    observationAt: row.observation_at,
    retrievedAt: row.retrieved_at,
    numericValue: row.numeric_value,
    textValue: row.text_value,
    sourceTag: row.source_tag,
    provenance: row.provenance,
    proxyFor: row.proxy_for,
    status: row.status,
  };
}

/** The most recently FETCHED row for a KPI (ordered by retrieved_at, not observation_at) — i.e. whatever this backend last actually retrieved, regardless of its as-of date. */
export async function getLatestObservation(kpiId: string, pool: Pool = getPool()): Promise<StoredKpiObservation | null> {
  const [rows] = await pool.query<FullObservationRow[]>(
    `SELECT kpi_id, observation_at, retrieved_at, numeric_value, text_value, source_tag, provenance, proxy_for, status
     FROM kpi_observations
     WHERE kpi_id = ?
     ORDER BY retrieved_at DESC, id DESC
     LIMIT 1`,
    [kpiId]
  );
  const row = rows[0];
  return row ? toStoredObservation(row) : null;
}
