import type { BlsObservation, BlsCalcLookback, BlsObservationWithCalculations } from "../providers/bls";
import { insertObservationIfChanged } from "../db/kpiObservations";
import { rememberLatestValueFromObservation } from "../db/kpiLatestValues";

// Milestone 2B — shared helpers for BLS monthly-series math (F4 Inflation,
// F5 Employment). `fetchSeriesHistory`/`fetchSeriesHistoryWithCalculations`
// return observations newest-first (index 0 = latest month), but — Bug A fix
// — nothing in this file relies on that ordering to find "N months ago."
//
// BUG A (P0) ROOT CAUSE: every MoM/YoY/3M-annualized figure used to be
// computed by ARRAY OFFSET (`history[1]`/`history[12]`/`history[3]`) against
// the now-removed Massive fallback's months array, which could silently
// contain gaps (a dropped/missing month via `.filter()`) — "12 entries back"
// then quietly stopped meaning "12 calendar months back." The Massive
// fallback itself is gone, but the SAME array-offset pattern was still
// present in this file's BLS-only path (`history[12]` etc.) — fixed below:
// every lookback is now computed EXPLICITLY from the calendar (latest
// year/month minus N months) and located in `history` by its actual
// `year`/`period` fields via `findObservation` — never by counting array
// entries. If the exact required period is missing from what was fetched,
// the result is `null` (caller reports UNAVAILABLE) — never a neighboring
// month substituted silently.

/**
 * A BLS monthly observation's "as of" date. Deliberately the LAST day of the
 * reference month (not the 1st) — CPI/employment for month M is released
 * roughly 2-3 weeks into month M+1, so anchoring to month-end (rather than
 * month-start) is what makes the monthly cadence-aware freshness threshold
 * (45 days from observationAt — see snapshotCache.ts) actually cover the
 * normal release lag instead of flagging a just-released, genuinely current
 * print as stale on day 1.
 */
export function lastDayOfMonthIso(year: string, period: string): string {
  const monthNum = Number(period.slice(1)); // "M07" -> 7
  return new Date(Date.UTC(Number(year), monthNum, 0)).toISOString();
}

/** BLS period code for a 1-12 month number, e.g. periodCode(7) -> "M07". */
export function periodCode(month: number): string {
  return `M${String(month).padStart(2, "0")}`;
}

function toMonthIndex(year: number, month: number): number {
  return year * 12 + (month - 1);
}

function fromMonthIndex(index: number): { year: number; month: number } {
  const year = Math.floor(index / 12);
  const month = index - year * 12 + 1; // Math.floor rounds toward -Infinity, so this is always in [1, 12] regardless of sign
  return { year, month };
}

/** The exact calendar month `monthsBack` before (year, month) — e.g. (2026, 7, 12) -> {year: 2025, month: 7}. Never array-offset — pure calendar arithmetic. */
export function shiftCalendarMonthsBack(year: number, month: number, monthsBack: number): { year: number; month: number } {
  return fromMonthIndex(toMonthIndex(year, month) - monthsBack);
}

/**
 * Finds the EXACT observation for (year, month) by its actual `year`/
 * `period` fields — the Bug A fix. Never counts N entries back in the array.
 */
export function findObservation(history: BlsObservation[], year: number, month: number): BlsObservation | undefined {
  const period = periodCode(month);
  return history.find((obs) => obs.year === String(year) && obs.period === period);
}

/**
 * Up to `count` most-recent months' raw observations, located by EXACT
 * calendar period starting at (latestYear, latestMonth) and stepping back
 * one calendar month at a time — never array offset. Returns fewer than
 * `count` entries (never fabricated/padded) if a requested month is missing
 * from `history`, but does not stop early on a single gap (a later month
 * further back may still be present).
 */
