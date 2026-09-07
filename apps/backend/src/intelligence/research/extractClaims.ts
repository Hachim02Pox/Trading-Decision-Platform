import type { AuthorityClass, EpistemicStatus } from "@gold-terminal/contracts";
import type { RawSearchResult } from "./rawResult";

// Patch 5, stage 2 — turn deduped raw results into ClaimRecord-shaped
// drafts. In mock mode this is a deterministic fixture mapping (no real
// NLP): the headline becomes the claim statement, and a simple heuristic
// over the publisher assigns an authority class + epistemic status. A real
// implementation would replace only this file's internals; the shape stays
// the same.

export interface ClaimDraft {
  claim: string;
  epistemicStatus: EpistemicStatus;
  source: {
    name: string;
    url: string | null;
    authorityClass: AuthorityClass;
    publishedAt: string | null;
  };
  retrievedAt: string;
  rawResultIds: string[];
  /** Carried through for corroboration.ts's syndication-dedup key. */
  byline?: string;
}

const WIRE_SERVICES = new Set(["reuters", "ap", "associated press", "bloomberg", "afp"]);
const OFFICIAL_PUBLISHERS = new Set(["bureau of labor statistics", "bea"]);

function classifyAuthority(publisher: string): AuthorityClass {
  const lower = publisher.toLowerCase();
  if (OFFICIAL_PUBLISHERS.has(lower)) return "OFFICIAL_STATISTICS";
  if (lower.includes("federal reserve") || lower.includes("fomc")) return "CENTRAL_BANK";
  if (lower.includes("treasury")) return "GOVERNMENT";
  if (lower.includes("research desk") || lower.includes("gold council")) return "RESEARCH_DESK";
  if (WIRE_SERVICES.has(lower)) return "WIRE_SERVICE";
  if (["reuters", "ap", "bloomberg"].some((w) => lower.includes(w))) return "WIRE_SERVICE";
  return "FINANCIAL_MEDIA";
}

// Deterministic mock heuristic: a headline stating a released number/fact is
// a FACT; a headline characterizing reaction, expectation, or sentiment is
// an INFERENCE; anything phrased as speculative/anonymous-sourced is a
// HYPOTHESIS. No real NLP — a keyword match over the deduped mock fixtures.
function classifyEpistemicStatus(headline: string): EpistemicStatus {
  const lower = headline.toLowerCase();
  if (/\b(sources say|is said to|may be|could be|reportedly)\b/.test(lower)) return "HYPOTHESIS";
  if (/\b(expects?|sees?|likely|path|repricing|convinced|downplay)\b/.test(lower)) return "INFERENCE";
  return "FACT";
}

export function extractClaims(deduped: RawSearchResult[]): ClaimDraft[] {
  return deduped.map((result) => ({
    claim: result.headline,
    epistemicStatus: classifyEpistemicStatus(result.headline),
    source: {
      name: result.publisher,
      url: result.url,
      authorityClass: classifyAuthority(result.byline ?? result.publisher),
      publishedAt: result.publishedAt,
    },
    retrievedAt: new Date().toISOString(),
    rawResultIds: [result.providerResultId],
    byline: result.byline,
  }));
}
