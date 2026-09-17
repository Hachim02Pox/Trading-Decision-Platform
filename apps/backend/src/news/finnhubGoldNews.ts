import type { ServerResponse } from "node:http";
import { loadAppConfig } from "../config/env";

const FINNHUB_NEWS_URL = "https://finnhub.io/api/v1/news";
const GDELT_NEWS_URL = "https://api.gdeltproject.org/api/v2/doc/doc";
const TAVILY_NEWS_URL = "https://api.tavily.com/search";
// FinancialJuice, via Parse (parse.bot) — scraper id is specific to this one
// subscribed API on Hachim's Parse account, not a general setting (see
// config/env.ts's ParseCredentials doc comment).
const FINANCIALJUICE_SCRAPER_ID = "5b75d611-7d46-4a11-8e9b-1197d46a46c8";
const FINANCIALJUICE_NEWS_URL = `https://api.parse.bot/scraper/${FINANCIALJUICE_SCRAPER_ID}/get_news_feed`;
const POLL_INTERVAL_MS = 5_000;
const MAX_ITEMS = 30;
// Widened 4h -> 24h (overnight session 2026-09-16): the feed was often empty
// because Finnhub's `general`/`forex` categories rarely mention gold at all
// within a 4h window once GOLD_TERMS is applied — this was a content
// availability problem, not a refresh-speed one (the backend already polls
// every 5s and pushes over SSE). No free real-time news WebSocket exists on
// Finnhub's free tier (verified live tonight — news is REST-polling only,
// even on paid tiers per docs/GUIDE_FONCTIONNEMENT_DONNEES.md §4.12), so a
// wider window plus always-on Tavily/GDELT (see refreshGoldNews below,
// no longer gated behind a "Finnhub returned too few items" threshold) is
// the real fix within what's actually free.
const LIVE_NEWS_WINDOW_MS = 24 * 60 * 60 * 1000;
const MAX_NEWS_AGE_MS = 48 * 60 * 60 * 1000;
const CACHE_STALE_AFTER_MS = 60_000;
const MAX_SUMMARY_LENGTH = 320;
const GOLD_TERMS = /\b(gold|xau|gld|bullion|precious metals?|silver|metals?|miners?|commodity|commodities|comex|lbma)\b/i;

export interface GoldNewsItem {
  id: number;
  category: string;
  headline: string;
  summary: string;
  source: string;
  url: string;
  image: string | null;
  related: string;
  publishedAt: string;
}

interface FinnhubNewsItem {
  category?: unknown;
  datetime?: unknown;
  headline?: unknown;
  id?: unknown;
  image?: unknown;
  related?: unknown;
  source?: unknown;
  summary?: unknown;
  url?: unknown;
}

interface GdeltNewsItem {
  url?: unknown;
  title?: unknown;
  seendate?: unknown;
  domain?: unknown;
}

interface TavilyNewsItem {
  title?: unknown;
  url?: unknown;
  content?: unknown;
  published_date?: unknown;
}

/** Shape confirmed live against get_news_feed (2026-09-17) — only the fields this normalizer actually reads. */
interface FinancialJuiceNewsItem {
  NewsID?: unknown;
  Title?: unknown;
  Description?: unknown;
  DatePublished?: unknown;
  EURL?: unknown;
  Img?: unknown;
}

type NewsListener = (items: GoldNewsItem[] | null, error?: string) => void;

let cachedItems: GoldNewsItem[] = [];
let pollingTimer: ReturnType<typeof setInterval> | null = null;
let refreshInFlight: Promise<void> | null = null;
const listeners = new Set<NewsListener>();

function isFinnhubNewsItem(value: unknown): value is FinnhubNewsItem {
  return typeof value === "object" && value !== null;
}

function isHttpUrl(value: string): boolean {
  try {
    const protocol = new URL(value).protocol;
    return protocol === "http:" || protocol === "https:";
  } catch {
    return false;
  }
}

