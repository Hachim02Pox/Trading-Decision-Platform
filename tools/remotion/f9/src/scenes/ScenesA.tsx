import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { theme } from "../theme";
import { Sfx, makeCue, Panel, GoldBarIcon, BankIcon, useBreathe } from "./shared";
import type { SceneProps } from "./shared";
import { Beat, Pop, Person, Bubble, DollarIcon, ArrowGlyph, clamp } from "./characters";
import { SceneShell, Center, Big, Label, STAGE_W } from "./stage";
import { Pill, CrossDraw, Stamp, CheckDraw } from "./props5";
import { Bond } from "./props7";
import { Gavel, Ladder, YieldStack, Slip } from "./props9";

const C = theme.colors;

export const Intro: React.FC<SceneProps> = ({ words, durationInFrames }) => {
  const frame = useCurrentFrame();
  const cue = makeCue(words);
  const tSem = cue("chaque semaine");
  const tVend = cue("il vend de la dette");
  const tMal = cue("parfois une enchere");
  const tBond = cue("et les taux bondissent");
  const tDette = cue("trop de dette");
  const tOr = cue("l or va monter");
  const tSauf = cue("sauf que");
  const tF9 = cue("c est le sujet");
  const breathe = useBreathe(0.2);
  const steps = ["budget", "enchères", "taux", "or"];

  return (
    <SceneShell eyebrow="F9 · Trésor & budget" title="Des enchères de dette… et un long chemin vers l'or" durationInFrames={durationInFrames}>
      <Sfx file="pop.wav" at={tSem} volume={0.4} />
      <Sfx file="bass.wav" at={tMal + 10} volume={0.45} />
      <Sfx file="whoosh.wav" at={tBond} volume={0.4} />
      <Sfx file="bass.wav" at={tSauf} volume={0.45} />
      <Sfx file="chime.wav" at={tF9} volume={0.55} />

      <Beat from={0} to={tSauf} style={{ left: 0, top: 0 }}>
        <div style={{ position: "relative", width: STAGE_W, height: 690 }}>
          <div style={{ position: "absolute", left: 80, top: 60, display: "flex", alignItems: "flex-end", gap: 30 }}>
            <Pop at={tSem}>
              <BankIcon size={200} color={C.accent} />
            </Pop>
            <Pop at={tVend}>
              <Gavel size={220} strikeAt={tMal + 10} />
            </Pop>
            {frame >= tVend && (
              <div style={{ display: "flex", gap: 10 }}>
                {["2 ans", "10 ans", "30 ans"].map((t, i) => (
                  <Pop key={t} at={tVend + 8 + i * 6}>
                    <div style={{ transform: `translateY(${Math.sin(frame / 10 + i) * 6}px)` }}>
                      <Bond title={`Trésor · ${t}`} rate="" width={180} />
                    </div>
                  </Pop>
                ))}
              </div>
            )}
          </div>
          {frame >= tBond && (
            <div style={{ position: "absolute", left: 100, top: 420, display: "flex", alignItems: "center", gap: 20 }}>
              <Pop at={tBond}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <ArrowGlyph up color={C.negative} size={70} />
                  <Big size={40} color={C.negative}>taux</Big>
                </div>
              </Pop>
            </div>
          )}
          {frame >= tDette && (
            <div style={{ position: "absolute", left: 900, top: 330, display: "flex", alignItems: "center", gap: 20 }}>
              <Pop at={tDette}>
                <Person size={200} color={C.textSecondary} />
              </Pop>
              <Pop at={tDette + 6}>
                <Bubble text={frame >= tOr ? "trop de dette → l'or va monter !" : "trop de dette…"} width={420} tone={C.accentBright} tail="left" />
              </Pop>
            </div>
          )}
        </div>
      </Beat>

      <Beat from={tSauf} style={{ left: 0, top: 0 }}>
        <Center column gap={40}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {steps.map((s, i) => (
              <React.Fragment key={s}>
                {i > 0 && (
                  <Pop at={tSauf + 8 + i * 12}>
                    <svg width="120" height="40">
                      <path d="M4 20 H100 M88 8 L104 20 L88 32" stroke={C.accent} strokeWidth="4" fill="none" strokeDasharray="8 8" strokeDashoffset={-frame} />
                    </svg>
                  </Pop>
                )}
                <Pop at={tSauf + 4 + i * 12}>
                  <Panel style={{ padding: "18px 28px", display: "flex", alignItems: "center", gap: 10 }}>
                    {s === "or" && <GoldBarIcon size={50} />}
                    <Big size={34}>{s}</Big>
                  </Panel>
                </Pop>
              </React.Fragment>
            ))}
          </div>
          <Pop at={tSauf + 50}>
            <Label size={30} color={C.textPrimary}>un chemin plus long qu&apos;il n&apos;y paraît</Label>
          </Pop>
          {frame >= tF9 && (
            <Pop at={tF9}>
              <div style={{ transform: `scale(${breathe.scale})` }}>
                <Big size={58} color={C.accentBright} glow>
                  F9 · Trésor & budget
                </Big>
              </div>
            </Pop>
          )}
        </Center>
      </Beat>
    </SceneShell>
  );
};

