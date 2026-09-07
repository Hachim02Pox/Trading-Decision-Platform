import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("../apps/frontend/src/components/market/GlobalReadDecisionReport.tsx", import.meta.url), "utf8");
const causalMapSource = readFileSync(new URL("../apps/frontend/src/components/market/GlobalReadCausalMap.tsx", import.meta.url), "utf8");

test("main rebuild report exposes the 8 human sections and update-first state", () => {
  for (const title of ["Ce qui a changé", "1. Où en est le Gold", "2. Le monde derrière le Gold", "3. Comment tout cela s’assemble", "4. Les questions qui comptent", "5. Le débat", "6. Scénarios", "7. Positionnement et asymétrie", "8. Ce que je ferais maintenant"]) assert.match(source, new RegExp(title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
});

test("raw JSON remains inside the secondary audit disclosure", () => {
  const audit = source.indexOf("Audit complet");
  const json = source.indexOf("JSON.stringify");
  assert.ok(audit >= 0 && json > audit);
  assert.equal(source.includes("Agent A vs Agent B"), false);
});

test("important facts display compact source and web-only provenance in the human report", () => {
  assert.match(source, /WEB_ONLY_VERIFIED/);
  assert.match(source, /terminal source unavailable/);
  assert.match(source, /sourceLabel/);
  assert.match(source, /selected\?\.unit/);
});

test("the human report exposes an optional causal map without leaking raw audit JSON", () => {
  assert.match(source, /GlobalReadCausalMap/);
  assert.match(causalMapSource, /Ouvrir la carte macro/);
});
