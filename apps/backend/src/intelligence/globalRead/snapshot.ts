import { createHash } from "node:crypto";
import type { CanonicalFamilySnapshot } from "@gold-terminal/contracts";
import type { GlobalReadFact, GlobalReadPriorManifest } from "@gold-terminal/contracts/dist/globalRead";

type Definition = { metric: string; unit: string; transform: string; seasonality: string; instrument: string; role: GlobalReadFact["role"]; group: string };
const macro = (metric: string, transform: string, group: string, unit = "%", seasonality = "SA"): Definition =>
  ({ metric, unit, transform, seasonality, instrument: "US", role: "BACKGROUND", group });
export const DEFINITIONS: Readonly<Record<string, Definition>> = {
  "f4-core-pce-mom": macro("CORE_PCE_MOM", "MOM", "PCE"),
  "f4-core-pce-yoy": macro("CORE_PCE_YOY", "YOY", "PCE"),
  "f4-headline-pce-yoy": macro("HEADLINE_PCE_YOY", "YOY", "PCE"),
  "f4-core-cpi-mom": macro("CORE_CPI_MOM", "MOM", "CPI"),
  "f4-core-cpi-yoy": macro("CORE_CPI_YOY", "YOY", "CPI", "%", "NSA"),
  "f4-headline-cpi-mom": macro("HEADLINE_CPI_MOM", "MOM", "CPI"),
  "f4-headline-cpi-yoy": macro("HEADLINE_CPI_YOY", "YOY", "CPI", "%", "NSA"),
  "f5-payrolls-latest": macro("PAYROLLS_CHANGE", "MONTHLY_NET_CHANGE", "EMPLOYMENT", "k"),
  "f5-unemployment": macro("UNEMPLOYMENT", "LEVEL", "EMPLOYMENT"),
  "f5-ahe-mom": macro("AHE_MOM", "MOM", "EMPLOYMENT"),
  "f2-2y": { ...macro("US2Y", "PAR_YIELD", "TREASURY", "%", "NA"), role: "TRANSMISSION" },
  "f2-10y": { ...macro("US10Y", "PAR_YIELD", "TREASURY", "%", "NA"), role: "TRANSMISSION" },
  "f2-10y-real": { ...macro("US10Y_REAL", "REAL_PAR_YIELD", "TREASURY", "%", "NA"), role: "TRANSMISSION" },
  "f10-mm-net-pct": { ...macro("COT_MM_NET", "NET_LONG_MINUS_SHORT_OVER_TOTAL_OI", "COT", "%", "NA"), instrument: "COMEX:088691:FUTURES_ONLY:MANAGED_MONEY", role: "POSITIONING" },
  "f10-etf-holdings": { ...macro("GLD_HOLDINGS", "PHYSICAL_STOCK", "GLD", "t", "NA"), instrument: "NYSE:GLD", role: "POSITIONING" },
};

export function hashObject(value: unknown): string { return createHash("sha256").update(JSON.stringify(value)).digest("hex"); }

