import type { Pool } from "pg";
import { getPool } from "./pool";
import type { KpiObservationInput } from "./kpiObservations";

// "Always exactly the 2 most recent DISTINCT values per KPI" store — see
// migrations/007's doc comment and
// docs/PREVIOUS_VALUE_PERSISTENCE_NEXT_STEPS.md §3 for the full rationale.
// This is intentionally separate from kpi_observations (the append-only
// history table F10 needs for its percentile/Z-score math) — callers should
// call BOTH `insertObservationIfChanged`/`persistObservation` (unchanged)
// AND `rememberLatestValue` (this file) at the same call site, never one
// instead of the other.

export interface RememberLatestValueInput {
  kpiId: string;
  value: number | null;
  textValue?: string | null;
  observationAt: Date;
  retrievedAt: Date;
  sourceTag: string;
  provenance: string;
}

interface ExistingLatestRow {
  current_value: number | null;
  current_text_value: string | null;
}

/**
 * Implements Hachim's exact algorithm (docs/PREVIOUS_VALUE_PERSISTENCE_NEXT_STEPS.md
 * §3.1, his own words): "there is always the last DIFFERENT value from the
 * most recent fetch. Refetch, same value: no change. Refetch, a different
 * value: the old previous disappears, the old current becomes previous, and
 * the new fetch becomes current." Concretely:
 *   1. no row yet for this kpi_id -> INSERT, current = input, previous = null
 *   2. row exists, input equals the stored `current` (value AND textValue,
 *      date/retrieval time deliberately NOT compared — an unchanged reading
 *      re-observed later is still "no change", not a new distinct value)
 *      -> no-op
 *   3. row exists, input differs from `current` -> UPDATE: previous_* takes
 *      the old current_*, current_* becomes the input. One row, always —
 *      never an INSERT after the first.
 */
export async function rememberLatestValue(input: RememberLatestValueInput, pool: Pool = getPool()): Promise<void> {
  const existingResult = await pool.query<ExistingLatestRow>(
    "select current_value, current_text_value from public.kpi_latest_values where kpi_id = $1",
    [input.kpiId]
  );
  const existing = existingResult.rows[0];
  const incomingValue = input.value ?? null;
  const incomingText = input.textValue ?? null;

  if (!existing) {
    await pool.query(
      `insert into public.kpi_latest_values (
        kpi_id, current_value, current_text_value, current_observation_at, current_retrieved_at,
        source_tag, provenance, updated_at
      ) values ($1, $2, $3, $4, $5, $6, $7, now())`,
      [input.kpiId, incomingValue, incomingText, input.observationAt, input.retrievedAt, input.sourceTag, input.provenance]
    );
    return;
  }

  if (existing.current_value === incomingValue && existing.current_text_value === incomingText) {
    return;
  }

  await pool.query(
    `update public.kpi_latest_values set
      previous_value = current_value,
      previous_text_value = current_text_value,
      previous_observation_at = current_observation_at,
      previous_retrieved_at = current_retrieved_at,
      current_value = $2,
      current_text_value = $3,
      current_observation_at = $4,
      current_retrieved_at = $5,
      source_tag = $6,
      provenance = $7,
      updated_at = now()
    where kpi_id = $1`,
    [input.kpiId, incomingValue, incomingText, input.observationAt, input.retrievedAt, input.sourceTag, input.provenance]
  );
}

/** Convenience adapter: every `real/*.ts` builder already builds a `KpiObservationInput` for `insertObservationIfChanged` — this reuses that exact same object for `rememberLatestValue` instead of requiring a second, separately-shaped argument at every call site. */
export async function rememberLatestValueFromObservation(input: KpiObservationInput, pool?: Pool): Promise<void> {
  return rememberLatestValue(
    {
      kpiId: input.kpiId,
      value: input.numericValue ?? null,
      textValue: input.textValue ?? null,
      observationAt: input.observationAt,
      retrievedAt: input.retrievedAt,
      sourceTag: input.sourceTag,
      provenance: input.provenance,
    },
    pool
  );
}

export interface StoredLatestSlot {
  value: number | null;
  textValue: string | null;
  observationAt: Date;
  retrievedAt: Date;
}

export interface LatestValuePair {
  current: StoredLatestSlot;
  previous: StoredLatestSlot | null;
}

interface LatestValuePairRow {
  current_value: number | null;
  current_text_value: string | null;
  current_observation_at: Date;
  current_retrieved_at: Date;
  previous_value: number | null;
  previous_text_value: string | null;
  previous_observation_at: Date | null;
  previous_retrieved_at: Date | null;
}

/** Reads the single row for this KPI, if any. `previous` is `null` until a genuine second distinct value has ever been observed ("Première valeur enregistrée" case), never a fabricated/duplicate placeholder. */
export async function getLatestValuePair(kpiId: string, pool: Pool = getPool()): Promise<LatestValuePair | null> {
  const result = await pool.query<LatestValuePairRow>(
    `select current_value, current_text_value, current_observation_at, current_retrieved_at,
            previous_value, previous_text_value, previous_observation_at, previous_retrieved_at
     from public.kpi_latest_values where kpi_id = $1`,
    [kpiId]
  );
  const row = result.rows[0];
  if (!row) return null;

  return {
    current: {
      value: row.current_value,
      textValue: row.current_text_value,
      observationAt: row.current_observation_at,
      retrievedAt: row.current_retrieved_at,
    },
    previous:
      row.previous_observation_at && row.previous_retrieved_at
        ? {
            value: row.previous_value,
            textValue: row.previous_text_value,
            observationAt: row.previous_observation_at,
            retrievedAt: row.previous_retrieved_at,
          }
        : null,
  };
}