export function recentCalendarMonths(history: BlsObservation[], latestYear: number, latestMonth: number, count: number): BlsObservation[] {
  const result: BlsObservation[] = [];
  for (let i = 0; i < count; i++) {
    const target = i === 0 ? { year: latestYear, month: latestMonth } : shiftCalendarMonthsBack(latestYear, latestMonth, i);
    const obs = findObservation(history, target.year, target.month);
    if (obs) result.push(obs);
  }
  return result;
}

export interface CpiCalc {
  momPct: number | null;
  yoyPct: number | null;
  ann3mPct: number | null;
  observationAtIso: string | null;
}

const NO_CALC: CpiCalc = { momPct: null, yoyPct: null, ann3mPct: null, observationAtIso: null };

/**
 * Standard MoM / YoY / 3-month-annualized index-ratio math:
 *   MoM  = (latest / latest-1mo) - 1
 *   YoY  = (latest / latest-12mo) - 1
 *   3M annualized = (latest / latest-3mo) ^ 4 - 1
 * Each figure independently becomes `null` (not a thrown error) when its
 * required EXACT calendar period is missing from `history` or holds a BLS
 * "-" placeholder — the caller marks exactly that one derived KPI
 * UNAVAILABLE rather than the whole series. See top-of-file Bug A note:
 * every lookback here is calendar-exact, never array-offset.
 */
export function computeCpiCalc(history: BlsObservation[] | null): CpiCalc {
  if (!history || history.length === 0) return NO_CALC;
  const latest = history[0];
  if (latest.value == null) return NO_CALC;
  const latestYear = Number(latest.year);
  const latestMonth = Number(latest.period.slice(1));
  const observationAtIso = lastDayOfMonthIso(latest.year, latest.period);

  const mom = shiftCalendarMonthsBack(latestYear, latestMonth, 1);
  const momBase = findObservation(history, mom.year, mom.month);
  const momPct = momBase?.value != null ? (latest.value / momBase.value - 1) * 100 : null;

  const yoy = shiftCalendarMonthsBack(latestYear, latestMonth, 12);
  const yoyBase = findObservation(history, yoy.year, yoy.month);
  const yoyPct = yoyBase?.value != null ? (latest.value / yoyBase.value - 1) * 100 : null;

  const ann3m = shiftCalendarMonthsBack(latestYear, latestMonth, 3);
  const ann3mBase = findObservation(history, ann3m.year, ann3m.month);
  const ann3mPct = ann3mBase?.value != null ? ((latest.value / ann3mBase.value) ** 4 - 1) * 100 : null;

  return { momPct, yoyPct, ann3mPct, observationAtIso };
}

export type ResolvedProvenance = "observed" | "derived";

export interface ResolvedChange {
  value: number;
  provenance: ResolvedProvenance;
}

/**
 * Resolves a percent-change KPI (MoM = key "1", YoY = key "12") preferring
 * BLS's OWN `calculations` block (`provenance: "observed"` — we are taking
 * BLS's own stated change, not deriving one ourselves) and falling back to
 * an explicit calendar-period-matched derivation from the raw observations
 * (`provenance: "derived"`) only when BLS's calculations block doesn't
 * supply that exact figure for the latest period. Never array-offset in
 * either path — see computeCpiCalc.
 */
export function resolvePctChange(history: BlsObservationWithCalculations[] | null, key: BlsCalcLookback): ResolvedChange | null {
  if (!history || history.length === 0) return null;
  const latest = history[0];
  if (latest.value == null) return null;

  const direct = latest.calculations?.pctChanges[key];
  if (direct != null) return { value: direct, provenance: "observed" };

  const calc = computeCpiCalc(history);
  const derived = key === "1" ? calc.momPct : key === "12" ? calc.yoyPct : null;
  return derived != null ? { value: derived, provenance: "derived" } : null;
}

