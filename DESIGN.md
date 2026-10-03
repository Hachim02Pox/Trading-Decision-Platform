---
version: alpha
name: zenith-terminal-design-system
description: >
  Visual design system for a personal GOLD / macro trading terminal.
  Dense, information-first, dark-only. Borrows visual discipline from
  Linear (surface ladder, hairline borders, restrained typography,
  minimal decoration) but replaces its identity entirely: no lavender,
  no marketing layouts, no SaaS card sizing. The chromatic system is
  built around a single scarce gold brand accent plus a strict,
  function-coded palette for market-relationship, market-state,
  quality, freshness, and event signaling, each visually distinct
  from the others by color, shape, and icon, never by color alone.

tokens:
  color:
    canvas: "#0a0d12"
    surface-1: "#10141b"
    surface-2: "#141922"
    surface-3: "#1a212c"
    surface-inset: "#05070a"
    hairline: "#212833"
    hairline-strong: "#2c3644"
    hairline-focus: "rgba(212,162,86,0.55)"
    text-primary: "#e8ecf1"
    text-secondary: "#aab2bf"
    text-tertiary: "#737c8a"
    text-disabled: "#4a515c"
    gold: "#d4a256"
    gold-bright: "#e8c076"
    gold-fill: "rgba(212,162,86,0.10)"
    support: "#3fae7a"
    support-fill: "rgba(63,174,122,0.10)"
    adverse: "#c15f56"
    adverse-fill: "rgba(193,95,86,0.10)"
    kpi-neutral: "#6b7684"
    kpi-neutral-fill: "rgba(107,118,132,0.10)"
    relationship-supportive: "#3fae7a"
    relationship-supportive-fill: "rgba(63,174,122,0.10)"
    relationship-adverse: "#c15f56"
    relationship-adverse-fill: "rgba(193,95,86,0.10)"
    relationship-contextual: "#c9b458"
    relationship-contextual-fill: "rgba(201,180,88,0.10)"
    state-blue: "#5b8ec9"
    state-blue-fill: "rgba(91,142,201,0.10)"
    warn: "#d99a4e"
    warn-fill: "rgba(217,154,78,0.10)"
    fresh: "#4fb8b0"
    fresh-fill: "rgba(79,184,176,0.10)"
    event: "#9081c9"
    event-fill: "rgba(144,129,201,0.10)"
    error: "#e5484d"
    error-fill: "rgba(229,72,77,0.10)"
  typography:
    kpi-hero: { family: mono, size: 32px, weight: 600, lineHeight: 1.1, tabular: true }
    kpi-primary: { family: mono, size: 22px, weight: 600, lineHeight: 1.15, tabular: true }
    kpi-secondary: { family: mono, size: 16px, weight: 500, lineHeight: 1.2, tabular: true }
    mono-data: { family: mono, size: 13px, weight: 400, lineHeight: 1.4, tabular: true }
    mono-micro: { family: mono, size: 10.5px, weight: 400, lineHeight: 1.4, tabular: true }
    page-title: { family: sans, size: 20px, weight: 600, lineHeight: 1.25, tracking: -0.2px }
    module-title: { family: sans, size: 12.5px, weight: 600, lineHeight: 1.2, tracking: 0.04em, transform: uppercase }
    body: { family: sans, size: 13px, weight: 400, lineHeight: 1.55 }
    body-sm: { family: sans, size: 12px, weight: 400, lineHeight: 1.5 }
    label: { family: sans, size: 11px, weight: 500, lineHeight: 1.3, tracking: 0.06em, transform: uppercase }
    caption: { family: sans, size: 11px, weight: 400, lineHeight: 1.4 }
    button: { family: sans, size: 12.5px, weight: 500, lineHeight: 1.2 }
  radius:
    control: 4px
    module: 6px
    popover: 8px
    pill: 9999px
  spacing:
    xxs: 2px
    xs: 4px
    sm: 8px
    md: 12px
    lg: 16px
    xl: 20px
    xxl: 24px
    xxxl: 32px
---

## 0. Identity (2026-09-09 rebrand)

