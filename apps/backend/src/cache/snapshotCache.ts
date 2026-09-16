import type {
  CanonicalFamilySnapshot,
  CanonicalKpi,
  FamilyId,
  Language,
  MarketSnapshot,
  QualityState,
} from "@gold-terminal/contracts";
import { UNAVAILABLE_SOURCE } from "@gold-terminal/contracts";
import { FAMILY_LABELS } from "../mock/families";
import { KPI_FIXTURES, localizeDriverSummary } from "../mock/fixtures";
import { FAMILY_EVENTS, localizeCatalyst, localizeEvents } from "../mock/events";
import { buildRealFamilyOverrides, REAL_FAMILY_IDS } from "../real/buildRealOverrides";
import { buildF13CockpitEvents } from "../real/f13Calendar";
import type { KpiOverride } from "../real/types";
import { rememberKpiObservation } from "../intelligence/cloud/kpiHistory";
import { rememberFedDistribution } from "../intelligence/cloud/fedProbabilityHistory";
import { attachMechanicalReads, type FamilyBeforeMechanicalReads } from "../intelligence/mechanical/attachMechanicalReads";

type BootKpi = Omit<CanonicalKpi, "quality" | "mechanicalGoldRead" | "mechanicalEvaluation">;

interface BootFamilySnapshot {
  familyId: FamilyId;
  label: string;
  kpis: BootKpi[];
  nextEvents?: CanonicalFamilySnapshot["nextEvents"];
  activeCatalyst?: CanonicalFamilySnapshot["activeCatalyst"];
}

interface BootSnapshot {
  builtAt: number;
  families: BootFamilySnapshot[];
}

// Milestone 1C: freshness vocabulary simplified to 3 states. The
// "current" -> "stale" boundary for MOCK-family KPIs is time-driven off real
// elapsed wall-clock time since boot (unchanged — this is a deliberately
// simplified demo mechanic, not a model of any real publication cadence).
const CURRENT_THRESHOLD_MS = 60 * 60_000;

// ---------------------------------------------------------------------------
// Milestone 2B — cadence-aware freshness for REAL (non-mock) KPIs.
//
// Real government/exchange data is not published continuously, so reusing
// the flat 60-minute mock threshold above would make e.g. Friday's Treasury
// yield read "STALE" by Friday evening, and last month's CPI print would
// have read "STALE" within an hour of being fetched — even though both are
// genuinely the latest available official reading. Instead, each REAL KPI
// is bucketed by how often its underlying series is actually republished,
// and staleness is judged against THAT KPI's own `observationAt` (the
// as-of date of the data itself), not against boot time or fetch time:
//
//   - daily   (Treasury par yields, NY Fed target range): stale past ~4 days
//     — covers a weekend + a holiday Monday without a false "STALE".
//   - weekly  (CFTC COT, released Fridays for the prior Tuesday): stale past
//     ~12 days — covers one missed/delayed Friday release.
//   - monthly (BLS CPI/employment, ~2-3 week reporting lag): stale past ~45
//     days — comfortably covers the normal lag with buffer for a delayed
//     release before it's treated as genuinely concerning.
//
// F9's completed-auction stats (10Y high yield/bid-to-cover/indirect share)
// are bucketed as "monthly" — a documented judgment call: an individual
// tenor's Treasury auctions recur roughly monthly, which is the closest of
// the three buckets defined above (the milestone brief only specifies
// daily/weekly/monthly cadences, not an "irregular/auction" one).
// ---------------------------------------------------------------------------
type Cadence = "daily" | "weekly" | "monthly" | "event";
const DAY_MS = 86_400_000;
const CADENCE_THRESHOLD_MS: Record<Cadence, number> = {
  daily: 4 * DAY_MS,
  weekly: 12 * DAY_MS,
  monthly: 45 * DAY_MS,
  event: 6 * 60 * 60_000,
};

