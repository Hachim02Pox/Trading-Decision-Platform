import type {
  AnalystConclusion,
  CanonicalKpi,
  ChallengeFinding,
  DisplayRelationship,
  EpistemicClaim,
  EvidenceState,
  KpiInterpretation,
  Language,
} from "@gold-terminal/contracts";

// Real intelligence pilot — the `LlmProvider`-shaped interface referenced
// (but never formally declared, since no real provider existed yet) by
// prior milestones' comments in contextPackageBuilder.ts/ensemble/*. Three
// concrete adapters (openaiLlmProvider.ts/anthropicLlmProvider.ts/
// geminiLlmProvider.ts) implement this against the official SDKs. See
// docs/KPI_INTELLIGENCE_ARCHITECTURE.md's "Real intelligence pilot" section.
//
// Every method must return a schema-conformant, parseable object (via each
// provider's structured-output / JSON-mode capability) or throw — callers
// (realInterpretationGenerator.ts) apply the "validate, retry once on
// malformed output, then mark this KPI's real analysis as failed" rule from
// section 5 of the pilot spec. No method here ever silently substitutes
// mock content.

// "claude-cli" / "codex-cli" (added for the no-metered-API CLI providers —
// see claudeCliLlmProvider.ts/codexCliLlmProvider.ts) shell out to the
// user's already-authenticated Claude Code / Codex CLI subscriptions
// instead of calling a metered API. They implement this exact same
// LlmProvider interface so runIndependentAnalysts.ts/runAdjudicator.ts and
// realInterpretationGenerator.ts need no changes to consume them.
export type RealLlmProviderId = "openai" | "anthropic" | "gemini" | "claude-cli" | "codex-cli";

export interface AnalystLlmRequest {
  role: "A" | "B" | "C";
  kpi: CanonicalKpi;
  contextSummary: string;
  /** The mapped mechanical read for MECHANICAL_RULE KPIs, or "CONTEXTUAL" as a neutral starting point for CONTEXTUAL_AI KPIs — never a hint the model must agree with. */
  baseFinalGoldRead: DisplayRelationship;
  language: Language;
}

export interface AnalystLlmResult {
  finalGoldRead: DisplayRelationship;
  shortConclusion: string;
  keyPoints: string[];
  /** See AnalystConclusion.dataVerification in packages/contracts — the mandatory "did you actually check this against a live source" statement. */
  dataVerification: string;
}

export interface ChallengeLlmRequest {
  kpi: CanonicalKpi;
  contextSummary: string;
  analystConclusions: AnalystConclusion[];
  language: Language;
}

export interface ChallengeLlmResult {
  findings: ChallengeFinding[];
}

export interface AdjudicatorLlmRequest {
  kpi: CanonicalKpi;
  contextSummary: string;
  analystConclusions: AnalystConclusion[];
  challengeFindings: ChallengeFinding[];
  /** The KPI's current deterministic mechanical read — "CONTEXTUAL" means no active mechanical constraint (a CONTEXTUAL_AI KPI, or a MECHANICAL_RULE KPI whose evaluation currently resolved NO_CHANGE/INSUFFICIENT_HISTORY/etc). */
  mechanicalGoldRead: DisplayRelationship;
  previousInterpretation: KpiInterpretation | null;
  language: Language;
}

export interface AdjudicatorLlmResult {
  currentReadShort: string;
  currentReadDetailed: string;
  whyNow: string;
  causalChain: EpistemicClaim[];
  uncertaintyOrUnknowns: string[];
  whatWouldStrengthen: string[];
  whatWouldWeakenOrInvalidate: string[];
  /** Ignored by the caller for MECHANICAL_RULE KPIs (mechanicalGoldRead is never overridden) — only meaningful for CONTEXTUAL_AI KPIs. */
  finalGoldRead: DisplayRelationship;
  evidenceState: EvidenceState;
  adjudicatorNotes: string;
  previousReadSummary: string | null;
  whatChangedSincePreviousRead: string | null;
  currentRead: string;
}

