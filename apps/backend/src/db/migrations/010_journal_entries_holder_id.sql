-- 010_journal_entries_holder_id.sql — per-account isolation for the trade
-- journal. Was single-user (see 003_journal_entries.sql, "single-user tool,
-- no user_id column"); now several holders share the same terminal/database,
-- and each one was seeing every other holder's trades — nullable for now,
-- existing rows are backfilled to their real owner in 011.
alter table public.journal_entries
  add column if not exists holder_id uuid references public.holders (id) on delete cascade;

create index if not exists idx_journal_entries_holder_id on public.journal_entries (holder_id);
