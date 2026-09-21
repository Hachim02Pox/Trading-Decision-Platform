import type { GoldOvernightRecap, GoldOvernightRecapResponse, Language } from "@gold-terminal/contracts";
import { createGroqLlmProvider } from "./cloud/groqLlmProvider";
import { createTavilySearchProvider } from "./cloud/tavilySearchProvider";
import type { CloudLLMProvider, WebSearchProvider, WebSearchResult } from "./cloud/contracts";
import { loadGoldOvernightRecaps, saveGoldOvernightRecaps, type GoldOvernightRecapByLanguage } from "./runtimeStore";
import { loadAppConfig } from "../config/env";
import { loadGoldOvernightRecapFromDb, saveGoldOvernightRecapToDb } from "../db/goldOvernightRecaps";

let cached: GoldOvernightRecapByLanguage | null = null;
function recaps() { return cached ?? (cached = loadGoldOvernightRecaps()); }
function configured() { return createGroqLlmProvider("night") && createTavilySearchProvider() ? 1 : 0; }

// Search queries — five languages (English, French, Chinese, Japanese,
// Arabic), natural phrasings rather than word-for-word translations so each
// language's own search engine actually returns sources written in that
// language, covering the Asia + London gold trading sessions (Hachim's
// overnight, America/New_York — see jobs/goldOvernightAutoRecap.ts). Output
// stays EN/FR (this app's two supported `Language` values); the point of
// the extra languages is CORROBORATION — the prompt below explicitly asks
// the model to foreground whatever multiple independent-language sources
// agree on, not to produce more languages of output. `time_range: "day"`
// is Tavily's closest native approximation to "the last several hours" —
// it has no hourly granularity (see docs/AI_REPORTS_STATUS.md), so the
// prompt is what actually steers the model toward the MOST RECENT
// movements in those sources rather than older ones still surfacing in a
// 24h window. Query translations are AI-approximated, not native-speaker
// verified — Tavily's underlying search engine tolerates imperfect
// phrasing fine, but revisit if a given language's results look off-topic.
const QUERIES: ReadonlyArray<{ language: string; text: string }> = [
  { language: "EN", text: "overnight gold markets Asia London session" },
  { language: "EN", text: "gold price global macro geopolitics overnight" },
  { language: "FR", text: "or mouvement marché nuit dernière séance Asie Londres" },
  { language: "FR", text: "or banques centrales macro géopolitique nuit" },
  { language: "ZH", text: "黄金 隔夜 亚洲 伦敦 走势" },
  { language: "ZH", text: "黄金 央行 宏观 地缘政治" },
  { language: "JA", text: "ゴールド 価格 動向 アジア ロンドン" },
  { language: "JA", text: "ゴールド 中央銀行 マクロ 地政学" },
  { language: "AR", text: "الذهب حركة السوق الليلة الماضية آسيا لندن" },
  { language: "AR", text: "الذهب البنوك المركزية الاقتصاد الكلي الجغرافيا السياسية" },
];

function sourceLanguageOf(query: string): string {
  return QUERIES.find((q) => q.text === query)?.language ?? "unknown";
}

async function fetchOvernightSources(search: WebSearchProvider): Promise<WebSearchResult[]> {
  const results = (
    await Promise.all(QUERIES.map((q) => search.search(q.text, 2, { timeRange: "day" })))
  ).flat();
  return [...new Map(results.map((item) => [item.url, item])).values()];
}

// Groq's free tier caps at 8,000 tokens/MINUTE for the models this app uses
// (verified 2026-09-15, console.groq.com/docs/rate-limits) — the only
// genuinely tight quota anywhere in this project (see
// docs/AUDIT_QUOTAS_APPELS_API.md §4). The full `content` field of ~20
// deduplicated sources easily approaches that ceiling once embedded in the
// prompt twice (EN then FR) within the same 60s window. Tavily already
// front-loads the most relevant text at the start of `content`, so
// truncating costs little relevance for a real margin under the cap.
const MAX_SOURCE_CONTENT_CHARS = 500;

function truncateForPrompt(sources: WebSearchResult[]): WebSearchResult[] {
  return sources.map((s) => ({ ...s, content: s.content.slice(0, MAX_SOURCE_CONTENT_CHARS) }));
}

export function buildRecapPrompt(language: Language, sources: WebSearchResult[], now: Date): string {
  const languageName = language === "FR" ? "French" : "English";
  const locale = language === "FR" ? "fr-CA" : "en-US";
  const date = new Intl.DateTimeFormat(locale, { dateStyle: "long", timeZone: "America/New_York" });
  const start = new Date(now.getTime() - 24 * 60 * 60_000);
  const session = language === "FR" ? `la nuit du ${date.format(start)} au matin du ${date.format(now)} (heure de New York)` : `the night of ${date.format(start)} into the morning of ${date.format(now)} (New York time)`;
  return `The current time is ${now.toISOString()} — this is Hachim's overnight in America/New_York, i.e. the Asia and London Gold ` +
    `trading sessions that just concluded. The supplied sources were gathered from English, French, Chinese, Japanese and Arabic ` +
    `outlets. Return only JSON in ${languageName}: {text:string}. "text" is ONE flowing paragraph (no lists, no headings) explaining ` +
    `what has actually moved Gold during the Asia and London sessions, using only the most recent developments in the supplied ` +
    `sources (ignore older context that resurfaces in them but does not explain a recent move). Foreground whatever is reported ` +
    `consistently across MULTIPLE independent sources/languages over a claim appearing in only one source; if sources genuinely ` +
    `disagree on a driver, say so briefly instead of picking a side. End with anything worth paying attention to for the upcoming ` +
    `New York session. Never a trade decision or price target, never invent a source or a causal link that isn't supported by the ` +
    `sources. The first sentence MUST explicitly state: "${session}". Never name or cite any publisher, outlet, domain, URL, or source in the prose; say only what happened and why. Sources: ${JSON.stringify(truncateForPrompt(sources))}`;
}

