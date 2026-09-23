import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { theme } from "../theme";
import { Sfx, makeCue, Panel, CoinStackIcon } from "./shared";
import type { SceneProps } from "./shared";
import { Beat, Pop, Person, ClockIcon, DollarIcon, clamp } from "./characters";
import { SceneShell, Big, Label, STAGE_W } from "./stage";
import { Factory, Store, Truck, Speedometer, PriceTag } from "./props";
import { Pill, Briefcase, Clipboard, HouseGlyph } from "./props5";

const C = theme.colors;

const Arrow: React.FC<{ at: number; color?: string }> = ({ at, color = C.accent }) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [at, at + 12], [0, 1], { ...clamp, easing: theme.ease.out });
  return (
    <svg width="70" height="40" style={{ opacity: p }}>
      <path d={`M4 20 H${4 + 54 * p} M${48 * p + 2} 10 L${60 * p + 2} 20 L${48 * p + 2} 30`} stroke={color} strokeWidth="4" fill="none" strokeLinecap="round" />
    </svg>
  );
};

const Step: React.FC<{ at: number; text: string; color?: string; icon?: React.ReactNode; glow?: boolean }> = ({ at, text, color = C.textPrimary, icon, glow }) => (
  <Pop at={at}>
    <Panel glow={glow} style={{ padding: "14px 22px", display: "flex", alignItems: "center", gap: 14, minHeight: 90 }}>
      {icon}
      <div style={{ color, fontSize: 31, fontWeight: 800, whiteSpace: "nowrap" }}>{text}</div>
    </Panel>
  </Pop>
);

