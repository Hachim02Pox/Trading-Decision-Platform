import assert from "node:assert/strict";
import { test } from "node:test";
import { assessGlobalReadEventGuard } from "../apps/backend/src/intelligence/globalRead/eventGuard";

const event = (scheduledAt: string) => ({ ref: "calendar:cpi", title: "CPI", scheduledAt, sourceUrl: "https://www.bls.gov/", verified: true, group: "CPI", phase: "RELEASE" });

test("the 24-hour notice informs without blocking before the 15-hour opportunity lockout", () => {
  const result = assessGlobalReadEventGuard("2026-09-05T00:00:00.000Z", [event("2026-09-05T20:00:00.000Z")]);
  assert.equal(result.blocksOpportunity, false);
  assert.equal(result.warnings.length, 1);
});

test("the final 15 hours and the first 30 minutes after a release block opportunity", () => {
  const before = assessGlobalReadEventGuard("2026-09-05T06:00:00.000Z", [event("2026-09-05T20:00:00.000Z")]);
  const after = assessGlobalReadEventGuard("2026-09-05T20:20:00.000Z", [event("2026-09-05T20:00:00.000Z")]);
  assert.equal(before.blocksOpportunity, true);
  assert.equal(after.blocksOpportunity, true);
  assert.match(after.blockers[0]!.resolver ?? "", /30 minutes/);
});

test("unverified events never create a timing lockout", () => {
  const result = assessGlobalReadEventGuard("2026-09-05T06:00:00.000Z", [{ ...event("2026-09-05T20:00:00.000Z"), verified: false }]);
  assert.equal(result.blocksOpportunity, false);
});
