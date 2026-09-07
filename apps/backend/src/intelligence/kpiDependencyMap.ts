import type { FamilyId } from "@gold-terminal/contracts";
import type { TopicTag } from "./research/topicPlans";

// Patch 13 — explicit, version-controlled KPI dependency map. This is the
// single most important artifact for reproducibility: KpiContextPackageBuilder
// reads this map to decide what context to assemble for a KPI's
// interpretation; it never decides dependencies ad hoc at runtime. Authored
// exhaustively for every cockpit-visible KPI id (the same set Patch 10
// computes by filtering KPI_FIXTURES for visibility === "cockpit").
//
// This reads as plumbing, not new product decisions: every cross-family
// link below is already documented in apps/frontend/src/content/familyEducation.ts
// and docs/MVP_COCKPIT_CONTRACT.md — no new financial relationships are
// invented here.

export interface KpiContextDependencies {
  siblingKpiIds: string[];
  crossFamilyKpiIds: string[];
  researchTopics: TopicTag[];
  relevantEventFamilies: FamilyId[];
}

// Full canonical id list per family (regardless of visibility) — mirrors
// apps/backend/src/mock/fixtures.ts exactly. Used only to build
// `siblingKpiIds` (every OTHER id in the same family), matching the locked
// worked example for f2-10y (siblings = the other four F2 ids).
const FAMILY_CANONICAL_IDS: Record<FamilyId, string[]> = {
  F2: ["f2-2y", "f2-10y", "f2-10y-real", "f2-be10", "f2-2s10s"],
  // f3-dist-hold/25bp/50bp removed — F3's real meeting-probability
  // distribution is now `FedRateDistribution` (a family-level structured
  // field, not fixed CanonicalKpi ids). See real/f3Fed.ts.
  F3: ["f3-target-lower", "f3-target-upper", "f3-path-6m", "f3-repricing"],
  F4: [
    "f4-core-cpi-mom",
    "f4-core-cpi-yoy",
    "f4-headline-cpi-mom",
    "f4-headline-cpi-yoy",
    "f4-core-pce-mom",
    "f4-core-pce-yoy",
    "f4-headline-pce-yoy",
    "f4-core-cpi-3m-ann",
    "f4-ppi-final-demand",
  ],
  F5: [
    "f5-unemployment",
    "f5-payrolls-latest",
    "f5-payrolls-3m",
    "f5-claims-4w",
    "f5-ahe-mom",
    "f5-payrolls-revision-2m",
    "f5-ism-services",
    "f5-ism-manufacturing",
    "f5-gdpnow",
  ],
  F6: ["f6-dxy-recon-level", "f6-dxy-recon-today", "f6-dxy-recon-5d", "f6-usd-state"],
  F7: ["f7-vix", "f7-vix-1d", "f7-move", "f7-move-1d", "f7-hy-oas", "f7-hy-oas-1d", "f7-ig-oas"],
  F8: [
    "f8-reserves-level",
    "f8-reserves-wow",
    "f8-tga-level",
    "f8-tga-daily",
    "f8-funding-microstate",
    "f8-sofr-iorb",
    "f8-effr-iorb",
  ],
  F9: [
    "f9-qra-borrowing",
    "f9-qra-revision",
    "f9-auction-high-yield",
    "f9-auction-btc",
    "f9-auction-indirect",
  ],
  F10: ["f10-mm-net-pct", "f10-mm-wow-pp", "f10-mm-percentile", "f10-etf-holdings", "f10-etf-delta"],
  F11: ["f11-gvz", "f11-gvz-1d", "f11-gvz-5d"],
  // F12 (Physical/Structural Gold) restored to the product (data-layer audit
  // pass, out of scope for the AI/intelligence layer) as an honest
  // UNAVAILABLE family. Given the exact same empty-array treatment as F13,
  // for the exact same reason: the intelligence layer is explicitly
  // deprioritized/out of scope right now, so this entry exists purely to
  // keep this map exhaustive now that `FamilyId` includes "F12" — not a
  // decision to add AI coverage for F12.
  F12: ["f12-cb-net-buying", "f12-quarterly-demand"],
  F13: [],
};

function siblingsOf(familyId: FamilyId, id: string): string[] {
  return FAMILY_CANONICAL_IDS[familyId].filter((sibling) => sibling !== id);
}

// Cross-family + research-topic + event-family assignment per family,
// grounded in the mechanisms already documented in familyEducation.ts:
// - F2 (real yields) <-> F3 (Fed repricing) is the opportunity-cost channel.
// - F4 (inflation) feeds F2 real yields and F3 Fed reaction (two-channel).
// - F5 (labor/growth) feeds F3 cut odds and, through that, F2 real yields.
// - F6 (USD) is driven by rate differentials (F2) and Fed pricing (F3).
// - F7 (risk/vol) interacts with flight-to-quality in F2 and the dollar (F6).
// - F8 (liquidity) is financial-conditions context alongside F7.
// - F10 (flows/positioning) is about how crowded a move in Gold already is,
//   conditioned by broad risk appetite (F7).
// - F11 (gold vol) prices event risk flagged by the F13 catalyst calendar.
const FAMILY_DEFAULTS: Record<
  FamilyId,
  { crossFamilyKpiIds: string[]; researchTopics: TopicTag[]; relevantEventFamilies: FamilyId[] }
