import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { theme } from "../theme";
import { Sfx, makeCue, Panel, GoldBarIcon, BankIcon, AnimatedNumber, useBreathe } from "./shared";
import type { SceneProps } from "./shared";
import { Beat, Pop, Person, Bubble, clamp } from "./characters";
import { SceneShell, Center, Big, Label, STAGE_W } from "./stage";
import { Bathtub, CrossDraw, Pill, Office, CalendarPage, Stamp, CheckDraw } from "./props5";
import { Tank, Pipe, TAccount, RateAxis } from "./props8";

const C = theme.colors;

export const Intro: React.FC<SceneProps> = ({ words, durationInFrames }) => {
  const frame = useCurrentFrame();
  const cue = makeCue(words);
  const tRob = cue("comme d un robinet");
  const tOuvre = cue("la fed ouvre");
  const tReal = cue("en realite");
  const tRes = cue("des reservoirs");
  const tF8 = cue("f8 regarde");
  const tRb = cue("les reserves des banques");
  const tTr = cue("le compte du tresor");
  const tTx = cue("et les taux de financement");
  const tOr = cue("et surtout");
  const breathe = useBreathe(0.2);
  const lvl = interpolate(frame, [tOuvre, tReal], [0.2, 0.8], { ...clamp, easing: theme.ease.inOut });

  return (
    <SceneShell eyebrow="F8 · Liquidité & financement" title="Pas un robinet : une plomberie" durationInFrames={durationInFrames}>
      <Sfx file="pop.wav" at={tRob} volume={0.4} />
      <Sfx file="bass.wav" at={tReal} volume={0.45} />
      <Sfx file="whoosh.wav" at={tRes} volume={0.4} />
      <Sfx file="pop.wav" at={tRb} volume={0.35} />
      <Sfx file="pop.wav" at={tTr} volume={0.35} />
      <Sfx file="pop.wav" at={tTx} volume={0.35} />
      <Sfx file="chime.wav" at={tOr} volume={0.5} />

      <Beat from={0} to={tReal} style={{ left: 0, top: 0 }}>
        <Center gap={60}>
          <Pop at={tRob - 4}>
            <Bathtub level={lvl} flowing={frame >= tOuvre} width={560} />
          </Pop>
          <Pop at={tOuvre + 20}>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <Pill text="la Fed ouvre" size={28} />
              <Pill text="l'argent coule" color={C.context} size={28} />
              <Pill text="les actifs montent ?" color={C.positive} size={28} />
            </div>
          </Pop>
        </Center>
      </Beat>

      <Beat from={tReal} style={{ left: 0, top: 0 }}>
        <div style={{ position: "relative", width: STAGE_W, height: 690 }}>
          <div style={{ position: "absolute", left: 60, top: 40, display: "flex", alignItems: "flex-end", gap: 0 }}>
            <Pop at={tRes}>
              <Tank level={0.7} label="réserves" color={C.context} value={frame >= tRb ? "banques" : undefined} />
            </Pop>
            <Pop at={tRes + 8}>
              <div style={{ marginBottom: 150 }}>
                <Pipe width={220} active={frame >= tRes + 20} />
              </div>
            </Pop>
            <Pop at={tRes + 14}>
              <Tank level={0.4} label="TGA" color={C.accent} value={frame >= tTr ? "Trésor" : undefined} />
            </Pop>
            <Pop at={tRes + 20}>
              <div style={{ marginBottom: 150 }}>
                <Pipe width={220} active={frame >= tRes + 32} dir={-1} color={C.accent} />
              </div>
            </Pop>
            <Pop at={tRes + 26}>
              <Tank level={0.55} label="marché monétaire" color={C.positive} value={frame >= tTx ? "taux au jour le jour" : undefined} />
            </Pop>
          </div>
          {frame >= tOr && (
            <div style={{ position: "absolute", left: 0, right: 0, top: 480, display: "flex", justifyContent: "center", alignItems: "center", gap: 20 }}>
              <Pop at={tOr}>
                <div style={{ display: "flex", alignItems: "center", gap: 20, transform: `scale(${breathe.scale})` }}>
                  <Big size={38} color={C.accentBright}>aucun chiffre seul n&apos;est un signal pour l&apos;or</Big>
                  <GoldBarIcon size={70} />
                </div>
              </Pop>
            </div>
          )}
        </div>
      </Beat>
    </SceneShell>
  );
};