export function cleanNewsText(value: string): string {
  return value
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/li\s*>/gi, "\n")
    .replace(/<\/p\s*>/gi, "\n\n")
    .replace(/<[^>]*>/g, "")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function limitNewsSummary(value: string): string {
  const cleaned = cleanNewsText(value).replace(/\s+/g, " ");
  if (cleaned.length <= MAX_SUMMARY_LENGTH) return cleaned;
  return `${cleaned.slice(0, MAX_SUMMARY_LENGTH).trimEnd()}...`;
}

export function normalizeGoldNews(items: unknown[], now = new Date()): GoldNewsItem[] {
  const cutoff = now.getTime() - MAX_NEWS_AGE_MS;
  const liveCutoff = now.getTime() - LIVE_NEWS_WINDOW_MS;
  const normalized = items
    .filter(isFinnhubNewsItem)
    .filter((item) => GOLD_TERMS.test(`${item.headline ?? ""} ${item.summary ?? ""} ${item.related ?? ""}`))
    .filter((item) => typeof item.id === "number" && typeof item.datetime === "number" && typeof item.headline === "string" && typeof item.url === "string" && isHttpUrl(item.url))
    .map((item) => ({
      id: item.id as number,
      category: typeof item.category === "string" ? item.category : "market",
      headline: cleanNewsText(item.headline as string),
      summary: typeof item.summary === "string" ? limitNewsSummary(item.summary) : "",
      source: typeof item.source === "string" ? item.source : "Finnhub",
      url: item.url as string,
      image: typeof item.image === "string" && item.image.length > 0 ? item.image : null,
      related: typeof item.related === "string" ? item.related : "",
      publishedAt: new Date((item.datetime as number) * 1000).toISOString(),
    }))
    .filter((item) => Date.parse(item.publishedAt) >= cutoff)
    .filter((item) => Date.parse(item.publishedAt) >= liveCutoff);

  return [...new Map(normalized.map((item) => [item.id, item])).values()]
    .sort((left, right) => Date.parse(right.publishedAt) - Date.parse(left.publishedAt))
    .slice(0, MAX_ITEMS);
}

function parseGdeltDate(value: unknown): number | null {
  if (typeof value !== "string") return null;
  const match = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/.exec(value);
  if (!match) return null;
  const [, year, month, day, hour, minute, second] = match;
  return Date.UTC(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute), Number(second));
}

function stableNewsId(url: string): number {
  let hash = 0;
  for (const character of url) hash = (hash * 31 + character.charCodeAt(0)) | 0;
  return Math.abs(hash) || 1;
}

export function normalizeGdeltNews(items: unknown[], now = new Date()): GoldNewsItem[] {
  const liveCutoff = now.getTime() - LIVE_NEWS_WINDOW_MS;
  return items
    .filter((item): item is GdeltNewsItem => typeof item === "object" && item !== null)
    .filter((item) => typeof item.url === "string" && isHttpUrl(item.url) && typeof item.title === "string")
    .map((item) => {
      const timestamp = parseGdeltDate(item.seendate);
      return {
        id: stableNewsId(item.url as string),
        category: "market",
        headline: cleanNewsText(item.title as string),
        summary: "",
        source: typeof item.domain === "string" && item.domain.length > 0 ? item.domain : "GDELT",
        url: item.url as string,
        image: null,
        related: "gold",
        publishedAt: timestamp === null ? "" : new Date(timestamp).toISOString(),
      };
    })
    .filter((item) => item.publishedAt.length > 0 && Date.parse(item.publishedAt) >= liveCutoff)
    .filter((item) => GOLD_TERMS.test(item.headline))
    .sort((left, right) => Date.parse(right.publishedAt) - Date.parse(left.publishedAt))
    .slice(0, MAX_ITEMS);
}

function sourceFromUrl(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "Tavily";
  }
}

