import type { AnalysisPolicy } from "@gold-terminal/contracts";
import type { RealLlmProviderId } from "../providers/llmProvider";

// Real intelligence pilot — REAL provider assignment per ensemble role,
// parallel to (and deliberately NOT modifying) the mock `ANALYSIS_POLICIES`
// in ./policies.ts. Kept as a separate structure so a KPI's `isMock: true`
// mock interpretation NEVER carries a real provider's name in its
// `modelIdentity`/`auditTrail` — the mock pipeline's `ModelRoleIdentity`
// entries (ANALYST_A/B/C, CHALLENGER, ADJUDICATOR in policies.ts) stay
// exactly the `"mock"` placeholders they always were, completely untouched,
// for every KPI including the 5 pilot ones whenever real generation isn't
// actually used for a given request (REAL mode off, or a required real
// provider not configured — see realIntelligencePilot.ts).
//
// Every pilot KPI today resolves to HIGH_SCRUTINY (the 5 pilot ids are
// exactly the pre-existing HIGH_SCRUTINY_KPI_IDS set), so this is what
// actually runs: 3 independent analysts on 3 DIFFERENT providers, a
// challenger, and an adjudicator — directly fulfilling the "model-agnostic,
// can mix providers" architecture already designed. STANDARD is defined
// too so the pilot can be trivially extended later to a KPI whose policy is
// STANDARD without needing a new assignment authored first.

export interface RealAnalystRoleAssignment {
  role: "A" | "B" | "C";
  providerId: RealLlmProviderId;
}

export interface RealPolicyAssignment {
  analysts: RealAnalystRoleAssignment[];
  /** null under STANDARD — no challenge stage runs, same as the mock pipeline. */
  challengerProviderId: RealLlmProviderId | null;
  adjudicatorProviderId: RealLlmProviderId;
}

export const REAL_ANALYSIS_POLICY_ASSIGNMENTS: Record<AnalysisPolicy, RealPolicyAssignment> = {
  STANDARD: {
    analysts: [
      { role: "A", providerId: "openai" },
      { role: "B", providerId: "anthropic" },
    ],
    challengerProviderId: null,
    adjudicatorProviderId: "gemini",
  },
  HIGH_SCRUTINY: {
    analysts: [
      { role: "A", providerId: "openai" },
      { role: "B", providerId: "anthropic" },
      { role: "C", providerId: "gemini" },
    ],
    challengerProviderId: "anthropic",
    adjudicatorProviderId: "gemini",
  },
};

/** Every distinct real provider id a given policy's full pipeline actually calls — used to pre-flight-check configuration before attempting any real call. */
export function realProviderIdsForPolicy(policy: AnalysisPolicy): RealLlmProviderId[] {
  const assignment = REAL_ANALYSIS_POLICY_ASSIGNMENTS[policy];
  const ids = new Set<RealLlmProviderId>();
  for (const analyst of assignment.analysts) ids.add(analyst.providerId);
  if (assignment.challengerProviderId) ids.add(assignment.challengerProviderId);
  ids.add(assignment.adjudicatorProviderId);
  return Array.from(ids);
}

const ROLE_LETTERS: readonly ("A" | "B" | "C")[] = ["A", "B", "C"];

/**
 * On-demand per-KPI analysis (manual button, see onDemandAnalysis.ts) — a
 * graceful-degradation counterpart of the fixed, all-or-nothing
 * `REAL_ANALYSIS_POLICY_ASSIGNMENTS` used by the pilot. The pilot requires
 * EVERY provider its policy needs to be configured or it falls back to mock
 * entirely (see realIntelligencePilot.ts). The on-demand button instead runs
 * with WHATEVER subset of the 3 providers is actually configured right now —
 * 1, 2, or 3 — never refusing to run just because the ideal 3-provider
 * ensemble isn't fully available. `computeModelAgreement` (runAdjudicator.ts)
 * already classifies a single-analyst result as "SINGLE_ANALYST" — this
 * function's job is only to build a valid, non-empty `RealPolicyAssignment`
 * from whatever `configuredProviderIds` is passed (assumed non-empty; the
 * caller must already have returned NOT_CONFIGURED for an empty list).
 *
 * Degradation rules, simplest-first:
 *  - Analysts: keep the policy's ideal analyst providers that are actually
 *    configured; if NONE of the ideal analyst providers are configured
 *    (e.g. only Gemini is up but the ideal assignment's analysts are
 *    openai/anthropic), fall back to using whichever configured provider(s)
 *    exist, up to the ideal analyst count — so a single configured provider
 *    always yields exactly one analyst (role A), never zero.
 *  - Challenger: only ever runs for HIGH_SCRUTINY, and only when at least 2
 *    DISTINCT providers are configured (a challenger sharing its only model
 *    with the sole analyst would not be a genuinely independent perspective)
 *    — prefers the ideal challenger provider if configured, else reuses the
 *    last selected analyst's provider.
 *  - Adjudicator: the ideal adjudicator provider if configured, else the
 *    last selected analyst's provider (so a 1-provider run self-adjudicates
 *    on that same provider rather than throwing).
 */
