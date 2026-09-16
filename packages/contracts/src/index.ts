// F12 (Physical/Structural Gold) is restored here under the product-owner
// rule that every value must be REAL or explicitly UNAVAILABLE, never
// silently absent: rather than being silently excluded, it now ships as
// a real family entry whose KPIs are permanently `dataState:
// "UNAVAILABLE"` / `unavailableReason: "NO_SOURCE"` — central-bank gold
// reserves/quarterly demand have no free API (the World Gold Council does
// not publish one) — see apps/backend/src/real/f12PhysicalGold.ts.
export type FamilyId =
  | "F2"
  | "F3"
  | "F4"
  | "F5"
  | "F6"
  | "F7"
  | "F8"
  | "F9"
  | "F10"
  | "F11"
  | "F12"
  | "F13";

export type Provenance = "observed" | "derived" | "estimated" | "ai";

export type QualityState = "current" | "stale" | "unavailable";

export type Visibility = "cockpit" | "event" | "deep";

export type Surprise = "beat" | "miss" | "inline";

export type SourceTag = string;

export const DEV_MOCK_SOURCE: SourceTag = "DEV_MOCK";

// Milestone 2B — first real-data integration. `MarketDataState` is the
// authoritative, generic (non-provider-specific) flag the UI uses to know
// whether a canonical value is a live provider read, a genuinely-missing
// value this milestone couldn't source, or still a development fixture.
// "MOCK" == untouched families and any deliberately-out-of-scope KPI inside
// a real family; "REAL" == successfully fetched/computed from a live
// no-API-key provider this milestone; "UNAVAILABLE" == explicitly out of
// scope or a live fetch/validation failure — always paired with
// `value: null` and `quality: "unavailable"`, never a stale/guessed number.
export type MarketDataState = "REAL" | "UNAVAILABLE" | "MOCK";

/** Sentinel `sourceTag` for a KPI whose `dataState` is "UNAVAILABLE" — never used for a "MOCK" or "REAL" KPI. */
export const UNAVAILABLE_SOURCE: SourceTag = "UNAVAILABLE";

/**
 * Only meaningful when `dataState === "UNAVAILABLE"` — distinguishes two
 * different situations that both render as "UNAVAILABLE" but mean very
 * different things to a viewer:
 * - "NO_SOURCE": no free public data source exists for this reading at all,
 *   by design — a permanent, expected gap (e.g. the MOVE index, ETF gold
 *   holdings). Never attempted; there is no fetch that could "come back."
 * - "FETCH_FAILED": a real source exists and is normally wired for this
 *   KPI, but this specific attempt failed (rate limit, network error,
 *   temporary outage, or an unusable response). Potentially transient —
 *   the next scheduled refresh may succeed.
 * - "INSUFFICIENT_HISTORY": a real source and computation exist and are
 *   normally wired, but the metric needs >=2 persisted vintages of some
 *   underlying observation (e.g. a revision figure) that this backend has
 *   not yet collected over time — never backfilled/fabricated. Resolves on
 *   its own once enough real history accumulates (e.g. f5-payrolls-revision-2m).
 */
export type UnavailableReason = "NO_SOURCE" | "FETCH_FAILED" | "INSUFFICIENT_HISTORY";

export interface EventItem {
  id: string;
  title: string;
  scheduledAt: string; // ISO timestamp
}

export interface CanonicalKpi {
  id: string;
  familyId: FamilyId;
  label: string;
  value: number | null;
  unit: string | null;
  decimals: number;
  /**
   * Deterministic, server-computed mechanical read for THIS KPI — never
   * AI-derived, never optional. Drives the cockpit cell's color directly.
   * See `MechanicalEvaluation`/`MECHANICAL_RULES`
   * (apps/backend/src/intelligence/mechanical/) for how it is computed.
   */
  mechanicalGoldRead: DisplayRelationship;
  /** The full deterministic evaluation behind `mechanicalGoldRead` — previous/current observations, rule mode, and status. Always present (every cockpit KPI resolves a rule, even a purely `CONTEXTUAL_BY_DESIGN` one). */
  mechanicalEvaluation: MechanicalEvaluation;
  driverSummary: string | null;
  provenance: Provenance;
  /**
   * Set only when this KPI is an honest stand-in for a different, unavailable
   * metric (e.g. GVZ standing in for true Gold options volatility/CVOL) —
   * names what it is a proxy FOR, in plain language. `undefined`/omitted is
   * the default for the vast majority of KPIs, which are not proxies at all.
   * Purely additive — does not change `provenance`/`sourceTag` semantics.
   * The frontend renders a generic "PROXY" badge for ANY KPI where this is
   * set, driven entirely by this field's presence — never by a hardcoded
   * KPI id comparison (see apps/frontend/src/components/market/FamilyModule.tsx).
   */
  proxyFor?: string;
  quality: QualityState;
  /** Milestone 2B — see `MarketDataState`. Generic flag every frontend display-logic branch should key off instead of inspecting `sourceTag`. */
  dataState: MarketDataState;
  /** Only meaningful when `dataState === "UNAVAILABLE"` — see `UnavailableReason`. `undefined` for "REAL"/"MOCK" KPIs. */
  unavailableReason?: UnavailableReason;
  sourceTag: SourceTag;
  /**
   * Optional precise multi-source detail for a DERIVED KPI that genuinely
   * combines series from more than one distinct provider (e.g. F8's
   * `f8-effr-iorb`: NY Fed EFFR minus FRED IORB) — an ordered list naming
   * every contributing provider. `sourceTag` remains a single summary value
   * for backward compatibility (every existing consumer keeps working
   * unchanged); `sourceTags` is additive precision for a KPI display that
   * wants to name every source rather than just one. `undefined` (the
   * default — almost every KPI) means "single-provider, `sourceTag` alone
   * is already precise." Never set on a KPI whose own `sourceTag` already
   * fully names its one true source.
   */
  sourceTags?: SourceTag[];
  observationAt: string; // when this value is as-of
  retrievedAt: string; // when the backend retrieved/computed it
  /** Immediately preceding fetched observation, retained locally so the
   * cockpit can show the evolution before a drawer is opened. */
  previousFetch?: { value: number | null; unit: string | null; observationAt: string; retrievedAt: string } | null;
  visibility: Visibility; // "cockpit" = always on resting card, "event" = event-mode/drawer only, "deep" = drawer-only, normally hidden
  section?: string; // optional grouping label within a family, e.g. "LABOR", "GROWTH", "TARGET_RANGE"
  emphasis?: boolean; // true = this KPI gets visual emphasis (e.g. "most decision-relevant release", "the Δ matters more than the level")
  consensus?: number | null;
  previous?: number | null;
  surprise?: Surprise | null;
  series?: number[]; // small numeric series, e.g. a compact rate-path
}