The product is **Zenith Terminal** (was "Gold Terminal" — renamed so the identity isn't locked to a single asset class if other markets, e.g. Nasdaq, get added later). Only the user-facing name changed: internal package names (`@gold-terminal/contracts`, `@gold-terminal/backend`, `@gold-terminal/frontend`) are unchanged — that's npm-workspace plumbing, not branding, and renaming it would touch every import across the monorepo for zero user-visible benefit.

**Mark:** a rotating gyroscope / armillary-sphere (three concentric rings on a compound 3D axis, 12s linear rotation), with the owner's name woven as a subtle `H · A · C · H · I · M ·` textPath on the equatorial ring — personal without being a literal name badge. Implementation: `apps/frontend/src/components/brand/GyroscopeMark.tsx`. Full spec: `design_handoff_logo/README.md`. The name stays in the mark deliberately; only the spoken/written product name changed to Zenith.

**Navigation:** moved from the vertical left rail (Section 12 below, as it now reads) to a horizontal top bar — see Section 12 for the current spec and Section 22 for the animation tier this introduced.

## 1. Design Philosophy

This is a terminal, not a marketing surface. Every decision below is
subordinate to one test: **does this make a trader faster or more
accurate at reading the market right now?** If a pattern makes the UI
prettier but slower to scan, it is wrong for this product.

Four working principles carry the whole system:

1. **Information first.** Data density and legibility outrank visual
   flourish. A module earns rounded corners and padding only insofar
   as they help the eye separate one instrument from another, never
   for decoration.
2. **Dense but readable.** The terminal packs many variables on
   screen without becoming a wall of noise. Density is achieved
   through disciplined typography and spacing, not by shrinking
   everything uniformly. Hierarchy is what keeps density from
   becoming clutter.
3. **Visual weight follows tactical importance.** Gold/XAUUSD, real
   yields, Fed repricing, USD, live catalysts, and volatility are
   drawn larger and placed higher. Everything structural (settings,
   navigation chrome, metadata) is quiet by construction.
4. **Color is a function, never a mood.** Every hue in this system is
   assigned to exactly one job. None of them are decorative, and
   green/red are explicitly never a trade signal (see Section 2).

**What we borrow from Linear:** the surface ladder instead of drop
shadows, hairline borders as the primary separator, restrained corner
radii, negative-space discipline, and the idea that one interface can
carry a single scarce accent color used only for brand and focus.

**What we do not borrow:** the lavender hue, the marketing layout
grammar (hero sections, feature-card thirds, testimonial rows), large
display type, and generous whitespace tuned for persuasion rather
than for scanning. A trading terminal is read in seconds under
pressure. Linear's pages are read once, slowly, to be convinced.

## 2. Color System

### 2.1 The two color families, and why they must never merge

The system deliberately keeps **market-relationship color** and
**system-state color** in separate families with separate shapes, so
a trader can never mistake "this metric mechanically favors gold" for
"the app is telling you to buy."

**Family A - KPI relationship (mechanical, not directional advice)**

| Token | Hex | Meaning | Never means |
|---|---|---|---|
| `support` / `relationship-supportive` | `#3fae7a` | This variable is currently mechanically **supportive** for gold (e.g. falling real yields, weaker USD, dovish repricing) | Buy |
| `adverse` / `relationship-adverse` | `#c15f56` | This variable is currently mechanically **adverse** for gold | Sell |
| `relationship-contextual` | `#c9b458` | Contextual / no clear mechanical lean — a KPI-relationship read whose direction comes from context (mock AI, for now) rather than a fixed rule | Hold |

`relationship-contextual` supersedes `kpi-neutral` for **relationship
state specifically** (Milestone 1C, a deliberate product-owner update —
see the note at the end of this section). `kpi-neutral` remains a valid,
unrelated token still used elsewhere in the system (e.g. `FreshnessDot`'s
`"unavailable"` dashed-outline treatment, Section 18) — it is simply no
longer used to render KPI relationship state anywhere.

These three relationship colors appear **only** on KPI tiles, relationship
indicators, and driver breakdowns, always paired with a plain-language
label ("Supportive", "Adverse", "Contextual") so color is reinforcement,
never the sole signal.

> **Milestone 1C note — `relationship-contextual` vs. `warn`:** both read
> as "yellow-ish" at a glance, but they are different taxonomies (Gold
> relationship vs. data quality) and must render as visibly different hues
> side by side — `relationship-contextual` (`#c9b458`, muted olive-yellow)
> is never the same hex as `warn` (`#d99a4e`, orange-amber), and neither
> token is ever reused across the two taxonomies. This is an explicit,
> approved deviation from the pre-Milestone-1C "neutral = gray" reading —
> see `docs/MVP_COCKPIT_CONTRACT.md` for the historical note it supersedes.

**Family B - system state (four independent taxonomies, Section 17)**

| Token | Hex | Taxonomy |
|---|---|---|
| `state-blue` | `#5b8ec9` | Market state (trending / ranging / risk-on / risk-off) |
| `warn` | `#d99a4e` | Quality warning (data integrity, model confidence) |
| `fresh` | `#4fb8b0` | Data / research update (something changed, arrived, refreshed) |
| `event` | `#9081c9` | Event / catalyst (scheduled, time-bound) |
| `error` | `#e5484d` | System failure (feed down, connection lost, pipeline broken) |

`error` is intentionally a different red from `adverse`. "Gold is
mechanically under pressure" and "your data feed just died" must never
look the same. If both a KPI and the system throw red at once, the
distinct hue and the distinct shape (Section 17) keep them legible as
separate facts.

### 2.2 Brand accent - gold, and only gold

| Token | Hex | Use |
|---|---|---|
| `gold` | `#d4a256` | Brand mark, active nav indicator, focus ring, the literal XAUUSD price series on charts, primary button fill |
| `gold-bright` | `#e8c076` | Hover/pressed state of gold elements, emphasized inline values |
| `gold-fill` | `rgba(212,162,86,.10)` | Low-opacity background wash behind an active/selected module or nav item |

Gold is scarce by rule, exactly as Linear rations lavender, but its
job here is doubled: it is both the brand accent **and** the literal
color of the instrument the entire product is built around. That
overlap is intentional and the one deliberate exception to "color is
function, not decoration" - the gold hue on a price chart is data,
not branding, even though it happens to share the token.

**Never** use `gold` as a supportive/bullish signal color. A trader
must not learn to read "gold-colored highlight" as "this favors going
long." Gold marks *identity and selection*, never *direction*.

### 2.3 Surfaces

| Token | Hex | Use |
|---|---|---|
| `canvas` | `#0a0d12` | App background |
| `surface-1` | `#10141b` | Default module/card background |
| `surface-2` | `#141922` | Nested content within a module, hover state |
| `surface-3` | `#1a212c` | Popovers, dropdowns, tooltips, command palette |
| `surface-inset` | `#05070a` | Recessed wells: inputs, code/log panels, chart plot area |

Four steps up from canvas plus one recessed step down. No pure black,
no pure white anywhere in the system.

### 2.4 Text

| Token | Hex | Use |
|---|---|---|
| `text-primary` | `#e8ecf1` | Headlines, primary values, table body |
| `text-secondary` | `#aab2bf` | Labels, secondary descriptions |
| `text-tertiary` | `#737c8a` | Metadata, timestamps, disabled-adjacent text |
| `text-disabled` | `#4a515c` | Disabled controls only |

## 3. Backgrounds and Surfaces

- The canvas is a near-black charcoal with a faint cool undertone,
  never a lavender-blue tint and never a warm sepia tint. It exists to
  disappear.
- Hierarchy is carried entirely by the surface ladder plus hairline
  borders, never by drop shadows. Shadows are reserved for the single
  case of a floating layer above the flow of the page (Section 11).
- A module's background never changes to signal state. State lives in
  badges, borders-on-badges, and text color inside the module, not in
  the module's own fill. A module that turns red because one metric
  inside it is adverse is a false alarm generator; do not do it.
- The recessed `surface-inset` token exists specifically for chart
  plot areas, log/console panels, and text inputs, so that "you are
  looking into a well of raw data" reads differently from "you are
  looking at a summarizing card."

## 4. Typography

### 4.1 Family

- **UI / display:** IBM Plex Sans, falling back to `Inter,
  -apple-system, Segoe UI, Roboto, system-ui, sans-serif`.
- **Numerals / data:** IBM Plex Mono, falling back to `"JetBrains
  Mono", "SF Mono", Menlo, ui-monospace, monospace`.

Both families share the Plex superfamily, so the UI voice and the data
voice read as one coherent system while remaining visually distinct at
a glance - proportional sans for words, monospace for numbers, always.
No serif anywhere in the system. A trading terminal is read for facts
under time pressure; a serif's stylistic signal (editorial, luxury,
literary) fights that job.

