import assert from "node:assert/strict";
import test from "node:test";
import {
  normalizeEventType,
  slugifyForOtherType,
  detectCadence,
  lookupOfficialSource,
  parseJblankedLocalDateToUtc,
  resolveEventValueUnit,
  JBLANKED_SOURCE_UTC_OFFSET_HOURS,
  NORMALIZED_EVENT_TYPES,
} from "../apps/backend/src/real/f13EventTypes.ts";
import { getEventExplanation } from "../apps/backend/src/real/f13EventExplanations.ts";
import { computeIngestionDecision } from "../apps/backend/src/jobs/f13CalendarIngestion.ts";
import type { IngestionState } from "../apps/backend/src/db/ingestionState.ts";

test("getEventExplanation: every canonical event type has a distinct, non-empty EN and FR explanation", () => {
  const seenEn = new Set<string>();
  for (const type of NORMALIZED_EVENT_TYPES) {
    for (const language of ["EN", "FR"] as const) {
      const explanation = getEventExplanation(type, language);
      assert.ok(explanation.length > 0, `${type}/${language} must have an explanation`);
    }
    const en = getEventExplanation(type, "EN");
    assert.ok(!seenEn.has(en), `${type}'s EN explanation must be distinct from every other type's`);
    seenEn.add(en);
  }
});

test("getEventExplanation: an unmapped/OTHER_* type falls back to the generic explanation instead of throwing or returning empty", () => {
  const explanation = getEventExplanation("OTHER_SOME_UNMAPPED_EVENT", "EN");
  assert.ok(explanation.length > 0);
  assert.equal(explanation, getEventExplanation("OTHER_ANOTHER_UNMAPPED_EVENT", "EN"), "unmapped types share the same generic explanation");
});

// F13 real economic calendar — pure-function coverage for event-name
// normalization, cadence detection, the official-source lookup table, the
// JBlanked local-time -> UTC conversion, and the once-weekly ingestion guard.
// None of these tests touch the network or MySQL — see
// apps/backend/src/real/f13EventTypes.ts's top-of-file comment for why the
// live JBlanked timezone check could not be completed this pass (the
// account's calendar endpoints all returned a billing/credits rejection,
// live-confirmed against the real key in apps/backend/.env).

test("normalizeEventType maps the canonical 16-item list correctly", () => {
  assert.equal(normalizeEventType("Fed Interest Rate Decision"), "FOMC_RATE_DECISION");
  assert.equal(normalizeEventType("Core CPI m/m"), "CORE_CPI");
  assert.equal(normalizeEventType("CPI y/y"), "CPI");
  assert.equal(normalizeEventType("Core PPI m/m"), "CORE_PPI");
  assert.equal(normalizeEventType("PPI m/m"), "PPI");
  assert.equal(normalizeEventType("Core PCE Price Index m/m"), "CORE_PCE");
  assert.equal(normalizeEventType("PCE Price Index y/y"), "PCE");
  assert.equal(normalizeEventType("Non-Farm Employment Change"), "NONFARM_PAYROLLS");
  assert.equal(normalizeEventType("Unemployment Rate"), "UNEMPLOYMENT_RATE");
  assert.equal(normalizeEventType("Average Hourly Earnings m/m"), "AVERAGE_HOURLY_EARNINGS");
  assert.equal(normalizeEventType("Unemployment Claims"), "INITIAL_JOBLESS_CLAIMS");
  assert.equal(normalizeEventType("JOLTS Job Openings"), "JOLTS");
  assert.equal(normalizeEventType("ISM Manufacturing PMI"), "ISM_MANUFACTURING");
  assert.equal(normalizeEventType("ISM Non-Manufacturing PMI"), "ISM_SERVICES");
  assert.equal(normalizeEventType("Retail Sales m/m"), "RETAIL_SALES");
  assert.equal(normalizeEventType("Advance GDP q/q"), "GDP");
});

test("normalizeEventType checks Core variants before the bare term (order matters)", () => {
  assert.equal(normalizeEventType("Core CPI m/m"), "CORE_CPI", "must not fall through to the plain CPI branch");
  assert.equal(normalizeEventType("Core PCE Price Index m/m"), "CORE_PCE", "must not fall through to the plain PCE branch");
});

test("normalizeEventType classifies ADP's own release separately from the official BLS Nonfarm Payrolls type", () => {
  // Data-quality bug found 2026-09-01: "ADP Nonfarm Employment Change"
  // previously fell into the SAME "NONFARM_PAYROLLS" bucket as the true
  // government release, purely because both names contain "nonfarm"/
  // "payrolls". That collision would let f13Calendar.ts's official-source
  // cross-reference silently substitute the unrelated BLS print for ADP's
  // own JBlanked actual — two economically distinct series must never share
  // a type or a cross-reference lookup.
  assert.equal(normalizeEventType("ADP Nonfarm Employment Change"), "ADP_EMPLOYMENT");
  assert.notEqual(normalizeEventType("ADP Nonfarm Employment Change"), normalizeEventType("Non-Farm Employment Change"));
  assert.equal(normalizeEventType("Non-Farm Employment Change"), "NONFARM_PAYROLLS");
});

