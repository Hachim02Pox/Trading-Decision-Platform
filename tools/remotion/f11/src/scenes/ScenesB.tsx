import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "../theme";
import { Sfx, makeCue, Panel, TerminalGlyph, ScaleIcon, CoinStackIcon, useBreathe } from "./shared";
import type { SceneProps } from "./shared";
import { Beat, Pop, Person, Bubble, LiveChart, series, clamp } from "./characters";
import { SceneShell, Center, Big, Label, STAGE_W } from "./stage";
import { Pill, CrossDraw, CheckDraw, CalendarPage, Stamp } from "./props5";
import { Tank } from "./props8";
import { Curve, GreekCard, CalcLine, Ticket } from "./props11";

const C = theme.colors;

export const Greeks: React.FC<SceneProps> = ({ words, durationInFrames }) => {
  const frame = useCurrentFrame();
  const cue = makeCue(words);
  const tIntro = cue("les lettres grecques");
  const G = [
    { l: "Δ", n: "delta", d: "petite variation du sous-jacent", at: cue("le delta la sensibilite") },
    { l: "Γ", n: "gamma", d: "vitesse de changement du delta", at: cue("le gamma la vitesse") },
    { l: "Θ", n: "thêta", d: "le temps qui passe", at: cue("le theta l effet") },
    { l: "ν", n: "véga", d: "la volatilité implicite", at: cue("le vega la sensibilite") },
    { l: "ρ", n: "rhô", d: "les taux", at: cue("et le rho") },
  ];
  const tMove = cue("elles bougent");
  const tNot = cue("le delta n est pas");
  const tLong = cue("pour une option achetee");
  const tShort = cue("pour une option vendue");
  const tComb = cue("et des qu on combine");
  const active = G.reduce((acc, g, i) => (frame >= g.at ? i : acc), -1);
  const wob = frame >= tMove && frame < tNot ? Math.sin((frame - tMove) / 4) * 4 : 0;
  return (
    <SceneShell eyebrow="F11 · Les lettres grecques" title="Des sensibilités locales, pas des prévisions" durationInFrames={durationInFrames}>
      {G.map((g) => (
        <Sfx key={g.n} file="pop.wav" at={g.at} volume={0.4} />
      ))}
      <Sfx file="whoosh.wav" at={tMove} volume={0.35} />
      <Sfx file="bass.wav" at={tNot} volume={0.4} />
      <Sfx file="tick.wav" at={tLong} volume={0.4} />
      <Beat from={tIntro} to={tLong} style={{ left: 0, top: 0 }}>
        <div style={{ width: STAGE_W, height: 660, display: "flex", flexDirection: "column", alignItems: "center", gap: 36 }}>
          <div style={{ display: "flex", gap: 22, marginTop: 20 }}>
            {G.map((g, i) => (
              <div key={g.n} style={{ transform: `rotate(${i % 2 ? wob : -wob}deg)` }}>
                <Pop at={g.at}>
                  <GreekCard letter={g.l} name={g.n} text={g.d} lit={i === active && frame < tMove} width={320} />
                </Pop>
              </div>
            ))}
          </div>
          {frame >= tMove && frame < tNot && (
            <Pop at={tMove}>
              <Label size={30} color={C.textPrimary}>elles bougent avec l'or, le temps, la volatilité, les taux</Label>
            </Pop>
          )}
          {frame >= tNot && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14, alignItems: "flex-start" }}>
              {[
                { t: "delta ≠ probabilité garantie d'exercice", at: tNot },
                { t: "gamma ≠ signal de direction", at: cue("le gamma n est pas") },
                { t: "thêta ≠ perte fixe chaque jour", at: cue("le theta n est pas") },
              ].map((x) => (
                <Pop key={x.t} at={x.at}>
                  <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                    <CrossDraw at={x.at + 6} size={44} />
                    <Label size={30} color={C.textPrimary}>{x.t}</Label>
                  </div>
                </Pop>
              ))}
            </div>
          )}
        </div>
      </Beat>
      <Beat from={tLong} style={{ left: 0, top: 0 }}>
        <Center column gap={30}>
          <div style={{ display: "grid", gridTemplateColumns: "360px 220px 220px 220px", gap: 12, alignItems: "center" }}>
            <div />
            {["gamma", "véga", "thêta"].map((h) => (
              <div key={h} style={{ textAlign: "center", color: C.textSecondary, fontSize: 30, fontWeight: 800 }}>{h}</div>
            ))}
            {[
              { t: "option achetée", at: tLong, s: ["+", "+", "−"] },
              { t: "option vendue", at: tShort, s: ["−", "−", "+"] },
            ].map((r) => (
              <React.Fragment key={r.t}>
                <div style={{ opacity: frame >= r.at ? 1 : 0.15 }}>
                  <Big size={36}>{r.t}</Big>
                </div>
                {r.s.map((s, i) => (
                  <Pop key={i} at={r.at + 12 + i * 8}>
                    <div style={{ textAlign: "center", fontSize: 70, fontWeight: 900, color: s === "+" ? C.positive : C.negative }}>{s}</div>
                  </Pop>
                ))}
              </React.Fragment>
            ))}
          </div>
          {frame >= tShort + 40 && (
            <Pop at={tShort + 40}>
              <Label size={28} color={C.negative}>vendue : pertes et appels de marge potentiellement importants</Label>
            </Pop>
          )}
          {frame >= tComb && (
            <Pop at={tComb}>
              <Pill text="plusieurs jambes combinées → les signes peuvent changer" size={30} filled />
            </Pop>
          )}
        </Center>
      </Beat>
    </SceneShell>
  );
};

