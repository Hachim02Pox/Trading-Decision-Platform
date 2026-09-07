import type { AnalystLlmResult } from "./llmProvider";

// CLI-provider shared output shape. Deliberately NOT the full internal
// `KpiInterpretation`/`AnalystConclusion` shape — a minimal, clean subset
// covering exactly one analyst's read (`finalGoldRead`, `shortConclusion`,
// `keyPoints`) plus a short evidence list the CLI's own web-search tool
// surfaced (`claim`/`sourceUrl`/`publishedAt`). Both CLI providers
// (claudeCliLlmProvider.ts/codexCliLlmProvider.ts) request output
// constrained to this exact schema, then this file's `parseCliAnalystOutput`
// defensively validates it and `mapCliAnalystOutputToAnalystLlmResult` maps
// it into the pre-existing `AnalystLlmResult` shape every other provider
// already returns — no changes needed anywhere in
// runIndependentAnalysts.ts/runAdjudicator.ts/realInterpretationGenerator.ts.
//
// `sourceUrl`/`publishedAt` are modeled as plain (possibly-empty) strings,
// not nullable fields — mirrors llmProvider.ts's ADJUDICATOR_RESULT_SCHEMA
// convention (nullable JSON-schema unions aren't uniformly portable, here
// across two very different CLI structured-output mechanisms) — "" maps to
// `null` after parsing.

export interface CliEvidenceItem {
  claim: string;
  sourceUrl: string | null;
  publishedAt: string | null;
}

export interface CliAnalystOutput {
  finalGoldRead: "SUPPORTIVE" | "ADVERSE" | "CONTEXTUAL";
  shortConclusion: string;
  keyPoints: string[];
  evidence: CliEvidenceItem[];
  /** Mandatory first-step statement: what live source(s) were checked for the terminal's own data point(s), and whether they matched. See AnalystConclusion.dataVerification in packages/contracts. */
  dataVerification: string;
}

/** Standard JSON Schema — consumed directly by `claude --json-schema` and written to a file for `codex exec --output-schema`. */
export const CLI_ANALYST_JSON_SCHEMA = {
  type: "object",
  properties: {
    finalGoldRead: { type: "string", enum: ["SUPPORTIVE", "ADVERSE", "CONTEXTUAL"] },
    shortConclusion: { type: "string" },
    keyPoints: { type: "array", items: { type: "string" } },
    dataVerification: { type: "string" },
    evidence: {
      type: "array",
      items: {
        type: "object",
        properties: {
          claim: { type: "string" },
          sourceUrl: { type: "string" },
          publishedAt: { type: "string" },
        },
        required: ["claim", "sourceUrl", "publishedAt"],
        additionalProperties: false,
      },
    },
  },
  required: ["finalGoldRead", "shortConclusion", "keyPoints", "dataVerification", "evidence"],
  additionalProperties: false,
} as const;

const GOLD_READ_VALUES = ["SUPPORTIVE", "ADVERSE", "CONTEXTUAL"] as const;

function emptyToNull(value: string): string | null {
  return value.length > 0 ? value : null;
}

/**
 * Defensively validates and parses raw CLI output against
 * `CLI_ANALYST_JSON_SCHEMA`'s shape. Returns `null` (never throws) on ANY
 * mismatch — malformed/partial output from a CLI's own free-form JSON mode
 * (Codex, when its schema-constraint isn't cleanly honored) must be treated
 * as "this analyst's contribution failed" by the caller, never guessed at
 * or partially trusted.
 */
export function parseCliAnalystOutput(raw: unknown): CliAnalystOutput | null {
  if (typeof raw !== "object" || raw === null) return null;
  const obj = raw as Record<string, unknown>;

  if (typeof obj.finalGoldRead !== "string" || !GOLD_READ_VALUES.includes(obj.finalGoldRead as (typeof GOLD_READ_VALUES)[number])) {
    return null;
  }
  if (typeof obj.shortConclusion !== "string" || obj.shortConclusion.length === 0) return null;
  if (!Array.isArray(obj.keyPoints) || !obj.keyPoints.every((v) => typeof v === "string")) return null;
  if (typeof obj.dataVerification !== "string" || obj.dataVerification.length === 0) return null;
  if (!Array.isArray(obj.evidence)) return null;

  const evidence: CliEvidenceItem[] = [];
  for (const item of obj.evidence) {
    if (typeof item !== "object" || item === null) return null;
    const e = item as Record<string, unknown>;
    if (typeof e.claim !== "string" || e.claim.length === 0) return null;
    if (typeof e.sourceUrl !== "string") return null;
    if (typeof e.publishedAt !== "string") return null;
    evidence.push({ claim: e.claim, sourceUrl: emptyToNull(e.sourceUrl), publishedAt: emptyToNull(e.publishedAt) });
  }

  return {
    finalGoldRead: obj.finalGoldRead as CliAnalystOutput["finalGoldRead"],
    shortConclusion: obj.shortConclusion,
    keyPoints: obj.keyPoints as string[],
    dataVerification: obj.dataVerification,
    evidence,
  };
}

/**
 * Best-effort extraction of a JSON object from a string that may contain
 * surrounding prose despite instructions not to (Codex's plain-JSON-via-
 * prompt fallback path) — finds the first `{...}` balanced-looking span and
 * attempts `JSON.parse` on it. Returns `null` (never throws) if nothing
 * parses; callers must treat that identically to a schema mismatch.
 */
export function extractJsonObjectLoosely(text: string): unknown {
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    // Fall through to a best-effort scan below.
  }
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  try {
    return JSON.parse(trimmed.slice(start, end + 1));
  } catch {
    return null;
  }
}

function formatEvidenceAsKeyPoint(item: CliEvidenceItem): string {
  const sourcePart = item.sourceUrl ? ` (source: ${item.sourceUrl})` : "";
  return `${item.claim}${sourcePart}`;
}

/** Maps this feature's own minimal CLI schema into the pre-existing `AnalystLlmResult` shape every provider returns. Evidence claims are folded into `keyPoints` (as `AnalystLlmResult` has no dedicated evidence field) so the ensemble/validation pipeline needs zero changes. */
export function mapCliAnalystOutputToAnalystLlmResult(output: CliAnalystOutput): AnalystLlmResult {
  return {
    finalGoldRead: output.finalGoldRead,
    shortConclusion: output.shortConclusion,
    keyPoints: [...output.keyPoints, ...output.evidence.map(formatEvidenceAsKeyPoint)],
    dataVerification: output.dataVerification,
  };
}