export const Reserves: React.FC<SceneProps> = ({ words, durationInFrames }) => {
  const frame = useCurrentFrame();
  const cue = makeCue(words);
  const tRes = cue("commencons par");
  const tDep = cue("ce sont les depots");
  const tDette = cue("pour la fed");
  const tActif = cue("pour la banque");
  const tSimp = cue("en simplifiant");
  const tBil = cue("les billets");
  const tTga = cue("le compte du tresor");
  const tRrp = cue("et les prises");
  const tCompt = cue("c est une lecture comptable");
  const tRep = cue("et la repartition");
  const tAise = cue("des reserves abondantes");

  return (
    <SceneShell eyebrow="F8 · Réserves bancaires" title="Une dette de la Fed, un actif des banques" durationInFrames={durationInFrames}>
      <Sfx file="pop.wav" at={tDep} volume={0.4} />
      <Sfx file="tick.wav" at={tDette} volume={0.4} />
      <Sfx file="tick.wav" at={tActif} volume={0.4} />
      <Sfx file="whoosh.wav" at={tSimp} volume={0.4} />
      <Sfx file="bass.wav" at={tRep} volume={0.4} />

      <Beat from={0} to={tRep} style={{ left: 0, top: 0 }}>
        <div style={{ position: "relative", width: STAGE_W, height: 690 }}>
          <div style={{ position: "absolute", left: 40, top: 20, display: "flex", alignItems: "center", gap: 30 }}>
            <Pop at={tRes}>
              <Office size={170} lit />
            </Pop>
            <Pop at={tDep}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <Pipe width={200} active label="dépôts" />
              </div>
            </Pop>
            <Pop at={tDep + 10}>
              <BankIcon size={170} color={C.accent} />
            </Pop>
          </div>
          <div style={{ position: "absolute", left: 40, top: 260, display: "flex", gap: 20 }}>
            {frame >= tDette && (
              <Pop at={tDette}>
                <Pill text="pour la Fed : une dette" color={C.negative} size={26} />
              </Pop>
            )}
            {frame >= tActif && (
              <Pop at={tActif}>
                <Pill text="pour la banque : un actif" color={C.positive} size={26} />
              </Pop>
            )}
          </div>
          <div style={{ position: "absolute", left: 1040, top: 20 }}>
            {frame >= tSimp && (
              <Pop at={tSimp}>
                <TAccount
                  title="Bilan simplifié de la Fed"
                  assets={[{ t: "titres, prêts…" }]}
                  liabilities={[
                    { t: "réserves des banques", hi: true },
                    { t: "billets en circulation", hi: frame >= tBil && frame < tTga },
                    { t: "compte du Trésor (TGA)", hi: frame >= tTga && frame < tRrp },
                    { t: "prises en pension inversées", hi: frame >= tRrp && frame < tCompt },
                  ]}
                />
              </Pop>
            )}
          </div>
          {frame >= tSimp + 30 && (
            <div style={{ position: "absolute", left: 40, top: 380, width: 960 }}>
              <Pop at={tSimp + 30}>
                <Panel glow style={{ padding: "18px 26px" }}>
                  <div style={{ fontFamily: theme.mono, fontSize: 30, fontWeight: 900, color: C.textPrimary }}>réserves ≈ actifs − autres dettes</div>
                  {frame >= tCompt && <Label size={23} color={C.accentBright}>une lecture comptable, pas un modèle complet de cause à effet</Label>}
                </Panel>
              </Pop>
            </div>
          )}
        </div>
      </Beat>

      <Beat from={tRep} style={{ left: 0, top: 0 }}>
        <Center column gap={30}>
          <Pop at={tRep}>
            <Big size={40}>La répartition compte</Big>
          </Pop>
          <div style={{ display: "flex", gap: 40, alignItems: "flex-end" }}>
            {[0.9, 0.75, 0.15, 0.6, 0.2].map((l, i) => (
              <Pop key={i} at={tRep + 8 + i * 5}>
                <Tank level={l} label={`banque ${i + 1}`} color={l < 0.3 ? C.negative : C.context} w={150} h={200} />
              </Pop>
            ))}
          </div>
          {frame >= tAise && (
            <Pop at={tAise}>
              <Label size={26} color={C.textPrimary}>abondant au total ≠ tout le monde à l&apos;aise</Label>
            </Pop>
          )}
        </Center>
      </Beat>
    </SceneShell>
  );
};