### 4.2 Hierarchy

| Token | Size | Weight | Family | Use |
|---|---|---|---|---|
| `kpi-hero` | 32px | 600 | mono | The single most important number on the active view (e.g. XAUUSD last price) |
| `kpi-primary` | 22px | 600 | mono | Tactical-tier metrics: real yields, DXY, Fed-implied rate path |
| `kpi-secondary` | 16px | 500 | mono | Secondary metrics inside a module |
| `page-title` | 20px | 600 | sans | Top-level view title (Market / Chart / Execution...) |
| `module-title` | 12.5px | 600 | sans, uppercase, +0.04em | Module/card header label |
| `body` | 13px | 400 | sans | Narrative text, commentary, journal entries |
| `body-sm` | 12px | 400 | sans | Secondary descriptions |
| `label` | 11px | 500 | sans, uppercase, +0.06em | Field labels, table column headers |
| `caption` | 11px | 400 | sans | Timestamps, footnotes, freshness text |
| `mono-data` | 13px | 400 | mono | Table cell values, inline data points |
| `mono-micro` | 10.5px | 400 | mono | Dense ancillary numeric annotation |
| `button` | 12.5px | 500 | sans | Control labels |

Nothing in this system exceeds 32px. This is not a marketing page;
the largest element on screen is a price, not a headline.

### 4.3 Principles

- Weight and color carry hierarchy more than size does. Two metrics of
  the same size can be told apart by `text-primary` vs `text-tertiary`
  faster than by a few extra pixels.
- Uppercase + wide tracking is reserved for structural labels
  (`module-title`, `label`) so it reads as taxonomy, never as
  emphasis on a sentence.
- No italics for emphasis in body copy. Italics are reserved for
  marking `ESTIMATED / MODEL` values (Section 19) - a deliberate,
  narrow, functional use.

## 5. Numeric Typography

Numbers are the product. These rules are non-negotiable.

- **All numeric data is set in the monospace family with tabular
  (lining) figures.** Proportional numerals are never used for prices,
  rates, percentages, or counts, anywhere in the app.
- **Decimals are fixed-width per instrument class**, not
  variable-precision: XAUUSD prices always show 2 decimals
  (`3,342.18`), yields always show 3 decimals (`4.287%`), DXY always 2
  (`104.62`). A column never mixes decimal counts row to row.
- **Right-align all numeric table columns.** Left-align only text
  columns (instrument name, label).
- **Thousands separators** use a thin, locale-appropriate comma
  (`3,342.18`), never a space or period substitution, so the decimal
  point stays the single most reliable landmark in a column of prices.
- **Signed values always show their sign explicitly** (`+0.42%`,
  `-1.15%`), even for positive numbers, so the eye never has to infer
  direction from the absence of a minus.
- **Positive/negative color** uses `support`/`adverse` on the KPI
  driver surfaces described in Section 2.1, but on raw price-change
  cells in a table (which are not a "mechanical relationship" claim,
  just arithmetic), use a neutral pair instead:
  `text-primary` for the value and a small `support`/`adverse`
  triangle glyph, so directional color-only cells never accidentally
  read as investment advice.
- **Units are always explicit and de-emphasized**: `%`, `bps`, `pips`,
  `oz`, `USD` render in `text-tertiary` immediately after the value,
  never assumed from column context alone in a screenshot or export.
- **Timestamps use 24-hour UTC as the default, with local time in
  parentheses** in `mono-micro`: `14:32 UTC (10:32 ET)`. Every
  timestamp on screen must be traceable to freshness rules (Section
  18).
- **Never truncate a number with an ellipsis.** If a column is too
  narrow, abbreviate the unit (`1.2M` not `1,234,5...`), never cut
  digits silently.

## 6. Spacing Scale

