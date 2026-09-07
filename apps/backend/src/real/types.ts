import type { EventItem, FedRateDistribution, Provenance, UnavailableReason } from "@gold-terminal/contracts";
import { UNAVAILABLE_SOURCE } from "@gold-terminal/contracts";

// Milestone 2B — shared types for the real-data orchestration layer
// (apps/backend/src/real/*). This layer's sole job is to produce, per KPI
// id, either a REAL value+metadata override or an explicit UNAVAILABLE stub
// — apps/backend/src/cache/snapshotCache.ts merges these onto the boot
// (mock) fixture snapshot and computes cadence-aware freshness on top.
// Nothing in this layer touches apps/backend/src/intelligence/**.

/** One KPI's real-data override. `provenance` is optional — omitted means "keep the fixture's existing provenance" (most KPIs don't change provenance just by going real). */
export interface KpiOverride {
  value: number | null;
  sourceTag: string;
  /**
   * Optional multi-source detail — set only when a DERIVED KPI genuinely
   * combines series from more than one distinct provider (e.g. F8's
   * `f8-effr-iorb`: NY Fed EFFR minus FRED IORB). `sourceTag` stays a single
   * summary value for backward compatibility; `sourceTags` is the more
   * precise ordered list. `undefined` (the default) means "single-provider,
   * `sourceTag` alone is precise" — most KPIs never set this. See
   * `CanonicalKpi.sourceTags` in @gold-terminal/contracts.
   */
  sourceTags?: string[];
  dataState: "REAL" | "UNAVAILABLE";
  /** When this value is as-of (ISO). For UNAVAILABLE stubs, this is "now" — quality is forced to "unavailable" regardless, so it is never read for freshness math. */
  observationAtIso: string;
  /** When the backend actually retrieved/computed this value (ISO) — distinct from `observationAtIso` per the three-timestamp model already used elsewhere in this codebase. */
  retrievedAtIso: string;
  provenance?: Provenance;
  /** Only meaningful when `dataState === "UNAVAILABLE"` — see `UnavailableReason` in @gold-terminal/contracts. Every call site outside `unavailableOverride()` itself should go through that helper rather than setting this directly. */
  unavailableReason?: UnavailableReason;
  /**
   * Optional override for a KPI's `driverSummary` text. `undefined` (the
   * default — every existing override omits this) means "keep the fixture's
   * authored driverSummary unchanged," which is correct for the vast
   * majority of KPIs. Only `f8-funding-microstate` currently uses this, to
   * replace its static "NORMAL" mock sentinel with a computed NORMAL/
   * ANOMALOUS reading once real SOFR/IORB data is available. An explicit
   * `null` clears the fixture's driverSummary — deliberately distinct from
   * omitting the field — used when the computation that would produce it is
   * itself unavailable, so no unearned "NORMAL" claim lingers.
   */
  driverSummary?: string | null;
}

export interface FamilyOverrideResult {
  kpiOverrides: Record<string, KpiOverride>;
  /** Real upcoming-event list for F3 (next FOMC meeting, from the real rate-pricing source) and F9 (real upcoming-auction events). `undefined` means "keep whatever nextEvents the family already had" (used only by F9 on a fetch failure, to keep showing the last-known schedule rather than nothing) — every other real family either always sets this (F3, F4, F5 — `[]` when genuinely unknown, never a fabricated date) or never sets it at all (F6-F8, F10, F11, which have no calendar concept). */
  nextEvents?: EventItem[];
  /** Only meaningful for F3 — see `FedRateDistribution` in @gold-terminal/contracts. `undefined` for every other family. */
  fedRateDistribution?: FedRateDistribution | null;
}

/**
 * A KPI this milestone could not source data for — always `value: null`,
 * `dataState: "UNAVAILABLE"`. `quality` is computed as "unavailable"
 * unconditionally by snapshotCache.ts, independent of
 * `observationAtIso`/`retrievedAtIso` here.
 *
 * `reason` defaults to `"FETCH_FAILED"` because most call sites are
 * try/catch failure paths or a null-value fallback after a real fetch was
 * attempted — i.e. a real source exists and is normally wired, this
 * specific attempt just didn't produce a usable value. Pass
 * `"NO_SOURCE"` explicitly at the handful of call sites that mark a KPI
 * UNAVAILABLE unconditionally, before any real fetch is ever attempted
 * (e.g. f7-move/f7-move-1d, f10-etf-holdings) — see `UnavailableReason` in
 * @gold-terminal/contracts for the full distinction.
 */
export function unavailableOverride(nowIso: string, reason: UnavailableReason = "FETCH_FAILED"): KpiOverride {
  return {
    value: null,
    sourceTag: UNAVAILABLE_SOURCE,
    dataState: "UNAVAILABLE",
    observationAtIso: nowIso,
    retrievedAtIso: nowIso,
    driverSummary: null,
    unavailableReason: reason,
  };
}

export function round(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

/** Converts a plain "YYYY-MM-DD" date (as returned by FRED/NY Fed) into a full UTC-midnight ISO timestamp. */
export function toObservationIso(dateStr: string): string {
  return new Date(`${dateStr}T00:00:00Z`).toISOString();
}

/** For a derived (multi-series) KPI, use the earliest of the given observation dates so the combined value is never claimed "as of" a date more recent than every input actually supports. */
export function earliestIso(isoDates: string[]): string {
  return isoDates.reduce((min, iso) => (iso < min ? iso : min));
}
