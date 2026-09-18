import React from "react";
import { useCurrentFrame } from "remotion";
import { theme } from "../theme";
import { SceneContainer, fadeSlideIn, cueFrame } from "./shared";
import type { SceneProps } from "./shared";

const TAKEAWAYS = [
  "L'or n'offre jamais de rendement : son attrait dépend de ce que rapporte l'argent ailleurs, une fois l'inflation retirée.",
  "Ne réagis jamais à un taux affiché tout seul.",
  "Demande toujours ce qu'il donne une fois l'inflation attendue soustraite.",
];

const CLOSING_LINE = "C'est ce calcul, exactement, qu'il faut refaire à chaque fois qu'un taux bouge.";

export const Recap: React.FC<SceneProps> = ({ subtitles }) => {
  const frame = useCurrentFrame();

  // Cue frames, one per subtitle chunk that first speaks each numbered
  // takeaway, plus the closing line. Re-verified against audio/timeline.json
  // after each regeneration since word-boundary timing (and chunk count —
  // this scene lost a sentence when the Hachim tagline was dropped) shifts
  // with voice/rate:
  //  0 "Pour résumer L'or n'offre jamais de rendement" -> takeaway 1
  //  4 "Ne réagis jamais à un taux affiché"             -> takeaway 2
  //  5 "tout seul Demande toujours ce qu'il donne"      -> takeaway 3
  //  7 "C'est ce calcul"                                 -> closing line
  const takeawayCues = [cueFrame(subtitles, 0), cueFrame(subtitles, 4), cueFrame(subtitles, 5)];
  const closingAt = cueFrame(subtitles, 7);

  return (
    <SceneContainer eyebrow="F2 · Récapitulatif" title="Ce qu'il faut retenir">
      <div style={{ display: "flex", flexDirection: "column", gap: 30 }}>
        {TAKEAWAYS.map((t, i) => {
          const style = fadeSlideIn(frame, takeawayCues[i], 14);
          return (
            <div key={t} style={{ ...style, display: "flex", gap: 24, alignItems: "flex-start" }}>
              <span
                style={{
                  color: theme.colors.accent,
                  fontFamily: theme.mono,
                  fontSize: 26,
                  fontWeight: 700,
                  minWidth: 40,
                }}
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <span style={{ color: theme.colors.textPrimary, fontSize: 28, lineHeight: 1.45, maxWidth: 1250 }}>
                {t}
              </span>
            </div>
          );
        })}
      </div>

      <p
        style={{
          ...fadeSlideIn(frame, closingAt, 20),
          color: theme.colors.textMuted,
          fontSize: 20,
          lineHeight: 1.5,
          maxWidth: 1200,
          marginTop: 56,
        }}
      >
        {CLOSING_LINE}
      </p>
    </SceneContainer>
  );
};
