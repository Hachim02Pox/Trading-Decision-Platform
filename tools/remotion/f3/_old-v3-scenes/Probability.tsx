import React from "react";
import { useCurrentFrame, interpolate } from "remotion";
import { theme } from "../theme";
import { SceneContainer, Panel, fadeSlideIn, cueFrame } from "./shared";
import type { SceneProps } from "./shared";

const MAX_BAR_HEIGHT = 220;

export const Probability: React.FC<SceneProps> = ({ subtitles }) => {
  const frame = useCurrentFrame();

  // Each bar appears the instant its own number is spoken:
  // chunk 2 "...25 % de chance que rien..."
  // chunk 3 "...60 % de chance d'une petite..."
  // chunk 4 "...15 % de chance d'une grosse baisse"
  // chunk 8 "Il reste 40 % de chances que ce..." -> the "not a certainty" annotation
  const bars = [
    { label: "Rien ne change", value: 25, color: theme.colors.textSecondary, at: cueFrame(subtitles, 2) },
    { label: "Petite baisse", value: 60, color: theme.colors.accentBright, at: cueFrame(subtitles, 3) },
    { label: "Grosse baisse", value: 15, color: theme.colors.context, at: cueFrame(subtitles, 4) },
  ];
  const annotationAt = cueFrame(subtitles, 8);

  return (
    <SceneContainer eyebrow="F3 · Probabilités" title="Un pourcentage de chance pour chaque scénario">
      <div style={{ display: "flex", gap: 56, alignItems: "flex-end", height: MAX_BAR_HEIGHT + 70 }}>
        {bars.map((bar) => {
          const grow = interpolate(frame, [bar.at, bar.at + 20], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          const h = Math.max(6, (bar.value / 60) * MAX_BAR_HEIGHT * grow);
          const style = fadeSlideIn(frame, bar.at, 14);
          return (
            <div
              key={bar.label}
              style={{
                ...style,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "flex-end",
                height: MAX_BAR_HEIGHT + 70,
              }}
            >
              <div
                style={{
                  color: theme.colors.textPrimary,
                  fontFamily: theme.mono,
                  fontSize: 26,
                  fontWeight: 700,
                  marginBottom: 10,
                }}
              >
                {bar.value} %
              </div>
              <div style={{ width: 92, height: h, background: bar.color, borderRadius: "8px 8px 0 0" }} />
              <div style={{ color: theme.colors.textSecondary, fontSize: 22, marginTop: 12, fontFamily: theme.mono }}>
                {bar.label}
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ ...fadeSlideIn(frame, annotationAt, 16), marginTop: 44 }}>
        <Panel style={{ display: "inline-block", padding: "20px 32px", borderColor: theme.colors.accent }}>
          <span style={{ color: theme.colors.accentBright, fontSize: 28, fontFamily: theme.mono, fontWeight: 700 }}>
            40 % de chances que ce ne soit pas ça
          </span>
        </Panel>
      </div>
    </SceneContainer>
  );
};
