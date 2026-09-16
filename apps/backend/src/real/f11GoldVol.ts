import { fetchLatestObservations, FredApiError, type FredObservation } from "../providers/fred";
import { cached } from "./cache";
import { loadAppConfig } from "../config/env";
import { insertObservationIfChanged, type KpiObservationInput } from "../db/kpiObservations";
import { round, toObservationIso, unavailableOverride, type FamilyOverrideResult, type KpiOverride } from "./types";

const SERIES_ID = "GVZCLS";
const SOURCE_TAG = "FRED";
const TTL_MS = 15 * 60_000;

function isDbConfigured(): boolean {
  return loadAppConfig().db !== null;
}

/** Persists one observation to `kpi_observations` (best-effort — durable "previous value" history, see kpiHistory.ts's DB-backed lookup) — never turns a successful fetch into a failed one. */
async function persistObservation(input: KpiObservationInput): Promise<void> {
  if (!isDbConfigured()) return;
  try {
    await insertObservationIfChanged(input);
  } catch (err) {
    console.error(`[real-data] F11 failed to persist kpi_observations row for ${input.kpiId}:`, err instanceof Error ? err.message : err);
  }
}

export function computeGvzValues(history: readonly FredObservation[]): { level: number | null; change1d: number | null; change5d: number | null } {
  const latest = history[0]?.value;
  return {
    level: latest == null ? null : round(latest, 1),
    change1d: latest == null || history[1]?.value == null ? null : round(latest - history[1].value, 1),
    change5d: latest == null || history[5]?.value == null ? null : round(latest - history[5].value, 1),
  };
}

export async function buildF11Overrides(): Promise<FamilyOverrideResult> {
  const nowIso = new Date().toISOString();
  try {
    const { value: history, fetchedAtMs } = await cached(`fred:${SERIES_ID}`, TTL_MS, async () => {
      const observations = await fetchLatestObservations(SERIES_ID, 8);
      const latest = observations[0];
      if (latest) {
        await persistObservation({
          kpiId: "f11-gvz",
          observationAt: new Date(toObservationIso(latest.date)),
          retrievedAt: new Date(),
          numericValue: round(latest.value, 1),
          sourceTag: SOURCE_TAG,
          provenance: "observed",
        });
      }
      return observations;
    });
    const latest = history[0];
    if (!latest) throw new Error("GVZ series returned no usable observation");
    const values = computeGvzValues(history);
    const retrievedAtIso = new Date(fetchedAtMs).toISOString();
    const base = { sourceTag: SOURCE_TAG, dataState: "REAL" as const, observationAtIso: toObservationIso(latest.date), retrievedAtIso };
    const kpiOverrides: Record<string, KpiOverride> = {
      "f11-gvz": values.level == null ? unavailableOverride(nowIso) : { ...base, value: values.level, provenance: "observed" },
      "f11-gvz-1d": values.change1d == null ? unavailableOverride(nowIso) : { ...base, value: values.change1d, provenance: "derived" },
      "f11-gvz-5d": values.change5d == null ? unavailableOverride(nowIso) : { ...base, value: values.change5d, provenance: "derived" },
    };
    return { kpiOverrides };
  } catch (error) {
    const detail = error instanceof FredApiError ? `[${error.code}] ${error.message}` : error instanceof Error ? error.message : String(error);
    console.error(`[real-data] F11 GVZ (FRED) fetch failed: ${detail}`);
    return { kpiOverrides: { "f11-gvz": unavailableOverride(nowIso), "f11-gvz-1d": unavailableOverride(nowIso), "f11-gvz-5d": unavailableOverride(nowIso) } };
  }
}
