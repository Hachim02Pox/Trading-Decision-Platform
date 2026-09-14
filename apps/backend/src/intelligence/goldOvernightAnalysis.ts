import type { GoldOvernightRecap, GoldOvernightRecapResponse, Language } from "@gold-terminal/contracts";
import { checkAndStartCooldown } from "./onDemandCooldown";
import { createGroqLlmProvider } from "./cloud/groqLlmProvider";
import { createTavilySearchProvider } from "./cloud/tavilySearchProvider";
import { loadGoldOvernightRecaps, saveGoldOvernightRecaps, type GoldOvernightRecapByLanguage } from "./runtimeStore";

const COOLDOWN_MS = 10 * 60_000;
let cached: GoldOvernightRecapByLanguage | null = null;
function recaps() { return cached ?? (cached = loadGoldOvernightRecaps()); }
function configured() { return createGroqLlmProvider("night") && createTavilySearchProvider() ? 1 : 0; }

export function getCachedGoldOvernightRecap(language: Language): GoldOvernightRecapResponse {
  const recap = recaps()[language] ?? null;
  return { status: recap ? "OK" : "NONE", recap, message: null, configuredProviderCount: configured(), cooldownRemainingMs: null };
}
export interface GoldOvernightDeps { sessionId: string; }

export async function runGoldOvernightRecap(language: Language, deps: GoldOvernightDeps): Promise<GoldOvernightRecapResponse> {
  const llm = createGroqLlmProvider("night");
  const search = createTavilySearchProvider();
  if (!llm || !search) return { status: "NOT_CONFIGURED", recap: null, message: "Configure GROQ_API_KEY and TAVILY_API_KEY in apps/backend/.env, then restart the backend.", configuredProviderCount: 0, cooldownRemainingMs: null };
  const cooldown = checkAndStartCooldown(`night-recap::${language}`, Date.now(), COOLDOWN_MS);
  if (!cooldown.allowed) return { status: "COOLDOWN", recap: recaps()[language] ?? null, message: "Night Recap is rate limited; please wait before running it again.", configuredProviderCount: 1, cooldownRemainingMs: cooldown.remainingMs };
  try {
    const queries = ["overnight gold markets", "Asia macro overnight", "global macro geopolitics overnight"];
    const results = (await Promise.all(queries.map((q) => search.search(q, 3)))).flat();
    const sources = [...new Map(results.map((item) => [item.url, item])).values()];
    if (sources.length === 0) throw new Error("No Tavily sources returned");
    const raw = await llm.completeJson(`Return only JSON in ${language}. Write a concise factual overnight recap, never a trade decision or target. Use only the supplied sources. JSON: {summary:string,keyMoves:string[],catalysts:string[]}. Sources: ${JSON.stringify(sources)}`) as Record<string, unknown>;
    if (typeof raw.summary !== "string" || !Array.isArray(raw.keyMoves) || !Array.isArray(raw.catalysts)) throw new Error("Invalid cloud recap response");
    const recap: GoldOvernightRecap = { interpretationAnalyzedAt: new Date().toISOString(), language, sessionId: deps.sessionId, isMock: false, combinedSummary: raw.summary, combinedKeyMoves: raw.keyMoves.filter((x): x is string => typeof x === "string"), combinedCatalysts: raw.catalysts.filter((x): x is string => typeof x === "string"), sources: sources.map((s) => ({ language: "web", publisher: s.publisher, url: s.url })), agentOutputs: [] };
    cached = { ...recaps(), [language]: recap }; saveGoldOvernightRecaps(cached);
    return { status: "OK", recap, message: null, configuredProviderCount: 1, cooldownRemainingMs: null };
  } catch (error) {
    const message = error instanceof Error && error.message === "PROVIDER_LIMIT" ? "Tavily quota is currently unavailable; add TAVILY2_API_KEY for the fallback key or retry later." : "Night Recap is temporarily unavailable.";
    return { status: "UNAVAILABLE", recap: null, message, configuredProviderCount: 1, cooldownRemainingMs: null };
  }
}
export function __resetGoldOvernightStateForTests(): void { cached = {}; }
