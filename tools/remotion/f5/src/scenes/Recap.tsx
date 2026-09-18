import React from "react";
import { useCurrentFrame } from "remotion";
import { theme } from "../theme";
import { SceneContainer, fadeSlideIn, cueFrame } from "./shared";
import type { SceneProps } from "./shared";

// Cue indices verified against audio/timeline.json, scene 05 "recap":
// chunk 0 "Pour résumer F5"                    -> takeaway 1
// chunk 3 "Un seul chiffre ne fait jamais une"  -> takeaway 2
// chunk 6 "Et F5 ne dit jamais"                 -> takeaway 3
export const Recap: React.FC<SceneProps> = ({ subtitles }) => {
  const frame = useCurrentFrame();

  const takeaways = [
    {
      text: "F5, c'est l'emploi et la croissance — le thermomètre de l'économie américaine.",
      at: cueFrame(subtitles, 0),
    },
    {
      text: "Un seul chiffre ne fait jamais une tendance : regarder les révisions et la moyenne sur plusieurs mois.",
      at: cueFrame(subtitles, 3),
    },
    {
      text: "F5 ne dit jamais, à lui seul, si c'est bon ou mauvais pour l'or — c'est la Fed, les taux et le dollar qui tranchent.",
      at: cueFrame(subtitles, 6),
    },
  ];

  return (
    <SceneContainer eyebrow="F5 · Récapitulatif" title="Ce qu'il faut retenir">
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
