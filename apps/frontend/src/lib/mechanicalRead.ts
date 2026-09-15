import type { CanonicalFamilySnapshot, CanonicalKpi, DisplayRelationship } from "@gold-terminal/contracts";

/**
 * Pure accessors — zero recalculation. The mechanical engine
 * (apps/backend/src/intelligence/mechanical/) computes every KPI's and
 * family's deterministic read server-side; the frontend only ever reads it
 * back. Replaces `lib/dynamicRelationship.ts`, which naively re-derived a
 * relationship client-side from a static per-KPI-id tag.
 */
export function kpiMechanicalRead(kpi: CanonicalKpi): DisplayRelationship {
  return kpi.mechanicalGoldRead;
}

export function familyMechanicalRead(family: CanonicalFamilySnapshot): DisplayRelationship {
  return family.mechanicalFamilyRead?.read ?? "CONTEXTUAL";
}
