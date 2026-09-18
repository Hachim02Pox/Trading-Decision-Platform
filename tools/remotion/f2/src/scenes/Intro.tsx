import React from "react";
import { useCurrentFrame, interpolate } from "remotion";
import { theme } from "../theme";
import { fadeSlideIn, cueFrame, Panel, MoneyIcon, GoldBarIcon } from "./shared";
import type { SceneProps } from "./shared";

export const Intro: React.FC<SceneProps> = ({ subtitles }) => {
  const frame = useCurrentFrame();

  // Cue frames, one per subtitle chunk that first speaks the matching idea:
  //  0 "Pourquoi les taux d'intérêt font bouger le" -> title
  //  1 "prix de l'or"                                -> subtitle line
  //  2 "Imaginons Hachim a 1000 dollars"              -> Hachim example card
  //  3 "Il a deux choix"                              -> seesaw appears
  //  4 "Il peut les mettre à la banque"                -> bank bubble
  //  7 "l'or qui ne lui donne jamais rien"             -> gold bubble
  // 14 "Et en dézoomant"                                -> zoom-out tag
  const titleAt = cueFrame(subtitles, 0);
  const subAt = cueFrame(subtitles, 1);
  const cardAt = cueFrame(subtitles, 2);
  const seesawAt = cueFrame(subtitles, 3);
  const bankAt = cueFrame(subtitles, 4);
  const goldAt = cueFrame(subtitles, 7);
  const zoomAt = cueFrame(subtitles, 14);

  const titleStyle = fadeSlideIn(frame, titleAt, 22);
  const subStyle = fadeSlideIn(frame, subAt, 18);
  const cardStyle = fadeSlideIn(frame, cardAt, 18);
  const seesawStyle = fadeSlideIn(frame, seesawAt, 16);
  const bankStyle = fadeSlideIn(frame, bankAt, 14);
  const goldStyle = fadeSlideIn(frame, goldAt, 14);
  const zoomStyle = fadeSlideIn(frame, zoomAt, 16);

  const tilt = interpolate(Math.sin(frame / 22), [-1, 1], [-7, 7]);

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
        F2 · Taux
      </div>
      <h1
        style={{
          ...titleStyle,
          color: theme.colors.textPrimary,
          fontSize: 62,
          fontWeight: 600,
          margin: 0,
          lineHeight: 1.25,
          maxWidth: 1500,
        }}
      >
        Pourquoi les taux font bouger le prix de l&apos;or ?
      </h1>
      <p
        style={{
          ...subStyle,
          color: theme.colors.textSecondary,
          fontSize: 28,
          maxWidth: 1200,
          marginTop: 32,
          lineHeight: 1.5,
        }}
      >
        Ce que ton argent rapporte ailleurs, comparé à ce que l&apos;or ne rapporte jamais
      </p>

      <div style={{ ...cardStyle, marginTop: 44 }}>
        <Panel style={{ padding: "18px 40px" }}>
          <span style={{ color: theme.colors.accentBright, fontFamily: theme.mono, fontSize: 30, fontWeight: 700 }}>
            1 000 $
          </span>
          <span style={{ color: theme.colors.textSecondary, fontSize: 22, marginLeft: 16 }}>
            entre les mains de Hachim
          </span>
        </Panel>
      </div>

      {/* Bubbles sit in normal document flow (not absolutely positioned over
          the bar) so the column below — the bar, the stand, and the
          zoom-out line — always reserves real layout space beneath them.
          That's what keeps this block from ever overlapping the line that
          follows it, at any point in the scene's timeline. */}
      <div style={{ ...seesawStyle, marginTop: 76, display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", width: 640 }}>
          <div style={{ ...bankStyle }}>
            <Bubble
              icon={<MoneyIcon size={44} color={theme.colors.context} />}
              lines={["À la banque", "intérêt garanti"]}
              tone={theme.colors.context}
            />
          </div>
          <div style={{ ...goldStyle }}>
            <Bubble
              icon={<GoldBarIcon size={44} color={theme.colors.accent} />}
              lines={["En or", "aucun revenu, protège la valeur"]}
              tone={theme.colors.accent}
            />
          </div>
        </div>
        <div
          style={{
            width: 460,
            height: 4,
            background: theme.colors.hairline,
            transform: `rotate(${tilt}deg)`,
            borderRadius: 4,
            marginTop: 28,
          }}
        />
        <div
          style={{
            width: 3,
            height: 60,
            background: theme.colors.hairline,
            marginTop: -2,
          }}
        />
      </div>

      <div
        style={{
          ...zoomStyle,
          marginTop: 40,
          color: theme.colors.textMuted,
          fontFamily: theme.mono,
          fontSize: 18,
          letterSpacing: 1,
        }}
      >
        même calcul, à l&apos;échelle des grandes institutions
      </div>
    </div>
  );
};

const Bubble: React.FC<{ icon: React.ReactNode; lines: [string, string]; tone: string }> = ({
  icon,
  lines,
  tone,
}) => (
  <div
    style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 10,
    }}
  >
    <div
      style={{
        width: 88,
        height: 88,
        borderRadius: "50%",
        border: `2px solid ${tone}`,
        background: theme.colors.panel,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {icon}
    </div>
    <span style={{ color: tone, fontSize: 20, fontFamily: theme.mono, whiteSpace: "nowrap" }}>{lines[0]}</span>
    <span style={{ color: theme.colors.textMuted, fontSize: 16, fontFamily: theme.mono, whiteSpace: "nowrap" }}>
      {lines[1]}
    </span>
  </div>
);
