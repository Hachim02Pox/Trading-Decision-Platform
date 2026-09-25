import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "../theme";
import { clamp } from "./characters";

const c = theme.colors;

/** Stroke-drawn check mark (draws itself from `at`). */
export const CheckDraw: React.FC<{ at: number; size?: number; color?: string }> = ({ at, size = 46, color = c.positive }) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [at, at + 14], [0, 1], { ...clamp, easing: theme.ease.out });
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10.5" stroke={color} strokeWidth="1.8" fill="none" opacity={p} />
      <path d="M7 12.5 L10.5 16 L17 8.5" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" fill="none" strokeDasharray="20" strokeDashoffset={20 * (1 - p)} />
    </svg>
  );
};

/** Stroke-drawn cross (draws itself from `at`). */
export const CrossDraw: React.FC<{ at: number; size?: number; color?: string }> = ({ at, size = 46, color = c.negative }) => {
  const frame = useCurrentFrame();
  const p1 = interpolate(frame, [at, at + 8], [0, 1], { ...clamp, easing: theme.ease.out });
  const p2 = interpolate(frame, [at + 6, at + 14], [0, 1], { ...clamp, easing: theme.ease.out });
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <path d="M5 5 L19 19" stroke={color} strokeWidth="3" strokeLinecap="round" strokeDasharray="20" strokeDashoffset={20 * (1 - p1)} />
      <path d="M19 5 L5 19" stroke={color} strokeWidth="3" strokeLinecap="round" strokeDasharray="20" strokeDashoffset={20 * (1 - p2)} />
    </svg>
  );
};

