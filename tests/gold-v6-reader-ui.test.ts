import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

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
