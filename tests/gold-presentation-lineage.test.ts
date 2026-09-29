import assert from "node:assert/strict";
import test from "node:test";
import { presentationCompleteness } from "../apps/backend/src/goldMarketState/presentation.ts";
import { createFixtureFinalRead, validateFinalRead } from "../apps/backend/src/sundayRead/schema.ts";
import { projectPublicGoldEditorialV6 } from "../apps/backend/src/goldMarketState/v6.ts";
import { projectPublicGoldRead } from "../apps/backend/src/goldMarketState/store.ts";
import fs from "node:fs";
import path from "node:path";

function v6Fixture(name: string): any {
  return JSON.parse(fs.readFileSync(path.join(__dirname, "..", "gold-sunday-read", "brain-v6", "reference", "brain", "tests", "fixtures", name), "utf8"));
}

test("V3 completeness reports each missing localized section without changing the state", () => {
  const read: any = createFixtureFinalRead();
  read.presentation = { version: 3, fr: { market_story: {} }, en: {} };
  const result = presentationCompleteness(read);
  assert.equal(result.presentation_complete, false);
  assert.ok(result.missing_presentation_sections.includes("fr.horizons"));
  assert.ok(result.missing_presentation_sections.includes("en.market_story"));
});

test("V4 completeness requires localized causal story and verdict explanations", () => {
  const read: any = createFixtureFinalRead();
  read.presentation = { version: 4, fr: { market_story: {}, horizons: {}, priced_in: {}, asymmetry: {}, direction_state: {}, scenario_tree_v3: {}, walkthrough: {} }, en: { market_story: {}, horizons: {}, priced_in: {}, asymmetry: {}, direction_state: {}, scenario_tree_v3: {}, walkthrough: {} } };
  const result = presentationCompleteness(read);
  assert.equal(result.presentation_complete, false);
  assert.ok(result.missing_presentation_sections.includes("fr.market_story.chronology"));
  assert.ok(result.missing_presentation_sections.includes("en.verdict_explanations"));
  assert.ok(result.missing_presentation_sections.includes("fr.priced_in.already_priced_analysis"));
  assert.ok(result.missing_presentation_sections.includes("en.annotations"));
});

test("lineage rejects malformed Sunday and intermediate metadata", () => {
  const sunday: any = createFixtureFinalRead();
  Object.assign(sunday.meta, { run_type: "SUNDAY", document_type: "GOLD_MARKET_STATE", frontend_eligible: true, parent_run_id: "bad", origin_sunday_run_id: "other", evidence_cutoff_start: "2026-09-20T00:00:00Z", evidence_cutoff_end: "2026-09-19T00:00:00Z" });
  const sundayErrors = validateFinalRead(sunday);
  assert.ok(sundayErrors.some((error) => error.includes("Sunday meta.parent_run_id")));
  assert.ok(sundayErrors.some((error) => error.includes("Sunday meta.origin_sunday_run_id")));
  assert.ok(sundayErrors.some((error) => error.includes("evidence_cutoff_end")));
  const intermediate: any = createFixtureFinalRead();
  Object.assign(intermediate.meta, { run_type: "INTERMEDIATE", document_type: "GOLD_MARKET_STATE", frontend_eligible: true, parent_run_id: null, origin_sunday_run_id: "sunday", evidence_cutoff_start: "2026-09-19T00:00:00Z", evidence_cutoff_end: "2026-09-20T00:00:00Z" });
  assert.ok(validateFinalRead(intermediate).some((error) => error.includes("Intermediate meta.parent_run_id")));
});

test("a valid intermediate keeps its origin and advances its own cutoff", () => {
  const intermediate: any = createFixtureFinalRead();
  Object.assign(intermediate.meta, { run_type: "INTERMEDIATE", document_type: "GOLD_MARKET_STATE", frontend_eligible: true, parent_run_id: "sunday-1", origin_sunday_run_id: "sunday-1", evidence_cutoff_start: "2026-09-19T00:00:00Z", evidence_cutoff_end: "2026-09-20T00:00:00Z" });
  assert.equal(validateFinalRead(intermediate).filter((error) => error.includes("parent_run_id") || error.includes("origin_sunday") || error.includes("evidence_cutoff")).length, 0);
});

test("v6 completeness verifies the actual reader surface instead of accepting an absent presentation version", () => {
  const read = v6Fixture("FIXTURE_editorial_sunday.json");
  assert.deepEqual(presentationCompleteness(read), { presentation_complete: true, missing_presentation_sections: [] });
  read.six_judgments = [];
  read.glossary_fr = {};
  const result = presentationCompleteness(read);
  assert.equal(result.presentation_complete, false);
  assert.ok(result.missing_presentation_sections.includes("six_judgments"));
  assert.ok(result.missing_presentation_sections.includes("glossary_fr"));
});

test("v6 public projection preserves reader content but excludes audit, sources and technical sentinels", () => {
  const read = v6Fixture("FIXTURE_editorial_sunday.json");
  read.sources[0].title = "SOURCE_SENTINEL";
  read.research_audit.audit_sentinel = "AUDIT_SENTINEL";
  read.procedural_audit.procedural_sentinel = "PROCEDURAL_SENTINEL";
  read.scenario_tree.nodes[0].current_evidence_refs = ["TECHNICAL_ID_SENTINEL"];
  read.family_readouts[0].id = "FAMILY_ID_SENTINEL";
  read.family_readouts[0].questions[0].id = "QUESTION_ID_SENTINEL";
  const projected = projectPublicGoldEditorialV6(read);
  const serialized = JSON.stringify(projected);
  assert.equal(projected.six_judgments.length, 6);
  assert.equal(projected.scenario_tree.nodes[0]?.title_fr, read.scenario_tree.nodes[0]?.title_fr);
  assert.doesNotMatch(serialized, /SOURCE_SENTINEL|AUDIT_SENTINEL|PROCEDURAL_SENTINEL|TECHNICAL_ID_SENTINEL|FAMILY_ID_SENTINEL|QUESTION_ID_SENTINEL/);
  assert.equal("sources" in projected, false);
  assert.equal("research_audit" in projected, false);
  assert.equal("procedural_audit" in projected, false);
});

test("the shared public API projection protects v6 while retaining the legacy read shape", () => {
  const v6 = v6Fixture("FIXTURE_editorial_sunday.json");
  v6.sources[0].title = "API_SOURCE_SENTINEL";
  assert.doesNotMatch(JSON.stringify(projectPublicGoldRead(v6)), /API_SOURCE_SENTINEL/);
  const legacy = createFixtureFinalRead();
  assert.strictEqual(projectPublicGoldRead(legacy), legacy);
  assert.equal(projectPublicGoldRead(null), null);
});
