import assert from "node:assert/strict";
import test from "node:test";
import { selectCurrentGoldState, type LineageCandidate } from "../apps/backend/src/goldMarketState/selection.ts";

// Pure lineage-tip selection — no DB, no Drive. Covers the mission's
// mandatory selection invariants directly (see final report's test list):
// selection never relies on Drive modifiedTime/filename alone, an
// intermediate recap supersedes its Sunday as "current", frontend_eligible
// false and non-GOLD_MARKET_STATE documents are ignored, and a stray/older
// lineage never wins a tie merely by having a later insertion order.

function candidate(overrides: Partial<LineageCandidate> & { runId: string }): LineageCandidate {
  return {
    runType: null,
    documentType: null,
    frontendEligible: null,
    parentRunId: null,
    originSundayRunId: null,
    evidenceCutoffEnd: null,
    generatedAt: null,
    asOf: null,
    ...overrides,
  };
}

test("an intermediate recap becomes current over its own origin Sunday", () => {
  const sunday = candidate({
    runId: "sunday-1",
    runType: "SUNDAY",
    documentType: "GOLD_MARKET_STATE",
    frontendEligible: true,
    parentRunId: null,
    originSundayRunId: "sunday-1",
    evidenceCutoffEnd: "2026-09-14T20:00:00Z",
  });
  const intermediate = candidate({
    runId: "intermediate-1",
    runType: "INTERMEDIATE",
    documentType: "GOLD_MARKET_STATE",
    frontendEligible: true,
    parentRunId: "sunday-1",
    originSundayRunId: "sunday-1",
    evidenceCutoffEnd: "2026-09-16T21:00:00Z",
  });
  const result = selectCurrentGoldState([sunday, intermediate]);
  assert.equal(result.current?.runId, "intermediate-1");
});

test("selection is NOT based on array/insertion order or an unrelated 'modifiedTime'-like field — only on evidence_cutoff_end/generated_at", () => {
  const older = candidate({
    runId: "sunday-1",
    runType: "SUNDAY",
    documentType: "GOLD_MARKET_STATE",
    frontendEligible: true,
    originSundayRunId: "sunday-1",
    evidenceCutoffEnd: "2026-09-07T20:00:00Z",
  });
  const newer = candidate({
    runId: "sunday-2",
    runType: "SUNDAY",
    documentType: "GOLD_MARKET_STATE",
    frontendEligible: true,
    originSundayRunId: "sunday-2",
    evidenceCutoffEnd: "2026-09-14T20:00:00Z",
  });
  // `newer` listed FIRST — a naive "first in list" or array-order selector would get this wrong.
  const result = selectCurrentGoldState([newer, older]);
  assert.equal(result.current?.runId, "sunday-2");
});

test("frontend_eligible=false is ignored even if it is otherwise the newest candidate", () => {
  const eligible = candidate({
    runId: "sunday-1",
    runType: "SUNDAY",
    documentType: "GOLD_MARKET_STATE",
    frontendEligible: true,
    originSundayRunId: "sunday-1",
    evidenceCutoffEnd: "2026-09-07T20:00:00Z",
  });
  const notEligible = candidate({
    runId: "sunday-2-draft",
    runType: "SUNDAY",
    documentType: "GOLD_MARKET_STATE",
    frontendEligible: false,
    originSundayRunId: "sunday-2-draft",
    evidenceCutoffEnd: "2026-09-20T20:00:00Z",
  });
  const result = selectCurrentGoldState([eligible, notEligible]);
  assert.equal(result.current?.runId, "sunday-1");
  assert.ok(result.rejected.some((r) => r.runId === "sunday-2-draft" && r.reason === "NOT_ELIGIBLE"));
});

