import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "../theme";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/** A stage beat: visible only inside [from, to), springs in, exits fast, never overlaps the next beat. */
export const Beat: React.FC<{
  from: number;
  to?: number;
  style?: React.CSSProperties;
  y?: number;
  children: React.ReactNode;
}> = ({ from, to, style, y = 40, children }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (to !== undefined && frame >= to) return null;
  const p = spring({ frame: frame - from, fps, config: theme.spring.smooth });
  const out =
    to === undefined
      ? 1
      : interpolate(frame, [to - 10, to - 1], [1, 0], { ...clamp, easing: theme.ease.in });
  return (
    <div
      style={{
        position: "absolute",
        opacity: p * out,
        transform: `translateY(${interpolate(p, [0, 1], [y, 0]) - (1 - out) * 30}px) scale(${interpolate(p, [0, 1], [0.95, 1])})`,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

/** Pops a child in with a bouncy spring at `at`. */
export const Pop: React.FC<{ at: number; children: React.ReactNode; style?: React.CSSProperties }> = ({ at, children, style }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - at, fps, config: theme.spring.bouncy });
  return (
    <div style={{ opacity: Math.min(1, p * 1.4), transform: `scale(${interpolate(p, [0, 1], [0.3, 1])})`, ...style }}>
      {children}
    </div>
  );
};

/** Flat "bonhomme": head, eyes, body, arms, legs. Idle bob + optional wave / cheer. */
export const Person: React.FC<{
  size?: number;
  color?: string;
  skin?: string;
  phase?: number;
  wave?: boolean;
  cheer?: boolean;
  run?: boolean;
  label?: string;
}> = ({ size = 90, color = theme.colors.context, skin = "#d9b99b", phase = 0, wave, cheer, run, label }) => {
  const frame = useCurrentFrame();
  const bob = Math.sin(frame / 9 + phase) * (run ? 4 : 1.6);
  const armSwing = run ? Math.sin(frame / 3 + phase) * 35 : 0;
  const waveAngle = wave ? -130 + Math.sin(frame / 4 + phase) * 22 : cheer ? -150 : 20 + armSwing;
  const otherArm = cheer ? 150 : -20 - armSwing;
  const legSwing = run ? Math.sin(frame / 3 + phase) * 28 : 0;
  const blink = Math.floor((frame + phase * 40) % 110) < 4;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <svg width={size * 0.8} height={size} viewBox="0 0 80 100" style={{ overflow: "visible", transform: `translateY(${bob}px)` }}>
        <g style={{ transform: `rotate(${legSwing}deg)`, transformOrigin: "34px 68px" }}>
          <line x1="34" y1="68" x2="32" y2="95" stroke={theme.colors.textSecondary} strokeWidth="6" strokeLinecap="round" />
        </g>
        <g style={{ transform: `rotate(${-legSwing}deg)`, transformOrigin: "46px 68px" }}>
          <line x1="46" y1="68" x2="48" y2="95" stroke={theme.colors.textSecondary} strokeWidth="6" strokeLinecap="round" />
        </g>
        <g style={{ transform: `rotate(${otherArm}deg)`, transformOrigin: "24px 40px" }}>
          <line x1="24" y1="40" x2="24" y2="64" stroke={color} strokeWidth="6" strokeLinecap="round" />
        </g>
        <g style={{ transform: `rotate(${-waveAngle}deg)`, transformOrigin: "56px 40px" }}>
          <line x1="56" y1="40" x2="56" y2="64" stroke={color} strokeWidth="6" strokeLinecap="round" />
        </g>
        <path d="M22 40 Q22 34 30 34 L50 34 Q58 34 58 40 L56 72 L24 72 Z" fill={color} />
        <circle cx="40" cy="20" r="14" fill={skin} />
        <ellipse cx="35" cy="19" rx="1.8" ry={blink ? 0.3 : 2.2} fill="#1b1b1b" />
        <ellipse cx="45" cy="19" rx="1.8" ry={blink ? 0.3 : 2.2} fill="#1b1b1b" />
        <path d={cheer ? "M34 25 Q40 31 46 25" : "M35 26 Q40 28 45 26"} stroke="#1b1b1b" strokeWidth="1.6" fill="none" strokeLinecap="round" />
      </svg>
      {label && (
        <div style={{ color: theme.colors.textSecondary, fontFamily: theme.mono, fontSize: Math.max(14, size * 0.17), marginTop: 6 }}>
          {label}
        </div>
      )}
    </div>
  );
};

/** Thought / speech bubble. */
export const Bubble: React.FC<{ text: string; tone?: string; width?: number; tail?: "left" | "right" | "bottom" }> = ({
  text,
  tone = theme.colors.textPrimary,
  width = 300,
  tail = "bottom",
}) => (
  <div style={{ position: "relative", width }}>
    <div
      style={{
        background: theme.colors.panelAlt,
        border: `1.5px solid ${tone}`,
        borderRadius: 22,
        padding: "16px 22px",
        color: tone,
        fontSize: 24,
        fontWeight: 700,
        textAlign: "center",
        lineHeight: 1.3,
        boxShadow: "0 20px 40px -18px rgba(0,0,0,0.7)",
      }}
    >
      {text}
    </div>
    <div
      style={{
        position: "absolute",
        width: 18,
        height: 18,
        background: theme.colors.panelAlt,
        borderRight: `1.5px solid ${tone}`,
        borderBottom: `1.5px solid ${tone}`,
        transform: "rotate(45deg)",
        ...(tail === "bottom" ? { bottom: -10, left: "50%", marginLeft: -9 } : tail === "left" ? { left: -10, top: "50%", marginTop: -9, transform: "rotate(135deg)" } : { right: -10, top: "50%", marginTop: -9, transform: "rotate(-45deg)" }),
      }}
    />
  </div>
);

/** The Fed speaker: a person behind a podium with a microphone and a seal. */
export const FedSpeaker: React.FC<{ size?: number; talking?: boolean }> = ({ size = 220, talking = true }) => {
  const frame = useCurrentFrame();
  const mouth = talking ? 1 + Math.abs(Math.sin(frame / 3.2)) * 3 : 1;
  const gesture = talking ? Math.sin(frame / 11) * 18 : 0;
  return (
    <svg width={size} height={size * 1.1} viewBox="0 0 200 220" style={{ overflow: "visible" }}>
      <g style={{ transform: `rotate(${-40 + gesture}deg)`, transformOrigin: "128px 92px" }}>
        <line x1="128" y1="92" x2="128" y2="130" stroke="#2d3a4a" strokeWidth="10" strokeLinecap="round" />
      </g>
      <path d="M68 92 Q68 80 82 80 L118 80 Q132 80 132 92 L130 150 L70 150 Z" fill="#2d3a4a" />
      <path d="M96 80 L100 104 L104 80 Z" fill={theme.colors.accent} />
      <circle cx="100" cy="56" r="22" fill="#d6b394" />
      <path d="M78 50 Q80 30 100 30 Q120 30 122 50 Q112 40 100 42 Q88 40 78 50Z" fill="#b8b8b8" />
      <circle cx="92" cy="56" r="2.4" fill="#1b1b1b" />
      <circle cx="108" cy="56" r="2.4" fill="#1b1b1b" />
      <ellipse cx="100" cy="68" rx="5" ry={mouth} fill="#5a2e2e" />
      <line x1="84" y1="116" x2="100" y2="88" stroke={theme.colors.textMuted} strokeWidth="3" />
      <circle cx="100" cy="86" r="5" fill={theme.colors.textMuted} />
      <path d="M40 120 L160 120 L150 218 L50 218 Z" fill={theme.colors.panelAlt} stroke={theme.colors.hairline} strokeWidth="2" />
      <circle cx="100" cy="164" r="22" fill="none" stroke={theme.colors.accent} strokeWidth="2.5" />
      <text x="100" y="171" textAnchor="middle" fontSize="18" fontWeight="700" fill={theme.colors.accent} fontFamily={theme.mono}>
        FED
      </text>
    </svg>
  );
};

/** Hawk (faucon) or dove (colombe) with flapping wings. */
export const Bird: React.FC<{ kind: "hawk" | "dove"; size?: number; flip?: boolean }> = ({ kind, size = 160, flip }) => {
  const frame = useCurrentFrame();
  const flap = Math.sin(frame / 4.5) * 24;
  const hover = Math.sin(frame / 12) * 6;
  const hawk = kind === "hawk";
  const body = hawk ? "#8a5a3a" : "#e8e6df";
  const wing = hawk ? "#6d4429" : "#cfd8e0";
  const beak = hawk ? "#e0a93b" : "#e3a86b";
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 160 160"
      style={{ overflow: "visible", transform: `translateY(${hover}px) scaleX(${flip ? -1 : 1})` }}
    >
      <path d="M30 92 L4 80 L10 100 L4 116 L34 104 Z" fill={wing} />
      <ellipse cx="72" cy="96" rx="44" ry="26" fill={body} />
      <g style={{ transform: `rotate(${10 + flap}deg)`, transformOrigin: "80px 88px" }}>
        <path d="M82 86 Q52 58 16 70 Q30 78 26 84 Q40 86 38 92 Q58 100 80 100 Z" fill={wing} stroke={hawk ? "#4f2f1c" : "#aeb9c4"} strokeWidth="1.5" />
      </g>
      <circle cx="114" cy="74" r="20" fill={body} />
      {hawk ? (
        <>
          <path d="M130 70 L150 76 Q146 88 134 84 Z" fill={beak} />
          <line x1="110" y1="64" x2="124" y2="68" stroke="#2a1a10" strokeWidth="3.4" strokeLinecap="round" />
        </>
      ) : (
        <>
          <path d="M131 72 L146 76 L131 80 Z" fill={beak} />
          <path d="M140 84 Q150 96 142 106" stroke={theme.colors.positive} strokeWidth="3" fill="none" />
          <ellipse cx="146" cy="95" rx="5" ry="2.6" fill={theme.colors.positive} transform="rotate(50 146 95)" />
        </>
      )}
      <circle cx="120" cy="71" r="3.4" fill="#141414" />
      <path d="M60 120 L56 136 M84 120 L88 136" stroke={beak} strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
};

/** Deterministic pseudo-random series for live charts. */
export const series = (n: number, seed: number, drift = 0, vol = 1) => {
  const out: number[] = [];
  let v = 50;
  let s = seed;
  for (let i = 0; i < n; i++) {
    s = (s * 9301 + 49297) % 233280;
    v += (s / 233280 - 0.5) * 6 * vol + drift;
    out.push(v);
  }
  return out;
};

/** A line chart that draws itself live, with a glowing head and an area fill. */
export const LiveChart: React.FC<{
  data: number[];
  width: number;
  height: number;
  from: number;
  drawFrames?: number;
  color?: string;
  label?: string;
}> = ({ data, width, height, from, drawFrames = 60, color = theme.colors.accent, label }) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [from, from + drawFrames], [0, 1], { ...clamp, easing: theme.ease.inOut });
  const min = Math.min(...data);
  const max = Math.max(...data);
  const pts = data.map((v, i) => [(i / (data.length - 1)) * width, height - ((v - min) / (max - min || 1)) * (height - 20) - 10]);
  const count = Math.max(2, Math.floor(p * (pts.length - 1)) + 1);
  const shown = pts.slice(0, count);
  const d = shown.map((q, i) => `${i === 0 ? "M" : "L"}${q[0].toFixed(1)},${q[1].toFixed(1)}`).join(" ");
  const head = shown[shown.length - 1];
  const gid = `g${Math.round(from)}${Math.round(width)}`;
  return (
    <svg width={width} height={height + 30} style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75].map((g) => (
        <line key={g} x1="0" x2={width} y1={height * g} y2={height * g} stroke={theme.colors.hairlineSoft} strokeWidth="1" />
      ))}
      <path d={`${d} L${head[0]},${height} L0,${height} Z`} fill={`url(#${gid})`} />
      <path d={d} fill="none" stroke={color} strokeWidth="3.5" strokeLinejoin="round" strokeLinecap="round" />
      {p > 0 && (
        <>
          <circle cx={head[0]} cy={head[1]} r={14 + Math.sin(frame / 5) * 3} fill={color} opacity={0.2} />
          <circle cx={head[0]} cy={head[1]} r={6} fill={color} />
        </>
      )}
      {label && (
        <text x="0" y={height + 26} fill={theme.colors.textMuted} fontSize="17" fontFamily={theme.mono}>
          {label}
        </text>
      )}
    </svg>
  );
};

