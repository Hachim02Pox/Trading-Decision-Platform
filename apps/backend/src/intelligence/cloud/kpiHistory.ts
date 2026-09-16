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

/** Same underlying observation — identical value AND identical source as-of date. `retrievedAt` (fetch time) is never part of this comparison — see `rememberKpiObservation`'s header comment. */
function isSameObservation(a: KpiObservation, b: KpiObservation): boolean {
  return a.value === b.value && a.observationAt === b.observationAt;
}

/**
 * Self-heals a `previous` slot that already equals `current` — a state that
 * should now be structurally impossible to WRITE (see `rememberKpiObservation`
 * below) but could still be sitting in `.runtime/cloud-kpi-observations.json`
 * from before the 2026-09-16 fix (a same-value `previous` written by the old
 * `retrievedAt`-inclusive comparison). Read-time sanitization means an
 * already-corrupted on-disk entry corrects itself the next time this KPI is
 * read, without a separate one-off migration script.
 */
function sanitizeEntry(entry: KpiHistoryEntry): KpiHistoryEntry {
  if (entry.previous && isSameObservation(entry.previous, entry.current)) return { current: entry.current, previous: null };
  return entry;
}

/** Stores the latest fetch and returns the immediately preceding observation.
 * The stored point changes only when the source observation/fetch changes.
 * Narrowed to the exact fields actually read (not `CanonicalKpi` in full) so
 * it can be called from `snapshotCache.ts` before the mechanical engine has
 * attached `mechanicalGoldRead`/`mechanicalEvaluation` to the KPI object.
 *
 * INVARIANT: the returned "previous" is NEVER the same observation as
 * "current" — enforced both when deciding whether to advance the slot below
 * AND defensively on every read via `sanitizeEntry`, so "ancienne valeur"
 * and "valeur actuelle" can never legitimately render as the same number
 * (2026-09-16 product requirement). */
export function rememberKpiObservation(kpi: Pick<CanonicalKpi, "id" | "value" | "unit" | "observationAt" | "retrievedAt">): KpiObservation | null {
  const history = load();
  const current: KpiObservation = {
    value: kpi.value,
    unit: kpi.unit,
    observationAt: kpi.observationAt,
    retrievedAt: kpi.retrievedAt,
  };
  const rawEntry = history[kpi.id];
  if (!rawEntry) {
    save({ ...history, [kpi.id]: { current, previous: null } });
    return null;
  }
  const entry = sanitizeEntry(rawEntry);

  // `retrievedAt` deliberately excluded (bug found live 2026-09-16): a
  // shorter TTL/prefetch trigger means this app now re-fetches some sources
  // more often, but a re-fetch that lands on the SAME source observation
  // (unchanged value, unchanged `observationAt` — e.g. two real fetches
  // before the source has published its next print) is not a genuinely new
  // reading. Comparing `retrievedAt` too used to shift "current" into
  // "previous" on every such re-fetch, showing an "ancienne valeur ->
  // valeur actuelle" comparison where both sides were literally the same
  // number — never wrong data, but noise that looked like a bug. "previous"
  // now only advances when the underlying observation itself changes.
  const changed = !isSameObservation(entry.current, current);
  if (changed) {
    save({ ...history, [kpi.id]: { current, previous: entry.current } });
    return entry.current;
  }
  // Identical refreshes preserve the real earlier observation rather than
  // turning the current point into a false "before" value. Persist the
  // sanitized shape too, so a corrupted on-disk `previous` is actually
  // repaired on disk (not just papered over in this call's return value).
  if (entry !== rawEntry) save({ ...history, [kpi.id]: entry });
  return entry.previous;
}
