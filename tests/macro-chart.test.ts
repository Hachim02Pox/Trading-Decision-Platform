import assert from "node:assert/strict";
import test from "node:test";
import {
  filterMacroChartPoints,
  isMacroChartInstrumentId,
  isMacroChartRange,
  mapFredObservationsToChartPoints,
} from "../apps/backend/src/real/macroChart.ts";
import { parseParYieldHistoryCsv } from "../apps/backend/src/providers/treasury.ts";

test("macro chart route parameters use strict allowlists", () => {
  for (const id of ["DXY", "US2Y", "US10Y", "2S10S", "MOVE", "GVZ", "VIX", "GOLD", "US10YREAL"]) {
    assert.equal(isMacroChartInstrumentId(id), true);
  }
  for (const range of ["1M", "3M", "6M", "1Y"]) assert.equal(isMacroChartRange(range), true);

  assert.equal(isMacroChartInstrumentId("../../secret"), false);
  assert.equal(isMacroChartInstrumentId("XAUUSD"), false);
  assert.equal(isMacroChartInstrumentId("dxy"), false);
  assert.equal(isMacroChartRange("1m"), false);
  assert.equal(isMacroChartRange("ALL"), false);
});

test("Treasury history parser returns only valid 2Y/10Y rows newest first", () => {
  const csv = [
    'Date,"1 Yr","2 Yr","10 Yr"',
    "09/04/2026,4.13,4.37,4.78",
    "09/03/2026,4.11,4.34,4.77",
    "09/02/2026,4.16,,4.79",
  ].join("\n");

  assert.deepEqual(parseParYieldHistoryCsv(csv), [
    { dateIso: "2026-09-04T00:00:00.000Z", y2: 4.37, y10: 4.78 },
    { dateIso: "2026-09-03T00:00:00.000Z", y2: 4.34, y10: 4.77 },
  ]);
});

test("FRED chart mapping supports the terminal's bps convention without mutating history", () => {
  const history = [
    { date: "2026-09-04", value: 0.41 },
    { date: "2026-09-03", value: 0.38 },
  ];
  const before = structuredClone(history);

  assert.deepEqual(mapFredObservationsToChartPoints(history, 100), [
    { time: "2026-09-03", value: 38 },
    { time: "2026-09-04", value: 41 },
  ]);
  assert.deepEqual(history, before);
});

test("range filtering anchors to the latest observation instead of the wall clock", () => {
  const points = [
    { time: "2025-01-01", value: 1 },
    { time: "2025-12-15", value: 2 },
    { time: "2026-01-10", value: 3 },
  ];

  assert.deepEqual(filterMacroChartPoints(points, "1M"), points.slice(1));
});
