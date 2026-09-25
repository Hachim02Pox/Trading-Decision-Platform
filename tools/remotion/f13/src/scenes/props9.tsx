import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "../theme";
import { clamp } from "./characters";

const c = theme.colors;

/** Auction gavel that strikes at `strikeAt`. */
export const Gavel: React.FC<{ size?: number; strikeAt: number }> = ({ size = 200, strikeAt }) => {
  const frame = useCurrentFrame();
  const t = frame - strikeAt;
  const rot = t < 0 ? -35 + Math.sin(frame / 10) * 4 : t < 6 ? interpolate(t, [0, 6], [-35, 10]) : interpolate(t, [6, 18], [10, -10], clamp);
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={{ overflow: "visible" }}>
      <rect x="10" y="80" width="60" height="10" rx="3" fill={c.accentDim} />
      <g style={{ transform: `rotate(${rot}deg)`, transformOrigin: "70px 75px" }}>
        <rect x="64" y="20" width="8" height="58" rx="3" fill={c.textSecondary} />
        <rect x="46" y="10" width="44" height="20" rx="5" fill={c.accent} />
      </g>
      {t >= 5 && t < 16 && (
        <g opacity={1 - (t - 5) / 11}>
          {[0, 1, 2].map((i) => (
            <line key={i} x1={40 + i * 15} y1="74" x2={34 + i * 18} y2={62 - (t - 5) * 1.5} stroke={c.accentBright} strokeWidth="3" strokeLinecap="round" />
          ))}
        </g>
      )}
    </svg>
  );
};

/** Maturity ladder: bars per tenor, `hi` highlights a group. */
export const Ladder: React.FC<{ from: number; hi?: "short" | "long" | null }> = ({ from, hi }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const tenors = [
    { t: "4 sem.", d: 0.08, short: true },
    { t: "3 mois", d: 0.25, short: true },
    { t: "1 an", d: 1, short: true },
    { t: "2 ans", d: 1.9, short: false },
    { t: "5 ans", d: 4.5, short: false },
    { t: "10 ans", d: 8.4, short: false },
    { t: "30 ans", d: 17, short: false },
  ];
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 22, height: 360 }}>
      {tenors.map((x, i) => {
        const p = spring({ frame: frame - from - i * 4, fps, config: theme.spring.smooth });
        const lit = hi === null || hi === undefined || (hi === "short") === x.short;
        return (
          <div key={x.t} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, opacity: lit ? 1 : 0.3 }}>
            <div style={{ width: 90, height: (18 + x.d * 16) * p, borderRadius: 10, background: `linear-gradient(180deg, ${x.short ? c.context : c.accent}, ${x.short ? c.context : c.accent}55)` }} />
            <div style={{ color: c.textSecondary, fontSize: 20, fontFamily: theme.mono }}>{x.t}</div>
          </div>
        );
      })}
    </div>
  );
};

/** Long yield = expected short rates + term premium (stacked bar). */
export const YieldStack: React.FC<{ from: number; premium: number; height?: number }> = ({ from, premium, height = 380 }) => {
  const frame = useCurrentFrame();
  const p1 = interpolate(frame, [from, from + 25], [0, 1], { ...clamp, easing: theme.ease.out });
  const p2 = interpolate(frame, [from + 25, from + 50], [0, 1], { ...clamp, easing: theme.ease.out });
  const base = height * 0.62;
  return (
    <div style={{ position: "relative", width: 360, height: height + 40 }}>
      <div style={{ position: "absolute", bottom: 0, left: 80, width: 200, height: base * p1, background: `linear-gradient(180deg, ${c.context}, ${c.context}66)`, borderRadius: "0 0 12px 12px", display: "flex", alignItems: "center", justifyContent: "center", color: c.bg, fontWeight: 900, fontSize: 22, textAlign: "center" }}>
        taux courts attendus
      </div>
      <div style={{ position: "absolute", bottom: base * p1, left: 80, width: 200, height: premium * p2, background: `repeating-linear-gradient(45deg, ${c.accent} 0 12px, ${c.accentDim} 12px 24px)`, borderRadius: "12px 12px 0 0", display: "flex", alignItems: "center", justifyContent: "center", color: c.bg, fontWeight: 900, fontSize: 20 }}>
        {premium > 40 ? "prime de terme" : ""}
      </div>
    </div>
  );
};

/** A bid slip. */
export const Slip: React.FC<{ text: string; color?: string }> = ({ text, color = c.context }) => (
  <div style={{ width: 150, padding: "10px 12px", background: "#efece4", borderRadius: 6, borderLeft: `6px solid ${color}`, color: "#1a1a1a", fontFamily: theme.mono, fontWeight: 800, fontSize: 18, boxShadow: "0 10px 20px -10px rgba(0,0,0,0.8)" }}>{text}</div>
);
