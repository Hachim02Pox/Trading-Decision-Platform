import assert from "node:assert/strict";
import test from "node:test";
import { presentationCompleteness } from "../apps/backend/src/goldMarketState/presentation.ts";
import { createFixtureFinalRead, validateFinalRead } from "../apps/backend/src/sundayRead/schema.ts";

test("V3 completeness reports each missing localized section without changing the state", () => {
  const read: any = createFixtureFinalRead();
  read.presentation = { version: 3, fr: { market_story: {} }, en: {} };
  const result = presentationCompleteness(read);
  assert.equal(result.presentation_complete, false);
  assert.ok(result.missing_presentation_sections.includes("fr.horizons"));
  assert.ok(result.missing_presentation_sections.includes("en.market_story"));
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
