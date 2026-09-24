import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { theme } from "../theme";
import { Sfx, makeCue, Panel, GoldBarIcon, BankIcon, useBreathe } from "./shared";
import type { SceneProps } from "./shared";
import { Beat, Pop, Person, ArrowGlyph, clamp } from "./characters";
import { SceneShell, Big, Label, STAGE_W } from "./stage";
import { PriceTag } from "./props";
import { StormCloud, Stamp } from "./props5";
import { Coin, Seesaw } from "./props6";

const C = theme.colors;

export const Regimes: React.FC<SceneProps> = ({ words, durationInFrames }) => {
  const frame = useCurrentFrame();
  const cue = makeCue(words);
  const tCasse = cue("et quand la balancoire");
  const t1 = cue("premier cas");
  const tPeur = cue("peur geopolitique");
  const t2 = cue("deuxieme cas");
  const tReels = cue("parce que les taux reels");
  const tBc = cue("parce que les banques centrales");
  const tOffre = cue("ou parce que l offre");
  const t3 = cue("troisieme cas");
  const tVend = cue("tout le monde vend");
  const tCorr = cue("la correlation");
  const tNi = cue("ce n est ni une cause");
  const breathe = useBreathe(0.5);

  return (
    <SceneShell eyebrow="F6 · Quand la balançoire casse" title="Trois régimes où la règle ne tient plus" durationInFrames={durationInFrames}>
      <Sfx file="bass.wav" at={tCasse} volume={0.45} />
      <Sfx file="pop.wav" at={t1} volume={0.4} />
      <Sfx file="pop.wav" at={t2} volume={0.4} />
      <Sfx file="pop.wav" at={t3} volume={0.4} />
      <Sfx file="chime.wav" at={tCorr} volume={0.5} />

      <Beat from={0} to={tCorr} style={{ left: 0, top: 0 }}>
        <div style={{ width: STAGE_W, height: 650, display: "flex", alignItems: "center", justifyContent: "center", gap: 30 }}>
          <Pop at={t1}>
            <Panel glow={frame >= t1 && frame < t2} style={{ width: 540, height: 520, padding: 26 }}>
              <Big size={30} color={C.accentBright}>1 · Les deux montent</Big>
              <div style={{ display: "flex", justifyContent: "center", alignItems: "flex-end", gap: 30, marginTop: 40, transform: `translateY(${-interpolate(frame, [t1 + 10, t1 + 40], [0, 40], { ...clamp, easing: theme.ease.out })}px)` }}>
                <Coin sym="$" size={110} color={C.positive} />
                <GoldBarIcon size={130} />
              </div>
              <div style={{ display: "flex", justifyContent: "center", gap: 70 }}>
                <ArrowGlyph up color={C.positive} size={50} />
                <ArrowGlyph up color={C.positive} size={50} />
              </div>
              {frame >= tPeur && (
                <div style={{ display: "flex", alignItems: "center", gap: 10, justifyContent: "center", marginTop: 20 }}>
                  <StormCloud size={80} />
                  <Label size={22} color={C.textPrimary}>peur, choc de confiance, ruée vers le défensif</Label>
                </div>
              )}
            </Panel>
          </Pop>
          <Pop at={t2}>
            <Panel glow={frame >= t2 && frame < t3} style={{ width: 540, height: 520, padding: 26 }}>
              <Big size={30} color={C.positive}>2 · L&apos;or résiste</Big>
              <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 30, marginTop: 30 }}>
                <div style={{ textAlign: "center" }}>
                  <Coin sym="$" size={90} color={C.positive} />
                  <ArrowGlyph up color={C.negative} size={40} />
                </div>
                <div style={{ transform: `scale(${breathe.scale})` }}>
                  <GoldBarIcon size={130} />
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 16 }}>
                {frame >= tReels && <Label size={22} color={C.textPrimary}>taux réels en baisse</Label>}
                {frame >= tBc && (
                  <div style={{ display: "flex", alignItems: "center", gap: 10, justifyContent: "center" }}>
                    <BankIcon size={44} color={C.accent} />
                    <Label size={22} color={C.textPrimary}>banques centrales, demande physique</Label>
                  </div>
                )}
                {frame >= tOffre && <Label size={22} color={C.textPrimary}>offre et positionnement</Label>}
              </div>
            </Panel>
          </Pop>
          <Pop at={t3}>
            <Panel glow={frame >= t3} style={{ width: 540, height: 520, padding: 26, borderColor: C.negative }}>
              <Big size={30} color={C.negative}>3 · Liquidation forcée</Big>
              <div style={{ position: "relative", height: 200, marginTop: 20 }}>
                {[0, 1, 2].map((i) => (
                  <div key={i} style={{ position: "absolute", left: 40 + i * 120, top: 20 }}>
                    <Person size={110} phase={i} color={C.textSecondary} run={frame >= tVend} />
                  </div>
                ))}
              </div>
              {frame >= tVend && (
                <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
                  <PriceTag text="VENDU" color={C.negative} rotate={-6} />
                  <PriceTag text="VENDU" color={C.negative} rotate={5} />
                </div>
              )}
              {frame >= tVend && <Label size={22} color={C.textPrimary}>même la relation inverse disparaît</Label>}
            </Panel>
          </Pop>
        </div>
      </Beat>

      <Beat from={tCorr} style={{ left: 0, top: 0 }}>
        <div style={{ width: STAGE_W, height: 650, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 30 }}>
          <Seesaw tilt={Math.sin(frame / 10) * 10} width={700} />
          <Pop at={tCorr}>
            <Big size={40}>Corrélation = une statistique observée, selon le régime</Big>
          </Pop>
          {frame >= tNi && <Stamp at={tNi} text="NI CAUSE · NI LOI" color={C.accentBright} size={38} />}
        </div>
      </Beat>
    </SceneShell>
  );
};
