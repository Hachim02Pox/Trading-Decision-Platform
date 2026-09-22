import React from "react";
import { useCurrentFrame, interpolate } from "remotion";
import { theme } from "../theme";
import { fadeSlideIn, cueFrame, FedBuildingIcon } from "./shared";
import type { SceneProps } from "./shared";

export const Intro: React.FC<SceneProps> = ({ subtitles }) => {
  const frame = useCurrentFrame();

  // Reveal order follows the words as they're spoken:
  // 0. "La banque centrale américaine..." -> title appears right away
  // 1. "...décide aujourd'hui du taux d'intérêt" -> the FIXÉ (today) block
  // 3. "...les marchés eux essaient de deviner..." -> the ANTICIPÉ (market) block
  // 5. "F3 c'est la lecture de ces prévisions..." -> the recap sentence
  const titleAt = cueFrame(subtitles, 0);
  const fixedAt = cueFrame(subtitles, 1);
  const anticipatedAt = cueFrame(subtitles, 3);
  const subAt = cueFrame(subtitles, 5);

  const titleStyle = fadeSlideIn(frame, titleAt, 22);
  const subStyle = fadeSlideIn(frame, subAt, 22);

  const pulse = interpolate(Math.sin(frame / 16), [-1, 1], [0.4, 1]);
  const anticipatedStyle = fadeSlideIn(frame, anticipatedAt, 16);
  const anticipatedReveal = interpolate(frame, [anticipatedAt, anticipatedAt + 16], [0, 1], {
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
        F3 · Fed &amp; anticipations
      </div>
      <h1
        style={{
          ...titleStyle,
          color: theme.colors.textPrimary,
          fontSize: 56,
          fontWeight: 600,
          margin: 0,
          lineHeight: 1.25,
          maxWidth: 1550,
        }}
      >
        La Fed décide aujourd&apos;hui, le marché parie sur demain
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
        F3, c&apos;est la lecture de ces prévisions de marché sur la Fed — pas seulement la décision du jour
      </p>

      <div style={{ marginTop: 76, display: "flex", gap: 48, alignItems: "stretch" }}>
        <div
          style={{
            ...fadeSlideIn(frame, fixedAt, 16),
            width: 400,
            padding: "30px 28px",
            border: `2px solid ${theme.colors.accent}`,
            borderRadius: 18,
            background: theme.colors.panel,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <FedBuildingIcon size={30} color={theme.colors.accent} />
            <div style={{ color: theme.colors.accent, fontFamily: theme.mono, fontSize: 18, letterSpacing: 2 }}>
              FIXÉ
            </div>
          </div>
          <div style={{ color: theme.colors.textPrimary, fontSize: 30, fontWeight: 700, marginTop: 10 }}>
            Décision d&apos;aujourd&apos;hui
          </div>
        </div>
        <div
          style={{
            ...anticipatedStyle,
            width: 400,
            padding: "30px 28px",
            border: `2px dashed ${theme.colors.context}`,
            borderRadius: 18,
            background: theme.colors.panel,
            opacity: anticipatedReveal * pulse,
          }}
        >
          <div style={{ color: theme.colors.context, fontFamily: theme.mono, fontSize: 18, letterSpacing: 2 }}>
            ANTICIPÉ
          </div>
          <div style={{ color: theme.colors.textPrimary, fontSize: 30, fontWeight: 700, marginTop: 10 }}>
            Prévisions du marché
          </div>
        </div>
      </div>
    </div>
  );
};
