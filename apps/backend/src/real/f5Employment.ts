import { loadAppConfig } from "../config/env";
import { fetchSeriesHistoryWithCalculations, type BlsObservationWithCalculations } from "../providers/bls";
import { fetchLatestObservations, FredApiError } from "../providers/fred";
import { cached } from "./cache";
import { runTrackedIngestion } from "../db/ingestionRunner";
import { getPool } from "../db/pool";
import {
  computeCpiCalc,
  lastDayOfMonthIso,
  resolvePctChange,
  resolveNetChange,
  average3MonthlyNetChanges,
  recentCalendarMonths,
  shiftCalendarMonthsBack,
  periodCode,
  persistObservation,
} from "./blsMonthly";
import { round, toObservationIso, unavailableOverride, type FamilyOverrideResult, type KpiOverride } from "./types";

// F5 Employment/Growth.
//
// BUG A follow-up — same array-offset root cause as F4 (see
// real/blsMonthly.ts's top-of-file comment), fixed the same way:
// f5-unemployment (a plain latest-value read, never had a lookback bug),
// f5-payrolls-latest (now resolveNetChange: BLS's own 1-month net_change
// when available, else an exact-calendar-period level diff), f5-payrolls-3m
// (average3MonthlyNetChanges — 3 exact-calendar-period diffs, averaged;
// always "derived", since no source publishes a 3-month AVERAGE directly),
// f5-ahe-mom (resolvePctChange, same direct-then-derive policy as F4's CPI).
//
// BLS `calculations: true` — LIVE-VERIFIED this pass (see
// providers/bls.ts): CES0000000001 (payrolls) and CES0500000003 (AHE) both
// return real `net_changes`/`pct_changes`. UNEMPLOYMENT_SERIES,
// PAYROLLS_SERIES, and AHE_SERIES are now fetched together in ONE BLS POST
// call instead of 3 separate GETs.
//
// New this pass: f5-claims-initial (FRED ICSA), f5-claims-continuing (FRED
// CCSA) — both weekly-cadence, visibility "deep" (drawer-only, per the
// "don't overload the cockpit face" instruction). f5-claims-4w (FRED
// IC4WSA) is unchanged in substance but now uses a cadence-appropriate
// cache TTL (was borrowing GDPNow's 1h TTL; weekly-published data doesn't
// need hourly refresh) and rounds to the same precision as its declared
// fixture `decimals` (0, not 1 — a pre-existing display/value-precision
// mismatch, fixed here).
//
// f5-gdpnow: unchanged — its `realtimeStart`-based freshness anchor
// (FRED's `date` for GDPNOW is the target quarter's start, not a
// publication date) was VERIFIED already correctly implemented; no fix
// needed.
//
// f5-ism-services/f5-ism-manufacturing: still UNAVAILABLE (NO_SOURCE) —
// checked this pass for an existing JBlanked adapter (a prior/parallel task
// may be building JBlanked calendar integration); none exists yet in this
// repo (no apps/backend/src/providers/jblanked.ts or similar), so per "don't
// risk a conflict, leave UNAVAILABLE with a note," these stay untouched
// rather than a new adapter being built here.
//
// f5-payrolls-revision-2m: no fabricated revision history. Real logic below
// reads kpi_observations for the INTERNAL bookkeeping id
// PAYROLLS_LEVEL_VINTAGE_KPI_ID (a raw CES0000000001 level persisted every
// fetch, keyed by its own reference month) — once a given reference month
// has been fetched at least twice (its original print, then a later fetch
// that could show a BLS revision), a genuine revision can be computed. Until
// then this reports UNAVAILABLE with `unavailableReason: "INSUFFICIENT_HISTORY"`
// (see packages/contracts/src/index.ts) — never backfilled/forced.
//
// Mock next-event fallback removed — same rationale as F4 (see
// real/f4Inflation.ts's top-of-file comment): `nextEvents: []` below
// overrides mock/events.ts's fixed "Next NFP Release"/"Next Growth Release"
// placeholders rather than leaving them permanently shown as if real.
const TTL_MS = 6 * 60 * 60_000; // 6h — monthly-cadence source
const GDPNOW_TTL_MS = 60 * 60_000; // 1h — FRED republishes GDPNow near-daily during the quarter
const CLAIMS_TTL_MS = 6 * 60 * 60_000; // 6h — weekly-cadence source; was previously (incorrectly) sharing GDPNow's 1h TTL
const SOURCE_TAG = "BLS";
const FRED_SOURCE_TAG = "FRED";
const UNEMPLOYMENT_SERIES = "LNS14000000";
const PAYROLLS_SERIES = "CES0000000001";
const AHE_SERIES = "CES0500000003";
const GDPNOW_SERIES = "GDPNOW";
const CLAIMS_4W_SERIES = "IC4WSA";
const CLAIMS_INITIAL_SERIES = "ICSA";
const CLAIMS_CONTINUING_SERIES = "CCSA";

