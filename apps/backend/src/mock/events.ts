import type { EventItem, FamilyId, Language } from "@gold-terminal/contracts";

// Mock scheduling data for families that carry calendar / catalyst
// information alongside (or instead of) scalar KPIs. Colocated with the
// other mock data rather than hardcoded in the cache logic, per the
// Milestone 1B contract.

// Milestone 1E — event titles are static/deterministic text, legitimate to
// localize per the locked static/dynamic boundary. Genuinely authored
// French, keeping financial acronyms/instrument identity untouched (FOMC,
// NFP, CPI, ISM, TIPS) per docs/KPI_INTELLIGENCE_ARCHITECTURE.md section (a).
const EVENT_TITLE_FR: Record<string, string> = {
  "f3-ev-fomc": "Prochaine décision du FOMC",
  // f9-ev-10y/30y/tips stay here (still actively used): F9's real builder
  // (real/f9Treasury.ts's buildNextEvents) reuses these exact ids for its
  // genuine upcoming-auction dates, so this map's French titles still apply
  // to real F9 events. f4-ev-cpi/f5-ev-nfp/f5-ev-growth were removed below
  // (data-layer audit pass) along with their now-permanently-dead mock
  // fixtures — see the FAMILY_EVENTS comment.
  "f9-ev-10y": "Prochaine adjudication à 10 ans",
  "f9-ev-30y": "Prochaine adjudication à 30 ans",
  "f9-ev-tips": "Prochaine adjudication de TIPS",
  // F13's mock fixture events (f13-ev-fomc/cpi/nfp) were removed once F13
  // moved to real macro_events data (see real/f13Calendar.ts) — its event
  // names now come verbatim from the real calendar source and are never
  // routed through this static title map, matching this file's own
  // "financial acronyms/instrument identity untouched" convention above.
};

function localizeEventItem(event: EventItem, language: Language): EventItem {
  if (language === "EN") return event;
  const title = EVENT_TITLE_FR[event.id];
  return title ? { ...event, title } : event;
}

/** Localize an event list's titles in place (returns a new array), never mutating the source. */
export function localizeEvents(events: EventItem[] | undefined, language: Language): EventItem[] | undefined {
  if (!events) return events;
  return events.map((event) => localizeEventItem(event, language));
}

/** Localize a single (possibly null/absent) active catalyst's title. */
export function localizeCatalyst(
  catalyst: EventItem | null | undefined,
  language: Language
): EventItem | null | undefined {
  if (!catalyst) return catalyst;
  return localizeEventItem(catalyst, language);
}

export interface FamilyEventData {
  nextEvents?: EventItem[];
  activeCatalyst?: EventItem | null;
}

// Data-layer audit pass: this map is now permanently EMPTY. Every family
// that ever had a mock scheduling fixture here (F3, F4, F5, F9, F13) is
// REAL, and every one of their real builders unconditionally sets its own
// `nextEvents` (a real schedule, or an explicit `[]` — never `undefined`),
// so `getMarketSnapshot`'s `familyOverride?.nextEvents ?? family.nextEvents`
// fallback in snapshotCache.ts can never actually reach this map for any of
// them any more. The former `daysFromNow(days)` helper that generated every
// one of those fixtures' fake `Date.now()+Nd` dates was removed along with
// them — it has no remaining caller and, more importantly, was exactly the
// "fabricated next-event date" pattern this codebase's real-data rule
// forbids. Kept as an (empty) exported map rather than deleted outright:
// `FamilyEventData`/`FAMILY_EVENTS` are still part of this module's public
// shape (imported by snapshotCache.ts) and a genuinely mock-only family
// added in the future would have a natural place to declare fixture
// scheduling data here.
export const FAMILY_EVENTS: Partial<Record<FamilyId, FamilyEventData>> = {
  // F3 (Fed / Rate Pricing) is REAL now — see apps/backend/src/real/f3Fed.ts.
  // Deliberately no F3 entry here anymore: buildF3Overrides() always sets
  // `nextEvents` itself (the real next-FOMC-meeting date when known, `[]`
  // otherwise), so this fixture became permanently unreachable and was
  // removed rather than left as dead code — same rationale as F13's removal
  // below.
  // F4 (Inflation) is REAL now — see apps/backend/src/real/f4Inflation.ts.
  // Deliberately no F4 entry here anymore: buildF4Overrides() always
  // returns `nextEvents: []` (no real CPI-release-date source exists, and
  // the old `Date.now()+9d` mock placeholder was removed rather than kept
  // as an unearned "next event" — see that file's top-of-file comment), so
  // this fixture became permanently unreachable (`familyOverride.nextEvents`
  // is never `undefined` for F4) and was removed rather than left as dead
  // code — same rationale as F3's/F13's removal in this file.
  //
  // F5 (Employment/Growth) is REAL now — see
  // apps/backend/src/real/f5Employment.ts. Same rationale as F4 above:
  // buildF5Overrides() always returns `nextEvents: []`, so this fixture
  // became permanently unreachable and was removed.
  //
  // F9 (Treasury/Fiscal) is REAL now — see
  // apps/backend/src/real/f9Treasury.ts. buildF9Overrides() ALWAYS sets
  // `nextEvents` itself too: the real upcoming-auction list on success, or
  // an explicit `[]` on a fetch failure (that file's own comment: "a failed
  // real event source must never fall back to a fabricated/mock placeholder
  // date"). Same dead-code situation as F3/F4/F5 above — removed rather
  // than left in place; F9's real builder reuses the exact ids
  // f9-ev-10y/30y/tips, so their French titles stay in EVENT_TITLE_FR above
  // (still genuinely used), only the fake `daysFromNow(...)` dates here are
  // gone.
  //
  // F13 (Economic Calendar) is REAL now — see
  // apps/backend/src/real/f13Calendar.ts and
  // apps/backend/src/cache/snapshotCache.ts's additive F13 handling in
  // getMarketSnapshot(). Deliberately no F13 entry here anymore: the REAL
  // mode rule for F13 is that a fetch failure or "ingestion hasn't run yet"
  // renders genuinely empty, never a `Date.now()+Nd` mock fallback.
};