export interface LlmProvider {
  readonly id: RealLlmProviderId;
  readonly model: string;
  generateAnalystConclusion(request: AnalystLlmRequest): Promise<AnalystLlmResult>;
  generateChallengeFindings(request: ChallengeLlmRequest): Promise<ChallengeLlmResult>;
  generateAdjudication(request: AdjudicatorLlmRequest): Promise<AdjudicatorLlmResult>;
}

// ---------------------------------------------------------------------------
// A tiny, provider-agnostic JSON-schema DSL. OpenAI (Structured Outputs) and
// Anthropic (strict tool input_schema) both consume near-identical standard
// JSON Schema, so `toStandardJsonSchema` serves both; Gemini's
// `responseSchema` uses a structurally different `Type` enum + `format:
// "enum"` convention, so it gets its own converter. Keeping ONE canonical
// definition per role (below) and two converters means the three provider
// adapters can never silently drift out of shape with each other.
// ---------------------------------------------------------------------------

export type JsonSchemaNode =
  | { kind: "string"; enumValues?: readonly string[] }
  | { kind: "array"; items: JsonSchemaNode }
  | { kind: "object"; properties: Record<string, JsonSchemaNode>; required: readonly string[] };

export function toStandardJsonSchema(node: JsonSchemaNode): Record<string, unknown> {
  if (node.kind === "string") {
    return node.enumValues ? { type: "string", enum: [...node.enumValues] } : { type: "string" };
  }
  if (node.kind === "array") {
    return { type: "array", items: toStandardJsonSchema(node.items) };
  }
  const properties: Record<string, unknown> = {};
  for (const [key, child] of Object.entries(node.properties)) {
    properties[key] = toStandardJsonSchema(child);
  }
  return {
    type: "object",
    properties,
    required: [...node.required],
    additionalProperties: false,
  };
}

const GOLD_READ_ENUM = ["SUPPORTIVE", "ADVERSE", "CONTEXTUAL"] as const;
const EPISTEMIC_STATUS_ENUM = ["FACT", "INFERENCE", "HYPOTHESIS", "UNKNOWN"] as const;
const ROLE_ENUM = ["A", "B", "C"] as const;
const EVIDENCE_STATE_ENUM = ["STRONG", "MODERATE", "LIMITED", "CONFLICTED"] as const;

// currentReadShort/shortConclusion cap is enforced at the prompt level
// (instructed) AND re-enforced structurally afterward by the existing
// validateInterpretation.ts truncation — schema alone cannot express a
// character-length cap portably across all three providers.
export const ANALYST_RESULT_SCHEMA: JsonSchemaNode = {
  kind: "object",
  properties: {
    finalGoldRead: { kind: "string", enumValues: GOLD_READ_ENUM },
    shortConclusion: { kind: "string" },
    keyPoints: { kind: "array", items: { kind: "string" } },
    dataVerification: { kind: "string" },
  },
  required: ["finalGoldRead", "shortConclusion", "keyPoints", "dataVerification"],
};

export const CHALLENGE_RESULT_SCHEMA: JsonSchemaNode = {
  kind: "object",
  properties: {
    findings: {
      kind: "array",
      items: {
        kind: "object",
        properties: {
          targetRole: { kind: "string", enumValues: ROLE_ENUM },
          concern: { kind: "string" },
          epistemicStatus: { kind: "string", enumValues: EPISTEMIC_STATUS_ENUM },
        },
        required: ["targetRole", "concern", "epistemicStatus"],
      },
    },
  },
  required: ["findings"],
};