// f5-payrolls-revision-2m is no longer unconditionally unavailable — see
// this file's top-of-file comment and computePayrollsRevision2m below.
const ALWAYS_UNAVAILABLE_IDS = ["f5-ism-services", "f5-ism-manufacturing"];

function apiKey(): string | undefined {
  return loadAppConfig().providers.bls?.apiKey;
}

// ---------------------------------------------------------------------------
// f5-payrolls-revision-2m — real, DB-vintage-backed logic (never fabricated).
// ---------------------------------------------------------------------------

/** Internal-only bookkeeping kpi_id — never sent to the frontend, never a CanonicalKpi id. Append-only raw CES0000000001 level per reference month, persisted every fetch, so a later BLS revision to an already-seen month accumulates a second (or third) vintage row here. */
const PAYROLLS_LEVEL_VINTAGE_KPI_ID = "f5-payrolls-level-vintage";

interface VintageRow {
  numeric_value: number | null;
  retrieved_at: Date;
}

async function fetchLevelVintages(observationAtIso: string): Promise<VintageRow[]> {
  const pool = getPool(); // throws DbNotConfiguredError if DB is not configured — caught by callers
  const result = await pool.query<VintageRow>(
    `select numeric_value, retrieved_at from public.kpi_observations
     where kpi_id = $1 and observation_at = $2
     order by retrieved_at asc, id asc`,
    [PAYROLLS_LEVEL_VINTAGE_KPI_ID, new Date(observationAtIso)]
  );
  return result.rows;
}

async function revisionForMonth(year: number, month: number): Promise<number | null> {
  const observationAtIso = lastDayOfMonthIso(String(year), periodCode(month));
  const vintages = await fetchLevelVintages(observationAtIso);
  if (vintages.length < 2) return null; // fewer than 2 real vintages — cannot state a revision yet
  const first = vintages[0].numeric_value;
  const last = vintages[vintages.length - 1].numeric_value;
  return first != null && last != null ? last - first : null;
}

/**
 * The combined revision to the two payroll months immediately preceding the
 * current release — BLS revises the prior two months with every new NFP
 * report, which is what "2M Net Revision" conventionally refers to. Returns
 * `null` (caller reports UNAVAILABLE/INSUFFICIENT_HISTORY) whenever either
 * of those two months has fewer than 2 persisted vintages, including when
 * the DB itself isn't configured.
 */
async function computePayrollsRevision2m(latestYear: number, latestMonth: number): Promise<{ value: number; observationAtIso: string } | null> {
  const m1 = shiftCalendarMonthsBack(latestYear, latestMonth, 1);
  const m2 = shiftCalendarMonthsBack(latestYear, latestMonth, 2);

  const [rev1, rev2] = await Promise.all([revisionForMonth(m1.year, m1.month), revisionForMonth(m2.year, m2.month)]);
  if (rev1 == null || rev2 == null) return null;

  return { value: rev1 + rev2, observationAtIso: lastDayOfMonthIso(String(latestYear), periodCode(latestMonth)) };
}

const F5_BLS_KPI_IDS = ["f5-unemployment", "f5-payrolls-latest", "f5-payrolls-3m", "f5-ahe-mom", "f5-payrolls-revision-2m"] as const;