// ---------------------------------------------------------------------------
// F3 Fed / Rate Pricing — real meeting-probability distribution.
//
// The next-FOMC-meeting probability distribution (F3) comes from a real
// third-party source (investing.com's Fed Rate Monitor tool, itself derived
// from CME 30-Day Fed Funds futures) that can show any number of
// target-rate buckets — not a fixed Hold/-25bp/-50bp set. That rules out
// modeling it as individual `CanonicalKpi` ids (the original mock's
// three-bucket cutting-cycle framing): a real N-bucket distribution needs a
// small structured list instead. This follows the same "family-level
// structured extra alongside the flat KPI array" pattern already used by
// `CanonicalFamilySnapshot.nextEvents`/`activeCatalyst`, rather than
// inventing a new shape.
// ---------------------------------------------------------------------------

/** One target-rate bucket from a real Fed-funds-futures-implied meeting-probability distribution. */
export interface FedRateBucket {
  /** As displayed by the source, e.g. "3.75 - 4.00" — never reformatted/reinterpreted. */
  targetRangeLabel: string;
  /** Current probability, 0-100. */
  probability: number;
  /** Probability as of the source's "previous day" column, when the source reports one. */
  probabilityPreviousDay?: number | null;
  /** Probability as of the source's "previous week" column, when the source reports one. */
  probabilityPreviousWeek?: number | null;
}

/**
 * F3's real next-FOMC-meeting probability distribution. `dataState` is
 * always "REAL" or "UNAVAILABLE" — this is a live-sourced reading, never a
 * "MOCK" placeholder (unlike `CanonicalKpi.dataState`, which does have a
 * MOCK state for untouched families/KPIs).
 */
export interface FedRateDistribution {
  buckets: FedRateBucket[];
  /** The next FOMC meeting's date/time (ISO), best-effort — see the real-data builder for how this is resolved. `null` if genuinely unknown. */
  nextMeetingAt: string | null;
  dataState: Extract<MarketDataState, "REAL" | "UNAVAILABLE">;
  unavailableReason?: UnavailableReason;
  sourceTag: SourceTag;
  /** The source's own displayed "as of"/"updated" timestamp (ISO), when available — otherwise the fetch time. */
  observationAt: string;
  retrievedAt: string;
  /** Immediately preceding fetched observation, retained locally so the
   * cockpit can show the evolution before a drawer is opened. */
}

export interface CanonicalFamilySnapshot {
  familyId: FamilyId;
  label: string;
  kpis: CanonicalKpi[];
  nextEvents?: EventItem[]; // up to a handful of upcoming scheduled items for this family
  activeCatalyst?: EventItem | null; // currently-active catalyst, or null/absent if none
  /** F3 only — see `FedRateDistribution`. `undefined`/absent for every other family. */
  fedRateDistribution?: FedRateDistribution | null;
  /** Server-computed mechanical read for this family as a whole — see `FamilyMechanicalRead`. Absent only for F13, which has no scalar `CanonicalKpi`s to aggregate. */
  mechanicalFamilyRead?: FamilyMechanicalRead;
}

export interface MarketSnapshot {
  generatedAt: string;
  sourceTag: SourceTag;
  families: CanonicalFamilySnapshot[];
}

