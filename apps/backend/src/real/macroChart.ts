import type { MarketDataState, Provenance, UnavailableReason } from "@gold-terminal/contracts";
import { fetchLatestObservations, FredApiError, type FredObservation } from "../providers/fred";
import { fetchParYieldHistory, type ParYieldHistoryPoint } from "../providers/treasury";
import { fetchYahooChart, YahooFinanceError, type YahooChartResult } from "../providers/yahooFinance";
import { fetchGldHistoricalArchive, parseGldWorkbook, type GldDailyRow } from "../providers/spdrGld";
import { cached } from "./cache";

export const MACRO_CHART_INSTRUMENT_IDS = ["DXY", "US2Y", "US10Y", "2S10S", "MOVE", "GVZ", "VIX", "GOLD", "US10YREAL", "XAUUSD", "GLD"] as const;
export const MACRO_CHART_RANGES = ["1M", "3M", "6M", "1Y"] as const;

export type MacroChartInstrumentId = (typeof MACRO_CHART_INSTRUMENT_IDS)[number];
export type MacroChartRange = (typeof MACRO_CHART_RANGES)[number];
export type MacroChartSourceKind = "FRED" | "YAHOO" | "SPDR" | "TREASURY" | "UNAVAILABLE";

export interface MacroChartInstrument {
  id: MacroChartInstrumentId;
  label: string;
  unit: "%" | "bps" | "index" | "USD/oz" | "USD/share";
  decimals: number;
  sourceKind: MacroChartSourceKind;
  sourceTag: string;
  sourceUrl: string;
  sourceOfficial: boolean;
  available: boolean;
  provenance: Provenance;
  fredSeriesId?: string;
  yahooSymbol?: string;
  fredValueMultiplier?: number;
  treasuryField?: "y2" | "y10";
}

export interface MacroChartPoint {
  time: string;
  value: number;
}

export interface MacroChartResponse {
  status: "OK" | "UNAVAILABLE";
  instrument: MacroChartInstrument;
  range: MacroChartRange;
  points: MacroChartPoint[];
  generatedAt: string;
  observationAt: string | null;
  retrievedAt: string | null;
  dataState: Extract<MarketDataState, "REAL" | "UNAVAILABLE">;
  unavailableReason?: UnavailableReason;
  message: string | null;
}

const SOURCE_TTL_MS: Record<MacroChartSourceKind, number> = {
  // These sources publish daily data, but a short cache makes a newly-published
  // official observation visible promptly without pretending it is intraday.
  FRED: 15 * 60_000,
  TREASURY: 15 * 60_000,
  // Yahoo is an unofficial daily-history fallback, so keep its cache short
  // while never presenting the resulting daily bars as a tick feed.
  YAHOO: 15 * 60_000,
  SPDR: 15 * 60_000,
  UNAVAILABLE: 0,
};
const FRED_HISTORY_LIMIT = 320;
const RANGE_DAYS: Record<MacroChartRange, number> = { "1M": 31, "3M": 93, "6M": 186, "1Y": 370 };

