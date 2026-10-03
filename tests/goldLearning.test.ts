import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  validateGoldEditorialV6,
  projectPublicGoldEditorialV6,
} from "../apps/backend/src/goldMarketState/v6";
const fixture = () =>
  JSON.parse(
    readFileSync(
      "tests/fixtures/learning/FIXTURE_learning_sunday.json",
      "utf8",
    ),
  );
test("rich pinned Brain fixture is admitted and public learning is complete without evidence", () => {
  const d = fixture();
  assert.deepEqual(validateGoldEditorialV6(d), []);
  const p = projectPublicGoldEditorialV6(d) as any;
  assert.equal(p.learning_experience_status, "AVAILABLE");
  assert.equal(
    p.learning_experience.mechanisms.length,
    d.learning_experience.mechanisms.length,
  );
  assert.equal(JSON.stringify(p).includes('"evidence_refs"'), false);
  assert.equal(
    p.learning_experience.synthesis.counter_case_fr,
    d.learning_experience.synthesis.counter_case_fr,
  );
});
test("invalid extension shape and semantic references are rejected", () => {
  const d = fixture();
  d.learning_experience.mechanisms[0].fact_refs = ["orphan"];
  assert.ok(
    validateGoldEditorialV6(d).some((x) => x.includes("unresolved fact")),
  );
  d.learning_experience.headline.extra = "untrusted";
  assert.ok(validateGoldEditorialV6(d).some((x) => x.includes("additional")));
});
test("unknown learning version remains canonical and reports limitation", () => {
  const d = fixture();
  d.learning_experience.version = "2.0";
  assert.deepEqual(validateGoldEditorialV6(d), []);
  const p = projectPublicGoldEditorialV6(d) as any;
  assert.equal(p.learning_experience, undefined);
  assert.equal(p.learning_experience_status, "UNSUPPORTED_VERSION");
  assert.equal(p.title_fr, d.title_fr);
});

test("causal cycles, fact dates, scenario coverage and six-family coverage fail closed", () => {
  for (const mutate of [
    (d: any) => {
      d.learning_experience.causal_links[0].to_id =
        d.learning_experience.causal_links[0].from_id;
    },
    (d: any) => {
      d.learning_experience.facts[0].measurement_as_of = "2099-01-01";
    },
    (d: any) => {
      d.learning_experience.scenario_explanations.pop();
    },
    (d: any) => {
      d.learning_experience.synthesis.pieces[1].family_id =
        d.learning_experience.synthesis.pieces[0].family_id;
    },
    (d: any) => {
      d.learning_experience.changes.baseline_run_id = "different-parent";
    },
    (d: any) => {
      d.learning_experience.mechanisms[0].summary_fr = "https://audit.example";
    },
  ]) {
    const d = fixture();
    mutate(d);
    assert.notEqual(validateGoldEditorialV6(d).length, 0);
  }
});
test("Markdown and SHA remain exact and instrument filters cannot be reinterpreted", () => {
  const d = fixture();
  d.content_preview.markdown += "unexpected";
  assert.ok(validateGoldEditorialV6(d).some((x) => x.includes("parity")));
  const changed = fixture();
  changed.decision_panel.instruments[0].eligible_direction =
    changed.decision_panel.instruments[0].eligible_direction === "SHORT"
      ? "LONG"
      : "SHORT";
  assert.ok(
    validateGoldEditorialV6(changed).some((x) =>
      x.includes("fundamental gate"),
    ),
  );
});
test("intermediate learning is admitted with its immediate-parent comparison", () => {
  const d = JSON.parse(
    readFileSync(
      "tests/fixtures/learning/FIXTURE_learning_intermediate.json",
      "utf8",
    ),
  );
  assert.deepEqual(validateGoldEditorialV6(d), []);
  assert.equal(
    (projectPublicGoldEditorialV6(d) as any).learning_experience.changes
      .baseline_run_id,
    d.meta.parent_run_id,
  );
});

test("embedded schemas remain byte-identical to the pinned repository schemas", () => {
  for (const name of [
    "gold_editorial.schema.json",
    "gold_learning_experience.schema.json",
  ]) {
    assert.equal(
      readFileSync(`schema/${name}`, "utf8"),
      readFileSync(`apps/backend/src/goldMarketState/brain/${name}`, "utf8"),
    );
  }
});

test("public learning allowlist never leaks audit extensions or modifies stored JSON", () => {
 const d = fixture();
 d.learning_experience.headline.audit_url = "https://secret.example";
 d.learning_experience.mechanisms[0].examples[0].drive_id = "DRIVE_SENTINEL";
 d.learning_experience.concepts[0].request_log = "REQUEST_SENTINEL";
 const before = JSON.stringify(d);
 const publicRead = projectPublicGoldEditorialV6(d);
 const serialized = JSON.stringify(publicRead);
 assert.doesNotMatch(serialized, /secret.example|DRIVE_SENTINEL|REQUEST_SENTINEL|evidence_refs/);
 assert.equal(JSON.stringify(d), before);
});

test("unknown learning version still verifies the exact UTF-8 Markdown digest", () => {
 const d = fixture(); d.learning_experience.version = "2.0";
 d.content_preview.sha256 = "0".repeat(64);
 assert.ok(validateGoldEditorialV6(d).some(x => x.includes("Markdown SHA-256")));
});
