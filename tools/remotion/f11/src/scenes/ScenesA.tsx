import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { theme } from "../theme";
import { Sfx, makeCue, Panel, CoinStackIcon, AnimatedNumber, useBreathe } from "./shared";
import type { SceneProps } from "./shared";
import { Beat, Pop, Person, Bubble, LiveChart, DocIcon, series, clamp } from "./characters";
import { SceneShell, Center, Big, Label, STAGE_W } from "./stage";
import { Pill, CrossDraw, CheckDraw, CalendarPage, ModelMachine } from "./props5";
import { Bell } from "./props7";
import { Tank } from "./props8";
import { Payoff, Ticket, PriceAxis, CalcLine, Curve } from "./props11";

const C = theme.colors;

export const Intro: React.FC<SceneProps> = ({ words, durationInFrames }) => {
  const frame = useCurrentFrame();
  const cue = makeCue(words);
  const tAnn = cue("avant une grande annonce");
  const tCher = cue("deviennent plus cheres");
  const tSig = cue("beaucoup y voient");
  const tSauf = cue("sauf que");
  const tPrix = cue("elles donnent un prix");
  const tAmp = cue("l amplitude possible");
  const tInv = cue("et une bonne partie");
  const tF11 = cue("c est le sujet");
  const breathe = useBreathe(0.2);
  return (
    <SceneShell eyebrow="F11 · Options sur l'or & volatilité" title="Des options plus chères… et alors ?" durationInFrames={durationInFrames}>
      <Sfx file="pop.wav" at={tAnn} volume={0.4} />
      <Sfx file="tick.wav" at={tCher} volume={0.4} />
      <Sfx file="bass.wav" at={tSauf} volume={0.45} />
      <Sfx file="whoosh.wav" at={tPrix} volume={0.4} />
      <Sfx file="chime.wav" at={tF11} volume={0.55} />
      <Beat from={0} to={tSauf} style={{ left: 0, top: 0 }}>
        <div style={{ position: "relative", width: STAGE_W, height: 690 }}>
          <div style={{ position: "absolute", left: 160, top: 90 }}>
            <Pop at={tAnn}>
              <CalendarPage top="ANNONCE" big="!" size={240} />
            </Pop>
          </div>
          <div style={{ position: "absolute", left: 560, top: 110 }}>
            <Pop at={tCher}>
              <Ticket title="OPTION SUR L'OR" rows={[["prime", ""]]} width={420} />
              <div style={{ marginTop: 14, fontFamily: theme.mono, fontSize: 64, fontWeight: 900, color: C.negative }}>
                <AnimatedNumber from={30} to={52} delay={tCher} durationFrames={50} format={(n) => `${n.toFixed(0)} $`} />
                <span style={{ fontSize: 50 }}> ↑</span>
              </div>
            </Pop>
          </div>
          <div style={{ position: "absolute", left: 1130, top: 300 }}>
            <Pop at={tSig}>
              <Person size={180} color={C.context} wave />
            </Pop>
          </div>
          <div style={{ position: "absolute", left: 1270, top: 120 }}>
            <Pop at={tSig + 10}>
              <Bubble text="quelque chose se prépare… l'or va monter !" width={420} tail="left" />
            </Pop>
          </div>
        </div>
      </Beat>
      <Beat from={tSauf} to={tInv} style={{ left: 0, top: 0 }}>
        <div style={{ width: STAGE_W, height: 650, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 40 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 30 }}>
            <Big size={60}>le sens ?</Big>
            <div style={{ position: "relative" }}>
              <Big size={80} color={C.textMuted}>↑ ↓</Big>
              <div style={{ position: "absolute", left: 10, top: 0 }}>
                <CrossDraw at={tSauf + 20} size={100} />
              </div>
            </div>
          </div>
          {frame >= tPrix && (
            <Pop at={tPrix}>
              <Bell from={tPrix} width={900} label="un prix pour l'incertitude" />
            </Pop>
          )}
          {frame >= tAmp && (
            <Pop at={tAmp}>
              <Pill text="l'amplitude possible, pas la direction" size={32} filled />
            </Pop>
          )}
        </div>
      </Beat>
      <Beat from={tInv} style={{ left: 0, top: 0 }}>
        <Center column gap={40}>
          <div style={{ display: "flex", gap: 30, alignItems: "center" }}>
            <DocIcon size={120} />
            <Label size={34} color={C.textPrimary}>données publiques</Label>
            <Big size={60} color={C.negative}>≠</Big>
            <Label size={34} color={C.textPrimary}>tout ce qu'on raconte</Label>
          </div>
          {frame >= tF11 && (
            <div style={{ transform: `scale(${breathe.scale})` }}>
              <Pop at={tF11}>
                <Big size={72} color={C.accentBright} glow>
                  F11 · Options & volatilité
                </Big>
              </Pop>
            </div>
          )}
        </Center>
      </Beat>
    </SceneShell>
  );
};