export const MACRO_CHART_INSTRUMENTS: readonly MacroChartInstrument[] = [
  {
    id: "XAUUSD",
    label: "XAUUSD",
    unit: "USD/oz",
    decimals: 2,
    sourceKind: "YAHOO",
    sourceTag: "YAHOO_FINANCE_UNOFFICIAL",
    sourceUrl: "https://finance.yahoo.com/quote/XAUUSD%3DX/",
    sourceOfficial: false,
    available: true,
    provenance: "observed",
    yahooSymbol: "XAUUSD=X",
  },
  {
    id: "GLD",
    label: "GLD",
    unit: "USD/share",
    decimals: 2,
    sourceKind: "SPDR",
    sourceTag: "SPDR_GLD",
    sourceUrl: "https://www.spdrgoldshares.com/usa/historical-data/",
    sourceOfficial: true,
    available: true,
    provenance: "observed",
  },
  {
    id: "DXY",
    label: "DXY",
    unit: "index",
    decimals: 2,
    sourceKind: "YAHOO",
    sourceTag: "YAHOO_FINANCE_UNOFFICIAL",
    sourceUrl: "https://finance.yahoo.com/quote/DX-Y.NYB/",
    sourceOfficial: false,
    available: true,
    provenance: "observed",
    yahooSymbol: "DX-Y.NYB",
  },
  {
    id: "US2Y",
    label: "US 2Y",
    unit: "%",
    decimals: 3,
    sourceKind: "TREASURY",
    sourceTag: "US_TREASURY",
    sourceUrl: "https://home.treasury.gov/resource-center/data-chart-center/interest-rates/TextView?type=daily_treasury_yield_curve",
    sourceOfficial: true,
    available: true,
    provenance: "observed",
    treasuryField: "y2",
  },
  {
    id: "US10Y",
    label: "US 10Y",
    unit: "%",
    decimals: 3,
    sourceKind: "TREASURY",
    sourceTag: "US_TREASURY",
    sourceUrl: "https://home.treasury.gov/resource-center/data-chart-center/interest-rates/TextView?type=daily_treasury_yield_curve",
    sourceOfficial: true,
    available: true,
    provenance: "observed",
    treasuryField: "y10",
  },
  {
    id: "2S10S",
    label: "2s10s",
    unit: "bps",
    decimals: 0,
    sourceKind: "FRED",
    sourceTag: "FRED",
    sourceUrl: "https://fred.stlouisfed.org/series/T10Y2Y",
    sourceOfficial: true,
    available: true,
    provenance: "observed",
    fredSeriesId: "T10Y2Y",
    fredValueMultiplier: 100,
  },
  {
    id: "MOVE",
    label: "MOVE",
    unit: "index",
    decimals: 2,
    // Yahoo identifies the requested `^MOVE` symbol correctly and returns a
    // continuous daily series, but currently attaches an incorrect display
    // name in its metadata. This is therefore a chart-only, unofficial
    // source: it is deliberately not used to turn the F7 MOVE KPI into a
    // verified REAL cockpit observation.
    sourceKind: "YAHOO",
    sourceTag: "YAHOO_FINANCE_UNOFFICIAL",
    sourceUrl: "https://www.ice.com/market-data/indices/fixed-income-indices/ice-bofaml-move-index",
    sourceOfficial: false,
    available: true,
    provenance: "observed",
    yahooSymbol: "^MOVE",
  },
  {
    id: "GVZ",
    label: "GVZ",
    unit: "index",
    decimals: 2,
    sourceKind: "FRED",
    sourceTag: "FRED",
    sourceUrl: "https://fred.stlouisfed.org/series/GVZCLS",
    sourceOfficial: true,
    available: true,
    provenance: "observed",
    fredSeriesId: "GVZCLS",
  },
  {
    id: "VIX",
    label: "VIX",
    unit: "index",
    decimals: 2,
    sourceKind: "FRED",
    sourceTag: "FRED",
    sourceUrl: "https://fred.stlouisfed.org/series/VIXCLS",
    sourceOfficial: true,
    available: true,
    provenance: "observed",
    fredSeriesId: "VIXCLS",
  },
  {
    id: "GOLD",
    label: "Gold futures",
    unit: "USD/oz",
    decimals: 2,
    sourceKind: "YAHOO",
    sourceTag: "YAHOO_FINANCE_UNOFFICIAL",
    sourceUrl: "https://finance.yahoo.com/quote/GC%3DF/",
    sourceOfficial: false,
    available: true,
    provenance: "observed",
    yahooSymbol: "GC=F",
  },
  {
    id: "US10YREAL",
    label: "US 10Y real",
    unit: "%",
    decimals: 3,
    sourceKind: "FRED",
    sourceTag: "FRED",
    sourceUrl: "https://fred.stlouisfed.org/series/DFII10",
    sourceOfficial: true,
    available: true,
    provenance: "observed",
    fredSeriesId: "DFII10",
  },
] as const;

export function isMacroChartInstrumentId(value: unknown): value is MacroChartInstrumentId {
  return typeof value === "string" && (MACRO_CHART_INSTRUMENT_IDS as readonly string[]).includes(value);
}

export function isMacroChartRange(value: unknown): value is MacroChartRange {
  return typeof value === "string" && (MACRO_CHART_RANGES as readonly string[]).includes(value);
}

export function getMacroChartInstrument(id: string): MacroChartInstrument | undefined {
  return MACRO_CHART_INSTRUMENTS.find((instrument) => instrument.id === id.toUpperCase());
}

export function mapFredObservationsToChartPoints(
  history: readonly FredObservation[],
  multiplier = 1
): MacroChartPoint[] {
  return [...history]
    .reverse()
    .map((observation) => ({ time: observation.date, value: observation.value * multiplier }));
}

export function mapYahooChartToChartPoints(chart: YahooChartResult): MacroChartPoint[] {
  return chart.history.map((point) => ({
    time: new Date(point.timestampSec * 1000).toISOString().slice(0, 10),
    value: point.close,
  }));
}

function mapTreasuryHistoryToChartPoints(
  history: readonly ParYieldHistoryPoint[],
  field: "y2" | "y10"
): MacroChartPoint[] {
  return [...history]
    .reverse()
    .map((point) => ({ time: point.dateIso.slice(0, 10), value: point[field] }));
}

function mapGldHistoryToChartPoints(rows: readonly GldDailyRow[]): MacroChartPoint[] {
  return rows.flatMap((row) => typeof row.closingPrice === "number" ? [{ time: row.dateIso.slice(0, 10), value: row.closingPrice }] : []);
}

export function filterMacroChartPoints(
  points: readonly MacroChartPoint[],
  range: MacroChartRange
): MacroChartPoint[] {
  const latest = points[points.length - 1];
  if (!latest) return [];
  const latestMs = Date.parse(`${latest.time}T00:00:00Z`);
  const cutoffMs = latestMs - RANGE_DAYS[range] * 24 * 60 * 60_000;
  return points.filter((point) => Date.parse(`${point.time}T00:00:00Z`) >= cutoffMs);
}