export const Growth: React.FC<SceneProps> = ({ words, durationInFrames }) => {
  const frame = useCurrentFrame();
  const cue = makeCue(words);
  const tRef = cue("la mesure de reference");
  const tPib = cue("c est le pib reel");
  const tVA = cue("la valeur ajoutee");
  const tCorr = cue("corrigee de l inflation");
  const tLate = cue("il sort tard");
  const tWait = cue("en attendant");
  const tEmp = cue("l emploi", tWait);
  const tProd = cue("la production");
  const tRev = cue("les revenus");
  const tDep = cue("les depenses");
  const tEnq = cue("les enquetes");
  const tPart = cue("signaux partiels");
  const tMorceau = cue("chacun couvre");
  const tCal = cue("son propre calendrier");
  const tGold = cue("et pour l or");
  const tStrong = cue("une croissance forte");
  const tPrix = cue("sur les prix");
  const tTaux = cue("garder les taux");
  const tWeak = cue("une croissance faible");
  const tBaisse = cue("rapprocher les baisses");
  const tAtt = cue("mais attention");
  const tBrut = cue("une contraction brutale");
  const tLiq = cue("crise de liquidite");
  const tRuee = cue("ruee vers le dollar");

  const coins = Math.floor(interpolate(frame, [tVA, tLate], [0, 5], clamp));
  const SIGNALS = [
    { t: "emploi", at: tEmp, icon: <Briefcase size={50} />, day: 1 },
    { t: "production", at: tProd, icon: <Factory size={60} />, day: 3 },
    { t: "revenus", at: tRev, icon: <DollarIcon size={52} />, day: 4 },
    { t: "dépenses", at: tDep, icon: <Store size={60} />, day: 2 },
    { t: "enquêtes", at: tEnq, icon: <Clipboard size={56} />, day: 0 },
  ];

  return (
    <SceneShell eyebrow="F5 · Croissance" title="Le PIB réel… et les signaux qui arrivent avant" durationInFrames={durationInFrames}>
      <Sfx file="pop.wav" at={tPib} volume={0.45} />
      <Sfx file="tick.wav" at={tCorr} volume={0.4} />
      <Sfx file="bass.wav" at={tLate} volume={0.4} />
      {SIGNALS.map((s) => (
        <Sfx key={s.t} file="pop.wav" at={s.at} volume={0.35} />
      ))}
      <Sfx file="chime.wav" at={tCal} volume={0.4} />
      <Sfx file="whoosh.wav" at={tGold} volume={0.45} />
      <Sfx file="tick.wav" at={tTaux} volume={0.4} />
      <Sfx file="tick.wav" at={tBaisse} volume={0.4} />
      <Sfx file="bass.wav" at={tBrut} volume={0.5} />
      <Sfx file="whoosh.wav" at={tRuee} volume={0.45} />

      <Beat from={0} to={tGold} style={{ left: 0, top: 0 }}>
        <div style={{ position: "relative", width: STAGE_W, height: 690 }}>
          {/* GDP machine */}
          <div style={{ position: "absolute", left: 20, top: 0, width: 780 }}>
            <Pop at={tRef}>
              <Panel glow={frame >= tPib && frame < tWait} style={{ padding: 26 }}>
                <div style={{ display: "flex", alignItems: "flex-end", gap: 14, justifyContent: "center" }}>
                  <Factory size={130} />
                  <Truck size={130} />
                  <Store size={130} />
                  <HouseGlyph size={110} lit />
                  <div style={{ display: "flex", flexDirection: "column-reverse", marginLeft: 10 }}>
                    {Array.from({ length: coins }).map((_, i) => (
                      <Pop key={i} at={tVA + i * 12}>
                        <div style={{ marginTop: -26 }}>
                          <CoinStackIcon size={60} />
                        </div>
                      </Pop>
                    ))}
                  </div>
                </div>
                <div style={{ textAlign: "center", marginTop: 14 }}>
                  <Big size={40} color={C.accentBright}>PIB réel</Big>
                  {frame >= tVA && <Label size={23}>la valeur ajoutée de toute l&apos;économie</Label>}
                  {frame >= tCorr && (
                    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 12, marginTop: 10 }}>
                      <Pop at={tCorr}>
                        <PriceTag text="− inflation" color={C.context} rotate={-4} />
                      </Pop>
                    </div>
                  )}
                </div>
              </Panel>
            </Pop>
            {frame >= tLate && (
              <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 20, justifyContent: "center" }}>
                <Pop at={tLate}>
                  <ClockIcon size={70} color={C.negative} />
                </Pop>
                <Pop at={tLate + 4}>
                  <Big size={32} color={C.negative}>… mais il sort tard</Big>
                </Pop>
              </div>
            )}
          </div>
          {/* partial, earlier signals on their own calendars */}
          <div style={{ position: "absolute", left: 860, top: 0, width: 860 }}>
            {frame >= tWait && (
              <Pop at={tWait}>
                <Label size={24} color={C.textPrimary}>en attendant : des signaux partiels, plus tôt</Label>
              </Pop>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 14 }}>
              {SIGNALS.map((s) => {
                const dayX = interpolate(frame, [tCal, tCal + 20], [0, 1], { ...clamp, easing: theme.ease.out });
                return (
                  <Pop key={s.t} at={s.at}>
                    <div style={{ display: "flex", alignItems: "center", gap: 16, height: 86 }}>
                      <div style={{ width: 70, display: "flex", justifyContent: "center" }}>{s.icon}</div>
                      <div style={{ width: 180, color: C.textPrimary, fontSize: 26, fontWeight: 800 }}>{s.t}</div>
                      <div style={{ position: "relative", flex: 1, height: 12, borderRadius: 6, background: C.hairlineSoft, border: `1px solid ${C.hairline}` }}>
                        {frame >= tMorceau && (
                          <div style={{ position: "absolute", left: `${(s.day / 5) * 100}%`, top: -4, width: "18%", height: 20, borderRadius: 10, background: `${C.context}88` }} />
                        )}
                        {frame >= tCal && (
                          <div style={{ position: "absolute", left: `${(s.day / 5) * 100 * dayX + 8}%`, top: -12, width: 36, height: 36, borderRadius: "50%", background: C.accentBright, boxShadow: `0 0 18px ${C.glow}` }} />
                        )}
                      </div>
                    </div>
                  </Pop>
                );
              })}
            </div>
            {frame >= tCal && (
              <div style={{ marginTop: 6, marginLeft: 270 }}>
                <Pop at={tCal}>
                  <Label size={22}>chacun son morceau, chacun son calendrier</Label>
                </Pop>
              </div>
            )}
          </div>
        </div>
      </Beat>

      <Beat from={tGold} style={{ left: 0, top: 0 }}>
        <div style={{ width: STAGE_W, height: 650, display: "flex", flexDirection: "column", justifyContent: "center", gap: 34, paddingLeft: 30 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Step at={tStrong} text="Croissance forte" color={C.positive} icon={<Speedometer value={0.85} size={90} />} glow={frame >= tStrong && frame < tWeak} />
            <Arrow at={tPrix - 6} />
            <Step at={tPrix} text="pression sur les prix" icon={<PriceTag text="↑" color={C.negative} rotate={0} />} />
            <Arrow at={tTaux - 6} />
            <Step at={tTaux} text="taux plus hauts, plus longtemps" color={C.negative} />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Step at={tWeak} text="Croissance faible" color={C.context} icon={<Speedometer value={0.2} size={90} />} glow={frame >= tWeak && frame < tAtt} />
            <Arrow at={tBaisse - 6} />
            <Step at={tBaisse} text="baisses de taux plus proches" color={C.positive} />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Step at={tBrut} text="Contraction brutale" color={C.negative} icon={<Speedometer value={0.02} size={90} />} glow={frame >= tBrut} />
            <Arrow at={tLiq - 6} color={C.negative} />
            <Step at={tLiq} text="crise de liquidité" color={C.negative} />
            <Arrow at={tRuee - 6} color={C.negative} />
            <Pop at={tRuee}>
              <div style={{ position: "relative", width: 520, height: 120 }}>
                {[0, 1, 2].map((i) => {
                  const x = interpolate(frame, [tRuee + i * 5, tRuee + 50 + i * 5], [0, 250 - i * 70], { ...clamp, easing: theme.ease.out });
                  return (
                    <div key={i} style={{ position: "absolute", left: x, top: 0 }}>
                      <Person size={100} phase={i} color={C.textSecondary} run={frame < tRuee + 55} />
                    </div>
                  );
                })}
                <div style={{ position: "absolute", left: 360, top: 10 }}>
                  <DollarIcon size={100} />
                </div>
              </div>
            </Pop>
          </div>
          {frame >= tRuee + 20 && (
            <div style={{ display: "flex", justifyContent: "center" }}>
              <Pop at={tRuee + 20}>
                <Pill text="ruée vers le dollar" color={C.positive} size={28} filled />
              </Pop>
            </div>
          )}
        </div>
      </Beat>
    </SceneShell>
  );
};
