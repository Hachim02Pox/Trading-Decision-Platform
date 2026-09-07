import type { Pool, ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { getPool } from "./pool";

// journal_entries — see migrations/002_journal_entries.sql. Replaces the
// frontend's old browser-localStorage journal (user-explicit request,
// 2026-09: "la sauvegarde du journal ça doit être sur SQL") — every entry
// now lives in MySQL, survives a cleared browser/a different device, and is
// never silently lost.

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

function toMysqlDatetime(date: Date): string {
  return date.toISOString().slice(0, 19).replace("T", " ");
}

interface JournalEntryRow extends RowDataPacket {
  id: string;
  created_at: Date;
  traded_at: Date;
  instrument: string;
  direction: string;
  setup: string;
  thesis: string;
  invalidation: string;
  outcome_r: number | null;
  followed_plan: number;
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
    followedPlan: row.followed_plan === 1,
    notes: row.notes,
  };
}

export async function insertJournalEntry(input: JournalEntryInput, pool: Pool = getPool()): Promise<void> {
  await pool.query(
    `INSERT INTO journal_entries (
      id, created_at, traded_at, instrument, direction, setup, thesis, invalidation, outcome_r, followed_plan, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      input.id,
      toMysqlDatetime(input.createdAt),
      input.tradedAt,
      input.instrument,
      input.direction,
      input.setup,
      input.thesis,
      input.invalidation,
      input.outcomeR,
      input.followedPlan ? 1 : 0,
      input.notes,
    ]
  );
}

/** Newest-first by trade date, then by creation order within the same date. */
export async function listJournalEntries(pool: Pool = getPool()): Promise<StoredJournalEntry[]> {
  const [rows] = await pool.query<JournalEntryRow[]>(
    `SELECT id, created_at, traded_at, instrument, direction, setup, thesis, invalidation, outcome_r, followed_plan, notes
     FROM journal_entries
     ORDER BY traded_at DESC, created_at DESC`
  );
  return rows.map(toStoredEntry);
}

/** Returns true if a row was actually deleted. */
export async function deleteJournalEntry(id: string, pool: Pool = getPool()): Promise<boolean> {
  const [result] = await pool.query<ResultSetHeader>(`DELETE FROM journal_entries WHERE id = ?`, [id]);
  return result.affectedRows > 0;
}
