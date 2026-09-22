import React from "react";
import { useCurrentFrame } from "remotion";
import { theme } from "../theme";
import { SceneContainer, Panel, fadeSlideIn, cueFrame } from "./shared";
import type { SceneProps } from "./shared";

export const TrapExample: React.FC<SceneProps> = ({ subtitles }) => {
  const frame = useCurrentFrame();

  // Cue indices re-verified against the round-4 (fr-FR-DeniseNeural) audio:
  // the new voice splits "même sans rien changer aujourd'hui c'est bon /
  // pour l'or Ce n'est jamais la décision" into different chunks than the
  // old Canadian-voice audio did, which shifted "C'est le changement" from
  // chunk 15 to chunk 16 — the closing note was firing one chunk early.
  // chunk 1 "Imaginons la Fed ne change rien à..." -> the setup panel
  // chunk 5 "la Fed dit qu'elle prévoit moins de..." -> negative branch (fewer cuts)
  // chunk 10 "À l'inverse si la Fed laisse entendre..." -> positive branch (more cuts)
  // chunk 16 "C'est le changement..." -> closing note
  const setupAt = cueFrame(subtitles, 1);
  const fewerCutsAt = cueFrame(subtitles, 5);
  const moreCutsAt = cueFrame(subtitles, 10);
  const noteAt = cueFrame(subtitles, 16);

  const branches = [
    {
      id: "fewer-cuts",
      text: "Prévoit moins de baisses → mauvais pour l'or",
      tone: theme.colors.negative,
      at: fewerCutsAt,
    },
    {
      id: "more-cuts",
      text: "Laisse entendre plus de baisses → bon pour l'or",
      tone: theme.colors.positive,
      at: moreCutsAt,
    },
  ];

  return (
    <SceneContainer eyebrow="F3 · Un piège classique" title="Ce n'est jamais la décision du jour qui compte le plus">
      <div style={{ ...fadeSlideIn(frame, setupAt, 16) }}>
        <Panel style={{ display: "inline-block", padding: "22px 34px" }}>
          <span style={{ color: theme.colors.textPrimary, fontSize: 28, fontFamily: theme.mono }}>
            La Fed ne change rien à son taux
          </span>
        </Panel>
      </div>

      <div style={{ display: "flex", gap: 32, marginTop: 40 }}>
        {branches.map((b) => {
          const style = fadeSlideIn(frame, b.at, 18);
          return (
            <div key={b.id} style={{ ...style, flex: 1 }}>
              <Panel style={{ borderColor: b.tone, height: "100%" }}>
                <span style={{ color: b.tone, fontSize: 27, fontWeight: 600, lineHeight: 1.5 }}>{b.text}</span>
              </Panel>
            </div>
          );
        })}
      </div>

      <div
        style={{
          ...fadeSlideIn(frame, noteAt, 16),
          marginTop: 40,
          color: theme.colors.textSecondary,
          fontSize: 26,
          maxWidth: 1250,
          lineHeight: 1.5,
        }}
      >
        C&apos;est le changement dans ce que le marché attendait avant qui compte.
      </div>
    </SceneContainer>
  );
};
