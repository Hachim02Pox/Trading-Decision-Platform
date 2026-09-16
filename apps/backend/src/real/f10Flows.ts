import { fetchRecentGoldCotReports, fetchGoldCotHistory, type CotReport } from "../providers/cftc";
import { cached } from "./cache";
import { round, unavailableOverride, type FamilyOverrideResult, type KpiOverride } from "./types";
import { buildF10GldOverrides } from "./f10Gld";
import { insertObservationIfChanged, type KpiObservationInput } from "../db/kpiObservations";
import { rememberLatestValueFromObservation } from "../db/kpiLatestValues";

// Milestone 2B — F10 Flows/Positioning. Real: f10-mm-net-pct (Managed Money
// net = long - short, as % of `open_interest_all` — VERIFIED live that this
// field exists in dataset 72hh-3qpy), f10-mm-wow-pp (point change in that
// net % between the latest and prior weekly report, when both are
// available).
//
// Milestone 2C — f10-mm-percentile is now REAL: the current week's Managed
// Money net-% reading's percentile rank within the trailing 156 weeks
// (~3 years) of that same metric, computed from a single bulk historical
// CFTC fetch (see fetchGoldCotHistory) rather than 156 separate calls.
//
// This pass — f10-etf-holdings/f10-etf-delta are now REAL, sourced from
// SPDR's own GLD historical-archive XLSX (see ./f10Gld.ts, kept as a
// sibling module rather than folded into this file, and wired in via
// `buildF10GldOverrides()` below) — this file's own CFTC logic above is
// otherwise untouched.
const TTL_MS = 6 * 60 * 60_000; // 6h — weekly-cadence source
// The 156-week history changes by at most one new weekly report between
// Fridays — a long TTL matching the weekly cadence avoids re-fetching ~3
// years of history on every request while still refreshing within the same
// week a new report is published.
const HISTORY_TTL_MS = 12 * 60 * 60_000; // 12h
const SOURCE_TAG = "CFTC";
const PERCENTILE_LOOKBACK_WEEKS = 156;
// A percentile rank against too short a history is a misleading number
// dressed up as a real one (e.g. "90th percentile" of only 8 readings tells
// you almost nothing) — below this many valid weekly readings, the KPI
// reports UNAVAILABLE / INSUFFICIENT_HISTORY rather than a rank computed
// against a too-thin sample.
const MIN_PERCENTILE_HISTORY_WEEKS = 52;

interface NetPct {
  netPct: number;
  reportDateIso: string;
}

function computeNetPct(report: CotReport): NetPct | null {
  if (report.openInterestAll == null || report.managedMoneyLong == null || report.managedMoneyShort == null) return null;
  if (report.openInterestAll === 0) return null;
  const net = report.managedMoneyLong - report.managedMoneyShort;
  return { netPct: (net / report.openInterestAll) * 100, reportDateIso: report.reportDateIso };
}

/**
 * Empirical mid-rank percentile: 100 × (count(values < x) + 0.5 ×
 * count(values == x)) / N. Splitting ties down the middle (rather than
 * counting a tied value as fully "at or below") is the standard mid-rank
 * convention and matters whenever the trailing history contains an exact
 * repeat of the current week's net-% reading — a plain "at or below" count
 * would otherwise bias every tied observation's percentile upward.
 * `history` need not be sorted — this scans it directly since a few hundred
 * elements is trivially cheap.
 */
function percentileRank(current: number, history: readonly number[]): number {
  let below = 0;
  let equal = 0;
  for (const value of history) {
    if (value < current) below++;
    else if (value === current) equal++;
  }
  return ((below + 0.5 * equal) / history.length) * 100;
}

/**
 * Overnight session 2026-09-16: F10's CFTC KPIs never called any
 * persistence function before (docs/PREVIOUS_VALUE_PERSISTENCE_NEXT_STEPS.md
 * §3.3). f10-mm-net-pct (level) and f10-mm-wow-pp (week-over-week delta,
 * user-confirmed later the same session that delta KPIs should get
 * previous/current too, not just levels) both wired here.
 * f10-mm-percentile (a derived 156-week rank) is still deliberately left
 * out — a percentile rank isn't itself a fetched value with a meaningful
 * "previous reading" the same way a level or a simple delta is.
 */
async function persistCftcObservation(input: KpiObservationInput): Promise<void> {
  try {
    await insertObservationIfChanged(input);
  } catch (err) {
    console.error(`[real-data] F10 CFTC failed to persist kpi_observations row for ${input.kpiId}:`, err instanceof Error ? err.message : err);
  }
  try {
    await rememberLatestValueFromObservation(input);
  } catch (err) {
    console.error(`[real-data] F10 CFTC failed to persist kpi_latest_values row for ${input.kpiId}:`, err instanceof Error ? err.message : err);
  }
}

