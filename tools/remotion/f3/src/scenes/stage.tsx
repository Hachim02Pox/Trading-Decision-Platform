import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "../theme";
import { WordReveal, exitStyle } from "./shared";

export const STAGE_W = 1740;
export const STAGE_H = 690;

/** Compact header top-left + a full-width absolute stage for animated compositions. */
export const SceneShell: React.FC<{
  eyebrow: string;
  title: string;
  durationInFrames: number;
  children: React.ReactNode;
}> = ({ eyebrow, title, durationInFrames, children }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame, fps, config: theme.spring.snappy });
  return (
    <div style={{ position: "absolute", inset: 0, fontFamily: theme.font, ...exitStyle(frame, durationInFrames, 26) }}>
      <div style={{ position: "absolute", left: 90, top: 60 }}>
        <div
          style={{
            opacity: p,
            transform: `translateX(${interpolate(p, [0, 1], [-24, 0])}px)`,
            color: theme.colors.accent,
            fontFamily: theme.mono,
            fontSize: 21,
            letterSpacing: 3,
            textTransform: "uppercase",
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 10,
          }}
        >
          <span style={{ width: 26, height: 2, background: theme.colors.accent, display: "inline-block" }} />
          {eyebrow}
        </div>
        <div style={{ color: theme.colors.textPrimary, fontSize: 44, fontWeight: 700, letterSpacing: "-0.01em" }}>
          <WordReveal text={title} delay={4} per={2.5} />
        </div>
      </div>
      <div style={{ position: "absolute", left: 90, top: 200, width: STAGE_W, height: STAGE_H }}>{children}</div>
    </div>
  );
};

/** Full-stage flex center wrapper for a Beat's content. */
export const Center: React.FC<{ children: React.ReactNode; gap?: number; column?: boolean }> = ({ children, gap = 60, column }) => (
  <div
    style={{
      width: STAGE_W,
      height: STAGE_H,
      display: "flex",
      flexDirection: column ? "column" : "row",
      alignItems: "center",
      justifyContent: "center",
      gap,
    }}
  >
    {children}
  </div>
);

export const Big: React.FC<{ children: React.ReactNode; color?: string; size?: number; glow?: boolean }> = ({
  children,
  color = theme.colors.textPrimary,
  size = 54,
  glow,
}) => (
  <div
    style={{
      color,
      fontSize: size,
      fontWeight: 800,
      letterSpacing: "-0.02em",
      lineHeight: 1.15,
      textAlign: "center",
      textShadow: glow ? `0 0 40px ${theme.colors.glow}` : undefined,
    }}
  >
    {children}
  </div>
);

export const Label: React.FC<{ children: React.ReactNode; color?: string; size?: number }> = ({
  children,
  color = theme.colors.textSecondary,
  size = 22,
}) => <div style={{ color, fontSize: size, lineHeight: 1.4, textAlign: "center" }}>{children}</div>;
