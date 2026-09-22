import React from "react";
import { useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { theme } from "../theme";
import {
  SceneContainer,
  Panel,
  Entrance,
  Sfx,
  cueWord,
  useBreathe,
  BankIcon,
  GoldBarIcon,
  CashPopIcon,
  ScaleIcon,
} from "./shared";
import type { SceneProps } from "./shared";

export const Intro: React.FC<SceneProps> = ({ subtitles, durationInFrames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const bankAt = cueWord(subtitles, "1000 dollars");
  const bankChoiceAt = cueWord(subtitles, "banque");
  const goldChoiceAt = cueWord(subtitles, "acheter de l'or");
  const tiltBankAt = cueWord(subtitles, "beaucoup");
  const tiltGoldAt = cueWord(subtitles, "elle paie peu");
  const zoomAt = cueWord(subtitles, "dézoomant");
  const engineAt = cueWord(subtitles, "moteur de F2");

  const tilt = interpolate(frame, [tiltBankAt, tiltBankAt + 20, tiltGoldAt, tiltGoldAt + 20], [0, 9, 9, -9], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: theme.ease.inOut,
  });

  const zoomP = spring({ frame: frame - zoomAt, fps, config: theme.spring.smooth });
  const sceneScale = interpolate(zoomP, [0, 1], [1, 0.9]);

  const breathe = useBreathe(0);

  return (
    <SceneContainer eyebrow="F2 · Taux d'intérêt" title="Pourquoi les taux font bouger l'or" durationInFrames={durationInFrames}>
      <Sfx file="pop.wav" at={bankAt} volume={0.5} />
      <Sfx file="click.wav" at={bankChoiceAt} volume={0.4} />
      <Sfx file="chime.wav" at={goldChoiceAt} volume={0.5} />
      <Sfx file="whoosh.wav" at={zoomAt} volume={0.5} />

      <div
        style={{
          transform: `scale(${sceneScale}) scale(${breathe.scale})`,
          transformOrigin: "50% 55%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 40,
        }}
      >
        <Entrance delay={tiltBankAt - 6} y={0} scaleFrom={1}>
          <div style={{ transform: `rotate(${tilt}deg)`, transition: "none" }}>
            <ScaleIcon size={140} color={theme.colors.textSecondary} tilt={0} />
          </div>
        </Entrance>

        <div style={{ display: "flex", gap: 90 }}>
          <Entrance delay={bankAt} y={50}>
            <Panel style={{ width: 420, textAlign: "center" }} glow={frame > tiltBankAt && frame < tiltGoldAt}>
              <div style={{ display: "flex", justifyContent: "center", gap: 14, marginBottom: 18 }}>
                <BankIcon size={46} />
                <Entrance delay={bankChoiceAt + 4} y={10} scaleFrom={0.6}>
                  <CashPopIcon size={40} />
                </Entrance>
              </div>
              <div style={{ color: theme.colors.textPrimary, fontSize: 30, fontWeight: 700 }}>1000 $ à la banque</div>
              <div style={{ color: theme.colors.textSecondary, fontSize: 20, marginTop: 10 }}>
                Intérêt garanti, chaque année
              </div>
            </Panel>
          </Entrance>

          <Entrance delay={goldChoiceAt} y={50}>
            <Panel style={{ width: 420, textAlign: "center" }} glow={frame > tiltGoldAt}>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 18 }}>
                <GoldBarIcon size={50} />
              </div>
              <div style={{ color: theme.colors.textPrimary, fontSize: 30, fontWeight: 700 }}>1000 $ en or</div>
              <div style={{ color: theme.colors.textSecondary, fontSize: 20, marginTop: 10 }}>
                Aucun revenu, mais protège la valeur
              </div>
            </Panel>
          </Entrance>
        </div>

        <Entrance delay={engineAt} y={20}>
          <div
            style={{
              color: theme.colors.accentBright,
              fontFamily: theme.mono,
              fontSize: 26,
              letterSpacing: 1,
              marginTop: 8,
            }}
          >
            Le calcul que les institutions refont chaque jour, à grande échelle
          </div>
        </Entrance>
      </div>
    </SceneContainer>
  );
};
