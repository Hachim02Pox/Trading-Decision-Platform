import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { theme } from "../theme";
import { clamp } from "./characters";

export const Basket: React.FC<{ size?: number; color?: string; children?: React.ReactNode }> = ({
  size = 260,
  color = theme.colors.accent,
  children,
}) => (
  <div style={{ position: "relative", width: size, height: size * 0.8 }}>
    <div style={{ position: "absolute", left: size * 0.05, right: size * 0.05, bottom: size * 0.4, display: "flex", flexWrap: "nowrap", justifyContent: "center", alignItems: "flex-end", gap: 2 }}>
      {children}
    </div>
    <svg width={size} height={size * 0.8} viewBox="0 0 200 160" style={{ position: "absolute", left: 0, top: 0 }}>
      <path d="M50 70 Q100 0 150 70" stroke={color} strokeWidth="6" fill="none" strokeLinecap="round" />
      <path d="M14 70 H186 L166 150 H34 Z" fill={theme.colors.panelAlt} stroke={color} strokeWidth="5" strokeLinejoin="round" />
      {[45, 75, 105, 135, 160].map((x) => (
        <line key={x} x1={x} y1="76" x2={x - 8} y2="144" stroke={color} strokeWidth="2.5" opacity={0.5} />
      ))}
      <line x1="24" y1="105" x2="176" y2="105" stroke={color} strokeWidth="2.5" opacity={0.5} />
    </svg>
  </div>
);

export const Item: React.FC<{ kind: "bread" | "fuel" | "house" | "plane" | "scissors" | "beef" | "chicken" | "health" | "car"; size?: number }> = ({ kind, size = 56 }) => {
  const c = theme.colors;
  const glyphs: Record<string, React.ReactNode> = {
    bread: <path d="M8 30 Q8 12 30 12 Q52 12 52 30 L50 46 H10 Z" fill="#c9955a" stroke="#7a5230" strokeWidth="2" />,
    fuel: (
      <>
        <rect x="14" y="10" width="26" height="40" rx="4" fill={c.negative} />
        <rect x="19" y="16" width="16" height="10" rx="2" fill={c.panelAlt} />
        <path d="M40 18 L48 24 V44" stroke={c.textSecondary} strokeWidth="3" fill="none" />
      </>
    ),
    house: (
      <>
        <polygon points="30,8 54,28 6,28" fill={c.context} />
        <rect x="12" y="28" width="36" height="24" fill={c.panelAlt} stroke={c.context} strokeWidth="3" />
        <rect x="25" y="36" width="10" height="16" fill={c.context} />
      </>
    ),
    plane: <path d="M6 32 L54 24 L50 30 L30 34 L22 48 L16 48 L20 35 L8 36 Z" fill={c.textPrimary} />,
    scissors: (
      <>
        <circle cx="16" cy="44" r="7" stroke={c.accentBright} strokeWidth="3" fill="none" />
        <circle cx="36" cy="44" r="7" stroke={c.accentBright} strokeWidth="3" fill="none" />
        <line x1="20" y1="38" x2="44" y2="8" stroke={c.textSecondary} strokeWidth="4" />
        <line x1="32" y1="38" x2="12" y2="8" stroke={c.textSecondary} strokeWidth="4" />
      </>
    ),
    beef: <path d="M10 22 Q14 8 32 10 Q52 12 50 30 Q48 48 28 46 Q8 44 10 22 Z" fill="#b5483d" stroke="#6b231c" strokeWidth="2" />,
    chicken: (
      <>
        <path d="M14 30 Q14 12 32 14 Q48 16 46 32 Q44 44 30 44 Q16 44 14 30 Z" fill="#e0b27a" stroke="#8a6130" strokeWidth="2" />
        <line x1="42" y1="40" x2="52" y2="52" stroke="#f3f1ea" strokeWidth="5" strokeLinecap="round" />
      </>
    ),
    health: (
      <>
        <rect x="8" y="8" width="44" height="44" rx="10" fill={c.panelAlt} stroke={c.positive} strokeWidth="3" />
        <rect x="25" y="16" width="10" height="28" fill={c.positive} />
        <rect x="16" y="25" width="28" height="10" fill={c.positive} />
      </>
    ),
    car: (
      <>
        <path d="M6 36 L12 22 H44 L52 36 V46 H6 Z" fill={c.context} />
        <circle cx="16" cy="46" r="6" fill="#222" />
        <circle cx="42" cy="46" r="6" fill="#222" />
      </>
    ),
  };
  return (
    <svg width={size} height={size} viewBox="0 0 60 60">
      {glyphs[kind]}
    </svg>
  );
};

export const PriceTag: React.FC<{ text: string; color?: string; rotate?: number }> = ({ text, color = theme.colors.accentBright, rotate = -6 }) => (
  <div
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 8,
      background: theme.colors.panelAlt,
      border: `2px solid ${color}`,
      borderRadius: "10px 22px 22px 10px",
      padding: "6px 16px 6px 10px",
      color,
      fontFamily: theme.mono,
      fontWeight: 800,
      fontSize: 24,
      whiteSpace: "nowrap",
      transform: `rotate(${rotate}deg)`,
    }}
  >
    <span style={{ width: 9, height: 9, borderRadius: "50%", border: `2px solid ${color}` }} />
    {text}
  </div>
);