/** A rubber stamp that slams in (big -> normal, slight rotation). */
export const Stamp: React.FC<{ at: number; text: string; color?: string; size?: number; rotate?: number }> = ({ at, text, color = c.negative, size = 40, rotate = -8 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (frame < at) return null;
  const p = spring({ frame: frame - at, fps, config: { damping: 13, stiffness: 220, mass: 0.6 } });
  return (
    <div
      style={{
        display: "inline-block",
        border: `4px solid ${color}`,
        color,
        borderRadius: 12,
        padding: "6px 22px",
        fontFamily: theme.mono,
        fontWeight: 900,
        fontSize: size,
        letterSpacing: 4,
        opacity: Math.min(1, p * 1.5),
        transform: `rotate(${rotate}deg) scale(${interpolate(p, [0, 1], [2.2, 1])})`,
        background: `${c.bg}cc`,
        whiteSpace: "nowrap",
      }}
    >
      {text}
    </div>
  );
};

/** Bathtub: water `level` in [0,1]; faucet drips while `flowing`. Stocks vs flows. */
export const Bathtub: React.FC<{ level: number; flowing?: boolean; width?: number }> = ({ level, flowing, width = 520 }) => {
  const frame = useCurrentFrame();
  const h = width * 0.62;
  const waterTop = 250 - level * 150;
  const wave = (x: number) => Math.sin(frame / 7 + x / 30) * 3;
  const pts = Array.from({ length: 13 }, (_, i) => {
    const x = 40 + i * 20;
    return `${x},${waterTop + wave(x)}`;
  }).join(" ");
  return (
    <svg width={width} height={h} viewBox="0 0 320 300" style={{ overflow: "visible" }}>
      {/* faucet */}
      <path d="M250 40 H290 V30 H300 V60 H290 V52 H262 V70 H250 Z" fill={c.textSecondary} />
      {flowing &&
        [0, 1, 2, 3, 4].map((i) => {
          const t = ((frame + i * 9) % 45) / 45;
          return <circle key={i} cx={256 + Math.sin(i) * 2} cy={76 + t * (waterTop - 76)} r={4.5} fill={c.context} opacity={1 - t * 0.4} />;
        })}
      {/* water */}
      <clipPath id="tubclip">
        <path d="M30 100 H290 V240 Q290 280 250 280 H70 Q30 280 30 240 Z" />
      </clipPath>
      <g clipPath="url(#tubclip)">
        <polygon points={`40,300 ${pts} 280,300`} fill={`${c.context}88`} />
        <polyline points={pts} fill="none" stroke={c.context} strokeWidth="3" />
      </g>
      {/* tub */}
      <path d="M20 100 H300" stroke={c.textPrimary} strokeWidth="8" strokeLinecap="round" />
      <path d="M30 100 V240 Q30 280 70 280 H250 Q290 280 290 240 V100" stroke={c.textPrimary} strokeWidth="6" fill="none" />
      <line x1="70" y1="280" x2="60" y2="298" stroke={c.textPrimary} strokeWidth="6" strokeLinecap="round" />
      <line x1="250" y1="280" x2="260" y2="298" stroke={c.textPrimary} strokeWidth="6" strokeLinecap="round" />
      {/* level marker */}
      <line x1="8" y1={waterTop} x2="26" y2={waterTop} stroke={c.accentBright} strokeWidth="4" />
    </svg>
  );
};

/** Office / establishment building with lit windows. */
export const Office: React.FC<{ size?: number; lit?: boolean }> = ({ size = 200, lit }) => {
  const frame = useCurrentFrame();
  return (
    <svg width={size} height={size} viewBox="0 0 120 120">
      <rect x="22" y="14" width="76" height="100" rx="3" fill={c.panelAlt} stroke={lit ? c.accent : c.textSecondary} strokeWidth="3.5" />
      {Array.from({ length: 12 }).map((_, i) => {
        const on = lit && Math.sin(frame / 18 + i * 1.7) > -0.4;
        return <rect key={i} x={32 + (i % 3) * 20} y={24 + Math.floor(i / 3) * 18} width="12" height="10" fill={on ? c.accentBright : c.hairline} opacity={on ? 0.9 : 1} />;
      })}
      <rect x="50" y="94" width="20" height="20" fill={lit ? c.accent : c.textMuted} />
    </svg>
  );
};

export const HouseGlyph: React.FC<{ size?: number; lit?: boolean; phase?: number }> = ({ size = 110, lit, phase = 0 }) => {
  const frame = useCurrentFrame();
  const on = lit && Math.sin(frame / 20 + phase) > -0.6;
  return (
    <svg width={size} height={size} viewBox="0 0 60 60">
      <polygon points="30,6 56,28 4,28" fill={lit ? c.context : c.textMuted} />
      <rect x="10" y="28" width="40" height="28" fill={c.panelAlt} stroke={lit ? c.context : c.textMuted} strokeWidth="2.5" />
      <rect x="16" y="34" width="10" height="9" fill={on ? c.accentBright : c.hairline} />
      <rect x="33" y="38" width="10" height="18" fill={lit ? c.context : c.textMuted} />
    </svg>
  );
};

export const Clipboard: React.FC<{ size?: number; color?: string }> = ({ size = 70, color = c.accent }) => (
  <svg width={size} height={size} viewBox="0 0 40 40">
    <rect x="8" y="6" width="24" height="30" rx="3" fill={c.panelAlt} stroke={color} strokeWidth="2" />
    <rect x="14" y="3" width="12" height="6" rx="2" fill={color} />
    {[15, 21, 27].map((y) => (
      <g key={y}>
        <path d={`M12 ${y} l2 2 l3 -4`} stroke={c.positive} strokeWidth="1.6" fill="none" />
        <line x1="19" y1={y} x2="28" y2={y} stroke={c.textSecondary} strokeWidth="1.6" />
      </g>
    ))}
  </svg>
);

export const Magnifier: React.FC<{ size?: number; color?: string }> = ({ size = 60, color = c.accentBright }) => (
  <svg width={size} height={size} viewBox="0 0 40 40">
    <circle cx="16" cy="16" r="10" stroke={color} strokeWidth="3" fill={`${color}18`} />
    <line x1="24" y1="24" x2="35" y2="35" stroke={color} strokeWidth="4.5" strokeLinecap="round" />
  </svg>
);

export const Briefcase: React.FC<{ size?: number; color?: string }> = ({ size = 50, color = c.positive }) => (
  <svg width={size} height={size} viewBox="0 0 40 40">
    <rect x="5" y="13" width="30" height="21" rx="3" fill={color} />
    <path d="M15 13 V9 H25 V13" stroke={color} strokeWidth="3" fill="none" />
    <line x1="5" y1="22" x2="35" y2="22" stroke={c.bg} strokeWidth="2" />
  </svg>
);

export const Tractor: React.FC<{ size?: number }> = ({ size = 170 }) => {
  const frame = useCurrentFrame();
  return (
    <svg width={size} height={size * 0.75} viewBox="0 0 120 90">
      <rect x="40" y="22" width="30" height="26" fill={c.positive} />
      <rect x="44" y="26" width="20" height="14" fill={c.panelAlt} />
      <path d="M20 48 H90 V62 H20 Z" fill={c.positive} />
      <rect x="84" y="30" width="5" height="18" fill={c.textSecondary} />
      {[
        { x: 34, r: 20 },
        { x: 92, r: 12 },
      ].map((w) => (
        <g key={w.x} style={{ transform: `rotate(${frame * 5}deg)`, transformOrigin: `${w.x}px ${86 - w.r}px` }}>
          <circle cx={w.x} cy={86 - w.r} r={w.r} fill="#1d1d1d" stroke={c.textMuted} strokeWidth="3" />
          <line x1={w.x - w.r + 4} y1={86 - w.r} x2={w.x + w.r - 4} y2={86 - w.r} stroke={c.textMuted} strokeWidth="2.5" />
        </g>
      ))}
    </svg>
  );
};

export const StormCloud: React.FC<{ size?: number }> = ({ size = 110 }) => {
  const frame = useCurrentFrame();
  const flash = frame % 40 < 4;
  return (
    <svg width={size} height={size} viewBox="0 0 60 60">
      <path d="M14 34 Q6 34 7 26 Q8 19 16 20 Q18 10 29 11 Q39 12 40 21 Q50 20 51 28 Q52 35 44 35 Z" fill={c.textSecondary} />
      <path d="M30 34 L24 46 H30 L26 57 L38 42 H31 L35 34 Z" fill={flash ? c.textPrimary : c.accentBright} />
    </svg>
  );
};

export const HolidayGlyph: React.FC<{ size?: number }> = ({ size = 110 }) => (
  <svg width={size} height={size} viewBox="0 0 60 60">
    <rect x="8" y="12" width="44" height="40" rx="5" fill={c.panelAlt} stroke={c.negative} strokeWidth="2.5" />
    <rect x="8" y="12" width="44" height="11" fill={c.negative} />
    <polygon points="30,28 33,36 41,36 35,41 37,49 30,44 23,49 25,41 19,36 27,36" fill={c.accentBright} />
  </svg>
);

export const StrikeSign: React.FC<{ size?: number }> = ({ size = 110 }) => {
  const frame = useCurrentFrame();
  const r = Math.sin(frame / 6) * 8;
  return (
    <svg width={size} height={size} viewBox="0 0 60 60" style={{ overflow: "visible" }}>
      <g style={{ transform: `rotate(${r}deg)`, transformOrigin: "30px 56px" }}>
        <line x1="30" y1="28" x2="30" y2="58" stroke={c.textSecondary} strokeWidth="3" />
        <rect x="6" y="6" width="48" height="24" rx="3" fill={c.panelAlt} stroke={c.accentBright} strokeWidth="2.5" />
        <text x="30" y="23" fontSize="12" fontWeight="900" textAnchor="middle" fill={c.accentBright} fontFamily={theme.mono}>
          GRÈVE
        </text>
      </g>
    </svg>
  );
};

export const ShieldGlyph: React.FC<{ size?: number }> = ({ size = 110 }) => (
  <svg width={size} height={size} viewBox="0 0 60 60">
    <path d="M30 6 L50 14 V30 Q50 46 30 54 Q10 46 10 30 V14 Z" fill={c.panelAlt} stroke={c.context} strokeWidth="3" />
    <path d="M21 30 L28 37 L40 23" stroke={c.context} strokeWidth="3.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const RulebookGlyph: React.FC<{ size?: number }> = ({ size = 110 }) => (
  <svg width={size} height={size} viewBox="0 0 60 60">
    <path d="M12 8 H44 Q48 8 48 12 V52 H16 Q12 52 12 48 Z" fill={c.panelAlt} stroke={c.accent} strokeWidth="2.5" />
    {[18, 25, 32, 39].map((y) => (
      <line key={y} x1="19" y1={y} x2={y === 39 ? 32 : 41} y2={y} stroke={c.textSecondary} strokeWidth="2" />
    ))}
    <text x="30" y="49" fontSize="7" textAnchor="middle" fill={c.accent} fontFamily={theme.mono}>
      ÉTAT
    </text>
  </svg>
);

/** Semicircle gauge 30..70 with the 50 dividing line; `value` is the index reading. */
export const Gauge50: React.FC<{ value: number; size?: number; label?: string }> = ({ value, size = 380, label }) => {
  const frame = useCurrentFrame();
  const clampV = Math.max(30, Math.min(70, value));
  const angle = ((clampV - 30) / 40) * 180 - 90 + Math.sin(frame / 5) * 0.6;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <svg width={size} height={size * 0.62} viewBox="0 0 200 124">
        <path d="M20 110 A80 80 0 0 1 100 30" stroke={c.negative} strokeWidth="16" fill="none" opacity={0.85} />
        <path d="M100 30 A80 80 0 0 1 180 110" stroke={c.positive} strokeWidth="16" fill="none" opacity={0.85} />
        <line x1="100" y1="18" x2="100" y2="44" stroke={c.textPrimary} strokeWidth="3" />
        <text x="100" y="12" fontSize="12" textAnchor="middle" fill={c.textPrimary} fontFamily={theme.mono} fontWeight="800">
          50
        </text>
        <text x="22" y="124" fontSize="10" fill={c.negative} fontFamily={theme.mono}>
          contraction
        </text>
        <text x="178" y="124" fontSize="10" textAnchor="end" fill={c.positive} fontFamily={theme.mono}>
          expansion
        </text>
        <line x1="100" y1="110" x2="100" y2="42" stroke={c.accentBright} strokeWidth="5" strokeLinecap="round" style={{ transform: `rotate(${angle}deg)`, transformOrigin: "100px 110px" }} />
        <circle cx="100" cy="110" r="9" fill={c.accentBright} />
      </svg>
      <div style={{ color: c.accentBright, fontFamily: theme.mono, fontWeight: 900, fontSize: size * 0.13, marginTop: -6 }}>{value.toFixed(1).replace(".", ",")}</div>
      {label && <div style={{ color: c.textSecondary, fontFamily: theme.mono, fontSize: 20 }}>{label}</div>}
    </div>
  );
};

