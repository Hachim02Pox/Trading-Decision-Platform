// F11 v5 — part 4: using the map in Hachim's trading (conversion, playbook, scenarios, routine, pitfalls).
import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { theme } from "../theme";
import { Sfx, makeCue, Panel, GoldBarIcon, TerminalGlyph, useBreathe } from "./shared";
import type { SceneProps } from "./shared";
import { Beat, Pop, ClockIcon, DocIcon, clamp } from "./characters";
import { SceneShell, Center, Big, Label, STAGE_W } from "./stage";
import { Pill, Stamp, CalendarPage, CrossDraw } from "./props5";
import { CalcLine } from "./props11";
import { Ladder, CheckItem, Road, GexChart } from "./dash";

const C = theme.colors;
const S: React.FC<{ children: React.ReactNode }> = ({ children }) => <div style={{ position: "relative", width: STAGE_W, height: 690 }}>{children}</div>;
const At: React.FC<{ x: number; y: number; children: React.ReactNode; w?: number }> = ({ x, y, children, w }) => (
  <div style={{ position: "absolute", left: x, top: y, width: w }}>{children}</div>
);
const PlanRow: React.FC<{ at: number; k: string; v: string; col?: string }> = ({ at, k, v, col = C.textPrimary }) => {
  const frame = useCurrentFrame();
  if (frame < at) return null;
  return (
    <Pop at={at}>
      <div style={{ display: "grid", gridTemplateColumns: "180px 1fr", gap: 12, padding: "8px 14px", borderRadius: 10, background: C.panel, border: `1.5px solid ${C.hairline}`, alignItems: "baseline" }}>
        <span style={{ color: C.textSecondary, fontSize: 21, fontWeight: 700 }}>{k}</span>
        <span style={{ color: col, fontSize: 24, fontWeight: 800 }}>{v}</span>
      </div>
    </Pop>
  );
};

// ---------------------------------------------------------------------------
export const GldToGold: React.FC<SceneProps> = ({ words, durationInFrames }) => {
  const frame = useCurrentFrame();
  const cue = makeCue(words);
  const tNot = cue("tu ne trades pas gld");
  const tHow = cue("comment transposer");
  const tShare = cue("une part de gld represente");
  const tFades = cue("et cette fraction diminue");
  const tRatioNotFixed = cue("donc le rapport");
  const tMethod = cue("la methode");
  const tMult = cue("puis tu multiplies");
  const tEx = cue("exemple avec des chiffres ronds");
  const tSpot = cue("imaginons l or au comptant");
  const tRatio = cue("le rapport vaut environ");
  const tWall = cue("le mur de", tRatio);
  const tFlip = cue("la bascule de", tRatio);
  const tBear = cue("le danger baissier de", tRatio);
  const tBull = cue("et l objectif de derive de", tRatio);
  const tThree = cue("trois precautions");
  const tP1 = cue("un fais le calcul");
  const tP2 = cue("deux si tu trades");
  const tP3 = cue("trois ces niveaux convertis");
  const tForget = cue("et n oublie pas");
  const tBoth = cue("si les deux cartes");
  const ROWS: Array<{ at: number; name: string; gld: string; gold: string; col: string }> = [
    { at: tWall, name: "mur", gld: "390", gold: "≈ 4 255", col: C.negative },
    { at: tFlip, name: "bascule", gld: "394,84", gold: "≈ 4 308", col: C.violet },
    { at: tBear, name: "danger baissier", gld: "385", gold: "≈ 4 201", col: C.negative },
    { at: tBull, name: "dérive haussière", gld: "405", gold: "≈ 4 419", col: C.positive },
  ];
  return (
    <SceneShell eyebrow="F11 · Dans ton trading · étape 0" title="Des niveaux GLD aux niveaux de l'or" durationInFrames={durationInFrames}>
      <Sfx file="pop.wav" at={tShare} volume={0.35} />
      <Sfx file="whoosh.wav" at={tMethod} volume={0.4} />
      <Sfx file="chime.wav" at={tRatio} volume={0.45} />
      <Sfx file="tick.wav" at={tWall} volume={0.3} />
      <Sfx file="tick.wav" at={tFlip} volume={0.3} />
      <Sfx file="tick.wav" at={tBear} volume={0.3} />
      <Sfx file="tick.wav" at={tBull} volume={0.3} />
      <Sfx file="pop.wav" at={tThree} volume={0.4} />
      <Beat from={tNot} to={tEx} style={{ left: 0, top: 0 }}>
        <S>
          <At x={80} y={30}>
            <Pop at={tShare}>
              <div style={{ display: "flex", alignItems: "center", gap: 30 }}>
                <GoldBarIcon size={200} />
                <div>
                  <Big size={40}>1 part GLD</Big>
                  <Label size={28} color={C.textPrimary}>≈ un peu moins d&apos;1/10 d&apos;once</Label>
                  {frame >= tFades && <Label size={24} color={C.amber}>diminue lentement (frais du fonds)</Label>}
                </div>
              </div>
            </Pop>
          </At>
          {frame >= tRatioNotFixed && (
            <At x={80} y={300}>
              <Pop at={tRatioNotFixed}>
                <Pill text="rapport or / GLD : pas fixe → à recalculer" size={30} color={C.amber} />
              </Pop>
            </At>
          )}
          {frame >= tMethod && (
            <At x={900} y={60} w={800}>
              <Pop at={tMethod}>
                <Panel glow>
                  <Big size={36}>rapport = prix de l&apos;or ÷ prix de GLD</Big>
                  <Label size={24}>(au même moment)</Label>
                  {frame >= tMult && <Big size={36} color={C.accentBright}>niveau or = niveau GLD × rapport</Big>}
                </Panel>
              </Pop>
            </At>
          )}
        </S>
      </Beat>
      <Beat from={tEx} to={tThree} style={{ left: 0, top: 0 }}>
        <S>
          <At x={80} y={10} w={1600}>
            <Pill text="exemple illustratif · chiffres ronds" size={24} color={C.textSecondary} />
            <CalcLine at={tSpot} left="or 4 250 $ ÷ GLD 389,51 $ ≈" right="10,91" size={44} />
          </At>
          <At x={80} y={170} w={1300}>
            <div style={{ display: "grid", gridTemplateColumns: "340px 220px 190px 260px", gap: 14, alignItems: "center" }}>
              <span />
              <Label size={24}>GLD</Label>
              <span />
              <Label size={24}>or</Label>
              {ROWS.map((r) =>
                frame >= r.at ? (
                  <React.Fragment key={r.name}>
                    <Pop at={r.at}>
                      <Big size={32} color={r.col}>{r.name}</Big>
                    </Pop>
                    <Pop at={r.at}>
                      <Big size={36}>{r.gld}</Big>
                    </Pop>
                    <Pop at={r.at + 8}>
                      <Big size={32} color={C.textMuted}>× 10,91</Big>
                    </Pop>
                    <Pop at={r.at + 16}>
                      <Big size={40} color={C.accentBright}>{r.gold}</Big>
                    </Pop>
                  </React.Fragment>
                ) : null,
              )}
            </div>
          </At>
        </S>
      </Beat>
      <Beat from={tThree} style={{ left: 0, top: 0 }}>
        <S>
          <At x={80} y={10} w={1600}>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <CheckItem at={tP1} n="1" text="des prix pris au même moment" sub="GLD : séance américaine seulement · l'or : presque 24 h / 24" width={1500} />
              <CheckItem at={tP2} n="2" text="contrat à terme ? calcule le rapport avec SON prix" sub="un peu au-dessus du comptant (coût de portage)" width={1500} />
              <CheckItem at={tP3} n="3" text="des zones, pas des lignes" sub="quelques dollars de marge de chaque côté, sur l'or" width={1500} />
            </div>
          </At>
          {frame >= tForget && (
            <At x={80} y={450} w={1600}>
              <Pop at={tForget}>
                <Panel style={{ display: "flex", gap: 30, alignItems: "center" }}>
                  <Label size={28} color={C.textPrimary}>options GLD ≠ options sur contrats à terme (New York) : deux cartes</Label>
                  {frame >= tBoth && <Pill text="même niveau sur les deux → zone plus solide" size={28} filled />}
                </Panel>
              </Pop>
            </At>
          )}
        </S>
      </Beat>
    </SceneShell>
  );
};