// previousReadSummary/whatChangedSincePreviousRead are modeled as plain
// (non-nullable) strings — the model is instructed to return an empty
// string when there is no previous interpretation to compare against, and
// the adapters map "" -> null afterward. This avoids relying on a nullable
// JSON-schema union shape, which is not uniformly portable across all three
// providers' strict/structured-output modes.
export const ADJUDICATOR_RESULT_SCHEMA: JsonSchemaNode = {
  kind: "object",
  properties: {
    currentReadShort: { kind: "string" },
    currentReadDetailed: { kind: "string" },
    whyNow: { kind: "string" },
    causalChain: {
      kind: "array",
      items: {
        kind: "object",
        properties: {
          statement: { kind: "string" },
          status: { kind: "string", enumValues: EPISTEMIC_STATUS_ENUM },
        },
        required: ["statement", "status"],
      },
    },
    uncertaintyOrUnknowns: { kind: "array", items: { kind: "string" } },
    whatWouldStrengthen: { kind: "array", items: { kind: "string" } },
    whatWouldWeakenOrInvalidate: { kind: "array", items: { kind: "string" } },
    finalGoldRead: { kind: "string", enumValues: GOLD_READ_ENUM },
    evidenceState: { kind: "string", enumValues: EVIDENCE_STATE_ENUM },
    adjudicatorNotes: { kind: "string" },
    previousReadSummary: { kind: "string" },
    whatChangedSincePreviousRead: { kind: "string" },
    currentRead: { kind: "string" },
  },
  required: [
    "currentReadShort",
    "currentReadDetailed",
    "whyNow",
    "causalChain",
    "uncertaintyOrUnknowns",
    "whatWouldStrengthen",
    "whatWouldWeakenOrInvalidate",
    "finalGoldRead",
    "evidenceState",
    "adjudicatorNotes",
    "previousReadSummary",
    "whatChangedSincePreviousRead",
    "currentRead",
  ],
};

/** Shared shape guards — deliberately narrow, checked BEFORE any field is trusted, mirroring validateInterpretation.ts's "shape first" doctrine. */
export function isDisplayRelationship(value: unknown): value is DisplayRelationship {
  return typeof value === "string" && (GOLD_READ_ENUM as readonly string[]).includes(value);
}

export function isEvidenceState(value: unknown): value is EvidenceState {
  return typeof value === "string" && (EVIDENCE_STATE_ENUM as readonly string[]).includes(value);
}

export function isEpistemicStatus(value: unknown): value is EpistemicClaim["status"] {
  return typeof value === "string" && (EPISTEMIC_STATUS_ENUM as readonly string[]).includes(value);
}

export function isRole(value: unknown): value is "A" | "B" | "C" {
  return typeof value === "string" && (ROLE_ENUM as readonly string[]).includes(value);
}

export function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((v) => typeof v === "string");
}

function emptyToNull(value: string): string | null {
  return value.length > 0 ? value : null;
}

export function parseAnalystResult(raw: unknown): AnalystLlmResult {
  if (typeof raw !== "object" || raw === null) throw new Error("analyst result is not an object");
  const obj = raw as Record<string, unknown>;
  if (!isDisplayRelationship(obj.finalGoldRead)) throw new Error("analyst result: invalid finalGoldRead");
  if (typeof obj.shortConclusion !== "string" || obj.shortConclusion.length === 0) {
    throw new Error("analyst result: invalid shortConclusion");
  }
  if (!isStringArray(obj.keyPoints)) throw new Error("analyst result: invalid keyPoints");
  if (typeof obj.dataVerification !== "string" || obj.dataVerification.length === 0) {
    throw new Error("analyst result: invalid dataVerification");
  }
  return {
    finalGoldRead: obj.finalGoldRead,
    shortConclusion: obj.shortConclusion,
    keyPoints: obj.keyPoints,
    dataVerification: obj.dataVerification,
  };
}

export function parseChallengeResult(raw: unknown): ChallengeLlmResult {
  if (typeof raw !== "object" || raw === null) throw new Error("challenge result is not an object");
  const obj = raw as Record<string, unknown>;
  if (!Array.isArray(obj.findings)) throw new Error("challenge result: findings must be an array");
  const findings: ChallengeFinding[] = obj.findings.map((item, index) => {
    if (typeof item !== "object" || item === null) throw new Error(`challenge result: findings[${index}] is not an object`);
    const f = item as Record<string, unknown>;
    if (!isRole(f.targetRole)) throw new Error(`challenge result: findings[${index}].targetRole invalid`);
    if (typeof f.concern !== "string" || f.concern.length === 0) {
      throw new Error(`challenge result: findings[${index}].concern invalid`);
    }
    if (!isEpistemicStatus(f.epistemicStatus)) throw new Error(`challenge result: findings[${index}].epistemicStatus invalid`);
    return { targetRole: f.targetRole, concern: f.concern, epistemicStatus: f.epistemicStatus };
  });
  return { findings };
}

