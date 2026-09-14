import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import type { CanonicalKpi } from "@gold-terminal/contracts";

export interface KpiObservation {
  value: number | null;
  unit: string | null;
  observationAt: string;
  retrievedAt: string;
}

type KpiHistory = Record<string, KpiObservation>;
const historyFile = join(process.cwd(), ".runtime", "cloud-kpi-observations.json");

function load(): KpiHistory {
  if (!existsSync(historyFile)) return {};
  try { return JSON.parse(readFileSync(historyFile, "utf8")) as KpiHistory; } catch { return {}; }
}

function save(history: KpiHistory): void {
  mkdirSync(dirname(historyFile), { recursive: true });
  writeFileSync(historyFile, JSON.stringify(history, null, 2), "utf8");
}

/** Stores the latest fetch and returns the immediately preceding observation.
 * The stored point changes only when the source observation/fetch changes. */
export function rememberKpiObservation(kpi: CanonicalKpi): KpiObservation | null {
  const history = load();
  const current: KpiObservation = {
    value: kpi.value,
    unit: kpi.unit,
    observationAt: kpi.observationAt,
    retrievedAt: kpi.retrievedAt,
  };
  const previous = history[kpi.id] ?? null;
  const changed = !previous || previous.value !== current.value || previous.observationAt !== current.observationAt || previous.retrievedAt !== current.retrievedAt;
  if (changed) save({ ...history, [kpi.id]: current });
  return previous;
}