export const TgaExample: React.FC<SceneProps> = ({ words, durationInFrames }) => {
  const frame = useCurrentFrame();
  const cue = makeCue(words);
  const tEx = cue("exemple");
  const tSauf = cue("sauf le compte");
  const tQ = cue("que s est il passe");
  const tImp = cue("au moment des impots");
  const tQuit = cue("l argent du tresor quitte");
  const tBaisse = cue("les reserves bancaires baissent");
  const tSens = cue("le sens comptable");
  const tEffet = cue("mais l effet");
  const tComp = cue("les autres dettes");
  const flow = interpolate(frame, [tQuit, tBaisse + 20], [0, 1], { ...clamp, easing: theme.ease.inOut });

  return (
    <SceneShell eyebrow="F8 · Exemple" title="Quand le compte du Trésor se remplit" durationInFrames={durationInFrames}>
      <Sfx file="pop.wav" at={tEx} volume={0.4} />
      <Sfx file="whoosh.wav" at={tQuit} volume={0.45} />
      <Sfx file="bass.wav" at={tBaisse} volume={0.45} />
      <Sfx file="chime.wav" at={tSens} volume={0.45} />
      <Sfx file="bass.wav" at={tEffet} volume={0.4} />

      <Beat from={0} style={{ left: 0, top: 0 }}>
        <div style={{ position: "relative", width: STAGE_W, height: 690 }}>
          <div style={{ position: "absolute", left: 60, top: 20, display: "flex", alignItems: "flex-end" }}>
            <Pop at={tEx}>
              <Tank level={0.8 - flow * 0.35} label="réserves des banques" color={C.context} w={260} h={300} value={frame >= tBaisse ? "≈ −120 Md$" : undefined} />
            </Pop>
            <div style={{ marginBottom: 170 }}>
              <Pipe width={300} active={frame >= tQuit} label={frame >= tImp ? "impôts, règlement de dettes" : undefined} />
            </div>
            <Pop at={tSauf}>
              <Tank level={0.3 + flow * 0.35} label="compte du Trésor (TGA)" color={C.accent} w={260} h={300} value={frame >= tSauf ? "+120 Md$" : undefined} />
            </Pop>
          </div>
          <div style={{ position: "absolute", left: 1040, top: 20, width: 680, display: "flex", flexDirection: "column", gap: 18 }}>
            {frame >= tEx && (
              <Pop at={tEx + 10}>
                <Panel style={{ padding: "14px 22px" }}>
                  <Label size={23} color={C.textPrimary}>hypothèse : actifs de la Fed et autres dettes inchangés</Label>
                </Panel>
              </Pop>
            )}
            {frame >= tQ && (
              <Pop at={tQ}>
                <Big size={34}>Que s&apos;est-il passé ?</Big>
              </Pop>
            )}
            {frame >= tBaisse && (
              <Pop at={tBaisse}>
                <Big size={44} color={C.negative}>
                  réserves <AnimatedNumber from={0} to={-120} delay={tBaisse} durationFrames={30} format={(n) => `${Math.round(n)} Md$`} />
                </Big>
              </Pop>
            )}
            {frame >= tSens && (
              <Pop at={tSens}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <CheckDraw at={tSens + 4} size={44} />
                  <Label size={26} color={C.positive}>sens comptable : clair</Label>
                </div>
              </Pop>
            )}
            {frame >= tEffet && (
              <Pop at={tEffet}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <CrossDraw at={tEffet + 4} size={44} />
                  <Label size={26} color={C.negative}>effet sur le prix des actifs : pas clair</Label>
                </div>
              </Pop>
            )}
            {frame >= tComp && (
              <Pop at={tComp}>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  {["autres dettes", "opérations de la Fed", "anticipations", "positionnement"].map((t) => (
                    <Pill key={t} text={t} color={C.context} size={22} />
                  ))}
                </div>
              </Pop>
            )}
          </div>
        </div>
      </Beat>
    </SceneShell>
  );
};

