import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { theme } from "../theme";
import { Sfx, makeCue, useBreathe, GoldBarIcon } from "./shared";
import type { SceneProps } from "./shared";
import { Beat, Pop, clamp } from "./characters";
import { SceneShell, Center, Big, Label } from "./stage";
import { Seesaw, Coin, Move } from "./props6";

const C = theme.colors;

export const Intro: React.FC<SceneProps> = ({ words, durationInFrames }) => {
  const frame = useCurrentFrame();
  const cue = makeCue(words);
  const tUp = cue("quand le dollar monte");
  const tGold = cue("l or baisse");
  const tSee = cue("comme une balancoire");
  const tVrai = cue("c est vrai");
  const tPas = cue("mais pas toujours");
  const tBoth = cue("parfois les deux");
  const tIgn = cue("parfois l or ignore");
  const tKnow = cue("pour savoir");
  const tCasse = cue("se casse");
  const tMesure = cue("comprendre comment");
  const tF6 = cue("c est le sujet");
  const breathe = useBreathe(0.2);

  // seesaw tilt: dollar side (left) goes up, gold (right) goes down, then rocks
  const tilt = frame < tPas ? interpolate(frame, [tUp, tGold + 10], [0, 12], { ...clamp, easing: theme.ease.out }) + (frame > tSee ? Math.sin((frame - tSee) / 12) * 4 : 0) : 0;
  const bothLift = interpolate(frame, [tBoth, tBoth + 20], [0, 1], { ...clamp, easing: theme.ease.out });
  const crack = interpolate(frame, [tCasse, tCasse + 10], [0, 1], clamp);

  return (
    <SceneShell eyebrow="F6 · Dollar & change" title="La balançoire dollar-or… qui casse parfois" durationInFrames={durationInFrames}>
      <Sfx file="whoosh.wav" at={tUp} volume={0.4} />
      <Sfx file="bass.wav" at={tGold} volume={0.45} />
      <Sfx file="pop.wav" at={tSee} volume={0.4} />
      <Sfx file="bass.wav" at={tPas} volume={0.5} />
      <Sfx file="pop.wav" at={tBoth} volume={0.4} />
      <Sfx file="pop.wav" at={tIgn} volume={0.4} />
      <Sfx file="bass.wav" at={tCasse} volume={0.5} />
      <Sfx file="chime.wav" at={tF6} volume={0.55} />

      <Beat from={0} to={tPas} style={{ left: 0, top: 0 }}>
        <Center column gap={30}>
          <Pop at={tUp - 4}>
            <div style={{ marginTop: 40 }}>
              <Seesaw tilt={tilt} width={900} />
            </div>
          </Pop>
          <div style={{ display: "flex", gap: 300 }}>
            <Pop at={tUp + 6}>
              <Move at={tUp + 6} up label="dollar" />
            </Pop>
            <Pop at={tGold}>
              <Move at={tGold} up={false} label="or" />
            </Pop>
          </div>
        </Center>
      </Beat>

      <Beat from={tPas} to={tKnow} style={{ left: 0, top: 0 }}>
        <Center gap={120}>
          <Pop at={tBoth}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
              <div style={{ display: "flex", gap: 40, alignItems: "flex-end", transform: `translateY(${-bothLift * 60}px)` }}>
                <Coin sym="$" size={150} color={C.positive} />
                <GoldBarIcon size={170} />
              </div>
              <Move at={tBoth + 10} up label="les deux montent" />
            </div>
          </Pop>
          <Pop at={tIgn}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
              <div style={{ display: "flex", gap: 40, alignItems: "center" }}>
                <div style={{ transform: `translateY(${Math.sin(frame / 5) * 30}px)` }}>
                  <Coin sym="$" size={130} color={C.positive} />
                </div>
                <GoldBarIcon size={170} />
              </div>
              <Label size={28} color={C.accentBright}>l&apos;or ignore le dollar</Label>
            </div>
          </Pop>
        </Center>
      </Beat>

      <Beat from={tKnow} style={{ left: 0, top: 0 }}>
        <Center column gap={40}>
          <div style={{ position: "relative" }}>
            <Seesaw tilt={-8 * (1 - crack) + crack * 20} width={760} />
            {frame >= tCasse && (
              <svg width="120" height="120" viewBox="0 0 60 60" style={{ position: "absolute", left: 320, top: 150 }}>
                <path d="M30 2 L24 22 L34 30 L22 58" stroke={C.negative} strokeWidth="5" fill="none" strokeLinecap="round" strokeDasharray="80" strokeDashoffset={80 * (1 - crack)} />
              </svg>
            )}
          </div>
          {frame >= tMesure && (
            <Pop at={tMesure}>
              <Label size={30} color={C.textPrimary}>d&apos;abord : comment mesure-t-on un dollar fort ?</Label>
            </Pop>
          )}
          {frame >= tF6 && (
            <Pop at={tF6}>
              <div style={{ transform: `scale(${breathe.scale})` }}>
                <Big size={60} color={C.accentBright} glow>
                  F6 · Dollar & change
                </Big>
              </div>
            </Pop>
          )}
        </Center>
      </Beat>
    </SceneShell>
  );
};
