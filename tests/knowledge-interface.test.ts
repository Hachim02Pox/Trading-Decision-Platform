import assert from "node:assert/strict";
import test from "node:test";
import { KNOWLEDGE_CHAPTERS } from "../apps/frontend/src/content/knowledge/index.ts";
import { FAMILY_DISPLAY_ORDER, TIER_ORDER } from "../apps/frontend/src/config/familyLayout.ts";
import { FAMILY_KNOWLEDGE_SLUG, getKpiKnowledgeHref } from "../apps/frontend/src/content/knowledge/knowledgeMap.ts";
import { KPI_FIXTURES } from "../apps/backend/src/mock/fixtures.ts";

// Final data-layer audit pass — F12 (Physical/Structural Gold) was restored
// to the product (see docs/MVP_COCKPIT_CONTRACT.md's updated top-of-file
// note). F1 (Gold) does not exist in this product (explicit, standing
// product-owner decision) — there is no "hero" tier any more (F1 was its
// only occupant), so F13 (the "strip" tier) leads FAMILY_DISPLAY_ORDER.
test("F13 (strip) leads the layout; there is no hero tier and F1 does not exist", () => {
  assert.equal(FAMILY_DISPLAY_ORDER[0], "F13");
  assert.equal(new Set(FAMILY_DISPLAY_ORDER).size, 12);
  assert.ok(!FAMILY_DISPLAY_ORDER.includes("F1"));
  assert.equal(TIER_ORDER.strip, 0);
  assert.ok(!("hero" in TIER_ORDER));
});

// F12 is restored to the product's data model (FamilyId,
// FAMILY_KNOWLEDGE_SLUG, etc. all cover it, per the no-silent-omission
// rule), but authoring its dedicated Knowledge chapter is a content task
// deferred beyond this pass (see knowledgeMap.ts's FAMILY_KNOWLEDGE_SLUG
// comments) — `getKnowledgeChapterBySlug` gracefully 404s for it in the
// meantime. This test asserts full bilingual chapter coverage for every
// OTHER family, which is the actual, currently-true invariant.
const FAMILIES_WITHOUT_AUTHORED_CHAPTERS = new Set(["F12"]);

test("Knowledge has one stable bilingual chapter for every family with authored content", () => {
  const expectedFamilyIds = Object.keys(FAMILY_KNOWLEDGE_SLUG).filter(
    (id) => !FAMILIES_WITHOUT_AUTHORED_CHAPTERS.has(id)
  );
  assert.equal(KNOWLEDGE_CHAPTERS.length, expectedFamilyIds.length);
  assert.deepEqual(KNOWLEDGE_CHAPTERS.map((chapter) => chapter.familyId), expectedFamilyIds);
  for (const chapter of KNOWLEDGE_CHAPTERS) {
    assert.ok(chapter.title.EN && chapter.title.FR);
    assert.ok(chapter.description.EN && chapter.description.FR);
    assert.ok(chapter.sections.length > 0);
  }
});

test("important KPI learning links resolve to exact stable sections", () => {
  assert.equal(getKpiKnowledgeHref("f2-10y-real", "F2"), "/knowledge/rates#f2-nominal-real-breakeven");
  assert.equal(getKpiKnowledgeHref("f4-core-cpi-mom", "F4"), "/knowledge/inflation#core-cpi");
  assert.equal(getKpiKnowledgeHref("f2-2s10s", "F2"), "/knowledge/rates#f2-maturities-curve");
  assert.equal(getKpiKnowledgeHref("f11-gvz", "F11"), "/knowledge/gold-options-vol#gvz");
});

test("every terminal KPI deep link targets a section that exists in its family chapter", () => {
  for (const kpi of KPI_FIXTURES) {
    // F1/F12 KPIs have no authored chapter yet (see above) — their href
    // deliberately has no anchor and gracefully 404s, not a bug to assert
    // against here.
    if (FAMILIES_WITHOUT_AUTHORED_CHAPTERS.has(kpi.familyId)) continue;
    const href = getKpiKnowledgeHref(kpi.id, kpi.familyId);
    const [path, anchor] = href.split("#");
    assert.ok(anchor, `${kpi.id} must have a precise Knowledge anchor`);
    const slug = path.split("/").at(-1);
    const chapter = KNOWLEDGE_CHAPTERS.find((item) => FAMILY_KNOWLEDGE_SLUG[item.familyId] === slug);
    assert.ok(chapter, `${kpi.id} chapter must exist`);
    assert.ok(chapter.sections.some((section) => section.id === anchor), `${kpi.id} anchor ${anchor} must exist`);
  }
});
