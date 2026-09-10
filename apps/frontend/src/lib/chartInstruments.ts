import type { MacroChartInstrumentId } from "@gold-terminal/contracts";

export interface ChartInstrument {
  id: MacroChartInstrumentId;
  label: string;
  chartKind: "macro";
  tradingViewUrl: string;
}

/** Every solo chart is terminal-native; TradingView opens separately for drawing tools. */
export const MACRO_TERMINAL_CHART_INSTRUMENTS: readonly ChartInstrument[] = [
  { id: "US2Y", label: "US 2Y", chartKind: "macro", tradingViewUrl: "https://www.tradingview.com/symbols/US02Y/" },
  { id: "US10Y", label: "US 10Y", chartKind: "macro", tradingViewUrl: "https://www.tradingview.com/symbols/US10Y/" },
  { id: "2S10S", label: "2s10s", chartKind: "macro", tradingViewUrl: "https://www.tradingview.com/symbols/US10Y-US02Y/" },
  { id: "XAUUSD", label: "XAUUSD", chartKind: "macro", tradingViewUrl: "https://www.tradingview.com/symbols/XAUUSD/?exchange=OANDA" },
  { id: "GLD", label: "GLD", chartKind: "macro", tradingViewUrl: "https://www.tradingview.com/symbols/GLD/?exchange=AMEX" },
  { id: "DXY", label: "DXY", chartKind: "macro", tradingViewUrl: "https://www.tradingview.com/symbols/DXY/?exchange=CAPITALCOM" },
  { id: "GVZ", label: "GVZ", chartKind: "macro", tradingViewUrl: "https://www.tradingview.com/symbols/GVZCLS/?exchange=FRED" },
  { id: "VIX", label: "VIX", chartKind: "macro", tradingViewUrl: "https://www.tradingview.com/symbols/VIXCLS/?exchange=FRED" },
] as const;

export const CHART_INSTRUMENTS = MACRO_TERMINAL_CHART_INSTRUMENTS;