export function normalizeTavilyNews(items: unknown[], now = new Date()): GoldNewsItem[] {
  const liveCutoff = now.getTime() - LIVE_NEWS_WINDOW_MS;
  return items
    .filter((item): item is TavilyNewsItem => typeof item === "object" && item !== null)
    .filter((item) => typeof item.url === "string" && isHttpUrl(item.url) && typeof item.title === "string" && typeof item.published_date === "string")
    .filter((item) => Number.isFinite(Date.parse(item.published_date as string)))
    .filter((item) => GOLD_TERMS.test(item.title as string))
    .map((item) => ({
      id: stableNewsId(item.url as string),
      category: "market",
      headline: cleanNewsText(item.title as string),
      summary: typeof item.content === "string" ? limitNewsSummary(item.content) : "",
      source: sourceFromUrl(item.url as string),
      url: item.url as string,
      image: null,
      related: "gold",
      publishedAt: new Date(item.published_date as string).toISOString(),
    }))
    .filter((item) => Date.parse(item.publishedAt) >= liveCutoff)
    .sort((left, right) => Date.parse(right.publishedAt) - Date.parse(left.publishedAt))
    .slice(0, MAX_ITEMS);
}

/**
 * `DatePublished` comes back with no timezone designator (e.g.
 * "2026-09-17T04:01:58.71") — parsed as-is, that's local-time per the
 * ECMA-262 date-time string format, which would silently shift by the
 * server process's own TZ between a local dev machine and a UTC production
 * container. NOT YET LIVE-VALIDATED against a known-time item (unlike
 * JBLANKED_SOURCE_TIMEZONE_LABEL's confirmed UTC+7 in f13EventTypes.ts) —
 * assumed UTC (FinancialJuice's public terminal defaults to GMT) so at
 * least behavior is deterministic across environments. If headlines land in
 * the feed noticeably ahead of/behind their real publish time, this
 * assumption is the first thing to check.
 */
function parseFinancialJuiceDate(raw: string): number {
  const hasTimezone = /[zZ]|[+-]\d{2}:?\d{2}$/.test(raw);
  return Date.parse(hasTimezone ? raw : `${raw}Z`);
}

// 2026-09-17, explicit product decision (Hachim): unlike Finnhub/GDELT/
// Tavily above, FinancialJuice's general macro/geopolitical firehose (China
// trade, BOJ policy, central-bank moves, etc.) is kept UNFILTERED by
// GOLD_TERMS — max article volume, as fast as possible, even without a
// literal "gold" mention, since this terminal's whole premise is reading
// gold through its macro drivers, not just gold-labeled headlines.
export function normalizeFinancialJuiceNews(items: unknown[], now = new Date()): GoldNewsItem[] {
  const liveCutoff = now.getTime() - LIVE_NEWS_WINDOW_MS;
  return items
    .filter((item): item is FinancialJuiceNewsItem => typeof item === "object" && item !== null)
    .filter((item) => typeof item.NewsID === "number" && typeof item.Title === "string" && typeof item.EURL === "string" && isHttpUrl(item.EURL))
    .filter((item) => typeof item.DatePublished === "string" && Number.isFinite(parseFinancialJuiceDate(item.DatePublished as string)))
    .map((item) => ({
      id: item.NewsID as number,
      category: "market",
      headline: cleanNewsText(item.Title as string),
      summary: typeof item.Description === "string" && item.Description.length > 0 ? limitNewsSummary(item.Description) : "",
      source: "FinancialJuice",
      url: item.EURL as string,
      image: typeof item.Img === "string" && isHttpUrl(item.Img) ? item.Img : null,
      // Not gold-filtered (see comment above) — "gold" here would misrepresent items like BOJ/China trade headlines.
      related: "",
      publishedAt: new Date(parseFinancialJuiceDate(item.DatePublished as string)).toISOString(),
    }))
    .filter((item) => Date.parse(item.publishedAt) >= liveCutoff)
    .sort((left, right) => Date.parse(right.publishedAt) - Date.parse(left.publishedAt))
    .slice(0, MAX_ITEMS);
}

export function isGoldNewsCacheFresh(items: GoldNewsItem[], now = new Date()): boolean {
  if (items.length === 0) return false;
  const newestTimestamp = items.reduce((latest, item) => Math.max(latest, Date.parse(item.publishedAt)), 0);
  return now.getTime() - newestTimestamp <= CACHE_STALE_AFTER_MS;
}