export function parseAdjudicatorResult(raw: unknown): AdjudicatorLlmResult {
  if (typeof raw !== "object" || raw === null) throw new Error("adjudicator result is not an object");
  const obj = raw as Record<string, unknown>;

  const requiredStrings: (keyof AdjudicatorLlmResult)[] = [
    "currentReadShort",
    "currentReadDetailed",
    "whyNow",
    "adjudicatorNotes",
    "currentRead",
  ];
  for (const key of requiredStrings) {
    if (typeof obj[key] !== "string" || (obj[key] as string).length === 0) {
      throw new Error(`adjudicator result: invalid ${key}`);
    }
  }
  if (typeof obj.previousReadSummary !== "string") throw new Error("adjudicator result: invalid previousReadSummary");
  if (typeof obj.whatChangedSincePreviousRead !== "string") {
    throw new Error("adjudicator result: invalid whatChangedSincePreviousRead");
  }
  if (!isStringArray(obj.uncertaintyOrUnknowns)) throw new Error("adjudicator result: invalid uncertaintyOrUnknowns");
  if (!isStringArray(obj.whatWouldStrengthen)) throw new Error("adjudicator result: invalid whatWouldStrengthen");
  if (!isStringArray(obj.whatWouldWeakenOrInvalidate)) throw new Error("adjudicator result: invalid whatWouldWeakenOrInvalidate");
  if (!isDisplayRelationship(obj.finalGoldRead)) throw new Error("adjudicator result: invalid finalGoldRead");
  if (!isEvidenceState(obj.evidenceState)) throw new Error("adjudicator result: invalid evidenceState");
  if (!Array.isArray(obj.causalChain)) throw new Error("adjudicator result: invalid causalChain");

  const causalChain: EpistemicClaim[] = obj.causalChain.map((item, index) => {
    if (typeof item !== "object" || item === null) throw new Error(`adjudicator result: causalChain[${index}] is not an object`);
    const step = item as Record<string, unknown>;
    if (typeof step.statement !== "string" || step.statement.length === 0) {
      throw new Error(`adjudicator result: causalChain[${index}].statement invalid`);
    }
    if (!isEpistemicStatus(step.status)) throw new Error(`adjudicator result: causalChain[${index}].status invalid`);
    return { statement: step.statement, status: step.status };
  });

  return {
    currentReadShort: obj.currentReadShort as string,
    currentReadDetailed: obj.currentReadDetailed as string,
    whyNow: obj.whyNow as string,
    causalChain,
    uncertaintyOrUnknowns: obj.uncertaintyOrUnknowns as string[],
    whatWouldStrengthen: obj.whatWouldStrengthen as string[],
    whatWouldWeakenOrInvalidate: obj.whatWouldWeakenOrInvalidate as string[],
    finalGoldRead: obj.finalGoldRead,
    evidenceState: obj.evidenceState,
    adjudicatorNotes: obj.adjudicatorNotes as string,
    previousReadSummary: emptyToNull(obj.previousReadSummary as string),
    whatChangedSincePreviousRead: emptyToNull(obj.whatChangedSincePreviousRead as string),
    currentRead: obj.currentRead as string,
  };
}

/**
 * Call `fn` once, retry exactly once more on ANY thrown error (network,
 * malformed JSON, failed shape parse), then rethrow. Never a silent third
 * attempt, never a mock substitution. `fn` receives the attempt number (1
 * or 2) so callers can pass an accurate value to `recordRealLlmCall` — the
 * first attempt's failure is also logged here (a warning, not swallowed
 * silently) so a retry is genuinely visible in server logs, not just its
 * eventual outcome.
 */
export async function withOneRetry<T>(fn: (attempt: 1 | 2) => Promise<T>): Promise<T> {
  try {
    return await fn(1);
  } catch (firstError) {
    console.warn(
      JSON.stringify({
        msg: "real intelligence provider call failed on first attempt, retrying once",
        error: firstError instanceof Error ? firstError.message : String(firstError),
      })
    );
    try {
      return await fn(2);
    } catch (secondError) {
      throw secondError instanceof Error ? secondError : new Error(String(secondError));
    }
  }
}
