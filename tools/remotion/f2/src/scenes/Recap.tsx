import React from "react";
import { theme } from "../theme";
import { SceneContainer, Entrance, Sfx, cueWord, useBreathe, GoldBarIcon, BankIcon } from "./shared";
import type { SceneProps } from "./shared";

const CheckIcon: React.FC = () => (
  <svg width={24} height={24} viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10" stroke={theme.colors.accent} strokeWidth="2" fill="none" />
    <path d="M7 12.5 L10.5 16 L17 8.5" stroke={theme.colors.accent} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
  </svg>
);

const TAKEAWAYS = [
  { text: "L'or ne verse jamais de revenu, il vit du coût d'opportunité", needle: "jamais un revenu" },
  { text: "Le 2 ans capture le court terme, le 10 et 30 ans la vision longue", needle: "capture surtout" },
  { text: "Le deux dix décrit un régime de courbe, jamais un signal direct", needle: "régime de courbe" },
  { text: "Toujours décomposer : taux réel vs inflation implicite", needle: "toujours le décomposer" },
];

export const Recap: React.FC<SceneProps> = ({ subtitles, durationInFrames }) => {
  const breathe = useBreathe(1);
  const closingAt = cueWord(subtitles, "quelle échéance");

  return (
    <SceneContainer eyebrow="F2 · À retenir" title="Ce qu'il faut garder de F2" durationInFrames={durationInFrames}>
      <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
        {TAKEAWAYS.map((t, i) => {
          const delay = cueWord(subtitles, t.needle) || i * 26;
          return (
            <Entrance key={t.text} delay={delay} y={20}>
              <Sfx file="tick.wav" at={delay} volume={0.4} />
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <CheckIcon />
                <span style={{ color: theme.colors.textPrimary, fontSize: 26, lineHeight: 1.4 }}>{t.text}</span>
              </div>
            </Entrance>
          );
        })}
      </div>

      <Entrance delay={closingAt} y={26}>
        <div
          style={{
            marginTop: 54,
            display: "flex",
            alignItems: "center",
            gap: 24,
            transform: `scale(${breathe.scale})`,
          }}
        >
          <BankIcon size={40} color={theme.colors.textMuted} />
          <span style={{ color: theme.colors.accentBright, fontSize: 30, fontWeight: 700, maxWidth: 1100, lineHeight: 1.4 }}>
            Quelle échéance a bougé, de combien, et surtout... pourquoi.
          </span>
          <GoldBarIcon size={40} />
        </div>
      </Entrance>
    </SceneContainer>
  );
};
