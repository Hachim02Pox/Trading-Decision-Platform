import React from "react";
import { useCurrentFrame } from "remotion";
import { theme } from "../theme";
import { SceneContainer, fadeSlideIn, cueFrame } from "./shared";
import type { SceneProps } from "./shared";

export const Recap: React.FC<SceneProps> = ({ subtitles }) => {
  const frame = useCurrentFrame();

  // Cue frames re-verified against the round-4 narration (the closing
  // "Hachim" sentence was removed from the script entirely, so the recap
  // now ends on "...qui fait bouger les prix." — no 4th/closing element,
  // no stray cueFrame(subtitles, 8) pointing past the end of the chunk
  // list, which previously fell back to frame 0 and rendered on top of
  // takeaway 1).
  // chunk 0 "Pour résumer Une probabilité de marché n'est..." -> takeaway 1
  // chunk 2 "La décision du jour compte moins que..."          -> takeaway 2
  // chunk 4 "Et pour l'or..."                                  -> takeaway 3
  const takeaways = [
    { text: "Une probabilité de marché n'est jamais une promesse.", at: cueFrame(subtitles, 0) },
    {
      text: "La décision du jour compte moins que le changement dans les attentes.",
      at: cueFrame(subtitles, 2),
    },
    {
      text: "Pour l'or, c'est toujours l'écart entre ce qui était prévu et ce qui se passe vraiment qui fait bouger les prix.",
      at: cueFrame(subtitles, 4),
    },
  ];

  return (
    <SceneContainer eyebrow="F3 · Récapitulatif" title="Ce qu'il faut retenir">
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
