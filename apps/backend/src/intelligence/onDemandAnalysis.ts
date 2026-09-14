import { createHash } from "node:crypto";
import type {
  CanonicalFamilySnapshot,
  CanonicalKpi,
  FamilyId,
  KpiInterpretation,
  Language,
  OnDemandKpiAnalysisResponse,
} from "@gold-terminal/contracts";
import { KpiContextPackageBuilder } from "./contextPackageBuilder";
import { ConcurrencyLimiter } from "./concurrencyLimiter";
import { MAX_CONCURRENT_LLM_CALLS } from "./constants";
import { policyForKpi } from "./ensemble/policies";
import { buildAvailablePolicyAssignment, buildCliPreferredAssignment, type RealPolicyAssignment } from "./ensemble/realPolicies";
import type { RealLlmProviderId } from "./providers/llmProvider";
import { isRealLlmProviderConfigured } from "./providers/realLlmProviderRegistry";
import { generateRealInterpretationForFamily, generateRealInterpretationForKpi } from "./realInterpretationGenerator";
import { buildRealResearchRun } from "./research/realCoordinator";
import { loadAutoKpiAnalyses, saveAutoKpiAnalyses, type AutoKpiAnalysesById } from "./runtimeStore";
import { createGroqLlmProvider } from "./cloud/groqLlmProvider";
import { generateCloudFamilyRead, generateCloudKpiRead } from "./cloud/cloudKpiRead";

// User-explicit automation pass (2026-09): replaces the old manual
// "Analyze with AI" button entirely. There is no more manual trigger and no
// more cost/spam cooldown for THIS feature (onDemandCooldown.ts stays, but
// is no longer imported here — Global Read still uses it independently).
//
// New model: every KPI/family's real data carries a content hash (see
// computeKpiSnapshotHash/computeFamilySnapshotHash below — value, dataState,
// observationAt, retrievedAt, sourceTag, unavailableReason). A UI that wants
// this KPI/family's current AI reading calls `ensureAutoKpiAnalysis`, which:
//   1. Computes the CURRENT data's hash.
//   2. If a stored analysis already matches that hash exactly -> returns it
//      as "OK" immediately, no work done.
//   3. Otherwise (data changed since the last analysis, or none exists) and
//      not already running for this exact hash -> kicks off a REAL
//      generation in the background (never awaited by the caller — a slow
//      or failed AI call must never block/break the data response) and
//      returns "PENDING" immediately, carrying the previous (superseded)
//      interpretation only for continuity — callers must never present a
//      PENDING response's `interpretation` as the current read.
//   4. If already running for this exact hash -> also "PENDING", without
//      starting a second identical background job (see `inFlightKeys`).
// This is the single mechanism used for both cases in this file's title:
// per-KPI and per-family (`family:F2`-style composite ids), unchanged from
// before.
//
// Deliberately NOT eager for every KPI in the whole snapshot on every
// request: `ensureAutoKpiAnalysis` is only ever called by the frontend for a
// KPI/family the user has actually opened (see useOnDemandKpiAnalysis.ts) —
// see this file's own header note further down and the final report for why
// (CLI cost/latency at ~100+ KPIs would be unworkable otherwise). A
// completely passive, non-triggering peek (`peekAutoKpiAnalysis`) exists
// separately for the resting mosaic badges, which must never themselves
// cause a real CLI call just by being rendered.

const FAMILY_ID_PREFIX = "family:";

function familyIdFromCompositeId(id: string): FamilyId | null {
  return id.startsWith(FAMILY_ID_PREFIX) ? (id.slice(FAMILY_ID_PREFIX.length) as FamilyId) : null;
}

function findFamily(allFamilies: CanonicalFamilySnapshot[], familyId: FamilyId): CanonicalFamilySnapshot | undefined {
  return allFamilies.find((f) => f.familyId === familyId);
}

function findKpi(allFamilies: CanonicalFamilySnapshot[], kpiId: string): CanonicalKpi | undefined {
  for (const family of allFamilies) {
    const kpi = family.kpis.find((k) => k.id === kpiId);
    if (kpi) return kpi;
  }
  return undefined;
}

