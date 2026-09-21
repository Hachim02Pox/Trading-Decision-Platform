import assert from "node:assert/strict";
import test from "node:test";
import { cumulativePnl, firstWeekdayOffset, riskUsage, shiftMonth } from "../apps/frontend/src/lib/execution.ts";

test("risk usage bands follow the documented display thresholds", () => {
  assert.deepEqual(riskUsage(0, 180), { ratio: 0, state: "ok" });
  assert.equal(riskUsage(89.9, 180)?.state, "ok");
  assert.equal(riskUsage(90, 180)?.state, "watch");
  assert.equal(riskUsage(143.9, 180)?.state, "watch");
  assert.equal(riskUsage(144, 180)?.state, "critical");
  assert.deepEqual(riskUsage(999, 180), { ratio: 1, state: "critical" });
});

test("risk usage returns null instead of guessing when inputs are missing", () => {
  assert.equal(riskUsage(null, 180), null);
  assert.equal(riskUsage(10, 0), null);
  assert.equal(riskUsage(Number.NaN, 180), null);
});

test("cumulative P&L sums traded days in date order and skips empty days", () => {
  const points = cumulativePnl([
    { date: "2026-09-03", netPnl: -40.5, trades: 2 },
    { date: "2026-09-01", netPnl: 100, trades: 1 },
    { date: "2026-09-02", netPnl: 0, trades: 0 },
  ]);
  assert.deepEqual(points, [{ date: "2026-09-01", value: 100 }, { date: "2026-09-03", value: 59.5 }]);
});

test("month helpers roll over years and align the calendar grid on Monday", () => {
  assert.equal(shiftMonth("2026-12", 1), "2027-01");
  assert.equal(shiftMonth("2026-01", -1), "2025-12");
  assert.equal(firstWeekdayOffset("2026-09"), 1); // 1 Sept 2026 is a Tuesday
});