Base unit 4px, capped well below marketing scale because this product
lives at high visual density (cockpit-leaning, not art-gallery):

| Token | Value | Use |
|---|---|---|
| `xxs` | 2px | Icon-to-label gap, tight inline spacing |
| `xs` | 4px | Between a label and its value |
| `sm` | 8px | Between rows inside a module |
| `md` | 12px | Module interior padding (compact density) |
| `lg` | 16px | Module interior padding (standard density) |
| `xl` | 20px | Gap between modules in a mosaic row |
| `xxl` | 24px | Gap between major page zones |
| `xxxl` | 32px | Outer page margin on wide viewports |

There is no marketing-scale "section" token (96px). This product
never needs a gap that large; that much whitespace on a terminal reads
as "the data failed to load."

## 7. Grid and Layout

### 7.1 App shell

```
+----------------------------------------------------------+
|  Top nav: mark + wordmark . MARKET . CHART . EXECUTION ...|
+----------------------------------------------------------+
|  Status bar: market state . freshness . clock             |
+----------------------------------------------------------+
|                                                            |
|              Main content (mosaic grid)                   |
|                                                            |
+----------------------------------------------------------+
```

- Top nav bar is persistent and full-width, 56px tall. It never
  overlays content and never disappears on desktop (Section 12).
- The status bar is a single 40px row: current market state badge,
  overall data-freshness indicator, session clock (UTC + local),
  connection status. It is structural chrome - quiet typography
  (`caption`/`label`), no gold, no large numbers.
- Main content uses **CSS Grid**, never flex-percentage math, so
  mosaic tile spans are explicit (`grid-column: span 2`), not
  calculated.

### 7.2 Mosaic grid

A 12-column grid at desktop widths. Modules declare a span based on
tactical importance (Section 7.3), not on a fixed 3-up/4-up template:

- **Hero tile** (XAUUSD price, primary chart snapshot): spans 6-8
  columns, 2 rows tall.
- **Tactical tiles** (real yields, DXY, Fed pricing, volatility):
  span 3-4 columns, 1-2 rows.
- **Secondary tiles** (correlated markets, secondary metrics): span
  2-3 columns, 1 row.
- **Structural tiles** (settings summary, data-source status): span
  2 columns, 1 row, pushed to the bottom or a side rail.
- **Full-width rows** (catalyst timeline, news ticker, journal
  recent-entries): span all 12 columns, fixed height.

### 7.3 Container and margins

- Max content width is fluid up to `2560px` (this is a multi-monitor
  tool); at `> 1920px` the grid gains an additional secondary-tile
  column rather than growing whitespace.
- Outer page margin: `xxxl` (32px) at desktop, `lg` (16px) below
  1024px.

## 8. Card / Module Anatomy

A module is a terminal instrument, not a marketing card.

```
+ module -----------------------------------+
| MODULE TITLE           [freshness dot]    |  <- module-title, label row
| ------------------------------------------ |  <- hairline, optional
|  32.18   +0.42%  ^                         |  <- kpi value + signed delta
|  Real yield -3bp . USD -0.1%               |  <- body-sm driver summary
|                                             |
|  [support] [adverse] [neutral] chips       |  <- relationship chips row
+---------------------------------------------+
```

- **Header row:** `module-title` left, a single freshness/state
  indicator right (never more than one glyph in the header - extra
  status lives in the body).
- **Primary value zone:** the KPI number at the size appropriate to
  its tier (Section 4.2), with its signed delta immediately beside it.
- **Driver/context zone:** one line of `body-sm` explaining *why*,
  when applicable. This is what separates a terminal module from a
  bare stat tile: the module shows the mechanism, not just the
  number.
- **Footer zone (optional):** relationship chips, mini-sparkline, or a
  "last updated" caption.
- Interior padding: `lg` (16px) standard density, `md` (12px) compact
  density (Section 20). Padding never scales with the module's
  importance tier - a hero tile is bigger because its grid span and
  type scale are bigger, not because it has more air around it.

**Locked pattern (Milestone 1D): resting KPI-cell composition stays this
concise.** A cockpit KPI cell's resting face is exactly LABEL / VALUE /
COLOR (the relationship treatment) / one short AI-read line — nothing
more verbose than that ever belongs on the face. Meeting distributions,
multi-line explainers, sparklines, and detailed causal reasoning belong in
the drawer or KPI detail view, never on the resting card. F3's Milestone
1D compaction (Target / Next / Probability — three label:value lines,
replacing a denser two-paragraph "Most likely / Cut odds · Hold odds"
block) is the canonical example: detail belongs in the drawer, not the
face. When trimming a family's cockpit face, move the removed content to
`visibility: "deep"` or `"event"` rather than deleting it.

## 9. Borders

- Every module, input, popover, and table uses a **1px hairline**
  border in `hairline` (`#212833`). Nothing heavier by default.
- `hairline-strong` (`#2c3644`) is used only for: the active/selected
  state of a selectable module, and header/footer dividing rules
  inside a module.
- Borders never carry semantic color except on badges and relationship
  chips (Sections 2 and 17), where a colored 1px border is
  the *primary* way that chip communicates its family, paired with a
  matching low-opacity fill.
- No double borders, no border on top of a shadow. Pick one separator
  method per surface.

## 10. Radii

One scale, three assigned uses, no exceptions:

| Token | Value | Applies to |
|---|---|---|
| `control` | 4px | Buttons, inputs, checkboxes, small icon buttons |
| `module` | 6px | Cards, modules, tables, popover containers, tooltips |
| `pill` | full | Status badges and relationship chips only |

