// theme.ts — single source of truth for every visual value in this project.
// NEVER inline a hex color, easing curve, or spring config in a scene/component.
import { Easing } from "remotion";

export const theme = {
  colors: {
    bg: "#07090d",
    bgAlt: "#0e1218",
    panel: "#12161d",
    panelAlt: "#171c24",
    hairline: "rgba(255,255,255,0.12)",
    hairlineSoft: "rgba(255,255,255,0.06)",
    textPrimary: "#f3f1ea",
    textSecondary: "#9aa4ad",
    textMuted: "#6b7480",
    accent: "#c9a463", // hero color — gold. At most one glowing element per frame.
    accentBright: "#e8c584",
    accentDim: "#8a7147",
    positive: "#8fbf93",
    negative: "#cf7a63",
    context: "#7ea3c2",
    glow: "rgba(201,164,99,0.55)",
    // dashboard re-creation (GEX site palette, muted to the house style)
    violet: "#a98bf0",
    amber: "#e2b64a",
    flipBlue: "#6d9fe8",
    ice: "#bfe3f5",
  },
  font: "'Segoe UI', 'Inter', system-ui, -apple-system, sans-serif",
  display: "'Segoe UI Semibold', 'Inter', system-ui, -apple-system, sans-serif",
  mono: "'Consolas', 'SFMono-Regular', Menlo, monospace",
  ease: {
    out: Easing.bezier(0.16, 1, 0.3, 1),
    inOut: Easing.bezier(0.83, 0, 0.17, 1),
    in: Easing.bezier(0.7, 0, 0.84, 0),
  },
  spring: {
    snappy: { damping: 14, stiffness: 160, mass: 0.6 },
    smooth: { damping: 20, stiffness: 90, mass: 1 },
    bouncy: { damping: 11, stiffness: 170, mass: 0.7 },
  },
} as const;