/** Model machine: two turning gears inside a box, with a display on top. */
export const ModelMachine: React.FC<{ size?: number; display: string; busy?: boolean }> = ({ size = 360, display, busy = true }) => {
  const frame = useCurrentFrame();
  const rot = busy ? frame * 3 : 0;
  const gear = (cx: number, cy: number, r: number, dir: number) => (
    <g style={{ transform: `rotate(${rot * dir}deg)`, transformOrigin: `${cx}px ${cy}px` }}>
      {Array.from({ length: 8 }).map((_, i) => (
        <rect key={i} x={cx - 4} y={cy - r - 7} width="8" height="12" fill={c.accent} style={{ transform: `rotate(${i * 45}deg)`, transformOrigin: `${cx}px ${cy}px` }} />
      ))}
      <circle cx={cx} cy={cy} r={r} fill={c.accentDim} stroke={c.accent} strokeWidth="3" />
      <circle cx={cx} cy={cy} r={r * 0.35} fill={c.panel} />
    </g>
  );
  return (
    <div style={{ position: "relative", width: size, height: size * 0.9 }}>
      <svg width={size} height={size * 0.9} viewBox="0 0 200 180">
        <rect x="20" y="50" width="160" height="120" rx="14" fill={c.panelAlt} stroke={c.hairline} strokeWidth="2.5" />
        {gear(78, 112, 26, 1)}
        {gear(128, 104, 18, -1.45)}
        <rect x="40" y="8" width="120" height="44" rx="8" fill={c.bg} stroke={c.accent} strokeWidth="2.5" />
      </svg>
      <div style={{ position: "absolute", left: size * 0.2, top: size * 0.04, width: size * 0.6, height: size * 0.22, display: "flex", alignItems: "center", justifyContent: "center", color: c.accentBright, fontFamily: theme.mono, fontWeight: 900, fontSize: size * 0.11 }}>
        {display}
      </div>
    </div>
  );
};

