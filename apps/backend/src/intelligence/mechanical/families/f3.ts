import type { CanonicalKpi, DisplayRelationship, FamilyMechanicalRead, FedRateBucket, FedRateDistribution, MechanicalEvaluation } from "@gold-terminal/contracts";
import { evaluateKpiMechanicalRead } from "../evaluateKpiMechanicalRead";
import { combineChannelReads } from "../combineChannelReads";

const INCOMPLETE_DISTRIBUTION_TOLERANCE_PP = 2;

/** "3.75 - 4.00" -> 3.875. Never reformats/reinterprets the source label beyond parsing its two bounds — see `FedRateBucket.targetRangeLabel`'s own doc comment. */
function bucketMidpointPercent(label: string): number | null {
  const match = label.match(/(-?\d+(?:\.\d+)?)\s*[-–—]\s*(-?\d+(?:\.\d+)?)/);
  if (!match) return null;
  return (parseFloat(match[1]) + parseFloat(match[2])) / 2;
}

function sumProbability(buckets: readonly FedRateBucket[], pick: (b: FedRateBucket) => number | null | undefined): number {
  return buckets.reduce((sum, bucket) => sum + (pick(bucket) ?? 0), 0);
}

/**
 * F3's expected-policy-move composite: probability-weighted expected basis-
 * point move implied by the distribution NOW vs. as of its own "previous
 * day" column, relative to the CURRENT target range midpoint (never
 * silently re-derived from the distribution itself). A more negative
 * expected move now than before means the market has priced in MORE easing
 * since yesterday — dovish, supportive for Gold.
 *
 * Never renormalizes silently: if either day's probabilities don't sum to
 * ~100% (±2pp tolerance — a documented judgment call, not specified by the
 * product owner), or any bucket is missing a `probabilityPreviousDay`, this
 * resolves CONTEXTUAL with an honest status rather than a computed number
 * from an incomplete/mismatched distribution.
 */
export function computeExpectedMoveComposite(
  distribution: FedRateDistribution | null | undefined,
  currentTargetMidpointPercent: number | null
): MechanicalEvaluation | null {
  if (!distribution || distribution.dataState !== "REAL") return null;
  if (currentTargetMidpointPercent === null) return null;

  const base = { ruleId: "f3-expected-move", mode: "COMPOSITE" as const, channelId: "POLICY_RATES" as const };
  const buckets = distribution.buckets;

  if (buckets.length === 0) {
    return { ...base, previousValue: null, currentValue: null, delta: null, status: "INSUFFICIENT_HISTORY", read: "CONTEXTUAL" };
  }

  const midpoints = buckets.map((bucket) => bucketMidpointPercent(bucket.targetRangeLabel));
  if (midpoints.some((midpoint) => midpoint === null)) {
    return { ...base, previousValue: null, currentValue: null, delta: null, status: "NON_COMPARABLE", read: "CONTEXTUAL" };
  }

  const hasFullPreviousDay = buckets.every((bucket) => bucket.probabilityPreviousDay !== null && bucket.probabilityPreviousDay !== undefined);
  if (!hasFullPreviousDay) {
    return { ...base, previousValue: null, currentValue: null, delta: null, status: "INSUFFICIENT_HISTORY", read: "CONTEXTUAL" };
  }

  const totalNow = sumProbability(buckets, (b) => b.probability);
  const totalPrevious = sumProbability(buckets, (b) => b.probabilityPreviousDay);
  if (Math.abs(totalNow - 100) > INCOMPLETE_DISTRIBUTION_TOLERANCE_PP || Math.abs(totalPrevious - 100) > INCOMPLETE_DISTRIBUTION_TOLERANCE_PP) {
    return { ...base, previousValue: null, currentValue: null, delta: null, status: "INCOMPLETE_COMPOSITE", read: "CONTEXTUAL" };
  }

  let expectedNowBp = 0;
  let expectedPreviousBp = 0;
  buckets.forEach((bucket, index) => {
    const moveBp = (midpoints[index]! - currentTargetMidpointPercent) * 100;
    expectedNowBp += (bucket.probability / 100) * moveBp;
    expectedPreviousBp += ((bucket.probabilityPreviousDay ?? 0) / 100) * moveBp;
  });

  const delta = expectedNowBp - expectedPreviousBp;
  if (delta === 0) {
    return { ...base, previousValue: expectedPreviousBp, currentValue: expectedNowBp, delta: 0, status: "NO_CHANGE", read: "CONTEXTUAL" };
  }

  const read: DisplayRelationship = delta < 0 ? "SUPPORTIVE" : "ADVERSE";
  return { ...base, previousValue: expectedPreviousBp, currentValue: expectedNowBp, delta, status: "EVALUATED", read };
}

/**
 * F3 — Fed / Rate Pricing. Combines the POLICY_RATES target-range read
 * (from `f3-target-lower`, which `f3-target-upper` mirrors exactly — see
 * attachMechanicalReads.ts) with the expected-move composite above, using
 * the same shared agree/disagree/single-available logic as every other
 * family. Both currently map onto the POLICY_RATES channel id (no separate
 * channel exists for the composite in `MechanicalChannelId`) — a documented
 * simplification, not a bug: they are both fundamentally Fed-policy-pricing
 * signals. `f3-path-6m`/`f3-repricing` are deliberately NOT included here
 * (see rules.ts — they carry no channel).
 */
export function aggregateF3(kpis: readonly CanonicalKpi[], fedRateDistribution: FedRateDistribution | null | undefined): FamilyMechanicalRead {
  const lower = kpis.find((k) => k.id === "f3-target-lower");
  const upper = kpis.find((k) => k.id === "f3-target-upper");
  if (!lower) return { read: "CONTEXTUAL", contributingChannels: [], reasonCode: "NO_CHANNEL_AVAILABLE" };

  const policyEval = evaluateKpiMechanicalRead(lower);
  const currentMidpoint = upper && lower.value !== null && upper.value !== null ? (lower.value + upper.value) / 2 : null;
  const compositeEvaluation = computeExpectedMoveComposite(fedRateDistribution, currentMidpoint);

  const entries = [{ channelId: "POLICY_RATES" as const, read: policyEval.read }];
  if (compositeEvaluation) entries.push({ channelId: "POLICY_RATES" as const, read: compositeEvaluation.read });

  const combined = combineChannelReads(entries);
  return compositeEvaluation ? { ...combined, compositeEvaluation } : combined;
}
