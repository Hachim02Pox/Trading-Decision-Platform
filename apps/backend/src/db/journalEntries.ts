import type { Pool } from "pg";
import { getPool } from "./pool";

// journal_entries — see migrations/003_journal_entries.sql. Replaces the
// frontend's old browser-localStorage journal (user-explicit request,
// 2026-09: "la sauvegarde du journal ça doit être sur SQL") — every entry
// now lives in Postgres (Supabase), survives a cleared browser/a different
// device, and is never silently lost.

export type TradeDirection = "LONG" | "SHORT" | "NO_TRADE";

export interface JournalEntryInput {
  id: string;
  holderId: string;
  createdAt: Date;
  tradedAt: string; // "YYYY-MM-DD"
  instrument: string;
  direction: TradeDirection;
  setup: string;
  thesis: string;
  invalidation: string;
  outcomeR: number | null;
  followedPlan: boolean;
  notes: string;
}

// Never expose holder_id back to the client — it's an access-control detail,
// not journal content.
export type StoredJournalEntry = Omit<JournalEntryInput, "holderId">;

interface JournalEntryRow {
  id: string;
  created_at: Date;
  traded_at: Date;
  instrument: string;
  direction: string;
  setup: string;
  thesis: string;
  invalidation: string;
  outcome_r: number | null;
  followed_plan: boolean;
  notes: string;
}

function toStoredEntry(row: JournalEntryRow): StoredJournalEntry {
  return {
    id: row.id,
    createdAt: row.created_at,
    tradedAt: row.traded_at.toISOString().slice(0, 10),
    instrument: row.instrument,
    direction: row.direction as TradeDirection,
    setup: row.setup,
    thesis: row.thesis,
    invalidation: row.invalidation,
    outcomeR: row.outcome_r,
    followedPlan: row.followed_plan,
    notes: row.notes,
  };
}

export async function insertJournalEntry(input: JournalEntryInput, pool: Pool = getPool()): Promise<void> {
  await pool.query(
    `insert into public.journal_entries (
      id, holder_id, created_at, traded_at, instrument, direction, setup, thesis, invalidation, outcome_r, followed_plan, notes
    ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
    [
      input.id,
      input.holderId,
      input.createdAt,
      input.tradedAt,
      input.instrument,
      input.direction,
      input.setup,
      input.thesis,
      input.invalidation,
      input.outcomeR,
      input.followedPlan,
      input.notes,
    ]
  );
}

/**
 * Newest-first by trade date, then by creation order within the same date.
 * Scoped to `holderId` — each holder only ever sees their own trades (see
 * migrations/010_journal_entries_holder_id.sql, fixed a real cross-account
 * data leak where every signed-in holder shared one journal).
 */
export async function listJournalEntries(holderId: string, pool: Pool = getPool()): Promise<StoredJournalEntry[]> {
  const result = await pool.query<JournalEntryRow>(
    `select id, created_at, traded_at, instrument, direction, setup, thesis, invalidation, outcome_r, followed_plan, notes
     from public.journal_entries
     where holder_id = $1
     order by traded_at desc, created_at desc`,
    [holderId]
  );
  return result.rows.map(toStoredEntry);
}

/** Returns true if a row was actually deleted. Scoped to `holderId` so one holder can never delete another's entry, even by guessing/reusing an id. */
export async function deleteJournalEntry(id: string, holderId: string, pool: Pool = getPool()): Promise<boolean> {
  const result = await pool.query(`delete from public.journal_entries where id = $1 and holder_id = $2`, [id, holderId]);
  return (result.rowCount ?? 0) > 0;
}

/**
 * Updates only the review note of an existing entry — the post-trade debrief,
 * added after the trade is already logged rather than at entry creation.
 * Scoped to `holderId`, same reasoning as `deleteJournalEntry`. Returns the
 * updated entry, or null if no matching row was found for this holder.
 */
export async function updateJournalEntryNotes(
  id: string,
  notes: string,
  holderId: string,
  pool: Pool = getPool()
): Promise<StoredJournalEntry | null> {
  const result = await pool.query<JournalEntryRow>(
    `update public.journal_entries set notes = $2 where id = $1 and holder_id = $3
     returning id, created_at, traded_at, instrument, direction, setup, thesis, invalidation, outcome_r, followed_plan, notes`,
    [id, notes, holderId]
  );
  return result.rows[0] ? toStoredEntry(result.rows[0]) : null;
}
