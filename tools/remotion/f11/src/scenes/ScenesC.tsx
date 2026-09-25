// F11 v5 — part 1: options from zero (new scenes). Every beat is cued on the narrator's exact words.
import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { theme } from "../theme";
import { Sfx, makeCue, Panel, AnimatedNumber, useBreathe, CoinStackIcon, BankIcon } from "./shared";
import type { SceneProps } from "./shared";
import { Beat, Pop, Person, Bubble, clamp, ArrowGlyph } from "./characters";
import { SceneShell, Center, Big, Label, STAGE_W } from "./stage";
import { Pill, CrossDraw, CheckDraw, Stamp, ModelMachine, CalendarPage } from "./props5";
import { Speedometer } from "./props";
import { Tank } from "./props8";
import { Ticket, CalcLine, PriceAxis, Curve } from "./props11";
import { GexChart, ProfileChart, VANNA_PTS, DashCards, HouseCard, CarShield, PnLChart, ShareGrid, ValueBar, IceCube, Flow, DealerDesk } from "./dash";

const C = theme.colors;
const S: React.FC<{ children: React.ReactNode }> = ({ children }) => <div style={{ position: "relative", width: STAGE_W, height: 690 }}>{children}</div>;
const At: React.FC<{ x: number; y: number; children: React.ReactNode; w?: number }> = ({ x, y, children, w }) => (
  <div style={{ position: "absolute", left: x, top: y, width: w }}>{children}</div>
);

// ---------------------------------------------------------------------------
export const IntroV5: React.FC<SceneProps> = ({ words, durationInFrames }) => {
  const frame = useCurrentFrame();
  const cue = makeCue(words);
  const tSite = cue("tu utilises un site");
  const tBars = cue("des barres rouges et vertes");
  const tHon = cue("et honnetement");
  const tLong = cue("cette video est longue");
  const tZero = cue("on part de zero");
  const tDealers = cue("ensuite on va voir");
  const tBoard = cue("puis on prend le vrai tableau");
  const tEnd = cue("et pour finir");
  const tRule = cue("une regle pour toute la video");
  const breathe = useBreathe(0.4);
  const PARTS = [
    { n: "1", t: "Les options de zéro", s: "prime · delta · gamma · thêta · véga · vanna · charme", at: tZero },
    { n: "2", t: "Qui est en face ?", s: "les teneurs de marché · amortisseur ou accélérateur", at: tDealers },
    { n: "3", t: "Lire le tableau du 24 sept.", s: "GLD 389,51 $ · murs · bascule · vanna · charme · DEX", at: tBoard },
    { n: "4", t: "L'intégrer dans ton trading", s: "scénarios · routine · pièges", at: tEnd },
  ];
  return (
    <SceneShell eyebrow="F11 · Options sur l'or & cartes d'exposition gamma" title="Des barres, des murs, une bascule… et toi ?" durationInFrames={durationInFrames}>
      <Sfx file="whoosh.wav" at={tSite} volume={0.4} />
      <Sfx file="pop.wav" at={tBars} volume={0.35} />
      <Sfx file="bass.wav" at={tHon} volume={0.4} />
      <Sfx file="chime.wav" at={tLong} volume={0.45} />
      <Sfx file="bass.wav" at={tRule} volume={0.45} />
      <Beat from={tSite} to={tLong} style={{ left: 0, top: 0 }}>
        <S>
          <At x={0} y={10}>
            <div style={{ transform: "scale(0.62)", transformOrigin: "top left" }}>
              <GexChart from={tSite + 6} width={900} height={1000} priceAt={tBars + 30} flipAt={tBars + 50} wallsAt={tBars + 40} cumAt={tBars + 70} aggAt={tBars + 90} />
            </div>
          </At>
          <At x={620} y={20}>
            <Pop at={tBars + 20}>
              <div style={{ transform: "scale(0.62)", transformOrigin: "top left" }}>
                <DashCards width={1700} />
              </div>
            </Pop>
          </At>
          <At x={640} y={200}>
            <Pop at={tBars + 60}>
              <ProfileChart pts={VANNA_PTS} yMin={-90} yMax={60} yTicks={[[56.9, "56.9K"], [0, "0"], [-89.8, "-89.8K"]]} color={C.violet} from={tBars + 60} width={560} height={300} flip={{ x: 375.1, label: "V-Flip $375.1", at: tBars + 100 }} />
            </Pop>
          </At>
          {frame >= tHon && (
            <At x={1290} y={230}>
              <Pop at={tHon}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
                  <Bubble text="??? langue étrangère" width={320} />
                  <Person size={200} color={C.context} />
                </div>
              </Pop>
            </At>
          )}
        </S>
      </Beat>
      <Beat from={tLong} to={tRule} style={{ left: 0, top: 0 }}>
        <S>
          <At x={0} y={0} w={STAGE_W}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 30 }}>
              <Pill text="vidéo longue, exprès : de zéro jusqu'à ton tableau" size={30} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 26, padding: "0 60px" }}>
              {PARTS.map((p) =>
                frame >= p.at ? (
                  <Pop key={p.n} at={p.at}>
                    <Panel glow={frame < p.at + 200} style={{ padding: "22px 28px", display: "flex", gap: 22, alignItems: "center" }}>
                      <div style={{ fontSize: 70, fontWeight: 900, color: C.accentBright, fontFamily: theme.mono, width: 70 }}>{p.n}</div>
                      <div>
                        <div style={{ color: C.textPrimary, fontSize: 34, fontWeight: 800 }}>{p.t}</div>
                        <div style={{ color: C.textSecondary, fontSize: 22, marginTop: 6 }}>{p.s}</div>
                      </div>
                    </Panel>
                  </Pop>
                ) : (
                  <div key={p.n} />
                ),
              )}
            </div>
          </At>
        </S>
      </Beat>
      <Beat from={tRule} style={{ left: 0, top: 0 }}>
        <Center column gap={40}>
          <div style={{ display: "flex", alignItems: "center", gap: 40, transform: `scale(${breathe.scale})` }}>
            <Big size={80} color={C.violet}>modèles</Big>
            <Big size={90} color={C.negative}>≠</Big>
            <Big size={80}>faits</Big>
          </div>
          <Pop at={tRule + 50}>
            <Label size={32} color={C.textPrimary}>apprendre à les lire… et savoir ce qu&apos;ils ne disent pas</Label>
          </Pop>
        </Center>
      </Beat>
    </SceneShell>
  );
};

