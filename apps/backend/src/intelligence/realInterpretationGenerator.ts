import type {
  AnalystConclusion,
  CanonicalKpi,
  ChallengeFinding,
  ClaimRecord,
  DisplayRelationship,
  FamilyId,
  GoldRelationshipState,
  KpiInterpretation,
  Language,
} from "@gold-terminal/contracts";
import { ConcurrencyLimiter } from "./concurrencyLimiter";
import type { KpiContextPackageBuilder } from "./contextPackageBuilder";
import { computeModelAgreement } from "./ensemble/runAdjudicator";
import { policyForKpi } from "./ensemble/policies";
import { REAL_ANALYSIS_POLICY_ASSIGNMENTS, type RealPolicyAssignment } from "./ensemble/realPolicies";
import { buildContextSummary } from "./providers/promptContext";
import { buildFamilyContextSummary } from "./providers/familyPromptContext";
import { getRealLlmProvider } from "./providers/realLlmProviderRegistry";
import { validateInterpretation } from "./validateInterpretation";

// Real intelligence pilot — the real-provider counterpart of
// mockInterpretationGenerator.ts's `buildInterpretation`, for the 5 pilot
// KPIs only. See docs/KPI_INTELLIGENCE_ARCHITECTURE.md's "Real intelligence
// pilot" section for the full rationale. Structurally mirrors the mock
// pipeline's stages (independent analysts -> optional challenge -> single
// adjudicator) exactly, so the two pipelines stay comparable, but every
// stage is a REAL network call to a REAL provider instead of hand-authored
// fixture content.
//
// Safety invariants enforced here (see section 5 of the pilot spec):
//  - mechanicalRelationship is copied read-only from canonical data and the
//    adjudicator's finalGoldRead suggestion is DISCARDED for mechanical
//    KPIs, exactly mirroring runAdjudicator.ts's rule 1 — never overridden
//    by a real LLM call either.
//  - Every real response is run through validateInterpretation.ts before
//    being accepted. A response that fails validation is NOT coerced into
//    passing — this function returns null, which the caller
//    (bootstrap.ts's resolveInterpretation) surfaces as "no interpretation
//    available" (the existing "unavailable" UI state), never a silent mock
//    substitution.
//  - Each real provider call already retries once internally
//    (llmProvider.ts's withOneRetry) before throwing; a thrown error here
//    is caught and likewise resolves to null, never partial-real content.
//  - isMock is always false on a value actually returned from this
//    function.

const PROMPT_VERSION = "real-v1";

function deriveMechanicalDisplayRelationship(relationship: GoldRelationshipState): DisplayRelationship {
  if (relationship === "support") return "SUPPORTIVE";
  if (relationship === "adverse") return "ADVERSE";
  throw new Error(`deriveMechanicalDisplayRelationship called on a non-mechanical relationship: ${relationship}`);
}

function computeEvidenceLatestPublishedAt(claims: ClaimRecord[]): string | null {
  let latest: string | null = null;
  for (const claim of claims) {
    if (!claim.source.publishedAt) continue;
    if (latest === null || new Date(claim.source.publishedAt).getTime() > new Date(latest).getTime()) {
      latest = claim.source.publishedAt;
    }
  }
  return latest;
}

export interface RealGenerationDeps {
  builder: KpiContextPackageBuilder;
  sessionId: string;
  /** Bounds TOTAL concurrent real provider calls across every pilot KPI generated this batch — never per-KPI, to avoid a nested/self-blocking limiter (see bootstrap.ts). */
  limiter: ConcurrencyLimiter;
  /**
   * On-demand per-KPI analysis (onDemandAnalysis.ts) override — when
   * present, this exact provider assignment is used instead of the fixed,
   * all-or-nothing `REAL_ANALYSIS_POLICY_ASSIGNMENTS[policy]` the startup
   * pilot uses. Lets on-demand analysis run gracefully with whichever
   * subset (1, 2, or 3) of the real LLM providers is actually configured —
   * see ensemble/realPolicies.ts's `buildAvailablePolicyAssignment`. Left
   * undefined, behavior is byte-for-byte identical to before this option
   * existed.
   */
  assignmentOverride?: RealPolicyAssignment;
}

interface EnsembleRunInput {
  /** The single-KPI subject, or a synthetic family-level stand-in (see generateRealInterpretationForFamily below) — either way, this is what `kpiId`/`familyId`/`dataAsOf` on the resulting KpiInterpretation are read from. */
  kpi: CanonicalKpi;
  contextSummary: string;
  claims: ClaimRecord[];
  previousInterpretation: KpiInterpretation | null;
  policy: ReturnType<typeof policyForKpi>;
  assignment: RealPolicyAssignment;
  language: Language;
  sessionId: string;
  limiter: ConcurrencyLimiter;
  isMechanical: boolean;
  mechanicalRelationship: GoldRelationshipState | null;
  mechanicalFinalGoldRead: DisplayRelationship | null;
}