test("normalizeEventType synthesizes a distinct OTHER_<slug> type for an unmapped event", () => {
  const result = normalizeEventType("Building Permits m/m");
  assert.match(result, /^OTHER_/);
  assert.equal(result, "OTHER_BUILDING_PERMITS_M_M");
});

test("slugifyForOtherType two different unmapped names never collide (avoids the macro_events unique-key trap)", () => {
  const a = slugifyForOtherType("Housing Starts m/m");
  const b = slugifyForOtherType("Building Permits m/m");
  assert.notEqual(a, b);
});

test("slugifyForOtherType truncates to fit macro_events.normalized_event_type VARCHAR(128)", () => {
  const veryLongName = "A".repeat(300);
  const slug = slugifyForOtherType(veryLongName);
  assert.ok(slug.length <= 128, `expected <= 128 chars, got ${slug.length}`);
});

test("detectCadence reads m/m, y/y, q/q, and defaults to LEVEL", () => {
  assert.equal(detectCadence("Core CPI m/m"), "MOM");
  assert.equal(detectCadence("CPI y/y"), "YOY");
  assert.equal(detectCadence("Advance GDP q/q"), "QOQ");
  assert.equal(detectCadence("Non-Farm Employment Change"), "LEVEL");
});

test("lookupOfficialSource only returns a mapping for a cadence that actually exists for that type", () => {
  assert.deepEqual(lookupOfficialSource("CORE_CPI", "MOM"), { kpiId: "f4-core-cpi-mom", source: "BLS" });
  assert.deepEqual(lookupOfficialSource("CORE_CPI", "YOY"), { kpiId: "f4-core-cpi-yoy", source: "BLS" });
  // PPI has no official YOY KPI wired anywhere in this codebase — must not fabricate one.
  assert.equal(lookupOfficialSource("PPI", "YOY"), null);
  // ISM has explicitly no free official source at all (per the milestone brief) — always null.
  assert.equal(lookupOfficialSource("ISM_MANUFACTURING", "LEVEL"), null);
  // GDP has no official BEA "actual" KPI wired (only GDPNow, a nowcast) — always null.
  assert.equal(lookupOfficialSource("GDP", "QOQ"), null);
  // ADP is a private payroll processor, not a government agency — no free
  // official "actual" exists for it, and it must never be cross-referenced
  // against the unrelated official BLS Non-Farm Payrolls KPI.
  assert.equal(lookupOfficialSource("ADP_EMPLOYMENT", "LEVEL"), null);
});

test("resolveEventValueUnit is driven by the normalized type, not per-event-name lookups", () => {
  assert.equal(resolveEventValueUnit("CPI"), "%");
  assert.equal(resolveEventValueUnit("UNEMPLOYMENT_RATE"), "%");
  assert.equal(resolveEventValueUnit("GDP"), "%");
  assert.equal(resolveEventValueUnit("NONFARM_PAYROLLS"), "K");
  assert.equal(resolveEventValueUnit("ADP_EMPLOYMENT"), "K");
  assert.equal(resolveEventValueUnit("INITIAL_JOBLESS_CLAIMS"), "K");
  assert.equal(resolveEventValueUnit("JOLTS"), "M");
  assert.equal(resolveEventValueUnit("ISM_MANUFACTURING"), "pts");
  assert.equal(resolveEventValueUnit("ISM_SERVICES"), "pts");
  // An unmapped/OTHER_* type's unit is genuinely unknown — never guessed.
  assert.equal(resolveEventValueUnit("OTHER_BUILDING_PERMITS_M_M"), null);
});

test("JBLANKED_SOURCE_UTC_OFFSET_HOURS is UTC+7, live-validated against 6 real release times", () => {
  // See f13EventTypes.ts's top-of-file comment for the full methodology:
  // this app's own guarded ingestion job succeeded for real on 2026-09-01,
  // and cross-referencing 6 of the 9 ingested events against their
  // independently well-known official release times (ADP, EIA crude, EIA
  // nat gas, NFP, AHE, Unemployment Rate) showed every one matching exactly
  // once corrected by -10 hours from a provisional UTC-3 assumption —
  // i.e. the true native offset is UTC+7, not UTC-3.
  assert.equal(JBLANKED_SOURCE_UTC_OFFSET_HOURS, 7);
});

test("parseJblankedLocalDateToUtc converts a UTC+7 wall-clock time to true UTC by subtracting 7 hours", () => {
  // Real Nonfarm Payrolls releases 08:30 America/New_York (EDT, UTC-4) on
  // the first Friday of the month -> true UTC 12:30. A UTC+7 source
  // reports that same instant as 19:30 local (12:30 + 7:00).
  const parsed = parseJblankedLocalDateToUtc("2026.09.04 19:30:00");
  assert.ok(parsed);
  assert.equal(parsed!.toISOString(), "2026-09-04T12:30:00.000Z");
});

test("parseJblankedLocalDateToUtc accepts the no-seconds variant of the documented format", () => {
  const parsed = parseJblankedLocalDateToUtc("2026.09.04 19:30");
  assert.ok(parsed);
  assert.equal(parsed!.toISOString(), "2026-09-04T12:30:00.000Z");
});