export const Issuance: React.FC<SceneProps> = ({ words, durationInFrames }) => {
  const frame = useCurrentFrame();
  const cue = makeCue(words);
  const tQ = cue("combien le tresor");
  const tNet = cue("l emprunt net");
  const ITEMS = [
    { t: "recettes", at: cue("apres les recettes"), s: "+" },
    { t: "dépenses", at: cue("les depenses"), s: "−" },
    { t: "remboursements", at: cue("les remboursements"), s: "−" },
    { t: "solde voulu au compte du Trésor", at: cue("et la variation du solde"), s: "±" },
  ];
  const tBrut = cue("les emissions brutes");
  const tRenouv = cue("parce que toute la dette");
  const tMontant = cue("et un meme montant");
  const tCourt = cue("avec des titres courts");
  const tCoupon = cue("ou avec des titres a coupons");
  const tChoix = cue("le choix change");
  const grossH = interpolate(frame, [tBrut, tRenouv + 30], [160, 320], { ...clamp, easing: theme.ease.out });

  return (
    <SceneShell eyebrow="F9 · Besoins d'emprunt" title="Emprunt net, émissions brutes, mélange des durées" durationInFrames={durationInFrames}>
      <Sfx file="pop.wav" at={tNet} volume={0.4} />
      {ITEMS.map((it) => (
        <Sfx key={it.t} file="tick.wav" at={it.at} volume={0.35} />
      ))}
      <Sfx file="whoosh.wav" at={tBrut} volume={0.4} />
      <Sfx file="whoosh.wav" at={tMontant} volume={0.4} />

      <Beat from={0} to={tMontant} style={{ left: 0, top: 0 }}>
        <div style={{ position: "relative", width: STAGE_W, height: 690 }}>
          <div style={{ position: "absolute", left: 40, top: 20, width: 820 }}>
            <Pop at={tNet}>
              <Panel glow style={{ padding: 26 }}>
                <Big size={34} color={C.accentBright}>Emprunt net</Big>
                <Label size={22} color={C.textPrimary}>le besoin de trésorerie, après :</Label>
                <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 14 }}>
                  {ITEMS.map((it) => (
                    <Pop key={it.t} at={it.at}>
                      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                        <span style={{ width: 40, color: C.accentBright, fontFamily: theme.mono, fontWeight: 900, fontSize: 30 }}>{it.s}</span>
                        <Label size={26} color={C.textPrimary}>{it.t}</Label>
                      </div>
                    </Pop>
                  ))}
                </div>
              </Panel>
            </Pop>
          </div>
          <div style={{ position: "absolute", left: 980, top: 20, display: "flex", alignItems: "flex-end", gap: 50, height: 420 }}>
            {frame >= tNet && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                <div style={{ width: 150, height: 160, borderRadius: 12, background: `linear-gradient(180deg, ${C.accent}, ${C.accent}55)` }} />
                <Label size={22} color={C.textPrimary}>emprunt net</Label>
              </div>
            )}
            {frame >= tBrut && (
              <Pop at={tBrut}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                  <div style={{ position: "relative", width: 150, height: grossH, borderRadius: 12, background: `linear-gradient(180deg, ${C.context}, ${C.context}55)` }}>
                    {frame >= tRenouv && <div style={{ position: "absolute", top: 10, left: 0, right: 0, textAlign: "center", color: C.bg, fontWeight: 900, fontSize: 18 }}>+ dette à renouveler</div>}
                  </div>
                  <Label size={22} color={C.textPrimary}>émissions brutes</Label>
                </div>
              </Pop>
            )}
          </div>
        </div>
      </Beat>

      <Beat from={tMontant} style={{ left: 0, top: 0 }}>
        <Center column gap={30}>
          <Pop at={tMontant}>
            <Big size={36}>Un même montant, plusieurs mélanges</Big>
          </Pop>
          <Pop at={tCourt - 6}>
            <Ladder from={tCourt - 6} hi={frame >= tCoupon ? "long" : frame >= tCourt ? "short" : null} />
          </Pop>
          <div style={{ display: "flex", gap: 20 }}>
            {frame >= tCourt && <Pill text="titres courts : semaines, mois" color={C.context} size={26} />}
            {frame >= tCoupon && <Pill text="titres à coupons : plusieurs années" size={26} />}
          </div>
          {frame >= tChoix && (
            <Pop at={tChoix}>
              <Label size={28} color={C.accentBright}>le choix change le risque de durée proposé aux investisseurs</Label>
            </Pop>
          )}
        </Center>
      </Beat>
    </SceneShell>
  );
};