// ---------------------------------------------------------------------------
export const Analogy: React.FC<SceneProps> = ({ words, durationInFrames }) => {
  const frame = useCurrentFrame();
  const cue = makeCue(words);
  const tImg = cue("commencons avec une image");
  const tHouse = cue("imagine une maison");
  const tDeal = cue("alors tu proposes un marche");
  const tGive = cue("tu lui donnes");
  const tSwap = cue("en echange il s engage");
  const tPrime = cue("c est la prime");
  const tStrike = cue("c est le prix d exercice");
  const tExp = cue("c est l echeance");
  const tCall = cue("c est une option d achat");
  const tCase1 = cue("premier cas");
  const tCase2 = cue("deuxieme cas");
  const tNotOb = cue("tu n es pas oblige");
  const tEss = cue("voila l essence");
  const tImg2 = cue("deuxieme image");
  const tPut = cue("une option de vente c est exactement");
  const tOther = cue("et de l autre cote");
  const tKeep = cue("garde ces deux images");
  const coinX = interpolate(frame, [tGive, tGive + 40], [330, 1180], { ...clamp, easing: theme.ease.inOut });
  return (
    <SceneShell eyebrow="F11 · L'idée en une image" title="Une option, c'est une réservation… ou une assurance" durationInFrames={durationInFrames}>
      <Sfx file="pop.wav" at={tHouse} volume={0.4} />
      <Sfx file="whoosh.wav" at={tGive} volume={0.4} />
      <Sfx file="tick.wav" at={tPrime} volume={0.35} />
      <Sfx file="tick.wav" at={tStrike} volume={0.35} />
      <Sfx file="tick.wav" at={tExp} volume={0.35} />
      <Sfx file="chime.wav" at={tCall} volume={0.5} />
      <Sfx file="click.wav" at={tCase1 + 60} volume={0.4} />
      <Sfx file="bass.wav" at={tCase2} volume={0.4} />
      <Sfx file="pop.wav" at={tImg2} volume={0.4} />
      <Beat from={tImg} to={tCase1} style={{ left: 0, top: 0 }}>
        <S>
          <At x={740} y={0}>
            <Pop at={tHouse}>
              <HouseCard price="400 000 $" />
            </Pop>
          </At>
          <At x={170} y={230}>
            <Pop at={tDeal}>
              <Person size={210} color={C.positive} label="toi" />
            </Pop>
          </At>
          <At x={1330} y={230}>
            <Pop at={tHouse + 30}>
              <Person size={210} color={C.negative} label="vendeur" />
            </Pop>
          </At>
          {frame >= tGive && frame < tPrime + 30 && (
            <At x={coinX} y={260}>
              <CoinStackIcon size={90} />
              <div style={{ color: C.accentBright, fontSize: 28, fontWeight: 900, fontFamily: theme.mono }}>5 000 $</div>
            </At>
          )}
          <At x={560} y={300}>
            {frame >= tSwap && (
              <Pop at={tSwap}>
                <Ticket
                  title="TON DROIT D'ACHETER LA MAISON"
                  width={620}
                  rows={[
                    ["prime (payée tout de suite)", frame >= tPrime ? "5 000 $" : ""],
                    ["prix d'exercice", frame >= tStrike ? "400 000 $" : ""],
                    ["échéance", frame >= tExp ? "3 mois" : ""],
                  ]}
                  hiRow={frame >= tExp ? 2 : frame >= tStrike ? 1 : frame >= tPrime ? 0 : undefined}
                />
              </Pop>
            )}
          </At>
          {frame >= tCall && (
            <At x={640} y={560}>
              <Stamp at={tCall} text="= UNE OPTION D'ACHAT" color={C.positive} size={40} />
            </At>
          )}
        </S>
      </Beat>
      <Beat from={tCase1} to={tEss} style={{ left: 0, top: 0 }}>
        <S>
          <At x={100} y={20} w={700}>
            <Panel style={{ textAlign: "center", borderColor: C.positive }}>
              <Label size={26} color={C.positive}>cas 1 · le quartier devient à la mode</Label>
              <div style={{ display: "flex", justifyContent: "center", margin: "10px 0" }}>
                <HouseCard price="450 000 $" tone={C.positive} size={0.8} />
              </div>
              <CalcLine at={tCase1 + 90} left="+50 000 − 5 000 =" right="+45 000 $" size={34} />
            </Panel>
          </At>
          {frame >= tCase2 && (
            <At x={940} y={20} w={700}>
              <Pop at={tCase2}>
                <Panel style={{ textAlign: "center", borderColor: C.negative }}>
                  <Label size={26} color={C.negative}>cas 2 · le marché baisse</Label>
                  <div style={{ display: "flex", justifyContent: "center", margin: "10px 0" }}>
                    <HouseCard price="350 000 $" tone={C.negative} size={0.8} />
                  </div>
                  {frame >= tNotOb && <CalcLine at={tNotOb} left="tu laisses tomber · perte max =" right="5 000 $" size={30} />}
                </Panel>
              </Pop>
            </At>
          )}
        </S>
      </Beat>
      <Beat from={tEss} to={tImg2} style={{ left: 0, top: 0 }}>
        <Center column gap={36}>
          <Big size={70} glow>un droit, pas une obligation</Big>
          <div style={{ display: "flex", gap: 30 }}>
            <Pop at={tEss + 50}>
              <Pill text="perte limitée à la prime" color={C.negative} size={32} />
            </Pop>
            <Pop at={tEss + 80}>
              <Pill text="gain qui peut être grand" color={C.positive} size={32} />
            </Pop>
          </div>
        </Center>
      </Beat>
      <Beat from={tImg2} to={tKeep} style={{ left: 0, top: 0 }}>
        <S>
          <At x={140} y={60}>
            <Pop at={tImg2}>
              <CarShield size={1.6} crash={frame > tImg2 + 150} />
            </Pop>
          </At>
          <At x={140} y={380} w={520}>
            <Pop at={tImg2 + 40}>
              <Label size={28} color={C.textPrimary}>prime chaque année · l&apos;assurance paie en cas d&apos;accident</Label>
            </Pop>
          </At>
          {frame >= tPut && (
            <At x={820} y={120} w={860}>
              <Pop at={tPut}>
                <Panel glow style={{ textAlign: "center" }}>
                  <Big size={50} color={C.negative}>option de vente</Big>
                  <Big size={40}>= une assurance contre la baisse</Big>
                </Panel>
              </Pop>
            </At>
          )}
          {frame >= tOther && (
            <At x={820} y={420} w={860}>
              <Pop at={tOther}>
                <div style={{ display: "flex", alignItems: "center", gap: 26, justifyContent: "center" }}>
                  <BankIcon size={90} />
                  <Label size={28} color={C.textPrimary}>le vendeur / l&apos;assureur encaisse la prime… et porte le risque</Label>
                </div>
              </Pop>
            </At>
          )}
        </S>
      </Beat>
      <Beat from={tKeep} style={{ left: 0, top: 0 }}>
        <Center gap={120}>
          <HouseCard price="option d'achat" size={0.9} />
          <CarShield size={1.2} />
        </Center>
      </Beat>
    </SceneShell>
  );
};

// ---------------------------------------------------------------------------
export const CallExample: React.FC<SceneProps> = ({ words, durationInFrames }) => {
  const frame = useCurrentFrame();
  const cue = makeCue(words);
  const tEx = cue("passons a un vrai exemple");
  const tFund = cue("gld c est un fonds");
  const tDay = cue("le 24 septembre");
  const tContract = cue("sur gld un contrat d option porte");
  const tMult = cue("c est le multiplicateur");
  const tDonc = cue("donc quand tu vois une prime");
  const tHachim = cue("hachim pense");
  const tBuys = cue("il achete une option d achat");
  const tBE = cue("quel est son point mort");
  const tBelow = cue("en dessous de");
  const tFour = cue("regardons quatre scenarios");
  const t380 = cue("l option ne vaut rien");
  const t395 = cue("l option vaut toujours zero");
  const t402 = cue("soit exactement la prime");
  const t415 = cue("un gain de");
  const tForm = cue("tu vois la forme");
  const tSeller = cue("et le vendeur de cette option");
  const tCap = cue("son gain est plafonne");
  return (
    <SceneShell eyebrow="F11 · Exemple réel · option d'achat GLD" title="Hachim achète une option d'achat à 395" durationInFrames={durationInFrames}>
      <Sfx file="pop.wav" at={tFund} volume={0.4} />
      <Sfx file="tick.wav" at={tMult} volume={0.35} />
      <Sfx file="pop.wav" at={tBuys} volume={0.4} />
      <Sfx file="chime.wav" at={tBE} volume={0.4} />
      <Sfx file="bass.wav" at={t380} volume={0.35} />
      <Sfx file="click.wav" at={t415} volume={0.45} />
      <Sfx file="whoosh.wav" at={tSeller} volume={0.4} />
      <Beat from={tEx} to={tHachim} style={{ left: 0, top: 0 }}>
        <S>
          <At x={80} y={40}>
            <Pop at={tFund}>
              <Panel style={{ textAlign: "center", width: 420 }}>
                <Tank level={0.72} label="" color={C.accent} w={150} h={170} />
                <Big size={44} color={C.accentBright}>GLD</Big>
                <Label size={22}>fonds coté · détient de l&apos;or physique</Label>
                {frame >= tDay && (
                  <div style={{ marginTop: 10, fontFamily: theme.mono, fontSize: 44, fontWeight: 900, color: C.textPrimary }}>
                    <AnimatedNumber from={380} to={389.51} delay={tDay} format={(n) => `${n.toFixed(2).replace(".", ",")} $`} />
                  </div>
                )}
              </Panel>
            </Pop>
          </At>
          {frame >= tContract && (
            <At x={640} y={40}>
              <Pop at={tContract}>
                <div style={{ display: "flex", gap: 40, alignItems: "center" }}>
                  <div>
                    <Label size={28} color={C.textPrimary}>1 contrat = 100 parts</Label>
                    <div style={{ marginTop: 16 }}>
                      <ShareGrid lit={100} at={tContract + 10} size={26} />
                    </div>
                  </div>
                  {frame >= tMult && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                      <Pill text="multiplicateur ×100" size={30} />
                      <CalcLine at={tDonc} left="prime 7 $ × 100 =" right="700 $" size={40} />
                    </div>
                  )}
                </div>
              </Pop>
            </At>
          )}
        </S>
      </Beat>
      <Beat from={tHachim} to={tFour} style={{ left: 0, top: 0 }}>
        <S>
          <At x={120} y={120}>
            <Pop at={tHachim}>
              <Person size={230} color={C.positive} label="Hachim" cheer={frame > tHachim + 40 && frame < tBuys} />
            </Pop>
          </At>
          <At x={140} y={20}>
            <Pop at={tHachim + 20}>
              <Bubble text="l'or va monter ce mois-ci" width={340} />
            </Pop>
          </At>
          {frame >= tBuys && (
            <At x={560} y={60}>
              <Pop at={tBuys}>
                <Ticket title="OPTION D'ACHAT · GLD" width={560} rows={[["prix d'exercice", "395"], ["échéance", "30 jours"], ["prime", "7 $ / part"], ["payé", "700 $"]]} color={C.positive} />
              </Pop>
            </At>
          )}
          {frame >= tBE && (
            <At x={1180} y={80} w={520}>
              <Pop at={tBE}>
                <Panel glow style={{ textAlign: "center" }}>
                  <Label size={26}>point mort</Label>
                  <CalcLine at={tBE + 30} left="395 + 7 =" right="402" size={52} />
                </Panel>
              </Pop>
            </At>
          )}
          {frame >= tBelow && (
            <At x={1180} y={360} w={520}>
              <Pop at={tBelow}>
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <Pill text="sous 402 → perte" color={C.negative} size={30} />
                  <Pill text="au-dessus → gain" color={C.positive} size={30} />
                </div>
              </Pop>
            </At>
          )}
        </S>
      </Beat>
      <Beat from={tFour} style={{ left: 0, top: 0 }}>
        <S>
          <At x={40} y={10}>
            <PnLChart
              kind="call"
              strike={395}
              premium={7}
              from={tFour}
              min={370}
              max={440}
              yMin={-4000}
              yMax={4000}
              width={1000}
              height={560}
              seller
              sellerAt={tSeller}
              markers={[
                { s: 380, at: t380 },
                { s: 395, at: t395 },
                { s: 402, at: t402 },
                { s: 415, at: t415 },
              ]}
            />
          </At>
          <At x={1140} y={20} w={560}>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {[
                { at: t380, l: "GLD 380", r: "−700 $", col: C.negative },
                { at: t395, l: "GLD 395", r: "−700 $", col: C.negative },
                { at: t402, l: "GLD 402", r: "0 $", col: C.textSecondary },
                { at: t415, l: "GLD 415", r: "(20 × 100) − 700 = +1 300 $", col: C.positive },
              ].map((r) =>
                frame >= r.at ? (
                  <Pop key={r.l} at={r.at}>
                    <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 18px", borderRadius: 12, background: C.panel, border: `1.5px solid ${r.col}`, fontFamily: theme.mono, fontSize: 25 }}>
                      <span style={{ color: C.textSecondary }}>{r.l}</span>
                      <strong style={{ color: r.col }}>{r.r}</strong>
                    </div>
                  </Pop>
                ) : null,
              )}
              {frame >= tForm && frame < tSeller && (
                <Pop at={tForm}>
                  <Pill text="perte plafonnée · gain ouvert" size={28} filled />
                </Pop>
              )}
              {frame >= tSeller && (
                <Pop at={tSeller}>
                  <Panel style={{ padding: "16px 20px", borderColor: C.context }}>
                    <Label size={25} color={C.context}>vendeur (pointillé bleu)</Label>
                    <Label size={24} color={C.textPrimary}>encaisse 700 $ tout de suite</Label>
                    <Label size={24} color={C.negative}>GLD à 430 : doit payer 3 500 $</Label>
                    {frame >= tCap && <Label size={26} color={C.accentBright}>gain plafonné · perte ouverte</Label>}
                  </Panel>
                </Pop>
              )}
            </div>
          </At>
        </S>
      </Beat>
    </SceneShell>
  );
};

