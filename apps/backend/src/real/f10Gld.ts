import { fetchGldHistoricalArchive, parseGldWorkbook, type GldDailyRow } from "../providers/spdrGld";
import { cached } from "./cache";
import { recordAttempt, recordFailure, recordSuccess } from "../db/ingestionState";
import { insertMissingHistoricalObservations, insertObservationIfChanged, type KpiObservationInput } from "../db/kpiObservations";
import { round, unavailableOverride, type KpiOverride } from "./types";
import { computeGldParticipationMetrics, type GldParticipationMetrics } from "./f10ParticipationMetrics";

// F10 GLD physical holdings (this pass) — SPDR's own historical-archive
// XLSX for the GLD ETF (see apps/backend/src/providers/spdrGld.ts for the
// full source/format writeup, including how holiday rows are detected).
// Wired into F10 alongside (not replacing) the existing CFTC-based
// Managed Money KPIs in f10Flows.ts, which are untouched by this file.
//
// f10-etf-holdings = the latest real trading day's "Tonnes of Gold"
// (DIRECT quote from the archive — provenance "observed").
// f10-etf-delta = the CHANGE IN TONNES between the two most recent MARKET
// (business) days present in the file, explicitly skipping any row SPDR
// marks "US Holiday" (provenance "derived" — it is a computation over two
// observed readings). This is deliberately a PHYSICAL-QUANTITY delta, never
// the dollar "Total Net Asset Value" delta the file also carries — the
// gold price itself would contaminate a dollar-NAV delta, making it
// useless as a "is capital genuinely flowing into/out of the physical
// trust" signal, which is the whole point of this KPI.
//
// Honest labeling: this is SPDR GLD specifically, not a market-wide
// "global gold ETF" aggregate — see the corrected labels in
// apps/backend/src/mock/fixtures.ts and docs/PROVIDER_SETUP.md. Explicitly
// does NOT use IAU (a different issuer), the World Gold Council/Goldhub (no
// public API), or Massive (no bulk holdings feed) for this KPI.
const GLD_JOB_KEY = "spdr:gld";
// SPDR's exact daily publish time was not confirmed live this pass — a
// once/day-equivalent TTL is the "reasonable once-daily check" the
// milestone brief allows when the exact publish time isn't discoverable.
const GLD_TTL_MS = 20 * 60 * 60_000;
const SOURCE_TAG = "SPDR_GLD";
// A short, stable stand-in for the full historical-archive URL (which,
// with its query string, exceeds kpi_observations.status's VARCHAR(64)) —
// the endpoint itself is documented in full in providers/spdrGld.ts.
const ARCHIVE_SOURCE_LABEL = "SPDR_HISTORICAL_ARCHIVE_XLSX";

export interface GldSnapshot {
  latestTonnes: number;
  latestDateIso: string;
  priorTonnes: number;
  priorDateIso: string;
  metrics?: GldParticipationMetrics;
}

function isTradingRow(row: GldDailyRow): row is GldDailyRow & { tonnesOfGold: number } {
  return row.tonnesOfGold !== null;
}

/**
 * Pure derivation from already-parsed rows — holds the two behaviors this
 * KPI pair depends on: (1) holiday rows (`tonnesOfGold: null`, see
 * providers/spdrGld.ts) are skipped entirely rather than treated as a real
 * trading day, and (2) the "latest"/"prior" pair is always the two most
 * recent rows that SURVIVE that filter, i.e. genuinely the two most recent
 * MARKET days, not just the two most recent rows in the file. Exported
 * (and kept separate from the network fetch in `fetchGldSnapshot` below)
 * specifically so this logic is unit-testable without mocking HTTP — see
 * tests/f10-gld-archive.test.ts. Throws if fewer than 2 real trading rows
 * are present — never silently derives a delta from fewer than 2 readings.
 */
export function deriveGldSnapshotFromRows(rows: readonly GldDailyRow[]): GldSnapshot {
  const tradingRows = rows.filter(isTradingRow);
  if (tradingRows.length < 2) {
    throw new Error("fewer than 2 real (non-holiday) trading-day rows found in the GLD historical archive");
  }

  const latest = tradingRows[tradingRows.length - 1];
  const prior = tradingRows[tradingRows.length - 2];
  return {
    latestTonnes: latest.tonnesOfGold,
    latestDateIso: latest.dateIso,
    priorTonnes: prior.tonnesOfGold,
    priorDateIso: prior.dateIso,
  };
}

