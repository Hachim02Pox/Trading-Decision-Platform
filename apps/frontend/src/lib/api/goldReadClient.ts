const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4001";

// Client for the unified Gold market-state API (GET /api/gold/read/*) — see
// apps/backend/src/goldMarketState/store.ts. Additive to
// lib/api/sundayReadClient.ts, which keeps serving the legacy
// /api/sunday-read* routes unchanged.

export interface GoldReadMeta {
  run_id: string;
  run_type: "SUNDAY" | "INTERMEDIATE" | null;
  document_type: string | null;
  generated_at: string | null;
  as_of: string | null;
  parent_run_id: string | null;
  origin_sunday_run_id: string | null;
  presentation_complete: boolean;
  missing_presentation_sections: string[];
  freshness?: "FRESH" | "CACHED" | "CACHED_DRIVE_ERROR";
  cache_age_seconds?: number;
}

export interface GoldReadEnvelope {
  run: Record<string, unknown>;
  meta: GoldReadMeta;
}

export interface GoldReadHistoryEntry extends GoldReadMeta {
  is_current: boolean;
}

/**
 * Rebuild one immutable market-state lineage from the metadata returned by
 * GET /api/gold/read/history.  The API intentionally returns newest-first
 * history for audit browsing; the reader needs the opposite, causal order.
 * No state is merged or mutated: callers still fetch each full JSON snapshot
 * by run_id when a reader selects it.
 */
export function orderGoldReadLineage(history: readonly GoldReadHistoryEntry[], runId: string): GoldReadHistoryEntry[] {
  const byRunId = new Map(history.map((entry) => [entry.run_id, entry]));
  const chain: GoldReadHistoryEntry[] = [];
  const visited = new Set<string>();
  let cursor = byRunId.get(runId);

  while (cursor && !visited.has(cursor.run_id)) {
    chain.push(cursor);
    visited.add(cursor.run_id);
    cursor = cursor.parent_run_id ? byRunId.get(cursor.parent_run_id) : undefined;
  }

  return chain.reverse();
}

async function parseOrThrow(response: Response, notFoundMessage: string): Promise<unknown> {
  if (!response.ok) {
    throw new Error(response.status === 404 ? notFoundMessage : `Erreur backend ${response.status}`);
  }
  return response.json();
}

export async function fetchCurrentGoldRead(): Promise<GoldReadEnvelope> {
  const response = await fetch(`${BACKEND_URL}/api/gold/read/current`, { cache: "no-store" });
  return (await parseOrThrow(response, "Aucun état de marché Gold publié pour l'instant.")) as GoldReadEnvelope;
}

export async function fetchGoldReadByRunId(runId: string): Promise<GoldReadEnvelope> {
  const response = await fetch(`${BACKEND_URL}/api/gold/read/${encodeURIComponent(runId)}`, { cache: "no-store" });
  return (await parseOrThrow(response, "Cet état de marché Gold est introuvable.")) as GoldReadEnvelope;
}

export async function fetchGoldReadHistory(): Promise<GoldReadHistoryEntry[]> {
  const response = await fetch(`${BACKEND_URL}/api/gold/read/history`, { cache: "no-store" });
  const body = (await parseOrThrow(response, "Historique indisponible.")) as { history: GoldReadHistoryEntry[] };
  return body.history;
}
