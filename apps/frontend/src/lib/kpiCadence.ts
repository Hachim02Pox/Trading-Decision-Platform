// Presentation-only mirror of apps/backend/src/cache/snapshotCache.ts's
// `REAL_KPI_CADENCE` map — used ONLY to decide which freshness wording a
// REAL KPI gets (see KpiFreshnessLabel.tsx): "daily"-cadence KPIs are
// intraday-refreshed reference values (yields, DXY, VIX, credit spreads,
// GVZ, SOFR/IORB, TGA, GLD holdings) and read naturally as "Updated X ago";
// "weekly"/"monthly" KPIs are discrete official releases (CPI, NFP, COT,
// Reserves, Treasury auctions, QRA) and read naturally as "Data as of
// [date]" — showing an elapsed-time counter for a monthly print would be
// misleading, not more honest. This file carries NO staleness-threshold
// logic (that stays backend-only, contract-authoritative) — it only labels
// which of the two display styles applies. If a KPI id is missing here, it
// falls back to "daily" styling, the more conservative (relative-time)
// choice.
export type KpiCadence = "daily" | "weekly" | "monthly";

export const KPI_CADENCE: Partial<Record<string, KpiCadence>> = {
  "f2-2y": "daily",
  "f2-10y": "daily",
  "f2-10y-real": "daily",
  "f2-be10": "daily",
  "f2-5y5y": "daily",
  "f2-2s10s": "daily",
  "f3-target-lower": "daily",
  "f3-target-upper": "daily",
  "f4-core-cpi-mom": "monthly",
  "f4-core-cpi-yoy": "monthly",
  "f4-headline-cpi-mom": "monthly",
  "f4-headline-cpi-yoy": "monthly",
  "f4-core-cpi-3m-ann": "monthly",
  "f4-core-pce-mom": "monthly",
  "f4-core-pce-yoy": "monthly",
  "f4-headline-pce-yoy": "monthly",
  "f4-ppi-final-demand": "monthly",
  "f5-unemployment": "monthly",
  "f5-payrolls-latest": "monthly",
  "f5-payrolls-3m": "monthly",
  "f5-payrolls-revision-2m": "monthly",
  "f5-ahe-mom": "monthly",
  "f5-gdpnow": "daily",
  "f5-claims-4w": "weekly",
  "f5-claims-initial": "weekly",
  "f5-claims-continuing": "weekly",
  "f6-dxy-recon-level": "daily",
  "f6-dxy-recon-today": "daily",
  "f6-dxy-recon-5d": "daily",
  "f6-usd-state": "daily",
  "f7-vix": "daily",
  "f7-vix-1d": "daily",
  "f7-hy-oas": "daily",
  "f7-hy-oas-1d": "daily",
  "f7-ig-oas": "daily",
  "f8-reserves-level": "weekly",
  "f8-reserves-wow": "weekly",
  "f8-sofr-iorb": "daily",
  "f8-effr-iorb": "daily",
  "f8-funding-microstate": "daily",
  "f8-tga-level": "daily",
  "f8-tga-daily": "daily",
  "f9-auction-high-yield": "monthly",
  "f9-auction-btc": "monthly",
  "f9-auction-indirect": "monthly",
  "f9-qra-borrowing": "monthly",
  "f9-qra-revision": "monthly",
  "f10-mm-net-pct": "weekly",
  "f10-mm-wow-pp": "weekly",
  "f10-mm-percentile": "weekly",
  "f10-etf-holdings": "daily",
  "f10-etf-delta": "daily",
  "f10-etf-delta-5d": "daily",
  "f10-etf-delta-20d": "daily",
  "f10-etf-flow-z60": "daily",
  "f10-etf-flow-percentile": "daily",
  "f10-gld-return-5d": "daily",
  "f10-gld-return-20d": "daily",
  "f11-gvz": "daily",
  "f11-gvz-1d": "daily",
  "f11-gvz-5d": "daily",
};
