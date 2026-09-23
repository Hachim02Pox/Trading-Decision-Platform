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

/** Simple line-art bank/institution glyph (columns + pediment) — used
 * wherever a scene depicts the Fed as an institution rather than just a
 * text label. */
export const FedBuildingIcon: React.FC<{ size?: number; color?: string }> = ({
  size = 32,
  color = theme.colors.accent,
}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 9L12 3l10 6" />
    <line x1="3" y1="9" x2="21" y2="9" />
    <line x1="4" y1="9" x2="4" y2="19" />
    <line x1="8" y1="9" x2="8" y2="19" />
    <line x1="12" y1="9" x2="12" y2="19" />
    <line x1="16" y1="9" x2="16" y2="19" />
    <line x1="20" y1="9" x2="20" y2="19" />
    <line x1="2" y1="19" x2="22" y2="19" />
    <line x1="2" y1="21" x2="22" y2="21" />
  </svg>
);

/** Simple clock glyph — used to depict "has this changed since the last
 * reading" without relying on text alone. */
export const ClockIcon: React.FC<{ size?: number; color?: string }> = ({
  size = 24,
  color = theme.colors.context,
}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3.5 2" />
  </svg>
);

/** Simple external-link glyph — used wherever a scene points to a link or
 * a resource outside the terminal, instead of a bare text arrow. */
export const ExternalLinkIcon: React.FC<{ size?: number; color?: string }> = ({
  size = 22,
  color = theme.colors.accentBright,
}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <path d="M7 17L17 7" />
    <path d="M9 7h8v8" />
  </svg>
);

/** Simple line-art person silhouette (head + shoulders) — used for F5
 * concepts about people: unemployment, the labor force, who is counted. */
export const WorkerIcon: React.FC<{ size?: number; color?: string }> = ({
  size = 28,
  color = theme.colors.accent,
}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="7" r="4" />
    <path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8" />
  </svg>
);

/** Simple line-art briefcase (body + handle) — used for F5 concepts about
 * jobs specifically (as distinct from people): payrolls, jobs created. */
export const BriefcaseIcon: React.FC<{ size?: number; color?: string }> = ({
  size = 28,
  color = theme.colors.accent,
}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="8" width="18" height="12" rx="2" />
    <path d="M8 8V6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <line x1="3" y1="13" x2="21" y2="13" />
  </svg>
);
