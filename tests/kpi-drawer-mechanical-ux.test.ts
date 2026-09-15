import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

test("KPI mechanical drawer presents the deterministic read without AI or raw channel IDs", () => {
  const drawer = read("apps/frontend/src/components/market/KpiDrawerView.tsx");
  assert.match(drawer, /getContextualExplanation/);
  assert.match(drawer, /previousValue/);
  assert.match(drawer, /currentValue/);
  assert.match(drawer, /ruleUsed/);
  assert.doesNotMatch(drawer, /useOnDemandKpiAnalysis/);
  assert.doesNotMatch(drawer, /mechanicalChannel/);
});

test("family mechanical summary uses KPI labels rather than channel identifiers", () => {
  const drawer = read("apps/frontend/src/components/market/FamilyDrawerView.tsx");
  assert.match(drawer, /contributors\.map\(\(kpi\) => kpi\.label\)/);
  assert.doesNotMatch(drawer, /contributingChannels.join/);
  assert.doesNotMatch(drawer, /useOnDemandKpiAnalysis/);
});

test("2Y rationale distinguishes its policy signal from Gold transmission", () => {
  const rationale = read("apps/frontend/src/content/mechanicalRationale.ts");
  assert.match(rationale, /short-term policy-rate and Fed-path expectations/);
  assert.match(rationale, /Real yields remain more directly connected/);
  assert.doesNotMatch(rationale, /secondary, less precise/);
});
