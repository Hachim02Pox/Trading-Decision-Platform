import type { CanonicalFamilySnapshot, CanonicalKpi, MechanicalEvaluation } from "@gold-terminal/contracts";
import { evaluateKpiMechanicalRead } from "./evaluateKpiMechanicalRead";
import { computeFamilyMechanicalRead } from "./familyAggregation";

/** A family snapshot's KPIs before the mechanical engine has attached its two required fields — exactly what `snapshotCache.ts` has assembled by the time it calls this. */
export type FamilyBeforeMechanicalReads = Omit<CanonicalFamilySnapshot, "kpis" | "mechanicalFamilyRead"> & {
  kpis: Array<Omit<CanonicalKpi, "mechanicalGoldRead" | "mechanicalEvaluation">>;
};

/**
 * `f3-target-lower`/`f3-target-upper` share ONE POLICY_RATES decision (a
 * single FOMC target-range move) — computing lower's evaluation once and
 * copying it onto upper (with `ruleId` corrected) avoids evaluating the
 * same underlying fetch twice and guarantees the two rows can never
 * silently disagree. Mirrors the existing convention in F3FedFace.tsx,
 * which already only ever reads `lower`.
 */
function computeKpiEvaluations(family: FamilyBeforeMechanicalReads): Map<string, MechanicalEvaluation> {
  const evaluations = new Map<string, MechanicalEvaluation>();
  const lower = family.kpis.find((kpi) => kpi.id === "f3-target-lower");
  const lowerEvaluation = lower ? evaluateKpiMechanicalRead(lower as CanonicalKpi) : null;

  for (const kpi of family.kpis) {
    if (kpi.id === "f3-target-lower" && lowerEvaluation) {
      evaluations.set(kpi.id, lowerEvaluation);
      continue;
    }
    if (kpi.id === "f3-target-upper" && lowerEvaluation) {
      evaluations.set(kpi.id, { ...lowerEvaluation, ruleId: "f3-target-upper" });
      continue;
    }
    evaluations.set(kpi.id, evaluateKpiMechanicalRead(kpi as CanonicalKpi));
  }
  return evaluations;
}

/**
 * Pure, immutable: attaches `mechanicalGoldRead`/`mechanicalEvaluation` to
 * every KPI and `mechanicalFamilyRead` to every family (absent only for
 * F13, which has no scalar `CanonicalKpi`s). Called once, at the end of
 * `snapshotCache.ts#getMarketSnapshot`, after real-data overrides and
 * `previousFetch` are already resolved — this is the ONLY place that
 * decides a cockpit cell's color; nothing downstream (mock/real AI
 * generators, the frontend) ever recomputes it.
 */
export function attachMechanicalReads(families: readonly FamilyBeforeMechanicalReads[]): CanonicalFamilySnapshot[] {
  return families.map((family) => {
    const evaluations = computeKpiEvaluations(family);
    const kpis: CanonicalKpi[] = family.kpis.map((kpi) => {
      const evaluation = evaluations.get(kpi.id)!;
      return { ...kpi, mechanicalEvaluation: evaluation, mechanicalGoldRead: evaluation.read } as CanonicalKpi;
    });

    const mechanicalFamilyRead =
      family.familyId === "F13" ? undefined : computeFamilyMechanicalRead(family.familyId, kpis, family.fedRateDistribution);

    return { ...family, kpis, mechanicalFamilyRead };
  });
}
