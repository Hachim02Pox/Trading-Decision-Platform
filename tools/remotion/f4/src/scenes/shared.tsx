import React from "react";
import {
  AbsoluteFill,
  Audio,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { theme } from "../theme";

export interface SubtitleChunk {
  text: string;
  start: number;
  end: number;
}

export interface SceneProps {
  durationInFrames: number;
  subtitles: SubtitleChunk[];
}

/** Converts a subtitle chunk's start time (seconds) into a Remotion frame, so
 * a visual beat can be cued to fire exactly when the narrator says that
 * chunk's words, instead of a hardcoded frame-offset guess. */
export const cueFrame = (subtitles: SubtitleChunk[], index: number, fps = 30) =>
  Math.round((subtitles[index]?.start ?? 0) * fps);

/** Finds the subtitle chunk whose text contains a given substring (case-insensitive)
 * so a visual beat can be cued off a specific word landing, not a fragile index. */
export const cueWord = (subtitles: SubtitleChunk[], needle: string, fps = 30) => {
  const idx = subtitles.findIndex((s) => s.text.toLowerCase().includes(needle.toLowerCase()));
  return idx >= 0 ? cueFrame(subtitles, idx, fps) : 0;
};

// ---------------------------------------------------------------------------
// LAYER 1 — background mesh (never a flat solid background)
// ---------------------------------------------------------------------------
export const BgMesh: React.FC = () => {
  const frame = useCurrentFrame();
  const d1x = Math.sin(frame / 480) * 60;
  const d1y = Math.cos(frame / 560) * 40;
  const d2x = Math.cos(frame / 620) * 50;
  const d2y = Math.sin(frame / 540) * 45;
  return (
    <AbsoluteFill style={{ backgroundColor: theme.colors.bg }}>
      <div
        style={{
          position: "absolute",
          width: 1500,
          height: 1500,
          borderRadius: "50%",
          top: -560 + d1y,
          left: -360 + d1x,
          filter: "blur(90px)",
          background: `radial-gradient(circle, ${theme.colors.accent}22, transparent 62%)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          width: 1100,
          height: 1100,
          borderRadius: "50%",
          bottom: -420 - d2y,
          right: -300 - d2x,
          filter: "blur(100px)",
          background: `radial-gradient(circle, ${theme.colors.context}18, transparent 65%)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(180deg, rgba(0,0,0,0.18), transparent 30%, transparent 70%, rgba(0,0,0,0.28))",
        }}
      />
    </AbsoluteFill>
  );
};

// LAYER 4 — color grade (above content, below grain)
export const Grade: React.FC = () => (
  <AbsoluteFill style={{ pointerEvents: "none" }}>
    <AbsoluteFill style={{ backgroundColor: theme.colors.accent, mixBlendMode: "soft-light", opacity: 0.12 }} />
    <AbsoluteFill
      style={{
        background: "linear-gradient(180deg, rgba(0,0,0,0.14), transparent 26%, transparent 74%, rgba(0,0,0,0.26))",
      }}
    />
  </AbsoluteFill>
);

// LAYER 5a — procedural grain
export const Grain: React.FC = () => {
  const frame = useCurrentFrame();
  const noise = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='220'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='220' height='220' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E")`;
  return (
    <AbsoluteFill
      style={{
        pointerEvents: "none",
        backgroundImage: noise,
        backgroundSize: "220px",
        backgroundPosition: `${(frame * 7) % 220}px ${(frame * 13) % 220}px`,
        opacity: 0.045,
        mixBlendMode: "overlay",
      }}
    />
  );
};

// LAYER 5b — vignette (topmost)
export const Vignette: React.FC = () => (
  <AbsoluteFill
    style={{
      pointerEvents: "none",
      background: "radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.30) 100%)",
    }}
  />
);

/** The full post-processing stack every scene wraps its content with. */
export const PostStack: React.FC = () => (
  <>
    <Grade />
    <Grain />
    <Vignette />
  </>
);

// ---------------------------------------------------------------------------
// Motion primitives
// ---------------------------------------------------------------------------

/** Premium entrance: opacity + translateY + scale together, spring-driven. */
export const Entrance: React.FC<{
  delay?: number;
  springConfig?: keyof typeof theme.spring;
  y?: number;
  scaleFrom?: number;
  style?: React.CSSProperties;
  children: React.ReactNode;
}> = ({ delay = 0, springConfig = "smooth", y = 40, scaleFrom = 0.94, style, children }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - delay, fps, config: theme.spring[springConfig] });
  return (
    <div
      style={{
        opacity: p,
        transform: `translateY(${interpolate(p, [0, 1], [y, 0])}px) scale(${interpolate(p, [0, 1], [scaleFrom, 1])})`,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

/** Exit helper — apply to a wrapper's style in the last ~12 frames of a scene. */
export const exitStyle = (frame: number, durationInFrames: number, lift = 40) => {
  const y = interpolate(frame, [durationInFrames - 12, durationInFrames - 2], [0, -lift], {
    easing: theme.ease.in,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const o = interpolate(frame, [durationInFrames - 12, durationInFrames - 2], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return { opacity: o, transform: `translateY(${y}px)` };
};

/** Idle breathing for anything on screen for more than ~2s. */
export const useBreathe = (phase = 0) => {
  const frame = useCurrentFrame();
  const scale = 1 + Math.sin(frame / 22 + phase) * 0.014;
  const y = Math.sin(frame / 30 + phase) * 3;
  return { scale, y };
};

/** Word-by-word reveal for a headline. */
export const WordReveal: React.FC<{
  text: string;
  delay?: number;
  per?: number;
  style?: React.CSSProperties;
}> = ({ text, delay = 0, per = 3, style }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.26em", ...style }}>
      {text.split(" ").map((word, i) => {
        const p = spring({ frame: frame - delay - i * per, fps, config: theme.spring.snappy });
        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              opacity: p,
              transform: `translateY(${interpolate(p, [0, 1], [30, 0])}px)`,
            }}
          >
            {word}
          </span>
        );
      })}
    </div>
  );
};

/** Animated counter with tabular-nums — pass a formatter for %, bps, $, etc. */
export const AnimatedNumber: React.FC<{
  from: number;
  to: number;
  delay?: number;
  durationFrames?: number;
  format?: (n: number) => string;
  style?: React.CSSProperties;
}> = ({ from, to, delay = 0, durationFrames = 26, format = (n) => n.toFixed(2), style }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - delay, fps, config: { damping: 30, stiffness: 60 }, durationInFrames: durationFrames });
  const value = interpolate(p, [0, 1], [from, to]);
  return <span style={{ fontVariantNumeric: "tabular-nums", ...style }}>{format(value)}</span>;
};

