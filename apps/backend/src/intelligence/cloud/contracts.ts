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
export interface WebSearchProvider {
  readonly id: "tavily";
  search(query: string, maxResults: number): Promise<WebSearchResult[]>;
}
