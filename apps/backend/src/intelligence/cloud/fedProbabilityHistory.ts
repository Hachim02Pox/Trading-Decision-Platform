import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import type { FedRateDistribution } from "@gold-terminal/contracts";

const historyFile = join(process.cwd(), ".runtime", "fed-rate-distribution.json");

function load(): FedRateDistribution | null {
  if (!existsSync(historyFile)) return null;
  try { return JSON.parse(readFileSync(historyFile, "utf8")) as FedRateDistribution; } catch { return null; }
}

/** Keeps the last fetched probability for every exact target range. The
 * provider's own previous-day probability wins when supplied; otherwise the
 * terminal's own immediately preceding fetch is used. */
export function rememberFedDistribution(current: FedRateDistribution | null | undefined): FedRateDistribution | null | undefined {
  if (!current || current.dataState !== "REAL") return current;
  const prior = load();
  const priorByRange = new Map((prior?.buckets ?? []).map((bucket) => [bucket.targetRangeLabel, bucket.probability]));
  const enriched: FedRateDistribution = {
    ...current,
    buckets: current.buckets.map((bucket) => ({
      ...bucket,
      probabilityPreviousDay: bucket.probabilityPreviousDay ?? priorByRange.get(bucket.targetRangeLabel) ?? null,
    })),
  };
  const changed = !prior || prior.retrievedAt !== current.retrievedAt || prior.buckets.some((bucket, index) => bucket.targetRangeLabel !== current.buckets[index]?.targetRangeLabel || bucket.probability !== current.buckets[index]?.probability);
  if (changed) {
    mkdirSync(dirname(historyFile), { recursive: true });
    writeFileSync(historyFile, JSON.stringify(current, null, 2), "utf8");
  }
  return enriched;
}
