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

/** Simple line-art shopping-basket glyph — used wherever a scene depicts
 * "what people actually pay" (the CPI household basket) as a concrete
 * object rather than an abstract index. */
export const BasketIcon: React.FC<{ size?: number; color?: string }> = ({
  size = 40,
  color = theme.colors.accent,
}) => (
  <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M8 16h24l-2.6 15.5a2 2 0 0 1-2 1.7H12.6a2 2 0 0 1-2-1.7L8 16Z" stroke={color} strokeWidth="2" strokeLinejoin="round" />
    <path d="M13 16l3-8" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <path d="M27 16l-3-8" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <line x1="6" y1="16" x2="34" y2="16" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <line x1="16" y1="20.5" x2="17" y2="28" stroke={color} strokeWidth="1.4" opacity={0.55} strokeLinecap="round" />
    <line x1="24" y1="20.5" x2="23" y2="28" stroke={color} strokeWidth="1.4" opacity={0.55} strokeLinecap="round" />
  </svg>
);
