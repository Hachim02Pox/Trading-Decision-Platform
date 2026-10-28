-- Backend data is accessed through authenticated Express routes using the
-- database owner connection. Supabase browser keys must never bypass those
-- route-level ownership checks through PostgREST, GraphQL, or Realtime.
-- No policies are intentionally created for backend-only tables: RLS denies
-- browser roles even if privileges are accidentally granted again later.
do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'macro_events', 'kpi_observations', 'ingestion_state',
    'journal_entries', 'sunday_reads', 'gold_overnight_recaps',
    'kpi_latest_values', 'gold_market_states', 'gold_edge_checks',
    'execution_trade_annotations', 'schema_migrations'
  ] loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('revoke all privileges on table public.%I from public, anon, authenticated', table_name);
  end loop;
end;
$$;

-- These sequences belong exclusively to backend-owned append-only tables.
revoke all privileges on sequence public.macro_events_id_seq,
  public.kpi_observations_id_seq from public, anon, authenticated;

-- holders remains the sole directly browser-accessible application table;
-- its existing auth.uid() policies enforce access to the caller's own row.
alter table public.holders enable row level security;
revoke all privileges on table public.holders from public, anon, authenticated;
grant select, update on table public.holders to authenticated;

-- Trigger functions are invoked by PostgreSQL, never through browser RPC.
revoke execute on function public.handle_new_holder() from public, anon, authenticated;
revoke execute on function public.enforce_gold_edge_check_transition() from public, anon, authenticated;

-- Migrations run as the owner. Prevent new owner-created backend objects
-- from silently inheriting Supabase's permissive browser-role defaults.
alter default privileges in schema public revoke all on tables from public, anon, authenticated;
alter default privileges in schema public revoke all on sequences from public, anon, authenticated;
alter default privileges in schema public revoke execute on functions from public, anon, authenticated;