export const Tga: React.FC<SceneProps> = ({ words, durationInFrames }) => {
  const frame = useCurrentFrame();
  const cue = makeCue(words);
  const tZoom = cue("zoom sur");
  const tCourant = cue("c est le compte courant");
  const tImp = cue("les impots et l argent");
  const tDep = cue("les depenses publiques");
  const tRecon = cue("quand le tga se reconstitue");
  const tVide = cue("quand il se vide");
  const tRythme = cue("le rythme");
  const tOr = cue("et pour l or");
  const tCompte = cue("il compte seulement");
  const lvl = frame < tDep ? interpolate(frame, [tImp, tImp + 40], [0.3, 0.75], { ...clamp, easing: theme.ease.out }) : interpolate(frame, [tDep, tDep + 40], [0.75, 0.4], { ...clamp, easing: theme.ease.out });

  return (
    <SceneShell eyebrow="F8 · Le TGA" title="Le compte courant du Trésor" durationInFrames={durationInFrames}>
      <Sfx file="pop.wav" at={tZoom} volume={0.4} />
      <Sfx file="whoosh.wav" at={tImp} volume={0.4} />
      <Sfx file="whoosh.wav" at={tDep} volume={0.4} />
      <Sfx file="tick.wav" at={tRecon} volume={0.4} />
      <Sfx file="tick.wav" at={tVide} volume={0.4} />
      <Sfx file="chime.wav" at={tOr} volume={0.45} />

      <Beat from={0} to={tOr} style={{ left: 0, top: 0 }}>
        <div style={{ position: "relative", width: STAGE_W, height: 690 }}>
          <div style={{ position: "absolute", left: 60, top: 60, display: "flex", flexDirection: "column", gap: 20 }}>
            {frame >= tImp && (
              <Pop at={tImp}>
                <Pipe width={300} active label="impôts · émissions de dette" color={C.positive} />
              </Pop>
            )}
            {frame >= tDep && (
              <Pop at={tDep}>
                <Pipe width={300} active dir={-1} label="dépenses publiques" color={C.negative} />
              </Pop>
            )}
          </div>
          <div style={{ position: "absolute", left: 420, top: 10 }}>
            <Pop at={tZoom}>
              <Tank level={lvl} label="TGA" color={C.accent} w={280} h={330} value={frame >= tCourant ? "compte du Trésor à la Fed" : undefined} />
            </Pop>
          </div>
          <div style={{ position: "absolute", left: 800, top: 40, width: 920, display: "flex", flexDirection: "column", gap: 20 }}>
            {frame >= tRecon && (
              <Pop at={tRecon}>
                <Panel style={{ padding: "14px 22px", borderColor: C.negative }}>
                  <Label size={25} color={C.textPrimary}>TGA qui se remplit → peut retirer des réserves</Label>
                </Panel>
              </Pop>
            )}
            {frame >= tVide && (
              <Pop at={tVide}>
                <Panel style={{ padding: "14px 22px", borderColor: C.positive }}>
                  <Label size={25} color={C.textPrimary}>TGA qui se vide → peut en ajouter</Label>
                  <Label size={19}>toutes choses égales par ailleurs</Label>
                </Panel>
              </Pop>
            )}
            {frame >= tRythme && (
              <Pop at={tRythme}>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  {["le rythme", "la source du financement", "les fonds monétaires", "les prises en pension inversées"].map((t) => (
                    <Pill key={t} text={t} color={C.context} size={22} />
                  ))}
                </div>
              </Pop>
            )}
          </div>
        </div>
      </Beat>

      <Beat from={tOr} style={{ left: 0, top: 0 }}>
        <Center column gap={30}>
          <div style={{ display: "flex", alignItems: "center", gap: 40 }}>
            <Tank level={0.8} label="TGA ↑" color={C.accent} w={180} h={220} />
            <Tank level={0.2} label="TGA ↓" color={C.accent} w={180} h={220} />
            <Big size={60} color={C.textMuted}>≠</Big>
            <GoldBarIcon size={120} />
          </div>
          <Pop at={tOr + 10}>
            <Big size={34}>ni haussier, ni baissier pour l&apos;or en soi</Big>
          </Pop>
          {frame >= tCompte && (
            <Pop at={tCompte}>
              <div style={{ display: "flex", gap: 12 }}>
                {["financement", "appétit pour le risque", "taux", "dollar"].map((t) => (
                  <Pill key={t} text={t} size={24} />
                ))}
              </div>
            </Pop>
          )}
        </Center>
      </Beat>
    </SceneShell>
  );
};

