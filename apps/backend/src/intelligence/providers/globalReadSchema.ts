import type { GlobalReadAgentOutput, GlobalReadBlockId, GlobalReadComponentId } from "@gold-terminal/contracts";

// Global Read — JSON Schema for one CLI agent's complete run through the
// product owner's fixed 12-step methodology. Deliberately large (this is
// the one feature explicitly allowed to be a "big pavé" — nothing here was
// trimmed to make the schema smaller). Both claude-cli (`--json-schema`)
// and codex-cli (`--output-schema` file) consume this exact schema — see
// globalReadCliRunner.ts.

export const GLOBAL_READ_BLOCK_IDS: readonly GlobalReadBlockId[] = [
  "FED_RATE_PRICING",
  "RATES_REAL_YIELDS",
  "USD_LIQUIDITY",
  "INFLATION_GROWTH_FISCAL_CREDIT",
  "FLOWS_POSITIONING",
  "STRUCTURAL",
];

export const GLOBAL_READ_COMPONENT_IDS: readonly GlobalReadComponentId[] = [
  "COT_POSITIONING",
  "OPTIONS_VOL",
  "ETF_FLOWS",
  "STRUCTURAL_CENTRAL_BANKS",
  "GEOPOLITICAL_FISCAL_CREDIT",
];

const HORIZONS = ["INTRADAY", "SWING", "STRUCTURAL"] as const;
const VERDICTS = ["BULLISH", "BEARISH", "NEUTRAL"] as const;
const CONFIDENCES = ["HIGH", "MEDIUM", "LOW"] as const;
const ASYMMETRY_VERDICTS = ["STRONG", "MEDIUM", "WEAK", "TRAP"] as const;

export const GLOBAL_READ_JSON_SCHEMA = {
  type: "object",
  properties: {
    blockReadings: {
      type: "array",
      items: {
        type: "object",
        properties: {
          blockId: { type: "string", enum: [...GLOBAL_READ_BLOCK_IDS] },
          reading: { type: "string" },
        },
        required: ["blockId", "reading"],
        additionalProperties: false,
      },
    },
    componentDeepDives: {
      type: "array",
      items: {
        type: "object",
        properties: {
          componentId: { type: "string", enum: [...GLOBAL_READ_COMPONENT_IDS] },
          findings: { type: "string" },
        },
        required: ["componentId", "findings"],
        additionalProperties: false,
      },
    },
    dataVerificationNotes: { type: "string" },
    competingHypotheses: { type: "array", items: { type: "string" } },
    dominantDriver: { type: "string" },
    independenceTestNotes: { type: "string" },
    contradictions: { type: "array", items: { type: "string" } },
    adversarialCase: { type: "string" },
    horizonVerdicts: {
      type: "array",
      items: {
        type: "object",
        properties: {
          horizon: { type: "string", enum: [...HORIZONS] },
          verdict: { type: "string", enum: [...VERDICTS] },
          confidence: { type: "string", enum: [...CONFIDENCES] },
          rationale: { type: "string" },
          invalidationLevel: { type: "string" },
        },
        required: ["horizon", "verdict", "confidence", "rationale", "invalidationLevel"],
        additionalProperties: false,
      },
    },
    asymmetryNotes: { type: "string" },
    asymmetryVerdict: { type: "string", enum: [...ASYMMETRY_VERDICTS] },
  },
  required: [
    "blockReadings",
    "componentDeepDives",
    "dataVerificationNotes",
    "competingHypotheses",
    "dominantDriver",
    "independenceTestNotes",
    "contradictions",
    "adversarialCase",
    "horizonVerdicts",
    "asymmetryNotes",
    "asymmetryVerdict",
  ],
  additionalProperties: false,
} as const;

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((v) => typeof v === "string");
}

/**
 * Defensively parses one agent's raw Global Read output. Returns `null`
 * (never throws) on ANY shape mismatch — including the two rules this
 * feature explicitly treats as hard requirements, not stylistic
 * preferences: step 5 needs >=2 competing hypotheses, step 7's
 * contradictions list must never be empty (an empty list is, per the
 * product owner's spec, itself a sign the analysis under-searched — treated
 * here as invalid output rather than silently accepted), and step 9-11
 * needs exactly one verdict per horizon (3, one each).
 */
