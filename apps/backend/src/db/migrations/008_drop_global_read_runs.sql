-- Global Read (Lecture Globale) was removed from the product entirely
-- (2026-09-16, explicit product decision — Sunday Read / Histoire du Marché
-- is the only cross-family AI read kept). Drops the table its now-deleted
-- migration (004_global_read_runs.sql, also deleted) created.
drop table if exists public.global_read_runs;