export async function buildF10Overrides(): Promise<FamilyOverrideResult> {
  const nowIso = new Date().toISOString();
  const kpiOverrides: Record<string, KpiOverride> = await buildF10GldOverrides();

  let latest: NetPct | null = null;

  try {
    const { value: reports, fetchedAtMs } = await cached("cftc:gold:recent2", TTL_MS, () => fetchRecentGoldCotReports(2));
    if (!reports || reports.length === 0) throw new Error("no GOLD COT reports returned");
    const retrievedAtIso = new Date(fetchedAtMs).toISOString();

    latest = computeNetPct(reports[0]);
    if (!latest) throw new Error("latest COT report missing open interest or Managed Money fields");
    kpiOverrides["f10-mm-net-pct"] = {
      value: round(latest.netPct, 1),
      sourceTag: SOURCE_TAG,
      dataState: "REAL",
      observationAtIso: latest.reportDateIso,
      retrievedAtIso,
    };
    await persistCftcObservation({
      kpiId: "f10-mm-net-pct",
      observationAt: new Date(latest.reportDateIso),
      retrievedAt: new Date(retrievedAtIso),
      numericValue: round(latest.netPct, 1),
      sourceTag: SOURCE_TAG,
      provenance: "observed",
    });

    const prior = reports[1] ? computeNetPct(reports[1]) : null;
    if (prior) {
      const wowPp = round(latest.netPct - prior.netPct, 1);
      kpiOverrides["f10-mm-wow-pp"] = {
        value: wowPp,
        sourceTag: SOURCE_TAG,
        dataState: "REAL",
        observationAtIso: latest.reportDateIso,
        retrievedAtIso,
        driverSummary: wowPp > 0 ? "ADDING_NET_LONG_EXPOSURE" : wowPp < 0 ? "REDUCING_NET_LONG_EXPOSURE" : "UNCHANGED",
      };
      // User-requested 2026-09-16: previous/current for delta KPIs too, not
      // just levels — same convention as f6Currency.ts's DXY today%/5d% fix.
      await persistCftcObservation({
        kpiId: "f10-mm-wow-pp",
        observationAt: new Date(latest.reportDateIso),
        retrievedAt: new Date(retrievedAtIso),
        numericValue: wowPp,
        sourceTag: SOURCE_TAG,
        provenance: "derived",
      });
    } else {
      kpiOverrides["f10-mm-wow-pp"] = unavailableOverride(nowIso);
    }
  } catch (err) {
    console.error("[real-data] F10 GOLD COT (CFTC) fetch failed:", err instanceof Error ? err.message : err);
    kpiOverrides["f10-mm-net-pct"] = unavailableOverride(nowIso);
    kpiOverrides["f10-mm-wow-pp"] = unavailableOverride(nowIso);
  }

  kpiOverrides["f10-mm-percentile"] = await buildPercentileOverride(nowIso, latest);

  return { kpiOverrides };
}

async function buildPercentileOverride(nowIso: string, latest: NetPct | null): Promise<KpiOverride> {
  try {
    if (!latest) throw new Error("no current-week net-% reading to rank (latest COT fetch failed above)");

    const { value: history, fetchedAtMs } = await cached("cftc:gold:history156", HISTORY_TTL_MS, () =>
      fetchGoldCotHistory(PERCENTILE_LOOKBACK_WEEKS)
    );
    if (!history || history.length === 0) throw new Error("no GOLD COT history returned for the percentile lookback");

    const netPcts = history.map(computeNetPct).filter((v): v is NetPct => v !== null);
    if (netPcts.length === 0) throw new Error("historical COT reports missing open interest or Managed Money fields");
    if (netPcts.length < MIN_PERCENTILE_HISTORY_WEEKS) {
      return unavailableOverride(nowIso, "INSUFFICIENT_HISTORY");
    }

    const percentile = percentileRank(
      latest.netPct,
      netPcts.map((v) => v.netPct)
    );

    return {
      value: round(percentile, 0),
      sourceTag: SOURCE_TAG,
      dataState: "REAL",
      provenance: "derived",
      observationAtIso: latest.reportDateIso,
      retrievedAtIso: new Date(fetchedAtMs).toISOString(),
      driverSummary: percentile >= 90 ? "HISTORICALLY_EXTENDED_LONG" : percentile <= 10 ? "HISTORICALLY_LIGHT_OR_SHORT" : "MID_RANGE",
    };
  } catch (err) {
    console.error("[real-data] F10 156-week percentile (CFTC) fetch failed:", err instanceof Error ? err.message : err);
    return unavailableOverride(nowIso);
  }
}
