import assert from "node:assert/strict";
import test from "node:test";
import { KPI_FIXTURES } from "../apps/backend/src/mock/fixtures.ts";
import { computeCockpitVisibleKpiIds } from "../apps/backend/src/intelligence/mockInterpretationGenerator.ts";
import { getRuleForKpi, MECHANICAL_RULES } from "../apps/backend/src/intelligence/mechanical/rules.ts";

test("every cockpit-visible KPI id resolves a mechanical rule without throwing", () => {
  const cockpitIds = computeCockpitVisibleKpiIds(KPI_FIXTURES);
  assert.ok(cockpitIds.length > 0, "sanity check: there must be cockpit-visible KPIs to test");
  for (const id of cockpitIds) {
    assert.doesNotThrow(() => getRuleForKpi(id), `getRuleForKpi threw for cockpit-visible id "${id}"`);
  }
});

test("every KPI fixture (every visibility tier, not just cockpit) resolves a mechanical rule", () => {
  for (const fixture of KPI_FIXTURES) {
    assert.doesNotThrow(() => getRuleForKpi(fixture.id), `getRuleForKpi threw for fixture id "${fixture.id}"`);
  }
});

test("getRuleForKpi throws for an id with no registry entry", () => {
  assert.throws(() => getRuleForKpi("definitely-not-a-registered-kpi-id"));
});

test("every registry entry's kpiId key matches its own kpiId field", () => {
  for (const [key, rule] of Object.entries(MECHANICAL_RULES)) {
    assert.equal(rule.kpiId, key);
  }
});

test("every non-CONTEXTUAL rule declares a supportiveDirection", () => {
  for (const rule of Object.values(MECHANICAL_RULES)) {
    if (rule.mode !== "CONTEXTUAL") {
      assert.ok(rule.supportiveDirection === "UP" || rule.supportiveDirection === "DOWN", `rule for "${rule.kpiId}" has mode ${rule.mode} but no supportiveDirection`);
    }
  }
});
