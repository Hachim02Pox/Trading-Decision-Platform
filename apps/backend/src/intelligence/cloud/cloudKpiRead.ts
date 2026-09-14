import type { CanonicalFamilySnapshot, CanonicalKpi, KpiInterpretation, Language } from "@gold-terminal/contracts";
import { createGroqLlmProvider } from "./groqLlmProvider";
import { rememberKpiObservation } from "./kpiHistory";

type CloudRead = { short?: unknown; detailed?: unknown; what_it_means?: unknown; waits_for?: unknown; invalidates?: unknown };

function list(value: unknown, fallback: string): string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string") && value.length > 0 ? value.slice(0, 4) : [fallback];
}

/** One cloud-only, web-free KPI read. The prompt intentionally exposes exactly
 * current and prior observations and forbids directional Gold conclusions. */
export async function generateCloudKpiRead(kpi: CanonicalKpi, language: Language, sessionId: string): Promise<KpiInterpretation | null> {
  const provider = createGroqLlmProvider("kpi");
  if (!provider || kpi.value === null) return null;
  const previous = kpi.previousFetch ?? rememberKpiObservation(kpi);
  const prompt = [
    "Produce a concise KPI reading in the requested language. Use ONLY the two supplied observations; do not browse or use web knowledge.",
    "This is a mechanical data read, not a market forecast. Do not infer causes, do not make a Gold bull/bear conclusion, targets, trade advice, or unsupported claims.",
    "Return JSON: {short,detailed,what_it_means,waits_for,invalidates}.",
    `Language: ${language}. KPI: ${kpi.label} (${kpi.id}). Definition/unit: ${kpi.unit ?? "not stated"}.`,
    `Current fetch: value=${kpi.value}; observation_at=${kpi.observationAt}; fetched_at=${kpi.retrievedAt}.`,
    previous ? `Previous fetch: value=${previous.value}; observation_at=${previous.observationAt}; fetched_at=${previous.retrievedAt}.` : "Previous fetch: unavailable; state that a comparison requires the next changed observation.",
  ].join("\n");
  const raw = await provider.completeJson(prompt) as CloudRead;
  if (typeof raw.short !== "string" || typeof raw.detailed !== "string") throw new Error("Groq KPI response missing required text");
  const now = new Date().toISOString();
  const mechanicalRelationship = kpi.relationship === "neutral" ? null : kpi.relationship;
  const finalGoldRead = kpi.relationship === "support" ? "SUPPORTIVE" : kpi.relationship === "adverse" ? "ADVERSE" : "CONTEXTUAL";
  return {
    kpiId: kpi.id, familyId: kpi.familyId, interpretationAnalyzedAt: now, dataAsOf: kpi.observationAt,
    comparison: { previous, current: { value: kpi.value, unit: kpi.unit, observationAt: kpi.observationAt, retrievedAt: kpi.retrievedAt } },
    evidenceLatestPublishedAt: null, language,
    currentReadShort: raw.short.slice(0, 140), currentReadDetailed: raw.detailed,
    previousReadSummary: null, whatChangedSincePreviousRead: previous ? `Current ${kpi.value} versus previous ${previous.value}.` : null,
    currentRead: raw.detailed, relationshipBasis: mechanicalRelationship ? "MECHANICAL_RULE" : "CONTEXTUAL_AI",
    mechanicalRelationship, finalGoldRead, whyNow: typeof raw.what_it_means === "string" ? raw.what_it_means : raw.detailed,
    causalChain: [], supportingEvidenceIds: [], contradictingEvidenceIds: [], uncertaintyOrUnknowns: list(raw.waits_for, "A further observed value is required for comparison."),
    whatWouldStrengthen: list(raw.waits_for, "A new source observation."), whatWouldWeakenOrInvalidate: list(raw.invalidates, "A corrected or revised source observation."),
    relevantRecentDevelopmentIds: [], researchSourceIds: [], evidenceState: "MODERATE",
    modelIdentity: { provider: "groq", model: provider.model }, promptVersion: "cloud-kpi-v1", isMock: false, sessionId,
    auditTrail: { policy: "STANDARD", analystConclusions: [], challengeFindings: [], modelAgreement: "SINGLE_ANALYST", adjudicatorNotes: "Cloud-only mechanical KPI read; no web search used." },
  };
}

