// F11 v5 — part 2: who is on the other side (dealers, long/short gamma, the convention, the GEX maths).
import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { theme } from "../theme";
import { Sfx, makeCue, Panel, CoinStackIcon, BankIcon } from "./shared";
import type { SceneProps } from "./shared";
import { Beat, Pop, Person, Bubble, clamp } from "./characters";
import { SceneShell, Center, Big, Label, STAGE_W } from "./stage";
import { Pill, CrossDraw, Stamp, CalendarPage, ShieldGlyph } from "./props5";
import { Ticket, CalcLine } from "./props11";
import { GexChart, DashCards, Road, Flow, DealerDesk } from "./dash";

const C = theme.colors;
const S: React.FC<{ children: React.ReactNode }> = ({ children }) => <div style={{ position: "relative", width: STAGE_W, height: 690 }}>{children}</div>;
const At: React.FC<{ x: number; y: number; children: React.ReactNode; w?: number }> = ({ x, y, children, w }) => (
  <div style={{ position: "absolute", left: x, top: y, width: w }}>{children}</div>
);

/** Price trace that oscillates: damped (long gamma) or amplifying (short gamma). */
const Trace: React.FC<{ from: number; kind: "damped" | "amplified"; width?: number; height?: number }> = ({ from, kind, width = 800, height = 360 }) => {
  const frame = useCurrentFrame();
  const n = Math.max(0, Math.min(240, frame - from));
  const pts: string[] = [];
  for (let i = 0; i <= n; i++) {
    const amp = kind === "damped" ? 120 * Math.exp(-i / 70) + 8 : Math.min(160, 14 * Math.exp(i / 80));
    const y = height / 2 - Math.sin(i / 11) * amp;
    pts.push(`${i ? "L" : "M"}${((i / 240) * width).toFixed(1)},${y.toFixed(1)}`);
  }
  const col = kind === "damped" ? C.positive : C.negative;
  return (
    <svg width={width} height={height} style={{ overflow: "visible" }}>
      <line x1={0} x2={width} y1={height / 2} y2={height / 2} stroke={C.hairline} strokeDasharray="6 6" />
      <path d={pts.join(" ")} stroke={col} strokeWidth={4} fill="none" strokeLinejoin="round" />
    </svg>
  );
};

