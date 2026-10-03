import { loadAppConfig } from "../config/env";
import { findGoldStateByRunId, listPublishedGoldStates, type GoldMarketStateRow } from "../db/goldMarketStates";
import { runGoldMarketStateIngestion, type GoldMarketStateIngestionSummary } from "./ingestion/ingest";
import { isEligibleGoldState, selectCurrentGoldState, type LineageCandidate } from "./selection";
import type { FinalRead } from "../sundayRead/schema";
import { presentationCompleteness } from "./presentation";
import { isGoldEditorialV6, projectPublicGoldEditorialV6, type PublicGoldEditorialV6 } from "./v6";

// The read path every GET /api/gold/read/* route funnels through: an
// in-process cache (TTL from GOLD_READ_CACHE_TTL_SECONDS, default 180s —
// see config/env.ts) wrapping the lineage-tip selection over
// public.gold_market_states. A cache miss/expiry triggers a best-effort
// Drive re-sync (runGoldMarketStateIngestion); if THAT fails (Drive down,
// quota, network), the previously-published DB rows are completely
// unaffected, so selection still runs against them — the last known-good
// state is never dropped, only its freshness label changes. The GitHub
// Actions push-trigger (POST /internal/gold/refresh) makes a fresh state
// visible immediately; this TTL is only the fallback path for when that
// trigger never fires or fails.

export type GoldReadFreshness = "FRESH" | "CACHED" | "CACHED_DRIVE_ERROR";

export interface GoldReadMeta {
  run_id: string;
  run_type: "SUNDAY" | "INTERMEDIATE" | null;
  document_type: string | null;
  generated_at: string | null;
  ingested_at?: string | null;
  consulted_at?: string;
  as_of: string | null;
  parent_run_id: string | null;
  origin_sunday_run_id: string | null;
  presentation_complete: boolean;
  missing_presentation_sections: string[];
}

export interface GoldReadEnvelope {
  run: PublicGoldRead;
  meta: GoldReadMeta;
}

/** Legacy reads keep their existing public shape; v6 is always runtime-projected. */
export type PublicGoldRead = FinalRead | PublicGoldEditorialV6;

export interface GoldReadHistoryEntry extends GoldReadMeta {
  is_current: boolean;
}

function toLineageCandidate(row: GoldMarketStateRow): LineageCandidate {
  return {
    runId: row.runId,
    runType: row.runType,
    documentType: row.documentType,
    frontendEligible: row.frontendEligible,
    parentRunId: row.parentRunId,
    originSundayRunId: row.originSundayRunId,
    evidenceCutoffEnd: row.evidenceCutoffEnd,
    generatedAt: row.generatedAt ? row.generatedAt.toISOString() : null,
    asOf: row.asOf,
  };
}

function toMeta(row: GoldMarketStateRow): GoldReadMeta {
  const presentation = row.jsonPayload ? presentationCompleteness(row.jsonPayload as FinalRead) : { presentation_complete: false, missing_presentation_sections: ["document"] };
  return {
    run_id: row.runId,
    run_type: row.runType,
    document_type: row.documentType,
    generated_at: row.generatedAt ? row.generatedAt.toISOString() : null,
    ingested_at: row.ingestedAt ? row.ingestedAt.toISOString() : null,
    consulted_at: new Date().toISOString(),
    as_of: row.asOf,
    parent_run_id: row.parentRunId,
    origin_sunday_run_id: row.originSundayRunId,
    ...presentation,
  };
}

/** Shared by current, history-linked by-run reads: only v6 is runtime-projected. */
export function projectPublicGoldRead(payload: unknown): PublicGoldRead | null {
  if (!payload || typeof payload !== "object") return null;
  return isGoldEditorialV6(payload) ? projectPublicGoldEditorialV6(payload) : payload as FinalRead;
}

function toEnvelope(row: GoldMarketStateRow | null): GoldReadEnvelope | null {
  if (!row) return null;
  const run = projectPublicGoldRead(row.jsonPayload);
  return run ? { run, meta: toMeta(row) } : null;
}

interface Snapshot {
  computedAt: number;
  current: GoldMarketStateRow | null;
  historyNewestFirst: GoldMarketStateRow[];
}

let cache: Snapshot | null = null;
let driveRefreshInFlight: Promise<{ ok: boolean; error?: string; summary?: GoldMarketStateIngestionSummary }> | null = null;

function safeErrorMessage(err: unknown): string {
  const message = err instanceof Error ? err.message : String(err);
  return message.split("\n")[0].slice(0, 300);
}

