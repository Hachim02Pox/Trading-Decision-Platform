import type { CanonicalKpi, FamilyMechanicalRead } from "@gold-terminal/contracts";
import { evaluateKpiMechanicalRead } from "../evaluateKpiMechanicalRead";
import { combineChannelReads } from "../combineChannelReads";

/** F6 — USD. Level, Today %, and 5D % all measure the same USD channel and are combined into one read — never three independent votes. USD State stays CONTEXTUAL (a descriptive regime label, not a channel member). */
export function aggregateF6(kpis: readonly CanonicalKpi[]): FamilyMechanicalRead {
  const level = kpis.find((k) => k.id === "f6-dxy-recon-level");
  const today = kpis.find((k) => k.id === "f6-dxy-recon-today");
  const fiveDay = kpis.find((k) => k.id === "f6-dxy-recon-5d");
  if (!level || !today || !fiveDay) {
    return { read: "CONTEXTUAL", contributingChannels: [], reasonCode: "NO_CHANNEL_AVAILABLE" };
  }

  return combineChannelReads(
    [level, today, fiveDay].map((kpi) => ({ channelId: "USD" as const, read: evaluateKpiMechanicalRead(kpi).read }))
  );
}