// ---------------------------------------------------------------------------
export const Dealers: React.FC<SceneProps> = ({ words, durationInFrames }) => {
  const frame = useCurrentFrame();
  const cue = makeCue(words);
  const tEach = cue("chaque option a un acheteur");
  const tWho = cue("mais qui est vraiment");
  const tMM = cue("la plupart du temps c est un teneur");
  const tRev = cue("son revenu c est l ecart");
  const tBooth = cue("comme un bureau de change");
  const tNoBet = cue("le bureau de change ne parie pas");
  const tSame = cue("le teneur de marche c est pareil");
  const tSells = cue("mais des qu il vend une option d achat");
  const tNeut = cue("alors il neutralise");
  const tHedge = cue("c est la couverture en delta");
  const tResult = cue("le resultat");
  const tBecause = cue("il n achete pas parce qu il croit");
  const tKey = cue("et c est ca la cle");
  const tKnew = cue("si on savait exactement");
  const tCharts = cue("c est precisement ce que");
  const tNobody = cue("ce stock personne ne le voit");
  return (
    <SceneShell eyebrow="F11 · Qui est en face ?" title="Le teneur de marché : un commerçant, pas un parieur" durationInFrames={durationInFrames}>
      <Sfx file="pop.wav" at={tMM} volume={0.4} />
      <Sfx file="click.wav" at={tRev} volume={0.4} />
      <Sfx file="whoosh.wav" at={tSells} volume={0.35} />
      <Sfx file="pop.wav" at={tNeut} volume={0.35} />
      <Sfx file="chime.wav" at={tKey} volume={0.45} />
      <Sfx file="bass.wav" at={tNobody} volume={0.45} />
      <Beat from={tEach} to={tBooth} style={{ left: 0, top: 0 }}>
        <S>
          <At x={140} y={180}>
            <Person size={220} color={C.positive} label="toi · acheteur" />
          </At>
          <At x={140} y={20}>
            <Pop at={tWho}>
              <Bubble text="qui me vend cette option ?" width={360} />
            </Pop>
          </At>
          {frame >= tMM && (
            <At x={880} y={100}>
              <Pop at={tMM}>
                <DealerDesk size={1.5} screen="6,95 | 7,05" />
                <Label size={26} color={C.textPrimary}>teneur de marché · banque ou société spécialisée</Label>
              </Pop>
            </At>
          )}
          {frame >= tRev && (
            <At x={500} y={520} w={900}>
              <Pop at={tRev}>
                <Pill text="achète à 6,95 · vend à 7,05 · gagne l'écart, des milliers de fois par jour" size={26} filled />
              </Pop>
            </At>
          )}
        </S>
      </Beat>
      <Beat from={tBooth} to={tSells} style={{ left: 0, top: 0 }}>
        <Center gap={80}>
          <Panel glow style={{ width: 620, textAlign: "center" }}>
            <Big size={40}>BUREAU DE CHANGE</Big>
            <div style={{ display: "flex", justifyContent: "space-around", margin: "20px 0", fontFamily: theme.mono, fontSize: 36 }}>
              <span style={{ color: C.positive }}>achat 1,33</span>
              <span style={{ color: C.negative }}>vente 1,39</span>
            </div>
            <CoinStackIcon size={90} />
          </Panel>
          <div style={{ display: "flex", flexDirection: "column", gap: 20, width: 700 }}>
            {frame >= tNoBet && (
              <Pop at={tNoBet}>
                <Pill text="ne parie pas sur le dollar · prend sa marge" size={30} />
              </Pop>
            )}
            {frame >= tSame && (
              <Pop at={tSame}>
                <Pill text="le teneur de marché : pareil, ne parie pas sur l'or" size={30} color={C.context} />
              </Pop>
            )}
          </div>
        </Center>
      </Beat>
      <Beat from={tSells} to={tKey} style={{ left: 0, top: 0 }}>
        <S>
          <At x={80} y={60}>
            <DealerDesk size={1.4} screen={frame >= tHedge ? "Δ = 0" : "Δ < 0 !"} screenColor={frame >= tHedge ? C.positive : C.negative} />
          </At>
          <At x={620} y={40} w={1000}>
            <Ticket title="IL VEND UNE OPTION D'ACHAT GLD" rows={[["si l'or monte", "il perd"]]} color={C.negative} width={600} />
          </At>
          {frame >= tNeut && (
            <At x={640} y={230}>
              <Flow at={tNeut + 20} buy text="achète des parts de GLD" />
            </At>
          )}
          {frame >= tHedge && (
            <At x={640} y={380}>
              <Pop at={tHedge}>
                <Pill text="couverture en delta : neutralise le risque" size={30} filled color={C.positive} />
              </Pop>
            </At>
          )}
          {frame >= tResult && (
            <At x={640} y={480} w={1050}>
              <Pop at={tResult}>
                <Panel style={{ padding: "14px 22px" }}>
                  <Label size={28} color={C.textPrimary}>acheteur / vendeur MÉCANIQUE de GLD</Label>
                  {frame >= tBecause && <Label size={24}>pas parce qu&apos;il croit à la hausse · parce que son tableau de risque l&apos;y oblige</Label>}
                </Panel>
              </Pop>
            </At>
          )}
        </S>
      </Beat>
      <Beat from={tKey} style={{ left: 0, top: 0 }}>
        <Center gap={70}>
          <Panel glow style={{ width: 620, textAlign: "center" }}>
            <BankIcon size={110} />
            <Big size={36}>stock d&apos;options des teneurs de marché</Big>
            {frame >= tKnew && <Label size={26} color={C.textPrimary}>si on le connaissait → on prévoirait une partie de leurs ordres</Label>}
          </Panel>
          <div style={{ display: "flex", flexDirection: "column", gap: 20, width: 800 }}>
            {frame >= tKnew + 60 && (
              <Pop at={tKnew + 60}>
                <div style={{ display: "flex", gap: 16 }}>
                  <Pill text="prix bouge" size={26} />
                  <Pill text="temps passe" size={26} />
                  <Pill text="volatilité change" size={26} />
                </div>
              </Pop>
            )}
            {frame >= tCharts && (
              <Pop at={tCharts}>
                <Pill text="les cartes d'exposition gamma essaient de l'estimer" size={28} color={C.violet} filled />
              </Pop>
            )}
            {frame >= tNobody && (
              <div style={{ marginTop: 16 }}>
                <Stamp at={tNobody} text="CE STOCK, PERSONNE NE LE VOIT" color={C.negative} size={38} />
              </div>
            )}
          </div>
        </Center>
      </Beat>
    </SceneShell>
  );
};

