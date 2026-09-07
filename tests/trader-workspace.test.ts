import assert from "node:assert/strict";
import test from "node:test";
import {
  CHART_INSTRUMENTS,
  EMBEDDED_TRADINGVIEW_INSTRUMENTS,
  MACRO_TERMINAL_CHART_INSTRUMENTS,
  createInitialChartSelection,
  selectChartInstrument,
} from "../apps/frontend/src/lib/chartInstruments.ts";
import { buildTradingViewAdvancedChartConfig } from "../apps/frontend/src/lib/tradingViewWidgetConfig.ts";
import { calculateRiskPlan, summarizeJournal, type JournalEntry } from "../apps/frontend/src/lib/traderWorkspace.ts";
import { getMacroChartInstrument, mapFredObservationsToChartPoints, mapYahooChartToChartPoints } from "../apps/backend/src/real/macroChart.ts";

test("embedded chart only offers symbols that are usable in the public widget", () => {
  assert.deepEqual(EMBEDDED_TRADINGVIEW_INSTRUMENTS.map(({ id, label }) => ({ id, label })), [
    { id: "OANDA:XAUUSD", label: "XAUUSD" },
    { id: "AMEX:GLD", label: "GLD" },
    { id: "CAPITALCOM:DXY", label: "DXY" },
    { id: "FRED:GVZCLS", label: "GVZ" },
    { id: "CAPITALCOM:VIX", label: "VIX" },
    { id: "COINBASE:BTCUSD", label: "BTCUSD" },
  ]);

  const restrictedSymbols = new Set([
    "TVC:DXY",
    "TVC:US02Y",
    "TVC:US10Y",
    "TVC:US10Y-TVC:US02Y",
    "TVC:MOVE",
    "CBOE:GVZ",
    "TVC:VIX",
  ]);

  assert.equal(CHART_INSTRUMENTS.some(({ id }) => restrictedSymbols.has(id)), false);

  const twoYearCfd = CHART_INSTRUMENTS.find(({ id }) => id === "OANDA:USB02YUSD");
  const gvz = CHART_INSTRUMENTS.find(({ id }) => id === "FRED:GVZCLS");
  assert.equal(twoYearCfd, undefined);
  assert.equal(gvz?.chartKind === "tradingview" ? gvz.intervalMode : undefined, "daily");
});

test("chart workspace exposes macro instruments through terminal-native sourced charts", () => {
  assert.deepEqual(
    MACRO_TERMINAL_CHART_INSTRUMENTS.map(({ id, label }) => ({ id, label })),
    [
      { id: "US2Y", label: "US 2Y" },
      { id: "US10Y", label: "US 10Y" },
      { id: "2S10S", label: "2s10s" },
    ]
  );

  assert.equal(getMacroChartInstrument("DXY")?.sourceKind, "YAHOO");
  assert.equal(getMacroChartInstrument("US2Y")?.sourceKind, "TREASURY");
  assert.equal(getMacroChartInstrument("MOVE")?.sourceKind, "UNAVAILABLE");
  assert.equal(getMacroChartInstrument("MOVE")?.available, false);
  assert.equal(getMacroChartInstrument("MOVE")?.sourceOfficial, false);
  assert.deepEqual(CHART_INSTRUMENTS.map(({ label }) => label), [
    "XAUUSD",
    "GLD",
    "DXY",
    "US 2Y",
    "US 10Y",
    "2s10s",
    "GVZ",
    "VIX",
    "BTCUSD",
  ]);
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

test("embedded chart keeps TradingView symbol changes locked to vetted presets", () => {
  const config = buildTradingViewAdvancedChartConfig({
    symbol: "COINBASE:BTCUSD",
    interval: "15",
    language: "FR",
  });

  assert.equal(config.symbol, "COINBASE:BTCUSD");
  assert.equal(config.interval, "15");
  assert.equal(config.locale, "fr");
  assert.equal(config.allow_symbol_change, false);
});

test("selecting a macro chart keeps the mounted TradingView instrument stable", () => {
  const initial = createInitialChartSelection();
  const us2y = CHART_INSTRUMENTS.find(({ id }) => id === "US2Y");
  const btc = CHART_INSTRUMENTS.find(({ id }) => id === "COINBASE:BTCUSD");
  assert.ok(us2y);
  assert.ok(btc);

  const macroSelection = selectChartInstrument(initial, us2y);
  assert.equal(macroSelection.instrument.id, "US2Y");
  assert.equal(macroSelection.tradingViewInstrument.id, "OANDA:XAUUSD");
  assert.notEqual(macroSelection, initial);

  const tradingViewSelection = selectChartInstrument(macroSelection, btc);
  assert.equal(tradingViewSelection.instrument.id, "COINBASE:BTCUSD");
  assert.equal(tradingViewSelection.tradingViewInstrument.id, "COINBASE:BTCUSD");
});

test("selecting a verified DXY CFD updates the mounted TradingView symbol", () => {
  const initial = createInitialChartSelection();
  const dxy = CHART_INSTRUMENTS.find(({ id }) => id === "CAPITALCOM:DXY");
  assert.ok(dxy);

  const selection = selectChartInstrument(initial, dxy);
  assert.equal(selection.instrument.id, "CAPITALCOM:DXY");
  assert.equal(selection.tradingViewInstrument.id, "CAPITALCOM:DXY");
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
