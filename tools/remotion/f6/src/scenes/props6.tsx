import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "../theme";
import { GoldBarIcon } from "./shared";
import { clamp } from "./characters";

const c = theme.colors;

/** Currency coin with its symbol. */
export const Coin: React.FC<{ sym: string; size?: number; color?: string; spin?: boolean }> = ({ sym, size = 90, color = c.context, spin }) => {
  const frame = useCurrentFrame();
  const sx = spin ? Math.abs(Math.cos(frame / 14)) * 0.8 + 0.2 : 1;
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: `radial-gradient(circle at 35% 30%, ${color}55, ${c.panelAlt})`, border: `3px solid ${color}`, display: "flex", alignItems: "center", justifyContent: "center", color, fontWeight: 900, fontFamily: theme.mono, fontSize: size * (sym.length > 2 ? 0.26 : sym.length > 1 ? 0.34 : 0.46), transform: `scaleX(${sx})`, boxShadow: `0 10px 30px -12px ${color}` }}>
      {sym}
    </div>
  );
};

export const CUR = {
  USD: { sym: "$", color: c.positive },
  EUR: { sym: "€", color: c.context },
  JPY: { sym: "¥", color: c.negative },
  GBP: { sym: "£", color: c.accentBright },
  CAD: { sym: "C$", color: "#c98f63" },
  SEK: { sym: "kr", color: "#8fa8bf" },
  CHF: { sym: "CHF", color: "#b98fbf" },
} as const;

/** Seesaw: tilt in degrees (positive = right side down). Left carries the dollar, right the gold bar. */
export const Seesaw: React.FC<{ tilt: number; width?: number; lift?: number }> = ({ tilt, width = 800, lift = 0 }) => (
  <div style={{ position: "relative", width, height: 320 }}>
    <div style={{ position: "absolute", left: width / 2 - 60, top: 230, width: 0, height: 0, borderLeft: "60px solid transparent", borderRight: "60px solid transparent", borderBottom: `90px solid ${c.textMuted}` }} />
    <div style={{ position: "absolute", left: 0, top: 216 - lift, width, height: 16, borderRadius: 8, background: c.accentDim, transform: `rotate(${tilt}deg)`, transformOrigin: "50% 50%" }}>
      <div style={{ position: "absolute", left: 20, top: -150 }}>
        <Coin sym="$" size={140} color={c.positive} />
      </div>
      <div style={{ position: "absolute", right: 20, top: -150 }}>
        <GoldBarIcon size={150} />
      </div>
    </div>
  </div>
);

/** A trading-board style quote: pair, value, arrow. */
export const QuoteBoard: React.FC<{ base: string; quote: string; value: string; dir?: "up" | "down" | null; highlight?: "base" | "quote" | null }> = ({ base, quote, value, dir, highlight }) => {
  const frame = useCurrentFrame();
  const col = dir === "up" ? c.positive : dir === "down" ? c.negative : c.textPrimary;
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 26, padding: "18px 30px", borderRadius: 18, background: "#0b0e13", border: `2px solid ${c.hairline}`, boxShadow: "inset 0 0 30px rgba(0,0,0,0.6)" }}>
      <div style={{ fontFamily: theme.mono, fontSize: 44, fontWeight: 900, letterSpacing: 2 }}>
        <span style={{ color: highlight === "base" ? c.accentBright : c.textSecondary, textDecoration: highlight === "base" ? "underline" : "none" }}>{base}</span>
        <span style={{ color: c.textMuted }}>/</span>
        <span style={{ color: highlight === "quote" ? c.accentBright : c.textSecondary, textDecoration: highlight === "quote" ? "underline" : "none" }}>{quote}</span>
      </div>
      <div style={{ fontFamily: theme.mono, fontSize: 60, fontWeight: 900, color: col, textShadow: `0 0 ${10 + Math.sin(frame / 6) * 4}px ${col}66` }}>{value}</div>
      {dir && <div style={{ fontSize: 50, color: col, fontWeight: 900 }}>{dir === "up" ? "▲" : "▼"}</div>}
    </div>
  );
};

/** DXY weights as one stacked horizontal bar (ICE fixed weights). */
export const DXY_WEIGHTS: Array<{ k: keyof typeof CUR; w: number; name: string }> = [
  { k: "EUR", w: 57.6, name: "euro" },
  { k: "JPY", w: 13.6, name: "yen" },
  { k: "GBP", w: 11.9, name: "livre" },
  { k: "CAD", w: 9.1, name: "dollar canadien" },
  { k: "SEK", w: 4.2, name: "couronne" },
  { k: "CHF", w: 3.6, name: "franc suisse" },
];

export const WeightBar: React.FC<{ from: number; width?: number }> = ({ from, width = 1500 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  let acc = 0;
  return (
    <div style={{ position: "relative", width, height: 120 }}>
      {DXY_WEIGHTS.map((d, i) => {
        const p = spring({ frame: frame - from - i * 6, fps, config: theme.spring.smooth });
        const left = (acc / 100) * width;
        acc += d.w;
        const w = (d.w / 100) * width * p;
        return (
          <div key={d.k} style={{ position: "absolute", left, top: 0, width: w, height: 64, background: `linear-gradient(180deg, ${CUR[d.k].color}, ${CUR[d.k].color}88)`, borderRight: `2px solid ${c.bg}`, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
            <span style={{ color: c.bg, fontFamily: theme.mono, fontWeight: 900, fontSize: d.w > 8 ? 24 : 15, whiteSpace: "nowrap" }}>{d.w > 8 ? `${CUR[d.k].sym} ${d.w.toString().replace(".", ",")} %` : CUR[d.k].sym}</span>
          </div>
        );
      })}
      <div style={{ position: "absolute", top: 74, left: 0, color: c.textMuted, fontFamily: theme.mono, fontSize: 17 }}>poids fixes du panier (en %)</div>
    </div>
  );
};

/** Small up/down arrow with label, springing in. */
export const Move: React.FC<{ at: number; up: boolean; size?: number; label?: string; color?: string }> = ({ at, up, size = 60, label, color }) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [at, at + 12], [0, 1], { ...clamp, easing: theme.ease.out });
  const col = color ?? (up ? c.positive : c.negative);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, opacity: p, transform: `translateY(${(1 - p) * (up ? 20 : -20)}px)` }}>
      <svg width={size} height={size} viewBox="0 0 40 40" style={{ transform: up ? "none" : "rotate(180deg)" }}>
        <path d="M20 34 V6 M20 6 L9 17 M20 6 L31 17" stroke={col} strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </svg>
      {label && <span style={{ color: col, fontWeight: 800, fontSize: size * 0.45 }}>{label}</span>}
    </div>
  );
};