export type MacroChartInstrumentId = "DXY" | "US2Y" | "US10Y" | "2S10S" | "MOVE" | "GVZ" | "VIX" | "GOLD" | "US10YREAL" | "XAUUSD" | "GLD";
export type MacroChartRange = "1M" | "3M" | "6M" | "1Y";
export type MacroChartSourceKind = "FRED" | "YAHOO" | "SPDR" | "TREASURY" | "UNAVAILABLE";

export interface MacroChartInstrument {
  id: MacroChartInstrumentId;
  label: string;
  unit: "%" | "bps" | "index" | "USD/oz" | "USD/share";
  decimals: number;
  sourceKind: MacroChartSourceKind;
  sourceTag: SourceTag;
  sourceUrl: string;
  sourceOfficial: boolean;
  /** False means that no sufficiently reliable free source is configured. */
  available: boolean;
  provenance: Provenance;
}

export interface MacroChartPoint {
  time: string;
  value: number;
}

export interface MacroChartResponse {
  status: "OK" | "UNAVAILABLE";
  instrument: MacroChartInstrument;
  range: MacroChartRange;
  points: MacroChartPoint[];
  generatedAt: string;
  observationAt: string | null;
  retrievedAt: string | null;
  dataState: Extract<MarketDataState, "REAL" | "UNAVAILABLE">;
  unavailableReason?: UnavailableReason;
  message: string | null;
}

export type ParticipationBreadth =
  | "BROAD_PARTICIPATION"
  | "FUTURES_LED_PARTICIPATION"
  | "ETF_LED_PARTICIPATION"
  | "BROAD_DE_RISKING"
  | "MIXED_PARTIAL_PARTICIPATION";

/** Locked F10 matrix shared by backend tests and the cockpit renderer. */
export function classifyParticipationBreadth(
  cftcWowChange: number | null | undefined,
  etfChange5: number | null | undefined,
  availability?: { futuresUsable: boolean; etfUsable: boolean }
): ParticipationBreadth | null {
  if (availability && (!availability.futuresUsable || !availability.etfUsable)) return null;
  const sign = (value: number | null | undefined): -1 | 0 | 1 => value == null || value === 0 ? 0 : value > 0 ? 1 : -1;
  const futures = sign(cftcWowChange);
  const etf = sign(etfChange5);
  if (futures > 0 && etf > 0) return "BROAD_PARTICIPATION";
  if (futures > 0 && etf < 0) return "FUTURES_LED_PARTICIPATION";
  if (futures < 0 && etf > 0) return "ETF_LED_PARTICIPATION";
  if (futures < 0 && etf < 0) return "BROAD_DE_RISKING";
  return "MIXED_PARTIAL_PARTICIPATION";
}

// ---------------------------------------------------------------------------
// Milestone 1C — KPI Intelligence
//
// Full architecture/rationale: docs/KPI_INTELLIGENCE_ARCHITECTURE.md.
// These types are the wire contract between apps/backend's intelligence
// layer and apps/frontend. Everything here is schema-first and MUST NOT
// grow a field that names, suggests, or scores a trade decision or an
// action/direction/confidence figure for the user to act on — see
// apps/backend/src/intelligence/validateInterpretation.ts (primary
// control) for the runtime enforcement of this rule.
// ---------------------------------------------------------------------------

/**
 * How a KPI's `finalGoldRead` was determined.
 * - "MECHANICAL_RULE": the KPI's `mechanicalGoldRead` is currently
 *   "SUPPORTIVE" or "ADVERSE" — the color is programmatically derived from
 *   the deterministic mechanical engine, never invented by the AI layer. A
 *   KPI whose rule is `OBSERVATION_DELTA`/`CURRENT_SIGN` can still resolve
 *   "CONTEXTUAL_AI" on a given read (e.g. `NO_CHANGE`/`INSUFFICIENT_HISTORY`)
 *   — this basis reflects the CURRENT resolved value, not the rule's mode.
 * - "CONTEXTUAL_AI": the KPI's `mechanicalGoldRead` is currently
 *   "CONTEXTUAL" — the (mock, for now) AI layer supplies its own reasoned
 *   read, and "CONTEXTUAL" is a fully valid, expected, non-fallback outcome
 *   of that reasoning, not a failure case.
 */
export type RelationshipBasis = "MECHANICAL_RULE" | "CONTEXTUAL_AI";

/** The rendered relationship color/state for a KPI's intelligence read. */
export type DisplayRelationship = "SUPPORTIVE" | "ADVERSE" | "CONTEXTUAL";

// ---------------------------------------------------------------------------
// Mechanical relationship engine (Gold Terminal refactor) — deterministic,
// server-computed per-KPI and per-family reads. See
// apps/backend/src/intelligence/mechanical/ for the registry + evaluators
// and docs/REGLES_MECANIQUES_KPI.md for the full rulebook in prose. This is
// the ONLY thing that ever colors a cockpit cell — the (mock/real) AI layer
// below (`KpiInterpretation.finalGoldRead`) explains, it never colors.
// ---------------------------------------------------------------------------

