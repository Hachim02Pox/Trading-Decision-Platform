import { unavailableOverride, type FamilyOverrideResult, type KpiOverride } from "./types";

// F12 Physical / Structural Gold — restored (product-owner rule: every
// canonical value must be either genuinely REAL or explicitly UNAVAILABLE,
// never simulated or silently absent). F12 had previously been removed from
// the product entirely (see docs/MVP_COCKPIT_CONTRACT.md's prior
// top-of-file note) once the World Gold Council was confirmed to have no
// public API for central-bank gold reserve purchases or aggregate quarterly
// gold demand (only a login-gated interactive dashboard and manual
// spreadsheet/PDF exports — confirmed in a prior research session, not
// re-litigated here). Unlike F1 (which found a real substitute source), no
// free substitute exists for these two figures anywhere: no other provider
// wired into this codebase (FRED, BLS, BEA, Treasury, NY Fed, CFTC, Yahoo
// Finance, SPDR, JBlanked) publishes central-bank gold reserve flows or
// WGC-style aggregate demand data. This module therefore has NO fetch
// logic at all — both KPIs are UNCONDITIONALLY UNAVAILABLE ("NO_SOURCE",
// never "FETCH_FAILED": no attempt is ever made, matching the same
// unconditional pattern already used for F7's f7-move/f7-move-1d and F10's
// f10-etf-holdings before their sources were found). This is intentionally
// permanent, not a placeholder awaiting a future fetch implementation —
// revisit only if the product owner identifies a genuine free source.
const UNAVAILABLE_KPI_IDS = ["f12-cb-net-buying", "f12-quarterly-demand"];

export async function buildF12Overrides(): Promise<FamilyOverrideResult> {
  const nowIso = new Date().toISOString();
  const kpiOverrides: Record<string, KpiOverride> = {};
  for (const id of UNAVAILABLE_KPI_IDS) kpiOverrides[id] = unavailableOverride(nowIso, "NO_SOURCE");
  return { kpiOverrides };
}
