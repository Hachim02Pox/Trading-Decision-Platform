import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { createHash } from "node:crypto";
import { canonicalSha256 } from "../apps/backend/src/goldMarketState/v6";
import { findV6PublicationSeal, validateV6PublicationSeal } from "../apps/backend/src/goldMarketState/ingestion/control";

const fixture = (name: string): any => JSON.parse(fs.readFileSync(path.join(__dirname, "fixtures", "control", name), "utf8"));
const state = () => fixture("FIXTURE_editorial_sunday.json");
const receipt = (doc = state()) => {
  const value = fixture("FIXTURE_editorial_completion.json");
  value.market_state.content_sha256 = canonicalSha256(doc);
  value.market_state.published_files[0].content_sha256 = canonicalSha256(doc);
  return value;
};

test("historical publication uses its immutable receipt after the live handoff was renewed", async () => {
  const doc = state();
  let currentReads = 0;
  const errors = await findV6PublicationSeal({
    listRunRecords: async () => [{ id: "receipt", name: `RUN_COMPLETION_RECORD_${doc.meta.run_id}.json`, modifiedTime: "t" }],
    downloadText: async () => JSON.stringify(receipt(doc)),
    readCurrentHandoff: async () => { currentReads += 1; return { handoff_id: "renewed-child" }; },
  }, doc);
  assert.deepEqual(errors, []);
  assert.equal(currentReads, 0);
});

test("receipt identity is matched exactly rather than by a run-id substring", async () => {
  const doc = state();
  assert.deepEqual(await findV6PublicationSeal({
    listRunRecords: async () => [{ id: "receipt", name: `RUN_COMPLETION_RECORD_${doc.meta.run_id}-other.json`, modifiedTime: "t" }],
    downloadText: async () => JSON.stringify(receipt(doc)),
    readCurrentHandoff: async () => ({}),
  }, doc), ["CONTROL_RECEIPT_NOT_FOUND"]);
});

test("strict receipt validation refuses missing dates, duplicate roles, mismatched JSON and out-of-order phases", () => {
  const doc = state();
  for (const change of [
    (value: any) => { delete value.phases.drive_readback.completed_at; },
    (value: any) => { value.market_state.published_files[1].role = "MARKET_STATE_JSON"; },
    (value: any) => { value.market_state.published_files[0].content_sha256 = "a".repeat(64); },
    (value: any) => { value.phases.handoff_generation.started_at = "2026-09-27T19:10:00Z"; },
    (value: any) => { value.handoff.active_handoff_count_after = 2; },
  ]) {
    const value = receipt(doc); change(value);
    assert.ok(validateV6PublicationSeal(doc, value).length > 0);
  }
});

test("manual plans and results are never completion receipts", () => {
  for (const document_type of ["GOLD_MANUAL_THESIS_CHECK_PLAN", "GOLD_MANUAL_THESIS_CHECK_RESULT", "GOLD_EDGE_CHECK_RESULT"]) {
    assert.deepEqual(validateV6PublicationSeal(state(), { ...receipt(), document_type }), ["CONTROL_RECEIPT_INVALID"]);
  }
});

