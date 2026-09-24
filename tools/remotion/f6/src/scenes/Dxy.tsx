import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { theme } from "../theme";
import { Sfx, makeCue, Panel } from "./shared";
import type { SceneProps } from "./shared";
import { Beat, Pop, clamp } from "./characters";
import { SceneShell, Center, Big, Label, STAGE_W } from "./stage";
import { Speedometer } from "./props";
import { Stamp, Pill } from "./props5";
import { Coin, CUR, DXY_WEIGHTS, WeightBar, Move } from "./props6";

const C = theme.colors;

export const Dxy: React.FC<SceneProps> = ({ words, durationInFrames }) => {
  const frame = useCurrentFrame();
  const cue = makeCue(words);
  const tDxy = cue("on utilise le dxy");
  const tSix = cue("six devises");
  const coinAt = [cue("l euro le yen"), cue("le yen"), cue("la livre"), cue("le dollar canadien"), cue("la couronne"), cue("le franc suisse")];
  const tPoids = cue("chaque devise a un poids");
  const tLourd = cue("l euro pese");
  const tOrient = cue("les paires sont orientees");
  const tGeo = cue("indice geometrique");
  const tMult = cue("il multiplie");
  const tEx = cue("exemple");
  const tFaib = cue("mais faiblit");
  const tDomine = cue("comme l euro domine");
  const tComp = cue("ne compensent pas");
  const tRes = cue("resultat");
  const tPanier = cue("le dxy decrit");

  const needle = interpolate(frame, [tDomine, tDomine + 40], [0.5, 0.82], { ...clamp, easing: theme.ease.out });

  return (
    <SceneShell eyebrow="F6 · Le DXY" title="Un panier de six devises, dominé par l'euro" durationInFrames={durationInFrames}>
      <Sfx file="whoosh.wav" at={tDxy} volume={0.4} />
      {coinAt.map((t, i) => (
        <Sfx key={i} file="pop.wav" at={t} volume={0.3} />
      ))}
      <Sfx file="chime.wav" at={tLourd} volume={0.45} />
      <Sfx file="whoosh.wav" at={tGeo} volume={0.4} />
      <Sfx file="whoosh.wav" at={tEx} volume={0.4} />
      <Sfx file="bass.wav" at={tDomine} volume={0.45} />
      <Sfx file="bass.wav" at={tPanier} volume={0.5} />

      {/* A: the basket and weights */}
      <Beat from={tDxy - 4} to={tGeo} style={{ left: 0, top: 0 }}>
        <div style={{ width: STAGE_W, height: 660, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 40 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 40 }}>
            <Pop at={tDxy}>
              <Coin sym="$" size={180} color={C.positive} />
            </Pop>
            <Pop at={tSix}>
              <Big size={60} color={C.textMuted}>vs</Big>
            </Pop>
            <div style={{ display: "flex", gap: 18 }}>
              {DXY_WEIGHTS.map((d, i) => (
                <Pop key={d.k} at={coinAt[i]}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                    <Coin sym={CUR[d.k].sym} size={i === 0 && frame >= tLourd ? 150 : 110} color={CUR[d.k].color} />
                    <Label size={20}>{d.name}</Label>
                  </div>
                </Pop>
              ))}
            </div>
          </div>
          {frame >= tPoids && (
            <Pop at={tPoids}>
              <WeightBar from={tPoids} width={1500} />
            </Pop>
          )}
          {frame >= tOrient && (
            <Pop at={tOrient}>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <Move at={tOrient} up size={50} />
                <Label size={28} color={C.textPrimary}>indice plus haut = dollar plus fort, toujours</Label>
              </div>
            </Pop>
          )}
        </div>
      </Beat>

      {/* B: geometric formula */}
      <Beat from={tGeo} to={tEx} style={{ left: 0, top: 0 }}>
        <Center column gap={40}>
          <Pill text="indice géométrique" size={32} filled />
          <div style={{ display: "flex", alignItems: "center", gap: 14, fontFamily: theme.mono, fontSize: 34, color: C.textPrimary, flexWrap: "wrap", justifyContent: "center", maxWidth: 1600 }}>
            <span>DXY = 50,14 ×</span>
            {DXY_WEIGHTS.map((d, i) => (
              <Pop key={d.k} at={tMult + i * 6}>
                <span style={{ whiteSpace: "nowrap" }}>
                  <span style={{ color: CUR[d.k].color, fontWeight: 900 }}>{d.k === "EUR" || d.k === "GBP" ? `${d.k}USD` : `USD${d.k}`}</span>
                  <sup style={{ color: C.accentBright, fontSize: 22 }}>{(d.k === "EUR" || d.k === "GBP" ? "−" : "") + (d.w / 100).toFixed(3).replace(".", ",")}</sup>
                  {i < DXY_WEIGHTS.length - 1 ? " ×" : ""}
                </span>
              </Pop>
            ))}
          </div>
          <Pop at={tMult + 40}>
            <Label size={26}>on multiplie les taux, chacun élevé à la puissance de son poids (pas une simple moyenne)</Label>
          </Pop>
        </Center>
      </Beat>

      {/* C: one big leg dominates */}
      <Beat from={tEx} style={{ left: 0, top: 0 }}>
        <div style={{ width: STAGE_W, height: 660, display: "flex", alignItems: "center", justifyContent: "center", gap: 90 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 26 }}>
            {[
              { k: "EUR" as const, big: true, up: true, at: tEx + 10, t: "dollar nettement plus fort face à l'euro" },
              { k: "CAD" as const, big: false, up: false, at: tFaib, t: "un peu plus faible face au dollar canadien" },
              { k: "JPY" as const, big: false, up: false, at: tFaib + 20, t: "un peu plus faible face au yen" },
            ].map((l) => (
              <Pop key={l.k} at={l.at}>
                <Panel glow={l.big && frame >= tDomine} style={{ display: "flex", alignItems: "center", gap: 20, padding: "16px 24px", width: 720 }}>
                  <Coin sym={CUR[l.k].sym} size={l.big ? 100 : 70} color={CUR[l.k].color} />
                  <Move at={l.at} up={l.up} size={l.big ? 70 : 40} color={l.up ? C.negative : C.positive} />
                  <Label size={24} color={C.textPrimary}>{l.t}</Label>
                  <span style={{ marginLeft: "auto", color: C.textMuted, fontFamily: theme.mono, fontSize: 20 }}>{DXY_WEIGHTS.find((d) => d.k === l.k)?.w.toString().replace(".", ",")} %</span>
                </Panel>
              </Pop>
            ))}
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
            <Pop at={tDomine}>
              <Speedometer value={needle} size={360} label="DXY" />
            </Pop>
            {frame >= tComp && <Label size={24}>les petits mouvements inverses ne compensent pas</Label>}
            {frame >= tRes && (
              <Pop at={tRes}>
                <Big size={34} color={C.accentBright}>l&apos;indice monte… sans victoire sur tout le monde</Big>
              </Pop>
            )}
            {frame >= tPanier && <Stamp at={tPanier} text="PANIER ≠ UNANIMITÉ" color={C.accentBright} size={32} />}
          </div>
        </div>
      </Beat>
    </SceneShell>
  );
};
