-- "Always exactly the 2 most recent DISTINCT values per KPI" store — see
-- docs/PREVIOUS_VALUE_PERSISTENCE_NEXT_STEPS.md §3 for the full design
-- rationale (Hachim's own algorithm, §3.1). Deliberately NOT a history: one
-- row per kpi_id, upserted in place. `public.kpi_observations` is untouched
-- and keeps feeding F10's percentile/Z-score calculations, which need real
-- history, not just the latest 2 points — this table is populated in
-- PARALLEL (see db/kpiLatestValues.ts's rememberLatestValue, called
-- alongside the existing persistObservation/insertObservationIfChanged
-- calls in real/*.ts), never as a replacement.
create table if not exists public.kpi_latest_values (
  kpi_id varchar(64) primary key,
  current_value double precision,
  current_text_value varchar(255),
  current_observation_at timestamptz not null,
  current_retrieved_at timestamptz not null,
  previous_value double precision,
  previous_text_value varchar(255),
  previous_observation_at timestamptz,
  previous_retrieved_at timestamptz,
  source_tag varchar(64) not null,
  provenance varchar(32) not null,
  updated_at timestamptz not null default now()
);
