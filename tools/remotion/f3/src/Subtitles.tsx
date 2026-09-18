import React from "react";
import { useCurrentFrame, interpolate } from "remotion";
import { theme } from "./theme";

export interface SubtitleChunk {
  text: string;
  start: number;
  end: number;
}

const FPS = 30;

export const Subtitles: React.FC<{ subtitles: SubtitleChunk[] }> = ({ subtitles }) => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const active = subtitles.find((s) => t >= s.start && t < s.end);
  if (!active) return null;

  const localT = t - active.start;
  const dur = Math.max(active.end - active.start, 0.01);
  const fadeIn = interpolate(localT, [0, 0.1], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const fadeOut = interpolate(localT, [Math.max(dur - 0.1, 0), dur], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const opacity = Math.min(fadeIn, fadeOut);

  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 88,
        display: "flex",
        justifyContent: "center",
        padding: "0 160px",
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          opacity,
          color: theme.colors.textPrimary,
          fontSize: 40,
          fontWeight: 700,
          lineHeight: 1.3,
          textAlign: "center",
          fontFamily: theme.font,
          maxWidth: 1500,
          textShadow: "0 2px 10px rgba(0,0,0,0.85), 0 0 3px rgba(0,0,0,0.6)",
        }}
      >
        {active.text}
      </div>
    </div>
  );
};
