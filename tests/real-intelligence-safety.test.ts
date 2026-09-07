import assert from "node:assert/strict";
import test from "node:test";
import { tavilyRecencyFilter } from "../apps/backend/src/intelligence/research/tavilyResearchProvider.ts";

test("Tavily recency plans become explicit API filters", () => {
  assert.deepEqual(tavilyRecencyFilter("24h", new Date("2026-08-30T12:00:00Z")), { time_range: "day" });
  assert.deepEqual(tavilyRecencyFilter("7d", new Date("2026-08-30T12:00:00Z")), { time_range: "week" });
  assert.deepEqual(tavilyRecencyFilter("30d", new Date("2026-08-30T12:00:00Z")), { time_range: "month" });
  assert.deepEqual(tavilyRecencyFilter("90d", new Date("2026-08-30T12:00:00Z")), { start_date: "2026-06-01" });
  assert.deepEqual(tavilyRecencyFilter("1y", new Date("2026-08-30T12:00:00Z")), { time_range: "year" });
});
