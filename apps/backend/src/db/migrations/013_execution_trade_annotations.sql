-- Short, structured follow-up for a FundedNext trade. Provider data remains
-- read-only; this table holds only the trader's own classification.
create table if not exists public.execution_trade_annotations (
  holder_id uuid not null references public.holders(id) on delete cascade,
  fundednext_account_id bigint not null,
  fundednext_trade_id varchar(160) not null,
  reason varchar(16) not null check (reason in ('TECHNICAL', 'MACRO', 'NEWS', 'FLOW', 'RISK', 'OTHER')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (holder_id, fundednext_account_id, fundednext_trade_id)
);

create index if not exists idx_execution_trade_annotations_holder_account
  on public.execution_trade_annotations (holder_id, fundednext_account_id);