export function parseGlobalReadAgentOutput(raw: unknown): Omit<GlobalReadAgentOutput, "role" | "modelIdentity"> | null {
  if (typeof raw !== "object" || raw === null) return null;
  const obj = raw as Record<string, unknown>;

  if (!Array.isArray(obj.blockReadings)) return null;
  const blockReadings: GlobalReadAgentOutput["blockReadings"] = [];
  for (const item of obj.blockReadings) {
    if (typeof item !== "object" || item === null) return null;
    const b = item as Record<string, unknown>;
    if (!GLOBAL_READ_BLOCK_IDS.includes(b.blockId as GlobalReadBlockId)) return null;
    if (typeof b.reading !== "string" || b.reading.length === 0) return null;
    blockReadings.push({ blockId: b.blockId as GlobalReadBlockId, reading: b.reading });
  }
  if (blockReadings.length !== GLOBAL_READ_BLOCK_IDS.length) return null;

  if (!Array.isArray(obj.componentDeepDives)) return null;
  const componentDeepDives: GlobalReadAgentOutput["componentDeepDives"] = [];
  for (const item of obj.componentDeepDives) {
    if (typeof item !== "object" || item === null) return null;
    const c = item as Record<string, unknown>;
    if (!GLOBAL_READ_COMPONENT_IDS.includes(c.componentId as GlobalReadComponentId)) return null;
    if (typeof c.findings !== "string" || c.findings.length === 0) return null;
    componentDeepDives.push({ componentId: c.componentId as GlobalReadComponentId, findings: c.findings });
  }
  if (componentDeepDives.length !== GLOBAL_READ_COMPONENT_IDS.length) return null;

  if (typeof obj.dataVerificationNotes !== "string" || obj.dataVerificationNotes.length === 0) return null;
  if (!isStringArray(obj.competingHypotheses) || obj.competingHypotheses.length < 2) return null;
  if (typeof obj.dominantDriver !== "string" || obj.dominantDriver.length === 0) return null;
  if (typeof obj.independenceTestNotes !== "string" || obj.independenceTestNotes.length === 0) return null;
  if (!isStringArray(obj.contradictions) || obj.contradictions.length === 0) return null;
  if (typeof obj.adversarialCase !== "string" || obj.adversarialCase.length === 0) return null;

  if (!Array.isArray(obj.horizonVerdicts)) return null;
  const horizonVerdicts: GlobalReadAgentOutput["horizonVerdicts"] = [];
  const seenHorizons = new Set<string>();
  for (const item of obj.horizonVerdicts) {
    if (typeof item !== "object" || item === null) return null;
    const h = item as Record<string, unknown>;
    if (!HORIZONS.includes(h.horizon as (typeof HORIZONS)[number])) return null;
    if (!VERDICTS.includes(h.verdict as (typeof VERDICTS)[number])) return null;
    if (!CONFIDENCES.includes(h.confidence as (typeof CONFIDENCES)[number])) return null;
    if (typeof h.rationale !== "string" || h.rationale.length === 0) return null;
    if (typeof h.invalidationLevel !== "string" || h.invalidationLevel.length === 0) return null;
    seenHorizons.add(h.horizon as string);
    horizonVerdicts.push({
      horizon: h.horizon as (typeof HORIZONS)[number],
      verdict: h.verdict as (typeof VERDICTS)[number],
      confidence: h.confidence as (typeof CONFIDENCES)[number],
      rationale: h.rationale,
      invalidationLevel: h.invalidationLevel,
    });
  }
  if (seenHorizons.size !== HORIZONS.length) return null;

  if (typeof obj.asymmetryNotes !== "string" || obj.asymmetryNotes.length === 0) return null;
  if (!ASYMMETRY_VERDICTS.includes(obj.asymmetryVerdict as (typeof ASYMMETRY_VERDICTS)[number])) return null;

  return {
    blockReadings,
    componentDeepDives,
    dataVerificationNotes: obj.dataVerificationNotes,
    competingHypotheses: obj.competingHypotheses,
    dominantDriver: obj.dominantDriver,
    independenceTestNotes: obj.independenceTestNotes,
    contradictions: obj.contradictions,
    adversarialCase: obj.adversarialCase,
    horizonVerdicts,
    asymmetryNotes: obj.asymmetryNotes,
    asymmetryVerdict: obj.asymmetryVerdict as (typeof ASYMMETRY_VERDICTS)[number],
  };
}
