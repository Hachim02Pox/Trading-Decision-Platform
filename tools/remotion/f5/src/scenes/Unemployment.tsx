import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { theme } from "../theme";
import { Sfx, makeCue, Panel, AnimatedNumber, useBreathe } from "./shared";
import type { SceneProps } from "./shared";
import { Beat, Pop, Person, Bubble, ArrowGlyph, clamp } from "./characters";
import { SceneShell, Center, Big, Label, STAGE_W } from "./stage";
import { CheckDraw, CrossDraw, Magnifier, Briefcase, CalendarPage, Pill } from "./props5";

const C = theme.colors;
const fmt = (n: number) => `+${Math.round(n).toLocaleString("fr-FR").replace(/ | /g, " ")}`;

/** Person that runs from (x0,y0) to (x1,y1) between frames a and b. */
const Mover: React.FC<{ a: number; b: number; x0: number; y0: number; x1: number; y1: number; size?: number; color?: string; label?: string; appear?: number }> = ({ a, b, x0, y0, x1, y1, size = 90, color = C.context, label, appear }) => {
  const frame = useCurrentFrame();
  const t = interpolate(frame, [a, b], [0, 1], { ...clamp, easing: theme.ease.inOut });
  const moving = frame >= a && frame < b;
  const x = x0 + (x1 - x0) * t;
  const y = y0 + (y1 - y0) * t - Math.abs(Math.sin(t * Math.PI * 3)) * (moving ? 16 : 0);
  const body = <Person size={size} color={color} run={moving} label={label} />;
  return (
    <div style={{ position: "absolute", left: x, top: y, transform: x1 < x0 && moving ? "scaleX(-1)" : undefined }}>
      {appear !== undefined ? <Pop at={appear}>{body}</Pop> : body}
    </div>
  );
};

const Zone: React.FC<{ x: number; title: string; color: string; lit?: boolean }> = ({ x, title, color, lit }) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: 20,
      width: 520,
      height: 380,
      borderRadius: 22,
      border: `2px ${lit ? "solid" : "dashed"} ${lit ? color : C.hairline}`,
      background: lit ? `${color}12` : "transparent",
    }}
  >
    <div style={{ position: "absolute", left: 0, right: 0, bottom: 14, textAlign: "center", color, fontFamily: theme.mono, fontSize: 21, fontWeight: 800, letterSpacing: 2 }}>{title}</div>
  </div>
);

