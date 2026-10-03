import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { canonicalJson, canonicalSha256, validateGoldEditorialV6 } from "../apps/backend/src/goldMarketState/v6.ts";
import { findV6PublicationSeal } from "../apps/backend/src/goldMarketState/ingestion/control.ts";

const fixture = (name: string): any => JSON.parse(fs.readFileSync(path.join(__dirname, "fixtures", "control", name), "utf8"));

test("v6 admission accepts the canonical editorial fixture and keeps v6 discriminants at root", () => {
  const state = fixture("FIXTURE_editorial_sunday.json");
  assert.deepEqual(validateGoldEditorialV6(state), []);
  const wrong = structuredClone(state);
  wrong.meta.document_type = "GOLD_MARKET_STATE";
  delete wrong.document_type;
  assert.ok(validateGoldEditorialV6(wrong).length > 0);
});

test("canonical JSON follows Brain recursion including numeric keys, nested objects and arrays", () => {
  const value = { "2": "two", "10": "ten", a: [{ z: 1, b: 2 }] };
  assert.equal(canonicalJson(value), '{"10":"ten","2":"two","a":[{"b":2,"z":1}]}');
  assert.equal(canonicalSha256(value), canonicalSha256({ a: [{ b: 2, z: 1 }], "10": "ten", "2": "two" }));
});

test("v6 intermediate requires the canonical consumed_handoff receipt identity", () => {
  const state = fixture("FIXTURE_editorial_intermediate.json");
  assert.deepEqual(validateGoldEditorialV6(state), []);
  delete state.consumed_handoff;
  assert.ok(validateGoldEditorialV6(state).some((error) => error.includes("consumed_handoff")));
});

test("v6 admission fails closed for empty editorial surfaces accepted by the old key-presence gate", () => {
  for (const mutate of [
    (state: any) => { state.opening_thesis = null; state.decision_panel = null; },
    (state: any) => { state.six_judgments = Array(6).fill(null); },
    (state: any) => { state.scenario_tree = { nodes: [], edges: [] }; },
    (state: any) => { state.sources = []; state.research_audit = {}; state.procedural_audit = {}; },
  ]) {
    const state = fixture("FIXTURE_editorial_sunday.json");
    mutate(state);
    assert.ok(validateGoldEditorialV6(state).length > 0);
  }
});

test("v6 Control sealing refuses unavailable or missing receipt evidence", async () => {
  const state = fixture("FIXTURE_editorial_sunday.json");
  assert.deepEqual(await findV6PublicationSeal({
    listRunRecords: async () => { throw new Error("Drive forbidden"); },
    downloadText: async () => "",
    readCurrentHandoff: async () => ({}),
  }, state), ["CONTROL_UNAVAILABLE"]);
  assert.deepEqual(await findV6PublicationSeal({
    listRunRecords: async () => [],
    downloadText: async () => "",
    readCurrentHandoff: async () => ({}),
  }, state), ["CONTROL_RECEIPT_NOT_FOUND"]);
});