/**
 * How a KPI's mechanical read is computed:
 * - "OBSERVATION_DELTA": compare the two most recent distinct fetched
 *   observations of a LEVEL (e.g. 10Y Real, DXY level) — the KPI's own
 *   value is not itself a delta.
 * - "CURRENT_SIGN": the KPI's own value already IS a delta/flow (e.g. DXY
 *   Today %, MM WoW Δ) — read its sign directly, never compare it again to
 *   a previous fetch (that would be a delta-of-a-delta).
 * - "COMPOSITE": a family-level-only evaluation combining more than one
 *   underlying series (currently only F3's expected-policy-move calculation
 *   from the Fed funds futures-implied distribution) — never resolved at
 *   the individual-KPI level.
 * - "CONTEXTUAL": no defensible fixed mechanical channel exists for this
 *   KPI — always resolves "CONTEXTUAL", by design, not by data gap.
 */
export type MechanicalEvaluationMode = "OBSERVATION_DELTA" | "CURRENT_SIGN" | "COMPOSITE" | "CONTEXTUAL";

/** Which direction of the KPI's own value is SUPPORTIVE for Gold. `null` only for a `CONTEXTUAL`-mode rule, which has no direction to speak of. */
export type SupportiveDirection = "UP" | "DOWN" | null;

/**
 * A named, documented mechanical "channel" — a group of one or more KPIs
 * that measure the SAME underlying economic phenomenon and must therefore
 * be combined into ONE vote at the family level, never counted as separate
 * signals (e.g. DXY Level + Today % + 5D % are all the USD channel).
 */
export type MechanicalChannelId =
  | "REAL_YIELDS" | "NOMINAL_2Y" | "NOMINAL_10Y"   // F2
  | "POLICY_RATES"                                  // F3
  | "USD"                                           // F6
  | "FUTURES_POSITIONING" | "ETF_FLOWS";            // F10

/** Backend-only registry entry describing how one KPI id's mechanical read is computed. See apps/backend/src/intelligence/mechanical/rules.ts. */
export interface MechanicalRuleDefinition {
  kpiId: string;
  familyId: FamilyId;
  mode: MechanicalEvaluationMode;
  supportiveDirection: SupportiveDirection;
  channelId: MechanicalChannelId | null;
}

/** Outcome of resolving one rule against current data — never invented, always traceable back to the two real observations (or the single current one, for `CURRENT_SIGN`) that produced it. */
export type MechanicalEvaluationStatus =
  | "EVALUATED" | "NO_CHANGE" | "INSUFFICIENT_HISTORY" | "INCOMPLETE_COMPOSITE"
  | "NON_COMPARABLE" | "CONTEXTUAL_BY_DESIGN" | "UNAVAILABLE";

/** One resolved mechanical evaluation — attached verbatim to its KPI as `CanonicalKpi.mechanicalEvaluation`, or (F3 only) surfaced as a family-level composite via `FamilyMechanicalRead.compositeEvaluation`. */
export interface MechanicalEvaluation {
  /** = the KPI id, except the F3 composite evaluation ("f3-expected-move"). */
  ruleId: string;
  mode: MechanicalEvaluationMode;
  channelId: MechanicalChannelId | null;
  previousValue: number | null;
  currentValue: number | null;
  delta: number | null;
  status: MechanicalEvaluationStatus;
  read: DisplayRelationship;
}

/** A family's aggregated mechanical read — never a naive majority vote across every KPI; only KPIs sharing a documented `MechanicalChannelId` are combined, and channels never double-count. */
export interface FamilyMechanicalRead {
  read: DisplayRelationship;
  contributingChannels: MechanicalChannelId[];
  reasonCode: "CHANNELS_AGREE" | "CHANNELS_DISAGREE" | "SINGLE_CHANNEL_AVAILABLE" | "NO_CHANNEL_AVAILABLE" | "NOT_APPLICABLE";
  /** F3 only — evaluation of the expected-policy-move composite. Absent for every other family. */
  compositeEvaluation?: MechanicalEvaluation;
}

/** Milestone 1D — deterministic frontend/backend output language. */
export type Language = "EN" | "FR";

/** Epistemic tagging for a single step of reasoning or a single claim. */
export type EpistemicStatus = "FACT" | "INFERENCE" | "HYPOTHESIS" | "UNKNOWN";

/** One step of a causal chain, visibly tagged with its epistemic status. */
export interface EpistemicClaim {
  statement: string;
  status: EpistemicStatus;
}

/** Coarse classification of a research source's institutional authority. */
export type AuthorityClass =
  | "OFFICIAL_STATISTICS"
  | "CENTRAL_BANK"
  | "GOVERNMENT"
  | "WIRE_SERVICE"
  | "FINANCIAL_MEDIA"
  | "RESEARCH_DESK"
  | "OTHER";

/**
 * How well-corroborated a single claim is. `DISPUTED` means two claims
 * about the same underlying fact assert incompatible things — both stay in
 * `evidenceById` and are cross-referenced via `contradictingEvidenceIds`
 * rather than one being silently dropped. `CORROBORATED` requires >=2
 * genuinely independent sources (wire-service syndication of one story
 * counts as ONE source, not N) — see
 * apps/backend/src/intelligence/research/corroboration.ts.
 */
