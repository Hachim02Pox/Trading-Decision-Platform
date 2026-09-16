-- Durable "latest Night Recap per language" store — mirrors the fix applied
-- to previousFetch earlier the same day (2026-09-16): the ephemeral
-- .runtime/goldOvernightRecap.json file is wiped on every backend
-- restart/redeploy, so a Railway redeploy landing between the ~9am ET
-- generation and Hachim opening the site would wrongly show "no recap yet".
-- Only ever holds the single most recent recap per language (EN/FR) — not a
-- history — so a plain upsert-by-language row is enough.
create table if not exists public.gold_overnight_recaps (
  language varchar(8) primary key,
  recap jsonb not null,
  updated_at timestamptz not null default now()
);
