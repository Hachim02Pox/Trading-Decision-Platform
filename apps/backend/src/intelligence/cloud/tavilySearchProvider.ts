import { loadAppConfig } from "../../config/env";
import type { WebSearchProvider, WebSearchResult } from "./contracts";

export function createTavilySearchProvider(): WebSearchProvider | null {
  const config = loadAppConfig().providers.tavily;
  if (!config) return null;
  return {
    id: "tavily",
    async search(query, maxResults) {
      const request = (apiKey: string) =>
        fetch("https://api.tavily.com/search", {
          method: "POST",
          signal: AbortSignal.timeout(20_000),
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            query,
            topic: "news",
            search_depth: "basic",
            max_results: Math.min(5, Math.max(1, maxResults)),
          }),
        });
      let response = await request(config.apiKey);
      if (
        (response.status === 429 || response.status === 432) &&
        config.fallbackApiKey
      )
        response = await request(config.fallbackApiKey);
      if (response.status === 429 || response.status === 432)
        throw new Error("PROVIDER_LIMIT");
      if (!response.ok)
        throw new Error(`Tavily request failed (${response.status})`);
      const body = (await response.json()) as {
        results?: Array<{
          title?: string;
          url?: string;
          content?: string;
          published_date?: string;
        }>;
      };
      const retrieved_at = new Date().toISOString();
      return (body.results ?? [])
        .filter(
          (
            item,
          ): item is Required<Pick<WebSearchResult, "title" | "url">> & {
            content?: string;
            published_date?: string;
          } => typeof item.title === "string" && typeof item.url === "string",
        )
        .map((item) => ({
          title: item.title,
          url: item.url,
          publisher: new URL(item.url).hostname,
          published_at: item.published_date ?? null,
          content: item.content ?? "",
          query,
          retrieved_at,
        }));
    },
  };
}