export type VerificationState =
  | "VERIFIED"
  | "CORROBORATED"
  | "UNVERIFIED_DISCOVERY"
  | "DISPUTED";

/** Coarse summary of how well-supported a whole interpretation's evidence base is. */
export type EvidenceState = "STRONG" | "MODERATE" | "LIMITED" | "CONFLICTED";

/**
 * A single normalized, deduplicated research claim. Stored once in a
 * session's shared `ResearchRun.evidenceById` map and referenced by id from
 * any number of `KpiInterpretation`s via their `*EvidenceIds` /
 * `researchSourceIds` arrays — never duplicated in storage.
 */
export interface ClaimRecord {
  id: string;
  claim: string;
  epistemicStatus: EpistemicStatus;
  source: {
    name: string;
    url: string | null;
    authorityClass: AuthorityClass;
    publishedAt: string | null;
  };
  retrievedAt: string;
  verificationState: VerificationState;
  corroboratingIndependentSources: number;
  associatedKpiIds: string[];
}

/** One session's shared, normalized evidence store — the single source of truth for claims. */
export interface ResearchRun {
  sessionId: string;
  runAt: string;
  evidenceById: Record<string, ClaimRecord>;
}

// ---------------------------------------------------------------------------
// Milestone 1D — multi-model ensemble architecture (mock only). See
// docs/KPI_INTELLIGENCE_ARCHITECTURE.md section (d) for the full rationale:
// analysts run independently (never shown each other's output), an optional
// challenge stage runs only under HIGH_SCRUTINY, and an adjudicator produces
// the final read — preserving genuine disagreement (CONTEXTUAL) rather than
// forcing a false consensus. No numeric confidence anywhere in this model.
// ---------------------------------------------------------------------------

/** Whether a KPI's interpretation ran through the light (2-analyst) or the deep (3-analyst + challenge) ensemble pipeline. */
export type AnalysisPolicy = "STANDARD" | "HIGH_SCRUTINY";

/** How closely the independent analysts agreed once results were compared. */
export type ModelAgreement = "UNANIMOUS" | "MAJORITY" | "MIXED" | "SINGLE_ANALYST";

/**
 * Identifies which (mock, for now) model filled a given ensemble role.
 * `provider`/`model` are deliberately open strings, not a closed union —
 * never hardcode real provider names as the only option; today every
 * identity uses `provider: "mock"` placeholders.
 */
export interface ModelRoleIdentity {
  provider: string;
  model: string;
  promptVersion: string;
}

/** One independent analyst's conclusion — never shown another analyst's output before forming its own. */
export interface AnalystConclusion {
  role: "A" | "B" | "C";
  modelIdentity: ModelRoleIdentity;
  finalGoldRead: DisplayRelationship;
  shortConclusion: string;
  keyPoints: string[];
  /**
   * User-explicit requirement: before interpreting anything, the analyst
   * must first check the terminal's own data point(s) against a live,
   * authoritative source it finds via web search, and state the outcome
   * here in plain language — e.g. "Confirmed: Treasury's own site shows the
   * same 4.39% for 2Y as of today" or "Could not verify — no live source
   * checked this run". Always populated (never empty) so a viewer can see
   * whether verification actually happened, not just assume it did.
   */
  dataVerification: string;
}

/** A challenge-stage finding against one analyst's conclusion (HIGH_SCRUTINY only). */
export interface ChallengeFinding {
  targetRole: "A" | "B" | "C";
  concern: string;
  epistemicStatus: EpistemicStatus;
}

/**
 * Audit/debug trail of how a `KpiInterpretation` was produced — explicitly
 * secondary content, never surfaced on the cockpit face. `challengeFindings`
 * is empty under `STANDARD` (no challenge stage runs).
 */
export interface InterpretationAuditTrail {
  policy: AnalysisPolicy;
  analystConclusions: AnalystConclusion[];
  challengeFindings: ChallengeFinding[];
  modelAgreement: ModelAgreement;
  adjudicatorNotes: string;
}

/**
 * The full per-KPI intelligence read. One of these exists per KPI, never
 * collapsed to a family-level summary. See Patch 2/9/10/11/12 in
 * docs/KPI_INTELLIGENCE_ARCHITECTURE.md for the governing rules.
 */