// ---------------------------------------------------------------------------
// SFX
// ---------------------------------------------------------------------------
export const Sfx: React.FC<{ file: string; at: number; volume?: number }> = ({ file, at, volume = 0.6 }) => {
  if (at < 0) return null;
  return (
    <Sequence from={Math.max(0, Math.round(at))}>
      <Audio src={staticFile(`sfx/${file}`)} volume={volume} />
    </Sequence>
  );
};

// ---------------------------------------------------------------------------
// Layout chrome
// ---------------------------------------------------------------------------
export const SceneContainer: React.FC<{
  eyebrow: string;
  title: string;
  durationInFrames?: number;
  children: React.ReactNode;
}> = ({ eyebrow, title, durationInFrames, children }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const eyebrowP = spring({ frame, fps, config: theme.spring.snappy });
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        padding: "84px 130px 210px",
        fontFamily: theme.font,
        ...(durationInFrames ? exitStyle(frame, durationInFrames, 26) : {}),
      }}
    >
      <div
        style={{
          opacity: eyebrowP,
          transform: `translateX(${interpolate(eyebrowP, [0, 1], [-24, 0])}px)`,
          color: theme.colors.accent,
          fontFamily: theme.mono,
          fontSize: 23,
          letterSpacing: 3,
          textTransform: "uppercase",
          marginBottom: 16,
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <span style={{ width: 26, height: 2, background: theme.colors.accent, display: "inline-block" }} />
        {eyebrow}
      </div>
      <h1
        style={{
          color: theme.colors.textPrimary,
          fontSize: 52,
          fontWeight: 700,
          letterSpacing: "-0.01em",
          margin: 0,
          marginBottom: 50,
          lineHeight: 1.18,
          maxWidth: 1500,
        }}
      >
        <WordReveal text={title} delay={4} per={2.5} />
      </h1>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>{children}</div>
    </div>
  );
};

