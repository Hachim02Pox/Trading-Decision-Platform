import assert from "node:assert/strict";
import test from "node:test";
import type { CanonicalKpi } from "../packages/contracts/src/index";
import { evaluateKpiMechanicalRead } from "../apps/backend/src/intelligence/mechanical/evaluateKpiMechanicalRead.ts";

function kpi(id: string, overrides: Partial<CanonicalKpi> = {}): CanonicalKpi {
  return {
    id,
    familyId: "F2",
    label: id,
    value: 10,
    unit: "%",
    decimals: 2,
    mechanicalGoldRead: "CONTEXTUAL",
    mechanicalEvaluation: { ruleId: id, mode: "CONTEXTUAL", channelId: null, previousValue: null, currentValue: null, delta: null, status: "CONTEXTUAL_BY_DESIGN", read: "CONTEXTUAL" },
    driverSummary: null,
    provenance: "observed",
    quality: "current",
    dataState: "REAL",
    sourceTag: "TEST",
    observationAt: "2026-09-14T00:00:00.000Z",
    retrievedAt: "2026-09-14T00:00:00.000Z",
    visibility: "cockpit",
    previousFetch: { value: 9, unit: "%", observationAt: "2026-09-13T00:00:00.000Z", retrievedAt: "2026-09-13T00:00:00.000Z" },
    ...overrides,
  };
}

// --- OBSERVATION_DELTA: f2-10y-real (adverse -> supportiveDirection DOWN) --

test("f2-10y-real: a rise is ADVERSE, a fall is SUPPORTIVE", () => {
  const rose = evaluateKpiMechanicalRead(kpi("f2-10y-real", { value: 10, previousFetch: { value: 8, unit: "%", observationAt: "x", retrievedAt: "x" } }));
  assert.equal(rose.read, "ADVERSE");
  assert.equal(rose.status, "EVALUATED");

  const fell = evaluateKpiMechanicalRead(kpi("f2-10y-real", { value: 8, previousFetch: { value: 10, unit: "%", observationAt: "x", retrievedAt: "x" } }));
  assert.equal(fell.read, "SUPPORTIVE");
});

test("f2-10y-real: an unchanged value (after rounding) is NO_CHANGE/CONTEXTUAL", () => {
  const result = evaluateKpiMechanicalRead(kpi("f2-10y-real", { value: 1.8421, decimals: 3, previousFetch: { value: 1.8419, unit: "%", observationAt: "x", retrievedAt: "x" } }));
  assert.equal(result.status, "NO_CHANGE");
  assert.equal(result.read, "CONTEXTUAL");
});

test("f2-10y-real: no previous observation yet is INSUFFICIENT_HISTORY/CONTEXTUAL", () => {
  const result = evaluateKpiMechanicalRead(kpi("f2-10y-real", { previousFetch: null }));
  assert.equal(result.status, "INSUFFICIENT_HISTORY");
  assert.equal(result.read, "CONTEXTUAL");
});

test("f2-10y-real: UNAVAILABLE data state resolves UNAVAILABLE/CONTEXTUAL", () => {
  const result = evaluateKpiMechanicalRead(kpi("f2-10y-real", { dataState: "UNAVAILABLE", value: null }));
  assert.equal(result.status, "UNAVAILABLE");
  assert.equal(result.read, "CONTEXTUAL");
});

test("f2-10y-real: a unit change between fetches is NON_COMPARABLE/CONTEXTUAL", () => {
  const result = evaluateKpiMechanicalRead(kpi("f2-10y-real", { value: 10, unit: "%", previousFetch: { value: 8, unit: "bps", observationAt: "x", retrievedAt: "x" } }));
  assert.equal(result.status, "NON_COMPARABLE");
  assert.equal(result.read, "CONTEXTUAL");
});

// --- CONTEXTUAL: 2s10s always CONTEXTUAL regardless of movement -----------

test("f2-2s10s: always CONTEXTUAL, in both directions", () => {
  const rose = evaluateKpiMechanicalRead(kpi("f2-2s10s", { value: 60, previousFetch: { value: 50, unit: "bps", observationAt: "x", retrievedAt: "x" }, unit: "bps" }));
  const fell = evaluateKpiMechanicalRead(kpi("f2-2s10s", { value: 50, previousFetch: { value: 60, unit: "bps", observationAt: "x", retrievedAt: "x" }, unit: "bps" }));
  assert.equal(rose.read, "CONTEXTUAL");
  assert.equal(rose.status, "CONTEXTUAL_BY_DESIGN");
  assert.equal(fell.read, "CONTEXTUAL");
});

