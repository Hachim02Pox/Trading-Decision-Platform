import type { CanonicalKpi, FamilyMechanicalRead } from "@gold-terminal/contracts";
import { evaluateKpiMechanicalRead } from "../evaluateKpiMechanicalRead";
import { combineChannelReads } from "../combineChannelReads";

/**
 * F10 — Flows / Positioning. Two independent channels: FUTURES_POSITIONING
 * (MM net % + MM WoW Δ, combined into one read) and ETF_FLOWS (GLD holdings
 * + GLD holdings Δ, combined into one read). The two channels are then
 * combined the same way — agreement wins, a lone available channel wins,
 * disagreement stays CONTEXTUAL. MM percentile never participates
 * (registered CONTEXTUAL, no channel).
 */
export function aggregateF10(kpis: readonly CanonicalKpi[]): FamilyMechanicalRead {
  const mmNet = kpis.find((k) => k.id === "f10-mm-net-pct");
  const mmWow = kpis.find((k) => k.id === "f10-mm-wow-pp");
  const etfHoldings = kpis.find((k) => k.id === "f10-etf-holdings");
  const etfDelta = kpis.find((k) => k.id === "f10-etf-delta");
  if (!mmNet || !mmWow || !etfHoldings || !etfDelta) {
    return { read: "CONTEXTUAL", contributingChannels: [], reasonCode: "NO_CHANNEL_AVAILABLE" };
  }

  const futuresChannel = combineChannelReads(
    [mmNet, mmWow].map((kpi) => ({ channelId: "FUTURES_POSITIONING" as const, read: evaluateKpiMechanicalRead(kpi).read }))
  );
  const etfChannel = combineChannelReads(
    [etfHoldings, etfDelta].map((kpi) => ({ channelId: "ETF_FLOWS" as const, read: evaluateKpiMechanicalRead(kpi).read }))
  );

  return combineChannelReads([
    { channelId: "FUTURES_POSITIONING", read: futuresChannel.read },
    { channelId: "ETF_FLOWS", read: etfChannel.read },
  ]);
}
