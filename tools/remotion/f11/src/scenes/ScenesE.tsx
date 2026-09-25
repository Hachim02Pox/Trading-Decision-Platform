// F11 v5 — part 3: reading the real 24 Sept dashboard, panel by panel.
import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { theme } from "../theme";
import { Sfx, makeCue, Panel } from "./shared";
import type { SceneProps } from "./shared";
import { Beat, Pop, Cursor, ClockIcon, clamp, ArrowGlyph } from "./characters";
import { SceneShell, Center, Big, Label, STAGE_W } from "./stage";
import { Pill, Stamp, CalendarPage, CrossDraw } from "./props5";
import { CalcLine } from "./props11";
import { GexChart, RegimeBox, DashCards, ProfileChart, VANNA_PTS, CHARM_PTS, DexChart, CandleChart, Road, Ladder, Flow, DealerDesk, Verdict, CheckItem, FLIP } from "./dash";

const C = theme.colors;
const S: React.FC<{ children: React.ReactNode }> = ({ children }) => <div style={{ position: "relative", width: STAGE_W, height: 690 }}>{children}</div>;
const At: React.FC<{ x: number; y: number; children: React.ReactNode; w?: number }> = ({ x, y, children, w }) => (
  <div style={{ position: "absolute", left: x, top: y, width: w }}>{children}</div>
);
const Note: React.FC<{ at: number; children: React.ReactNode; color?: string }> = ({ at, children, color = C.textPrimary }) => {
  const frame = useCurrentFrame();
  if (frame < at) return null;
  return (
    <Pop at={at}>
      <div style={{ padding: "10px 18px", borderLeft: `4px solid ${color}`, background: C.panel, borderRadius: 10, color, fontSize: 26, fontWeight: 700, lineHeight: 1.3 }}>{children}</div>
    </Pop>
  );
};

// ---------------------------------------------------------------------------
export const DashCardsScene: React.FC<SceneProps> = ({ words, durationInFrames }) => {
  const frame = useCurrentFrame();
  const cue = makeCue(words);
  const tBoard = cue("place au vrai tableau");
  const tRow = cue("on commence par la rangee");
  const t1 = cue("premiere carte");
  const tGam = cue("juste en dessous le gamma");
  const tReg = cue("c est le regime");
  const tNet = cue("et encore en dessous");
  const tNoted = cue("sur l ecran elle est notee");
  const t2 = cue("deuxieme carte");
  const t3 = cue("troisieme carte");
  const tCalc = cue("fais le calcul");
  const tHeavy = cue("les options de vente pesent");
  const tConv = cue("selon la convention les teneurs");
  const t4 = cue("quatrieme carte");
  const tWall = cue("un mur c est simplement");
  const tRead = cue("le mur des options d achat est souvent lu");
  const tHere = cue("mais ici les deux murs");
  const tNotErr = cue("ce n est pas une erreur");
  const tLogic = cue("et c est logique");
  const tOne = cue("premiere lecture en une phrase");
  const hi = frame >= t4 ? 3 : frame >= tCalc ? undefined : frame >= t3 ? 2 : frame >= t2 ? 1 : frame >= t1 ? 0 : undefined;
  const subHi = frame >= t2 ? null : frame >= tNet ? "net" : frame >= tGam ? "gamma" : null;
  return (
    <SceneShell eyebrow="F11 · Tableau du 24 sept. · 11 h 29 (New York)" title="La rangée de cartes, carte par carte" durationInFrames={durationInFrames}>
      <Sfx file="whoosh.wav" at={tBoard} volume={0.4} />
      <Sfx file="pop.wav" at={t1} volume={0.35} />
      <Sfx file="pop.wav" at={t2} volume={0.35} />
      <Sfx file="pop.wav" at={t3} volume={0.35} />
      <Sfx file="click.wav" at={tCalc} volume={0.4} />
      <Sfx file="pop.wav" at={t4} volume={0.35} />
      <Sfx file="chime.wav" at={tOne} volume={0.45} />
      <Beat from={tBoard} to={tOne} style={{ left: 0, top: 0 }}>
        <S>
          <At x={20} y={0}>
            <DashCards hi={hi} subHi={subHi} width={1700} />
          </At>
          <At x={40} y={290} w={1660}>
            {frame >= tGam && frame < t2 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <Note at={tGam} color={C.negative}>Gamma −γ = le régime : gamma négatif</Note>
                <Note at={tReg}>selon le modèle, les couvertures accélèrent les mouvements</Note>
                <Note at={tNet}>Net GEX −329K = exposition gamma nette (G E X = « gamma exposure »)</Note>
              </div>
            )}
            {frame >= t2 && frame < t4 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <Note at={t2} color={C.positive}>options d&apos;achat : 242K</Note>
                <Note at={t3} color={C.negative}>options de vente : 571K</Note>
                {frame >= tCalc && <CalcLine at={tCalc} left="242K − 571K =" right="−329K" size={48} />}
                <Note at={tHeavy}>les options de vente pèsent plus de 2× plus lourd</Note>
                <Note at={tConv} color={C.violet}>convention → teneurs de marché globalement vendeurs de gamma</Note>
              </div>
            )}
            {frame >= t4 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <Note at={tWall}>mur = prix d&apos;exercice où l&apos;exposition gamma est la plus grosse (d&apos;un côté ou de l&apos;autre)</Note>
                <Note at={tRead}>mur des options d&apos;achat ≈ plafond · mur des options de vente ≈ plancher</Note>
                <Note at={tHere} color={C.amber}>ici : les deux à 390 → 390 écrase tout le reste</Note>
                <Note at={tLogic}>chiffre rond · collé au prix · échéances aujourd&apos;hui et demain → gamma à la monnaie maximal</Note>
              </div>
            )}
          </At>
          {frame >= tNotErr && frame < tLogic && (
            <At x={1300} y={300}>
              <Verdict at={tNotErr} kind="ok" text="pas une erreur" />
            </At>
          )}
          {frame >= tNoted && frame < t2 && (
            <At x={1250} y={470}>
              <Pop at={tNoted}>
                <Pill text="G E X = exposition gamma" size={30} filled color={C.violet} />
              </Pop>
            </At>
          )}
        </S>
      </Beat>
      <Beat from={tOne} style={{ left: 0, top: 0 }}>
        <Center column gap={30}>
          <Big size={52} glow>GLD juste sous un énorme nœud à 390</Big>
          <Big size={46} color={C.negative}>dans un régime où les couvertures amplifient</Big>
        </Center>
      </Beat>
    </SceneShell>
  );
};

