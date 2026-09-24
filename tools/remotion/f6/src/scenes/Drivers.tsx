import React from "react";
import { interpolate, useCurrentFrame, useVideoConfig, spring } from "remotion";
import { theme } from "../theme";
import { Sfx, makeCue, Panel, BankIcon } from "./shared";
import type { SceneProps } from "./shared";
import { Beat, Pop, Person, clamp } from "./characters";
import { SceneShell, Big, Label, STAGE_W } from "./stage";
import { Pill, Stamp } from "./props5";
import { Coin } from "./props6";

const C = theme.colors;

const RateBar: React.FC<{ label: string; from: number; to: number; at: number; color: string; flagAt?: number; icon: React.ReactNode }> = ({ label, from, to, at, color, icon }) => {
  const frame = useCurrentFrame();
  const v = interpolate(frame, [at, at + 36], [from, to], { ...clamp, easing: theme.ease.inOut });
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, width: 200 }}>
      <div style={{ color: C.textPrimary, fontFamily: theme.mono, fontWeight: 900, fontSize: 28 }}>{v.toFixed(2).replace(".", ",")} %</div>
      <div style={{ width: 90, height: v * 60, borderRadius: 10, background: `linear-gradient(180deg, ${color}, ${color}55)` }} />
      {icon}
      <Label size={22} color={C.textPrimary}>{label}</Label>
    </div>
  );
};

