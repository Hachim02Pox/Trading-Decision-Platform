// Patch 5 — stage 0 shape: what a (mock, for now) shared search step returns
// before any dedup/claim-extraction runs.
export interface RawSearchResult {
  url: string;
  publisher: string;
  headline: string;
  publishedAt: string | null;
  providerResultId: string;
  snippet: string;
  /** Wire-service credit line when present, e.g. "Reuters", "AP", "Bloomberg". */
  byline?: string;
}
