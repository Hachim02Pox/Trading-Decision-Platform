import type {
  AnalysisPolicy,
  DisplayRelationship,
  EpistemicStatus,
  EvidenceState,
  KpiInterpretation,
  Language,
  ModelAgreement,
  RelationshipBasis,
  VerificationState,
} from "@gold-terminal/contracts";
import { MAX_SHORT_READ_CHARS } from "./constants";

// ---------------------------------------------------------------------------
// PRIMARY control (schema-first ban on trade language): this validator is
// the authoritative guard. It is deliberately strict about shape (allowed
// key set + enum literals + length caps) BEFORE any keyword scanning runs,
// because once a real LLM produces this JSON, shape drift is the more
// likely failure mode than an isolated bad phrase. The keyword guard below
// is explicitly SECONDARY / best-effort only — see
// docs/KPI_INTELLIGENCE_ARCHITECTURE.md.
// ---------------------------------------------------------------------------

const ALLOWED_KEYS: readonly (keyof KpiInterpretation)[] = [
  "kpiId",
  "familyId",
  "interpretationAnalyzedAt",
  "dataAsOf",
  "evidenceLatestPublishedAt",
  "language",
  "currentReadShort",
  "currentReadDetailed",
  "previousReadSummary",
  "whatChangedSincePreviousRead",
  "currentRead",
  "relationshipBasis",
  "mechanicalGoldRead",
  "comparison",
  "finalGoldRead",
  "whyNow",
  "causalChain",
  "supportingEvidenceIds",
  "contradictingEvidenceIds",
  "uncertaintyOrUnknowns",
  "whatWouldStrengthen",
  "whatWouldWeakenOrInvalidate",
  "relevantRecentDevelopmentIds",
  "researchSourceIds",
  "evidenceState",
  "modelIdentity",
  "promptVersion",
  "isMock",
  "sessionId",
  "auditTrail",
];

const ALLOWED_KEY_SET = new Set<string>(ALLOWED_KEYS);

const RELATIONSHIP_BASIS_VALUES: readonly RelationshipBasis[] = ["MECHANICAL_RULE", "CONTEXTUAL_AI"];
const DISPLAY_RELATIONSHIP_VALUES: readonly DisplayRelationship[] = ["SUPPORTIVE", "ADVERSE", "CONTEXTUAL"];
const EVIDENCE_STATE_VALUES: readonly EvidenceState[] = ["STRONG", "MODERATE", "LIMITED", "CONFLICTED"];
const EPISTEMIC_STATUS_VALUES: readonly EpistemicStatus[] = ["FACT", "INFERENCE", "HYPOTHESIS", "UNKNOWN"];
const VERIFICATION_STATE_VALUES: readonly VerificationState[] = [
  "VERIFIED",
  "CORROBORATED",
  "UNVERIFIED_DISCOVERY",
  "DISPUTED",
];
const LANGUAGE_VALUES: readonly Language[] = ["EN", "FR"];
const ANALYSIS_POLICY_VALUES: readonly AnalysisPolicy[] = ["STANDARD", "HIGH_SCRUTINY"];
const MODEL_AGREEMENT_VALUES: readonly ModelAgreement[] = ["UNANIMOUS", "MAJORITY", "MIXED", "SINGLE_ANALYST"];

// Deliberately narrow, anchored patterns — NOT a bare buy/sell word match —
// so legitimate defensive phrasing ("this is not a buy signal") never
// false-positives. Secondary/best-effort only; the schema checks above are
// the real control.
const TRADE_LANGUAGE_DENYLIST: readonly RegExp[] = [
  /\b(buy now|sell now|go long now|go short now|strong buy|strong sell)\b/i,
  /\b\d{1,3}%\s*(bullish|bearish)\b/i,
];

export interface ValidationIssue {
  field: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  issues: ValidationIssue[];
  /** The object with any extra/unknown keys stripped and currentReadShort truncated if needed. */
  sanitized: KpiInterpretation;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((v) => typeof v === "string");
}