test("f4-core-cpi-mom (CPI) is always CONTEXTUAL regardless of value", () => {
  const result = evaluateKpiMechanicalRead(kpi("f4-core-cpi-mom", { value: 5, unit: "%", familyId: "F4", previousFetch: { value: 0.2, unit: "%", observationAt: "x", retrievedAt: "x" } }));
  assert.equal(result.read, "CONTEXTUAL");
  assert.equal(result.status, "CONTEXTUAL_BY_DESIGN");
});

test("f11-gvz is always CONTEXTUAL regardless of value", () => {
  const result = evaluateKpiMechanicalRead(kpi("f11-gvz", { value: 25, familyId: "F11", unit: null, previousFetch: { value: 15, unit: null, observationAt: "x", retrievedAt: "x" } }));
  assert.equal(result.read, "CONTEXTUAL");
});

// --- CURRENT_SIGN: DXY Today % must read its OWN sign, never a delta-of-delta

test("DXY Today %: regression test — reads the sign of the value itself, NOT a comparison to previousFetch", () => {
  // Bug this refactor fixes: a naive re-comparison of +0.5 against a prior
  // +2.0 would read as a FALL (-1.5), which would be flipped by
  // supportiveDirection=DOWN into SUPPORTIVE. The correct CURRENT_SIGN read
  // is the sign of +0.5 alone: USD up -> ADVERSE for Gold.
  const result = evaluateKpiMechanicalRead(
    kpi("f6-dxy-recon-today", { familyId: "F6", value: 0.5, unit: "%", previousFetch: { value: 2.0, unit: "%", observationAt: "x", retrievedAt: "x" } })
  );
  assert.equal(result.mode, "CURRENT_SIGN");
  assert.equal(result.delta, 0.5);
  assert.equal(result.read, "ADVERSE");
});

test("DXY Today %: a negative value (USD falling today) is SUPPORTIVE", () => {
  const result = evaluateKpiMechanicalRead(kpi("f6-dxy-recon-today", { familyId: "F6", value: -0.3, unit: "%" }));
  assert.equal(result.read, "SUPPORTIVE");
});

test("MM WoW Δ: positive is SUPPORTIVE, negative is ADVERSE", () => {
  const positive = evaluateKpiMechanicalRead(kpi("f10-mm-wow-pp", { familyId: "F10", value: 1.2, unit: "pp" }));
  const negative = evaluateKpiMechanicalRead(kpi("f10-mm-wow-pp", { familyId: "F10", value: -1.2, unit: "pp" }));
  assert.equal(positive.read, "SUPPORTIVE");
  assert.equal(negative.read, "ADVERSE");
});

test("MM 156W Percentile: always CONTEXTUAL regardless of extremity (5/50/95)", () => {
  for (const value of [5, 50, 95]) {
    const result = evaluateKpiMechanicalRead(kpi("f10-mm-percentile", { familyId: "F10", value, unit: "pct" }));
    assert.equal(result.read, "CONTEXTUAL");
    assert.equal(result.status, "CONTEXTUAL_BY_DESIGN");
  }
});

test("CURRENT_SIGN: a zero value is NO_CHANGE/CONTEXTUAL", () => {
  const result = evaluateKpiMechanicalRead(kpi("f6-dxy-recon-today", { familyId: "F6", value: 0, unit: "%" }));
  assert.equal(result.status, "NO_CHANGE");
  assert.equal(result.read, "CONTEXTUAL");
});

test("CURRENT_SIGN: UNAVAILABLE resolves UNAVAILABLE/CONTEXTUAL", () => {
  const result = evaluateKpiMechanicalRead(kpi("f6-dxy-recon-today", { familyId: "F6", value: null, dataState: "UNAVAILABLE" }));
  assert.equal(result.status, "UNAVAILABLE");
  assert.equal(result.read, "CONTEXTUAL");
});

test("getRuleForKpi throws for an unregistered KPI id (missing rule is a bug, not a valid state)", () => {
  assert.throws(() => evaluateKpiMechanicalRead(kpi("not-a-real-kpi-id")));
});
