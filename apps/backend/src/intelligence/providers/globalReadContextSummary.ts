import type { CanonicalFamilySnapshot, CanonicalKpi, FamilyId, GlobalReadBlockId } from "@gold-terminal/contracts";

// Global Read — maps this codebase's 12 canonical families onto the product
// owner's fixed 6-block reading order (step 1). Every family appears in
// exactly one block below, chosen by the family's own economic role — this
// mapping is deliberately static (not inferred at request time) so it never
// silently drifts as families change internally.
const BLOCK_FAMILY_IDS: Record<GlobalReadBlockId, FamilyId[]> = {
  FED_RATE_PRICING: ["F3"],
  RATES_REAL_YIELDS: ["F2"],
  USD_LIQUIDITY: ["F6", "F8"],
  INFLATION_GROWTH_FISCAL_CREDIT: ["F4", "F5", "F9", "F7"],
  FLOWS_POSITIONING: ["F10"],
  STRUCTURAL: ["F12"],
};

const BLOCK_LABELS: Record<GlobalReadBlockId, string> = {
  FED_RATE_PRICING: "Fed & rate pricing",
  RATES_REAL_YIELDS: "Rates & real yields",
  USD_LIQUIDITY: "USD & liquidity",
  INFLATION_GROWTH_FISCAL_CREDIT: "Inflation / growth / fiscal / credit",
  FLOWS_POSITIONING: "Flows & positioning",
  STRUCTURAL: "Structural",
};

function formatKpiLine(kpi: CanonicalKpi): string {
  const valuePart = kpi.dataState === "UNAVAILABLE" ? "unavailable (no source)" : `${kpi.value ?? "null"}${kpi.unit ? ` ${kpi.unit}` : ""}`;
  const consensusPart = kpi.consensus != null ? `, consensus ${kpi.consensus}` : "";
  const previousPart = kpi.previous != null ? `, previous ${kpi.previous}` : "";
  const surprisePart = kpi.surprise ? `, surprise: ${kpi.surprise}` : "";
  const driverPart = kpi.driverSummary ? ` Driver: ${kpi.driverSummary}.` : "";
  return `- ${kpi.id} ("${kpi.label}"): ${valuePart}${consensusPart}${previousPart}${surprisePart}, mechanicalGoldRead=${kpi.mechanicalGoldRead} (as of ${kpi.observationAt}).${driverPart}`;
}

function kpisForFamilies(allFamilies: readonly CanonicalFamilySnapshot[], familyIds: readonly FamilyId[]): CanonicalKpi[] {
  return allFamilies.filter((f) => familyIds.includes(f.familyId)).flatMap((f) => f.kpis.filter((k) => k.visibility !== "deep"));
}

/** Step 1 context: the 6 blocks in the product owner's fixed order, each listing every relevant KPI's raw reading. */
export function buildGlobalReadBlockContext(allFamilies: readonly CanonicalFamilySnapshot[]): string {
  const lines: string[] = [];
  for (const blockId of Object.keys(BLOCK_FAMILY_IDS) as GlobalReadBlockId[]) {
    const kpis = kpisForFamilies(allFamilies, BLOCK_FAMILY_IDS[blockId]);
    lines.push(`### Block: ${blockId} (${BLOCK_LABELS[blockId]})`);
    if (kpis.length === 0) {
      lines.push("(no cockpit KPIs in this block)");
    } else {
      for (const kpi of kpis) lines.push(formatKpiLine(kpi));
    }
    lines.push("");
  }
  return lines.join("\n");
}

/** Step 3 raw data feed for the 3 dedicated components this codebase has internal data for (COT, ETF flows, options/vol) — geopolitical/fiscal-credit and structural-central-banks are pure web-research components with no internal KPI feed beyond what's already listed in the 6 blocks above. */
export function buildGlobalReadComponentContext(allFamilies: readonly CanonicalFamilySnapshot[]): string {
  const f10 = allFamilies.find((f) => f.familyId === "F10");
  const f11 = allFamilies.find((f) => f.familyId === "F11");
  const f12 = allFamilies.find((f) => f.familyId === "F12");

  const lines: string[] = [];
  lines.push("### COT_POSITIONING raw data (CFTC Managed Money, gold futures):");
  for (const kpi of f10?.kpis.filter((k) => k.id.startsWith("f10-mm-")) ?? []) lines.push(formatKpiLine(kpi));
  lines.push("");
  lines.push("### ETF_FLOWS raw data (SPDR GLD):");
  for (const kpi of f10?.kpis.filter((k) => k.id.startsWith("f10-etf-") || k.id.startsWith("f10-gld-")) ?? []) lines.push(formatKpiLine(kpi));
  lines.push("");
  lines.push("### OPTIONS_VOL raw data (GVZ, a Gold options-volatility proxy — not true CVOL):");
  for (const kpi of f11?.kpis ?? []) lines.push(formatKpiLine(kpi));
  lines.push("");
  lines.push("### STRUCTURAL_CENTRAL_BANKS raw data (central-bank gold reserves / aggregate demand):");
  if (f12 && f12.kpis.every((k) => k.dataState === "UNAVAILABLE")) {
    lines.push("No free public source exists for this data (World Gold Council has no public API) — this component is PURE web research this run, not backed by any internal reading.");
  } else {
    for (const kpi of f12?.kpis ?? []) lines.push(formatKpiLine(kpi));
  }
  lines.push("");
  lines.push("### GEOPOLITICAL_FISCAL_CREDIT raw data:");
  lines.push("No internal KPI feed for geopolitical developments — this component is PURE web research this run. Credit-spread levels (HY OAS, IG OAS) are already listed under the INFLATION_GROWTH_FISCAL_CREDIT block above; do not re-list them here, just factor them into this component's analysis alongside whatever geopolitical/fiscal news you find.");
  return lines.join("\n");
}

/** Upcoming scheduled catalysts across every family — feeds step 2's "reveal an unpriced upcoming catalyst" and step 12's "dated catalyst" asymmetry check. */
export function buildGlobalReadCatalystContext(allFamilies: readonly CanonicalFamilySnapshot[]): string {
  const lines: string[] = ["### Upcoming scheduled catalysts (across all families):"];
  let any = false;
  for (const family of allFamilies) {
    for (const event of family.nextEvents ?? []) {
      lines.push(`- ${event.title} (${family.familyId}) — scheduled ${event.scheduledAt}`);
      any = true;
    }
    if (family.activeCatalyst) {
      lines.push(`- ACTIVE catalyst (${family.familyId}): ${family.activeCatalyst.title} (${family.activeCatalyst.scheduledAt})`);
      any = true;
    }
  }
  if (!any) lines.push("(none currently scheduled in the terminal — search the web for anything relevant not captured here)");
  return lines.join("\n");
}
