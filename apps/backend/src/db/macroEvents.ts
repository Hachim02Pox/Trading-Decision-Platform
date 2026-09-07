import type { Pool, RowDataPacket } from "mysql2/promise";
import { getPool } from "./pool";

// macro_events helpers — see migrations/001_init.sql for the table shape and
// the UNIQUE KEY design rationale. F13's real calendar ingestion job
// (apps/backend/src/jobs/f13CalendarIngestion.ts) writes through
// `upsertMacroEvent` below; apps/backend/src/real/f13Calendar.ts reads
// through `getEventsInRange` to build the cockpit snapshot and the
// dedicated /api/calendar/* routes.

export interface MacroEventUpsertInput {
  source: string;
  externalKey: string;
  name: string;
  normalizedEventType: string;
  scheduledAtUtc: Date;
  originalTimezone?: string | null;
  currency: string;
  impact: string;
  previousValue?: string | null;
  forecastValue?: string | null;
  actualValue?: string | null;
  scheduleSource: string;
  forecastSource?: string | null;
  actualSource?: string | null;
}

function toMysqlDatetime(date: Date): string {
  return date.toISOString().slice(0, 19).replace("T", " ");
}

/**
 * Upserts one macro event, keyed on (normalized_event_type, scheduled_at_utc,
 * currency) — see 001_init.sql's doc comment for why this key was chosen
 * over (source, external_key).
 *
 * Never overwrites a non-null `actual_value` with NULL: on conflict,
 * actual_value (and forecast_value/previous_value/forecast_source/
 * actual_source) only change when the incoming value is non-null, via
 * `COALESCE(VALUES(col), col)`. `first_retrieved_at` is set only on the
 * initial INSERT and is never touched by the UPDATE branch.
 */
export async function upsertMacroEvent(input: MacroEventUpsertInput, pool: Pool = getPool()): Promise<void> {
  const nowIso = toMysqlDatetime(new Date());
  const scheduledAt = toMysqlDatetime(input.scheduledAtUtc);

  await pool.query(
    `INSERT INTO macro_events (
      source, external_key, name, normalized_event_type, scheduled_at_utc,
      original_timezone, currency, impact, previous_value, forecast_value,
      actual_value, schedule_source, forecast_source, actual_source,
      first_retrieved_at, last_updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      source = VALUES(source),
      external_key = VALUES(external_key),
      name = VALUES(name),
      original_timezone = VALUES(original_timezone),
      impact = VALUES(impact),
      previous_value = COALESCE(VALUES(previous_value), previous_value),
      forecast_value = COALESCE(VALUES(forecast_value), forecast_value),
      actual_value = COALESCE(VALUES(actual_value), actual_value),
      schedule_source = VALUES(schedule_source),
      forecast_source = COALESCE(VALUES(forecast_source), forecast_source),
      actual_source = COALESCE(VALUES(actual_source), actual_source),
      last_updated_at = VALUES(last_updated_at)`,
    [
      input.source,
      input.externalKey,
      input.name,
      input.normalizedEventType,
      scheduledAt,
      input.originalTimezone ?? null,
      input.currency,
      input.impact,
      input.previousValue ?? null,
      input.forecastValue ?? null,
      input.actualValue ?? null,
      input.scheduleSource,
      input.forecastSource ?? null,
      input.actualSource ?? null,
      nowIso,
      nowIso,
    ]
  );
}

// ---------------------------------------------------------------------------
// Read helpers — F13's real calendar surface (snapshot cockpit fields +
// /api/calendar/* routes). Additive; upsertMacroEvent above is unchanged.
// ---------------------------------------------------------------------------

export interface MacroEventRow {
  id: number;
  source: string;
  externalKey: string;
  name: string;
  normalizedEventType: string;
  scheduledAtUtc: Date;
  originalTimezone: string | null;
  currency: string;
  impact: string;
  previousValue: string | null;
  forecastValue: string | null;
  actualValue: string | null;
  scheduleSource: string;
  forecastSource: string | null;
  actualSource: string | null;
  firstRetrievedAt: Date;
  lastUpdatedAt: Date;
}

interface MacroEventDbRow extends RowDataPacket {
  id: number;
  source: string;
  external_key: string;
  name: string;
  normalized_event_type: string;
  scheduled_at_utc: Date;
  original_timezone: string | null;
  currency: string;
  impact: string;
  previous_value: string | null;
  forecast_value: string | null;
  actual_value: string | null;
  schedule_source: string;
  forecast_source: string | null;
  actual_source: string | null;
  first_retrieved_at: Date;
  last_updated_at: Date;
}

function toMacroEventRow(row: MacroEventDbRow): MacroEventRow {
  return {
    id: row.id,
    source: row.source,
    externalKey: row.external_key,
    name: row.name,
    normalizedEventType: row.normalized_event_type,
    scheduledAtUtc: row.scheduled_at_utc,
    originalTimezone: row.original_timezone,
    currency: row.currency,
    impact: row.impact,
    previousValue: row.previous_value,
    forecastValue: row.forecast_value,
    actualValue: row.actual_value,
    scheduleSource: row.schedule_source,
    forecastSource: row.forecast_source,
    actualSource: row.actual_source,
    firstRetrievedAt: row.first_retrieved_at,
    lastUpdatedAt: row.last_updated_at,
  };
}

function toMysqlDatetimeRange(date: Date): string {
  return date.toISOString().slice(0, 19).replace("T", " ");
}

/**
 * Fetches every stored event in `[fromUtc, toUtc]` (inclusive), optionally
 * filtered to a single currency and/or a list of currencies and/or a set of
 * impact levels, ordered by scheduled time. Used by both the cockpit
 * snapshot builder (High-impact, USD+JPY — see f13Calendar.ts) and the
 * dedicated `/api/calendar/*` routes. `currency` (singular) and `currencies`
 * (plural) may both be supplied — each contributes its own `AND`-ed
 * condition — but callers should normally use only one; f3Fed.ts keeps the
 * original singular `currency` filter, while f13Calendar.ts uses `currencies`
 * for its USD+JPY multi-currency filter.
 */
export async function getEventsInRange(
  fromUtc: Date,
  toUtc: Date,
  opts: { currency?: string; currencies?: string[]; impacts?: string[] } = {},
  pool: Pool = getPool()
): Promise<MacroEventRow[]> {
  const conditions = ["scheduled_at_utc >= ?", "scheduled_at_utc <= ?"];
  const params: unknown[] = [toMysqlDatetimeRange(fromUtc), toMysqlDatetimeRange(toUtc)];

  if (opts.currency) {
    conditions.push("currency = ?");
    params.push(opts.currency);
  }
  if (opts.currencies && opts.currencies.length > 0) {
    conditions.push(`currency IN (${opts.currencies.map(() => "?").join(", ")})`);
    params.push(...opts.currencies);
  }
  if (opts.impacts && opts.impacts.length > 0) {
    conditions.push(`impact IN (${opts.impacts.map(() => "?").join(", ")})`);
    params.push(...opts.impacts);
  }

  const [rows] = await pool.query<MacroEventDbRow[]>(
    `SELECT id, source, external_key, name, normalized_event_type, scheduled_at_utc,
            original_timezone, currency, impact, previous_value, forecast_value,
            actual_value, schedule_source, forecast_source, actual_source,
            first_retrieved_at, last_updated_at
     FROM macro_events
     WHERE ${conditions.join(" AND ")}
     ORDER BY scheduled_at_utc ASC`,
    params
  );
  return rows.map(toMacroEventRow);
}