export interface KpiInterpretation {
  kpiId: string;
  familyId: FamilyId;
  /**
   * When this interpretation itself was (re-)computed. Renamed from
   * `analyzedAt` in the timestamp-independence pass — see
   * docs/KPI_INTELLIGENCE_ARCHITECTURE.md's three-timestamp model. This is
   * INTERPRETATION freshness, independent of `dataAsOf` (data freshness) and
   * `evidenceLatestPublishedAt` (evidence freshness) — a KPI's raw value can
   * be unchanged while this timestamp still advances, because a new
   * interpretation was produced from new evidence/context.
   */
  interpretationAnalyzedAt: string;
  /** The canonical KPI's own observation timestamp — data freshness, unrelated to when the interpretation was produced. */
  dataAsOf: string;
  /** The two actual source observations used for the cloud-only mechanical
   * comparison. `previous` is null only until the application has observed a
   * second distinct source fetch; it is never invented from a chart. */
  comparison?: {
    previous: { value: number | null; unit: string | null; observationAt: string; retrievedAt: string } | null;
    current: { value: number | null; unit: string | null; observationAt: string; retrievedAt: string };
  };
  /**
   * The most recent `ClaimRecord.source.publishedAt` among the evidence/
   * claims actually consulted for this interpretation, or `null` if no
   * dated evidence was used (e.g. a purely mechanical read with no research
   * attached). Evidence freshness — independent of `dataAsOf` and
   * `interpretationAnalyzedAt`. See docs/KPI_INTELLIGENCE_ARCHITECTURE.md.
   */
  evidenceLatestPublishedAt: string | null;
  language: Language;
  /** Hard cap ~140 chars (MAX_SHORT_READ_CHARS) — about one sentence. */
  currentReadShort: string;
  currentReadDetailed: string;
  /**
   * A short summary of what the LAST interpretation (this session or a
   * prior one) concluded, or `null` if this is the first analysis this
   * session — there is nothing to compare against yet. Supplied as CONTEXT
   * for identifying what changed, never as an anchor the new interpretation
   * must remain consistent with — see the "previous interpretation is
   * context, not anchor" rule in
   * apps/backend/src/intelligence/ensemble/runAdjudicator.ts and
   * docs/KPI_INTELLIGENCE_ARCHITECTURE.md.
   */
  previousReadSummary: string | null;
  /**
   * What is different now versus `previousReadSummary` — new evidence, new
   * context, or explicitly "no material change". `null` when there is no
   * previous read to compare against (see `previousReadSummary`).
   */
  whatChangedSincePreviousRead: string | null;
  /**
   * The up-to-date, continuity-aware conclusion given everything now known.
   * Distinct from `currentReadDetailed`: `currentReadDetailed` is the full
   * explanatory writeup, `currentRead` is the "here's where we land now"
   * statement that explicitly may confirm, partially revise, or reject
   * `previousReadSummary` — never forced to stay consistent with it. Always
   * present (non-null) even on a first analysis, where it simply states the
   * read with nothing yet to compare against.
   */
  currentRead: string;
  relationshipBasis: RelationshipBasis;
  /**
   * The canonical, read-only mechanical read copied verbatim from
   * `CanonicalKpi.mechanicalGoldRead` at generation time. NEVER written or
   * altered by the (mock) analyst/adjudicator generation logic — always
   * copied read-only from canonical data, and NEVER what drives the
   * cockpit cell's color (that is `CanonicalKpi.mechanicalGoldRead`
   * directly, computed server-side before any AI layer runs). See
   * docs/KPI_INTELLIGENCE_ARCHITECTURE.md and
   * docs/REGLES_MECANIQUES_KPI.md.
   */
  mechanicalGoldRead: DisplayRelationship;
  /**
   * The OUTPUT of the (mock) adjudication process — the drawer's own
   * explanatory read, never the cockpit cell's color. For MECHANICAL_RULE
   * KPIs (`mechanicalGoldRead !== "CONTEXTUAL"`) this normally equals
   * `mechanicalGoldRead`, EXCEPT on the rare, explicitly documented
   * illustrative KPI(s) that demonstrate a mechanical channel can still be
   * judged CONTEXTUAL when other forces are strong enough to make a
   * directional read unreliable right now — that divergence is intentional
   * and rare, never a bug, and it may only ever DEGRADE toward CONTEXTUAL,
   * never invert SUPPORTIVE<->ADVERSE (see validateInterpretation.ts). For
   * CONTEXTUAL_AI KPIs this is genuinely decided by the mock adjudicator
   * step, and CONTEXTUAL is a common, non-fallback outcome. Renamed from
   * `displayRelationship` in Milestone 1D.
   */
  finalGoldRead: DisplayRelationship;
  whyNow: string;
  causalChain: EpistemicClaim[];
  supportingEvidenceIds: string[];
  contradictingEvidenceIds: string[];
  uncertaintyOrUnknowns: string[];
  whatWouldStrengthen: string[];
  whatWouldWeakenOrInvalidate: string[];
  relevantRecentDevelopmentIds: string[];
  researchSourceIds: string[];
  evidenceState: EvidenceState;
  modelIdentity: { provider: string; model: string };
  promptVersion: string;
  isMock: boolean;
  sessionId: string;
  /** Multi-model ensemble audit trail — debug/audit info, never primary cockpit content. */
  auditTrail: InterpretationAuditTrail;
}

/**
 * Server-resolved response for `GET /api/intelligence/kpi/:kpiId` — `evidence`
 * is only the subset of the session's `evidenceById` actually referenced by
 * this interpretation's `*Ids` arrays, resolved server-side for convenience.
 */
export interface KpiInterpretationResponse {
  interpretation: KpiInterpretation;
  evidence: Record<string, ClaimRecord>;
}

