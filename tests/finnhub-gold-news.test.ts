import assert from "node:assert/strict";
import test from "node:test";
import type { GoldNewsItem } from "../apps/backend/src/news/finnhubGoldNews";
import { cleanNewsText, isGoldNewsCacheFresh, limitNewsSummary, normalizeGdeltNews, normalizeGoldNews, normalizeTavilyNews } from "../apps/backend/src/news/finnhubGoldNews";

test("removes upstream HTML from article summaries", () => {
  assert.equal(cleanNewsText("<p>Gold &amp; silver</p><ul><li>Rates</li></ul>"), "Gold & silver\n\nRates");
  assert.equal(limitNewsSummary("Gold " .repeat(100)).length <= 323, true);
});

test("normalizes recent headlines (no topic filter — 2026-09-17 product decision) and rejects only stale/malformed items", () => {
  const now = new Date("2023-11-15T00:00:00.000Z");
  const result = normalizeGoldNews([
    {
      id: 12,
      category: "general",
      datetime: 1_700_000_000,
      headline: "Gold prices rise as real yields ease",
      summary: "Bullion moved higher.",
      source: "Reuters",
      url: "https://example.com/gold",
      image: "",
      related: "",
    },
    {
      // Not gold-related — must still be included: the feed is general
      // macro/market news now, not gold-headline-only (see
      // finnhubGoldNews.ts's LIVE_NEWS_WINDOW_MS comment).
      id: 13,
      category: "general",
      datetime: 1_700_000_100,
      headline: "Technology shares lead the market",
      summary: "A broad equity update.",
      source: "Example",
      url: "https://example.com/equities",
    },
    {
      id: 14,
      category: "general",
      datetime: 1_699_500_000,
      headline: "Gold market update",
      summary: "Too old for the live feed.",
      source: "Example",
      url: "https://example.com/stale",
    },
  ], now);

  assert.equal(result.length, 2);
  assert.deepEqual(result.map((item) => item.id).sort(), [12, 13]);
  const gold = result.find((item) => item.id === 12);
  assert.equal(gold?.publishedAt, "2023-11-14T22:13:20.000Z");
  assert.equal(gold?.image, null);
});

test("cache freshness is based on when it was last refreshed, never on an article's own publishedAt", () => {
  const now = new Date("2026-09-08T10:50:00.000Z");
  const items: GoldNewsItem[] = [
    {
      id: 999,
      category: "general",
      headline: "Gold prices steady",
      summary: "Previous update.",
      source: "Reuters",
      url: "https://example.com/gold-old",
      image: null,
      related: "gold",
      publishedAt: "2026-09-08T00:00:00.000Z", // deliberately "old" — must NOT make the cache look stale by itself.
    },
  ];

  // Never refreshed yet, or no items at all: never fresh.
  assert.equal(isGoldNewsCacheFresh(items, null, now), false);
  assert.equal(isGoldNewsCacheFresh([], now.getTime(), now), false);

  // Refreshed 5 minutes ago: still fresh (well within the 30-minute window),
  // regardless of how old the articles themselves are.
  const fiveMinutesAgo = now.getTime() - 5 * 60_000;
  assert.equal(isGoldNewsCacheFresh(items, fiveMinutesAgo, now), true);

  // Refreshed 31 minutes ago: stale, a new upstream fetch is due.
  const thirtyOneMinutesAgo = now.getTime() - 31 * 60_000;
  assert.equal(isGoldNewsCacheFresh(items, thirtyOneMinutesAgo, now), false);
});

test("normalizes recent GDELT headlines as a live fallback, no topic filter", () => {
  const now = new Date("2026-09-08T10:50:00.000Z");
  const result = normalizeGdeltNews([
    {
      url: "https://example.com/gold-now",
      title: "Gold prices move higher in Asian trading",
      seendate: "20260908T084500Z",
      domain: "example.com",
    },
    {
      url: "https://example.com/old-gold",
      title: "Gold market update from two days ago",
      seendate: "20260906T084500Z",
      domain: "example.com",
    },
    {
      // Not gold-related — still included (see the no-topic-filter test above).
      url: "https://example.com/equities",
      title: "Technology shares rally",
      seendate: "20260908T084000Z",
      domain: "example.com",
    },
  ], now);

  assert.equal(result.length, 2);
  const gold = result.find((item) => item.url === "https://example.com/gold-now");
  assert.equal(gold?.headline, "Gold prices move higher in Asian trading");
  assert.equal(gold?.source, "example.com");
  assert.equal(gold?.publishedAt, "2026-09-08T08:45:00.000Z");
  assert.ok(result.some((item) => item.url === "https://example.com/equities"));
  assert.ok(!result.some((item) => item.url === "https://example.com/old-gold"), "the 2-day-old item must still be excluded as stale");
});

test("normalizes recent Tavily headlines and ignores invalid dates", () => {
  const now = new Date("2026-09-08T10:50:00.000Z");
  const result = normalizeTavilyNews([
    {
      title: "Gold prices react to inflation expectations",
      url: "https://example.com/gold-today",
      content: "Gold and bullion markets moved today.",
      published_date: "2026-09-08T08:30:00.000Z",
    },
    {
      title: "Gold report with invalid date",
      url: "https://example.com/gold-invalid",
      content: "Gold market update.",
      published_date: "not-a-date",
    },
  ], now);

  assert.equal(result.length, 1);
  assert.equal(result[0]?.source, "example.com");
});