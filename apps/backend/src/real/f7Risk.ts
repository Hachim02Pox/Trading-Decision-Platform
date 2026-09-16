import { fetchLatestObservations, FredApiError, type FredObservation } from "../providers/fred";
import { cached } from "./cache";
import { loadAppConfig } from "../config/env";
import { insertObservationIfChanged, type KpiObservationInput } from "../db/kpiObservations";
import { rememberLatestValueFromObservation } from "../db/kpiLatestValues";
import { round, toObservationIso, unavailableOverride, type FamilyOverrideResult, type KpiOverride } from "./types";

// F7 Risk / Credit / Vol — partially real. Real: f7-vix/f7-vix-1d (FRED
// VIXCLS), f7-hy-oas/f7-hy-oas-1d (FRED BAMLH0A0HYM2, converted from
// percentage points to bps to match this KPI's existing fixture unit
// convention). The "1D" deltas are computed the same way F2's derived
// spreads are (diff of the two most-recent valid daily observations, "."
// gaps already filtered by fetchLatestObservations) — see f2Rates.ts.
//
// UNAVAILABLE (deliberately, "NO_SOURCE"): f7-move/f7-move-1d. MOVE is not
// on FRED and has no confirmed free/public API of its own (it is a
// distinct, proprietary ICE BofA product, developer.ice.com, paid access
// only). Yahoo Finance's public chart endpoint DOES carry a `^MOVE` symbol
// (same unofficial endpoint used for F6's DXY — see
// apps/backend/src/providers/yahooFinance.ts) and its price series is
// plausibly genuine (numerically cross-checked against an independent
// source), BUT Yahoo's own `meta.longName`/`shortName` for that specific
// symbol are confirmed WRONG — they return an unrelated "Northern Trust
// iBoxx" product name, a real Yahoo data-quality defect, not a sign of
// hitting the wrong instrument. Per the product owner's explicit rule ("if
// validation is doubtful, leave UNAVAILABLE"), `^MOVE` is NOT wired here.
// Revisit only if a cleaner source is found, or if Yahoo fixes this
// symbol's metadata and it can be re-validated with more confidence — do
// not wire it back in without checking with the product owner first.
//
// f7-ig-oas — FRED does publish an investment-grade OAS series
// (BAMLC0A0CM), but it was not part of this pass's confirmed-live
// verification set, so it is not wired on an unconfirmed assumption.
const TTL_MS = 15 * 60_000;
const SOURCE_TAG = "FRED";
const HISTORY_LIMIT = 5; // a few daily points, comfortably enough for a 1D delta off the 2 most recent valid observations

const VIX_SERIES = "VIXCLS";
const HY_OAS_SERIES = "BAMLH0A0HYM2";
const IG_OAS_SERIES = "BAMLC0A0CM";

const UNAVAILABLE_KPI_IDS = ["f7-move", "f7-move-1d"];

function logFredFailure(seriesId: string, err: unknown): void {
  const detail =
    err instanceof FredApiError ? `[${err.code}] ${err.message}` : err instanceof Error ? err.message : String(err);
  console.error(`[real-data] F7 (FRED) fetch failed for series ${seriesId}: ${detail}`);
}

function isDbConfigured(): boolean {
  return loadAppConfig().db !== null;
}

/** Persists one observation to `kpi_observations` (best-effort — durable "previous value" history, see kpiHistory.ts's DB-backed lookup) — never turns a successful fetch into a failed one. */
async function persistObservation(input: KpiObservationInput): Promise<void> {
  if (!isDbConfigured()) return;
  try {
    await insertObservationIfChanged(input);
  } catch (err) {
    console.error(`[real-data] F7 failed to persist kpi_observations row for ${input.kpiId}:`, err instanceof Error ? err.message : err);
  }
  try {
    await rememberLatestValueFromObservation(input);
  } catch (err) {
    console.error(`[real-data] F7 failed to persist kpi_latest_values row for ${input.kpiId}:`, err instanceof Error ? err.message : err);
  }
}

/**
 * Returns the actual cache `fetchedAtMs` alongside the history — previously
 * discarded, which meant `retrievedAtIso` below was silently set to "now" at
 * every request instead of the real last-fetch time (same bug class fixed
 * in f6Currency.ts). Persists the latest reading to `kpi_observations`
 * INSIDE the fetcher passed to `cached()` — i.e. only on a genuine
 * cache-miss real fetch, matching f2Rates.ts's pattern — so a cache HIT
 * (most requests) never re-persists an identical row.
 */
async function fetchSeriesHistorySafe(seriesId: string, kpiId: string, formatDisplayedValue: (raw: number) => number): Promise<{ history: FredObservation[]; fetchedAtMs: number } | null> {
  try {
    const { value, fetchedAtMs } = await cached(`fred:${seriesId}`, TTL_MS, async () => {
      const observations = await fetchLatestObservations(seriesId, HISTORY_LIMIT);
      const latest = observations[0];
      if (latest) {
        // `formatDisplayedValue` matches the exact value this KPI displays
        // (e.g. HY/IG OAS's percentage-points -> bps ×100 conversion below)
        // — never a different unit than what's shown on screen.
        await persistObservation({
          kpiId,
          observationAt: new Date(toObservationIso(latest.date)),
          retrievedAt: new Date(),
          numericValue: formatDisplayedValue(latest.value),
          sourceTag: SOURCE_TAG,
          provenance: "observed",
        });
      }
      return observations;
    });
    return value.length > 0 ? { history: value, fetchedAtMs } : null;
  } catch (err) {
    logFredFailure(seriesId, err);
    return null;
  }
}