/**
 * Milestone 1E — batch cockpit intelligence fetch. Response for
 * `GET /api/intelligence/snapshot?language=EN|FR`: every currently-available
 * cockpit-visible KPI's interpretation for the requested language, WITHOUT
 * resolved evidence (evidence stays resolved only via the per-KPI endpoint,
 * `KpiInterpretationResponse`, so this payload stays light). Replaces the
 * prior ~28-individual-request pattern on the frontend — see
 * apps/frontend/src/context/IntelligenceContext.tsx.
 */
export interface IntelligenceSnapshotResponse {
  dataMode: "DEV_MOCK" | "REAL";
  sessionId: string;
  generatedAt: string;
  interpretations: Record<string, KpiInterpretation>;
}

// ---------------------------------------------------------------------------
// On-demand per-KPI real analysis (manual button click ONLY — never fired
// automatically at server startup or page load). Response for
// `POST /api/intelligence/kpi/:kpiId/analyze?lang=EN|FR` and the read-only,
// no-cost `GET /api/intelligence/kpi/:kpiId/on-demand?lang=EN|FR` cache
// check. Strictly single-KPI in scope — never a cross-KPI/global synthesis.
// See apps/backend/src/intelligence/onDemandAnalysis.ts.
// ---------------------------------------------------------------------------

export type OnDemandAnalysisStatus =
  /** A real interpretation is present AND matches the current data snapshot exactly (see `snapshotHash`) — safe to display as the current read. */
  | "OK"
  /** Zero CLI/API providers are configured — no real analysis is possible right now. */
  | "NOT_CONFIGURED"
  /**
   * User-explicit automation pass (2026-09): a new analysis is running in the
   * background right now because the underlying data changed since the last
   * one (or none exists yet) — never a manual click, never a cost/spam
   * cooldown (that concept is gone from this endpoint; see
   * onDemandAnalysis.ts). The UI should show "Analyzing…" and keep polling;
   * `interpretation` may still carry the previous (now-superseded) result
   * for continuity, but the UI must never present it as the current read.
   */
  | "PENDING"
  /** A very recent on-demand analysis already ran for this KPI+language — the cost/spam guard returned the cached result instead of firing a new paid call. Retained for older callers; the automatic pipeline no longer produces this status. */
  | "COOLDOWN"
  /** At least one provider is configured, but this attempt's real generation failed or didn't pass validateInterpretation.ts. */
  | "UNAVAILABLE"
  /** Read-only cache check (GET): nothing has been on-demand-analyzed for this KPI+language yet. */
  | "NONE";

export interface OnDemandKpiAnalysisResponse {
  status: OnDemandAnalysisStatus;
  interpretation: KpiInterpretation | null;
  /** Only populated alongside a non-null `interpretation`. */
  evidence: Record<string, ClaimRecord> | null;
  /** Human-readable, UI-safe explanation for NOT_CONFIGURED/COOLDOWN/UNAVAILABLE — null on OK/NONE. */
  message: string | null;
  /** How many of the 3 real LLM providers are currently configured (0-3) — lets the UI describe SINGLE_ANALYST degradation honestly. */
  configuredProviderCount: number;
  /** Milliseconds remaining on the cost/spam-guard cooldown — only set when status is "COOLDOWN". */
  cooldownRemainingMs: number | null;
  /**
   * User-explicit automation pass (2026-09): a content hash of the exact
   * KPI/family data snapshot this response's `interpretation` was (or is
   * being) generated from — see onDemandAnalysis.ts's
   * computeKpiSnapshotHash/computeFamilySnapshotHash. `null` only when the
   * KPI/family itself couldn't be resolved. Never used to invent a value —
   * purely a dedup/staleness key so the UI can never mistake an analysis of
   * an old data snapshot for a read of the current one.
   */
  snapshotHash: string | null;
}

// ---------------------------------------------------------------------------
// Milestone 2A — provider/secrets/real-data integration FRAMEWORK (scaffolding
// only; DATA_MODE stays MOCK by default and no real provider is wired into
// the KPI-intelligence generation path this milestone). See
// docs/PROVIDER_SETUP.md and apps/backend/src/providers/registry.ts.
//
// `ProviderStatus` is the ONLY shape the frontend ever sees for a provider —
// individual React components must never know provider-specific details.
// This type structurally CANNOT carry a secret/credential field: the code
// path that builds it only ever has access to a `configured: boolean` fact
// from apps/backend/src/config/env.ts, never a raw credential value.
// ---------------------------------------------------------------------------

export type ProviderStatusState =
  | "NOT_CONFIGURED"
  | "READY"
  | "CONNECTING"
  | "CONNECTED"
  | "DEGRADED"
  | "UNAVAILABLE"
  | "ERROR";

export interface ProviderStatus {
  providerId: string;
  displayName: string;
  configured: boolean;
  status: ProviderStatusState;
  environment: string | null;
  lastSuccessfulRequestAt: string | null;
  lastCheckedAt: string | null;
  latencyMs: number | null;
  errorCode: string | null;
  safeErrorMessage: string | null;
}

