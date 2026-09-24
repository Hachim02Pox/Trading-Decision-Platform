import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
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

/** Frame at which subtitle chunk `index` starts being spoken — the ground-truth
 * cue for revealing the visual element that chunk is talking about. */
export const cueFrame = (subtitles: SubtitleChunk[], index: number, fps = 30) =>
  Math.round((subtitles[index]?.start ?? 0) * fps);

export const SceneContainer: React.FC<{
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}> = ({ eyebrow, title, children }) => (
  <div
    style={{
      position: "absolute",
      inset: 0,
      display: "flex",
      flexDirection: "column",
      padding: "88px 140px 220px",
      fontFamily: theme.font,
    }}
  >
    <div
      style={{
        color: theme.colors.accent,
        fontFamily: theme.mono,
        fontSize: 24,
        letterSpacing: 3,
        textTransform: "uppercase",
        marginBottom: 18,
      }}
    >
      {eyebrow}
    </div>
    <h1
      style={{
        color: theme.colors.textPrimary,
        fontSize: 54,
        fontWeight: 600,
        margin: 0,
        marginBottom: 56,
        lineHeight: 1.2,
        maxWidth: 1400,
      }}
    >
      {title}
    </h1>
    <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
      {children}
    </div>
  </div>
);

export const fadeSlideIn = (frame: number, startFrame: number, durationFrames = 18) => {
  const local = frame - startFrame;
  const opacity = interpolate(local, [0, durationFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const translateY = interpolate(local, [0, durationFrames], [22, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
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
        fontSize: 22,
        fontFamily: theme.mono,
      }}
    >
      {label}
    </span>
  );
};

export const Panel: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({
  children,
  style,
}) => (
  <div
    style={{
      background: theme.colors.panel,
      border: `1px solid ${theme.colors.hairline}`,
      borderRadius: 20,
      padding: 36,
      ...style,
    }}
  >
    {children}
  </div>
);

/** Slow, calm, institutional ambient background: a very dark base plus a
 * soft off-center radial gradient in the accent gold that drifts gently
 * over a long period (~600-900 frames) via useCurrentFrame() + sine — not
 * flashy, just enough to keep the flat black from feeling dull. Rendered
 * once behind every scene. */
export const AmbientBackground: React.FC = () => {
  const frame = useCurrentFrame();
  const driftX = 30 + Math.sin(frame / 700) * 6;
  const driftY = 20 + Math.cos(frame / 850) * 4;
  const opacity = interpolate(Math.sin(frame / 620), [-1, 1], [0.07, 0.13]);
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: `radial-gradient(ellipse at ${driftX}% ${driftY}%, rgba(201,164,99,${opacity}), transparent 60%)`,
      }}
    />
  );
};

/** Simple line-art clock glyph — used to depict "two different time windows"
 * (today vs. five sessions ago) without relying on text alone. */
export const ClockIcon: React.FC<{ size?: number; color?: string }> = ({
  size = 24,
  color = theme.colors.context,
}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3.5 2" />
  </svg>
);

/** Simple line-art glyph of two currency discs mid-exchange (one marked
 * with a bar for "base", the other plain) — used wherever a scene depicts
 * an FX pair / quotation rather than a single currency. */
export const CurrencyPairIcon: React.FC<{ size?: number; color?: string }> = ({
  size = 40,
  color = theme.colors.accent,
}) => (
  <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="15" cy="16" r="10" stroke={color} strokeWidth="2" />
    <line x1="11" y1="16" x2="19" y2="16" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <circle cx="26" cy="25" r="10" stroke={color} strokeWidth="2" opacity="0.65" />
    <path d="M22 25h8" stroke={color} strokeWidth="2" strokeLinecap="round" opacity="0.65" />
    <path d="M26 21v8" stroke={color} strokeWidth="2" strokeLinecap="round" opacity="0.65" />
  </svg>
);

/** Simple line-art ingot glyph — used wherever a scene depicts Gold priced
 * in dollars, matching the style already established in F2's GoldBarIcon. */
export const GoldIcon: React.FC<{ size?: number; color?: string }> = ({
  size = 40,
  color = theme.colors.accent,
}) => (
  <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <polygon points="9,27 13,13 27,13 31,27" stroke={color} strokeWidth="2" strokeLinejoin="round" />
    <line x1="13" y1="13" x2="27" y2="13" stroke={color} strokeWidth="2" />
    <line x1="14.5" y1="18" x2="25.5" y2="18" stroke={color} strokeWidth="1.4" opacity={0.55} />
  </svg>
);