// ---------------------------------------------------------------------------
export const Playbook: React.FC<SceneProps> = ({ words, durationInFrames }) => {
  const frame = useCurrentFrame();
  const cue = makeCue(words);
  const tQ = cue("maintenant la vraie question");
  const tRule = cue("voici la regle d or");
  const tElse = cue("la direction vient d ailleurs");
  const tFour = cue("pense en quatre etages");
  const t1 = cue("etage un le pourquoi");
  const t2 = cue("etage deux le comment");
  const t3 = cue("etage trois le ou");
  const t4 = cue("etage quatre le quand");
  const tCombo = cue("et maintenant les combinaisons");
  const tBearNeg = cue("biais baissier et gamma negatif");
  const tBullNeg = cue("biais haussier mais gamma negatif");
  const tIce = cue("sinon tu achetes sur de la glace");
  const tPos = cue("gamma positif quel que soit");
  const tSize = cue("et une regle de taille");
  const FLOORS = [
    { at: t1, n: "1", t: "POURQUOI · la direction", s: "ton terminal : F2 taux réels · F3 Fed · F6 dollar · F7 risque", col: C.accentBright, icon: <TerminalGlyph size={60} /> },
    { at: t2, n: "2", t: "COMMENT · le régime", s: "+γ : retour au centre · −γ : mouvements qui s'emballent", col: C.violet, icon: <Big size={44} color={C.violet}>γ</Big> },
    { at: t3, n: "3", t: "OÙ · les niveaux", s: "bascule · murs · grosses barres → convertis en or → croisés avec ton graphique", col: C.positive, icon: <Big size={44} color={C.positive}>≡</Big> },
    { at: t4, n: "4", t: "QUAND · le moment", s: "échéances d'options · calendrier F13", col: C.amber, icon: <ClockIcon size={60} /> },
  ];
  return (
    <SceneShell eyebrow="F11 · Dans ton trading" title="La carte ne donne pas la direction" durationInFrames={durationInFrames}>
      <Sfx file="bass.wav" at={tRule} volume={0.4} />
      <Sfx file="pop.wav" at={t1} volume={0.35} />
      <Sfx file="pop.wav" at={t2} volume={0.35} />
      <Sfx file="pop.wav" at={t3} volume={0.35} />
      <Sfx file="pop.wav" at={t4} volume={0.35} />
      <Sfx file="whoosh.wav" at={tCombo} volume={0.4} />
      <Sfx file="chime.wav" at={tSize} volume={0.45} />
      <Beat from={tQ} to={tFour} style={{ left: 0, top: 0 }}>
        <Center column gap={30}>
          <Big size={54} glow>la carte des options dit COMMENT et OÙ</Big>
          {frame >= tElse && (
            <Pop at={tElse}>
              <Big size={46} color={C.accentBright}>la direction vient d&apos;ailleurs</Big>
            </Pop>
          )}
        </Center>
      </Beat>
      <Beat from={tFour} to={tCombo} style={{ left: 0, top: 0 }}>
        <S>
          <At x={140} y={0} w={1460}>
            <div style={{ display: "flex", flexDirection: "column-reverse", gap: 14 }}>
              {FLOORS.map((f) =>
                frame >= f.at ? (
                  <Pop key={f.n} at={f.at}>
                    <Panel glow={frame < f.at + 150} style={{ display: "flex", alignItems: "center", gap: 26, padding: "14px 26px", borderColor: f.col }}>
                      <div style={{ width: 70, display: "flex", justifyContent: "center" }}>{f.icon}</div>
                      <div>
                        <div style={{ color: f.col, fontSize: 32, fontWeight: 900 }}>
                          étage {f.n} · {f.t}
                        </div>
                        <div style={{ color: C.textSecondary, fontSize: 23, marginTop: 4 }}>{f.s}</div>
                      </div>
                    </Panel>
                  </Pop>
                ) : (
                  <div key={f.n} style={{ height: 104 }} />
                ),
              )}
            </div>
          </At>
        </S>
      </Beat>
      <Beat from={tCombo} to={tSize} style={{ left: 0, top: 0 }}>
        <S>
          <At x={40} y={20} w={1660}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 24 }}>
              {frame >= tBearNeg && (
                <Pop at={tBearNeg}>
                  <Panel style={{ borderColor: C.negative, minHeight: 360 }}>
                    <Big size={30} color={C.negative}>biais baissier + −γ</Big>
                    <Label size={25} color={C.textPrimary}>le terrain le plus favorable pour suivre une cassure à la baisse</Label>
                    <Label size={23}>les couvertures vont dans ton sens</Label>
                  </Panel>
                </Pop>
              )}
              {frame >= tBullNeg && (
                <Pop at={tBullNeg}>
                  <Panel style={{ borderColor: C.amber, minHeight: 360 }}>
                    <Big size={30} color={C.amber}>biais haussier + −γ (sous la bascule)</Big>
                    <Label size={25} color={C.textPrimary}>prudence : attends que le prix reprenne la bascule</Label>
                    {frame >= tIce && <Label size={23} color={C.ice}>sinon : tu achètes sur de la glace</Label>}
                  </Panel>
                </Pop>
              )}
              {frame >= tPos && (
                <Pop at={tPos}>
                  <Panel style={{ borderColor: C.positive, minHeight: 360 }}>
                    <Big size={30} color={C.positive}>+γ, quel que soit le biais</Big>
                    <Label size={25} color={C.textPrimary}>marché freiné : travaille les extrêmes du range</Label>
                    <Label size={23}>objectifs modestes · pas de course aux cassures</Label>
                  </Panel>
                </Pop>
              )}
            </div>
          </At>
        </S>
      </Beat>
      <Beat from={tSize} style={{ left: 0, top: 0 }}>
        <Center gap={100}>
          <div style={{ textAlign: "center" }}>
            <Label size={26}>+γ · stop serré</Label>
            <div style={{ display: "flex", gap: 20, alignItems: "flex-end", height: 320, justifyContent: "center" }}>
              <div style={{ width: 90, height: 100, background: C.negative, borderRadius: 8 }} />
              <div style={{ width: 90, height: 300, background: C.accent, borderRadius: 8 }} />
            </div>
            <Label size={24}>stop · taille</Label>
          </div>
          <div style={{ textAlign: "center" }}>
            <Label size={26}>−γ · stop large</Label>
            <div style={{ display: "flex", gap: 20, alignItems: "flex-end", height: 320, justifyContent: "center" }}>
              <div style={{ width: 90, height: 300 * interpolate(frame, [tSize + 30, tSize + 60], [0.33, 1], clamp), background: C.negative, borderRadius: 8 }} />
              <div style={{ width: 90, height: 300 * interpolate(frame, [tSize + 30, tSize + 60], [1, 0.33], clamp), background: C.accent, borderRadius: 8 }} />
            </div>
            <Label size={24}>stop · taille</Label>
          </div>
          <Big size={40}>même montant risqué</Big>
        </Center>
      </Beat>
    </SceneShell>
  );
};