// ---------------------------------------------------------------------------
export const GexBars: React.FC<SceneProps> = ({ words, durationInFrames }) => {
  const frame = useCurrentFrame();
  const cue = makeCue(words);
  const tMain = cue("descendons au graphique principal");
  const tV = cue("l axe vertical");
  const tIrreg = cue("attention l echelle n est pas reguliere");
  const tH = cue("l axe horizontal");
  const tRow = cue("chaque ligne horizontale");
  const tRed = cue("les barres rouges");
  const tGreen = cue("les barres vertes");
  const tHow = cue("comment lire une barre");
  const tShort = cue("une barre courte");
  const tLong = cue("une barre longue");
  const tShape = cue("regarde la forme generale");
  const tAbove = cue("au dessus du prix");
  const tBigRed = cue("il y a aussi quelques grosses barres rouges");
  const tBelow = cue("sous le prix");
  const tIns = cue("des assurances");
  const t390 = cue("et a 390 pile");
  const tBtn = cue("en haut du graphique un bouton");
  const tReadable = cue("c est plus lisible");
  const tOther = cue("un autre bouton");
  const hi = frame >= t390 && frame < tBtn ? [390] : frame >= tBigRed && frame < tBelow ? [400, 411] : frame >= tAbove && frame < tBigRed ? [400, 403] : frame >= tLong && frame < tShape ? [390] : frame >= tShort && frame < tLong ? [372] : [];
  const hiAt = frame >= t390 ? t390 : frame >= tBigRed ? tBigRed : frame >= tAbove ? tAbove : frame >= tLong ? tLong : tShort;
  const zone = frame >= tBelow && frame < t390 ? { from: 379, to: 390, color: C.negative, at: tBelow } : frame >= tAbove && frame < tBelow ? { from: 395, to: 435, color: C.positive, at: tAbove } : undefined;
  const netOnly = frame >= tBtn + 40;
  const btn = (label: string, on: boolean) => (
    <div style={{ padding: "8px 16px", borderRadius: 10, border: `1.5px solid ${on ? C.accent : C.hairline}`, color: on ? C.accentBright : C.textSecondary, background: on ? `${C.accent}22` : C.panel, fontSize: 19, fontWeight: 700 }}>{label}</div>
  );
  return (
    <SceneShell eyebrow="F11 · GEX by strike" title="Lire le graphique principal" durationInFrames={durationInFrames}>
      <Sfx file="whoosh.wav" at={tMain} volume={0.4} />
      <Sfx file="pop.wav" at={tRed} volume={0.35} />
      <Sfx file="pop.wav" at={tGreen} volume={0.35} />
      <Sfx file="tick.wav" at={tShort} volume={0.35} />
      <Sfx file="tick.wav" at={tLong} volume={0.35} />
      <Sfx file="bass.wav" at={t390} volume={0.45} />
      <Sfx file="click.wav" at={tBtn + 40} volume={0.5} />
      <S>
        <At x={0} y={0}>
          <div style={{ display: "flex", gap: 12, marginLeft: 70, marginBottom: 8, opacity: frame >= tBtn - 20 ? 1 : 0.35 }}>
            {btn("Auto-refresh", frame >= tOther + 60)}
            {btn("Net Only", netOnly)}
            {btn("Hide Labels", false)}
          </div>
          <GexChart from={tMain} width={1040} height={630} netOnly={netOnly} hi={hi} hiAt={hiAt} zoneHi={zone} priceAt={tAbove - 20} wallsAt={t390} />
        </At>
        {frame >= tIrreg && frame < tH + 60 && (
          <At x={0} y={60}>
            <div style={{ width: 70, height: 560, border: `3px solid ${C.amber}`, borderRadius: 10, opacity: 0.8 }} />
          </At>
        )}
        {frame >= tH && frame < tRow && (
          <At x={70} y={620}>
            <div style={{ width: 960, height: 36, border: `3px solid ${C.amber}`, borderRadius: 10, opacity: 0.8 }} />
          </At>
        )}
        <At x={1100} y={40} w={620}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {frame < tShape && (
              <>
                <Note at={tV}>axe vertical = prix d&apos;exercice (haut → bas)</Note>
                <Note at={tIrreg} color={C.amber}>échelle irrégulière : plus de place près du prix</Note>
                <Note at={tH}>axe horizontal = exposition gamma · zéro au centre</Note>
                <Note at={tRed} color={C.negative}>rouge ← options de vente</Note>
                <Note at={tGreen} color={C.positive}>vert → options d&apos;achat</Note>
                <Note at={tHow}>longueur = couverture à ajuster si le prix passe là</Note>
              </>
            )}
            {frame >= tShape && frame < tBtn && (
              <>
                <Note at={tAbove} color={C.positive}>au-dessus : surtout du vert · plus fort vers 400 et 403</Note>
                <Note at={tBigRed} color={C.negative}>quelques grosses barres rouges vers 400 et 411</Note>
                <Note at={tBelow} color={C.negative}>379 → 390 : un mur de rouge</Note>
                <Note at={tIns}>= des assurances</Note>
                <Note at={t390} color={C.accentBright}>390 : la plus grosse barre du graphique</Note>
              </>
            )}
            {frame >= tBtn && (
              <>
                <Note at={tBtn} color={C.accentBright}>Net Only : seulement la différence vert − rouge</Note>
                <Note at={tReadable}>plus lisible : quel camp domine à chaque niveau</Note>
                <Note at={tOther} color={C.textSecondary}>Hide Labels · Auto-refresh (pendant la séance)</Note>
              </>
            )}
          </div>
        </At>
        {frame >= tBtn && (
          <Cursor
            path={[
              { at: tBtn, x: 1300, y: 500 },
              { at: tBtn + 36, x: 330, y: 22, click: true },
              { at: tOther + 20, x: 450, y: 22 },
              { at: tOther + 50, x: 160, y: 22, click: true },
            ]}
          />
        )}
      </S>
    </SceneShell>
  );
};

// ---------------------------------------------------------------------------
export const GexLines: React.FC<SceneProps> = ({ words, durationInFrames }) => {
  const frame = useCurrentFrame();
  const cue = makeCue(words);
  const tSame = cue("sur ce meme graphique");
  const tYellow = cue("la courbe jaune");
  const tAdds = cue("le site additionne les barres");
  const tSlides = cue("elle glisse vers la gauche");
  const tDeep = cue("son creux le plus profond");
  const tViolet = cue("la courbe violette");
  const tSwell = cue("elle se gonfle");
  const tScale = cue("pour ces deux courbes");
  const tDashed = cue("maintenant les lignes pointillees");
  const tPrice = cue("la ligne du prix");
  const tWalls = cue("les lignes des murs");
  const tFlip = cue("et la ligne violette un peu plus haut");
  const tMost = cue("c est le niveau le plus important");
  const tBox = cue("en bas a droite un petit encadre");
  const tFirst = cue("tu peux le lire en premier");
  const tTip = cue("un conseil de lecture");
  const tThree = cue("cherche trois choses");
  const tRest = cue("tout le reste");
  return (
    <SceneShell eyebrow="F11 · GEX by strike" title="Les deux courbes et les lignes pointillées" durationInFrames={durationInFrames}>
      <Sfx file="whoosh.wav" at={tYellow} volume={0.4} />
      <Sfx file="whoosh.wav" at={tViolet} volume={0.4} />
      <Sfx file="tick.wav" at={tPrice} volume={0.35} />
      <Sfx file="tick.wav" at={tWalls} volume={0.35} />
      <Sfx file="chime.wav" at={tFlip} volume={0.45} />
      <Sfx file="pop.wav" at={tBox} volume={0.4} />
      <Beat from={tSame} to={tTip} style={{ left: 0, top: 0 }}>
        <S>
          <At x={0} y={0}>
            <GexChart from={tSame - 40} width={1040} height={680} cumAt={tYellow} aggAt={tViolet} priceAt={tPrice} wallsAt={tWalls} flipAt={tFlip} zoneHi={frame >= tDeep && frame < tViolet ? { from: 390, to: 400, color: C.amber, at: tDeep } : undefined} />
          </At>
          <At x={1100} y={20} w={620}>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {frame < tDashed && (
                <>
                  <Note at={tYellow} color={C.amber}>jaune = exposition nette cumulée</Note>
                  <Note at={tAdds}>les barres additionnées, dans l&apos;ordre des prix d&apos;exercice</Note>
                  <Note at={tSlides}>← quand les options de vente dominent · → quand les options d&apos;achat reprennent</Note>
                  <Note at={tDeep} color={C.amber}>creux le plus profond : 390 → 400</Note>
                  <Note at={tViolet} color={C.violet}>violet = exposition agrégée (profil global lissé)</Note>
                  <Note at={tScale} color={C.textSecondary}>échelle propre au site · regarde la FORME</Note>
                </>
              )}
              {frame >= tDashed && frame < tBox && (
                <>
                  <Note at={tPrice} color={C.flipBlue}>Price $389.51 = le prix actuel</Note>
                  <Note at={tWalls}>Put / Call $390.0 = les murs, presque sur le prix</Note>
                  <Note at={tFlip} color={C.violet}>Flip $394.84 = la bascule</Note>
                  <Note at={tMost} color={C.accentBright}>le niveau le plus important du graphique</Note>
                </>
              )}
              {frame >= tBox && (
                <Pop at={tBox}>
                  <RegimeBox width={360} />
                  {frame >= tFirst && <Label size={24} color={C.textPrimary}>à lire en premier · 3 secondes</Label>}
                </Pop>
              )}
            </div>
          </At>
        </S>
      </Beat>
      <Beat from={tTip} style={{ left: 0, top: 0 }}>
        <Center column gap={20}>
          <Big size={44}>ne mémorise pas chaque barre. Cherche :</Big>
          <CheckItem at={tThree + 10} n="1" text="le régime" sub="−γ ou +γ" color={C.negative} />
          <CheckItem at={tThree + 40} n="2" text="la bascule" sub="Flip $394.84" color={C.violet} />
          <CheckItem at={tThree + 70} n="3" text="les 2-3 plus longues barres" sub="au-dessus et en dessous du prix" color={C.accent} />
          {frame >= tRest && <Label size={28}>tout le reste = du détail</Label>}
        </Center>
      </Beat>
    </SceneShell>
  );
};

