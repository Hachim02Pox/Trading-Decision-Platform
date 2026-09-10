import type { Pool } from "pg";
import { getPool } from "./pool";

// macro_events helpers — see migrations/002_market_data.sql for the table
// shape and the unique-constraint design rationale. F13's real calendar
// ingestion job (apps/backend/src/jobs/f13CalendarIngestion.ts) writes
// through `upsertMacroEvent` below; apps/backend/src/real/f13Calendar.ts
// reads through `getEventsInRange` to build the cockpit snapshot and the
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

/**
 * Upserts one macro event, keyed on (normalized_event_type, scheduled_at_utc,
 * currency) — see migrations/002_market_data.sql's doc comment for why this
 * key was chosen over (source, external_key).
 *
 * Never overwrites a non-null `actual_value` with NULL: on conflict,
 * actual_value (and forecast_value/previous_value/forecast_source/
 * actual_source) only change when the incoming value is non-null, via
 * `COALESCE(EXCLUDED.col, macro_events.col)`. `first_retrieved_at` is set
 * only on the initial INSERT and is never touched by the UPDATE branch.
 */
export async function upsertMacroEvent(input: MacroEventUpsertInput, pool: Pool = getPool()): Promise<void> {
  const now = new Date();

  await pool.query(
    `insert into public.macro_events (
      source, external_key, name, normalized_event_type, scheduled_at_utc,
      original_timezone, currency, impact, previous_value, forecast_value,
      actual_value, schedule_source, forecast_source, actual_source,
      first_retrieved_at, last_updated_at
    ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
    on conflict (normalized_event_type, scheduled_at_utc, currency) do update set
      source = excluded.source,
      external_key = excluded.external_key,
      name = excluded.name,
      original_timezone = excluded.original_timezone,
      impact = excluded.impact,
      previous_value = coalesce(excluded.previous_value, macro_events.previous_value),
      forecast_value = coalesce(excluded.forecast_value, macro_events.forecast_value),
      actual_value = coalesce(excluded.actual_value, macro_events.actual_value),
      schedule_source = excluded.schedule_source,
      forecast_source = coalesce(excluded.forecast_source, macro_events.forecast_source),
      actual_source = coalesce(excluded.actual_source, macro_events.actual_source),
      last_updated_at = excluded.last_updated_at`,
    [
      input.source,
      input.externalKey,
      input.name,
      input.normalizedEventType,
      input.scheduledAtUtc,
      input.originalTimezone ?? null,
      input.currency,
      input.impact,
      input.previousValue ?? null,
      input.forecastValue ?? null,
      input.actualValue ?? null,
      input.scheduleSource,
      input.forecastSource ?? null,
      input.actualSource ?? null,
      now,
      now,
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

interface MacroEventDbRow {
  id: string; // bigint comes back as a string from node-postgres by default
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
    id: Number(row.id),
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
  const conditions = ["scheduled_at_utc >= $1", "scheduled_at_utc <= $2"];
  const params: unknown[] = [fromUtc, toUtc];

  if (opts.currency) {
    params.push(opts.currency);
    conditions.push(`currency = $${params.length}`);
  }
  if (opts.currencies && opts.currencies.length > 0) {
    const placeholders = opts.currencies.map((c) => {
      params.push(c);
      return `$${params.length}`;
    });
    conditions.push(`currency in (${placeholders.join(", ")})`);
  }
  if (opts.impacts && opts.impacts.length > 0) {
    const placeholders = opts.impacts.map((i) => {
      params.push(i);
      return `$${params.length}`;
    });
    conditions.push(`impact in (${placeholders.join(", ")})`);
  }

  const result = await pool.query<MacroEventDbRow>(
    `select id, source, external_key, name, normalized_event_type, scheduled_at_utc,
            original_timezone, currency, impact, previous_value, forecast_value,
            actual_value, schedule_source, forecast_source, actual_source,
            first_retrieved_at, last_updated_at
     from public.macro_events
     where ${conditions.join(" and ")}
     order by scheduled_at_utc asc`,
    params
  );
  return result.rows.map(toMacroEventRow);
}
