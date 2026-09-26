import assert from "node:assert/strict";
import fs from "node:fs";

import test from "node:test";

const page = fs.readFileSync(new URL("../apps/frontend/src/app/sunday-read/page.tsx", import.meta.url), "utf8");

test("requested snapshot and parent lineage feed the chronological reading", () => {
  assert.match(page, /fetchGoldReadByRunId\(requestedRunId\)/);
  assert.match(page, /orderGoldReadLineage/);
  assert.match(page, /lineage\.map\(\(state, index\) => <NarrativeTimelineCard/);
  assert.match(page, /matchingIntermediateSummary\(read, parent\?\.meta\.run_id\)/);
});

test("Sunday appears in full once, scenario diagram lives on its own page", () => {
  assert.match(page, /state\.meta\.run_type === "SUNDAY"\) return <article[^\n]+<V4Presentation/);
  assert.doesNotMatch(page, /<ScenarioTree/);
  assert.doesNotMatch(page, /function RecapTimeline/);
});

test("intermediates use localized parent comparisons and scenario links", () => {
  assert.match(page, /judgmentEvolution\(read, previous, presentation, previousPresentation, language, judgmentLabels\[language\]\)/);
  assert.match(page, /localizedSummary\(summary, "what_changed", language\)/);
  assert.match(page, /\/scenario-tree\?runId=/);
  assert.doesNotMatch(page, /Explication localisée non publiée|Nouvelles preuves datées|Ouvrir cet état complet/);
  assert.doesNotMatch(page, /Origine :|Historique \(\$\{history\.length\}/);
});

test("the current view explains unavailable observations and dates its macro judgment", () => {
  assert.match(page, /materialUnknownReasons\(read, language, summary\)/);
  assert.match(page, /Pourquoi ces données manquent/);
  assert.match(page, /Ce jugement décrit la situation observée à cette date/);
  assert.match(page, /macroReading/);
});

test("proof links resolve source_id from the real JSON contract", () => {
  assert.match(page, /item\.source_id \?\? item\.id/);
});

test("manual option form stays evidence-bound and does not imply a trade signal", () => {
  assert.match(page, /ManualOptionObservation/);
  assert.match(page, /proof_url/);
  assert.match(page, /GC\|MGC/);
  assert.match(page, /gex_basis/);
  assert.match(page, /No buy\/sell signal is produced/);
});