export async function buildF5Overrides(): Promise<FamilyOverrideResult> {
  const nowIso = new Date().toISOString();
  const kpiOverrides: Record<string, KpiOverride> = {};
  for (const id of ALWAYS_UNAVAILABLE_IDS) kpiOverrides[id] = unavailableOverride(nowIso, "NO_SOURCE");

  try {
    const { value: bundle, fetchedAtMs } = await cached("bls:calc:f5-employment", TTL_MS, () =>
      runTrackedIngestion("bls:employment", () =>
        fetchSeriesHistoryWithCalculations([UNEMPLOYMENT_SERIES, PAYROLLS_SERIES, AHE_SERIES], apiKey())
      )
    );
    const retrievedAtIso = new Date(fetchedAtMs).toISOString();

    const unemploymentHistory: BlsObservationWithCalculations[] | null = bundle[UNEMPLOYMENT_SERIES] ?? null;
    const latestUnemployment = unemploymentHistory?.[0];
    if (!latestUnemployment || latestUnemployment.value == null) throw new Error("unemployment series returned no usable latest observation");
    kpiOverrides["f5-unemployment"] = {
      value: latestUnemployment.value,
      sourceTag: SOURCE_TAG,
      dataState: "REAL",
      observationAtIso: lastDayOfMonthIso(latestUnemployment.year, latestUnemployment.period),
      retrievedAtIso,
      // Explicit (not left to the generic persistence fallback's "derived"
      // default below) — this is a direct BLS level reading, never derived.
      provenance: "observed",
    };

    const payrollsHistory: BlsObservationWithCalculations[] | null = bundle[PAYROLLS_SERIES] ?? null;
    const latestPayrolls = payrollsHistory?.[0];
    if (!latestPayrolls || latestPayrolls.value == null) throw new Error("payrolls series returned no usable latest observation");
    const latestYear = Number(latestPayrolls.year);
    const latestMonth = Number(latestPayrolls.period.slice(1));
    const payrollsObservationAtIso = lastDayOfMonthIso(latestPayrolls.year, latestPayrolls.period);

    const latestDiff = resolveNetChange(payrollsHistory, "1");
    kpiOverrides["f5-payrolls-latest"] = latestDiff
      ? {
          value: Math.round(latestDiff.value),
          sourceTag: SOURCE_TAG,
          dataState: "REAL",
          observationAtIso: payrollsObservationAtIso,
          retrievedAtIso,
          provenance: latestDiff.provenance,
        }
      : unavailableOverride(nowIso);

    const avg3m = average3MonthlyNetChanges(payrollsHistory);
    kpiOverrides["f5-payrolls-3m"] = avg3m
      ? {
          value: Math.round(avg3m.value),
          sourceTag: SOURCE_TAG,
          dataState: "REAL",
          observationAtIso: avg3m.observationAtIso,
          retrievedAtIso,
          provenance: "derived",
        }
      : unavailableOverride(nowIso);

    // Persist up to 3 months of raw payroll LEVELS (latest, M-1, M-2) every
    // fetch — the append-only vintage trail f5-payrolls-revision-2m reads
    // back below. Best-effort: a DB hiccup here must not affect the KPIs
    // already computed above.
    if (payrollsHistory) {
      const recentLevels = recentCalendarMonths(payrollsHistory, latestYear, latestMonth, 3);
      await Promise.all(
        recentLevels
          .filter((obs) => obs.value != null)
          .map((obs) =>
            persistObservation({
              kpiId: PAYROLLS_LEVEL_VINTAGE_KPI_ID,
              observationAtIso: lastDayOfMonthIso(obs.year, obs.period),
              retrievedAtIso,
              numericValue: obs.value as number,
              sourceTag: SOURCE_TAG,
              provenance: "observed",
            })
          )
      );
    }

    try {
      const revision = await computePayrollsRevision2m(latestYear, latestMonth);
      kpiOverrides["f5-payrolls-revision-2m"] = revision
        ? {
            value: Math.round(revision.value),
            sourceTag: SOURCE_TAG,
            dataState: "REAL",
            observationAtIso: revision.observationAtIso,
            retrievedAtIso,
            provenance: "derived",
          }
        : unavailableOverride(nowIso, "INSUFFICIENT_HISTORY");
    } catch (err) {
      console.error("[real-data] F5 payrolls-revision-2m (DB vintage read) failed:", err instanceof Error ? err.message : err);
      kpiOverrides["f5-payrolls-revision-2m"] = unavailableOverride(nowIso, "INSUFFICIENT_HISTORY");
    }

    const aheHistory: BlsObservationWithCalculations[] | null = bundle[AHE_SERIES] ?? null;
    const aheCalc = computeCpiCalc(aheHistory);
    const aheMom = resolvePctChange(aheHistory, "1");
    kpiOverrides["f5-ahe-mom"] =
      aheMom && aheCalc.observationAtIso
        ? {
            value: round(aheMom.value, 1),
            sourceTag: SOURCE_TAG,
            dataState: "REAL",
            observationAtIso: aheCalc.observationAtIso,
            retrievedAtIso,
            provenance: aheMom.provenance,
          }
        : unavailableOverride(nowIso);

    await Promise.all(
      F5_BLS_KPI_IDS.filter((id) => kpiOverrides[id]?.dataState === "REAL").map((id) => {
        const override = kpiOverrides[id];
        return persistObservation({
          kpiId: id,
          observationAtIso: override.observationAtIso,
          retrievedAtIso: override.retrievedAtIso,
          numericValue: override.value as number,
          sourceTag: override.sourceTag,
          provenance: override.provenance ?? "derived",
        });
      })
    );
  } catch (err) {
    console.error("[real-data] F5 employment (BLS) fetch failed:", err instanceof Error ? err.message : err);
    for (const id of F5_BLS_KPI_IDS) kpiOverrides[id] = id === "f5-payrolls-revision-2m" ? unavailableOverride(nowIso, "INSUFFICIENT_HISTORY") : unavailableOverride(nowIso);
  }

  try {
    const { value: history, fetchedAtMs } = await cached(`fred:${CLAIMS_4W_SERIES}`, CLAIMS_TTL_MS, () =>
      runTrackedIngestion("fred:claims-4w", () => fetchLatestObservations(CLAIMS_4W_SERIES, 1))
    );
    const latest = history[0];
    if (!latest) throw new Error("initial claims 4-week average returned no usable observation");
    const override: KpiOverride = {
      value: round(latest.value / 1000, 0),
      sourceTag: FRED_SOURCE_TAG,
      dataState: "REAL",
      observationAtIso: toObservationIso(latest.date),
      retrievedAtIso: new Date(fetchedAtMs).toISOString(),
      provenance: "observed",
    };
    kpiOverrides["f5-claims-4w"] = override;
    await persistObservation({
      kpiId: "f5-claims-4w",
      observationAtIso: override.observationAtIso,
      retrievedAtIso: override.retrievedAtIso,
      numericValue: override.value as number,
      sourceTag: override.sourceTag,
      provenance: "observed",
    });
  } catch (err) {
    const detail = err instanceof FredApiError ? `[${err.code}] ${err.message}` : err instanceof Error ? err.message : String(err);
    console.error("[real-data] F5 claims 4-week average (FRED) fetch failed:", detail);
    kpiOverrides["f5-claims-4w"] = unavailableOverride(nowIso);
  }

  try {
    const { value: history, fetchedAtMs } = await cached(`fred:${CLAIMS_INITIAL_SERIES}`, CLAIMS_TTL_MS, () =>
      runTrackedIngestion("fred:claims-initial", () => fetchLatestObservations(CLAIMS_INITIAL_SERIES, 1))
    );
    const latest = history[0];
    if (!latest) throw new Error("initial jobless claims returned no usable observation");
    const override: KpiOverride = {
      value: round(latest.value / 1000, 0),
      sourceTag: FRED_SOURCE_TAG,
      dataState: "REAL",
      observationAtIso: toObservationIso(latest.date),
      retrievedAtIso: new Date(fetchedAtMs).toISOString(),
      provenance: "observed",
    };
    kpiOverrides["f5-claims-initial"] = override;
    await persistObservation({
      kpiId: "f5-claims-initial",
      observationAtIso: override.observationAtIso,
      retrievedAtIso: override.retrievedAtIso,
      numericValue: override.value as number,
      sourceTag: override.sourceTag,
      provenance: "observed",
    });
  } catch (err) {
    const detail = err instanceof FredApiError ? `[${err.code}] ${err.message}` : err instanceof Error ? err.message : String(err);
    console.error("[real-data] F5 initial jobless claims (FRED) fetch failed:", detail);
    kpiOverrides["f5-claims-initial"] = unavailableOverride(nowIso);
  }

  try {
    const { value: history, fetchedAtMs } = await cached(`fred:${CLAIMS_CONTINUING_SERIES}`, CLAIMS_TTL_MS, () =>
      runTrackedIngestion("fred:claims-continuing", () => fetchLatestObservations(CLAIMS_CONTINUING_SERIES, 1))
    );
    const latest = history[0];
    if (!latest) throw new Error("continuing jobless claims returned no usable observation");
    const override: KpiOverride = {
      value: round(latest.value / 1000, 0),
      sourceTag: FRED_SOURCE_TAG,
      dataState: "REAL",
      observationAtIso: toObservationIso(latest.date),
      retrievedAtIso: new Date(fetchedAtMs).toISOString(),
      provenance: "observed",
    };
    kpiOverrides["f5-claims-continuing"] = override;
    await persistObservation({
      kpiId: "f5-claims-continuing",
      observationAtIso: override.observationAtIso,
      retrievedAtIso: override.retrievedAtIso,
      numericValue: override.value as number,
      sourceTag: override.sourceTag,
      provenance: "observed",
    });
  } catch (err) {
    const detail = err instanceof FredApiError ? `[${err.code}] ${err.message}` : err instanceof Error ? err.message : String(err);
    console.error("[real-data] F5 continuing jobless claims (FRED) fetch failed:", detail);
    kpiOverrides["f5-claims-continuing"] = unavailableOverride(nowIso);
  }

  try {
    const { value: history, fetchedAtMs } = await cached(`fred:${GDPNOW_SERIES}`, GDPNOW_TTL_MS, () =>
      runTrackedIngestion("fred:gdpnow", () => fetchLatestObservations(GDPNOW_SERIES, 1))
    );
    const latest = history[0];
    if (!latest) throw new Error("GDPNow series returned no usable latest observation");
    const observationAtIso = latest.realtimeStart ? toObservationIso(latest.realtimeStart) : new Date(fetchedAtMs).toISOString();
    const retrievedAtIso = new Date(fetchedAtMs).toISOString();
    kpiOverrides["f5-gdpnow"] = {
      value: round(latest.value, 1),
      sourceTag: FRED_SOURCE_TAG,
      dataState: "REAL",
      // FRED's `date` for GDPNOW is the *target quarter's* start (e.g.
      // "2026-07-01" for a Q3 2026 estimate), not a publication date —
      // `realtimeStart` is the actual as-of day of this specific reading,
      // which is what freshness should be measured against. Verified this
      // pass to already be implemented correctly (no fix needed).
      observationAtIso,
      retrievedAtIso,
    };
    await persistObservation({
      kpiId: "f5-gdpnow",
      observationAtIso,
      retrievedAtIso,
      numericValue: round(latest.value, 1),
      sourceTag: FRED_SOURCE_TAG,
      provenance: "estimated",
    });
  } catch (err) {
    const detail = err instanceof FredApiError ? `[${err.code}] ${err.message}` : err instanceof Error ? err.message : String(err);
    console.error("[real-data] F5 GDPNow (FRED) fetch failed:", detail);
    kpiOverrides["f5-gdpnow"] = unavailableOverride(nowIso);
  }

  // See top-of-file comment: no real release-calendar source exists this
  // pass, so this is an explicit empty list rather than the old
  // Date.now()+Nd mock placeholder.
  return { kpiOverrides, nextEvents: [] };
}