export const SkewTerm: React.FC<SceneProps> = ({ words, durationInFrames }) => {
  const frame = useCurrentFrame();
  const cue = makeCue(words);
  const tSkew = cue("d abord l asymetrie");
  const tSmile = cue("ce dessin");
  const tRefl = cue("il peut refleter");
  const tPut = cue("des options de vente cheres");
  const tCall = cue("des options d achat cheres");
  const tDem = cue("cette demande peut etre");
  const tTerm = cue("ensuite la structure par terme");
  const tEvt = cue("avant un gros evenement");
  const tInv = cue("une structure inversee");
  const tCmp = cue("et pour comparer");
  const smile: Array<[number, number]> = [[0, 0.95], [0.125, 0.72], [0.25, 0.52], [0.375, 0.38], [0.5, 0.32], [0.625, 0.34], [0.75, 0.42], [0.875, 0.55], [1, 0.7]];
  const term: Array<[number, number]> = [[0, 0.9], [0.2, 0.7], [0.4, 0.52], [0.6, 0.45], [0.8, 0.42], [1, 0.4]];
  return (
    <SceneShell eyebrow="F11 · Asymétrie & structure par terme" title="Deux formes à lire dans la surface" durationInFrames={durationInFrames}>
      <Sfx file="whoosh.wav" at={tSkew} volume={0.4} />
      <Sfx file="pop.wav" at={tSmile} volume={0.4} />
      <Sfx file="bass.wav" at={tPut} volume={0.4} />
      <Sfx file="whoosh.wav" at={tTerm} volume={0.4} />
      <Sfx file="pop.wav" at={tInv} volume={0.4} />
      <Beat from={tSkew} to={tTerm} style={{ left: 0, top: 0 }}>
        <div style={{ position: "relative", width: STAGE_W, height: 690 }}>
          <div style={{ position: "absolute", left: 80, top: 30 }}>
            <Label size={26}>volatilité implicite · même échéance</Label>
            <div style={{ marginTop: 20 }}>
              <Curve pts={smile} from={tSkew} width={860} height={380} xLabels={["2 200", "", "", "", "2 400", "", "", "", "2 600"]} hi={frame >= tPut && frame < tCall ? [0, 1] : frame >= tCall && frame < tDem ? [7, 8] : []} hiColor={frame >= tCall ? C.positive : C.negative} />
            </div>
            <div style={{ marginTop: -4, color: C.textSecondary, fontFamily: theme.mono, fontSize: 20 }}>prix d'exercice →</div>
          </div>
          {frame >= tSmile && (
            <div style={{ position: "absolute", left: 360, top: 200 }}>
              <Pop at={tSmile}>
                <Pill text="le « sourire »" size={32} filled />
              </Pop>
            </div>
          )}
          <div style={{ position: "absolute", left: 1060, top: 40, width: 680, display: "flex", flexDirection: "column", gap: 16 }}>
            {frame >= tRefl && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
                {["demande asymétrique", "risque extrême perçu", "liquidité"].map((t, i) => (
                  <Pop key={t} at={tRefl + 8 + i * 10}>
                    <Pill text={t} size={26} />
                  </Pop>
                ))}
              </div>
            )}
            {[
              { t: "options de vente chères ⇏ l'or va baisser", at: tPut },
              { t: "options d'achat chères ⇏ l'or va monter", at: tCall },
            ].map((x) =>
              frame >= x.at ? (
                <Pop key={x.t} at={x.at}>
                  <Panel style={{ padding: "14px 20px" }}>
                    <Label size={28} color={C.textPrimary}>{x.t}</Label>
                  </Panel>
                </Pop>
              ) : null,
            )}
            {frame >= tDem && (
              <div style={{ display: "flex", gap: 12 }}>
                {["assurance", "jambe de stratégie", "gestion d'un stock"].map((t, i) => (
                  <Pop key={t} at={tDem + 10 + i * 10}>
                    <Pill text={t} size={26} color={C.context} />
                  </Pop>
                ))}
              </div>
            )}
          </div>
        </div>
      </Beat>
      <Beat from={tTerm} style={{ left: 0, top: 0 }}>
        <div style={{ position: "relative", width: STAGE_W, height: 690 }}>
          <div style={{ position: "absolute", left: 80, top: 30 }}>
            <Label size={26}>volatilité implicite selon l'échéance</Label>
            <div style={{ marginTop: 20 }}>
              <Curve pts={term} from={tTerm + 10} width={860} height={380} xLabels={["1 sem.", "1 mois", "2 mois", "3 mois", "6 mois", "1 an"]} hi={frame >= tEvt ? [0] : []} hiColor={C.accentBright} />
            </div>
          </div>
          {frame >= tEvt && (
            <div style={{ position: "absolute", left: 120, top: 20 }}>
              <Pop at={tEvt}>
                <CalendarPage top="ÉVÉNEMENT" big="!" size={120} />
              </Pop>
            </div>
          )}
          <div style={{ position: "absolute", left: 1060, top: 60, width: 680, display: "flex", flexDirection: "column", gap: 20 }}>
            {frame >= tEvt && (
              <Pop at={tEvt + 20}>
                <Panel style={{ padding: "14px 20px" }}>
                  <Label size={28} color={C.textPrimary}>courte au-dessus de la longue : peu de temps pour absorber l'incertitude</Label>
                </Panel>
              </Pop>
            )}
            {frame >= tInv && (
              <Pop at={tInv}>
                <Stamp at={tInv} text="UN ÉTAT, PAS UNE PRÉVISION" size={34} color={C.accentBright} />
              </Pop>
            )}
            {frame >= tCmp && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 20 }}>
                {["même horodatage", "delta comparable", "jours avant l'échéance"].map((t, i) => (
                  <Pop key={t} at={tCmp + 12 + i * 14}>
                    <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                      <CheckDraw at={tCmp + 16 + i * 14} size={40} />
                      <Label size={28} color={C.textPrimary}>{t}</Label>
                    </div>
                  </Pop>
                ))}
              </div>
            )}
          </div>
        </div>
      </Beat>
    </SceneShell>
  );
};