export function buildAvailablePolicyAssignment(
  policy: AnalysisPolicy,
  configuredProviderIds: readonly RealLlmProviderId[]
): RealPolicyAssignment {
  if (configuredProviderIds.length === 0) {
    throw new Error("buildAvailablePolicyAssignment requires at least one configured provider id");
  }

  const ideal = REAL_ANALYSIS_POLICY_ASSIGNMENTS[policy];
  const configuredSet = new Set(configuredProviderIds);

  const keptIdealAnalystProviders = ideal.analysts
    .map((a) => a.providerId)
    .filter((providerId) => configuredSet.has(providerId));
  const analystProviderIds =
    keptIdealAnalystProviders.length > 0
      ? keptIdealAnalystProviders
      : configuredProviderIds.slice(0, ideal.analysts.length);

  const analysts: RealAnalystRoleAssignment[] = analystProviderIds.map((providerId, index) => ({
    role: ROLE_LETTERS[index],
    providerId,
  }));
  const lastAnalystProviderId = analysts[analysts.length - 1].providerId;

  const challengerProviderId: RealLlmProviderId | null =
    policy === "HIGH_SCRUTINY" && configuredSet.size >= 2
      ? ideal.challengerProviderId && configuredSet.has(ideal.challengerProviderId)
        ? ideal.challengerProviderId
        : lastAnalystProviderId
      : null;

  const adjudicatorProviderId: RealLlmProviderId = configuredSet.has(ideal.adjudicatorProviderId)
    ? ideal.adjudicatorProviderId
    : lastAnalystProviderId;

  return { analysts, challengerProviderId, adjudicatorProviderId };
}

/**
 * On-demand button's "no metered API" default path — builds an assignment
 * from whichever of the two no-cost CLI providers (claude-cli/codex-cli) are
 * actually available (see providers/cliAvailability.ts), completely
 * independent of `REAL_ANALYSIS_POLICY_ASSIGNMENTS`/`buildAvailablePolicyAssignment`
 * above (those remain exactly as they were, for the metered-key path — see
 * this function's caller, onDemandAnalysis.ts, for the "prefer CLI, else
 * fall back to metered" priority rule).
 *
 * Both providers' `generateAdjudication`/`generateChallengeFindings` are
 * rule-based, local computations (no subprocess — see
 * providers/cliAdjudication.ts), so `adjudicatorProviderId` here is never a
 * third slow CLI call regardless of which of the two ids ends up selected.
 *
 * `availableCliProviderIds` is assumed non-empty (mirrors
 * `buildAvailablePolicyAssignment`'s contract) and ordered
 * caller's-preference-first — the caller passes `["claude-cli",
 * "codex-cli"]` filtered down to whichever are actually available.
 */
export function buildCliPreferredAssignment(availableCliProviderIds: readonly RealLlmProviderId[]): RealPolicyAssignment {
  if (availableCliProviderIds.length === 0) {
    throw new Error("buildCliPreferredAssignment requires at least one available CLI provider id");
  }
  const analysts: RealAnalystRoleAssignment[] = availableCliProviderIds
    .slice(0, ROLE_LETTERS.length)
    .map((providerId, index) => ({ role: ROLE_LETTERS[index], providerId }));

  return {
    analysts,
    // No challenger stage for the CLI path — see this function's own doc
    // comment and cliAdjudication.ts: a genuine 2-analyst disagreement is
    // already surfaced via the rule-based adjudicator's notes/evidenceState
    // without paying for a third CLI session.
    challengerProviderId: null,
    adjudicatorProviderId: analysts[0].providerId,
  };
}
