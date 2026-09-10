-- 003_journal_entries.sql — the trade journal, moved off browser
-- localStorage (which lost every entry on a cleared browser/different
-- device) onto durable Postgres storage. Single-user tool, no user_id
-- column — every row belongs to the one trader using this terminal.
create table if not exists public.journal_entries (
  id varchar(36) primary key,
  created_at timestamptz not null,
  traded_at date not null,
  instrument varchar(32) not null,
  direction varchar(16) not null,
  setup varchar(120) not null,
  thesis text not null,
  invalidation text not null,
  outcome_r double precision,
  followed_plan boolean not null,
  notes text not null
);

create index if not exists idx_journal_entries_traded_at on public.journal_entries (traded_at);
