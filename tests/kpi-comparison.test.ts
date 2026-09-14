import assert from "node:assert/strict";
import test from "node:test";
import { calculateKpiChange } from "../apps/frontend/src/lib/kpiComparison.ts";

test("calculateKpiChange gives an upward absolute and percentage movement", () => {
  assert.deepEqual(calculateKpiChange(100, 105), { direction: "up", absolute: 5, percent: 5 });
});

test("calculateKpiChange handles a zero previous value without inventing a percentage", () => {
  assert.deepEqual(calculateKpiChange(0, 2), { direction: "up", absolute: 2, percent: null });
});