export const OpenInterest: React.FC<SceneProps> = ({ words, durationInFrames }) => {
  const frame = useCurrentFrame();
  const cue = makeCue(words);
  const tVol = cue("le volume compte");
  const tOi = cue("l interet ouvert compte");
  const tLate = cue("sa publication");
  const tBig = cue("un gros interet ouvert");
  const tMix = cue("mais il peut contenir");
  const tPub = cue("les donnees publiques");
  const tDed = cue("en deduire");
  const traded = Math.max(0, Math.round(interpolate(frame, [tVol, tVol + 90], [0, 12480], clamp)));
  const BARS = [0.25, 0.4, 0.55, 1, 0.5, 0.35, 0.2];
  const SEG = [
    { t: "achetées", col: C.positive, h: 0.3 },
    { t: "vendues", col: C.negative, h: 0.25 },
    { t: "couvertures", col: C.context, h: 0.25 },
    { t: "jambes", col: C.accent, h: 0.2 },
  ];
  return (
    <SceneShell eyebrow="F11 · Volume & intérêt ouvert" title="Ce qu'on voit… et ce qu'on ne voit pas" durationInFrames={durationInFrames}>
      <Sfx file="tick.wav" at={tVol} volume={0.35} />
      <Sfx file="pop.wav" at={tOi} volume={0.4} />
      <Sfx file="whoosh.wav" at={tBig} volume={0.4} />
      <Sfx file="pop.wav" at={tMix} volume={0.4} />
      <Sfx file="bass.wav" at={tDed} volume={0.4} />
      <Beat from={tVol} to={tBig} style={{ left: 0, top: 0 }}>
        <Center gap={80}>
          <Pop at={tVol}>
            <Panel style={{ width: 620, padding: 28, textAlign: "center" }}>
              <Big size={34}>volume</Big>
              <div style={{ fontFamily: theme.mono, fontSize: 80, color: C.accentBright, fontWeight: 900 }}>{traded.toLocaleString("fr-FR")}</div>
              <Label size={24} color={C.textPrimary}>contrats échangés sur la période, allers-retours compris</Label>
            </Panel>
          </Pop>
          {frame >= tOi && (
            <Pop at={tOi}>
              <Panel glow style={{ width: 620, padding: 28, textAlign: "center" }}>
                <Big size={34}>intérêt ouvert</Big>
                <div style={{ display: "flex", flexDirection: "column-reverse", alignItems: "center", gap: 4, height: 150, justifyContent: "flex-start" }}>
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} style={{ width: 220, height: 18, borderRadius: 4, background: C.context, opacity: frame >= tOi + i * 6 ? 1 : 0 }} />
                  ))}
                </div>
                <Label size={24} color={C.textPrimary}>contrats encore ouverts, après la chambre de compensation</Label>
                {frame >= tLate && <Label size={24} color={C.accentBright}>publication parfois en retard</Label>}
              </Panel>
            </Pop>
          )}
        </Center>
      </Beat>
      <Beat from={tBig} style={{ left: 0, top: 0 }}>
        <div style={{ position: "relative", width: STAGE_W, height: 690 }}>
          <div style={{ position: "absolute", left: 80, top: 40, display: "flex", alignItems: "flex-end", gap: 26, height: 440 }}>
            {BARS.map((b, i) => {
              const p = interpolate(frame, [tBig + i * 4, tBig + 30 + i * 4], [0, 1], { ...clamp, easing: theme.ease.out });
              const split = i === 3 && frame >= tMix;
              return (
                <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 80, height: 400 * b * p, borderRadius: 8, overflow: "hidden", display: "flex", flexDirection: "column", background: i === 3 ? C.accent : C.context }}>
                    {split &&
                      SEG.map((s, k) => (
                        <div key={s.t} style={{ height: `${s.h * 100}%`, background: s.col, opacity: frame >= tMix + k * 10 ? 1 : 0 }} />
                      ))}
                  </div>
                  <div style={{ color: C.textSecondary, fontFamily: theme.mono, fontSize: 18 }}>{2250 + i * 50}</div>
                </div>
              );
            })}
          </div>
          {frame >= tMix && (
            <div style={{ position: "absolute", left: 830, top: 60, display: "flex", flexDirection: "column", gap: 12 }}>
              {SEG.map((s, k) => (
                <Pop key={s.t} at={tMix + k * 10}>
                  <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    <div style={{ width: 26, height: 26, borderRadius: 6, background: s.col }} />
                    <Label size={28} color={C.textPrimary}>{s.t}</Label>
                  </div>
                </Pop>
              ))}
              <Label size={24}>… chez des dizaines d'intervenants</Label>
            </div>
          )}
          {frame >= tPub && (
            <div style={{ position: "absolute", left: 1180, top: 40, display: "flex", gap: 10 }}>
              {[0, 1, 2].map((i) => (
                <Pop key={i} at={tPub + i * 8}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <div style={{ fontSize: 50, color: C.accentBright, fontWeight: 900 }}>?</div>
                    <Person size={110} phase={i} color={C.textSecondary} />
                  </div>
                </Pop>
              ))}
            </div>
          )}
          {frame >= tPub && (
            <div style={{ position: "absolute", left: 1150, top: 330, width: 560 }}>
              <Pop at={tPub + 20}>
                <Label size={26} color={C.textPrimary}>quel côté pour les teneurs de marché ? couverts ? de gré à gré ?</Label>
              </Pop>
            </div>
          )}
          {frame >= tDed && (
            <div style={{ position: "absolute", left: 830, top: 440, display: "flex", gap: 16 }}>
              {["leur position exacte", "une bascule du gamma", "une cible de prix"].map((t, i) => (
                <Pop key={t} at={tDed + i * 12}>
                  <div style={{ position: "relative" }}>
                    <Pill text={t} size={26} color={C.textMuted} />
                    <div style={{ position: "absolute", left: "35%", top: -18 }}>
                      <CrossDraw at={tDed + i * 12 + 8} size={60} />
                    </div>
                  </div>
                </Pop>
              ))}
            </div>
          )}
        </div>
      </Beat>
    </SceneShell>
  );
};