// ---------------------------------------------------------------------------
export const ScenarioBear: React.FC<SceneProps> = ({ words, durationInFrames }) => {
  const frame = useCurrentFrame();
  const cue = makeCue(words);
  const tGo = cue("mettons tout ca en pratique");
  const tAdvice = cue("ce n est pas un conseil");
  const tCtx = cue("le contexte");
  const tBias = cue("et imaginons que ton terminal");
  const tTrig = cue("le declencheur");
  const tProof = cue("tu attends une preuve");
  const tFlipRole = cue("le plancher devient un plafond");
  const tEntry = cue("l entree dans l exemple");
  const tStop = cue("le stop");
  const tStopAt = cue("mettons le stop a");
  const tTargets = cue("les objectifs");
  const tT1 = cue("premier objectif");
  const tT2 = cue("deuxieme objectif");
  const tGold = cue("en or avec le rapport");
  const tMgmt = cue("la gestion");
  const tPartial = cue("prendre une partie des gains");
  const tSize = cue("et la taille");
  const tRule = cue("c est le stop qui fixe la taille");
  return (
    <SceneShell eyebrow="F11 · Scénario A · exercice de lecture" title="La cassure baissière sous 390" durationInFrames={durationInFrames}>
      <Sfx file="bass.wav" at={tAdvice} volume={0.35} />
      <Sfx file="pop.wav" at={tTrig} volume={0.35} />
      <Sfx file="click.wav" at={tEntry} volume={0.45} />
      <Sfx file="tick.wav" at={tStopAt} volume={0.4} />
      <Sfx file="chime.wav" at={tT1} volume={0.4} />
      <Sfx file="chime.wav" at={tT2} volume={0.4} />
      <Sfx file="bass.wav" at={tRule} volume={0.4} />
      <S>
        <At x={20} y={0}>
          <Ladder
            lo={376}
            hi={397}
            height={frame >= tSize ? 470 : 640}
            width={1000}
            zones={[{ from: 376, to: FLIP_Z, color: C.negative, at: tCtx, label: "−γ" }]}
            levels={[
              { v: 394.84, t: "bascule", color: C.violet, at: tCtx },
              { v: 390, t: "nœud / mur", color: C.amber, at: tCtx + 20, right: true },
              { v: 392.5, t: "stop 392,50", color: C.negative, at: tStopAt, dash: false },
              { v: 389, t: "entrée ≈ 389", color: C.textPrimary, at: tEntry, dash: false, right: true },
              { v: 385, t: "objectif 1 · 385", color: C.positive, at: tT1 },
              { v: 380, t: "objectif 2 · 380", color: C.positive, at: tT2 },
            ]}
            price={{
              path: [
                [tCtx, 389.5],
                [tProof, 389.6],
                [tProof + 40, 387.6],
                [tFlipRole - 20, 389.9],
                [tFlipRole + 20, 389],
                [tStop, 388.6],
                [tT1, 386.2],
                [tT1 + 60, 385],
                [tT2, 383],
                [tT2 + 60, 380.5],
              ],
            }}
          />
        </At>
        <At x={1080} y={0} w={630}>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {frame >= tAdvice && (
              <Pop at={tAdvice}>
                <Pill text="exercice de lecture · pas un conseil" size={24} color={C.amber} />
              </Pop>
            )}
            <PlanRow at={tCtx} k="contexte" v="389,51 < bascule 394,84 · −γ · nœud 390" />
            <PlanRow at={tBias} k="biais (terminal)" v="baissier : taux réels ↑, dollar ferme" col={C.negative} />
            <PlanRow at={tTrig} k="déclencheur" v="cassure sous 389 + retour sur 390 qui échoue" />
            <PlanRow at={tEntry} k="entrée" v="≈ 389" />
            <PlanRow at={tStopAt} k="stop" v="392,50 · risque 3,50 $" col={C.negative} />
            <PlanRow at={tT1} k="objectif 1" v="385 · +4 $" col={C.positive} />
            <PlanRow at={tT2} k="objectif 2" v="380 · +9 $ · > 2,5 × le risque" col={C.positive} />
            <PlanRow at={tGold} k="en or (× 10,91)" v="4 244 · stop 4 283 · 4 201 / 4 146" col={C.accentBright} />
            {frame >= tMgmt && (
              <Pop at={tMgmt}>
                <Pill text={frame >= tPartial ? "−γ : ça va vite… dans les deux sens · partiel à l'objectif 1" : "−γ : ça peut aller vite"} size={22} />
              </Pop>
            )}
          </div>
        </At>
        {frame >= tSize && (
          <At x={140} y={530} w={880}>
            <Pop at={tSize}>
              <Panel glow style={{ padding: "14px 22px" }}>
                <Label size={24} color={C.textPrimary}>risque accepté : 30 $ · stop ≈ 38 $ sur l&apos;or</Label>
                <Label size={24}>→ taille ajustée pour que 38 $ de mouvement coûtent ≤ 30 $</Label>
                {frame >= tRule && <Big size={34} color={C.accentBright}>le stop fixe la taille · jamais l&apos;inverse</Big>}
              </Panel>
            </Pop>
          </At>
        )}
      </S>
    </SceneShell>
  );
};
const FLIP_Z = 394.84;

