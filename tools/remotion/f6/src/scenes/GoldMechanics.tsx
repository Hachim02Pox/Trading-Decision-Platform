import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { theme } from "../theme";
import { Sfx, makeCue, Panel, GoldBarIcon, AnimatedNumber } from "./shared";
import type { SceneProps } from "./shared";
import { Beat, Pop, Person, Bubble, clamp } from "./characters";
import { SceneShell, Big, Label, STAGE_W } from "./stage";
import { PriceTag } from "./props";
import { Pill } from "./props5";
import { QuoteBoard, Coin, Move } from "./props6";

const C = theme.colors;

export const GoldMechanics: React.FC<SceneProps> = ({ words, durationInFrames }) => {
  const frame = useCurrentFrame();
  const cue = makeCue(words);
  const tWhy = cue("pourquoi le dollar");
  const tCote = cue("se cote en dollars");
  const tHachim = cue("imaginons que hachim");
  const tOnce = cue("l once vaut");
  const tBouge = cue("et elle ne bouge pas");
  const tEur = cue("mais l euro baisse");
  const t110 = cue("a 1 10 son once");
  const t105 = cue("a 1 05 la meme");
  const t5 = cue("l or est donc devenu");
  const tMeca = cue("c est le canal mecanique");
  const tFort = cue("un dollar plus fort rend");
  const tFaible = cue("un dollar plus faible allege");
  const tCet = cue("mais c est une relation");

  const eurusd = interpolate(frame, [tEur, tEur + 40], [1.1, 1.05], { ...clamp, easing: theme.ease.inOut });

  return (
    <SceneShell eyebrow="F6 · Dollar → or" title="Même prix en dollars, pas le même prix pour tout le monde" durationInFrames={durationInFrames}>
      <Sfx file="pop.wav" at={tCote} volume={0.4} />
      <Sfx file="whoosh.wav" at={tHachim} volume={0.4} />
      <Sfx file="bass.wav" at={tEur} volume={0.45} />
      <Sfx file="tick.wav" at={t110} volume={0.4} />
      <Sfx file="pop.wav" at={t105} volume={0.45} />
      <Sfx file="chime.wav" at={t5} volume={0.5} />
      <Sfx file="whoosh.wav" at={tMeca} volume={0.4} />

      <Beat from={0} to={tMeca} style={{ left: 0, top: 0 }}>
        <div style={{ position: "relative", width: STAGE_W, height: 690 }}>
          <div style={{ position: "absolute", left: 40, top: 20, display: "flex", alignItems: "center", gap: 20 }}>
            <Pop at={tWhy}>
              <GoldBarIcon size={120} />
            </Pop>
            {frame >= tCote && (
              <Pop at={tCote}>
                <Pill text="l'or se cote en dollars" size={28} filled />
              </Pop>
            )}
          </div>
          {frame >= tHachim && (
            <div style={{ position: "absolute", left: 60, top: 190 }}>
              <Pop at={tHachim}>
                <div style={{ position: "relative" }}>
                  <Person size={230} color={C.accent} label="Hachim" />
                  <div style={{ position: "absolute", left: 150, top: 110 }}>
                    <Coin sym="€" size={70} color={C.context} />
                  </div>
                </div>
              </Pop>
            </div>
          )}
          <div style={{ position: "absolute", left: 420, top: 170, display: "flex", flexDirection: "column", gap: 24 }}>
            {frame >= tOnce && (
              <Pop at={tOnce}>
                <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                  <GoldBarIcon size={90} />
                  <PriceTag text="2 400 $ l'once" rotate={-3} />
                  {frame >= tBouge && <Label size={24} color={C.textPrimary}>ne bouge pas</Label>}
                </div>
              </Pop>
            )}
            {frame >= tEur && (
              <Pop at={tEur}>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <QuoteBoard base="EUR" quote="USD" value={eurusd.toFixed(2).replace(".", ",")} dir={frame > tEur + 4 ? "down" : null} />
                </div>
              </Pop>
            )}
          </div>
          <div style={{ position: "absolute", left: 1180, top: 150, width: 540, display: "flex", flexDirection: "column", gap: 20 }}>
            {frame >= t110 && (
              <Pop at={t110}>
                <Panel style={{ padding: "18px 24px" }}>
                  <Label size={22}>à 1,10</Label>
                  <Big size={48}>≈ 2 182 €</Big>
                </Panel>
              </Pop>
            )}
            {frame >= t105 && (
              <Pop at={t105}>
                <Panel glow style={{ padding: "18px 24px", borderColor: C.negative }}>
                  <Label size={22}>à 1,05</Label>
                  <Big size={48} color={C.negative}>
                    ≈ <AnimatedNumber from={2182} to={2286} delay={t105 + 10} durationFrames={30} format={(n) => `${Math.round(n).toLocaleString("fr-FR").replace(/ | /g, " ")} €`} />
                  </Big>
                </Panel>
              </Pop>
            )}
          </div>
          {frame >= t5 && (
            <div style={{ position: "absolute", left: 0, right: 0, top: 560, display: "flex", justifyContent: "center" }}>
              <Pop at={t5}>
                <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                  <Big size={40} color={C.accentBright}>≈ +4,8 % plus cher en euros</Big>
                  <Bubble text="en dollars : 0 %" width={260} tone={C.textSecondary} tail="left" />
                </div>
              </Pop>
            </div>
          )}
        </div>
      </Beat>

      <Beat from={tMeca} style={{ left: 0, top: 0 }}>
        <div style={{ width: STAGE_W, height: 650, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 36 }}>
          <Pop at={tMeca}>
            <Big size={46}>Le canal mécanique</Big>
          </Pop>
          <div style={{ display: "flex", gap: 40 }}>
            <Pop at={tFort}>
              <Panel glow={frame >= tFort && frame < tFaible} style={{ padding: 26, width: 700, display: "flex", alignItems: "center", gap: 20, borderColor: C.negative }}>
                <Coin sym="$" size={90} color={C.positive} />
                <Move at={tFort} up size={50} />
                <Label size={25} color={C.textPrimary}>or plus cher hors dollar → la demande peut freiner</Label>
              </Panel>
            </Pop>
            <Pop at={tFaible}>
              <Panel glow={frame >= tFaible && frame < tCet} style={{ padding: 26, width: 700, display: "flex", alignItems: "center", gap: 20, borderColor: C.positive }}>
                <Coin sym="$" size={90} color={C.positive} />
                <Move at={tFaible} up={false} size={50} />
                <Label size={25} color={C.textPrimary}>la contrainte s&apos;allège</Label>
              </Panel>
            </Pop>
          </div>
          {frame >= tCet && (
            <Pop at={tCet}>
              <Pill text="toutes choses égales par ailleurs · pas l'équation complète du prix" size={28} />
            </Pop>
          )}
        </div>
      </Beat>
    </SceneShell>
  );
};