const REAL_KPI_CADENCE: Partial<Record<string, Cadence>> = {
  "f2-2y": "daily",
  "f2-10y": "daily",
  "f2-10y-real": "daily",
  "f2-be10": "daily",
  "f2-5y5y": "daily",
  "f2-2s10s": "daily",
  "f3-target-lower": "event",
  "f3-target-upper": "event",
  // F3's meeting-probability distribution (the former homemade CME-ZQ-
  // settlement calculation, removed for a confirmed bug — see
  // real/f3Fed.ts's top-of-file comment) is NOT a CanonicalKpi any more, so
  // it has no cadence entry here — it is now `FedRateDistribution`, a
  // family-level structured field with its own dataState, computed
  // directly by real/f3Fed.ts rather than through this KPI-cadence map.
  // f3-repricing/f3-path-6m stay permanently UNAVAILABLE (NO_SOURCE),
  // unrelated to that removal — see f3Fed.ts's top-of-file comment.
  "f4-core-cpi-mom": "monthly",
  "f4-core-cpi-yoy": "monthly",
  "f4-headline-cpi-mom": "monthly",
  "f4-headline-cpi-yoy": "monthly",
  "f4-core-cpi-3m-ann": "monthly",
  "f5-unemployment": "monthly",
  "f5-payrolls-latest": "monthly",
  "f5-payrolls-3m": "monthly",
  // f5-payrolls-revision-2m was previously unconditionally UNAVAILABLE (no
  // cadence entry needed, since `computeQualityForKpi` short-circuits to
  // "unavailable" for any UNAVAILABLE KPI regardless of cadence). This pass
  // makes it genuinely REAL once >=2 real vintages exist — a REAL id with no
  // cadence entry here would silently fall back to "current" forever
  // (the exact prior-milestone mistake this map's own comment warns against).
  "f5-payrolls-revision-2m": "monthly",
  "f9-auction-high-yield": "monthly",
  "f9-auction-btc": "monthly",
  "f9-auction-indirect": "monthly",
  // QRA (Quarterly Refunding) borrowing estimates — genuinely quarterly
  // cadence (~4 releases/year), but `Cadence` only defines daily/weekly/
  // monthly. "monthly" is the closest bucket — same documented judgment
  // call already made for f9-auction-*/high-yield/btc/indirect above (see
  // that comment) — its 45-day threshold means a release reads "current"
  // for 45 days after publication, then honestly "stale" for the remainder
  // of the ~90-day gap until the next release, rather than a falsely
  // reassuring "current" for the full quarter.
  "f9-qra-borrowing": "monthly",
  "f9-qra-revision": "monthly",
  "f10-mm-net-pct": "weekly",
  "f10-mm-wow-pp": "weekly",
  // 156-week Managed Money net-% percentile rank (Milestone 2C — see
  // apps/backend/src/real/f10Flows.ts) — same weekly CFTC COT cadence as
  // the other two F10 real KPIs above.
  "f10-mm-percentile": "weekly",
  // GLD physical holdings (this pass) — SPDR's historical-archive XLSX is
  // genuinely daily-cadence (one new row per trading day) — see
  // apps/backend/src/real/f10Gld.ts.
  "f10-etf-holdings": "daily",
  "f10-etf-delta": "daily",
  "f10-etf-delta-5d": "daily",
  "f10-etf-delta-20d": "daily",
  "f10-etf-flow-z60": "daily",
  "f10-etf-flow-percentile": "daily",
  "f10-gld-return-5d": "daily",
  "f10-gld-return-20d": "daily",
  "f4-core-pce-mom": "monthly",
  "f4-core-pce-yoy": "monthly",
  "f4-headline-pce-yoy": "monthly",
  "f4-ppi-final-demand": "monthly",
  "f5-ahe-mom": "monthly",
  // GDPNow's FRED `date` field is the target quarter's start (not the
  // publication date), but the actual reading is republished near-daily
  // during the quarter — "daily" is the closest of the three defined
  // buckets and freshness is judged against `realtimeStart`, not `date`
  // (see apps/backend/src/real/f5Employment.ts).
  "f5-gdpnow": "daily",
  "f5-claims-4w": "weekly",
  // New this pass — FRED ICSA/CCSA, same weekly-cadence source as
  // f5-claims-4w (IC4WSA) above. See apps/backend/src/real/f5Employment.ts.
  "f5-claims-initial": "weekly",
  "f5-claims-continuing": "weekly",
  "f7-vix": "daily",
  "f7-vix-1d": "daily",
  "f7-hy-oas": "daily",
  "f7-hy-oas-1d": "daily",
  "f7-ig-oas": "daily",
  "f8-reserves-level": "weekly",
  "f8-reserves-wow": "weekly",
  "f8-sofr-iorb": "daily",
  "f8-effr-iorb": "daily",
  "f8-funding-microstate": "daily",
  // F2/F8 source-decisions pass — f8-tga-level was previously "weekly" (a
  // leftover from when it was fetched off FRED's WDTGAL) even though the
  // underlying Daily Treasury Statement is genuinely daily-cadence;
  // corrected to "daily". f8-tga-daily had NO entry at all here — the exact
  // "current forever" bug this map's own comments elsewhere warn about (a
  // REAL kpi id with no cadence entry fell through `computeQualityForKpi`'s
  // old `if (!cadence) return "current"` fallback and never went "stale").
  // Both are now correctly mapped; see the fallback fix below too.
  "f8-tga-level": "daily",
  "f8-tga-daily": "daily",
  "f11-gvz": "daily",
  "f11-gvz-1d": "daily",
  "f11-gvz-5d": "daily",
  // F6 (RECONSTRUCTED_DXY) — FRED's H.10 FX legs are daily-cadence, same
  // bucket as every other FRED-backed real family here. See
  // apps/backend/src/real/f6Currency.ts.
  "f6-dxy-recon-level": "daily",
  "f6-dxy-recon-today": "daily",
  "f6-dxy-recon-5d": "daily",
  "f6-usd-state": "daily",
};