async function fetchCategory(category: "general" | "forex", apiKey: string): Promise<unknown[]> {
  const url = new URL(FINNHUB_NEWS_URL);
  url.searchParams.set("category", category);
  const response = await fetch(url, {
    headers: { "X-Finnhub-Token": apiKey },
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new Error(`Finnhub returned HTTP ${response.status}`);
  const body: unknown = await response.json();
  return Array.isArray(body) ? body : [];
}

async function fetchGoldCompanyNews(apiKey: string): Promise<unknown[]> {
  const now = new Date();
  const from = new Date(now.getTime() - MAX_NEWS_AGE_MS).toISOString().slice(0, 10);
  const to = now.toISOString().slice(0, 10);
  const url = new URL("https://finnhub.io/api/v1/company-news");
  url.searchParams.set("symbol", "GLD");
  url.searchParams.set("from", from);
  url.searchParams.set("to", to);
  const response = await fetch(url, {
    headers: { "X-Finnhub-Token": apiKey },
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new Error(`Finnhub company-news returned HTTP ${response.status}`);
  const body: unknown = await response.json();
  return Array.isArray(body) ? body : [];
}

async function fetchGdeltNews(): Promise<unknown[]> {
  const url = new URL(GDELT_NEWS_URL);
  url.searchParams.set("query", "gold OR xau OR bullion OR silver");
  url.searchParams.set("mode", "artlist");
  url.searchParams.set("format", "json");
  url.searchParams.set("maxrecords", String(MAX_ITEMS));
  url.searchParams.set("sort", "datedesc");
  url.searchParams.set("timespan", "4h");
  const response = await fetch(url, { signal: AbortSignal.timeout(10_000) });
  if (!response.ok) throw new Error(`GDELT returned HTTP ${response.status}`);
  const body = (await response.json()) as { articles?: unknown };
  return Array.isArray(body.articles) ? body.articles : [];
}

async function fetchTavilyNews(): Promise<unknown[]> {
  const config = loadAppConfig().providers.tavily;
  if (!config) return [];
  const response = await fetch(TAVILY_NEWS_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${config.apiKey}` },
    body: JSON.stringify({
      query: "latest gold news XAU bullion gold price",
      search_depth: "basic",
      topic: "finance",
      max_results: MAX_ITEMS,
      time_range: "day",
      include_answer: false,
    }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new Error(`Tavily returned HTTP ${response.status}`);
  const body = (await response.json()) as { results?: unknown };
  return Array.isArray(body.results) ? body.results : [];
}

interface FinancialJuiceEnvelope {
  status?: unknown;
  data?: { items?: unknown };
}

async function fetchFinancialJuiceNews(): Promise<unknown[]> {
  const config = loadAppConfig().providers.parse;
  if (!config) return [];
  const url = new URL(FINANCIALJUICE_NEWS_URL);
  url.searchParams.set("old_id", "0");
  const response = await fetch(url, {
    headers: { "X-API-Key": config.apiKey },
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new Error(`FinancialJuice (Parse) returned HTTP ${response.status}`);
  const body = (await response.json()) as FinancialJuiceEnvelope;
  if (body.status !== "success") throw new Error(`FinancialJuice (Parse) returned status ${JSON.stringify(body.status)}`);
  return Array.isArray(body.data?.items) ? body.data.items : [];
}

async function refreshGoldNews(): Promise<void> {
  const finnhubConfig = loadAppConfig().providers.finnhub;

  // 2026-09-16: Tavily/GDELT are no longer an emergency-only fallback gated
  // behind "Finnhub returned fewer than 5 items" — they're gold-native
  // queries (unlike Finnhub's generic general/forex categories) and are
  // fetched every refresh alongside Finnhub, then merged and deduped. This
  // is the real fix for the feed being empty/thin most of the time.
  // FinancialJuice (via Parse) added 2026-09-17, same treatment — always-on,
  // merged and deduped, not a fallback-of-last-resort.
  const FALLBACK_SOURCE_NAMES = ["GDELT", "Tavily", "FinancialJuice"] as const;
  const FALLBACK_NORMALIZERS = [normalizeGdeltNews, normalizeTavilyNews, normalizeFinancialJuiceNews] as const;

  const [finnhubResults, fallbackResults] = await Promise.all([
    finnhubConfig
      ? Promise.allSettled([
          fetchCategory("general", finnhubConfig.apiKey),
          fetchCategory("forex", finnhubConfig.apiKey),
          fetchGoldCompanyNews(finnhubConfig.apiKey),
        ])
      : Promise.resolve([]),
    Promise.allSettled([fetchGdeltNews(), fetchTavilyNews(), fetchFinancialJuiceNews()]),
  ]);

  const articles = finnhubResults.flatMap((result) => (result.status === "fulfilled" ? result.value : []));
  const finnhubItems = normalizeGoldNews(articles);
  const fallbackItems = fallbackResults.flatMap((result, index) => {
    if (result.status === "rejected") {
      console.warn(`[gold-news] ${FALLBACK_SOURCE_NAMES[index]} failed: ${result.reason instanceof Error ? result.reason.message : "unknown error"}`);
      return [];
    }
    return FALLBACK_NORMALIZERS[index](result.value);
  });
  const existingUrls = new Set(finnhubItems.map((item) => item.url));
  const nextItems = [...finnhubItems, ...fallbackItems.filter((item) => !existingUrls.has(item.url))]
    .sort((left, right) => Date.parse(right.publishedAt) - Date.parse(left.publishedAt))
    .slice(0, MAX_ITEMS);

  const allFailed =
    (!finnhubConfig || finnhubResults.every((result) => result.status === "rejected")) &&
    fallbackResults.every((result) => result.status === "rejected");
  if (nextItems.length === 0 && allFailed) {
    throw new Error("All gold-news providers failed");
  }

  const previousIds = cachedItems.map((item) => item.id).join(",");
  const nextIds = nextItems.map((item) => item.id).join(",");
  cachedItems = nextItems;
  if (previousIds !== nextIds) {
    for (const listener of listeners) listener(cachedItems);
  }
}

async function refreshSafely(): Promise<void> {
  if (refreshInFlight) return refreshInFlight;
  refreshInFlight = refreshGoldNews()
    .catch((error) => {
      console.warn(`[finnhub-news] refresh failed: ${error instanceof Error ? error.message : "unknown error"}`);
      for (const listener of listeners) listener(null, "Finnhub news refresh failed");
    })
    .finally(() => {
      refreshInFlight = null;
    });
  return refreshInFlight;
}

function startPolling(): void {
  if (pollingTimer) return;
  const refreshIfNeeded = () => {
    if (!isGoldNewsCacheFresh(cachedItems)) {
      void refreshSafely();
    }
  };
  refreshIfNeeded();
  pollingTimer = setInterval(refreshIfNeeded, POLL_INTERVAL_MS);
}

export async function getGoldNewsSnapshot(): Promise<GoldNewsItem[]> {
  startPolling();
  await refreshSafely();
  return cachedItems;
}

export function subscribeGoldNews(response: ServerResponse): () => void {
  startPolling();
  response.write(`event: connected\ndata: ${JSON.stringify({ source: "finnhub", pollIntervalMs: POLL_INTERVAL_MS })}\n\n`);
  const listener: NewsListener = (items, error) => {
    if (response.destroyed) return;
    if (error) {
      response.write(`event: provider-error\ndata: ${JSON.stringify({ message: error })}\n\n`);
      return;
    }
    response.write(`event: news\ndata: ${JSON.stringify(items ?? [])}\n\n`);
  };
  listeners.add(listener);
  if (cachedItems.length > 0) listener(cachedItems);
  const keepAlive = setInterval(() => {
    if (!response.destroyed) response.write(": keepalive\n\n");
  }, 20_000);
  return () => {
    listeners.delete(listener);
    clearInterval(keepAlive);
  };
}