export function canonicalFacts(families: readonly CanonicalFamilySnapshot[]): GlobalReadFact[] {
  const kpiFacts = families.flatMap((family) => family.kpis.map((kpi): GlobalReadFact => {
    const d = DEFINITIONS[kpi.id];
    const monthly = d && ["PCE", "CPI", "EMPLOYMENT"].includes(d.group);
    const cadence: GlobalReadFact["expectedCadence"] = !d ? "UNKNOWN" : d.group === "COT" ? "WEEKLY" : d.group === "GLD" || d.group === "TREASURY" ? "DAILY" : "MONTHLY";
    return { ref: kpi.id, metric: d?.metric ?? "UNSUPPORTED", definition: d?.metric ?? kpi.id,
      value: kpi.dataState === "REAL" && Number.isFinite(kpi.value) ? kpi.value : null,
      unit: kpi.unit ?? "UNDEFINED", period: kpi.observationAt.slice(0, monthly ? 7 : 10),
      instrument: d?.instrument ?? "UNDEFINED", transform: d?.transform ?? "UNDEFINED", seasonality: d?.seasonality ?? "UNDEFINED",
      vintage: "canonical-no-publication-vintage", observationAt: kpi.observationAt, knownAt: kpi.retrievedAt, retrievedAt: kpi.retrievedAt, expectedCadence: cadence,
      effectiveFreshnessStatus: kpi.dataState === "UNAVAILABLE" ? "UNAVAILABLE" : kpi.quality === "current" ? "CURRENT" : kpi.quality === "stale" ? "STALE" : "UNKNOWN",
      latestCheckedAt: null, sourceUrl: null, sourceType: "UNKNOWN", verification: "NONE", role: d?.role ?? "PRICE",
      dependencyRefs: [], releaseGroup: d ? `${d.group}:${kpi.observationAt.slice(0, monthly ? 7 : 10)}` : null };
  }));
  const fedPricingFacts = families.flatMap((family): GlobalReadFact[] => {
    const distribution = family.familyId === "F3" ? family.fedRateDistribution : null;
    if (!distribution || distribution.dataState !== "REAL" || !distribution.nextMeetingAt || !distribution.buckets.length) return [];
    const leading = [...distribution.buckets].sort((a, b) => b.probability - a.probability)[0]!;
    const common = { unit: "%", period: distribution.nextMeetingAt, instrument: `INVESTING_FED_RATE_MONITOR:${leading.targetRangeLabel}`,
      seasonality: "NA", vintage: `provider-display:${distribution.observationAt}`, observationAt: distribution.observationAt,
      knownAt: distribution.retrievedAt, retrievedAt: distribution.retrievedAt, latestCheckedAt: distribution.retrievedAt,
      expectedCadence: "INTRADAY" as const, effectiveFreshnessStatus: "CURRENT" as const,
      sourceUrl: "https://www.investing.com/central-banks/fed-rate-monitor", sourceType: "SECONDARY" as const,
      verification: "STRUCTURED" as const, dependencyRefs: [] as string[], releaseGroup: `FOMC:${distribution.nextMeetingAt}` };
    const expectation: GlobalReadFact = { ...common, ref: "f3-market-implied-leading-bucket", metric: "FED_IMPLIED_LEADING_BUCKET_PROBABILITY",
      definition: `Displayed probability for current leading target-range bucket ${leading.targetRangeLabel}; third-party CME-futures-derived display, not an official Fed probability`,
      value: leading.probability, transform: "DISPLAYED_CURRENT_PROBABILITY", role: "EXPECTATION" };
    const previous = leading.probabilityPreviousDay;
    const repricing: GlobalReadFact = { ...common, ref: "f3-market-implied-leading-bucket-change-1d", metric: "FED_IMPLIED_CURRENT_BUCKET_PROBABILITY_CHANGE_1D",
      definition: `Change in displayed probability for the same current target-range bucket ${leading.targetRangeLabel}; not a full policy-path measure`,
      value: typeof previous === "number" && Number.isFinite(previous) ? Number((leading.probability - previous).toFixed(2)) : null,
      transform: "CURRENT_BUCKET_PROBABILITY_CHANGE_1D", role: "REPRICING", dependencyRefs: [expectation.ref] };
    return [expectation, repricing];
  });
  return [...kpiFacts, ...fedPricingFacts];
}

export function freezePriorView(facts: readonly GlobalReadFact[], informationSetAt: string, retrospective: boolean) {
  const included = facts.filter((f) => DEFINITIONS[f.ref] && f.role === "BACKGROUND" && f.value !== null &&
    Number.isFinite(Date.parse(f.knownAt)) && Date.parse(f.knownAt) <= Date.parse(informationSetAt) &&
    f.dependencyRefs.length === 0);
  const includedRefs = included.map((f) => f.ref);
  const manifest: GlobalReadPriorManifest = {
    informationSetAt, mode: retrospective ? "RETROSPECTIVE" : "PROSPECTIVE",
    priorPurity: retrospective ? "PARTIALLY_CONTAMINATED" : "CLEAN",
    baselineQuality: included.length ? "COARSE" : "MISSING", includedRefs,
    excluded: facts.filter((f) => !includedRefs.includes(f.ref)).map((f) => ({ ref: f.ref,
      reason: f.role !== "BACKGROUND" ? "Reactive, price-dependent or unsupported metric excluded structurally" :
        f.value === null ? "No real source value" : "Availability after cutoff or dependency not provably pre-catalyst" })),
    hash: hashObject(included), caveats: ["No historical first-publication vintage is inferred from observation date.",
      "CLEAN describes payload leakage only, not completeness or causal certainty. Model pretraining cannot be made historically blind.",
      "Canonical actuals are candidates pending primary verification. Consensus, previous, surprise, relationship and driver prose are excluded."],
  };
  return { facts: included, manifest };
}
