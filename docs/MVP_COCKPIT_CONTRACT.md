# MVP Cockpit Contract (Milestone 1C)

## F1 does not exist; F12 was restored (data-layer audit pass)

This product originally shipped 13 families (F1-F13), then dropped F1
(Gold) and F12 (Physical/Structural Gold) entirely for a period (see the
git/session history for that milestone's reasoning) once IG — F1's only
planned source — was ruled out and F12's had no free data source. A later
pass briefly restored both, sourcing F1 from Yahoo Finance's public chart
endpoint (`GC=F`, COMEX Gold futures front month). The product owner then
reversed that: F1 stays removed from the product entirely, by explicit,
standing decision — this is not an oversight or a gap to fill in, and the
restored Yahoo-Gold data was additionally found to be factually wrong (the
displayed 1-day % change did not match the real move). **F1 must not be
reintroduced without a new, explicit product-owner decision.**

F12 (Physical/Structural Gold) remains restored as an honest, permanently
`UNAVAILABLE`/`NO_SOURCE` family — the underlying gap (World Gold Council
has no public API, only an interactive login-gated dashboard/manual
exports) is unchanged, but the family itself is visibly present rather
than silently absent. See `apps/backend/src/real/f12PhysicalGold.ts`. This
is a genuinely different situation from F1: F12 is kept as an explicit gap
because no free data source exists for it; F1 is removed because the
product owner does not want the family to exist at all.

`packages/contracts/src/index.ts`'s `FamilyId` union, every mock fixture,
i18n key, Knowledge-chapter slug, and dependency-map entry cover the
current canonical 12-family composition (F2-F13) — see
`apps/backend/src/mock/fixtures.ts` and `apps/backend/src/mock/families.ts`.
F12 does not yet have an authored Knowledge chapter (a content task,
deferred — `/knowledge/physical-gold` 404s gracefully in the meantime, per
`tests/knowledge-interface.test.ts`).

---

This document is the repo-local reference for the locked cockpit
composition decisions: which fields render on the resting cockpit card,
which are event-mode/deep-only, which were explicitly excluded from this
MVP, and each family's default Gold relationship stance. It exists so
future sessions don't have to reconstruct these decisions from chat
history. The source of truth for shape/values is
`apps/backend/src/mock/fixtures.ts` and `apps/backend/src/mock/events.ts`;
this file is the human-readable index of those decisions plus the
reasoning behind the ones that needed it.

This revision (Milestone 1C) supersedes the Milestone 1B version of this
document: it records a density pass (several families lost cockpit-face
fields to `deep`/`event`), a freshness-vocabulary simplification, the
removal of the status-bar market-state badge, and a directional-coloring
visibility fix. See "Milestone 1C deviations from DESIGN.md" below for the
two explicit, approved deviations from the design doc's literal text.

## Color-system note (read this before editing any relationship UI)

**Superseded by Milestone 1C — this note previously said "neutral is
gray, never literal yellow." That is no longer true; read the corrected
version below.**

As of Milestone 1C ("KPI Intelligence"), the contextual/neutral
relationship bucket **is** rendered as a literal, distinct muted yellow:
`relationship-contextual` (`#c9b458`, DESIGN.md §2.1), not the gray
`kpi-neutral` token. This is a deliberate product-owner update, applied
everywhere the relationship system displays this bucket: the
`RelationshipChip`'s label (now "Contextual", not "Neutral") and the
directional-coloring row/card-tint treatment in `FamilyModule`.

`kpi-neutral` (gray) is **not retired** — it remains in use for unrelated
system-state purposes (e.g. `FreshnessDot`'s `"unavailable"` dashed-outline
treatment, DESIGN.md §18). It is simply no longer used for KPI
*relationship* state.

`relationship-contextual` (`#c9b458`, muted olive-yellow) is a different
hue from `warn` (`#d99a4e`, orange-amber) on purpose: relationship state
and data-quality warnings are separate taxonomies (DESIGN.md §2.1/§17) and
must never borrow each other's color, even though both now read as
"yellow-ish" in casual description. See DESIGN.md §2.1's Milestone 1C note
and `docs/KPI_INTELLIGENCE_ARCHITECTURE.md` (the `relationshipBasis`/
`displayRelationship` model this powers) for the full rationale.

---

## Milestone 1C deviations from DESIGN.md

Both of the following are explicit, approved product-owner deviations
from DESIGN.md's literal text. They are deliberate exceptions, not
oversights — DESIGN.md itself is not being rewritten to match; these
carve-outs are recorded here instead.

### 1. Freshness vocabulary simplified from 5 states to 3

DESIGN.md §18 documents a 5-state freshness ladder (`Live` / `Fresh` /
`Aging` / `Stale` / `Model-estimated`). Milestone 1C **replaces** that
with exactly 3 canonical states in `QualityState`
(`packages/contracts/src/index.ts`): `"current" | "stale" |
"unavailable"`. The old `"aging"` ("DELAYED") tier introduced in
Milestone 1B is gone — it collapses into `"current"` below the stale
threshold. `"unavailable"` is reserved for a future missing-data case;
no fixture resolves to it in this milestone. See "Freshness" below for
the full display-word mapping and thresholds.

### 2. Opt-in whole-card directional tint

DESIGN.md §3 states: "A module's background never changes to signal
state... A module that turns red because one metric inside it is adverse
is a false alarm generator; do not do it." This remains the default,
always-true behavior — **Directional Coloring: OFF** (the default) fully
obeys §3: neutral `surface-1` card background, zero tint, relationship
communicated only via the labeled `RelationshipChip`.

**Directional Coloring: ON** is an explicit, user-toggled exception to
§3: a family card MAY additionally receive a light overall background
tint (layered over the opaque `surface-1` base, not replacing it) using
the same `support`/`adverse`/`kpi-neutral` `-fill` tokens used elsewhere.
This tint is driven by **exactly one designated KPI per family** — its
`emphasis: true` KPI if present, otherwise `kpis[0]` (canonical array
order) — **never** an aggregate, vote, or count across multiple KPIs. If
the designated KPI's relationship is `"neutral"`, the card tints with the
neutral/gray token rather than being skipped or defaulted to something
else. See `apps/frontend/src/lib/designatedKpi.ts` for the single
implementation of this designation rule (shared by the card tint and by
the drawer's one-sentence interpretive read in "What is the current
read?").

---

## Freshness (Milestone 1C: 3-state vocabulary)

`QualityState` is exactly `"current" | "stale" | "unavailable"`, computed
server-side in `apps/backend/src/cache/snapshotCache.ts` off real elapsed
wall-clock time since process boot — never off a fake tick, and KPI
`value`s themselves never change once booted:

| Backend `quality` | Threshold | Card display word | Dot treatment |
|---|---|---|---|
| `"current"` | < 60 min since boot | **UP TO DATE** for every family (F1's former literal "LIVE" read was retired along with F1 itself — see the top-of-file note) | Solid `fresh`-colored dot, static, never pulses |
| `"stale"` | ≥ 60 min since boot | **STALE** | Outline `error` dot |
| `"unavailable"` | reserved; no fixture reaches this in this milestone | **UNAVAILABLE** | Dashed `kpi-neutral` outline dot |

No relative-age text ("Xs/Xm/Xh ago") appears anywhere on the cockpit
face — this was true before Milestone 1C and remains true; exact
`observationAt`/`retrievedAt` timestamps are only ever shown, verbatim,
in the drawer's "Data & sources" footer.

`FreshnessDot` (`apps/frontend/src/components/market/FreshnessDot.tsx`)
takes `quality` and `familyId` as props — `familyId` is a historical
leftover from the retired F1-only LIVE/UP TO DATE distinction (see the
top-of-file note); every family now renders the same UP TO DATE word.

---

## Directional coloring (Settings-controlled)

Two independent, additive treatments, both gated behind the
`directionalColoring` setting (`apps/frontend/src/context/SettingsContext.tsx`,
toggled on `/settings`):

1. **Per mini-KPI block** (`apps/frontend/src/components/market/FamilyModule.module.css`,
   `.rowSupport` / `.rowAdverse` / `.rowContextual` — renamed from
   `.rowNeutralAccent` in Milestone 1C): the KPI's own row/block gets the
   matching `-fill` token as a background wash across its full block (not
   a thin header sliver), a solid 3px left border in the matching solid
   token, and the value text itself rendered in that color. `.rowContextual`
   now uses `relationship-contextual` (muted yellow), not `kpi-neutral`
   (gray). This must read as clearly visible at a glance.
2. **Optional whole-card tint** (`.cardTintSupport` / `.cardTintAdverse`
   / `.cardTintContextual` on the module root — `.cardTintContextual`
   renamed from `.cardTintNeutral` in Milestone 1C, same `relationship-contextual`
   color change): see "Opt-in whole-card directional tint" above. Driven by
   exactly one designated KPI per family via `getDesignatedKpi()`
   (`apps/frontend/src/lib/designatedKpi.ts`) — never an aggregate, vote,
   or count.

**OFF** (default): neutral `surface-1` card, zero tint anywhere, relationship
communicated only via the existing labeled `RelationshipChip`.

---

## Removed: status-bar market-state badge

The `StatusBar` (`apps/frontend/src/components/shell/StatusBar.tsx`) no
longer renders a market-state pill badge (previously a hardcoded
`RANGE-BOUND` chip with no backing data). It was removed outright with no
replacement badge. The status bar now shows only: the `DEV · MOCK DATA`
caption, the UTC+local clock, and the `Connected` caption.

**Superseded (2026-09-09 rebrand):** `StatusBar` itself is gone, replaced
by `PageFooter` (`apps/frontend/src/components/shell/PageFooter.tsx`) — a
small caption at the bottom of the page content, `DONNÉES SOURCÉES ·
RÉELLES OU INDISPONIBLES` only. The clock and the `Connected`/
`Disconnected`/`Reconnecting` badge were dropped from the UI entirely
(product decision — that row read as too prominent for what it was). The
underlying `useConnectionStatus` hook is untouched and unused by any
visible component right now; wire it back in somewhere quieter (e.g.
Settings) if that signal turns out to be missed.

---

## F1 does not exist

F1 (Gold) was evaluated, briefly restored, and then permanently removed by
explicit product-owner decision — see the top-of-file note. There is no F1
family, no `f1-*` KPI ids, and no hero tile in this product. Do not
reintroduce it without a new, explicit product-owner decision.

## F2 — Rates

- **Cockpit (permanent):** 2Y, 10Y, 2s10s.
- **Event mode:** none.
- **Deep/hidden:** 10Y Real, BE10 (moved off the face in Milestone 1C's density pass — still shown, in full, in the drawer's "What is the current read?"), 5Y5Y Forward Inflation (`f2-5y5y`, added F6-real-mode milestone — see below).
- **Explicitly excluded:** none.
- **Relationship default:** 10Y Real is fixed adverse (higher real yields raise Gold's opportunity cost); 2Y/10Y/BE10/2s10s/5Y5Y are neutral (context/decomposition inputs, not direct drivers on their own).
- **Rationale:** 10Y Real carries `emphasis: true` and remains the family's designated KPI for the whole-card directional tint (see above) even though it no longer renders on the resting face — the tint rule reads `emphasis`/`kpis[0]` from the full canonical KPI list, irrespective of `visibility`.
- **bps clarification:** 2s10s is the only cockpit-visible `bps` value in this family; its unit renders with a persistent "(0.01%)" micro-caption the first time `bps` appears on the face.
- **`f2-5y5y` (5Y5Y Forward Inflation) — explicit product-owner addition, not an invented KPI:** the user directly requested FRED's `T5YIFR` (5-Year, 5-Year Forward Inflation Expectation Rate — the Fed's own stated preferred medium-term inflation-expectations gauge, per its Monetary Policy Reports). Series id verified live this pass (fred.stlouisfed.org/series/T5YIFR, and a live authenticated fetch against the configured key returned real current observations). Placed alongside `f2-be10` (same inflation-expectation/breakeven-family concept, same family placement convention), `visibility: "deep"` (the locked 2Y/10Y/2s10s cockpit face is unchanged), `provenance: "observed"` (a single published FRED series, not a derived spread), 2 decimals (matches FRED's own published precision for this series, e.g. `2.32`). Real via FRED — see `apps/backend/src/real/f2Rates.ts`.

## F3 — Fed / Rate Pricing

- **Cockpit (permanent), Milestone 1D compaction:** exactly three compact
  label:value lines — **Target** (the Target Range, Lower–Upper combined),
  **Next** (the max-probability meeting-distribution outcome's label, e.g.
  "-25 bp"), **Probability** (that outcome's probability, e.g. "70%"). This
  replaces Milestone 1C's two-line "Most likely: <outcome> (<pct>%)" /
  "Cut odds: <pct>% · Hold odds: <pct>%" composition with a tighter
  three-line form — still computed by the same `apps/frontend/src/lib/deriveFedSummary.ts`
  logic (max-probability outcome = "Next", its probability =
  "Probability"), a presentation-only change. Rendered by
  `F3CompactFace` in `apps/frontend/src/components/market/FamilyModule.tsx`.
  Full meeting distribution, 6M path, repricing, and a detailed bps
  explanation are drawer/KPI-detail only (see below) — this is the
  canonical example referenced in `DESIGN.md`'s "resting KPI-cell
  composition" locked pattern.
- **Mosaic span:** F3's card narrowed from the "tactical" tier's default
  4-column span to 3 columns (`FAMILY_GRID_SPAN_OVERRIDE` in
  `apps/frontend/src/config/familyLayout.ts`) since its three-line face no
  longer justifies a full 4-column card. The mosaic grid uses
  `grid-auto-flow: dense` (`apps/frontend/src/app/market/page.module.css`)
  so the freed column is backfilled by a later card rather than left as a
  gap.
- **Meeting-probability distribution — real source, N buckets (superseded the fixed 3-way Hold/-25bp/-50bp scheme):**
  the original mock's fixed `f3-dist-hold`/`f3-dist-25bp`/`f3-dist-50bp` three-bucket
  `CanonicalKpi` ids are **removed**. They were originally meant to be
  fed by a homemade CME-ZQ-settlement-derived calculation
  (`providers/cmeFedwatch.ts` + `real/fedwatchCalc.ts`) that turned out to
  have a confirmed bug producing wrong probabilities — a final
  product-owner decision retired that calculation entirely (no more
  homemade FedWatch math, ever). The replacement is a real third-party
  source — investing.com's public "Fed Rate Monitor" tool, read via a
  headless browser (`providers/investingFedRateMonitor.ts`) — which can
  show any number of target-rate buckets, not a fixed three. This is
  modeled as `FedRateDistribution` in `packages/contracts` (an N-bucket
  structured list attached to `CanonicalFamilySnapshot.fedRateDistribution`,
  the same "family-level structured extra" pattern as `nextEvents`/
  `activeCatalyst`), not individual `CanonicalKpi` ids.
  `sourceTag` is always `"INVESTING_FED_RATE_MONITOR"` — a third party
  displaying CME-futures-derived numbers, never CME's own feed.
- **Cockpit "Next"/"Probability" rows:** now read whichever bucket the
  real distribution reports as most probable (its `targetRangeLabel` and
  `probability`) — a plain readout of what the source already computed,
  generalized to any bucket count rather than a fixed Hold/-25bp/-50bp
  word. Computed by `apps/frontend/src/lib/deriveFedSummary.ts`, rendered
  by `F3FedFace` in `apps/frontend/src/components/market/F3FedFace.tsx`.
  `UNAVAILABLE` (e.g. the scrape failed, or the extracted probabilities
  didn't sum to ~100%) renders honestly as "not available," never a
  partial/stale-looking distribution.
- **Drawer:** shows every bucket the real source reports (target range +
  probability + previous-day/previous-week probability, when the source
  provides them), the next FOMC meeting date, and visually highlights the
  single highest-probability bucket as "MOST LIKELY" — see
  `FamilyDrawerView.tsx`.
- **Deep/hidden:** Implied Path (6M, sparkline), Repricing (2W Δ) — unchanged, still fixed `CanonicalKpi` ids, still permanently `UNAVAILABLE` (`NO_SOURCE`), unrelated to the distribution change above.
- **Explicitly excluded:** none.
- **Relationship default:** Target Range is neutral (a level, not a directional signal by itself). The meeting-probability distribution no longer carries a per-bucket `relationship` tag at all (it isn't a `CanonicalKpi`) — the "MOST LIKELY" badge is a plain readout of the source's own numbers, not a support/adverse/neutral coloring judgment.

## F4 — Inflation

- **Cockpit (permanent):** a 2x2 grid — Core CPI (MoM), Core CPI (YoY), Core PCE (MoM), Core PCE (YoY).
- **Event mode:** none.
- **Deep/hidden:** Headline CPI (MoM), Headline CPI (YoY), Headline PCE (YoY), Core CPI 3M Annualized, PPI Final Demand (MoM).
- **Explicitly excluded:** none.
- **Relationship default:** neutral on every KPI — inflation is genuinely two-channel (debasement hedge vs. Fed-hawkish-reaction) and which one dominates is context-dependent, not fixed.
- **Rationale:** Milestone 1C trims the face down to the two "core" measures the Fed actually targets, moving headline/trend cuts to the drawer — forcing a directional lean here would still misrepresent the ambivalence documented in the reference material.

## F5 — Employment / Growth

- **Cockpit (permanent):** Unemployment Rate, Payrolls (Latest), GDPNow.
- **Event mode:** Average Hourly Earnings (MoM), 2M Net Revision (unchanged).
- **Deep/hidden:** Payrolls (3M Avg), Claims (4W Avg), ISM Services, ISM Manufacturing.
- **Explicitly excluded:** none.
- **Relationship default:** neutral on every KPI — regime-dependent; no invented directional lean.
- **Rationale:** Milestone 1C keeps one labor headline, one labor level, and one growth nowcast on the face; the rest is still fully visible in the drawer.

## F6 — USD / FX

- **Cockpit (permanent), Milestone 1D cleanup:** **DXY** (level, `id`
  unchanged as `f6-dxy-recon-level`; only the `label` changed from "DXY
  Reconstructed" to "DXY"), Today %, 5D %. **USD State** moved from
  `visibility: "cockpit"` to `"deep"` — the resting F6 face is now exactly
  three lines, matching the target mockup.
- **Event mode:** none.
- **Deep/hidden:** USD State (plain-language divergence read; moved here in Milestone 1D).
- **Explicitly excluded:** EURUSD / USDJPY / USDCNH or any other FX leg; a standalone "Broad USD" fixture.
- **Relationship default:** Today % is support, 5D % is adverse (mock demonstrates a divergent state); level and USD State are neutral.
- **Rationale:** the label no longer says "Reconstructed" on the cockpit face. As of the Yahoo-DXY pass this is no longer just a label change either — the underlying source is now a genuine direct reading (see below), so the label matches reality. Today %/5D % remain deterministic calculations, never AI-generated; no `KpiInterpretation` recomputes or overrides these numeric values, only explains them.

### F6 is now REAL, DIRECT (Yahoo-DXY pass — supersedes RECONSTRUCTED_DXY)

**As of the Yahoo-DXY pass, F6's DXY is a direct reading, not a
reconstruction.** `apps/backend/src/providers/dxy/strategy.ts` now locks
`DIRECT_DXY` as canonical/active, sourced from Yahoo Finance's public,
unofficial chart endpoint (symbol `DX-Y.NYB`, no key) via
`apps/backend/src/providers/yahooFinance.ts` and
`apps/backend/src/real/f6Currency.ts`. This endpoint was live-verified this
pass to return genuine, correctly-labeled ("US Dollar Index" / "ICE US
Dollar Index") current data, cross-checked against an independent source.
All 4 F6 KPIs (`f6-dxy-recon-level`, `f6-dxy-recon-today`, `f6-dxy-recon-5d`,
`f6-usd-state`) go `REAL` when the Yahoo fetch succeeds, `UNAVAILABLE`
(never a stale/mock fallback, and never a silent revert to the deprecated
reconstruction below) otherwise. KPI ids are unchanged despite no longer
being a reconstruction — see the top-of-file comment in `f6Currency.ts`.

- **Source:** `meta.regularMarketPrice` from the Yahoo chart response
  supplies the current level; the same response's parallel
  `timestamp`/`indicators.quote[0].close` history array supplies both
  "Today %" (vs. the most recent prior daily close) and "5D %" (vs. the
  close 5 trading sessions back) — one call covers all 3 numeric KPIs, no
  second call needed. `sourceTag: "YAHOO_FINANCE_UNOFFICIAL"`,
  `provenance: "observed"` — a direct reading, not derived.
- **USD State, real mode:** `f6-usd-state`'s `driverSummary` becomes a
  computed sentence describing the actual sign relationship between the
  real `Today %` and `5D %` values (`computeUsdStateText` in
  `f6Currency.ts`, shared unchanged between the old and new sourcing) — same
  template family as the mock's fixed "Divergent: weaker intraday, firmer
  over 5 days" sentence, just computed instead of hardcoded. **Known,
  deliberate limitation:** this computed sentence is English-only once real
  (`UNLOCALIZED_SENTINEL_IDS` in `apps/backend/src/mock/fixtures.ts`,
  alongside `f8-funding-microstate`) — not fixed this pass, same rationale
  as before.
- **Failure handling:** any Yahoo fetch failure makes ALL 4 F6 KPIs
  `UNAVAILABLE` with `unavailableReason: "FETCH_FAILED"` — never a
  stale/mock fallback, never a silent revert to the deprecated
  reconstruction, never a crash.

#### Deprecated: the prior RECONSTRUCTED_DXY six-FX-leg formula (kept unused for reference)

Before the Yahoo-DXY pass, F6 was sourced by reconstructing a
DXY-equivalent from six FRED FX legs using ICE's own published USDX
methodology. This code still exists, unused, as
`buildF6OverridesReconstructedDeprecated` in `f6Currency.ts` — kept in case
the Yahoo feed needs to be dropped later — but is no longer called from the
live snapshot path. If it is ever reactivated, its correct shape is
`provenance: "derived"`, `proxyFor: "ICE DXY"` (it computes a stand-in for
the real index, it does not observe it directly) — never
`provenance: "observed"`.

- **Formula** (ICE's own published USDX methodology, geometric-weighted,
  unchanged since 1973 apart from the Euro-introduction leg swap):
  `DXY = 50.14348112 × EURUSD^(-0.576) × USDJPY^(0.136) × GBPUSD^(-0.119) × USDCAD^(0.091) × USDSEK^(0.042) × USDCHF^(0.036)`.
- **Source — FRED only, no Massive needed:** all 6 legs were available
  directly (no inversion arithmetic needed) from FRED's H.10 daily FX
  release: `DEXUSEU` (EUR/USD), `DEXJPUS` (USD/JPY), `DEXUSUK` (GBP/USD),
  `DEXCAUS` (USD/CAD), `DEXSDUS` (USD/SEK), `DEXSZUS` (USD/CHF).
- **EOD-only honesty:** FRED's H.10 release is itself end-of-day, so "Today
  %"/"5D %" under this formula were EOD-vs-EOD comparisons, never intraday
  — unlike the Yahoo-direct path above, whose level is a live intraday
  quote.

## F7 — Risk / Credit / Vol

- **Cockpit (permanent):** VIX, MOVE, HY OAS (the three levels only).
- **Event mode:** none.
- **Deep/hidden:** VIX (1D Δ), MOVE (1D Δ), HY OAS (1D Δ), IG OAS.
- **Explicitly excluded:** ES; VIX-futures term structure.
- **Relationship default:** neutral on every KPI — no VIX-up-is-bullish-Gold rule or equivalent; this family is a general risk/liquidity gauge, not a Gold-specific signal.
- **Rationale:** Milestone 1C drops the three 1D-delta rows from the face — the levels alone carry the at-a-glance read; deltas are one click away in the drawer.
- **bps clarification:** HY OAS is the only cockpit-visible `bps` value in this family; its unit renders with the same persistent "(0.01%)" micro-caption.

## F8 — Liquidity / Funding

- **Cockpit (permanent):** Reserves (WoW Δ), TGA (Daily Δ), Funding Microstate (rendered quietly when NORMAL).
- **Event mode:** none.
- **Deep/hidden:** Reserves (level), TGA (level), SOFR - IORB, EFFR - IORB (spreads only).
- **Explicitly excluded:** standalone ON RRP, SOFR, EFFR, or IORB *level* fixtures.
- **Relationship default:** neutral on every KPI.
- **Rationale:** Milestone 1C keeps only the two `emphasis: true` deltas (the ones that actually matter for a liquidity read) plus the microstate line on the face; both levels move to the drawer alongside the two spreads that were already deep/hidden.

## F9 — Treasury / Fiscal

- **Cockpit (permanent):** none.
- **Event mode:** Net Marketable Borrowing, Borrowing Est. Revision vs Prior, auction High Yield, Bid-to-Cover, Indirect Bidder Share.
- **Deep/hidden:** none beyond event mode.
- **Explicitly excluded:** a debt-limit/X-date fixture (only appears during an active episode; default mock state has none); WI/tail fixtures (deferred capability).
- **Relationship default:** contextual/neutral by default (no fixed lean — a weak auction can read as either a fiscal/term-premium signal or, in the right context, a flight-from-Treasuries tailwind for Gold).
- **Rationale:** unchanged in Milestone 1C — already calendar/auction-focused only, no cockpit-face fixtures to trim.

## F10 — Flows / Positioning

> **2026-09-01 product-owner override:** F10 is now “Observable Positioning
> & Participation.” Its resting face intentionally exposes separate CFTC
> futures and SPDR GLD ETF channels, plus deterministic participation
> breadth. This supersedes the older two-number resting-face constraint
> below. It adds no combined score and makes no BUY/SELL conclusion.

- **Cockpit (permanent):** Managed Money Net % of OI (headline positioning read), Latest Obs. Δ (ETF flow-direction read, already carrying support/adverse coloring).
- **Event mode:** none.
- **Deep/hidden:** WoW Δ, 156W Percentile, Global ETF Holdings.
- **Explicitly excluded:** raw COT longs/shorts; raw futures open interest; a price+OI quadrant fixture.
- **Relationship default:** neutral on positioning metrics; ETF Latest Obs. Δ is signed by its own value (support when positive, would flip to adverse if the observed flow were negative — the rule is direction-of-flow, not a fixed lean).
- **Rationale:** Milestone 1C keeps exactly one positioning read and one flow read on the face — the two numbers a fast scan actually needs; the supporting context (WoW change, percentile, absolute holdings) is a click away.

## F11 — Gold Options / Vol

- **Cockpit (permanent):** Gold Vol (GVZ), 1D Change, 5D Change.
- **Event mode:** none.
- **Deep/hidden:** none.
- **Explicitly excluded:** skew, term structure, put/call ratio, max pain, GEX.
- **Relationship default:** neutral on every KPI — a vol level says how much movement is priced, not which direction.
- **Rationale:** intentionally tiny. GVZ here is a GLD-options proxy, not true Gold CVOL/skew, because a serious paid data source for Gold options isn't wired into this MVP. Unchanged in Milestone 1C (already minimal).
- **Proxy badge, made data-driven:** `f11-gvz`'s fixture sets
  `proxyFor: "Gold options volatility / true Gold CVOL"` (a new optional
  field on `CanonicalKpi`, see `packages/contracts/src/index.ts`) alongside
  its unchanged `provenance: "observed"` (GVZ itself is genuinely observed
  real CBOE data — it's a proxy for a different metric, not an unobserved
  or estimated one). The frontend's "PROXY" badge in
  `FamilyModule.tsx` renders for ANY KPI whose `proxyFor` is set, generically
  — it no longer hardcodes an `if (kpi.id === "f11-gvz")` check, so a future
  KPI can opt into the same badge purely by setting this field.

## F13 — Events / Catalysts

- **Cockpit (permanent):** Next Events (up to 3), Active Catalyst (or "NONE").
- **Event mode:** n/a — this family *is* the event/catalyst surface.
- **Deep/hidden:** none.
- **Explicitly excluded:** any scalar KPI (`kpis: []` by design).
- **Relationship default:** n/a — carries no numeric Gold-relationship driver of its own; it is scheduling context for the other ten families.
- **Rationale:** `activeCatalyst: null` is the default mock state, deliberately honest about "no genuinely active catalyst right now" rather than fabricating one. Unchanged in Milestone 1C (pure calendar).

---

## Drawer structure (Milestone 1C rewrite)

`FamilyDetailDrawer.tsx` answers, per family, six clearly labeled
questions in this fixed order, followed by a compact secondary footer:

1. **What is this?** — overview copy (`FAMILY_EDUCATION[id].overview`).
2. **Why does it matter for Gold?** — merged mechanism + relationship
   framing (`FAMILY_EDUCATION[id].goldRelationship`), honest about
   regime-dependent families (F5/F7/F8/F9/F11) carrying no fixed
   direction.
3. **What is the current read?** — one interpretive sentence built from
   the designated KPI's canonical `relationship` + `driverSummary`
   (`buildInterpretiveSentence`, same designation rule as the card tint),
   followed by every KPI in the family regardless of `visibility`
   (cockpit + event + deep), grouped by `section`, with
   `consensus`/`previous`/`surprise` and `nextEvents`/`activeCatalyst`
   shown when present.
4. **What would strengthen this signal?** — `FAMILY_EDUCATION[id].strengthens`.
5. **What would weaken or invalidate it?** — `FAMILY_EDUCATION[id].weakens`.
6. **Common mistake / nuance** — `FAMILY_EDUCATION[id].nuances`.

A collapsed, visually secondary **"Data & sources"** footer (native
`<details>`, smaller type throughout) follows the six questions: the
mock-data disclosure, the meaning of every `provenance` tag present in
the family, and the exact `observationAt` / `retrievedAt` / `sourceTag`
for every KPI. This is intentionally not one of the 6 headline
questions, but it was an explicit earlier requirement that has not been
rescinded, so it is kept — just de-emphasized relative to the narrative
sections above it.
## Interface freeze rules: events, intelligence previews, and Knowledge

- F13 Events / Catalysts is the first MARKET / DECISION module at every responsive size. It is one compact strip, contains at most three next events and one active catalyst (or `NONE`), and is not repeated later in the mosaic.
- A cockpit AI read is a presentation excerpt of `currentReadDetailed`. CSS clamps the rendered copy to approximately three lines; application state and API payloads retain the complete detailed interpretation. Opening the KPI reveals the complete read and its adjudication surfaces.
- `KNOWLEDGE / LEARN` is deterministic, versioned, local EN/FR education. It never represents current market conditions and never calls an AI or market provider.
- Every family owns a stable product-metadata route `/knowledge/[slug]`. Important KPI metadata adds an exact section fragment. These links are frontend navigation metadata, not market-data or intelligence-backend fields.
- Epistemic boundary: Knowledge explains timeless mechanics; KPI AI READ explains what a KPI means now, with evidence, contradictions, uncertainty, alternatives, and invalidation criteria.
