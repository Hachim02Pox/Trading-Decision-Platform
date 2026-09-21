import { randomUUID } from "node:crypto";
import { createGroqLlmProvider } from "../intelligence/cloud/groqLlmProvider";
import { createTavilySearchProvider } from "../intelligence/cloud/tavilySearchProvider";
import type { CloudLLMProvider, WebSearchProvider, WebSearchResult } from "../intelligence/cloud/contracts";
import type { EdgeCheckRow } from "../db/goldEdgeChecks";
import { claimForRunner, failForRunner, renewForRunner, submitForRunner, validateRunnerResult } from "./service";

const LEASE_SECONDS = 270;
const GLOBAL_TIMEOUT_MS = 280_000;
const MAX_QUERIES = 5;
const MAX_SOURCE_CHARS = 700;
const workerId = `gold-edge-${randomUUID()}`;
let active: Promise<void> | null = null;

export class GoldEdgeRunnerError extends Error { constructor(readonly code: string) { super(code); } }

function strings(value: unknown): string[] { return Array.isArray(value) ? value.filter((x): x is string => typeof x === "string").slice(0, 3) : []; }
function queryPlan(job: EdgeCheckRow): string[] {
  const state = job.inheritedState;
  const context = [String(state.edge ?? job.requestPayload.inherited_edge ?? "Gold"), ...strings(state.catalysts), ...strings(state.invalidations), ...strings(state.unknowns)].join(" ").slice(0, 350);
  return [
    `Gold macro policy developments since ${job.sourceWindowStart?.toISOString() ?? job.baseInformationCutoff.toISOString()} ${context}`,
    "US real yields Treasury rates dollar material market move today",
    "geopolitical energy credit liquidity stress gold market today",
    `Gold invalidation ${strings(state.invalidations).join(" ") || "central bank real yields dollar"}`,
  ].slice(0, MAX_QUERIES);
}
function dedupe(sources: WebSearchResult[], cutoff: number): WebSearchResult[] {
  const seen = new Set<string>();
  return sources.filter((source) => {
    const key = `${source.url.replace(/[?#].*$/, "").toLowerCase()}|${source.content.slice(0, 240).toLowerCase()}`;
    const published = source.published_at ? Date.parse(source.published_at) : NaN;
    if (seen.has(key) || !source.url.startsWith("http") || !Number.isFinite(published) || published < cutoff) return false;
    seen.add(key); return true;
  });
}
function prompt(job: EdgeCheckRow, sources: WebSearchResult[], now: Date): string {
  const corpus = sources.map((s) => ({ url: s.url, title: s.title, publisher: s.publisher, published_at: s.published_at, query: s.query, excerpt: s.content.slice(0, MAX_SOURCE_CHARS) }));
  return `Return exactly one GOLD_EDGE_CHECK_RESULT JSON. Current time: ${now.toISOString()}. Base cutoff: ${job.sourceWindowStart?.toISOString() ?? job.baseInformationCutoff.toISOString()}. Inherited state: ${JSON.stringify(job.inheritedState)}. This is a narrow falsification check, NEVER a Sunday Read or a technical trade decision. Material facts require post-cutoff evidence and direct linkage to a central assumption or recorded invalidation. Ignore normal price noise, opinions, rumor, syndication and already-known facts. Source hierarchy: official primary source, direct timestamped market data, recognized press attribution, then unconfirmed leads only. Distinguish observed fact, official declaration, journalistic attribution, inference and unknown. Never invent an URL, date, fact or causal mechanism; absence of proof is not confirmation. Every source URL must be from this corpus only: ${JSON.stringify(corpus)}. Result enum is EDGE_UNCHANGED, EDGE_INVALIDATED or REASSESSMENT_REQUIRED. EDGE_INVALIDATED requires material_change_detected true and an actually triggered recorded invalidation. Return all canonical fields with check_id ${job.id}, request_id ${job.requestId}, base_run_id ${job.baseRunId}, base_content_hash ${job.baseContentHash}, inherited_edge ${String(job.inheritedState.edge ?? job.requestPayload.inherited_edge)}, started_at and completed_at ISO timestamps, source window bounds, and expires_when_base_state_changes true.`;
}
function sourceUrls(value: Record<string, unknown>): string[] { return (value.sources as unknown[]).flatMap((s) => s && typeof s === "object" && typeof (s as Record<string, unknown>).url === "string" ? [(s as Record<string, unknown>).url as string] : []); }
export function validateAnalysis(job: EdgeCheckRow, value: unknown, corpus: WebSearchResult[]): Record<string, unknown> {
  const result = validateRunnerResult(job, value);
  const allowed = new Set(corpus.map((s) => s.url));
  if (sourceUrls(result).some((url) => !allowed.has(url))) throw new GoldEdgeRunnerError("INVENTED_SOURCE_URL");
  if (result.result === "EDGE_INVALIDATED" && !(result.triggered_invalidations as unknown[]).some((x) => strings(job.inheritedState.invalidations).includes(String(x)))) throw new GoldEdgeRunnerError("INVALIDATION_NOT_TRIGGERED");
  if (result.result === "REASSESSMENT_REQUIRED" && result.full_intermediate_recap_required !== true) throw new GoldEdgeRunnerError("CONTRADICTORY_RESULT");
  return result;
}
async function analyze(job: EdgeCheckRow, llm: CloudLLMProvider, search: WebSearchProvider): Promise<Record<string, unknown>> {
  const controller = new AbortController(); const timeout = setTimeout(() => controller.abort(), GLOBAL_TIMEOUT_MS);
  try {
    const queries = queryPlan(job);
    const found = (await Promise.all(queries.map((q) => search.search(q, 3, { timeRange: "day" })))).flat();
    const corpus = dedupe(found, (job.sourceWindowStart ?? job.baseInformationCutoff).getTime());
    if (!corpus.length) throw new GoldEdgeRunnerError("NO_USABLE_SOURCES");
    let raw = await llm.completeJson(prompt(job, corpus, new Date()), controller.signal);
    try { return validateAnalysis(job, raw, corpus); }
    catch { raw = await llm.completeJson(`Repair the following into the exact requested JSON without adding sources or facts: ${JSON.stringify(raw)}\n${prompt(job, corpus, new Date())}`, controller.signal); return validateAnalysis(job, raw, corpus); }
  } finally { clearTimeout(timeout); }
}
async function process(job: EdgeCheckRow): Promise<void> {
  const llm = createGroqLlmProvider("night"); const search = createTavilySearchProvider();
  if (!llm) { await failForRunner(job.id, workerId, "GROQ_NOT_CONFIGURED", "Gold edge analysis is unavailable."); return; }
  if (!search) { await failForRunner(job.id, workerId, "TAVILY_NOT_CONFIGURED", "Gold edge research is unavailable."); return; }
  const lease = setInterval(() => { void renewForRunner(job.id, workerId, LEASE_SECONDS); }, 60_000);
  try { const result = await analyze(job, llm, search); await submitForRunner(job.id, workerId, result); }
  catch (error) { const code = error instanceof GoldEdgeRunnerError ? error.code : error instanceof Error && error.message === "PROVIDER_LIMIT" ? "PROVIDER_LIMIT" : "ANALYSIS_FAILED"; await failForRunner(job.id, workerId, code, "Gold edge analysis could not be completed."); }
  finally { clearInterval(lease); }
}
export function wakeGoldEdgeCheckRunner(): Promise<void> {
  if (active) return active;
  active = (async () => { try { for (;;) { const job = await claimForRunner(workerId, LEASE_SECONDS); if (!job) return; await process(job); } } finally { active = null; } })();
  return active;
}
export function __resetGoldEdgeRunnerForTests(): void { active = null; }