export const Duration: React.FC<SceneProps> = ({ words, durationInFrames }) => {
  const frame = useCurrentFrame();
  const cue = makeCue(words);
  const tCourt = cue("les titres courts");
  const tLong = cue("les titres longs");
  const tSi = cue("si le tresor propose");
  const tTaux = cue("il faudra peut etre");
  const tAtt = cue("attention");
  const tRegle = cue("pas une regle");
  const lift = interpolate(frame, [tTaux, tTaux + 30], [0, 1], { ...clamp, easing: theme.ease.out });

  return (
    <SceneShell eyebrow="F9 · Risque de durée" title="Plus de titres longs… à quel prix ?" durationInFrames={durationInFrames}>
      <Sfx file="pop.wav" at={tCourt} volume={0.4} />
      <Sfx file="pop.wav" at={tLong} volume={0.4} />
      <Sfx file="whoosh.wav" at={tSi} volume={0.4} />
      <Sfx file="bass.wav" at={tAtt} volume={0.45} />
      <Beat from={0} style={{ left: 0, top: 0 }}>
        <div style={{ width: STAGE_W, height: 660, display: "flex", alignItems: "center", justifyContent: "center", gap: 90 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <Pop at={tCourt}>
              <Panel style={{ padding: "18px 26px", display: "flex", alignItems: "center", gap: 18 }}>
                <div style={{ width: 40, height: 40, borderRadius: 8, background: C.context }} />
                <Label size={26} color={C.textPrimary}>titres courts : peu de risque de durée</Label>
              </Panel>
            </Pop>
            <Pop at={tLong}>
              <Panel style={{ padding: "18px 26px", display: "flex", alignItems: "center", gap: 18 }}>
                <div style={{ width: 40, height: 110, borderRadius: 8, background: C.accent }} />
                <Label size={26} color={C.textPrimary}>titres longs : beaucoup plus</Label>
              </Panel>
            </Pop>
          </div>
          {frame >= tSi && (
            <Pop at={tSi}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
                <div style={{ display: "flex", gap: 8 }}>
                  {[0, 1, 2, 3, 4, 5].map((i) => (
                    <Pop key={i} at={tSi + i * 4}>
                      <div style={{ width: 50, height: 140, borderRadius: 8, background: `linear-gradient(180deg, ${C.accent}, ${C.accent}55)` }} />
                    </Pop>
                  ))}
                </div>
                <Label size={24}>beaucoup plus de titres longs, demande stable</Label>
                {frame >= tTaux && (
                  <div style={{ display: "flex", alignItems: "center", gap: 14, transform: `translateY(${-lift * 20}px)` }}>
                    <ArrowGlyph up color={C.negative} size={60} />
                    <Big size={34} color={C.negative}>taux ou prime de terme ↑ ?</Big>
                  </div>
                )}
              </div>
            </Pop>
          )}
        </div>
        {frame >= tAtt && (
          <div style={{ position: "absolute", left: 0, right: 0, top: 560, display: "flex", justifyContent: "center" }}>
            <Pop at={tAtt}>
              <Pill text={frame >= tRegle ? "un raisonnement d'équilibre, pas une règle : l'offre seule ne décide pas des taux" : "un raisonnement d'équilibre"} size={26} filled />
            </Pop>
          </div>
        )}
      </Beat>
    </SceneShell>
  );
};

export const Auctions: React.FC<SceneProps> = ({ words, durationInFrames }) => {
  const frame = useCurrentFrame();
  const cue = makeCue(words);
  const tAdj = cue("par adjudication");
  const tRev = cue("une enchere revele");
  const tHaut = cue("le taux haut c est");
  const tComp = cue("on le compare");
  const tAu = cue("si le taux haut est au dessus");
  const tEcart = cue("c est un ecart");
  const tDess = cue("s il est en dessous");
  const tRatio = cue("le ratio de couverture");
  const tHist = cue("mais il depend");
  const tAlloc = cue("enfin les allocations");
  const tCat = cue("ce sont des categories");
  const tDealers = cue("une forte part");

  return (
    <SceneShell eyebrow="F9 · Adjudications" title="Ce que révèle une enchère" durationInFrames={durationInFrames}>
      <Sfx file="pop.wav" at={tAdj} volume={0.4} />
      <Sfx file="bass.wav" at={tHaut + 4} volume={0.45} />
      <Sfx file="tick.wav" at={tAu} volume={0.4} />
      <Sfx file="tick.wav" at={tDess} volume={0.4} />
      <Sfx file="whoosh.wav" at={tRatio} volume={0.4} />
      <Sfx file="whoosh.wav" at={tAlloc} volume={0.4} />

      <Beat from={0} to={tRatio} style={{ left: 0, top: 0 }}>
        <div style={{ position: "relative", width: STAGE_W, height: 690 }}>
          <div style={{ position: "absolute", left: 60, top: 40 }}>
            <Pop at={tAdj}>
              <Gavel size={260} strikeAt={tHaut} />
            </Pop>
          </div>
          <div style={{ position: "absolute", left: 60, top: 350, width: 520 }}>
            {frame >= tRev && (
              <Pop at={tRev}>
                <Label size={24} color={C.textPrimary}>le prix pour placer un montant précis, sur une durée précise, à un moment précis</Label>
              </Pop>
            )}
          </div>
          <div style={{ position: "absolute", left: 660, top: 20, width: 1060 }}>
            {frame >= tHaut && (
              <Pop at={tHaut}>
                <Panel glow style={{ padding: 24 }}>
                  <div style={{ position: "relative", height: 260 }}>
                    <div style={{ position: "absolute", left: 40, right: 40, top: 150, height: 4, background: C.hairline }} />
                    {frame >= tComp && (
                      <div style={{ position: "absolute", left: 360, top: 90, display: "flex", flexDirection: "column", alignItems: "center" }}>
                        <div style={{ color: C.context, fontWeight: 900, fontSize: 22, fontFamily: theme.mono }}>marché juste avant</div>
                        <div style={{ width: 4, height: 60, background: C.context }} />
                      </div>
                    )}
                    <div style={{ position: "absolute", left: frame >= tDess ? 200 : 520, top: 150, display: "flex", flexDirection: "column", alignItems: "center", transition: "none" }}>
                      <div style={{ width: 4, height: 60, background: frame >= tDess ? C.positive : C.negative }} />
                      <div style={{ color: frame >= tDess ? C.positive : C.negative, fontWeight: 900, fontSize: 22, fontFamily: theme.mono }}>taux haut</div>
                    </div>
                    <div style={{ position: "absolute", left: 40, top: 200, color: C.textMuted, fontFamily: theme.mono, fontSize: 16 }}>taux plus bas</div>
                    <div style={{ position: "absolute", right: 40, top: 200, color: C.textMuted, fontFamily: theme.mono, fontSize: 16 }}>taux plus haut →</div>
                  </div>
                  {frame >= tAu && frame < tDess && <Label size={24} color={C.negative}>au-dessus : placement plus difficile que prévu {frame >= tEcart ? "→ écart de fin d'adjudication (tail)" : ""}</Label>}
                  {frame >= tDess && <Label size={24} color={C.positive}>en dessous : demande plus forte que prévu</Label>}
                </Panel>
              </Pop>
            )}
          </div>
        </div>
      </Beat>

      <Beat from={tRatio} style={{ left: 0, top: 0 }}>
        <div style={{ position: "relative", width: STAGE_W, height: 690 }}>
          <div style={{ position: "absolute", left: 40, top: 20, width: 820 }}>
            <Pop at={tRatio}>
              <Panel glow={frame < tAlloc} style={{ padding: 24 }}>
                <Big size={32} color={C.accentBright}>Ratio de couverture (Bid-to-Cover)</Big>
                <div style={{ display: "flex", alignItems: "center", gap: 20, marginTop: 16 }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {[0, 1, 2, 3].map((i) => (
                      <Pop key={i} at={tRatio + 8 + i * 5}>
                        <Slip text={`offre ${i + 1}`} />
                      </Pop>
                    ))}
                  </div>
                  <div style={{ fontFamily: theme.mono, fontSize: 30, fontWeight: 900, color: C.textPrimary }}>total des offres ÷ montant accepté</div>
                </div>
                {frame >= tHist && <Label size={22} color={C.textPrimary}>à comparer à l&apos;historique, selon les habitudes d&apos;enchères</Label>}
              </Panel>
            </Pop>
          </div>
          <div style={{ position: "absolute", left: 900, top: 20, width: 820 }}>
            {frame >= tAlloc && (
              <Pop at={tAlloc}>
                <Panel glow style={{ padding: 24 }}>
                  <Big size={32}>Allocations</Big>
                  <div style={{ display: "flex", height: 60, borderRadius: 12, overflow: "hidden", marginTop: 16 }}>
                    <div style={{ width: "62%", background: C.context, display: "flex", alignItems: "center", justifyContent: "center", color: C.bg, fontWeight: 900, fontSize: 20 }}>indirects</div>
                    <div style={{ width: "20%", background: C.accent, display: "flex", alignItems: "center", justifyContent: "center", color: C.bg, fontWeight: 900, fontSize: 20 }}>directs</div>
                    <div style={{ width: "18%", background: C.negative, display: "flex", alignItems: "center", justifyContent: "center", color: C.bg, fontWeight: 900, fontSize: 18 }}>teneurs</div>
                  </div>
                  {frame >= tCat && <Label size={22} color={C.textPrimary}>des catégories : ni leurs motivations, ni qui garde les titres</Label>}
                  {frame >= tDealers && <Label size={22} color={C.accentBright}>forte part des teneurs de marché ≠ preuve d&apos;une faiblesse durable</Label>}
                </Panel>
              </Pop>
            )}
          </div>
        </div>
      </Beat>
    </SceneShell>
  );
};

export const TailExample: React.FC<SceneProps> = ({ words, durationInFrames }) => {
  const frame = useCurrentFrame();
  const cue = makeCue(words);
  const tEx = cue("exemple");
  const tMkt = cue("le taux de marche du dix ans");
  const tStop = cue("l enchere se termine");
  const tCalc = cue("l ecart 4");
  const t25 = cue("soit 2 5");
  const tPlus = cue("l enchere s est placee");
  const tH = cue("imaginons que hachim");
  const tRef = cue("le bon reflexe");
  const tOr = cue("mais surtout");

  return (
    <SceneShell eyebrow="F9 · Exemple" title="Calculer l'écart de fin d'adjudication" durationInFrames={durationInFrames}>
      <Sfx file="pop.wav" at={tMkt} volume={0.4} />
      <Sfx file="bass.wav" at={tStop} volume={0.45} />
      <Sfx file="chime.wav" at={t25} volume={0.5} />
      <Sfx file="bass.wav" at={tOr} volume={0.45} />
      <Beat from={0} style={{ left: 0, top: 0 }}>
        <div style={{ position: "relative", width: STAGE_W, height: 690 }}>
          <div style={{ position: "absolute", left: 60, top: 20, display: "flex", gap: 30 }}>
            <Pop at={tMkt}>
              <Panel style={{ padding: "20px 30px", textAlign: "center" }}>
                <Label size={22}>marché juste avant (10 ans)</Label>
                <Big size={52} color={C.context}>4,280 %</Big>
              </Panel>
            </Pop>
            <Pop at={tStop}>
              <Panel glow style={{ padding: "20px 30px", textAlign: "center", borderColor: C.negative }}>
                <Label size={22}>taux haut de l&apos;enchère</Label>
                <Big size={52} color={C.negative}>4,305 %</Big>
              </Panel>
            </Pop>
          </div>
          {frame >= tCalc && (
            <div style={{ position: "absolute", left: 60, top: 220 }}>
              <Pop at={tCalc}>
                <div style={{ fontFamily: theme.mono, fontSize: 40, fontWeight: 900, color: C.textPrimary }}>4,305 − 4,280 = 0,025 pt {frame >= t25 ? <span style={{ color: C.accentBright }}>= 2,5 pb</span> : null}</div>
              </Pop>
            </div>
          )}
          {frame >= tPlus && (
            <div style={{ position: "absolute", left: 60, top: 300 }}>
              <Pop at={tPlus}>
                <Pill text="placée plus cher que la référence de marché" color={C.negative} size={26} />
              </Pop>
            </div>
          )}
          {frame >= tH && (
            <div style={{ position: "absolute", left: 1100, top: 150 }}>
              <Pop at={tH}>
                <Person size={220} color={C.accent} label="Hachim" />
              </Pop>
            </div>
          )}
          {frame >= tRef && (
            <div style={{ position: "absolute", left: 60, top: 390, display: "flex", flexDirection: "column", gap: 10 }}>
              {["l'appeler : écart de 2,5 pb", "comparer à l'historique de ce titre", "regarder la réaction juste après"].map((t, i) => (
                <Pop key={t} at={tRef + i * 14}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <CheckDraw at={tRef + i * 14 + 4} size={40} />
                    <Label size={26} color={C.textPrimary}>{t}</Label>
                  </div>
                </Pop>
              ))}
            </div>
          )}
          {frame >= tOr && (
            <div style={{ position: "absolute", left: 1000, top: 460, display: "flex", alignItems: "center", gap: 20 }}>
              <Pop at={tOr}>
                <div style={{ position: "relative" }}>
                  <GoldBarIcon size={130} />
                  <div style={{ position: "absolute", left: 10, top: 0 }}>
                    <CrossDraw at={tOr + 8} size={110} />
                  </div>
                </div>
              </Pop>
              <Pop at={tOr + 10}>
                <Label size={26} color={C.negative}>aucune direction pour l&apos;or</Label>
              </Pop>
            </div>
          )}
        </div>
      </Beat>
    </SceneShell>
  );
};

export const TermPremium: React.FC<SceneProps> = ({ words, durationInFrames }) => {
  const frame = useCurrentFrame();
  const cue = makeCue(words);
  const tP = cue("parlons de");
  const tLong = cue("un taux long");
  const tCourts = cue("les taux courts attendus");
  const tComp = cue("et une compensation");
  const tNul = cue("cette prime ne se voit");
  const tModele = cue("elle est estimee");
  const tMonte = cue("elle peut monter");
  const tDesaccord = cue("et les modeles");
  const tEst = cue("c est une estimation");
  const prem = frame < tMonte ? 60 : 60 + interpolate(frame, [tMonte, tMonte + 40], [0, 50], { ...clamp, easing: theme.ease.out }) + Math.sin(frame / 8) * (frame >= tDesaccord ? 14 : 0);

  return (
    <SceneShell eyebrow="F9 · Prime de terme" title="Un taux long = deux morceaux" durationInFrames={durationInFrames}>
      <Sfx file="pop.wav" at={tLong} volume={0.4} />
      <Sfx file="tick.wav" at={tCourts} volume={0.4} />
      <Sfx file="tick.wav" at={tComp} volume={0.4} />
      <Sfx file="bass.wav" at={tNul} volume={0.4} />
      <Sfx file="chime.wav" at={tEst} volume={0.45} />
      <Beat from={0} style={{ left: 0, top: 0 }}>
        <div style={{ width: STAGE_W, height: 660, display: "flex", alignItems: "center", justifyContent: "center", gap: 80 }}>
          <Pop at={tP}>
            <YieldStack from={tCourts} premium={frame >= tComp ? prem : 0} />
          </Pop>
          <div style={{ display: "flex", flexDirection: "column", gap: 20, width: 800 }}>
            {frame >= tNul && (
              <Pop at={tNul}>
                <Panel style={{ padding: "16px 24px", borderColor: C.negative }}>
                  <Label size={26} color={C.textPrimary}>la prime ne se voit nulle part directement</Label>
                  {frame >= tModele && <Label size={24} color={C.accentBright}>elle est estimée par un modèle</Label>}
                </Panel>
              </Pop>
            )}
            {frame >= tMonte && (
              <Pop at={tMonte}>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  {["incertitude sur l'inflation", "offre de titres longs", "volatilité", "moins de demande"].map((t) => (
                    <Pill key={t} text={t} size={24} />
                  ))}
                </div>
              </Pop>
            )}
            {frame >= tDesaccord && (
              <Pop at={tDesaccord}>
                <Label size={26} color={C.textPrimary}>les modèles ne sont pas toujours d&apos;accord</Label>
              </Pop>
            )}
            {frame >= tEst && <Stamp at={tEst} text="ESTIMATION ≠ COTATION" color={C.accentBright} size={34} />}
          </div>
        </div>
      </Beat>
    </SceneShell>
  );
};

export const GoldTransmission: React.FC<SceneProps> = ({ words, durationInFrames }) => {
  const frame = useCurrentFrame();
  const cue = makeCue(words);
  const tQ = cue("alors et l or");
  const t1 = cue("premier scenario");
  const tFerme = cue("et le dollar reste ferme");
  const tCout = cue("detenir de l or");
  const tDef = cue("ce canal peut");
  const t2 = cue("deuxieme scenario");
  const tConf = cue("les taux montent parce que");
  const tBaisse = cue("et le dollar baisse");
  const tAutre = cue("la l or peut");
  const tDecomp = cue("c est la decomposition");

  return (
    <SceneShell eyebrow="F9 · Vers l'or" title="Même hausse des taux, deux histoires" durationInFrames={durationInFrames}>
      <Sfx file="pop.wav" at={t1} volume={0.4} />
      <Sfx file="pop.wav" at={t2} volume={0.4} />
      <Sfx file="chime.wav" at={tDecomp} volume={0.5} />
      <Beat from={0} style={{ left: 0, top: 0 }}>
        <div style={{ width: STAGE_W, height: 660, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 30 }}>
          <Pop at={tQ}>
            <Big size={40}>Et l&apos;or ?</Big>
          </Pop>
          <div style={{ display: "flex", gap: 40 }}>
            <Pop at={t1}>
              <Panel glow={frame >= t1 && frame < t2} style={{ width: 760, padding: 26, borderColor: C.negative }}>
                <Big size={30} color={C.negative}>1 · émissions → taux réels ↑, dollar ferme</Big>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 24, marginTop: 24 }}>
                  <ArrowGlyph up color={C.negative} size={60} />
                  <Label size={24}>taux réels</Label>
                  {frame >= tFerme && <DollarIcon size={70} color={C.positive} />}
                  {frame >= tCout && <GoldBarIcon size={90} color={C.negative} />}
                </div>
                {frame >= tCout && <Label size={23} color={C.textPrimary}>détenir de l&apos;or, qui ne rapporte rien, coûte plus cher</Label>}
                {frame >= tDef && <Label size={23} color={C.negative}>canal défavorable</Label>}
              </Panel>
            </Pop>
            <Pop at={t2}>
              <Panel glow={frame >= t2 && frame < tDecomp} style={{ width: 760, padding: 26, borderColor: C.positive }}>
                <Big size={30} color={C.positive}>2 · confiance qui s&apos;effrite, dollar ↓</Big>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 24, marginTop: 24 }}>
                  {frame >= tConf && <ArrowGlyph up color={C.negative} size={60} />}
                  {frame >= tConf && <Label size={24}>taux</Label>}
                  {frame >= tBaisse && <ArrowGlyph up={false} color={C.negative} size={60} />}
                  {frame >= tBaisse && <DollarIcon size={70} color={C.negative} />}
                  {frame >= tAutre && <GoldBarIcon size={90} color={C.positive} />}
                </div>
                {frame >= tAutre && <Label size={23} color={C.textPrimary}>l&apos;or peut réagir tout autrement</Label>}
              </Panel>
            </Pop>
          </div>
          {frame >= tDecomp && (
            <Pop at={tDecomp}>
              <Pill text="décomposer le mouvement des taux + regarder les autres marchés" size={28} filled />
            </Pop>
          )}
        </div>
      </Beat>
    </SceneShell>
  );
};
