import assert from "node:assert/strict";
import test from "node:test";
import { computeAutoRecapDecision } from "../apps/backend/src/jobs/goldOvernightAutoRecap.ts";
import { hourInTimeZone, calendarDateInTimeZone } from "../apps/backend/src/lib/timeZoneHour.ts";
import type { IngestionState } from "../apps/backend/src/db/ingestionState.ts";

// Night Recap auto-generation guard — once-per-local-day (America/New_York,
// target hour 8) plus failure-cooldown decision logic, mirroring
// tests/f13-calendar-normalization.test.ts's coverage of the same shape for
// the F13 calendar job. Pure function, no DB, no network.

function state(overrides: Partial<IngestionState>): IngestionState {
  return {
    jobKey: "gold-overnight:auto-recap",
    lastAttemptAt: null,
    lastSuccessAt: null,
    lastStatus: "NEVER_RUN",
    lastError: null,
    expectedNextAt: null,
    ...overrides,
  };
}

test("hourInTimeZone reads the DST-aware local hour instead of a fixed UTC offset", () => {
  // 2026-09-01T16:00:00Z is EDT (UTC-4) -> 12:00 ET.
  assert.equal(hourInTimeZone(new Date("2026-09-01T16:00:00Z"), "America/New_York"), 12);
  // 2026-01-01T16:00:00Z is EST (UTC-5) -> 11:00 ET.
  assert.equal(hourInTimeZone(new Date("2026-01-01T16:00:00Z"), "America/New_York"), 11);
});

test("calendarDateInTimeZone returns the local calendar date, which can differ from the UTC date", () => {
  // 02:00Z is 22:00 ET the PREVIOUS day (EDT, UTC-4).
  assert.equal(calendarDateInTimeZone(new Date("2026-09-02T02:00:00Z"), "America/New_York"), "2026-09-01");
});

test("auto-recap guard attempts when never run and the target hour (9am ET) has been reached", () => {
  const decision = computeAutoRecapDecision(null, new Date("2026-09-01T13:00:00Z")); // 09:00 ET
  assert.equal(decision.attempt, true);
});

test("auto-recap guard waits when never run and the target hour has not been reached yet", () => {
  const decision = computeAutoRecapDecision(null, new Date("2026-09-01T10:00:00Z")); // 06:00 ET
  assert.equal(decision.attempt, false, "must not run before 9am ET");
});

test("auto-recap guard: 8am ET is still too early (target is 9, not 8)", () => {
  const decision = computeAutoRecapDecision(null, new Date("2026-09-01T12:00:00Z")); // 08:00 ET
  assert.equal(decision.attempt, false);
});

test("auto-recap guard blocks a second attempt on the SAME local day after a success", () => {
  const decision = computeAutoRecapDecision(
    state({ lastStatus: "SUCCESS", lastSuccessAt: new Date("2026-09-01T13:00:00Z") }), // 09:00 ET
    new Date("2026-09-01T20:00:00Z") // 16:00 ET, same day
  );
  assert.equal(decision.attempt, false, "must not regenerate twice on the same local day");
});

test("auto-recap guard allows one new run once the local day rolls over and the target hour is reached", () => {
  const decision = computeAutoRecapDecision(
    state({ lastStatus: "SUCCESS", lastSuccessAt: new Date("2026-09-01T13:00:00Z") }),
    new Date("2026-09-02T13:00:00Z") // 09:00 ET the next day
  );
  assert.equal(decision.attempt, true);
});

test("auto-recap guard waits for the target hour on a new local day", () => {
  const decision = computeAutoRecapDecision(
    state({ lastStatus: "SUCCESS", lastSuccessAt: new Date("2026-09-01T13:00:00Z") }),
    new Date("2026-09-02T10:00:00Z") // 06:00 ET the next day — too early
  );
  assert.equal(decision.attempt, false);
});

test("auto-recap guard blocks an immediate retry after a FAILURE (cooldown)", () => {
  const decision = computeAutoRecapDecision(
    state({ lastStatus: "FAILED", lastAttemptAt: new Date("2026-09-01T13:00:00Z"), lastError: "PROVIDER_LIMIT" }),
    new Date("2026-09-01T13:05:00Z")
  );
  assert.equal(decision.attempt, false);
});

test("auto-recap guard allows a retry after a FAILURE once the cooldown has elapsed", () => {
  const decision = computeAutoRecapDecision(
    state({ lastStatus: "FAILED", lastAttemptAt: new Date("2026-09-01T13:00:00Z"), lastError: "network error" }),
    new Date("2026-09-01T14:01:00Z")
  );
  assert.equal(decision.attempt, true);
});

test("auto-recap guard: an explicit force bypasses every gate", () => {
  const decision = computeAutoRecapDecision(
    state({ lastStatus: "SUCCESS", lastSuccessAt: new Date("2026-09-01T13:00:00Z") }),
    new Date("2026-09-01T13:01:00Z"),
    true
  );
  assert.equal(decision.attempt, true);
});