// ---------------------------------------------------------------------------
export const PutExample: React.FC<SceneProps> = ({ words, durationInFrames }) => {
  const frame = useCurrentFrame();
  const cue = makeCue(words);
  const tNow = cue("maintenant l option de vente");
  const tHold = cue("imaginons que hachim detient");
  const tFear = cue("il a peur d une chute");
  const tBuy = cue("il achete une option de vente");
  const tCost = cue("cout de l assurance");
  const tS1 = cue("scenario un");
  const tPutPays = cue("mais son option de vente");
  const tGives = cue("l assurance lui rend");
  const tTotal = cue("sa perte totale tombe");
  const tS2 = cue("scenario deux");
  const tExpire = cue("l option de vente expire");
  const tCalm = cue("c est le prix de la tranquillite");
  const tNote = cue("tu remarques une chose");
  const tSo = cue("c est pour ca qu on ne peut jamais");
  const tInv = cue("et l inverse existe aussi");
  const tTwo = cue("retiens bien ces deux");
  const bar = (v: number, max: number, col: string, at: number) => {
    const p = interpolate(frame, [at, at + 24], [0, 1], { ...clamp, easing: theme.ease.out });
    return <div style={{ height: 34, width: (Math.abs(v) / max) * 520 * p, background: col, borderRadius: 8 }} />;
  };
  const Row: React.FC<{ at: number; l: string; v: number; txt: string; col: string }> = ({ at, l, v, txt, col }) =>
    frame >= at ? (
      <Pop at={at}>
        <div style={{ display: "grid", gridTemplateColumns: "300px 540px 240px", alignItems: "center", gap: 20, marginBottom: 18 }}>
          <Label size={26} color={C.textPrimary}>{l}</Label>
          {bar(v, 3000, col, at)}
          <div style={{ color: col, fontFamily: theme.mono, fontSize: 32, fontWeight: 900 }}>{txt}</div>
        </div>
      </Pop>
    ) : null;
  return (
    <SceneShell eyebrow="F11 · Exemple réel · option de vente GLD" title="L'option de vente, c'est une assurance" durationInFrames={durationInFrames}>
      <Sfx file="pop.wav" at={tHold} volume={0.4} />
      <Sfx file="bass.wav" at={tFear} volume={0.35} />
      <Sfx file="pop.wav" at={tBuy} volume={0.4} />
      <Sfx file="bass.wav" at={tS1} volume={0.4} />
      <Sfx file="click.wav" at={tGives} volume={0.4} />
      <Sfx file="click.wav" at={tS2 + 40} volume={0.4} />
      <Sfx file="whoosh.wav" at={tNote} volume={0.4} />
      <Beat from={tNow} to={tS1} style={{ left: 0, top: 0 }}>
        <S>
          <At x={100} y={150}>
            <Pop at={tHold}>
              <Person size={230} color={C.positive} label="Hachim" />
            </Pop>
          </At>
          {frame >= tHold && (
            <At x={400} y={80}>
              <Pop at={tHold + 20}>
                <Panel style={{ textAlign: "center", width: 420 }}>
                  <CoinStackIcon size={110} />
                  <Big size={36}>100 parts GLD</Big>
                  <Label size={24}>achetées 389,51 $ · valeur 38 951 $</Label>
                </Panel>
              </Pop>
            </At>
          )}
          {frame >= tFear && (
            <At x={130} y={20}>
              <Pop at={tFear}>
                <Bubble text="et si ça chute avant la Fed ?" width={380} tone={C.negative} />
              </Pop>
            </At>
          )}
          {frame >= tBuy && (
            <At x={960} y={60}>
              <Pop at={tBuy}>
                <Ticket title="OPTION DE VENTE · GLD" width={600} color={C.negative} rows={[["prix d'exercice", "380"], ["échéance", "30 jours"], ["prime", "4,40 $ / part"], ["1 contrat", "= ses 100 parts"]]} />
              </Pop>
            </At>
          )}
          {frame >= tCost && (
            <At x={1040} y={400}>
              <Pop at={tCost}>
                <Pill text="coût de l'assurance : 440 $" size={34} filled color={C.accentBright} />
              </Pop>
            </At>
          )}
        </S>
      </Beat>
      <Beat from={tS1} to={tNote} style={{ left: 0, top: 0 }}>
        <S>
          <At x={60} y={0} w={1650}>
            <div style={{ display: "flex", gap: 30, alignItems: "center", marginBottom: 26 }}>
              <Pill text={frame < tS2 ? "scénario 1 · GLD tombe à 360" : "scénario 2 · GLD monte à 410"} size={32} color={frame < tS2 ? C.negative : C.positive} filled />
            </div>
            {frame < tS2 ? (
              <>
                <Row at={tS1 + 40} l="ses parts" v={-2951} txt="−2 951 $" col={C.negative} />
                <Row at={tPutPays} l="option de vente" v={2000} txt="+2 000 $" col={C.positive} />
                <Row at={tGives - 40} l="− prime" v={-440} txt="−440 $" col={C.accentDim} />
                {frame >= tTotal && (
                  <Pop at={tTotal}>
                    <Panel glow style={{ display: "flex", gap: 40, alignItems: "center", marginTop: 20, width: 1300 }}>
                      <Big size={40}>perte totale : −1 391 $</Big>
                      <Label size={28}>au lieu de −2 951 $ sans assurance</Label>
                    </Panel>
                  </Pop>
                )}
              </>
            ) : (
              <>
                <Row at={tS2 + 40} l="ses parts" v={2049} txt="+2 049 $" col={C.positive} />
                <Row at={tExpire} l="option de vente" v={-440} txt="−440 $" col={C.negative} />
                {frame >= tCalm - 60 && (
                  <Pop at={tCalm - 60}>
                    <Panel glow style={{ display: "flex", gap: 40, alignItems: "center", marginTop: 20, width: 1300 }}>
                      <Big size={40}>gain net : +1 609 $</Big>
                      {frame >= tCalm && <Label size={28}>440 $ = le prix de la tranquillité</Label>}
                    </Panel>
                  </Pop>
                )}
              </>
            )}
          </At>
        </S>
      </Beat>
      <Beat from={tNote} style={{ left: 0, top: 0 }}>
        <S>
          <At x={80} y={40} w={760}>
            <Panel style={{ textAlign: "center" }}>
              <Label size={28} color={C.textPrimary}>Hachim achète une option de vente…</Label>
              <Big size={40} color={C.positive}>…et pourtant il détient de l&apos;or</Big>
            </Panel>
          </At>
          {frame >= tSo && (
            <At x={80} y={300} w={760}>
              <Pop at={tSo}>
                <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                  <Pill text="beaucoup d'options de vente" color={C.negative} size={28} />
                  <Big size={50} color={C.negative}>≠</Big>
                  <Pill text="pari sur la baisse" color={C.textMuted} size={28} />
                </div>
                <Label size={26} color={C.textPrimary}>une grande partie = des assurances</Label>
              </Pop>
            </At>
          )}
          {frame >= tInv && (
            <At x={940} y={40} w={760}>
              <Pop at={tInv}>
                <Panel style={{ textAlign: "center", borderColor: C.positive }}>
                  <Label size={28} color={C.textPrimary}>il détient des parts et vend des options d&apos;achat au-dessus du prix</Label>
                  <Big size={36} color={C.accentBright}>→ il encaisse des primes</Big>
                </Panel>
              </Pop>
            </At>
          )}
          {frame >= tTwo && (
            <At x={940} y={320} w={760}>
              <Pop at={tTwo}>
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <Pill text="① achat d'assurances (options de vente)" color={C.negative} size={28} filled />
                  <Pill text="② vente d'options d'achat (primes)" color={C.positive} size={28} filled />
                  <Label size={24}>on les retrouvera dans les graphiques</Label>
                </div>
              </Pop>
            </At>
          )}
        </S>
      </Beat>
    </SceneShell>
  );
};