export function validateInterpretation(candidate: unknown): ValidationResult {
  const issues: ValidationIssue[] = [];

  if (!isPlainObject(candidate)) {
    throw new Error("validateInterpretation: candidate is not an object");
  }

  // (a) Allowed key set only — strip anything extra.
  const stripped: Record<string, unknown> = {};
  for (const key of Object.keys(candidate)) {
    if (ALLOWED_KEY_SET.has(key)) {
      stripped[key] = candidate[key];
    } else {
      issues.push({ field: key, message: `Unknown field "${key}" stripped from KpiInterpretation.` });
    }
  }
  for (const key of ALLOWED_KEYS) {
    if (!(key in stripped)) {
      issues.push({ field: key, message: `Missing required field "${key}".` });
    }
  }

  // (b) Enum fields.
  if (!RELATIONSHIP_BASIS_VALUES.includes(stripped.relationshipBasis as RelationshipBasis)) {
    issues.push({ field: "relationshipBasis", message: "Invalid relationshipBasis enum value." });
  }
  if (!DISPLAY_RELATIONSHIP_VALUES.includes(stripped.finalGoldRead as DisplayRelationship)) {
    issues.push({ field: "finalGoldRead", message: "Invalid finalGoldRead enum value." });
  }
  if (!DISPLAY_RELATIONSHIP_VALUES.includes(stripped.mechanicalGoldRead as DisplayRelationship)) {
    issues.push({ field: "mechanicalGoldRead", message: "Invalid mechanicalGoldRead enum value." });
  }
  if (!EVIDENCE_STATE_VALUES.includes(stripped.evidenceState as EvidenceState)) {
    issues.push({ field: "evidenceState", message: "Invalid evidenceState enum value." });
  }
  if (!LANGUAGE_VALUES.includes(stripped.language as Language)) {
    issues.push({ field: "language", message: "Invalid language enum value." });
  }

  // (b1) Mechanical/AI consistency invariants (Gold Terminal mechanical
  // engine refactor): `relationshipBasis` must reflect the CURRENT
  // `mechanicalGoldRead` value, and the AI layer may only ever DEGRADE a
  // mechanical read toward CONTEXTUAL — never invert SUPPORTIVE<->ADVERSE.
  const expectedBasis: RelationshipBasis = stripped.mechanicalGoldRead === "CONTEXTUAL" ? "CONTEXTUAL_AI" : "MECHANICAL_RULE";
  if (stripped.relationshipBasis !== expectedBasis) {
    issues.push({ field: "relationshipBasis", message: `relationshipBasis must be "${expectedBasis}" when mechanicalGoldRead is "${stripped.mechanicalGoldRead}".` });
  }
  if (stripped.mechanicalGoldRead === "SUPPORTIVE" && stripped.finalGoldRead === "ADVERSE") {
    issues.push({ field: "finalGoldRead", message: "finalGoldRead may never flip a SUPPORTIVE mechanicalGoldRead to ADVERSE." });
  }
  if (stripped.mechanicalGoldRead === "ADVERSE" && stripped.finalGoldRead === "SUPPORTIVE") {
    issues.push({ field: "finalGoldRead", message: "finalGoldRead may never flip an ADVERSE mechanicalGoldRead to SUPPORTIVE." });
  }
  const causalChain = Array.isArray(stripped.causalChain) ? stripped.causalChain : [];
  causalChain.forEach((step, index) => {
    if (!isPlainObject(step) || !EPISTEMIC_STATUS_VALUES.includes(step.status as EpistemicStatus)) {
      issues.push({ field: `causalChain[${index}].status`, message: "Invalid EpistemicClaim.status enum value." });
    }
  });

  // (b2) auditTrail — structural check only (shape + enums); per-analyst
  // content is free-text mock/fixture data, not schema-constrained here.
  if (!isPlainObject(stripped.auditTrail)) {
    issues.push({ field: "auditTrail", message: "auditTrail must be an object." });
  } else {
    const auditTrail = stripped.auditTrail;
    if (!ANALYSIS_POLICY_VALUES.includes(auditTrail.policy as AnalysisPolicy)) {
      issues.push({ field: "auditTrail.policy", message: "Invalid AnalysisPolicy enum value." });
    }
    if (!MODEL_AGREEMENT_VALUES.includes(auditTrail.modelAgreement as ModelAgreement)) {
      issues.push({ field: "auditTrail.modelAgreement", message: "Invalid ModelAgreement enum value." });
    }
    if (!Array.isArray(auditTrail.analystConclusions)) {
      issues.push({ field: "auditTrail.analystConclusions", message: "Must be an array." });
    }
    if (!Array.isArray(auditTrail.challengeFindings)) {
      issues.push({ field: "auditTrail.challengeFindings", message: "Must be an array." });
    }
  }

  // (b3) Three-timestamp model + continuity fields (timestamp-independence
  // pass) — evidenceLatestPublishedAt/previousReadSummary/
  // whatChangedSincePreviousRead are string-or-null; currentRead is a
  // required non-empty string.
  if (stripped.evidenceLatestPublishedAt !== null && typeof stripped.evidenceLatestPublishedAt !== "string") {
    issues.push({ field: "evidenceLatestPublishedAt", message: "Must be a string or null." });
  }
  if (stripped.previousReadSummary !== null && typeof stripped.previousReadSummary !== "string") {
    issues.push({ field: "previousReadSummary", message: "Must be a string or null." });
  }
  if (stripped.whatChangedSincePreviousRead !== null && typeof stripped.whatChangedSincePreviousRead !== "string") {
    issues.push({ field: "whatChangedSincePreviousRead", message: "Must be a string or null." });
  }
  if (typeof stripped.currentRead !== "string" || stripped.currentRead.length === 0) {
    issues.push({ field: "currentRead", message: "Must be a non-empty string." });
  }

  if (!isStringArray(stripped.supportingEvidenceIds)) issues.push({ field: "supportingEvidenceIds", message: "Must be string[]." });
  if (!isStringArray(stripped.contradictingEvidenceIds)) issues.push({ field: "contradictingEvidenceIds", message: "Must be string[]." });
  if (!isStringArray(stripped.uncertaintyOrUnknowns)) issues.push({ field: "uncertaintyOrUnknowns", message: "Must be string[]." });
  if (!isStringArray(stripped.whatWouldStrengthen)) issues.push({ field: "whatWouldStrengthen", message: "Must be string[]." });
  if (!isStringArray(stripped.whatWouldWeakenOrInvalidate)) issues.push({ field: "whatWouldWeakenOrInvalidate", message: "Must be string[]." });
  if (!isStringArray(stripped.relevantRecentDevelopmentIds)) issues.push({ field: "relevantRecentDevelopmentIds", message: "Must be string[]." });
  if (!isStringArray(stripped.researchSourceIds)) issues.push({ field: "researchSourceIds", message: "Must be string[]." });

  // (c) currentReadShort length cap — truncate rather than reject outright,
  // so a minor overage from a future real LLM degrades gracefully.
  let currentReadShort = typeof stripped.currentReadShort === "string" ? stripped.currentReadShort : "";
  if (currentReadShort.length > MAX_SHORT_READ_CHARS) {
    issues.push({
      field: "currentReadShort",
      message: `currentReadShort exceeded ${MAX_SHORT_READ_CHARS} chars and was truncated.`,
    });
    currentReadShort = `${currentReadShort.slice(0, MAX_SHORT_READ_CHARS - 1)}…`;
  }
  stripped.currentReadShort = currentReadShort;

  // Secondary, best-effort keyword guard.
  const textFields = [stripped.currentReadShort, stripped.currentReadDetailed, stripped.whyNow]
    .filter((v): v is string => typeof v === "string")
    .join(" \n ");
  for (const pattern of TRADE_LANGUAGE_DENYLIST) {
    if (pattern.test(textFields)) {
      issues.push({
        field: "currentReadShort/currentReadDetailed/whyNow",
        message: `Secondary keyword guard matched a denylisted trade phrase (${pattern}).`,
      });
    }
  }

  return {
    valid: issues.length === 0,
    issues,
    sanitized: stripped as unknown as KpiInterpretation,
  };
}

export function isValidVerificationState(value: unknown): value is VerificationState {
  return VERIFICATION_STATE_VALUES.includes(value as VerificationState);
}
