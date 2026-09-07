import type { MacroChartInstrumentId } from "@gold-terminal/contracts";

export type ChartComparisonCategory = "GOLD" | "RATES" | "VOLATILITY";
export type ChartComparisonTone = "gold" | "blue" | "secondary" | "tertiary";

export interface ChartComparisonSeries {
  instrumentId: MacroChartInstrumentId;
  tone: ChartComparisonTone;
  dashed?: boolean;
}

export interface ChartComparisonPreset {
  id: string;
  label: string;
  category: ChartComparisonCategory;
  series: readonly ChartComparisonSeries[];
}

export const CHART_COMPARISON_PRESETS = [
  { id: "gold-dxy", label: "Gold / DXY", category: "GOLD", series: [{ instrumentId: "GOLD", tone: "gold" }, { instrumentId: "DXY", tone: "blue" }] },
  { id: "gold-us2y", label: "Gold / US 2Y", category: "GOLD", series: [{ instrumentId: "GOLD", tone: "gold" }, { instrumentId: "US2Y", tone: "blue" }] },
  { id: "gold-us10y", label: "Gold / US 10Y", category: "GOLD", series: [{ instrumentId: "GOLD", tone: "gold" }, { instrumentId: "US10Y", tone: "blue" }] },
  { id: "gold-us10y-real", label: "Gold / US 10Y real", category: "GOLD", series: [{ instrumentId: "GOLD", tone: "gold" }, { instrumentId: "US10YREAL", tone: "blue" }] },
  { id: "gold-gvz", label: "Gold / GVZ", category: "GOLD", series: [{ instrumentId: "GOLD", tone: "gold" }, { instrumentId: "GVZ", tone: "blue" }] },
  { id: "gold-vix", label: "Gold / VIX", category: "GOLD", series: [{ instrumentId: "GOLD", tone: "gold" }, { instrumentId: "VIX", tone: "blue" }] },
  {
    id: "gold-driver-stack",
    label: "Gold / DXY / US 2Y / US 10Y real",
    category: "GOLD",
    series: [
      { instrumentId: "GOLD", tone: "gold" },
      { instrumentId: "DXY", tone: "blue" },
      { instrumentId: "US2Y", tone: "secondary", dashed: true },
      { instrumentId: "US10YREAL", tone: "tertiary", dashed: true },
    ],
  },
  { id: "rates-2y-10y", label: "US 2Y / US 10Y", category: "RATES", series: [{ instrumentId: "US2Y", tone: "blue" }, { instrumentId: "US10Y", tone: "secondary", dashed: true }] },
  {
    id: "rates-dollar-stack",
    label: "DXY / US 2Y / US 10Y",
    category: "RATES",
    series: [
      { instrumentId: "DXY", tone: "blue" },
      { instrumentId: "US2Y", tone: "secondary", dashed: true },
      { instrumentId: "US10Y", tone: "tertiary", dashed: true },
    ],
  },
  { id: "rates-nominal-real", label: "US 10Y / US 10Y real", category: "RATES", series: [{ instrumentId: "US10Y", tone: "blue" }, { instrumentId: "US10YREAL", tone: "secondary", dashed: true }] },
  {
    id: "vol-stack",
    label: "VIX / GVZ",
    category: "VOLATILITY",
    series: [
      { instrumentId: "VIX", tone: "blue" },
      { instrumentId: "GVZ", tone: "secondary", dashed: true },
    ],
  },
] as const satisfies readonly ChartComparisonPreset[];

export type ChartComparisonPresetId = (typeof CHART_COMPARISON_PRESETS)[number]["id"];

export function getChartComparisonPreset(id: string): ChartComparisonPreset {
  return CHART_COMPARISON_PRESETS.find((preset) => preset.id === id) ?? CHART_COMPARISON_PRESETS[0];
}