export const CoffeeCup: React.FC<{ size?: number }> = ({ size = 160 }) => {
  const frame = useCurrentFrame();
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={{ overflow: "visible" }}>
      {[0, 1, 2].map((i) => {
        const t = ((frame + i * 20) % 60) / 60;
        return (
          <path
            key={i}
            d={`M${34 + i * 12} ${30 - t * 22} q -5 -6 0 -12 q 5 -6 0 -12`}
            stroke={theme.colors.textMuted}
            strokeWidth="3"
            fill="none"
            opacity={1 - t}
            strokeLinecap="round"
          />
        );
      })}
      <path d="M22 36 H78 L72 86 Q70 92 64 92 H36 Q30 92 28 86 Z" fill="#e8e6df" />
      <path d="M78 46 Q94 46 92 60 Q90 72 74 72" stroke="#e8e6df" strokeWidth="7" fill="none" />
      <rect x="22" y="36" width="56" height="8" fill="#6b4a33" />
    </svg>
  );
};

export const Receipt: React.FC<{ lines: Array<[string, string]>; from: number; per?: number; width?: number }> = ({ lines, from, per = 12, width = 360 }) => {
  const frame = useCurrentFrame();
  const shown = Math.max(0, Math.min(lines.length, Math.floor((frame - from) / per) + 1));
  return (
    <div
      style={{
        width,
        background: "#efece4",
        color: "#222",
        fontFamily: theme.mono,
        fontSize: 22,
        padding: "20px 24px 26px",
        clipPath: "polygon(0 0,100% 0,100% 96%,95% 100%,90% 96%,85% 100%,80% 96%,75% 100%,70% 96%,65% 100%,60% 96%,55% 100%,50% 96%,45% 100%,40% 96%,35% 100%,30% 96%,25% 100%,20% 96%,15% 100%,10% 96%,5% 100%,0 96%)",
        boxShadow: "0 30px 60px -20px rgba(0,0,0,0.8)",
      }}
    >
      <div style={{ textAlign: "center", fontWeight: 800, marginBottom: 10 }}>TICKET DE CAISSE</div>
      {lines.slice(0, shown).map(([a, b], i) => (
        <div key={i} style={{ display: "flex", justifyContent: "space-between", borderTop: i === lines.length - 1 ? "2px dashed #555" : undefined, paddingTop: i === lines.length - 1 ? 8 : 2, fontWeight: i === lines.length - 1 ? 800 : 400 }}>
          <span>{a}</span>
          <span>{b}</span>
        </div>
      ))}
    </div>
  );
};

/** Speedometer: the needle angle is driven by `value` in [0,1]. */
export const Speedometer: React.FC<{ value: number; size?: number; label?: string }> = ({ value, size = 260, label }) => {
  const frame = useCurrentFrame();
  const jitter = Math.sin(frame / 3) * 1.2;
  const angle = -120 + value * 240 + jitter;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <svg width={size} height={size * 0.75} viewBox="0 0 200 150">
        <path d="M30 130 A80 80 0 1 1 170 130" stroke={theme.colors.hairline} strokeWidth="14" fill="none" strokeLinecap="round" />
        <path d="M30 130 A80 80 0 0 1 60 50" stroke={theme.colors.positive} strokeWidth="14" fill="none" strokeLinecap="round" />
        <path d="M140 50 A80 80 0 0 1 170 130" stroke={theme.colors.negative} strokeWidth="14" fill="none" strokeLinecap="round" />
        <line x1="100" y1="100" x2="100" y2="34" stroke={theme.colors.accentBright} strokeWidth="6" strokeLinecap="round" style={{ transform: `rotate(${angle}deg)`, transformOrigin: "100px 100px" }} />
        <circle cx="100" cy="100" r="10" fill={theme.colors.accentBright} />
      </svg>
      {label && <div style={{ color: theme.colors.textSecondary, fontFamily: theme.mono, fontSize: 20 }}>{label}</div>}
    </div>
  );
};

export const Factory: React.FC<{ size?: number; hot?: boolean }> = ({ size = 200, hot }) => {
  const frame = useCurrentFrame();
  const col = hot ? theme.colors.negative : theme.colors.textSecondary;
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" style={{ overflow: "visible" }}>
      {[0, 1].map((i) => {
        const t = ((frame + i * 25) % 50) / 50;
        return <circle key={i} cx={30 + t * 10} cy={18 - t * 20} r={6 + t * 8} fill={theme.colors.textMuted} opacity={0.5 * (1 - t)} />;
      })}
      <rect x="22" y="20" width="14" height="40" fill={col} />
      <path d="M10 110 V56 L40 40 V56 L70 40 V56 L100 40 V110 Z" fill={theme.colors.panelAlt} stroke={col} strokeWidth="4" strokeLinejoin="round" />
      {[24, 48, 72].map((x) => (
        <rect key={x} x={x} y="76" width="14" height="14" fill={hot ? theme.colors.negative : theme.colors.accent} opacity={0.8} />
      ))}
    </svg>
  );
};

