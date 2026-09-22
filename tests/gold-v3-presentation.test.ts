import assert from "node:assert/strict";
import test from "node:test";
import { getPresentationRenderPlan } from "../apps/frontend/src/lib/sundayRead/presentationPlan.ts";

test("V4 uses only its localized presentation and reports causal blocks", () => {
  const plan = getPresentationRenderPlan({ presentation: { version: 4, fr: { market_story: {}, horizons: {}, priced_in: {}, asymmetry: {}, direction_state: {}, scenario_tree_v3: {}, walkthrough: {}, opportunity_quality: {}, execution_readiness: {} }, en: {} } }, "fr");
  assert.equal(plan.kind, "v4");
  assert.ok(plan.missingSections.includes("market_story.chronology"));
  assert.ok(plan.missingSections.includes("verdict_explanations"));
});

const completeFr = { market_story: {}, horizons: {}, priced_in: {}, asymmetry: {}, direction_state: {}, scenario_tree_v3: {}, walkthrough: {}, opportunity_quality: { display: "Qualité locale" }, execution_readiness: { display: "Prêt local" } };

test("V3 only renders its selected locale and reports missing sections", () => {
  const plan = getPresentationRenderPlan({ presentation: { version: 3, fr: completeFr, en: {} } }, "fr");
  assert.equal(plan.kind, "v3");
  assert.equal(plan.complete, true);
  assert.equal(getPresentationRenderPlan({ presentation: { version: 3, fr: { market_story: {} }, en: completeFr }, contexts: { tactical: { why: "English analytical fallback" } } }, "fr").missingSections.includes("horizons"), true);
});

test("V2 keeps the explicit legacy adapter", () => {
  assert.equal(getPresentationRenderPlan({ presentation: { version: 2, fr: {} } }, "fr").kind, "legacy");
});