// ---------------------------------------------------------------------------
export const MoneynessGld: React.FC<SceneProps> = ({ words, durationInFrames }) => {
  const frame = useCurrentFrame();
  const cue = makeCue(words);
  const tQ = cue("ou se situe le prix d exercice");
  const tTake = cue("prenons gld");
  const tITM = cue("est dans la monnaie");
  const tATM = cue("est a la monnaie");
  const tOTM = cue("est hors de la monnaie");
  const tPut = cue("pour une option de vente c est l inverse");
  const tPrices = cue("maintenant les prix");
  const tIntr = cue("la valeur intrinseque");
  const tRest = cue("et le reste");
  const tTV = cue("la valeur temps c est le prix");
  const t400 = cue("et elle n a aucune valeur intrinseque");
  const tHope = cue("du pur espoir");
  const tExpiry = cue("a l echeance la valeur temps");
  const tLast = cue("dernier point");
  const tYet = cue("elle est dans la monnaie et pourtant");
  const decay: Array<[number, number]> = Array.from({ length: 16 }, (_, i) => {
    const t = i / 15;
    return [t, Math.sqrt(1 - t * 0.999)];
  });
  return (
    <SceneShell eyebrow="F11 · Dans, à, hors de la monnaie" title="Valeur intrinsèque + valeur temps" durationInFrames={durationInFrames}>
      <Sfx file="pop.wav" at={tITM} volume={0.35} />
      <Sfx file="pop.wav" at={tATM} volume={0.35} />
      <Sfx file="pop.wav" at={tOTM} volume={0.35} />
      <Sfx file="whoosh.wav" at={tPrices} volume={0.4} />
      <Sfx file="bass.wav" at={tYet} volume={0.45} />
      <Beat from={tQ} to={tPrices} style={{ left: 0, top: 0 }}>
        <S>
          <At x={120} y={100}>
            <PriceAxis
              min={372}
              max={408}
              width={1500}
              marks={[
                { v: 380, t: "dans la monnaie", color: C.positive, at: tITM },
                { v: 389.51, t: "GLD", color: C.accentBright, at: tTake, below: true },
                { v: 390, t: "à la monnaie", color: C.accent, at: tATM },
                { v: 400, t: "hors de la monnaie", color: C.negative, at: tOTM },
              ]}
            />
          </At>
          {frame >= tITM && frame < tPut && (
            <At x={200} y={380} w={1300}>
              <Pop at={tITM}>
                <Label size={30} color={C.textPrimary}>option d&apos;achat 380 : acheter à 380 ce qui vaut 389,51 → déjà 9,51 $ de valeur réelle</Label>
              </Pop>
            </At>
          )}
          {frame >= tPut && (
            <At x={200} y={380} w={1300}>
              <Pop at={tPut}>
                <Panel style={{ textAlign: "center", borderColor: C.negative }}>
                  <Label size={30} color={C.textPrimary}>option de vente : c&apos;est l&apos;inverse</Label>
                  <Label size={26}>vente 400 = dans la monnaie · vente 380 = hors de la monnaie</Label>
                </Panel>
              </Pop>
            </At>
          )}
        </S>
      </Beat>
      <Beat from={tPrices} to={tExpiry} style={{ left: 0, top: 0 }}>
        <S>
          <At x={140} y={20}>
            <div style={{ display: "flex", gap: 80, alignItems: "flex-end" }}>
              <div style={{ textAlign: "center" }}>
                <Label size={24}>achat 380 · prime 15,19 $</Label>
                <ValueBar intrinsic={frame >= tIntr ? 9.51 : 0.001} time={frame >= tRest ? 5.68 : 0.001} at={tIntr} label="" />
              </div>
              {frame >= t400 - 40 && (
                <div style={{ textAlign: "center" }}>
                  <Label size={24}>achat 400 · prime 5,16 $</Label>
                  <ValueBar intrinsic={0} time={5.16} at={t400 - 40} label="" />
                </div>
              )}
            </div>
          </At>
          <At x={820} y={40} w={880}>
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              {frame >= tIntr && (
                <Pop at={tIntr}>
                  <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                    <div style={{ width: 30, height: 30, borderRadius: 6, background: C.accent }} />
                    <Label size={28} color={C.textPrimary}>valeur intrinsèque : ce que rapporte l&apos;exercice immédiat</Label>
                  </div>
                </Pop>
              )}
              {frame >= tRest && (
                <Pop at={tRest}>
                  <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                    <div style={{ width: 30, height: 30, borderRadius: 6, background: C.context }} />
                    <Label size={28} color={C.textPrimary}>valeur temps : le prix de la possibilité</Label>
                  </div>
                </Pop>
              )}
              {frame >= tTV && (
                <Pop at={tTV}>
                  <div style={{ display: "flex", gap: 20, alignItems: "center", marginTop: 20 }}>
                    <CalendarPage top="RESTE" big="30 j" size={170} />
                    <Label size={28}>plus il reste de temps, plus la possibilité vaut cher</Label>
                  </div>
                </Pop>
              )}
              {frame >= tHope && (
                <Pop at={tHope}>
                  <Pill text="achat 400 : 100 % valeur temps · du pur espoir" size={28} color={C.context} filled />
                </Pop>
              )}
            </div>
          </At>
        </S>
      </Beat>
      <Beat from={tExpiry} to={tLast} style={{ left: 0, top: 0 }}>
        <Center column gap={20}>
          <Label size={30} color={C.textPrimary}>valeur temps → 0 à l&apos;échéance, de plus en plus vite</Label>
          <Curve pts={decay} from={tExpiry + 10} width={1100} height={360} color={C.context} xLabels={["30 j", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "0"]} />
        </Center>
      </Beat>
      <Beat from={tLast} style={{ left: 0, top: 0 }}>
        <Center column gap={30}>
          <CalcLine at={tLast + 20} left="payé 15,19 $ · GLD finit à 390 → l'option vaut" right="10 $" size={38} />
          <CalcLine at={tYet - 30} left="10 − 15,19 =" right="−5,19 $ par part" size={44} color={C.negative} />
          {frame >= tYet && (
            <div style={{ marginTop: 20 }}>
              <Stamp at={tYet} text="DANS LA MONNAIE ≠ GAGNANT" color={C.negative} size={46} />
            </div>
          )}
        </Center>
      </Beat>
    </SceneShell>
  );
};

// ---------------------------------------------------------------------------
const BandBell: React.FC<{ from: number; width?: number }> = ({ from, width = 1100 }) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [from, from + 40], [0, 1], { ...clamp, easing: theme.ease.inOut });
  const H = 300;
  const pts: string[] = [];
  const band: string[] = [];
  for (let i = 0; i <= 100; i++) {
    const x = (i / 100) * width;
    const z = (i - 50) / 16;
    const y = H - Math.exp((-z * z) / 2) * (H - 20) * p;
    pts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
    if (Math.abs(z) <= 1) band.push(`${x.toFixed(1)},${y.toFixed(1)}`);
  }
  const x0 = ((50 - 16) / 100) * width;
  const x1 = ((50 + 16) / 100) * width;
  return (
    <svg width={width} height={H + 50}>
      <polygon points={`${x0},${H} ${band.join(" ")} ${x1},${H}`} fill={`${C.accent}44`} />
      <polyline points={pts.join(" ")} fill="none" stroke={C.accentBright} strokeWidth="5" />
      <line x1="0" x2={width} y1={H} y2={H} stroke={C.hairline} strokeWidth="2" />
      <line x1={width / 2} x2={width / 2} y1={H} y2="20" stroke={C.textMuted} strokeDasharray="6 6" />
      <text x={x0} y={H + 36} textAnchor="middle" fill={C.negative} fontSize="28" fontWeight="800" fontFamily={theme.mono}>≈ 367</text>
      <text x={width / 2} y={H + 36} textAnchor="middle" fill={C.textPrimary} fontSize="26" fontFamily={theme.mono}>389,51</text>
      <text x={x1} y={H + 36} textAnchor="middle" fill={C.positive} fontSize="28" fontWeight="800" fontFamily={theme.mono}>≈ 412</text>
    </svg>
  );
};