Pill radius is reserved exclusively for the state/badge system so that
"this is a status indicator" is recognizable by shape alone before the
color is even parsed. Nothing else on the page is pill-shaped: not
buttons, not tabs, not search inputs.

## 11. Shadows

The system is built on the surface ladder, not elevation shadows.
Shadows exist in exactly one context: **floating layers that break out
of document flow** - dropdown menus, the command palette, tooltips,
and modal dialogs.

```
--shadow-float: 0 8px 24px rgba(0,0,0,0.45), 0 1px 0 rgba(255,255,255,0.03) inset;
```

Everything else (modules in the mosaic grid, table rows, nav items)
uses `surface-2`/`surface-3` plus a hairline border for lift. A module
sitting in the normal page flow never has a drop shadow.

## 12. Navigation

- **Structure:** MARKET / DECISION, CHART, EXECUTION, NEWS / RESEARCH,
  JOURNAL / HISTORY, KNOWLEDGE / LEARN, SETTINGS - seven top-level
  destinations, fixed order, no reordering by the user (this is a
  personal terminal, not a customizable SaaS shell).
- **Form (2026-09-09 rebrand — supersedes the earlier vertical-rail
  spec):** a horizontal top bar, 56px tall, full width, `surface-1`
  background with a `hairline` bottom border. The brand mark
  (`GyroscopeMark`, Section 0) plus wordmark sit at the left; tabs
  follow directly after, text-only (no icon set is wired up in this
  codebase — see the note this decision replaces below). Chosen over
  the vertical rail specifically to free horizontal width for data and
  because it takes the nav-tab animation in Section 22 better than a
  rail ever could.
- **Active/hover state:** a `gold` 2px underline that slides in from
  the left on hover (`transform: scaleX`, 250ms) with a soft glow
  (`box-shadow` in the gold token, never a gradient), the label lifting
  1px and shifting to `gold-bright`. The active tab holds the same
  underline permanently, `text-primary` label. See Section 22 for the
  full animation spec and the reduced-motion fallback.
- **Unread/update indicator:** a small `fresh`-colored dot on a nav
  item (e.g. NEWS / RESEARCH) means new research has landed there
  since last visit. This reuses the freshness family precisely because
  it is a freshness fact, not a new taxonomy.
- **Height/footprint:** the bar is fixed-height and always visible on
  desktop; on narrow viewports the tab row scrolls horizontally rather
  than wrapping or collapsing to icons (Section 21).

## 13. Tables

Tables are the backbone of Execution, Journal, and Research views.

- **Row height:** 32px standard density, 26px compact density
  (Section 20). No card-per-row treatment; rows are the unit.
- **Header:** `label` typography, `surface-2` background, single
  `hairline-strong` bottom rule. Sticky on scroll.
- **Row separators:** a single `hairline` bottom rule per row. Never
  border-top and border-bottom on the same row (doubles the visual
  weight for no gain). Dense tables (>15 rows) may drop row rules
  entirely in favor of a subtle background alternation between
  `surface-1` and `surface-2`, whichever reads better at the given
  content density - pick one, not both.
- **Numeric columns:** right-aligned, `mono-data`, tabular figures
  (Section 5).
- **Text columns:** left-aligned, `body-sm`.
- **Row hover:** `surface-2` background, no border change.
- **Row selection:** `gold-fill` background wash + `hairline-strong`
  border, reusing the same selection language as an active nav item.
- **Sort indicator:** a small chevron glyph beside the active column
  header, `text-primary`; inactive columns show no chevron until
  hovered (`text-tertiary` chevron on hover as an affordance hint).
- **Long lists (>~10 rows) get grouping, not infinite scroll alone:**
  group by session, by date, or by instrument with a sticky group
  label row (`label` typography on `surface-2`), so scanning 40 trade
  journal rows doesn't become an undifferentiated scroll.

## 14. Charts

- **Plot background:** `surface-inset`, distinguishing "you are inside
  the raw data" from the surrounding module chrome.
- **Gridlines:** `hairline`, never brighter than the chart's own data
  lines.
- **Primary series (XAUUSD):** `gold`. This is the one place gold is
  used as data rather than brand, and it is a deliberate, singular
  exception - no other series on the same chart may use gold.
- **Overlay series** (DXY, real yields, etc. plotted against price):
  use `state-blue` and `text-secondary`-toned lines, never
  `support`/`adverse`, so an overlay is never misread as a directional
  call.
- **Event markers on the time axis:** small `event`-colored vertical
  ticks with a hover tooltip; never a full-height colored band that
  would compete with the price line.
- **Crosshair and tooltip:** `mono-data` numerals, `surface-3`
  background, `hairline-strong` border, follows the shadow rule in
  Section 11 since it's a floating layer.
- **No gradient fills under lines** beyond a single flat 4-6% opacity
  wash in the series' own color, used only to anchor the line to the
  zero/baseline, never a decorative multi-stop gradient.
- **No 3D, no bevels, no candlestick borders thicker than 1px.**
  Candle bodies use `support`/`adverse` fills at full opacity with a
  matching 1px border one step darker; wicks are `hairline-strong`.

## 15. Buttons and Controls

Primary actions are rare in a terminal; most controls are secondary or
segmented toggles.

| Variant | Background | Text | Border | Use |
|---|---|---|---|---|
| Primary | `gold` | `#0a0d12` (canvas, for contrast) | none | Singular committing actions: save journal entry, confirm order note. At most one per view. |
| Secondary | `surface-2` | `text-primary` | `hairline` | Default action button |
| Ghost | transparent | `text-secondary` | none | Tertiary/inline actions |
| Icon button | transparent -> `surface-2` on hover | `text-secondary` -> `text-primary` | none | Toolbar actions |
| Segmented control | `surface-1` track, `surface-3` active pill | `text-secondary` / `text-primary` active | `hairline` on track | Timeframe toggles (1H / 4H / 1D / 1W), density toggle |

