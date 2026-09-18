import React from "react";
import { useCurrentFrame } from "remotion";
import { theme } from "../theme";
import { SceneContainer, fadeSlideIn, cueFrame } from "./shared";
import type { SceneProps } from "./shared";

// Cue indices verified against the actual generated audio/timeline.json
// (scene 05 — recap). No Hachim mention here — he already appeared once,
// naturally, in scene 03 (trap-example); no closing tagline is added here,
// per the standard set by F2/F3 (that pattern was explicitly rejected).
// chunk 0 "Pour résumer Un taux de change est..."      -> takeaway 1
// chunk 3 "Le DXY résume le dollar face à..."          -> takeaway 2
// chunk 7 "Et un dollar fort ne veut pas..."            -> takeaway 3
export const Recap: React.FC<SceneProps> = ({ subtitles }) => {
  const frame = useCurrentFrame();

  const takeaways = [
    {
      text: "Un taux de change est toujours un rapport entre deux monnaies, jamais un chiffre isolé.",
      at: cueFrame(subtitles, 0),
    },
    {
      text: "Le DXY résume le dollar face à six monnaies, avec l'euro qui pèse le plus lourd — pas toute la force du dollar dans le monde.",
      at: cueFrame(subtitles, 3),
    },
    {
      text: "Un dollar fort ne veut pas dire un or en baisse automatique : c'est un lien mécanique, conditionnel, jamais une règle fixe.",
      at: cueFrame(subtitles, 7),
    },
  ];

  return (
    <SceneContainer eyebrow="F6 · Récapitulatif" title="Ce qu'il faut retenir">
      <div style={{ display: "flex", flexDirection: "column", gap: 30 }}>
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
              <span style={{ color: theme.colors.textPrimary, fontSize: 27, lineHeight: 1.45, maxWidth: 1350 }}>
                {t.text}
              </span>
            </div>
          );
        })}
      </div>
    </SceneContainer>
  );
};
