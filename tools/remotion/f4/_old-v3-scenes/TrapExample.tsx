import React from "react";
import { useCurrentFrame } from "remotion";
import { theme } from "../theme";
import { SceneContainer, Panel, fadeSlideIn, cueFrame } from "./shared";
import type { SceneProps } from "./shared";

// Cue indices verified against audio/timeline.json (fr-FR-DeniseNeural, -2%):
// chunk 1  "Le rythme mensuel accélère"                    -> setup line
// chunk 7  "après seulement 0,20 % le mois précédent"       -> monthly panel (0,20 % -> 0,35 %), both numbers spoken by this point
// chunk 10 "le chiffre passe de 3,2 % à 3,1 %"               -> yearly panel (both numbers in one chunk)
// chunk 12 "à 0,45 % sort de la fenêtre des"                 -> base-effect explanation panel
// chunk 19 "ce n'est jamais de lire un seul"                 -> closing note
export const TrapExample: React.FC<SceneProps> = ({ subtitles }) => {
  const frame = useCurrentFrame();

  const setupAt = cueFrame(subtitles, 1);
  const monthlyAt = cueFrame(subtitles, 7);
  const yearlyAt = cueFrame(subtitles, 10);
  const explainAt = cueFrame(subtitles, 12);
  const noteAt = cueFrame(subtitles, 19);

  return (
    <SceneContainer eyebrow="F4 · Un piège classique" title="Le mensuel accélère, l'annuel baisse — les deux ont raison">
      <div style={{ ...fadeSlideIn(frame, setupAt, 16) }}>
        <Panel style={{ display: "inline-block", padding: "20px 32px" }}>
          <span style={{ color: theme.colors.textPrimary, fontSize: 26, fontFamily: theme.mono }}>
            Voici un piège classique avec ces chiffres
          </span>
        </Panel>
      </div>

      <div style={{ display: "flex", gap: 32, marginTop: 40 }}>
        <div style={{ ...fadeSlideIn(frame, monthlyAt, 18), flex: 1 }}>
          <Panel style={{ borderColor: theme.colors.accent, height: "100%" }}>
            <div style={{ color: theme.colors.accent, fontFamily: theme.mono, fontSize: 18, letterSpacing: 2, marginBottom: 12 }}>
              RYTHME MENSUEL — CORE CPI
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 14 }}>
              <span style={{ color: theme.colors.textMuted, fontFamily: theme.mono, fontSize: 30 }}>0,20 %</span>
              <span style={{ color: theme.colors.accent, fontSize: 28 }}>→</span>
              <span style={{ color: theme.colors.accentBright, fontFamily: theme.mono, fontSize: 34, fontWeight: 700 }}>0,35 %</span>
            </div>
            <div style={{ color: theme.colors.textSecondary, fontSize: 20, marginTop: 10 }}>accélère</div>
          </Panel>
        </div>

        <div style={{ ...fadeSlideIn(frame, yearlyAt, 18), flex: 1 }}>
          <Panel style={{ borderColor: theme.colors.context, height: "100%" }}>
            <div style={{ color: theme.colors.context, fontFamily: theme.mono, fontSize: 18, letterSpacing: 2, marginBottom: 12 }}>
              RYTHME ANNUEL — CORE CPI
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 14 }}>
              <span style={{ color: theme.colors.textMuted, fontFamily: theme.mono, fontSize: 30 }}>3,2 %</span>
              <span style={{ color: theme.colors.context, fontSize: 28 }}>→</span>
              <span style={{ color: theme.colors.textPrimary, fontFamily: theme.mono, fontSize: 34, fontWeight: 700 }}>3,1 %</span>
            </div>
            <div style={{ color: theme.colors.textSecondary, fontSize: 20, marginTop: 10 }}>baisse</div>
          </Panel>
        </div>
      </div>

      <div style={{ ...fadeSlideIn(frame, explainAt, 16), marginTop: 36 }}>
        <Panel style={{ borderColor: theme.colors.hairline }}>
          <span style={{ color: theme.colors.textPrimary, fontSize: 23, lineHeight: 1.5 }}>
            Effet de base : un vieux mois à 0,45 % sort de la fenêtre des douze derniers mois, remplacé par ce
            0,35 % plus faible — le chiffre annuel baisse même si l&apos;inflation vient d&apos;accélérer.
          </span>
        </Panel>
      </div>

      <div
        style={{
          ...fadeSlideIn(frame, noteAt, 16),
          marginTop: 32,
          color: theme.colors.textSecondary,
          fontSize: 25,
          maxWidth: 1250,
          lineHeight: 1.5,
        }}
      >
        Ne jamais lire un seul chiffre isolé — toujours comparer plusieurs fenêtres avant de conclure.
      </div>
    </SceneContainer>
  );
};
