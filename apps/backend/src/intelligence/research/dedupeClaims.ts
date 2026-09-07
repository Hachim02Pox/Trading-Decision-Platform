import type { ClaimDraft } from "./extractClaims";

// Patch 5, stage 3 — collapse claims whose normalized statement text
// matches closely. Normalize whitespace/case/punctuation, then use a simple
// token-overlap ratio (Jaccard similarity on word sets), threshold ~0.8. No
// embeddings. Tracks how many distinct underlying sources repeated the
// resulting merged claim (by distinct publisher name — the finer
// independent-source/syndication logic lives in corroboration.ts).

export interface MergedClaimDraft extends ClaimDraft {
  /** All raw ClaimDrafts that were merged into this one (this one included). */
  mergedFrom: ClaimDraft[];
}

const JACCARD_THRESHOLD = 0.8;

function normalizeStatement(statement: string): string {
  return statement
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenSet(statement: string): Set<string> {
  return new Set(normalizeStatement(statement).split(" ").filter(Boolean));
}

function jaccardSimilarity(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 1;
  let intersection = 0;
  for (const token of a) {
    if (b.has(token)) intersection += 1;
  }
  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

export function dedupeClaims(drafts: ClaimDraft[]): MergedClaimDraft[] {
  const groups: MergedClaimDraft[] = [];
  const groupTokenSets: Set<string>[] = [];

  for (const draft of drafts) {
    const tokens = tokenSet(draft.claim);
    let matchedIndex = -1;

    for (let i = 0; i < groups.length; i += 1) {
      if (jaccardSimilarity(tokens, groupTokenSets[i]) >= JACCARD_THRESHOLD) {
        matchedIndex = i;
        break;
      }
    }

    if (matchedIndex === -1) {
      groups.push({ ...draft, mergedFrom: [draft] });
      groupTokenSets.push(tokens);
    } else {
      groups[matchedIndex].mergedFrom.push(draft);
      // Keep the earliest-published statement as the canonical wording;
      // union the token set so later near-duplicates can still match on
      // the merged group's broader vocabulary.
      for (const token of tokens) groupTokenSets[matchedIndex].add(token);
    }
  }

  return groups;
}