/**
 * The actual multi-provider ensemble call (independent analysts -> optional
 * challenge -> adjudicator -> validate), shared verbatim by the single-KPI
 * path (`generateRealInterpretationForKpi`) and the family-level path
 * (`generateRealInterpretationForFamily`) below — extracted so the two never
 * drift on safety invariants (mechanical-relationship read-only override,
 * validateInterpretation gating, no-mock-fallback-on-failure).
 */
async function runRealEnsemble(input: EnsembleRunInput): Promise<KpiInterpretation | null> {
  const { kpi, contextSummary, claims, previousInterpretation, policy, assignment, language, sessionId, limiter, isMechanical, mechanicalRelationship, mechanicalFinalGoldRead } = input;
  const baseFinalGoldRead: DisplayRelationship = mechanicalFinalGoldRead ?? "CONTEXTUAL";

  try {
    const analystConclusions: AnalystConclusion[] = await Promise.all(
      assignment.analysts.map((a) =>
        limiter.run(async () => {
          const provider = getRealLlmProvider(a.providerId);
          const result = await provider.generateAnalystConclusion({
            role: a.role,
            kpi,
            contextSummary,
            baseFinalGoldRead,
            language,
          });
          const conclusion: AnalystConclusion = {
            role: a.role,
            modelIdentity: { provider: provider.id, model: provider.model, promptVersion: PROMPT_VERSION },
            finalGoldRead: result.finalGoldRead,
            shortConclusion: result.shortConclusion,
            keyPoints: result.keyPoints,
            dataVerification: result.dataVerification,
          };
          return conclusion;
        })
      )
    );

    let challengeFindings: ChallengeFinding[] = [];
    if (assignment.challengerProviderId) {
      const challengerId = assignment.challengerProviderId;
      const result = await limiter.run(() => {
        const provider = getRealLlmProvider(challengerId);
        return provider.generateChallengeFindings({ kpi, contextSummary, analystConclusions, language });
      });
      challengeFindings = result.findings;
    }

    const adjudication = await limiter.run(() => {
      const provider = getRealLlmProvider(assignment.adjudicatorProviderId);
      return provider.generateAdjudication({
        kpi,
        contextSummary,
        analystConclusions,
        challengeFindings,
        mechanicalRelationship,
        mechanicalFinalGoldRead,
        previousInterpretation,
        language,
      });
    });

    const adjudicatorProvider = getRealLlmProvider(assignment.adjudicatorProviderId);

    // Rule 1 (never silently overwritten): for a MECHANICAL_RULE KPI, the
    // real adjudicator's finalGoldRead suggestion is discarded in favor of
    // the canonical mapping — exactly mirroring runAdjudicator.ts.
    const finalGoldRead: DisplayRelationship =
      mechanicalRelationship !== null && mechanicalFinalGoldRead !== null ? mechanicalFinalGoldRead : adjudication.finalGoldRead;

    const modelAgreement = computeModelAgreement(analystConclusions);

    const supportingEvidenceIds = claims.filter((c) => c.verificationState !== "DISPUTED").map((c) => c.id);
    const contradictingEvidenceIds = claims.filter((c) => c.verificationState === "DISPUTED").map((c) => c.id);
    const researchSourceIds = claims.map((c) => c.id);

    const nowIso = new Date().toISOString();

    const draft: KpiInterpretation = {
      kpiId: kpi.id,
      familyId: kpi.familyId,
      interpretationAnalyzedAt: nowIso,
      dataAsOf: kpi.observationAt,
      evidenceLatestPublishedAt: computeEvidenceLatestPublishedAt(claims),
      language,
      currentReadShort: adjudication.currentReadShort,
      currentReadDetailed: adjudication.currentReadDetailed,
      previousReadSummary: adjudication.previousReadSummary,
      whatChangedSincePreviousRead: adjudication.whatChangedSincePreviousRead,
      currentRead: adjudication.currentRead,
      relationshipBasis: isMechanical ? "MECHANICAL_RULE" : "CONTEXTUAL_AI",
      mechanicalRelationship,
      finalGoldRead,
      whyNow: adjudication.whyNow,
      causalChain: adjudication.causalChain,
      supportingEvidenceIds,
      contradictingEvidenceIds,
      uncertaintyOrUnknowns: adjudication.uncertaintyOrUnknowns,
      whatWouldStrengthen: adjudication.whatWouldStrengthen,
      whatWouldWeakenOrInvalidate: adjudication.whatWouldWeakenOrInvalidate,
      relevantRecentDevelopmentIds: researchSourceIds,
      researchSourceIds,
      evidenceState: adjudication.evidenceState,
      modelIdentity: { provider: adjudicatorProvider.id, model: adjudicatorProvider.model },
      promptVersion: PROMPT_VERSION,
      isMock: false,
      sessionId,
      auditTrail: {
        policy,
        analystConclusions,
        challengeFindings,
        modelAgreement,
        adjudicatorNotes: adjudication.adjudicatorNotes,
      },
    };

    const { valid, sanitized, issues } = validateInterpretation(draft);
    if (!valid) {
      console.error(
        JSON.stringify({
          msg: "real intelligence interpretation failed schema validation — discarding, marking KPI unavailable this run",
          kpiId: kpi.id,
          language,
          issues,
        })
      );
      return null;
    }
    return sanitized;
  } catch (err) {
    console.error(
      JSON.stringify({
        msg: "real intelligence generation failed for this KPI — marking unavailable this run, no mock fallback",
        kpiId: kpi.id,
        language,
        error: err instanceof Error ? err.message : String(err),
      })
    );
    return null;
  }
}

