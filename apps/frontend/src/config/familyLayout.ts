import type { FamilyId } from "@gold-terminal/contracts";

// Milestone 1E, section 3 — "strip" is a new tier: a compact, full-width,
// short horizontal band (F13's Next Events + Active Catalyst), distinct
// from a square-ish card. Presentation-only — F13's underlying data model
// (nextEvents/activeCatalyst) is unchanged.
//
// No "hero" tier: F1 (Gold) was the only occupant of this tier and has been
// removed from the product entirely (product-owner decision — F1 does not
// exist as a family). Every remaining family fits tactical/secondary/
// structural/strip.
export type VisualTier = "tactical" | "secondary" | "structural" | "strip";

// Tier assignments:
// - F2/F3/F6 tactical — F6 (USD/FX) promoted from secondary to tactical.
// - F4/F5/F7 secondary (unchanged tier).
// - F8 demoted to structural — "should remain quiet," smallest footprint.
// - F9 (calendar-only, no cockpit-visible scalar KPIs) structural.
// - F11's three flat KPIs are secondary.
// - F12 restored to "structural" (data-layer audit pass) — same reasoning
//   as F9's "should remain quiet, smallest footprint": both its KPIs are
//   permanently UNAVAILABLE (no free API — see
//   apps/backend/src/real/f12PhysicalGold.ts), so it deliberately gets the
//   quietest, smallest tile rather than competing for attention with the
//   live driver families.
// - F13 gets the "strip" tier (see FamilyModule/EventFamilyFace).
// - User-explicit re-layout (2026-09): F10 (Flows/Positioning) moves to
//   "strip" too — full-width, horizontal — so its Managed-Money/ETF rows
//   (F10ParticipationFace's `.f10KpiRow`) get maximum horizontal room
//   instead of competing for a half-width tile. Combined with
//   FAMILY_DISPLAY_ORDER below, F10 also becomes the LAST family on the
//   page (was previously mid-mosaic at a half-width secondary span).
export const FAMILY_VISUAL_TIER: Record<FamilyId, VisualTier> = {
  F2: "tactical",
  F3: "tactical",
  F4: "secondary",
  F5: "secondary",
  F6: "tactical",
  F7: "secondary",
  F8: "structural",
  F9: "structural",
  F10: "strip",
  F11: "secondary",
  F12: "structural",
  F13: "strip",
};

// grid-column span per tier, desktop mosaic (DESIGN.md §7.2).
// "strip" spans (near-)full-width with a small row height driven purely by
// its compact content (no explicit grid-row height is set anywhere in this
// codebase — rows already auto-size to content).
export const TIER_GRID_SPAN: Record<VisualTier, number> = {
  tactical: 4,
  secondary: 3,
  structural: 2,
  strip: 12,
};

// Tablet/mobile single-column ordering (Milestone 1E, section 11):
// strip first, then tactical/secondary, structural last. Applied via a CSS
// custom property (`--tier-order`) consumed only inside the narrow-viewport
// media queries in page.module.css, so it never affects the dense desktop
// grid.
export const TIER_ORDER: Record<VisualTier, number> = {
  strip: 0,
  tactical: 1,
  secondary: 2,
  structural: 3,
};

// User-explicit re-layout (2026-09): Central Bank Buying (F12) moved up to
// sit together with Treasury (F9) and Options/Vol (F11) — the "structural/
// context" cluster — instead of trailing at the very end; Flows/
// Positioning (F10) moves to the very end instead (see FAMILY_VISUAL_TIER's
// "strip" tier change above for why it also goes full-width there).
export const FAMILY_DISPLAY_ORDER: FamilyId[] = [
  "F13",
  "F2",
  "F3",
  "F6",
  "F4",
  "F5",
  "F7",
  "F8",
  "F12",
  "F9",
  "F11",
  "F10",
];

// Milestone 1E — F3 keeps the full tactical span despite its compact
// vertical face, so it never reads as weaker than generic secondary cards.
// F10's own former 6-column override was removed once F10 moved to the
// "strip" tier (see FAMILY_VISUAL_TIER above) — "strip" already spans the
// full 12 columns, which is wider than the override and needs no
// exception here.
export const FAMILY_GRID_SPAN_OVERRIDE: Partial<Record<FamilyId, number>> = {};