// ---------------------------------------------------------------------------
export const ScenarioBull: React.FC<SceneProps> = ({ words, durationInFrames }) => {
  const frame = useCurrentFrame();
  const cue = makeCue(words);
  const tGo = cue("deuxieme scenario la reprise");
  const tHolds = cue("cette fois le mur de");
  const tMacro = cue("et imagine que ce mouvement");
  const tChange = cue("qu est ce qui change");
  const tAbove = cue("au dessus de la bascule du gamma");
  const tConseq = cue("consequence directe");
  const tPlan = cue("le plan type");
  const tEnter = cue("et entrer si ce support tient");
  const tStop = cue("le stop sous");
  const tTargets = cue("les objectifs la zone");
  const t405 = cue("l objectif de derive haussiere de la vanna");
  const tDiff = cue("tu remarques la difference");
  const tNot430 = cue("on ne vise pas");
  const tGold = cue("en or avec le meme rapport");
  const tNoMacro = cue("et si le prix repasse au dessus de la bascule sans");
  return (
    <SceneShell eyebrow="F11 · Scénario B · exercice de lecture" title="La reprise de la bascule" durationInFrames={durationInFrames}>
      <Sfx file="pop.wav" at={tHolds} volume={0.35} />
      <Sfx file="chime.wav" at={tAbove} volume={0.45} />
      <Sfx file="click.wav" at={tEnter} volume={0.45} />
      <Sfx file="tick.wav" at={tStop} volume={0.4} />
      <Sfx file="chime.wav" at={tTargets} volume={0.4} />
      <Sfx file="bass.wav" at={tNoMacro} volume={0.4} />
      <S>
        <At x={20} y={0}>
          <Ladder
            lo={386}
            hi={407}
            height={640}
            width={1000}
            zones={[
              { from: FLIP_Z, to: 407, color: C.positive, at: tAbove, label: "+γ · amortisseur" },
              { from: 400, to: 403, color: C.positive, at: tTargets },
            ]}
            levels={[
              { v: 390, t: "mur 390", color: C.amber, at: tHolds, right: true },
              { v: 394.84, t: "bascule gamma", color: C.violet, at: tGo },
              { v: 394.4, t: "bascule delta", color: C.flipBlue, at: tAbove, right: true },
              { v: 392, t: "stop sous 392", color: C.negative, at: tStop, dash: false },
              { v: 405, t: "dérive haussière 405", color: C.positive, at: t405 },
            ]}
            price={{
              path: [
                [tGo, 389.5],
                [tHolds + 30, 389.3],
                [tHolds + 90, 391.5],
                [tMacro + 60, 396.2],
                [tPlan, 397],
                [tPlan + 90, 394.8],
                [tEnter + 30, 395.2],
                [tTargets, 399.5],
                [t405, 402.5],
                [t405 + 80, 404.5],
              ],
            }}
          />
        </At>
        <At x={1080} y={0} w={630}>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <PlanRow at={tHolds} k="setup" v="390 tient · reprise de 390 puis de 394,84" />
            <PlanRow at={tMacro} k="macro" v="chiffres qui soutiennent l'or" col={C.positive} />
            <PlanRow at={tAbove} k="régime" v="+γ au-dessus des deux bascules" col={C.positive} />
            <PlanRow at={tConseq} k="conséquence" v="ne cours pas après la hausse" col={C.amber} />
            <PlanRow at={tPlan} k="entrée" v="repli vers 394-395 (ancienne bascule = support)" />
            <PlanRow at={tStop} k="stop" v="sous 392 (retour en −γ)" col={C.negative} />
            <PlanRow at={tTargets} k="objectifs" v="400-403 (options d'achat) puis 405" col={C.positive} />
            <PlanRow at={tGold} k="en or (× 10,91)" v="4 299-4 310 · stop 4 277 · 4 364-4 397 · 4 419" col={C.accentBright} />
          </div>
        </At>
        {frame >= tDiff && frame < tGold && (
          <At x={160} y={500} w={860}>
            <Pop at={tDiff}>
              <Panel glow style={{ padding: "14px 22px" }}>
                <Label size={26} color={C.textPrimary}>+γ : objectifs plus proches, plus réalistes</Label>
                {frame >= tNot430 && <Big size={32} color={C.accentBright}>pas 430 · la prochaine zone d&apos;options</Big>}
              </Panel>
            </Pop>
          </At>
        )}
        {frame >= tNoMacro && (
          <At x={160} y={500} w={860}>
            <Pop at={tNoMacro}>
              <Panel style={{ padding: "14px 22px", borderColor: C.negative }}>
                <Label size={26} color={C.textPrimary}>sans soutien macro = mouvement de couverture, pas une tendance</Label>
                <Label size={24}>plus petite taille · objectifs plus courts · ou pas de trade</Label>
              </Panel>
            </Pop>
          </At>
        )}
      </S>
    </SceneShell>
  );
};

