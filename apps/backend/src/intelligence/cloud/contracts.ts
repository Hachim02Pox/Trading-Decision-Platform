export type CloudProviderLimit =
  "PROVIDER_LIMIT" | "NOT_CONFIGURED" | "UNAVAILABLE";
export interface CloudLLMProvider {
  readonly id: "groq";
  readonly model: string;
  completeJson(prompt: string, signal?: AbortSignal): Promise<unknown>;
}
export interface WebSearchResult {
  title: string;
  url: string;
  publisher: string;
  published_at: string | null;
  content: string;
  query: string;
  retrieved_at: string;
}
export interface WebSearchOptions {
  /** Tavily's own `time_range` filter — "day" is the closest native approximation to a recent-hours window (no hourly granularity exists upstream). */
  timeRange?: "day" | "week" | "month" | "year";
}
export interface WebSearchProvider {
  readonly id: "tavily";
  search(query: string, maxResults: number, options?: WebSearchOptions): Promise<WebSearchResult[]>;
}
