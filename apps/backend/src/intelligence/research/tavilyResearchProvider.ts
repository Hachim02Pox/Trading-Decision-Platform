import { loadAppConfig } from "../../config/env";
import type { RawSearchResult } from "./rawResult";
import { RESEARCH_TOPIC_PLANS, type RecencyWindow, type TopicTag } from "./topicPlans";

// Real intelligence pilot — real Tavily research provider, conforming to
// the same RawSearchResult shape the (mock) pipeline already consumes
// (dedupeResults.ts/extractClaims.ts/dedupeClaims.ts/corroboration.ts stay
// completely unchanged — see realCoordinator.ts). Builds on the credential/
// auth convention already proven in apps/backend/src/providers/tavily.ts's
// connectivity-only smoke test (`Authorization: Bearer <key>`,
// `topic: "finance"`), but this is the first place Tavily results actually
// feed the research pipeline.
//
// Tavily's real result shape (`title`/`url`/`content`/`published_date`)
// differs from the mock fixtures' RawSearchResult field names
// (`headline`/`snippet`/`publishedAt`) — normalized here, once, rather than
// touching the dedup/claim-extraction stages themselves.

const SEARCH_URL = "https://api.tavily.com/search";

interface TavilyApiResult {
  title: string;
  url: string;
  content: string;
  published_date?: string;
  /** Tavily's own 0-1 semantic relevance score for this result against the query — was fetched but never read anywhere in this pipeline, so an off-topic keyword-overlap match (e.g. "auction"/"debt"/"interest" hits on completely unrelated corporate-earnings stories) was silently accepted as "evidence" for a KPI. See MIN_RELEVANCE_SCORE below. */
  score?: number;
}

interface TavilyApiResponse {
  results?: TavilyApiResult[];
}

export function tavilyRecencyFilter(window: RecencyWindow, now = new Date()): Record<string, string> {
  if (window === "24h") return { time_range: "day" };
  if (window === "7d") return { time_range: "week" };
  if (window === "30d") return { time_range: "month" };
  if (window === "1y") return { time_range: "year" };
  return { start_date: new Date(now.getTime() - 90 * 86_400_000).toISOString().slice(0, 10) };
}

function isTavilyResult(value: unknown): value is TavilyApiResult {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  return typeof item.title === "string" && typeof item.url === "string" && typeof item.content === "string";
}

// Verified live (2026-09) against real query/result pairs: a genuinely
// on-topic result for a tightly-worded query like "Treasury auction results
// bid-to-cover" consistently scores well above this bar; the noise this pass
// found (an Amazon ad-pricing lawsuit, Broadcom earnings, a Starbucks debt
// paydown — none about Treasury auctions) all scored well below it. A
// conservative cutoff, not a tight one — this is meant to drop clearly
// off-topic matches, never to starve a legitimately thin evidence base
// (`evidenceState: "LIMITED"` already exists downstream for that case).
const MIN_RELEVANCE_SCORE = 0.3;

function publisherFromUrl(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "unknown";
  }
}

/**
 * Runs every query in a topic's research plan against the real Tavily API
 * and normalizes the results into RawSearchResult[]. Best-effort per query:
 * a failed/empty query call yields fewer raw results for that topic rather
 * than throwing — a partial research base is preferable to aborting the
 * whole KPI's real interpretation over a single flaky search call (the
 * downstream claim/evidence pipeline already handles a thin evidence base
 * via `evidenceState`).
 */
export async function fetchRealRawResultsForTopic(topic: TopicTag): Promise<RawSearchResult[]> {
  const config = loadAppConfig().providers.tavily;
  if (!config) return [];

  const plan = RESEARCH_TOPIC_PLANS[topic];
  const results: RawSearchResult[] = [];

  for (const [queryIndex, query] of plan.queries.entries()) {
    try {
      const response = await fetch(SEARCH_URL, {
        method: "POST",
        signal: AbortSignal.timeout(10_000),
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${config.apiKey}` },
        body: JSON.stringify({
          query,
          // "advanced" (vs. the prior "basic") trades a slightly higher
          // Tavily credit cost for materially better relevance ranking —
          // this feature only ever runs on a manual button click (45s
          // cooldown, never automatic/batch), so the extra cost per query is
          // negligible against the accuracy gain.
          search_depth: "advanced",
          max_results: plan.maxResults,
          topic: "finance",
          ...tavilyRecencyFilter(plan.recencyWindow),
        }),
      });
      if (!response.ok) {
        console.warn(JSON.stringify({ msg: "Tavily query failed, continuing with fewer raw results", topic, query, status: response.status }));
        continue;
      }
      const body = (await response.json()) as TavilyApiResponse;
      const validResults = Array.isArray(body.results) ? body.results.filter(isTavilyResult) : [];
      let droppedForRelevance = 0;
      for (const [resultIndex, item] of validResults.entries()) {
        if (typeof item.score === "number" && item.score < MIN_RELEVANCE_SCORE) {
          droppedForRelevance += 1;
          continue;
        }
        results.push({
          url: item.url,
          publisher: publisherFromUrl(item.url),
          headline: item.title,
          publishedAt: item.published_date && item.published_date.length > 0 ? item.published_date : null,
          providerResultId: `tavily-${topic}-${queryIndex}-${resultIndex}`,
          snippet: item.content,
        });
      }
      if (droppedForRelevance > 0) {
        console.log(
          JSON.stringify({ msg: "Tavily results dropped for low relevance score", topic, query, droppedForRelevance, keptCount: validResults.length - droppedForRelevance })
        );
      }
    } catch (err) {
      console.warn(
        JSON.stringify({
          msg: "Tavily query threw, continuing with fewer raw results",
          topic,
          query,
          error: err instanceof Error ? err.message : String(err),
        })
      );
    }
  }

  return results;
}
