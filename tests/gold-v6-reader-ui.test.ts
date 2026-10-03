import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { buildScenarioTopology, humanStatus, v6ValidityMessage } from "../apps/frontend/src/lib/sundayRead/v6ReaderModel.ts";
import type { V6EditorialState } from "../apps/frontend/src/lib/sundayRead/v6Editorial.ts";

const page = fs.readFileSync(new URL("../apps/frontend/src/app/sunday-read/page.tsx", import.meta.url), "utf8");
const reader = fs.readFileSync(new URL("../apps/frontend/src/components/sundayRead/V6EditorialReader.tsx", import.meta.url), "utf8");

test("v6 states take the explicit safe editorial reader path", () => {
  assert.match(page, /isV6EditorialState\(read\)/);
  assert.match(page, /V6EditorialReader/);
  assert.match(reader, /macro_direction[\s\S]*fundamental_conclusion/);
  assert.match(reader, /evolution_review/);
  assert.match(reader, /scenario_tree/);
});

test("v6 reader never renders audit references, source URLs, or raw JSON", () => {
  assert.doesNotMatch(reader, /research_audit/);
  assert.doesNotMatch(reader, /current_evidence_refs/);
  assert.doesNotMatch(reader, /JSON\.stringify/);
  assert.doesNotMatch(reader, /href=/);
});

test("v6 reader model preserves parent-child scenario topology and readable edge labels", () => {
  const fixture = JSON.parse(fs.readFileSync(new URL("./fixtures/control/FIXTURE_editorial_sunday.json", import.meta.url), "utf8")) as V6EditorialState;
  const tree = buildScenarioTopology(fixture.scenario_tree.nodes);
  const root = tree.find((node) => node.id === "root");
  assert.ok(root);
  assert.ok(root.children.length > 0);
  assert.equal(root.children[0]?.parent_id, "root");
  assert.match(reader, /nodeTitles\.get\(edge\.from_id\)/);
  assert.match(reader, /nodeTitles\.get\(edge\.to_id\)/);
});

test("v6 reader model marks expired editorial eligibility as historical without inventing a bias", () => {
  const message = v6ValidityMessage({ title_fr: "x", horizon: "x", recheck_fr: "x", scheduled_expiry: "2026-09-29T10:00:00-04:00", instruments: [] }, new Date("2026-09-30T00:00:00Z"));
  assert.match(message, /historique/i);
  assert.doesNotMatch(message, /baissier|haussier/i);
});

test("v6 reader model translates raw family statuses and keeps missing-observation recovery visible", () => {
  assert.equal(humanStatus("PARTIAL"), "Partiel");
  assert.match(reader, /Observation manquante/);
  assert.match(reader, /Prochaine recuperation/);
  assert.match(reader, /Verifie le/);
  assert.match(reader, /Attendu/);
});
