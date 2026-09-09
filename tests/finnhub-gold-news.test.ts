import assert from "node:assert/strict";
import test from "node:test";
import type { GoldNewsItem } from "../apps/backend/src/news/finnhubGoldNews";
import { cleanNewsText, isGoldNewsCacheFresh, limitNewsSummary, normalizeGdeltNews, normalizeGoldNews, normalizeTavilyNews } from "../apps/backend/src/news/finnhubGoldNews";

test("removes upstream HTML from article summaries", () => {
  assert.equal(cleanNewsText("<p>Gold &amp; silver</p><ul><li>Rates</li></ul>"), "Gold & silver\n\nRates");
  assert.equal(limitNewsSummary("Gold " .repeat(100)).length <= 323, true);
});

test("normalizes recent Gold headlines and rejects stale or unrelated items", () => {
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

  assert.equal(result.length, 1);
  assert.equal(result[0]?.id, 12);
  assert.equal(result[0]?.publishedAt, "2023-11-14T22:13:20.000Z");
  assert.equal(result[0]?.image, null);
});

test("flags stale cached gold-news data so the backend forces a refresh", () => {
  const now = new Date("2026-09-08T10:50:00.000Z");
  const staleItems: GoldNewsItem[] = [
    {
      id: 999,
      category: "general",
      headline: "Gold prices steady",
      summary: "Previous update.",
      source: "Reuters",
      url: "https://example.com/gold-old",
      image: null,
      related: "gold",
      publishedAt: "2026-09-08T00:00:00.000Z",
    },
  ];

  assert.equal(isGoldNewsCacheFresh(staleItems, now), false);
  assert.equal(isGoldNewsCacheFresh([], now), false);
});

test("normalizes recent GDELT headlines as a live fallback", () => {
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
      title: "Gold market update from yesterday",
      seendate: "20260908T060000Z",
      domain: "example.com",
    },
    {
      url: "https://example.com/equities",
      title: "Technology shares rally",
      seendate: "20260908T084000Z",
      domain: "example.com",
    },
  ], now);

  assert.equal(result.length, 1);
  assert.equal(result[0]?.headline, "Gold prices move higher in Asian trading");
  assert.equal(result[0]?.source, "example.com");
  assert.equal(result[0]?.publishedAt, "2026-09-08T08:45:00.000Z");
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