async function refreshFromDriveOnce(): Promise<{ ok: boolean; error?: string; summary?: GoldMarketStateIngestionSummary }> {
  if (driveRefreshInFlight) return driveRefreshInFlight;
  driveRefreshInFlight = runGoldMarketStateIngestion()
    .then((summary) => ({ ok: true, summary }))
    .catch((err) => {
      const error = safeErrorMessage(err);
      // Structured, secret-free failure log — the ONLY place a Drive/ingestion
      // failure surfaces for this pipeline; the HTTP layer intentionally
      // returns a generic message (see server.ts's /internal/gold/refresh).
      console.error(JSON.stringify({ scope: "gold-market-state-store", event: "drive_refresh_failed", error, at: new Date().toISOString() }));
      return { ok: false, error };
    })
    .finally(() => {
      driveRefreshInFlight = null;
    });
  return driveRefreshInFlight;
}

async function recomputeSnapshotFromDb(): Promise<Snapshot> {
  const rows = await listPublishedGoldStates();
  const selection = selectCurrentGoldState(rows.map(toLineageCandidate));
  const byRunId = new Map(rows.map((row) => [row.runId, row]));
  return {
    computedAt: Date.now(),
    current: selection.current ? (byRunId.get(selection.current.runId) ?? null) : null,
    historyNewestFirst: selection.historyNewestFirst.map((c) => byRunId.get(c.runId)).filter((r): r is GoldMarketStateRow => !!r),
  };
}

/** Cache-aware read — used by GET /api/gold/read/current and /history. Never throws: a Drive failure degrades freshness, it never removes the last valid cached/DB state. */
export async function getCurrentGoldReadSnapshot(): Promise<{ snapshot: Snapshot; freshness: GoldReadFreshness }> {
  const ttlMs = loadAppConfig().goldReadCacheTtlSeconds * 1000;
  const now = Date.now();
  if (cache && now - cache.computedAt < ttlMs) {
    return { snapshot: cache, freshness: "CACHED" };
  }

  const driveResult = await refreshFromDriveOnce();
  // Recompute from the DB regardless of the Drive outcome — a Drive failure
  // never touches already-PUBLISHED rows, so the DB alone remains a valid
  // source for the current lineage tip.
  try {
    cache = await recomputeSnapshotFromDb();
    return { snapshot: cache, freshness: driveResult.ok ? "FRESH" : "CACHED_DRIVE_ERROR" };
  } catch (err) {
    if (cache) return { snapshot: cache, freshness: "CACHED_DRIVE_ERROR" };
    throw err;
  }
}

export async function getCurrentGoldRead(): Promise<{ envelope: GoldReadEnvelope | null; freshness: GoldReadFreshness; cacheAgeSeconds: number }> {
  const { snapshot, freshness } = await getCurrentGoldReadSnapshot();
  return {
    envelope: toEnvelope(snapshot.current),
    freshness,
    cacheAgeSeconds: Math.max(0, Math.floor((Date.now() - snapshot.computedAt) / 1000)),
  };
}

export async function getGoldReadHistory(): Promise<GoldReadHistoryEntry[]> {
  const { snapshot } = await getCurrentGoldReadSnapshot();
  const currentRunId = snapshot.current?.runId;
  return snapshot.historyNewestFirst.map((row) => ({ ...toMeta(row), is_current: row.runId === currentRunId }));
}

/** Direct-by-id lookup — bypasses the cache (always a fresh DB read) but applies the exact same eligibility gate as the lineage selector, so a REJECTED, NOT-eligible, or handoff-shaped row can never be fetched this way either. */
export async function getGoldReadByRunId(runId: string): Promise<GoldReadEnvelope | null> {
  const row = await findGoldStateByRunId(runId);
  if (!row || row.status !== "PUBLISHED") return null;
  if (!isEligibleGoldState(toLineageCandidate(row))) return null;
  return toEnvelope(row);
}

export function invalidateGoldReadCache(): void {
  cache = null;
}

/** Used by POST /internal/gold/refresh — bypasses the TTL entirely, always re-syncs from Drive, and always recomputes+caches the selection afterwards (even on Drive failure, so the DB's current state is still reflected). */
export async function forceRefreshGoldReadFromDrive(): Promise<{
  ok: boolean;
  error?: string;
  summary?: GoldMarketStateIngestionSummary;
  current: GoldReadMeta | null;
}> {
  const driveResult = await refreshFromDriveOnce();
  cache = await recomputeSnapshotFromDb();
  return { ...driveResult, current: cache.current ? toMeta(cache.current) : null };
}
