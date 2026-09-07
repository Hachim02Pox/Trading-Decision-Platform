import type { FamilyId } from "@gold-terminal/contracts";

export const FAMILY_KNOWLEDGE_SLUG: Readonly<Record<FamilyId, string>> = {
  // F12 restored to the product (data-layer audit pass — see docs/
  // MVP_COCKPIT_CONTRACT.md's updated top-of-file note) as an honest
  // UNAVAILABLE family; no dedicated F12 knowledge chapter exists yet, so
  // this slug entry only exists to keep this map exhaustive over
  // `FamilyId`.
  F12: "physical-gold",
  F2: "rates",
  F3: "fed-rate-pricing",
  F4: "inflation",
  F5: "employment-growth",
  F6: "usd-fx",
  F7: "risk-credit-vol",
  F8: "liquidity-funding",
  F9: "treasury-fiscal",
  F10: "flows-positioning",
  F11: "gold-options-vol",
  F13: "events-catalysts",
};

const KPI_SECTION: Readonly<Record<string, string>> = {
  "f2-2y": "f2-maturities-curve",
  "f2-10y": "f2-maturities-curve",
  "f2-10y-real": "f2-nominal-real-breakeven",
  "f2-be10": "f2-nominal-real-breakeven",
  "f2-5y5y": "f2-nominal-real-breakeven",
  "f2-2s10s": "f2-maturities-curve",
  "f3-target-lower": "f3-fundamentals",
  "f3-target-upper": "f3-fundamentals",
  "f3-path-6m": "f3-pricing-mechanics",
  "f3-repricing": "f3-pricing-mechanics",
  "f4-headline-cpi-mom": "cpi",
  "f4-headline-cpi-yoy": "cpi",
  "f4-core-cpi-mom": "core-cpi",
  "f4-core-cpi-yoy": "core-cpi",
  "f4-core-cpi-3m-ann": "trend-inflation",
  "f4-core-pce-mom": "pce",
  "f4-core-pce-yoy": "pce",
  "f4-headline-pce-yoy": "pce",
  "f4-ppi-final-demand": "ppi",
  "f5-unemployment": "unemployment",
  "f5-payrolls-latest": "payrolls",
  "f5-payrolls-3m": "payrolls",
  "f5-payrolls-revision-2m": "payrolls",
  "f5-claims-4w": "claims",
  // New this pass (F5 real-data rework) — same "claims" section as the 4-week
  // average above; these are the raw weekly series it's computed from.
  "f5-claims-initial": "claims",
  "f5-claims-continuing": "claims",
  "f5-ahe-mom": "wages",
  "f5-ism-manufacturing": "ism",
  "f5-ism-services": "ism",
  "f5-gdpnow": "gdp",
  "f6-dxy-recon-level": "dxy",
  "f6-dxy-recon-today": "usd-momentum",
  "f6-dxy-recon-5d": "usd-momentum",
  "f6-usd-state": "usd-gold-regimes",
  "f7-vix": "vix",
  "f7-vix-1d": "vix",
  "f7-move": "move",
  "f7-move-1d": "move",
  "f7-hy-oas": "credit-spreads",
  "f7-hy-oas-1d": "credit-spreads",
  "f7-ig-oas": "credit-spreads",
  "f8-reserves-level": "reserves",
  "f8-reserves-wow": "reserves",
  "f8-tga-level": "tga",
  "f8-tga-daily": "tga",
  "f8-funding-microstate": "funding",
  "f8-sofr-iorb": "funding",
  "f8-effr-iorb": "funding",
  "f9-qra-borrowing": "issuance",
  "f9-qra-revision": "issuance",
  "f9-auction-btc": "treasury-auctions",
  "f9-auction-high-yield": "treasury-auctions",
  "f9-auction-indirect": "treasury-auctions",
  "f10-mm-net-pct": "positioning",
  "f10-mm-percentile": "positioning",
  "f10-mm-wow-pp": "positioning",
  "f10-etf-holdings": "etf-flows",
  "f10-etf-delta": "etf-flows",
  "f10-etf-delta-5d": "etf-flows",
  "f10-etf-delta-20d": "etf-flows",
  "f10-etf-flow-z60": "etf-flows",
  "f10-etf-flow-percentile": "etf-flows",
  "f10-gld-return-5d": "etf-flows",
  "f10-gld-return-20d": "etf-flows",
  "f11-gvz": "gvz",
  "f11-gvz-1d": "implied-volatility",
  "f11-gvz-5d": "implied-volatility",
};

export function getFamilyKnowledgeHref(familyId: FamilyId): string {
  return `/knowledge/${FAMILY_KNOWLEDGE_SLUG[familyId]}`;
}

export function getKpiKnowledgeHref(kpiId: string, familyId: FamilyId): string {
  const base = getFamilyKnowledgeHref(familyId);
  const section = KPI_SECTION[kpiId];
  return section ? `${base}#${section}` : base;
}

export function hasPreciseKpiKnowledgeMapping(kpiId: string): boolean {
  return Object.hasOwn(KPI_SECTION, kpiId);
}
