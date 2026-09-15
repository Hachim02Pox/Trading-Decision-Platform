import type { CanonicalKpi, ClaimRecord, FamilyId } from "@gold-terminal/contracts";

// User-explicit request: the family-level on-demand analysis must read all
// of a family's KPIs TOGETHER and explain how they interact — never render
// as N independent single-KPI reads concatenated. This file's one job is
// building that context text; the actual multi-provider call reuses
// realInterpretationGenerator.ts's runRealEnsemble unchanged (same
// analyst/challenger/adjudicator/validate pipeline as a single-KPI call).

function formatClaim(claim: ClaimRecord): string {
  const published = claim.source.publishedAt ?? "undated";
  return `- [${claim.verificationState}, ${claim.epistemicStatus}] "${claim.claim}" — source: ${claim.source.name} (${claim.source.authorityClass}, ${published})`;
}

function formatKpiLine(kpi: CanonicalKpi): string {
  const valuePart = kpi.dataState === "UNAVAILABLE" ? "unavailable" : `${kpi.value ?? "null"}${kpi.unit ? ` ${kpi.unit}` : ""}`;
  const driverPart = kpi.driverSummary ? ` Driver: ${kpi.driverSummary}.` : "";
  return `- ${kpi.id} ("${kpi.label}"): ${valuePart}, mechanicalGoldRead=${kpi.mechanicalGoldRead} (as of ${kpi.observationAt}).${driverPart}`;
}

/**
 * Textual rendering of a family's full KPI set for the model to reason
 * over — the family-level counterpart of promptContext.ts's
 * `buildContextSummary`. Every KPI is listed with equal weight; the model
 * is explicitly instructed to reason about the SET, not to answer as if
 * only one metric existed.
 */
export function buildFamilyContextSummary(
  familyId: FamilyId,
  familyLabel: string,
  kpis: readonly CanonicalKpi[],
  claims: readonly ClaimRecord[]
): string {
  const lines: string[] = [];

  lines.push(`Family: ${familyId} ("${familyLabel}"), ${kpis.length} related KPIs.`);
  lines.push(
    "This is a FAMILY-LEVEL analysis: your job is to explain how these KPIs relate to, reinforce, or contradict " +
      "each other for Gold, then give ONE overall reading for the family as a whole. Do not treat this as N " +
      "separate single-metric reads glued together — the linkage between the metrics IS the analysis."
  );
  lines.push(
    "NEVER count metrics (\"3 KPIs bullish, 2 bearish, therefore bullish\"). Reason instead about importance, " +
      "causality, recency, and marginality: one metric can dominate all the others combined (e.g. a live Fed " +
      "repricing event outweighs a stale structural KPI). Identify which KPI(s) are actually driving the current " +
      "reading and which are redundant restatements of the same underlying information (never double-count two " +
      "KPIs that are really telling the same story). Name any genuine contradiction explicitly rather than " +
      "averaging it away."
  );

  lines.push("");
  lines.push("KPIs in this family:");
  for (const kpi of kpis) lines.push(formatKpiLine(kpi));

  if (claims.length > 0) {
    lines.push("");
    lines.push("Research evidence (deduplicated, corroboration-checked claims, spanning this family's KPIs):");
    for (const claim of claims) lines.push(formatClaim(claim));
  } else {
    lines.push("");
    lines.push("No research evidence is attached for this family this session.");
  }

  return lines.join("\n");
}