// --- Snapshot hashing ---------------------------------------------------
// Deterministic, order-independent (own keys sorted) JSON stringify so the
// SAME logical content always hashes the same regardless of key insertion
// order — a plain JSON.stringify would not guarantee that.
function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  if (value !== null && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
    return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${stableStringify(v)}`).join(",")}}`;
  }
  return JSON.stringify(value) ?? "null";
}

function hashContent(value: unknown): string {
  return createHash("sha256").update(stableStringify(value)).digest("hex").slice(0, 16);
}

/** The exact real-data fields that define "this is the same fetch" for one KPI — never the mechanical relationship/driverSummary text, which can be recomputed without a new real fetch. */
function kpiFingerprint(kpi: CanonicalKpi): unknown {
  return {
    id: kpi.id,
    value: kpi.value,
    unit: kpi.unit,
    dataState: kpi.dataState,
    unavailableReason: kpi.unavailableReason ?? null,
    observationAt: kpi.observationAt,
    retrievedAt: kpi.retrievedAt,
    sourceTag: kpi.sourceTag,
  };
}

/** Content hash of one KPI's real data — see computeFamilySnapshotHash for the family-level equivalent. */
export function computeKpiSnapshotHash(kpi: CanonicalKpi): string {
  return hashContent(kpiFingerprint(kpi));
}

/** Content hash of a family's full cockpit-visible KPI set — changes exactly when any one of those KPIs' own real data changes. */
export function computeFamilySnapshotHash(kpis: readonly CanonicalKpi[]): string {
  return hashContent(kpis.map(kpiFingerprint));
}

const CLI_PROVIDER_IDS: readonly RealLlmProviderId[] = ["claude-cli", "codex-cli"];
const METERED_PROVIDER_IDS: readonly RealLlmProviderId[] = ["openai", "anthropic", "gemini"];
const REAL_PROVIDER_IDS: readonly RealLlmProviderId[] = [...CLI_PROVIDER_IDS, ...METERED_PROVIDER_IDS];

function configuredProviderIds(): RealLlmProviderId[] {
  // KPI reads are cloud-only. Local Claude/Codex CLIs and web research are
  // deliberately excluded from this automatic path.
  return createGroqLlmProvider("kpi") ? (["openai"] as RealLlmProviderId[]) : [];
}

/** Same CLI-first preference as before this pass — see git history/prior header comment for the full rationale (free subscription CLIs over metered APIs whenever available). */
function resolveProviderAssignment(policy: ReturnType<typeof policyForKpi>, configured: readonly RealLlmProviderId[]): RealPolicyAssignment {
  const availableCliIds = CLI_PROVIDER_IDS.filter((id) => configured.includes(id));
  if (availableCliIds.length > 0) return buildCliPreferredAssignment(availableCliIds);
  const availableMeteredIds = METERED_PROVIDER_IDS.filter((id) => configured.includes(id));
  return buildAvailablePolicyAssignment(policy, availableMeteredIds);
}

function cacheKey(kpiId: string, language: Language): string {
  return `${kpiId}::${language}`;
}

const onDemandLimiter = new ConcurrencyLimiter(MAX_CONCURRENT_LLM_CALLS);

let resultsById: AutoKpiAnalysesById | null = null;
function getResults(): AutoKpiAnalysesById {
  if (resultsById === null) resultsById = loadAutoKpiAnalyses();
  return resultsById;
}
function persistResult(key: string, interpretation: KpiInterpretation, snapshotHash: string): void {
  const next = { ...getResults(), [key]: { interpretation, snapshotHash } };
  resultsById = next;
  saveAutoKpiAnalyses(next);
}

// In-flight generations, keyed by `${cacheKey}::${snapshotHash}` — this
// exact composite is what guarantees a burst of near-simultaneous requests
// for the same still-fresh data never starts a second identical background
// analysis (section 20's dedup requirement).
const inFlightKeys = new Set<string>();

