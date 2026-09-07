import type { CanonicalFamilySnapshot, GlobalReadAnalysisResponse, GlobalReadInterpretation, Language } from "@gold-terminal/contracts";
import { isRealLlmProviderConfigured } from "./providers/realLlmProviderRegistry";
import { loadGlobalReads, saveGlobalReads, type GlobalReadByLanguage } from "./runtimeStore";
import { buildGlobalReadRebuildDecision, GLOBAL_READ_REBUILD_VERSION } from "./globalRead/rebuildPipeline";
import { loadLatestGlobalReadRun, saveGlobalReadRun } from "../db/globalReadRuns";

// Manual only; every explicit click creates a fresh information set. The only
// deduplication is the in-flight lock below, which prevents concurrent runs.
let cachedReads: GlobalReadByLanguage | null = null;
let running = false;
function cache(): GlobalReadByLanguage { return cachedReads ?? (cachedReads = loadGlobalReads()); }
function configured() { return (["claude-cli", "codex-cli"] as const).filter(isRealLlmProviderConfigured); }

export function historicalGlobalRead(report: GlobalReadInterpretation): GlobalReadInterpretation {
  if (!report.decision) return report;
  return { ...report, decision: { ...report.decision, decisionUse: "HISTORICAL_ONLY", readiness: "NO_OPPORTUNITY",
    rebuild: report.decision.rebuild ? { ...report.decision.rebuild, operationalAction: "NO_CLEAN_EDGE" } : undefined,
    warnings: [...report.decision.warnings, "Historical snapshot only: current data and catalysts have not been revalidated."],
    blockers: [...report.decision.blockers, { code: "HISTORICAL_SNAPSHOT", detail: "Cached analysis is not current trade permission.", recoverable: false, resolver: null }] } };
}

export function getCachedGlobalRead(language: Language): GlobalReadAnalysisResponse {
  const stored = cache()[language];
  const current = stored?.decision?.methodVersion === GLOBAL_READ_REBUILD_VERSION ? historicalGlobalRead(stored) : null;
  return { status: current ? "OK" : "NONE", interpretation: current,
    message: stored && !current ? "Legacy Global Read predates evidence verification. Run a new analysis." : null,
    configuredProviderCount: configured().length, cooldownRemainingMs: null };
}

export interface GlobalReadDeps { allFamilies: CanonicalFamilySnapshot[]; sessionId: string }

export async function runGlobalReadAnalysis(language: Language, deps: GlobalReadDeps): Promise<GlobalReadAnalysisResponse> {
  const providers = configured();
  if (providers.length < 1) return { status: "NOT_CONFIGURED", interpretation: getCachedGlobalRead(language).interpretation, message: "Both interpretation agents are unavailable. Data can refresh, but no new interpreted Global Read can be produced.", configuredProviderCount: providers.length, cooldownRemainingMs: null };
  if (running) return { status: "COOLDOWN", interpretation: getCachedGlobalRead(language).interpretation, message: "A Global Read is already running. No duplicate CLI call was started.", configuredProviderCount: providers.length, cooldownRemainingMs: null };
  const stored = cache()[language];
  running = true;
  try {
    const previous = stored?.decision ?? await loadLatestGlobalReadRun(language);
    let decision = await buildGlobalReadRebuildDecision(deps.allFamilies, language, providers, previous);
    if (!await saveGlobalReadRun(decision, language)) decision = { ...decision, warnings: [...decision.warnings, "Durable audit storage failed. The displayed audit exists only in the session cache; apply database migration 003."] };
    // Legacy fields remain empty only for response compatibility while the rebuild UI reads `decision.rebuild`.
    const interpretation: GlobalReadInterpretation = { decision, interpretationAnalyzedAt: decision.asOf, language, sessionId: deps.sessionId, isMock: false,
      blockReadings: [], componentDeepDives: [], dataVerificationNotes: "See rebuild evidence audit", competingHypotheses: [], dominantDriver: decision.marginalDriver,
      independenceTestNotes: providers.length > 1 ? "Two independent analyses followed by bounded cross-examination" : "Unilateral analysis: the second interpretation agent was unavailable and no debate was simulated.", contradictions: decision.rebuild?.disputedPoints ?? [], adversarialCase: "See adverse scenario",
      horizonVerdicts: [], asymmetry: { combinedNotes: "No legacy score", verdict: "WEAK" }, auditTrail: { agentOutputs: [], modelAgreement: "SINGLE_ANALYST" } };
    cachedReads = { ...cache(), [language]: interpretation };
    saveGlobalReads(cachedReads);
    return { status: "OK", interpretation, message: null, configuredProviderCount: providers.length, cooldownRemainingMs: null };
  } catch {
    return { status: "UNAVAILABLE", interpretation: getCachedGlobalRead(language).interpretation, message: "Global Read failed. Previous analysis, if shown, is historical only. No automatic retry was started.", configuredProviderCount: providers.length, cooldownRemainingMs: null };
  } finally { running = false; }
}
export function __resetGlobalReadStateForTests(): void { cachedReads = {}; running = false; }
