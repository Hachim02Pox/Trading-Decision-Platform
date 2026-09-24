import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const page = fs.readFileSync(path.join(__dirname, "../apps/frontend/src/app/sunday-read/page.tsx"), "utf8");

test("Sunday Read timeline loads the requested state, its lineage, and exposes archives", () => {
  assert.match(page, /fetchGoldReadByRunId\(requestedRunId\)/);
  assert.match(page, /orderGoldReadLineage/);
  assert.match(page, /RecapTimeline/);
  assert.match(page, /allHistory/);
  assert.doesNotMatch(page, /\{false && \(/);
});

test("intermediate cards remain compact and link to the immutable full snapshot", () => {
  assert.match(page, /Mise à jour \$\{number\}/);
  assert.match(page, /Voir l’analyse complète et les sources/);
  assert.match(page, /Ouvrir cet état complet/);
});
