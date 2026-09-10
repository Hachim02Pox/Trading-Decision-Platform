import type { JournalEntry, TradeDirection } from "@/lib/traderWorkspace";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4001";

export interface NewJournalEntryInput {
  tradedAt: string;
  direction: TradeDirection;
  setup: string;
  thesis: string;
  invalidation: string;
  outcomeR: number | null;
  followedPlan: boolean;
  notes: string;
}

async function readErrorMessage(res: Response, fallback: string): Promise<string> {
  try {
    const body = (await res.json()) as { error?: string };
    return body.error ?? fallback;
  } catch {
    return fallback;
  }
}

export async function fetchJournalEntries(): Promise<JournalEntry[]> {
  const res = await fetch(`${BACKEND_URL}/api/journal`, { cache: "no-store" });
  if (!res.ok) throw new Error(await readErrorMessage(res, `Failed to fetch journal entries: ${res.status}`));
  const body = (await res.json()) as { entries: JournalEntry[] };
  return body.entries;
}

export async function createJournalEntry(input: NewJournalEntryInput): Promise<JournalEntry> {
  const res = await fetch(`${BACKEND_URL}/api/journal`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(await readErrorMessage(res, `Failed to save journal entry: ${res.status}`));
  const body = (await res.json()) as { entry: JournalEntry };
  return body.entry;
}

export async function deleteJournalEntry(id: string): Promise<void> {
  const res = await fetch(`${BACKEND_URL}/api/journal/${encodeURIComponent(id)}`, { method: "DELETE" });
  if (!res.ok && res.status !== 404) throw new Error(await readErrorMessage(res, `Failed to delete journal entry: ${res.status}`));
}

export async function updateJournalEntryNotes(id: string, notes: string): Promise<JournalEntry> {
  const res = await fetch(`${BACKEND_URL}/api/journal/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ notes }),
  });
  if (!res.ok) throw new Error(await readErrorMessage(res, `Failed to save review note: ${res.status}`));
  const body = (await res.json()) as { entry: JournalEntry };
  return body.entry;
}