/** Domino tile that tips over when triggered. */
export const Domino: React.FC<{ at: number; label: string; icon?: React.ReactNode; tone?: string }> = ({
  at,
  label,
  icon,
  tone = theme.colors.accent,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const fall = spring({ frame: frame - at, fps, config: { damping: 12, stiffness: 120, mass: 0.8 } });
  const tilt = interpolate(fall, [0, 1], [0, 16]);
  const lit = frame >= at;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 230 }}>
      <div
        style={{
          width: 150,
          height: 210,
          borderRadius: 18,
          background: lit ? `linear-gradient(170deg, ${tone}40, ${theme.colors.panel})` : theme.colors.panel,
          border: `2px solid ${lit ? tone : theme.colors.hairline}`,
          boxShadow: lit ? `0 0 40px -8px ${tone}` : "0 20px 40px -20px rgba(0,0,0,0.7)",
          transform: `rotate(${tilt}deg)`,
          transformOrigin: "80% 100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {icon}
      </div>
      <div
        style={{
          color: lit ? theme.colors.textPrimary : theme.colors.textMuted,
          fontSize: 20,
          fontWeight: 700,
          marginTop: 22,
          textAlign: "center",
          lineHeight: 1.3,
        }}
      >
        {label}
      </div>
    </div>
  );
};