- All buttons use `control` radius (4px), `button` typography, 4.5:1
  minimum text contrast against their fill.
- Active/pressed state: no faux-physical push affordance is used here
  (not needed in a data tool); instead use a simple background shift
  one step darker plus a 1px inset highlight, consistent with the
  flat, instrument-panel feel.
- Segmented controls, not pill toggles, for mutually exclusive choices
  like timeframe, since pill shape is reserved for status badges
  (Section 10).

## 16. Forms

- Label above input, always. No placeholder-as-label.
- Inputs sit on `surface-inset`, `control` radius, `hairline` border,
  `hairline-focus` (gold-tinted) 2px ring on focus.
- Numeric inputs use `mono-data` typography and right-align, matching
  table conventions, so a field like "Stop loss (USD)" visually
  matches the price it corresponds to elsewhere on screen.
- Helper text: `caption`, `text-tertiary`, present in the layout even
  when empty (reserve the line) so validation errors don't cause
  layout shift.
- Error text: `caption`, `error` color, appears below the field with a
  small inline icon, never a toast for a form-level validation issue.
- Every form control passes WCAG AA contrast against `surface-inset`,
  audited individually since inset wells are darker than standard
  module surfaces.

## 17. Badges and State Language (the four taxonomies)

This is the most important section to get right per the product brief:
four concepts that must never visually collapse into one generic pill.
Each gets its own color, its own shape convention, and its own icon,
so any two can appear side by side without ambiguity.

| Taxonomy | Color | Shape | Icon | Example |
|---|---|---|---|---|
| **Market state** | `state-blue` | Rectangular chip, `pill` radius, solid `state-blue-fill` | Trend/regime glyph (e.g. wave icon) | `RISK-OFF`, `TRENDING`, `RANGE-BOUND` |
| **Quality warning** | `warn` | Rectangular chip with a triangular icon prefix | Warning triangle | `LOW CONFIDENCE`, `PARTIAL DATA` |
| **Data / research update** | `fresh` | Small solid dot, no chip body, placed at the corner of a module or nav item | Dot only (no icon glyph needed, the dot form itself is the code) | Unread research note indicator |
| **Event / catalyst** | `event` | Rectangular chip, square (`module` radius, not pill), always paired with a countdown in `mono-micro` | Calendar glyph | `FOMC . 2H 14M`, `NFP . TOMORROW 13:30 UTC` |

Rules that keep them from collapsing:

- **Only market-state and quality-warning use the pill/rounded chip
  form**, and they are never the same color, so even confused at a
  glance by shape they resolve by hue.
- **Event badges are square-cornered**, not pill-shaped, specifically
  so a catalyst never gets mistaken for a market-state read at a
  glance during fast scanning.
- **Freshness is a dot, never a chip.** A dot cannot be confused with
  a labeled state because it carries no text of its own; it always
  sits adjacent to a timestamp (Section 18) that spells out what it
  means.
- No taxonomy ever reuses `support`, `adverse`, or `gold` - those
  three are reserved entirely for Family A (Section 2.1) and brand.

## 18. Freshness Indicators

Every data-derived value on screen must be traceable to how old it is.

| State | Dot | Caption treatment | Threshold |
|---|---|---|---|
| Live | Solid `fresh` dot, subtle 2s pulse | `text-secondary`, "Live" | < 10s old, streaming |
| Fresh | Solid `fresh` dot, static | `text-secondary`, "Xs ago" / "Xm ago" | < 5 min old |
| Aging | Outline `warn` dot | `warn`, "Xm ago" | 5-60 min old |
| Stale | Outline `error` dot, value dims to 70% opacity | `error`, "Stale . Xh ago" | > 60 min old, or past the source's expected refresh SLA |
| Model / estimated | Dashed-outline `kpi-neutral` dot | `text-tertiary` italic, "Modeled" | Value is not a direct feed read (see Section 19) |

- The pulse animation on "Live" is the only permitted looping
  animation among the freshness/data indicators, capped at low
  amplitude, and must collapse to a static dot under
  `prefers-reduced-motion`. (The brand mark's rotation, Section 22, is
  a separate, deliberate exception scoped to identity, not data.)
- Freshness dots never use `support`/`adverse`/`gold`/`state-blue`/
  `event` - freshness is its own closed color loop (`fresh` ->
  `warn` -> `error` -> neutral-dashed) so it can never be misread as a
  market call.
- A module whose *primary* KPI is stale gets a single `caption`-sized
  stale banner at the top of the module body, not a change to the
  module's border or background (Section 3).

## 19. Data Provenance (Observed / Derived / Estimated / AI)

The brief requires distinguishing four evidentiary tiers without
adding visual noise. This is solved typographically, not chromatically
- no new colors are introduced for this axis.

| Tier | Treatment | Example |
|---|---|---|
| **Observed** | Default. No marker. This is the implicit assumption for any value on screen. | `3,342.18` |
| **Derived** | A small superscript `f` glyph in `text-tertiary` immediately after the value; tooltip on hover names the calculation. | `4.29%[f]` |
| **Estimated / model** | Value prefixed with `~`, set in italic mono, `text-tertiary`; paired with the dashed "Modeled" freshness dot (Section 18) when relevant. | `~2.1 sigma` |
| **AI interpretation** | A distinct small chip, square corners, `kpi-neutral` colored (deliberately gray, never green/red/gold, so it cannot imply a directional stance), reading `AI READ`, always adjacent to a one-line rationale shown on hover/expand. | `AI READ: Dovish repricing outweighs USD strength` |

