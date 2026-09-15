import assert from "node:assert/strict";
import test from "node:test";
import {
  CHART_INSTRUMENTS,
  MACRO_TERMINAL_CHART_INSTRUMENTS,
} from "../apps/frontend/src/lib/chartInstruments.ts";
import { calculateRiskPlan, summarizeJournal, type JournalEntry } from "../apps/frontend/src/lib/traderWorkspace.ts";
import { getMacroChartInstrument, mapFredObservationsToChartPoints, mapYahooChartToChartPoints } from "../apps/backend/src/real/macroChart.ts";

test("chart workspace exposes macro instruments through terminal-native sourced charts", () => {
  assert.deepEqual(
    MACRO_TERMINAL_CHART_INSTRUMENTS.map(({ id, label }) => ({ id, label })),
    [
      { id: "US2Y", label: "US 2Y" },
      { id: "US10Y", label: "US 10Y" },
      { id: "2S10S", label: "2s10s" },
      { id: "XAUUSD", label: "XAUUSD" },
      { id: "GLD", label: "GLD" },
      { id: "DXY", label: "DXY" },
      { id: "MOVE", label: "MOVE" },
      { id: "GVZ", label: "GVZ" },
      { id: "VIX", label: "VIX" },
    ]
  );

  assert.equal(getMacroChartInstrument("DXY")?.sourceKind, "YAHOO");
  assert.equal(getMacroChartInstrument("US2Y")?.sourceKind, "TREASURY");
  assert.equal(getMacroChartInstrument("MOVE")?.sourceKind, "YAHOO");
  assert.equal(getMacroChartInstrument("MOVE")?.yahooSymbol, "^MOVE");
  assert.equal(getMacroChartInstrument("MOVE")?.available, true);
  assert.equal(getMacroChartInstrument("MOVE")?.sourceOfficial, false);
  assert.equal(CHART_INSTRUMENTS.every(({ chartKind }) => chartKind === "macro"), true);
  assert.deepEqual(CHART_INSTRUMENTS.map(({ label }) => label), [
    "US 2Y",
    "US 10Y",
    "2s10s",
    "XAUUSD",
    "GLD",
    "DXY",
    "MOVE",
    "GVZ",
    "VIX",
  ]);
  assert.deepEqual(
    CHART_INSTRUMENTS.filter(({ id }) => id === "GVZ" || id === "VIX").map(({ id, tradingViewUrl }) => ({ id, tradingViewUrl })),
    [
      { id: "GVZ", tradingViewUrl: "https://www.tradingview.com/symbols/GVZCLS/?exchange=FRED" },
      { id: "VIX", tradingViewUrl: "https://www.tradingview.com/symbols/VIXCLS/?exchange=FRED" },
    ]
  );
});

test("macro chart mapping preserves chronological order and never mutates provider history", () => {
  const fredHistory = [
    { date: "2026-09-04", value: 4.12 },
    { date: "2026-09-03", value: 4.09 },
  ];
  const beforeFred = structuredClone(fredHistory);
  assert.deepEqual(mapFredObservationsToChartPoints(fredHistory), [
    { time: "2026-09-03", value: 4.09 },
    { time: "2026-09-04", value: 4.12 },
  ]);
  assert.deepEqual(fredHistory, beforeFred);

  const yahooChart = {
    meta: { symbol: "DX-Y.NYB", regularMarketPrice: 98.71, regularMarketTime: 1788540000 },
    history: [
      { timestampSec: 1788379200, close: 98.2 },
      { timestampSec: 1788465600, close: 98.4 },
    ],
  };
  const beforeYahoo = structuredClone(yahooChart);
  assert.deepEqual(mapYahooChartToChartPoints(yahooChart), [
    { time: "2026-09-02", value: 98.2 },
    { time: "2026-09-03", value: 98.4 },
  ]);
  assert.deepEqual(yahooChart, beforeYahoo);
});


test("risk plan derives explicit account risk, stop distance, and approximate units", () => {
  assert.deepEqual(calculateRiskPlan({ accountBalance: 10_000, riskPercent: 0.5, entryPrice: 2_500, stopPrice: 2_490 }), {
    riskAmount: 50,
    stopDistance: 10,
    approximateUnits: 5,
  });
});

test("risk plan rejects missing, negative, zero-distance, and excessive-risk inputs", () => {
  assert.equal(calculateRiskPlan({ accountBalance: 0, riskPercent: 1, entryPrice: 2_500, stopPrice: 2_490 }), null);
  assert.equal(calculateRiskPlan({ accountBalance: 10_000, riskPercent: 0, entryPrice: 2_500, stopPrice: 2_490 }), null);
  assert.equal(calculateRiskPlan({ accountBalance: 10_000, riskPercent: 101, entryPrice: 2_500, stopPrice: 2_490 }), null);
  assert.equal(calculateRiskPlan({ accountBalance: 10_000, riskPercent: 1, entryPrice: 2_500, stopPrice: 2_500 }), null);
});

test("journal summary uses closed trades only and never fabricates missing outcomes", () => {
  const entries: JournalEntry[] = [
    { id: "1", createdAt: "2026-09-01T00:00:00.000Z", tradedAt: "2026-09-01", instrument: "XAUUSD", direction: "LONG", setup: "Breakout", thesis: "A", invalidation: "B", outcomeR: 2, followedPlan: true, notes: "" },
    { id: "2", createdAt: "2026-09-02T00:00:00.000Z", tradedAt: "2026-09-02", instrument: "XAUUSD", direction: "SHORT", setup: "Rejection", thesis: "A", invalidation: "B", outcomeR: -1, followedPlan: false, notes: "" },
    { id: "3", createdAt: "2026-09-03T00:00:00.000Z", tradedAt: "2026-09-03", instrument: "XAUUSD", direction: "NO_TRADE", setup: "Skipped", thesis: "A", invalidation: "B", outcomeR: null, followedPlan: true, notes: "" },
  ];

  assert.deepEqual(summarizeJournal(entries), {
    totalEntries: 3,
    closedTrades: 2,
    winRatePercent: 50,
    totalR: 1,
    averageR: 0.5,
    planAdherencePercent: 66.67,
  });
});

test("empty journal summary remains honest", () => {
  assert.deepEqual(summarizeJournal([]), {
    totalEntries: 0,
    closedTrades: 0,
    winRatePercent: null,
    totalR: null,
    averageR: null,
    planAdherencePercent: null,
  });
});
