create table if not exists public.global_read_runs (
  run_id varchar(36) primary key,
  method_version varchar(64) not null,
  snapshot_hash char(64) not null,
  language varchar(8) not null,
  readiness varchar(32) not null,
  as_of timestamptz not null,
  report jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_global_read_as_of on public.global_read_runs (as_of);