// ---------------------------------------------------------------------------
export const LongGamma: React.FC<SceneProps> = ({ words, durationInFrames }) => {
  const frame = useCurrentFrame();
  const cue = makeCue(words);
  const tCase = cue("premier cas");
  const tOwns = cue("imaginons qu il possede");
  const tExposed = cue("il est donc expose comme");
  const tSells = cue("pour etre neutre il en vend");
  const tGamma = cue("le gamma de ces options");
  const tUp = cue("gld monte d un dollar son exposition grimpe");
  const tSellUp = cue("il vend dans la hausse");
  const tDown = cue("gld baisse d un dollar");
  const tBuyDown = cue("il achete dans la baisse");
  const tEffect = cue("tu vois l effet");
  const tShock = cue("elle agit comme un amortisseur");
  const tMany = cue("quand beaucoup de teneurs");
  const tImage = cue("image simple");
  const tRegime = cue("ce regime on l appelle");
  const tTrader = cue("dans ce regime un trader");
  const tWarn = cue("attention quand meme");
  const tBrake = cue("le gamma freine");
  return (
    <SceneShell eyebrow="F11 · Gamma positif" title="Le teneur de marché acheteur d'options : un amortisseur" durationInFrames={durationInFrames}>
      <Sfx file="pop.wav" at={tOwns} volume={0.4} />
      <Sfx file="whoosh.wav" at={tSells} volume={0.35} />
      <Sfx file="tick.wav" at={tUp} volume={0.35} />
      <Sfx file="tick.wav" at={tDown} volume={0.35} />
      <Sfx file="chime.wav" at={tShock} volume={0.45} />
      <Sfx file="pop.wav" at={tRegime} volume={0.4} />
      <Sfx file="bass.wav" at={tWarn} volume={0.4} />
      <Beat from={tCase} to={tUp} style={{ left: 0, top: 0 }}>
        <S>
          <At x={80} y={80}>
            <DealerDesk size={1.3} screen={frame >= tSells + 30 ? "Δ = 0" : "Δ +530 000"} screenColor={frame >= tSells + 30 ? C.positive : C.amber} />
          </At>
          {frame >= tOwns && (
            <At x={600} y={30}>
              <Pop at={tOwns}>
                <Ticket title="IL POSSÈDE" rows={[["options d'achat GLD 390", "10 000"], ["delta", "0,53"], ["gamma", "≈ 0,018"]]} color={C.positive} width={560} hiRow={frame >= tGamma ? 2 : undefined} />
              </Pop>
            </At>
          )}
          <At x={600} y={300} w={1100}>
            <CalcLine at={tExposed} left="10 000 × 100 × 0,53 =" right="530 000 parts" size={38} />
          </At>
          {frame >= tSells && (
            <At x={620} y={380}>
              <Flow at={tSells} buy={false} text="vend 530 000 parts → neutre" size={0.9} />
            </At>
          )}
          <At x={600} y={520} w={1100}>
            <CalcLine at={tGamma + 40} left="0,018 × 100 × 10 000 =" right="18 000 parts par dollar" size={34} />
          </At>
        </S>
      </Beat>
      <Beat from={tUp} to={tImage} style={{ left: 0, top: 0 }}>
        <S>
          <At x={60} y={40}>
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <Pill text="GLD +1 $ → exposition +18 000" size={28} color={C.positive} />
              <Flow at={tSellUp} buy={false} text="VEND 18 000 dans la hausse" size={0.85} />
              {frame >= tDown && <Pill text="GLD −1 $ → exposition −18 000" size={28} color={C.negative} />}
              <Flow at={tBuyDown} buy text="ACHÈTE 18 000 dans la baisse" size={0.85} />
            </div>
          </At>
          {frame >= tEffect && (
            <At x={880} y={20}>
              <Pop at={tEffect}>
                <Label size={28} color={C.textPrimary}>la couverture va toujours CONTRE le mouvement</Label>
                <Trace from={tEffect} kind="damped" width={800} height={340} />
              </Pop>
            </At>
          )}
          {frame >= tShock && (
            <At x={960} y={440}>
              <Pop at={tShock}>
                <Pill text="un amortisseur" size={40} filled color={C.positive} />
              </Pop>
            </At>
          )}
          {frame >= tMany && (
            <At x={60} y={500} w={800}>
              <Pop at={tMany}>
                <Label size={26} color={C.textPrimary}>mouvements plus petits · cassures qui s&apos;essoufflent · retour vers les zones de gamma</Label>
              </Pop>
            </At>
          )}
        </S>
      </Beat>
      <Beat from={tImage} to={tWarn} style={{ left: 0, top: 0 }}>
        <S>
          <At x={60} y={20}>
            <Road kind="dry" from={tImage} width={820} />
            <Label size={26}>bons amortisseurs · route pavée · secousses absorbées</Label>
          </At>
          {frame >= tRegime && (
            <At x={980} y={20} w={700}>
              <Pop at={tRegime}>
                <Panel glow style={{ textAlign: "center", borderColor: C.positive }}>
                  <Label size={26}>régime de gamma positif</Label>
                  <Big size={90} color={C.positive}>+γ</Big>
                </Panel>
              </Pop>
            </At>
          )}
          {frame >= tTrader && (
            <At x={980} y={330} w={700}>
              <Pop at={tTrader}>
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <Pill text="vendre les excès vers le haut" size={26} color={C.negative} />
                  <Pill text="acheter les excès vers le bas" size={26} color={C.positive} />
                  <Pill text="objectifs modestes · pas de course aux cassures" size={26} />
                </div>
              </Pop>
            </At>
          )}
        </S>
      </Beat>
      <Beat from={tWarn} style={{ left: 0, top: 0 }}>
        <Center gap={80}>
          <CalendarPage top="FED" big="!" size={240} />
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <Big size={46}>une vraie nouvelle emporte tout</Big>
            {frame >= tBrake && (
              <Pop at={tBrake}>
                <Pill text="le gamma freine · il n'arrête pas" size={36} filled />
              </Pop>
            )}
          </div>
        </Center>
      </Beat>
    </SceneShell>
  );
};