/** Same idea as `resolvePctChange` but for a net (level) change — used by F5 payrolls-latest. Only the 1-month lookback has a derived fallback implemented (the only one any caller currently needs). */
export function resolveNetChange(history: BlsObservationWithCalculations[] | null, key: BlsCalcLookback): ResolvedChange | null {
  if (!history || history.length === 0) return null;
  const latest = history[0];
  if (latest.value == null) return null;

  const direct = latest.calculations?.netChanges[key];
  if (direct != null) return { value: direct, provenance: "observed" };

  if (key !== "1") return null;
  const latestYear = Number(latest.year);
  const latestMonth = Number(latest.period.slice(1));
  const base = shiftCalendarMonthsBack(latestYear, latestMonth, 1);
  const baseObs = findObservation(history, base.year, base.month);
  return baseObs?.value != null ? { value: latest.value - baseObs.value, provenance: "derived" } : null;
}

export interface Average3MonthResult {
  value: number;
  provenance: "derived";
  observationAtIso: string;
}

/**
 * f5-payrolls-3m: the average of the 3 most-recent monthly net changes, each
 * an exact-calendar-period level diff (never array offset). Always
 * "derived" — no source publishes a 3-month AVERAGE monthly change directly
 * (BLS's own 3-month `calculations` lookback is the CUMULATIVE change over
 * 3 months, a different metric). Returns `null` if any of the 4 required
 * months (latest + 3 priors) is missing from `history`.
 */
export function average3MonthlyNetChanges(history: BlsObservation[] | null): Average3MonthResult | null {
  if (!history || history.length === 0) return null;
  const latest = history[0];
  if (latest.value == null) return null;
  const latestYear = Number(latest.year);
  const latestMonth = Number(latest.period.slice(1));

  const diffs: number[] = [];
  let currentValue = latest.value;
  let cursorYear = latestYear;
  let cursorMonth = latestMonth;
  for (let i = 0; i < 3; i++) {
    const prior = shiftCalendarMonthsBack(cursorYear, cursorMonth, 1);
    const priorObs = findObservation(history, prior.year, prior.month);
    if (priorObs?.value == null) return null;
    diffs.push(currentValue - priorObs.value);
    currentValue = priorObs.value;
    cursorYear = prior.year;
    cursorMonth = prior.month;
  }

  const value = diffs.reduce((sum, d) => sum + d, 0) / diffs.length;
  return { value, provenance: "derived", observationAtIso: lastDayOfMonthIso(latest.year, latest.period) };
}

export interface PersistParams {
  kpiId: string;
  observationAtIso: string;
  retrievedAtIso: string;
  numericValue: number;
  sourceTag: string;
  provenance: string;
}

/**
 * Best-effort append-only persistence into `kpi_observations`. Never
 * throws — a MySQL hiccup must never prevent real market data from being
 * served; the DB is an audit-trail layer on top of the existing in-memory
 * TTL cache (real/cache.ts), not something the request path depends on.
 * `insertObservationIfChanged` already dedups an identical repeat value for
 * the same (kpi_id, observation_at), so it is safe/cheap to call this on
 * every request that produces a REAL value, not just on a genuine
 * cache-miss fetch.
 */
export async function persistObservation(params: PersistParams): Promise<void> {
  const observationAt = new Date(params.observationAtIso);
  const retrievedAt = new Date(params.retrievedAtIso);
  try {
    await insertObservationIfChanged({
      kpiId: params.kpiId,
      observationAt,
      retrievedAt,
      numericValue: params.numericValue,
      sourceTag: params.sourceTag,
      provenance: params.provenance,
    });
  } catch (err) {
    console.error(`[real-data] kpi_observations persistence failed for ${params.kpiId}:`, err instanceof Error ? err.message : err);
  }
  try {
    await rememberLatestValueFromObservation({
      kpiId: params.kpiId,
      observationAt,
      retrievedAt,
      numericValue: params.numericValue,
      sourceTag: params.sourceTag,
      provenance: params.provenance,
    });
  } catch (err) {
    console.error(`[real-data] kpi_latest_values persistence failed for ${params.kpiId}:`, err instanceof Error ? err.message : err);
  }
}
