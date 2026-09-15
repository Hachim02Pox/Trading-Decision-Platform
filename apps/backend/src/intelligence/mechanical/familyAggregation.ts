import type { CanonicalKpi, FamilyId, FamilyMechanicalRead, FedRateDistribution } from "@gold-terminal/contracts";
import { aggregateF2 } from "./families/f2";
import { aggregateF3 } from "./families/f3";
import { aggregateF6 } from "./families/f6";
import { aggregateF10 } from "./families/f10";

export { combineChannelReads, type ChannelReadInput } from "./combineChannelReads";

/** Every family without a documented mechanical aggregation (F4/F5/F7/F8/F9/F11/F12) — never a naive per-KPI vote. */
export const NOT_APPLICABLE_FAMILY_READ: FamilyMechanicalRead = {
  read: "CONTEXTUAL",
  contributingChannels: [],
  reasonCode: "NOT_APPLICABLE",
};

/** Dispatches to the documented per-family aggregation, or NOT_APPLICABLE for every family without one. F13 is handled by the caller (attachMechanicalReads.ts), which never invokes this for F13 at all. */
export function computeFamilyMechanicalRead(
  familyId: FamilyId,
  kpis: readonly CanonicalKpi[],
  fedRateDistribution: FedRateDistribution | null | undefined
): FamilyMechanicalRead {
  if (familyId === "F2") return aggregateF2(kpis);
  if (familyId === "F3") return aggregateF3(kpis, fedRateDistribution);
  if (familyId === "F6") return aggregateF6(kpis);
  if (familyId === "F10") return aggregateF10(kpis);
  return NOT_APPLICABLE_FAMILY_READ;
}