export const Unemployment: React.FC<SceneProps> = ({ words, durationInFrames }) => {
  const frame = useCurrentFrame();
  const cue = makeCue(words);
  const tRate = cue("c est le nombre de chomeurs");
  const tDiv = cue("divise par");
  const tCond = cue("pour etre compte");
  const tC1 = cue("ne pas avoir");
  const tC2 = cue("etre disponible");
  const tC3 = cue("avoir cherche");
  const tPA = cue("la population active c est");
  const tEmp = cue("les personnes en emploi");
  const tPlus = cue("plus les chomeurs");
  const tNot = cue("quelqu un qui ne cherche pas");
  const tPart = cue("taux de participation");
  const tAdult = cue("population adulte");
  const tEx = cue("un exemple");
  const tHachim = cue("imagine que hachim");
  const tChercher = cue("a chercher un emploi");
  const tStat = cue("il entre dans les statistiques");
  const tComme = cue("comme chomeur", tStat);
  const tPays = cue("a l echelle du pays");
  const t250 = cue("rejoignent");
  const t100 = cue("cent mille trouvent");
  const t150 = cue("cent cinquante mille cherchent");
  const tRes = cue("resultat");
  const tBad = cue("mauvaise nouvelle");
  const tForce = cue("pas forcement");
  const tWant = cue("plus de gens veulent");
  const tInv = cue("a l inverse");
  const tRaison = cue("une mauvaise raison");
  const tAband = cue("abandonnent");
  const tFinal = cue("un taux sans");
  const breathe = useBreathe(0.2);

  return (
    <SceneShell eyebrow="F5 · Chômage" title="Un taux… et son dénominateur" durationInFrames={durationInFrames}>
      <Sfx file="pop.wav" at={tRate} volume={0.4} />
      <Sfx file="tick.wav" at={tDiv} volume={0.35} />
      {[tC1, tC2, tC3].map((t) => (
        <Sfx key={t} file="tick.wav" at={t} volume={0.45} />
      ))}
      <Sfx file="whoosh.wav" at={tPA} volume={0.4} />
      <Sfx file="bass.wav" at={tNot} volume={0.35} />
      <Sfx file="chime.wav" at={tPart} volume={0.4} />
      <Sfx file="whoosh.wav" at={tEx} volume={0.4} />
      <Sfx file="pop.wav" at={tComme} volume={0.45} />
      <Sfx file="pop.wav" at={t250} volume={0.4} />
      <Sfx file="whoosh.wav" at={t100} volume={0.35} />
      <Sfx file="whoosh.wav" at={t150} volume={0.35} />
      <Sfx file="bass.wav" at={tRes} volume={0.45} />
      <Sfx file="chime.wav" at={tForce} volume={0.45} />
      <Sfx file="bass.wav" at={tRaison} volume={0.45} />
      <Sfx file="chime.wav" at={tFinal} volume={0.5} />

      {/* A: the ratio */}
      <Beat from={0} to={tCond} style={{ left: 0, top: 0 }}>
        <Center gap={60}>
          <Pop at={tRate}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
              <div style={{ display: "flex", gap: 4 }}>
                {[0, 1].map((i) => (
                  <Person key={i} size={90} phase={i} color={C.context} />
                ))}
              </div>
              <Big size={40} color={C.accentBright}>chômeurs</Big>
            </div>
          </Pop>
          <Pop at={tDiv}>
            <Big size={90} color={C.textMuted}>÷</Big>
          </Pop>
          <Pop at={tDiv + 8}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
              <div style={{ display: "flex", gap: 4 }}>
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <Person key={i} size={90} phase={i} color={i < 2 ? C.context : C.positive} />
                ))}
              </div>
              <Big size={40} color={C.accentBright}>population active</Big>
            </div>
          </Pop>
        </Center>
      </Beat>

      {/* B: three conditions */}
      <Beat from={tCond} to={tPA} style={{ left: 0, top: 0 }}>
        <Center gap={120}>
          <div style={{ position: "relative" }}>
            <Person size={260} color={C.context} label="compté comme chômeur ?" />
            <div style={{ position: "absolute", left: 150, top: 70, transform: `rotate(${Math.sin(frame / 10) * 10}deg)` }}>
              <Magnifier size={110} />
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 26 }}>
            {[
              { t: "Ne pas avoir d'emploi", at: tC1 },
              { t: "Être disponible pour travailler", at: tC2 },
              { t: "Avoir cherché activement", at: tC3 },
            ].map((it, i) => (
              <Pop key={it.t} at={it.at}>
                <Panel glow={frame >= it.at && frame < it.at + 45} style={{ display: "flex", alignItems: "center", gap: 22, padding: "20px 30px", width: 720 }}>
                  <CheckDraw at={it.at + 6} size={52} />
                  <div style={{ color: C.textMuted, fontFamily: theme.mono, fontSize: 24 }}>{i + 1}</div>
                  <Big size={34}>{it.t}</Big>
                  {i === 2 && frame >= it.at + 30 && (
                    <div style={{ marginLeft: "auto", transform: "scale(0.42)", transformOrigin: "right center", width: 90 }}>
                      <CalendarPage top="4 SEMAINES" big="≤ 28 j" size={220} />
                    </div>
                  )}
                </Panel>
              </Pop>
            ))}
          </div>
        </Center>
      </Beat>

      {/* C: labor force / participation */}
      <Beat from={tPA} to={tEx} style={{ left: 0, top: 0 }}>
        <div style={{ position: "relative", width: STAGE_W, height: 690 }}>
          <div style={{ position: "absolute", left: 110, top: 150, display: "flex", gap: 14, alignItems: "flex-end" }}>
            {Array.from({ length: 11 }).map((_, i) => {
              const working = i < 6;
              const searching = i >= 6 && i < 8;
              const out = i >= 8;
              return (
                <Pop key={i} at={tPA + i * 3}>
                  <div style={{ position: "relative", opacity: out && frame >= tNot ? 0.4 : 1, marginLeft: i === 8 ? 90 : 0 }}>
                    <Person size={110} phase={i} color={working ? C.positive : searching ? C.context : C.textMuted} />
                    <div style={{ position: "absolute", left: 30, top: -44 }}>
                      {working && frame >= tEmp && <Briefcase size={36} />}
                      {searching && frame >= tPlus && <Magnifier size={36} />}
                    </div>
                  </div>
                </Pop>
              );
            })}
          </div>
          {/* labor-force bracket over the first 8 */}
          {frame >= tEmp && (
            <div style={{ position: "absolute", left: 110, top: 310, width: interpolate(frame, [tEmp, tPlus + 10], [620, 8 * 102], { ...clamp, easing: theme.ease.out }), borderTop: `4px solid ${C.accentBright}`, paddingTop: 10 }}>
              <Big size={28} color={C.accentBright}>population active</Big>
              <Label size={20}>en emploi + chômeurs</Label>
            </div>
          )}
          {frame >= tNot && (
            <div style={{ position: "absolute", left: 1060, top: 60, display: "flex", alignItems: "center", gap: 10 }}>
              <CrossDraw at={tNot + 4} size={50} />
              <Label size={24} color={C.negative}>ne cherche pas : hors du calcul</Label>
            </div>
          )}
          {frame >= tPart && (
            <div style={{ position: "absolute", left: 90, top: 460, width: 1360, borderTop: `3px dashed ${C.context}`, paddingTop: 12, opacity: interpolate(frame, [tPart, tPart + 12], [0, 1], clamp) }}>
              <Big size={30} color={C.context}>participation = population active ÷ population adulte</Big>
              {frame >= tAdult && <Label size={20}>(population civile en âge de travailler)</Label>}
            </div>
          )}
        </div>
      </Beat>

      {/* D + E: Hachim, then the national example */}
      <Beat from={tEx} to={tBad} style={{ left: 0, top: 0 }}>
        <div style={{ position: "relative", width: STAGE_W, height: 690 }}>
          <Zone x={30} title="HORS POPULATION ACTIVE" color={C.textSecondary} lit={frame >= tHachim && frame < tChercher + 20} />
          <Zone x={610} title="CHERCHE UN EMPLOI = CHÔMEUR" color={C.context} lit={frame >= tStat} />
          <Zone x={1190} title="EN EMPLOI" color={C.positive} lit={frame >= t100} />
          {/* residents */}
          <div style={{ position: "absolute", left: 70, top: 190 }}>
            <Person size={100} color={C.textMuted} phase={1} />
          </div>
          <div style={{ position: "absolute", left: 660, top: 190 }}>
            <Person size={100} color={C.context} phase={2} />
          </div>
          {[0, 1, 2].map((i) => (
            <div key={i} style={{ position: "absolute", left: 1230 + i * 150, top: 190 }}>
              <Person size={100} color={C.positive} phase={i + 3} />
            </div>
          ))}
          <Mover a={tChercher} b={tStat} x0={330} y0={180} x1={930} y1={180} size={115} color={C.accent} label="Hachim" appear={tHachim} />
          {frame >= tComme && frame < t250 && (
            <div style={{ position: "absolute", left: 1000, top: 60 }}>
              <Pop at={tComme}>
                <Bubble text="chômeur… pour l'instant" tone={C.context} width={300} tail="left" />
              </Pop>
            </div>
          )}
          {/* 5 arrivals = 250 000 */}
          {[0, 1, 2, 3, 4].map((i) => {
            const toJob = i < 2;
            const a = toJob ? t100 + i * 5 : t150 + (i - 2) * 5;
            const x1 = toJob ? 1230 + i * 110 : 660 + (i - 2) * 95;
            return (
              <Mover key={i} a={a} b={a + 30} x0={60 + i * 92} y0={40} x1={x1} y1={40} size={70} color={C.accentBright} appear={t250 + i * 4} />
            );
          })}
          {frame >= t250 && (
            <div style={{ position: "absolute", left: 40, top: 430, width: STAGE_W - 80, display: "flex", justifyContent: "space-between" }}>
              <Pop at={t250}>
                <Panel style={{ padding: "16px 26px", width: 500 }}>
                  <Label size={20}>population active</Label>
                  <Big size={40} color={C.accentBright}>
                    <AnimatedNumber from={0} to={250000} delay={t250} durationFrames={30} format={fmt} />
                  </Big>
                  <Label size={18}>chaque silhouette = 50 000 personnes</Label>
                </Panel>
              </Pop>
              <Pop at={t150}>
                <Panel glow={frame >= tRes} style={{ padding: "16px 26px", width: 500 }}>
                  <Label size={20}>chômeurs</Label>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
                    {frame >= tRes && <ArrowGlyph up color={C.negative} size={42} />}
                    <Big size={40} color={C.context}>
                      <AnimatedNumber from={0} to={150000} delay={t150} durationFrames={30} format={fmt} />
                    </Big>
                  </div>
                </Panel>
              </Pop>
              <Pop at={t100}>
                <Panel glow={frame >= tRes} style={{ padding: "16px 26px", width: 500 }}>
                  <Label size={20}>emploi</Label>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
                    {frame >= tRes && <ArrowGlyph up color={C.positive} size={42} />}
                    <Big size={40} color={C.positive}>
                      <AnimatedNumber from={0} to={100000} delay={t100} durationFrames={30} format={fmt} />
                    </Big>
                  </div>
                </Panel>
              </Pop>
            </div>
          )}
          {frame >= tPays && frame < t250 && (
            <div style={{ position: "absolute", left: 0, right: 0, top: 480, display: "flex", justifyContent: "center" }}>
              <Pop at={tPays}>
                <Pill text="À l'échelle du pays" size={28} />
              </Pop>
            </div>
          )}
        </div>
      </Beat>

      {/* F: good or bad? */}
      <Beat from={tBad} style={{ left: 0, top: 0 }}>
        <div style={{ width: STAGE_W, height: 640, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 30 }}>
          <div style={{ display: "flex", gap: 40 }}>
            <Pop at={tForce}>
              <Panel glow={frame >= tWant && frame < tInv} style={{ width: 780, display: "flex", alignItems: "center", gap: 24, padding: 28 }}>
                <div style={{ display: "flex" }}>
                  {[0, 1, 2].map((i) => (
                    <Person key={i} size={96} phase={i} color={C.positive} cheer={frame >= tWant} />
                  ))}
                </div>
                <div>
                  <Big size={32} color={C.positive}>Chômage ↑ … participation ↑</Big>
                  <Label size={22}>plus de gens veulent travailler</Label>
                  {frame >= tWant && <CheckDraw at={tWant + 8} size={44} />}
                </div>
              </Panel>
            </Pop>
            <Pop at={tInv}>
              <Panel glow={frame >= tRaison && frame < tFinal} style={{ width: 780, display: "flex", alignItems: "center", gap: 24, padding: 28, borderColor: C.negative }}>
                <div style={{ position: "relative", width: 260, height: 130 }}>
                  {[0, 1, 2].map((i) => {
                    const x = interpolate(frame, [tAband + i * 6, tAband + 50 + i * 6], [i * 60, 150 + i * 30], { ...clamp, easing: theme.ease.in });
                    const o = interpolate(frame, [tAband + 18 + i * 6, tAband + 42 + i * 6], [1, 0.08], clamp);
                    return (
                      <div key={i} style={{ position: "absolute", left: x, top: 0, opacity: o }}>
                        <Person size={96} phase={i} color={C.textMuted} run={frame >= tAband} />
                      </div>
                    );
                  })}
                </div>
                <div>
                  <Big size={32} color={C.negative}>Chômage ↓ … mauvaise raison</Big>
                  <Label size={22}>des gens abandonnent leur recherche</Label>
                </div>
              </Panel>
            </Pop>
          </div>
          <Pop at={tFinal}>
            <div style={{ transform: `scale(${breathe.scale})`, marginTop: 40 }}>
              <Big size={48} color={C.accentBright} glow>
                Un taux sans son dénominateur ne raconte jamais toute l&apos;histoire
              </Big>
            </div>
          </Pop>
        </div>
      </Beat>
    </SceneShell>
  );
};