// ---------------------------------------------------------------------------
export const ShortGamma: React.FC<SceneProps> = ({ words, durationInFrames }) => {
  const frame = useCurrentFrame();
  const cue = makeCue(words);
  const tCase = cue("deuxieme cas le plus dangereux");
  const tIns = cue("reprenons l exemple de l assurance");
  const tSells = cue("en face le teneur de marche les vend");
  const tDelta = cue("une option de vente a un delta negatif");
  const tNeutral = cue("pour etre neutre il vend des parts");
  const tDown = cue("maintenant gld baisse d un dollar");
  const tSellDown = cue("il vend dans la baisse");
  const tUp = cue("et si gld monte d un dollar");
  const tBuyUp = cue("il achete dans la hausse");
  const tSameDir = cue("cette fois la couverture va dans le sens");
  const tLoop = cue("une baisse entraine des ventes");
  const tImage = cue("image simple");
  const tRegime = cue("c est le regime de gamma negatif");
  const tTrader = cue("pour un trader ca change tout");
  const tBoard = cue("et c est justement le regime");
  const spin = (frame - tLoop) * 1.6;
  return (
    <SceneShell eyebrow="F11 · Gamma négatif" title="Le teneur de marché vendeur d'options : un accélérateur" durationInFrames={durationInFrames}>
      <Sfx file="pop.wav" at={tIns} volume={0.4} />
      <Sfx file="whoosh.wav" at={tSells} volume={0.35} />
      <Sfx file="tick.wav" at={tDown} volume={0.35} />
      <Sfx file="bass.wav" at={tSellDown} volume={0.4} />
      <Sfx file="tick.wav" at={tUp} volume={0.35} />
      <Sfx file="bass.wav" at={tLoop} volume={0.45} />
      <Sfx file="pop.wav" at={tRegime} volume={0.4} />
      <Sfx file="chime.wav" at={tBoard} volume={0.45} />
      <Beat from={tCase} to={tDown} style={{ left: 0, top: 0 }}>
        <S>
          <At x={60} y={80}>
            <div style={{ display: "flex", gap: 10 }}>
              {[0, 1, 2].map((i) => (
                <Pop key={i} at={tIns + i * 12}>
                  <div style={{ textAlign: "center" }}>
                    <Person size={150} color={C.context} phase={i} />
                    <ShieldGlyph size={70} />
                  </div>
                </Pop>
              ))}
            </div>
            <Label size={24}>investisseurs : achètent des options de vente 390</Label>
          </At>
          {frame >= tSells && (
            <At x={720} y={60}>
              <Pop at={tSells}>
                <DealerDesk size={1.2} screen="10 000 vendues" screenColor={C.negative} />
              </Pop>
            </At>
          )}
          {frame >= tDelta && (
            <At x={1150} y={60} w={560}>
              <Pop at={tDelta}>
                <Panel>
                  <Label size={26} color={C.textPrimary}>option de vente : delta négatif</Label>
                  <Label size={26} color={C.textPrimary}>la vendre : delta POSITIF</Label>
                  <Label size={24}>= exposé comme s&apos;il détenait des parts</Label>
                </Panel>
              </Pop>
            </At>
          )}
          {frame >= tNeutral && (
            <At x={1150} y={380}>
              <Flow at={tNeutral} buy={false} text="vend des parts → neutre" size={0.85} />
            </At>
          )}
        </S>
      </Beat>
      <Beat from={tDown} to={tImage} style={{ left: 0, top: 0 }}>
        <S>
          <At x={60} y={30} w={820}>
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <Pill text="GLD −1 $ → options de vente plus proches → delta plus négatif" size={24} color={C.negative} />
              <Label size={24}>pour le vendeur : +18 000 parts de delta à couvrir</Label>
              <Flow at={tSellDown} buy={false} text="VEND 18 000 dans la baisse" size={0.85} />
              {frame >= tUp && <Pill text="GLD +1 $ → l'inverse" size={24} color={C.positive} />}
              <Flow at={tBuyUp} buy text="ACHÈTE dans la hausse" size={0.85} />
            </div>
          </At>
          {frame >= tSameDir && (
            <At x={930} y={20}>
              <Pop at={tSameDir}>
                <Label size={28} color={C.textPrimary}>la couverture va DANS LE SENS du mouvement</Label>
                <Trace from={tSameDir} kind="amplified" width={760} height={300} />
              </Pop>
            </At>
          )}
          {frame >= tLoop && (
            <At x={1080} y={380}>
              <Pop at={tLoop}>
                <div style={{ position: "relative", width: 300, height: 280 }}>
                  <svg width={300} height={280} style={{ position: "absolute", inset: 0, transform: `rotate(${spin}deg)` }}>
                    <circle cx={150} cy={140} r={110} stroke={C.negative} strokeWidth={6} fill="none" strokeDasharray="120 40" />
                    <polygon points="258,120 272,150 244,150" fill={C.negative} />
                  </svg>
                  <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                    <Label size={24} color={C.textPrimary}>baisse</Label>
                    <Label size={22}>→ ventes →</Label>
                    <Label size={24} color={C.textPrimary}>baisse</Label>
                  </div>
                </div>
              </Pop>
            </At>
          )}
        </S>
      </Beat>
      <Beat from={tImage} to={tBoard} style={{ left: 0, top: 0 }}>
        <S>
          <At x={60} y={20}>
            <Road kind="ice" from={tImage} width={820} />
            <Label size={26}>route verglacée · un coup de volant → dérapage</Label>
          </At>
          {frame >= tRegime && (
            <At x={980} y={20} w={700}>
              <Pop at={tRegime}>
                <Panel glow style={{ textAlign: "center", borderColor: C.negative }}>
                  <Label size={26}>régime de gamma négatif</Label>
                  <Big size={90} color={C.negative}>-γ</Big>
                  <Label size={24}>journées agitées · cassures qui vont plus loin</Label>
                </Panel>
              </Pop>
            </At>
          )}
          {frame >= tTrader && (
            <At x={980} y={380} w={700}>
              <Pop at={tTrader}>
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <Pill text="objectifs plus larges… stops aussi" size={26} />
                  <Pill text="taille réduite" size={26} color={C.amber} />
                  <Pill text="pas de couteau qui tombe" size={26} color={C.negative} />
                </div>
              </Pop>
            </At>
          )}
        </S>
      </Beat>
      <Beat from={tBoard} style={{ left: 0, top: 0 }}>
        <Center column gap={30}>
          <div style={{ transform: "scale(0.9)" }}>
            <DashCards subHi="gamma" hi={0} width={1700} />
          </div>
          <Pop at={tBoard + 30}>
            <Pill text="24 septembre : régime -γ" size={36} filled color={C.negative} />
          </Pop>
        </Center>
      </Beat>
    </SceneShell>
  );
};