/** Mouse cursor that glides between points and clicks. */
export const Cursor: React.FC<{ path: Array<{ at: number; x: number; y: number; click?: boolean }> }> = ({ path }) => {
  const frame = useCurrentFrame();
  let x = path[0].x;
  let y = path[0].y;
  let clickP = 0;
  for (let i = 1; i < path.length; i++) {
    const a = path[i - 1];
    const b = path[i];
    const t = interpolate(frame, [b.at - 18, b.at], [0, 1], { ...clamp, easing: theme.ease.inOut });
    if (frame >= b.at - 18) {
      x = a.x + (b.x - a.x) * t;
      y = a.y + (b.y - a.y) * t;
    }
    if (b.click && frame >= b.at && frame < b.at + 10) clickP = 1 - (frame - b.at) / 10;
  }
  if (frame < path[0].at) return null;
  return (
    <div style={{ position: "absolute", left: x, top: y, pointerEvents: "none" }}>
      {clickP > 0 && (
        <div
          style={{
            position: "absolute",
            left: -26,
            top: -26,
            width: 52,
            height: 52,
            borderRadius: "50%",
            border: `3px solid ${theme.colors.accentBright}`,
            opacity: clickP,
            transform: `scale(${1.6 - clickP * 0.6})`,
          }}
        />
      )}
      <svg width="34" height="40" viewBox="0 0 34 40">
        <path d="M3 2 L3 32 L11 25 L17 38 L23 35 L17 22 L28 22 Z" fill="#f3f1ea" stroke="#111" strokeWidth="2" strokeLinejoin="round" />
      </svg>
    </div>
  );
};

