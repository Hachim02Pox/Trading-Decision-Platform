import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";
import path from "node:path";
import { validateFinalRead } from "../apps/backend/src/sundayRead/schema.ts";

// Extends tests/sunday-read.test.ts's coverage of validateFinalRead with the
// V3/continuous-recap additions (GOLD_PRESENTATION_V3_SPEC.md,
// GOLD_CONTINUOUS_RECAP_PROTOCOL.md). Fixtures are the hand-built,
// no-real-market-data examples from the canonical
// Hachim02Pox/gold-market-story-brain repository (every value there is
// prefixed FIXTURE:) — copied verbatim into tests/fixtures/gold/.

const FIXTURES_DIR = path.join(__dirname, "fixtures", "gold");

function loadFixture(name: string): unknown {
  return JSON.parse(fs.readFileSync(path.join(FIXTURES_DIR, name), "utf8"));
}

test("validateFinalRead: a historical V1/V2 document (no meta.run_type, no presentation) remains valid", () => {
  const errors = validateFinalRead(loadFixture("minimal_v2_example.json"));
  assert.deepEqual(errors, []);
});

test("validateFinalRead: a canonical V3 Sunday fixture (full lineage + presentation v3) is accepted", () => {
  const errors = validateFinalRead(loadFixture("FIXTURE_sunday_v3_state.json"));
  assert.deepEqual(errors, []);
});

test("validateFinalRead: a canonical V3 intermediate-recap fixture is accepted", () => {
  const errors = validateFinalRead(loadFixture("FIXTURE_intermediate_v3_state.json"));
  assert.deepEqual(errors, []);
});

test("validateFinalRead: meta.run_type present but lineage metadata missing is rejected", () => {
  const doc = loadFixture("FIXTURE_intermediate_v3_state.json") as Record<string, any>;
  const broken = { ...doc, meta: { ...doc.meta, origin_sunday_run_id: undefined } };
  delete broken.meta.origin_sunday_run_id;
  const errors = validateFinalRead(broken);
  assert.ok(errors.some((e) => e.includes("origin_sunday_run_id")), errors.join("; "));
});

test("validateFinalRead: meta.run_type present but frontend_eligible=false is rejected", () => {
  const doc = loadFixture("FIXTURE_intermediate_v3_state.json") as Record<string, any>;
  const broken = { ...doc, meta: { ...doc.meta, frontend_eligible: false } };
  const errors = validateFinalRead(broken);
  assert.ok(errors.some((e) => e.includes("frontend_eligible")), errors.join("; "));
});

test("validateFinalRead: a NEXT_GOLD_RECAP_HANDOFF-shaped document (document_type mismatch) is rejected", () => {
  const doc = loadFixture("FIXTURE_intermediate_v3_state.json") as Record<string, any>;
  const broken = { ...doc, meta: { ...doc.meta, document_type: "NEXT_GOLD_RECAP_HANDOFF" } };
  const errors = validateFinalRead(broken);
  assert.ok(errors.some((e) => e.includes("document_type")), errors.join("; "));
});

test("validateFinalRead: raw [[GLOSSARY_ID|text]] markup anywhere in V3 presentation copy is rejected outright (not merely 'unresolved')", () => {
  const doc = loadFixture("FIXTURE_sunday_v3_state.json") as Record<string, any>;
  const broken = JSON.parse(JSON.stringify(doc));
  broken.presentation.fr.title = "[[NO_EDGE|Pas d'avantage directionnel]]";
  // Make sure the id used resolves, to prove it's the *markup itself*, not an unresolved-token error, that fails.
  broken.glossary = [...(broken.glossary ?? []), { id: "NO_EDGE", fr: { term: "x", short_definition: "x" }, en: { term: "x", short_definition: "x" } }];
  const errors = validateFinalRead(broken);
  assert.ok(errors.some((e) => e.includes("forbidden in V3")), errors.join("; "));
});

test("validateFinalRead: a literal internal scenario node id leaking into V3 human-facing copy is rejected", () => {
  const doc = loadFixture("FIXTURE_sunday_v3_state.json") as Record<string, any>;
  const broken = JSON.parse(JSON.stringify(doc));
  const nodeId = broken.scenario_tree.nodes[0].id;
  broken.presentation.fr.subtitle = `${broken.presentation.fr.subtitle} (${nodeId})`;
  const errors = validateFinalRead(broken);
  assert.ok(errors.some((e) => e.includes("leaked into presentation")), errors.join("; "));
});

test("validateFinalRead: presentation.version 3 without scenario_tree_v3 in a locale is rejected", () => {
  const doc = loadFixture("FIXTURE_sunday_v3_state.json") as Record<string, any>;
  const broken = JSON.parse(JSON.stringify(doc));
  delete broken.presentation.en.scenario_tree_v3;
  const errors = validateFinalRead(broken);
  assert.ok(errors.some((e) => e.includes("scenario_tree_v3")), errors.join("; "));
});

test("validateFinalRead: NEXT_GOLD_RECAP.json's own shape (not a market state at all) fails validation — it must never be mistaken for one", () => {
  const handoff = loadFixture("FIXTURE_next_gold_recap.json");
  const errors = validateFinalRead(handoff);
  assert.ok(errors.length > 0, "a handoff document must never pass validateFinalRead");
});
