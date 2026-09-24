import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { theme } from "../theme";
import { Sfx, makeCue, Panel, AnimatedNumber } from "./shared";
import type { SceneProps } from "./shared";
import { Beat, Pop, clamp } from "./characters";
import { SceneShell, Center, Big, Label } from "./stage";
import { PriceTag } from "./props";
import { Stamp, Pill } from "./props5";
import { Coin, QuoteBoard, Move } from "./props6";

const C = theme.colors;

export const Pairs: React.FC<SceneProps> = ({ words, durationInFrames }) => {
  const frame = useCurrentFrame();
  const cue = makeCue(words);
  const tPrix = cue("c est un prix");
  const tRel = cue("toujours relative");
  const tEur = cue("prenons la paire");
  const tBase = cue("l euro est la devise de base");
  const tQuote = cue("le dollar est la devise de cotation");
  const t110 = cue("un taux de");
  const tMonte = cue("si le taux monte");
  const tBaisse = cue("s il baisse");
  const tJpy = cue("maintenant la paire");
  const tJBase = cue("ici c est le dollar");
  const tJMonte = cue("donc si le taux monte");
  const tInv = cue("meme mouvement");
  const tRef = cue("le reflexe");

  const eurVal = frame < tMonte ? 1.1 : frame < tBaisse ? interpolate(frame, [tMonte, tMonte + 30], [1.1, 1.15], { ...clamp, easing: theme.ease.out }) : interpolate(frame, [tBaisse, tBaisse + 30], [1.15, 1.05], { ...clamp, easing: theme.ease.out });
  const jpyVal = interpolate(frame, [tJMonte, tJMonte + 30], [150, 155], { ...clamp, easing: theme.ease.out });

  return (
    <SceneShell eyebrow="F6 · Lire une paire" title="Chaque taux de change est un prix relatif" durationInFrames={durationInFrames}>
      <Sfx file="pop.wav" at={tPrix} volume={0.4} />
      <Sfx file="whoosh.wav" at={tEur} volume={0.4} />
      <Sfx file="tick.wav" at={tBase} volume={0.4} />
      <Sfx file="tick.wav" at={tQuote} volume={0.4} />
      <Sfx file="pop.wav" at={tMonte} volume={0.4} />
      <Sfx file="pop.wav" at={tBaisse} volume={0.4} />
      <Sfx file="whoosh.wav" at={tJpy} volume={0.4} />
      <Sfx file="bass.wav" at={tInv} volume={0.45} />
      <Sfx file="bass.wav" at={tRef + 6} volume={0.5} />

      <Beat from={0} to={tEur} style={{ left: 0, top: 0 }}>
        <Center gap={60}>
          <Pop at={tPrix}>
            <Coin sym="€" size={170} color={C.context} spin />
          </Pop>
          <Pop at={tPrix + 10}>
            <Big size={80} color={C.textMuted}>=</Big>
          </Pop>
          <Pop at={tPrix + 16}>
            <div style={{ display: "flex", gap: 10 }}>
              {[0, 1].map((i) => (
                <Coin key={i} sym="$" size={120} color={C.positive} />
              ))}
            </div>
          </Pop>
          {frame >= tRel && (
            <Pop at={tRel}>
              <Pill text="la force est toujours relative" size={30} />
            </Pop>
          )}
        </Center>
      </Beat>

      <Beat from={tEur} to={tJpy} style={{ left: 0, top: 0 }}>
        <Center column gap={34}>
          <Pop at={tEur}>
            <QuoteBoard base="EUR" quote="USD" value={eurVal.toFixed(2).replace(".", ",")} dir={frame >= tBaisse ? "down" : frame >= tMonte ? "up" : null} highlight={frame >= tQuote ? "quote" : frame >= tBase ? "base" : null} />
          </Pop>
          <div style={{ display: "flex", gap: 40 }}>
            <Pop at={tBase}>
              <Pill text="EUR = devise de base" color={C.context} size={26} />
            </Pop>
            <Pop at={tQuote}>
              <Pill text="USD = devise de cotation" color={C.positive} size={26} />
            </Pop>
          </div>
          {frame >= t110 && (
            <Pop at={t110}>
              <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                <Coin sym="€" size={90} color={C.context} />
                <Big size={40}>1 euro coûte</Big>
                <PriceTag text="1,10 $" rotate={-3} />
              </div>
            </Pop>
          )}
          <div style={{ display: "flex", gap: 60, height: 90 }}>
            {frame >= tMonte && (
              <Panel glow={frame < tBaisse} style={{ padding: "14px 24px", display: "flex", alignItems: "center", gap: 14 }}>
                <Move at={tMonte} up size={48} />
                <Label size={26} color={C.textPrimary}>le taux monte → l&apos;euro se renforce</Label>
              </Panel>
            )}
            {frame >= tBaisse && (
              <Panel glow style={{ padding: "14px 24px", display: "flex", alignItems: "center", gap: 14 }}>
                <Move at={tBaisse} up={false} size={48} />
                <Label size={26} color={C.textPrimary}>il baisse → le dollar se renforce</Label>
              </Panel>
            )}
          </div>
        </Center>
      </Beat>

      <Beat from={tJpy} style={{ left: 0, top: 0 }}>
        <Center column gap={34}>
          <Pop at={tJpy}>
            <QuoteBoard base="USD" quote="JPY" value={jpyVal.toFixed(1).replace(".", ",")} dir={frame >= tJMonte ? "up" : null} highlight={frame >= tJBase ? "base" : null} />
          </Pop>
          {frame >= tJBase && (
            <Pop at={tJBase}>
              <Pill text="ici, le dollar est la devise de base" color={C.positive} size={26} />
            </Pop>
          )}
          {frame >= tJMonte && (
            <Pop at={tJMonte}>
              <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                <Move at={tJMonte} up size={56} />
                <Label size={30} color={C.textPrimary}>le taux monte → c&apos;est le dollar qui se renforce</Label>
              </div>
            </Pop>
          )}
          {frame >= tInv && (
            <Pop at={tInv}>
              <Big size={36} color={C.accentBright}>même mouvement vers le haut… sens économique inverse</Big>
            </Pop>
          )}
          {frame >= tRef + 6 && (
            <div style={{ marginTop: 10 }}>
              <Stamp at={tRef + 6} text="VÉRIFIE LE SENS DE LA PAIRE" color={C.accentBright} size={34} />
            </div>
          )}
        </Center>
      </Beat>
    </SceneShell>
  );
};
