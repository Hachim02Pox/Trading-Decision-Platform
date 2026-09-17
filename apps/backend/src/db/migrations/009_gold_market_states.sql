-- Gold market states — unified Drive-ingested table for BOTH Sunday Reads
-- (V2 legacy and V3) and V3 intermediate recaps
-- (GOLD_CONTINUOUS_RECAP_PROTOCOL.md). This table is ADDITIVE: it does not
-- replace public.sunday_reads (005_sunday_reads.sql), which keeps serving
-- the existing GET /api/sunday-read* routes unchanged for backward
-- compatibility. This table backs the new GET /api/gold/read/* routes and
-- POST /internal/gold/refresh — see apps/backend/src/goldMarketState/**.
--
-- Unlike sunday_reads (one row per run_date, later runs SUPERSEDE earlier
-- ones), every row here is identified by its own document meta.run_id and,
-- once PUBLISHED, is immutable and permanent — per
-- GOLD_CONTINUOUS_RECAP_PROTOCOL.md §2 ("the Sunday Read historical reste
-- disponible; l'intermédiaire N est ajouté sans modifier les précédents").
-- "Current" is a SELECT (lineage-tip selection, see
-- goldMarketState/selection.ts), never a supersede UPDATE.
create table if not exists public.gold_market_states (
  id varchar(36) primary key,
  run_id text not null,
  content_hash char(64) not null,
  status varchar(16) not null check (status in ('VALID', 'PUBLISHED', 'REJECTED')),
  -- Lineage / eligibility metadata, mirrors schema/sunday_read.schema.json's
  -- meta.* additions. NULL run_type = a legacy V1/V2 document (no rolling
  -- lineage) — still eligible for display via the filename-based grandfather
  -- rule in ingest.ts, exactly like today's sunday_reads pipeline.
  run_type varchar(16) check (run_type in ('SUNDAY', 'INTERMEDIATE')),
  document_type varchar(32),
  frontend_eligible boolean,
  parent_run_id text,
  origin_sunday_run_id text,
  evidence_cutoff_start text,
  evidence_cutoff_end text,
  data_mode varchar(16),
  generated_at timestamptz,
  as_of text,
  presentation_version int,
  direction_state jsonb,
  json_payload jsonb,
  human_report text,
  run_report text,
  validation_report text,
  drive_json_file_id text,
  drive_json_modified_time text,
  drive_markdown_file_id text,
  error_code varchar(64),
  error_message varchar(500),
  ingested_at timestamptz,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (run_id, content_hash)
);

create index if not exists idx_gold_market_states_run_id on public.gold_market_states (run_id);
create index if not exists idx_gold_market_states_status on public.gold_market_states (status);
create index if not exists idx_gold_market_states_origin on public.gold_market_states (origin_sunday_run_id);

-- A given run_id may have at most one PUBLISHED row (a genuinely revised
-- upload for the SAME run_id — e.g. a corrected re-publish — inserts a new
-- content_hash row; publishing it should be a deliberate, rare operational
-- action, not automatic supersede, since published market states are meant
-- to be immutable per the continuous-recap protocol).
create unique index if not exists idx_gold_market_states_one_published_per_run_id
  on public.gold_market_states (run_id) where status = 'PUBLISHED';