AI interpretation is the one tier that gets a visible chip rather than
inline typography, because it is the tier most likely to be mistaken
for a fact if it isn't flagged assertively. It is intentionally
colored the same neutral gray as `kpi-neutral` so its presence never
piggybacks credibility off the support/adverse system.

## 20. Density

Two density modes, user-toggleable in Settings, applied globally:

| | Standard | Compact |
|---|---|---|
| Table row height | 32px | 26px |
| Module padding | `lg` 16px | `md` 12px |
| Module title to body gap | `sm` 8px | `xs` 4px |
| Default | Yes | No |

Density never changes type size below the floor set in Section 4
(11px minimum for any text, 10.5px for `mono-micro` only) - density is
a spacing lever, never a legibility lever.

## 21. Responsive Behavior

This is a desktop-first, multi-monitor professional tool. Mobile is a
secondary read-only companion, not a design target for full
functionality.

| Breakpoint | Width | Behavior |
|---|---|---|
| Ultra-wide | > 1920px | Grid gains an extra secondary-tile column; nav rail stays expanded by default |
| Desktop | 1280-1920px | Default mosaic layout as specified in Section 7 |
| Laptop | 1024-1280px | Secondary tiles reflow from 3-up to 2-up; top nav wordmark stays, tab row scrolls horizontally if it overflows |
| Tablet | 768-1024px | Mosaic collapses to a single scrolling column ordered by tactical priority (hero tile first, structural tiles last); top nav bar stays fixed at the top |
| Mobile | < 768px | Read-only "glance" view: hero KPI, market-state badge, active catalysts, and freshness only. Execution and Journal entry are unavailable; a "Open on desktop" notice replaces them. |

Every multi-column module declares its own `< 768px` fallback; there
is no assumption that Grid "just handles it."

## 22. Motion and Animation

Motion is functional signaling, not atmosphere. This product runs at
low motion intensity precisely because a terminal's job is to hold
still so the data can move.

Permitted motion, each with a stated purpose:

- **Value flash on update:** when a KPI value changes, its background
  flashes `support-fill`/`adverse-fill` for 400ms and fades out.
  Purpose: draw the eye to what just moved, exactly once.
- **Live pulse dot:** described in Section 18. Purpose: distinguish
  streaming data from a static read at a glance.
- **Panel expand/collapse:** 150-200ms ease for accordions
  (scenario detail, journal entry expand). Purpose: preserve spatial
  continuity when content height changes.
- **Skeleton shimmer on load:** matches the final module's shape
  exactly (Section 24). Purpose: communicate "this specific number is
  coming," not generic loading.
- **Top nav tab hover/active** (2026-09-09 rebrand addition, Section
  12): a `gold` underline slides in (`scaleX`, 250ms cubic-bezier) with
  a low-opacity glow in the same gold token, and the label lifts 1px
  and shifts to `gold-bright` (`color`/`transform`, 200ms ease).
  Purpose: give the primary navigation surface presence without
  touching the "hold still" rule anywhere else in the system — this is
  the one nav-chrome exception, not a general license for more motion
  elsewhere. Respects `prefers-reduced-motion` (collapses to an instant
  color/underline state change).
- **Brand mark rotation** (`GyroscopeMark`, Section 0): a continuous
  12s linear 3D rotation on the top-nav/login mark only. This is a
  brand element, not a data signal, so it is exempt from "motion only
  signals something changed" — but it still respects
  `prefers-reduced-motion` (freezes to a static pose) like every other
  looping animation in this system.

Banned outright: parallax, scroll-hijacking, decorative gradient
animation, infinite marquees, magnetic cursor effects, any animation
whose purpose can't be stated in one sentence. All motion above the
"flash"/"pulse" tier respects `prefers-reduced-motion` and collapses
to an instant state change.

## 23. Accessibility

- **Contrast:** WCAG AA minimum (4.5:1 body text, 3:1 large text/KPI
  numerals) for every text/background pairing in this document,
  including badge text against its fill, audited per badge family
  since low-opacity fills are the riskiest case.
- **Color is never the only carrier of meaning.** Every colored state
  (support/adverse/warn/fresh/event/error) is paired with a text label
  or a distinct icon/shape, per Sections 17-19, so the system remains
  legible to color-blind users.
- **Focus states:** every interactive element gets a visible
  `hairline-focus` (gold-tinted) 2px ring. Never remove focus outlines
  without a replacement.
- **Keyboard access:** nav rail, table rows, and command palette are
  fully keyboard-navigable; sort/select/expand all have keyboard
  equivalents.
- **Reduced motion:** respected everywhere per Section 22.
- **Numeric legibility:** tabular figures and consistent decimal
  widths (Section 5) are themselves an accessibility feature for
  fast, low-error scanning under time pressure.

## 24. Empty, Loading, Error, and Stale States

Every module must define all four, not just its happy path.

- **Loading:** a skeleton shaped exactly like the module's populated
  state (same grid of gray blocks matching KPI/label/chip positions),
  shimmering at low amplitude, respecting reduced motion.
- **Empty:** for modules with genuinely no data yet (e.g. Journal with
  no entries), show a one-line instruction in `body-sm`
  `text-secondary` plus a single secondary-button action, never a
  blank card.