async function fetchGldSnapshot(): Promise<GldSnapshot> {
  const buffer = await fetchGldHistoricalArchive();
  const rows = await parseGldWorkbook(buffer);
  if (!rows) throw new Error("GLD historical-archive XLSX did not parse into the expected sheet/columns");
  const snapshot = deriveGldSnapshotFromRows(rows);
  await persistGldHistorySafely(rows, new Date());
  return {
    ...snapshot,
    metrics: computeGldParticipationMetrics(
      rows.map((row) => ({ dateIso: row.dateIso, tonnesOfGold: row.tonnesOfGold, closingPrice: row.closingPrice ?? null }))
    ),
  };
}

async function persistGldHistorySafely(rows: readonly GldDailyRow[], retrievedAt: Date): Promise<void> {
  const valid = rows.filter((row): row is GldDailyRow & { tonnesOfGold: number; closingPrice: number } =>
    row.tonnesOfGold !== null && typeof row.closingPrice === "number"
  );
  try {
    await insertMissingHistoricalObservations(valid.map((row) => ({
      kpiId: "f10-etf-holdings",
      observationAt: new Date(row.dateIso),
      retrievedAt,
      numericValue: row.tonnesOfGold,
      sourceTag: SOURCE_TAG,
      provenance: "observed",
      status: ARCHIVE_SOURCE_LABEL,
    })));
    await insertMissingHistoricalObservations(valid.map((row) => ({
      kpiId: "f10-gld-closing-price",
      observationAt: new Date(row.dateIso),
      retrievedAt,
      numericValue: row.closingPrice,
      sourceTag: SOURCE_TAG,
      provenance: "observed",
      status: ARCHIVE_SOURCE_LABEL,
    })));
  } catch (err) {
    console.error("[real-data] F10 GLD: historical MySQL bootstrap failed; live metrics remain available:", err instanceof Error ? err.message : err);
  }
}

async function fetchGldSnapshotTracked(): Promise<GldSnapshot> {
  try {
    await recordAttempt(GLD_JOB_KEY);
  } catch (err) {
    console.error("[real-data] F10 GLD: ingestion-state attempt could not be recorded; continuing live fetch:", err instanceof Error ? err.message : err);
  }

  try {
    const snapshot = await fetchGldSnapshot();
    try {
      await recordSuccess(GLD_JOB_KEY, null);
    } catch (err) {
      console.error("[real-data] F10 GLD: ingestion success could not be recorded:", err instanceof Error ? err.message : err);
    }
    return snapshot;
  } catch (err) {
    try {
      await recordFailure(GLD_JOB_KEY, err instanceof Error ? err.message.slice(0, 300) : String(err).slice(0, 300));
    } catch (trackingError) {
      console.error("[real-data] F10 GLD: ingestion failure could not be recorded:", trackingError instanceof Error ? trackingError.message : trackingError);
    }
    throw err;
  }
}

/** Never lets a MySQL persistence failure affect the real-data response — mirrors this codebase's existing "DB config missing must never crash the app" rule (see db/pool.ts's DbNotConfiguredError). */
async function persistObservationSafely(input: KpiObservationInput): Promise<void> {
  try {
    await insertObservationIfChanged(input);
  } catch (err) {
    console.error("[real-data] F10 GLD: failed to persist KPI observation to MySQL:", err instanceof Error ? err.message : err);
  }
}

