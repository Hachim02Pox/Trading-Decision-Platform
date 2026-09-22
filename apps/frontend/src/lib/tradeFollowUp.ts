export const TRADE_REASON_OPTIONS = [
  { value: "TECHNICAL", label: "Technique" },
  { value: "MACRO", label: "Macro" },
  { value: "NEWS", label: "News" },
  { value: "FLOW", label: "Flux / positionnement" },
  { value: "RISK", label: "Gestion du risque" },
  { value: "OTHER", label: "Autre" },
] as const;

export type TradeReason = (typeof TRADE_REASON_OPTIONS)[number]["value"];

export interface FollowUpTrade { id: string; symbol: string; side: "buy" | "sell" | null }

/** First FundedNext trade that still needs its short, user-supplied context. */
export function nextUnclassifiedTrade<T extends FollowUpTrade>(trades: readonly T[], classifiedIds: ReadonlySet<string>): T | null {
  return trades.find((trade) => !classifiedIds.has(trade.id)) ?? null;
}
