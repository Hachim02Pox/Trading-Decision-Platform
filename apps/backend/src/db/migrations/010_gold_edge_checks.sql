-- Immutable manual edge-check jobs. This table is deliberately independent
-- from gold_market_states: an edge check can never become the current state.
create table if not exists public.gold_edge_checks (
  id uuid primary key,
  request_id uuid not null unique,
  requested_by uuid not null,
  idempotency_key varchar(200) not null,
  base_run_id text not null,
  base_content_hash char(64) not null,
  base_information_cutoff timestamptz not null,
  inherited_state jsonb not null,
  status varchar(16) not null check (status in ('QUEUED', 'RUNNING', 'COMPLETED', 'FAILED')),
  source_window_start timestamptz,
  source_window_end timestamptz,
  result jsonb,
  request_payload jsonb not null,
  result_content_hash char(64),
  error_message varchar(500),
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (requested_by, idempotency_key)
);

create index if not exists idx_gold_edge_checks_base on public.gold_edge_checks (base_run_id, created_at desc);
create index if not exists idx_gold_edge_checks_status on public.gold_edge_checks (status, created_at);

-- A completed result is immutable. Failure transitions remain possible only
-- before completion, so retries preserve the same job identity.
create or replace function public.prevent_completed_gold_edge_check_mutation()
returns trigger language plpgsql as $$
begin
  if old.status = 'COMPLETED' then
    raise exception 'completed gold edge checks are immutable';
  end if;
  return new;
end;
$$;
drop trigger if exists gold_edge_checks_completed_immutable on public.gold_edge_checks;
create trigger gold_edge_checks_completed_immutable before update on public.gold_edge_checks
for each row execute function public.prevent_completed_gold_edge_check_mutation();