// ---------------------------------------------------------------------------
export const Convention: React.FC<SceneProps> = ({ words, durationInFrames }) => {
  const frame = useCurrentFrame();
  const cue = makeCue(words);
  const tQ = cue("il est temps de poser la question");
  const tHonest = cue("reponse honnete");
  const tData = cue("les donnees publiques donnent");
  const tNotWho = cue("mais elles ne disent pas qui detient");
  const tHyp = cue("alors les sites font une hypothese");
  const tInvPut = cue("les investisseurs achetent des options de vente");
  const tDealShortPut = cue("donc les teneurs de marche sont vendeurs");
  const tInvCall = cue("et les investisseurs vendent des options d achat");
  const tDealLongCall = cue("donc les teneurs de marche sont acheteurs");
  const tWhy = cue("voila pourquoi sur ton graphique");
  const tNotMeas = cue("ce n est pas une mesure");
  const tReason = cue("cette convention est raisonnable");
  const tFund = cue("si un gros fonds");
  const tRefine = cue("certains sites affinent");
  const tLimit2 = cue("deuxieme limite");
  const tSlice = cue("le graphique gld montre une tranche");
  const tFromNow = cue("donc a partir de maintenant");
  const OI: Array<[string, string]> = [
    ["388", "12 406"],
    ["389", "9 870"],
    ["390", "41 225"],
    ["391", "8 114"],
    ["392", "7 390"],
  ];
  return (
    <SceneShell eyebrow="F11 · La question qui fâche" title="Comment le site sait-il qui détient quoi ?" durationInFrames={durationInFrames}>
      <Sfx file="bass.wav" at={tHonest} volume={0.45} />
      <Sfx file="pop.wav" at={tHyp} volume={0.4} />
      <Sfx file="pop.wav" at={tInvPut} volume={0.35} />
      <Sfx file="pop.wav" at={tInvCall} volume={0.35} />
      <Sfx file="chime.wav" at={tNotMeas} volume={0.45} />
      <Sfx file="bass.wav" at={tFund} volume={0.4} />
      <Sfx file="whoosh.wav" at={tLimit2} volume={0.4} />
      <Beat from={tQ} to={tHyp} style={{ left: 0, top: 0 }}>
        <S>
          <At x={80} y={40}>
            <Pop at={tHonest}>
              <Big size={80} color={C.negative}>il ne le sait pas.</Big>
            </Pop>
          </At>
          {frame >= tData && (
            <At x={80} y={200} w={900}>
              <Pop at={tData}>
                <Panel>
                  <Label size={24}>intérêt ouvert · exemple fictif · une échéance</Label>
                  <div style={{ display: "grid", gridTemplateColumns: "160px 220px 260px", gap: 8, marginTop: 10, fontFamily: theme.mono, fontSize: 26 }}>
                    <span style={{ color: C.textMuted }}>prix d&apos;ex.</span>
                    <span style={{ color: C.textMuted }}>contrats</span>
                    <span style={{ color: C.textMuted }}>détenus par ?</span>
                    {OI.map(([k, v]) => (
                      <React.Fragment key={k}>
                        <span style={{ color: C.textPrimary }}>{k}</span>
                        <span style={{ color: C.textPrimary }}>{v}</span>
                        <span style={{ color: frame >= tNotWho ? C.negative : C.textMuted, fontWeight: 900 }}>{frame >= tNotWho ? "? ? ?" : ""}</span>
                      </React.Fragment>
                    ))}
                  </div>
                </Panel>
              </Pop>
            </At>
          )}
          {frame >= tNotWho && (
            <At x={1060} y={260} w={640}>
              <Pop at={tNotWho}>
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <Pill text="pas de nom" color={C.negative} size={30} />
                  <Pill text="pas de sens (acheté ou vendu)" color={C.negative} size={30} />
                  <Pill text="pas de couvertures" color={C.negative} size={30} />
                </div>
              </Pop>
            </At>
          )}
        </S>
      </Beat>
      <Beat from={tHyp} to={tReason} style={{ left: 0, top: 0 }}>
        <S>
          <At x={40} y={0} w={1000}>
            <Pill text="l'hypothèse la plus répandue" size={30} filled color={C.violet} />
          </At>
          {frame >= tInvPut && (
            <At x={40} y={90} w={1000}>
              <Pop at={tInvPut}>
                <Panel style={{ padding: "16px 22px", borderColor: C.negative }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                    <ShieldGlyph size={70} />
                    <Label size={26} color={C.textPrimary}>investisseurs : ACHÈTENT des options de vente (assurance)</Label>
                  </div>
                  {frame >= tDealShortPut && <Label size={26} color={C.negative}>→ teneurs de marché VENDEURS de ces options → gamma −</Label>}
                </Panel>
              </Pop>
            </At>
          )}
          {frame >= tInvCall && (
            <At x={40} y={300} w={1000}>
              <Pop at={tInvCall}>
                <Panel style={{ padding: "16px 22px", borderColor: C.positive }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                    <CoinStackIcon size={70} />
                    <Label size={26} color={C.textPrimary}>investisseurs : VENDENT des options d&apos;achat (primes)</Label>
                  </div>
                  {frame >= tDealLongCall && <Label size={26} color={C.positive}>→ teneurs de marché ACHETEURS de ces options → gamma +</Label>}
                </Panel>
              </Pop>
            </At>
          )}
          {frame >= tWhy && (
            <At x={1090} y={0}>
              <Pop at={tWhy}>
                <div style={{ transform: "scale(0.62)", transformOrigin: "top left" }}>
                  <GexChart from={tWhy} width={960} height={900} />
                </div>
              </Pop>
            </At>
          )}
          {frame >= tNotMeas && (
            <At x={120} y={530}>
              <Stamp at={tNotMeas} text="UNE CONVENTION, PAS UNE MESURE" color={C.amber} size={40} />
            </At>
          )}
        </S>
      </Beat>
      <Beat from={tReason} to={tLimit2} style={{ left: 0, top: 0 }}>
        <S>
          <At x={80} y={20} w={1600}>
            <Pill text="raisonnable en moyenne… faux possible sur un prix d'exercice précis" size={30} />
          </At>
          {frame >= tFund && (
            <At x={80} y={120} w={820}>
              <Pop at={tFund}>
                <Panel style={{ borderColor: C.negative }}>
                  <Label size={26} color={C.textPrimary}>un gros fonds ACHÈTE des milliers d&apos;options d&apos;achat pour spéculer</Label>
                  <Label size={26} color={C.negative}>→ le teneur de marché en est VENDEUR</Label>
                  <Label size={26} color={C.textPrimary}>→ le vrai signe est l&apos;inverse de celui affiché</Label>
                </Panel>
              </Pop>
            </At>
          )}
          {frame >= tFund + 60 && (
            <At x={1000} y={140}>
              <Pop at={tFund + 60}>
                <div style={{ position: "relative", width: 520, height: 220 }}>
                  <div style={{ position: "absolute", left: 20, top: 60, width: 400, height: 60, background: C.positive, borderRadius: 8 }} />
                  <Label size={22}>affiché : +γ</Label>
                  <div style={{ position: "absolute", left: 150, top: 10 }}>
                    <CrossDraw at={tFund + 90} size={150} />
                  </div>
                </div>
              </Pop>
            </At>
          )}
          {frame >= tRefine && (
            <At x={80} y={470} w={1500}>
              <Pop at={tRefine}>
                <Pill text="certains sites devinent le sens avec les transactions du jour → mieux, mais toujours une estimation" size={26} color={C.context} />
              </Pop>
            </At>
          )}
        </S>
      </Beat>
      <Beat from={tLimit2} style={{ left: 0, top: 0 }}>
        <S>
          <At x={80} y={20} w={1600}>
            <Label size={30} color={C.textPrimary}>le marché des options sur l&apos;or (schéma, tailles non à l&apos;échelle)</Label>
          </At>
          <At x={80} y={100}>
            <div style={{ display: "flex", gap: 30 }}>
              <Pop at={tLimit2 + 20}>
                <Panel glow style={{ width: 460, textAlign: "center", borderColor: C.accent }}>
                  <Big size={36} color={C.accentBright}>options GLD</Big>
                  <Label size={24}>ce que montre ton graphique</Label>
                </Panel>
              </Pop>
              <Pop at={tLimit2 + 70}>
                <Panel style={{ width: 520, textAlign: "center" }}>
                  <Big size={34}>options sur contrats à terme</Big>
                  <Label size={24}>New York · leur propre carte</Label>
                </Panel>
              </Pop>
              <Pop at={tLimit2 + 120}>
                <Panel style={{ width: 520, textAlign: "center", borderStyle: "dashed" }}>
                  <Big size={34} color={C.textMuted}>gré à gré</Big>
                  <Label size={24}>entre banques · invisible</Label>
                </Panel>
              </Pop>
            </div>
          </At>
          {frame >= tSlice && (
            <At x={80} y={360}>
              <Pop at={tSlice}>
                <Pill text="une tranche du marché, pas le marché entier" size={32} />
              </Pop>
            </At>
          )}
          {frame >= tFromNow && (
            <At x={80} y={470} w={1600}>
              <Pop at={tFromNow}>
                <Panel glow style={{ textAlign: "center" }}>
                  <Big size={40}>« les teneurs de marché vont acheter / vendre »</Big>
                  <Big size={40} color={C.violet}>= selon l&apos;hypothèse du modèle</Big>
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
export const GexCalc: React.FC<SceneProps> = ({ words, durationInFrames }) => {
  const frame = useCurrentFrame();
  const cue = makeCue(words);
  const tHow = cue("comment passe t on");
  const tFormula = cue("l exposition gamma d un prix d exercice c est");
  const tEx = cue("exemple au prix d exercice de");
  const tOpen = cue("contrats ouverts", tEx);
  const tMeans = cue("ce chiffre veut dire");
  const tMany = cue("beaucoup de sites multiplient");
  const tSome = cue("certains le ramenent");
  const tYours = cue("sur ton tableau les chiffres");
  const tConv = cue("ensuite on applique la convention");
  const tAt390 = cue("imaginons que les options d achat donnent");
  const tNet = cue("le total net vaut");
  const tSame = cue("c est justement le chiffre");
  const tRedo = cue("on refait ce calcul");
  const tExp = cue("sur ton ecran les echeances");
  const tTwo = cue("deux consequences importantes");
  const tGone = cue("des qu elles expirent");
  const tNext = cue("la carte du lendemain");
  const bar = (v: number, at: number, col: string, label: string) => {
    const p = interpolate(frame, [at, at + 26], [0, 1], { ...clamp, easing: theme.ease.out });
    const w = Math.abs(v) * 3 * p;
    return (
      <div style={{ display: "flex", alignItems: "center", height: 60, position: "relative", width: 1400 }}>
        <div style={{ position: "absolute", left: v < 0 ? 800 - w : 800, width: w, height: 44, background: col, borderRadius: 8 }} />
        <div style={{ position: "absolute", left: v < 0 ? 800 - w - 260 : 820 + w, width: 250, textAlign: v < 0 ? "right" : "left", color: col, fontFamily: theme.mono, fontSize: 30, fontWeight: 900, opacity: p }}>
          {label}
        </div>
      </div>
    );
  };
  return (
    <SceneShell eyebrow="F11 · Le calcul derrière les barres" title="Exposition gamma d'un prix d'exercice" durationInFrames={durationInFrames}>
      <Sfx file="pop.wav" at={tFormula} volume={0.4} />
      <Sfx file="click.wav" at={tOpen} volume={0.4} />
      <Sfx file="whoosh.wav" at={tConv} volume={0.4} />
      <Sfx file="chime.wav" at={tSame} volume={0.45} />
      <Sfx file="bass.wav" at={tGone} volume={0.4} />
      <Beat from={tHow} to={tConv} style={{ left: 0, top: 0 }}>
        <S>
          <At x={80} y={10} w={1600}>
            <Pop at={tFormula}>
              <Panel glow style={{ textAlign: "center" }}>
                <Big size={46}>exposition gamma = gamma × contrats ouverts × 100</Big>
              </Panel>
            </Pop>
          </At>
          <At x={120} y={170} w={1500}>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <CalcLine at={tEx} left="prix d'exercice 390 · la veille de l'échéance · gamma ≈" right="0,1" size={34} />
              <CalcLine at={tOpen} left="0,1 × 17 000 contrats × 100 =" right="170 000" size={40} />
              <CalcLine at={tMeans} left="→ par dollar de GLD, la couverture bouge d'environ" right="170 000 parts" size={32} color={C.textSecondary} />
            </div>
          </At>
          {frame >= tMany && (
            <At x={120} y={430} w={1500}>
              <Pop at={tMany}>
                <div style={{ display: "flex", gap: 18, flexWrap: "wrap" }}>
                  <Pill text="en parts par dollar" size={26} />
                  <Pill text="× prix → en dollars" size={26} />
                  {frame >= tSome && <Pill text="ou pour un mouvement de 1 %" size={26} />}
                  {frame >= tYours && <Pill text="ton tableau : K = milliers" size={26} filled />}
                </div>
                {frame >= tYours && <Label size={26} color={C.textPrimary}>l&apos;ordre de grandeur compte plus que l&apos;unité exacte</Label>}
              </Pop>
            </At>
          )}
        </S>
      </Beat>
      <Beat from={tConv} to={tRedo} style={{ left: 0, top: 0 }}>
        <S>
          <At x={80} y={10} w={1600}>
            <div style={{ display: "flex", gap: 24 }}>
              <Pill text="options d'achat → compté en +" color={C.positive} size={30} />
              <Pill text="options de vente → compté en −" color={C.negative} size={30} />
            </div>
          </At>
          <At x={80} y={110} w={1600}>
            <Label size={28} color={C.textPrimary}>prix d&apos;exercice 390 (exemple)</Label>
            <div style={{ position: "relative", marginTop: 20 }}>
              <div style={{ position: "absolute", left: 800, top: -10, width: 3, height: 240, background: C.hairline }} />
              {bar(45, tAt390, C.positive, "+45K")}
              {bar(-216, tAt390 + 50, C.negative, "−216K")}
              {frame >= tNet && bar(-171, tNet, C.amber, "net −171K")}
            </div>
          </At>
          {frame >= tSame && (
            <At x={200} y={470} w={1300}>
              <Pop at={tSame}>
                <Panel glow style={{ textAlign: "center" }}>
                  <Label size={26}>texte du site : « the 390 strike dominates positioning with -171k net gamma »</Label>
                  <Big size={36} color={C.positive}>✓ même chiffre</Big>
                </Panel>
              </Pop>
            </At>
          )}
        </S>
      </Beat>
      <Beat from={tRedo} to={tTwo} style={{ left: 0, top: 0 }}>
        <S>
          <At x={60} y={0}>
            <div style={{ transform: "scale(0.7)", transformOrigin: "top left" }}>
              <GexChart from={tRedo} width={1000} height={960} />
            </div>
          </At>
          {frame >= tExp && (
            <At x={880} y={80} w={800}>
              <Pop at={tExp}>
                <Label size={28} color={C.textPrimary}>échéances incluses</Label>
                <div style={{ display: "flex", gap: 20, marginTop: 14 }}>
                  <CalendarPage top="SEPT" big="24" size={170} />
                  <CalendarPage top="SEPT" big="25" size={170} />
                  <CalendarPage top="OCT" big="16" size={170} />
                </div>
              </Pop>
            </At>
          )}
        </S>
      </Beat>
      <Beat from={tTwo} style={{ left: 0, top: 0 }}>
        <S>
          <At x={80} y={30} w={760}>
            <Pop at={tTwo + 30}>
              <Panel style={{ borderColor: C.amber }}>
                <Big size={40} color={C.amber}>①</Big>
                <Label size={28} color={C.textPrimary}>les options qui expirent bientôt pèsent énormément</Label>
                <Label size={24}>leur gamma à la monnaie explose</Label>
              </Panel>
            </Pop>
          </At>
          {frame >= tGone && (
            <At x={920} y={30} w={760}>
              <Pop at={tGone}>
                <Panel style={{ borderColor: C.negative }}>
                  <Big size={40} color={C.negative}>②</Big>
                  <Label size={28} color={C.textPrimary}>dès qu&apos;elles expirent, elles disparaissent du calcul</Label>
                  <div style={{ display: "flex", gap: 16, marginTop: 12, position: "relative" }}>
                    <CalendarPage top="SEPT" big="24" size={130} />
                    <CalendarPage top="SEPT" big="25" size={130} />
                    <div style={{ position: "absolute", left: 40, top: 0 }}>
                      <CrossDraw at={tGone + 40} size={200} />
                    </div>
                  </div>
                </Panel>
              </Pop>
            </At>
          )}
          {frame >= tNext && (
            <At x={400} y={500}>
              <Pop at={tNext}>
                <Pill text="la carte du lendemain peut être très différente" size={34} filled />
              </Pop>
            </At>
          )}
        </S>
      </Beat>
    </SceneShell>
  );
};
