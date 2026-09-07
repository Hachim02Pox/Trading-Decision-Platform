import type { ClaimRecord, ResearchRun } from "@gold-terminal/contracts";
import { KPI_CONTEXT_DEPENDENCIES } from "../kpiDependencyMap";
import { corroborate } from "./corroboration";
import { dedupeClaims } from "./dedupeClaims";
import { dedupeResults } from "./dedupeResults";
import { extractClaims } from "./extractClaims";
import { MOCK_RAW_RESULTS } from "./mockRawResults";
import type { TopicTag } from "./topicPlans";

// Patch 5 — full pipeline order, implemented as a coordinator function:
//   topic -> shared search (mock) -> dedupeResults -> extractClaims ->
//   dedupeClaims -> corroboration (verificationState +
//   corroboratingIndependentSources) -> associate claims to KPI ids (via
//   the topic -> KPI mapping) -> write into the shared evidenceById store.

// Mock-only, hand-authored signal standing in for real contradiction
// detection (out of scope this milestone — see corroboration.ts). Indices
// are into the per-topic deduped-claim array, in canned-fixture order.
const KNOWN_DISPUTE_PAIRS_BY_TOPIC: Partial<Record<TopicTag, Array<[number, number]>>> = {
  LABOR_RELEASE: [[0, 1]],
};

/** Inverse of KPI_CONTEXT_DEPENDENCIES: which cockpit KPI ids care about a given research topic. */
function kpiIdsForTopic(topic: TopicTag): string[] {
  return Object.entries(KPI_CONTEXT_DEPENDENCIES)
    .filter(([, deps]) => deps.researchTopics.includes(topic))
    .map(([kpiId]) => kpiId);
}

function runTopicPipeline(topic: TopicTag): ClaimRecord[] {
  const raw = MOCK_RAW_RESULTS[topic] ?? [];
  if (raw.length === 0) return [];

  const deduped = dedupeResults(raw);
  const drafts = extractClaims(deduped);
  const merged = dedupeClaims(drafts);
  const corroborated = corroborate({
    mergedClaims: merged,
    knownDisputePairs: KNOWN_DISPUTE_PAIRS_BY_TOPIC[topic],
  });

  const associatedKpiIds = kpiIdsForTopic(topic);
  const retrievedAt = new Date().toISOString();

  return corroborated.map((claim, index) => {
    const id = `claim-${topic.toLowerCase()}-${index}`;
    return {
      id,
      claim: claim.claim,
      epistemicStatus: claim.epistemicStatus,
      source: claim.source,
      retrievedAt,
      verificationState: claim.verificationState,
      corroboratingIndependentSources: claim.corroboratingIndependentSources,
      associatedKpiIds,
    };
  });
}

/**
 * Run the full research pipeline for every topic referenced anywhere in
 * KPI_CONTEXT_DEPENDENCIES and assemble the session's single, normalized
 * ResearchRun. A ClaimRecord about one release (e.g. CPI) legitimately gets
 * referenced by several KPIs' interpretations at once via associatedKpiIds
 * without being duplicated in storage.
 */
export function buildResearchRun(sessionId: string): ResearchRun {
  const allTopics = new Set<TopicTag>();
  for (const deps of Object.values(KPI_CONTEXT_DEPENDENCIES)) {
    for (const topic of deps.researchTopics) allTopics.add(topic);
  }

  const evidenceById: Record<string, ClaimRecord> = {};
  for (const topic of allTopics) {
    for (const claim of runTopicPipeline(topic)) {
      evidenceById[claim.id] = claim;
    }
  }

  return {
    sessionId,
    runAt: new Date().toISOString(),
    evidenceById,
  };
}

/** Claims associated (directly, by KPI id) with a given KPI, across all topics. */
export function claimsForKpi(researchRun: ResearchRun, kpiId: string): ClaimRecord[] {
  return Object.values(researchRun.evidenceById).filter((claim) => claim.associatedKpiIds.includes(kpiId));
}