export const fadeSlideIn = (frame: number, startFrame: number, durationFrames = 18) => {
  const local = frame - startFrame;
  const opacity = interpolate(local, [0, durationFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: theme.ease.out,
  });
  const translateY = interpolate(local, [0, durationFrames], [26, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: theme.ease.out,
  });
  return { opacity, transform: `translateY(${translateY}px)` };
};

export const Chip: React.FC<{ label: string; tone?: "positive" | "negative" | "context" | "accent" }> = ({
  label,
  tone,
}) => {
  const color = tone ? theme.colors[tone] : theme.colors.textSecondary;
  return (
    <span
      style={{
        display: "inline-block",
        border: `1px solid ${color}`,
        color,
        borderRadius: 999,
        padding: "6px 18px",
        fontSize: 21,
        fontFamily: theme.mono,
      }}
    >
      {label}
    </span>
  );
};

export const Panel: React.FC<{ children: React.ReactNode; style?: React.CSSProperties; glow?: boolean }> = ({
  children,
  style,
  glow,
}) => (
  <div
    style={{
      background: `linear-gradient(160deg, ${theme.colors.panelAlt}, ${theme.colors.panel})`,
      border: `1px solid ${glow ? theme.colors.accent : theme.colors.hairline}`,
      borderRadius: 22,
      padding: 36,
      boxShadow: glow
        ? `0 30px 70px -25px rgba(0,0,0,0.65), 0 0 46px -10px ${theme.colors.glow}`
        : "0 30px 70px -30px rgba(0,0,0,0.6)",
      ...style,
    }}
  >
    {children}
  </div>
);

/** Persistent ambient backdrop kept for backward-compat name; now just BgMesh. */
export const AmbientBackground = BgMesh;

