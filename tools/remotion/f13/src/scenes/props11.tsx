import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { theme } from "../theme";

const c = theme.colors;
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/** Payoff "hockey stick" at expiry (call or put), drawn progressively from `from`.
 * `premium` shifts a dashed profit line down; `marker` pins an expiry price. */
export const Payoff: React.FC<{
  kind: "call" | "put";
  from: number;
  strike?: number;
  premium?: number;
  premiumAt?: number;
  marker?: number;
  markerAt?: number;
  min?: number;
  max?: number;
  width?: number;
  height?: number;
}> = ({ kind, from, strike = 2400, premium, premiumAt = 0, marker, markerAt = 0, min = 2250, max = 2550, width = 640, height = 360 }) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [from, from + 40], [0, 1], { ...clamp, easing: theme.ease.inOut });
  const yMax = 150;
  const yMin = -80;
  const X = (v: number) => ((v - min) / (max - min)) * width;
  const Y = (v: number) => height - ((v - yMin) / (yMax - yMin)) * height;
  const pay = (s: number) => (kind === "call" ? Math.max(s - strike, 0) : Math.max(strike - s, 0));
  const N = 60;
  const pts = Array.from({ length: N + 1 }, (_, i) => min + ((max - min) * i) / N);
  const shown = pts.slice(0, Math.max(2, Math.round(p * N) + 1));
  const path = shown.map((s, i) => `${i ? "L" : "M"}${X(s).toFixed(1)},${Y(pay(s)).toFixed(1)}`).join(" ");
  const pp = premium != null ? interpolate(frame, [premiumAt, premiumAt + 30], [0, 1], clamp) : 0;
  const profit = premium != null ? pts.map((s, i) => `${i ? "L" : "M"}${X(s).toFixed(1)},${Y(pay(s) - premium * pp).toFixed(1)}`).join(" ") : "";
  const mp = marker != null ? interpolate(frame, [markerAt, markerAt + 20], [0, 1], clamp) : 0;
  const col = kind === "call" ? c.positive : c.negative;
  return (
    <svg width={width} height={height + 40} style={{ overflow: "visible" }}>
      <line x1={0} y1={Y(0)} x2={width} y2={Y(0)} stroke={c.hairline} strokeWidth={2} />
      <line x1={X(strike)} y1={0} x2={X(strike)} y2={height} stroke={c.textMuted} strokeWidth={1.5} strokeDasharray="6 6" />
      <text x={X(strike)} y={height + 30} fill={c.textSecondary} fontSize={22} textAnchor="middle" fontFamily={theme.mono}>
        {strike.toLocaleString("fr-FR")}
      </text>
      <path d={path} stroke={col} strokeWidth={6} fill="none" strokeLinecap="round" />
      {premium != null && pp > 0 && <path d={profit} stroke={c.accentBright} strokeWidth={3} strokeDasharray="10 8" fill="none" opacity={pp} />}
      {marker != null && mp > 0 && (
        <g opacity={mp}>
          <line x1={X(marker)} y1={0} x2={X(marker)} y2={height} stroke={c.accentBright} strokeWidth={3} />
          <circle cx={X(marker)} cy={Y(pay(marker))} r={11} fill={c.accentBright} />
          <text x={X(marker)} y={-10} fill={c.accentBright} fontSize={24} textAnchor="middle" fontFamily={theme.mono} fontWeight={800}>
            {marker.toLocaleString("fr-FR")}
          </text>
        </g>
      )}
    </svg>
  );
};

/** A curve drawn progressively through normalized points (0..1 on both axes). */
export const Curve: React.FC<{
  pts: Array<[number, number]>;
  from: number;
  width: number;
  height: number;
  color?: string;
  dots?: boolean;
  xLabels?: string[];
  hi?: number[];
  hiColor?: string;
}> = ({ pts, from, width, height, color = c.accentBright, dots = true, xLabels, hi = [], hiColor = c.negative }) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [from, from + 36], [0, 1], { ...clamp, easing: theme.ease.inOut });
  const P = pts.map(([x, y]) => [x * width, height - y * height] as const);
  const n = Math.max(2, Math.ceil(p * P.length));
  const shown = P.slice(0, n);
  const d = shown.map((q, i) => `${i ? "L" : "M"}${q[0].toFixed(1)},${q[1].toFixed(1)}`).join(" ");
  return (
    <svg width={width} height={height + 44} style={{ overflow: "visible" }}>
      <line x1={0} y1={height} x2={width} y2={height} stroke={c.hairline} strokeWidth={2} />
      <path d={d} stroke={color} strokeWidth={5} fill="none" strokeLinejoin="round" strokeLinecap="round" />
      {dots &&
        shown.map((q, i) => (
          <circle key={i} cx={q[0]} cy={q[1]} r={hi.includes(i) ? 13 : 8} fill={hi.includes(i) ? hiColor : color} />
        ))}
      {xLabels?.map((t, i) => (
        <text key={t + i} x={P[i]?.[0] ?? 0} y={height + 34} fill={c.textSecondary} fontSize={20} textAnchor="middle" fontFamily={theme.mono}>
          {t}
        </text>
      ))}
    </svg>
  );
};

