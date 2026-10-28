import { createCachedInterpretationReader } from "./cachedInterpretation";
import type { CanonicalFamilySnapshot, ClaimRecord, KpiInterpretation, Language, ResearchRun } from "@gold-terminal/contracts";
import { resolveAppSessionId } from "./appSessionId";
import { assertRealModeIsCoveredOrThrow, getDataMode } from "./dataMode";
import { KPI_FIXTURES } from "../mock/fixtures";
import {
  computeCockpitVisibleKpiIds,
  findKpiAcrossFamilies,
} from "./mockInterpretationGenerator";
import { KpiContextPackageBuilder } from "./contextPackageBuilder";
import { buildResearchRun } from "./research/coordinator";
import { buildRealResearchRun } from "./research/realCoordinator";
import { ConcurrencyLimiter } from "./concurrencyLimiter";
import { MAX_CONCURRENT_LLM_CALLS } from "./constants";
import { arePilotProvidersConfigured, isPilotKpi, REAL_INTELLIGENCE_PILOT_KPI_IDS } from "./realIntelligencePilot";
import { generateRealInterpretationForKpi } from "./realInterpretationGenerator";
import { getRealLlmCallCount } from "./providers/realCallAudit";
import {
  loadInterpretations,
  loadResearchRun,
  loadRealResearchRun,
  saveInterpretations,
  saveResearchRun,
  saveRealResearchRun,
  type InterpretationsById,
} from "./runtimeStore";
import { checkSession, writeSessionRecord } from "./sessionGuard";

export interface IntelligenceState {
  sessionId: string;
  dataMode: ReturnType<typeof getDataMode>;
  generatedAt: string;
  cockpitKpiIds: string[];
  /** Public cache lookup only: missing KPIs/languages never start generation. */
  getCachedInterpretation(kpiId: string, language?: Language): Promise<KpiInterpretation | null>;
  kpiExists(kpiId: string, families: CanonicalFamilySnapshot[]): boolean;
  /** Resolve only the evidence ids this interpretation actually references (Patch 6). */
  resolveEvidence(interpretation: KpiInterpretation): Record<string, ClaimRecord>;
}

/** Cache key for the per-(kpiId, language) interpretations map. */
function interpretationCacheKey(kpiId: string, language: Language): string {
  return `${kpiId}::${language}`;
}

/**
 * Boot-time session guard + startup analysis (Patch 3/10). If this is the
 * same logical APP_SESSION_ID as last run (hot reload, or a request within
 * the same run), reuse whatever is cached in .runtime/ instead of
 * re-running startup analysis. Otherwise run it fresh and persist. Async
 * because generation is routed through the Promise-based concurrency
 * limiter (mock generation is instant; real intelligence pilot generation
 * for the 5 pilot KPIs is genuinely async network I/O — see
 * realInterpretationGenerator.ts).
 */