// ---------------------------------------------------------------------------
const TotalCurve: React.FC<{ from: number; scanAt: number; width?: number; height?: number }> = ({ from, scanAt, width = 1000, height = 420 }) => {
  const frame = useCurrentFrame();
  const lo = 375;
  const hi = 415;
  const X = (s: number) => ((s - lo) / (hi - lo)) * width;
  const f = (s: number) => Math.tanh((s - FLIP) / 6) * (s < FLIP ? 1 : 0.7);
  const Y = (v: number) => height / 2 - v * (height / 2 - 20);
  const scan = interpolate(frame, [scanAt, scanAt + 150], [lo, hi], clamp);
  const pts: string[] = [];
  for (let s = lo; s <= scan; s += 0.5) pts.push(`${pts.length ? "L" : "M"}${X(s).toFixed(1)},${Y(f(s)).toFixed(1)}`);
  const p = interpolate(frame, [from, from + 20], [0, 1], clamp);
  return (
    <svg width={width} height={height + 40} style={{ overflow: "visible", opacity: p }}>
      <rect x={0} y={0} width={X(FLIP)} height={height} fill={C.negative} opacity={0.07} />
      <rect x={X(FLIP)} y={0} width={width - X(FLIP)} height={height} fill={C.positive} opacity={0.07} />
      <line x1={0} x2={width} y1={Y(0)} y2={Y(0)} stroke={C.hairline} strokeWidth={2} />
      {[380, 385, 390, 395, 400, 405, 410].map((s) => (
        <text key={s} x={X(s)} y={height + 30} fill={C.textMuted} fontSize={20} textAnchor="middle" fontFamily={theme.mono}>
          {s}
        </text>
      ))}
      <path d={pts.join(" ")} stroke={C.violet} strokeWidth={5} fill="none" />
      {frame >= scanAt && frame < scanAt + 160 && <line x1={X(scan)} x2={X(scan)} y1={0} y2={height} stroke={C.accentBright} strokeWidth={2} />}
      {frame >= scanAt && frame < scanAt + 160 && (
        <text x={X(scan)} y={-10} fill={C.accentBright} fontSize={22} textAnchor="middle" fontFamily={theme.mono} fontWeight={800}>
          si GLD = {scan.toFixed(0)} ?
        </text>
      )}
      {scan >= FLIP && (
        <g>
          <circle cx={X(FLIP)} cy={Y(0)} r={12} fill={C.violet} />
          <text x={X(FLIP)} y={Y(0) - 22} fill={C.violet} fontSize={24} textAnchor="middle" fontFamily={theme.mono} fontWeight={900}>
            bascule 394,84
          </text>
        </g>
      )}
      <text x={10} y={30} fill={C.negative} fontSize={22} fontWeight={800}>total négatif</text>
      <text x={width - 10} y={30} fill={C.positive} fontSize={22} fontWeight={800} textAnchor="end">total positif</text>
    </svg>
  );
};

