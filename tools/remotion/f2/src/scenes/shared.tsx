import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
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

/** Persistent ambient backdrop for the whole video: a very dark base plus a
 * soft, slightly off-center gold-accent radial glow that drifts slowly over
 * time (period well past a minute) so it reads as calm/institutional rather
 * than animated. Rendered once behind every scene, not per-scene, so the
 * drift stays continuous across scene cuts. */
export const AmbientBackground: React.FC = () => {
  const frame = useCurrentFrame();
  const driftX = 30 + Math.sin(frame / 720) * 6;
  const driftY = 20 + Math.sin(frame / 880 + 1.4) * 5;
  const glowOpacity = 0.1 + Math.sin(frame / 640) * 0.02;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: theme.colors.bg,
        backgroundImage: `radial-gradient(ellipse at ${driftX.toFixed(2)}% ${driftY.toFixed(2)}%, rgba(201,164,99,${glowOpacity.toFixed(3)}), transparent 60%)`,
      }}
    />
  );
};

/** Minimal line-art banknote glyph — used wherever a scene depicts money
 * kept "at the bank" rather than converted into gold. */
export const MoneyIcon: React.FC<{ size?: number; color?: string }> = ({
  size = 40,
  color = theme.colors.context,
}) => (
  <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="5" y="11" width="30" height="18" rx="3" stroke={color} strokeWidth="2" />
    <circle cx="20" cy="20" r="4.5" stroke={color} strokeWidth="2" />
    <line x1="9" y1="15" x2="9" y2="25" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <line x1="31" y1="15" x2="31" y2="25" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </svg>
);

/** Minimal line-art ingot glyph — used wherever a scene depicts value held
 * "in gold" instead of cash. */
export const GoldBarIcon: React.FC<{ size?: number; color?: string }> = ({
  size = 40,
  color = theme.colors.accent,
}) => (
  <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <polygon points="9,27 13,13 27,13 31,27" stroke={color} strokeWidth="2" strokeLinejoin="round" />
    <line x1="13" y1="13" x2="27" y2="13" stroke={color} strokeWidth="2" />
    <line x1="14.5" y1="18" x2="25.5" y2="18" stroke={color} strokeWidth="1.4" opacity={0.55} />
  </svg>
);
