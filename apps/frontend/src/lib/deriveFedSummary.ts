import type { FedRateDistribution } from "@gold-terminal/contracts";

export interface FedSummary {
  /** The most-likely bucket's target-range label, exactly as the source displays it (e.g. "3.75 - 4.00") — never reinterpreted. */
  mostLikelyLabel: string;
  mostLikelyPct: number;
  /** The source's previous-day probability for that exact same target range. */
  previousPct: number | null;
}

/**
 * Pure frontend derivation of F3's compact-face "Next"/"Probability"
 * summary: a plain readout of whichever bucket the real source already
 * computed as most probable — never a new interpretation. Returns `null`
 * when the distribution isn't a genuinely REAL reading with at least one
 * bucket (i.e. it's UNAVAILABLE or absent), so callers can show an honest
 * "not available" state instead.
 */
export function deriveFedSummary(distribution: FedRateDistribution | null | undefined): FedSummary | null {
  if (!distribution || distribution.dataState !== "REAL" || distribution.buckets.length === 0) {
    return null;
  }

  let mostLikely = distribution.buckets[0];
  for (const bucket of distribution.buckets) {
    if (bucket.probability > mostLikely.probability) mostLikely = bucket;
  }

  return {
    mostLikelyLabel: mostLikely.targetRangeLabel,
    mostLikelyPct: mostLikely.probability,
    previousPct: mostLikely.probabilityPreviousDay ?? null,
  };
}