// ---------------------------------------------------------------------------
// F13 Economic Calendar — real data (apps/backend/src/real/f13Calendar.ts).
// Dedicated wire contract for the week-strip/day-detail UI, distinct from
// EventItem (which stays the lightweight cockpit nextEvents/activeCatalyst
// shape used by every family). Never fabricated: an empty `days[]`/zero
// `eventCount` reflects genuinely no data, never a mock placeholder — see
// `ingestionStatus` for why a given day may show as REFRESH_FAILED instead
// of a legitimate "no events."
// ---------------------------------------------------------------------------

export type CalendarEventState = "UPCOMING" | "NEXT" | "RELEASED";

export interface CalendarEventItem {
  id: string;
  normalizedEventType: string;
  /** Verbatim event name from the schedule source (JBlanked) — financial/technical terminology is not translated, matching this codebase's existing KPI-label convention. */
  name: string;
  currency: string;
  impact: "High" | "Medium";
  /** True UTC ISO timestamp — already converted from the source's local time at ingestion time (see f13EventTypes.ts). */
  scheduledAtUtc: string;
  /** Display-only timezone label for the frontend, e.g. "ET" for USD events (rendered in America/New_York). */
  timezoneLabel: string;
  previousValue: number | null;
  forecastValue: number | null;
  actualValue: number | null;
  /** Display unit for previousValue/forecastValue/actualValue/surprise — e.g. "%", "K" (thousands), "M" (millions), "pts" (index points). Derived generically from `normalizedEventType` (see f13EventTypes.ts's resolveEventValueUnit) — never a per-event-name lookup. `null` for an unmapped/OTHER_* type whose unit is genuinely unknown; render the bare number rather than guess. */
  unit: string | null;
  /** Which provider the DISPLAYED `actualValue` came from — the official primary source (e.g. "BLS", "BEA", "NYFED") when available, "JBLANKED" otherwise. Null until an actual exists. */
  actualSource: string | null;
  /** actual - forecast, only when both exist and are unit-compatible (see f13EventTypes.ts's cadence-matching rule) — never a guessed/mismatched-unit subtraction. */
  surprise: number | null;
  state: CalendarEventState;
  /** Plain-language "what is this and why do investors watch it" blurb, in the requested language — generic economic education, never a directional call (see f13EventExplanations.ts). Falls back to a generic sentence for an unmapped/OTHER_* type. */
  explanation: string;
}

export interface CalendarDaySummary {
  /** UTC calendar date, "YYYY-MM-DD". */
  date: string;
  eventCount: number;
  hasHighImpact: boolean;
  events: CalendarEventItem[];
  /** True when this specific day's data genuinely could not be confirmed (ingestion has never succeeded, or is currently failing, AND no row exists for this day) — distinct from a day that was successfully checked and legitimately has zero events. */
  refreshFailed: boolean;
}

export type CalendarIngestionStatus = "OK" | "STALE" | "NEVER_RUN" | "FAILED";

export interface CalendarWeekResponse {
  generatedAt: string;
  /** Monday..Sunday (UTC) of the week containing "now". */
  days: CalendarDaySummary[];
  ingestionStatus: CalendarIngestionStatus;
  lastIngestionAt: string | null;
}

// ---------------------------------------------------------------------------
// Overnight Gold Recap — the second user-explicit request: a standalone
// web-research briefing (on-demand button, or auto-generated once a day —
// see apps/backend/src/jobs/goldOvernightAutoRecap.ts) on Gold's Asia and
// London trading sessions, sourced from English, French, Chinese, Japanese
// and Arabic queries (cross-checked for corroboration across languages) and
// output in English or French — this app's two supported `Language` values.
// This is pure AI-generated commentary sourced from live web search — it is
// NEVER treated as canonical Gold market data (F1 stays permanently removed
// from the KPI system; this produces a text briefing, not a data point).
// ---------------------------------------------------------------------------

export interface GoldOvernightSource {
  language: string;
  publisher: string;
  url: string | null;
}

export interface GoldOvernightAgentOutput {
  role: "A" | "B";
  modelIdentity: ModelRoleIdentity;
  summary: string;
  keyMoves: string[];
  catalysts: string[];
  sources: GoldOvernightSource[];
  dataVerification: string;
}

export interface GoldOvernightRecap {
  interpretationAnalyzedAt: string;
  language: Language;
  sessionId: string;
  isMock: boolean;
  /** One paragraph: what moved Gold recently, and anything worth watching for the session ahead. No bullet lists — a single flowing text. */
  recapText: string;
  sources: GoldOvernightSource[];
  agentOutputs: GoldOvernightAgentOutput[];
}

// "OK"/"NONE" only — no manual trigger exists (2026-09-15: automation-only,
// see apps/backend/src/jobs/goldOvernightAutoRecap.ts), so this response can
// never itself be NOT_CONFIGURED/COOLDOWN/UNAVAILABLE; `configuredProviderCount`
// carries the "not configured yet" signal instead.
export type GoldOvernightRecapStatus = "OK" | "NONE";

export interface GoldOvernightRecapResponse {
  status: GoldOvernightRecapStatus;
  recap: GoldOvernightRecap | null;
  message: string | null;
  configuredProviderCount: number;
}
