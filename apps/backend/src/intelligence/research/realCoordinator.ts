import type { ClaimRecord, ResearchRun } from "@gold-terminal/contracts";
import { KPI_CONTEXT_DEPENDENCIES } from "../kpiDependencyMap";
import { corroborate } from "./corroboration";
import { dedupeClaims } from "./dedupeClaims";
import { dedupeResults } from "./dedupeResults";
import { extractClaims } from "./extractClaims";
import { fetchRealRawResultsForTopic } from "./tavilyResearchProvider";
import type { TopicTag } from "./topicPlans";

// Real intelligence pilot — runs the EXISTING, provider-agnostic
// dedupe/claim-extraction/corroboration pipeline (dedupeResults.ts/
// extractClaims.ts/dedupeClaims.ts/corroboration.ts, all unchanged) against
// REAL Tavily results instead of the mock fixtures in
// research/coordinator.ts. Kept as a separate coordinator — rather than
// branching inside coordinator.ts — so the mock research pipeline used by
// every non-pilot KPI (and by pilot KPIs whenever real mode isn't actually
// active) is untouched and unaffected by this file's existence.
//
// Scoped to only the research topics the given (pilot) KPI ids actually
// need, and each topic's claims are associated ONLY with the pilot KPI ids
// that reference it — never the full cockpit KPI set — since only pilot
// KPIs ever read from this ResearchRun.
//
// Real contradiction (DISPUTED) detection is not attempted here: the mock
// coordinator's `KNOWN_DISPUTE_PAIRS_BY_TOPIC` is hand-authored fixture
// knowledge that cannot apply to live news, and real NLP-based contradiction
// detection is out of scope for this pilot (same rationale as
// corroboration.ts's existing DISPUTED-detection comment) — every real
// claim is corroborated/verified/unverified only, never DISPUTED.

function pilotKpiIdsForTopic(topic: TopicTag, pilotKpiIds: readonly string[]): string[] {
  return pilotKpiIds.filter((kpiId) => KPI_CONTEXT_DEPENDENCIES[kpiId]?.researchTopics.includes(topic) ?? false);
}

async function runRealTopicPipeline(topic: TopicTag, pilotKpiIds: readonly string[]): Promise<ClaimRecord[]> {
  const raw = await fetchRealRawResultsForTopic(topic);
  if (raw.length === 0) return [];

  const deduped = dedupeResults(raw);
  const drafts = extractClaims(deduped);
  const merged = dedupeClaims(drafts);
  const corroborated = corroborate({ mergedClaims: merged }); // no knownDisputePairs — see file header

  const associatedKpiIds = pilotKpiIdsForTopic(topic, pilotKpiIds);
  const retrievedAt = new Date().toISOString();

  return corroborated.map((claim, index) => ({
    id: `real-claim-${topic.toLowerCase()}-${index}`,
    claim: claim.claim,
    epistemicStatus: claim.epistemicStatus,
    source: claim.source,
    retrievedAt,
    verificationState: claim.verificationState,
    corroboratingIndependentSources: claim.corroboratingIndependentSources,
    associatedKpiIds,
  }));
}

/**
 * Build a session's REAL ResearchRun scoped to exactly the given (pilot)
 * KPI ids' research topics — never the full cockpit topic set, to keep
 * real Tavily call volume bounded to what the pilot actually needs.
 */
export async function buildRealResearchRun(sessionId: string, pilotKpiIds: readonly string[]): Promise<ResearchRun> {
  const topics = new Set<TopicTag>();
  for (const kpiId of pilotKpiIds) {
    for (const topic of KPI_CONTEXT_DEPENDENCIES[kpiId]?.researchTopics ?? []) topics.add(topic);
  }

  const evidenceById: Record<string, ClaimRecord> = {};
  for (const topic of topics) {
    const claims = await runRealTopicPipeline(topic, pilotKpiIds);
    for (const claim of claims) evidenceById[claim.id] = claim;
  }

  return { sessionId, runAt: new Date().toISOString(), evidenceById };
}
