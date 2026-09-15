import type { CanonicalKpi, FamilyMechanicalRead } from "@gold-terminal/contracts";
import { evaluateKpiMechanicalRead } from "../evaluateKpiMechanicalRead";
import { combineChannelReads } from "../combineChannelReads";

function noChannelAvailable(): FamilyMechanicalRead {
  return { read: "CONTEXTUAL", contributingChannels: [], reasonCode: "NO_CHANNEL_AVAILABLE" };
}

/**
 * F2 — Rates. Real Yield (REAL_YIELDS, PRIMARY) is the most direct
 * mechanical driver of Gold's opportunity cost. When it resolves a read, it
 * is combined with 2Y nominal (NOMINAL_2Y, SECONDARY) — agreement confirms
 * the direction, a lone Real Yield read (2Y contextual) still wins, and
 * disagreement stays CONTEXTUAL. Only when Real Yield itself is unusable
 * (UNAVAILABLE/INSUFFICIENT_HISTORY/NO_CHANGE) does F2 fall back to 2Y +
 * 10Y nominal (NOMINAL_10Y) as a less precise confirmation pair, using the
 * identical agree/disagree/single-available logic. BE10/5Y5Y/2s10s never
 * participate (registered CONTEXTUAL, no channel).
 */
export function aggregateF2(kpis: readonly CanonicalKpi[]): FamilyMechanicalRead {
  const real = kpis.find((k) => k.id === "f2-10y-real");
  const twoY = kpis.find((k) => k.id === "f2-2y");
  const tenY = kpis.find((k) => k.id === "f2-10y");
  if (!real || !twoY || !tenY) return noChannelAvailable();

  const realEval = evaluateKpiMechanicalRead(real);
  const twoYEval = evaluateKpiMechanicalRead(twoY);

  if (realEval.read !== "CONTEXTUAL") {
    return combineChannelReads([
      { channelId: "REAL_YIELDS", read: realEval.read },
      { channelId: "NOMINAL_2Y", read: twoYEval.read },
    ]);
  }

  const tenYEval = evaluateKpiMechanicalRead(tenY);
  return combineChannelReads([
    { channelId: "NOMINAL_2Y", read: twoYEval.read },
    { channelId: "NOMINAL_10Y", read: tenYEval.read },
  ]);
}
