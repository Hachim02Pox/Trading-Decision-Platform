import assert from "node:assert/strict";
import test from "node:test";
import { getDesignatedKpi } from "../apps/frontend/src/lib/designatedKpi";
import type { CanonicalKpi } from "../packages/contracts/src";

function kpi(id: string, visibility: CanonicalKpi["visibility"], emphasis = false): CanonicalKpi {
  return {
    id,
    familyId: "F2",
    label: id,
    value: 1,
    unit: "%",
    decimals: 1,
    mechanicalGoldRead: "CONTEXTUAL",
    mechanicalEvaluation: { ruleId: id, mode: "CONTEXTUAL", channelId: null, previousValue: null, currentValue: null, delta: null, status: "CONTEXTUAL_BY_DESIGN", read: "CONTEXTUAL" },
    provenance: "observed",
    sourceTag: "BLS",
    observationAt: "2026-09-01T00:00:00.000Z",
    retrievedAt: "2026-09-01T00:00:00.000Z",
    visibility,
    emphasis,
    dataState: "REAL",
    quality: "current",
  };
}

test("family card tint never uses an emphasis KPI hidden from the cockpit face", () => {
  const selected = getDesignatedKpi([kpi("visible-context", "cockpit"), kpi("hidden-adverse", "deep", true)]);
  assert.equal(selected?.id, "visible-context");
});

test("family card tint prefers an emphasized KPI when it is visible", () => {
  const selected = getDesignatedKpi([kpi("visible-context", "cockpit"), kpi("visible-driver", "cockpit", true)]);
  assert.equal(selected?.id, "visible-driver");
});
