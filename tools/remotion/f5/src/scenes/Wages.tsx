import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "../theme";
import { Sfx, makeCue, Panel, AnimatedNumber } from "./shared";
import type { SceneProps } from "./shared";
import { Beat, Pop, Person, ClockIcon, DollarIcon, ArrowGlyph, clamp } from "./characters";
import { SceneShell, Center, Big, Label, STAGE_W } from "./stage";
import { Office, Pill, CheckDraw, CrossDraw } from "./props5";
import { Item, PriceTag } from "./props";

const C = theme.colors;
const WAGES = [30, 20, 30, 30, 20, 30, 30, 20, 30, 30]; // 3 x 20$ + 7 x 30$ = average 27$
const LOW = WAGES.map((w, i) => (w === 20 ? i : -1)).filter((i) => i >= 0);

const HBar: React.FC<{ label: string; pct: number; color: string; at: number }> = ({ label, pct, color, at }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - at, fps, config: theme.spring.smooth });
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 24, opacity: Math.min(1, p * 2) }}>
      <div style={{ width: 300, textAlign: "right", color: C.textSecondary, fontSize: 28 }}>{label}</div>
      <div style={{ width: pct * 200 * p, height: 64, borderRadius: 12, background: `linear-gradient(90deg, ${color}66, ${color})` }} />
      <div style={{ color, fontFamily: theme.mono, fontWeight: 900, fontSize: 44 }}>+{(pct * p).toFixed(0)} %</div>
    </div>
  );
};