export const ImpliedVolGld: React.FC<SceneProps> = ({ words, durationInFrames }) => {
  const frame = useCurrentFrame();
  const cue = makeCue(words);
  const tWhy = cue("pourquoi une option coute");
  const tFive = cue("le prix d une option depend de cinq");
  const tFour = cue("les quatre premiers");
  const tFifth = cue("le cinquieme non");
  const tInv = cue("alors on fait l inverse");
  const tNot = cue("elle n est pas mesuree");
  const tConv = cue("par convention");
  const tEx = cue("exemple gld vaut");
  const tRoot = cue("on multiplie par la racine");
  const tBand = cue("ca dessine une bande");
  const tModel = cue("dans le modele");
  const tSym = cue("et surtout cette bande");
  const tBoth = cue("quand la volatilite implicite monte");
  const tEx2 = cue("si la volatilite passe a");
  const tPays = cue("le marche paie plus cher");
  const tKeep = cue("retiens cette idee");
  const INPUTS = [
    { t: "prix actuel", at: tFive + 30 },
    { t: "prix d'exercice", at: tFive + 45 },
    { t: "temps restant", at: tFive + 60 },
    { t: "taux", at: tFive + 75 },
    { t: "agitation attendue", at: tFive + 90 },
  ];
  const volNow = frame < tEx2 ? 20 : interpolate(frame, [tEx2 + 30, tEx2 + 80], [20, 25], clamp);
  return (
    <SceneShell eyebrow="F11 · La volatilité implicite" title="Le prix d'une option cache un chiffre : l'agitation attendue" durationInFrames={durationInFrames}>
      <Sfx file="pop.wav" at={tFive} volume={0.35} />
      <Sfx file="bass.wav" at={tFifth} volume={0.4} />
      <Sfx file="whoosh.wav" at={tInv} volume={0.4} />
      <Sfx file="chime.wav" at={tBand} volume={0.45} />
      <Sfx file="tick.wav" at={tEx2} volume={0.4} />
      <Beat from={tWhy} to={tConv} style={{ left: 0, top: 0 }}>
        <S>
          <At x={60} y={40}>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {INPUTS.map((inp, i) =>
                frame >= inp.at ? (
                  <Pop key={inp.t} at={inp.at}>
                    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                      <Pill text={inp.t} size={28} color={i < 4 ? C.positive : C.amber} />
                      {i < 4 && frame >= tFour && <CheckDraw at={tFour + i * 6} size={40} />}
                      {i === 4 && frame >= tFifth && <Big size={44} color={C.amber}>?</Big>}
                    </div>
                  </Pop>
                ) : null,
              )}
            </div>
          </At>
          <At x={700} y={60}>
            <ModelMachine size={380} display={frame >= tInv ? "IV = 20 %" : "prix ?"} />
          </At>
          {frame >= tInv && (
            <At x={1150} y={100} w={560}>
              <Pop at={tInv}>
                <Panel style={{ textAlign: "center" }}>
                  <Label size={26}>prix observé de l&apos;option</Label>
                  <Big size={48}>7,00 $</Big>
                  <ArrowGlyph up={false} color={C.accentBright} size={50} />
                  <Label size={26} color={C.textPrimary}>quelle agitation redonne ce prix ?</Label>
                </Panel>
              </Pop>
            </At>
          )}
          {frame >= tNot && (
            <At x={1150} y={500}>
              <Pop at={tNot}>
                <Pill text="déduite, pas mesurée" size={32} filled />
              </Pop>
            </At>
          )}
        </S>
      </Beat>
      <Beat from={tConv} to={tBand} style={{ left: 0, top: 0 }}>
        <Center column gap={26}>
          <Pill text="exprimée sur 1 an · × √(temps) pour une autre durée" size={30} />
          <CalcLine at={tEx} left="GLD 389,51 $ · volatilité implicite 30 j :" right="20 %" size={40} />
          <CalcLine at={tRoot} left="√(30 / 365) ≈" right="0,287" size={40} />
          <CalcLine at={tRoot + 110} left="389,51 × 0,20 × 0,287 ≈" right="22,33 $" size={48} />
        </Center>
      </Beat>
      <Beat from={tBand} to={tBoth} style={{ left: 0, top: 0 }}>
        <Center column gap={20}>
          <BandBell from={tBand} />
          {frame >= tModel && (
            <Pop at={tModel}>
              <Pill text="≈ 2 fois sur 3 dans le modèle · ni cible ni limite" size={28} />
            </Pop>
          )}
          {frame >= tSym && (
            <Pop at={tSym}>
              <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
                <ArrowGlyph up color={C.positive} size={60} />
                <ArrowGlyph up={false} color={C.negative} size={60} />
                <Big size={40}>symétrique : aucune direction</Big>
              </div>
            </Pop>
          )}
        </Center>
      </Beat>
      <Beat from={tBoth} to={tKeep} style={{ left: 0, top: 0 }}>
        <S>
          <At x={80} y={40}>
            <div style={{ display: "flex", gap: 30 }}>
              <Ticket title="OPTION D'ACHAT" rows={[["prix", "↑ plus chère"]]} color={C.positive} width={360} />
              <Ticket title="OPTION DE VENTE" rows={[["prix", "↑ plus chère"]]} color={C.negative} width={360} />
            </div>
            <Label size={26}>volatilité implicite ↑ → les deux en même temps</Label>
          </At>
          {frame >= tEx2 - 60 && (
            <At x={950} y={20} w={720}>
              <Pop at={tEx2 - 60}>
                <Panel glow style={{ textAlign: "center" }}>
                  <Label size={26}>option d&apos;achat 390 · GLD immobile à 389,51</Label>
                  <div style={{ display: "flex", justifyContent: "space-around", alignItems: "center", marginTop: 16 }}>
                    <div>
                      <Label size={24}>volatilité</Label>
                      <Big size={60} color={C.amber}>{volNow.toFixed(0)} %</Big>
                    </div>
                    <div>
                      <Label size={24}>prime</Label>
                      <Big size={60}>
                        <AnimatedNumber from={9.3} to={frame >= tEx2 + 30 ? 11.52 : 9.3} delay={tEx2 + 30} durationFrames={50} format={(n) => `${n.toFixed(2).replace(".", ",")} $`} />
                      </Big>
                    </div>
                  </div>
                  {frame >= tPays && <Label size={26} color={C.textPrimary}>même incertitude… payée plus cher</Label>}
                </Panel>
              </Pop>
            </At>
          )}
        </S>
      </Beat>
      <Beat from={tKeep} style={{ left: 0, top: 0 }}>
        <Center column gap={30}>
          <Big size={64} glow>la volatilité implicite est un prix</Big>
          <div style={{ display: "flex", gap: 30 }}>
            <Pill text="↑ quand on veut se protéger ou spéculer" color={C.negative} size={28} />
            <Pill text="↓ quand on ne veut plus payer" color={C.positive} size={28} />
          </div>
          <Label size={28}>cette respiration → la vanna</Label>
        </Center>
      </Beat>
    </SceneShell>
  );
};