export const Hedging: React.FC<SceneProps> = ({ words, durationInFrames }) => {
  const frame = useCurrentFrame();
  const cue = makeCue(words);
  const tQ = cue("comment fonctionne");
  const tAdj = cue("comme le delta bouge");
  const tEx = cue("exemple avec une position");
  const tCalc = cue("dix fois cent");
  const tNeutre = cue("pour etre neutre");
  const tPasse = cue("si le delta passe");
  const tSuit = cue("et la couverture doit suivre");
  const tOnly = cue("ce calcul marche");
  const tOi = cue("l interet ouvert agrege");
  const tGraph = cue("donc les graphiques");
  const later = frame >= tPasse;
  const tilt = frame < tQ + 30 ? -14 : frame < tAdj ? interpolate(frame, [tQ + 30, tQ + 60], [-14, 0], clamp) : interpolate(Math.sin((frame - tAdj) / 10), [-1, 1], [-6, 6]);
  return (
    <SceneShell eyebrow="F11 · Couverture delta" title="Une mécanique… conditionnelle" durationInFrames={durationInFrames}>
      <Sfx file="pop.wav" at={tQ} volume={0.4} />
      <Sfx file="tick.wav" at={tCalc} volume={0.4} />
      <Sfx file="pop.wav" at={tNeutre} volume={0.4} />
      <Sfx file="whoosh.wav" at={tPasse} volume={0.4} />
      <Sfx file="bass.wav" at={tOi} volume={0.4} />
      <Sfx file="chime.wav" at={tGraph} volume={0.45} />
      <Beat from={tQ} to={tEx} style={{ left: 0, top: 0 }}>
        <Center column gap={30}>
          <div style={{ display: "flex", alignItems: "center", gap: 50 }}>
            <Pill text="sensibilité de l'option (delta)" size={30} />
            <ScaleIcon size={260} tilt={tilt} color={C.accent} />
            <Pill text="achat / vente du sous-jacent" size={30} />
          </div>
          {frame >= tAdj && (
            <Pop at={tAdj}>
              <Label size={32} color={C.textPrimary}>le delta bouge → il faut réajuster</Label>
            </Pop>
          )}
        </Center>
      </Beat>
      <Beat from={tEx} to={tOnly} style={{ left: 0, top: 0 }}>
        <div style={{ position: "relative", width: STAGE_W, height: 690 }}>
          <div style={{ position: "absolute", left: 80, top: 40 }}>
            <Pop at={tEx}>
              <Ticket title="POSITION CONNUE" rows={[["options d'achat achetées", "10"], ["multiplicateur", "100"], ["delta", later ? "0,55" : "0,40"]]} width={520} color={C.positive} hiRow={later ? 2 : undefined} />
            </Pop>
          </div>
          <div style={{ position: "absolute", left: 700, top: 50, display: "flex", flexDirection: "column", gap: 22 }}>
            <CalcLine at={tCalc} left={later ? "10 × 100 × 0,55 =" : "10 × 100 × 0,40 ="} right={later ? "550 unités" : "400 unités"} size={44} />
            <CalcLine at={tNeutre} left="couverture :" right={later ? "vendre ≈ 550" : "vendre ≈ 400"} size={44} color={C.negative} />
            {frame >= tSuit && <CalcLine at={tSuit} left="selon sa politique réelle" size={30} color={C.textSecondary} />}
          </div>
          <div style={{ position: "absolute", left: 760, top: 360 }}>
            <ScaleIcon size={220} tilt={frame >= tPasse && frame < tSuit ? -10 : 0} color={C.accent} />
          </div>
        </div>
      </Beat>
      <Beat from={tOnly} style={{ left: 0, top: 0 }}>
        <Center column gap={34}>
          <Pop at={tOnly}>
            <div style={{ display: "flex", gap: 18, alignItems: "center" }}>
              <CheckDraw at={tOnly + 6} size={56} />
              <Label size={34} color={C.textPrimary}>possible seulement si on connaît le sens et la taille</Label>
            </div>
          </Pop>
          {frame >= tOi && (
            <Pop at={tOi}>
              <div style={{ display: "flex", gap: 18, alignItems: "center" }}>
                <CrossDraw at={tOi + 6} size={56} />
                <Label size={34} color={C.textPrimary}>l'intérêt ouvert agrégé ne donne ni l'un, ni l'autre</Label>
              </div>
            </Pop>
          )}
          {frame >= tGraph && (
            <div style={{ display: "flex", alignItems: "center", gap: 40, marginTop: 10 }}>
              <Panel style={{ padding: 16 }}>
                <LiveChart data={series(30, 4, 0.02, 1)} width={420} height={150} from={tGraph} drawFrames={40} label="« exposition gamma des teneurs de marché »" />
              </Panel>
              <Stamp at={tGraph + 30} text="MODÈLE, PAS UN FAIT" size={40} />
            </div>
          )}
        </Center>
      </Beat>
    </SceneShell>
  );
};

