import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { resolveV4Annotations } from "../apps/frontend/src/lib/sundayRead/annotationResolver.ts";

const ids = new Set(["REAL_YIELD"]);
const annotation = (extra = {}) => ({ id: "a1", locale: "en" as const, path: "market_story.current_setup", anchor: "real yields", glossary_id: "REAL_YIELD", ...extra });

test("V4 annotation resolves only an exact path and anchor", () => {
  assert.equal(resolveV4Annotations("real yields matter", "market_story.current_setup", [annotation()], "en", ids).length, 1);
  assert.equal(resolveV4Annotations("real yields matter", "market_story.past_week", [annotation()], "en", ids).length, 0);
  assert.equal(resolveV4Annotations("nominal yields matter", "market_story.current_setup", [annotation()], "en", ids).length, 0);
});

test("V4 annotation supports a requested repeated occurrence and rejects wrong locale/glossary", () => {
  const text = "real yields then real yields";
  assert.equal(resolveV4Annotations(text, "market_story.current_setup", [annotation({ occurrence: 2 })], "en", ids)[0]?.start, 17);
  assert.equal(resolveV4Annotations(text, "market_story.current_setup", [annotation({ locale: "fr" })], "en", ids).length, 0);
  assert.equal(resolveV4Annotations(text, "market_story.current_setup", [annotation({ glossary_id: "MISSING" })], "en", ids).length, 0);
});

test("V4 horizon cards use exact localized presentation paths and expose their essential fields", () => {
  const component = readFileSync(new URL("../apps/frontend/src/components/sundayRead/V4Presentation.tsx", import.meta.url), "utf8");
  for (const key of ["tactical", "medium", "structural", "drivers", "supporting_evidence", "contradictions", "counter_scenario", "week_ahead_implication", "confirmation", "invalidation"]) assert.match(component, new RegExp(key));
  assert.match(component, /V4AnnotatedText/);
});

test("V4 keeps the decision trail and evidence catalogue reachable", () => {
  const component = readFileSync(new URL("../apps/frontend/src/components/sundayRead/V4Presentation.tsx", import.meta.url), "utf8");
  for (const field of [
    "chronology", "causal_assessment", "surprises", "catalysts",
    "dated_catalyst_assessment", "weekly_timeline", "positioning_evidence",
    "family_audit", "invalidations", "contradictions", "anomalies",
    "unknowns", "evidence", "sources",
  ]) assert.match(component, new RegExp(field));
});
