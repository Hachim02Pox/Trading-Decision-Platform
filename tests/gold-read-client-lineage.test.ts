import assert from "node:assert/strict";
import test from "node:test";
import { orderGoldReadLineage, type GoldReadHistoryEntry } from "../apps/frontend/src/lib/api/goldReadClient.ts";

function entry(run_id: string, parent_run_id: string | null, origin_sunday_run_id: string): GoldReadHistoryEntry {
  return {
    run_id,
    run_type: parent_run_id ? "INTERMEDIATE" : "SUNDAY",
    document_type: "GOLD_MARKET_STATE",
    generated_at: null,
    as_of: null,
    parent_run_id,
    origin_sunday_run_id,
    presentation_complete: true,
    missing_presentation_sections: [],
    is_current: run_id === "intermediate-2",
  };
}

test("orderGoldReadLineage returns an origin Sunday and two descendants parent-to-child", () => {
  const sunday = entry("sunday-1", null, "sunday-1");
  const first = entry("intermediate-1", "sunday-1", "sunday-1");
  const second = entry("intermediate-2", "intermediate-1", "sunday-1");

  assert.deepEqual(
    orderGoldReadLineage([second, sunday, first], "intermediate-2").map((state) => state.run_id),
    ["sunday-1", "intermediate-1", "intermediate-2"]
  );
});

test("orderGoldReadLineage does not mix another Sunday lineage into the requested chain", () => {
  const sunday = entry("sunday-1", null, "sunday-1");
  const first = entry("intermediate-1", "sunday-1", "sunday-1");
  const otherSunday = entry("sunday-2", null, "sunday-2");

  assert.deepEqual(
    orderGoldReadLineage([otherSunday, first, sunday], "intermediate-1").map((state) => state.run_id),
    ["sunday-1", "intermediate-1"]
  );
});