export const GvzCvol: React.FC<SceneProps> = ({ words, durationInFrames }) => {
  const frame = useCurrentFrame();
  const cue = makeCue(words);
  const tGvz = cue("le gvz calcule");
  const tTrente = cue("il represente");
  const tFonds = cue("mais gld est un fonds");
  const tUtile = cue("le gvz est donc");
  const tCvol = cue("le cvol de l or");
  const tNot = cue("les deux ne sont pas");
  const tDiv = cue("s ils divergent");
  return (
    <SceneShell eyebrow="F11 · GVZ et CVOL" title="Deux indices, deux constructions" durationInFrames={durationInFrames}>
      <Sfx file="pop.wav" at={tGvz} volume={0.4} />
      <Sfx file="tick.wav" at={tFonds} volume={0.4} />
      <Sfx file="pop.wav" at={tCvol} volume={0.4} />
      <Sfx file="bass.wav" at={tNot} volume={0.4} />
      <Beat from={tGvz} style={{ left: 0, top: 0 }}>
        <div style={{ position: "relative", width: STAGE_W, height: 690 }}>
          <div style={{ position: "absolute", left: 60, top: 20, width: 760 }}>
            <Pop at={tGvz}>
              <Panel glow={frame < tCvol} style={{ padding: 26 }}>
                <Big size={52} color={C.accentBright}>GVZ</Big>
                <Label size={26} color={C.textPrimary}>calculé par la bourse Cboe · options sur le fonds GLD</Label>
                {frame >= tTrente && <Label size={26} color={C.textPrimary}>volatilité attendue ≈ 30 jours, exprimée sur un an</Label>}
              </Panel>
            </Pop>
            {frame >= tFonds && (
              <div style={{ marginTop: 24, display: "flex", gap: 24, alignItems: "center" }}>
                <Tank level={0.55} label="GLD" color={C.accent} w={150} h={170} />
                <div style={{ display: "flex", flexWrap: "wrap", gap: 10, width: 540 }}>
                  {["horaires", "frais", "mécanisme des parts", "liquidité", "écart avec le comptant / le terme"].map((t, i) => (
                    <Pop key={t} at={tFonds + 12 + i * 10}>
                      <Pill text={t} size={24} />
                    </Pop>
                  ))}
                </div>
              </div>
            )}
            {frame >= tUtile && (
              <div style={{ marginTop: 20 }}>
                <Pop at={tUtile}>
                  <Label size={26} color={C.accentBright}>un contexte utile · pas la volatilité de l'or au comptant · pas une direction</Label>
                </Pop>
              </div>
            )}
          </div>
          {frame >= tCvol && (
            <div style={{ position: "absolute", left: 1000, top: 20, width: 740 }}>
              <Pop at={tCvol}>
                <Panel glow={frame < tNot} style={{ padding: 26 }}>
                  <Big size={52} color={C.context}>CVOL de l'or</Big>
                  <Label size={26} color={C.textPrimary}>publié par le CME · options sur les contrats à terme sur l'or</Label>
                  <Label size={26} color={C.textPrimary}>sa propre méthodologie</Label>
                </Panel>
              </Pop>
            </div>
          )}
          {frame >= tNot && (
            <div style={{ position: "absolute", left: 860, top: 60 }}>
              <Pop at={tNot}>
                <Big size={90} color={C.negative}>≠</Big>
              </Pop>
            </div>
          )}
          {frame >= tDiv && (
            <div style={{ position: "absolute", left: 1000, top: 330, width: 740 }}>
              <Pop at={tDiv}>
                <Panel style={{ padding: "16px 22px" }}>
                  <Label size={26} color={C.textPrimary}>une divergence peut venir de la construction ou des horaires</Label>
                  <Label size={26} color={C.negative}>pas d'une contradiction à exploiter</Label>
                </Panel>
              </Pop>
            </div>
          )}
        </div>
      </Beat>
    </SceneShell>
  );
};