export async function buildF7Overrides(): Promise<FamilyOverrideResult> {
  const nowIso = new Date().toISOString();
  const kpiOverrides: Record<string, KpiOverride> = {};
  for (const id of UNAVAILABLE_KPI_IDS) kpiOverrides[id] = unavailableOverride(nowIso, "NO_SOURCE");

  const [vixResult, hyOasResult, igOasResult] = await Promise.all([
    fetchSeriesHistorySafe(VIX_SERIES, "f7-vix", (v) => round(v, 2)),
    fetchSeriesHistorySafe(HY_OAS_SERIES, "f7-hy-oas", (v) => round(v * 100, 0)),
    fetchSeriesHistorySafe(IG_OAS_SERIES, "f7-ig-oas", (v) => round(v * 100, 0)),
  ]);

  const vixHistory = vixResult?.history ?? null;
  const vixRetrievedAtIso = vixResult ? new Date(vixResult.fetchedAtMs).toISOString() : nowIso;
  const vixLatest = vixHistory?.[0] ?? null;
  const vixPrev = vixHistory?.[1] ?? null;

  kpiOverrides["f7-vix"] = vixLatest
    ? {
        value: round(vixLatest.value, 2),
        sourceTag: SOURCE_TAG,
        dataState: "REAL",
        observationAtIso: toObservationIso(vixLatest.date),
        retrievedAtIso: vixRetrievedAtIso,
        provenance: "observed",
      }
    : unavailableOverride(nowIso);

  if (vixLatest && vixPrev) {
    const vix1d = round(vixLatest.value - vixPrev.value, 2);
    kpiOverrides["f7-vix-1d"] = {
      value: vix1d,
      sourceTag: SOURCE_TAG,
      dataState: "REAL",
      observationAtIso: toObservationIso(vixLatest.date),
      retrievedAtIso: vixRetrievedAtIso,
      provenance: "derived",
    };
    // User-requested 2026-09-16: previous/current for delta KPIs too, not
    // just levels — same convention as f6Currency.ts's DXY today%/5d% fix.
    await persistObservation({
      kpiId: "f7-vix-1d",
      observationAt: new Date(toObservationIso(vixLatest.date)),
      retrievedAt: new Date(vixRetrievedAtIso),
      numericValue: vix1d,
      sourceTag: SOURCE_TAG,
      provenance: "derived",
    });
  } else {
    kpiOverrides["f7-vix-1d"] = unavailableOverride(nowIso);
  }

  const hyOasHistory = hyOasResult?.history ?? null;
  const hyOasRetrievedAtIso = hyOasResult ? new Date(hyOasResult.fetchedAtMs).toISOString() : nowIso;
  const hyLatest = hyOasHistory?.[0] ?? null;
  const hyPrev = hyOasHistory?.[1] ?? null;

  // FRED reports BAMLH0A0HYM2 in percentage points (e.g. 2.63 == 2.63%);
  // this KPI's fixture convention is bps (e.g. 312), hence ×100.
  kpiOverrides["f7-hy-oas"] = hyLatest
    ? {
        value: round(hyLatest.value * 100, 0),
        sourceTag: SOURCE_TAG,
        dataState: "REAL",
        observationAtIso: toObservationIso(hyLatest.date),
        retrievedAtIso: hyOasRetrievedAtIso,
        provenance: "observed",
      }
    : unavailableOverride(nowIso);

  if (hyLatest && hyPrev) {
    const hyOas1d = round((hyLatest.value - hyPrev.value) * 100, 0);
    kpiOverrides["f7-hy-oas-1d"] = {
      value: hyOas1d,
      sourceTag: SOURCE_TAG,
      dataState: "REAL",
      observationAtIso: toObservationIso(hyLatest.date),
      retrievedAtIso: hyOasRetrievedAtIso,
      provenance: "derived",
    };
    await persistObservation({
      kpiId: "f7-hy-oas-1d",
      observationAt: new Date(toObservationIso(hyLatest.date)),
      retrievedAt: new Date(hyOasRetrievedAtIso),
      numericValue: hyOas1d,
      sourceTag: SOURCE_TAG,
      provenance: "derived",
    });
  } else {
    kpiOverrides["f7-hy-oas-1d"] = unavailableOverride(nowIso);
  }

  const igOasHistory = igOasResult?.history ?? null;
  const igOasRetrievedAtIso = igOasResult ? new Date(igOasResult.fetchedAtMs).toISOString() : nowIso;
  const igLatest = igOasHistory?.[0] ?? null;
  kpiOverrides["f7-ig-oas"] = igLatest
    ? {
        value: round(igLatest.value * 100, 0),
        sourceTag: SOURCE_TAG,
        dataState: "REAL",
        observationAtIso: toObservationIso(igLatest.date),
        retrievedAtIso: igOasRetrievedAtIso,
        provenance: "observed",
      }
    : unavailableOverride(nowIso);

  return { kpiOverrides };
}
