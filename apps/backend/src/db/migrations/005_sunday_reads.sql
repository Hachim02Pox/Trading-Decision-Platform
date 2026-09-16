-- Sunday Read — Drive-ingested production runs. Modeled on an append-audit
-- pattern (jsonb report column, app-supplied varchar(36) primary key) but
-- with an explicit status column
-- since a Sunday Read candidate moves through VALID -> PUBLISHED (or
-- REJECTED) and a later run for the SAME run_date can SUPERSEDE an earlier
-- PUBLISHED one (see docs on ingestion/ingest.ts's revision handling).
--
-- One row per distinct (run_date, content_hash) — re-ingesting byte-identical
-- Drive content is a no-op (idempotent), a genuinely revised run for the same
-- Sunday gets its own row and supersedes the previous PUBLISHED one.
create table if not exists public.sunday_reads (
  id varchar(36) primary key,
  run_date date not null,
  content_hash char(64) not null,
  status varchar(16) not null check (status in ('VALID', 'PUBLISHED', 'REJECTED', 'SUPERSEDED')),
  data_mode varchar(16),
  schema_version varchar(64),
  generated_at timestamptz,
  as_of text,
  json_payload jsonb,
  human_report text,
  run_report text,
  validation_report text,
  drive_json_file_id text,
  drive_json_modified_time text,
  drive_markdown_file_id text,
  drive_run_report_file_id text,
  drive_validation_report_file_id text,
  error_code varchar(64),
  error_message varchar(500),
  ingested_at timestamptz,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (run_date, content_hash)
);

create index if not exists idx_sunday_reads_run_date on public.sunday_reads (run_date desc);
create index if not exists idx_sunday_reads_status on public.sunday_reads (status);

-- Database-level guarantee (not just application logic) that at most one row
-- per run_date is ever PUBLISHED at a time — the frontend's "current" query
-- can never see two competing versions of the same Sunday.
create unique index if not exists idx_sunday_reads_one_published_per_run_date
  on public.sunday_reads (run_date) where status = 'PUBLISHED';
