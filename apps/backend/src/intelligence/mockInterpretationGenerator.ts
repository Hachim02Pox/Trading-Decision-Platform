import type {
  CanonicalFamilySnapshot,
  CanonicalKpi,
  ClaimRecord,
  DisplayRelationship,
  EvidenceState,
  KpiInterpretation,
  Language,
  RelationshipBasis,
} from "@gold-terminal/contracts";
import { ConcurrencyLimiter } from "./concurrencyLimiter";
import { MAX_CONCURRENT_LLM_CALLS } from "./constants";
import { KpiContextPackageBuilder, type ContextPackageBuilderInputs, type KpiContextPackage } from "./contextPackageBuilder";
import { validateInterpretation } from "./validateInterpretation";
import {
  MOCK_SCENARIOS,
  genericFallbackScenario,
  resolveScenarioContent,
  resolveAnalystConclusions,
  resolveChallengeFindings,
  resolveContinuity,
  type MockScenario,
} from "./mockScenarios";
import { policyForKpi } from "./ensemble/policies";
import { runIndependentAnalysts } from "./ensemble/runIndependentAnalysts";
import { runChallenge } from "./ensemble/runChallenge";
import { runAdjudicator } from "./ensemble/runAdjudicator";

// ---------------------------------------------------------------------------
// Patch 10 — automatic scope: exactly one KpiInterpretation for every
// cockpit-visible KPI across every remaining family, computed
// programmatically by filtering KPI_FIXTURES for visibility === "cockpit".
// (F1's former "Gold cannot be a causal input to itself" exemption, Patch
// 12, is moot now that F1 has been removed from the product entirely — see
// docs/MVP_COCKPIT_CONTRACT.md's top-of-file note.) Deep/event-tier KPIs
// are handled lazily by `generateInterpretationForKpi` on first request,
// never eagerly here.
//
// Milestone 1D — every interpretation is now produced by the (mock)
// multi-model ensemble pipeline in ./ensemble/, in the requested
// `Language`. See docs/KPI_INTELLIGENCE_ARCHITECTURE.md section (d).
// ---------------------------------------------------------------------------

export function computeCockpitVisibleKpiIds(
  kpiFixtures: readonly Pick<CanonicalKpi, "id" | "familyId" | "visibility">[]
): string[] {
  return kpiFixtures.filter((k) => k.visibility === "cockpit").map((k) => k.id);
}

const DEFAULT_MODEL_IDENTITY = { provider: "mock", model: "dev-fixture-v1" };
const PROMPT_VERSION = "v1";

function resolveMockScenario(kpi: CanonicalKpi): MockScenario {
  return MOCK_SCENARIOS[kpi.id] ?? genericFallbackScenario(kpi);
}

/**
 * Evidence freshness: the most recent `source.publishedAt` among the claims
 * actually consulted for this interpretation, or `null` if none carry a
 * date (e.g. a purely mechanical read with no research attached). Kept
 * independent of `dataAsOf` (the KPI's own observation timestamp) and
 * `interpretationAnalyzedAt` (when this interpretation was computed) — see
 * docs/KPI_INTELLIGENCE_ARCHITECTURE.md's three-timestamp model.
 */
function computeEvidenceLatestPublishedAt(claims: ClaimRecord[]): string | null {
  let latest: string | null = null;
  for (const claim of claims) {
    const publishedAt = claim.source.publishedAt;
    if (!publishedAt) continue;
    if (latest === null || new Date(publishedAt).getTime() > new Date(latest).getTime()) {
      latest = publishedAt;
    }
  }
  return latest;
}

