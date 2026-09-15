import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import type { CanonicalKpi } from "@gold-terminal/contracts";

export interface KpiObservation {
  value: number | null;
  unit: string | null;
  observationAt: string;
  retrievedAt: string;
}

interface KpiHistoryEntry { current: KpiObservation; previous: KpiObservation | null; }
type KpiHistory = Record<string, KpiHistoryEntry>;
const historyFile = join(process.cwd(), ".runtime", "cloud-kpi-observations.json");

function load(): KpiHistory {
  if (!existsSync(historyFile)) return {};
  try {
    const raw = JSON.parse(readFileSync(historyFile, "utf8")) as Record<string, KpiObservation | KpiHistoryEntry>;
    // Migrate the first, flawed one-slot cache format safely. Its lone point
    // is known to be current, but it must never be presented as a fake prior.
    return Object.fromEntries(Object.entries(raw).map(([id, entry]) => [id, "current" in entry ? entry : { current: entry, previous: null }]));
  } catch { return {}; }
}

function save(history: KpiHistory): void {
  mkdirSync(dirname(historyFile), { recursive: true });
  writeFileSync(historyFile, JSON.stringify(history, null, 2), "utf8");
}

/** Stores the latest fetch and returns the immediately preceding observation.
 * The stored point changes only when the source observation/fetch changes.
 * Narrowed to the exact fields actually read (not `CanonicalKpi` in full) so
 * it can be called from `snapshotCache.ts` before the mechanical engine has
 * attached `mechanicalGoldRead`/`mechanicalEvaluation` to the KPI object. */
export function rememberKpiObservation(kpi: Pick<CanonicalKpi, "id" | "value" | "unit" | "observationAt" | "retrievedAt">): KpiObservation | null {
  const history = load();
  const current: KpiObservation = {
    value: kpi.value,
    unit: kpi.unit,
    observationAt: kpi.observationAt,
    retrievedAt: kpi.retrievedAt,
  };
  const entry = history[kpi.id];
  if (!entry) {
    save({ ...history, [kpi.id]: { current, previous: null } });
    return null;
  }
  const changed = entry.current.value !== current.value || entry.current.observationAt !== current.observationAt || entry.current.retrievedAt !== current.retrievedAt;
  if (changed) {
    save({ ...history, [kpi.id]: { current, previous: entry.current } });
    return entry.current;
  }
  // Identical refreshes preserve the real earlier observation rather than
  // turning the current point into a false "before" value.
  return entry.previous;
}