// ---------------------------------------------------------------------------
// Icon library — inline SVG, theme-colored, never emoji.
// ---------------------------------------------------------------------------
export const MoneyIcon: React.FC<{ size?: number; color?: string }> = ({ size = 40, color = theme.colors.context }) => (
  <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
    <rect x="5" y="11" width="30" height="18" rx="3" stroke={color} strokeWidth="2" />
    <circle cx="20" cy="20" r="4.5" stroke={color} strokeWidth="2" />
    <line x1="9" y1="15" x2="9" y2="25" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <line x1="31" y1="15" x2="31" y2="25" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export const GoldBarIcon: React.FC<{ size?: number; color?: string }> = ({ size = 40, color = theme.colors.accent }) => (
  <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
    <polygon points="9,27 13,13 27,13 31,27" stroke={color} strokeWidth="2" strokeLinejoin="round" />
    <line x1="13" y1="13" x2="27" y2="13" stroke={color} strokeWidth="2" />
    <line x1="14.5" y1="18" x2="25.5" y2="18" stroke={color} strokeWidth="1.4" opacity={0.55} />
  </svg>
);

export const CoinStackIcon: React.FC<{ size?: number; color?: string }> = ({ size = 40, color = theme.colors.accent }) => (
  <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
    <ellipse cx="20" cy="30" rx="13" ry="4.2" stroke={color} strokeWidth="2" />
    <ellipse cx="20" cy="23.5" rx="13" ry="4.2" stroke={color} strokeWidth="2" />
    <ellipse cx="20" cy="17" rx="13" ry="4.2" stroke={color} strokeWidth="2" />
    <ellipse cx="20" cy="10.5" rx="13" ry="4.2" stroke={color} strokeWidth="2" />
  </svg>
);

/** Bank / institution glyph — a small pediment with columns. */
export const BankIcon: React.FC<{ size?: number; color?: string }> = ({ size = 44, color = theme.colors.context }) => (
  <svg width={size} height={size} viewBox="0 0 44 44" fill="none">
    <polygon points="22,5 39,15 5,15" stroke={color} strokeWidth="2" strokeLinejoin="round" />
    <line x1="4" y1="15" x2="40" y2="15" stroke={color} strokeWidth="2" />
    <line x1="4" y1="36" x2="40" y2="36" stroke={color} strokeWidth="2" />
    <line x1="9" y1="19" x2="9" y2="33" stroke={color} strokeWidth="2" />
    <line x1="16" y1="19" x2="16" y2="33" stroke={color} strokeWidth="2" />
    <line x1="23" y1="19" x2="23" y2="33" stroke={color} strokeWidth="2" />
    <line x1="30" y1="19" x2="30" y2="33" stroke={color} strokeWidth="2" />
    <line x1="37" y1="19" x2="37" y2="33" stroke={color} strokeWidth="2" />
  </svg>
);

/** Balance scale — used for opportunity-cost framing. */
export const ScaleIcon: React.FC<{ size?: number; color?: string; tilt?: number }> = ({
  size = 60,
  color = theme.colors.textSecondary,
  tilt = 0,
}) => (
  <svg width={size} height={size} viewBox="0 0 60 60" fill="none">
    <line x1="30" y1="6" x2="30" y2="46" stroke={color} strokeWidth="2" />
    <g style={{ transform: `rotate(${tilt}deg)`, transformOrigin: "30px 12px" }}>
      <line x1="10" y1="12" x2="50" y2="12" stroke={color} strokeWidth="2" />
      <line x1="10" y1="12" x2="10" y2="24" stroke={color} strokeWidth="1.6" opacity={0.7} />
      <line x1="50" y1="12" x2="50" y2="24" stroke={color} strokeWidth="1.6" opacity={0.7} />
      <path d={`M 2 24 A 8 10 0 0 0 18 24 Z`} stroke={color} strokeWidth="1.6" opacity={0.85} />
      <path d={`M 42 24 A 8 10 0 0 0 58 24 Z`} stroke={color} strokeWidth="1.6" opacity={0.85} />
    </g>
    <polygon points="20,46 40,46 34,54 26,54" stroke={color} strokeWidth="2" strokeLinejoin="round" />
  </svg>
);

/** Small terminal / drawer glyph for the terminal-usage scene. */
export const TerminalGlyph: React.FC<{ size?: number; color?: string }> = ({
  size = 40,
  color = theme.colors.accent,
}) => (
  <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
    <rect x="4" y="6" width="32" height="22" rx="3" stroke={color} strokeWidth="2" />
    <line x1="10" y1="14" x2="20" y2="14" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <line x1="10" y1="19" x2="24" y2="19" stroke={color} strokeWidth="1.6" opacity={0.6} strokeLinecap="round" />
    <line x1="4" y1="32" x2="36" y2="32" stroke={color} strokeWidth="2" />
    <line x1="14" y1="32" x2="14" y2="36" stroke={color} strokeWidth="2" />
    <line x1="26" y1="32" x2="26" y2="36" stroke={color} strokeWidth="2" />
  </svg>
);

/** Rising banknote with a small spark — "money popping" beat. */
export const CashPopIcon: React.FC<{ size?: number; color?: string }> = ({
  size = 46,
  color = theme.colors.positive,
}) => (
  <svg width={size} height={size} viewBox="0 0 46 46" fill="none">
    <rect x="6" y="16" width="34" height="20" rx="3" stroke={color} strokeWidth="2" />
    <circle cx="23" cy="26" r="5" stroke={color} strokeWidth="2" />
    <text x="23" y="30" fontSize="7" fill={color} textAnchor="middle" fontFamily={theme.mono}>
      $
    </text>
    <path d="M23 10 L25 14 L21 14 Z" fill={color} opacity={0.8} />
    <line x1="12" y1="8" x2="12" y2="4" stroke={color} strokeWidth="1.6" opacity={0.7} strokeLinecap="round" />
    <line x1="34" y1="8" x2="34" y2="4" stroke={color} strokeWidth="1.6" opacity={0.7} strokeLinecap="round" />
  </svg>
);