async function generateRecapText(llm: CloudLLMProvider, sources: WebSearchResult[], language: Language, now: Date): Promise<string> {
  const raw = await llm.completeJson(buildRecapPrompt(language, sources, now)) as Record<string, unknown>;
  if (typeof raw.text !== "string" || raw.text.length === 0) throw new Error("Invalid cloud recap response");
  return raw.text;
}

function buildRecap(language: Language, sessionId: string, text: string, sources: WebSearchResult[]): GoldOvernightRecap {
  return {
    interpretationAnalyzedAt: new Date().toISOString(),
    language,
    sessionId,
    isMock: false,
    recapText: text,
    sources: sources.map((s) => ({ language: sourceLanguageOf(s.query), publisher: s.publisher, url: s.url })),
    agentOutputs: [],
  };
}

/**
 * Durable-first read: Postgres (`gold_overnight_recaps`) holds the latest
 * recap per language and survives a backend restart/redeploy, unlike the
 * `.runtime` JSON file `recaps()` falls back to. Same fix as `previousFetch`
 * earlier the same day (2026-09-16) — a Railway redeploy landing between the
 * ~9am ET generation and Hachim opening the site must never show "no recap
 * yet" for a recap that genuinely exists. Never throws: any DB failure or
 * missing config falls back to the in-memory/file cache, same behavior as
 * before this fix.
 */
async function loadFromDbSafe(language: Language): Promise<GoldOvernightRecap | null> {
  if (loadAppConfig().db === null) return null;
  try {
    return await loadGoldOvernightRecapFromDb(language);
  } catch (err) {
    console.warn(
      `[gold-overnight] DB recap lookup failed for ${language}, falling back to the ephemeral file cache: ${err instanceof Error ? err.message : String(err)}`
    );
    return null;
  }
}

/** Read-only — no manual trigger exists (2026-09-15 decision: automation-only, see jobs/goldOvernightAutoRecap.ts). */
export async function getCachedGoldOvernightRecap(language: Language): Promise<GoldOvernightRecapResponse> {
  const recap = (await loadFromDbSafe(language)) ?? recaps()[language] ?? null;
  return { status: recap ? "OK" : "NONE", recap, message: null, configuredProviderCount: configured() };
}
export interface GoldOvernightDeps { sessionId: string; }

export interface GoldOvernightAutoRunResult {
  ran: boolean;
  languages: Language[];
  reason: string;
}

/**
 * The only generator left (no manual trigger — 2026-09-15 decision). See
 * jobs/goldOvernightAutoRecap.ts for the once-a-day/target-hour gate that
 * decides WHEN to call this. Fetches sources ONCE and reuses them for both
 * EN and FR completions.
 */
export async function runGoldOvernightAutoRecap(deps: GoldOvernightDeps): Promise<GoldOvernightAutoRunResult> {
  const llm = createGroqLlmProvider("night");
  const search = createTavilySearchProvider();
  if (!llm || !search) return { ran: false, languages: [], reason: "GROQ_API_KEY/TAVILY_API_KEY not configured" };

  const sources = await fetchOvernightSources(search);
  if (sources.length === 0) throw new Error("No Tavily sources returned");

  const now = new Date();
  const languages: Language[] = ["EN", "FR"];
  const next = { ...recaps() };
  for (const [index, language] of languages.entries()) {
    // Spread the two completions across separate Groq TPM windows (see the
    // MAX_SOURCE_CONTENT_CHARS comment above) — cheap insurance since this
    // whole job only runs once a day; not worth it on the first iteration.
    // eslint-disable-next-line no-await-in-loop -- deliberate, see comment.
    if (index > 0) await new Promise((resolve) => setTimeout(resolve, 65_000));
    // eslint-disable-next-line no-await-in-loop -- sequential Groq calls, once/day, clearer error attribution per language than Promise.all.
    const text = await generateRecapText(llm, sources, language, now);
    next[language] = buildRecap(language, deps.sessionId, text, sources);
  }
  cached = next;
  saveGoldOvernightRecaps(cached);
  await Promise.all(
    languages.map(async (language) => {
      try {
        await saveGoldOvernightRecapToDb(language, next[language]);
      } catch (err) {
        console.warn(
          `[gold-overnight] failed to persist recap to Postgres for ${language} (ephemeral file cache still updated): ${err instanceof Error ? err.message : String(err)}`
        );
      }
    })
  );
  return { ran: true, languages, reason: `generated EN and FR recaps from ${sources.length} source(s)` };
}

export function __resetGoldOvernightStateForTests(): void { cached = {}; }
