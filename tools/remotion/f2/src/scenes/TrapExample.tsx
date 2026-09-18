import React from "react";
import { useCurrentFrame } from "remotion";
import { theme } from "../theme";
import { SceneContainer, Panel, Chip, fadeSlideIn, cueFrame } from "./shared";
import type { SceneProps } from "./shared";

export const TrapExample: React.FC<SceneProps> = ({ subtitles }) => {
  const frame = useCurrentFrame();

  // Cue frames, one per subtitle chunk that first speaks the matching idea:
  //  4 "Exemple Le taux affiché passe de 4,20 %"        -> rate-move chip
  //  5 "à 4,00 % Cas un"                                 -> Cas A box appears
  //  6 "l'inflation attendue reste pareille"             -> Cas A row 1
  //  7 "Le vrai gain baisse aussi"                       -> Cas A row 2
  //  8 "et l'or devient plus attirant"                   -> Cas A conclusion chip
  //  9 "Logique Cas deux"                                -> Cas B box appears
  // 10 "l'inflation attendue baisse encore plus que le"  -> Cas B row 1
  // 12 "lui peut en fait augmenter"                      -> Cas B row 2
  // 13 "et l'or devient moins attirant"                  -> Cas B conclusion chip
  // 16 "La seule façon de savoir"                        -> caption
  const introAt = cueFrame(subtitles, 4);
  const colAAt = cueFrame(subtitles, 5);
  const rowA1At = cueFrame(subtitles, 6);
  const rowA2At = cueFrame(subtitles, 7);
  const concAAt = cueFrame(subtitles, 8);
  const colBAt = cueFrame(subtitles, 9);
  const rowB1At = cueFrame(subtitles, 10);
  const rowB2At = cueFrame(subtitles, 12);
  const concBAt = cueFrame(subtitles, 13);
  const captionAt = cueFrame(subtitles, 16);

  return (
    <SceneContainer eyebrow="F2 · Le piège" title="Même taux affiché, deux résultats opposés">
      <div style={{ ...fadeSlideIn(frame, introAt, 16), marginBottom: 28 }}>
        <Chip label="Taux affiché : 4,20 % → 4,00 %" tone="accent" />
      </div>

      <div style={{ display: "flex", gap: 36 }}>
        <div style={{ ...fadeSlideIn(frame, colAAt, 18) }}>
          <Column
            title="Cas un"
            rows={[
              { text: "Inflation attendue : pareille", at: rowA1At },
              { text: "Vrai gain : baisse", at: rowA2At },
            ]}
            conclusion="Or plus attirant"
            conclusionAt={concAAt}
            tone="positive"
            frame={frame}
          />
        </div>
        <div style={{ ...fadeSlideIn(frame, colBAt, 18) }}>
          <Column
            title="Cas deux"
            rows={[
              { text: "Inflation attendue : baisse encore plus", at: rowB1At },
              { text: "Vrai gain : monte", at: rowB2At },
            ]}
            conclusion="Or moins attirant"
            conclusionAt={concBAt}
            tone="negative"
            frame={frame}
          />
        </div>
      </div>

      <p
        style={{
          ...fadeSlideIn(frame, captionAt, 18),
          color: theme.colors.textSecondary,
          fontSize: 26,
          maxWidth: 1300,
          marginTop: 48,
          lineHeight: 1.55,
        }}
      >
        Toujours comparer le taux affiché à l&apos;inflation attendue — jamais l&apos;un sans l&apos;autre.
      </p>
    </SceneContainer>
  );
};

const Column: React.FC<{
  title: string;
  rows: Array<{ text: string; at: number }>;
  conclusion: string;
  conclusionAt: number;
  tone: "positive" | "negative";
  frame: number;
}> = ({ title, rows, conclusion, conclusionAt, tone, frame }) => (
  <Panel style={{ width: 560 }}>
    <div style={{ color: theme.colors.accent, fontFamily: theme.mono, fontSize: 20, marginBottom: 18 }}>{title}</div>
    {rows.map((r) => (
      <div
        key={r.text}
        style={{
          ...fadeSlideIn(frame, r.at, 14),
          color: theme.colors.textPrimary,
          fontSize: 24,
          lineHeight: 1.6,
        }}
      >
        {r.text}
      </div>
    ))}
    <div style={{ ...fadeSlideIn(frame, conclusionAt, 14), marginTop: 22 }}>
      <Chip label={conclusion} tone={tone} />
    </div>
  </Panel>
);
