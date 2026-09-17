import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import type { FedRateDistribution } from "@gold-terminal/contracts";
import { loadAppConfig } from "../../config/env";
import { getPreviousDistinctObservation } from "../../db/kpiObservations";
import { decodeDistributionFromStorage, FED_RATE_MONITOR_OBSERVATION_KPI_ID } from "../../real/fedRateDistributionStore";

// `process.cwd()`-relative — same "ephemeral, wiped/split by restart or
// launch directory" issue kpiHistory.ts had until the 2026-09-16 fix
// (2a6cc8a): confirmed live on this machine as two divergent copies of this
// exact file (`.runtime/` at the repo root vs `apps/backend/.runtime/`,
// hours apart), because the backend has been launched from different
// working directories across restarts. Kept only as the last-resort
// fallback below, same role the file plays in kpiHistory.ts now.
const historyFile = join(process.cwd(), ".runtime", "fed-rate-distribution.json");

function load(): FedRateDistribution | null {
  if (!existsSync(historyFile)) return null;
  try { return JSON.parse(readFileSync(historyFile, "utf8")) as FedRateDistribution; } catch { return null; }
}

function isDbConfigured(): boolean {
  return loadAppConfig().db !== null;
}

/**
 * Durable path: reads the append-only `kpi_observations` history that
 * `real/fedRateDistributionStore.ts` already writes on every successful
 * scrape (sentinel id `f3-fed-rate-monitor`) — never wiped by a restart or
 * a different launch directory, unlike the file below. Returns `null` (not
 * an error) when DB is unconfigured, the query fails, or nothing genuinely
 * earlier exists yet — callers fall back to the file in every case.
 */
async function priorBucketsFromDb(current: FedRateDistribution): Promise<Map<string, number> | null> {
  if (!isDbConfigured()) return null;
  try {
    const row = await getPreviousDistinctObservation(FED_RATE_MONITOR_OBSERVATION_KPI_ID, new Date(current.observationAt));
    if (!row?.textValue) return null;
    const decoded = decodeDistributionFromStorage(row.textValue);
    if (!decoded) return null;
    return new Map(decoded.buckets.map((bucket) => [bucket.targetRangeLabel, bucket.probability]));
  } catch (err) {
    console.error("[fed-probability-history] DB previous-distribution lookup failed, falling back to the ephemeral file cache:", err instanceof Error ? err.message : err);
    return null;
  }
}

function priorBucketsFromFile(): Map<string, number> {
  const prior = load();
  return new Map((prior?.buckets ?? []).map((bucket) => [bucket.targetRangeLabel, bucket.probability]));
}

function persistToFileFallback(current: FedRateDistribution): void {
  const prior = load();
  const changed = !prior || prior.retrievedAt !== current.retrievedAt || prior.buckets.some((bucket, index) => bucket.targetRangeLabel !== current.buckets[index]?.targetRangeLabel || bucket.probability !== current.buckets[index]?.probability);
  if (!changed) return;
  mkdirSync(dirname(historyFile), { recursive: true });
  writeFileSync(historyFile, JSON.stringify(current, null, 2), "utf8");
}

/** Keeps the last fetched probability for every exact target range. The
 * provider's own previous-day probability wins when supplied; otherwise the
 * durable `kpi_observations` history is used, falling back to the ephemeral
 * file only when DB is unconfigured/unreachable. */
export async function rememberFedDistribution(current: FedRateDistribution | null | undefined): Promise<FedRateDistribution | null | undefined> {
  if (!current || current.dataState !== "REAL") return current;
  const priorByRange = (await priorBucketsFromDb(current)) ?? priorBucketsFromFile();
  const enriched: FedRateDistribution = {
    ...current,
    buckets: current.buckets.map((bucket) => ({
      ...bucket,
      probabilityPreviousDay: bucket.probabilityPreviousDay ?? priorByRange.get(bucket.targetRangeLabel) ?? null,
    })),
  };
  persistToFileFallback(current);
  return enriched;
}
