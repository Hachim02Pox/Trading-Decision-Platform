import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { theme } from "../theme";
import { Sfx, makeCue, Panel } from "./shared";
import type { SceneProps } from "./shared";
import { Beat, Pop, Person, clamp } from "./characters";
import { SceneShell, Big, Label, STAGE_W } from "./stage";
import { Factory, Store } from "./props";
import { Gauge50, Pill, CrossDraw } from "./props5";

const C = theme.colors;
type Vote = "up" | "flat" | "down";
const VOTE_COLOR: Record<Vote, string> = { up: C.positive, flat: C.accent, down: C.negative };

const Sign: React.FC<{ vote: Vote; size?: number }> = ({ vote, size = 56 }) => {
  const col = VOTE_COLOR[vote];
  const d = vote === "up" ? "M20 30 V10 M20 10 L12 18 M20 10 L28 18" : vote === "down" ? "M20 10 V30 M20 30 L12 22 M20 30 L28 22" : "M9 20 H31 M31 20 L24 13 M31 20 L24 27";
  return (
    <svg width={size} height={size} viewBox="0 0 40 40">
      <circle cx="20" cy="20" r="18" fill={`${col}22`} stroke={col} strokeWidth="2.5" />
      <path d={d} stroke={col} strokeWidth="3.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

// idle survey: mixed answers that flip around; example: 3 up, 4 flat, 3 down
const IDLE: Vote[][] = [
  ["up", "flat", "down", "up", "flat", "flat", "up", "down", "flat", "up"],
  ["flat", "up", "flat", "down", "up", "flat", "down", "up", "up", "flat"],
];
const EXAMPLE: Vote[] = ["up", "up", "up", "flat", "flat", "flat", "flat", "down", "down", "down"];

export const Ism: React.FC<SceneProps> = ({ words, durationInFrames }) => {
  const frame = useCurrentFrame();
  const cue = makeCue(words);
  const tIsm = cue("il y a l ism");
  const tDir = cue("directeurs d achat");
  const tCmd = cue("les commandes");
  const tProd = cue("la production");
  const tEmp = cue("l emploi");
  const tPrix = cue("les prix");
  const tMieux = cue("c est mieux");
  const tPareil = cue("pareil");
  const tMoins = cue("ou moins bien");
  const tIdx = cue("l indice de diffusion");
  const tHalf = cue("la moitie de ceux");
  const tEx = cue("exemple");
  const t30 = cue("trente pourcent disent");
  const t40 = cue("quarante pourcent");
  const t30b = cue("trente pourcent moins");
  const tCalc = cue("trente plus la moitie");
  const t50 = cue("cinquante", tCalc);
  const tPile = cue("pile la ligne");
  const tAbove = cue("au dessus de cinquante");
  const tBelow = cue("en dessous");
  const tTrap = cue("et voici le piege");
  const t49 = cue("un ism a quarante neuf");
  const tCount = cue("ca dit combien");
  const tNotSize = cue("pas de combien");
  const t4849 = cue("passer de quarante huit");
  const tMoinsGen = cue("contraction moins generalisee");
  const t5552 = cue("passer de cinquante cinq");
  const tMoinsEt = cue("mais moins etendue");
  const tInd = cue("et l industrie");
  const tAvg = cue("on ne fait pas");

  const votes: Vote[] = frame >= t30 ? EXAMPLE : IDLE[Math.floor(frame / 24) % 2];
  const sorted = frame >= t30;
  const gaugeC = frame < tBelow ? 50 + Math.max(0, Math.sin((frame - tAbove) / 10)) * 8 : 50 - Math.max(0, Math.sin((frame - tBelow) / 10)) * 8;
  const g1 = interpolate(frame, [t4849 + 20, t4849 + 50], [48, 49], { ...clamp, easing: theme.ease.inOut });
  const g2 = interpolate(frame, [t5552 + 20, t5552 + 50], [55, 52], { ...clamp, easing: theme.ease.inOut });

  return (
    <SceneShell eyebrow="F5 · ISM" title="Un indice de diffusion : l'étendue, pas la taille" durationInFrames={durationInFrames}>
      <Sfx file="pop.wav" at={tIsm} volume={0.4} />
      {[tCmd, tProd, tEmp, tPrix].map((t) => (
        <Sfx key={t} file="tick.wav" at={t} volume={0.35} />
      ))}
      <Sfx file="pop.wav" at={tMieux} volume={0.35} />
      <Sfx file="pop.wav" at={tPareil} volume={0.35} />
      <Sfx file="pop.wav" at={tMoins} volume={0.35} />
      <Sfx file="whoosh.wav" at={tIdx} volume={0.4} />
      <Sfx file="whoosh.wav" at={t30} volume={0.35} />
      <Sfx file="chime.wav" at={tPile} volume={0.5} />
      <Sfx file="bass.wav" at={tTrap} volume={0.5} />
      <Sfx file="tick.wav" at={t4849 + 20} volume={0.4} />
      <Sfx file="tick.wav" at={t5552 + 20} volume={0.4} />
      <Sfx file="whoosh.wav" at={tInd} volume={0.4} />

      {/* A + B: the survey, then the example */}
      <Beat from={0} to={tAbove} style={{ left: 0, top: 0 }}>
        <div style={{ position: "relative", width: STAGE_W, height: 690 }}>
          <div style={{ position: "absolute", left: 30, top: 0, display: "flex", gap: 12, alignItems: "center" }}>
            <Pop at={tIsm}>
              <Pill text="ISM · directeurs d'achat" size={24} filled />
            </Pop>
            {[
              { t: "commandes", at: tCmd },
              { t: "production", at: tProd },
              { t: "emploi", at: tEmp },
              { t: "prix", at: tPrix },
            ].map((x) => (
              <Pop key={x.t} at={x.at}>
                <Pill text={x.t} color={C.context} size={22} />
              </Pop>
            ))}
          </div>
          <div style={{ position: "absolute", left: 40, top: 100, display: "flex", gap: 22 }}>
            {votes.map((v, i) => (
              <Pop key={i} at={tDir + i * 3}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                  {frame >= tMieux - 10 && <Sign vote={v} size={58} />}
                  <Person size={110} phase={i} color={sorted ? VOTE_COLOR[v] : C.textSecondary} />
                </div>
              </Pop>
            ))}
          </div>
          {sorted && (
            <div style={{ position: "absolute", left: 40, top: 310, display: "flex" }}>
              {[
                { n: 3, pct: "30 %", t: "mieux", c: C.positive, at: t30 },
                { n: 4, pct: "40 %", t: "pareil", c: C.accent, at: t40 },
                { n: 3, pct: "30 %", t: "moins bien", c: C.negative, at: t30b },
              ].map((g) => (
                <div key={g.t} style={{ width: g.n * 110 - 22, marginRight: 22, opacity: frame >= g.at ? 1 : 0.2 }}>
                  <div style={{ borderTop: `4px solid ${g.c}`, paddingTop: 8, textAlign: "center" }}>
                    <Big size={36} color={g.c}>{g.pct}</Big>
                    <Label size={20}>{g.t}</Label>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div style={{ position: "absolute", left: 40, top: 470, display: "flex", gap: 20 }}>
            {!sorted &&
              [
                { v: "up" as Vote, t: "mieux", at: tMieux },
                { v: "flat" as Vote, t: "pareil", at: tPareil },
                { v: "down" as Vote, t: "moins bien", at: tMoins },
              ].map((x) => (
                <Pop key={x.t} at={x.at}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Sign vote={x.v} size={50} />
                    <Big size={30} color={VOTE_COLOR[x.v]}>{x.t}</Big>
                  </div>
                </Pop>
              ))}
          </div>
          {/* formula */}
          <div style={{ position: "absolute", left: 1210, top: 90, width: 520 }}>
            {frame >= tIdx && (
              <Pop at={tIdx}>
                <Panel glow style={{ padding: "22px 26px", textAlign: "center" }}>
                  <Label size={22}>indice de diffusion</Label>
                  <div style={{ fontSize: 34, fontWeight: 900, color: C.textPrimary, marginTop: 6 }}>
                    <span style={{ color: C.positive }}>% mieux</span>
                    {frame >= tHalf && (
                      <>
                        {" + ½ × "}
                        <span style={{ color: C.accent }}>% pareil</span>
                      </>
                    )}
                  </div>
                  {frame >= tCalc && (
                    <div style={{ fontFamily: theme.mono, fontSize: 40, fontWeight: 900, marginTop: 14, color: C.accentBright }}>
                      30 + ½ × 40 {frame >= t50 ? "= 50" : ""}
                    </div>
                  )}
                </Panel>
              </Pop>
            )}
            {frame >= tPile - 8 && (
              <div style={{ marginTop: 20, display: "flex", justifyContent: "center" }}>
                <Pop at={tPile - 8}>
                  <Gauge50 value={50} size={360} label="la ligne de partage" />
                </Pop>
              </div>
            )}
          </div>
          {frame >= tEx && frame < t30 && (
            <div style={{ position: "absolute", left: 40, top: 540 }}>
              <Pop at={tEx}>
                <Pill text="exemple : 10 répondants" size={24} />
              </Pop>
            </div>
          )}
        </div>
      </Beat>

      {/* C: above / below 50 */}
      <Beat from={tAbove} to={tTrap} style={{ left: 0, top: 0 }}>
        <div style={{ width: STAGE_W, display: "flex", alignItems: "center", justifyContent: "center", gap: 90, height: 640 }}>
          <Gauge50 value={gaugeC} size={520} />
          <div style={{ display: "flex", flexDirection: "column", gap: 26, width: 620 }}>
            <Pop at={tAbove}>
              <Panel glow={frame < tBelow} style={{ padding: "22px 28px", borderColor: C.positive }}>
                <Big size={34} color={C.positive}>au-dessus de 50</Big>
                <Label size={24}>plus de réponses « expansion » que « contraction »</Label>
              </Panel>
            </Pop>
            <Pop at={tBelow}>
              <Panel glow={frame >= tBelow} style={{ padding: "22px 28px", borderColor: C.negative }}>
                <Big size={34} color={C.negative}>en dessous de 50</Big>
                <Label size={24}>l&apos;inverse</Label>
              </Panel>
            </Pop>
          </div>
        </div>
      </Beat>

      {/* D: the trap */}
      <Beat from={tTrap} to={tInd} style={{ left: 0, top: 0 }}>
        <div style={{ position: "relative", width: STAGE_W, height: 690 }}>
          <div style={{ position: "absolute", left: 30, top: 0, width: 760, display: "flex", flexDirection: "column", gap: 24 }}>
            <Pop at={t49}>
              <Panel style={{ padding: "22px 28px", display: "flex", alignItems: "center", gap: 20 }}>
                <Big size={44}>ISM 49</Big>
                <Big size={44} color={C.textMuted}>=</Big>
                <div style={{ position: "relative" }}>
                  <Big size={44} color={C.negative}>−1 % d&apos;activité</Big>
                  <div style={{ position: "absolute", left: 60, top: -30 }}>
                    <CrossDraw at={t49 + 30} size={120} />
                  </div>
                </div>
              </Panel>
            </Pop>
            {frame >= tCount && (
              <Pop at={tCount}>
                <Panel glow style={{ padding: "22px 28px" }}>
                  <Big size={30} color={C.accentBright}>combien de répondants voient mieux</Big>
                  <div style={{ display: "flex", gap: 4, marginTop: 10, justifyContent: "center" }}>
                    {EXAMPLE.map((v, i) => (
                      <Sign key={i} vote={v} size={48} />
                    ))}
                  </div>
                  {frame >= tNotSize && <Label size={24}>pas de combien l&apos;économie grandit</Label>}
                </Panel>
              </Pop>
            )}
          </div>
          <div style={{ position: "absolute", left: 840, top: 0, width: 880, display: "flex", gap: 30 }}>
            {frame >= t4849 && (
              <Pop at={t4849}>
                <Panel style={{ padding: 20, width: 420, textAlign: "center" }}>
                  <Gauge50 value={g1} size={360} />
                  <Big size={28} color={C.negative}>toujours sous 50</Big>
                  {frame >= tMoinsGen && <Label size={22}>contraction moins généralisée</Label>}
                </Panel>
              </Pop>
            )}
            {frame >= t5552 && (
              <Pop at={t5552}>
                <Panel style={{ padding: 20, width: 420, textAlign: "center" }}>
                  <Gauge50 value={g2} size={360} />
                  <Big size={28} color={C.positive}>encore de l&apos;expansion</Big>
                  {frame >= tMoinsEt && <Label size={22}>mais moins étendue</Label>}
                </Panel>
              </Pop>
            )}
          </div>
        </div>
      </Beat>

      {/* E: manufacturing vs services */}
      <Beat from={tInd} style={{ left: 0, top: 0 }}>
        <div style={{ width: STAGE_W, display: "flex", alignItems: "center", justifyContent: "center", gap: 70, height: 600 }}>
          <Pop at={tInd}>
            <Panel style={{ padding: 26, textAlign: "center" }}>
              <Factory size={170} />
              <Big size={32}>Industrie</Big>
              <Gauge50 value={48.7} size={300} />
            </Panel>
          </Pop>
          <div style={{ position: "relative", textAlign: "center" }}>
            <Big size={60} color={C.textMuted}>moyenne ?</Big>
            {frame >= tAvg && (
              <div style={{ position: "absolute", left: 60, top: -50 }}>
                <CrossDraw at={tAvg} size={160} />
              </div>
            )}
          </div>
          <Pop at={tInd + 10}>
            <Panel style={{ padding: 26, textAlign: "center" }}>
              <Store size={170} />
              <Big size={32}>Services</Big>
              <Gauge50 value={52.4} size={300} />
            </Panel>
          </Pop>
        </div>
        <div style={{ position: "absolute", left: 0, right: 0, top: 610, textAlign: "center" }}>
          <Label size={18} color={C.textMuted}>valeurs d&apos;exemple</Label>
        </div>
      </Beat>
    </SceneShell>
  );
};