/** One family-level cloud read. It receives the current/previous pair for
 * every available KPI in that family, and nothing from the web. */
export async function generateCloudFamilyRead(family: CanonicalFamilySnapshot, language: Language, sessionId: string): Promise<KpiInterpretation | null> {
  const provider = createGroqLlmProvider("kpi");
  if (!provider) return null;
  const observations = family.kpis
    .filter((kpi) => kpi.dataState === "REAL" && kpi.value !== null)
    .map((kpi) => ({ id: kpi.id, label: kpi.label, unit: kpi.unit, previous: kpi.previousFetch ?? null, current: { value: kpi.value, observationAt: kpi.observationAt, retrievedAt: kpi.retrievedAt } }));
  const fedProbabilities = family.fedRateDistribution?.dataState === "REAL"
    ? family.fedRateDistribution.buckets.map((bucket) => ({ target_range: bucket.targetRangeLabel, previous_probability_pct: bucket.probabilityPreviousDay ?? null, current_probability_pct: bucket.probability }))
    : [];
  if (observations.length === 0 && fedProbabilities.length === 0) return null;
  const raw = await provider.completeJson([
    "Produce a concise family-level mechanical data reading in the requested language.",
    "Use ONLY this list of current and immediately preceding observations. No web, no external knowledge, no causal claims, no Gold bull/bear conclusion, targets or trade advice.",
    "Describe only the observed dynamics: which values rose, fell, stayed flat, or have no prior point. Return JSON {short,detailed,what_it_means,waits_for,invalidates}.",
    `Language: ${language}. Family: ${family.label} (${family.familyId}). KPI observations: ${JSON.stringify(observations)}. Fed target-range probabilities (when supplied): ${JSON.stringify(fedProbabilities)}. For Fed probabilities, name the exact range and compare previous_probability_pct to current_probability_pct.`,
  ].join("\n")) as CloudRead;
  if (typeof raw.short !== "string" || typeof raw.detailed !== "string") throw new Error("Groq family response missing required text");
  const now = new Date().toISOString();
  return {
    kpiId: `family:${family.familyId}`, familyId: family.familyId, interpretationAnalyzedAt: now, dataAsOf: now, evidenceLatestPublishedAt: null, language,
    currentReadShort: raw.short.slice(0, 140), currentReadDetailed: raw.detailed, previousReadSummary: null, whatChangedSincePreviousRead: null,
    currentRead: raw.detailed, relationshipBasis: "CONTEXTUAL_AI", mechanicalRelationship: null, finalGoldRead: "CONTEXTUAL",
    whyNow: typeof raw.what_it_means === "string" ? raw.what_it_means : raw.detailed, causalChain: [], supportingEvidenceIds: [], contradictingEvidenceIds: [],
    uncertaintyOrUnknowns: list(raw.waits_for, "A new source observation is required."), whatWouldStrengthen: list(raw.waits_for, "A new source observation."), whatWouldWeakenOrInvalidate: list(raw.invalidates, "A corrected source observation."),
    relevantRecentDevelopmentIds: [], researchSourceIds: [], evidenceState: "MODERATE", modelIdentity: { provider: "groq", model: provider.model }, promptVersion: "cloud-family-v1", isMock: false, sessionId,
    auditTrail: { policy: "STANDARD", analystConclusions: [], challengeFindings: [], modelAgreement: "SINGLE_ANALYST", adjudicatorNotes: "Cloud-only family comparison; no web search used." },
  };
}