- **Error:** `error`-colored inline icon + one-line message in
  `body-sm` + a "Retry" ghost button. Errors are contextual to the
  module that failed; they never take over the whole page unless every
  module failed (i.e. the feed connection itself is down, shown in the
  status bar).
- **Stale:** per Section 18, a `caption`-sized banner at the top of
  the affected module body, plus dimmed (70% opacity) primary value
  text. Stale is distinct from Error: stale means "this loaded, but
  it's old"; error means "this failed to load at all."

## 25. Iconography

- **One family, one weight:** Phosphor Icons, `regular` weight, 1.5px
  stroke, used consistently for nav, toolbar, and inline glyphs (16px
  inline, 20px in nav/toolbar).
- No hand-drawn or decorative SVG icons anywhere.
- Icons in badges (Section 17) are drawn from the same family so a
  warning triangle, a calendar glyph, and a trend-wave glyph share
  stroke weight and visual register.
- Icons never carry meaning alone in a state badge; always paired with
  the taxonomy's color and a text label per Section 17.

## 26. Information Hierarchy Summary

A quick reference for how tactical importance maps to every dial at
once:

| Tier | Example | Grid span | Type scale | Color use |
|---|---|---|---|---|
| Hero | XAUUSD price | 6-8 cols, 2 rows | `kpi-hero` | Gold as literal data color, support/adverse on drivers |
| Tactical | Real yields, DXY, Fed pricing | 3-4 cols | `kpi-primary` | Support/adverse relationship chips prominent |
| Secondary | Correlated markets, breadth metrics | 2-3 cols | `kpi-secondary` | Muted; relationship chips present but smaller |
| Structural | Settings summary, source status | 2 cols | `body-sm` / `label` | Neutral grays only, no relationship color |

## 27. Do and Don't

### Do

- Use the surface ladder (`canvas` -> `surface-1/2/3`) plus hairline
  borders for all hierarchy. Never reach for a shadow on an in-flow
  module.
- Keep every number in monospace with tabular figures and a fixed
  decimal width per instrument class.
- Treat `support`/`adverse`/`neutral` as a strictly mechanical,
  labeled relationship indicator, always with text, never as a
  standalone directional signal.
- Give market state, quality warnings, freshness, and events four
  visually distinct languages (color + shape + icon), per Section 17.
- Size modules by tactical importance (Section 26), not by a uniform
  grid template.
- Reserve gold for brand, focus, selection, and the literal price
  series. Nowhere else.
- Render the KPI-relationship "contextual" bucket (Milestone 1C) with
  `relationship-contextual` (`#c9b458`, muted olive-yellow) — never
  `kpi-neutral` gray, and never `warn` amber. The two "yellow-ish" tokens
  (`relationship-contextual` and `warn`) belong to separate taxonomies and
  must stay visually distinguishable.

### Don't

- Don't let green mean "buy" or red mean "sell," anywhere, under any
  circumstance including chart candles used loosely in copy or docs.
- Don't use gold as a bullish/supportive color. It is identity, not
  direction.
- Don't apply the same pill badge shape to more than one state
  taxonomy.
- Don't use drop shadows on modules sitting in normal page flow.
- Don't let a module's own background change color to reflect an
  internal metric's state.
- Don't introduce a second monospace or second sans family. One pair,
  system-wide.
- Don't build oversized hero sections, marketing-style feature thirds,
  or generous 96px section gaps. This product is read in seconds, not
  scrolled through once and never again.
- Don't animate anything you can't justify in one sentence, and never
  loop an animation beyond the single permitted live-data pulse.
- Don't ship a module without an explicit empty, loading, error, and
  stale state.

## 28. Design Tokens (Consolidated Reference)

### Local exception: HT Terminal / Histoire du marché

The pinned Brain mission `da8eb64959b6c026128bde254c8d1703e419f19c`
authorizes HT Terminal naming and the pedagogical composition of its HTML
reference inside the existing market-story page. Existing dark tokens and
status semantics remain authoritative. The historical scenario graph keeps
its layout and connectors. This exception does not rename npm packages or
redesign other modules. See `docs/HT_MARKET_STORY_LEARNING_INTEGRATION.md`.

All values also appear in the YAML front matter of this document for
machine consumption. This table is the human-readable index.

**Color**

`canvas` `#0a0d12` . `surface-1` `#10141b` . `surface-2` `#141922` .
`surface-3` `#1a212c` . `surface-inset` `#05070a` . `hairline`
`#212833` . `hairline-strong` `#2c3644` . `hairline-focus`
`rgba(212,162,86,.55)` . `text-primary` `#e8ecf1` . `text-secondary`
`#aab2bf` . `text-tertiary` `#737c8a` . `text-disabled` `#4a515c` .
`gold` `#d4a256` . `gold-bright` `#e8c076` . `gold-fill`
`rgba(212,162,86,.10)` . `support` / `relationship-supportive` `#3fae7a` .
`adverse` / `relationship-adverse` `#c15f56` . `relationship-contextual`
`#c9b458` (Milestone 1C; supersedes `kpi-neutral` for relationship state
only) . `kpi-neutral` `#6b7684` (still used elsewhere, e.g. the
"unavailable" freshness dot) . `state-blue` `#5b8ec9` . `warn` `#d99a4e` .
`fresh` `#4fb8b0` . `event` `#9081c9` . `error` `#e5484d`

**Radius**

`control` 4px . `module` 6px . `popover` 8px . `pill` full

**Spacing**

`xxs` 2px . `xs` 4px . `sm` 8px . `md` 12px . `lg` 16px . `xl` 20px .
`xxl` 24px . `xxxl` 32px
