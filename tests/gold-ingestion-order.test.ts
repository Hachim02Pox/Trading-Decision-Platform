import assert from "node:assert/strict";
import test from "node:test";
import { parentsFirst } from "../apps/backend/src/goldMarketState/ingestion/ingest";
import { listGoldStateCandidates } from "../apps/backend/src/goldMarketState/ingestion/discovery";

test("Drive's reversed listing imports a complete lineage parent before each of 47 children", async () => {
  const files = Array.from({ length: 48 }, (_, index) => ({ id: String(index), name: index === 0 ? "sunday_read_2026-09-27.json" : `gold_intermediate_2026-09-28_${String(index).padStart(2, "0")}.json`, modifiedTime: "t" }));
  const ordered = await parentsFirst(listGoldStateCandidates(files.reverse()), {
    listFiles: async () => files,
    downloadFileText: async (id) => JSON.stringify({ meta: { run_id: id, parent_run_id: id === "0" ? null : String(Number(id) - 1) } }),
    controlReader: { listRunRecords: async () => [], downloadText: async () => "", readCurrentHandoff: async () => ({}) },
  });
  assert.equal(ordered.length, 48);
  assert.deepEqual(ordered.map((candidate) => candidate.json.id), Array.from({ length: 48 }, (_, index) => String(index)));
});

test("Control artifacts cannot enter Output state candidate discovery", () => {
  assert.deepEqual(listGoldStateCandidates([
    "GOLD_MANUAL_CHECK_PLAN.json", "GOLD_MANUAL_CHECK_2026-10-03-abc.json", "GOLD_EDGE_CHECK_RESULT.json",
  ].map((name, index) => ({ id: String(index), name, modifiedTime: "t" }))), []);
});