function buildInterpretation(
  kpi: CanonicalKpi,
  ctx: KpiContextPackage,
  sessionId: string,
  nowIso: string,
  language: Language
): KpiInterpretation {
  const isMechanical = kpi.mechanicalGoldRead !== "CONTEXTUAL";
  const relationshipBasis: RelationshipBasis = isMechanical ? "MECHANICAL_RULE" : "CONTEXTUAL_AI";
  // mechanicalGoldRead is copied verbatim, read-only, from canonical data —
  // NEVER written or altered by the analyst/adjudicator layer below.
  const mechanicalGoldRead = kpi.mechanicalGoldRead;

  const scenario = resolveMockScenario(kpi);
  const content = resolveScenarioContent(scenario, language);
  // French-translation-completeness fix: the multi-model audit trail
  // (analyst/challenge synthesis) previously always drew on the English
  // scenario content regardless of `?lang=`, which is the exact gap this
  // pass fixes — every hand-authored analystConclusions/challengeFindings
  // entry is now itself authored per-language (see mockScenarios.ts's
  // BilingualAnalystConclusions/BilingualChallengeFindings), and the
  // generically-synthesized hedge text below now derives from the
  // requested language's own whyNow/causalChain content, never a hardcoded
  // "EN". See docs/KPI_INTELLIGENCE_ARCHITECTURE.md section 19.
  const auditContent = content;

  const supportingEvidenceIds = ctx.claims.filter((c) => c.verificationState !== "DISPUTED").map((c) => c.id);
  const contradictingEvidenceIds = ctx.claims.filter((c) => c.verificationState === "DISPUTED").map((c) => c.id);
  const researchSourceIds = ctx.claims.map((c) => c.id);
  const evidenceLatestPublishedAt = computeEvidenceLatestPublishedAt(ctx.claims);

  const policy = policyForKpi(kpi.id);
  const baseFinalGoldRead: DisplayRelationship = isMechanical
    ? mechanicalGoldRead
    : scenario.contextualFinalGoldRead ?? "CONTEXTUAL";

  const analystConclusions = runIndependentAnalysts({
    policy,
    baseFinalGoldRead,
    scenario: auditContent,
    evidenceIsLimited: scenario.evidenceState === "LIMITED",
    language,
    explicit: resolveAnalystConclusions(scenario, language),
  });

  const challengeFindings =
    policy === "HIGH_SCRUTINY" ? runChallenge(analystConclusions, resolveChallengeFindings(scenario, language), language) : [];

  const { finalGoldRead, evidenceState, auditTrail } = runAdjudicator({
    policy,
    language,
    mechanicalGoldRead,
    forceContextualDespiteMechanical: scenario.forceContextualDespiteMechanical ?? false,
    scenarioEvidenceState: scenario.evidenceState,
    hasContradictingEvidence: contradictingEvidenceIds.length > 0,
    analystConclusions,
    challengeFindings,
  });

  // Continuity narrative (Part B): supplied as CONTEXT for identifying what
  // changed, never as an anchor the new read must stay consistent with —
  // see runAdjudicator.ts's PREVIOUS_INTERPRETATION_CONTEXT_RULE and
  // docs/KPI_INTELLIGENCE_ARCHITECTURE.md. Only the illustrative KPI(s)
  // carrying a hand-authored `continuity` block tell a concrete
  // previous-vs-current story; every other KPI honestly reports "first
  // analysis this session, no prior read to compare" via null summaries,
  // with `currentRead` (always non-null) falling back to the standalone
  // one-sentence read since there is nothing yet to reconcile it against.
  const continuity = resolveContinuity(scenario, language);
  const previousReadSummary = continuity?.previousReadSummary ?? null;
  const whatChangedSincePreviousRead = continuity?.whatChangedSincePreviousRead ?? null;
  const currentRead = continuity?.currentRead ?? content.currentReadShort;

  return {
    kpiId: kpi.id,
    familyId: kpi.familyId,
    interpretationAnalyzedAt: nowIso,
    dataAsOf: kpi.observationAt,
    evidenceLatestPublishedAt,
    comparison: {
      previous: kpi.previousFetch ?? null,
      current: { value: kpi.value, unit: kpi.unit, observationAt: kpi.observationAt, retrievedAt: kpi.retrievedAt },
    },
    language,
    currentReadShort: content.currentReadShort,
    currentReadDetailed: content.currentReadDetailed,
    previousReadSummary,
    whatChangedSincePreviousRead,
    currentRead,
    relationshipBasis,
    mechanicalGoldRead,
    finalGoldRead,
    whyNow: content.whyNow,
    causalChain: content.causalChain,
    supportingEvidenceIds,
    contradictingEvidenceIds,
    uncertaintyOrUnknowns: content.uncertaintyOrUnknowns,
    whatWouldStrengthen: content.whatWouldStrengthen,
    whatWouldWeakenOrInvalidate: content.whatWouldWeakenOrInvalidate,
    relevantRecentDevelopmentIds: researchSourceIds,
    researchSourceIds,
    evidenceState: evidenceState as EvidenceState,
    modelIdentity: DEFAULT_MODEL_IDENTITY,
    promptVersion: PROMPT_VERSION,
    isMock: true,
    sessionId,
    auditTrail,
  };
}

export interface GenerateForKpiDeps {
  builder: KpiContextPackageBuilder;
  sessionId: string;
}

/** Generate (or lazily regenerate) a single KPI's interpretation, in the requested language. Used for both the eager cockpit batch and the lazy deep/event path. */
export function generateInterpretationForKpi(
  kpiId: string,
  deps: GenerateForKpiDeps,
  language: Language = "EN"
): KpiInterpretation | null {
  const ctx = deps.builder.build(kpiId, language);
  if (!ctx) return null;

  const nowIso = new Date().toISOString();
  const draft = buildInterpretation(ctx.kpi, ctx, deps.sessionId, nowIso, language);

  const { sanitized } = validateInterpretation(draft);
  return sanitized;
}

/**
 * Eagerly generate interpretations for every cockpit-visible KPI (Patch 10),
 * routed through a bounded concurrency limiter (Patch 10's structural
 * placeholder — today's mock generation is synchronous/instant, but a
 * future real-LLM implementation must not fire dozens of simultaneous
 * calls). Boot-time eager generation always runs in English — a non-default
 * language is generated lazily on first request (see bootstrap.ts).
 */
export async function generateCockpitInterpretations(
  cockpitKpiIds: string[],
  builderInputs: ContextPackageBuilderInputs,
  sessionId: string,
  language: Language = "EN"
): Promise<Record<string, KpiInterpretation>> {
  const builder = new KpiContextPackageBuilder(builderInputs);
  const limiter = new ConcurrencyLimiter(MAX_CONCURRENT_LLM_CALLS);

  const entries = await Promise.all(
    cockpitKpiIds.map((kpiId) =>
      limiter.run(() => {
        const interpretation = generateInterpretationForKpi(kpiId, { builder, sessionId }, language);
        return [kpiId, interpretation] as const;
      })
    )
  );

  const result: Record<string, KpiInterpretation> = {};
  for (const [kpiId, interpretation] of entries) {
    if (interpretation) result[kpiId] = interpretation;
  }
  return result;
}

export function findKpiAcrossFamilies(families: CanonicalFamilySnapshot[], kpiId: string): CanonicalKpi | null {
  for (const family of families) {
    const found = family.kpis.find((k) => k.id === kpiId);
    if (found) return found;
  }
  return null;
}
