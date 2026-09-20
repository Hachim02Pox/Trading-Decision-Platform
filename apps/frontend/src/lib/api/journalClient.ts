import type { JournalEntry, TradeDirection } from "@/lib/traderWorkspace";
import { createClient } from "@/lib/supabase/client";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4001";

// The journal is per-holder (backend enforces it — see requireHolder on
// /api/journal in server.ts), so every call needs the signed-in holder's
// Supabase access token. No session (e.g. guest browsing, see
// AsymmetrySignalBanner/login page's "Continuer sans compte") means the
// backend will correctly reject with 401 rather than silently no-op.
async function authHeaders(): Promise<Record<string, string>> {
  const {
    data: { session },
  } = await createClient().auth.getSession();
  return session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {};
}

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
  const res = await fetch(`${BACKEND_URL}/api/journal`, { cache: "no-store", headers: await authHeaders() });
  if (!res.ok) throw new Error(await readErrorMessage(res, `Failed to fetch journal entries: ${res.status}`));
  const body = (await res.json()) as { entries: JournalEntry[] };
  return body.entries;
}

export async function createJournalEntry(input: NewJournalEntryInput): Promise<JournalEntry> {
  const res = await fetch(`${BACKEND_URL}/api/journal`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(await authHeaders()) },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(await readErrorMessage(res, `Failed to save journal entry: ${res.status}`));
  const body = (await res.json()) as { entry: JournalEntry };
  return body.entry;
}

export async function deleteJournalEntry(id: string): Promise<void> {
  const res = await fetch(`${BACKEND_URL}/api/journal/${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: await authHeaders(),
  });
  if (!res.ok && res.status !== 404) throw new Error(await readErrorMessage(res, `Failed to delete journal entry: ${res.status}`));
}

export async function updateJournalEntryNotes(id: string, notes: string): Promise<JournalEntry> {
  const res = await fetch(`${BACKEND_URL}/api/journal/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...(await authHeaders()) },
    body: JSON.stringify({ notes }),
  });
  if (!res.ok) throw new Error(await readErrorMessage(res, `Failed to save review note: ${res.status}`));
  const body = (await res.json()) as { entry: JournalEntry };
  return body.entry;
}
