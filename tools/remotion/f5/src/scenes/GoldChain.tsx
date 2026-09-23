import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { theme } from "../theme";
import { Sfx, makeCue, Panel, GoldBarIcon, useBreathe } from "./shared";
import type { SceneProps } from "./shared";
import { Beat, Pop, Person, Domino, DollarIcon, ArrowGlyph, DocIcon, clamp } from "./characters";
import { SceneShell, Big, Label, STAGE_W } from "./stage";
import { Factory, Truck, PriceTag } from "./props";
import { Stamp, CrossDraw, ReportDoc, Pill } from "./props5";

const C = theme.colors;

export const GoldChain: React.FC<SceneProps> = ({ words, durationInFrames }) => {
  const frame = useCurrentFrame();
  const cue = makeCue(words);
  const tHow = cue("alors comment");
  const tDirect = cue("presque jamais");
  const tChain = cue("le chemin classique");
  const tWeak = cue("un rapport plus faible");
  const tF3 = cue("dans f3");
  const tF2a = cue("les taux a deux ans");
  const tF2 = cue("dans f2");
  const tF6a = cue("le dollar s affaiblit");
  const tGold = cue("et l or est soutenu");
  const tStrong = cue("un rapport plus fort");
  const tInv = cue("inverser toute");
  const tLaw = cue("pas une loi");
  const tStress = cue("en plein stress");
  const tSell = cue("forcer des investisseurs");
  const tOr = cue("y compris de l or");
  const tOffre = cue("freinee par l offre");
  const tGood = cue("et une bonne croissance");
  const tReal = cue("si les taux reels baissent");
  const tCtx = cue("f5 reste contextuel");
  const tFix = cue("aucune direction");
  const breathe = useBreathe(0.1);
  const flip = frame >= tStrong;

  const DOMINOS = [
    { l: flip ? "Rapport plus fort que prévu" : "Rapport plus faible que prévu", at: tWeak, icon: <DocIcon size={90} color={C.accentBright} />, tone: C.accent },
    { l: flip ? "F3 · moins de baisses de taux" : "F3 · pari sur des baisses ↑", at: tF3 - 10, icon: <Big size={44} color={flip ? C.negative : C.positive}>F3</Big>, tone: flip ? C.negative : C.positive },
    { l: flip ? "F2 · taux 2 ans et réels ↑" : "F2 · taux 2 ans et réels ↓", at: tF2 - 10, icon: <Big size={44} color={flip ? C.negative : C.positive}>F2</Big>, tone: flip ? C.negative : C.positive },
    { l: flip ? "F6 · dollar ↑" : "F6 · dollar ↓", at: tF6a + 10, icon: <DollarIcon size={80} color={flip ? C.negative : C.positive} />, tone: flip ? C.negative : C.positive },
    { l: flip ? "Or sous pression" : "Or soutenu", at: tGold, icon: <GoldBarIcon size={96} color={flip ? C.negative : C.accentBright} />, tone: flip ? C.negative : C.accentBright },
  ];
  // after the reversal, the row is re-knocked with the new labels
  const reAt = (i: number) => (flip ? tInv + i * 8 : DOMINOS[i].at);

  return (
    <SceneShell eyebrow="F5 · Transmission vers l'or" title="Un chemin indirect… et pas une loi" durationInFrames={durationInFrames}>
      <Sfx file="bass.wav" at={tDirect} volume={0.4} />
      {DOMINOS.map((d, i) => (
        <Sfx key={i} file="tick.wav" at={d.at} volume={0.45} />
      ))}
      <Sfx file="chime.wav" at={tGold} volume={0.5} />
      <Sfx file="whoosh.wav" at={tInv} volume={0.45} />
      {[0, 1, 2, 3, 4].map((i) => (
        <Sfx key={`r${i}`} file="tick.wav" at={tInv + i * 8} volume={0.35} />
      ))}
      <Sfx file="bass.wav" at={tLaw} volume={0.55} />
      <Sfx file="whoosh.wav" at={tStress} volume={0.4} />
      <Sfx file="pop.wav" at={tOffre} volume={0.4} />
      <Sfx file="pop.wav" at={tGood} volume={0.4} />
      <Sfx file="chime.wav" at={tCtx} volume={0.55} />

      {/* A: indirect chain */}
      <Beat from={tHow - 4} to={tLaw} style={{ left: 0, top: 0 }}>
        <div style={{ position: "relative", width: STAGE_W, height: 690 }}>
          {frame < tChain + 10 && (
            <div style={{ position: "absolute", left: 0, right: 0, top: 120, display: "flex", justifyContent: "center", alignItems: "center", gap: 40 }}>
              <Pop at={tHow}>
                <ReportDoc title="Emploi" width={220} />
              </Pop>
              <div style={{ position: "relative", width: 360 }}>
                <svg width="360" height="60">
                  <path d="M10 30 H330 M312 14 L336 30 L312 46" stroke={C.textMuted} strokeWidth="5" strokeDasharray="14 10" fill="none" />
                </svg>
                <div style={{ position: "absolute", left: 130, top: -30 }}>
                  <CrossDraw at={tDirect} size={110} />
                </div>
              </div>
              <Pop at={tHow + 8}>
                <GoldBarIcon size={200} />
              </Pop>
            </div>
          )}
          {frame >= tChain && (
            <div style={{ position: "absolute", left: 0, right: 0, top: 40, display: "flex", justifyContent: "center", alignItems: "flex-start", gap: 26 }}>
              {DOMINOS.map((d, i) => (
                <Pop key={i} at={tChain + i * 4}>
                  <div style={{ transform: flip && frame < tInv ? "scale(0.96)" : undefined }}>
                    <Domino key={flip ? `f${i}` : `n${i}`} at={reAt(i)} label={d.l} icon={d.icon} tone={d.tone} />
                  </div>
                </Pop>
              ))}
            </div>
          )}
          {frame >= tGold && frame < tStrong && (
            <div style={{ position: "absolute", left: 0, right: 0, top: 470, display: "flex", justifyContent: "center" }}>
              <Pop at={tGold}>
                <Pill text="le chemin classique" color={C.positive} size={28} />
              </Pop>
            </div>
          )}
          {frame >= tStrong && (
            <div style={{ position: "absolute", left: 0, right: 0, top: 470, display: "flex", justifyContent: "center" }}>
              <Pop at={tStrong}>
                <Pill text="rapport plus fort → toute la chaîne s'inverse" color={C.negative} size={28} />
              </Pop>
            </div>
          )}
        </div>
      </Beat>

      {/* B: exceptions */}
      <Beat from={tLaw} to={tCtx} style={{ left: 0, top: 0 }}>
        <div style={{ position: "relative", width: STAGE_W, height: 690 }}>
          <div style={{ position: "absolute", left: 0, right: 0, top: 0, display: "flex", justifyContent: "center" }}>
            <Stamp at={tLaw} text="PAS UNE LOI" size={44} />
          </div>
          <div style={{ position: "absolute", left: 0, top: 110, width: STAGE_W, display: "flex", justifyContent: "center", gap: 30 }}>
            <Pop at={tStress}>
              <Panel glow={frame >= tStress && frame < tOffre} style={{ width: 540, height: 470, padding: 26, borderColor: C.negative }}>
                <Big size={30} color={C.negative}>Stress de marché</Big>
                <div style={{ position: "relative", height: 200, marginTop: 10 }}>
                  {[0, 1, 2].map((i) => {
                    const x = interpolate(frame, [tStress + 10 + i * 6, tStress + 60 + i * 6], [0, 230 - i * 60], { ...clamp, easing: theme.ease.out });
                    return (
                      <div key={i} style={{ position: "absolute", left: x, top: 20 }}>
                        <Person size={100} phase={i} color={C.textSecondary} run={frame < tStress + 65} />
                      </div>
                    );
                  })}
                  <div style={{ position: "absolute", left: 360, top: 30 }}>
                    <DollarIcon size={110} />
                  </div>
                </div>
                <Label size={22} color={C.textPrimary}>chiffres faibles… mais le dollar monte</Label>
                {frame >= tSell && (
                  <div style={{ display: "flex", alignItems: "center", gap: 12, justifyContent: "center", marginTop: 16 }}>
                    <Pop at={tSell}>
                      <GoldBarIcon size={70} color={C.negative} />
                    </Pop>
                    <Pop at={tOr}>
                      <PriceTag text="VENDU" color={C.negative} rotate={-6} />
                    </Pop>
                  </div>
                )}
                {frame >= tSell && <Label size={20}>on vend ce qu&apos;on peut, même de l&apos;or</Label>}
              </Panel>
            </Pop>
            <Pop at={tOffre}>
              <Panel glow={frame >= tOffre && frame < tGood} style={{ width: 540, height: 470, padding: 26 }}>
                <Big size={30} color={C.accentBright}>Croissance freinée par l&apos;offre</Big>
                <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "center", gap: 10, marginTop: 30, height: 180 }}>
                  <Factory size={130} hot />
                  <div style={{ transform: `translateX(${Math.sin(frame / 3) * 3}px)`, opacity: 0.7 }}>
                    <Truck size={120} />
                  </div>
                  <CrossDraw at={tOffre + 10} size={60} />
                </div>
                <div style={{ display: "flex", justifyContent: "center", gap: 12, marginTop: 20 }}>
                  <PriceTag text="prix ↑" color={C.negative} rotate={-4} />
                </div>
                <Label size={22} color={C.textPrimary}>peu de croissance + de l&apos;inflation</Label>
              </Panel>
            </Pop>
            <Pop at={tGood}>
              <Panel glow={frame >= tGood} style={{ width: 540, height: 470, padding: 26, borderColor: C.positive }}>
                <Big size={30} color={C.positive}>Bonne croissance… or OK</Big>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, marginTop: 40 }}>
                  <GoldBarIcon size={110} />
                  {frame >= tReal && (
                    <Pop at={tReal}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <Big size={30}>taux réels</Big>
                        <ArrowGlyph up={false} color={C.positive} size={54} />
                      </div>
                    </Pop>
                  )}
                </div>
                <div style={{ marginTop: 30 }}>
                  <Label size={22} color={C.textPrimary}>si les taux réels baissent pour une autre raison</Label>
                </div>
              </Panel>
            </Pop>
          </div>
        </div>
      </Beat>

      {/* C: contextual */}
      <Beat from={tCtx} style={{ left: 0, top: 0 }}>
        <div style={{ width: STAGE_W, height: 600, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 30 }}>
          <div style={{ transform: `scale(${breathe.scale})` }}>
            <Panel glow style={{ padding: "30px 60px", display: "flex", alignItems: "center", gap: 30 }}>
              <Big size={60}>F5</Big>
              <div style={{ border: `2px solid ${C.context}`, color: C.context, borderRadius: 12, padding: "8px 26px", fontSize: 44, fontWeight: 800 }}>Contextuel</div>
            </Panel>
          </div>
          {frame >= tFix && (
            <Pop at={tFix}>
              <Big size={38} color={C.accentBright}>Aucune direction n&apos;a un sens fixe pour l&apos;or</Big>
            </Pop>
          )}
        </div>
      </Beat>
    </SceneShell>
  );
};
