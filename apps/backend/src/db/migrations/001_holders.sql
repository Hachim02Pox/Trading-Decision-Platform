-- Supabase (Postgres) migration — holders profile table.
-- Passwords, email confirmation and sessions are handled entirely by
-- Supabase Auth (auth.users). This table only stores profile data linked
-- 1:1 to an auth.users row. Never add a password column here.

create table if not exists public.holders (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  display_name text,
  created_at timestamptz not null default now()
);

comment on table public.holders is 'Profile row for each authenticated user. Auth (password, confirmation, sessions) lives in auth.users, not here.';

-- Row Level Security: a holder can only read/update their own row.
alter table public.holders enable row level security;

create policy "Holders can view their own profile"
  on public.holders for select
  using (auth.uid() = id);

create policy "Holders can update their own profile"
  on public.holders for update
  using (auth.uid() = id);

-- Auto-create a holders row whenever a new auth.users row is confirmed/created.
create or replace function public.handle_new_holder()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.holders (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_holder();