test("parseJblankedLocalDateToUtc returns null (never throws) for a malformed date string", () => {
  assert.equal(parseJblankedLocalDateToUtc("not-a-date"), null);
  assert.equal(parseJblankedLocalDateToUtc(""), null);
});

// ---------------------------------------------------------------------------
// Ingestion guard — the once-per-week (plus failure-cooldown) decision logic
// that sits BEFORE any call to providers/jblanked.ts. Pure function, no DB.
// ---------------------------------------------------------------------------

function state(overrides: Partial<IngestionState>): IngestionState {
  return {
    jobKey: "jblanked:calendar",
    lastAttemptAt: null,
    lastSuccessAt: null,
    lastStatus: "NEVER_RUN",
    lastError: null,
    expectedNextAt: null,
    ...overrides,
  };
}

// Bug report (2026-09-01): JOLTS/ISM (both 10:00 ET) still showed no
// Actual hours after release. Root cause confirmed directly against
// `macro_events`/`ingestion_state`: the day's single JBlanked call fired at
// 13:25:08Z (09:25 ET) — before BOTH the 08:30 and 10:00 ET release
// windows — because ingestion is lazy/request-triggered and simply used
// whatever request happened to be first that UTC day. The fix gates the
// day's first attempt behind a target ingestion hour (11:00 ET) so the one
// daily call more often lands after both windows, WITHOUT spending a
// second call. 2026-09-01/09-02 are EDT (UTC-4): 11:00 ET = 15:00Z.

test("ingestion guard attempts when the job has never run and the target hour has been reached", () => {
  const decision = computeIngestionDecision(null, new Date("2026-09-01T16:00:00Z")); // 12:00 ET
  assert.equal(decision.attempt, true);
});

test("ingestion guard waits when the job has never run but the target ingestion hour has not been reached", () => {
  // This is exactly the live-observed bug: an 09:25 ET request would have
  // burned the day's only call before the 08:30/10:00 ET release windows.
  const decision = computeIngestionDecision(null, new Date("2026-09-01T13:25:00Z")); // 09:25 ET
  assert.equal(decision.attempt, false, "must not spend today's single call before the target ingestion hour");
});

test("ingestion guard blocks a second attempt during the SAME UTC week after a success", () => {
  const decision = computeIngestionDecision(
    state({ lastStatus: "SUCCESS", lastSuccessAt: new Date("2026-09-01T02:00:00Z") }),
    new Date("2026-09-01T23:00:00Z")
  );
  assert.equal(decision.attempt, false, "must not call JBlanked again during the same UTC week");
});

test("ingestion guard reuses Monday's fetch through Friday", () => {
  const decision = computeIngestionDecision(
    state({ lastStatus: "SUCCESS", lastSuccessAt: new Date("2026-09-07T16:00:00Z") }),
    new Date("2026-09-11T16:00:00Z")
  );
  assert.equal(decision.attempt, false, "must reuse the complete weekly fetch until Sunday ends");
});

test("ingestion guard permits an explicit manual refresh during the same week", () => {
  const decision = computeIngestionDecision(
    state({ lastStatus: "SUCCESS", lastSuccessAt: new Date("2026-09-07T16:00:00Z") }),
    new Date("2026-09-11T16:00:00Z"),
    true
  );
  assert.equal(decision.attempt, true);
});

test("ingestion guard allows one new fetch when the UTC week rolls over", () => {
  const decision = computeIngestionDecision(
    state({ lastStatus: "SUCCESS", lastSuccessAt: new Date("2026-08-31T16:00:00Z") }),
    new Date("2026-09-07T16:05:00Z") // 12:05 ET on the next Monday
  );
  assert.equal(decision.attempt, true);
});

test("ingestion guard waits for the target hour in a new week", () => {
  const decision = computeIngestionDecision(
    state({ lastStatus: "SUCCESS", lastSuccessAt: new Date("2026-08-31T16:00:00Z") }),
    new Date("2026-09-07T11:00:00Z") // 07:00 ET in the next week — too early
  );
  assert.equal(decision.attempt, false);
});

test("ingestion guard blocks an immediate retry after a FAILURE (cooldown), e.g. the live-confirmed QUOTA_EXCEEDED case", () => {
  const decision = computeIngestionDecision(
    state({ lastStatus: "FAILED", lastAttemptAt: new Date("2026-09-01T12:00:00Z"), lastError: "[QUOTA_EXCEEDED] no credits" }),
    new Date("2026-09-01T12:05:00Z")
  );
  assert.equal(decision.attempt, false, "must not hammer JBlanked again minutes after a failure");
});

test("ingestion guard allows a retry after a FAILURE once the cooldown has elapsed", () => {
  const decision = computeIngestionDecision(
    state({ lastStatus: "FAILED", lastAttemptAt: new Date("2026-09-01T12:00:00Z"), lastError: "network error" }),
    new Date("2026-09-01T13:01:00Z")
  );
  assert.equal(decision.attempt, true);
});
