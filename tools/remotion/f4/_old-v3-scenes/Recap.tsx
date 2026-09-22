import React from "react";
import { useCurrentFrame } from "remotion";
import { theme } from "../theme";
import { SceneContainer, fadeSlideIn, cueFrame } from "./shared";
import type { SceneProps } from "./shared";

export const Recap: React.FC<SceneProps> = ({ subtitles }) => {
  const frame = useCurrentFrame();

  // Cue indices verified against audio/timeline.json:
  // chunk 0 "Pour résumer L'inflation est un rythme..." -> takeaway 1
  // chunk 3 "Le Core sans alimentation ni énergie..."     -> takeaway 2
  // chunk 7 "Et surtout un chiffre d'inflation n'a jamais..." -> takeaway 3
  const takeaways = [
    { text: "L'inflation est un rythme, pas un niveau — ralentir, ce n'est jamais baisser.", at: cueFrame(subtitles, 0) },
    {
      text: "Le Core, sans alimentation ni énergie, montre la tendance de fond — mais un effet de base peut faire mentir le chiffre annuel tout seul.",
      at: cueFrame(subtitles, 3),
    },
    {
      text: "Un chiffre d'inflation n'a jamais de sens fixe pour l'or : vérifie toujours taux, dollar et attentes de la banque centrale avant de conclure.",
      at: cueFrame(subtitles, 7),
    },
  ];

  return (
    <SceneContainer eyebrow="F4 · Récapitulatif" title="Ce qu'il faut retenir">
      <div style={{ display: "flex", flexDirection: "column", gap: 26 }}>
        {takeaways.map((t, i) => {
          const style = fadeSlideIn(frame, t.at, 14);
          return (
            <div key={t.text} style={{ ...style, display: "flex", gap: 24, alignItems: "flex-start" }}>
              <span
                style={{
                  color: theme.colors.accent,
                  fontFamily: theme.mono,
                  fontSize: 24,
                  fontWeight: 700,
                  minWidth: 40,
                }}
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <span style={{ color: theme.colors.textPrimary, fontSize: 27, lineHeight: 1.45, maxWidth: 1320 }}>
                {t.text}
              </span>
            </div>
          );
        })}
      </div>
    </SceneContainer>
  );
};