export const Store: React.FC<{ size?: number }> = ({ size = 200 }) => (
  <svg width={size} height={size} viewBox="0 0 120 120">
    <rect x="14" y="44" width="92" height="66" fill={theme.colors.panelAlt} stroke={theme.colors.context} strokeWidth="4" />
    {[0, 1, 2, 3, 4, 5].map((i) => (
      <path key={i} d={`M${14 + i * 15.3} 44 L${14 + i * 15.3} 28 L${29.3 + i * 15.3} 28 L${29.3 + i * 15.3} 44 Q${21.6 + i * 15.3} 54 ${14 + i * 15.3} 44`} fill={i % 2 ? theme.colors.textPrimary : theme.colors.negative} />
    ))}
    <rect x="46" y="72" width="28" height="38" fill={theme.colors.context} />
    <rect x="22" y="60" width="18" height="16" fill={theme.colors.accent} opacity={0.7} />
    <rect x="80" y="60" width="18" height="16" fill={theme.colors.accent} opacity={0.7} />
  </svg>
);

export const Truck: React.FC<{ size?: number }> = ({ size = 150 }) => {
  const frame = useCurrentFrame();
  const spin = frame * 12;
  return (
    <svg width={size} height={size * 0.6} viewBox="0 0 100 60">
      <rect x="4" y="10" width="58" height="34" rx="3" fill={theme.colors.accentDim} />
      <path d="M62 20 H80 L94 34 V44 H62 Z" fill={theme.colors.context} />
      {[22, 78].map((x) => (
        <g key={x} style={{ transform: `rotate(${spin}deg)`, transformOrigin: `${x}px 48px` }}>
          <circle cx={x} cy="48" r="9" fill="#1d1d1d" />
          <line x1={x - 6} y1="48" x2={x + 6} y2="48" stroke="#777" strokeWidth="2" />
        </g>
      ))}
    </svg>
  );
};

/** Rope with a gold bar that slides between two teams; offset in px (negative = left team winning). */
export const Rope: React.FC<{ width: number; offset: number; children?: React.ReactNode }> = ({ width, offset, children }) => (
  <div style={{ position: "relative", width, height: 120 }}>
    <div style={{ position: "absolute", left: 0, right: 0, top: 58, height: 8, borderRadius: 4, background: "repeating-linear-gradient(90deg, #a07a45 0 14px, #7a5a30 14px 28px)", transform: `translateX(${offset * 0.15}px)` }} />
    <div style={{ position: "absolute", left: width / 2 - 1, top: 20, width: 2, height: 86, borderLeft: `2px dashed ${theme.colors.textMuted}` }} />
    <div style={{ position: "absolute", left: width / 2 - 45 + offset, top: 16 }}>{children}</div>
  </div>
);

/** Twelve-month window over a row of monthly bars; `windowStart` can be fractional to animate the slide. */
export const MonthWindow: React.FC<{
  values: number[];
  windowStart: number;
  highlight?: number[];
  dropped?: number[];
  barW?: number;
  gap?: number;
  appearFrom?: number;
}> = ({ values, windowStart, highlight = [], dropped = [], barW = 86, gap = 14, appearFrom = 0 }) => {
  const frame = useCurrentFrame();
  const max = Math.max(...values);
  return (
    <div style={{ position: "relative", height: 330, width: values.length * (barW + gap) }}>
      <div
        style={{
          position: "absolute",
          left: windowStart * (barW + gap) - 8,
          top: 0,
          width: 12 * (barW + gap) + 2,
          height: 300,
          border: `3px solid ${theme.colors.accent}`,
          borderRadius: 16,
          boxShadow: `0 0 30px -6px ${theme.colors.glow}`,
          background: `${theme.colors.accent}0d`,
        }}
      />
      {values.map((v, i) => {
        const appear = interpolate(frame, [appearFrom + i * 3, appearFrom + i * 3 + 14], [0, 1], { ...clamp, easing: theme.ease.out });
        const isDrop = dropped.includes(i);
        const isHi = highlight.includes(i);
        const h = (v / max) * 200 * appear;
        return (
          <div key={i} style={{ position: "absolute", left: i * (barW + gap), bottom: 40, width: barW, display: "flex", flexDirection: "column", alignItems: "center", opacity: isDrop ? 0.35 : 1 }}>
            <div style={{ color: isHi ? theme.colors.accentBright : theme.colors.textSecondary, fontFamily: theme.mono, fontSize: 19, fontWeight: 700, marginBottom: 6, opacity: appear }}>
              {v.toFixed(2).replace(".", ",")}
            </div>
            <div
              style={{
                width: barW - 18,
                height: h,
                borderRadius: 8,
                background: isHi ? `linear-gradient(180deg, ${theme.colors.accentBright}, ${theme.colors.accent})` : isDrop ? theme.colors.negative : `linear-gradient(180deg, ${theme.colors.context}, ${theme.colors.context}55)`,
              }}
            />
          </div>
        );
      })}
    </div>
  );
};