export const Wages: React.FC<SceneProps> = ({ words, durationInFrames }) => {
  const frame = useCurrentFrame();
  const cue = makeCue(words);
  const tGain = cue("le gain horaire moyen");
  const tHour = cue("par heure");
  const tPriv = cue("des salaries du prive");
  const tMois = cue("sur un mois");
  const tAn = cue("sur un an");
  const tWhy = cue("pourquoi");
  const tFight = cue("se battent pour embaucher");
  const tServ = cue("inflation des services");
  const tTraps = cue("mais attention a deux");
  const tComp = cue("la composition");
  const tTen = cue("une entreprise de dix");
  const tThree = cue("les trois employes");
  const tLose = cue("perdent leur emploi");
  const tAvg = cue("passe de vingt sept");
  const tNobody = cue("personne n a ete augmente");
  const tSecond = cue("deuxieme piege");
  const tPrix = cue("avec des prix");
  const tUn = cue("c est environ un pourcent");
  const tPas4 = cue("pas quatre");
  const tValid = cue("pour valider");
  const tH = cue("les heures travaillees");
  const tMix = cue("le melange des secteurs");
  const tRev = cue("les revisions");
  const tLarge = cue("des mesures plus larges");

  const avg = interpolate(frame, [tAvg, tAvg + 40], [27, 30], { ...clamp, easing: theme.ease.inOut });
  const tug = Math.sin(frame / 8) * 16;

  return (
    <SceneShell eyebrow="F5 · Salaires" title="Le gain horaire moyen… et ses pièges" durationInFrames={durationInFrames}>
      <Sfx file="pop.wav" at={tGain} volume={0.4} />
      <Sfx file="tick.wav" at={tMois} volume={0.35} />
      <Sfx file="tick.wav" at={tAn} volume={0.35} />
      <Sfx file="whoosh.wav" at={tWhy} volume={0.4} />
      <Sfx file="pop.wav" at={tServ} volume={0.4} />
      <Sfx file="bass.wav" at={tTraps} volume={0.45} />
      <Sfx file="whoosh.wav" at={tLose} volume={0.4} />
      <Sfx file="chime.wav" at={tAvg} volume={0.45} />
      <Sfx file="bass.wav" at={tSecond} volume={0.4} />
      <Sfx file="bass.wav" at={tPas4} volume={0.5} />
      {[tH, tMix, tRev, tLarge].map((t) => (
        <Sfx key={t} file="tick.wav" at={t} volume={0.4} />
      ))}

      {/* A: what it measures */}
      <Beat from={tGain - 6} to={tWhy} style={{ left: 0, top: 0 }}>
        <div style={{ width: STAGE_W, height: 640, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 40 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 40 }}>
            <Pop at={tGain}>
              <DollarIcon size={150} />
            </Pop>
            <Pop at={tHour}>
              <Big size={80} color={C.textMuted}>÷</Big>
            </Pop>
            <Pop at={tHour + 4}>
              <ClockIcon size={150} />
            </Pop>
            <Pop at={tGain + 10}>
              <div>
                <Big size={48} color={C.accentBright}>Gain horaire moyen</Big>
                <Label size={24}>la paie moyenne, par heure</Label>
              </div>
            </Pop>
          </div>
          <Pop at={tPriv}>
            <Pill text="salariés du privé · hors agriculture" color={C.context} size={26} />
          </Pop>
          <div style={{ display: "flex", gap: 50 }}>
            <Pop at={tMois}>
              <Panel glow={frame >= tMois && frame < tAn} style={{ padding: "20px 34px", textAlign: "center" }}>
                <div style={{ width: 70, height: 30, borderRadius: 8, background: C.context, margin: "0 auto 12px" }} />
                <Big size={32}>sur un mois</Big>
                <Label size={22}>le rythme récent</Label>
              </Panel>
            </Pop>
            <Pop at={tAn}>
              <Panel glow={frame >= tAn} style={{ padding: "20px 34px", textAlign: "center" }}>
                <div style={{ width: 520, height: 30, borderRadius: 8, background: `repeating-linear-gradient(90deg, ${C.accent} 0 40px, ${C.accentDim} 40px 43px)`, margin: "0 auto 12px" }} />
                <Big size={32}>sur un an</Big>
                <Label size={22}>le contexte</Label>
              </Panel>
            </Pop>
          </div>
        </div>
      </Beat>

      {/* B: why it matters */}
      <Beat from={tWhy} to={tTraps} style={{ left: 0, top: 0 }}>
        <Center gap={120}>
          <Pop at={tWhy + 6}>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 10 }}>
              <Office size={210} lit />
              <div style={{ transform: `translateX(${-tug}px) rotate(-10deg)` }}>
                <Person size={170} color={C.negative} run />
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                {frame >= tFight && (
                  <Pop at={tFight}>
                    <PriceTag text={`${frame >= tFight + 30 ? "31" : "28"} $/h`} color={C.positive} rotate={0} />
                  </Pop>
                )}
                <Person size={200} color={C.accent} label="le candidat" />
              </div>
              <div style={{ transform: `translateX(${tug}px) rotate(10deg) scaleX(-1)` }}>
                <Person size={170} color={C.context} run />
              </div>
              <div style={{ transform: "scaleX(-1)" }}>
                <Office size={210} lit />
              </div>
            </div>
          </Pop>
          <Pop at={tServ}>
            <Panel glow style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, padding: 30 }}>
              <Item kind="scissors" size={120} />
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <ArrowGlyph up color={C.negative} size={40} />
                <Big size={30}>inflation des services</Big>
              </div>
            </Panel>
          </Pop>
        </Center>
      </Beat>

      {/* C: composition trap */}
      <Beat from={tTraps} to={tSecond} style={{ left: 0, top: 0 }}>
        <div style={{ position: "relative", width: STAGE_W, height: 690 }}>
          <div style={{ position: "absolute", left: 0, right: 0, top: 0, display: "flex", justifyContent: "center", gap: 20 }}>
            <Pop at={tTraps + 4}>
              <Pill text="piège 1 · la composition" color={C.negative} size={26} filled={frame >= tComp} />
            </Pop>
          </div>
          {frame < tTen + 4 && (
            <div style={{ position: "absolute", left: 0, top: 120, width: STAGE_W, display: "flex", justifyContent: "center", gap: 80 }}>
              {[1, 2].map((n) => (
                <Pop key={n} at={tTraps + 4 + n * 6}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, transform: `rotate(${Math.sin(frame / 8 + n) * 5}deg)` }}>
                    <svg width="200" height="186" viewBox="0 0 60 56">
                      <path d="M30 4 L57 52 H3 Z" fill={`${C.negative}22`} stroke={C.negative} strokeWidth="3" strokeLinejoin="round" />
                      <text x="30" y="44" textAnchor="middle" fontSize="24" fontWeight="900" fill={C.negative} fontFamily={theme.mono}>
                        {n}
                      </text>
                    </svg>
                    <Big size={30} color={n === 1 && frame >= tComp ? C.accentBright : C.textSecondary}>{n === 1 ? "la composition" : "salaire ≠ pouvoir d'achat"}</Big>
                  </div>
                </Pop>
              ))}
            </div>
          )}
          <div style={{ position: "absolute", left: 90, top: 100, width: 1560, height: 470 }}>
            {/* baseline and average line */}
            {frame >= tTen + 20 && (
              <div style={{ position: "absolute", left: 0, right: 0, top: 450 - avg * 9, borderTop: `4px dashed ${C.accentBright}`, opacity: interpolate(frame, [tTen + 20, tTen + 30], [0, 1], clamp) }}>
                <div style={{ position: "absolute", right: 0, top: -52, color: C.accentBright, fontFamily: theme.mono, fontWeight: 900, fontSize: 36 }}>
                  moyenne {avg.toFixed(frame >= tAvg && frame < tAvg + 40 ? 1 : 0).replace(".", ",")} $
                </div>
              </div>
            )}
            {WAGES.map((w, i) => {
              const low = LOW.includes(i);
              const leave = low ? interpolate(frame, [tLose + LOW.indexOf(i) * 5, tLose + 40 + LOW.indexOf(i) * 5], [0, 1], { ...clamp, easing: theme.ease.in }) : 0;
              const hi = low && frame >= tThree && frame < tLose;
              return (
                <div key={i} style={{ position: "absolute", left: i * 130, bottom: 50, width: 120, display: "flex", flexDirection: "column", alignItems: "center", opacity: 1 - leave * 0.9, transform: `translateY(${leave * 120}px)` }}>
                  <Pop at={tTen + i * 3}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                      <div style={{ color: hi ? C.negative : C.textSecondary, fontFamily: theme.mono, fontWeight: 800, fontSize: 24 }}>{w} $</div>
                      <div style={{ width: 70, height: w * 9 - 120, borderRadius: 8, background: hi ? C.negative : low ? C.context : C.positive, opacity: 0.8 }} />
                      <Person size={90} phase={i} color={low ? C.context : C.positive} run={leave > 0 && leave < 1} />
                      {frame >= tNobody && !low && (
                        <div style={{ position: "absolute", bottom: -40 }}>
                          <CheckDraw at={tNobody + i * 2} size={34} />
                        </div>
                      )}
                    </div>
                  </Pop>
                </div>
              );
            })}
          </div>
          {frame >= tNobody && (
            <div style={{ position: "absolute", left: 0, right: 0, top: 600, display: "flex", justifyContent: "center" }}>
              <Pop at={tNobody}>
                <Big size={34} color={C.accentBright}>La moyenne monte… personne n&apos;a été augmenté</Big>
              </Pop>
            </div>
          )}
        </div>
      </Beat>

      {/* D: nominal vs real */}
      <Beat from={tSecond} to={tValid} style={{ left: 0, top: 0 }}>
        <div style={{ width: STAGE_W, height: 640, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 34 }}>
          <Pop at={tSecond}>
            <Pill text="piège 2 · salaire ≠ pouvoir d'achat" color={C.negative} size={26} filled />
          </Pop>
          <div style={{ display: "flex", flexDirection: "column", gap: 26, width: 1300 }}>
            <HBar label="salaire" pct={4} color={C.positive} at={tSecond + 20} />
            <HBar label="prix" pct={3} color={C.negative} at={tPrix + 20} />
            {frame >= tUn && <HBar label="pouvoir d'achat" pct={1} color={C.accentBright} at={tUn} />}
          </div>
          {frame >= tPas4 && (
            <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
              <div style={{ position: "relative" }}>
                <Big size={60} color={C.textMuted}>+4 %</Big>
                <div style={{ position: "absolute", left: -20, top: -10 }}>
                  <CrossDraw at={tPas4} size={100} />
                </div>
              </div>
              <Big size={44} color={C.accentBright}>≈ +1 % de pouvoir d&apos;achat</Big>
            </div>
          )}
        </div>
      </Beat>

      {/* E: validate */}
      <Beat from={tValid} style={{ left: 0, top: 0 }}>
        <div style={{ width: STAGE_W, height: 640, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 40 }}>
          <Big size={46}>Pour valider le signal</Big>
          <div style={{ display: "grid", gridTemplateColumns: "560px 560px", gap: 24 }}>
            {[
              { t: "Les heures travaillées", at: tH },
              { t: "Le mélange des secteurs", at: tMix },
              { t: "Les révisions", at: tRev },
              { t: "Des mesures plus larges de la rémunération", at: tLarge },
            ].map((it) => (
              <Pop key={it.t} at={it.at}>
                <Panel glow={frame >= it.at} style={{ display: "flex", alignItems: "center", gap: 18, padding: "22px 26px", minHeight: 110 }}>
                  <CheckDraw at={it.at + 6} size={46} />
                  <Big size={28}>
                    <span style={{ textAlign: "left", display: "block" }}>{it.t}</span>
                  </Big>
                </Panel>
              </Pop>
            ))}
          </div>
        </div>
      </Beat>
    </SceneShell>
  );
};
