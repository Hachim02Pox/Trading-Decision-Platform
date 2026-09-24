import React from "react";
import { useCurrentFrame } from "remotion";
import { theme } from "../theme";
import { fadeSlideIn, cueFrame, CurrencyPairIcon } from "./shared";
import type { SceneProps } from "./shared";

export const Intro: React.FC<SceneProps> = ({ subtitles }) => {
  const frame = useCurrentFrame();

  // Reveal order follows the words as they're spoken (indices verified
  // against the actual generated audio/timeline.json for scene 01):
  // 0. "Sur le marché des devises..." -> title appears right away
  // 3. "Quand on dit EURUSD à 1,10" -> the ratio panel
  // 6. "...l'euro qui se renforce face au" -> EUR-strengthens row
  // 8. "...le dollar qui devient plus fort" -> USD-strengthens row
  // 13. "F6 répond à ça avec un indice" -> the DXY teaser badge
  const titleAt = cueFrame(subtitles, 0);
  const ratioAt = cueFrame(subtitles, 3);
  const eurRowAt = cueFrame(subtitles, 6);
  const usdRowAt = cueFrame(subtitles, 8);
  const dxyTeaseAt = cueFrame(subtitles, 13);

  const titleStyle = fadeSlideIn(frame, titleAt, 22);
  const ratioStyle = fadeSlideIn(frame, ratioAt, 20);

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
          display: "flex",
          alignItems: "center",
          gap: 14,
        }}
      >
        <CurrencyPairIcon size={30} color={theme.colors.accent} />
        F6 · USD &amp; change
      </div>
      <h1
        style={{
          ...titleStyle,
          color: theme.colors.textPrimary,
          fontSize: 52,
          fontWeight: 600,
          margin: 0,
          lineHeight: 1.25,
          maxWidth: 1550,
        }}
      >
        Chaque prix de devise est un rapport, jamais un chiffre isolé
      </h1>

      <div style={{ ...ratioStyle, marginTop: 64 }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 20,
            padding: "22px 40px",
            border: `2px solid ${theme.colors.accent}`,
            borderRadius: 18,
            background: theme.colors.panel,
          }}
        >
          <span style={{ color: theme.colors.textPrimary, fontSize: 34, fontFamily: theme.mono, fontWeight: 700 }}>
            1 EUR
          </span>
          <span style={{ color: theme.colors.accent, fontSize: 28 }}>=</span>
          <span style={{ color: theme.colors.accentBright, fontSize: 34, fontFamily: theme.mono, fontWeight: 700 }}>
            1,10 USD
          </span>
        </div>
      </div>

      <div style={{ marginTop: 44, display: "flex", gap: 40, alignItems: "stretch" }}>
        <div
          style={{
            ...fadeSlideIn(frame, eurRowAt, 16),
            width: 420,
            padding: "20px 26px",
            border: `1px solid ${theme.colors.positive}`,
            borderRadius: 16,
            background: theme.colors.panel,
            textAlign: "left",
          }}
        >
          <div style={{ color: theme.colors.positive, fontFamily: theme.mono, fontSize: 17, letterSpacing: 1.5 }}>
            SI ÇA MONTE
          </div>
          <div style={{ color: theme.colors.textPrimary, fontSize: 24, fontWeight: 600, marginTop: 8 }}>
            L&apos;euro se renforce face au dollar
          </div>
        </div>
        <div
          style={{
            ...fadeSlideIn(frame, usdRowAt, 16),
            width: 420,
            padding: "20px 26px",
            border: `1px solid ${theme.colors.negative}`,
            borderRadius: 16,
            background: theme.colors.panel,
            textAlign: "left",
          }}
        >
          <div style={{ color: theme.colors.negative, fontFamily: theme.mono, fontSize: 17, letterSpacing: 1.5 }}>
            SI ÇA BAISSE
          </div>
          <div style={{ color: theme.colors.textPrimary, fontSize: 24, fontWeight: 600, marginTop: 8 }}>
            Le dollar devient plus fort face à l&apos;euro
          </div>
        </div>
      </div>

      <div style={{ ...fadeSlideIn(frame, dxyTeaseAt, 18), marginTop: 40 }}>
        <span
          style={{
            display: "inline-block",
            border: `1px dashed ${theme.colors.context}`,
            color: theme.colors.context,
            borderRadius: 999,
            padding: "10px 26px",
            fontSize: 21,
            fontFamily: theme.mono,
          }}
        >
          Mais le dollar seul, contre toutes les monnaies à la fois... c&apos;est le DXY
        </span>
      </div>
    </div>
  );
};