// ---------------------------------------------------------------------------
export const ScenarioPin: React.FC<SceneProps> = ({ words, durationInFrames }) => {
  const frame = useCurrentFrame();
  const cue = makeCue(words);
  const tGo = cue("troisieme scenario souvent oublie");
  const tDay = cue("le 24 septembre est un jour");
  const tNear = cue("du plus gros prix d exercice");
  const tSitu = cue("dans cette situation");
  const tMagnet = cue("on parle d aimantation");
  const tTrap = cue("pour un trader c est un piege");
  const tSell = cue("tu vois une petite cassure");
  const tBuy = cue("tu vois une petite poussee");
  const tChop = cue("tu te fais decouper");
  const tRight = cue("la bonne reaction");
  const tNext = cue("parce que le lendemain");
  const tCase2 = cue("deuxieme cas particulier");
  const tCpi = cue("si l inflation ou la fed");
  const tAfter = cue("et juste apres l annonce");
  const tVanna = cue("avec la vanna");
  const tThree = cue("retiens donc trois moments");
  const tM1 = cue("juste avant une echeance");
  const tM2 = cue("juste apres une echeance");
  const tM3 = cue("et autour d une annonce macro");
  const pinPath: Array<[number, number]> = [];
  for (let k = 0; k <= 12; k++) {
    const f = tSitu + Math.round(((tRight - tSitu) * k) / 12);
    const v = k === 0 ? 389.5 : f >= tSell && f < tSell + 90 ? 388.1 : f >= tBuy && f < tBuy + 90 ? 391.8 : 390 + (k % 2 ? 0.6 : -0.5);
    pinPath.push([f, v]);
  }
  pinPath.sort((a, b) => a[0] - b[0]);
  return (
    <SceneShell eyebrow="F11 · Scénario C" title="Il ne se passe rien : l'aimant de 390" durationInFrames={durationInFrames}>
      <Sfx file="pop.wav" at={tDay} volume={0.35} />
      <Sfx file="chime.wav" at={tMagnet} volume={0.4} />
      <Sfx file="bass.wav" at={tSell + 60} volume={0.35} />
      <Sfx file="bass.wav" at={tBuy + 60} volume={0.35} />
      <Sfx file="whoosh.wav" at={tCase2} volume={0.4} />
      <Sfx file="pop.wav" at={tThree} volume={0.4} />
      <Beat from={tGo} to={tCase2} style={{ left: 0, top: 0 }}>
        <S>
          <At x={20} y={0}>
            <Ladder
              lo={386}
              hi={394}
              height={600}
              width={1000}
              levels={[{ v: 390, t: "nœud 390", color: C.amber, at: tDay }]}
              price={{ path: pinPath }}
            />
          </At>
          <At x={1080} y={0} w={630}>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {frame >= tDay && (
                <Pop at={tDay}>
                  <div style={{ display: "flex", gap: 14 }}>
                    <CalendarPage top="SEPT" big="24" size={130} />
                    <CalendarPage top="SEPT" big="25" size={130} />
                  </div>
                </Pop>
              )}
              <PlanRow at={tNear} k="distance" v="0,49 $ du plus gros prix d'exercice" col={C.amber} />
              <PlanRow at={tMagnet} k="effet" v="aimantation autour de 390" />
              <PlanRow at={tSell} k="vente à 388" v="le prix revient à 390 ✗" col={C.negative} />
              <PlanRow at={tBuy} k="achat à 392" v="le prix revient à 390 ✗" col={C.negative} />
              {frame >= tChop && (
                <Pop at={tChop}>
                  <Pill text="découpé dans les deux sens" size={28} color={C.negative} filled />
                </Pop>
              )}
              <PlanRow at={tRight} k="bonne réaction" v="réduire · ne pas trader · attendre la séance d'après" col={C.positive} />
              <PlanRow at={tNext} k="lendemain" v="nœud en partie disparu · carte redessinée" col={C.accentBright} />
            </div>
          </At>
        </S>
      </Beat>
      <Beat from={tCase2} to={tThree} style={{ left: 0, top: 0 }}>
        <Center gap={60}>
          <Pop at={tCpi}>
            <CalendarPage top="INFLATION" big="8:30" size={260} />
          </Pop>
          <div style={{ display: "flex", flexDirection: "column", gap: 20, width: 900 }}>
            {frame >= tCpi && <Pill text="l'annonce domine · la carte passe au second plan" size={28} />}
            {frame >= tAfter && (
              <Pop at={tAfter}>
                <Panel style={{ borderColor: C.violet }}>
                  <Label size={26} color={C.textPrimary}>juste après : la volatilité implicite retombe d&apos;un coup</Label>
                  <div style={{ height: 120, position: "relative", marginTop: 10 }}>
                    <svg width={700} height={120}>
                      <path d={`M0,20 L${280},20 L${320},100 L700,100`} stroke={C.violet} strokeWidth={5} fill="none" />
                    </svg>
                  </div>
                  {frame >= tVanna && <Label size={24}>vanna → couvertures modifiées → soutien possible (mécanisme classique)</Label>}
                </Panel>
              </Pop>
            )}
          </div>
        </Center>
      </Beat>
      <Beat from={tThree} style={{ left: 0, top: 0 }}>
        <Center column gap={18}>
          <Big size={44}>3 moments où la carte est moins fiable</Big>
          <CheckItem at={tM1} n="1" text="juste avant une échéance" sub="tout est aimanté vers le nœud" color={C.amber} width={1100} />
          <CheckItem at={tM2} n="2" text="juste après une échéance" sub="la carte a changé" color={C.violet} width={1100} />
          <CheckItem at={tM3} n="3" text="autour d'une annonce macro" sub="la nouvelle domine tout" color={C.negative} width={1100} />
        </Center>
      </Beat>
    </SceneShell>
  );
};

