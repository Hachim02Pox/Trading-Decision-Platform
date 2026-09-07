import type {
  Language,
  MacroChartInstrumentId,
  MacroChartPoint,
  MacroChartRange,
  MacroChartResponse,
  MarketSnapshot,
} from "@gold-terminal/contracts";

export type { MacroChartInstrumentId, MacroChartPoint, MacroChartRange, MacroChartResponse } from "@gold-terminal/contracts";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4001";

export async function fetchMarketSnapshot(language: Language = "EN"): Promise<MarketSnapshot> {
  const res = await fetch(`${BACKEND_URL}/api/market/snapshot?language=${language}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to fetch market snapshot: ${res.status}`);
  return res.json();
}

export async function fetchMacroChart(
  instrumentId: MacroChartInstrumentId,
  range: MacroChartRange,
  signal?: AbortSignal
): Promise<MacroChartResponse> {
  const url = `${BACKEND_URL}/api/charts/macro/${encodeURIComponent(instrumentId)}?range=${range}`;
  const res = await fetch(url, { cache: "no-store", signal });
  if (!res.ok) throw new Error(`Failed to fetch macro chart: ${res.status}`);
  return res.json();
}