function unavailableResponse(
  instrument: MacroChartInstrument,
  range: MacroChartRange,
  message: string
): MacroChartResponse {
  return {
    status: "UNAVAILABLE",
    instrument,
    range,
    points: [],
    generatedAt: new Date().toISOString(),
    observationAt: null,
    retrievedAt: null,
    dataState: "UNAVAILABLE",
    unavailableReason: "FETCH_FAILED",
    message,
  };
}

function okResponse(
  instrument: MacroChartInstrument,
  range: MacroChartRange,
  allPoints: readonly MacroChartPoint[],
  fetchedAtMs: number,
  observationAt?: string
): MacroChartResponse {
  const points = filterMacroChartPoints(allPoints, range);
  const latest = points[points.length - 1];
  return {
    status: latest ? "OK" : "UNAVAILABLE",
    instrument,
    range,
    points,
    generatedAt: new Date().toISOString(),
    observationAt: latest ? (observationAt ?? `${latest.time}T00:00:00.000Z`) : null,
    retrievedAt: latest ? new Date(fetchedAtMs).toISOString() : null,
    dataState: latest ? "REAL" : "UNAVAILABLE",
    unavailableReason: latest ? undefined : "FETCH_FAILED",
    message: latest ? null : "No usable observations were returned by the configured source.",
  };
}

export async function buildMacroChartResponse(
  id: MacroChartInstrumentId,
  range: MacroChartRange
): Promise<MacroChartResponse> {
  const instrument = getMacroChartInstrument(id)!;

  if (!instrument.available || instrument.sourceKind === "UNAVAILABLE") {
    return unavailableResponse(
      instrument,
      range,
      "No verified free historical source is configured for this instrument."
    );
  }

  if (instrument.sourceKind === "FRED" && instrument.fredSeriesId) {
    try {
      const { value, fetchedAtMs } = await cached(`macro-chart:fred:${instrument.fredSeriesId}`, SOURCE_TTL_MS.FRED, () =>
        fetchLatestObservations(instrument.fredSeriesId!, FRED_HISTORY_LIMIT)
      );
      return okResponse(
        instrument,
        range,
        mapFredObservationsToChartPoints(value, instrument.fredValueMultiplier),
        fetchedAtMs
      );
    } catch (error) {
      const code = error instanceof FredApiError ? error.code : "FETCH_FAILED";
      console.error(`[macro-chart] FRED ${instrument.id} failed: ${code}`);
      return unavailableResponse(instrument, range, "The historical series is temporarily unavailable from FRED.");
    }
  }

  if (instrument.sourceKind === "TREASURY" && instrument.treasuryField) {
    try {
      const { value, fetchedAtMs } = await cached("macro-chart:treasury:par-yield", SOURCE_TTL_MS.TREASURY, fetchParYieldHistory);
      return okResponse(instrument, range, mapTreasuryHistoryToChartPoints(value, instrument.treasuryField), fetchedAtMs);
    } catch (error) {
      console.error(`[macro-chart] Treasury ${instrument.id} failed: ${error instanceof Error ? error.name : "FETCH_FAILED"}`);
      return unavailableResponse(instrument, range, "The historical yield series is temporarily unavailable from the U.S. Treasury.");
    }
  }

  if (instrument.sourceKind === "SPDR") {
    try {
      const { value, fetchedAtMs } = await cached("macro-chart:spdr:gld", SOURCE_TTL_MS.SPDR, async () => {
        const rows = await parseGldWorkbook(await fetchGldHistoricalArchive());
        if (!rows) throw new Error("SPDR GLD historical archive did not match its expected format");
        return rows;
      });
      return okResponse(instrument, range, mapGldHistoryToChartPoints(value), fetchedAtMs);
    } catch (error) {
      console.error(`[macro-chart] SPDR ${instrument.id} failed: ${error instanceof Error ? error.name : "FETCH_FAILED"}`);
      return unavailableResponse(instrument, range, "The historical series is temporarily unavailable from SPDR.");
    }
  }

  if (instrument.sourceKind === "YAHOO" && instrument.yahooSymbol) {
    try {
      const { value, fetchedAtMs } = await cached(`macro-chart:yahoo:${instrument.yahooSymbol}`, SOURCE_TTL_MS.YAHOO, () =>
        fetchYahooChart(instrument.yahooSymbol!, "1y", "1d")
      );
      if (value.meta.symbol !== instrument.yahooSymbol) {
        console.error(`[macro-chart] Yahoo symbol mismatch for ${instrument.id}`);
        return unavailableResponse(instrument, range, "The historical series failed symbol validation.");
      }
      return okResponse(
        instrument,
        range,
        mapYahooChartToChartPoints(value),
        fetchedAtMs,
        new Date(value.meta.regularMarketTime * 1000).toISOString()
      );
    } catch (error) {
      const code = error instanceof YahooFinanceError ? error.code : "FETCH_FAILED";
      console.error(`[macro-chart] Yahoo ${instrument.id} failed: ${code}`);
      return unavailableResponse(instrument, range, "The historical series is temporarily unavailable from Yahoo Finance.");
    }
  }

  return unavailableResponse(instrument, range, "No historical source is configured for this instrument.");
}