// ---------------------------------------------------------------------------
export const Routine: React.FC<SceneProps> = ({ words, durationInFrames }) => {
  const frame = useCurrentFrame();
  const cue = makeCue(words);
  const tGo = cue("construisons une routine");
  const t1 = cue("etape un le terminal");
  const t2 = cue("etape deux le tableau des options");
  const tFour = cue("tu notes quatre choses");
  const tTime = cue("regarde aussi l heure");
  const tMorning = cue("donc la carte du matin");
  const t3 = cue("etape trois la conversion");
  const t4 = cue("etape quatre le graphique");
  const tCoinc = cue("une zone d options qui coincide");
  const t5 = cue("etape cinq les scenarios");
  const t6 = cue("etape six la taille");
  const t7 = cue("et etape sept le journal");
  const tWhy = cue("pourquoi parce que dans trois mois");
  const tOwn = cue("tu auras tes propres chiffres");
  const tThat = cue("c est ca integrer");
  return (
    <SceneShell eyebrow="F11 · Routine quotidienne · 10 minutes" title="Chaque jour de trading, dans cet ordre" durationInFrames={durationInFrames}>
      <Sfx file="pop.wav" at={t1} volume={0.35} />
      <Sfx file="pop.wav" at={t2} volume={0.35} />
      <Sfx file="pop.wav" at={t3} volume={0.35} />
      <Sfx file="pop.wav" at={t4} volume={0.35} />
      <Sfx file="pop.wav" at={t5} volume={0.35} />
      <Sfx file="pop.wav" at={t6} volume={0.35} />
      <Sfx file="pop.wav" at={t7} volume={0.35} />
      <Sfx file="chime.wav" at={tOwn} volume={0.45} />
      <Beat from={tGo} to={tWhy} style={{ left: 0, top: 0 }}>
        <S>
          <At x={20} y={0} w={840}>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <CheckItem at={t1} n="1" text="terminal : synthèse macro + F13" sub="une annonce aujourd'hui ? à quelle heure ?" width={820} />
              <CheckItem at={t2} n="2" text="tableau des options : 4 choses" sub={frame >= tFour ? "régime · bascule · mur au-dessus / en dessous · échéances" : ""} width={820} />
              <CheckItem at={t3} n="3" text="conversion en prix de l'or" sub="rapport or ÷ GLD du moment" width={820} />
              <CheckItem at={t4} n="4" text="tracer les zones sur ton graphique" sub={frame >= tCoinc ? "zone d'options + ancien support = plus solide" : ""} width={820} />
            </div>
          </At>
          <At x={890} y={0} w={820}>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <CheckItem at={t5} n="5" text="écrire 2-3 scénarios avant l'ouverture" sub="casse ici → … · reprend là → … · colle au nœud → rien" width={820} />
              <CheckItem at={t6} n="6" text="la taille" sub="−γ : stop large, taille petite · +γ : objectifs courts" width={820} />
              <CheckItem at={t7} n="7" text="le journal" sub="dans les notes de chaque trade : régime + position vs bascule" width={820} />
            </div>
          </At>
          {frame >= tTime && frame < t3 && (
            <At x={890} y={60} w={820}>
              <Pop at={tTime}>
                <Panel glow>
                  <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
                    <ClockIcon size={90} />
                    <div>
                      <Label size={26} color={C.textPrimary}>calcul : 11 h 29 · intérêt ouvert : 1×/jour, après la séance</Label>
                      {frame >= tMorning && <Label size={24} color={C.amber}>la carte du matin = les positions de la veille</Label>}
                    </div>
                  </div>
                </Panel>
              </Pop>
            </At>
          )}
          {frame >= t7 && (
            <At x={890} y={430} w={820}>
              <Pop at={t7 + 20}>
                <Panel style={{ padding: "16px 20px", background: "#efece4" }}>
                  <div style={{ color: "#555", fontFamily: theme.mono, fontSize: 18 }}>JOURNAL · notes du trade</div>
                  <div style={{ color: "#1a1a1a", fontSize: 24, fontWeight: 700, marginTop: 6 }}>régime −γ · prix sous la bascule (389,51 &lt; 394,84) · nœud 390, échéance du jour</div>
                </Panel>
              </Pop>
            </At>
          )}
        </S>
      </Beat>
      <Beat from={tWhy} style={{ left: 0, top: 0 }}>
        <Center column gap={30}>
          <div style={{ display: "flex", gap: 40, alignItems: "flex-end" }}>
            {[
              { l: "trades en −γ", v: 0.62, col: C.negative },
              { l: "trades en +γ", v: 0.48, col: C.positive },
            ].map((b, i) => (
              <div key={b.l} style={{ textAlign: "center" }}>
                <div style={{ width: 200, height: 300 * b.v * interpolate(frame, [tWhy + 30 + i * 20, tWhy + 60 + i * 20], [0, 1], clamp), background: b.col, borderRadius: 10 }} />
                <Label size={24} color={C.textPrimary}>{b.l}</Label>
              </div>
            ))}
            <Label size={22}>(chiffres fictifs : ceux que TON journal te donnera)</Label>
          </div>
          {frame >= tOwn && (
            <Pop at={tOwn}>
              <Big size={46} color={C.accentBright}>tes propres chiffres · plus besoin de croire le site</Big>
            </Pop>
          )}
          {frame >= tThat && <Label size={30} color={C.textPrimary}>c&apos;est ça, intégrer un outil dans son trading</Label>}
        </Center>
      </Beat>
    </SceneShell>
  );
};