test("intermediate requires the exact parent snapshot and rejects a renewed substitute", async () => {
  const doc = fixture("FIXTURE_editorial_intermediate.json");
  const snapshot = fixture("FIXTURE_editorial_handoff.json");
  doc.consumed_handoff = { handoff_id: snapshot.handoff_id, handoff_version: snapshot.handoff_version, content_sha256: canonicalSha256(snapshot) };
  const parentReceipt = receipt();
  parentReceipt.handoff.handoff_id = snapshot.handoff_id;
  parentReceipt.handoff.handoff_version = snapshot.handoff_version;
  const childReceipt = receipt(doc);
  Object.assign(childReceipt, { run_id: doc.meta.run_id, run_type: "INTERMEDIATE", parent_run_id: doc.meta.parent_run_id, origin_sunday_run_id: doc.meta.origin_sunday_run_id });
  childReceipt.market_state.run_id = doc.meta.run_id;
  Object.assign(childReceipt.handoff, { handoff_id: "child-next-handoff", created_by_run_id: doc.meta.run_id, parent_state_run_id: doc.meta.run_id });
  // Receipt dates describe a child completed after the fixture JSON build.
  for (const phase of Object.values(childReceipt.phases) as any[]) {
    phase.started_at = phase.started_at.replace("2026-09-27", "2026-09-28");
    phase.completed_at = phase.completed_at.replace("2026-09-27", "2026-09-28");
  }
  for (const file of childReceipt.market_state.published_files) {
    file.uploaded_at = file.uploaded_at.replace("2026-09-27", "2026-09-28");
    file.readback_at = file.readback_at.replace("2026-09-27", "2026-09-28");
  }
  childReceipt.handoff.pre_write_readback_at = childReceipt.handoff.pre_write_readback_at.replace("2026-09-27", "2026-09-28");
  childReceipt.handoff.post_write_readback_at = childReceipt.handoff.post_write_readback_at.replace("2026-09-27", "2026-09-28");
  const reader = {
    listRunRecords: async () => [doc.meta.run_id, doc.meta.parent_run_id].map((id) => ({ id, name: `RUN_COMPLETION_RECORD_${id}.json`, modifiedTime: "t" })),
    downloadText: async (id: string) => JSON.stringify(id === doc.meta.run_id ? childReceipt : parentReceipt),
    readCurrentHandoff: async () => { throw new Error("Live handoff must not be used"); },
    findHandoffSnapshot: async () => snapshot,
  };
  assert.deepEqual(await findV6PublicationSeal(reader, doc), []);
  assert.deepEqual(await findV6PublicationSeal({ ...reader, findHandoffSnapshot: undefined }, doc), ["CONTROL_CONSUMED_HANDOFF_SNAPSHOT_UNAVAILABLE"]);
  assert.deepEqual(await findV6PublicationSeal({ ...reader, findHandoffSnapshot: async () => ({ ...snapshot, handoff_version: snapshot.handoff_version + 1 }) }, doc), ["CONTROL_CONSUMED_HANDOFF_SNAPSHOT_MISMATCH"]);
  assert.deepEqual(await findV6PublicationSeal({ ...reader, findHandoffSnapshot: async () => ({ ...snapshot, created_at: "2026-09-27T20:00:00Z" }) }, doc), ["CONTROL_CONSUMED_HANDOFF_SNAPSHOT_MISMATCH"]);
});

test("ingestion readback compares all four immutable Output files with their sealed hashes", async () => {
  const doc = state(); const record = receipt(doc);
  const contents = new Map<string, string>();
  record.market_state.published_files.forEach((file: any, index: number) => {
    const raw = index === 0 ? JSON.stringify(doc, null, 2) : `Report ${index}\n`;
    contents.set(file.name, raw);
    file.content_sha256 = index === 0 ? canonicalSha256(doc) : createHash("sha256").update(raw).digest("hex");
  });
  const reader = {
    listRunRecords: async () => [{ id: "receipt", name: `RUN_COMPLETION_RECORD_${doc.meta.run_id}.json`, modifiedTime: "t" }],
    downloadText: async () => JSON.stringify(record), readCurrentHandoff: async () => ({}),
  };
  const output = { files: record.market_state.published_files.map((file: any) => ({ id: file.name, name: file.name, modifiedTime: "t" })), downloadText: async (id: string) => contents.get(id)! };
  assert.deepEqual(await findV6PublicationSeal(reader, doc, output), []);
  const reportName = record.market_state.published_files[2].name;
  contents.set(reportName, "Changed after sealing");
  assert.deepEqual(await findV6PublicationSeal(reader, doc, output), ["CONTROL_OUTPUT_ARTIFACT_HASH_MISMATCH"]);
  assert.deepEqual(await findV6PublicationSeal(reader, doc, { ...output, files: output.files.slice(0, 3) }), ["CONTROL_OUTPUT_ARTIFACT_HASH_MISMATCH"]);
  contents.set(reportName, "Report 2\n");
  assert.deepEqual(await findV6PublicationSeal(reader, doc, { ...output, files: output.files.slice(0, 3) }), ["CONTROL_OUTPUT_ARTIFACT_NOT_FOUND_OR_DUPLICATE"]);
});
