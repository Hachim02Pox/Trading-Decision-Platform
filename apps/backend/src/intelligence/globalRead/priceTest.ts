import type { GlobalReadPriceTest, GlobalReadThesis } from "@gold-terminal/contracts/dist/globalRead";
import { fetchYahooChart, type YahooChartPoint } from "../../providers/yahooFinance";
import type { GlobalReadMethod } from "./method";

function inferredBarSeconds(bars: readonly YahooChartPoint[]): number {
  const ordered = [...bars].sort((a, b) => a.timestampSec - b.timestampSec);
  const deltas = ordered.slice(1).map((bar, index) => bar.timestampSec - ordered[index]!.timestampSec).filter((delta) => delta > 0);
  return deltas.length ? Math.min(...deltas) : 60;
}

function adaptiveMaterialityPct(bars: readonly YahooChartPoint[], eventSec: number, method: GlobalReadMethod): number | null {
  if (!method.adaptiveLookbackSessions || !method.adaptivePercentile || !method.reactionWindowSeconds) return null;
  const days = new Map<string, YahooChartPoint[]>();
  for (const bar of bars.filter((bar) => bar.timestampSec < eventSec && bar.close > 0)) {
    const key = new Date(bar.timestampSec * 1000).toISOString().slice(0, 10);
    days.set(key, [...(days.get(key) ?? []), bar]);
  }
  const samples = [...days.entries()].sort(([a], [b]) => a.localeCompare(b)).slice(-method.adaptiveLookbackSessions).flatMap(([, session]) => {
    const ordered = [...session].sort((a, b) => a.timestampSec - b.timestampSec);
    return ordered.flatMap((from) => {
      const to = ordered.find((bar) => bar.timestampSec >= from.timestampSec + method.reactionWindowSeconds!);
      return to ? [Math.abs((to.close / from.close - 1) * 100)] : [];
    });
  }).filter(Number.isFinite).sort((a, b) => a - b);
  if (!samples.length) return null;
  return samples[Math.ceil((method.adaptivePercentile / 100) * samples.length) - 1] ?? null;
}

export function testPriceResponse(bars: readonly YahooChartPoint[], catalystAt: string | null, thesis: GlobalReadThesis, method: GlobalReadMethod, now: string): GlobalReadPriceTest {
  const base: GlobalReadPriceTest = { state: "INCONCLUSIVE", reason: "UNDEFINED execution reference, event, reaction window, materiality or bar-distance policy.", reference: method.referenceSymbol, from: null, to: null, change: null,
    sourceUrl: method.referenceSymbol ? `https://finance.yahoo.com/quote/${encodeURIComponent(method.referenceSymbol)}/` : null };
  if (!method.referenceSymbol || !method.referenceSourceAccepted || !catalystAt || method.reactionWindowSeconds === null || method.reactionWindowSeconds <= 0 || method.maxBarDistanceSeconds === null || thesis === "UNCLEAR") return base;
  const event = Date.parse(catalystAt) / 1000;
  const target = event + method.reactionWindowSeconds;
  if (!Number.isFinite(event) || target > Date.parse(now) / 1000) return { ...base, reason: "Reaction window has not completed or catalyst timestamp is invalid." };
  const barSeconds = inferredBarSeconds(bars);
  const closedBars = bars.filter((b) => Number.isFinite(b.close) && b.close > 0 && Number.isFinite(b.timestampSec) && b.timestampSec + barSeconds <= Date.parse(now) / 1000);
  const nearestClosed = (time: number) => [...closedBars].filter((b) => b.timestampSec + barSeconds <= time && time - (b.timestampSec + barSeconds) <= method.maxBarDistanceSeconds!).sort((a, b) => b.timestampSec - a.timestampSec)[0];
  const before = nearestClosed(event), after = nearestClosed(target);
  if (!before || !after || before.timestampSec >= after.timestampSec) return { ...base, reason: "No comparable completed 1-minute bars straddle this catalyst within the configured distance. Market closure/gaps are not flat confirmation." };
  const threshold = method.materialityPct && method.materialityPct > 0 ? method.materialityPct : adaptiveMaterialityPct(bars, event, method);
  if (threshold === null || threshold <= 0) return { ...base, reason: "No fixed materiality or completed adaptive p80 reference distribution is available." };
  const change = (after.close / before.close - 1) * 100;
  const aligned = thesis === "GOLD_SUPPORTIVE" ? change : -change;
  return { ...base, state: aligned >= threshold ? "CONFIRMS" : aligned <= -threshold ? "CONTRADICTS" : "FAILS_TO_CONFIRM",
    reason: `Configured event-window observation with ${method.materialityPct ? "fixed" : "adaptive p80"} materiality on an explicitly accepted unofficial Yahoo reference. Not proof of causality, a live execution feed or an entry signal.`,
    from: new Date((before.timestampSec + barSeconds) * 1000).toISOString(), to: new Date((after.timestampSec + barSeconds) * 1000).toISOString(), change };
}

export async function fetchPriceTest(catalystAt: string | null, thesis: GlobalReadThesis, method: GlobalReadMethod): Promise<GlobalReadPriceTest> {
  const unavailable = testPriceResponse([], catalystAt, thesis, method, new Date().toISOString());
  if (!method.referenceSymbol || !method.referenceSourceAccepted || !catalystAt || method.reactionWindowSeconds === null || method.maxBarDistanceSeconds === null || (method.materialityPct === null && (!method.adaptiveLookbackSessions || !method.adaptivePercentile))) return unavailable;
  try {
    const data = await fetchYahooChart(method.referenceSymbol, method.materialityPct === null ? "1mo" : "5d", method.materialityPct === null ? "5m" : "1m");
    if (data.meta.symbol !== method.referenceSymbol) return { ...unavailable, reason: "Reference symbol mismatch." };
    return testPriceResponse(data.history, catalystAt, thesis, method, new Date().toISOString());
  } catch { return { ...unavailable, reason: "Reference price provider failed; no fabricated or stale replacement." }; }
}