export const Basics: React.FC<SceneProps> = ({ words, durationInFrames }) => {
  const frame = useCurrentFrame();
  const cue = makeCue(words);
  const tQ = cue("qu est ce qu une option");
  const tUniv = cue("une option sur l or ne porte");
  const tInst = cue("elle porte sur un instrument");
  const tFix = cue("le contrat fixe");
  const tBuy = cue("l acheteur paie");
  const tSell = cue("le vendeur encaisse");
  const tAsym = cue("c est asymetrique");
  const tLayers = cue("et il y a trois couches");
  const tObs = cue("ce qui est observe");
  const tCalc = cue("ce qui est calcule");
  const tNot = cue("et ce qui n est pas observe");
  const FIELDS: Array<[string, string]> = [["taille", "✓"], ["prix d'exercice", "✓"], ["échéance", "✓"], ["exercice", "✓"], ["règlement", "✓"], ["horaires", "✓"]];
  const nFields = frame < tFix ? 0 : Math.min(FIELDS.length, 1 + Math.floor((frame - tFix) / 12));
  const LAYERS = [
    { t: "OBSERVÉ", items: "cotations · transactions · volume · intérêt ouvert", color: C.positive, at: tObs },
    { t: "CALCULÉ (modèle)", items: "volatilité implicite · sensibilités · indices de volatilité", color: C.context, at: tCalc },
    { t: "NON OBSERVÉ", items: "motif des détenteurs · stock des teneurs de marché · direction future", color: C.negative, at: tNot },
  ];
  return (
    <SceneShell eyebrow="F11 · Les bases" title="Une option, c'est un contrat" durationInFrames={durationInFrames}>
      <Sfx file="pop.wav" at={tQ} volume={0.4} />
      <Sfx file="tick.wav" at={tFix} volume={0.35} />
      <Sfx file="pop.wav" at={tBuy} volume={0.4} />
      <Sfx file="whoosh.wav" at={tLayers} volume={0.4} />
      <Beat from={tQ} to={tBuy} style={{ left: 0, top: 0 }}>
        <div style={{ position: "relative", width: STAGE_W, height: 690 }}>
          <div style={{ position: "absolute", left: 120, top: 60 }}>
            <Ticket title="CONTRAT D'OPTION" rows={[["durée", "limitée"], ["dépend de", "sous-jacent + prix d'exercice"], ...FIELDS.slice(0, nFields)]} width={620} hiRow={frame >= tFix ? 1 + nFields : undefined} />
          </div>
          {frame >= tUniv && (
            <div style={{ position: "absolute", left: 900, top: 80, display: "flex", flexDirection: "column", gap: 24 }}>
              <Pop at={tUniv}>
                <div style={{ position: "relative", display: "inline-block" }}>
                  <Pill text="« le prix universel de l'or »" size={30} color={C.textMuted} />
                  <div style={{ position: "absolute", left: 180, top: -20 }}>
                    <CrossDraw at={tUniv + 16} size={80} />
                  </div>
                </div>
              </Pop>
              {frame >= tInst && (
                <Pop at={tInst}>
                  <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
                    <Panel style={{ padding: "18px 26px", textAlign: "center" }}>
                      <DocIcon size={80} />
                      <Label size={26} color={C.textPrimary}>un contrat à terme</Label>
                    </Panel>
                    <Label size={28}>ou</Label>
                    <Panel style={{ padding: "18px 26px", textAlign: "center" }}>
                      <Tank level={0.6} label="" color={C.accent} w={80} h={90} />
                      <Label size={26} color={C.textPrimary}>un fonds coté</Label>
                    </Panel>
                  </div>
                </Pop>
              )}
            </div>
          )}
        </div>
      </Beat>
      <Beat from={tBuy} to={tLayers} style={{ left: 0, top: 0 }}>
        <div style={{ position: "relative", width: STAGE_W, height: 690 }}>
          <div style={{ position: "absolute", left: 200, top: 150, textAlign: "center" }}>
            <Pop at={tBuy}>
              <Person size={200} color={C.positive} label="acheteur" />
            </Pop>
          </div>
          <div style={{ position: "absolute", left: 1380, top: 150, textAlign: "center" }}>
            <Pop at={tSell}>
              <Person size={200} color={C.negative} label="vendeur" />
            </Pop>
          </div>
          {frame >= tBuy + 20 && (
            <div style={{ position: "absolute", top: 210, left: interpolate(frame, [tBuy + 20, tBuy + 60], [430, 1240], { ...clamp, easing: theme.ease.inOut }) }}>
              <CoinStackIcon size={90} />
              <div style={{ color: C.accentBright, fontSize: 26, fontWeight: 800 }}>prime</div>
            </div>
          )}
          <div style={{ position: "absolute", left: 120, top: 470, width: 480 }}>
            <Pop at={tBuy + 30}>
              <Panel style={{ padding: "14px 20px", borderColor: C.positive }}>
                <Big size={30} color={C.positive}>un droit</Big>
                {frame >= tAsym && <Label size={24} color={C.textPrimary}>risque : sa prime</Label>}
              </Panel>
            </Pop>
          </div>
          <div style={{ position: "absolute", left: 1220, top: 470, width: 520 }}>
            <Pop at={tSell + 20}>
              <Panel style={{ padding: "14px 20px", borderColor: C.negative }}>
                <Big size={30} color={C.negative}>une obligation</Big>
                {frame >= tAsym && <Label size={24} color={C.textPrimary}>peut perdre bien plus · dépose des garanties</Label>}
              </Panel>
            </Pop>
          </div>
          {frame >= tAsym && (
            <div style={{ position: "absolute", left: 0, right: 0, top: 40, display: "flex", justifyContent: "center" }}>
              <Pop at={tAsym}>
                <Pill text="asymétrique" size={34} filled />
              </Pop>
            </div>
          )}
        </div>
      </Beat>
      <Beat from={tLayers} style={{ left: 0, top: 0 }}>
        <Center column gap={22}>
          <Big size={38}>Trois couches à ne jamais mélanger</Big>
          {LAYERS.map((l) => (
            <Pop key={l.t} at={l.at}>
              <Panel glow={frame >= l.at && (l === LAYERS[2] || frame < LAYERS[LAYERS.indexOf(l) + 1].at)} style={{ width: 1300, padding: "20px 28px", display: "flex", alignItems: "center", gap: 26, borderColor: l.color }}>
                <div style={{ width: 300, color: l.color, fontFamily: theme.mono, fontSize: 26, fontWeight: 900, letterSpacing: 1.5 }}>{l.t}</div>
                <Label size={28} color={C.textPrimary}>{l.items}</Label>
              </Panel>
            </Pop>
          ))}
        </Center>
      </Beat>
    </SceneShell>
  );
};

