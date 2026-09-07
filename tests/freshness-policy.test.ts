import assert from "node:assert/strict";
import test from "node:test";
import { completedWeekdaySessionsSince } from "../apps/backend/src/cache/snapshotCache.ts";

test("daily freshness does not treat a weekend as a missed publication", () => {
  const friday = "2026-09-04T00:00:00.000Z";
  const sunday = Date.parse("2026-09-06T18:00:00.000Z");
  assert.equal(completedWeekdaySessionsSince(friday, sunday), 0);
});

test("daily freshness tolerates one delayed weekday session before verification is required", () => {
  const thursday = "2026-09-03T00:00:00.000Z";
  const monday = Date.parse("2026-09-07T18:00:00.000Z");
  assert.equal(completedWeekdaySessionsSince(thursday, monday), 1);
});

test("daily freshness identifies multiple missed weekday sessions", () => {
  const wednesday = "2026-09-02T00:00:00.000Z";
  const monday = Date.parse("2026-09-07T18:00:00.000Z");
  assert.equal(completedWeekdaySessionsSince(wednesday, monday), 2);
});