// ---------------------------------------------------------------------------
export const DeltaDeep: React.FC<SceneProps> = ({ words, durationInFrames }) => {
  const frame = useCurrentFrame();
  const cue = makeCue(words);
  const tStart = cue("on commence par le delta");
  const tDef = cue("le delta dit de combien");
  const tEx = cue("exemple l option d achat gld");
  const tPlus = cue("si gld monte d un dollar l option gagne");
  const tContract = cue("et comme un contrat porte");
  const tOther = cue("autre facon de le voir");
  const tEquiv = cue("on dit que son equivalent");
  const tPut = cue("pour une option de vente le delta est negatif");
  const tRange = cue("le delta va de zero a un");
  const tITM = cue("une option tres dans la monnaie");
  const tOTM = cue("une option tres hors de la monnaie");
  const tATM = cue("et a la monnaie on tourne");
  const tProb = cue("on entend souvent");
  const tNotFixed = cue("et surtout le delta n est pas fixe");
  const tNames = cue("le gamma le charme et la vanna");
  const tWhy = cue("pourquoi ca compte autant");
  const tOrders = cue("chaque fois que le delta bouge");
  const sig: Array<[number, number]> = Array.from({ length: 21 }, (_, i) => {
    const x = i / 20;
    return [x, 1 / (1 + Math.exp(-(x - 0.5) * 12))];
  });
  return (
    <SceneShell eyebrow="F11 · Lettre grecque n°1" title="Le delta : de combien l'option bouge" durationInFrames={durationInFrames}>
      <Sfx file="pop.wav" at={tEx} volume={0.35} />
      <Sfx file="click.wav" at={tContract} volume={0.35} />
      <Sfx file="whoosh.wav" at={tOther} volume={0.35} />
      <Sfx file="bass.wav" at={tPut} volume={0.35} />
      <Sfx file="whoosh.wav" at={tRange} volume={0.35} />
      <Sfx file="pop.wav" at={tNotFixed} volume={0.35} />
      <Beat from={tStart} to={tOther} style={{ left: 0, top: 0 }}>
        <Center column gap={30}>
          <Big size={46}>GLD +1 $ → option + delta × 1 $</Big>
          {frame >= tEx && (
            <Pop at={tEx}>
              <Ticket title="OPTION D'ACHAT GLD 390 · 30 J" rows={[["delta", "≈ 0,53"]]} width={560} color={C.positive} />
            </Pop>
          )}
          <CalcLine at={tPlus} left="GLD +1 $ → l'option gagne ≈" right="0,53 $" size={40} />
          <CalcLine at={tContract} left="× 100 parts → le contrat gagne ≈" right="53 $" size={40} />
        </Center>
      </Beat>
      <Beat from={tOther} to={tRange} style={{ left: 0, top: 0 }}>
        <S>
          <At x={100} y={30}>
            <Label size={30} color={C.textPrimary}>1 contrat d&apos;achat 390 ≈ 53 parts de GLD</Label>
            <div style={{ marginTop: 20 }}>
              <ShareGrid lit={53} at={tOther + 20} color={C.positive} size={30} />
            </div>
            {frame >= tEquiv && <Pill text="équivalent en parts = 53" size={28} filled />}
          </At>
          {frame >= tPut && (
            <At x={940} y={30}>
              <Pop at={tPut}>
                <Label size={30} color={C.textPrimary}>option de vente 380 · delta ≈ −0,30</Label>
                <div style={{ marginTop: 20 }}>
                  <ShareGrid lit={30} at={tPut + 20} color={C.negative} size={30} />
                </div>
                <Pill text="≈ position vendeuse de 30 parts" size={28} color={C.negative} filled />
              </Pop>
            </At>
          )}
        </S>
      </Beat>
      <Beat from={tRange} to={tNotFixed} style={{ left: 0, top: 0 }}>
        <S>
          <At x={200} y={20}>
            <Curve pts={sig} from={tRange} width={1000} height={440} color={C.positive} dots={false} xLabels={["très hors", "", "", "", "", "", "", "", "", "", "à la monnaie", "", "", "", "", "", "", "", "", "", "très dans"]} />
          </At>
          <At x={60} y={0}>
            <Label size={24}>delta 1</Label>
          </At>
          <At x={60} y={420}>
            <Label size={24}>delta 0</Label>
          </At>
          <At x={1260} y={40} w={440}>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {frame >= tITM && <Pop at={tITM}><Pill text="très dans la monnaie → ≈ 1" color={C.positive} size={26} /></Pop>}
              {frame >= tOTM && <Pop at={tOTM}><Pill text="très hors → ≈ 0" color={C.negative} size={26} /></Pop>}
              {frame >= tATM && <Pop at={tATM}><Pill text="à la monnaie → ≈ 0,5" color={C.accentBright} size={26} /></Pop>}
              {frame >= tProb && (
                <Pop at={tProb}>
                  <Panel style={{ padding: "14px 18px" }}>
                    <Label size={24} color={C.textPrimary}>« delta = probabilité » ?</Label>
                    <Label size={24} color={C.amber}>une approximation, pas une vérité</Label>
                  </Panel>
                </Pop>
              )}
            </div>
          </At>
        </S>
      </Beat>
      <Beat from={tNotFixed} to={tWhy} style={{ left: 0, top: 0 }}>
        <Center gap={60}>
          <div style={{ display: "flex", flexDirection: "column", gap: 30 }}>
            {[
              { t: "le prix bouge", n: "gamma", col: C.accentBright },
              { t: "le temps passe", n: "charme", col: C.positive },
              { t: "la volatilité change", n: "vanna", col: C.violet },
            ].map((r, i) => (
              <Pop key={r.n} at={tNotFixed + 30 + i * 25}>
                <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
                  <Pill text={r.t} size={30} color={C.textSecondary} />
                  <div style={{ color: r.col, fontSize: 40 }}>→</div>
                  {frame >= tNames && <Pill text={r.n} size={34} color={r.col} filled />}
                </div>
              </Pop>
            ))}
          </div>
          <Big size={90} color={C.positive}>Δ</Big>
        </Center>
      </Beat>
      <Beat from={tWhy} style={{ left: 0, top: 0 }}>
        <S>
          <At x={120} y={80}>
            <DealerDesk size={1.4} screen="Δ bouge" />
          </At>
          <At x={720} y={60} w={900}>
            <Label size={32} color={C.textPrimary}>le vendeur d&apos;options couvre son delta avec le sous-jacent</Label>
          </At>
          <At x={760} y={200}>
            <div style={{ display: "flex", flexDirection: "column", gap: 30 }}>
              <Flow at={tOrders} buy text="achète des parts" />
              <Flow at={tOrders + 40} buy={false} text="vend des parts" />
            </div>
          </At>
          {frame >= tOrders + 90 && (
            <At x={760} y={520}>
              <Pop at={tOrders + 90}>
                <Pill text="de vrais ordres, qui arrivent sur le marché" size={30} filled />
              </Pop>
            </At>
          )}
        </S>
      </Beat>
    </SceneShell>
  );
};

