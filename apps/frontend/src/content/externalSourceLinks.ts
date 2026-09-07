// Presentation-only map for the handful of KPIs that are permanently
// UNAVAILABLE ("NO_SOURCE" — no free API exists, by design, see the
// corresponding real/*.ts module's top-of-file comment for each). Per the
// product-owner rule: never invent a value for these, never show a plain
// dead "—" either — the card becomes a pointer to a real external source
// where a human can go read the actual number. Keyed by CanonicalKpi id;
// a KPI absent from this map keeps the plain quiet "—" treatment
// (DataStateTag.tsx) unchanged.
export interface ExternalSourceLink {
  url: string;
  /** Plain host name shown in the UI (e.g. "cmegroup.com") — never the full URL, which can be long/ugly for a compact card. */
  host: string;
  /**
   * A genuinely embeddable widget, when the source publishes one — TradingView's
   * widget scripts (s3.tradingview.com/external-embedding/*.js) are an
   * official, sanctioned embedding mechanism, structurally different from
   * framing the provider's own page (which every current source blocks via
   * X-Frame-Options/CSP, confirmed live). Only set this when a real,
   * documented embed mechanism exists for that specific provider — never
   * guessed. Absent for sources with no such mechanism (gold.org, CME,
   * Trading Economics as of 2026-09 — those stay "open externally" only).
   */
  embed?: { type: "tradingview-mini-symbol-overview"; symbol: string };
  /**
   * User-explicit request (2026-09): never open an external source in a new
   * tab — everything must stay inside the terminal's own small popup, even
   * for sources with no official embed widget. When set, the modal loads
   * `{BACKEND_URL}/api/external-proxy/{proxyKey}` in a sandboxed iframe: the
   * backend fetches this exact allowlisted URL server-side and re-serves its
   * HTML from our own origin, so the browser never sees the source site's
   * own X-Frame-Options/CSP block. Best-effort — a heavily JS-driven page's
   * live widgets may not fully render this way — but the iframe sandbox
   * (no allow-top-navigation, no allow-same-origin, no allow-forms — see
   * ExternalSourceModal.tsx's file header) guarantees both that the
   * terminal page itself can never be navigated away, and that the
   * uncontrolled third-party HTML being rendered can never reach our
   * backend's other routes as a same-origin caller or via a form POST.
   *
   * NEVER set this for CME (cmegroup.com/FedWatch): CME's Terms of Use
   * explicitly ban scripted/automated access, and a proxy fetch is exactly
   * that — see real/f3Fed.ts and apps/backend/src/proxy/externalSourceProxy.ts
   * for the standing rule. Those entries keep "open externally" only.
   */
  proxyKey?: string;
}

export const EXTERNAL_SOURCE_LINKS: Partial<Record<string, ExternalSourceLink>> = {
  // ICE BofA MOVE index — proprietary (developer.ice.com, paid access
  // only). User-chosen replacement (2026-09): TradingView's dedicated
  // symbol page shows level + change immediately at the top, no click
  // needed, and materially less ad/UI noise than the prior Investing.com
  // link.
  // User-explicit follow-up (2026-09): "veut l'ouvrir dans la page" — tried
  // TradingView's official mini-symbol-overview embed widget for TVC:MOVE;
  // live-confirmed (user screenshot, 2026-09) the widget itself refuses this
  // symbol ("This symbol is only available on TradingView"), even though
  // the normal tradingview.com page renders it fine — ICE's MOVE feed is
  // evidently excluded from TradingView's redistributable widget data
  // (unlike CBOE's VIX, which the same widget embeds without issue). No
  // `embed` mechanism is confirmed to work for this symbol.
  // User-explicit follow-up (2026-09): "peu importe la façon... je ne veux
  // pas ouvrir dans un nouvel onglet" — since no official widget works here,
  // falls back to the server-side proxy (see `proxyKey` doc above) instead.
  "f7-move": { url: "https://www.tradingview.com/symbols/TVC-MOVE/", host: "tradingview.com", proxyKey: "f7-move" },
  "f7-move-1d": { url: "https://www.tradingview.com/symbols/TVC-MOVE/", host: "tradingview.com", proxyKey: "f7-move" },
  // Central-bank gold reserves / aggregate quarterly demand — World Gold
  // Council, no public API (see real/f12PhysicalGold.ts). User-chosen
  // (2026-09): the Gold Demand Trends hub page always redirects to the
  // latest quarterly report, so it never goes stale/dead the way a link to
  // one specific quarter's report would once the next quarter publishes.
  // Both KPIs point here — same report covers both figures.
  "f12-cb-net-buying": { url: "https://www.gold.org/goldhub/research/gold-demand-trends", host: "gold.org", proxyKey: "f12-gold-demand-trends" },
  "f12-quarterly-demand": { url: "https://www.gold.org/goldhub/research/gold-demand-trends", host: "gold.org", proxyKey: "f12-gold-demand-trends" },
  // Implied Fed path / 2-week repricing — the homemade CME-ZQ calculation
  // that used to back these was removed for a confirmed bug (see
  // real/f3Fed.ts); CME's own free FedWatch tool is the real source, but
  // its Terms of Use prohibit scripted access, so it is never fetched —
  // only linked to for a human to read directly. User-confirmed (2026-09):
  // this is already the correct, official, free page — no better
  // alternative exists.
  "f3-path-6m": { url: "https://www.cmegroup.com/markets/interest-rates/cme-fedwatch-tool.html", host: "cmegroup.com" },
  "f3-repricing": { url: "https://www.cmegroup.com/markets/interest-rates/cme-fedwatch-tool.html", host: "cmegroup.com" },
  // ISM Services/Manufacturing PMI — no JBlanked (or other) adapter wired
  // yet (see real/f5Employment.ts). User-chosen (2026-09): ISM itself
  // paywalls its own report archive for non-members after a few months;
  // Trading Economics republishes the official same-day figure for free,
  // no paywall.
  "f5-ism-services": { url: "https://tradingeconomics.com/united-states/non-manufacturing-pmi", host: "tradingeconomics.com", proxyKey: "f5-ism-services" },
  "f5-ism-manufacturing": { url: "https://tradingeconomics.com/united-states/business-confidence", host: "tradingeconomics.com", proxyKey: "f5-ism-manufacturing" },
};

export function getExternalSourceLink(kpiId: string): ExternalSourceLink | undefined {
  return EXTERNAL_SOURCE_LINKS[kpiId];
}
