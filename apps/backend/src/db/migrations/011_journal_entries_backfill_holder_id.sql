-- 011_journal_entries_backfill_holder_id.sql — every journal_entries row
-- that existed before 010 was logged by the terminal's original trader
-- (hachimtib06@gmail.com) back when this was a single-user tool. Assign
-- them to that holder so they don't just disappear once /api/journal starts
-- filtering by holder_id. Safe to re-run: only touches rows still unowned.
-- If this holder's email ever changes, update it here before re-running.
update public.journal_entries
set holder_id = (select id from public.holders where email = 'hachimtib06@gmail.com')
where holder_id is null;
