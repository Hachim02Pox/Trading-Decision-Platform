import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { judgmentEvolution, matchingIntermediateSummary, materialUnknownReasons, verdictDetail } from "../apps/frontend/src/lib/sundayRead/marketStoryNarrative.ts";

// Reduced copies of the actual immutable Drive snapshots (20 and 24 September).
// The second intermediate below is an invented fixture, never a market claim.
const { sunday, first } = JSON.parse(readFileSync(new URL("./fixtures/gold-september-2026-narrative.json", import.meta.url), "utf8"));
const labels = { macro_direction: "Direction macro", directional_asymmetry: "Asymétrie directionnelle", positioning_asymmetry: "Asymétrie de positionnement", edge: "Avantage exploitable", opportunity_quality: "Qualité de l'opportunité", execution_readiness: "Préparation à l'exécution" };

test("actual September 24 French copy explains the three changed judgments with current reasons", () => {
  const result = judgmentEvolution(first, sunday, first.presentation.fr, sunday.presentation.fr, "FR", labels);
  assert.equal(result.changed.length, 3);
  assert.match(result.changed.join(" "), /Direction macro partagée → Direction macro baissière/);
  assert.match(result.changed.join(" "), /Gold est plus faible avec dollar ferme/);
  assert.match(result.changed.join(" "), /Le canal restrictif a commencé à transmettre au prix/);
  assert.doesNotMatch(result.changed.join(" "), /Le premier peut comprimer Gold; le second/);
  assert.match(result.remains.join(" "), /Le COT post-Fed, le skew, le gamma et un OI comparable manquent/);
  assert.match(result.remains.join(" "), /La direction ne suffit pas sans payoff/);
  assert.equal(matchingIntermediateSummary(first, sunday.meta.run_id), null);
});

test("six current explanations prefer real localized state over inherited verdict mechanisms, FR/EN", () => {
  for (const language of ["fr", "en"]) for (const key of Object.keys(labels)) {
    const copy = first.presentation[language];
    const authoritative = key === "opportunity_quality" || key === "execution_readiness" ? copy[key] : copy.direction_state[key];
    assert.equal(verdictDetail(copy, key).explanation, authoritative.explanation);
  }
  assert.notEqual(verdictDetail(first.presentation.fr, "directional_asymmetry").explanation, first.presentation.fr.verdict_explanations.directional_asymmetry.mechanism);
});

test("second intermediate compares to the first, never borrows Sunday parent narrative", () => {
  const second = { ...first, meta: { ...first.meta, run_id: "test-second-intermediate", parent_run_id: first.meta.run_id },
    direction_state: { ...first.direction_state, positioning_asymmetry: "BEARISH" },
    intermediate_summary: { parent_run_id: first.meta.run_id, what_changed: { fr: "Le positionnement devient baissier après publication.", en: "Positioning turned bearish after publication." } } };
  assert.equal(matchingIntermediateSummary(second, first.meta.run_id), second.intermediate_summary);
  assert.equal(matchingIntermediateSummary(second, sunday.meta.run_id), null);
  const localizedSecond = { ...first.presentation.fr, direction_state: { ...first.presentation.fr.direction_state,
    positioning_asymmetry: { display: "Positionnement baissier", explanation: "Publication officielle comparable et datée." } } };
  const diff = judgmentEvolution(second, first, localizedSecond, first.presentation.fr, "FR", labels);
  assert.equal(diff.changed.length, 1);
  assert.match(diff.changed[0], /Positionnement baissier/);
  assert.doesNotMatch(diff.remains.join(" "), /Positionnement baissier/);
});

test("English reading compares September 24 to Sunday and keeps only still true conclusions", () => {
  const result = judgmentEvolution(first, sunday, first.presentation.en, sunday.presentation.en, "EN", labels);
  assert.equal(result.changed.length, 3);
  assert.match(result.changed.join(" "), /Gold is weaker with a firm dollar/);
  assert.match(result.remains.join(" "), /post-Fed COT/i);
  assert.doesNotMatch(result.remains.join(" "), /balanced directional asymmetry/i);
});

test("historical September 24 gap explanations distinguish lag, failed retrieval, comparability and method", () => {
  for (const language of ["FR", "EN"]) {
    const reasons = materialUnknownReasons(first, language, null);
    assert.deepEqual(reasons.map((r) => r.topic), ["COT_POST_FED", "OPEN_INTEREST_CURRENT", "OPTIONS_IV", "OPTIONS_SKEW", "DEALER_GAMMA", "REAL_YIELD_CURRENT"]);
    const cot = reasons[0];
    assert.match(cot.explanation, /2026|septembre/);
    assert.match(cot.checked ?? "", /2026|septembre/);
    const oi = reasons[1];
    assert.match(oi.explanation, language === "FR" ? /cause exacte ne peut pas être confirmée/ : /exact cause cannot be confirmed/);
    assert.doesNotMatch(oi.checked ?? "", language === "FR" ? /current OI not reliably recovered/ : /non validée/);
    assert.match(reasons[4].explanation, language === "FR" ? /méthode de calcul vérifiée/ : /verified calculation method/);
    assert.match(reasons[5].explanation, language === "FR" ? /taux nominal/ : /nominal yield/);
  }
});
test("future gap narrative is used only after the caller has checked its immediate parent", () => {
  const second = { ...first, meta: { ...first.meta, run_id: "test-second", parent_run_id: first.meta.run_id },
    intermediate_summary: { parent_run_id: first.meta.run_id, unknown_reasons: [{ topic: "OTHER", label: { fr: "Nouvelle mesure manquante", en: "Another missing observation" },
      explanation: { fr: "Raison établie pour cette mesure.", en: "Established reason for this observation." },
      checked: { fr: "Test daté", en: "Dated check" }, next_action: { fr: "Prochaine étape", en: "Next step" } }] } };
  assert.equal(matchingIntermediateSummary(second, sunday.meta.run_id), null);
  assert.equal(materialUnknownReasons(second, "FR", matchingIntermediateSummary(second, first.meta.run_id))[0].explanation, "Raison établie pour cette mesure.");
  assert.notEqual(materialUnknownReasons(second, "FR", matchingIntermediateSummary(second, sunday.meta.run_id))[0].explanation, "Raison établie pour cette mesure.");
});