test("a NEXT_GOLD_RECAP_HANDOFF-shaped candidate (wrong document_type) is ignored even if it slipped into the pool", () => {
  const state = candidate({
    runId: "sunday-1",
    runType: "SUNDAY",
    documentType: "GOLD_MARKET_STATE",
    frontendEligible: true,
    originSundayRunId: "sunday-1",
    evidenceCutoffEnd: "2026-09-07T20:00:00Z",
  });
  const handoff = candidate({
    runId: "handoff-1",
    runType: null,
    documentType: "NEXT_GOLD_RECAP_HANDOFF",
    frontendEligible: false,
    evidenceCutoffEnd: "2026-09-30T00:00:00Z",
  });
  const result = selectCurrentGoldState([state, handoff]);
  assert.equal(result.current?.runId, "sunday-1");
});

test("a GOLD_RUN_COMPLETION_RECORD is excluded from both current state and history", () => {
  const state = candidate({ runId: "sunday-1", runType: "SUNDAY", documentType: "GOLD_MARKET_STATE", frontendEligible: true, originSundayRunId: "sunday-1", evidenceCutoffEnd: "2026-09-07T20:00:00Z" });
  const completion = candidate({ runId: "completion-1", documentType: "GOLD_RUN_COMPLETION_RECORD", frontendEligible: false, evidenceCutoffEnd: "2026-09-30T00:00:00Z" });
  const result = selectCurrentGoldState([state, completion]);
  assert.equal(result.current?.runId, "sunday-1");
  assert.deepEqual(result.historyNewestFirst.map((entry) => entry.runId), ["sunday-1"]);
});

test("a legacy V1/V2 document (no run_type) remains readable/selectable when nothing newer exists", () => {
  const legacy = candidate({ runId: "legacy-2026-09-13", runType: null, evidenceCutoffEnd: null, generatedAt: "2026-09-13T05:00:00Z" });
  const result = selectCurrentGoldState([legacy]);
  assert.equal(result.current?.runId, "legacy-2026-09-13");
});

test("a broken/branching lineage (two intermediates claiming the same parent) resolves to the latest-ranked branch and logs the other as ignored", () => {
  const sunday = candidate({
    runId: "sunday-1", runType: "SUNDAY", documentType: "GOLD_MARKET_STATE", frontendEligible: true,
    originSundayRunId: "sunday-1", evidenceCutoffEnd: "2026-09-14T20:00:00Z",
  });
  const branchA = candidate({
    runId: "intermediate-a", runType: "INTERMEDIATE", documentType: "GOLD_MARKET_STATE", frontendEligible: true,
    parentRunId: "sunday-1", originSundayRunId: "sunday-1", evidenceCutoffEnd: "2026-09-16T12:00:00Z",
  });
  const branchB = candidate({
    runId: "intermediate-b", runType: "INTERMEDIATE", documentType: "GOLD_MARKET_STATE", frontendEligible: true,
    parentRunId: "sunday-1", originSundayRunId: "sunday-1", evidenceCutoffEnd: "2026-09-17T09:00:00Z",
  });
  const result = selectCurrentGoldState([sunday, branchA, branchB]);
  assert.equal(result.current?.runId, "intermediate-b");
  assert.ok(result.rejected.some((r) => r.runId === "intermediate-a" && r.reason === "LINEAGE_BRANCH_IGNORED"));
});

test("history is returned newest-first and marks which entry is current", () => {
  const sunday = candidate({
    runId: "sunday-1", runType: "SUNDAY", documentType: "GOLD_MARKET_STATE", frontendEligible: true,
    originSundayRunId: "sunday-1", evidenceCutoffEnd: "2026-09-14T20:00:00Z",
  });
  const intermediate = candidate({
    runId: "intermediate-1", runType: "INTERMEDIATE", documentType: "GOLD_MARKET_STATE", frontendEligible: true,
    parentRunId: "sunday-1", originSundayRunId: "sunday-1", evidenceCutoffEnd: "2026-09-16T21:00:00Z",
  });
  const result = selectCurrentGoldState([sunday, intermediate]);
  assert.deepEqual(result.historyNewestFirst.map((c) => c.runId), ["intermediate-1", "sunday-1"]);
});
