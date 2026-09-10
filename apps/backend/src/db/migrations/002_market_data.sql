-- 002_market_data.sql — macro_events, kpi_observations, ingestion_state.
-- Postgres equivalents of the old MySQL 001_init.sql, ported when this
-- project's DB moved off local MySQL onto Supabase Postgres (2026-09-09) —
-- see docs/AUTH_SUPABASE.md. Same shapes, same rationale as the originals.

-- macro_events — real F13 economic-calendar events.
--
-- UNIQUE constraint choice: (normalized_event_type, scheduled_at_utc,
-- currency), NOT (source, external_key). Rationale: a provider's
-- `external_key` for "the same" real-world event is not guaranteed stable
-- across that provider's own revisions (a rescheduled release can resurface
-- under a different upstream id), whereas an event's semantic identity —
-- what it is, when it happens, and which currency/economy it concerns — is
-- the actually-stable real-world key an UPSERT should key off of. `source`
-- and `external_key` are still stored and indexed (for audit/debugging and
-- provider-side lookups), just not used as the uniqueness boundary.
create table if not exists public.macro_events (
  id bigserial primary key,
  source varchar(64) not null,
  external_key varchar(255) not null,
  name varchar(255) not null,
  normalized_event_type varchar(128) not null,
  scheduled_at_utc timestamptz not null,
  original_timezone varchar(64),
  currency varchar(16) not null,
  impact varchar(16) not null,
  previous_value varchar(64),
  forecast_value varchar(64),
  actual_value varchar(64),
  schedule_source varchar(64) not null,
  forecast_source varchar(64),
  actual_source varchar(64),
  first_retrieved_at timestamptz not null,
  last_updated_at timestamptz not null,
  constraint uq_macro_events_identity unique (normalized_event_type, scheduled_at_utc, currency)
);

create index if not exists idx_macro_events_source on public.macro_events (source, external_key);

-- kpi_observations — append-only history of canonical KPI readings. No raw
-- provider JSON is ever stored here (numeric_value/text_value only).
-- Deliberately NO unique constraint on (kpi_id, observation_at): a later
-- fetch returning the SAME value for an already-seen (kpi_id,
-- observation_at) is deduplicated in application code
-- (insertObservationIfChanged, see kpiObservations.ts), but a genuine
-- revision — same key, a DIFFERENT value — must be free to insert a new row
-- rather than overwrite/destroy the earlier reading.
create table if not exists public.kpi_observations (
  id bigserial primary key,
  kpi_id varchar(64) not null,
  observation_at timestamptz not null,
  retrieved_at timestamptz not null,
  numeric_value double precision,
  text_value varchar(255),
  source_tag varchar(64) not null,
  provenance varchar(32) not null,
  proxy_for varchar(64),
  status varchar(64),
  created_at timestamptz not null default now()
);

create index if not exists idx_kpi_observations_kpi_obs on public.kpi_observations (kpi_id, observation_at);
create index if not exists idx_kpi_observations_kpi_retrieved on public.kpi_observations (kpi_id, retrieved_at);

-- ingestion_state — one row per named ingestion job; scheduling/health
-- metadata for the generic ingestion helper (see ingestionState.ts /
-- ingestionRunner.ts). `last_error` is intentionally short (varchar(512))
-- and is expected to hold a safe one-line summary, never a full stack trace.
create table if not exists public.ingestion_state (
  job_key varchar(128) primary key,
  last_attempt_at timestamptz,
  last_success_at timestamptz,
  last_status varchar(16) not null default 'NEVER_RUN',
  last_error varchar(512),
  expected_next_at timestamptz
);
