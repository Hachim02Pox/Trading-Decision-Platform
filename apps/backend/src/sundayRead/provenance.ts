import type { Source } from "./schema";
export function normalizedSourceKey(input: string): string { try { const url = new URL(input); url.hash = ""; ["utm_source", "utm_medium", "utm_campaign", "gclid", "fbclid"].forEach((key) => url.searchParams.delete(key)); url.hostname = url.hostname.toLowerCase(); url.pathname = url.pathname.replace(/\/$/, ""); return url.toString().replace(/\/$/, ""); } catch { return input.trim(); } }
export function normalizeSources(sources: Source[]): Source[] { return sources.map((source) => ({ ...source, url: normalizedSourceKey(source.url) })); }
