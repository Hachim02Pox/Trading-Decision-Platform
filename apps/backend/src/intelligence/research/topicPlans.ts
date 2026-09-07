import type { AuthorityClass } from "@gold-terminal/contracts";

// Patch 8 — a richer, versioned research plan per topic, so recency and
// preferred-source-class prioritization is demonstrably wired end to end
// rather than only declared in a type. The `queries` strings are plausible
// mock query text; no real search provider consumes them yet in this
// milestone (see apps/backend/src/intelligence/dataMode.ts).
export type TopicTag =
  | "CPI_RELEASE"
  | "PCE_RELEASE"
  | "FED_COMMUNICATION"
  | "TREASURY_SUPPLY"
  | "USD_DRIVERS"
  | "LABOR_RELEASE"
  | "RISK_SENTIMENT"
  | "LIQUIDITY_FUNDING"
  | "FLOWS_POSITIONING"
  | "GOLD_VOL";

export type RecencyWindow = "24h" | "7d" | "30d" | "90d" | "1y";

export interface ResearchTopicPlan {
  topic: TopicTag;
  queries: string[];
  preferredSourceClasses: AuthorityClass[];
  recencyWindow: RecencyWindow;
  maxResults: number;
}

export const RESEARCH_TOPIC_PLANS: Record<TopicTag, ResearchTopicPlan> = {
  CPI_RELEASE: {
    topic: "CPI_RELEASE",
    queries: ["US CPI report reaction", "core CPI inflation print Fed reaction"],
    preferredSourceClasses: ["OFFICIAL_STATISTICS", "WIRE_SERVICE", "FINANCIAL_MEDIA"],
    recencyWindow: "24h",
    maxResults: 8,
  },
  PCE_RELEASE: {
    topic: "PCE_RELEASE",
    queries: ["core PCE inflation report reaction", "PCE price index Fed target"],
    preferredSourceClasses: ["OFFICIAL_STATISTICS", "WIRE_SERVICE", "FINANCIAL_MEDIA"],
    recencyWindow: "24h",
    maxResults: 8,
  },
  FED_COMMUNICATION: {
    topic: "FED_COMMUNICATION",
    queries: ["FOMC statement reaction", "Fed officials rate path comments", "dot plot repricing"],
    preferredSourceClasses: ["CENTRAL_BANK", "WIRE_SERVICE", "FINANCIAL_MEDIA"],
    recencyWindow: "7d",
    maxResults: 10,
  },
  TREASURY_SUPPLY: {
    topic: "TREASURY_SUPPLY",
    queries: ["Treasury auction results bid-to-cover", "quarterly refunding announcement borrowing estimate"],
    preferredSourceClasses: ["GOVERNMENT", "WIRE_SERVICE", "FINANCIAL_MEDIA"],
    recencyWindow: "7d",
    maxResults: 8,
  },
  USD_DRIVERS: {
    topic: "USD_DRIVERS",
    queries: ["dollar index DXY drivers today", "USD momentum rate differential"],
    preferredSourceClasses: ["WIRE_SERVICE", "FINANCIAL_MEDIA", "RESEARCH_DESK"],
    recencyWindow: "24h",
    maxResults: 8,
  },
  LABOR_RELEASE: {
    topic: "LABOR_RELEASE",
    queries: ["nonfarm payrolls report reaction", "unemployment rate labor market cooling"],
    preferredSourceClasses: ["OFFICIAL_STATISTICS", "WIRE_SERVICE", "FINANCIAL_MEDIA"],
    recencyWindow: "7d",
    maxResults: 8,
  },
  RISK_SENTIMENT: {
    topic: "RISK_SENTIMENT",
    queries: ["VIX spike risk-off flows", "credit spreads widening risk appetite"],
    preferredSourceClasses: ["WIRE_SERVICE", "FINANCIAL_MEDIA", "RESEARCH_DESK"],
    recencyWindow: "24h",
    maxResults: 8,
  },
  LIQUIDITY_FUNDING: {
    topic: "LIQUIDITY_FUNDING",
    queries: ["bank reserves TGA funding conditions", "repo market SOFR IORB spread"],
    preferredSourceClasses: ["CENTRAL_BANK", "RESEARCH_DESK", "FINANCIAL_MEDIA"],
    recencyWindow: "30d",
    maxResults: 6,
  },
  FLOWS_POSITIONING: {
    topic: "FLOWS_POSITIONING",
    queries: ["CFTC managed money gold positioning", "gold ETF holdings flows"],
    preferredSourceClasses: ["GOVERNMENT", "RESEARCH_DESK", "FINANCIAL_MEDIA"],
    recencyWindow: "30d",
    maxResults: 6,
  },
  GOLD_VOL: {
    topic: "GOLD_VOL",
    queries: ["gold options volatility GVZ", "gold implied volatility event risk"],
    preferredSourceClasses: ["RESEARCH_DESK", "FINANCIAL_MEDIA"],
    recencyWindow: "7d",
    maxResults: 6,
  },
};
