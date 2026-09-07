import type { AuthorityClass, VerificationState } from "@gold-terminal/contracts";
import type { MergedClaimDraft } from "./dedupeClaims";

// Patch 5/7, stage 4 — assign `verificationState` +
// `corroboratingIndependentSources`.
//
// Independent-source counting: sources sharing the same detected
// wire-service byline/credit (e.g. "Reuters", "AP", "Bloomberg" in a
// `byline` field) count as ONE underlying source for corroboration
// purposes, even if republished across many domains. This is a simple
// byline-normalization dedup key, not real syndication detection.
//
// DISPUTED detection: real contradiction detection is an NLP/LLM problem
// out of scope for this mock milestone. Rather than fake it with a keyword
// heuristic that would silently misfire, the coordinator (which authors the
// small illustrative mock fixture set) passes explicit `knownDisputePairs`
// — index pairs it already knows, by fixture design, assert incompatible
// things about the same underlying fact. Both members of a disputed pair
// keep their own record (neither is dropped) and get cross-referenced.

const PRIMARY_SOURCE_CLASSES: readonly AuthorityClass[] = ["OFFICIAL_STATISTICS", "CENTRAL_BANK", "GOVERNMENT"];

export interface CorroboratedClaim extends MergedClaimDraft {
  verificationState: VerificationState;
  corroboratingIndependentSources: number;
  /** Set only when this claim is one half of a DISPUTED pair. */
  disputesIndex?: number;
}

export interface CorroborationInput {
  mergedClaims: MergedClaimDraft[];
  knownDisputePairs?: Array<[number, number]>;
}

export function normalizeSourceKey(draft: MergedClaimDraft["mergedFrom"][number]): string {
  const raw = draft.byline?.trim() || draft.source.name.trim();
  return raw.toLowerCase();
}

function countIndependentSources(merged: MergedClaimDraft): number {
  const keys = new Set(merged.mergedFrom.map(normalizeSourceKey));
  return keys.size;
}

function isPrimarySource(merged: MergedClaimDraft): boolean {
  return merged.mergedFrom.some((d) => PRIMARY_SOURCE_CLASSES.includes(d.source.authorityClass));
}

export function corroborate(input: CorroborationInput): CorroboratedClaim[] {
  const disputedIndices = new Map<number, number>();
  for (const [a, b] of input.knownDisputePairs ?? []) {
    disputedIndices.set(a, b);
    disputedIndices.set(b, a);
  }

  return input.mergedClaims.map((merged, index) => {
    const independentSources = countIndependentSources(merged);
    const disputesIndex = disputedIndices.get(index);

    let verificationState: VerificationState;
    if (disputesIndex !== undefined) {
      verificationState = "DISPUTED";
    } else if (independentSources >= 2) {
      verificationState = "CORROBORATED";
    } else if (isPrimarySource(merged)) {
      verificationState = "VERIFIED";
    } else {
      verificationState = "UNVERIFIED_DISCOVERY";
    }

    return {
      ...merged,
      verificationState,
      corroboratingIndependentSources: independentSources,
      disputesIndex,
    };
  });
}
