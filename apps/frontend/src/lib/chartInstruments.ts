export type ChartInstrument =
  | {
      id: string;
      label: string;
      chartKind: "tradingview";
      intervalMode: "intraday" | "daily";
    }
  | {
      id: "US2Y" | "US10Y" | "2S10S";
      label: string;
      chartKind: "macro";
    };

/** Presets confirmed usable in TradingView's public Advanced Chart widget. */
export const EMBEDDED_TRADINGVIEW_INSTRUMENTS = [
  { id: "OANDA:XAUUSD", label: "XAUUSD", intervalMode: "intraday" },
  { id: "AMEX:GLD", label: "GLD", intervalMode: "intraday" },
  { id: "CAPITALCOM:DXY", label: "DXY", intervalMode: "intraday" },
  { id: "FRED:GVZCLS", label: "GVZ", intervalMode: "daily" },
  { id: "FRED:VIXCLS", label: "VIX", intervalMode: "daily" },
  { id: "COINBASE:BTCUSD", label: "BTCUSD", intervalMode: "intraday" },
] as const;

/** Macro charts rendered inside the terminal from backend-sourced series. */
export const MACRO_TERMINAL_CHART_INSTRUMENTS = [
  { id: "US2Y", label: "US 2Y" },
  { id: "US10Y", label: "US 10Y" },
  { id: "2S10S", label: "2s10s" },
] as const;

export const CHART_INSTRUMENTS: readonly ChartInstrument[] = [
  ...EMBEDDED_TRADINGVIEW_INSTRUMENTS.slice(0, 3).map((instrument) => ({ ...instrument, chartKind: "tradingview" as const })),
  ...MACRO_TERMINAL_CHART_INSTRUMENTS.map((instrument) => ({ ...instrument, chartKind: "macro" as const })),
  ...EMBEDDED_TRADINGVIEW_INSTRUMENTS.slice(3).map((instrument) => ({ ...instrument, chartKind: "tradingview" as const })),
];

export type TradingViewChartInstrument = Extract<ChartInstrument, { chartKind: "tradingview" }>;

export interface ChartSelection {
  instrument: ChartInstrument;
  tradingViewInstrument: TradingViewChartInstrument;
}

export function createInitialChartSelection(): ChartSelection {
  const instrument = CHART_INSTRUMENTS[0];
  if (!instrument || instrument.chartKind !== "tradingview") {
    throw new Error("The chart workspace requires a TradingView instrument as its initial preset.");
  }
  return { instrument, tradingViewInstrument: instrument };
}

/** Keep the external widget mounted while terminal-native macro charts are selected. */
export function selectChartInstrument(current: ChartSelection, instrument: ChartInstrument): ChartSelection {
  return {
    instrument,
    tradingViewInstrument: instrument.chartKind === "tradingview" ? instrument : current.tradingViewInstrument,
  };
}
