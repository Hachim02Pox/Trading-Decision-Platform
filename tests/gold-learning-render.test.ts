import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import test from "node:test";
import { buildSync } from "esbuild";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { V6EditorialState } from "../apps/frontend/src/lib/sundayRead/v6Editorial.ts";
import type { LearningTab } from "../apps/frontend/src/lib/sundayRead/learningReaderModel.ts";

const root = path.resolve(import.meta.dirname, "..");
const compiled = buildSync({
  entryPoints: [
    path.join(
      root,
      "apps/frontend/src/components/sundayRead/LearningExperienceReader.tsx",
    ),
  ],
  bundle: true,
  write: false,
  platform: "node",
  format: "cjs",
  jsx: "automatic",
  external: ["react", "react-dom", "@gold-terminal/contracts"],
  alias: { "@": path.join(root, "apps/frontend/src") },
  loader: { ".css": "empty", ".module.css": "empty" },
  logLevel: "silent",
}).outputFiles[0]!.text;
const module = { exports: {} as { LearningExperienceReader: any } };
new Function("require", "module", "exports", compiled)(
  createRequire(import.meta.url),
  module,
  module.exports,
);
const Reader = module.exports.LearningExperienceReader;
const fixture = JSON.parse(
  fs.readFileSync(
    path.join(root, "tests/fixtures/learning/FIXTURE_learning_sunday.json"),
    "utf8",
  ),
) as V6EditorialState;
function render(
  state: V6EditorialState,
  tab: LearningTab,
  depth: "simple" | "deep" = "simple",
) {
  return renderToStaticMarkup(
    createElement(Reader, {
      state,
      preference: { tab, depth },
      baselineAvailable: false,
    }),
  );
}
function plain(markup: string) {
  return markup
    .replace(/<[^>]*>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&#x27;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

test("learning reading renders contradictions, limits, synthesis and canonical content without inventing a gate", () => {
  const markup = render(fixture, "La lecture");
  const text = plain(markup);
  const learning = fixture.learning_experience!;
  assert.ok(text.includes(learning.headline.summary_fr));
  for (const key of [
    "joint_reading_fr",
    "dominant_driver_fr",
    "counter_case_fr",
    "why_preferred_or_mixed_fr",
    "priced_in_fr",
    "conditional_outlook_fr",
    "unresolved_fr",
    "next_checks_fr",
  ] as const)
    assert.ok(text.includes(learning.synthesis[key]), key);
  assert.ok(text.includes(learning.mechanisms[0]!.limits_fr));
  assert.ok(text.includes(learning.mechanisms[0]!.invalidation_fr));
  for (const instrument of fixture.decision_panel.instruments)
    for (const key of [
      "answer_fr",
      "mechanism_fr",
      "strongest_contradiction_fr",
      "flip_fr",
    ] as const)
      assert.ok(text.includes(instrument[key]), key);
  assert.ok(text.includes(fixture.decision_panel.earlier_expiry!));
  for (const item of fixture.opening_thesis)
    assert.ok(text.includes(item.body_fr));
  for (const item of fixture.chronology)
    assert.ok(text.includes(item.event_fr));
  assert.equal((markup.match(/aria-pressed="true"/g) ?? []).length, 4);
  assert.doesNotMatch(
    markup,
    /research_audit|evidence_refs|request_log|https:\/\//,
  );
});

test("all 32 family answers and six distinct explanations remain available", () => {
  const text = plain(render(fixture, "Les forces en jeu"));
  assert.equal(
    fixture.family_readouts.reduce(
      (count, family) => count + family.questions.length,
      0,
    ),
    32,
  );
  for (const family of fixture.family_readouts)
    for (const question of family.questions) {
      assert.ok(text.includes(question.question_fr));
      assert.ok(text.includes(question.answer_fr));
    }
  for (const judgment of fixture.six_judgments)
    assert.ok(text.includes(judgment.body));
});

test("public family answers render without relying on omitted question identities", (context) => {
  const errors = context.mock.method(console, "error", () => {});
  const publicState = {
    ...fixture,
    family_readouts: fixture.family_readouts.map((family) => ({
      ...family,
      questions: family.questions.map(({ id: _internalId, ...question }) => question),
    })),
  } as V6EditorialState;
  const text = plain(render(publicState, "Les forces en jeu"));
  for (const family of publicState.family_readouts) for (const question of family.questions) assert.ok(text.includes(question.question_fr));
  assert.equal(errors.mock.calls.length, 0, "No missing-key React diagnostics");
});

test("understanding renders only supplied concepts, examples and lesson answers", () => {
  const text = plain(render(fixture, "Comprendre"));
  const learning = fixture.learning_experience!;
  for (const concept of learning.concepts)
    for (const key of [
      "definition_fr",
      "why_it_matters_fr",
      "current_application_fr",
      "example_fr",
      "misconception_fr",
      "limits_fr",
    ] as const)
      assert.ok(text.includes(concept[key]), key);
  for (const lesson of learning.lessons)
    for (const key of [
      "question_fr",
      "answer_fr",
      "reasoning_fr",
      "limit_fr",
    ] as const)
      assert.ok(text.includes(lesson[key]), key);
  assert.ok(text.includes("Exemple fictif"));
});

test("unavailable parent is explicit and canonical comparison is preserved", () => {
  const text = plain(render(fixture, "Ce qui a changé"));
  assert.ok(
    text.includes(fixture.learning_experience!.changes.comparison_limit_fr),
  );
  assert.ok(text.includes("n’est pas accessible"));
  for (const item of fixture.weekly_bridge?.changes ?? [])
    assert.ok(text.includes(item));
});

test("external text is escaped rather than executed as HTML", () => {
  const state = {
    ...fixture,
    learning_experience: {
      ...fixture.learning_experience!,
      headline: {
        ...fixture.learning_experience!.headline,
        summary_fr: '<script>alert("x")</script>',
      },
    },
  };
  const markup = render(state, "La lecture");
  assert.ok(markup.includes("&lt;script&gt;"));
  assert.doesNotMatch(markup, /<script>/);
});

test("intermediate keeps every before/after item and canonical judgment transition", () => {
  const intermediate = JSON.parse(fs.readFileSync(path.join(root, "tests/fixtures/learning/FIXTURE_learning_intermediate.json"), "utf8")) as V6EditorialState;
  const text = plain(render(intermediate, "Ce qui a changé"));
  for (const item of intermediate.learning_experience!.changes.items) {
    for (const key of ["before_fr", "after_fr", "why_fr", "consequence_fr"] as const) assert.ok(text.includes(item[key]), key);
  }
  for (const item of intermediate.evolution_review!.judgment_changes) {
    assert.ok(text.includes(item.reason_fr));
    assert.ok(text.includes(item.consequence_fr));
  }
  assert.doesNotMatch(text, /MACRO_SUPPORTED_POSITIONING_PARTIAL|CURRENT_EVIDENCE_INSUFFICIENT|FUTURES_NEITHER_CFD_NEITHER/);
  assert.ok(text.includes("Preuves actuelles insuffisantes"));
});
