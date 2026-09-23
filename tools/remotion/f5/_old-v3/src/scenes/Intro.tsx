import React from "react";
import { useCurrentFrame, interpolate } from "remotion";
import { theme } from "../theme";
import { fadeSlideIn, cueFrame, WorkerIcon, FedBuildingIcon } from "./shared";
import type { SceneProps } from "./shared";

// Cue indices verified against the actual generated timeline (audio/timeline.json,
// scene 01 "intro"):
// chunk 0 "F5 c'est le thermomètre de l'économie américaine" -> title
// chunk 4 "ralentit Contrairement à F3"                       -> F3 vs F5 contrast note
// chunk 6 "banque centrale F5 ne dit jamais tout"             -> "ne dit jamais seul" panel
// chunk 8 "l'or Il donne juste la température"                -> thermometer panel
// chunk 10 "ensuite influence les décisions de la Fed"        -> closing arrow to the Fed
export const Intro: React.FC<SceneProps> = ({ subtitles }) => {
  const frame = useCurrentFrame();

  const titleAt = cueFrame(subtitles, 0);
  const contrastAt = cueFrame(subtitles, 4);
  const noAloneAt = cueFrame(subtitles, 6);
  const thermoAt = cueFrame(subtitles, 8);
  const fedAt = cueFrame(subtitles, 10);

  const titleStyle = fadeSlideIn(frame, titleAt, 22);
  const contrastStyle = fadeSlideIn(frame, contrastAt, 16);
  const noAloneStyle = fadeSlideIn(frame, noAloneAt, 16);
  const thermoStyle = fadeSlideIn(frame, thermoAt, 18);
  const fedStyle = fadeSlideIn(frame, fedAt, 16);

  const needleT = interpolate(Math.sin((frame - thermoAt) / 40), [-1, 1], [0.3, 0.72]);

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
        F5 · Emploi &amp; Croissance
      </div>
      <h1
        style={{
          ...titleStyle,
          color: theme.colors.textPrimary,
          fontSize: 54,
          fontWeight: 600,
          margin: 0,
          lineHeight: 1.25,
          maxWidth: 1500,
        }}
      >
        Le thermomètre de l&apos;économie américaine
      </h1>

      <div
        style={{
          ...contrastStyle,
          marginTop: 30,
          color: theme.colors.textSecondary,
          fontSize: 25,
          maxWidth: 1150,
          lineHeight: 1.5,
        }}
      >
        Contrairement à F3, qui parle directement des taux de la banque centrale...
      </div>

      <div style={{ marginTop: 54, display: "flex", gap: 40, alignItems: "stretch" }}>
        <div
          style={{
            ...noAloneStyle,
            width: 420,
            padding: "26px 28px",
            border: `2px dashed ${theme.colors.context}`,
            borderRadius: 18,
            background: theme.colors.panel,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          <div style={{ color: theme.colors.context, fontFamily: theme.mono, fontSize: 17, letterSpacing: 2 }}>
            F5 NE DIT JAMAIS SEUL
          </div>
          <div style={{ color: theme.colors.textPrimary, fontSize: 24, fontWeight: 600, marginTop: 8, lineHeight: 1.4 }}>
            Bon ou mauvais pour l&apos;or
          </div>
        </div>

        <div
          style={{
            ...thermoStyle,
            width: 420,
            padding: "26px 28px",
            border: `2px solid ${theme.colors.accent}`,
            borderRadius: 18,
            background: theme.colors.panel,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12, justifyContent: "center" }}>
            <WorkerIcon size={26} color={theme.colors.accent} />
            <div style={{ color: theme.colors.accent, fontFamily: theme.mono, fontSize: 17, letterSpacing: 2 }}>
              TEMPÉRATURE
            </div>
          </div>
          <div
            style={{
              marginTop: 16,
              height: 14,
              borderRadius: 999,
              background: theme.colors.panelAlt,
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                bottom: 0,
                width: `${needleT * 100}%`,
                background: `linear-gradient(90deg, ${theme.colors.context}, ${theme.colors.accentBright})`,
                borderRadius: 999,
              }}
            />
          </div>
        </div>
      </div>

      <div
        style={{
          ...fedStyle,
          marginTop: 44,
          display: "flex",
          alignItems: "center",
          gap: 14,
          color: theme.colors.textSecondary,
          fontSize: 24,
        }}
      >
        <FedBuildingIcon size={26} color={theme.colors.textSecondary} />
        influence, ensuite, les décisions de la Fed
      </div>
    </div>
  );
};
