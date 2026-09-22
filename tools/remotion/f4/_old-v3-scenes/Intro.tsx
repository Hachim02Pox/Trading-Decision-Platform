import React from "react";
import { useCurrentFrame, interpolate } from "remotion";
import { theme } from "../theme";
import { fadeSlideIn, cueFrame } from "./shared";
import type { SceneProps } from "./shared";

export const Intro: React.FC<SceneProps> = ({ subtitles }) => {
  const frame = useCurrentFrame();

  // Reveal order follows the words as they're spoken (see audio/timeline.json):
  // 0. "L'inflation c'est simplement la vitesse à laquelle..." -> title appears
  // 3. "Un chiffre qui ralentit ne veut pas..." -> subtitle (disinflation != deflation)
  // 7. "Une inflation qui fait peur peut pousser..." -> REFUGE block (positive)
  // 10. "Mais une inflation trop forte peut aussi..." -> REACTION block (negative)
  // 14. "Le même chiffre..." -> closing note
  const titleAt = cueFrame(subtitles, 0);
  const subAt = cueFrame(subtitles, 3);
  const refugeAt = cueFrame(subtitles, 7);
  const reactionAt = cueFrame(subtitles, 10);
  const noteAt = cueFrame(subtitles, 14);

  const titleStyle = fadeSlideIn(frame, titleAt, 22);
  const subStyle = fadeSlideIn(frame, subAt, 18);
  const noteStyle = fadeSlideIn(frame, noteAt, 16);

  const pulse = interpolate(Math.sin(frame / 16), [-1, 1], [0.4, 1]);
  const reactionReveal = interpolate(frame, [reactionAt, reactionAt + 16], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: theme.font,
        padding: "0 160px",
        textAlign: "center",
      }}
    >
      <div
        style={{
          ...titleStyle,
          color: theme.colors.accent,
          fontFamily: theme.mono,
          fontSize: 26,
          letterSpacing: 4,
          textTransform: "uppercase",
          marginBottom: 24,
        }}
      >
        F4 · Inflation
      </div>
      <h1
        style={{
          ...titleStyle,
          color: theme.colors.textPrimary,
          fontSize: 54,
          fontWeight: 600,
          margin: 0,
          lineHeight: 1.25,
          maxWidth: 1550,
        }}
      >
        L&apos;inflation, c&apos;est une vitesse, pas un niveau
      </h1>
      <p
        style={{
          ...subStyle,
          color: theme.colors.textSecondary,
          fontSize: 27,
          maxWidth: 1250,
          marginTop: 28,
          lineHeight: 1.5,
        }}
      >
        Un chiffre qui ralentit ne veut pas dire que les prix baissent — juste qu&apos;ils montent moins vite
      </p>

      <div style={{ marginTop: 68, display: "flex", gap: 48, alignItems: "stretch" }}>
        <div
          style={{
            ...fadeSlideIn(frame, refugeAt, 16),
            width: 430,
            padding: "30px 28px",
            border: `2px solid ${theme.colors.positive}`,
            borderRadius: 18,
            background: theme.colors.panel,
          }}
        >
          <div style={{ color: theme.colors.positive, fontFamily: theme.mono, fontSize: 18, letterSpacing: 2 }}>
            VALEUR REFUGE
          </div>
          <div style={{ color: theme.colors.textPrimary, fontSize: 28, fontWeight: 700, marginTop: 10, lineHeight: 1.4 }}>
            L&apos;inflation fait peur → pousse vers l&apos;or
          </div>
        </div>
        <div
          style={{
            ...fadeSlideIn(frame, reactionAt, 16),
            width: 430,
            padding: "30px 28px",
            border: `2px dashed ${theme.colors.negative}`,
            borderRadius: 18,
            background: theme.colors.panel,
            opacity: reactionReveal * pulse,
          }}
        >
          <div style={{ color: theme.colors.negative, fontFamily: theme.mono, fontSize: 18, letterSpacing: 2 }}>
            RÉACTION DE LA BANQUE CENTRALE
          </div>
          <div style={{ color: theme.colors.textPrimary, fontSize: 28, fontWeight: 700, marginTop: 10, lineHeight: 1.4 }}>
            Inflation trop forte → pèse sur l&apos;or
          </div>
        </div>
      </div>

      <div
        style={{
          ...noteStyle,
          marginTop: 44,
          color: theme.colors.accentBright,
          fontSize: 26,
          fontWeight: 600,
        }}
      >
        Le même chiffre… deux histoires opposées.
      </div>
    </div>
  );
};
