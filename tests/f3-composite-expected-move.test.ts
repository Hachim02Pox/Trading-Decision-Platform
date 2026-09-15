import assert from "node:assert/strict";
import test from "node:test";
import type { CanonicalKpi, FedRateBucket, FedRateDistribution } from "../packages/contracts/src/index";
import { computeExpectedMoveComposite, aggregateF3 } from "../apps/backend/src/intelligence/mechanical/families/f3.ts";

function bucket(targetRangeLabel: string, probability: number, probabilityPreviousDay: number | null): FedRateBucket {
  return { targetRangeLabel, probability, probabilityPreviousDay };
}

function distribution(buckets: FedRateBucket[]): FedRateDistribution {
  return {
    buckets,
    nextMeetingAt: "2026-10-28T00:00:00.000Z",
    dataState: "REAL",
    sourceTag: "TEST",
    observationAt: "2026-09-14T00:00:00.000Z",
    retrievedAt: "2026-09-14T00:00:00.000Z",
  };
}

function targetKpi(id: string, value: number, previous: number | null): CanonicalKpi {
  return {
    id,
    familyId: "F3",
    label: id,
    value,
    unit: "%",
    decimals: 2,
    mechanicalGoldRead: "CONTEXTUAL",
    mechanicalEvaluation: { ruleId: id, mode: "CONTEXTUAL", channelId: null, previousValue: null, currentValue: null, delta: null, status: "CONTEXTUAL_BY_DESIGN", read: "CONTEXTUAL" },
    driverSummary: null,
    provenance: "observed",
    quality: "current",
    dataState: "REAL",
    sourceTag: "TEST",
    observationAt: "2026-09-14T00:00:00.000Z",
    retrievedAt: "2026-09-14T00:00:00.000Z",
    visibility: "cockpit",
    previousFetch: previous === null ? null : { value: previous, unit: "%", observationAt: "2026-09-13T00:00:00.000Z", retrievedAt: "2026-09-13T00:00:00.000Z" },
  };
}

// Current target range: 4.25 - 4.50, midpoint 4.375%.

test("computeExpectedMoveComposite: more easing priced in now than before -> SUPPORTIVE", () => {
  // Before: 60% hold (4.25-4.50, moveBp 0), 40% one cut (4.00-4.25, moveBp -25).
  //   expectedPreviousBp = 0.6*0 + 0.4*-25 = -10
  // Now: 20% hold, 80% one cut.
  //   expectedNowBp = 0.2*0 + 0.8*-25 = -20
  // delta = -20 - (-10) = -10 < 0 -> SUPPORTIVE (more easing priced in now).
  const dist = distribution([bucket("4.25 - 4.50", 20, 60), bucket("4.00 - 4.25", 80, 40)]);
  const result = computeExpectedMoveComposite(dist, 4.375);
  assert.ok(result);
  assert.equal(result?.status, "EVALUATED");
  assert.equal(result?.read, "SUPPORTIVE");
  assert.ok((result?.delta ?? 0) < 0);
});

test("computeExpectedMoveComposite: less easing priced in now than before -> ADVERSE", () => {
  const dist = distribution([bucket("4.25 - 4.50", 80, 20), bucket("4.00 - 4.25", 20, 80)]);
  const result = computeExpectedMoveComposite(dist, 4.375);
  assert.ok(result);
  assert.equal(result?.read, "ADVERSE");
  assert.ok((result?.delta ?? 0) > 0);
});

test("computeExpectedMoveComposite: INCOMPLETE_DISTRIBUTION when probabilities sum far from 100% -> CONTEXTUAL, never silently renormalized", () => {
  // Sums to 85%, well outside the ±2pp tolerance.
  const dist = distribution([bucket("4.25 - 4.50", 50, 50), bucket("4.00 - 4.25", 35, 35)]);
  const result = computeExpectedMoveComposite(dist, 4.375);
  assert.ok(result);
  assert.equal(result?.status, "INCOMPLETE_COMPOSITE");
  assert.equal(result?.read, "CONTEXTUAL");
  assert.equal(result?.currentValue, null, "must never compute a number from an incomplete distribution");
});

test("computeExpectedMoveComposite: missing probabilityPreviousDay on any bucket -> INSUFFICIENT_HISTORY/CONTEXTUAL", () => {
  const dist = distribution([bucket("4.25 - 4.50", 60, 60), bucket("4.00 - 4.25", 40, null)]);
  const result = computeExpectedMoveComposite(dist, 4.375);
  assert.ok(result);
  assert.equal(result?.status, "INSUFFICIENT_HISTORY");
  assert.equal(result?.read, "CONTEXTUAL");
});

test("computeExpectedMoveComposite: null when distribution is UNAVAILABLE or midpoint unknown", () => {
  assert.equal(computeExpectedMoveComposite(null, 4.375), null);
  assert.equal(computeExpectedMoveComposite({ ...distribution([bucket("4.25 - 4.50", 100, 100)]), dataState: "UNAVAILABLE" }, 4.375), null);
  assert.equal(computeExpectedMoveComposite(distribution([bucket("4.25 - 4.50", 100, 100)]), null), null);
});

// --- aggregateF3: target range + composite combined ------------------------

test("aggregateF3: target range cut (SUPPORTIVE) and composite pricing more easing (SUPPORTIVE) agree", () => {
  const kpis = [targetKpi("f3-target-lower", 4.0, 4.25), targetKpi("f3-target-upper", 4.25, 4.5)];
  // Midpoint 4.125%. Probability has shifted MORE toward the lower
  // (3.75-4.00, moveBp -25) bucket since yesterday -> more easing priced in
  // now -> composite SUPPORTIVE, agreeing with the target-range cut itself.
  const dist = distribution([bucket("4.00 - 4.25", 60, 80), bucket("3.75 - 4.00", 40, 20)]);
  const result = aggregateF3(kpis, dist);
  assert.ok(result.compositeEvaluation);
  assert.equal(result.compositeEvaluation?.read, "SUPPORTIVE");
  assert.equal(result.read, "SUPPORTIVE");
});

test("aggregateF3: with no distribution supplied, falls back to the target-range read alone", () => {
  const kpis = [targetKpi("f3-target-lower", 4.0, 4.25), targetKpi("f3-target-upper", 4.25, 4.5)];
  const result = aggregateF3(kpis, null);
  assert.equal(result.read, "SUPPORTIVE");
  assert.equal(result.compositeEvaluation, undefined);
});
