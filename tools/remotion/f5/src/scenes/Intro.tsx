import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { theme } from "../theme";
import { Sfx, makeCue, GoldBarIcon, useBreathe } from "./shared";
import type { SceneProps } from "./shared";
import { Beat, Pop, Person, FedSpeaker, Bubble, LiveChart, ClockIcon, ArrowGlyph, clamp } from "./characters";
import { SceneShell, Center, Big, Label, STAGE_W } from "./stage";
import { Factory, Store } from "./props";
import { CalendarPage, ReportDoc, Briefcase, CrossDraw } from "./props5";

// flat, spike up on the release, then a hard reversal: the "bondir... ou chuter" whipsaw
const WHIPSAW = [50, 50.4, 49.8, 50.2, 50, 50.3, 49.9, 50.1, 58, 66, 71, 64, 55, 44, 38, 41, 37, 39];

export const Intro: React.FC<SceneProps> = ({ words, durationInFrames }) => {
  const frame = useCurrentFrame();
  const cue = makeCue(words);
  const tFri = cue("vendredi");
  const tTime = cue("huit heures");
  const tReport = cue("le rapport sur");
  const tSec = cue("en quelques secondes");
  const tUp = cue("bondir");
  const tDown = cue("chuter");
  const tPourtant = cue("pourtant");
  const tCompte = cue("ce qui compte");
  const tPlus = cue("plus de baisses");
  const tMoins = cue("ou moins");
  const tEco = cue("l emploi et la croissance");
  const tFed = cue("decision de la fed");
  const tF5 = cue("c est le sujet");
  const breathe = useBreathe(0.4);
  const flowP = interpolate(frame, [tEco + 10, tFed + 10], [0, 1], { ...clamp, easing: theme.ease.inOut });

  return (
    <SceneShell eyebrow="F5 · Emploi & croissance" title="Le chiffre qui secoue l'or… sans parler d'or" durationInFrames={durationInFrames}>
      <Sfx file="pop.wav" at={tFri} volume={0.45} />
      <Sfx file="tick.wav" at={tTime} volume={0.4} />
      <Sfx file="whoosh.wav" at={tReport - 4} volume={0.45} />
      <Sfx file="bass.wav" at={tReport + 8} volume={0.45} />
      <Sfx file="whoosh.wav" at={tUp} volume={0.4} />
      <Sfx file="bass.wav" at={tDown} volume={0.5} />
      <Sfx file="pop.wav" at={tCompte} volume={0.4} />
      <Sfx file="pop.wav" at={tPlus} volume={0.35} />
      <Sfx file="pop.wav" at={tMoins} volume={0.35} />
      <Sfx file="whoosh.wav" at={tEco} volume={0.4} />
      <Sfx file="chime.wav" at={tF5} volume={0.55} />

      <Beat from={tFri - 6} to={tSec} style={{ left: 0, top: 0 }}>
        <Center gap={90}>
          <Pop at={tFri}>
            <CalendarPage top="VENDREDI" big="1er" size={300} />
          </Pop>
          <Pop at={tTime}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
              <ClockIcon size={230} />
              <Big size={56}>8 h 30</Big>
              <Label size={24}>New York</Label>
            </div>
          </Pop>
          {frame >= tReport - 4 && (
            <div style={{ transform: `translateY(${interpolate(frame, [tReport - 4, tReport + 8], [-500, 0], { ...clamp, easing: theme.ease.out })}px) rotate(${interpolate(frame, [tReport - 4, tReport + 12], [-14, 3], clamp)}deg)` }}>
              <ReportDoc title="Rapport sur l'emploi" width={380} />
            </div>
          )}
        </Center>
      </Beat>

      <Beat from={tSec} to={tPourtant} style={{ left: 0, top: 0 }}>
        <Center gap={70}>
          <div style={{ transform: `rotate(${frame > tUp && frame < tDown + 30 ? Math.sin(frame / 1.6) * 5 : 0}deg)` }}>
            <GoldBarIcon size={200} />
          </div>
          <div style={{ position: "relative" }}>
            <LiveChart data={WHIPSAW} width={900} height={380} from={tSec} drawFrames={tDown + 24 - tSec} label="or · minutes après la publication" />
            <div style={{ position: "absolute", left: 420, top: -30 }}>
              <Pop at={tUp}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <ArrowGlyph up color={theme.colors.positive} size={54} />
                  <Big size={40} color={theme.colors.positive}>bondit…</Big>
                </div>
              </Pop>
            </div>
            <div style={{ position: "absolute", left: 640, top: 300 }}>
              <Pop at={tDown}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <ArrowGlyph up={false} color={theme.colors.negative} size={54} />
                  <Big size={40} color={theme.colors.negative}>…ou chute</Big>
                </div>
              </Pop>
            </div>
          </div>
        </Center>
      </Beat>

      <Beat from={tPourtant} to={tEco} style={{ left: 0, top: 0 }}>
        <div style={{ position: "relative", width: STAGE_W, height: 690 }}>
          <div style={{ position: "absolute", left: 120, top: 150, display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
            <GoldBarIcon size={190} />
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <Briefcase size={70} />
              <CrossDraw at={tPourtant + 12} size={70} />
            </div>
            <Label size={24}>l&apos;or ne lit pas les emplois</Label>
          </div>
          <svg width={STAGE_W} height={690} style={{ position: "absolute", left: 0, top: 0 }}>
            <path
              d="M 420 330 C 640 330, 700 330, 900 330"
              stroke={theme.colors.accent}
              strokeWidth="6"
              strokeDasharray="12 12"
              strokeDashoffset={-frame * 1.5}
              opacity={interpolate(frame, [tCompte, tCompte + 12], [0, 1], clamp)}
              fill="none"
            />
          </svg>
          <div style={{ position: "absolute", left: 930, top: 170 }}>
            <Pop at={tCompte}>
              <FedSpeaker size={300} talking={frame < tEco} />
            </Pop>
          </div>
          <div style={{ position: "absolute", left: 1270, top: 90 }}>
            <Pop at={tPlus}>
              <Bubble text="Plus de baisses de taux ?" tone={theme.colors.positive} width={380} tail="left" />
            </Pop>
          </div>
          <div style={{ position: "absolute", left: 1270, top: 300 }}>
            <Pop at={tMoins}>
              <Bubble text="Ou moins ?" tone={theme.colors.negative} width={260} tail="left" />
            </Pop>
          </div>
        </div>
      </Beat>

      <Beat from={tEco} style={{ left: 0, top: 0 }}>
        <div style={{ position: "relative", width: STAGE_W, height: 690 }}>
          <div style={{ position: "absolute", left: 40, top: 40, display: "flex", flexDirection: "column", gap: 20 }}>
            <Pop at={tEco}>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 12 }}>
                <Factory size={150} />
                <Store size={150} />
              </div>
            </Pop>
            <div style={{ display: "flex", gap: 6 }}>
              {[0, 1, 2, 3, 4].map((i) => (
                <Pop key={i} at={tEco + 8 + i * 4}>
                  <Person size={80} phase={i} color={i % 2 ? theme.colors.positive : theme.colors.context} />
                </Pop>
              ))}
            </div>
            <Label size={22}>l&apos;économie réelle</Label>
          </div>
          <svg width={STAGE_W} height={690} style={{ position: "absolute", left: 0, top: 0 }}>
            <path d="M 460 250 C 700 250, 760 250, 1000 250" stroke={theme.colors.accentBright} strokeWidth="7" fill="none" strokeDasharray="600" strokeDashoffset={600 * (1 - flowP)} strokeLinecap="round" />
            <path d="M 985 235 L 1005 250 L 985 265" stroke={theme.colors.accentBright} strokeWidth="7" fill="none" opacity={flowP} strokeLinecap="round" />
          </svg>
          <div style={{ position: "absolute", left: 1040, top: 60 }}>
            <Pop at={tFed - 6}>
              <FedSpeaker size={260} talking={false} />
            </Pop>
          </div>
          <div style={{ position: "absolute", left: 0, right: 0, top: 520, display: "flex", justifyContent: "center" }}>
            <Pop at={tF5}>
              <div style={{ transform: `scale(${breathe.scale})` }}>
                <Big size={62} color={theme.colors.accentBright} glow>
                  F5 · Emploi & croissance
                </Big>
              </div>
            </Pop>
          </div>
        </div>
      </Beat>
    </SceneShell>
  );
};