export async function buildF10GldOverrides(): Promise<Record<string, KpiOverride>> {
  const nowIso = new Date().toISOString();
  try {
    const { value: snapshot, fetchedAtMs } = await cached(GLD_JOB_KEY, GLD_TTL_MS, fetchGldSnapshotTracked);
    const retrievedAtIso = new Date(fetchedAtMs).toISOString();
    const deltaTonnes = snapshot.latestTonnes - snapshot.priorTonnes;
    if (!snapshot.metrics) throw new Error("GLD participation metrics were not computed");
    const metrics = snapshot.metrics;

    await persistObservationSafely({
      kpiId: "f10-etf-holdings",
      observationAt: new Date(snapshot.latestDateIso),
      retrievedAt: new Date(fetchedAtMs),
      numericValue: snapshot.latestTonnes,
      sourceTag: SOURCE_TAG,
      provenance: "observed",
      status: ARCHIVE_SOURCE_LABEL,
    });
    await persistObservationSafely({
      kpiId: "f10-etf-delta",
      observationAt: new Date(snapshot.latestDateIso),
      retrievedAt: new Date(fetchedAtMs),
      numericValue: deltaTonnes,
      sourceTag: SOURCE_TAG,
      provenance: "derived",
      status: ARCHIVE_SOURCE_LABEL,
    });

    return {
      "f10-etf-holdings": {
        value: round(snapshot.latestTonnes, 2),
        sourceTag: SOURCE_TAG,
        dataState: "REAL",
        provenance: "observed",
        observationAtIso: snapshot.latestDateIso,
        retrievedAtIso,
      },
      "f10-etf-delta": {
        value: round(deltaTonnes, 2),
        sourceTag: SOURCE_TAG,
        dataState: "REAL",
        provenance: "derived",
        observationAtIso: snapshot.latestDateIso,
        retrievedAtIso,
      },
      "f10-etf-delta-5d": metricOverride(metrics.change5, 2, metrics.latestDateIso, retrievedAtIso, metrics.persistence),
      "f10-etf-delta-20d": metricOverride(metrics.change20, 2, metrics.latestDateIso, retrievedAtIso, metrics.persistence),
      "f10-etf-flow-z60": metricOverride(metrics.flowZ60, 2, metrics.latestDateIso, retrievedAtIso, classifyFlowIntensity(metrics.flowZ60, metrics.change1)),
      "f10-etf-flow-percentile": metricOverride(metrics.flow20Percentile, 0, metrics.latestDateIso, retrievedAtIso, classifyFlowExtension(metrics.flow20Percentile)),
      "f10-gld-return-5d": metricOverride(metrics.priceReturn5, 2, metrics.latestDateIso, retrievedAtIso),
      "f10-gld-return-20d": metricOverride(metrics.priceReturn20, 2, metrics.latestDateIso, retrievedAtIso, metrics.priceFlow),
    };
  } catch (err) {
    console.error("[real-data] F10 GLD (SPDR historical archive) fetch/parse failed:", err instanceof Error ? err.message : err);
    return {
      "f10-etf-holdings": unavailableOverride(nowIso),
      "f10-etf-delta": unavailableOverride(nowIso),
      "f10-etf-delta-5d": unavailableOverride(nowIso),
      "f10-etf-delta-20d": unavailableOverride(nowIso),
      "f10-etf-flow-z60": unavailableOverride(nowIso),
      "f10-etf-flow-percentile": unavailableOverride(nowIso),
      "f10-gld-return-5d": unavailableOverride(nowIso),
      "f10-gld-return-20d": unavailableOverride(nowIso),
    };
  }
}

function metricOverride(value: number | null, decimals: number, observationAtIso: string, retrievedAtIso: string, driverSummary?: string): KpiOverride {
  if (value === null) return unavailableOverride(retrievedAtIso, "INSUFFICIENT_HISTORY");
  return {
    value: round(value, decimals),
    sourceTag: SOURCE_TAG,
    dataState: "REAL",
    provenance: "derived",
    observationAtIso,
    retrievedAtIso,
    driverSummary,
  };
}

function classifyFlowIntensity(zScore: number | null, dailyFlow: number | null): string | undefined {
  if (zScore === null || dailyFlow === null) return undefined;
  const magnitude = Math.abs(zScore);
  const intensity = magnitude < 1 ? "NORMAL" : magnitude < 2 ? "ELEVATED" : "EXTREME";
  const direction = dailyFlow > 0 ? "EXPANSION" : dailyFlow < 0 ? "CONTRACTION" : "UNCHANGED";
  return `${intensity}_${direction}`;
}

function classifyFlowExtension(percentile: number | null): string | undefined {
  if (percentile === null) return undefined;
  if (percentile <= 10) return "EXTREME_CONTRACTION";
  if (percentile < 30) return "STRONG_CONTRACTION";
  if (percentile < 70) return "NORMAL_MID_RANGE";
  if (percentile < 90) return "STRONG_EXPANSION";
  return "EXTREME_EXPANSION";
}