/** Animated vertical bars with value labels; heights spring in with stagger. */
export const Bars: React.FC<{
  values: number[];
  labels?: string[];
  from: number;
  max: number;
  height?: number;
  barW?: number;
  gap?: number;
  colors?: string[];
  fmt?: (v: number) => string;
}> = ({ values, labels, from, max, height = 300, barW = 90, gap = 40, colors, fmt = (v) => `${Math.round(v)}` }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap, height: height + 70 }}>
      {values.map((v, i) => {
        const p = spring({ frame: frame - from - i * 5, fps, config: theme.spring.smooth });
        const h = Math.max(0, (v / max) * height * p);
        return (
          <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", width: barW }}>
            <div style={{ color: c.textPrimary, fontFamily: theme.mono, fontWeight: 800, fontSize: 24, marginBottom: 8, opacity: p }}>{fmt(v)}</div>
            <div style={{ width: barW, height: h, borderRadius: 10, background: `linear-gradient(180deg, ${colors?.[i] ?? c.context}, ${colors?.[i] ?? c.context}66)` }} />
            {labels && <div style={{ color: c.textSecondary, fontSize: 19, marginTop: 10, textAlign: "center", whiteSpace: "nowrap" }}>{labels[i]}</div>}
          </div>
        );
      })}
    </div>
  );
};

