// F13 Economic Calendar — pure, side-effect-free helpers: event-name
// normalization, cadence detection (for safe actuals cross-referencing),
// the official-primary-source lookup table, and JBlanked's local-time ->
// true-UTC conversion. Kept separate from f13Calendar.ts (which does DB/
// network I/O) so all of this can be unit-tested with plain fixtures.

// ---------------------------------------------------------------------------
// Timezone — LIVE-VALIDATED (2026-09-01)
// ---------------------------------------------------------------------------
//
// JBlanked's `Date` field ("YYYY.MM.DD HH:MM:SS") carries no timezone marker
// of its own — the milestone brief explicitly flagged a prior "assumed
// GMT+3" as never validated, and asked for this to be checked for real.
//
// Manual diagnostic calls to three MQL5 calendar endpoints (`/calendar/
// range/`, `/calendar/week/`, `/calendar/today/`) with the real
// JBLANKED_API_KEY all returned HTTP 401 "This endpoint requires credits" —
// a billing/quota gate, not an invalid key. However, this app's OWN guarded
// ingestion job (apps/backend/src/jobs/f13CalendarIngestion.ts) later
// succeeded for real the same day (2026-09-01T17:25:08Z, triggered by a
// normal `getMarketSnapshot()` call — see ingestion_state's `jblanked:
// calendar` row), producing 9 genuine rows. That gave a real, independently
// checkable dataset: cross-referencing 6 of those 9 events against their
// well-known official release times —
//   - ADP Nonfarm Employment Change: 08:15 America/New_York, Wed Sep 2 2026
//   - EIA Crude Oil Stocks Change:   10:30 America/New_York, Wed Sep 2 2026
//   - EIA Natural Gas Storage:       10:30 America/New_York, Thu Sep 3 2026
//   - Nonfarm Payrolls / Average Hourly Earnings / Unemployment Rate:
//     08:30 America/New_York, Fri Sep 4 2026 (released together)
// — every single one matched EXACTLY once the raw stored value (which this
// module had computed using a provisional offset of UTC-3) was corrected by
// -10 hours. That means the TRUE native offset is UTC+7, not UTC-3 — the
// UTC-3 guess (sourced from a paraphrase of JBlanked's client-library
// `offset` parameter comments) was wrong; this UTC+7 value is the one
// actually confirmed against six independent, well-known real-world release
// times, which is a stronger live validation than the single-event check
// the milestone brief originally asked for (that specific reference event,
// Thursday Initial Jobless Claims, did not happen to appear in this
// particular ingested batch).
export const JBLANKED_SOURCE_UTC_OFFSET_HOURS = 7;
export const JBLANKED_SOURCE_TIMEZONE_LABEL = "JBLANKED_RAW_UTC+7_LIVE_VALIDATED_20260901";

/**
 * Parses JBlanked's raw "YYYY.MM.DD HH:MM:SS" local-time string and converts
 * it to a true UTC `Date`, using `JBLANKED_SOURCE_UTC_OFFSET_HOURS`. Returns
 * `null` for a string that doesn't match the documented format rather than
 * throwing — a single malformed row must never abort the whole ingestion
 * batch (see f13Calendar.ts's per-row try/catch).
 */
