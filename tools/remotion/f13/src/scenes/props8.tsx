import React from "react";
import { useCurrentFrame } from "remotion";
import { theme } from "../theme";

const c = theme.colors;

/** A labelled cylindrical tank; `level` in [0,1]. */
export const Tank: React.FC<{ level: number; label: string; color?: string; w?: number; h?: number; value?: string }> = ({ level, label, color = c.context, w = 200, h = 260, value }) => {
  const frame = useCurrentFrame();
  const top = h - 20 - (h - 40) * Math.max(0, Math.min(1, level));
  const wave = Math.sin(frame / 8) * 3;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
        <defs>
          <clipPath id={`tk${label.replace(/\W/g, "")}`}>
            <rect x="12" y="20" width={w - 24} height={h - 40} rx="16" />
          </clipPath>
        </defs>
        <g clipPath={`url(#tk${label.replace(/\W/g, "")})`}>
          <path d={`M0 ${top + wave} Q ${w / 4} ${top - 6 - wave} ${w / 2} ${top + wave} T ${w} ${top} V ${h} H 0 Z`} fill={`${color}99`} />
        </g>
        <rect x="12" y="20" width={w - 24} height={h - 40} rx="16" fill="none" stroke={c.textSecondary} strokeWidth="4" />
        <ellipse cx={w / 2} cy="20" rx={w / 2 - 12} ry="8" fill={c.panelAlt} stroke={c.textSecondary} strokeWidth="3" />
      </svg>
      <div style={{ color: c.textPrimary, fontWeight: 800, fontSize: 24 }}>{label}</div>
      {value && <div style={{ color, fontFamily: theme.mono, fontWeight: 900, fontSize: 26 }}>{value}</div>}
    </div>
  );
};

/** Horizontal pipe with animated flow dashes (direction: 1 = left→right). */
export const Pipe: React.FC<{ width: number; active: boolean; dir?: 1 | -1; color?: string; label?: string }> = ({ width, active, dir = 1, color = c.context, label }) => {
  const frame = useCurrentFrame();
  return (
    <div style={{ position: "relative", width, height: 60 }}>
      <svg width={width} height="60">
        <rect x="0" y="18" width={width} height="24" rx="12" fill={c.panelAlt} stroke={c.textSecondary} strokeWidth="3" />
        {active && <line x1="10" x2={width - 10} y1="30" y2="30" stroke={color} strokeWidth="8" strokeDasharray="18 14" strokeDashoffset={-frame * 4 * dir} strokeLinecap="round" />}
        {active && <path d={dir === 1 ? `M${width - 26} 14 L${width - 6} 30 L${width - 26} 46` : `M26 14 L6 30 L26 46`} stroke={color} strokeWidth="5" fill="none" />}
      </svg>
      {label && <div style={{ position: "absolute", top: -34, left: -120, right: -120, textAlign: "center", color: c.accentBright, fontWeight: 800, fontSize: 22, whiteSpace: "nowrap" }}>{label}</div>}
    </div>
  );
};

/** A T-account (balance sheet). */
export const TAccount: React.FC<{ title: string; assets: Array<{ t: string; hi?: boolean }>; liabilities: Array<{ t: string; hi?: boolean }> }> = ({ title, assets, liabilities }) => (
  <div style={{ width: 640, background: c.panel, border: `1px solid ${c.hairline}`, borderRadius: 18, padding: 20 }}>
    <div style={{ textAlign: "center", color: c.accentBright, fontWeight: 900, fontSize: 28, marginBottom: 10 }}>{title}</div>
    <div style={{ display: "flex", borderTop: `3px solid ${c.textSecondary}` }}>
      {[
        { h: "Actifs", rows: assets },
        { h: "Dettes (passifs)", rows: liabilities },
      ].map((col, i) => (
        <div key={col.h} style={{ flex: 1, padding: "10px 14px", borderLeft: i === 1 ? `3px solid ${c.textSecondary}` : "none" }}>
          <div style={{ color: c.textMuted, fontFamily: theme.mono, fontSize: 16, marginBottom: 8 }}>{col.h}</div>
          {col.rows.map((r) => (
            <div key={r.t} style={{ padding: "6px 10px", marginBottom: 6, borderRadius: 8, background: r.hi ? `${c.accent}26` : "transparent", border: `1px solid ${r.hi ? c.accent : "transparent"}`, color: c.textPrimary, fontSize: 22 }}>{r.t}</div>
          ))}
        </div>
      ))}
    </div>
  </div>
);

/** A horizontal rate axis with markers. */
export const RateAxis: React.FC<{ min: number; max: number; width: number; marks: Array<{ v: number; t: string; color: string; show: boolean }> }> = ({ min, max, width, marks }) => {
  const x = (v: number) => ((v - min) / (max - min)) * width;
  return (
    <div style={{ position: "relative", width, height: 170 }}>
      <div style={{ position: "absolute", left: 0, right: 0, top: 84, height: 4, background: c.hairline }} />
      {[min, (min + max) / 2, max].map((v) => (
        <div key={v} style={{ position: "absolute", left: x(v) - 40, width: 80, top: 100, textAlign: "center", color: c.textMuted, fontFamily: theme.mono, fontSize: 16 }}>{v.toFixed(2).replace(".", ",")} %</div>
      ))}
      {marks.map((m, i) =>
        m.show ? (
          <div key={m.t} style={{ position: "absolute", left: x(m.v) - 60, width: 120, top: i % 2 ? 110 : 0, display: "flex", flexDirection: i % 2 ? "column-reverse" : "column", alignItems: "center" }}>
            <div style={{ color: m.color, fontWeight: 900, fontSize: 24, fontFamily: theme.mono }}>{m.t}</div>
            <div style={{ width: 4, height: 40, background: m.color }} />
          </div>
        ) : null,
      )}
    </div>
  );
};