// A generation that just failed for a given exact hash is not retried on
// every single frontend poll (which happens every few seconds while
// PENDING) — that would hammer a genuinely failing/rate-limited CLI. A short
// backoff is enough since the hash itself already prevents re-analyzing
// unchanged data indefinitely once it succeeds.
const FAILURE_BACKOFF_MS = 30_000;
const lastFailureByKey = new Map<string, { hash: string; at: number }>();

function notConfiguredResponse(snapshotHash: string | null): OnDemandKpiAnalysisResponse {
  return {
    status: "NOT_CONFIGURED",
    interpretation: null,
    evidence: null,
    message:
      "No cloud AI provider is configured. Add GROQ_API_KEY to apps/backend/.env and restart the backend.",
    configuredProviderCount: 0,
    cooldownRemainingMs: null,
    snapshotHash,
  };
}

export interface OnDemandAnalysisDeps {
  allFamilies: CanonicalFamilySnapshot[];
  sessionId: string;
}

/**
 * Read-only, zero-cost, NEVER-triggering peek — used by the resting mosaic
 * badge (useCachedOnDemandBadge.ts) so simply rendering a KPI's card can
 * never itself cause a real CLI call. Does not check the snapshot hash: a
 * badge showing a slightly-superseded relationship until its KPI is actually
 * opened is an acceptable, cost-free tradeoff (see this file's header and
 * the final report's "cost/latency" discussion).
 */
export function peekAutoKpiAnalysis(kpiId: string, language: Language): OnDemandKpiAnalysisResponse {
  const cached = getResults()[cacheKey(kpiId, language)];
  if (!cached) {
    return { status: "NONE", interpretation: null, evidence: null, message: null, configuredProviderCount: configuredProviderIds().length, cooldownRemainingMs: null, snapshotHash: null };
  }
  return {
    status: "OK",
    interpretation: cached.interpretation,
    evidence: null,
    message: null,
    configuredProviderCount: configuredProviderIds().length,
    cooldownRemainingMs: null,
    snapshotHash: cached.snapshotHash,
  };
}

async function runGeneration(
  kpiId: string,
  familyId: FamilyId | null,
  language: Language,
  deps: OnDemandAnalysisDeps,
  key: string,
  snapshotHash: string
): Promise<void> {
  try {
    const configured = configuredProviderIds();
    const assignment = resolveProviderAssignment(policyForKpi(kpiId), configured);
    const previous = getResults()[key]?.interpretation ?? null;

    let interpretation: KpiInterpretation | null;

    if (familyId) {
      const family = findFamily(deps.allFamilies, familyId);
      interpretation = family ? await onDemandLimiter.run(() => generateCloudFamilyRead(family, language, deps.sessionId)) : null;
    } else {
      const kpi = findKpi(deps.allFamilies, kpiId);
      interpretation = kpi ? await onDemandLimiter.run(() => generateCloudKpiRead(kpi, language, deps.sessionId)) : null;
    }

    if (interpretation) {
      persistResult(key, interpretation, snapshotHash);
    } else {
      lastFailureByKey.set(key, { hash: snapshotHash, at: Date.now() });
    }
  } catch (err) {
    console.error(
      JSON.stringify({
        msg: "automatic KPI/family analysis failed for this snapshot — leaving prior result (if any) in place, no mock fallback",
        kpiId,
        language,
        error: err instanceof Error ? err.message : String(err),
      })
    );
    lastFailureByKey.set(key, { hash: snapshotHash, at: Date.now() });
  } finally {
    inFlightKeys.delete(`${key}::${snapshotHash}`);
  }
}

/**
 * The one function every UI surface should call to get a KPI/family's
 * current AI reading. Automatically (re)triggers a real background analysis
 * whenever the underlying data has changed since the last one — never on a
 * manual click, never blocking. See this file's header for the full state
 * machine.
 */
