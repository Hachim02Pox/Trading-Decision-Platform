// Pure "current state" selection for the unified Gold market-state pipeline
// — deliberately dependency-free (no DB import) so it is fully unit-testable
// with fabricated rows (see tests/gold-market-state-selection.test.ts).
//
// Per the integration mission and GOLD_CONTINUOUS_RECAP_PROTOCOL.md:
// - selection must NEVER rely on Drive modifiedTime or filename alone;
// - NEXT_GOLD_RECAP_HANDOFF documents and frontend_eligible=false documents
//   must never be selectable;
// - the "current" state is the most advanced point of the most recent
//   Sunday->intermediate lineage chain, not simply "the row with the
//   greatest generated_at" (a stray/duplicate document must not silently
//   become current) — ties or inconsistent lineages are resolved by
//   preferring the latest validated state in an internally coherent chain,
//   and every other candidate considered is recorded as rejected/ignored for
//   audit logging (never with content, only ids/reasons).

export interface LineageCandidate {
  runId: string;
  runType: "SUNDAY" | "INTERMEDIATE" | null;
  documentType: string | null;
  frontendEligible: boolean | null;
  parentRunId: string | null;
  originSundayRunId: string | null;
  evidenceCutoffEnd: string | null;
  generatedAt: string | null;
  asOf: string | null;
}

export interface RejectedCandidateNote {
  runId: string;
  reason: "NOT_ELIGIBLE" | "LINEAGE_BRANCH_IGNORED" | "OLDER_LINEAGE";
}

export interface SelectionResult<T extends LineageCandidate> {
  current: T | null;
  /** Every eligible candidate, newest-ranked first — powers GET /api/gold/read/history. */
  historyNewestFirst: T[];
  rejected: RejectedCandidateNote[];
}

/** Exported so GET /api/gold/read/:runId can apply the exact same eligibility gate as the lineage selector, even for a direct-by-id lookup. */
export function isEligibleGoldState(candidate: LineageCandidate): boolean {
  if (candidate.frontendEligible === false) return false;
  if (candidate.documentType && candidate.documentType !== "GOLD_MARKET_STATE") return false;
  if (candidate.runType === "SUNDAY" || candidate.runType === "INTERMEDIATE") {
    // Continuous-recap lineage documents must explicitly opt in.
    return candidate.documentType === "GOLD_MARKET_STATE" && candidate.frontendEligible === true;
  }
  // Legacy (no run_type) document: grandfathered in — already gated by
  // filename pattern + full schema validation at ingest time, matching the
  // pre-existing sunday_reads pipeline's behavior.
  return true;
}

/** Compare the analytical cutoff first, then the generation time if two corrective
 * reads intentionally share a cutoff. Never use Drive insertion/modified time. */
function rankOf(candidate: LineageCandidate): [number, number, number] {
  const parse = (value: string | null): number => {
    const parsed = value ? Date.parse(value) : NaN;
    return Number.isNaN(parsed) ? -Infinity : parsed;
  };
  return [parse(candidate.evidenceCutoffEnd), parse(candidate.generatedAt), parse(candidate.asOf)];
}

function compareRank(a: LineageCandidate, b: LineageCandidate): number {
  const x = rankOf(a), y = rankOf(b);
  for (let i = 0; i < x.length; i += 1) if (x[i] !== y[i]) return y[i] - x[i];
  return b.runId.localeCompare(a.runId);
}

function lineageKeyOf(candidate: LineageCandidate): string {
  return candidate.originSundayRunId ?? candidate.runId;
}

export function selectCurrentGoldState<T extends LineageCandidate>(candidates: readonly T[]): SelectionResult<T> {
  const rejected: RejectedCandidateNote[] = [];
  const eligible = candidates.filter((candidate) => {
    if (isEligibleGoldState(candidate)) return true;
    rejected.push({ runId: candidate.runId, reason: "NOT_ELIGIBLE" });
    return false;
  });

  const groups = new Map<string, T[]>();
  for (const candidate of eligible) {
    const key = lineageKeyOf(candidate);
    const group = groups.get(key) ?? [];
    group.push(candidate);
    groups.set(key, group);
  }

  const tips: T[] = [];
  for (const group of groups.values()) {
    const runIdsInGroup = new Set(group.map((c) => c.runId));
    const referencedAsParent = new Set(
      group.map((c) => c.parentRunId).filter((id): id is string => !!id && runIdsInGroup.has(id))
    );
    const groupTips = group.filter((c) => !referencedAsParent.has(c.runId));
    const chosen = (groupTips.length ? groupTips : group).slice().sort(compareRank)[0];
    for (const candidate of group) {
      if (candidate.runId === chosen.runId) continue;
      rejected.push({
        runId: candidate.runId,
        reason: groupTips.includes(candidate) ? "LINEAGE_BRANCH_IGNORED" : "OLDER_LINEAGE",
      });
    }
    tips.push(chosen);
  }

  const historyNewestFirst = eligible.slice().sort(compareRank);
  const current = tips.slice().sort(compareRank)[0] ?? null;
  if (current) {
    for (const tip of tips) {
      if (tip.runId !== current.runId) rejected.push({ runId: tip.runId, reason: "OLDER_LINEAGE" });
    }
  }

  return { current, historyNewestFirst, rejected };
}