export const EventRisk: React.FC<SceneProps> = ({ words, durationInFrames }) => {
  const frame = useCurrentFrame();
  const cue = makeCue(words);
  const tList = cue("les evenements concentrent");
  const tEx = cue("exemple avant la publication");
  const tSort = cue("le chiffre sort");
  const tPourtant = cue("et pourtant la volatilite");
  const tCrush = cue("c est l ecrasement");
  const tHachim = cue("hachim avait achete");
  const tImp = cue("impossible a dire");
  const tHaute = cue("une volatilite haute");
  const W = 1100;
  const H = 300;
  const ivPts: Array<[number, number]> = [[0, 0.3], [0.15, 0.36], [0.3, 0.45], [0.45, 0.6], [0.55, 0.78], [0.6, 0.8], [0.66, 0.35], [0.8, 0.3], [1, 0.28]];
  const pxPts: Array<[number, number]> = [[0, 0.45], [0.15, 0.46], [0.3, 0.44], [0.45, 0.45], [0.55, 0.46], [0.6, 0.46], [0.66, 0.8], [0.8, 0.84], [1, 0.82]];
  const reveal = frame < tSort ? 0.58 : frame < tPourtant ? 0.62 : 1;
  const ivShown = ivPts.filter(([x]) => x <= reveal);
  const pxShown = pxPts.filter(([x]) => x <= (frame >= tSort ? 1 : 0.58));
  const path = (pts: Array<[number, number]>) => pts.map(([x, y], i) => `${i ? "L" : "M"}${(x * W).toFixed(1)},${(H - y * H).toFixed(1)}`).join(" ");
  return (
    <SceneShell eyebrow="F11 · Événements" title="La volatilité monte… puis s'écrase" durationInFrames={durationInFrames}>
      <Sfx file="tick.wav" at={tList} volume={0.35} />
      <Sfx file="pop.wav" at={tEx} volume={0.4} />
      <Sfx file="whoosh.wav" at={tSort} volume={0.45} />
      <Sfx file="bass.wav" at={tCrush} volume={0.5} />
      <Sfx file="pop.wav" at={tHachim} volume={0.4} />
      <Beat from={tList} to={tEx} style={{ left: 0, top: 0 }}>
        <Center gap={24}>
          {["la Fed", "l'inflation", "l'emploi", "les banques centrales", "la géopolitique"].map((t, i) => (
            <Pop key={t} at={tList + 20 + i * 12}>
              <CalendarPage top="ÉVÉNEMENT" big={t.split(" ").pop()!.slice(0, 3).toUpperCase()} size={160} />
              <div style={{ textAlign: "center", marginTop: 10 }}>
                <Label size={24} color={C.textPrimary}>{t}</Label>
              </div>
            </Pop>
          ))}
        </Center>
      </Beat>
      <Beat from={tEx} to={tHachim} style={{ left: 0, top: 0 }}>
        <div style={{ position: "relative", width: STAGE_W, height: 690 }}>
          <div style={{ position: "absolute", left: 120, top: 40 }}>
            <svg width={W} height={H + 60} style={{ overflow: "visible" }}>
              <line x1={0.61 * W} y1={0} x2={0.61 * W} y2={H} stroke={C.textMuted} strokeDasharray="6 6" strokeWidth={2} />
              <text x={0.61 * W} y={H + 40} fill={C.accentBright} fontSize={24} textAnchor="middle" fontFamily={theme.mono}>publication de l'inflation</text>
              <path d={path(ivShown)} stroke={C.context} strokeWidth={6} fill="none" strokeLinejoin="round" />
              <path d={path(pxShown)} stroke={C.accent} strokeWidth={4} fill="none" strokeDasharray={frame >= tSort ? "0" : "4 8"} />
            </svg>
          </div>
          <div style={{ position: "absolute", left: 1300, top: 60, display: "flex", flexDirection: "column", gap: 14 }}>
            <Pill text="volatilité à 1 semaine" color={C.context} size={26} />
            <Pill text="prix de l'or" color={C.accent} size={26} />
          </div>
          {frame >= tSort && (
            <div style={{ position: "absolute", left: 1300, top: 200 }}>
              <Pop at={tSort}>
                <Label size={28} color={C.accentBright}>l'or bouge fortement…</Label>
              </Pop>
            </div>
          )}
          {frame >= tCrush && (
            <div style={{ position: "absolute", left: 0, width: STAGE_W, top: 450, display: "flex", justifyContent: "center" }}>
              <Stamp at={tCrush} text="ÉCRASEMENT DE LA VOLATILITÉ" size={48} color={C.context} />
            </div>
          )}
        </div>
      </Beat>
      <Beat from={tHachim} style={{ left: 0, top: 0 }}>
        <div style={{ position: "relative", width: STAGE_W, height: 690 }}>
          <div style={{ position: "absolute", left: 160, top: 120 }}>
            <Person size={220} color={C.accent} label="Hachim" />
          </div>
          <div style={{ position: "absolute", left: 420, top: 60 }}>
            <Pop at={tHachim}>
              <Bubble text="j'avais vu juste sur le sens !" width={420} tail="left" />
            </Pop>
          </div>
          {frame >= tImp && (
            <div style={{ position: "absolute", left: 900, top: 90, width: 820, display: "flex", flexDirection: "column", gap: 16 }}>
              <Big size={40}>a-t-il gagné ? impossible à dire sans :</Big>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
                {["son prix d'exercice", "sa prime", "ses sensibilités", "ses coûts"].map((t, i) => (
                  <Pop key={t} at={tImp + 20 + i * 10}>
                    <Pill text={t} size={28} />
                  </Pop>
                ))}
              </div>
              <Pop at={tImp + 70}>
                <Label size={30} color={C.accentBright}>deviner la direction ne suffit pas</Label>
              </Pop>
            </div>
          )}
          {frame >= tHaute && (
            <div style={{ position: "absolute", left: 0, width: STAGE_W, top: 470, display: "flex", justifyContent: "center", gap: 30 }}>
              <Pop at={tHaute}>
                <Pill text="volatilité haute ≠ haussière ≠ baissière" size={30} filled />
              </Pop>
              <Pop at={tHaute + 50}>
                <Pill text="volatilité basse ≠ calme garanti" size={30} filled />
              </Pop>
            </div>
          )}
        </div>
      </Beat>
    </SceneShell>
  );
};