// ---------------------------------------------------------------------------
export const MistakesGex: React.FC<SceneProps> = ({ words, durationInFrames }) => {
  const frame = useCurrentFrame();
  const cue = makeCue(words);
  const tGo = cue("les pieges les plus frequents");
  const ats = ["piege un", "piege deux", "piege trois", "piege quatre", "piege cinq", "piege six", "piege sept", "piege huit", "et piege neuf"].map((p) => cue(p));
  const tEnd = cue("si tu evites ces neuf pieges");
  const TRAPS = [
    "prendre la carte pour la réalité",
    "un mur = une ligne exacte",
    "oublier les échéances",
    "chercher une direction dans la carte",
    "niveaux GLD sur l'or sans conversion",
    "croire le texte généré sur parole",
    "trader la « douleur maximale »",
    "utiliser une carte périmée",
    "augmenter la taille « parce que le niveau est solide »",
  ];
  return (
    <SceneShell eyebrow="F11 · Pièges" title="Neuf façons de mal utiliser une carte gamma" durationInFrames={durationInFrames}>
      {ats.map((a, i) => (
        <Sfx key={i} file={i === 8 ? "bass.wav" : "pop.wav"} at={a} volume={0.35} />
      ))}
      <Sfx file="chime.wav" at={tEnd} volume={0.45} />
      <S>
        <At x={20} y={0} w={1700}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 18 }}>
            {TRAPS.map((t, i) =>
              frame >= ats[i] ? (
                <Pop key={t} at={ats[i]}>
                  <div style={{ position: "relative", height: 150, padding: "16px 20px", borderRadius: 16, background: i === 8 ? `${C.negative}22` : C.panel, border: `2px solid ${i === 8 ? C.negative : C.hairline}` }}>
                    <div style={{ color: C.negative, fontFamily: theme.mono, fontSize: 24, fontWeight: 900 }}>piège {i + 1}</div>
                    <div style={{ color: C.textPrimary, fontSize: 27, fontWeight: 800, marginTop: 6, lineHeight: 1.25 }}>{t}</div>
                    <div style={{ position: "absolute", right: 14, top: 12 }}>
                      <CrossDraw at={ats[i] + 20} size={44} />
                    </div>
                  </div>
                </Pop>
              ) : (
                <div key={t} style={{ height: 150 }} />
              ),
            )}
          </div>
        </At>
        {frame >= tEnd && (
          <At x={300} y={560}>
            <Pop at={tEnd}>
              <Pill text="évite-les : tu es déjà devant la plupart des gens" size={34} filled />
            </Pop>
          </At>
        )}
      </S>
    </SceneShell>
  );
};