/**
 * Generate one pilot KPI's interpretation via the REAL ensemble pipeline.
 * Returns null (never mock content) if the context package can't be built,
 * any real call fails after its retry, or the assembled result fails
 * validateInterpretation.ts.
 */
export async function generateRealInterpretationForKpi(
  kpiId: string,
  deps: RealGenerationDeps,
  language: Language
): Promise<KpiInterpretation | null> {
  const ctx = deps.builder.build(kpiId, language);
  if (!ctx) return null;

  const { kpi } = ctx;
  const isMechanical = kpi.relationship !== "neutral";
  const mechanicalRelationship: GoldRelationshipState | null = isMechanical ? kpi.relationship : null;
  const mechanicalFinalGoldRead: DisplayRelationship | null = isMechanical
    ? deriveMechanicalDisplayRelationship(kpi.relationship)
    : null;

  const policy = policyForKpi(kpiId);
  const assignment = deps.assignmentOverride ?? REAL_ANALYSIS_POLICY_ASSIGNMENTS[policy];

  return runRealEnsemble({
    kpi,
    contextSummary: buildContextSummary(ctx),
    claims: ctx.claims,
    previousInterpretation: ctx.previousInterpretation,
    policy,
    assignment,
    language,
    sessionId: deps.sessionId,
    limiter: deps.limiter,
    isMechanical,
    mechanicalRelationship,
    mechanicalFinalGoldRead,
  });
}

export interface FamilyGenerationDeps {
  /** Every cockpit-visible KPI belonging to this family — the whole point of this path is to reason about them TOGETHER, never in isolation. */
  kpis: CanonicalKpi[];
  familyId: FamilyId;
  familyLabel: string;
  claims: ClaimRecord[];
  previousInterpretation: KpiInterpretation | null;
  sessionId: string;
  limiter: ConcurrencyLimiter;
  assignment: RealPolicyAssignment;
}

/**
 * User-explicit request: a family-scoped real analysis that explains how a
 * family's own KPIs relate to/reinforce/contradict EACH OTHER (see
 * providers/familyPromptContext.ts's explicit linking instruction), rather
 * than the on-demand button's usual single-KPI-in-isolation scope
 * (onDemandAnalysis.ts). Deliberately NOT a cross-family/global Gold
 * synthesis — strictly the KPIs within one family — which stays a
 * separate, not-yet-built feature per the product owner's own stated
 * distinction.
 *
 * Modeled as a synthetic `CanonicalKpi` whose id is `family:${familyId}` so
 * it flows through the exact same `runRealEnsemble`/`validateInterpretation`
 * safety machinery as a real KPI, with zero duplicated logic. Always
 * CONTEXTUAL_AI (never MECHANICAL_RULE) — no single fixed mechanical rule
 * can span an entire family of KPIs by construction.
 */
export async function generateRealInterpretationForFamily(
  deps: FamilyGenerationDeps,
  language: Language
): Promise<KpiInterpretation | null> {
  const syntheticKpi: CanonicalKpi = {
    id: `family:${deps.familyId}`,
    familyId: deps.familyId,
    label: deps.familyLabel,
    value: null,
    unit: null,
    decimals: 0,
    relationship: "neutral",
    driverSummary: null,
    provenance: "derived",
    quality: "current",
    dataState: "REAL",
    sourceTag: "FAMILY_LINK_ANALYSIS",
    observationAt: new Date().toISOString(),
    retrievedAt: new Date().toISOString(),
    visibility: "cockpit",
  };

  return runRealEnsemble({
    kpi: syntheticKpi,
    contextSummary: buildFamilyContextSummary(deps.familyId, deps.familyLabel, deps.kpis, deps.claims),
    claims: deps.claims,
    previousInterpretation: deps.previousInterpretation,
    policy: "STANDARD",
    assignment: deps.assignment,
    language,
    sessionId: deps.sessionId,
    limiter: deps.limiter,
    isMechanical: false,
    mechanicalRelationship: null,
    mechanicalFinalGoldRead: null,
  });
}
