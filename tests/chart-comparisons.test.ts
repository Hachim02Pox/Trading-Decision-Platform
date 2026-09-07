import assert from "node:assert/strict";
import test from "node:test";
import { CHART_COMPARISON_PRESETS } from "../apps/frontend/src/lib/chartComparisons.ts";
import { normalizeComparisonPoints } from "../apps/frontend/src/lib/chartTransforms.ts";
import { getMacroChartInstrument } from "../apps/backend/src/real/macroChart.ts";

test("comparison presets cover gold, rates, the dollar, and volatility without duplicate ids", () => {
  const ids = CHART_COMPARISON_PRESETS.map(({ id }) => id);
  assert.equal(new Set(ids).size, ids.length);
  assert.equal(ids.length >= 10, true);
  assert.equal(CHART_COMPARISON_PRESETS.every(({ series }) => series.length >= 2 && series.length <= 4), true);
  assert.equal(
    CHART_COMPARISON_PRESETS.every(({ series }) => series.every(({ instrumentId }) => getMacroChartInstrument(instrumentId))),
    true
  );

  const seriesByPreset = new Map(
    CHART_COMPARISON_PRESETS.map((preset) => [
      preset.id,
      preset.series.map(({ instrumentId }) => instrumentId),
    ])
  );
  assert.deepEqual(seriesByPreset.get("gold-dxy"), ["GOLD", "DXY"]);
  assert.deepEqual(seriesByPreset.get("gold-us2y"), ["GOLD", "US2Y"]);
  assert.deepEqual(seriesByPreset.get("gold-us10y-real"), ["GOLD", "US10YREAL"]);
  assert.deepEqual(seriesByPreset.get("rates-2y-10y"), ["US2Y", "US10Y"]);
  assert.deepEqual(seriesByPreset.get("vol-stack"), ["VIX", "GVZ"]);
});

test("comparison-only series are backed by explicit real-data sources", () => {
  const gold = getMacroChartInstrument("GOLD");
  const real10y = getMacroChartInstrument("US10YREAL");

  assert.equal(gold?.yahooSymbol, "GC=F");
  assert.equal(gold?.sourceOfficial, false);
  assert.equal(gold?.unit, "USD/oz");
  assert.equal(real10y?.fredSeriesId, "DFII10");
  assert.equal(real10y?.sourceOfficial, true);
  assert.equal(real10y?.unit, "%");
});

test("normalization rebases to zero percent and never mutates source points", () => {
  const points = [
    { time: "2026-09-01", value: 100 },
    { time: "2026-09-02", value: 105 },
    { time: "2026-09-03", value: 95 },
  ];
  const before = structuredClone(points);

  assert.deepEqual(normalizeComparisonPoints(points), [
    { time: "2026-09-01", rawValue: 100, changePercent: 0 },
    { time: "2026-09-02", rawValue: 105, changePercent: 5 },
    { time: "2026-09-03", rawValue: 95, changePercent: -5 },
  ]);
  assert.deepEqual(points, before);
});

test("normalization refuses a zero baseline instead of fabricating comparable values", () => {
  assert.deepEqual(
    normalizeComparisonPoints([
      { time: "2026-09-01", value: 0 },
      { time: "2026-09-02", value: 1 },
    ]),
    []
  );
  assert.deepEqual(normalizeComparisonPoints([{ time: "2026-09-01", value: 100 }]), []);
});
