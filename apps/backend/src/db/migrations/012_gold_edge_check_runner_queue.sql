-- Durable runner coordination for manual edge checks.  Results remain separate
-- from gold_market_states and a completed/failed job is never reopened.
alter table public.gold_edge_checks
  add column if not exists worker_id varchar(128),
  add column if not exists claimed_at timestamptz,
  add column if not exists lease_expires_at timestamptz,
  add column if not exists attempt_count integer not null default 0,
  add column if not exists failure_code varchar(64);

create index if not exists idx_gold_edge_checks_claimable
  on public.gold_edge_checks (status, lease_expires_at, created_at);

create or replace function public.enforce_gold_edge_check_transition()
returns trigger language plpgsql as $$
begin
  if old.status in ('COMPLETED', 'FAILED') then
    raise exception 'terminal gold edge checks are immutable';
  end if;
  if old.status = 'QUEUED' and new.status not in ('QUEUED', 'RUNNING', 'FAILED') then
    raise exception 'illegal gold edge check transition';
  end if;
  if old.status = 'RUNNING' and new.status not in ('RUNNING', 'COMPLETED', 'FAILED') then
    raise exception 'illegal gold edge check transition';
  end if;
  return new;
end;
$$;
drop trigger if exists gold_edge_checks_transition_guard on public.gold_edge_checks;
create trigger gold_edge_checks_transition_guard before update on public.gold_edge_checks
for each row execute function public.enforce_gold_edge_check_transition();
