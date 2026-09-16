import assert from "node:assert/strict";
import test from "node:test";
import { computeDueReleases } from "../apps/backend/src/jobs/monthlyReleasePrefetch.ts";

// Pure decision logic — which macro_events rows are a tracked BLS/BEA
// release type whose scheduled_at_utc + 2min buffer has passed. No DB, no
// network. See tests/f13-calendar-normalization.test.ts /
// tests/gold-overnight-auto-recap.test.ts for the same "pure guard function"
// testing pattern used across this codebase's jobs/.

test("computeDueReleases: a tracked type past its 2-minute buffer is due", () => {
  const due = computeDueReleases(
    [{ normalizedEventType: "CPI", scheduledAtUtc: new Date("2026-09-10T12:30:00Z") }],
    new Date("2026-09-10T12:33:00Z") // 3 min later
  );
  assert.equal(due.length, 1);
  assert.equal(due[0].normalizedEventType, "CPI");
  assert.equal(due[0].jobKey, "prefetch:CPI:2026-09-10T12:30:00.000Z");
  assert.deepEqual(due[0].cacheKeys, ["bls:calc:f4-cpi-ppi"]);
});

test("computeDueReleases: not yet due within the 2-minute buffer", () => {
  const due = computeDueReleases(
    [{ normalizedEventType: "CPI", scheduledAtUtc: new Date("2026-09-10T12:30:00Z") }],
    new Date("2026-09-10T12:31:00Z") // only 1 min later
  );
  assert.equal(due.length, 0);
});

test("computeDueReleases: an untracked event type is ignored (e.g. FOMC, ISM)", () => {
  const due = computeDueReleases(
    [{ normalizedEventType: "FOMC_RATE_DECISION", scheduledAtUtc: new Date("2026-09-10T18:00:00Z") }],
    new Date("2026-09-10T19:00:00Z")
  );
  assert.equal(due.length, 0);
});

test("computeDueReleases: GDP is intentionally untracked (no canonical GDP KPI wired in this codebase)", () => {
  const due = computeDueReleases(
    [{ normalizedEventType: "GDP", scheduledAtUtc: new Date("2026-09-10T12:30:00Z") }],
    new Date("2026-09-10T13:00:00Z")
  );
  assert.equal(due.length, 0);
});

test("computeDueReleases: PCE and CORE_PCE both map to the two BEA NIPA cache keys", () => {
  const due = computeDueReleases(
    [
      { normalizedEventType: "PCE", scheduledAtUtc: new Date("2026-09-26T12:30:00Z") },
      { normalizedEventType: "CORE_PCE", scheduledAtUtc: new Date("2026-09-26T12:30:00Z") },
    ],
    new Date("2026-09-26T13:00:00Z")
  );
  assert.equal(due.length, 2);
  for (const release of due) {
    assert.equal(release.cacheKeys.length, 2);
    assert.ok(release.cacheKeys.every((k) => k.startsWith("bea:")));
  }
});

test("computeDueReleases: NFP, unemployment and average hourly earnings all map to the shared F5 cache key", () => {
  const scheduledAtUtc = new Date("2026-10-02T12:30:00Z");
  const due = computeDueReleases(
    [
      { normalizedEventType: "NONFARM_PAYROLLS", scheduledAtUtc },
      { normalizedEventType: "UNEMPLOYMENT_RATE", scheduledAtUtc },
      { normalizedEventType: "AVERAGE_HOURLY_EARNINGS", scheduledAtUtc },
    ],
    new Date("2026-10-02T12:35:00Z")
  );
  assert.equal(due.length, 3);
  for (const release of due) assert.deepEqual(release.cacheKeys, ["bls:calc:f5-employment"]);
});

test("computeDueReleases: distinct scheduled instances of the same type produce distinct jobKeys (no cross-month collision)", () => {
  const due = computeDueReleases(
    [
      { normalizedEventType: "CPI", scheduledAtUtc: new Date("2026-09-10T12:30:00Z") },
      { normalizedEventType: "CPI", scheduledAtUtc: new Date("2026-10-14T12:30:00Z") },
    ],
    new Date("2026-10-14T13:00:00Z")
  );
  assert.equal(due.length, 2);
  assert.notEqual(due[0].jobKey, due[1].jobKey);
});