/** Option "ticket": a small contract card with key/value rows. */
export const Ticket: React.FC<{ title: string; rows: Array<[string, string]>; color?: string; width?: number; hiRow?: number }> = ({ title, rows, color = c.accent, width = 360, hiRow }) => (
  <div style={{ width, borderRadius: 14, border: `2px solid ${color}`, background: c.panel, overflow: "hidden", boxShadow: `0 10px 30px ${color}22` }}>
    <div style={{ background: `${color}33`, padding: "8px 16px", color, fontFamily: theme.mono, fontSize: 20, fontWeight: 800, letterSpacing: 1.5 }}>{title}</div>
    <div style={{ padding: "10px 16px" }}>
      {rows.map(([k, v], i) => (
        <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: 22, padding: "4px 6px", borderRadius: 6, background: hiRow === i ? `${c.accent}33` : "transparent" }}>
          <span style={{ color: c.textSecondary }}>{k}</span>
          <strong style={{ color: c.textPrimary, fontFamily: theme.mono }}>{v}</strong>
        </div>
      ))}
    </div>
  </div>
);

/** Big Greek-letter card. */
export const GreekCard: React.FC<{ letter: string; name: string; text: string; lit?: boolean; width?: number }> = ({ letter, name, text, lit, width = 300 }) => (
  <div style={{ width, padding: "18px 18px 20px", borderRadius: 18, border: `2px solid ${lit ? c.accent : c.hairline}`, background: lit ? `${c.accent}18` : c.panel, textAlign: "center" }}>
    <div style={{ fontSize: 92, lineHeight: 1, color: lit ? c.accentBright : c.textSecondary, fontFamily: "Georgia, serif" }}>{letter}</div>
    <div style={{ fontSize: 30, fontWeight: 800, color: c.textPrimary, marginTop: 6 }}>{name}</div>
    <div style={{ fontSize: 22, color: c.textSecondary, marginTop: 6, lineHeight: 1.3 }}>{text}</div>
  </div>
);

/** Horizontal price axis with labelled markers that fade in at their own frames. */
export const PriceAxis: React.FC<{ min: number; max: number; width: number; marks: Array<{ v: number; t: string; color: string; at: number; below?: boolean }> }> = ({ min, max, width, marks }) => {
  const frame = useCurrentFrame();
  const X = (v: number) => ((v - min) / (max - min)) * width;
  return (
    <div style={{ position: "relative", width, height: 170 }}>
      <div style={{ position: "absolute", left: 0, right: 0, top: 84, height: 4, borderRadius: 2, background: c.hairline }} />
      {marks.map((m) => {
        const o = interpolate(frame, [m.at, m.at + 14], [0, 1], clamp);
        return (
          <div key={m.t} style={{ position: "absolute", left: X(m.v) - 110, width: 220, top: m.below ? 96 : 0, opacity: o, textAlign: "center", transform: `translateY(${(1 - o) * (m.below ? 16 : -16)}px)` }}>
            {!m.below && <div style={{ color: m.color, fontSize: 24, fontWeight: 800 }}>{m.t}</div>}
            {!m.below && <div style={{ color: c.textSecondary, fontFamily: theme.mono, fontSize: 20 }}>{m.v.toLocaleString("fr-FR")}</div>}
            <div style={{ margin: "4px auto", width: 16, height: 16, borderRadius: 8, background: m.color }} />
            {m.below && <div style={{ color: c.textSecondary, fontFamily: theme.mono, fontSize: 20 }}>{m.v.toLocaleString("fr-FR")}</div>}
            {m.below && <div style={{ color: m.color, fontSize: 24, fontWeight: 800 }}>{m.t}</div>}
          </div>
        );
      })}
    </div>
  );
};

/** One labelled row of a calculation that slides in at `at`. */
export const CalcLine: React.FC<{ at: number; left: string; right?: string; color?: string; size?: number }> = ({ at, left, right, color = c.textPrimary, size = 38 }) => {
  const frame = useCurrentFrame();
  const o = interpolate(frame, [at, at + 12], [0, 1], clamp);
  return (
    <div style={{ opacity: o, transform: `translateX(${(1 - o) * -30}px)`, display: "flex", gap: 18, alignItems: "baseline", fontFamily: theme.mono, fontSize: size, color }}>
      <span>{left}</span>
      {right && <strong style={{ color: c.accentBright }}>{right}</strong>}
    </div>
  );
};