export const Mistakes: React.FC<SceneProps> = ({ words, durationInFrames }) => {
  const frame = useCurrentFrame();
  const cue = makeCue(words);
  const TRAPS = [
    { t: "Deviner la position des teneurs de marché avec l'intérêt ouvert public", at: cue("piege un") },
    { t: "Afficher une exposition gamma ou une bascule précise sans positions signées", at: cue("piege deux") },
    { t: "Trader la « douleur maximale », comme si le prix était aimanté", at: cue("piege trois") },
    { t: "Tirer une direction de la volatilité, de l'asymétrie, de l'intérêt ouvert ou d'une échéance", at: cue("piege quatre") },
    { t: "Mélanger options GLD, sur contrats à terme, au comptant et de gré à gré", at: cue("et piege cinq") },
  ];
  const active = TRAPS.reduce((acc, x, i) => (frame >= x.at ? i : acc), -1);
  return (
    <SceneShell eyebrow="F11 · Pièges" title="Cinq pièges à éviter" durationInFrames={durationInFrames}>
      {TRAPS.map((x) => (
        <Sfx key={x.t} file="bass.wav" at={x.at} volume={0.4} />
      ))}
      <Beat from={0} style={{ left: 0, top: 0 }}>
        <div style={{ width: STAGE_W, height: 660, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", gap: 18 }}>
          {TRAPS.map((x, i) => (
            <Pop key={x.t} at={x.at}>
              <Panel glow={i === active} style={{ width: 1500, padding: "18px 26px", display: "flex", alignItems: "center", gap: 22, opacity: i === active ? 1 : 0.7 }}>
                <div style={{ width: 150, color: C.negative, fontFamily: theme.mono, fontSize: 24, fontWeight: 900, letterSpacing: 2 }}>PIÈGE {i + 1}</div>
                <CrossDraw at={x.at + 20} size={44} />
                <Label size={30} color={C.textPrimary}>{x.t}</Label>
              </Panel>
            </Pop>
          ))}
        </div>
      </Beat>
    </SceneShell>
  );
};

const FaceKpi: React.FC<{ label: string; value: string; lit: boolean; proxy?: boolean; big?: boolean }> = ({ label, value, lit, proxy, big }) => (
  <div style={{ padding: "14px 18px", borderRadius: 12, background: lit ? `${C.accent}22` : C.panel, border: `1.5px solid ${lit ? C.accent : C.hairline}`, display: "flex", alignItems: "center", gap: 14 }}>
    <div style={{ flex: 1 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ color: C.textSecondary, fontSize: 22 }}>{label}</span>
        <span style={{ color: C.textMuted, fontSize: 14, border: `1px solid ${C.hairline}`, borderRadius: 5, padding: "0 6px" }}>RÉEL</span>
      </div>
      <div style={{ fontFamily: theme.mono, fontSize: big ? 56 : 38, fontWeight: 800, color: C.textPrimary }}>{value}</div>
    </div>
    {proxy && <span style={{ color: C.accentBright, border: `1.5px solid ${C.accentBright}`, borderRadius: 6, padding: "2px 8px", fontSize: 16, fontWeight: 800, letterSpacing: 1 }}>PROXY</span>}
    <span style={{ color: C.textMuted, fontSize: 15, border: `1px solid ${C.hairline}`, borderRadius: 5, padding: "1px 8px" }}>Contextuel</span>
  </div>
);

export const TerminalUsage: React.FC<SceneProps> = ({ words, durationInFrames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const cue = makeCue(words);
  const tFace = cue("la facade de f11");
  const tLevel = cue("le niveau du gvz");
  const tProxy = cue("il rappelle");
  const tVar = cue("puis sa variation");
  const tSrc = cue("la source c est");
  const tPaid = cue("le cvol l asymetrie");
  const tCtx = cue("les trois chiffres restent");
  const tPic = cue("un pic d une seule");
  const tChart = cue("pour aller plus loin");
  const tRef = cue("et le reflexe");
  const lit = (a: number, b: number) => frame >= a && frame < b;
  const p = spring({ frame: frame - tFace, fps, config: theme.spring.smooth });
  return (
    <SceneShell eyebrow="F11 · Dans le terminal" title="Une façade volontairement minimale" durationInFrames={durationInFrames}>
      <Sfx file="pop.wav" at={tFace} volume={0.4} />
      <Sfx file="tick.wav" at={tLevel} volume={0.4} />
      <Sfx file="tick.wav" at={tVar} volume={0.4} />
      <Sfx file="pop.wav" at={tSrc} volume={0.4} />
      <Sfx file="chime.wav" at={tCtx} volume={0.45} />
      <Beat from={tFace - 6} style={{ left: 0, top: 0 }}>
        <div style={{ position: "relative", width: STAGE_W, height: 690 }}>
          <div style={{ position: "absolute", left: 20, top: 0, width: 820, opacity: p, transform: `translateY(${interpolate(p, [0, 1], [30, 0])}px)` }}>
            <Panel style={{ padding: 22 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                <TerminalGlyph size={30} />
                <span style={{ color: C.textPrimary, fontSize: 26, fontWeight: 700 }}>Options Or / Vol</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <FaceKpi label="Gold Vol (GVZ)" value="15,8" lit={lit(tLevel, tVar)} proxy big />
                <FaceKpi label="1D Change" value="+0,3" lit={lit(tVar, tSrc)} />
                <FaceKpi label="5D Change" value="−0,6" lit={lit(tVar + 30, tSrc)} />
              </div>
              <div style={{ marginTop: 12, color: C.textMuted, fontFamily: theme.mono, fontSize: 15 }}>valeurs d'exemple · source FRED (GVZCLS) · quotidien</div>
            </Panel>
            {frame >= tChart && (
              <div style={{ marginTop: 16, display: "flex", gap: 14 }}>
                <Pop at={tChart + 10}>
                  <Pill text="graphique : Or / GVZ" size={26} />
                </Pop>
                <Pop at={tChart + 24}>
                  <Pill text="graphique : VIX / GVZ" size={26} />
                </Pop>
              </div>
            )}
          </div>
          <div style={{ position: "absolute", left: 900, top: 0, width: 840, display: "flex", flexDirection: "column", gap: 16 }}>
            {frame >= tProxy && frame < tSrc && (
              <Pop at={tProxy}>
                <Panel style={{ padding: "16px 22px" }}>
                  <Big size={30}>badge PROXY</Big>
                  <Label size={26} color={C.textPrimary}>GVZ = options sur GLD, pas les vraies options sur l'or, ni le CVOL</Label>
                  {frame >= tVar && <Label size={26} color={C.accentBright}>variations sur 1 jour et 5 jours, en points d'indice</Label>}
                </Panel>
              </Pop>
            )}
            {frame >= tSrc && frame < tCtx && (
              <Pop at={tSrc}>
                <Panel style={{ padding: "16px 22px" }}>
                  <Big size={30}>la source</Big>
                  <Label size={26} color={C.textPrimary}>clôture quotidienne du GVZ, sur FRED (Réserve fédérale de Saint-Louis)</Label>
                  {frame >= tPaid && (
                    <div style={{ marginTop: 10, display: "flex", gap: 10, flexWrap: "wrap" }}>
                      {["CVOL", "asymétrie", "ventes / achats"].map((t) => (
                        <Pill key={t} text={`${t} : non branché`} size={22} color={C.textMuted} />
                      ))}
                      <Label size={22}>(source payante)</Label>
                    </div>
                  )}
                </Panel>
              </Pop>
            )}
            {frame >= tCtx && (
              <Pop at={tCtx}>
                <Panel glow style={{ padding: "16px 22px" }}>
                  <Label size={28} color={C.textPrimary}>tout reste « Contextuel » : la volatilité ne donne pas de sens</Label>
                  {frame >= tPic && <Label size={26} color={C.accentBright}>un pic d'une séance ≠ signal de positionnement</Label>}
                </Panel>
              </Pop>
            )}
            {frame >= tRef && (
              <Pop at={tRef}>
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                  <Pill text="horizon de l'option = horizon de l'événement (F13)" size={26} filled />
                  <Pill text="la direction : F2 · F3 · F6 · F7" size={26} filled />
                </div>
              </Pop>
            )}
          </div>
        </div>
      </Beat>
    </SceneShell>
  );
};

export const GlossaryFlash: React.FC<SceneProps> = ({ words, durationInFrames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const cue = makeCue(words);
  const TERMS = [
    { term: "Prime", def: "Le prix payé par l'acheteur, et reçu par le vendeur", at: cue("prime le prix"), icon: <CoinStackIcon size={180} /> },
    { term: "Prix d'exercice", def: "Le niveau fixé par le contrat pour calculer ce que rapporte l'option", at: cue("prix d exercice le niveau"), icon: <div style={{ fontFamily: theme.mono, fontSize: 90, fontWeight: 900, color: C.accentBright }}>2 400</div> },
    { term: "Volatilité implicite", def: "La volatilité qui réconcilie un modèle avec le prix observé", at: cue("volatilite implicite la"), icon: <div style={{ fontSize: 150, color: C.context, fontFamily: "Georgia, serif" }}>σ</div> },
    { term: "Volatilité réalisée", def: "Une mesure passée de l'agitation des prix", at: cue("volatilite realisee une"), icon: <LiveChart data={series(30, 7, 0, 1.5)} width={300} height={160} from={0} drawFrames={1} /> },
    { term: "Delta", def: "La sensibilité de l'option à une petite variation du sous-jacent", at: cue("delta la sensibilite"), icon: <div style={{ fontSize: 170, color: C.accentBright, fontFamily: "Georgia, serif" }}>Δ</div> },
    { term: "GVZ", def: "L'indice de volatilité à 30 jours tiré des options sur GLD, pas la volatilité de l'or au comptant", at: cue("et gvz"), icon: <Tank level={0.55} label="GLD" color={C.accent} /> },
  ];
  const activeIdx = TERMS.reduce((acc, t, i) => (frame >= t.at ? i : acc), -1);
  return (
    <SceneShell eyebrow="F11 · Vocabulaire" title="Le vocabulaire, en rafale" durationInFrames={durationInFrames}>
      {TERMS.map((t) => (
        <Sfx key={t.term} file="chime.wav" at={t.at - 2} volume={0.4} />
      ))}
      <div style={{ position: "absolute", left: 0, top: 0, width: STAGE_W, display: "flex", gap: 12, justifyContent: "center" }}>
        {TERMS.map((t, i) => (
          <div key={t.term} style={{ padding: "8px 18px", borderRadius: 999, border: `1.5px solid ${i <= activeIdx ? C.accent : C.hairline}`, color: i === activeIdx ? C.bg : i < activeIdx ? C.accentBright : C.textMuted, background: i === activeIdx ? C.accent : "transparent", fontSize: 18, fontWeight: 700 }}>
            {t.term}
          </div>
        ))}
      </div>
      {TERMS.map((t, i) => {
        if (i !== activeIdx) return null;
        const p = spring({ frame: frame - t.at, fps, config: theme.spring.smooth });
        return (
          <div key={t.term} style={{ position: "absolute", left: STAGE_W / 2 - 620, top: 100, width: 1240, opacity: p, transform: p > 0.995 ? "none" : `perspective(1200px) rotateY(${interpolate(p, [0, 1], [70, 0])}deg) scale(${interpolate(p, [0, 1], [0.85, 1])})` }}>
            <Panel glow style={{ display: "flex", alignItems: "center", gap: 40, padding: 44, minHeight: 420 }}>
              <div style={{ width: 380, display: "flex", justifyContent: "center" }}>{t.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ color: C.accent, fontFamily: theme.mono, fontSize: 20 }}>
                  {i + 1} / {TERMS.length}
                </div>
                <Big size={46} color={C.accentBright}>
                  <span style={{ textAlign: "left", display: "block" }}>{t.term}</span>
                </Big>
                <div style={{ marginTop: 16 }}>
                  <Label color={C.textPrimary} size={29}>
                    <span style={{ textAlign: "left", display: "block" }}>{t.def}</span>
                  </Label>
                </div>
              </div>
            </Panel>
          </div>
        );
      })}
    </SceneShell>
  );
};

export const Recap: React.FC<SceneProps> = ({ words, durationInFrames }) => {
  const frame = useCurrentFrame();
  const cue = makeCue(words);
  const breathe = useBreathe(0.3);
  const ITEMS = [
    { t: "Les options donnent un prix à l'incertitude : une amplitude, pas une direction", at: cue("les options donnent") },
    { t: "Les lettres grecques : des sensibilités qui bougent, pas des promesses", at: cue("les lettres grecques") },
    { t: "Volume et intérêt ouvert : observables · intentions et teneurs de marché : non", at: cue("le volume et") },
    { t: "GVZ = options sur GLD · CVOL = options du CME · garde la distinction", at: cue("et le gvz vient") },
  ];
  const tNever = cue("ne devine jamais");
  return (
    <SceneShell eyebrow="F11 · À retenir" title="Ce qu'il faut garder de F11" durationInFrames={durationInFrames}>
      {ITEMS.map((it) => (
        <Sfx key={it.t} file="tick.wav" at={it.at} volume={0.4} />
      ))}
      <Sfx file="chime.wav" at={tNever} volume={0.55} />
      <Beat from={0} style={{ left: 0, top: 0 }}>
        <div style={{ width: STAGE_W, height: 650, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 22 }}>
          {ITEMS.map((it) => (
            <Pop key={it.t} at={it.at}>
              <Panel style={{ width: 1400, display: "flex", alignItems: "center", gap: 20, padding: "18px 28px" }}>
                <CheckDraw at={it.at + 6} size={46} />
                <Label size={30} color={C.textPrimary}>{it.t}</Label>
              </Panel>
            </Pop>
          ))}
          {frame >= tNever && (
            <div style={{ transform: `scale(${breathe.scale})` }}>
              <Pop at={tNever}>
                <Big size={64} color={C.accentBright} glow>
                  Ne devine jamais. Vérifie.
                </Big>
              </Pop>
            </div>
          )}
        </div>
      </Beat>
    </SceneShell>
  );
};