let bootSnapshot: BootSnapshot | null = null;

const FAMILY_ORDER: FamilyId[] = [
  "F2",
  "F3",
  "F4",
  "F5",
  "F6",
  "F7",
  "F8",
  "F9",
  "F10",
  "F11",
  // F12 (Physical/Structural Gold) — restored as an honest UNAVAILABLE
  // family (see apps/backend/src/real/f12PhysicalGold.ts): no free API
  // exists for central-bank gold reserves/quarterly demand, so both its
  // KPIs are permanently UNAVAILABLE/NO_SOURCE rather than silently absent.
  "F12",
  "F13",
];

function buildBootSnapshot(): BootSnapshot {
  const builtAt = Date.now();
  const timestamp = new Date(builtAt).toISOString();

  const families: BootFamilySnapshot[] = FAMILY_ORDER.map((familyId) => {
    const kpis: BootKpi[] = KPI_FIXTURES.filter(
      (fixture) => fixture.familyId === familyId
    ).map((fixture) => ({
      ...fixture,
      // Every fixture starts life as "MOCK" — REAL_FAMILY_IDS families' specific
      // KPI ids get overridden to "REAL"/"UNAVAILABLE" per-request below.
      // The untouched family (F13) never gets overridden, so it stays
      // "MOCK" with unchanged values.
      dataState: "MOCK",
      observationAt: timestamp,
      retrievedAt: timestamp,
    }));

    const events = FAMILY_EVENTS[familyId];

    return {
      familyId,
      label: FAMILY_LABELS[familyId],
      kpis,
      nextEvents: events?.nextEvents,
      activeCatalyst: events?.activeCatalyst,
    };
  });

  return { builtAt, families };
}

function getBootSnapshot(): BootSnapshot {
  if (!bootSnapshot) {
    bootSnapshot = buildBootSnapshot();
  }
  return bootSnapshot;
}

function computeMockQuality(ageMs: number): QualityState {
  if (ageMs < CURRENT_THRESHOLD_MS) return "current";
  return "stale";
}

/** Weekends never create a missing-publication warning; one delayed source
 * session is tolerated before the terminal asks for verification. */
