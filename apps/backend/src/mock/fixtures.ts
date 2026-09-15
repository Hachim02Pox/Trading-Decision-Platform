import type { CanonicalKpi, Language } from "@gold-terminal/contracts";
import { DEV_MOCK_SOURCE } from "@gold-terminal/contracts";

// Milestone 2B: `dataState` is deliberately excluded here too — every fixture
// in this file gets `dataState: "MOCK"` uniformly when the boot snapshot is
// assembled (apps/backend/src/cache/snapshotCache.ts), so none of the ~65
// fixture literals below need editing. For the 6 families that became
// (partially) real this milestone, snapshotCache.ts overrides specific KPI
// ids' `dataState` to "REAL" or "UNAVAILABLE" post-hoc — see
// apps/backend/src/real/*.
export type KpiFixture = Omit<CanonicalKpi, "quality" | "observationAt" | "retrievedAt" | "dataState" | "mechanicalGoldRead" | "mechanicalEvaluation">;

// Milestone 1E — `driverSummary` is static/deterministic educational text
// (not an AI-generated dynamic interpretation), so per the locked
// static/dynamic boundary it is legitimate to localize it here, the same
// way KPI_FIXTURES itself is authored. Genuinely authored French, not a
// mechanically translated pass. `f8-funding-microstate`'s driverSummary is
// EXCLUDED on purpose — it is a sentinel string ("NORMAL") the backend/
// frontend compare against literally (see FamilyModule.tsx), not
// human-facing prose, so it is never localized.
const DRIVER_SUMMARY_FR: Partial<Record<string, string>> = {
  "f2-10y-real":
    "Des taux réels plus élevés augmentent le coût d'opportunité de détenir un actif ne versant pas de rendement.",
  "f2-be10":
    "Point mort d'inflation à 10 ans — à décomposer des mouvements nominaux avant de qualifier une variation de taux de haussière ou baissière pour l'Or.",
  "f2-2s10s": "Pente de la courbe — un signal de régime, pas un moteur direct pour l'Or.",
  "f3-path-6m": "Sentier de taux implicite compact sur les six prochaines réunions.",
  "f3-repricing": "Le sentier implicite par le marché intègre désormais davantage de baisses qu'il y a deux semaines.",
  "f4-headline-pce-yoy": "L'objectif d'inflation de 2 % de la Fed est défini sur cette mesure.",
  "f4-core-cpi-3m-ann": "Lecture de tendance : dynamique des derniers mois, lissée des effets de base ponctuels.",
  "f4-ppi-final-demand":
    "Alimente le nowcast du PCE ; surveillez les composantes pertinentes pour le PCE, pas le chiffre global.",
  "f2-5y5y":
    "Mesure d'inflation à moyen terme privilégiée par la Fed — un intrant de tarification de marché, pas un moteur mécanique direct.",
  "f6-dxy-recon-level":
    "Lecture directe de l'indice dollar ICE (point de terminaison graphique public de Yahoo Finance — non officiel, sans clé requise).",
  // "f6-usd-state" intentionally removed from this point on: once F6 is
  // real (apps/backend/src/real/f6Currency.ts), this field's driverSummary
  // becomes a computed EN sentence describing the actual live Today%/5D%
  // sign relationship (see localizeDriverSummary's sentinel exclusion list
  // below) — a static French translation here would silently describe a
  // stale/wrong state once the real Today%/5D% values diverge from the
  // mock's fixed -0.18/+0.42. Known, deliberate limitation: French users
  // see this one deep-only field in English once real. Not fixed this pass
  // (would require frontend sentinel->i18n mapping infra, same shape as
  // f8-funding-microstate's NORMAL/ANOMALOUS handling in FamilyModule.tsx,
  // out of scope for a backend real-data milestone).
  "f11-gvz": "Proxy d'options GLD — le CVOL n'est pas disponible dans le MVP gratuit.",
  // No f12-* entries: both F12 fixtures have `driverSummary: null` (see
  // fixtures.ts's F12 comment) — `localizeDriverSummary` returns `null`
  // before ever consulting this map for either id.
};

/**
 * Resolve a KPI fixture's `driverSummary` in the requested language.
 * `f8-funding-microstate` is a code sentinel and is always returned
 * unlocalized. Falls back to the English string if no French translation
 * is on file (should not happen for any fixture listed in
 * `DRIVER_SUMMARY_FR`).
 */