> = {
  F2: {
    crossFamilyKpiIds: ["f3-repricing"],
    researchTopics: ["TREASURY_SUPPLY", "FED_COMMUNICATION"],
    relevantEventFamilies: ["F3", "F9"],
  },
  F3: {
    crossFamilyKpiIds: ["f2-10y-real", "f5-payrolls-latest"],
    researchTopics: ["FED_COMMUNICATION", "LABOR_RELEASE"],
    relevantEventFamilies: ["F3", "F5"],
  },
  F4: {
    crossFamilyKpiIds: ["f2-10y-real", "f3-repricing"],
    researchTopics: ["CPI_RELEASE", "PCE_RELEASE"],
    relevantEventFamilies: ["F4"],
  },
  F5: {
    crossFamilyKpiIds: ["f3-repricing", "f2-10y-real"],
    researchTopics: ["LABOR_RELEASE"],
    relevantEventFamilies: ["F5"],
  },
  F6: {
    crossFamilyKpiIds: ["f2-2y", "f3-repricing"],
    researchTopics: ["USD_DRIVERS"],
    relevantEventFamilies: ["F3", "F4", "F5"],
  },
  F7: {
    crossFamilyKpiIds: ["f2-10y-real", "f6-dxy-recon-level"],
    researchTopics: ["RISK_SENTIMENT"],
    relevantEventFamilies: ["F13"],
  },
  F8: {
    crossFamilyKpiIds: ["f7-vix", "f7-hy-oas"],
    researchTopics: ["LIQUIDITY_FUNDING"],
    relevantEventFamilies: ["F9", "F13"],
  },
  F9: {
    crossFamilyKpiIds: ["f2-10y"],
    researchTopics: ["TREASURY_SUPPLY"],
    relevantEventFamilies: ["F9"],
  },
  F10: {
    crossFamilyKpiIds: ["f7-vix"],
    researchTopics: ["FLOWS_POSITIONING"],
    relevantEventFamilies: ["F13"],
  },
  F11: {
    crossFamilyKpiIds: [],
    researchTopics: ["GOLD_VOL"],
    relevantEventFamilies: ["F13"],
  },
  // F12 restored to the product as an honest UNAVAILABLE family (data-layer
  // audit pass) — given the same empty-array/"no intelligence coverage"
  // treatment as F13 above, for the same reason: the AI/intelligence
  // layer is explicitly out of scope right now, and both F12 KPIs have no
  // real value to interpret regardless (permanently UNAVAILABLE). This
  // entry exists purely to keep this map exhaustive over `FamilyId`.
  F12: {
    crossFamilyKpiIds: [],
    researchTopics: [],
    relevantEventFamilies: [],
  },
  F13: {
    crossFamilyKpiIds: [],
    researchTopics: [],
    relevantEventFamilies: [],
  },
};

// The exhaustive cockpit-visible KPI id set (mirrors Patch 10's programmatic
// filter of KPI_FIXTURES for visibility === "cockpit" — duplicated here as a
// literal list ONLY because this map's keys must be individually authored;
// server boot code still computes the canonical list itself from
// KPI_FIXTURES and is the source of truth for what actually runs).
const COCKPIT_VISIBLE_KPI_IDS_BY_FAMILY: Record<FamilyId, string[]> = {
  F2: ["f2-2y", "f2-10y", "f2-2s10s"],
  F3: ["f3-target-lower", "f3-target-upper"],
  F4: ["f4-core-cpi-mom", "f4-core-cpi-yoy", "f4-core-pce-mom", "f4-core-pce-yoy"],
  F5: ["f5-unemployment", "f5-payrolls-latest", "f5-gdpnow"],
  // f6-usd-state moved to visibility: "deep" in Milestone 1D (see
  // apps/backend/src/mock/fixtures.ts) — no longer part of the eager
  // cockpit batch; it still gets a KPI_CONTEXT_DEPENDENCIES entry via the
  // lazy deep-KPI generation path (kpiDependencyMap lookups tolerate a
  // missing entry via `deps?.` fallbacks in contextPackageBuilder.ts).
  F6: ["f6-dxy-recon-level", "f6-dxy-recon-today", "f6-dxy-recon-5d"],
  F7: ["f7-vix", "f7-move", "f7-hy-oas"],
  F8: ["f8-reserves-wow", "f8-tga-daily", "f8-funding-microstate"],
  F9: [],
  F10: ["f10-mm-net-pct", "f10-etf-delta"],
  F11: ["f11-gvz", "f11-gvz-1d", "f11-gvz-5d"],
  // Empty on purpose: F12 gets no intelligence coverage (AI layer out of
  // scope; both its KPIs are permanently UNAVAILABLE regardless).
  F12: [],
  F13: [],
};

function buildDependencyMap(): Record<string, KpiContextDependencies> {
  const map: Record<string, KpiContextDependencies> = {};

  for (const familyId of Object.keys(COCKPIT_VISIBLE_KPI_IDS_BY_FAMILY) as FamilyId[]) {
    const defaults = FAMILY_DEFAULTS[familyId];
    for (const id of COCKPIT_VISIBLE_KPI_IDS_BY_FAMILY[familyId]) {
      map[id] = {
        siblingKpiIds: siblingsOf(familyId, id),
        crossFamilyKpiIds: [...defaults.crossFamilyKpiIds],
        researchTopics: [...defaults.researchTopics],
        relevantEventFamilies: [...defaults.relevantEventFamilies],
      };
    }
  }

  return map;
}

export const KPI_CONTEXT_DEPENDENCIES: Record<string, KpiContextDependencies> = buildDependencyMap();