export const FundingRates: React.FC<SceneProps> = ({ words, durationInFrames }) => {
  const frame = useCurrentFrame();
  const cue = makeCue(words);
  const tPass = cue("passons aux taux");
  const tSofr = cue("le sofr c est");
  const tEffr = cue("l effr resume");
  const tIorb = cue("et l iorb");
  const tComp = cue("en comparant");
  const tS1 = cue("sofr moins iorb");
  const tS2 = cue("effr moins iorb");
  const tDiag = cue("ce sont des outils");
  const tAtt = cue("mais attention");

  return (
    <SceneShell eyebrow="F8 · Taux au jour le jour" title="Ce que l'argent coûte, chaque nuit" durationInFrames={durationInFrames}>
      <Sfx file="pop.wav" at={tSofr} volume={0.4} />
      <Sfx file="pop.wav" at={tEffr} volume={0.4} />
      <Sfx file="pop.wav" at={tIorb} volume={0.4} />
      <Sfx file="whoosh.wav" at={tComp} volume={0.4} />
      <Sfx file="bass.wav" at={tAtt} volume={0.4} />

      <Beat from={0} to={tSofr - 4} style={{ left: 0, top: 0 }}>
        <Center column gap={30}>
          <Pop at={tPass}>
            <svg width="160" height="160" viewBox="0 0 60 60">
              <path d="M40 8 A24 24 0 1 0 52 40 A18 18 0 1 1 40 8 Z" fill={C.accentBright} />
            </svg>
          </Pop>
          <Pop at={tPass + 10}>
            <Big size={50}>Les taux au jour le jour</Big>
          </Pop>
          <Pop at={tPass + 30}>
            <Label size={28} color={C.textPrimary}>comment l&apos;argent et les garanties s&apos;échangent, chaque nuit</Label>
          </Pop>
        </Center>
      </Beat>

      <Beat from={tSofr - 4} style={{ left: 0, top: 0 }}>
        <div style={{ width: STAGE_W, height: 660, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 30 }}>
          <div style={{ display: "flex", gap: 24 }}>
            {[
              { k: "SOFR", d: "garanti · pensions sur obligations d'État", at: tSofr, col: C.context },
              { k: "EFFR", d: "entre banques · sans garantie", at: tEffr, col: C.accent },
              { k: "IORB", d: "payé par la Fed sur les réserves", at: tIorb, col: C.positive },
            ].map((r) => (
              <Pop key={r.k} at={r.at}>
                <Panel glow={frame >= r.at && frame < r.at + 60} style={{ width: 460, padding: 24, textAlign: "center", borderColor: r.col }}>
                  <Big size={48} color={r.col}>{r.k}</Big>
                  <Label size={22} color={C.textPrimary}>{r.d}</Label>
                </Panel>
              </Pop>
            ))}
          </div>
          {frame >= tComp && (
            <Pop at={tComp}>
              <div style={{ display: "flex", gap: 30, alignItems: "center" }}>
                <Pop at={tS1}>
                  <Pill text="SOFR − IORB" size={32} filled />
                </Pop>
                <Pop at={tS2}>
                  <Pill text="EFFR − IORB" size={32} filled />
                </Pop>
                <Label size={24}>en points de base</Label>
              </div>
            </Pop>
          )}
          {frame >= tDiag && (
            <Pop at={tDiag}>
              <Label size={28} color={C.accentBright}>des outils de diagnostic</Label>
            </Pop>
          )}
          {frame >= tAtt && (
            <Pop at={tAtt}>
              <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
                <div style={{ transform: "scale(0.45)", width: 100, height: 110, transformOrigin: "top left" }}>
                  <CalendarPage top="FIN" big="T4" size={220} />
                </div>
                {["fins de trimestre", "garanties rares", "dates de règlement"].map((t) => (
                  <Pill key={t} text={t} color={C.negative} size={24} />
                ))}
                <Label size={22}>→ mouvements temporaires</Label>
              </div>
            </Pop>
          )}
        </div>
      </Beat>
    </SceneShell>
  );
};

