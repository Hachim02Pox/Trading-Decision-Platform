import React from "react";
import { useCurrentFrame } from "remotion";
import { theme } from "../theme";
import { SceneContainer, Panel, fadeSlideIn, cueFrame, WorkerIcon, BriefcaseIcon } from "./shared";
import type { SceneProps } from "./shared";

// Cue indices verified against audio/timeline.json, scene 02 "key-numbers":
// chunk 1 "D'abord le taux de chômage"                       -> unemployment panel appears
// chunk 3 "emploi divisé par le nombre de personnes"         -> the ratio formula
// chunk 9 "sans que ce soit forcément une mauvaise"          -> "not necessarily bad" caption
// chunk 11 "d'emplois créés dans le mois"                    -> jobs-created panel appears
// chunk 13 "Attention ce chiffre compte des emplois"         -> "jobs, not people" caption
// chunk 15 "Quelqu'un qui a deux emplois est compté"         -> "counted twice" annotation
export const KeyNumbers: React.FC<SceneProps> = ({ subtitles }) => {
  const frame = useCurrentFrame();

  const unemploymentAt = cueFrame(subtitles, 1);
  const formulaAt = cueFrame(subtitles, 3);
  const notBadAt = cueFrame(subtitles, 9);
  const jobsAt = cueFrame(subtitles, 11);
  const jobsNotPeopleAt = cueFrame(subtitles, 13);
  const twiceAt = cueFrame(subtitles, 15);

  return (
    <SceneContainer eyebrow="F5 · Deux chiffres clés" title="Deux chiffres qui reviennent tout le temps">
      <div style={{ display: "flex", gap: 44, alignItems: "flex-start" }}>
        <div style={{ ...fadeSlideIn(frame, unemploymentAt, 16), flex: 1 }}>
          <Panel style={{ height: "100%" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <WorkerIcon size={28} color={theme.colors.accent} />
              <span style={{ color: theme.colors.accent, fontFamily: theme.mono, fontSize: 18, letterSpacing: 2 }}>
                TAUX DE CHÔMAGE
              </span>
            </div>
            <div style={{ ...fadeSlideIn(frame, formulaAt, 14), marginTop: 18 }}>
              <span style={{ color: theme.colors.textPrimary, fontFamily: theme.mono, fontSize: 24 }}>
                chômeurs ÷ population active
              </span>
            </div>
            <div
              style={{
                ...fadeSlideIn(frame, notBadAt, 14),
                marginTop: 22,
                color: theme.colors.context,
                fontSize: 22,
                lineHeight: 1.5,
              }}
            >
              Peut monter sans être une mauvaise nouvelle — si plus de gens cherchent du travail.
            </div>
          </Panel>
        </div>

        <div style={{ ...fadeSlideIn(frame, jobsAt, 16), flex: 1 }}>
          <Panel style={{ height: "100%" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <BriefcaseIcon size={28} color={theme.colors.accent} />
              <span style={{ color: theme.colors.accent, fontFamily: theme.mono, fontSize: 18, letterSpacing: 2 }}>
                EMPLOIS CRÉÉS
              </span>
            </div>
            <div style={{ ...fadeSlideIn(frame, jobsNotPeopleAt, 14), marginTop: 18 }}>
              <span style={{ color: theme.colors.textPrimary, fontFamily: theme.mono, fontSize: 24 }}>
                des emplois, pas des personnes
              </span>
            </div>
            <div
              style={{
                ...fadeSlideIn(frame, twiceAt, 14),
                marginTop: 22,
                color: theme.colors.negative,
                fontSize: 22,
                lineHeight: 1.5,
              }}
            >
              Deux emplois pour une même personne = comptés deux fois.
            </div>
          </Panel>
        </div>
      </div>
    </SceneContainer>
  );
};
