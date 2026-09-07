import type { RawSearchResult } from "./rawResult";

// Patch 5, stage 1 — dedupe raw search hits by normalized URL (strip
// query/tracking params, lowercase host+path) OR by
// (normalized publisher + normalized headline + publishedAt rounded to the
// hour). Two results colliding on EITHER key are treated as the same
// underlying result.

const TRACKING_PARAM_PREFIXES = ["utm_", "ref", "src", "cid", "icid"];

export function normalizeUrl(rawUrl: string): string {
  try {
    const url = new URL(rawUrl);
    const host = url.hostname.toLowerCase().replace(/^www\./, "");
    const path = url.pathname.toLowerCase().replace(/\/+$/, "");
    const keptParams = Array.from(url.searchParams.entries())
      .filter(([key]) => !TRACKING_PARAM_PREFIXES.some((prefix) => key.toLowerCase().startsWith(prefix)))
      .sort(([a], [b]) => a.localeCompare(b));
    const query = keptParams.length > 0 ? `?${keptParams.map(([k, v]) => `${k}=${v}`).join("&")}` : "";
    return `${host}${path}${query}`;
  } catch {
    // Not a parseable absolute URL — fall back to a lowercase trim so the
    // pipeline never throws on malformed mock/test input.
    return rawUrl.trim().toLowerCase();
  }
}

export function normalizeForFuzzyKey(text: string): string {
  return text.trim().toLowerCase().replace(/\s+/g, " ");
}

function roundToHourIso(iso: string): string {
  const date = new Date(iso);
  date.setUTCMinutes(0, 0, 0);
  return date.toISOString();
}

function fuzzyKey(result: RawSearchResult): string {
  return [
    normalizeForFuzzyKey(result.publisher),
    normalizeForFuzzyKey(result.headline),
    result.publishedAt ? roundToHourIso(result.publishedAt) : "unknown-date",
  ].join("|");
}

/**
 * Collapse raw search results that are the same underlying result, keeping
 * the first-seen occurrence (stable, deterministic — no randomness).
 */
export function dedupeResults(results: RawSearchResult[]): RawSearchResult[] {
  const seenUrlKeys = new Set<string>();
  const seenFuzzyKeys = new Set<string>();
  const deduped: RawSearchResult[] = [];

  for (const result of results) {
    const urlKey = normalizeUrl(result.url);
    const fKey = fuzzyKey(result);

    if (seenUrlKeys.has(urlKey) || seenFuzzyKeys.has(fKey)) {
      continue;
    }

    seenUrlKeys.add(urlKey);
    seenFuzzyKeys.add(fKey);
    deduped.push(result);
  }

  return deduped;
}