export const DocIcon: React.FC<{ size?: number; color?: string }> = ({ size = 60, color = theme.colors.textSecondary }) => (
  <svg width={size} height={size} viewBox="0 0 60 60" fill="none">
    <path d="M14 6 H38 L48 16 V54 H14 Z" stroke={color} strokeWidth="2.4" strokeLinejoin="round" />
    <path d="M38 6 V16 H48" stroke={color} strokeWidth="2.4" strokeLinejoin="round" />
    {[26, 33, 40, 47].map((y) => (
      <line key={y} x1="20" y1={y} x2={y === 47 ? 32 : 42} y2={y} stroke={color} strokeWidth="2" strokeLinecap="round" opacity={0.7} />
    ))}
  </svg>
);

export const ClockIcon: React.FC<{ size?: number; color?: string }> = ({ size = 60, color = theme.colors.accent }) => {
  const frame = useCurrentFrame();
  const a = (frame * 6) % 360;
  return (
    <svg width={size} height={size} viewBox="0 0 60 60" fill="none">
      <circle cx="30" cy="30" r="24" stroke={color} strokeWidth="2.6" />
      <line x1="30" y1="30" x2="30" y2="16" stroke={color} strokeWidth="3" strokeLinecap="round" style={{ transform: `rotate(${a / 12}deg)`, transformOrigin: "30px 30px" }} />
      <line x1="30" y1="30" x2="30" y2="10" stroke={color} strokeWidth="2" strokeLinecap="round" style={{ transform: `rotate(${a}deg)`, transformOrigin: "30px 30px" }} />
    </svg>
  );
};

export const DollarIcon: React.FC<{ size?: number; color?: string }> = ({ size = 60, color = theme.colors.positive }) => (
  <svg width={size} height={size} viewBox="0 0 60 60" fill="none">
    <circle cx="30" cy="30" r="25" stroke={color} strokeWidth="2.6" />
    <text x="30" y="40" textAnchor="middle" fontSize="30" fontWeight="700" fill={color} fontFamily={theme.mono}>
      $
    </text>
  </svg>
);

export const ArrowGlyph: React.FC<{ up: boolean; color: string; size?: number }> = ({ up, color, size = 40 }) => (
  <svg width={size} height={size} viewBox="0 0 40 40" style={{ transform: up ? "none" : "rotate(180deg)" }}>
    <path d="M20 34 V6 M20 6 L9 17 M20 6 L31 17" stroke={color} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
  </svg>
);

export { clamp };
