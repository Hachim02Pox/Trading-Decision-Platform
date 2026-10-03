import assert from "node:assert/strict";
import test from "node:test";
import { learningAvailability, retainLearningSelection, learningDate, learningTabs } from "../apps/frontend/src/lib/sundayRead/learningReaderModel.ts";

test("learning reader only consumes supported extensions and retains canonical archives", () => {
  assert.equal(learningAvailability({}), "ABSENT");
  assert.equal(learningAvailability({ learning_experience: { version: "2.0" } }), "UNSUPPORTED_VERSION");
  assert.equal(learningAvailability({ learning_experience: { version: "1.0" } }), "AVAILABLE");
});
test("selection survives a run change only when its identity still exists", () => {
  assert.equal(retainLearningSelection("b", [{ id: "a" }, { id: "b" }]), "b");
  assert.equal(retainLearningSelection("b", [{ id: "c" }]), "c");
  assert.equal(retainLearningSelection("b", []), null);
  assert.equal(learningTabs.length, 5);
});
test("measurement dates never acquire invented intraday precision", () => {
  assert.equal(learningDate("2026-09-25"), "2026-09-25");
  assert.equal(learningDate(null), "Date indisponible");
  assert.match(learningDate("2026-09-27T18:00:00Z"), /New York/);
});