// ---------------------------------------------------------------------------
export const GlossaryV5: React.FC<SceneProps> = ({ words, durationInFrames }) => {
  const frame = useCurrentFrame();
  const cue = makeCue(words);
  const T: Array<{ k: string; d: string; p: string; col: string }> = [
    { k: "option d'achat", d: "le droit d'acheter à un prix fixé", p: "option d achat le droit", col: C.positive },
    { k: "option de vente", d: "le droit de vendre à un prix fixé", p: "option de vente le droit", col: C.negative },
    { k: "prime", d: "le prix de l'option · × 100 sur GLD", p: "prime le prix", col: C.accentBright },
    { k: "prix d'exercice", d: "le niveau fixé par le contrat", p: "prix d exercice le niveau", col: C.accentBright },
    { k: "volatilité implicite", d: "une amplitude, jamais une direction", p: "volatilite implicite l agitation", col: C.amber },
    { k: "delta", d: "l'option bouge quand le prix bouge", p: "delta de combien", col: C.positive },
    { k: "gamma", d: "le delta bouge quand le prix bouge", p: "gamma de combien", col: C.accentBright },
    { k: "thêta", d: "ce que l'option perd chaque jour", p: "theta ce que", col: C.ice },
    { k: "véga", d: "ce qu'elle gagne si la volatilité monte", p: "vega ce qu elle", col: C.amber },
    { k: "vanna", d: "le delta bouge quand la volatilité bouge", p: "vanna le delta", col: C.violet },
    { k: "charme", d: "le delta bouge quand le temps passe", p: "charme le delta", col: C.positive },
    { k: "teneur de marché", d: "se couvre · ses couvertures bougent le prix", p: "teneur de marche l intermediaire", col: C.context },
    { k: "exposition gamma (GEX)", d: "couvertures à ajuster, par prix d'exercice", p: "exposition gamma l estimation", col: C.violet },
    { k: "exposition delta (DEX)", d: "le delta total du carnet, en dollars", p: "exposition delta le delta", col: C.flipBlue },
    { k: "bascule", d: "le prix où le régime change de signe", p: "bascule le prix", col: C.violet },
    { k: "mur", d: "le prix d'exercice le plus chargé", p: "mur le prix", col: C.amber },
    { k: "gamma +", d: "l'amortisseur", p: "gamma positif l amortisseur", col: C.positive },
    { k: "gamma −", d: "l'accélérateur", p: "gamma negatif l accelerateur", col: C.negative },
  ];
  const ats = T.map((t) => cue(t.p));
  let cur = -1;
  ats.forEach((a, i) => {
    if (frame >= a) cur = i;
  });
  return (
    <SceneShell eyebrow="F11 · Glossaire" title="Le vocabulaire, en rafale" durationInFrames={durationInFrames}>
      {ats.map((a, i) => (
        <Sfx key={i} file="tick.wav" at={a} volume={0.3} />
      ))}
      <S>
        <At x={20} y={0} w={1700}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 10 }}>
            {T.map((t, i) => (
              <div key={t.k} style={{ padding: "8px 10px", borderRadius: 10, border: `1.5px solid ${i === cur ? t.col : C.hairline}`, background: i <= cur ? `${t.col}18` : C.panel, color: i <= cur ? C.textPrimary : C.textMuted, fontSize: 19, fontWeight: 700, textAlign: "center", opacity: i <= cur ? 1 : 0.4 }}>
                {t.k}
              </div>
            ))}
          </div>
        </At>
        {cur >= 0 && (
          <At x={120} y={260} w={1500}>
            <Pop at={ats[cur]} key={cur}>
              <Panel glow style={{ textAlign: "center", borderColor: T[cur].col }}>
                <Big size={64} color={T[cur].col}>{T[cur].k}</Big>
                <Big size={40}>{T[cur].d}</Big>
              </Panel>
            </Pop>
          </At>
        )}
      </S>
    </SceneShell>
  );
};

// ---------------------------------------------------------------------------
export const RecapV5: React.FC<SceneProps> = ({ words, durationInFrames }) => {
  const frame = useCurrentFrame();
  const cue = makeCue(words);
  const tGo = cue("pour resumer");
  const L = [
    { p: "une option est un droit", t: "option = un droit payé par une prime · l'acheteur limite sa perte" },
    { p: "son prix depend surtout", t: "volatilité implicite = amplitude, pas direction" },
    { p: "le delta le gamma la vanna", t: "delta · gamma · vanna · charme = comment les couvertures bougent" },
    { p: "les teneurs de marche se couvrent", t: "+γ freine · −γ accélère" },
    { p: "les tableaux d exposition gamma", t: "les cartes = une hypothèse, pas des positions observées" },
    { p: "sur le tableau du 24 septembre", t: "24 sept. : −γ · nœud 390 · pivot 394-395" },
    { p: "dans ton trading", t: "macro = direction · carte = comportement & zones · calendrier = moment" },
    { p: "et ton journal", t: "ton journal = tes propres chiffres" },
  ];
  const ats = L.map((l) => cue(l.p));
  const tEnd = cue("ne devine jamais");
  const breathe = useBreathe(0.3);
  return (
    <SceneShell eyebrow="F11 · Récap" title="Ce qu'il faut retenir" durationInFrames={durationInFrames}>
      <Sfx file="whoosh.wav" at={tGo} volume={0.35} />
      {ats.map((a, i) => (
        <Sfx key={i} file="pop.wav" at={a} volume={0.3} />
      ))}
      <Sfx file="chime.wav" at={tEnd} volume={0.55} />
      <Beat from={tGo} to={tEnd} style={{ left: 0, top: 0 }}>
        <S>
          <At x={120} y={0} w={1500}>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {L.map((l, i) => (
                <CheckItem key={l.p} at={ats[i]} n={String(i + 1)} text={l.t} width={1500} />
              ))}
            </div>
          </At>
        </S>
      </Beat>
      <Beat from={tEnd} style={{ left: 0, top: 0 }}>
        <Center column gap={30}>
          <div style={{ transform: `scale(${breathe.scale})` }}>
            <Big size={90} color={C.accentBright} glow>Ne devine jamais. Vérifie.</Big>
          </div>
          <Label size={30}>F11 · Options sur l&apos;or & cartes d&apos;exposition gamma</Label>
        </Center>
      </Beat>
    </SceneShell>
  );
};

// keep tree-shaking honest for props imported for future tweaks
export const _unused = { Stamp, DocIcon, Road, GexChart };
