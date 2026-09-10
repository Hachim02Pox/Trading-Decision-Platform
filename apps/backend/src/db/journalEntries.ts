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

export type StoredJournalEntry = JournalEntryInput;

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
      id, created_at, traded_at, instrument, direction, setup, thesis, invalidation, outcome_r, followed_plan, notes
    ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
    [
      input.id,
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

/** Newest-first by trade date, then by creation order within the same date. */
export async function listJournalEntries(pool: Pool = getPool()): Promise<StoredJournalEntry[]> {
  const result = await pool.query<JournalEntryRow>(
    `select id, created_at, traded_at, instrument, direction, setup, thesis, invalidation, outcome_r, followed_plan, notes
     from public.journal_entries
     order by traded_at desc, created_at desc`
  );
  return result.rows.map(toStoredEntry);
}

/** Returns true if a row was actually deleted. */
export async function deleteJournalEntry(id: string, pool: Pool = getPool()): Promise<boolean> {
  const result = await pool.query(`delete from public.journal_entries where id = $1`, [id]);
  return (result.rowCount ?? 0) > 0;
}