export const SpreadExample: React.FC<SceneProps> = ({ words, durationInFrames }) => {
  const frame = useCurrentFrame();
  const cue = makeCue(words);
  const tEx = cue("exemple");
  const tSofr = cue("le sofr est fixe");
  const tIorb = cue("l iorb est a");
  const tCalc = cue("sofr moins iorb");
  const t3 = cue("soit moins 3");
  const tRien = cue("rien d anormal");
  const t12 = cue("l ecart saute");
  const tH = cue("imaginons que hachim");
  const tAvant = cue("avant de conclure");
  const tCal = cue("une date de reglement");
  const tFin = cue("une fin de trimestre");
  const tSeul = cue("un seul jour");
  const tDiag = cue("un ecart de financement");
  const spike = frame >= t12;

  return (
    <SceneShell eyebrow="F8 · Exemple" title="Un écart de financement… et un seul jour" durationInFrames={durationInFrames}>
      <Sfx file="pop.wav" at={tSofr} volume={0.4} />
      <Sfx file="pop.wav" at={tIorb} volume={0.4} />
      <Sfx file="chime.wav" at={t3} volume={0.45} />
      <Sfx file="bass.wav" at={t12} volume={0.5} />
      <Sfx file="tick.wav" at={tCal} volume={0.4} />
      <Sfx file="tick.wav" at={tFin} volume={0.4} />

      <Beat from={0} style={{ left: 0, top: 0 }}>
        <div style={{ position: "relative", width: STAGE_W, height: 690 }}>
          <div style={{ position: "absolute", left: 60, top: 10 }}>
            <Pop at={tEx}>
              <RateAxis
                min={5.3}
                max={5.56}
                width={1000}
                marks={[
                  { v: spike ? 5.52 : 5.37, t: spike ? "SOFR 5,52" : "SOFR 5,37", color: spike ? C.negative : C.context, show: frame >= tSofr },
                  { v: 5.4, t: "IORB 5,40", color: C.positive, show: frame >= tIorb },
                ]}
              />
            </Pop>
          </div>
          <div style={{ position: "absolute", left: 1120, top: 10, width: 600, display: "flex", flexDirection: "column", gap: 16 }}>
            {frame >= tCalc && !spike && (
              <Pop at={tCalc}>
                <div style={{ fontFamily: theme.mono, fontSize: 34, fontWeight: 900, color: C.textPrimary }}>5,37 − 5,40 = −0,03 pt</div>
              </Pop>
            )}
            {frame >= t3 && !spike && (
              <Pop at={t3}>
                <Pill text="= −3 points de base" size={30} filled />
              </Pop>
            )}
            {frame >= tRien && !spike && <Label size={26} color={C.positive}>rien d&apos;anormal</Label>}
            {spike && (
              <Pop at={t12}>
                <Big size={60} color={C.negative}>+12 pb</Big>
              </Pop>
            )}
          </div>
          {frame >= tH && (
            <div style={{ position: "absolute", left: 80, top: 250 }}>
              <Pop at={tH}>
                <div style={{ position: "relative" }}>
                  <Person size={220} color={C.accent} label="Hachim" />
                  <div style={{ position: "absolute", left: 160, top: -10 }}>
                    <Bubble text={frame >= tAvant ? "Hmm… vérifions d'abord" : "Crise de financement !?"} width={330} tone={frame >= tAvant ? C.accentBright : C.negative} tail="left" />
                  </div>
                </div>
              </Pop>
            </div>
          )}
          {frame >= tAvant && (
            <div style={{ position: "absolute", left: 700, top: 300, display: "flex", gap: 30, alignItems: "center" }}>
              <Pop at={tCal}>
                <div style={{ transform: "scale(0.6)", transformOrigin: "left center" }}>
                  <CalendarPage top="RÈGLEMENT" big="15" size={220} />
                </div>
              </Pop>
              <Pop at={tFin}>
                <div style={{ transform: "scale(0.6)", transformOrigin: "left center" }}>
                  <CalendarPage top="FIN DE T." big="30" size={220} />
                </div>
              </Pop>
              {frame >= tSeul && <Stamp at={tSeul} text="1 JOUR ≠ STRESS PERSISTANT" color={C.accentBright} size={28} />}
            </div>
          )}
          {frame >= tDiag && (
            <div style={{ position: "absolute", left: 0, right: 0, top: 600, display: "flex", justifyContent: "center" }}>
              <Pop at={tDiag}>
                <Pill text="un prix relatif de diagnostic · pas une relation directe avec l'or" size={28} />
              </Pop>
            </div>
          )}
        </div>
      </Beat>
    </SceneShell>
  );
};
