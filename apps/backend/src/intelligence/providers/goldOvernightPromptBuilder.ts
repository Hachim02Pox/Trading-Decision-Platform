import type { Language } from "@gold-terminal/contracts";
import { NO_TRADE_LANGUAGE_RULE, languageInstruction } from "./promptContext";

// Overnight Gold Recap — user-explicit request: "ce qui s'est passé cette
// nuit sur le Gold, son mouvement, son explication" via a genuinely
// multi-language web search (Chinese, Japanese, English, and any other
// relevant language), forums included, ending in a fairly detailed summary.
// This produces a text briefing only — never a canonical Gold KPI value
// (F1 stays permanently removed from this codebase's data model).

export function buildGoldOvernightPrompt(role: "A" | "B", providerLabel: string, language: Language): string {
  return [
    `You are independent agent "${role}" (running as ${providerLabel}) producing an overnight Gold recap for a gold-market research terminal.`,
    "You have NOT seen the other agent's output — research and write this independently.",
    "",
    "Your job: find out what happened to Gold's price over roughly the last 12-24 hours and WHY, using real web search across MULTIPLE LANGUAGES, not just English.",
    "",
    "Mandatory research scope:",
    "1. Search in English (Reuters, Bloomberg, Kitco, MarketWatch, Yahoo Finance, etc.).",
    "2. Search in Chinese (中文) — Chinese financial media and forums genuinely move Gold sentiment (e.g. Sina Finance, Eastmoney/东方财富, Xueqiu/雪球, Weibo finance accounts) — search using Chinese-language queries, not just English queries about China.",
    "3. Search in Japanese (日本語) — Japanese financial media (Nikkei, Yahoo!ファイナンス, Reuters Japan) — search using Japanese-language queries, since USDJPY/BOJ dynamics materially affect Gold and are often covered first in Japanese.",
    "4. Search any OTHER language whose sources look genuinely relevant this run (e.g. Arabic for Gulf physical demand, Hindi for Indian retail demand, Russian for central-bank reserve moves) — do not force it if nothing relevant turns up, but check.",
    "5. Include forums/social sources where relevant (Reddit r/Gold, r/Wallstreetbets mentions of Gold, Chinese/Japanese finance forums, X/Twitter threads from known market commentators) ALONGSIDE primary news — never forums ONLY.",
    "",
    "For every source you cite, record its language and publisher in the `sources` field — this is how a human reader can tell how genuinely international the research was, not just an English search with a few translated headlines.",
    "",
    "If Gold moved without any identifiable catalyst across all the languages you checked, say so explicitly (\"no clear catalyst identified across EN/ZH/JA sources\") — never invent an explanation after the fact.",
    "",
    "`dataVerification`: state plainly which live source(s) you used to confirm Gold's actual price level/move this run (e.g. a spot price quote), and in which language(s) you searched.",
    "",
    NO_TRADE_LANGUAGE_RULE,
    languageInstruction(language),
    "The summary/keyMoves/catalysts/dataVerification fields must be written in the language just specified, regardless of which languages you searched in — translate your findings, do not paste raw non-target-language text.",
    "`summary` should be a genuinely detailed multi-sentence briefing, not a one-liner — this is meant to read like a proper morning briefing a trader can act on, not a headline.",
    "Respond with ONLY a single JSON object matching the exact required schema — no prose before or after it, no markdown code fences.",
  ].join("\n");
}