export function completedWeekdaySessionsSince(observationAtIso: string, nowMs = Date.now()): number {
  const observed = new Date(observationAtIso);
  if (Number.isNaN(observed.getTime())) return Number.POSITIVE_INFINITY;
  const cursor = new Date(Date.UTC(observed.getUTCFullYear(), observed.getUTCMonth(), observed.getUTCDate()));
  const today = new Date(nowMs);
  const end = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
  let sessions = 0;
  cursor.setUTCDate(cursor.getUTCDate() + 1);
  while (cursor < end) {
    const day = cursor.getUTCDay();
    if (day !== 0 && day !== 6) sessions += 1;
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return sessions;
}

function computeQualityForKpi(kpi: BootKpi, mockAgeMs: number): QualityState {
  if (kpi.dataState === "UNAVAILABLE") return "unavailable";
  if (kpi.dataState === "MOCK") return computeMockQuality(mockAgeMs);

  // REAL
  const cadence = REAL_KPI_CADENCE[kpi.id];
  if (!cadence) {
    // Freshness-policy-gap bug fix (F2/F8 source-decisions pass): this used
    // to `return "current"` here — a REAL kpi id genuinely missing from
    // REAL_KPI_CADENCE (e.g. f8-tga-daily before this pass) would silently
    // report "current forever," never advancing to "stale" no matter how
    // old its `observationAt` actually was. `QualityState` has no dedicated
    // "freshness policy gap" value (only "current"/"stale"/"unavailable" —
    // see @gold-terminal/contracts), so this now conservatively reports
    // "stale" instead: an honest signal that this reading's freshness has
    // NOT been verified against a defined cadence, rather than a falsely
    // reassuring "current". Every REAL kpi id this codebase currently
    // produces IS mapped above; reaching this branch means a NEW REAL kpi id
    // was wired without adding its cadence — a bug to fix by adding the
    // entry, not by trusting this fallback.
    console.error(`[snapshot] REAL kpi "${kpi.id}" has no REAL_KPI_CADENCE entry — reporting "stale", not "current". Add its cadence.`);
    return "stale";
  }
  const ageMs = Date.now() - new Date(kpi.observationAt).getTime();
  if (cadence === "event") {
    return Date.now() - new Date(kpi.retrievedAt).getTime() < CADENCE_THRESHOLD_MS.event ? "current" : "stale";
  }
  if (cadence === "daily") return completedWeekdaySessionsSince(kpi.observationAt) <= 1 ? "current" : "stale";
  return ageMs < CADENCE_THRESHOLD_MS[cadence] ? "current" : "stale";
}

function applyOverride(kpi: BootKpi, override: KpiOverride): BootKpi {
  return {
    ...kpi,
    value: override.value,
    sourceTag: override.sourceTag,
    // Purely additive — see `KpiOverride.sourceTags`/`CanonicalKpi.sourceTags`.
    // `undefined` for every override except the rare genuinely-multi-provider
    // derived KPI (e.g. F8's f8-effr-iorb), matching that field's contract.
    sourceTags: override.sourceTags,
    dataState: override.dataState,
    unavailableReason: override.unavailableReason,
    provenance: override.provenance ?? kpi.provenance,
    observationAt: override.observationAtIso,
    retrievedAt: override.retrievedAtIso,
    // `driverSummary` is only ever touched by an override that explicitly
    // sets the key (see KpiOverride's doc comment) — `undefined` (every
    // override except f8-funding-microstate) means "leave the fixture's
    // authored text alone," while an explicit `null` clears it.
    driverSummary: override.driverSummary !== undefined ? override.driverSummary : kpi.driverSummary,
    // Bug found live (2026-09, via the Global Read AI's own data-verification
    // step): f5-payrolls-latest's mock fixture carries `consensus: 150,
    // surprise: "miss"` — authored against the MOCK value (142), which is a
    // genuine miss. No `KpiOverride` anywhere in real/*.ts ever sets
    // consensus/previous/surprise (grepped to confirm — only f13Calendar.ts's
    // unrelated numeric calendar-event `surprise` field touches that word),
    // so before this fix a real override only ever replaced `value` while
    // silently leaving the mock's consensus/surprise/previous attached —
    // e.g. a real BLS print of 162k inherited the mock's "miss" label
    // (142 < 150), producing a mathematically backwards "beat tagged as
    // miss." Same latent bug on f4-core-cpi-mom/f4-core-pce-mom. Since no
    // real provider in this codebase computes a live consensus estimate for
    // anything, ANY applied override (REAL or UNAVAILABLE) now clears all
    // three — never a stale mock comparison sitting next to a real number.
    consensus: null,
    previous: null,
    surprise: null,
  };
}

/** Fixtures define the canonical display schema only; they never become market data. */
function unavailableFixture(kpi: BootKpi, nowIso: string): BootKpi {
  return { ...kpi, value: null, sourceTag: UNAVAILABLE_SOURCE, sourceTags: undefined,
    dataState: "UNAVAILABLE", unavailableReason: "NO_SOURCE", observationAt: nowIso, retrievedAt: nowIso,
    driverSummary: null, consensus: null, previous: null, surprise: null };
}

/**
 * `language` (Milestone 1E) only affects presentation text that is static/
 * deterministic — `driverSummary` and event/catalyst `title` — never the
 * numeric fixture/real values or quality computation. Defaults to "EN" so
 * every existing caller (bootstrap.ts's boot-time family list, the
 * KPI-existence check in server.ts) keeps its prior behavior unchanged.
 *
 * Milestone 2B: now async — building the real-family overrides awaits each
 * provider's own lazily-refreshed TTL cache (apps/backend/src/real/cache.ts),
 * which is a real network fetch only right after that cache's TTL expires.
 *
 * Cost-sensitivity fix (post-2B): real market-data overrides
 * (apps/backend/src/real/*.ts — FRED/BLS/BEA/Treasury/NY Fed/CFTC/Massive
 * free tier) are now ALWAYS attempted, independent of `DATA_MODE`.
 * `DATA_MODE` is reserved exclusively for gating the paid AI/LLM
 * intelligence pilot (see intelligence/dataMode.ts and
 * intelligence/realIntelligencePilot.ts) — it must never also decide
 * whether these free, no-marginal-cost market-data providers run, since
 * that would silently turn off genuinely free real data (e.g. F2's FRED
 * yields) any time the AI pilot is paused for cost reasons. Each real
 * builder already checks its own credential (`isConfigured()`-style, see
 * config/env.ts) and wraps its fetch in try/catch, falling back to
 * `unavailableOverride` per-KPI — so calling this unconditionally is safe
 * even with zero credentials configured.
 */
export async function getMarketSnapshot(language: Language = "EN"): Promise<MarketSnapshot> {
  const boot = getBootSnapshot();
  const mockAgeMs = Date.now() - boot.builtAt;
  const realOverrides = await buildRealFamilyOverrides();
  // F13 — real economic calendar (macro_events, via JBlanked). Deliberately
  // NOT folded into buildRealFamilyOverrides()/REAL_FAMILY_IDS above (F13
  // has no scalar KPIs to override, only nextEvents/activeCatalyst, and
  // keeping this call separate avoids touching that shared aggregator file
  // sibling family work also depends on). Cross-references realOverrides
  // for the official-source actuals merge — see f13Calendar.ts — without
  // making any additional provider calls of its own.
  const f13Events = await buildF13CockpitEvents(realOverrides);

  const families: FamilyBeforeMechanicalReads[] = await Promise.all(boot.families.map(async (family) => {
    const familyOverride = REAL_FAMILY_IDS.includes(family.familyId) ? realOverrides[family.familyId] : undefined;

    const kpis: FamilyBeforeMechanicalReads["kpis"] = await Promise.all(family.kpis.map(async (kpi) => {
      const override = familyOverride?.kpiOverrides[kpi.id];
      const merged = override ? applyOverride(kpi, override) : unavailableFixture(kpi, new Date().toISOString());
      const current = {
        ...merged,
        quality: computeQualityForKpi(merged, mockAgeMs),
        driverSummary: localizeDriverSummary(merged, language),
      };
      return current.dataState === "REAL" && current.value !== null
        ? { ...current, previousFetch: await rememberKpiObservation(current) }
        : current;
    }));

    // F3/F4/F5/F9 all always set `nextEvents` themselves now (the real
    // schedule when known, `[]` on a fetch failure or when genuinely
    // unknown) — none of them ever leaves it `undefined`, so none of them
    // can fall through to `family.nextEvents` below in practice. That
    // fallback exists only as defense-in-depth for a real family that
    // hasn't wired a `nextEvents` override at all (F6-F8, F10, F11, which
    // have no calendar concept and never populate this field either) —
    // for those, `family.nextEvents` is `undefined` too (no mock/events.ts
    // entry), so the net result is still "no fabricated schedule," never a
    // mock placeholder standing in for a real one.
    //
    // F13 is handled separately below: it has no mock placeholder left at
    // all (removed from mock/events.ts — see that file's top-of-file note)
    // — a fetch failure/never-run genuinely renders empty, per the REAL
    // mode rule in the milestone brief.
    const isF13 = family.familyId === "F13";
    const nextEvents = isF13 ? f13Events.nextEvents : (familyOverride?.nextEvents ?? []);
    const activeCatalyst = isF13 ? f13Events.activeCatalyst : undefined;

    // F3 only — see `FedRateDistribution` in @gold-terminal/contracts.
    // `undefined` for every other family, since their FamilyOverrideResult
    // never sets this field.
    const fedRateDistribution = rememberFedDistribution(familyOverride?.fedRateDistribution ?? undefined);

    return {
      familyId: family.familyId,
      label: family.label,
      kpis,
      nextEvents: localizeEvents(nextEvents, language),
      activeCatalyst: localizeCatalyst(activeCatalyst, language),
      fedRateDistribution,
    };
  }));

  return {
    generatedAt: new Date(boot.builtAt).toISOString(),
    sourceTag: "REAL_OR_UNAVAILABLE",
    // The mechanical relationship engine is the ONLY thing that ever colors
    // a cockpit cell — attached here, last, after real-data overrides and
    // previousFetch are fully resolved. See intelligence/mechanical/.
    families: attachMechanicalReads(families),
  };
}
