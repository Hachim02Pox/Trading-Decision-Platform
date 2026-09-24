import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { theme } from "../theme";
import { clamp } from "./characters";

const c = theme.colors;

/** Thermometer; `level` in [0,1] animates the mercury. */
export const Thermo: React.FC<{ level: number; color?: string; label?: string; size?: number }> = ({ level, color = c.negative, label, size = 300 }) => {
  const frame = useCurrentFrame();
  const wob = Math.sin(frame / 9) * 0.01;
  const h = 200 * Math.max(0, Math.min(1, level + wob));
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <svg width={size * 0.4} height={size} viewBox="0 0 80 300">
        <rect x="26" y="10" width="28" height="230" rx="14" fill={c.panelAlt} stroke={c.textSecondary} strokeWidth="3" />
        <rect x="32" y={236 - h} width="16" height={h + 10} rx="8" fill={color} />
        <circle cx="40" cy="258" r="28" fill={color} stroke={c.textSecondary} strokeWidth="3" />
        {[0, 1, 2, 3, 4].map((i) => (
          <line key={i} x1="56" x2="66" y1={40 + i * 45} y2={40 + i * 45} stroke={c.textMuted} strokeWidth="2" />
        ))}
      </svg>
      {label && <div style={{ color: c.textPrimary, fontWeight: 800, fontSize: size * 0.09, marginTop: 6, textAlign: "center" }}>{label}</div>}
    </div>
  );
};

/** Umbrella = an option is insurance. */
export const Umbrella: React.FC<{ size?: number; color?: string }> = ({ size = 160, color = c.context }) => {
  const frame = useCurrentFrame();
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={{ transform: `rotate(${Math.sin(frame / 14) * 5}deg)` }}>
      <path d="M8 46 Q50 -6 92 46 Q80 38 70 46 Q60 38 50 46 Q40 38 30 46 Q20 38 8 46 Z" fill={color} />
      <path d="M50 46 V84 Q50 94 40 92" stroke={c.textSecondary} strokeWidth="5" fill="none" strokeLinecap="round" />
    </svg>
  );
};

/** Bell curve with a ±1σ shaded band that grows with `from`. */
export const Bell: React.FC<{ from: number; width?: number; label?: string }> = ({ from, width = 700, label }) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [from, from + 40], [0, 1], { ...clamp, easing: theme.ease.inOut });
  const H = 240;
  const pts: string[] = [];
  const band: string[] = [];
  for (let i = 0; i <= 100; i++) {
    const x = (i / 100) * width;
    const z = (i - 50) / 16;
    const y = H - Math.exp(-z * z / 2) * (H - 20) * p;
    pts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
    if (Math.abs(z) <= 1) band.push(`${x.toFixed(1)},${y.toFixed(1)}`);
  }
  const x0 = ((50 - 16) / 100) * width;
  const x1 = ((50 + 16) / 100) * width;
  return (
    <svg width={width} height={H + 40}>
      <polygon points={`${x0},${H} ${band.join(" ")} ${x1},${H}`} fill={`${c.accent}44`} />
      <polyline points={pts.join(" ")} fill="none" stroke={c.accentBright} strokeWidth="5" />
      <line x1="0" x2={width} y1={H} y2={H} stroke={c.hairline} strokeWidth="2" />
      <line x1={width / 2} x2={width / 2} y1={H} y2="20" stroke={c.textMuted} strokeDasharray="6 6" />
      <text x={x0} y={H + 30} textAnchor="middle" fill={c.negative} fontSize="22" fontWeight="800">−6,9 %</text>
      <text x={x1} y={H + 30} textAnchor="middle" fill={c.positive} fontSize="22" fontWeight="800">+6,9 %</text>
      {label && <text x={width / 2} y={H + 30} textAnchor="middle" fill={c.textSecondary} fontSize="18">{label}</text>}
    </svg>
  );
};

/** Bond certificate. */
export const Bond: React.FC<{ title: string; rate: string; color?: string; width?: number }> = ({ title, rate, color = c.context, width = 260 }) => (
  <div style={{ width, background: "#efece4", borderRadius: 10, padding: "16px 18px", color: "#1a1a1a", border: `4px double ${color}`, boxShadow: "0 20px 40px -18px rgba(0,0,0,0.8)" }}>
    <div style={{ fontFamily: theme.mono, fontSize: 14, color: "#666", letterSpacing: 2 }}>OBLIGATION</div>
    <div style={{ fontWeight: 900, fontSize: 24, margin: "4px 0 10px" }}>{title}</div>
    <div style={{ fontFamily: theme.mono, fontWeight: 900, fontSize: 36, color }}>{rate}</div>
  </div>
);

/** Two horizontal yield bars with the spread bracket between their tops. */
export const SpreadBars: React.FC<{ corp: number; gov: number; scale?: number; spreadLabel: string; hi?: boolean }> = ({ corp, gov, scale = 50, spreadLabel, hi }) => (
  <div style={{ position: "relative", display: "flex", alignItems: "flex-end", gap: 90, height: corp * scale + 60 }}>
    {[
      { v: gov, t: "État", col: c.context },
      { v: corp, t: "entreprises", col: c.accent },
    ].map((b) => (
      <div key={b.t} style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 150 }}>
        <div style={{ color: c.textPrimary, fontFamily: theme.mono, fontWeight: 900, fontSize: 28, marginBottom: 6 }}>{b.v.toFixed(2).replace(".", ",")} %</div>
        <div style={{ width: 120, height: b.v * scale, borderRadius: 10, background: `linear-gradient(180deg, ${b.col}, ${b.col}55)` }} />
        <div style={{ color: c.textSecondary, fontSize: 21, marginTop: 8 }}>{b.t}</div>
      </div>
    ))}
    <div style={{ position: "absolute", left: 380, bottom: gov * scale + 32, height: (corp - gov) * scale, width: 40, borderTop: `3px solid ${hi ? c.negative : c.accentBright}`, borderBottom: `3px solid ${hi ? c.negative : c.accentBright}`, borderRight: `3px solid ${hi ? c.negative : c.accentBright}` }}>
      <div style={{ position: "absolute", left: 60, top: "50%", transform: "translateY(-50%)", color: hi ? c.negative : c.accentBright, fontWeight: 900, fontSize: 34, whiteSpace: "nowrap" }}>{spreadLabel}</div>
    </div>
  </div>
);
