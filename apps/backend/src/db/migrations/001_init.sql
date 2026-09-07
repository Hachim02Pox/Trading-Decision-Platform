-- 001_init.sql — foundation schema for the persistence layer.
-- Applied/tracked by apps/backend/src/db/migrate.ts.

-- Bootstraps the migration-tracking table itself (the runner also creates
-- this defensively before reading this file, so this statement is IF NOT
-- EXISTS and safe to run either way).
CREATE TABLE IF NOT EXISTS schema_migrations (
  filename VARCHAR(255) NOT NULL,
  applied_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (filename)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- macro_events — real F13 economic-calendar events. A later phase wires an
-- actual F13 fetcher up to this table; this migration only needs the table
-- to exist correctly.
--
-- UNIQUE KEY choice: (normalized_event_type, scheduled_at_utc, currency),
-- NOT (source, external_key). Rationale: a provider's `external_key` for
-- "the same" real-world event is not guaranteed stable across that
-- provider's own revisions (a rescheduled release can resurface under a
-- different upstream id), whereas an event's semantic identity — what it
-- is, when it happens, and which currency/economy it concerns — is the
-- actually-stable real-world key an UPSERT should key off of. `source` and
-- `external_key` are still stored and indexed (for audit/debugging and
-- provider-side lookups), just not used as the uniqueness boundary.
CREATE TABLE IF NOT EXISTS macro_events (
  id BIGINT NOT NULL AUTO_INCREMENT,
  source VARCHAR(64) NOT NULL,
  external_key VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  normalized_event_type VARCHAR(128) NOT NULL,
  scheduled_at_utc DATETIME NOT NULL,
  original_timezone VARCHAR(64) NULL,
  currency VARCHAR(16) NOT NULL,
  impact VARCHAR(16) NOT NULL,
  previous_value VARCHAR(64) NULL,
  forecast_value VARCHAR(64) NULL,
  actual_value VARCHAR(64) NULL,
  schedule_source VARCHAR(64) NOT NULL,
  forecast_source VARCHAR(64) NULL,
  actual_source VARCHAR(64) NULL,
  first_retrieved_at DATETIME NOT NULL,
  last_updated_at DATETIME NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_macro_events_identity (normalized_event_type, scheduled_at_utc, currency),
  KEY idx_macro_events_source (source, external_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- kpi_observations — append-only history of canonical KPI readings. No raw
-- provider JSON is ever stored here (numeric_value/text_value only).
-- Deliberately NO unique constraint on (kpi_id, observation_at): a later
-- fetch returning the SAME value for an already-seen (kpi_id,
-- observation_at) is deduplicated in application code
-- (insertObservationIfChanged, see kpiObservations.ts), but a genuine
-- revision — same key, a DIFFERENT value — must be free to insert a new row
-- rather than overwrite/destroy the earlier reading.
CREATE TABLE IF NOT EXISTS kpi_observations (
  id BIGINT NOT NULL AUTO_INCREMENT,
  kpi_id VARCHAR(64) NOT NULL,
  observation_at DATETIME NOT NULL,
  retrieved_at DATETIME NOT NULL,
  numeric_value DOUBLE NULL,
  text_value VARCHAR(255) NULL,
  source_tag VARCHAR(64) NOT NULL,
  provenance VARCHAR(32) NOT NULL,
  proxy_for VARCHAR(64) NULL,
  status VARCHAR(64) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_kpi_observations_kpi_obs (kpi_id, observation_at),
  KEY idx_kpi_observations_kpi_retrieved (kpi_id, retrieved_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ingestion_state — one row per named ingestion job; scheduling/health
-- metadata for the generic ingestion helper (see ingestionState.ts /
-- ingestionRunner.ts). `last_error` is intentionally short (VARCHAR(512))
-- and is expected to hold a safe one-line summary, never a full stack trace.
CREATE TABLE IF NOT EXISTS ingestion_state (
  job_key VARCHAR(128) NOT NULL,
  last_attempt_at DATETIME NULL,
  last_success_at DATETIME NULL,
  last_status VARCHAR(16) NOT NULL DEFAULT 'NEVER_RUN',
  last_error VARCHAR(512) NULL,
  expected_next_at DATETIME NULL,
  PRIMARY KEY (job_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
