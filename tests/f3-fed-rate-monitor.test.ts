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
import { shouldReuseWithoutFetching } from "../apps/backend/src/real/f3Fed.ts";
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

test("parsePercent treats the page's 'not priced' dash placeholder as an honest 0%", () => {
  // Bug found live 2026-09-16, right after a real FOMC decision: the
  // soonest-meeting card rolls over to the NEXT meeting, and a bucket the
  // market has stopped pricing entirely (now below the new effective
  // floor) shows "—" instead of a number — a real, meaningful reading,
  // never a page-structure break that should abort the whole fetch.
  assert.equal(parsePercent("—"), 0);
  assert.equal(parsePercent("-"), 0);
  assert.equal(parsePercent(" — "), 0);
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
  assert.deepEqual(summary, { mostLikelyLabel: "3.75 - 4.00", mostLikelyPct: 64.4, previousPct: null });
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
  assert.deepEqual(summary, { mostLikelyLabel: "3.75 - 4.00", mostLikelyPct: 50, previousPct: null });
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

// ---------------------------------------------------------------------------
// shouldReuseWithoutFetching — the cadence/retry-cooldown gate. Bug found
// live 2026-09-16: a `npm run dev` restart mid-scrape left `ingestion_state`
// with a fresh `last_attempt_at` but a stale `last_status`/`last_success_at`
// from the PRIOR (older) success. The OLD logic (gate purely on
// `last_attempt_at` age vs the full multi-hour cadence) then refused to
// retry for hours even though nothing was actually in flight, and the
// persisted fallback distribution was already too old to reuse — F3 stayed
// UNAVAILABLE no matter how many times the page was reloaded. Fixed by
// comparing `lastAttemptAt` against `lastSuccessAt`: only a CONFIRMED
// success gets the full cadence; anything else (an explicit failure, or an
// attempt whose outcome was never recorded at all) gets a short retry
// cooldown instead — see f3Fed.ts's `RETRY_COOLDOWN_MS`.
// ---------------------------------------------------------------------------

test("shouldReuseWithoutFetching: never attempted -> always allowed to fetch", () => {
  assert.equal(shouldReuseWithoutFetching(null, null, new Date("2026-09-16T12:00:00Z")), false);
});

test("shouldReuseWithoutFetching: a CONFIRMED recent success (lastAttemptAt === lastSuccessAt) reuses for the full cadence window", () => {
  const successAt = new Date("2026-09-16T10:00:00Z");
  // 2h59m later — still within the 3h success cadence.
  const now = new Date("2026-09-16T12:59:00Z");
  assert.equal(shouldReuseWithoutFetching(successAt, successAt, now), true);
});

test("shouldReuseWithoutFetching: a confirmed success older than the cadence window allows a fresh fetch", () => {
  const successAt = new Date("2026-09-16T08:00:00Z");
  const now = new Date("2026-09-16T12:00:00Z"); // 4h later, past the 3h cadence
  assert.equal(shouldReuseWithoutFetching(successAt, successAt, now), false);
});

test("shouldReuseWithoutFetching: the exact bug — an attempt newer than the last confirmed success uses the SHORT retry cooldown, not the full cadence", () => {
  const lastSuccessAt = new Date("2026-09-15T01:52:46Z"); // ~26h before `now`
  const lastAttemptAt = new Date("2026-09-16T03:37:10Z"); // abandoned/failed attempt, 25 min before `now`
  const now = new Date("2026-09-16T04:02:10Z");
  // Old (buggy) behavior would have gated on lastAttemptAt vs the 3h
  // cadence and returned true here (25min < 3h) — must now use the 30min
  // retry cooldown instead, which 25min IS still under, so this specific
  // instant is still gated...
  assert.equal(shouldReuseWithoutFetching(lastAttemptAt, lastSuccessAt, now), true);
  // ...but 31 minutes after the abandoned attempt, a fresh fetch is allowed
  // (would have stayed blocked for ~3h under the old full-cadence gate).
  const later = new Date("2026-09-16T04:08:10Z");
  assert.equal(shouldReuseWithoutFetching(lastAttemptAt, lastSuccessAt, later), false);
});

test("shouldReuseWithoutFetching: an explicit FAILED attempt (lastAttemptAt > lastSuccessAt) also uses the short cooldown", () => {
  const lastSuccessAt = new Date("2026-09-16T00:00:00Z");
  const lastAttemptAt = new Date("2026-09-16T05:00:00Z"); // a later attempt that failed
  const now = new Date("2026-09-16T05:10:00Z"); // 10 min after the failure
  assert.equal(shouldReuseWithoutFetching(lastAttemptAt, lastSuccessAt, now), true); // still within 30min cooldown
  const now2 = new Date("2026-09-16T05:35:00Z"); // 35 min after the failure
  assert.equal(shouldReuseWithoutFetching(lastAttemptAt, lastSuccessAt, now2), false); // cooldown elapsed, retry allowed
});