/** A calendar page showing a weekday / date, with a page flip entrance. */
export const CalendarPage: React.FC<{ top: string; big: string; size?: number }> = ({ top, big, size = 220 }) => (
  <div style={{ width: size, borderRadius: 18, overflow: "hidden", boxShadow: "0 30px 60px -20px rgba(0,0,0,0.8)", border: `2px solid ${c.hairline}` }}>
    <div style={{ background: c.negative, color: c.textPrimary, fontFamily: theme.mono, fontWeight: 800, fontSize: size * 0.1, textAlign: "center", padding: "10px 0", letterSpacing: 3 }}>{top}</div>
    <div style={{ background: "#efece4", color: "#1a1a1a", fontWeight: 900, fontSize: size * 0.34, textAlign: "center", padding: "12px 0 18px" }}>{big}</div>
  </div>
);

/** Report document with a big title, drops in. */
export const ReportDoc: React.FC<{ title: string; width?: number }> = ({ title, width = 300 }) => (
  <div style={{ width, background: "#efece4", borderRadius: 10, padding: "22px 24px", boxShadow: "0 30px 60px -20px rgba(0,0,0,0.85)", color: "#1a1a1a" }}>
    <div style={{ fontFamily: theme.mono, fontSize: 15, color: "#666", letterSpacing: 2 }}>USA · MENSUEL</div>
    <div style={{ fontWeight: 900, fontSize: 30, lineHeight: 1.1, margin: "8px 0 14px" }}>{title}</div>
    {[1, 0.8, 0.9, 0.6, 0.85].map((w, i) => (
      <div key={i} style={{ height: 8, borderRadius: 4, background: "#bbb", width: `${w * 100}%`, marginBottom: 9 }} />
    ))}
  </div>
);

/** Little pill used as an output / label. */
export const Pill: React.FC<{ text: string; color?: string; size?: number; filled?: boolean }> = ({ text, color = c.accentBright, size = 24, filled }) => (
  <div
    style={{
      display: "inline-block",
      padding: "8px 20px",
      borderRadius: 999,
      border: `2px solid ${color}`,
      color: filled ? c.bg : color,
      background: filled ? color : `${color}14`,
      fontWeight: 800,
      fontSize: size,
      whiteSpace: "nowrap",
    }}
  >
    {text}
  </div>
);
