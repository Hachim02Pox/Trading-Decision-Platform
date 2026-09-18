import React from "react";
import { useCurrentFrame } from "remotion";
import { theme } from "../theme";
import { SceneContainer, Panel, fadeSlideIn, cueFrame } from "./shared";
import type { SceneProps } from "./shared";

// Cue indices verified against audio/timeline.json, scene 03 "revisions-matter":
// chunk 1 "Imaginons Hachim lit que 190 000 emplois ont été" -> headline panel
// chunk 3 "alors que les économistes en attendaient 170 000" -> consensus caption
// chunk 4 "Une bonne surprise"                                -> "good surprise" chip
// chunk 8 "baisse de 35 000 et 25 000 emplois en moins"       -> the two revision chips
// chunk 9 "Au total 60 000 emplois de moins que ce"           -> total panel
// chunk 12 "Il faut toujours regarder la tendance sur"        -> closing note
export const RevisionsMatter: React.FC<SceneProps> = ({ subtitles }) => {
  const frame = useCurrentFrame();

  const headlineAt = cueFrame(subtitles, 1);
  const consensusAt = cueFrame(subtitles, 3);
  const goodSurpriseAt = cueFrame(subtitles, 4);
  const revisionsAt = cueFrame(subtitles, 8);
  const totalAt = cueFrame(subtitles, 9);
  const noteAt = cueFrame(subtitles, 12);

  return (
    <SceneContainer eyebrow="F5 · Un piège classique" title="Un chiffre du mois ne raconte jamais toute l'histoire">
      <div style={{ ...fadeSlideIn(frame, headlineAt, 16) }}>
        <Panel style={{ display: "inline-block", padding: "22px 34px", borderColor: theme.colors.accent }}>
          <span style={{ color: theme.colors.accentBright, fontSize: 30, fontFamily: theme.mono, fontWeight: 700 }}>
            +190 000 emplois créés
          </span>
          <div style={{ ...fadeSlideIn(frame, consensusAt, 12), marginTop: 8 }}>
            <span style={{ color: theme.colors.textSecondary, fontSize: 21, fontFamily: theme.mono }}>
              vs 170 000 attendus
            </span>
          </div>
          <div style={{ ...fadeSlideIn(frame, goodSurpriseAt, 12), marginTop: 6 }}>
            <span style={{ color: theme.colors.positive, fontSize: 20 }}>Une bonne surprise, à première vue.</span>
          </div>
        </Panel>
      </div>

      <div style={{ display: "flex", gap: 28, marginTop: 34 }}>
        <div style={{ ...fadeSlideIn(frame, revisionsAt, 16), flex: 1 }}>
          <Panel style={{ borderColor: theme.colors.negative }}>
            <span style={{ color: theme.colors.textSecondary, fontSize: 19, fontFamily: theme.mono }}>
              RÉVISION MOIS N-1
            </span>
            <div style={{ color: theme.colors.negative, fontSize: 30, fontWeight: 700, marginTop: 8 }}>−35 000</div>
          </Panel>
        </div>
        <div style={{ ...fadeSlideIn(frame, revisionsAt, 16), flex: 1 }}>
          <Panel style={{ borderColor: theme.colors.negative }}>
            <span style={{ color: theme.colors.textSecondary, fontSize: 19, fontFamily: theme.mono }}>
              RÉVISION MOIS N-2
            </span>
            <div style={{ color: theme.colors.negative, fontSize: 30, fontWeight: 700, marginTop: 8 }}>−25 000</div>
          </Panel>
        </div>
        <div style={{ ...fadeSlideIn(frame, totalAt, 16), flex: 1 }}>
          <Panel style={{ borderColor: theme.colors.negative, background: theme.colors.panelAlt }}>
            <span style={{ color: theme.colors.textSecondary, fontSize: 19, fontFamily: theme.mono }}>
              AU TOTAL
            </span>
            <div style={{ color: theme.colors.negative, fontSize: 34, fontWeight: 700, marginTop: 8 }}>
              −60 000
            </div>
          </Panel>
        </div>
      </div>

      <div
        style={{
          ...fadeSlideIn(frame, noteAt, 16),
          marginTop: 40,
          color: theme.colors.textSecondary,
          fontSize: 25,
          maxWidth: 1300,
          lineHeight: 1.5,
        }}
      >
        Il faut toujours regarder la tendance sur plusieurs mois, pas juste le dernier titre.
      </div>
    </SceneContainer>
  );
};
