import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { theme } from "../theme";
import { Sfx, makeCue, Panel, GoldBarIcon, useBreathe } from "./shared";
import type { SceneProps } from "./shared";
import { Beat, Pop, Person, Bubble, LiveChart, series, clamp } from "./characters";
import { SceneShell, Center, Big, Label, STAGE_W } from "./stage";
import { Pill, CrossDraw, Office, Stamp, HouseGlyph } from "./props5";
import { Thermo, Umbrella, Bell, Bond } from "./props7";

const C = theme.colors;

export const Intro: React.FC<SceneProps> = ({ words, durationInFrames }) => {
  const frame = useCurrentFrame();
  const cue = makeCue(words);
  const tPeur = cue("quand les marches");
  const tVix = cue("le vix explose");
  const tOr = cue("alors l or va monter");
  const tSauf = cue("sauf que");
  const tAct = cue("la peur sur les actions");
  const tTaux = cue("la peur sur les taux");
  const tCred = cue("la peur sur le credit");
  const tTrois = cue("trois thermometres");
  const tMonte = cue("l or peut monter");
  const tVendu = cue("ou etre vendu");
  const tF7 = cue("c est le sujet");
  const breathe = useBreathe(0.2);
  const lvl = (at: number, to: number) => interpolate(frame, [at, at + 30], [0.1, to], { ...clamp, easing: theme.ease.out });

  return (
    <SceneShell eyebrow="F7 · Risque, crédit, volatilité" title="La peur a trois visages" durationInFrames={durationInFrames}>
      <Sfx file="bass.wav" at={tVix} volume={0.45} />
      <Sfx file="pop.wav" at={tSauf} volume={0.4} />
      <Sfx file="pop.wav" at={tAct} volume={0.35} />
      <Sfx file="pop.wav" at={tTaux} volume={0.35} />
      <Sfx file="pop.wav" at={tCred} volume={0.35} />
      <Sfx file="whoosh.wav" at={tMonte} volume={0.4} />
      <Sfx file="bass.wav" at={tVendu} volume={0.45} />
      <Sfx file="chime.wav" at={tF7} volume={0.55} />

      <Beat from={0} to={tSauf} style={{ left: 0, top: 0 }}>
        <Center gap={80}>
          <Pop at={tPeur}>
            <div style={{ transform: `translateX(${Math.sin(frame / 2) * (frame > tVix ? 4 : 0)}px)` }}>
              <Thermo level={lvl(tVix, 0.95)} label="VIX" size={380} />
            </div>
          </Pop>
          <Pop at={tOr}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
              <Bubble text="alors l'or va monter ?" width={380} tone={C.accentBright} tail="bottom" />
              <GoldBarIcon size={170} />
            </div>
          </Pop>
        </Center>
      </Beat>

      <Beat from={tSauf} to={tAct} style={{ left: 0, top: 0 }}>
        <Center column gap={30}>
          <Pop at={tSauf}>
            <Big size={60}>La peur n&apos;a pas qu&apos;un seul visage</Big>
          </Pop>
          <div style={{ display: "flex", gap: 40 }}>
            {["?", "?", "?"].map((q, i) => (
              <Pop key={i} at={tSauf + 10 + i * 6}>
                <div style={{ width: 150, height: 150, borderRadius: "50%", border: `3px dashed ${C.textMuted}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 80, color: C.textMuted, fontWeight: 900, transform: `rotate(${Math.sin(frame / 10 + i) * 8}deg)` }}>{q}</div>
              </Pop>
            ))}
          </div>
        </Center>
      </Beat>

      <Beat from={tAct - 4} style={{ left: 0, top: 0 }}>
        <div style={{ width: STAGE_W, height: 660, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 20 }}>
          <div style={{ display: "flex", gap: 120, alignItems: "flex-end" }}>
            {[
              { t: "actions", at: tAct, col: C.negative, sub: "VIX" },
              { t: "taux", at: tTaux, col: C.context, sub: "MOVE" },
              { t: "crédit", at: tCred, col: C.accent, sub: "écarts de crédit" },
            ].map((x, i) => (
              <Pop key={x.t} at={x.at}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <Thermo level={lvl(x.at, [0.8, 0.5, 0.65][i])} color={x.col} label={x.t === "crédit" ? "peur sur le crédit" : `peur sur les ${x.t}`} size={320} />
                  <Label size={22}>{x.sub}</Label>
                </div>
              </Pop>
            ))}
          </div>
          <div style={{ display: "flex", gap: 30, alignItems: "center", height: 80 }}>
            {frame >= tTrois && (
              <Pop at={tTrois}>
                <Pill text="3 thermomètres différents" size={28} />
              </Pop>
            )}
            {frame >= tMonte && (
              <Pop at={tMonte}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <GoldBarIcon size={60} color={C.positive} />
                  <Label size={26} color={C.positive}>monte…</Label>
                </div>
              </Pop>
            )}
            {frame >= tVendu && (
              <Pop at={tVendu}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <GoldBarIcon size={60} color={C.negative} />
                  <Label size={26} color={C.negative}>… ou vendu</Label>
                </div>
              </Pop>
            )}
          </div>
          {frame >= tF7 && (
            <Pop at={tF7}>
              <div style={{ transform: `scale(${breathe.scale})` }}>
                <Big size={52} color={C.accentBright} glow>
                  F7 · Risque, crédit, volatilité
                </Big>
              </div>
            </Pop>
          )}
        </div>
      </Beat>
    </SceneShell>
  );
};

export const Vix: React.FC<SceneProps> = ({ words, durationInFrames }) => {
  const frame = useCurrentFrame();
  const cue = makeCue(words);
  const tVix = cue("premier thermometre");
  const tMes = cue("il mesure");
  const t30 = cue("pour les trente");
  const tOpt = cue("une option c est une assurance");
  const tPrix = cue("son prix contient");
  const tComb = cue("le vix combine");
  const tAnn = cue("points de volatilite");
  const tPiege = cue("attention au piege");
  const t20 = cue("un vix a 20");
  const tAmp = cue("il decrit l ampleur");
  const tDir = cue("pas leur direction");

  return (
    <SceneShell eyebrow="F7 · Le VIX" title="Le prix de l'assurance sur les actions" durationInFrames={durationInFrames}>
      <Sfx file="pop.wav" at={tVix} volume={0.4} />
      <Sfx file="pop.wav" at={tOpt} volume={0.4} />
      <Sfx file="whoosh.wav" at={tComb} volume={0.4} />
      <Sfx file="bass.wav" at={tPiege} volume={0.45} />
      <Sfx file="chime.wav" at={tDir} volume={0.45} />

      <Beat from={0} to={tPiege} style={{ left: 0, top: 0 }}>
        <div style={{ position: "relative", width: STAGE_W, height: 690 }}>
          <div style={{ position: "absolute", left: 40, top: 30, width: 760 }}>
            <Pop at={tVix}>
              <Panel glow style={{ padding: 26 }}>
                <Big size={44} color={C.accentBright}>VIX</Big>
                {frame >= tMes && <Label size={24} color={C.textPrimary}>volatilité implicite des options sur le grand indice des actions américaines</Label>}
                {frame >= t30 && (
                  <div style={{ display: "flex", justifyContent: "center", marginTop: 16 }}>
                    <Pill text="≈ 30 prochains jours" size={26} />
                  </div>
                )}
                <div style={{ marginTop: 16 }}>
                  <LiveChart data={series(40, 11, 0, 1.6)} width={700} height={170} from={tMes} drawFrames={90} color={C.negative} label="actions" />
                </div>
              </Panel>
            </Pop>
          </div>
          <div style={{ position: "absolute", left: 880, top: 30, width: 840, display: "flex", flexDirection: "column", gap: 24 }}>
            <Pop at={tOpt}>
              <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                <Umbrella size={170} />
                <Big size={36}>une option = une assurance</Big>
              </div>
            </Pop>
            {frame >= tPrix && (
              <Pop at={tPrix}>
                <Panel style={{ padding: "16px 24px" }}>
                  <Label size={24} color={C.textPrimary}>son prix paie tous les scénarios possibles… et le risque de volatilité lui-même</Label>
                </Panel>
              </Pop>
            )}
            {frame >= tComb && (
              <Pop at={tComb}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  {[0, 1, 2, 3, 4, 5].map((i) => (
                    <Pop key={i} at={tComb + i * 4}>
                      <Umbrella size={60} color={i % 2 ? C.context : C.accent} />
                    </Pop>
                  ))}
                  <span style={{ fontSize: 40, color: C.accent }}>→</span>
                  <Pill text={frame >= tAnn ? "1 mesure · points annualisés" : "1 mesure"} size={26} filled />
                </div>
              </Pop>
            )}
          </div>
        </div>
      </Beat>

      <Beat from={tPiege} style={{ left: 0, top: 0 }}>
        <Center column gap={40}>
          <Pop at={t20}>
            <div style={{ display: "flex", alignItems: "center", gap: 40 }}>
              <Panel style={{ padding: "24px 40px" }}>
                <Big size={60}>VIX 20</Big>
              </Panel>
              <Big size={80} color={C.negative}>≠</Big>
              <div style={{ position: "relative" }}>
                <Panel style={{ padding: "24px 40px" }}>
                  <Big size={48} color={C.textMuted}>actions −20 %</Big>
                </Panel>
                <div style={{ position: "absolute", right: -40, top: -20 }}>
                  <CrossDraw at={t20 + 20} size={100} />
                </div>
              </div>
            </div>
          </Pop>
          {frame >= tAmp && (
            <Pop at={tAmp}>
              <div style={{ display: "flex", gap: 30 }}>
                <Pill text="l'ampleur des mouvements ✓" color={C.positive} size={30} />
                {frame >= tDir && <Pill text="leur direction ✗" color={C.negative} size={30} />}
              </div>
            </Pop>
          )}
        </Center>
      </Beat>
    </SceneShell>
  );
};

export const VixMath: React.FC<SceneProps> = ({ words, durationInFrames }) => {
  const frame = useCurrentFrame();
  const cue = makeCue(words);
  const tQ = cue("comment le traduire");
  const tForm = cue("une approximation le vix");
  const tH = cue("imaginons que hachim");
  const tCalc = cue("vingt quatre fois");
  const t69 = cue("environ 6 9");
  const tOrdre = cue("c est l ordre de grandeur");
  const tDeux = cue("dans les deux sens");
  const tPas = cue("ce n est pas un objectif");
  const tCloche = cue("et les vrais rendements");
  const tMonte = cue("et quand le vix monte");
  const tProt = cue("une demande de protection");
  const tLarge = cue("des scenarios plus larges");
  const tBaisse = cue("ou une baisse du marche");
  const tSure = cue("une chose est sure");

  return (
    <SceneShell eyebrow="F7 · Traduire le VIX" title="De points de volatilité à un mouvement concret" durationInFrames={durationInFrames}>
      <Sfx file="pop.wav" at={tForm} volume={0.4} />
      <Sfx file="whoosh.wav" at={tH} volume={0.4} />
      <Sfx file="chime.wav" at={t69} volume={0.5} />
      <Sfx file="bass.wav" at={tPas} volume={0.4} />
      <Sfx file="whoosh.wav" at={tMonte} volume={0.4} />
      <Sfx file="bass.wav" at={tSure} volume={0.45} />

      <Beat from={0} to={tMonte} style={{ left: 0, top: 0 }}>
        <div style={{ position: "relative", width: STAGE_W, height: 690 }}>
          <div style={{ position: "absolute", left: 0, right: 0, top: 0, display: "flex", justifyContent: "center" }}>
            <Pop at={tForm}>
              <Panel glow style={{ padding: "16px 34px" }}>
                <div style={{ fontFamily: theme.mono, fontSize: 40, fontWeight: 900, color: C.textPrimary }}>
                  mouvement ≈ VIX × √(30 / 365)
                </div>
              </Panel>
            </Pop>
          </div>
          {frame >= tH && (
            <div style={{ position: "absolute", left: 60, top: 170 }}>
              <Pop at={tH}>
                <div style={{ position: "relative" }}>
                  <Person size={220} color={C.accent} label="Hachim" />
                  <div style={{ position: "absolute", left: 150, top: -20 }}>
                    <Bubble text="VIX à 24" width={200} tone={C.accentBright} tail="left" />
                  </div>
                </div>
              </Pop>
            </div>
          )}
          {frame >= tCalc && (
            <div style={{ position: "absolute", left: 460, top: 150 }}>
              <Pop at={tCalc}>
                <div style={{ fontFamily: theme.mono, fontSize: 36, fontWeight: 800, color: C.textPrimary }}>
                  24 × √(30/365) = 24 × 0,287 ≈ <span style={{ color: C.accentBright, fontSize: 48 }}>{frame >= t69 ? "6,9 %" : "…"}</span>
                </div>
              </Pop>
            </div>
          )}
          {frame >= tOrdre && (
            <div style={{ position: "absolute", left: 620, top: 250 }}>
              <Pop at={tOrdre}>
                <Bell from={tOrdre} width={760} label={frame >= tDeux ? "dans les deux sens" : "30 jours"} />
              </Pop>
            </div>
          )}
          {frame >= tPas && (
            <div style={{ position: "absolute", left: 60, top: 560, display: "flex", gap: 20 }}>
              <Pop at={tPas}>
                <Pill text="pas un objectif de prix" color={C.negative} size={26} />
              </Pop>
              {frame >= tCloche && (
                <Pop at={tCloche}>
                  <Pill text="les vrais rendements ne suivent pas toujours la cloche" color={C.context} size={26} />
                </Pop>
              )}
            </div>
          )}
        </div>
      </Beat>

      <Beat from={tMonte} style={{ left: 0, top: 0 }}>
        <Center column gap={34}>
          <Pop at={tMonte}>
            <Thermo level={interpolate(frame, [tMonte, tMonte + 40], [0.3, 0.9], { ...clamp, easing: theme.ease.out })} label="VIX ↑" size={260} />
          </Pop>
          <div style={{ display: "flex", gap: 24 }}>
            {[
              { t: "demande de protection", at: tProt, icon: <Umbrella size={70} /> },
              { t: "scénarios plus larges", at: tLarge, icon: <Office size={70} /> },
              { t: "baisse du marché", at: tBaisse, icon: <HouseGlyph size={70} lit /> },
            ].map((x) => (
              <Pop key={x.t} at={x.at}>
                <Panel style={{ padding: "16px 24px", display: "flex", alignItems: "center", gap: 14 }}>
                  {x.icon}
                  <Label size={24} color={C.textPrimary}>{x.t}</Label>
                </Panel>
              </Pop>
            ))}
          </div>
          {frame >= tSure && (
            <Pop at={tSure}>
              <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                <Big size={36}>VIX ↑</Big>
                <Big size={50} color={C.negative}>≠</Big>
                <GoldBarIcon size={70} />
                <Big size={36}>or ↑</Big>
              </div>
            </Pop>
          )}
        </Center>
      </Beat>
    </SceneShell>
  );
};

export const Move: React.FC<SceneProps> = ({ words, durationInFrames }) => {
  const frame = useCurrentFrame();
  const cue = makeCue(words);
  const tMove = cue("deuxieme thermometre");
  const tObl = cue("sur les obligations d etat");
  const tWhy = cue("pourquoi la volatilite");
  const tTout = cue("tout bouge avec eux");
  const ITEMS = [
    { t: "prix des obligations", at: cue("le prix des obligations") },
    { t: "besoins de couverture", at: cue("les besoins de couverture") },
    { t: "crédits immobiliers", at: cue("les credits immobiliers") },
    { t: "bilans des banques", at: cue("l espace dans les bilans") },
    { t: "coût du financement", at: cue("et le cout pour financer") },
  ];
  const tCalme = cue("le move peut grimper");
  const tCas = cue("c est le cas quand");
  const tOr = cue("pour l or le niveau");
  const tQ = cue("la bonne question");
  const tConf = cue("et est ce que");
  const tDeux = cue("une forte volatilite des taux");

  return (
    <SceneShell eyebrow="F7 · Le MOVE" title="La volatilité des taux d'État" durationInFrames={durationInFrames}>
      <Sfx file="pop.wav" at={tMove} volume={0.4} />
      <Sfx file="whoosh.wav" at={tTout} volume={0.4} />
      {ITEMS.map((it) => (
        <Sfx key={it.t} file="tick.wav" at={it.at} volume={0.35} />
      ))}
      <Sfx file="bass.wav" at={tCalme} volume={0.4} />
      <Sfx file="chime.wav" at={tOr} volume={0.45} />

      <Beat from={0} to={tCalme} style={{ left: 0, top: 0 }}>
        <div style={{ position: "relative", width: STAGE_W, height: 690 }}>
          <div style={{ position: "absolute", left: 40, top: 30, display: "flex", alignItems: "center", gap: 30 }}>
            <Pop at={tMove}>
              <Thermo level={0.7} color={C.context} label="MOVE" size={300} />
            </Pop>
            {frame >= tObl && (
              <Pop at={tObl}>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <Bond title="État américain · 2 ans" rate="4,6 %" />
                  <Bond title="État américain · 10 ans" rate="4,2 %" />
                </div>
              </Pop>
            )}
          </div>
          <div style={{ position: "absolute", left: 800, top: 30, width: 920 }}>
            {frame >= tWhy && (
              <Pop at={tWhy}>
                <Big size={36}>Quand les taux bougent fort, tout bouge</Big>
              </Pop>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 24 }}>
              {ITEMS.map((it, i) => (
                <Pop key={it.t} at={it.at}>
                  <div style={{ transform: `translateX(${Math.sin(frame / 6 + i) * (frame > tTout ? 6 : 0)}px)` }}>
                    <Pill text={it.t} color={C.context} size={28} />
                  </div>
                </Pop>
              ))}
            </div>
          </div>
        </div>
      </Beat>

      <Beat from={tCalme} style={{ left: 0, top: 0 }}>
        <div style={{ width: STAGE_W, height: 660, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 30 }}>
          <div style={{ display: "flex", gap: 120, alignItems: "flex-end" }}>
            <Thermo level={interpolate(frame, [tCalme, tCalme + 40], [0.4, 0.92], { ...clamp, easing: theme.ease.out })} color={C.context} label="MOVE ↑" size={280} />
            <Thermo level={0.3} color={C.negative} label="VIX calme" size={280} />
          </div>
          {frame >= tCas && (
            <Pop at={tCas}>
              <div style={{ display: "flex", gap: 14 }}>
                {["inflation", "Fed", "émissions de dette", "prime de terme"].map((t) => (
                  <Pill key={t} text={t} color={C.accentBright} size={24} />
                ))}
              </div>
            </Pop>
          )}
          {frame >= tOr && (
            <Pop at={tOr}>
              <Panel glow style={{ padding: "16px 30px", textAlign: "center" }}>
                <Big size={30}>Pour l&apos;or : le niveau du MOVE est contextuel</Big>
                {frame >= tQ && <Label size={24} color={C.textPrimary}>qu&apos;est-ce qui fait bouger les taux ?{frame >= tConf ? " Taux réels et dollar confirment-ils ?" : ""}</Label>}
              </Panel>
            </Pop>
          )}
          {frame >= tDeux && (
            <Pop at={tDeux}>
              <div style={{ display: "flex", gap: 30, alignItems: "center" }}>
                <GoldBarIcon size={60} color={C.positive} />
                <Label size={24}>ou</Label>
                <GoldBarIcon size={60} color={C.negative} />
                <Stamp at={tDeux + 10} text="LES DEUX POSSIBLES" color={C.accentBright} size={28} />
              </div>
            </Pop>
          )}
        </div>
      </Beat>
    </SceneShell>
  );
};