export function parseJblankedLocalDateToUtc(raw: string): Date | null {
  const match = /^(\d{4})\.(\d{2})\.(\d{2})\s+(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(raw.trim());
  if (!match) return null;
  const [, y, mo, d, h, mi, s] = match;
  const localAsUtcMs = Date.UTC(Number(y), Number(mo) - 1, Number(d), Number(h), Number(mi), s ? Number(s) : 0);
  if (Number.isNaN(localAsUtcMs)) return null;
  // localAsUtcMs currently treats the wall-clock numbers as if they were
  // already UTC; subtracting the source's UTC offset (+7 — JBlanked's raw
  // time is 7 hours AHEAD of true UTC, live-validated above) converts to
  // true UTC — see the module doc comment above.
  return new Date(localAsUtcMs - JBLANKED_SOURCE_UTC_OFFSET_HOURS * 3_600_000);
}

// ---------------------------------------------------------------------------
// Event-type normalization
// ---------------------------------------------------------------------------
//
// A deliberately TIGHT, stable list — this is the exact set the product
// needs, not JBlanked's full 40+ event catalog. Order matters below:
// "Core X" variants are checked before the bare term so e.g. "Core CPI m/m"
// never matches the plain CPI branch.
export type NormalizedEventType =
  | "FOMC_RATE_DECISION"
  | "CPI"
  | "CORE_CPI"
  | "PPI"
  | "CORE_PPI"
  | "PCE"
  | "CORE_PCE"
  | "NONFARM_PAYROLLS"
  | "ADP_EMPLOYMENT"
  | "UNEMPLOYMENT_RATE"
  | "AVERAGE_HOURLY_EARNINGS"
  | "INITIAL_JOBLESS_CLAIMS"
  | "JOLTS"
  | "ISM_MANUFACTURING"
  | "ISM_SERVICES"
  | "RETAIL_SALES"
  | "GDP";

export const NORMALIZED_EVENT_TYPES: readonly NormalizedEventType[] = [
  "FOMC_RATE_DECISION",
  "CPI",
  "CORE_CPI",
  "PPI",
  "CORE_PPI",
  "PCE",
  "CORE_PCE",
  "NONFARM_PAYROLLS",
  "ADP_EMPLOYMENT",
  "UNEMPLOYMENT_RATE",
  "AVERAGE_HOURLY_EARNINGS",
  "INITIAL_JOBLESS_CLAIMS",
  "JOLTS",
  "ISM_MANUFACTURING",
  "ISM_SERVICES",
  "RETAIL_SALES",
  "GDP",
];

const OTHER_PREFIX = "OTHER_";
const NORMALIZED_TYPE_MAX_LEN = 128; // matches macro_events.normalized_event_type VARCHAR(128)

/**
 * Product decision (documented per the milestone brief's "your call, document
 * the choice"): an unmapped High/Medium-impact USD event is NEVER dropped —
 * it is kept under a synthesized `OTHER_<slug-of-name>` type (not a single
 * shared "OTHER" bucket) so two different unmapped events landing in the
 * same UTC minute can never collide under macro_events' unique key
 * (normalized_event_type, scheduled_at_utc, currency), and so the raw event
 * identity is still visible from the type column alone for audit/debugging.
 * These render as generic (non-KPI-highlighted) rows in the calendar UI.
 */
export function slugifyForOtherType(rawName: string): string {
  const slug = rawName
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  const budget = NORMALIZED_TYPE_MAX_LEN - OTHER_PREFIX.length;
  return `${OTHER_PREFIX}${(slug || "EVENT").slice(0, budget)}`;
}

export function normalizeEventType(rawName: string): NormalizedEventType | string {
  const n = rawName.toLowerCase();

  // "Federal Funds Rate" (Forex Factory's own wording for the rate decision
  // itself, added 2026-09-14 when the calendar source switched from
  // JBlanked to Forex Factory — see jobs/f13CalendarIngestion.ts) must be
  // checked explicitly: "federal" alone never matches the \bfed\b branch
  // below (no word boundary after "fed" inside "federal"), so this event
  // was silently falling through to an OTHER_* bucket without this branch.
  if (/federal funds rate/.test(n)) return "FOMC_RATE_DECISION";
  if (/\b(fomc|fed(eral reserve)?)\b[^|]*\b(rate|interest rate)\b/.test(n) || /interest rate decision/.test(n)) {
    return "FOMC_RATE_DECISION";
  }
  if (/core pce/.test(n)) return "CORE_PCE";
  if (/\bpce\b/.test(n)) return "PCE";
  if (/core ppi/.test(n)) return "CORE_PPI";
  if (/\bppi\b/.test(n)) return "PPI";
  if (/core cpi/.test(n)) return "CORE_CPI";
  if (/\bcpi\b/.test(n)) return "CPI";
  // ADP's "Nonfarm Employment Change" must be checked BEFORE the bare
  // nonfarm/payrolls branch below (data-quality bug found 2026-09-01: ADP's
  // own private-payroll estimate was previously falling through into the
  // SAME "NONFARM_PAYROLLS" bucket as the official BLS Non-Farm Payrolls
  // release, purely because both names contain "nonfarm"/"payrolls". That
  // collision meant f13Calendar.ts's official-source cross-reference
  // (OFFICIAL_SOURCE_MAP below) could silently overwrite ADP's own JBlanked
  // actual with the unrelated BLS government print once it released — two
  // economically distinct series (ADP's private estimate vs. the official
  // government count) must never share a normalized type or a cross-
  // reference lookup.
  if (/\badp\b/.test(n)) return "ADP_EMPLOYMENT";
  if (/non-?farm|nonfarm payrolls|payrolls/.test(n)) return "NONFARM_PAYROLLS";
  if (/unemployment rate/.test(n)) return "UNEMPLOYMENT_RATE";
  if (/average hourly earnings/.test(n)) return "AVERAGE_HOURLY_EARNINGS";
  if (/unemployment claims|initial jobless claims|jobless claims/.test(n)) return "INITIAL_JOBLESS_CLAIMS";
  if (/jolts/.test(n)) return "JOLTS";
  if (/ism manufacturing pmi/.test(n)) return "ISM_MANUFACTURING";
  if (/ism (non-manufacturing|services) pmi/.test(n)) return "ISM_SERVICES";
  if (/retail sales/.test(n)) return "RETAIL_SALES";
  if (/\bgdp\b/.test(n)) return "GDP";

  return slugifyForOtherType(rawName);
}

/** True for any of the 16 canonical types above; false for a synthesized `OTHER_*` type. */
export function isKnownEventType(normalizedType: string): normalizedType is NormalizedEventType {
  return (NORMALIZED_EVENT_TYPES as readonly string[]).includes(normalizedType);
}

// ---------------------------------------------------------------------------
// Cadence detection — for SAFE actuals cross-referencing only (never stored)
// ---------------------------------------------------------------------------
//
// The same normalized type can carry different units depending on JBlanked's
// own event name (e.g. "PCE Price Index m/m" vs "y/y") — cross-referencing
// an official-source KPI value is only safe when both sides share the same
// cadence/unit. Detected from the RAW name at merge time; never persisted.
export type EventCadence = "MOM" | "YOY" | "QOQ" | "LEVEL";

export function detectCadence(rawName: string): EventCadence {
  const n = rawName.toLowerCase();
  if (/m\/m/.test(n)) return "MOM";
  if (/y\/y/.test(n)) return "YOY";
  if (/q\/q/.test(n)) return "QOQ";
  return "LEVEL";
}

// ---------------------------------------------------------------------------
// Official-primary-source cross-reference map
// ---------------------------------------------------------------------------
//
// Read-only pointers into KPI ids this codebase's other REAL families
// already fetch (BLS/BEA/NY Fed) — see f13Calendar.ts, which reads these
// KPIs' already-computed values from the SAME request's
// `buildRealFamilyOverrides()` result rather than making any new provider
// call. Deliberately excludes: GDP (no official BEA "actual" KPI is wired,
// only GDPNow — a nowcast, not the real print), JOLTS/Retail Sales (no
// official series wired in this codebase), ISM (explicitly no free
// official API exists at all — JBlanked's own Actual is authoritative here,
// full stop, per the milestone brief), and ADP_EMPLOYMENT (ADP is a private
// payroll processor, not a government agency — there is no free official
// "actual" for ADP's own release; it must never be cross-referenced against
// the unrelated official BLS Non-Farm Payrolls KPI, which is exactly the
// bug this type split fixes — see normalizeEventType's ADP branch above).
export interface OfficialSourceMapping {
  kpiId: string;
  source: string;
}

export const OFFICIAL_SOURCE_MAP: Partial<Record<NormalizedEventType, Partial<Record<EventCadence, OfficialSourceMapping>>>> = {
  CPI: {
    MOM: { kpiId: "f4-headline-cpi-mom", source: "BLS" },
    YOY: { kpiId: "f4-headline-cpi-yoy", source: "BLS" },
  },
  CORE_CPI: {
    MOM: { kpiId: "f4-core-cpi-mom", source: "BLS" },
    YOY: { kpiId: "f4-core-cpi-yoy", source: "BLS" },
  },
  PPI: {
    MOM: { kpiId: "f4-ppi-final-demand", source: "BLS" },
  },
  PCE: {
    // Only the YoY headline PCE price index is wired anywhere in this
    // codebase (f4Inflation.ts) — no official headline-MoM KPI exists, so a
    // JBlanked "PCE Price Index m/m" event stays JBlanked-sourced.
    YOY: { kpiId: "f4-headline-pce-yoy", source: "BEA" },
  },
  CORE_PCE: {
    MOM: { kpiId: "f4-core-pce-mom", source: "BEA" },
    YOY: { kpiId: "f4-core-pce-yoy", source: "BEA" },
  },
  NONFARM_PAYROLLS: {
    LEVEL: { kpiId: "f5-payrolls-latest", source: "BLS" },
  },
  UNEMPLOYMENT_RATE: {
    LEVEL: { kpiId: "f5-unemployment", source: "BLS" },
  },
  AVERAGE_HOURLY_EARNINGS: {
    MOM: { kpiId: "f5-ahe-mom", source: "BLS" },
  },
  // Best-effort, documented judgment call: JBlanked's "Actual" for a Fed
  // rate decision is conventionally the new target rate itself, which this
  // codebase's closest equivalent is f3-target-upper (NY Fed's own
  // just-effective target-range upper bound) — not an exact semantic match
  // (a decision announcement vs. an already-effective range), so this is
  // used only as a same-day corroboration, never silently substituted
  // without the cadence match already required by the LEVEL bucket here.
  FOMC_RATE_DECISION: {
    LEVEL: { kpiId: "f3-target-upper", source: "NYFED" },
  },
};

export function lookupOfficialSource(normalizedType: string, cadence: EventCadence): OfficialSourceMapping | null {
  return OFFICIAL_SOURCE_MAP[normalizedType as NormalizedEventType]?.[cadence] ?? null;
}

// ---------------------------------------------------------------------------
// Display-unit resolution — generic, driven by the normalized event type
// ---------------------------------------------------------------------------
//
// Product-owner bug report: the calendar showed bare numbers with no unit
// ("looks wrong"). This maps each of the 17 canonical types to the unit its
// values are conventionally reported in — deliberately NOT a per-event-NAME
// lookup table (which would drift as JBlanked's exact wording changes); it's
// keyed on the same stable `normalizedEventType` bucket already used for
// cadence/official-source matching above. An unmapped/`OTHER_*` type
// resolves to `null` (unit genuinely unknown) — the frontend then renders
// the bare number rather than guessing a unit, consistent with this
// codebase's "never fabricate/never guess" rule.
const PERCENT_TYPES = new Set<NormalizedEventType>([
  "CPI",
  "CORE_CPI",
  "PPI",
  "CORE_PPI",
  "PCE",
  "CORE_PCE",
  "UNEMPLOYMENT_RATE",
  "AVERAGE_HOURLY_EARNINGS",
  "RETAIL_SALES",
  "GDP",
  "FOMC_RATE_DECISION",
]);

// Reported as a raw count of thousands (e.g. Nonfarm Payrolls "+177" means
// +177,000 jobs; Initial Jobless Claims "224" means 224,000 claims).
const THOUSANDS_TYPES = new Set<NormalizedEventType>(["NONFARM_PAYROLLS", "ADP_EMPLOYMENT", "INITIAL_JOBLESS_CLAIMS"]);

// JOLTS Job Openings is conventionally reported in millions (e.g. "7.359").
const MILLIONS_TYPES = new Set<NormalizedEventType>(["JOLTS"]);

// PMI-style diffusion indices (ISM) — index points, not a % or count.
const INDEX_POINT_TYPES = new Set<NormalizedEventType>(["ISM_MANUFACTURING", "ISM_SERVICES"]);

export function resolveEventValueUnit(normalizedType: string): string | null {
  const type = normalizedType as NormalizedEventType;
  if (PERCENT_TYPES.has(type)) return "%";
  if (THOUSANDS_TYPES.has(type)) return "K";
  if (MILLIONS_TYPES.has(type)) return "M";
  if (INDEX_POINT_TYPES.has(type)) return "pts";
  return null;
}
