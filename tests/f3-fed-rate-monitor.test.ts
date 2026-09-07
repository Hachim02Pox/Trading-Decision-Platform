import assert from "node:assert/strict";
import test from "node:test";
import {
  parsePercent,
  parseWallClockText,
  zonedWallClockToUtcIso,
} from "../apps/backend/src/providers/investingFedRateMonitor.ts";
import {
  decodeDistributionFromStorage,
  encodeDistributionForStorage,
} from "../apps/backend/src/real/fedRateDistributionStore.ts";
import { deriveFedSummary } from "../apps/frontend/src/lib/deriveFedSummary.ts";
import type { FedRateDistribution } from "../packages/contracts/src/index.ts";

// Removed-homemade-calc pass — the real Investing.com Fed Rate Monitor
// integration replaced the buggy homemade CME-ZQ-settlement calculation.
// These tests cover the pure logic pieces that don't require a live
// network fetch/browser: page-text parsing, the compact persistence
// encoding (kpi_observations.text_value is VARCHAR(255), so this has a
// real correctness requirement), and the frontend's plain "most likely
// bucket" readout.

test("parsePercent extracts a numeric value from a displayed percentage string", () => {
  assert.equal(parsePercent("35.6%"), 35.6);
  assert.equal(parsePercent("100%"), 100);
  assert.equal(parsePercent(null), null);
  assert.equal(parsePercent("not a percent"), null);
});

test("parseWallClockText parses the page's displayed meeting-time format", () => {
  const parsed = parseWallClockText("Sep 16, 2026 02:00PM ET");
  assert.deepEqual(parsed, { year: 2026, month: 9, day: 16, hour: 14, minute: 0 });
});

test("parseWallClockText handles midnight-hour (12 AM) correctly", () => {
  const parsed = parseWallClockText("Jan 1, 2027 12:00AM ET");
  assert.deepEqual(parsed, { year: 2027, month: 1, day: 1, hour: 0, minute: 0 });
});

test("parseWallClockText returns null for unrecognized text", () => {
  assert.equal(parseWallClockText("garbage"), null);
});

test("zonedWallClockToUtcIso converts an Eastern Daylight Time (EDT, UTC-4) wall clock correctly", () => {
  // Sep 16 is within US DST — 2:00 PM ET should be 18:00 UTC.
  const iso = zonedWallClockToUtcIso({ year: 2026, month: 9, day: 16, hour: 14, minute: 0 }, "America/New_York");
  assert.equal(iso, new Date("2026-09-16T18:00:00.000Z").toISOString());
});

test("zonedWallClockToUtcIso converts an Eastern Standard Time (EST, UTC-5) wall clock correctly", () => {
  // Jan 28 is outside US DST — 2:00 PM ET should be 19:00 UTC.
  const iso = zonedWallClockToUtcIso({ year: 2026, month: 1, day: 28, hour: 14, minute: 0 }, "America/New_York");
  assert.equal(iso, new Date("2026-01-28T19:00:00.000Z").toISOString());
});

test("fedRateDistributionStore: encode/decode round-trips a real N-bucket distribution", () => {
  const distribution = {
    nextMeetingAt: "2026-09-16T18:00:00.000Z",
    buckets: [
      { targetRangeLabel: "3.50 - 3.75", probability: 35.6 },
      { targetRangeLabel: "3.75 - 4.00", probability: 64.4 },
    ],
  };

  const encoded = encodeDistributionForStorage(distribution);
  assert.ok(encoded, "a reasonably-sized distribution must encode successfully");
  assert.ok(encoded!.length <= 255, "must fit kpi_observations.text_value (VARCHAR(255))");

  const decoded = decodeDistributionFromStorage(encoded!);
  assert.deepEqual(decoded, distribution);
});

test("fedRateDistributionStore: decode rejects malformed input rather than fabricating a distribution", () => {
  assert.equal(decodeDistributionFromStorage("no-semicolon-here"), null);
  assert.equal(decodeDistributionFromStorage("2026-09-16T18:00:00.000Z;bad-entry-no-equals"), null);
  assert.equal(decodeDistributionFromStorage("2026-09-16T18:00:00.000Z;label=not-a-number"), null);
});

test("fedRateDistributionStore: encode returns null (never truncates) when the distribution would not fit the column", () => {
  const tooManyBuckets = {
    nextMeetingAt: "2026-09-16T18:00:00.000Z",
    buckets: Array.from({ length: 20 }, (_, i) => ({
      targetRangeLabel: `${i}.00 - ${i + 1}.00 (a needlessly long synthetic label to force overflow)`,
      probability: 5,
    })),
  };
  assert.equal(encodeDistributionForStorage(tooManyBuckets), null);
});

function buildDistribution(overrides: Partial<FedRateDistribution>): FedRateDistribution {
  return {
    buckets: [],
    nextMeetingAt: null,
    dataState: "REAL",
    sourceTag: "INVESTING_FED_RATE_MONITOR",
    observationAt: "2026-08-31T02:35:00.000Z",
    retrievedAt: "2026-08-31T02:36:00.000Z",
    ...overrides,
  };
}

test("deriveFedSummary picks the highest-probability bucket as a plain readout (no new interpretation)", () => {
  const distribution = buildDistribution({
    buckets: [
      { targetRangeLabel: "3.50 - 3.75", probability: 35.6 },
      { targetRangeLabel: "3.75 - 4.00", probability: 64.4 },
    ],
  });
  const summary = deriveFedSummary(distribution);
  assert.deepEqual(summary, { mostLikelyLabel: "3.75 - 4.00", mostLikelyPct: 64.4 });
});

test("deriveFedSummary generalizes beyond three buckets", () => {
  const distribution = buildDistribution({
    buckets: [
      { targetRangeLabel: "3.25 - 3.50", probability: 5 },
      { targetRangeLabel: "3.50 - 3.75", probability: 20 },
      { targetRangeLabel: "3.75 - 4.00", probability: 50 },
      { targetRangeLabel: "4.00 - 4.25", probability: 25 },
    ],
  });
  const summary = deriveFedSummary(distribution);
  assert.deepEqual(summary, { mostLikelyLabel: "3.75 - 4.00", mostLikelyPct: 50 });
});

test("deriveFedSummary returns null when the distribution is UNAVAILABLE — never a stale/fabricated readout", () => {
  const distribution = buildDistribution({
    dataState: "UNAVAILABLE",
    unavailableReason: "FETCH_FAILED",
    buckets: [],
    sourceTag: "UNAVAILABLE",
  });
  assert.equal(deriveFedSummary(distribution), null);
});

test("deriveFedSummary returns null for a missing/absent distribution", () => {
  assert.equal(deriveFedSummary(null), null);
  assert.equal(deriveFedSummary(undefined), null);
});