// ---------------------------------------------------------------------------
export const GammaDeep: React.FC<SceneProps> = ({ words, durationInFrames }) => {
  const frame = useCurrentFrame();
  const cue = makeCue(words);
  const tStart = cue("le gamma maintenant");
  const tSpeed = cue("si le delta est la vitesse");
  const tDef = cue("le gamma dit de combien le delta change");
  const tBack = cue("reprenons l option d achat");
  const tP1 = cue("si gld monte d un dollar le delta passe");
  const tP2 = cue("s il monte de deux dollars");
  const tMore = cue("l option devient de plus en plus");
  const tPer = cue("pour un contrat de");
  const tOrder = cue("garde cet ordre de grandeur");
  const tWhere = cue("ou le gamma est il le plus fort");
  const tFar = cue("loin du prix");
  const tExp = cue("et quand l echeance approche");
  const tFive = cue("plus de cinq fois plus");
  const tEnd = cue("parce qu a la toute fin");
  const tSwitch = cue("c est un interrupteur");
  const tDay = cue("c est exactement ce qui se passe");
  const tSign = cue("le gamma est positif pour celui");
  const tAll = cue("toute la lecture");
  const gPrice = frame < tP1 ? 389.51 : frame < tP2 ? 390.51 : 391.51;
  const gDelta = frame < tP1 ? 0.53 : frame < tP2 ? 0.54 : 0.56;
  const bell: Array<[number, number]> = Array.from({ length: 25 }, (_, i) => {
    const x = i / 24;
    return [x, Math.exp(-(((x - 0.5) / 0.16) ** 2))];
  });
  const bars = [
    { t: "30 jours", v: 0.018 },
    { t: "5 jours", v: 0.044 },
    { t: "veille", v: 0.097 },
  ];
  const osc = Math.sin((frame - tSwitch) / 7) * 3;
  const on = 390 + osc > 390;
  return (
    <SceneShell eyebrow="F11 · Lettre grecque n°2" title="Le gamma : l'accélération du delta" durationInFrames={durationInFrames}>
      <Sfx file="whoosh.wav" at={tSpeed} volume={0.35} />
      <Sfx file="tick.wav" at={tP1} volume={0.35} />
      <Sfx file="tick.wav" at={tP2} volume={0.35} />
      <Sfx file="pop.wav" at={tWhere} volume={0.35} />
      <Sfx file="bass.wav" at={tExp} volume={0.4} />
      <Sfx file="chime.wav" at={tSign} volume={0.45} />
      <Beat from={tStart} to={tPer} style={{ left: 0, top: 0 }}>
        <S>
          <At x={80} y={40}>
            <div style={{ display: "flex", gap: 40 }}>
              <Pop at={tSpeed}>
                <Speedometer value={0.53} size={300} label="delta = vitesse" />
              </Pop>
              <Pop at={tSpeed + 40}>
                <Speedometer value={interpolate(frame, [tSpeed + 40, tSpeed + 120], [0.2, 0.8], clamp)} size={300} label="gamma = accélération" />
              </Pop>
            </div>
          </At>
          {frame >= tBack && (
            <At x={900} y={40} w={800}>
              <Pop at={tBack}>
                <Panel glow>
                  <Label size={26}>option d&apos;achat GLD 390 · gamma ≈ 0,018</Label>
                  <div style={{ display: "flex", justifyContent: "space-around", marginTop: 16 }}>
                    <div style={{ textAlign: "center" }}>
                      <Label size={24}>GLD</Label>
                      <Big size={56}>{gPrice.toFixed(2).replace(".", ",")}</Big>
                    </div>
                    <div style={{ textAlign: "center" }}>
                      <Label size={24}>delta</Label>
                      <Big size={56} color={C.positive}>{gDelta.toFixed(2).replace(".", ",")}</Big>
                    </div>
                  </div>
                  {frame >= tMore && <Label size={26} color={C.textPrimary}>de plus en plus sensible à mesure que ça monte</Label>}
                </Panel>
              </Pop>
            </At>
          )}
        </S>
      </Beat>
      <Beat from={tPer} to={tWhere} style={{ left: 0, top: 0 }}>
        <Center column gap={30}>
          <CalcLine at={tPer} left="0,018 × 100 parts ≈" right="1,8 part / $ / contrat" size={42} />
          <CalcLine at={tPer + 90} left="× 10 000 contrats ≈" right="18 000 parts / $" size={46} />
          {frame >= tOrder && (
            <Pop at={tOrder}>
              <Pill text="garde cet ordre de grandeur" size={32} filled />
            </Pop>
          )}
        </Center>
      </Beat>
      <Beat from={tWhere} to={tExp} style={{ left: 0, top: 0 }}>
        <Center column gap={10}>
          <Curve pts={bell} from={tWhere} width={1100} height={380} color={C.accentBright} dots={false} xLabels={["loin", "", "", "", "", "", "", "", "", "", "", "", "prix d'exercice", "", "", "", "", "", "", "", "", "", "", "", "loin"]} />
          <Pill text="gamma maximal à la monnaie" size={30} />
          {frame >= tFar && <Label size={28}>loin du prix, il s&apos;écrase</Label>}
        </Center>
      </Beat>
      <Beat from={tExp} to={tEnd} style={{ left: 0, top: 0 }}>
        <Center gap={80}>
          {bars.map((b, i) => {
            const p = interpolate(frame, [tExp + 30 + i * 40, tExp + 60 + i * 40], [0, 1], { ...clamp, easing: theme.ease.out });
            return (
              <div key={b.t} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
                <div style={{ color: C.textPrimary, fontFamily: theme.mono, fontSize: 34, fontWeight: 900, opacity: p }}>{b.v.toFixed(3).replace(".", ",")}</div>
                <div style={{ width: 160, height: 480 * (b.v / 0.1) * p, background: i === 2 ? C.negative : C.accent, borderRadius: 12 }} />
                <Label size={28} color={C.textPrimary}>{b.t}</Label>
              </div>
            );
          })}
          {frame >= tFive && (
            <Pop at={tFive}>
              <Big size={60} color={C.negative}>× 5</Big>
            </Pop>
          )}
        </Center>
      </Beat>
      <Beat from={tEnd} to={tSign} style={{ left: 0, top: 0 }}>
        <Center column gap={34}>
          <div style={{ display: "flex", gap: 40, alignItems: "center" }}>
            <Pill text="finit dans la monnaie → delta 1" color={C.positive} size={30} />
            <Pill text="finit hors → delta 0" color={C.negative} size={30} />
          </div>
          {frame >= tSwitch && (
            <Pop at={tSwitch}>
              <div style={{ display: "flex", alignItems: "center", gap: 40 }}>
                <div style={{ width: 220, height: 110, borderRadius: 55, background: on ? C.positive : C.hairline, position: "relative" }}>
                  <div style={{ position: "absolute", top: 10, left: on ? 120 : 10, width: 90, height: 90, borderRadius: 45, background: C.textPrimary }} />
                </div>
                <Big size={50}>GLD {(390 + osc).toFixed(2).replace(".", ",")}</Big>
                <Big size={50} color={on ? C.positive : C.negative}>Δ {on ? "1" : "0"}</Big>
              </div>
            </Pop>
          )}
          {frame >= tDay && (
            <Pop at={tDay}>
              <Pill text="jour d'échéance · options du jour · couvertures ajustées en permanence" size={28} filled />
            </Pop>
          )}
        </Center>
      </Beat>
      <Beat from={tSign} style={{ left: 0, top: 0 }}>
        <Center gap={160}>
          <div style={{ textAlign: "center" }}>
            <Person size={200} color={C.positive} label="acheteur d'option" />
            <Big size={60} color={C.positive}>gamma +</Big>
          </div>
          <div style={{ textAlign: "center" }}>
            <Person size={200} color={C.negative} label="vendeur d'option" />
            <Big size={60} color={C.negative}>gamma −</Big>
          </div>
          {frame >= tAll && (
            <div style={{ position: "absolute", bottom: 20, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
              <Pop at={tAll}>
                <Pill text="toute la lecture des cartes gamma repose là-dessus" size={30} filled />
              </Pop>
            </div>
          )}
        </Center>
      </Beat>
    </SceneShell>
  );
};

// ---------------------------------------------------------------------------
export const ThetaVega: React.FC<SceneProps> = ({ words, durationInFrames }) => {
  const frame = useCurrentFrame();
  const cue = makeCue(words);
  const tTwo = cue("deux autres lettres");
  const tTheta = cue("le theta d abord");
  const tIce = cue("imagine un glacon");
  const tEx = cue("l option d achat gld a 390 vaut");
  const tLoses = cue("elle perd environ");
  const tAcc = cue("et la fonte s accelere");
  const tBuyer = cue("c est pour ca que l acheteur");
  const tVega = cue("le vega ensuite");
  const tPoint = cue("chaque point de volatilite");
  const tVol = cue("si la volatilite passe de");
  const tInv = cue("et a l inverse");
  const tCrush = cue("c est l ecrasement");
  const tRho = cue("le rho enfin");
  const tTable = cue("resumons avec un tableau");
  const tSeller = cue("le vendeur gamma negatif");
  const tKeep = cue("garde ce tableau");
  const melt = interpolate(frame, [tIce, tVega - 20], [0, 0.9], clamp);
  const decay: Array<[number, number]> = Array.from({ length: 16 }, (_, i) => {
    const t = i / 15;
    return [t, Math.sqrt(1 - t * 0.999)];
  });
  const rows: Array<[string, string, string]> = [
    ["gamma", "+", "−"],
    ["véga", "+", "−"],
    ["thêta", "−", "+"],
  ];
  return (
    <SceneShell eyebrow="F11 · Lettres grecques n°3 et n°4" title="Le thêta (le temps) et le véga (la peur)" durationInFrames={durationInFrames}>
      <Sfx file="pop.wav" at={tIce} volume={0.35} />
      <Sfx file="tick.wav" at={tLoses} volume={0.35} />
      <Sfx file="whoosh.wav" at={tVega} volume={0.4} />
      <Sfx file="click.wav" at={tVol} volume={0.35} />
      <Sfx file="bass.wav" at={tCrush} volume={0.4} />
      <Sfx file="chime.wav" at={tTable} volume={0.45} />
      <Beat from={tTwo} to={tVega} style={{ left: 0, top: 0 }}>
        <S>
          <At x={80} y={40}>
            <Pop at={tIce}>
              <IceCube melt={melt} size={320} />
            </Pop>
            <Big size={40} color={C.ice}>thêta = la fonte</Big>
          </At>
          {frame >= tEx && (
            <At x={520} y={40} w={560}>
              <Pop at={tEx}>
                <Panel>
                  <Label size={24}>achat GLD 390 · thêta ≈ −0,17</Label>
                  <Big size={60}>
                    <AnimatedNumber from={9.3} to={frame >= tLoses ? 9.13 : 9.3} delay={tLoses} durationFrames={40} format={(n) => `${n.toFixed(2).replace(".", ",")} $`} />
                  </Big>
                  {frame >= tLoses && <Label size={26} color={C.negative}>−0,17 $ / jour → −17 $ / contrat / jour</Label>}
                </Panel>
              </Pop>
            </At>
          )}
          {frame >= tAcc && (
            <At x={1120} y={20}>
              <Pop at={tAcc}>
                <Curve pts={decay} from={tAcc} width={560} height={300} color={C.ice} dots={false} xLabels={["30 j", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "0"]} />
                <Label size={24}>lente au début, brutale à la fin</Label>
              </Pop>
            </At>
          )}
          {frame >= tBuyer && (
            <At x={520} y={440} w={1100}>
              <Pop at={tBuyer}>
                <div style={{ display: "flex", gap: 24 }}>
                  <Pill text="l'acheteur se bat contre la montre" color={C.negative} size={28} />
                  <Pill text="le vendeur encaisse le temps" color={C.positive} size={28} />
                </div>
              </Pop>
            </At>
          )}
        </S>
      </Beat>
      <Beat from={tVega} to={tTable} style={{ left: 0, top: 0 }}>
        <S>
          <At x={120} y={30} w={700}>
            <Panel glow>
              <Big size={46} color={C.amber}>véga ≈ 0,44</Big>
              {frame >= tPoint && <Label size={28} color={C.textPrimary}>+1 point de volatilité → +0,44 $ sur la prime</Label>}
              {frame >= tVol && <CalcLine at={tVol} left="20 % → 25 % :" right="+2,20 $" size={40} />}
              {frame >= tVol + 40 && <Label size={24}>même si GLD ne bouge pas</Label>}
            </Panel>
          </At>
          {frame >= tInv && (
            <At x={900} y={30} w={760}>
              <Pop at={tInv}>
                <Panel style={{ borderColor: C.negative }}>
                  <Label size={28} color={C.textPrimary}>annonce → la volatilité retombe</Label>
                  <Label size={26}>le prix va dans ton sens… et l&apos;option perd quand même</Label>
                  {frame >= tCrush && (
                    <div style={{ marginTop: 14 }}>
                      <Stamp at={tCrush} text="ÉCRASEMENT DE LA VOLATILITÉ" color={C.negative} size={32} />
                    </div>
                  )}
                </Panel>
              </Pop>
            </At>
          )}
          {frame >= tRho && (
            <At x={120} y={470} w={1500}>
              <Pop at={tRho}>
                <Pill text="rhô : sensibilité aux taux · petit effet sur 1 mois" size={28} color={C.textSecondary} />
              </Pop>
            </At>
          )}
        </S>
      </Beat>
      <Beat from={tTable} style={{ left: 0, top: 0 }}>
        <Center column gap={20}>
          <div style={{ display: "grid", gridTemplateColumns: "260px 380px 380px", gap: 14, alignItems: "center" }}>
            <div />
            <Big size={34} color={C.positive}>acheteur</Big>
            {frame >= tSeller ? <Big size={34} color={C.negative}>vendeur</Big> : <div />}
            {rows.map(([n, b, s]) => (
              <React.Fragment key={n}>
                <Big size={36}>{n}</Big>
                <Big size={60} color={b === "+" ? C.positive : C.negative}>{b}</Big>
                {frame >= tSeller ? <Big size={60} color={s === "+" ? C.positive : C.negative}>{s}</Big> : <div />}
              </React.Fragment>
            ))}
          </div>
          <div style={{ display: "flex", gap: 30, marginTop: 10 }}>
            <Pill text="veut du mouvement et de la peur · paie le temps" color={C.positive} size={24} />
            {frame >= tSeller && <Pill text="veut du calme · encaisse le temps · souffre si ça s'emballe" color={C.negative} size={24} />}
          </div>
          {frame >= tKeep && <Label size={28} color={C.textPrimary}>qui, sur le marché, est acheteur… et qui est vendeur ?</Label>}
        </Center>
      </Beat>
    </SceneShell>
  );
};

// ---------------------------------------------------------------------------
export const VannaCharm: React.FC<SceneProps> = ({ words, durationInFrames }) => {
  const frame = useCurrentFrame();
  const cue = makeCue(words);
  const tMiss = cue("il nous manque deux lettres");
  const tSecond = cue("ce sont des sensibilites de second ordre");
  const tVanna = cue("la vanna c est le lien");
  const tEx = cue("exemple l option de vente gld a 380");
  const tDrop = cue("si la volatilite retombe");
  const tWhy = cue("pourquoi parce qu avec moins");
  const tImply = cue("pense a ce que ca implique");
  const tJust = cue("juste parce que la peur a change");
  const tCharm = cue("le charme lui");
  const tSame = cue("la meme option de vente a 380 avec");
  const t20 = cue("a vingt jours");
  const t5 = cue("a cinq jours");
  const t1 = cue("et la veille de l echeance");
  const tFar = cue("si le prix reste loin");
  const tSchema = cue("retiens le schema");
  const tG = cue("le gamma c est le prix");
  const tV = cue("la vanna c est la volatilite");
  const tC = cue("et le charme c est le temps");
  const tThree = cue("trois moteurs");
  const vol = frame < tDrop ? 25 : interpolate(frame, [tDrop + 20, tDrop + 70], [25, 18], clamp);
  const days = [
    { d: "30 j", v: 0.33, at: tSame + 40 },
    { d: "20 j", v: 0.31, at: t20 },
    { d: "5 j", v: 0.19, at: t5 },
    { d: "veille", v: 0.03, at: t1 },
  ];
  const engines = [
    { src: "PRIX", g: "gamma", col: C.accentBright, at: tG },
    { src: "VOLATILITÉ", g: "vanna", col: C.violet, at: tV },
    { src: "TEMPS", g: "charme", col: C.positive, at: tC },
  ];
  return (
    <SceneShell eyebrow="F11 · Lettres grecques de second ordre" title="La vanna et le charme : ce qui bouge le delta sans que le prix bouge" durationInFrames={durationInFrames}>
      <Sfx file="pop.wav" at={tVanna} volume={0.35} />
      <Sfx file="tick.wav" at={tDrop} volume={0.35} />
      <Sfx file="whoosh.wav" at={tCharm} volume={0.4} />
      <Sfx file="tick.wav" at={t20} volume={0.3} />
      <Sfx file="tick.wav" at={t5} volume={0.3} />
      <Sfx file="tick.wav" at={t1} volume={0.3} />
      <Sfx file="chime.wav" at={tSchema} volume={0.45} />
      <Beat from={tMiss} to={tEx} style={{ left: 0, top: 0 }}>
        <Center gap={60}>
          <Pop at={tSecond}>
            <Panel glow style={{ width: 640, textAlign: "center", borderColor: C.violet }}>
              <Big size={60} color={C.violet}>vanna</Big>
              {frame >= tVanna && <Big size={34}>volatilité → delta</Big>}
            </Panel>
          </Pop>
          <Pop at={tSecond + 30}>
            <Panel style={{ width: 640, textAlign: "center", borderColor: C.positive }}>
              <Big size={60} color={C.positive}>charme</Big>
              <Big size={34}>temps → delta</Big>
            </Panel>
          </Pop>
        </Center>
      </Beat>
      <Beat from={tEx} to={tCharm} style={{ left: 0, top: 0 }}>
        <S>
          <At x={80} y={20} w={760}>
            <Panel>
              <Label size={26}>option de vente GLD 380 · hors de la monnaie</Label>
              <div style={{ display: "flex", justifyContent: "space-around", marginTop: 16 }}>
                <div style={{ textAlign: "center" }}>
                  <Label size={24}>volatilité</Label>
                  <Big size={64} color={C.violet}>{vol.toFixed(0)} %</Big>
                </div>
                <div style={{ textAlign: "center" }}>
                  <Label size={24}>delta</Label>
                  <Big size={64} color={C.negative}>{frame >= tDrop + 60 ? "−0,28" : "−0,33"}</Big>
                </div>
              </div>
              {frame >= tWhy && <Label size={26} color={C.textPrimary}>moins d&apos;agitation → chute sous 380 moins probable</Label>}
            </Panel>
          </At>
          {frame >= tImply && (
            <At x={960} y={20}>
              <Pop at={tImply}>
                <DealerDesk size={1.1} screen="Δ change" screenColor={C.violet} />
                <Label size={24}>a vendu l&apos;option · s&apos;est couvert</Label>
              </Pop>
            </At>
          )}
          {frame >= tJust - 60 && (
            <At x={960} y={400}>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <Flow at={tJust - 60} buy text="achète…" size={0.8} />
                <Flow at={tJust - 30} buy={false} text="…ou vend des parts" size={0.8} />
              </div>
            </At>
          )}
          {frame >= tJust && (
            <At x={80} y={440} w={800}>
              <Pop at={tJust}>
                <Pill text="le prix n'a pas bougé, la peur si" size={32} filled color={C.violet} />
              </Pop>
            </At>
          )}
        </S>
      </Beat>
      <Beat from={tCharm} to={tSchema} style={{ left: 0, top: 0 }}>
        <S>
          <At x={100} y={10}>
            <Label size={28} color={C.textPrimary}>option de vente 380 · volatilité 25 % · le temps passe</Label>
          </At>
          <At x={100} y={80}>
            <div style={{ display: "flex", gap: 60, alignItems: "flex-end", height: 520 }}>
              {days.map((d) =>
                frame >= d.at ? (
                  <div key={d.d} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
                    <div style={{ color: C.negative, fontFamily: theme.mono, fontSize: 36, fontWeight: 900 }}>−{d.v.toFixed(2).replace(".", ",")}</div>
                    <div style={{ width: 150, height: 250 * (d.v / 0.33) * interpolate(frame, [d.at, d.at + 20], [0, 1], clamp), background: C.negative, borderRadius: 12, minHeight: 6 }} />
                    <CalendarPage top="DANS" big={d.d} size={150} />
                  </div>
                ) : null,
              )}
            </div>
          </At>
          {frame >= tFar && (
            <At x={1130} y={120} w={560}>
              <Pop at={tFar}>
                <Panel glow style={{ borderColor: C.positive }}>
                  <Label size={28} color={C.textPrimary}>le temps vide le delta</Label>
                  <Label size={26}>→ la couverture est défaite petit à petit, jusqu&apos;à l&apos;échéance</Label>
                </Panel>
              </Pop>
            </At>
          )}
        </S>
      </Beat>
      <Beat from={tSchema} style={{ left: 0, top: 0 }}>
        <Center gap={70}>
          <div style={{ display: "flex", flexDirection: "column", gap: 34 }}>
            {engines.map((e) =>
              frame >= e.at ? (
                <Pop key={e.g} at={e.at}>
                  <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
                    <Pill text={e.src} size={34} color={e.col} />
                    <div style={{ color: e.col, fontSize: 40 }}>→</div>
                    <Pill text={e.g} size={34} color={e.col} filled />
                  </div>
                </Pop>
              ) : (
                <div key={e.g} style={{ height: 62 }} />
              ),
            )}
          </div>
          {frame >= tThree && (
            <Pop at={tThree}>
              <Panel glow style={{ textAlign: "center", width: 520 }}>
                <Big size={44}>couvertures</Big>
                <Big size={40} color={C.accentBright}>→ ordres sur le marché</Big>
              </Panel>
            </Pop>
          )}
        </Center>
      </Beat>
    </SceneShell>
  );
};
