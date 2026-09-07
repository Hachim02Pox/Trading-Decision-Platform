import type { CanonicalKpi } from "@gold-terminal/contracts";

/**
 * The single KPI that "represents" a family for a directional read — its
 * `emphasis` KPI if present on the resting cockpit face, otherwise the first
 * cockpit KPI in canonical order. A deep/drawer-only KPI is never allowed to
 * tint the resting card: it would make the family appear adverse/supportive
 * without showing the metric responsible for that state.
 * Used to drive (1) the optional whole-card directional tint
 * (FamilyModule.tsx) and (2) the drawer's one-sentence interpretive
 * summary (FamilyDetailDrawer.tsx). Deliberately never an aggregate,
 * vote, or count across multiple KPIs — see docs/MVP_COCKPIT_CONTRACT.md.
 */
export function getDesignatedKpi(kpis: CanonicalKpi[]): CanonicalKpi | undefined {
  const visibleKpis = kpis.filter((k) => k.visibility === "cockpit");
  const candidates = visibleKpis.length > 0 ? visibleKpis : kpis;
  return candidates.find((k) => k.emphasis) ?? candidates[0];
}
