import assert from "node:assert/strict";
import test from "node:test";
import { formatMonthlyReferencePeriod } from "../apps/frontend/src/lib/formatFreshness";

test("monthly macro labels name the measured reference period, never a fabricated publication day", () => {
  assert.equal(formatMonthlyReferencePeriod("2026-07-31T00:00:00.000Z", "FR"), "juillet 2026");
  assert.equal(formatMonthlyReferencePeriod("2026-07-31T00:00:00.000Z", "EN"), "July 2026");
});
