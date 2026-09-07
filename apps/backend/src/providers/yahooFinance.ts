import { fetchJson } from "./httpClient";

// Yahoo Finance's public "chart" endpoint (query1.finance.yahoo.com) —
// UNOFFICIAL/undocumented. Yahoo shut down its official public API in 2017;
// this endpoint has no auth/API key and no published contract, so it can
// change or disappear without notice. It is used here for F6's DXY (symbol
// `DX-Y.NYB`, see apps/backend/src/real/f6Currency.ts) — that specific
// symbol's `meta.regularMarketPrice`/`longName`/`shortName` and its
// timestamp/close history were live-verified this pass to return genuine,
// correctly-labeled ("US Dollar Index" / "ICE US Dollar Index") current
// data, cross-checked against an independent source.
//
// `^MOVE` was ALSO tested on this same endpoint this pass. Its price series
// is plausibly genuine (numerically cross-checked against an independent
// source too), BUT its `meta.longName`/`shortName` fields are confirmed
// WRONG — they return an unrelated "Northern Trust iBoxx" product name, a
// real Yahoo data-quality defect specific to that symbol, not a sign of
// hitting the wrong instrument. The canonical F7 MOVE KPIs therefore remain
// deliberately UNAVAILABLE (see apps/backend/src/real/f7Risk.ts). Following
// the product owner's later, explicit chart-workspace request, `^MOVE` is
// allowed only as a terminal-native historical chart and must always carry
// the visible UNOFFICIAL SOURCE warning. It must never feed or upgrade F7.
const BASE_URL = "https://query1.finance.yahoo.com/v8/finance/chart";

export type YahooFinanceErrorCode = "NETWORK_ERROR" | "HTTP_ERROR" | "MALFORMED_RESPONSE" | "NO_DATA";

export class YahooFinanceError extends Error {
  readonly code: YahooFinanceErrorCode;
  constructor(code: YahooFinanceErrorCode, message: string) {
    super(message);
    this.name = "YahooFinanceError";
    this.code = code;
  }
}

export interface YahooChartMeta {
  symbol: string;
  /** Current/latest quoted price — live, not necessarily an EOD close. */
  regularMarketPrice: number;
  /** Epoch seconds of `regularMarketPrice`. */
  regularMarketTime: number;
  longName?: string;
  shortName?: string;
}

export interface YahooChartPoint {
  /** Epoch seconds for this daily bar. */
  timestampSec: number;
  close: number;
}

export interface YahooChartResult {
  meta: YahooChartMeta;
  /** Daily close history, oldest first, with null/gap entries already filtered out. */
  history: YahooChartPoint[];
}

interface RawYahooChartResponse {
  chart?: {
    result?: Array<{
      meta?: {
        symbol?: string;
        regularMarketPrice?: number;
        regularMarketTime?: number;
        longName?: string;
        shortName?: string;
      };
      timestamp?: number[];
      indicators?: {
        quote?: Array<{ close?: Array<number | null> }>;
      };
    }>;
    error?: { code?: string; description?: string } | null;
  };
}

/**
 * Fetches one symbol's chart data (current quote + daily close history)
 * from Yahoo Finance's unofficial public chart endpoint. Throws a specific
 * `YahooFinanceError` on every failure mode — never returns a partial or
 * guessed value — mirroring the `FredApiError` pattern in providers/fred.ts
 * so callers can produce an honest UNAVAILABLE state rather than crashing
 * or fabricating a number.
 */
export async function fetchYahooChart(
  symbol: string,
  range: string = "1mo",
  interval: string = "1d"
): Promise<YahooChartResult> {
  const url = `${BASE_URL}/${encodeURIComponent(symbol)}?range=${range}&interval=${interval}`;

  let res: Awaited<ReturnType<typeof fetchJson<RawYahooChartResponse>>>;
  try {
    // A realistic User-Agent is set defensively — several of this codebase's
    // other unofficial/best-effort adapters (e.g.
    // providers/investingFedRateMonitor.ts) found their target blocks
    // non-browser-like requests; Yahoo's endpoint answered fine without one
    // in this pass's live testing, but there is no published guarantee that
    // stays true, so it costs nothing to set it.
    res = await fetchJson<RawYahooChartResponse>(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; gold-terminal/1.0)" },
    });
  } catch (err) {
    throw new YahooFinanceError(
      "NETWORK_ERROR",
      `network request to Yahoo Finance failed for symbol ${symbol}: ${err instanceof Error ? err.message : String(err)}`
    );
  }

  if (!res.ok) {
    throw new YahooFinanceError("HTTP_ERROR", `Yahoo Finance returned HTTP ${res.status} for symbol ${symbol}`);
  }

  const result = res.body?.chart?.result?.[0];
  const rawMeta = result?.meta;
  if (
    res.body?.chart?.error ||
    !result ||
    !rawMeta ||
    typeof rawMeta.regularMarketPrice !== "number" ||
    typeof rawMeta.regularMarketTime !== "number"
  ) {
    throw new YahooFinanceError("MALFORMED_RESPONSE", `Yahoo Finance response for symbol ${symbol} had no usable meta`);
  }

  const timestamps = result.timestamp ?? [];
  const closes = result.indicators?.quote?.[0]?.close ?? [];
  const history: YahooChartPoint[] = timestamps
    .map((timestampSec, i): YahooChartPoint | null => {
      const close = closes[i];
      return typeof close === "number" ? { timestampSec, close } : null;
    })
    .filter((point): point is YahooChartPoint => point !== null);

  if (history.length === 0) {
    throw new YahooFinanceError("NO_DATA", `Yahoo Finance response for symbol ${symbol} had no usable close history`);
  }

  return {
    meta: {
      symbol: rawMeta.symbol ?? symbol,
      regularMarketPrice: rawMeta.regularMarketPrice,
      regularMarketTime: rawMeta.regularMarketTime,
      longName: rawMeta.longName,
      shortName: rawMeta.shortName,
    },
    history,
  };
}
