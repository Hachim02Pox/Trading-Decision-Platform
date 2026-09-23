import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { theme } from "../theme";
import { Sfx, makeCue, Panel, TerminalGlyph } from "./shared";
import type { SceneProps } from "./shared";
import { Beat, Pop, Person, Bubble, DocIcon, clamp } from "./characters";
import { SceneShell, Big, Label, STAGE_W } from "./stage";
import { ModelMachine, Pill, CrossDraw, Stamp } from "./props5";

const C = theme.colors;

/** A data pill that flies into the machine intake between a and a+30. */
const Feed: React.FC<{ a: number; text: string; y0: number; x1: number; y1: number }> = ({ a, text, y0, x1, y1 }) => {
  const frame = useCurrentFrame();
  if (frame < a) return null;
  const t = interpolate(frame, [a, a + 30], [0, 1], { ...clamp, easing: theme.ease.inOut });
  const o = interpolate(frame, [a + 24, a + 32], [1, 0], clamp);
  return (
    <div style={{ position: "absolute", left: 0 + (x1 - 0) * t, top: y0 + (y1 - y0) * t, opacity: o, transform: `scale(${1 - t * 0.4})` }}>
      <Pill text={text} color={C.context} size={22} />
    </div>
  );
};

export const GdpNow: React.FC<SceneProps> = ({ words, durationInFrames }) => {
  const frame = useCurrentFrame();
  const cue = makeCue(words);
  const tEst = cue("l estimation en temps reel");
  const tAtl = cue("d atlanta");
  const tModel = cue("c est un modele");
  const tPub = cue("il prend les publications");
  const tFil = cue("fil du trimestre");
  const tTrad = cue("et les traduit");
  const tAvis = cue("ce n est pas l avis");
  const tOff = cue("ce n est pas le chiffre officiel");
  const tProm = cue("ce n est pas une promesse");
  const tCom = cue("sur le commerce");
  const tStk = cue("les stocks");
  const tCons = cue("la consommation");
  const tSaut = cue("sauter d un coup");
  const tDet = cue("autre detail");
  const t25 = cue("une lecture de");
  const tAnn = cue("rythme annualise");
  const t06 = cue("ca correspond");
  const tYear = cue("durait une annee");
  const tNotYoY = cue("et ce n est pas un chiffre");
  const tTerm = cue("dans le terminal");
  const tMark = cue("marquee comme estimee");

  // machine display over time: quarter fills with inputs, then jumps on trade / inventories / consumption
  let display = "…";
  if (frame >= tTrad) display = "1,9 %";
  if (frame >= tPub + 60) display = "2,1 %";
  if (frame >= tCom + 26) display = "2,8 %";
  if (frame >= tStk + 26) display = "2,2 %";
  if (frame >= tCons + 26) display = "2,5 %";
  const qCursor = interpolate(frame, [tPub, tTrad + 30], [0, 0.8], { ...clamp, easing: theme.ease.inOut });

  return (
    <SceneShell eyebrow="F5 · Estimation en temps réel" title="Un modèle qui bouge, pas le PIB officiel" durationInFrames={durationInFrames}>
      <Sfx file="pop.wav" at={tEst} volume={0.4} />
      <Sfx file="whoosh.wav" at={tPub} volume={0.4} />
      <Sfx file="tick.wav" at={tTrad} volume={0.4} />
      <Sfx file="bass.wav" at={tAvis} volume={0.35} />
      <Sfx file="bass.wav" at={tOff} volume={0.35} />
      <Sfx file="bass.wav" at={tProm} volume={0.35} />
      <Sfx file="pop.wav" at={tCom + 26} volume={0.45} />
      <Sfx file="pop.wav" at={tStk + 26} volume={0.45} />
      <Sfx file="pop.wav" at={tCons + 26} volume={0.45} />
      <Sfx file="whoosh.wav" at={tDet} volume={0.4} />
      <Sfx file="chime.wav" at={t06} volume={0.45} />
      <Sfx file="bass.wav" at={tNotYoY} volume={0.4} />
      <Sfx file="chime.wav" at={tMark} volume={0.5} />

      {/* A + B: the model, what it is not, and its jumps */}
      <Beat from={0} to={tDet} style={{ left: 0, top: 0 }}>
        <div style={{ position: "relative", width: STAGE_W, height: 690 }}>
          <div style={{ position: "absolute", left: 30, top: 0, display: "flex", gap: 14, alignItems: "center" }}>
            <Pop at={tEst}>
              <Pill text="GDPNow" size={26} filled />
            </Pop>
            <Pop at={tAtl}>
              <Pill text="Fed d'Atlanta" color={C.context} size={24} />
            </Pop>
            <Pop at={tModel}>
              <Pill text="modèle de prévision immédiate" color={C.accentBright} size={24} />
            </Pop>
          </div>
          {/* machine + intake */}
          <div style={{ position: "absolute", left: 1000, top: 90 }}>
            <Pop at={tEst + 6}>
              <ModelMachine size={420} display={display} busy={frame >= tPub} />
            </Pop>
          </div>
          <div style={{ position: "absolute", left: 480, top: 120, width: 560, height: 360 }}>
            {[0, 1, 2, 3].map((i) => (
              <Feed key={i} a={tPub + i * 14} text={["ventes", "production", "emplois", "revenus"][i]} y0={i * 70} x1={560} y1={180} />
            ))}
            <Feed a={tCom} text="commerce" y0={0} x1={560} y1={180} />
            <Feed a={tStk} text="stocks" y0={120} x1={560} y1={180} />
            <Feed a={tCons} text="consommation" y0={240} x1={560} y1={180} />
          </div>
          {/* quarter timeline */}
          <div style={{ position: "absolute", left: 1000, top: 500, width: 420 }}>
            {frame >= tFil && (
              <Pop at={tFil}>
                <div>
                  <div style={{ position: "relative", height: 26, borderRadius: 13, background: C.panel, border: `1px solid ${C.hairline}`, display: "flex" }}>
                    {["mois 1", "mois 2", "mois 3"].map((m, i) => (
                      <div key={m} style={{ flex: 1, borderRight: i < 2 ? `1px solid ${C.hairline}` : "none", color: C.textMuted, fontSize: 14, textAlign: "center", lineHeight: "26px" }}>
                        {m}
                      </div>
                    ))}
                    <div style={{ position: "absolute", left: `${qCursor * 100}%`, top: -8, width: 6, height: 42, borderRadius: 3, background: C.accentBright, boxShadow: `0 0 14px ${C.glow}` }} />
                  </div>
                  {frame >= tTrad && <Label size={21}>→ PIB réel du trimestre en cours</Label>}
                </div>
              </Pop>
            )}
          </div>
          {/* what it is NOT */}
          <div style={{ position: "absolute", left: 30, top: 100, display: "flex", flexDirection: "column", gap: 18, width: 440 }}>
            {[
              { t: "l'avis d'un économiste", at: tAvis, icon: <Person size={70} color={C.textSecondary} /> },
              { t: "le chiffre officiel", at: tOff, icon: <DocIcon size={62} /> },
              { t: "une promesse", at: tProm, icon: <Bubble text="promis !" width={110} tone={C.textSecondary} /> },
            ].map((x) => (
              <Pop key={x.t} at={x.at}>
                <Panel style={{ display: "flex", alignItems: "center", gap: 16, padding: "14px 20px", height: 110 }}>
                  <div style={{ width: 110, display: "flex", justifyContent: "center", transform: x.t === "une promesse" ? "scale(0.8)" : undefined }}>{x.icon}</div>
                  <Big size={26}>
                    <span style={{ textAlign: "left", display: "block" }}>{x.t}</span>
                  </Big>
                  <div style={{ marginLeft: "auto" }}>
                    <CrossDraw at={x.at + 12} size={54} />
                  </div>
                </Panel>
              </Pop>
            ))}
          </div>
          {frame >= tSaut && (
            <div style={{ position: "absolute", left: 1480, top: 130 }}>
              <Stamp at={tSaut} text="ÇA SAUTE" color={C.accentBright} size={34} rotate={8} />
            </div>
          )}
        </div>
      </Beat>

      {/* C: annualized, not quarterly, not YoY */}
      <Beat from={tDet} style={{ left: 0, top: 0 }}>
        <div style={{ width: STAGE_W, display: "flex", flexDirection: "column", alignItems: "center", gap: 30 }}>
          <Pop at={t25}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 24 }}>
              <Big size={96} color={C.accentBright} glow>
                2,5 %
              </Big>
              {frame >= tAnn && (
                <Pop at={tAnn}>
                  <Pill text="rythme annualisé" size={30} filled />
                </Pop>
              )}
            </div>
          </Pop>
          {frame >= t06 && (
            <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
              {[0, 1, 2, 3].map((i) => {
                const on = i === 0 || frame >= t06 + 30 + i * 8;
                return (
                  <Pop key={i} at={i === 0 ? t06 : t06 + 30 + i * 8}>
                    <div style={{ width: 230, height: 120, borderRadius: 16, border: `3px ${i === 0 ? "solid" : "dashed"} ${i === 0 ? C.accent : C.hairline}`, background: i === 0 ? `${C.accent}22` : "transparent", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", opacity: on ? 1 : 0 }}>
                      <div style={{ color: i === 0 ? C.accentBright : C.textMuted, fontFamily: theme.mono, fontSize: 36, fontWeight: 900 }}>≈ 0,6 %</div>
                      <div style={{ color: C.textSecondary, fontSize: 18 }}>{i === 0 ? "ce trimestre" : "même rythme…"}</div>
                    </div>
                  </Pop>
                );
              })}
              {frame >= tYear && (
                <Pop at={tYear}>
                  <Big size={40} color={C.accentBright}>= une année entière à ce rythme</Big>
                </Pop>
              )}
            </div>
          )}
          <div style={{ display: "flex", gap: 130, alignItems: "center", marginTop: 10 }}>
            {frame >= tNotYoY && (
              <Pop at={tNotYoY}>
                <div style={{ position: "relative" }}>
                  <Panel style={{ padding: "18px 30px" }}>
                    <Big size={32} color={C.textMuted}>un chiffre sur un an</Big>
                  </Panel>
                  <div style={{ position: "absolute", right: -90, top: -6 }}>
                    <CrossDraw at={tNotYoY + 8} size={90} />
                  </div>
                </div>
              </Pop>
            )}
            {frame >= tTerm && (
              <Pop at={tTerm}>
                <Panel glow style={{ padding: "18px 30px", display: "flex", alignItems: "center", gap: 16 }}>
                  <TerminalGlyph size={44} />
                  <span style={{ color: C.textSecondary, fontSize: 26 }}>GDPNow</span>
                  <span style={{ color: C.textPrimary, fontFamily: theme.mono, fontSize: 36, fontWeight: 900 }}>
                    <span style={{ color: C.accentBright }}>~</span>2,5 %
                  </span>
                  {frame >= tMark && <Pill text="estimée" size={22} />}
                </Panel>
              </Pop>
            )}
          </div>
        </div>
      </Beat>
    </SceneShell>
  );
};
