import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { theme } from "../theme";
import { Sfx, makeCue, Panel } from "./shared";
import type { SceneProps } from "./shared";
import { Beat, Pop, Person, clamp } from "./characters";
import { SceneShell, Big, Label, STAGE_W } from "./stage";
import { Office, HouseGlyph, Clipboard, Pill, Bathtub, CheckDraw } from "./props5";

const Diverge: React.FC<{ from: number }> = ({ from }) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [from, from + 45], [0, 1], { ...clamp, easing: theme.ease.inOut });
  const a = [80, 76, 72, 66, 62, 56, 50];
  const b = [80, 78, 80, 84, 86, 92, 96];
  const line = (v: number[]) => v.map((y, i) => `${10 + i * 60},${y}`).join(" ");
  return (
    <svg width="380" height="140" viewBox="0 0 380 130">
      <polyline points={line(a)} fill="none" stroke={theme.colors.accent} strokeWidth="5" strokeDasharray="420" strokeDashoffset={420 * (1 - p)} strokeLinecap="round" />
      <polyline points={line(b)} fill="none" stroke={theme.colors.context} strokeWidth="5" strokeDasharray="420" strokeDashoffset={420 * (1 - p)} strokeLinecap="round" />
    </svg>
  );
};

export const TwoSurveys: React.FC<SceneProps> = ({ words, durationInFrames }) => {
  const frame = useCurrentFrame();
  const cue = makeCue(words);
  const tTwo = cue("deux enquetes");
  const tEmp = cue("interroge les employeurs");
  const tEtab = cue("aupres des etablissements");
  const tJobs = cue("nombre d emplois");
  const tWage = cue("salaires horaires");
  const tGens = cue("seconde interroge");
  const tMen = cue("aupres des menages");
  const tChom = cue("taux de chomage");
  const tPart = cue("et la participation");
  const tSample = cue("meme echantillon");
  const tDef = cue("memes definitions");
  const tDiv = cue("diverger");
  const tFausse = cue("ne soit fausse");
  const tKey = cue("deuxieme idee");
  const tTub = cue("imagine une baignoire");
  const tLevel = cue("le niveau de l eau");
  const tStock = cue("c est un stock");
  const tChomeurs = cue("le nombre de chomeurs");
  const tRob = cue("le robinet");
  const tEntre = cue("ce qui entre");
  const tIns = cue("nouvelles inscriptions");
  const tCre = cue("creations d emplois du mois");
  const tRatio = cue("rapport entre deux stocks");

  const leftLit = frame >= tEmp;
  const rightLit = frame >= tGens;
  const level = interpolate(frame, [tRob, durationInFrames], [0.38, 0.8], { ...clamp, easing: theme.ease.inOut });

  return (
    <SceneShell eyebrow="F5 · La carte" title="Deux enquêtes, des stocks et des flux" durationInFrames={durationInFrames}>
      <Sfx file="whoosh.wav" at={tTwo} volume={0.4} />
      <Sfx file="pop.wav" at={tEmp} volume={0.4} />
      <Sfx file="tick.wav" at={tJobs} volume={0.35} />
      <Sfx file="tick.wav" at={tWage} volume={0.35} />
      <Sfx file="pop.wav" at={tGens} volume={0.4} />
      <Sfx file="tick.wav" at={tChom} volume={0.35} />
      <Sfx file="tick.wav" at={tPart} volume={0.35} />
      <Sfx file="bass.wav" at={tSample} volume={0.35} />
      <Sfx file="chime.wav" at={tFausse} volume={0.45} />
      <Sfx file="whoosh.wav" at={tKey} volume={0.45} />
      <Sfx file="pop.wav" at={tTub} volume={0.4} />
      <Sfx file="tick.wav" at={tStock} volume={0.4} />
      <Sfx file="pop.wav" at={tRob} volume={0.4} />
      <Sfx file="tick.wav" at={tIns} volume={0.35} />
      <Sfx file="tick.wav" at={tCre} volume={0.35} />
      <Sfx file="chime.wav" at={tRatio} volume={0.5} />

      <Beat from={tTwo - 8} to={tKey} style={{ left: 0, top: 0 }}>
        <div style={{ position: "relative", width: STAGE_W, height: 690 }}>
          {/* left: establishments */}
          <div style={{ position: "absolute", left: 30, top: 0, width: 800, display: "flex", flexDirection: "column", alignItems: "center", gap: 10, opacity: leftLit || frame < tEmp ? 1 : 0.5 }}>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 20 }}>
              <Pop at={tTwo}>
                <Office size={240} lit={leftLit} />
              </Pop>
              <Pop at={tTwo + 5}>
                <Office size={180} lit={leftLit} />
              </Pop>
              <Pop at={tEmp + 6}>
                <Clipboard size={110} />
              </Pop>
            </div>
            <Pop at={tEtab}>
              <Big size={30} color={theme.colors.accentBright}>Enquête établissements · les employeurs</Big>
            </Pop>
            <div style={{ display: "flex", gap: 16, marginTop: 6 }}>
              <Pop at={tJobs}>
                <Pill text="Emplois créés" />
              </Pop>
              <Pop at={tWage}>
                <Pill text="Salaires horaires" />
              </Pop>
            </div>
          </div>
          {/* right: households */}
          <div style={{ position: "absolute", left: 910, top: 0, width: 800, display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 16, height: 240 }}>
              {[0, 1, 2].map((i) => (
                <Pop key={i} at={tTwo + 8 + i * 4}>
                  <HouseGlyph size={i === 1 ? 190 : 150} lit={rightLit} phase={i * 2} />
                </Pop>
              ))}
              <Pop at={tGens + 10}>
                <Person size={150} color={theme.colors.context} wave={frame > tGens + 10 && frame < tMen} />
              </Pop>
            </div>
            <Pop at={tMen}>
              <Big size={30} color={theme.colors.context}>Enquête ménages · les gens, chez eux</Big>
            </Pop>
            <div style={{ display: "flex", gap: 16, marginTop: 6 }}>
              <Pop at={tChom}>
                <Pill text="Taux de chômage" color={theme.colors.context} />
              </Pop>
              <Pop at={tPart}>
                <Pill text="Participation" color={theme.colors.context} />
              </Pop>
            </div>
          </div>
          {/* bottom band */}
          <div style={{ position: "absolute", left: 0, top: 500, width: STAGE_W, display: "flex", justifyContent: "center", alignItems: "center", gap: 40 }}>
            <Pop at={tSample}>
              <Panel style={{ padding: "18px 26px" }}>
                <Big size={28}>≠ échantillon</Big>
              </Panel>
            </Pop>
            <Pop at={tDef}>
              <Panel style={{ padding: "18px 26px" }}>
                <Big size={28}>≠ définitions</Big>
              </Panel>
            </Pop>
            <Pop at={tDiv}>
              <Panel style={{ padding: "10px 20px", display: "flex", alignItems: "center", gap: 14 }}>
                <Diverge from={tDiv} />
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <CheckDraw at={tFausse} size={42} />
                  <CheckDraw at={tFausse + 6} size={42} color={theme.colors.context} />
                </div>
              </Panel>
            </Pop>
            <Pop at={tFausse + 4}>
              <Big size={28} color={theme.colors.positive}>aucune n&apos;est fausse</Big>
            </Pop>
          </div>
        </div>
      </Beat>

      <Beat from={tKey} style={{ left: 0, top: 0 }}>
        <div style={{ position: "relative", width: STAGE_W, height: 690 }}>
          <div style={{ position: "absolute", left: 20, top: 0 }}>
            <Pop at={tKey + 4}>
              <div style={{ display: "flex", gap: 14 }}>
                <Pill text="STOCK" color={theme.colors.accentBright} filled={frame >= tStock} />
                <Pill text="FLUX" color={theme.colors.context} filled={frame >= tRob} />
              </div>
            </Pop>
          </div>
          <div style={{ position: "absolute", left: 20, top: 110 }}>
            <Pop at={tTub}>
              <Bathtub level={level} flowing={frame >= tRob} width={680} />
            </Pop>
          </div>
          <div style={{ position: "absolute", left: 700, top: 20, width: 1020, display: "flex", flexDirection: "column", gap: 22 }}>
            <Pop at={tLevel}>
              <Panel glow={frame >= tStock && frame < tRob} style={{ padding: "20px 28px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
                  <div style={{ width: 34, height: 6, background: theme.colors.accentBright, borderRadius: 3 }} />
                  <Big size={32} color={theme.colors.accentBright}>Stock = un niveau, à un instant</Big>
                </div>
                {frame >= tChomeurs && <Label size={24}>ex. : le nombre de chômeurs aujourd&apos;hui</Label>}
              </Panel>
            </Pop>
            <Pop at={tRob}>
              <Panel glow={frame >= tEntre && frame < tRatio} style={{ padding: "20px 28px" }}>
                <Big size={32} color={theme.colors.context}>Flux = ce qui entre pendant une période</Big>
                <div style={{ display: "flex", gap: 14, marginTop: 14, justifyContent: "center" }}>
                  <Pop at={tIns}>
                    <Pill text="Inscriptions au chômage · par semaine" color={theme.colors.context} size={21} />
                  </Pop>
                  <Pop at={tCre}>
                    <Pill text="Créations d'emplois · variation nette du mois" color={theme.colors.context} size={21} />
                  </Pop>
                </div>
              </Panel>
            </Pop>
            <Pop at={tRatio}>
              <Panel glow style={{ padding: "20px 28px", display: "flex", alignItems: "center", gap: 26, justifyContent: "center" }}>
                <Big size={30}>Taux de chômage =</Big>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <Big size={30} color={theme.colors.accentBright}>chômeurs</Big>
                  <div style={{ width: 300, height: 4, background: theme.colors.textPrimary, margin: "6px 0" }} />
                  <Big size={30} color={theme.colors.accentBright}>population active</Big>
                </div>
                <Label size={22}>stock ÷ stock</Label>
              </Panel>
            </Pop>
          </div>
        </div>
      </Beat>
    </SceneShell>
  );
};