export const CallsPuts: React.FC<SceneProps> = ({ words, durationInFrames }) => {
  const frame = useCurrentFrame();
  const cue = makeCue(words);
  const tCall = cue("l option d achat donne");
  const tPut = cue("l option de vente donne");
  const tPayC = cue("a l echeance une option d achat");
  const tPayP = cue("une option de vente vaut");
  const tGain = cue("mais le gain reel");
  const tUse = cue("et une option d achat peut servir");
  const tAss = cue("une option de vente peut assurer");
  const tJambe = cue("chacune peut");
  const tTwo = cue("surtout chaque contrat");
  const tHausse = cue("donc beaucoup d options d achat");
  const tBaisse = cue("et beaucoup d options de vente");
  return (
    <SceneShell eyebrow="F11 · Achat et vente" title="Option d'achat, option de vente" durationInFrames={durationInFrames}>
      <Sfx file="pop.wav" at={tCall} volume={0.4} />
      <Sfx file="pop.wav" at={tPut} volume={0.4} />
      <Sfx file="whoosh.wav" at={tPayC} volume={0.35} />
      <Sfx file="whoosh.wav" at={tPayP} volume={0.35} />
      <Sfx file="bass.wav" at={tTwo} volume={0.4} />
      <Beat from={tCall} to={tUse} style={{ left: 0, top: 0 }}>
        <div style={{ width: STAGE_W, display: "flex", justifyContent: "center", gap: 90 }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
            <Pop at={tCall}>
              <Pill text="OPTION D'ACHAT = droit d'acheter" color={C.positive} size={30} />
            </Pop>
            {frame >= tPayC && (
              <>
                <Payoff kind="call" from={tPayC} width={640} height={340} />
                <div style={{ fontFamily: theme.mono, fontSize: 24, color: C.textSecondary }}>max(sous-jacent − prix d'exercice ; 0)</div>
              </>
            )}
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
            <Pop at={tPut}>
              <Pill text="OPTION DE VENTE = droit de vendre" color={C.negative} size={30} />
            </Pop>
            {frame >= tPayP && (
              <>
                <Payoff kind="put" from={tPayP} width={640} height={340} />
                <div style={{ fontFamily: theme.mono, fontSize: 24, color: C.textSecondary }}>max(prix d'exercice − sous-jacent ; 0)</div>
              </>
            )}
          </div>
        </div>
        {frame >= tGain && (
          <div style={{ position: "absolute", left: 0, width: STAGE_W, top: 560, display: "flex", justifyContent: "center", gap: 16 }}>
            <Label size={28}>le gain réel dépend aussi de :</Label>
            {["la prime", "les frais", "le multiplicateur"].map((t, i) => (
              <Pop key={t} at={tGain + 12 + i * 10}>
                <Pill text={t} size={28} />
              </Pop>
            ))}
          </div>
        )}
      </Beat>
      <Beat from={tUse} to={tTwo} style={{ left: 0, top: 0 }}>
        <Center gap={40}>
          {[
            { t: "option d'achat", u: "couvrir une position vendeuse", at: tUse, col: C.positive },
            { t: "option de vente", u: "assurer une position acheteuse", at: tAss, col: C.negative },
            { t: "l'une ou l'autre", u: "une jambe d'une stratégie plus large", at: tJambe, col: C.context },
          ].map((x) => (
            <Pop key={x.t} at={x.at}>
              <Panel style={{ width: 480, padding: 26, textAlign: "center", borderColor: x.col }}>
                <Big size={32} color={x.col}>{x.t}</Big>
                <Label size={28} color={C.textPrimary}>{x.u}</Label>
              </Panel>
            </Pop>
          ))}
        </Center>
      </Beat>
      <Beat from={tTwo} style={{ left: 0, top: 0 }}>
        <div style={{ position: "relative", width: STAGE_W, height: 690 }}>
          <div style={{ position: "absolute", left: 300, top: 120 }}>
            <Person size={190} color={C.positive} label="acheteur" />
          </div>
          <div style={{ position: "absolute", left: STAGE_W / 2 - 170, top: 150 }}>
            <Ticket title="1 CONTRAT OUVERT" rows={[["côté acheteur", "1"], ["côté vendeur", "1"]]} width={340} />
          </div>
          <div style={{ position: "absolute", left: STAGE_W - 460, top: 120 }}>
            <Person size={190} color={C.negative} label="vendeur" />
          </div>
          <div style={{ position: "absolute", left: 0, width: STAGE_W, top: 470, display: "flex", justifyContent: "center", gap: 60 }}>
            {frame >= tHausse && (
              <Pop at={tHausse}>
                <div style={{ position: "relative" }}>
                  <Panel style={{ padding: "16px 24px" }}>
                    <Label size={28} color={C.textPrimary}>beaucoup d'options d'achat = pari sur la hausse ?</Label>
                  </Panel>
                  <div style={{ position: "absolute", right: -30, top: -30 }}>
                    <CrossDraw at={tHausse + 40} size={80} />
                  </div>
                </div>
              </Pop>
            )}
            {frame >= tBaisse && (
              <Pop at={tBaisse}>
                <div style={{ position: "relative" }}>
                  <Panel style={{ padding: "16px 24px" }}>
                    <Label size={28} color={C.textPrimary}>beaucoup d'options de vente = pari sur la baisse ?</Label>
                  </Panel>
                  <div style={{ position: "absolute", right: -30, top: -30 }}>
                    <CrossDraw at={tBaisse + 30} size={80} />
                  </div>
                </div>
              </Pop>
            )}
          </div>
        </div>
      </Beat>
    </SceneShell>
  );
};

export const PremiumStrike: React.FC<SceneProps> = ({ words, durationInFrames }) => {
  const frame = useCurrentFrame();
  const cue = makeCue(words);
  const tPrem = cue("la prime c est");
  const tStrike = cue("le prix d exercice c est");
  const tExp = cue("et l echeance c est");
  const tUnit = cue("la prime affichee");
  const tDeux = cue("deux options au meme prix");
  const tWhy = cue("l echeance les taux");
  const tRaw = cue("comparer des primes brutes");
  const CARDS = [
    { t: "la prime", d: "le prix de marché de l'option", at: tPrem, icon: <CoinStackIcon size={90} /> },
    { t: "le prix d'exercice", d: "le niveau de comparaison fixé par le contrat", at: tStrike, icon: <div style={{ fontFamily: theme.mono, fontSize: 54, color: C.accentBright, fontWeight: 900 }}>2 400</div> },
    { t: "l'échéance", d: "la date où le droit s'éteint", at: tExp, icon: <CalendarPage top="ÉCHÉANCE" big="J" size={110} /> },
  ];
  return (
    <SceneShell eyebrow="F11 · Prime, prix d'exercice, échéance" title="Trois dimensions à séparer" durationInFrames={durationInFrames}>
      {CARDS.map((x) => (
        <Sfx key={x.t} file="pop.wav" at={x.at} volume={0.4} />
      ))}
      <Sfx file="tick.wav" at={tUnit} volume={0.4} />
      <Sfx file="whoosh.wav" at={tDeux} volume={0.4} />
      <Sfx file="bass.wav" at={tRaw} volume={0.4} />
      <Beat from={0} to={tDeux} style={{ left: 0, top: 0 }}>
        <div style={{ width: STAGE_W, height: 650, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 50 }}>
          <div style={{ display: "flex", gap: 40 }}>
            {CARDS.map((x) => (
              <Pop key={x.t} at={x.at}>
                <Panel style={{ width: 460, height: 280, padding: 24, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, textAlign: "center" }}>
                  <div style={{ height: 120, display: "flex", alignItems: "center" }}>{x.icon}</div>
                  <Big size={34}>{x.t}</Big>
                  <Label size={24} color={C.textPrimary}>{x.d}</Label>
                </Panel>
              </Pop>
            ))}
          </div>
          {frame >= tUnit && (
            <Pop at={tUnit}>
              <Panel glow style={{ padding: "18px 30px" }}>
                <div style={{ fontFamily: theme.mono, fontSize: 36, color: C.textPrimary }}>
                  prime par unité <span style={{ color: C.accentBright }}>×</span> taille du contrat <span style={{ color: C.accentBright }}>=</span> exposition réelle en $
                </div>
              </Panel>
            </Pop>
          )}
        </div>
      </Beat>
      <Beat from={tDeux} style={{ left: 0, top: 0 }}>
        <div style={{ width: STAGE_W, height: 650, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 36 }}>
          <div style={{ display: "flex", gap: 60, alignItems: "center" }}>
            <Pop at={tDeux}>
              <Ticket title="OPTION A" rows={[["prix d'exercice", "2 400"], ["prime", "31"]]} width={380} />
            </Pop>
            <Big size={60} color={C.accentBright}>≠</Big>
            <Pop at={tDeux + 10}>
              <Ticket title="OPTION B" rows={[["prix d'exercice", "2 400"], ["prime", "64"]]} width={380} color={C.context} />
            </Pop>
          </div>
          <div style={{ display: "flex", gap: 14 }}>
            {["échéance", "taux", "volatilité", "liquidité", "règles d'exercice"].map((t, i) => (
              <Pop key={t} at={tWhy + i * 9}>
                <Pill text={t} size={28} />
              </Pop>
            ))}
          </div>
          {frame >= tRaw && (
            <Pop at={tRaw}>
              <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                <CrossDraw at={tRaw + 4} size={60} />
                <Label size={32} color={C.textPrimary}>comparer des primes brutes, sans remettre à la même échelle</Label>
              </div>
            </Pop>
          )}
        </div>
      </Beat>
    </SceneShell>
  );
};

export const Moneyness: React.FC<SceneProps> = ({ words, durationInFrames }) => {
  const frame = useCurrentFrame();
  const cue = makeCue(words);
  const tQ = cue("ou se situe");
  const tItm = cue("une option est dans la monnaie");
  const tAtm = cue("a la monnaie quand");
  const tOtm = cue("et hors de la monnaie");
  const tFut = cue("pour une option sur contrat");
  const tDec = cue("la prime se decompose");
  const tIntr = cue("la valeur intrinseque");
  const tTime = cue("et la valeur temps");
  const tDecay = cue("cette valeur temps tend");
  const tEx = cue("exemple hachim");
  const tExp = cue("a l echeance l or vaut");
  const tRap = cue("l option rapporte");
  const tGain = cue("son gain avant frais");
  const tSell = cue("et le vendeur");
  const tSi = cue("si l or avait fini");
  const tPerd = cue("mais hachim perdrait");
  const tMoral = cue("etre dans la monnaie ce n est pas");
  const decay = Array.from({ length: 30 }, (_, i) => Math.sqrt(1 - i / 29));
  const alt = frame >= tSi;
  return (
    <SceneShell eyebrow="F11 · Dans, à ou hors de la monnaie" title="Où est le prix d'exercice ?" durationInFrames={durationInFrames}>
      <Sfx file="pop.wav" at={tItm} volume={0.35} />
      <Sfx file="pop.wav" at={tAtm} volume={0.35} />
      <Sfx file="pop.wav" at={tOtm} volume={0.35} />
      <Sfx file="whoosh.wav" at={tDec} volume={0.35} />
      <Sfx file="pop.wav" at={tEx} volume={0.4} />
      <Sfx file="chime.wav" at={tGain} volume={0.45} />
      <Sfx file="bass.wav" at={tPerd} volume={0.45} />
      <Beat from={tQ} to={tDec} style={{ left: 0, top: 0 }}>
        <Center column gap={40}>
          <Label size={30}>option d'achat · sous-jacent à 2 400</Label>
          <PriceAxis
            min={2250}
            max={2550}
            width={1500}
            marks={[
              { v: 2300, t: "dans la monnaie", color: C.positive, at: tItm },
              { v: 2400, t: "à la monnaie", color: C.accentBright, at: tAtm, below: true },
              { v: 2500, t: "hors de la monnaie", color: C.negative, at: tOtm },
            ]}
          />
          <Label size={24}>(prix d'exercice de chaque option d'achat)</Label>
          {frame >= tFut && (
            <Pop at={tFut}>
              <Pill text="option sur contrat à terme → comparer avec le bon contrat à terme, pas le comptant" size={28} />
            </Pop>
          )}
        </Center>
      </Beat>
      <Beat from={tDec} to={tEx} style={{ left: 0, top: 0 }}>
        <Center gap={120}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
            <Label size={28}>prime</Label>
            <div style={{ width: 220, height: 380, display: "flex", flexDirection: "column", justifyContent: "flex-end", borderRadius: 14, overflow: "hidden", border: `2px solid ${C.hairline}` }}>
              <div style={{ height: frame >= tTime ? 150 : 0, background: C.context, display: "flex", alignItems: "center", justifyContent: "center", color: C.bg, fontWeight: 800, fontSize: 24, transition: "none" }}>
                {frame >= tTime ? "valeur temps" : ""}
              </div>
              <div style={{ height: frame >= tIntr ? 230 : 0, background: C.accent, display: "flex", alignItems: "center", justifyContent: "center", color: C.bg, fontWeight: 800, fontSize: 24 }}>
                {frame >= tIntr ? "intrinsèque" : ""}
              </div>
            </div>
          </div>
          <div style={{ width: 800, display: "flex", flexDirection: "column", gap: 20 }}>
            <Pop at={tIntr}>
              <Label size={30} color={C.textPrimary}>valeur intrinsèque : ce que rapporterait l'exercice immédiat</Label>
            </Pop>
            {frame >= tTime && (
              <Pop at={tTime}>
                <Label size={30} color={C.textPrimary}>valeur temps : le temps et l'incertitude qui restent</Label>
              </Pop>
            )}
            {frame >= tDecay && (
              <Pop at={tDecay}>
                <Panel style={{ padding: 18 }}>
                  <LiveChart data={decay} width={700} height={200} from={tDecay} drawFrames={50} color={C.context} label="valeur temps → 0 à l'échéance (pas en ligne droite)" />
                </Panel>
              </Pop>
            )}
          </div>
        </Center>
      </Beat>
      <Beat from={tEx} style={{ left: 0, top: 0 }}>
        <div style={{ position: "relative", width: STAGE_W, height: 690 }}>
          <div style={{ position: "absolute", left: 40, top: 60 }}>
            <Person size={170} color={C.accent} label="Hachim" cheer={frame >= tGain && !alt} />
          </div>
          <div style={{ position: "absolute", left: 250, top: 40 }}>
            <Pop at={tEx}>
              <Ticket title="OPTION D'ACHAT" rows={[["prix d'exercice", "2 400"], ["prime", "45 / unité"]]} width={380} color={C.positive} />
            </Pop>
          </div>
          <div style={{ position: "absolute", left: 90, top: 300, display: "flex", flexDirection: "column", gap: 14 }}>
            <CalcLine at={tRap} left={alt ? "2 430 − 2 400 =" : "2 480 − 2 400 ="} right={alt ? "30" : "80"} />
            <CalcLine at={tGain} left={alt ? "30 − 45 =" : "80 − 45 ="} right={alt ? "−15" : "+35 / unité"} color={alt ? C.negative : C.positive} />
            {frame >= tSell && !alt && <CalcLine at={tSell} left="vendeur :" right="−35" color={C.negative} size={32} />}
          </div>
          <div style={{ position: "absolute", left: 900, top: 60 }}>
            {frame >= tExp && <Payoff kind="call" from={tExp - 40} premium={45} premiumAt={tGain} marker={alt ? 2430 : 2480} markerAt={alt ? tSi : tExp} width={800} height={400} />}
          </div>
          {frame >= tMoral && (
            <div style={{ position: "absolute", left: 0, width: STAGE_W, top: 560, display: "flex", justifyContent: "center" }}>
              <Pop at={tMoral}>
                <Big size={46} color={C.accentBright} glow>dans la monnaie ≠ gagnant</Big>
              </Pop>
            </div>
          )}
        </div>
      </Beat>
    </SceneShell>
  );
};

export const ImpliedVol: React.FC<SceneProps> = ({ words, durationInFrames }) => {
  const frame = useCurrentFrame();
  const cue = makeCue(words);
  const tNot = cue("on ne la mesure pas");
  const tDed = cue("on la deduit");
  const tMix = cue("elle melange");
  const tSurf = cue("chaque prix d exercice");
  const tAn = cue("et par convention");
  const tEx = cue("exemple l or vaut");
  const tRac = cue("pour passer a un mois");
  const tMul = cue("fois 18 pourcent");
  const tBand = cue("ca donne une bande");
  const tNi = cue("ce ne sont ni");
  const tDir = cue("et il n y a aucune");
  const tHaute = cue("une volatilite plus haute");
  const S = 9;
  const surf = frame >= tSurf ? interpolate(frame, [tSurf, tSurf + 40], [0, 1], clamp) : 0;
  return (
    <SceneShell eyebrow="F11 · Volatilité implicite" title="Déduite du prix, pas mesurée sur l'avenir" durationInFrames={durationInFrames}>
      <Sfx file="whoosh.wav" at={tDed} volume={0.4} />
      <Sfx file="pop.wav" at={tSurf} volume={0.4} />
      <Sfx file="tick.wav" at={tEx} volume={0.4} />
      <Sfx file="chime.wav" at={tBand} volume={0.45} />
      <Beat from={0} to={tEx} style={{ left: 0, top: 0 }}>
        <div style={{ position: "relative", width: STAGE_W, height: 690 }}>
          <div style={{ position: "absolute", left: 60, top: 30, width: 760, display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
            <Pop at={tNot}>
              <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
                <Pill text="prix de l'option observé" size={26} />
                <span style={{ color: C.accentBright, fontSize: 40 }}>→</span>
              </div>
            </Pop>
            <Pop at={tDed}>
              <ModelMachine size={300} display={frame >= tDed + 30 ? "σ = 18 %" : "σ ?"} busy={frame < tDed + 30} />
            </Pop>
            {frame >= tMix && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center" }}>
                {["prix de l'incertitude", "offre et demande", "hypothèses du modèle", "conventions de cotation"].map((t, i) => (
                  <Pop key={t} at={tMix + 10 + i * 12}>
                    <Pill text={t} size={22} />
                  </Pop>
                ))}
              </div>
            )}
          </div>
          {frame >= tSurf && (
            <div style={{ position: "absolute", left: 960, top: 60 }}>
              <Pop at={tSurf}>
                <svg width={760} height={420} viewBox="0 0 760 420">
                  {Array.from({ length: S }).map((_, r) =>
                    Array.from({ length: S }).map((__, k) => {
                      const x0 = 80 + k * 60 + r * 25;
                      const iv = 0.16 + 0.03 * Math.pow((k - 4) / 4, 2) + 0.012 * (r / S);
                      const y0 = 360 - r * 28 - (iv - 0.15) * 1800 * surf;
                      return <circle key={`${r}-${k}`} cx={x0} cy={y0} r={5} fill={r === 0 ? C.accentBright : C.context} opacity={0.4 + 0.6 * (1 - r / S)} />;
                    }),
                  )}
                  <text x={80} y={410} fill={C.textSecondary} fontSize={20} fontFamily={theme.mono}>prix d'exercice →</text>
                  <text x={560} y={120} fill={C.textSecondary} fontSize={20} fontFamily={theme.mono}>échéance ↗</text>
                </svg>
                <Label size={28} color={C.textPrimary}>une surface, pas un chiffre unique</Label>
              </Pop>
              {frame >= tAn && (
                <div style={{ marginTop: 16, display: "flex", justifyContent: "center" }}>
                  <Pop at={tAn}>
                    <Pill text="exprimée sur un an" size={28} filled />
                  </Pop>
                </div>
              )}
            </div>
          )}
        </div>
      </Beat>
      <Beat from={tEx} style={{ left: 0, top: 0 }}>
        <div style={{ position: "relative", width: STAGE_W, height: 690 }}>
          <div style={{ position: "absolute", left: 60, top: 40, display: "flex", flexDirection: "column", gap: 18 }}>
            <CalcLine at={tEx} left="or :" right="2 400" />
            <CalcLine at={tEx + 40} left="volatilité implicite 1 mois :" right="18 %" />
            <CalcLine at={tRac} left="√(30 / 365) ≈" right="0,287" />
            <CalcLine at={tMul} left="2 400 × 18 % × 0,287 ≈" right="124" />
          </div>
          {frame >= tBand && (
            <div style={{ position: "absolute", left: 920, top: 20 }}>
              <Bell from={tBand} width={820} label="bande indicative : 2 276 → 2 524" />
            </div>
          )}
          <div style={{ position: "absolute", left: 60, top: 380, display: "flex", flexDirection: "column", gap: 16 }}>
            {frame >= tNi && (
              <Pop at={tNi}>
                <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                  <CrossDraw at={tNi + 4} size={50} />
                  <Label size={30} color={C.textPrimary}>ni des objectifs, ni des limites garanties</Label>
                </div>
              </Pop>
            )}
            {frame >= tDir && (
              <Pop at={tDir}>
                <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                  <CrossDraw at={tDir + 4} size={50} />
                  <Label size={30} color={C.textPrimary}>aucune direction dedans</Label>
                </div>
              </Pop>
            )}
          </div>
          {frame >= tHaute && (
            <div style={{ position: "absolute", left: 960, top: 420, display: "flex", gap: 30 }}>
              <Pop at={tHaute}>
                <Pill text="volatilité ↑" size={30} filled />
              </Pop>
              <Pop at={tHaute + 12}>
                <Pill text="option d'achat : plus chère" color={C.positive} size={26} />
              </Pop>
              <Pop at={tHaute + 20}>
                <Pill text="option de vente : plus chère" color={C.negative} size={26} />
              </Pop>
            </div>
          )}
        </div>
      </Beat>
    </SceneShell>
  );
};

export const RealizedVol: React.FC<SceneProps> = ({ words, durationInFrames }) => {
  const frame = useCurrentFrame();
  const cue = makeCue(words);
  const tRv = cue("la volatilite realisee");
  const tEt = cue("c est souvent l ecart");
  const tDep = cue("sa valeur change");
  const tVingt = cue("une volatilite sur vingt");
  const tCmp = cue("comparer la volatilite implicite");
  const tNon = cue("mais ce n est pas une regle");
  const tAlign = cue("il faut aligner");
  const data = series(60, 11, 0.05, 1.4);
  return (
    <SceneShell eyebrow="F11 · Volatilité réalisée" title="Elle regarde en arrière" durationInFrames={durationInFrames}>
      <Sfx file="whoosh.wav" at={tRv} volume={0.4} />
      <Sfx file="tick.wav" at={tDep} volume={0.35} />
      <Sfx file="pop.wav" at={tCmp} volume={0.4} />
      <Sfx file="bass.wav" at={tNon} volume={0.4} />
      <Beat from={0} to={tCmp} style={{ left: 0, top: 0 }}>
        <div style={{ position: "relative", width: STAGE_W, height: 690 }}>
          <div style={{ position: "absolute", left: 60, top: 20 }}>
            <Panel style={{ padding: 20 }}>
              <LiveChart data={data} width={900} height={280} from={tRv} drawFrames={60} label="or · rendements passés" />
            </Panel>
            <div style={{ marginTop: 10, color: C.accentBright, fontSize: 30, fontWeight: 800 }}>← le passé</div>
          </div>
          {frame >= tEt && (
            <div style={{ position: "absolute", left: 1060, top: 60, width: 680 }}>
              <Pop at={tEt}>
                <Panel glow style={{ padding: "18px 24px" }}>
                  <Label size={28} color={C.textPrimary}>écart-type des rendements passés, ramené sur un an</Label>
                </Panel>
              </Pop>
            </div>
          )}
          {frame >= tDep && (
            <div style={{ position: "absolute", left: 1060, top: 210, width: 680, display: "flex", flexWrap: "wrap", gap: 12 }}>
              {["fenêtre", "fréquence", "source des prix", "jours fériés", "écarts de la nuit"].map((t, i) => (
                <Pop key={t} at={tDep + 10 + i * 10}>
                  <Pill text={t} size={26} />
                </Pop>
              ))}
            </div>
          )}
          {frame >= tVingt && (
            <div style={{ position: "absolute", left: 60, top: 450, display: "flex", alignItems: "center", gap: 30 }}>
              <Pop at={tVingt}>
                <Panel style={{ padding: "16px 24px" }}>
                  <Label size={28} color={C.textPrimary}>20 séances, de clôture à clôture</Label>
                </Panel>
              </Pop>
              <Big size={60} color={C.negative}>≠</Big>
              <Pop at={tVingt + 20}>
                <Panel style={{ padding: "16px 24px" }}>
                  <Label size={28} color={C.textPrimary}>mesure pendant la séance</Label>
                </Panel>
              </Pop>
            </div>
          )}
        </div>
      </Beat>
      <Beat from={tCmp} style={{ left: 0, top: 0 }}>
        <Center gap={100}>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 40, height: 420 }}>
            {[
              { t: "implicite", h: 300, col: C.context },
              { t: "réalisée ensuite", h: 220, col: C.accent },
            ].map((b, i) => {
              const p = interpolate(frame, [tCmp + i * 12, tCmp + 30 + i * 12], [0, 1], { ...clamp, easing: theme.ease.out });
              return (
                <div key={b.t} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 150, height: b.h * p, background: b.col, borderRadius: 10 }} />
                  <Label size={26} color={C.textPrimary}>{b.t}</Label>
                </div>
              );
            })}
            <div style={{ alignSelf: "flex-start", marginTop: 60 }}>
              <Pop at={tCmp + 40}>
                <Pill text="écart = prime de risque (à étudier)" size={26} />
              </Pop>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 20, width: 700 }}>
            {frame >= tNon && (
              <Pop at={tNon}>
                <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                  <CrossDraw at={tNon + 4} size={56} />
                  <Label size={32} color={C.textPrimary}>pas une règle de trading simple</Label>
                </div>
              </Pop>
            )}
            {["même horizon, même sous-jacent", "compter les coûts", "aucune information future en direct"].map((t, i) => (
              <Pop key={t} at={tAlign + i * 25}>
                <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                  <CheckDraw at={tAlign + i * 25 + 4} size={46} />
                  <Label size={28} color={C.textPrimary}>{t}</Label>
                </div>
              </Pop>
            ))}
          </div>
        </Center>
      </Beat>
    </SceneShell>
  );
};