export async function ensureAutoKpiAnalysis(kpiId: string, language: Language, deps: OnDemandAnalysisDeps): Promise<OnDemandKpiAnalysisResponse> {
  const familyId = familyIdFromCompositeId(kpiId);
  const configured = configuredProviderIds();
  // Checked before attempting to resolve the KPI/family at all — matches
  // the prior manual-trigger flow's precedence (NOT_CONFIGURED is a
  // machine-level fact, independent of which KPI was asked about).
  if (configured.length === 0) return notConfiguredResponse(null);

  let snapshotHash: string;
  if (familyId) {
    const family = findFamily(deps.allFamilies, familyId);
    if (!family) {
      return { status: "UNAVAILABLE", interpretation: null, evidence: null, message: `Unknown family "${familyId}".`, configuredProviderCount: configured.length, cooldownRemainingMs: null, snapshotHash: null };
    }
    snapshotHash = computeFamilySnapshotHash(family.kpis.filter((k) => k.visibility === "cockpit"));
  } else {
    const kpi = findKpi(deps.allFamilies, kpiId);
    if (!kpi) {
      return { status: "UNAVAILABLE", interpretation: null, evidence: null, message: `Unknown KPI "${kpiId}".`, configuredProviderCount: configured.length, cooldownRemainingMs: null, snapshotHash: null };
    }
    snapshotHash = computeKpiSnapshotHash(kpi);
  }

  const key = cacheKey(kpiId, language);
  const existing = getResults()[key];

  // Already have an analysis of EXACTLY this data — nothing to do.
  if (existing && existing.snapshotHash === snapshotHash) {
    return { status: "OK", interpretation: existing.interpretation, evidence: null, message: null, configuredProviderCount: configured.length, cooldownRemainingMs: null, snapshotHash };
  }

  const inFlightKey = `${key}::${snapshotHash}`;
  const recentFailure = lastFailureByKey.get(key);
  const inBackoff = recentFailure && recentFailure.hash === snapshotHash && Date.now() - recentFailure.at < FAILURE_BACKOFF_MS;

  if (!inFlightKeys.has(inFlightKey) && !inBackoff) {
    inFlightKeys.add(inFlightKey);
    void runGeneration(kpiId, familyId, language, deps, key, snapshotHash);
  }

  if (inBackoff && !inFlightKeys.has(inFlightKey)) {
    return {
      status: "UNAVAILABLE",
      interpretation: existing?.interpretation ?? null,
      evidence: null,
      message: "Automatic analysis failed for this KPI's latest data — please wait a moment; it will retry automatically.",
      configuredProviderCount: configured.length,
      cooldownRemainingMs: null,
      snapshotHash,
    };
  }

  // A real generation is now running (or already was) for this exact
  // snapshot. The frontend polls this same endpoint until it flips to OK —
  // `interpretation` here is only the PREVIOUS, now-superseded result kept
  // for continuity; callers must render it labeled as such, never as current.
  return {
    status: "PENDING",
    interpretation: existing?.interpretation ?? null,
    evidence: null,
    message: null,
    configuredProviderCount: configured.length,
    cooldownRemainingMs: null,
    snapshotHash,
  };
}

/** Called after a market snapshot is refreshed. Every cockpit KPI whose
 * source fingerprint changed gets one deduplicated cloud read; unchanged
 * snapshots are served from cache and make no Groq request. */
export function queueCloudKpiAnalyses(allFamilies: CanonicalFamilySnapshot[], sessionId: string): void {
  for (const family of allFamilies) {
    if (family.kpis.some((kpi) => kpi.visibility === "cockpit" && kpi.dataState === "REAL" && kpi.value !== null)) {
      void ensureAutoKpiAnalysis(`family:${family.familyId}`, "FR", { allFamilies, sessionId });
    }
    for (const kpi of family.kpis) {
      if (kpi.visibility !== "cockpit" || kpi.dataState !== "REAL" || kpi.value === null) continue;
      void ensureAutoKpiAnalysis(kpi.id, "FR", { allFamilies, sessionId });
    }
  }
}

/** Test-only escape hatch. */
export function __resetOnDemandAnalysisStateForTests(): void {
  resultsById = {};
  inFlightKeys.clear();
  lastFailureByKey.clear();
}