const UNLOCALIZED_SENTINEL_IDS: ReadonlySet<string> = new Set([
  "f8-funding-microstate",
  // f6-usd-state: real-data pass (F6 real-mode milestone) turns this from
  // static authored prose into a computed-at-request-time EN sentence (see
  // apps/backend/src/real/f6Currency.ts) — same reasoning as
  // f8-funding-microstate above, just a full sentence instead of a two-word
  // code. See the DRIVER_SUMMARY_FR removal note above.
  "f6-usd-state",
]);

export function localizeDriverSummary(fixture: Pick<KpiFixture, "id" | "driverSummary">, language: Language): string | null {
  if (fixture.driverSummary === null) return null;
  if (UNLOCALIZED_SENTINEL_IDS.has(fixture.id)) return fixture.driverSummary;
  if (language === "EN") return fixture.driverSummary;
  return DRIVER_SUMMARY_FR[fixture.id] ?? fixture.driverSummary;
}

// Locked Milestone 1B mock composition. Deterministic values only — do not
// randomize, do not add fixtures beyond what is documented in
// docs/MVP_COCKPIT_CONTRACT.md, do not omit anything listed there.
export const KPI_FIXTURES: readonly KpiFixture[] = Object.freeze([
  // ------------------------------------------- F12: Physical / Structural Gold
  // Restored (see docs/MVP_COCKPIT_CONTRACT.md's updated top-of-file note),
  // same "never simulated, never silently missing" rule that restored F1:
  // this family was previously excluded from the product entirely rather
  // than shown as an honest UNAVAILABLE family. Both KPIs below are
  // PERMANENTLY UNAVAILABLE/NO_SOURCE — see
  // apps/backend/src/real/f12PhysicalGold.ts — no free API publishes
  // central-bank gold reserve purchases or aggregate quarterly gold demand;
  // the World Gold Council (the only entity that compiles these figures) has
  // no public API, only a login-gated interactive dashboard and manual
  // spreadsheet/PDF exports. `value: null` here directly (not a plausible-
  // looking placeholder number) since these fixtures are unconditionally
  // overridden to UNAVAILABLE at request time and must never risk rendering
  // as if real even if that override were ever accidentally skipped.
  // `driverSummary: null` on both (not authored prose) — matching the exact
  // convention already used by every other permanently-UNAVAILABLE/
  // NO_SOURCE KPI in this file (e.g. f7-move/f7-move-1d below): every call
  // through `unavailableOverride()` (real/types.ts) unconditionally clears
  // `driverSummary` to `null` at request time regardless of what the fixture
  // authors here, so any authored text here would be genuinely dead/never-
  // rendered content. The honest "no free source exists" reason is instead
  // surfaced generically wherever `unavailableReason: "NO_SOURCE"` renders
  // (see `dataState.noSourceTooltip` in apps/frontend/src/i18n/en.ts) and in
  // this family's Knowledge/education copy (apps/frontend/src/content/
  // familyEducation.ts's F12 entry) — not duplicated here.
  {
    id: "f12-cb-net-buying",
    familyId: "F12",
    label: "Central Bank Net Buying (Qtrly)",
    value: null,
    unit: "t",
    decimals: 0,
    provenance: "observed",
    driverSummary: null,
    sourceTag: DEV_MOCK_SOURCE,
    visibility: "cockpit",
  },
  {
    id: "f12-quarterly-demand",
    familyId: "F12",
    label: "Total Gold Demand (Qtrly)",
    value: null,
    unit: "t",
    decimals: 0,
    provenance: "observed",
    driverSummary: null,
    sourceTag: DEV_MOCK_SOURCE,
    visibility: "cockpit",
  },

  // --------------------------------------------------------------- F2: Rates
  {
    id: "f2-2y",
    familyId: "F2",
    label: "2Y",
    value: 3.62,
    unit: "%",
    decimals: 3,
    provenance: "observed",
    driverSummary: null,
    sourceTag: DEV_MOCK_SOURCE,
    visibility: "cockpit",
  },
  {
    id: "f2-10y",
    familyId: "F2",
    label: "10Y",
    value: 4.287,
    unit: "%",
    decimals: 3,
    provenance: "observed",
    driverSummary: null,
    sourceTag: DEV_MOCK_SOURCE,
    visibility: "cockpit",
  },
  {
    id: "f2-10y-real",
    familyId: "F2",
    label: "10Y Real",
    value: 1.842,
    unit: "%",
    decimals: 3,
    provenance: "observed",
    driverSummary:
      "Higher real yields raise the opportunity cost of holding a non-yielding asset.",
    sourceTag: DEV_MOCK_SOURCE,
    visibility: "deep",
    emphasis: true,
  },
  {
    id: "f2-be10",
    familyId: "F2",
    label: "BE10",
    value: 2.314,
    unit: "%",
    decimals: 3,
    provenance: "derived",
    driverSummary:
      "10Y breakeven inflation — decompose nominal moves against this before calling a yield move bearish or bullish for Gold.",
    sourceTag: DEV_MOCK_SOURCE,
    visibility: "deep",
  },
  {
    // Explicit product-owner addition (not an invented KPI) — see
    // docs/MVP_COCKPIT_CONTRACT.md's F2 section and
    // apps/backend/src/real/f2Rates.ts for the FRED T5YIFR wiring.
    id: "f2-5y5y",
    familyId: "F2",
    label: "5Y5Y Forward Inflation",
    value: 2.32,
    unit: "%",
    decimals: 2,
    provenance: "observed",
    driverSummary:
      "The Fed's own preferred medium-term inflation-expectations gauge — a market-pricing input, not a direct mechanical driver.",
    sourceTag: DEV_MOCK_SOURCE,
    visibility: "deep",
  },
  {
    id: "f2-2s10s",
    familyId: "F2",
    label: "2s10s",
    value: 54,
    unit: "bps",
    decimals: 0,
    provenance: "derived",
    driverSummary: "Curve slope — a regime signal, not a direct Gold driver.",
    sourceTag: DEV_MOCK_SOURCE,
    visibility: "cockpit",
  },

  // ------------------------------------------------- F3: Fed / Rate Pricing
  {
    id: "f3-target-lower",
    familyId: "F3",
    label: "Target Range (Lower)",
    value: 4.25,
    unit: "%",
    decimals: 2,
    provenance: "observed",
    driverSummary: null,
    sourceTag: DEV_MOCK_SOURCE,
    visibility: "cockpit",
    section: "TARGET_RANGE",
  },
  {
    id: "f3-target-upper",
    familyId: "F3",
    label: "Target Range (Upper)",
    value: 4.5,
    unit: "%",
    decimals: 2,
    provenance: "observed",
    driverSummary: null,
    sourceTag: DEV_MOCK_SOURCE,
    visibility: "cockpit",
    section: "TARGET_RANGE",
  },
  // f3-dist-hold / f3-dist-25bp / f3-dist-50bp were removed — F3's real
  // meeting-probability distribution now comes from a real source
  // (investing.com's Fed Rate Monitor) with an arbitrary bucket count, so
  // it can no longer be modeled as fixed CanonicalKpi ids. See
  // `FedRateDistribution` in @gold-terminal/contracts and
  // apps/backend/src/real/f3Fed.ts's top-of-file comment.
  {
    id: "f3-path-6m",
    familyId: "F3",
    label: "Implied Path (6M)",
    value: null,
    unit: "%",
    decimals: 3,
    provenance: "derived",
    driverSummary:
      "Compact market-implied rate path over the next six meetings.",
    sourceTag: DEV_MOCK_SOURCE,
    visibility: "deep",
    series: [3.875, 3.75, 3.75, 3.625, 3.625, 3.5],
  },
  {
    id: "f3-repricing",
    familyId: "F3",
    label: "Repricing (2W Δ)",
    value: -12,
    unit: "bps",
    decimals: 0,
    provenance: "derived",
    driverSummary:
      "Market-implied path currently pricing further cuts vs. two weeks ago.",
    sourceTag: DEV_MOCK_SOURCE,
    visibility: "deep",
  },

  // ---------------------------------------------------------- F4: Inflation
  {
    id: "f4-core-cpi-mom",
    familyId: "F4",
    label: "Core CPI (MoM)",
    value: 0.28,
    unit: "%",
    // 1dp, not 2 — matches BLS's own published rounding convention for MoM
    // CPI prints (accuracy-investigation pass; see f4Inflation.ts's
    // top-of-file comment). Every YoY figure in this family was already 1dp.
    decimals: 1,
    provenance: "observed",
    driverSummary: null,
    sourceTag: DEV_MOCK_SOURCE,
    visibility: "cockpit",
    consensus: 0.3,
    previous: 0.3,
    surprise: "inline",
    emphasis: true,
  },
  {
    id: "f4-core-cpi-yoy",
    familyId: "F4",
    label: "Core CPI (YoY)",
    value: 3.1,
    unit: "%",
    decimals: 1,
    provenance: "observed",
    driverSummary: null,
    sourceTag: DEV_MOCK_SOURCE,
    visibility: "cockpit",
  },
  {
    id: "f4-headline-cpi-mom",
    familyId: "F4",
    label: "Headline CPI (MoM)",
    value: 0.31,
    unit: "%",
    decimals: 1, // see f4-core-cpi-mom's comment above
    provenance: "observed",
    driverSummary: null,
    sourceTag: DEV_MOCK_SOURCE,
    visibility: "deep",
  },
  {
    id: "f4-headline-cpi-yoy",
    familyId: "F4",
    label: "Headline CPI (YoY)",
    value: 2.9,
    unit: "%",
    decimals: 1,
    provenance: "observed",
    driverSummary: null,
    sourceTag: DEV_MOCK_SOURCE,
    visibility: "deep",
  },
  {
    id: "f4-core-pce-mom",
    familyId: "F4",
    label: "Core PCE (MoM)",
    value: 0.24,
    unit: "%",
    decimals: 1, // see f4-core-cpi-mom's comment above — same fix, BEA's own convention
    provenance: "observed",
    driverSummary: null,
    sourceTag: DEV_MOCK_SOURCE,
    visibility: "cockpit",
    consensus: 0.2,
    previous: 0.2,
    surprise: "inline",
  },
  {
    id: "f4-core-pce-yoy",
    familyId: "F4",
    label: "Core PCE (YoY)",
    value: 2.8,
    unit: "%",
    decimals: 1,
    provenance: "observed",
    driverSummary: null,
    sourceTag: DEV_MOCK_SOURCE,
    visibility: "cockpit",
  },
  {
    id: "f4-headline-pce-yoy",
    familyId: "F4",
    label: "Headline PCE (YoY)",
    value: 2.6,
    unit: "%",
    decimals: 1,
    provenance: "observed",
    driverSummary:
      "The Fed's 2% inflation target is defined on this measure.",
    sourceTag: DEV_MOCK_SOURCE,
    visibility: "deep",
  },
  {
    id: "f4-core-cpi-3m-ann",
    familyId: "F4",
    label: "Core CPI 3M Annualized",
    value: 2.7,
    unit: "%",
    decimals: 1,
    provenance: "derived",
    driverSummary:
      "Trend read: recent-months momentum, smoothed of one-off base effects.",
    sourceTag: DEV_MOCK_SOURCE,
    visibility: "deep",
  },
  {
    id: "f4-ppi-final-demand",
    familyId: "F4",
    label: "PPI Final Demand (MoM)",
    value: 0.15,
    unit: "%",
    decimals: 1, // see f4-core-cpi-mom's comment above
    provenance: "observed",
    driverSummary:
      "Feeds into the PCE nowcast; watch the PCE-relevant components, not the headline.",
    sourceTag: DEV_MOCK_SOURCE,
    visibility: "deep",
  },

  // ---------------------------------------------- F5: Employment / Growth
  {
    id: "f5-unemployment",
    familyId: "F5",
    label: "Unemployment Rate",
    value: 4.1,
    unit: "%",
    decimals: 1,
    provenance: "observed",
    driverSummary: null,
    sourceTag: DEV_MOCK_SOURCE,
    visibility: "cockpit",
    section: "LABOR",
  },
  {
    id: "f5-payrolls-latest",
    familyId: "F5",
    label: "Payrolls (Latest)",
    value: 142,
    unit: "k",
    decimals: 0,
    provenance: "observed",
    driverSummary: null,
    sourceTag: DEV_MOCK_SOURCE,
    visibility: "cockpit",
    section: "LABOR",
    consensus: 150,
    surprise: "miss",
  },
  {
    id: "f5-payrolls-3m",
    familyId: "F5",
    label: "Payrolls (3M Avg)",
    value: 128,
    unit: "k",
    decimals: 0,
    provenance: "derived",
    driverSummary: null,
    sourceTag: DEV_MOCK_SOURCE,
    visibility: "deep",
    section: "LABOR",
  },
  {
    id: "f5-claims-4w",
    familyId: "F5",
    label: "Claims (4W Avg)",
    value: 224,
    unit: "k",
    decimals: 0,
    provenance: "observed",
    driverSummary: null,
    sourceTag: DEV_MOCK_SOURCE,
    visibility: "deep",
    section: "LABOR",
  },
  // New this pass — FRED ICSA/CCSA, the raw weekly series behind the 4-week
  // average above. Drawer-only (visibility: "deep") per "don't overload the
  // cockpit face" — the existing 4W average stays the cockpit-adjacent
  // summary figure.
  {
    id: "f5-claims-initial",
    familyId: "F5",
    label: "Initial Jobless Claims",
    value: 220,
    unit: "k",
    decimals: 0,
    provenance: "observed",
    driverSummary: null,
    sourceTag: DEV_MOCK_SOURCE,
    visibility: "deep",
    section: "LABOR",
  },
  {
    id: "f5-claims-continuing",
    familyId: "F5",
    label: "Continuing Claims",
    value: 1900,
    unit: "k",
    decimals: 0,
    provenance: "observed",
    driverSummary: null,
    sourceTag: DEV_MOCK_SOURCE,
    visibility: "deep",
    section: "LABOR",
  },
  {
    id: "f5-ahe-mom",
    familyId: "F5",
    label: "Average Hourly Earnings (MoM)",
    value: 0.3,
    unit: "%",
    decimals: 1,
    provenance: "observed",
    driverSummary: null,
    sourceTag: DEV_MOCK_SOURCE,
    visibility: "event",
    section: "LABOR",
  },
  {
    id: "f5-payrolls-revision-2m",
    familyId: "F5",
    label: "2M Net Revision",
    value: -25,
    unit: "k",
    decimals: 0,
    provenance: "observed",
    driverSummary: null,
    sourceTag: DEV_MOCK_SOURCE,
    visibility: "event",
    section: "LABOR",
  },
  {
    id: "f5-ism-services",
    familyId: "F5",
    label: "ISM Services",
    value: 52.4,
    unit: null,
    decimals: 1,
    provenance: "observed",
    driverSummary: null,
    sourceTag: DEV_MOCK_SOURCE,
    visibility: "deep",
    section: "GROWTH",
  },
  {
    id: "f5-ism-manufacturing",
    familyId: "F5",
    label: "ISM Manufacturing",
    value: 48.7,
    unit: null,
    decimals: 1,
    provenance: "observed",
    driverSummary: null,
    sourceTag: DEV_MOCK_SOURCE,
    visibility: "deep",
    section: "GROWTH",
  },
  {
    id: "f5-gdpnow",
    familyId: "F5",
    label: "GDPNow",
    value: 2.3,
    unit: "%",
    decimals: 1,
    provenance: "estimated",
    driverSummary: null,
    sourceTag: DEV_MOCK_SOURCE,
    visibility: "cockpit",
    section: "GROWTH",
  },

  // -------------------------------------------------------- F6: USD / FX
  {
    id: "f6-dxy-recon-level",
    familyId: "F6",
    label: "DXY",
    value: 104.62,
    unit: null,
    decimals: 2,
    provenance: "derived",
    // KPI id kept as "f6-dxy-recon-level" for backward compatibility with
    // existing cross-references (kpiDependencyMap.ts, mockScenarios.ts,
    // knowledgeMap.ts) even though this is no longer a reconstruction as of
    // the Yahoo-DXY pass (see apps/backend/src/real/f6Currency.ts) — it is
    // now a direct ICE US Dollar Index reading. This driverSummary text (the
    // mock/fallback default) reflects that; the live REAL override below
    // does not touch driverSummary, so this text is also what's shown
    // whenever a real fetch is in flight or the boot snapshot is still MOCK.
    driverSummary: "Direct ICE US Dollar Index reading (Yahoo Finance's public chart endpoint — unofficial, no key required).",
    sourceTag: DEV_MOCK_SOURCE,
    visibility: "cockpit",
    emphasis: true,
  },
  {
    id: "f6-dxy-recon-today",
    familyId: "F6",
    label: "Today %",
    value: -0.18,
    unit: "%",
    decimals: 2,
    provenance: "derived",
    driverSummary: null,
    sourceTag: DEV_MOCK_SOURCE,
    visibility: "cockpit",
  },
  {
    id: "f6-dxy-recon-5d",
    familyId: "F6",
    label: "5D %",
    value: 0.42,
    unit: "%",
    decimals: 2,
    provenance: "derived",
    driverSummary: null,
    sourceTag: DEV_MOCK_SOURCE,
    visibility: "cockpit",
  },
  {
    id: "f6-usd-state",
    familyId: "F6",
    label: "USD State",
    value: null,
    unit: null,
    decimals: 0,
    provenance: "derived",
    driverSummary:
      "Divergent: weaker intraday, firmer over 5 days — no clean single-direction read.",
    sourceTag: DEV_MOCK_SOURCE,
    // Milestone 1D: moved off the cockpit face — the resting F6 card is now
    // exactly DXY (level) / Today % / 5D %, matching the target mockup.
    // Still fully visible one click away in the drawer's "What is the
    // current read?" section (all KPIs render there regardless of
    // visibility).
    visibility: "deep",
  },

  // ------------------------------------------------ F7: Risk / Credit / Vol
  {
    id: "f7-vix",
    familyId: "F7",
    label: "VIX",
    value: 14.85,
    unit: null,
    decimals: 2,
    provenance: "observed",
    driverSummary: null,
    sourceTag: DEV_MOCK_SOURCE,
    visibility: "cockpit",
  },
  {
    id: "f7-vix-1d",
    familyId: "F7",
    label: "VIX (1D Δ)",
    value: 0.3,
    unit: null,
    decimals: 2,
    provenance: "observed",
    driverSummary: null,
    sourceTag: DEV_MOCK_SOURCE,
    visibility: "deep",
  },
  {
    id: "f7-move",
    familyId: "F7",
    label: "MOVE",
    value: 92.4,
    unit: null,
    decimals: 1,
    provenance: "observed",
    driverSummary: null,
    sourceTag: DEV_MOCK_SOURCE,
    visibility: "cockpit",
  },
  {
    id: "f7-move-1d",
    familyId: "F7",
    label: "MOVE (1D Δ)",
    value: -1.2,
    unit: null,
    decimals: 1,
    provenance: "observed",
    driverSummary: null,
    sourceTag: DEV_MOCK_SOURCE,
    visibility: "deep",
  },
  {
    id: "f7-hy-oas",
    familyId: "F7",
    label: "HY OAS",
    value: 312,
    unit: "bps",
    decimals: 0,
    provenance: "observed",
    driverSummary: null,
    sourceTag: DEV_MOCK_SOURCE,
    visibility: "cockpit",
  },
  {
    id: "f7-hy-oas-1d",
    familyId: "F7",
    label: "HY OAS (1D Δ)",
    value: 4,
    unit: "bps",
    decimals: 0,
    provenance: "observed",
    driverSummary: null,
    sourceTag: DEV_MOCK_SOURCE,
    visibility: "deep",
  },
  {
    id: "f7-ig-oas",
    familyId: "F7",
    label: "IG OAS",
    value: 98,
    unit: "bps",
    decimals: 0,
    provenance: "observed",
    driverSummary: null,
    sourceTag: DEV_MOCK_SOURCE,
    visibility: "deep",
  },

  // ------------------------------------------------ F8: Liquidity / Funding
  {
    id: "f8-reserves-level",
    familyId: "F8",
    label: "Reserves",
    value: 3180,
    unit: "$B",
    decimals: 0,
    provenance: "observed",
    driverSummary: null,
    sourceTag: DEV_MOCK_SOURCE,
    visibility: "deep",
    section: "RESERVES",
  },
  {
    id: "f8-reserves-wow",
    familyId: "F8",
    label: "Reserves (WoW Δ)",
    value: 18,
    unit: "$B",
    decimals: 0,
    provenance: "observed",
    driverSummary: null,
    sourceTag: DEV_MOCK_SOURCE,
    visibility: "cockpit",
    section: "RESERVES",
    emphasis: true,
  },
  {
    id: "f8-tga-level",
    familyId: "F8",
    label: "TGA",
    value: 720,
    unit: "$B",
    decimals: 0,
    provenance: "observed",
    driverSummary: null,
    sourceTag: DEV_MOCK_SOURCE,
    visibility: "deep",
    section: "TGA",
  },
  {
    id: "f8-tga-daily",
    familyId: "F8",
    label: "TGA (Daily Δ)",
    value: -12,
    unit: "$B",
    decimals: 0,
    provenance: "observed",
    driverSummary: null,
    sourceTag: DEV_MOCK_SOURCE,
    visibility: "cockpit",
    section: "TGA",
    emphasis: true,
  },
  {
    id: "f8-funding-microstate",
    familyId: "F8",
    label: "Funding Microstate",
    value: null,
    unit: null,
    decimals: 0,
    provenance: "derived",
    driverSummary: "NORMAL",
    sourceTag: DEV_MOCK_SOURCE,
    visibility: "cockpit",
    section: "MICROSTATE",
  },
  {
    id: "f8-sofr-iorb",
    familyId: "F8",
    label: "SOFR - IORB",
    value: 2,
    unit: "bps",
    decimals: 0,
    provenance: "derived",
    driverSummary: null,
    sourceTag: DEV_MOCK_SOURCE,
    visibility: "deep",
  },
  {
    id: "f8-effr-iorb",
    familyId: "F8",
    label: "EFFR - IORB",
    value: 1,
    unit: "bps",
    decimals: 0,
    provenance: "derived",
    driverSummary: null,
    sourceTag: DEV_MOCK_SOURCE,
    visibility: "deep",
  },

  // ------------------------------------------------- F9: Treasury / Fiscal
  {
    id: "f9-qra-borrowing",
    familyId: "F9",
    label: "Net Marketable Borrowing",
    value: 578,
    unit: "$B",
    decimals: 0,
    provenance: "observed",
    driverSummary: null,
    sourceTag: DEV_MOCK_SOURCE,
    visibility: "event",
  },
  {
    id: "f9-qra-revision",
    familyId: "F9",
    label: "Borrowing Est. Revision vs Prior",
    value: 42,
    unit: "$B",
    decimals: 0,
    provenance: "observed",
    driverSummary: null,
    sourceTag: DEV_MOCK_SOURCE,
    visibility: "event",
  },
  {
    id: "f9-auction-high-yield",
    familyId: "F9",
    label: "High Yield",
    value: 4.31,
    unit: "%",
    decimals: 2,
    provenance: "observed",
    driverSummary: null,
    sourceTag: DEV_MOCK_SOURCE,
    visibility: "event",
  },
  {
    id: "f9-auction-btc",
    familyId: "F9",
    label: "Bid-to-Cover",
    value: 2.48,
    unit: null,
    decimals: 2,
    provenance: "observed",
    driverSummary: null,
    sourceTag: DEV_MOCK_SOURCE,
    visibility: "event",
  },
  {
    id: "f9-auction-indirect",
    familyId: "F9",
    label: "Indirect Bidder Share",
    value: 68,
    unit: "%",
    decimals: 0,
    provenance: "observed",
    driverSummary: null,
    sourceTag: DEV_MOCK_SOURCE,
    visibility: "event",
  },

  // ---------------------------------------------- F10: Flows / Positioning
  {
    id: "f10-mm-net-pct",
    familyId: "F10",
    label: "Managed Money Net % of OI",
    value: 38.4,
    unit: "%",
    decimals: 1,
    provenance: "observed",
    driverSummary: null,
    sourceTag: DEV_MOCK_SOURCE,
    visibility: "cockpit",
    section: "MANAGED_MONEY",
  },
  {
    id: "f10-mm-wow-pp",
    familyId: "F10",
    label: "WoW Δ",
    value: 1.2,
    unit: "pp",
    decimals: 1,
    provenance: "observed",
    driverSummary: null,
    sourceTag: DEV_MOCK_SOURCE,
    visibility: "cockpit",
    section: "MANAGED_MONEY",
  },
  {
    id: "f10-mm-percentile",
    familyId: "F10",
    label: "156W Percentile",
    value: 71,
    unit: "pct",
    decimals: 0,
    provenance: "derived",
    driverSummary: null,
    sourceTag: DEV_MOCK_SOURCE,
    visibility: "cockpit",
    section: "MANAGED_MONEY",
  },
  {
    id: "f10-etf-holdings",
    familyId: "F10",
    label: "SPDR GLD — Physical Holdings",
    value: 3210,
    unit: "t",
    decimals: 0,
    provenance: "observed",
    driverSummary: null,
    sourceTag: DEV_MOCK_SOURCE,
    visibility: "deep",
    section: "ETF",
  },
  {
    id: "f10-etf-delta",
    familyId: "F10",
    label: "GLD Holdings Δ (Tonnes)",
    value: 14,
    unit: "t",
    decimals: 0,
    provenance: "derived",
    driverSummary: null,
    sourceTag: DEV_MOCK_SOURCE,
    visibility: "cockpit",
    section: "ETF",
  },
  {
    id: "f10-etf-delta-5d",
    familyId: "F10",
    label: "GLD Holdings Change 5 obs.",
    value: 0,
    unit: "t",
    decimals: 2,
    provenance: "derived",
    driverSummary: "MIXED_FLAT",
    sourceTag: DEV_MOCK_SOURCE,
    visibility: "cockpit",
    section: "ETF",
  },
  {
    id: "f10-etf-delta-20d",
    familyId: "F10",
    label: "GLD Holdings Change 20 obs.",
    value: 0,
    unit: "t",
    decimals: 2,
    provenance: "derived",
    driverSummary: "MIXED_FLAT",
    sourceTag: DEV_MOCK_SOURCE,
    visibility: "cockpit",
    section: "ETF",
  },
  {
    id: "f10-etf-flow-z60",
    familyId: "F10",
    label: "60-obs. Flow Z",
    value: 0,
    unit: "σ",
    decimals: 2,
    provenance: "derived",
    driverSummary: "NORMAL_UNCHANGED",
    sourceTag: DEV_MOCK_SOURCE,
    visibility: "cockpit",
    section: "ETF",
  },
  {
    id: "f10-etf-flow-percentile",
    familyId: "F10",
    label: "20-Obs. Flow Extension",
    value: 50,
    unit: "pct",
    decimals: 0,
    provenance: "derived",
    driverSummary: "NORMAL_MID_RANGE",
    sourceTag: DEV_MOCK_SOURCE,
    visibility: "cockpit",
    section: "ETF",
  },
  {
    id: "f10-gld-return-5d",
    familyId: "F10",
    label: "GLD Price Return 5 obs.",
    value: 0,
    unit: "%",
    decimals: 2,
    provenance: "derived",
    driverSummary: null,
    sourceTag: DEV_MOCK_SOURCE,
    visibility: "deep",
    section: "ETF",
  },
  {
    id: "f10-gld-return-20d",
    familyId: "F10",
    label: "GLD Price Return 20 obs.",
    value: 0,
    unit: "%",
    decimals: 2,
    provenance: "derived",
    driverSummary: "NEUTRAL_NON_CONFIRMATION",
    sourceTag: DEV_MOCK_SOURCE,
    visibility: "cockpit",
    section: "ETF",
  },

  // ------------------------------------------------- F11: Gold Options / Vol
  {
    id: "f11-gvz",
    familyId: "F11",
    label: "Gold Vol (GVZ)",
    value: 15.8,
    unit: null,
    decimals: 1,
    provenance: "observed",
    driverSummary:
      "GLD Options Proxy — CVOL is unavailable in the free MVP.",
    // Machine-readable counterpart to the driverSummary prose above — the
    // frontend's PROXY badge (FamilyModule.tsx) is driven generically off
    // this field's presence, never off a hardcoded "f11-gvz" id check. GVZ
    // itself is genuinely observed (real CBOE data), it just measures GLD
    // options, not true Gold options/CVOL — see f11GoldVol.ts.
    proxyFor: "Gold options volatility / true Gold CVOL",
    sourceTag: DEV_MOCK_SOURCE,
    visibility: "cockpit",
  },
  {
    id: "f11-gvz-1d",
    familyId: "F11",
    label: "1D Change",
    value: 0.3,
    unit: null,
    decimals: 1,
    provenance: "observed",
    driverSummary: null,
    sourceTag: DEV_MOCK_SOURCE,
    visibility: "cockpit",
  },
  {
    id: "f11-gvz-5d",
    familyId: "F11",
    label: "5D Change",
    value: -0.6,
    unit: null,
    decimals: 1,
    provenance: "observed",
    driverSummary: null,
    sourceTag: DEV_MOCK_SOURCE,
    visibility: "cockpit",
  },

  // F13 — Events / Catalysts: renders purely from events, no scalar KPIs.
]);
