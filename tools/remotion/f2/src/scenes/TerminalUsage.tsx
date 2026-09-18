import React from "react";
import { useCurrentFrame } from "remotion";
import { theme } from "../theme";
import { SceneContainer, Panel, fadeSlideIn, cueFrame } from "./shared";
import type { SceneProps } from "./shared";

export const TerminalUsage: React.FC<SceneProps> = ({ subtitles }) => {
  const frame = useCurrentFrame();

  // Cue frames, one per subtitle chunk that first speaks the matching idea.
  // Re-verified against audio/timeline.json after each regeneration —
  // word-boundary chunking shifts with voice/rate, and with fr-FR-DeniseNeural
  // "mauvais pour l'or" now splits into its own chunk (index 5), pushing
  // everything from the détail panel onward one index later than before:
  //  0 "Dans le terminal"                          -> façade panel appears
  //  1 "F2 montre le taux à 2 ans"                 -> "2 ans" row
  //  2 "le taux à 10 ans"                          -> "10 ans" row
  //  3 "et l'écart entre les deux"                 -> "Écart" row
  //  7 "C'est là que tu vois le vrai"              -> détail panel appears
  //  8 "gain à 10 ans"                             -> "Vrai gain 10 ans" value
  // 10 "C'est ce chiffre-là qui a le lien"         -> caption
  const facadeAt = cueFrame(subtitles, 0);
  const row2yAt = cueFrame(subtitles, 1);
  const row10yAt = cueFrame(subtitles, 2);
  const rowSpreadAt = cueFrame(subtitles, 3);
  const drawerAt = cueFrame(subtitles, 7);
  const realGainAt = cueFrame(subtitles, 8);
  const captionAt = cueFrame(subtitles, 10);

  return (
    <SceneContainer eyebrow="F2 · Dans le terminal" title="La façade, puis le détail qui compte">
      <div style={{ display: "flex", gap: 40, alignItems: "flex-start" }}>
        <div style={{ ...fadeSlideIn(frame, facadeAt, 16) }}>
          <Panel style={{ width: 460 }}>
            <div style={{ color: theme.colors.textMuted, fontSize: 18, fontFamily: theme.mono, marginBottom: 14 }}>
              FAÇADE F2
            </div>
            <div style={{ ...fadeSlideIn(frame, row2yAt, 12) }}>
              <FaceRow label="2 ans" value="4,40 %" />
            </div>
            <div style={{ ...fadeSlideIn(frame, row10yAt, 12) }}>
              <FaceRow label="10 ans" value="4,10 %" />
            </div>
            <div style={{ ...fadeSlideIn(frame, rowSpreadAt, 12) }}>
              <FaceRow label="Écart" value="− 30 pb" accent />
            </div>
          </Panel>
        </div>

        <div style={{ ...fadeSlideIn(frame, drawerAt, 16) }}>
          <Panel style={{ width: 460, borderColor: theme.colors.accent }}>
            <div style={{ color: theme.colors.accent, fontSize: 18, fontFamily: theme.mono, marginBottom: 14 }}>
              DÉTAIL
            </div>
            <div style={{ ...fadeSlideIn(frame, realGainAt, 14) }}>
              <FaceRow label="Vrai gain 10 ans" value="1,80 %" accent />
            </div>
          </Panel>
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
        C&apos;est ce vrai gain à 10 ans qui a le lien le plus direct avec l&apos;or. Le reste donne du contexte,
        mais ne décide rien tout seul.
      </p>
    </SceneContainer>
  );
};

const FaceRow: React.FC<{ label: string; value: string; accent?: boolean }> = ({ label, value, accent }) => (
  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      padding: "12px 0",
      borderBottom: `1px solid ${theme.colors.hairlineSoft}`,
    }}
  >
    <span style={{ color: theme.colors.textSecondary, fontSize: 24 }}>{label}</span>
    <span
      style={{
        color: accent ? theme.colors.accentBright : theme.colors.textPrimary,
        fontSize: 26,
        fontWeight: 700,
        fontFamily: theme.mono,
      }}
    >
      {value}
    </span>
  </div>
);