export const Drivers: React.FC<SceneProps> = ({ words, durationInFrames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const cue = makeCue(words);
  const tQ = cue("qu est ce qui fait");
  const tRel = cue("politique monetaire relative");
  const tAbs = cue("pas absolue");
  const tSi = cue("si les taux courts");
  const tAttr = cue("les placements en dollars");
  const tF3 = cue("c est pour ca que le pari");
  const tBce = cue("mais attention si la banque");
  const tFin = cue("ensuite le dollar");
  const tStress = cue("en periode de stress");
  const tRefuge = cue("et les investisseurs se refugient");
  const tFlux = cue("enfin il y a les flux");
  const FLOWS = [
    { t: "recettes du commerce", at: cue("les recettes du commerce") },
    { t: "couvertures d'entreprises", at: cue("les couvertures") },
    { t: "opérations de réserves", at: cue("les operations de reserves") },
    { t: "rééquilibrages de fin de mois", at: cue("les reequilibrages") },
    { t: "positions qui se débouclent", at: cue("les positions trop chargees") },
  ];
  const tDom = cue("ces flux peuvent dominer");
  const t1 = cue("donc une meme hausse");
  const tReels = cue("des taux reels");
  const tPeur = cue("de la peur");
  const tPos = cue("d une position qui");

  const usRate = frame < tBce ? 5.3 : 5.3;
  const euTo = frame >= tBce ? 4.2 : 3.4;
  const moneyP = spring({ frame: frame - tAttr, fps, config: theme.spring.smooth });

  return (
    <SceneShell eyebrow="F6 · Ce qui fait bouger le dollar" title="Des taux relatifs, du financement, des flux" durationInFrames={durationInFrames}>
      <Sfx file="pop.wav" at={tRel} volume={0.4} />
      <Sfx file="whoosh.wav" at={tAttr} volume={0.4} />
      <Sfx file="bass.wav" at={tBce} volume={0.45} />
      <Sfx file="whoosh.wav" at={tStress} volume={0.4} />
      {FLOWS.map((f) => (
        <Sfx key={f.t} file="tick.wav" at={f.at} volume={0.35} />
      ))}
      <Sfx file="bass.wav" at={t1} volume={0.45} />

      {/* A: relative policy */}
      <Beat from={0} to={tFin} style={{ left: 0, top: 0 }}>
        <div style={{ position: "relative", width: STAGE_W, height: 690 }}>
          <div style={{ position: "absolute", left: 40, top: 0, display: "flex", gap: 14 }}>
            <Pop at={tRel}>
              <Pill text="politique monétaire RELATIVE" size={28} filled />
            </Pop>
            {frame >= tAbs && (
              <Pop at={tAbs}>
                <Pill text="pas absolue" color={C.negative} size={28} />
              </Pop>
            )}
          </div>
          <div style={{ position: "absolute", left: 80, top: 110, display: "flex", alignItems: "flex-end", gap: 60, height: 480 }}>
            <Pop at={tSi}>
              <RateBar label="États-Unis" from={4.8} to={usRate} at={tSi} color={C.positive} icon={<BankIcon size={70} color={C.positive} />} />
            </Pop>
            <Pop at={tSi + 10}>
              <RateBar label="zone euro" from={3.4} to={euTo} at={frame >= tBce ? tBce : tSi} color={C.context} icon={<BankIcon size={70} color={C.context} />} />
            </Pop>
            <Pop at={tSi + 16}>
              <RateBar label="Japon" from={0.5} to={0.5} at={tSi} color={C.negative} icon={<BankIcon size={70} color={C.negative} />} />
            </Pop>
          </div>
          {frame >= tAttr && (
            <div style={{ position: "absolute", left: 820, top: 150 }}>
              {[0, 1, 2, 3, 4].map((i) => {
                const x = interpolate(moneyP, [0, 1], [300, -40 + i * 12]);
                return (
                  <div key={i} style={{ position: "absolute", left: x + i * 60, top: i * 20, opacity: Math.min(1, moneyP * 1.4) }}>
                    <Coin sym="$" size={70} color={C.positive} />
                  </div>
                );
              })}
              <div style={{ position: "absolute", left: 0, top: 150, width: 800 }}>
                <Label size={26} color={C.textPrimary}>les placements en dollars deviennent plus attractifs</Label>
              </div>
            </div>
          )}
          {frame >= tF3 && (
            <div style={{ position: "absolute", left: 830, top: 360, display: "flex", gap: 16 }}>
              <Pop at={tF3}>
                <Pill text="F3 · le pari sur la Fed" size={26} />
              </Pop>
              <Pop at={tF3 + 20}>
                <Pill text="F2 · les taux" size={26} />
              </Pop>
            </div>
          )}
          {frame >= tBce && (
            <div style={{ position: "absolute", left: 830, top: 450, width: 860 }}>
              <Pop at={tBce}>
                <Panel style={{ padding: "16px 24px", borderColor: C.negative }}>
                  <Label size={25} color={C.textPrimary}>si l&apos;Europe change de cap en même temps, le même mouvement américain donne une autre réaction</Label>
                </Panel>
              </Pop>
            </div>
          )}
        </div>
      </Beat>

      {/* B: funding & reserve currency, then pure flows */}
      <Beat from={tFin} to={t1} style={{ left: 0, top: 0 }}>
        <div style={{ position: "relative", width: STAGE_W, height: 690 }}>
          <div style={{ position: "absolute", left: 20, top: 0, width: 820 }}>
            <Pop at={tFin}>
              <Panel glow={frame < tFlux} style={{ padding: 26 }}>
                <Big size={32} color={C.accentBright}>Monnaie de financement et de réserve</Big>
                <div style={{ position: "relative", height: 220, marginTop: 10 }}>
                  {[0, 1, 2, 3].map((i) => {
                    const x = interpolate(frame, [tStress + i * 6, tStress + 50 + i * 6], [0, 360 - i * 70], { ...clamp, easing: theme.ease.out });
                    return frame >= tStress ? (
                      <div key={i} style={{ position: "absolute", left: x, top: 30 }}>
                        <Person size={110} phase={i} color={C.textSecondary} run={frame < tStress + 55} />
                      </div>
                    ) : null;
                  })}
                  <div style={{ position: "absolute", left: 560, top: 20 }}>
                    <Coin sym="$" size={140} color={C.positive} />
                  </div>
                </div>
                {frame >= tStress && <Label size={23} color={C.textPrimary}>en stress : il faut des dollars pour rembourser</Label>}
                {frame >= tRefuge && <Label size={23} color={C.textPrimary}>et refuge vers les actifs américains les plus liquides</Label>}
              </Panel>
            </Pop>
          </div>
          <div style={{ position: "absolute", left: 890, top: 0, width: 830 }}>
            {frame >= tFlux && (
              <Pop at={tFlux}>
                <Big size={34}>Les flux purs</Big>
              </Pop>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 20 }}>
              {FLOWS.map((f) => (
                <Pop key={f.t} at={f.at}>
                  <Pill text={f.t} color={C.context} size={26} />
                </Pop>
              ))}
            </div>
            {frame >= tDom && (
              <div style={{ marginTop: 20 }}>
                <Pop at={tDom}>
                  <Label size={24} color={C.accentBright}>ils peuvent dominer l&apos;histoire des taux… un temps</Label>
                </Pop>
              </div>
            )}
          </div>
        </div>
      </Beat>

      {/* C: same +1 %, three meanings */}
      <Beat from={t1} style={{ left: 0, top: 0 }}>
        <div style={{ width: STAGE_W, height: 650, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 40 }}>
          <Pop at={t1}>
            <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
              <Coin sym="$" size={110} color={C.positive} />
              <Big size={70} color={C.accentBright}>+1 %</Big>
            </div>
          </Pop>
          <div style={{ display: "flex", gap: 30 }}>
            {[
              { t: "vient des taux réels", at: tReels },
              { t: "vient de la peur", at: tPeur },
              { t: "vient d'une position qui se retourne", at: tPos },
            ].map((x) => (
              <Pop key={x.t} at={x.at}>
                <Panel glow style={{ padding: "20px 28px", width: 420, textAlign: "center" }}>
                  <Big size={28}>{x.t}</Big>
                </Panel>
              </Pop>
            ))}
          </div>
          {frame >= tPos + 30 && <Stamp at={tPos + 30} text="PAS LE MÊME SENS" color={C.accentBright} size={36} />}
        </div>
      </Beat>
    </SceneShell>
  );
};
