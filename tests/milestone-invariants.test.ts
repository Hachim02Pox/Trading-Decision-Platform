import assert from "node:assert/strict";
import test, { after } from "node:test";
import { KPI_FIXTURES } from "../apps/backend/src/mock/fixtures";
import { FAMILY_LABELS } from "../apps/backend/src/mock/families";
import { buildIntelligenceSnapshot } from "../apps/backend/src/intelligence/snapshotResponse";
import { getMarketSnapshot } from "../apps/backend/src/cache/snapshotCache";
import { getDataMode } from "../apps/backend/src/intelligence/dataMode";
import {
  DISPLAY_RELATIONSHIP_ROW_CLASS_KEY,
  canonicalToDisplayRelationship,
} from "../apps/frontend/src/lib/relationshipColor";
import { en } from "../apps/frontend/src/i18n/en";
import { fr } from "../apps/frontend/src/i18n/fr";
import { getFamilyEducation } from "../apps/frontend/src/content/familyEducation";
import type { KpiInterpretation } from "../packages/contracts/src/index";
import { closePool } from "../apps/backend/src/db/pool";

after(async () => {
  await closePool();
});

// Final data-layer audit pass — F12 (Physical/Structural Gold) was restored
// to the product (see docs/MVP_COCKPIT_CONTRACT.md's updated top-of-file
// note): the product owner's rule is that every canonical value must be
// REAL or explicitly UNAVAILABLE, never silently absent, and silently
// excluding an entire family violated that rule just as much as a
// fabricated number would. F1 (Gold) does not exist in this product — it
// was evaluated and permanently removed by explicit product-owner
// decision, a genuinely different situation from F12's no-free-API gap.
// The product ships 12 families (F2-F13); F12's KPIs are permanently
// UNAVAILABLE (no free API) but the family itself is present, not hidden.
const EXPECTED_FAMILY_IDS = ["F2", "F3", "F4", "F5", "F6", "F7", "F8", "F9", "F10", "F11", "F12", "F13"];

test("all 12 families exist in canonical order, and F1 does not exist", () => {
  assert.deepEqual(Object.keys(FAMILY_LABELS), EXPECTED_FAMILY_IDS);
  assert.equal("F1" in FAMILY_LABELS, false);
});

test("relationship colors map exactly to green, red, and contextual yellow classes", () => {
  assert.deepEqual(DISPLAY_RELATIONSHIP_ROW_CLASS_KEY, {
    SUPPORTIVE: "rowSupport",
    ADVERSE: "rowAdverse",
    CONTEXTUAL: "rowContextual",
  });
  assert.equal(canonicalToDisplayRelationship("support"), "SUPPORTIVE");
  assert.equal(canonicalToDisplayRelationship("adverse"), "ADVERSE");
  assert.equal(canonicalToDisplayRelationship("neutral"), "CONTEXTUAL");
});

test("English and French dictionaries have exact key parity", () => {
  assert.deepEqual(Object.keys(fr).sort(), Object.keys(en).sort());
});

test("family education is genuinely localized for every family", () => {
  for (const familyId of EXPECTED_FAMILY_IDS as Array<keyof typeof FAMILY_LABELS>) {
    assert.notEqual(getFamilyEducation(familyId, "EN").overview, getFamilyEducation(familyId, "FR").overview);
  }
});

test("intelligence snapshot returns cockpit interpretations keyed by KPI id for every cockpit-visible KPI", async () => {
  const snapshot = await getMarketSnapshot("EN");
  const response = await buildIntelligenceSnapshot({
    families: snapshot.families,
    language: "EN",
    dataMode: "DEV_MOCK",
    sessionId: "test-session",
    getInterpretation: async (kpiId) => ({ kpiId } as KpiInterpretation),
  });
  const expected = KPI_FIXTURES.filter((kpi) => kpi.visibility === "cockpit")
    .map((kpi) => kpi.id)
    .sort();
  assert.deepEqual(Object.keys(response.interpretations).sort(), expected);
});

test("REAL mode can never silently resolve as DEV_MOCK", () => {
  const previous = process.env.DATA_MODE;
  process.env.DATA_MODE = "REAL";
  try {
    assert.equal(getDataMode(), "REAL");
  } finally {
    if (previous === undefined) delete process.env.DATA_MODE;
    else process.env.DATA_MODE = previous;
  }
});

test("market snapshot never exposes fixture numbers as market data", async () => {
  const snapshot = await getMarketSnapshot("EN");
  for (const kpi of snapshot.families.flatMap((family) => family.kpis)) {
    assert.notEqual(kpi.dataState, "MOCK", `${kpi.id} must be REAL or explicitly unavailable`);
    if (kpi.dataState === "UNAVAILABLE") assert.equal(kpi.value, null, `${kpi.id} unavailable values must be null`);
  }
});