export const FlipRegime: React.FC<SceneProps> = ({ words, durationInFrames }) => {
  const frame = useCurrentFrame();
  const cue = makeCue(words);
  const tFlip = cue("la bascule du gamma");
  const tIdea = cue("voici l idee");
  const tAsks = cue("le site se demande");
  const tEach = cue("pour chaque prix imaginaire");
  const tCurve = cue("il obtient une courbe");
  const tSign = cue("le point ou il change de signe");
  const tWhy = cue("pourquoi le total change");
  const tDown = cue("quand le prix descend");
  const tUp = cue("quand il monte vers");
  const tSo = cue("donc avec ton tableau");
  const tSpot = cue("gld est a");
  const tNeg = cue("on est dans le regime negatif");
  const tUse = cue("comment t en servir");
  const tDry = cue("au dessus de l asphalte");
  const tIce = cue("en dessous de la glace");
  const tCross = cue("un franchissement de la bascule");
  const tNotDir = cue("pas forcement la direction");
  const tRem = cue("et souviens toi");
  const tZone = cue("lis la comme une zone");
  return (
    <SceneShell eyebrow="F11 · Gamma flip · 394,84 $" title="La bascule : la frontière entre deux régimes" durationInFrames={durationInFrames}>
      <Sfx file="pop.wav" at={tAsks} volume={0.35} />
      <Sfx file="whoosh.wav" at={tEach} volume={0.4} />
      <Sfx file="chime.wav" at={tSign} volume={0.45} />
      <Sfx file="pop.wav" at={tSo} volume={0.4} />
      <Sfx file="bass.wav" at={tNeg} volume={0.4} />
      <Sfx file="whoosh.wav" at={tUse} volume={0.4} />
      <Beat from={tFlip} to={tSo} style={{ left: 0, top: 0 }}>
        <S>
          <At x={40} y={60}>
            <TotalCurve from={tAsks} scanAt={tEach} />
          </At>
          <At x={1100} y={40} w={600}>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <Note at={tAsks}>« si GLD était à 380 ? à 385 ? à 400 ? »</Note>
              <Note at={tEach}>pour chaque prix imaginaire : recalcule le gamma de toutes les options, puis le total</Note>
              <Note at={tSign} color={C.violet}>là où le total change de signe = la bascule</Note>
              <Note at={tDown} color={C.negative}>prix dans la zone des options de vente → elles dominent → total −</Note>
              <Note at={tUp} color={C.positive}>prix vers la zone des options d&apos;achat → total +</Note>
            </div>
          </At>
          {frame >= tWhy && frame < tDown && (
            <At x={300} y={560}>
              <Pop at={tWhy}>
                <Pill text="le gamma d'une option est max près de SON prix d'exercice" size={28} />
              </Pop>
            </At>
          )}
        </S>
      </Beat>
      <Beat from={tSo} to={tUse} style={{ left: 0, top: 0 }}>
        <S>
          <At x={60} y={10}>
            <Ladder
              lo={382}
              hi={402}
              height={640}
              width={1000}
              zones={[
                { from: FLIP, to: 402, color: C.positive, at: tSo + 20, label: "au-dessus : +γ · amortisseur" },
                { from: 382, to: FLIP, color: C.negative, at: tSo + 50, label: "en dessous : −γ · accélérateur" },
              ]}
              levels={[
                { v: 394.84, t: "bascule", color: C.violet, at: tSo, right: false },
                { v: 389.51, t: "GLD", color: C.accentBright, at: tSpot, dash: false },
              ]}
            />
          </At>
          {frame >= tSpot && (
            <At x={1150} y={120} w={560}>
              <Pop at={tSpot}>
                <Panel glow>
                  <CalcLine at={tSpot + 20} left="394,84 − 389,51 =" right="5,33 $" size={36} />
                  <CalcLine at={tSpot + 60} left="≈" right="1,4 % sous la bascule" size={32} />
                </Panel>
              </Pop>
            </At>
          )}
          {frame >= tNeg && (
            <At x={1150} y={380}>
              <Pop at={tNeg}>
                <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                  <Big size={90} color={C.negative}>-γ</Big>
                  <Label size={26} color={C.textPrimary}>ce qu&apos;affiche la carte « Gamma »</Label>
                </div>
              </Pop>
            </At>
          )}
        </S>
      </Beat>
      <Beat from={tUse} to={tRem} style={{ left: 0, top: 0 }}>
        <S>
          <At x={40} y={0}>
            <div style={{ height: 190, transform: "scale(0.62)", transformOrigin: "top left" }}>
              <Road kind="dry" from={tDry} width={800} />
            </div>
            <Label size={24} color={C.positive}>au-dessus : asphalte sec · retour vers le centre</Label>
          </At>
          <At x={40} y={320}>
            <div style={{ height: 190, transform: "scale(0.62)", transformOrigin: "top left" }}>
              <Road kind="ice" from={tIce} width={800} />
            </div>
            <Label size={24} color={C.negative}>en dessous : glace · ça glisse plus loin</Label>
          </At>
          {frame >= tCross && (
            <At x={700} y={80} w={1000}>
              <Pop at={tCross}>
                <Panel glow style={{ textAlign: "center" }}>
                  <Big size={40}>franchir la bascule (surtout en clôture)</Big>
                  <Big size={40} color={C.accentBright}>= le COMPORTEMENT peut changer</Big>
                  {frame >= tNotDir && <Label size={28} color={C.textPrimary}>pas forcément la direction</Label>}
                </Panel>
              </Pop>
            </At>
          )}
        </S>
      </Beat>
      <Beat from={tRem} style={{ left: 0, top: 0 }}>
        <Center column gap={26}>
          <div style={{ display: "flex", gap: 20 }}>
            <Pill text="intérêt ouvert de la veille" size={28} />
            <Pill text="convention sur les teneurs de marché" size={28} color={C.violet} />
          </div>
          <Label size={30} color={C.textPrimary}>pas un prix magique au centime près</Label>
          {frame >= tZone && (
            <Pop at={tZone}>
              <div style={{ width: 900, height: 110, borderRadius: 16, background: `${C.violet}33`, border: `3px dashed ${C.violet}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Big size={46} color={C.violet}>zone ≈ 395</Big>
              </div>
            </Pop>
          )}
        </Center>
      </Beat>
    </SceneShell>
  );
};

// ---------------------------------------------------------------------------
export const Walls: React.FC<SceneProps> = ({ words, durationInFrames }) => {
  const frame = useCurrentFrame();
  const cue = makeCue(words);
  const tWalls = cue("les murs maintenant");
  const tCallW = cue("le mur des options d achat est le prix");
  const tConv = cue("selon la convention les teneurs");
  const tApproach = cue("quand le prix s en approche par le bas");
  const tCeil = cue("d ou l idee d un plafond");
  const tPutW = cue("le mur des options de vente est le prix");
  const tAbove = cue("tant que le prix reste au dessus");
  const tPlunge = cue("mais si le prix plonge");
  const tFloor = cue("c est pour ca qu un mur");
  const tBreaks = cue("et quand il cede");
  const tMagnet = cue("autre effet important");
  const tRound = cue("c est souvent le cas des chiffres ronds");
  const tBoard = cue("sur ton tableau les deux murs");
  const tExpect = cue("on peut donc s attendre");
  const tList = cue("mais regarde la liste des echeances");
  const tPart = cue("une grosse partie de ce mur");
  const tAfter = cue("apres demain");
  const tRule = cue("regle pratique");
  const tBlind = cue("tu ne places pas un ordre aveugle");
  const tNews = cue("et un mur n arrete jamais");
  const magnetOsc = 390 + Math.sin((frame - tMagnet) / 8) * 1.4 * Math.exp(-Math.max(0, frame - tMagnet) / 200);
  return (
    <SceneShell eyebrow="F11 · Call wall · Put wall" title="Les murs : plafond, plancher… et aimant" durationInFrames={durationInFrames}>
      <Sfx file="pop.wav" at={tCallW} volume={0.35} />
      <Sfx file="tick.wav" at={tCeil} volume={0.35} />
      <Sfx file="pop.wav" at={tPutW} volume={0.35} />
      <Sfx file="bass.wav" at={tBreaks} volume={0.45} />
      <Sfx file="chime.wav" at={tMagnet} volume={0.4} />
      <Sfx file="whoosh.wav" at={tList} volume={0.4} />
      <Sfx file="bass.wav" at={tNews} volume={0.45} />
      <Beat from={tWalls} to={tMagnet} style={{ left: 0, top: 0 }}>
        <S>
          <At x={40} y={0}>
            <Label size={22} color={C.textMuted}>exemple générique (pas le tableau du jour)</Label>
            <Ladder
              lo={374}
              hi={406}
              height={600}
              width={1040}
              levels={[
                { v: 400, t: "mur des options d'achat (plafond ?)", color: C.positive, at: tCallW },
                { v: 380, t: "mur des options de vente (plancher ?)", color: C.negative, at: tPutW },
              ]}
              price={{
                path: [
                  [tApproach, 390],
                  [tApproach + 50, 398.5],
                  [tApproach + 90, 395],
                  [tApproach + 120, 399],
                  [tCeil + 40, 393],
                  [tAbove, 386],
                  [tPlunge, 381.5],
                  [tFloor, 383],
                  [tBreaks, 380],
                  [tBreaks + 50, 375],
                ],
              }}
            />
          </At>
          <At x={1130} y={20} w={580}>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <Note at={tCallW} color={C.positive}>mur d&apos;achat = plus forte exposition positive</Note>
              <Note at={tConv}>convention : teneurs de marché acheteurs de gamma</Note>
              <Note at={tApproach}>le prix s&apos;approche → ils vendent dans la hausse → freine</Note>
              <Note at={tPutW} color={C.negative}>mur de vente = plus forte exposition négative</Note>
              <Note at={tPlunge}>si le prix plonge dedans → les couvertures poussent à vendre</Note>
              <Note at={tFloor} color={C.amber}>un plancher qui tient… jusqu&apos;à ce qu&apos;il cède</Note>
            </div>
          </At>
          {frame >= tBreaks && (
            <At x={400} y={560}>
              <Stamp at={tBreaks} text="−γ : LA CHUTE PEUT ACCÉLÉRER" color={C.negative} size={34} />
            </At>
          )}
        </S>
      </Beat>
      <Beat from={tMagnet} to={tRule} style={{ left: 0, top: 0 }}>
        <S>
          <At x={60} y={20} w={760}>
            <Panel glow style={{ textAlign: "center" }}>
              <Label size={26}>jour d&apos;échéance d&apos;un gros prix d&apos;exercice</Label>
              <svg width={300} height={160} viewBox="0 0 300 160">
                <path d="M60 20 L60 100 A90 90 0 0 0 240 100 L240 20 L190 20 L190 100 A40 40 0 0 1 110 100 L110 20 Z" fill={C.negative} />
                <rect x={60} y={20} width={50} height={26} fill={C.textPrimary} />
                <rect x={190} y={20} width={50} height={26} fill={C.textPrimary} />
              </svg>
              <Big size={60}>GLD {magnetOsc.toFixed(2).replace(".", ",")}</Big>
              {frame >= tRound && <Label size={26} color={C.textPrimary}>le prix colle au niveau · souvent les chiffres ronds</Label>}
            </Panel>
          </At>
          {frame >= tBoard && (
            <At x={900} y={20} w={800}>
              <Pop at={tBoard}>
                <Panel style={{ borderColor: C.amber }}>
                  <Label size={28} color={C.textPrimary}>ton tableau : murs à 390 · GLD 389,51 · 24 sept. = échéance</Label>
                  {frame >= tExpect && <Label size={26} color={C.amber}>390 peut attirer le prix pendant la séance · sans garantie</Label>}
                </Panel>
              </Pop>
            </At>
          )}
          {frame >= tList && (
            <At x={900} y={260} w={800}>
              <Pop at={tList}>
                <div style={{ display: "flex", gap: 20, position: "relative" }}>
                  <CalendarPage top="SEPT" big="24" size={150} />
                  <CalendarPage top="SEPT" big="25" size={150} />
                  <CalendarPage top="OCT" big="16" size={150} />
                  {frame >= tAfter && (
                    <div style={{ position: "absolute", left: 30, top: -10 }}>
                      <CrossDraw at={tAfter} size={250} />
                    </div>
                  )}
                </div>
                {frame >= tPart && <Label size={26} color={C.textPrimary}>une grosse partie du mur vient d&apos;aujourd&apos;hui et demain</Label>}
                {frame >= tAfter && <Label size={26} color={C.negative}>après-demain : le mur peut avoir fondu</Label>}
              </Pop>
            </At>
          )}
        </S>
      </Beat>
      <Beat from={tRule} style={{ left: 0, top: 0 }}>
        <Center column gap={26}>
          <Big size={48}>un mur = une zone de réaction possible</Big>
          <Pill text="attends de voir comment le prix se comporte en arrivant dessus" size={28} />
          {frame >= tBlind && (
            <Pop at={tBlind}>
              <Pill text="pas d'ordre aveugle au centime près" size={30} color={C.negative} />
            </Pop>
          )}
          {frame >= tNews && (
            <Pop at={tNews}>
              <div style={{ display: "flex", alignItems: "center", gap: 30 }}>
                <CalendarPage top="INFLATION" big="!" size={170} />
                <Big size={40} color={C.negative}>traverse un mur comme du papier</Big>
              </div>
            </Pop>
          )}
        </Center>
      </Beat>
    </SceneShell>
  );
};

// ---------------------------------------------------------------------------
const StatBlock: React.FC<{ rows: Array<{ k: string; v: string; fr: string; col: string; at: number }> }> = ({ rows }) => {
  const frame = useCurrentFrame();
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {rows.map((r) =>
        frame >= r.at ? (
          <Pop key={r.k} at={r.at}>
            <div style={{ padding: "10px 16px", borderRadius: 12, background: C.panel, border: `1.5px solid ${r.col}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <span style={{ color: C.textSecondary, fontSize: 20 }}>{r.k}</span>
                <strong style={{ color: r.col, fontFamily: theme.mono, fontSize: 30 }}>{r.v}</strong>
              </div>
              <div style={{ color: C.textPrimary, fontSize: 21, marginTop: 2 }}>{r.fr}</div>
            </div>
          </Pop>
        ) : null,
      )}
    </div>
  );
};

export const VannaPanel: React.FC<SceneProps> = ({ words, durationInFrames }) => {
  const frame = useCurrentFrame();
  const cue = makeCue(words);
  const tRow = cue("deuxieme ligne du tableau");
  const tRecall = cue("rappel la vanna");
  const tAdds = cue("ici le site additionne");
  const tNeg = cue("la courbe est negative a gauche");
  const tPos = cue("et elle est positive a droite");
  const tLine = cue("la ligne pointillee violette");
  const tWarn = cue("attention elle ne tombe pas");
  const tOther = cue("le site la calcule autrement");
  const tUnder = cue("sous le graphique le site traduit");
  const tBull = cue("l objectif de derive haussiere");
  const tBear = cue("le danger baissier maximal");
  const tText = cue("le texte du site parle");
  const tDecel = cue("la deceleration baissiere");
  const tRatio = cue("et le rapport entre haussier");
  const tHow = cue("comment le comprendre");
  const tVolDown = cue("si la volatilite baisse");
  const tSupport = cue("ca soutient le prix");
  const tVolUp = cue("si la volatilite monte c est l inverse");
  const tPract = cue("donc en pratique");
  const tCalm = cue("et un retour au calme");
  const cross = frame >= tWarn ? [{ x: 390.5, label: "croise 0 ≈ 390", color: C.amber, at: tWarn, up: true }] : [];
  return (
    <SceneShell eyebrow="F11 · Vanna · NOW (0-45 DTE)" title="Le panneau vanna : la volatilité qui déplace les couvertures" durationInFrames={durationInFrames}>
      <Sfx file="whoosh.wav" at={tRow} volume={0.4} />
      <Sfx file="pop.wav" at={tLine} volume={0.35} />
      <Sfx file="bass.wav" at={tWarn} volume={0.45} />
      <Sfx file="pop.wav" at={tBull} volume={0.35} />
      <Sfx file="pop.wav" at={tBear} volume={0.35} />
      <Sfx file="pop.wav" at={tDecel} volume={0.35} />
      <Sfx file="pop.wav" at={tRatio} volume={0.35} />
      <Sfx file="chime.wav" at={tHow} volume={0.45} />
      <Beat from={tRow} to={tHow} style={{ left: 0, top: 0 }}>
        <S>
          <At x={0} y={20}>
            <ProfileChart
              pts={VANNA_PTS}
              yMin={-90}
              yMax={60}
              yTicks={[[56.9, "56.9K"], [20.3, "20.3K"], [-16.4, "-16.4K"], [-53.1, "-53.1K"], [-89.8, "-89.8K"]]}
              color={C.violet}
              from={tAdds}
              width={1000}
              height={560}
              flip={{ x: 375.1, label: "V-Flip $375.1", at: tLine }}
              marks={[
                ...cross,
                ...(frame >= tBull ? [{ x: 405, label: "405", color: C.positive, at: tBull, up: true }] : []),
                ...(frame >= tBear ? [{ x: 385, label: "385", color: C.negative, at: tBear }] : []),
              ]}
            />
          </At>
          {frame < tUnder && (
            <At x={1060} y={20} w={640}>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <Note at={tRecall} color={C.violet}>vanna = le delta qui bouge quand la volatilité bouge</Note>
                <Note at={tAdds}>additionnée sur toutes les options · même convention</Note>
                <Note at={tNeg} color={C.negative}>négative à gauche · creux 375 → 385</Note>
                <Note at={tPos} color={C.positive}>positive à droite · bosse 390 → 420</Note>
                <Note at={tLine} color={C.violet}>V-Flip $375.1 = « bascule de la vanna » selon le site</Note>
                <Note at={tWarn} color={C.amber}>mais la courbe croise le zéro vers 390, pas à 375</Note>
                <Note at={tOther}>calculée autrement (simulation du prix probablement) · ne confonds pas</Note>
              </div>
            </At>
          )}
          {frame >= tUnder && (
            <At x={1060} y={10} w={640}>
              <StatBlock
                rows={[
                  { k: "Bull Drift Target", v: "$405.0", fr: "objectif de dérive haussière · une montée s'essoufflerait ici", col: C.positive, at: tBull },
                  { k: "Bear Max Danger", v: "$385.0", fr: "creux de la vanna (−61K selon le texte) · ventes de couverture max si la volatilité monte", col: C.negative, at: tBear },
                  { k: "Bear Deceleration", v: "$355.0", fr: "décélération · vendeurs d'options de vente prêts à acheter plus bas", col: C.textPrimary, at: tDecel },
                  { k: "Bull/Bear Ratio", v: "0.86", fr: "« plus de carburant de vanna en dessous »", col: C.amber, at: tRatio },
                ]}
              />
            </At>
          )}
        </S>
      </Beat>
      <Beat from={tHow} style={{ left: 0, top: 0 }}>
        <S>
          <At x={60} y={20} w={1600}>
            <Pill text="mécanisme classique · convention : teneurs de marché vendeurs d'options de vente" size={26} color={C.violet} />
          </At>
          <At x={60} y={110} w={780}>
            {frame >= tVolDown && (
              <Pop at={tVolDown}>
                <Panel style={{ borderColor: C.positive }}>
                  <Label size={28} color={C.textPrimary}>volatilité ↓ → delta des options de vente fond</Label>
                  <div style={{ margin: "16px 0" }}>
                    <Flow at={tVolDown + 60} buy text="rachètent des parts" size={0.8} />
                  </div>
                  {frame >= tSupport && <Pill text="soutient le prix" color={C.positive} size={28} filled />}
                </Panel>
              </Pop>
            )}
          </At>
          <At x={900} y={110} w={780}>
            {frame >= tVolUp && (
              <Pop at={tVolUp}>
                <Panel style={{ borderColor: C.negative }}>
                  <Label size={28} color={C.textPrimary}>volatilité ↑ → delta des options de vente grossit</Label>
                  <div style={{ margin: "16px 0" }}>
                    <Flow at={tVolUp + 40} buy={false} text="vendent davantage" size={0.8} />
                  </div>
                  <Pill text="pousse le prix vers le bas" color={C.negative} size={28} filled />
                </Panel>
              </Pop>
            )}
          </At>
          {frame >= tPract && (
            <At x={60} y={500} w={1640}>
              <Pop at={tPract}>
                <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
                  <Pill text="panique + volatilité ↑ sous 390 → chute alimentée vers 385" size={26} color={C.negative} />
                  {frame >= tCalm && <Pill text="retour au calme → coup de pouce possible" size={26} color={C.positive} />}
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
export const CharmPanel: React.FC<SceneProps> = ({ words, durationInFrames }) => {
  const frame = useCurrentFrame();
  const cue = makeCue(words);
  const tSecond = cue("le deuxieme petit graphique");
  const tRecall = cue("rappel le charme");
  const tFlat = cue("la courbe est plate presque partout");
  const tDive = cue("elle plonge fortement");
  const tBack = cue("puis elle remonte brutalement");
  const tWhy = cue("pourquoi cette forme");
  const tToday = cue("les options du jour et du lendemain");
  const tText = cue("le texte du site cite");
  const tConc = cue("concretement qu est ce que ca veut dire");
  const tStill = cue("meme si gld ne bouge pas");
  const tMust = cue("les teneurs de marche doivent acheter ou vendre");
  const tFlows = cue("ces flux sont souvent");
  const tKey = cue("un point essentiel");
  const tSame = cue("un meme chiffre negatif");
  const tClaims = cue("le site affirme ici");
  const tInterp = cue("c est son interpretation");
  const tSolid = cue("ce que tu peux retenir");
  const tVanish = cue("puis ils disparaitront");
  const tAgain = cue("pense a le reconsulter");
  const flipSide = Math.floor((frame - tSame) / 30) % 2 === 0;
  return (
    <SceneShell eyebrow="F11 · Charm · NOW (0-45 DTE)" title="Le panneau charme : le temps qui déplace les couvertures" durationInFrames={durationInFrames}>
      <Sfx file="whoosh.wav" at={tSecond} volume={0.4} />
      <Sfx file="bass.wav" at={tDive} volume={0.4} />
      <Sfx file="pop.wav" at={tText} volume={0.35} />
      <Sfx file="tick.wav" at={tStill} volume={0.35} />
      <Sfx file="bass.wav" at={tKey} volume={0.45} />
      <Sfx file="chime.wav" at={tSolid} volume={0.45} />
      <Beat from={tSecond} to={tConc} style={{ left: 0, top: 0 }}>
        <S>
          <At x={0} y={20}>
            <ProfileChart
              pts={CHARM_PTS}
              yMin={-7.6}
              yMax={1.9}
              yTicks={[[1.9, "1.9M"], [-0.487, "-487.1K"], [-2.9, "-2.9M"], [-5.2, "-5.2M"], [-7.6, "-7.6M"]]}
              color={C.positive}
              from={tFlat - 20}
              width={1000}
              height={560}
              fillArea
              marks={[
                ...(frame >= tDive ? [{ x: 385, label: "≈ −5M", color: C.negative, at: tDive }] : []),
                ...(frame >= tBack ? [{ x: 393, label: "léger +", color: C.positive, at: tBack, up: true }] : []),
              ]}
            />
          </At>
          <At x={1060} y={20} w={640}>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <Note at={tRecall} color={C.positive}>charme = le delta qui bouge quand le temps passe</Note>
              <Note at={tFlat}>plate partout… sauf autour du prix</Note>
              <Note at={tDive} color={C.negative}>plonge ≈ −5M vers 385 (+ un point isolé plus bas)</Note>
              <Note at={tBack} color={C.positive}>remonte brutalement · léger positif au-dessus de 390</Note>
              <Note at={tWhy}>énorme près du prix ET près de l&apos;échéance</Note>
              <Note at={tToday} color={C.amber}>options du jour et du lendemain autour de 390</Note>
              <Note at={tText}>texte du site : charme total −10,7M, « extrême »</Note>
            </div>
          </At>
        </S>
      </Beat>
      <Beat from={tConc} to={tKey} style={{ left: 0, top: 0 }}>
        <S>
          <At x={100} y={60}>
            <div style={{ transform: `rotate(${(frame - tConc) * 2}deg)` }}>
              <ClockIcon size={220} />
            </div>
          </At>
          <At x={40} y={330} w={420}>
            <Label size={28} color={C.textPrimary}>GLD immobile… l&apos;horloge avance</Label>
          </At>
          {frame >= tStill && (
            <At x={520} y={60}>
              <Pop at={tStill}>
                <DealerDesk size={1.1} screen="Δ dérive" screenColor={C.positive} />
              </Pop>
            </At>
          )}
          {frame >= tMust && (
            <At x={1000} y={80}>
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                <Flow at={tMust} buy text="achats…" size={0.8} />
                <Flow at={tMust + 30} buy={false} text="…ou ventes" size={0.8} />
              </div>
            </At>
          )}
          {frame >= tFlows && (
            <At x={100} y={470} w={1500}>
              <Pop at={tFlows}>
                <div style={{ display: "flex", gap: 20 }}>
                  <Pill text="fin de séance" size={30} />
                  <Pill text="jours avant une grosse échéance mensuelle" size={30} />
                </div>
              </Pop>
            </At>
          )}
        </S>
      </Beat>
      <Beat from={tKey} to={tSolid} style={{ left: 0, top: 0 }}>
        <Center column gap={30}>
          <Big size={46}>le signe du flux dépend de la convention du site</Big>
          {frame >= tSame && (
            <Pop at={tSame}>
              <div style={{ display: "flex", alignItems: "center", gap: 40 }}>
                <Big size={60} color={C.negative}>−10,7M</Big>
                <Big size={50}>=</Big>
                <Pill text={flipSide ? "des ventes (site A)" : "des achats (site B)"} size={34} color={flipSide ? C.negative : C.positive} filled />
              </div>
            </Pop>
          )}
          {frame >= tClaims && (
            <Pop at={tClaims}>
              <Pill text="« favorise la baisse » = SON interprétation" size={32} color={C.amber} />
            </Pop>
          )}
          {frame >= tInterp && <Verdict at={tInterp} kind="doubt" text="interprétation, pas un fait" />}
        </Center>
      </Beat>
      <Beat from={tSolid} style={{ left: 0, top: 0 }}>
        <Center column gap={30}>
          <Big size={44}>ce qui est solide :</Big>
          <Pill text="flux mécaniques forts autour de 390 jusqu'à l'échéance" size={32} filled />
          {frame >= tVanish && (
            <Pop at={tVanish}>
              <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
                <CalendarPage top="SEPT" big="25" size={150} />
                <Big size={40} color={C.negative}>puis ils disparaissent avec elle</Big>
              </div>
            </Pop>
          )}
          {frame >= tAgain && <Label size={28} color={C.textPrimary}>après le 25 septembre : reconsulte le panneau</Label>}
        </Center>
      </Beat>
    </SceneShell>
  );
};

// ---------------------------------------------------------------------------
export const DexPanel: React.FC<SceneProps> = ({ words, durationInFrames }) => {
  const frame = useCurrentFrame();
  const cue = makeCue(words);
  const tThird = cue("troisieme petit graphique");
  const tNot = cue("cette fois on ne regarde plus");
  const tAdds = cue("le site additionne le delta");
  const tResult = cue("le resultat");
  const tCalls = cue("le site l appelle");
  const tOther = cue("autrement dit");
  const tNeutral = cue("pour etre neutres");
  const tBars = cue("sur le graphique les barres");
  const tFlip = cue("et il y a une bascule la aussi");
  const tLook = cue("regarde bien ce chiffre");
  const tTwo = cue("deux calculs differents");
  const tConv = cue("quand plusieurs mesures convergent");
  const tBand = cue("ici la bande");
  const tHonest = cue("une precision pour etre honnete");
  const tWrong = cue("si la convention est fausse");
  return (
    <SceneShell eyebrow="F11 · DEX · NOW (0-45 DTE)" title="L'exposition delta : la position du carnet, en dollars" durationInFrames={durationInFrames}>
      <Sfx file="whoosh.wav" at={tThird} volume={0.4} />
      <Sfx file="bass.wav" at={tResult} volume={0.4} />
      <Sfx file="pop.wav" at={tFlip} volume={0.35} />
      <Sfx file="chime.wav" at={tConv} volume={0.45} />
      <Sfx file="bass.wav" at={tHonest} volume={0.4} />
      <Beat from={tThird} to={tLook} style={{ left: 0, top: 0 }}>
        <S>
          <At x={20} y={20}>
            <DexChart from={tBars - 60} width={760} height={560} flipAt={tFlip} />
          </At>
          <At x={860} y={10} w={840}>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <Note at={tNot}>pas comment le delta va changer : le delta lui-même, aujourd&apos;hui</Note>
              <Note at={tAdds}>Σ delta × intérêt ouvert × 100 × prix · même convention</Note>
              {frame >= tResult && (
                <Pop at={tResult}>
                  <div style={{ display: "flex", gap: 16 }}>
                    <Panel style={{ padding: "12px 18px", flex: 1 }}>
                      <Label size={20}>Total DEX</Label>
                      <Big size={44} color={C.negative}>-$1.88B</Big>
                    </Panel>
                    {frame >= tCalls && (
                      <Panel style={{ padding: "12px 18px", flex: 1 }}>
                        <Label size={20}>Regime</Label>
                        <Big size={40} color={C.negative}>Negative</Big>
                        <Label size={18}>« book net short underlying »</Label>
                      </Panel>
                    )}
                  </div>
                </Pop>
              )}
              <Note at={tOther} color={C.negative}>≈ une vente de 1,9 milliard $ de GLD, avant couverture (selon le modèle)</Note>
              <Note at={tNeutral}>pour être neutres : l&apos;équivalent inverse en parts</Note>
              <Note at={tFlip} color={C.flipBlue}>D-Flip $394.4 : le delta net passerait de − à +</Note>
            </div>
          </At>
        </S>
      </Beat>
      <Beat from={tLook} to={tHonest} style={{ left: 0, top: 0 }}>
        <S>
          <At x={60} y={20}>
            <Ladder
              lo={388}
              hi={397}
              height={620}
              width={1000}
              zones={frame >= tBand ? [{ from: 394, to: 395, color: C.violet, at: tBand, label: "le pivot du tableau" }] : []}
              levels={[
                { v: 394.4, t: "bascule du delta 394,40", color: C.flipBlue, at: tLook, right: true },
                { v: 394.84, t: "bascule du gamma 394,84", color: C.violet, at: tLook + 40 },
                { v: 389.51, t: "GLD", color: C.accentBright, at: tLook, dash: false },
              ]}
            />
          </At>
          <At x={1140} y={60} w={560}>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <Note at={tTwo}>deux calculs différents · presque au même endroit</Note>
              <Note at={tConv} color={C.accentBright}>des mesures qui convergent = une zone qui mérite ton attention</Note>
              <Note at={tBand} color={C.violet}>394 → 395 : au-dessus le paysage change</Note>
            </div>
          </At>
        </S>
      </Beat>
      <Beat from={tHonest} style={{ left: 0, top: 0 }}>
        <Center column gap={30}>
          <Big size={50}>−1,88 milliard = un ordre de grandeur</Big>
          <Label size={30}>pas un compte bancaire</Label>
          {frame >= tWrong && (
            <Pop at={tWrong}>
              <Pill text="convention fausse sur les gros prix d'exercice → le signe peut changer" size={30} color={C.negative} />
            </Pop>
          )}
        </Center>
      </Beat>
    </SceneShell>
  );
};

// ---------------------------------------------------------------------------
export const PriceChartScene: React.FC<SceneProps> = ({ words, durationInFrames }) => {
  const frame = useCurrentFrame();
  const cue = makeCue(words);
  const tLast = cue("dernier graphique du tableau");
  const tCandle = cue("chaque bougie resume");
  const tGreen = cue("verte si la cloture");
  const tStory = cue("lis l histoire");
  const tTwo = cue("deux lignes horizontales");
  const tRight = cue("et a droite la meme carte");
  const tLatest = cue("qu est ce qu on voit sur les dernieres bougies");
  const tKey = cue("le prix est donc a un endroit cle");
  const tHolds = cue("s il tient");
  const tBreaks = cue("s il cede");
  const tAlso = cue("remarque aussi");
  const tCross = cue("un bon trader croise les deux");
  const tCam = cue("et le petit bouton appareil photo");
  const inAnatomy = frame < tStory;
  return (
    <SceneShell eyebrow="F11 · GLD Price · GEX overlay" title="Le prix, les niveaux et la carte, ensemble" durationInFrames={durationInFrames}>
      <Sfx file="whoosh.wav" at={tLast} volume={0.4} />
      <Sfx file="whoosh.wav" at={tStory} volume={0.4} />
      <Sfx file="pop.wav" at={tTwo} volume={0.35} />
      <Sfx file="pop.wav" at={tRight} volume={0.35} />
      <Sfx file="bass.wav" at={tKey} volume={0.4} />
      <Sfx file="click.wav" at={tCam + 30} volume={0.5} />
      {inAnatomy && (
        <Beat from={tLast} to={tStory} style={{ left: 0, top: 0 }}>
          <Center gap={120}>
            <svg width={400} height={420} viewBox="0 0 400 420">
              <line x1={130} x2={130} y1={20} y2={400} stroke={C.positive} strokeWidth={6} />
              <rect x={70} y={110} width={120} height={200} rx={8} fill={C.positive} />
              <text x={200} y={30} fill={C.textPrimary} fontSize={22}>plus haut</text>
              <text x={200} y={118} fill={C.textPrimary} fontSize={22}>clôture</text>
              <text x={200} y={310} fill={C.textPrimary} fontSize={22}>ouverture</text>
              <text x={200} y={400} fill={C.textPrimary} fontSize={22}>plus bas</text>
            </svg>
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <Pop at={tCandle}>
                <Pill text="1 bougie = ouverture · plus haut · plus bas · clôture" size={28} />
              </Pop>
              {frame >= tGreen && (
                <Pop at={tGreen}>
                  <div style={{ display: "flex", gap: 16 }}>
                    <Pill text="verte : clôture > ouverture" color={C.positive} size={28} />
                    <Pill text="rouge : sinon" color={C.negative} size={28} />
                  </div>
                </Pop>
              )}
            </div>
          </Center>
        </Beat>
      )}
      <Beat from={tStory} style={{ left: 0, top: 0 }}>
        <S>
          <At x={0} y={0}>
            <CandleChart from={tStory} width={1720} height={520} levelsAt={tTwo} overlayAt={tRight} focusAt={tLatest} />
          </At>
          <At x={60} y={580} w={1600}>
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
              {frame >= tStory && frame < tTwo && <Pill text="≈ 370 (31 déc.) → sommet ≈ 428 → retour vers 390" size={26} />}
              {frame >= tTwo && frame < tLatest && <Pill text="violet : bascule ≈ 395 · rouge : mur des options de vente 390" size={26} />}
              {frame >= tLatest && frame < tKey && <Pill text="glissé sous 395 · posé sur 390 · bougies rouges" size={26} color={C.negative} />}
              {frame >= tKey && frame < tAlso && (
                <>
                  <Pill text="collé au plus gros nœud · régime accélérateur" size={24} color={C.amber} />
                  {frame >= tHolds && <Pill text="tient → aimant jusqu'à l'échéance" size={24} color={C.positive} />}
                  {frame >= tBreaks && <Pill text="cède → 385 puis 380" size={24} color={C.negative} />}
                </>
              )}
              {frame >= tAlso && frame < tCam && (
                <>
                  <Pill text="395 → 405 : longue hésitation passée (congestion)" size={26} />
                  {frame >= tCross && <Pill text="croise les niveaux d'options ET les zones du prix" size={26} filled />}
                </>
              )}
              {frame >= tCam && <Pill text="bouton appareil photo → capture pour ton journal" size={26} filled color={C.context} />}
            </div>
          </At>
          {frame >= tAlso && frame < tCam && (
            <At x={850} y={Math.round(((442 - 405) / 84) * 520)}>
              <div style={{ width: 420, height: Math.round((10 / 84) * 520), border: `3px dashed ${C.amber}`, borderRadius: 10 }} />
            </At>
          )}
          {frame >= tCam && (
            <Cursor
              path={[
                { at: tCam, x: 1200, y: 400 },
                { at: tCam + 30, x: 1690, y: -40, click: true },
              ]}
            />
          )}
        </S>
      </Beat>
    </SceneShell>
  );
};

// ---------------------------------------------------------------------------
const INSIGHT = [
  "GLD is in a negative gamma regime with a massive put wall at 390 that dealers will amplify into, creating downside momentum if support breaks.",
  "The 390 strike dominates positioning with -171k net gamma, while negative vanna (-35k total) and extreme negative charm (-10.7M) signal accelerating decay favoring lower prices as volatility declines.",
  "Watch for a breakdown below 390; if it fails, dealers buying into the dip could spark a sharp reversal,",
  "but the structural bias is toward testing the bear max danger zone near 385 where vanna reaches -61k.",
];

export const AiText: React.FC<SceneProps> = ({ words, durationInFrames }) => {
  const frame = useCurrentFrame();
  const cue = makeCue(words);
  const tTop = cue("tout en haut du tableau");
  const tTempt = cue("c est tentant");
  const tProof = cue("on va plutot le lire comme un correcteur");
  const t1 = cue("premiere phrase traduite");
  const t1ok = cue("le regime negatif verifie");
  const t1cond = cue("mais c est conditionnel");
  const t2 = cue("deuxieme phrase");
  const t2nums = cue("les chiffres on peut les verifier");
  const t2interp = cue("l interpretation en revanche");
  const t2q = cue("point d interrogation");
  const t3 = cue("troisieme phrase");
  const t3x = cue("la il y a une contradiction");
  const t3mix = cue("la phrase melange deux regimes");
  const t4 = cue("derniere phrase");
  const t4ok = cue("chiffre verifiable");
  const t4b = cue("mais un biais structurel");
  const tLesson = cue("la lecon");
  const tKeep = cue("garde les chiffres");
  const cur = frame >= t4 ? 3 : frame >= t3 ? 2 : frame >= t2 ? 1 : frame >= t1 ? 0 : -1;
  const FR = [
    "régime de gamma négatif · énorme mur d'options de vente à 390 · élan baissier si le support casse",
    "390 domine (−171K net) · vanna −35K, charme −10,7M → « favorable à la baisse quand la volatilité baisse »",
    "surveille une cassure sous 390 · si elle échoue, des teneurs de marché qui ACHÈTENT la baisse → retournement",
    "biais structurel : test de la zone de danger baissier ≈ 385, vanna −61K",
  ];
  return (
    <SceneShell eyebrow="F11 · GEX insight (texte généré par IA)" title="Lire le texte de l'IA comme un correcteur" durationInFrames={durationInFrames}>
      <Sfx file="pop.wav" at={tProof} volume={0.4} />
      <Sfx file="click.wav" at={t1ok} volume={0.4} />
      <Sfx file="tick.wav" at={t2q} volume={0.4} />
      <Sfx file="bass.wav" at={t3x} volume={0.45} />
      <Sfx file="click.wav" at={t4ok} volume={0.4} />
      <Sfx file="chime.wav" at={tLesson} volume={0.45} />
      <Beat from={tTop} to={tLesson} style={{ left: 0, top: 0 }}>
        <S>
          <At x={20} y={0} w={1060}>
            <Panel style={{ padding: "20px 26px" }}>
              <div style={{ color: C.textMuted, fontFamily: theme.mono, fontSize: 18, letterSpacing: 2, marginBottom: 10 }}>GEX INSIGHT · généré le 24 sept., 11:29 UTC−4</div>
              <div style={{ fontSize: 23, lineHeight: 1.5 }}>
                {INSIGHT.map((s, i) => (
                  <span
                    key={i}
                    style={{
                      color: i === cur ? C.textPrimary : C.textMuted,
                      background: i === cur ? `${C.accent}26` : "transparent",
                      borderRadius: 6,
                      padding: "2px 4px",
                    }}
                  >
                    {s}{" "}
                  </span>
                ))}
              </div>
            </Panel>
            {cur >= 0 && (
              <div style={{ marginTop: 18 }}>
                <Pop at={[t1, t2, t3, t4][cur]}>
                  <Panel style={{ padding: "14px 22px", borderColor: C.accent }}>
                    <Label size={20}>traduction</Label>
                    <div style={{ color: C.textPrimary, fontSize: 26, fontWeight: 700, lineHeight: 1.35 }}>{FR[cur]}</div>
                  </Panel>
                </Pop>
              </div>
            )}
          </At>
          <At x={1130} y={0} w={580}>
            <div style={{ display: "flex", flexDirection: "column", gap: 14, alignItems: "flex-start" }}>
              {frame >= tTempt && frame < t1 && (
                <Pop at={tTempt}>
                  <Pill text="tentant de s'arrêter là…" size={26} color={C.textSecondary} />
                </Pop>
              )}
              {frame >= t1ok && <Verdict at={t1ok} kind="ok" text="régime −γ · mur 390" />}
              {frame >= t1cond && <Verdict at={t1cond} kind="doubt" text="conditionnel : SI ça casse" />}
              {frame >= t2nums && <Verdict at={t2nums} kind="ok" text="chiffres vérifiables" />}
              {frame >= t2interp && <Verdict at={t2interp} kind="doubt" text="volatilité ↓ = baisse ? discutable" />}
              {frame >= t3x && <Verdict at={t3x} kind="bad" text="en −γ ils VENDENT la baisse" />}
              {frame >= t3mix && <Verdict at={t3mix} kind="bad" text="mélange deux régimes" />}
              {frame >= t4ok && <Verdict at={t4ok} kind="ok" text="385 · −61K vérifiable" />}
              {frame >= t4b && <Verdict at={t4b} kind="doubt" text="biais ≠ prévision" />}
            </div>
          </At>
        </S>
      </Beat>
      <Beat from={tLesson} style={{ left: 0, top: 0 }}>
        <Center column gap={26}>
          <Big size={48}>l&apos;IA résume bien les chiffres… et raconte une histoire</Big>
          {frame >= tKeep && (
            <Pop at={tKeep}>
              <div style={{ display: "flex", gap: 20 }}>
                <Pill text="garde les chiffres" color={C.positive} size={30} filled />
                <Pill text="vérifie chaque mécanisme" color={C.amber} size={30} filled />
                <Pill text="ignore ce qui se contredit" color={C.negative} size={30} filled />
              </div>
            </Pop>
          )}
        </Center>
      </Beat>
    </SceneShell>
  );
};
