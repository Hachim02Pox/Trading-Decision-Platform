// Free, no-auth fallback for F3's Fed meeting-probability read, used only
// when the primary source (Investing.com's Fed Rate Monitor, via
// investingFedRateMonitor.ts) fails. Polymarket's public "Gamma" API
// (gamma-api.polymarket.com) needs no API key/account for read-only market
// data — confirmed live 2026-09-16 — unlike CME's FedWatch, which actively
// blocks automated access (see investingFedRateMonitor.ts's file header for
// why CME itself is never an option here).
//
// Polymarket runs one real-money prediction-market EVENT per FOMC meeting
// ("Fed Decision in <Month>?"), each with 5 binary sub-MARKETS — one per
// possible outcome (-50bp, -25bp, no change, +25bp, +50bp). Each sub-market's
// "Yes" price IS the market-implied probability of that outcome — read
// directly, never recomputed/derived (same "never invent a probability, only
// report an admitted one" rule this codebase already follows elsewhere).
const GAMMA_SEARCH_URL = "https://gamma-api.polymarket.com/public-search";
const FED_DECISION_TITLE_RE = /^Fed Decision in [A-Za-z]+\?$/;
const REQUEST_TIMEOUT_MS = 10_000;

export interface PolymarketFedBucket {
  /** Polymarket's own outcome label, e.g. "No change", "25 bps increase" — never remapped into a target-range string we'd have to guess. */
  label: string;
  probabilityPct: number;
}

export interface PolymarketFedDecisionSnapshot {
  /** e.g. "Fed Decision in October?" — shown as-is so a viewer can tell this reads a different, clearly-labeled source. */
  eventTitle: string;
  meetingEndDateIso: string;
  buckets: PolymarketFedBucket[];
}

interface GammaMarket {
  question?: unknown;
  groupItemTitle?: unknown;
  outcomes?: unknown;
  outcomePrices?: unknown;
}

interface GammaEvent {
  title?: unknown;
  closed?: unknown;
  endDate?: unknown;
  markets?: unknown;
}

function isGammaEvent(value: unknown): value is GammaEvent {
  return typeof value === "object" && value !== null;
}

/** Polymarket's `outcomes`/`outcomePrices` fields are JSON-encoded arrays inside JSON strings (confirmed live) — e.g. `"[\"Yes\", \"No\"]"`, not a real array. */
function parseJsonStringArray(value: unknown): string[] | null {
  if (typeof value !== "string") return null;
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) && parsed.every((item) => typeof item === "string") ? parsed : null;
  } catch {
    return null;
  }
}

function extractYesProbabilityPct(market: GammaMarket): number | null {
  const outcomes = parseJsonStringArray(market.outcomes);
  const prices = parseJsonStringArray(market.outcomePrices);
  if (!outcomes || !prices || outcomes.length !== prices.length) return null;
  const yesIndex = outcomes.findIndex((outcome) => outcome.toLowerCase() === "yes");
  if (yesIndex === -1) return null;
  const value = Number(prices[yesIndex]);
  return Number.isFinite(value) ? Math.round(value * 1000) / 10 : null;
}

/**
 * Finds the soonest FOMC meeting Polymarket still has an OPEN ("Fed Decision
 * in <Month>?") event for, and returns its 5 outcome-bucket probabilities.
 * Never throws — returns `null` on any failure or shape mismatch, matching
 * this codebase's "a shape mismatch never throws" adapter convention.
 */
export async function fetchPolymarketFedDecision(): Promise<PolymarketFedDecisionSnapshot | null> {
  try {
    const url = new URL(GAMMA_SEARCH_URL);
    url.searchParams.set("q", "fed decision");
    const response = await fetch(url, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
    if (!response.ok) throw new Error(`Polymarket Gamma API returned HTTP ${response.status}`);
    const body = (await response.json()) as { events?: unknown };
    const events = Array.isArray(body.events) ? body.events.filter(isGammaEvent) : [];

    const openMeetingEvents = events
      .filter((event) => typeof event.title === "string" && FED_DECISION_TITLE_RE.test(event.title))
      .filter((event) => event.closed === false)
      .filter((event) => typeof event.endDate === "string" && !Number.isNaN(Date.parse(event.endDate)))
      .sort((a, b) => Date.parse(a.endDate as string) - Date.parse(b.endDate as string));

    const next = openMeetingEvents[0];
    if (!next || !Array.isArray(next.markets)) {
      console.error("[polymarketFedDecision] no open 'Fed Decision in <Month>?' event found");
      return null;
    }

    const buckets: PolymarketFedBucket[] = [];
    for (const rawMarket of next.markets) {
      if (typeof rawMarket !== "object" || rawMarket === null) continue;
      const market = rawMarket as GammaMarket;
      const label = typeof market.groupItemTitle === "string" ? market.groupItemTitle : null;
      const probabilityPct = extractYesProbabilityPct(market);
      if (label && probabilityPct !== null) buckets.push({ label, probabilityPct });
    }

    if (buckets.length === 0) {
      console.error("[polymarketFedDecision] event found but no bucket had a parseable label/probability");
      return null;
    }

    return {
      eventTitle: next.title as string,
      meetingEndDateIso: next.endDate as string,
      buckets,
    };
  } catch (err) {
    console.error("[polymarketFedDecision] fetch failed:", err instanceof Error ? err.message : String(err));
    return null;
  }
}