export async function initializeIntelligence(bootFamilies: CanonicalFamilySnapshot[]): Promise<IntelligenceState> {
  const dataMode = getDataMode();
  assertRealModeIsCoveredOrThrow(); // hard, loud stop only for a fully-unconfigured REAL flip — see dataMode.ts

  const sessionId = resolveAppSessionId();
  const pilotReady = REAL_INTELLIGENCE_PILOT_KPI_IDS.every((kpiId) => arePilotProvidersConfigured(kpiId));
  const runtimeSignature = `${dataMode}:pilotReady=${pilotReady}`;
  const guard = checkSession(sessionId, runtimeSignature);
  const cockpitKpiIds = computeCockpitVisibleKpiIds(KPI_FIXTURES);

  let interpretations: InterpretationsById;
  let researchRun: ResearchRun;

  // Real intelligence pilot — a SEPARATE research run, scoped only to the
  // pilot KPIs' topics, built from REAL Tavily results (never merged into
  // the mock `researchRun` above, which every non-pilot KPI — and any pilot
  // KPI request that falls back to mock — keeps using unmodified). Built
  // once per process boot whenever REAL mode is on, independent of the
  // session guard below: fetching research is comparatively cheap/
  // unbilled-LLM, so it is not worth gating on "genuinely new session" the
  // same way real LLM generation must be — that gate (the actual cost
  // concern) is enforced by the session guard around eager LLM generation
  // further down, and by generateRealInterpretationForKpi's own per-call
  // accounting for the lazy path.
  const realResearchRun = dataMode === "REAL" && pilotReady
    ? guard.isNewSession
      ? await buildRealResearchRun(sessionId, REAL_INTELLIGENCE_PILOT_KPI_IDS)
      : loadRealResearchRun() ?? await buildRealResearchRun(sessionId, REAL_INTELLIGENCE_PILOT_KPI_IDS)
    : null;
  // Bounds TOTAL concurrent real provider calls across every pilot KPI
  // generated this process — a single shared limiter, never nested/
  // reentrant with itself (see realInterpretationGenerator.ts's doc
  // comment), so it cannot deadlock even with 5 pilot KPIs' analyst/
  // challenger/adjudicator calls all queued at once.
  const realLlmLimiter = new ConcurrencyLimiter(MAX_CONCURRENT_LLM_CALLS);

  if (guard.isNewSession) {
    console.log(
      `[gold-terminal-backend] New session (${sessionId}) — running startup KPI intelligence analysis for ` +
        `${cockpitKpiIds.length} cockpit-visible KPIs (dataMode=${dataMode}` +
        (dataMode === "REAL" ? `, real pilot=[${REAL_INTELLIGENCE_PILOT_KPI_IDS.join(", ")}]` : "") +
        `).`
    );
    const previousInterpretations = loadInterpretations(); // continuity: last session's reads, if any
    researchRun = buildResearchRun(sessionId);

    const mockBuilder = new KpiContextPackageBuilder({ allFamilies: bootFamilies, researchRun, previousInterpretations });
    const realBuilder = realResearchRun
      ? new KpiContextPackageBuilder({ allFamilies: bootFamilies, researchRun: realResearchRun, previousInterpretations })
      : null;

    // Eager boot generation always runs in English (the default output
    // language) — French (or any future non-default language) is generated
    // lazily on first request, same as any deep/event-tier KPI.
    const entries = await Promise.all(
      cockpitKpiIds.map((kpiId) =>
        resolveInterpretation(kpiId, "EN", { dataMode, mockBuilder, realBuilder, realLlmLimiter, sessionId }).then(
          (interpretation) => [kpiId, interpretation] as const
        )
      )
    );
    interpretations = {};
    for (const [kpiId, interpretation] of entries) {
      if (interpretation) interpretations[interpretationCacheKey(kpiId, "EN")] = interpretation;
    }

    if (dataMode === "REAL") {
      console.log(
        `[gold-terminal-backend] Real intelligence pilot: ${getRealLlmCallCount()} real LLM call(s) made this boot ` +
          `across the pilot KPI set.`
      );
    }

    saveResearchRun(researchRun);
    if (realResearchRun) saveRealResearchRun(realResearchRun);
    saveInterpretations(interpretations);
    writeSessionRecord(sessionId, new Date().toISOString(), runtimeSignature);
  } else {
    console.log(
      `[gold-terminal-backend] Same session (${sessionId}) as last boot — reusing cached .runtime/ intelligence, ` +
        `not re-running startup analysis.`
    );
    researchRun = loadResearchRun() ?? buildResearchRun(sessionId);
    interpretations = loadInterpretations();
  }

  // "family:F2"-shaped composite ids (see onDemandAnalysis.ts's
  // family-level on-demand analysis) are never real KPI ids — they exist
  // only for the on-demand-analysis route pair, so they pass this
  // existence check by looking up the referenced family instead of a KPI.
  function kpiExists(kpiId: string, families: CanonicalFamilySnapshot[]): boolean {
    if (kpiId.startsWith("family:")) {
      const familyId = kpiId.slice("family:".length);
      return families.some((f) => f.familyId === familyId);
    }
    return findKpiAcrossFamilies(families, kpiId) !== null;
  }

  const getCachedInterpretation = createCachedInterpretationReader(interpretations);

  function resolveEvidence(interpretation: KpiInterpretation): Record<string, ClaimRecord> {
    const ids = new Set([
      ...interpretation.supportingEvidenceIds,
      ...interpretation.contradictingEvidenceIds,
      ...interpretation.relevantRecentDevelopmentIds,
      ...interpretation.researchSourceIds,
    ]);
    const resolved: Record<string, ClaimRecord> = {};
    for (const id of ids) {
      // A real pilot KPI's evidence ids live in realResearchRun's store, a
      // mock KPI's in the ordinary mock researchRun — check both rather
      // than assuming which one produced a given interpretation.
      const claim = researchRun.evidenceById[id] ?? realResearchRun?.evidenceById[id];
      if (claim) resolved[id] = claim;
    }
    return resolved;
  }

  return {
    sessionId,
    dataMode,
    generatedAt: new Date().toISOString(),
    cockpitKpiIds,
    getCachedInterpretation,
    kpiExists,
    resolveEvidence,
  };
}

interface ResolveInterpretationDeps {
  dataMode: ReturnType<typeof getDataMode>;
  mockBuilder: KpiContextPackageBuilder;
  realBuilder: KpiContextPackageBuilder | null;
  realLlmLimiter: ConcurrencyLimiter;
  sessionId: string;
}

/**
 * The single, explicit real/mock routing decision point (pilot spec section
 * 3): REAL for a KPI only when dataMode is REAL, the KPI id is in the pilot
 * set, AND every real provider its policy needs is actually configured —
 * otherwise mock, unconditionally. Once real is attempted, a validation
 * failure or thrown error resolves to null (the existing "unavailable" UI
 * state) — this function NEVER falls back to mock content for a KPI it
 * already decided to treat as real, so a KPI's interpretation is always
 * either fully mock or fully real, never a silent mix.
 */
async function resolveInterpretation(
  kpiId: string,
  language: Language,
  deps: ResolveInterpretationDeps
): Promise<KpiInterpretation | null> {
  if (deps.dataMode === "REAL" && deps.realBuilder && isPilotKpi(kpiId) && arePilotProvidersConfigured(kpiId)) {
    return generateRealInterpretationForKpi(kpiId, { builder: deps.realBuilder, sessionId: deps.sessionId, limiter: deps.realLlmLimiter }, language);
  }
  // No authored/dev interpretation is allowed to stand in for absent real analysis.
  return null;
}
