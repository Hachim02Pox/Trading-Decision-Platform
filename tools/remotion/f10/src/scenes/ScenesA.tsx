import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { theme } from "../theme";
import { Sfx, makeCue, Panel, GoldBarIcon, AnimatedNumber, useBreathe } from "./shared";
import type { SceneProps } from "./shared";
import { Beat, Pop, Person, Bubble, ClockIcon, LiveChart, DocIcon, clamp } from "./characters";
import { SceneShell, Center, Big, Label, STAGE_W } from "./stage";
import { Pill, CrossDraw, CalendarPage, Stamp } from "./props5";
import { Tank, Pipe } from "./props8";

const C = theme.colors;

/** Row of little people: `longs` green, `shorts` red. */
const Crowd: React.FC<{ longs: number; shorts: number; size?: number; at: number }> = ({ longs, shorts, size = 70, at }) => (
  <div style={{ display: "flex", gap: 4, alignItems: "flex-end" }}>
    {Array.from({ length: longs + shorts }).map((_, i) => (
      <Pop key={i} at={at + i * 2}>
        <Person size={size} phase={i} color={i < longs ? C.positive : C.negative} />
      </Pop>
    ))}
  </div>
);

/** Horizontal percentile bar with a marker. */
const Percentile: React.FC<{ value: number; at: number; label?: string }> = ({ value, at, label }) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [at, at + 40], [0, value], { ...clamp, easing: theme.ease.out });
  return (
    <div style={{ width: 900 }}>
      <div style={{ position: "relative", height: 40, borderRadius: 20, background: `linear-gradient(90deg, ${C.context}55, ${C.hairline}, ${C.negative}88)` }}>
        <div style={{ position: "absolute", left: `${p}%`, top: -14, width: 8, height: 68, marginLeft: -4, borderRadius: 4, background: C.accentBright, boxShadow: `0 0 20px ${C.glow}` }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12, color: C.textMuted, fontFamily: theme.mono, fontSize: 18 }}>
        <span>rang 0</span>
        <span style={{ color: C.accentBright, fontWeight: 900, fontSize: 24 }}>{label ?? `${Math.round(p)}e rang`}</span>
        <span>rang 100</span>
      </div>
    </div>
  );
};

export const Intro: React.FC<SceneProps> = ({ words, durationInFrames }) => {
  const frame = useCurrentFrame();
  const cue = makeCue(words);
  const tQui = cue("qui est deja");
  const tAch = cue("et est ce qu ils");
  const tSort = cue("ou est ce qu ils sortent");
  const tQ = cue("c est la question");
  const tSpec = cue("les speculateurs");
  const tRet = cue("alors ca va");
  const tSauf = cue("sauf que");
  const tDecr = cue("il decrit");
  const tF10 = cue("c est le sujet");
  const breathe = useBreathe(0.2);

  return (
    <SceneShell eyebrow="F10 · Flux & positionnement" title="Qui est déjà dans le marché ?" durationInFrames={durationInFrames}>
      <Sfx file="pop.wav" at={tQui} volume={0.4} />
      <Sfx file="whoosh.wav" at={tSort} volume={0.4} />
      <Sfx file="bass.wav" at={tSauf} volume={0.45} />
      <Sfx file="chime.wav" at={tF10} volume={0.55} />
      <Beat from={0} to={tSauf} style={{ left: 0, top: 0 }}>
        <div style={{ position: "relative", width: STAGE_W, height: 690 }}>
          <div style={{ position: "absolute", left: 660, top: 80 }}>
            <Pop at={tQui}>
              <GoldBarIcon size={260} />
            </Pop>
          </div>
          {[0, 1, 2, 3, 4].map((i) => {
            const inX = 200 + i * 110;
            const x = frame < tSort ? interpolate(frame, [tAch + i * 5, tAch + 40 + i * 5], [-200, inX], { ...clamp, easing: theme.ease.out }) : i > 2 ? interpolate(frame, [tSort, tSort + 40], [inX, inX + 1300], { ...clamp, easing: theme.ease.in }) : inX;
            return (
              <div key={i} style={{ position: "absolute", left: x, top: 380 }}>
                <Person size={110} phase={i} color={i > 2 && frame >= tSort ? C.negative : C.positive} run={(frame > tAch && frame < tAch + 45) || (i > 2 && frame > tSort && frame < tSort + 40)} />
              </div>
            );
          })}
          {frame >= tQ && (
            <div style={{ position: "absolute", left: 0, right: 0, top: 20, display: "flex", justifyContent: "center", gap: 14 }}>
              <Pop at={tQ}>
                <Pill text="positionnement" size={28} />
              </Pop>
              <Pop at={tQ + 10}>
                <Pill text="flux" color={C.context} size={28} />
              </Pop>
            </div>
          )}
          {frame >= tSpec && (
            <div style={{ position: "absolute", left: 1150, top: 260 }}>
              <Pop at={tSpec}>
                <Bubble text={frame >= tRet ? "tous à l'achat → ça va se retourner !" : "tous à l'achat…"} width={440} tone={C.accentBright} tail="bottom" />
              </Pop>
            </div>
          )}
        </div>
      </Beat>
      <Beat from={tSauf} style={{ left: 0, top: 0 }}>
        <Center column gap={34}>
          <div style={{ display: "flex", gap: 60, alignItems: "center" }}>
            <Pop at={tSauf + 6}>
              <div style={{ position: "relative" }}>
                <Big size={60}>direction</Big>
                <div style={{ position: "absolute", left: 60, top: -20 }}>
                  <CrossDraw at={tSauf + 16} size={100} />
                </div>
              </div>
            </Pop>
            <Pop at={tSauf + 14}>
              <div style={{ position: "relative" }}>
                <ClockIcon size={130} />
                <div style={{ position: "absolute", left: 10, top: 10 }}>
                  <CrossDraw at={tSauf + 24} size={110} />
                </div>
              </div>
            </Pop>
          </div>
          {frame >= tDecr && (
            <Pop at={tDecr}>
              <Label size={32} color={C.textPrimary}>il décrit qui est exposé, et comment la participation évolue</Label>
            </Pop>
          )}
          {frame >= tF10 && (
            <Pop at={tF10}>
              <div style={{ transform: `scale(${breathe.scale})` }}>
                <Big size={58} color={C.accentBright} glow>
                  F10 · Flux & positionnement
                </Big>
              </div>
            </Pop>
          )}
        </Center>
      </Beat>
    </SceneShell>
  );
};

export const StockFlow: React.FC<SceneProps> = ({ words, durationInFrames }) => {
  const frame = useCurrentFrame();
  const cue = makeCue(words);
  const tPos = cue("une position c est");
  const tFlux = cue("un flux c est");
  const tNet = cue("la position nette");
  const tAtt = cue("attention");
  const tVar = cue("c est la variation");
  const tPrix = cue("et le prix peut monter");
  const tParce = cue("parce que d autres");
  const tHors = cue("parce qu il y a");
  const tAutre = cue("ou parce qu une autre");
  const longs = frame >= tPrix + 30 ? 5 : 6;

  return (
    <SceneShell eyebrow="F10 · Stock et flux" title="Une position… et sa variation" durationInFrames={durationInFrames}>
      <Sfx file="pop.wav" at={tPos} volume={0.4} />
      <Sfx file="pop.wav" at={tFlux} volume={0.4} />
      <Sfx file="whoosh.wav" at={tNet} volume={0.4} />
      <Sfx file="bass.wav" at={tAtt} volume={0.4} />
      <Sfx file="whoosh.wav" at={tPrix} volume={0.4} />
      <Beat from={0} to={tNet} style={{ left: 0, top: 0 }}>
        <Center gap={120}>
          <Pop at={tPos}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
              <Tank level={0.6} label="position" w={220} h={280} />
              <Label size={24} color={C.textPrimary}>une exposition, à un instant</Label>
            </div>
          </Pop>
          <Pop at={tFlux}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
              <Pipe width={360} active label="flux" />
              <Label size={24} color={C.textPrimary}>une variation, sur une période</Label>
            </div>
          </Pop>
        </Center>
      </Beat>
      <Beat from={tNet} style={{ left: 0, top: 0 }}>
        <div style={{ position: "relative", width: STAGE_W, height: 690 }}>
          <div style={{ position: "absolute", left: 40, top: 10 }}>
            <Panel style={{ padding: 24 }}>
              <Big size={30}>position nette = achat − vente</Big>
              <div style={{ marginTop: 16 }}>
                <Crowd longs={longs} shorts={3} at={tNet + 6} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10 }}>
                <Label size={22} color={C.positive}>à l&apos;achat : {longs}</Label>
                <Label size={22} color={C.negative}>à la vente : 3</Label>
                <Label size={22} color={C.accentBright}>nette : +{longs - 3}</Label>
              </div>
            </Panel>
          </div>
          {frame >= tAtt && frame < tPrix && (
            <div style={{ position: "absolute", left: 40, top: 360, width: 900 }}>
              <Pop at={tAtt}>
                <Panel style={{ padding: "16px 24px", borderColor: C.negative }}>
                  <Label size={26} color={C.textPrimary}>position nette positive ≠ achats de la semaine</Label>
                  {frame >= tVar && <Label size={24} color={C.accentBright}>c&apos;est la variation d&apos;une semaine à l&apos;autre qui répond</Label>}
                </Panel>
              </Pop>
            </div>
          )}
          {frame >= tPrix && (
            <div style={{ position: "absolute", left: 1000, top: 10, width: 720 }}>
              <Pop at={tPrix}>
                <Panel glow style={{ padding: 20 }}>
                  <LiveChart data={[40, 42, 45, 47, 52, 55, 60, 63]} width={660} height={180} from={tPrix} drawFrames={50} label="prix ↑ alors que les achats nets ↓" />
                </Panel>
              </Pop>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 16 }}>
                {[
                  { t: "rachats de positions vendeuses", at: tParce },
                  { t: "activité hors du rapport", at: tHors },
                  { t: "une autre demande domine", at: tAutre },
                ].map((x) => (
                  <Pop key={x.t} at={x.at}>
                    <Pill text={x.t} color={C.context} size={24} />
                  </Pop>
                ))}
              </div>
            </div>
          )}
        </div>
      </Beat>
    </SceneShell>
  );
};

export const Crowding: React.FC<SceneProps> = ({ words, durationInFrames }) => {
  const frame = useCurrentFrame();
  const cue = makeCue(words);
  const tQ = cue("et quand tout le monde");
  const tEnc = cue("encombre");
  const tRang = cue("un rang historique");
  const tExpo = cue("parce qu il y a plus");
  const tMais = cue("mais ca ne dit");
  const tTend = cue("une tendance peut");
  const tilt = interpolate(frame, [tRang, tExpo + 20], [0, 8], { ...clamp, easing: theme.ease.inOut }) + Math.sin(frame / 8) * 2;

  return (
    <SceneShell eyebrow="F10 · Encombrement" title="Tout le monde à l'achat… et alors ?" durationInFrames={durationInFrames}>
      <Sfx file="pop.wav" at={tQ} volume={0.4} />
      <Sfx file="bass.wav" at={tRang} volume={0.4} />
      <Sfx file="chime.wav" at={tTend} volume={0.45} />
      <Beat from={0} style={{ left: 0, top: 0 }}>
        <div style={{ width: STAGE_W, height: 660, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 30 }}>
          <Pop at={tQ}>
            <div style={{ transform: `rotate(${tilt}deg)`, transformOrigin: "50% 100%", display: "flex", gap: 2, padding: "10px 30px", borderBottom: `8px solid ${C.accentDim}`, borderRadius: 10 }}>
              {Array.from({ length: 11 }).map((_, i) => (
                <Person key={i} size={70} phase={i} color={C.positive} />
              ))}
            </div>
          </Pop>
          {frame >= tEnc && (
            <Pop at={tEnc}>
              <Pill text="marché encombré" size={30} filled />
            </Pop>
          )}
          {frame >= tRang && (
            <Pop at={tRang}>
              <Percentile value={94} at={tRang} />
            </Pop>
          )}
          {frame >= tExpo && <Label size={26} color={C.textPrimary}>plus d&apos;exposition qui peut être réduite d&apos;un coup</Label>}
          <div style={{ display: "flex", gap: 20 }}>
            {frame >= tMais && (
              <Pop at={tMais}>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <ClockIcon size={70} />
                  <Big size={30} color={C.negative}>quand ? si ? — inconnu</Big>
                </div>
              </Pop>
            )}
            {frame >= tTend && (
              <Pop at={tTend}>
                <Pill text="la tendance peut continuer longtemps" color={C.positive} size={26} />
              </Pop>
            )}
          </div>
        </div>
      </Beat>
    </SceneShell>
  );
};

export const Cftc: React.FC<SceneProps> = ({ words, durationInFrames }) => {
  const frame = useCurrentFrame();
  const cue = makeCue(words);
  const tSrc = cue("la source principale");
  const tAut = cue("l autorite americaine");
  const tClasse = cue("il classe");
  const tCat = cue("les categories");
  const tPas = cue("pas une strategie");
  const tOi = cue("l interet ouvert c est");
  const tDiv = cue("diviser la position");
  const tRang = cue("et un rang");
  const tNi = cue("ce n est ni");

  return (
    <SceneShell eyebrow="F10 · Le rapport CFTC" title="Une photographie hebdomadaire des positions" durationInFrames={durationInFrames}>
      <Sfx file="pop.wav" at={tSrc} volume={0.4} />
      <Sfx file="tick.wav" at={tCat} volume={0.4} />
      <Sfx file="whoosh.wav" at={tOi} volume={0.4} />
      <Sfx file="chime.wav" at={tRang} volume={0.45} />
      <Beat from={0} to={tOi} style={{ left: 0, top: 0 }}>
        <Center gap={80}>
          <Pop at={tSrc}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
              <div style={{ position: "relative" }}>
                <DocIcon size={220} color={C.textPrimary} />
                <div style={{ position: "absolute", left: 70, top: 20, color: C.accentBright, fontFamily: theme.mono, fontWeight: 900, fontSize: 28 }}>CFTC</div>
              </div>
              {frame >= tAut && <Label size={24} color={C.textPrimary}>autorité américaine des marchés à terme</Label>}
            </div>
          </Pop>
          <div style={{ display: "flex", flexDirection: "column", gap: 18, width: 820 }}>
            {frame >= tClasse && (
              <Pop at={tClasse}>
                <Pill text="positions déclarées · contrats à terme + options · chaque semaine" size={24} />
              </Pop>
            )}
            {frame >= tCat && (
              <Pop at={tCat}>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  {["Managed Money", "Producteurs", "Intermédiaires", "Autres"].map((t) => (
                    <Pill key={t} text={t} color={C.context} size={24} />
                  ))}
                </div>
              </Pop>
            )}
            {frame >= tPas && (
              <Pop at={tPas}>
                <Label size={26} color={C.accentBright}>des classements réglementaires : ni une stratégie, ni une intention commune</Label>
              </Pop>
            )}
          </div>
        </Center>
      </Beat>
      <Beat from={tOi} style={{ left: 0, top: 0 }}>
        <Center column gap={40}>
          <Pop at={tOi}>
            <Panel glow style={{ padding: "18px 30px", textAlign: "center" }}>
              <Big size={34}>intérêt ouvert = contrats en cours</Big>
              {frame >= tDiv && <Label size={26} color={C.textPrimary}>position nette ÷ intérêt ouvert → comparer des marchés de tailles différentes</Label>}
            </Panel>
          </Pop>
          {frame >= tRang && (
            <Pop at={tRang}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
                <Label size={24}>rang sur 156 semaines (≈ 3 ans)</Label>
                <Percentile value={78} at={tRang} />
              </div>
            </Pop>
          )}
          {frame >= tNi && <Stamp at={tNi} text="NI PROBABILITÉ · NI VALEUR JUSTE" color={C.accentBright} size={30} />}
        </Center>
      </Beat>
    </SceneShell>
  );
};

export const Lag: React.FC<SceneProps> = ({ words, durationInFrames }) => {
  const frame = useCurrentFrame();
  const cue = makeCue(words);
  const tDec = cue("un detail change tout");
  const tMardi = cue("la photographie");
  const tVen = cue("le rapport est publie");
  const tMer = cue("imaginons que l or");
  const tH = cue("vendredi hachim");
  const tAvant = cue("mais les positions");
  const tRev = cue("les revisions");
  const flash = frame >= tMardi && frame < tMardi + 8;

  return (
    <SceneShell eyebrow="F10 · Le décalage" title="Photographié mardi, publié vendredi" durationInFrames={durationInFrames}>
      <Sfx file="pop.wav" at={tMardi} volume={0.45} />
      <Sfx file="whoosh.wav" at={tMer} volume={0.45} />
      <Sfx file="pop.wav" at={tVen} volume={0.4} />
      <Sfx file="bass.wav" at={tAvant} volume={0.45} />
      <Beat from={0} style={{ left: 0, top: 0 }}>
        <div style={{ position: "relative", width: STAGE_W, height: 690 }}>
          {flash && <div style={{ position: "absolute", inset: 0, background: "#ffffff", opacity: 0.25 }} />}
          <div style={{ position: "absolute", left: 40, top: 20, display: "flex", gap: 60, alignItems: "flex-end" }}>
            {[
              { d: "MARDI", t: "photo des positions", at: tMardi, col: C.context },
              { d: "MERCREDI", t: "l'or bouge fort", at: tMer, col: C.accent },
              { d: "VENDREDI", t: "publication", at: tVen, col: C.positive },
            ].map((x) => (
              <Pop key={x.d} at={x.at}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                  <CalendarPage top={x.d} big={x.d === "MARDI" ? "Ma" : x.d === "MERCREDI" ? "Me" : "V"} size={180} />
                  <Label size={22} color={C.textPrimary}>{x.t}</Label>
                </div>
              </Pop>
            ))}
          </div>
          {frame >= tMer && (
            <div style={{ position: "absolute", left: 800, top: 20 }}>
              <Panel style={{ padding: 16 }}>
                <LiveChart data={[50, 50.5, 50.2, 51, 58, 64, 66, 65]} width={560} height={170} from={tMer} drawFrames={40} label="or · mercredi" />
              </Panel>
            </div>
          )}
          {frame >= tH && (
            <div style={{ position: "absolute", left: 1400, top: 300 }}>
              <Pop at={tH}>
                <div style={{ position: "relative" }}>
                  <Person size={200} color={C.accent} label="Hachim" />
                  <div style={{ position: "absolute", left: -120, top: 60 }}>
                    <DocIcon size={90} color={C.textPrimary} />
                  </div>
                </div>
              </Pop>
            </div>
          )}
          {frame >= tAvant && (
            <div style={{ position: "absolute", left: 40, top: 340, width: 1200 }}>
              <Pop at={tAvant}>
                <Panel glow style={{ padding: "16px 24px", borderColor: C.negative }}>
                  <Big size={32} color={C.negative}>les positions lues vendredi datent d&apos;avant le mouvement</Big>
                </Panel>
              </Pop>
            </div>
          )}
          {frame >= tRev && (
            <div style={{ position: "absolute", left: 40, top: 480, display: "flex", gap: 12, flexWrap: "wrap", width: 1300 }}>
              {["révisions", "contrats couverts", "positions entre échéances", "comptage des options"].map((t, i) => (
                <Pop key={t} at={tRev + i * 8}>
                  <Pill text={t} color={C.context} size={24} />
                </Pop>
              ))}
            </div>
          )}
        </div>
      </Beat>
    </SceneShell>
  );
};

export const Normalize: React.FC<SceneProps> = ({ words, durationInFrames }) => {
  const frame = useCurrentFrame();
  const cue = makeCue(words);
  const tEx = cue("exemple");
  const tOi = cue("et l interet ouvert total");
  const tNet = cue("position nette");
  const tPart = cue("part de l interet");
  const t22 = cue("22 pourcent");
  const tDouble = cue("maintenant si");
  const t11 = cue("11 pourcent");
  const tDeux = cue("le nombre de contrats");
  const oi = frame >= tDouble ? interpolate(frame, [tDouble, tDouble + 40], [500, 1000], { ...clamp, easing: theme.ease.inOut }) : 500;
  const share = (110 / oi) * 100;

  return (
    <SceneShell eyebrow="F10 · Exemple" title="Normaliser une position nette" durationInFrames={durationInFrames}>
      <Sfx file="pop.wav" at={tEx} volume={0.4} />
      <Sfx file="tick.wav" at={tNet} volume={0.4} />
      <Sfx file="chime.wav" at={t22} volume={0.45} />
      <Sfx file="whoosh.wav" at={tDouble} volume={0.4} />
      <Sfx file="chime.wav" at={t11} volume={0.45} />
      <Beat from={0} style={{ left: 0, top: 0 }}>
        <div style={{ position: "relative", width: STAGE_W, height: 690 }}>
          <div style={{ position: "absolute", left: 60, top: 20, display: "flex", alignItems: "flex-end", gap: 40, height: 380 }}>
            {[
              { t: "achat", v: 180, col: C.positive },
              { t: "vente", v: 70, col: C.negative },
            ].map((b) => (
              <Pop key={b.t} at={tEx + 10}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                  <div style={{ color: C.textPrimary, fontFamily: theme.mono, fontWeight: 900, fontSize: 28 }}>{b.v} 000</div>
                  <div style={{ width: 130, height: b.v * 1.6, borderRadius: 10, background: `linear-gradient(180deg, ${b.col}, ${b.col}55)` }} />
                  <Label size={22} color={C.textPrimary}>{b.t}</Label>
                </div>
              </Pop>
            ))}
            {frame >= tNet && (
              <Pop at={tNet}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                  <div style={{ color: C.accentBright, fontFamily: theme.mono, fontWeight: 900, fontSize: 30 }}>110 000</div>
                  <div style={{ width: 130, height: 110 * 1.6, borderRadius: 10, background: `linear-gradient(180deg, ${C.accentBright}, ${C.accent}55)` }} />
                  <Label size={22} color={C.textPrimary}>nette</Label>
                </div>
              </Pop>
            )}
          </div>
          {frame >= tOi && (
            <div style={{ position: "absolute", left: 800, top: 20, width: 900 }}>
              <Pop at={tOi}>
                <Panel style={{ padding: 22 }}>
                  <Label size={24} color={C.textPrimary}>intérêt ouvert total</Label>
                  <div style={{ position: "relative", height: 60, marginTop: 12, borderRadius: 12, background: C.panelAlt, overflow: "hidden", width: 820 * (oi / 1000) }}>
                    {frame >= tPart && <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${(110 / oi) * 100}%`, background: C.accentBright }} />}
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
                    <Label size={22}>{Math.round(oi)} 000 contrats</Label>
                    {frame >= tPart && (
                      <Big size={44} color={C.accentBright}>
                        <AnimatedNumber from={share} to={share} format={(n) => `${Math.round(n)} %`} />
                      </Big>
                    )}
                  </div>
                </Panel>
              </Pop>
            </div>
          )}
          {frame >= t22 && frame < tDouble && (
            <div style={{ position: "absolute", left: 800, top: 230 }}>
              <Pop at={t22}>
                <div style={{ fontFamily: theme.mono, fontSize: 36, fontWeight: 900, color: C.textPrimary }}>110 000 ÷ 500 000 = 22 %</div>
              </Pop>
            </div>
          )}
          {frame >= t11 && (
            <div style={{ position: "absolute", left: 800, top: 230 }}>
              <Pop at={t11}>
                <div style={{ fontFamily: theme.mono, fontSize: 36, fontWeight: 900, color: C.textPrimary }}>110 000 ÷ 1 000 000 = 11 %</div>
              </Pop>
            </div>
          )}
          {frame >= tDeux && (
            <div style={{ position: "absolute", left: 0, right: 0, top: 500, display: "flex", justifyContent: "center" }}>
              <Pop at={tDeux}>
                <Pill text="nombre de contrats ≠ exposition rapportée au marché · aucun n'est une règle d'achat" size={28} filled />
              </Pop>
            </div>
          )}
        </div>
      </Beat>
    </SceneShell>
  );
};

export const Etf: React.FC<SceneProps> = ({ words, durationInFrames }) => {
  const frame = useCurrentFrame();
  const cue = makeCue(words);
  const tCanal = cue("deuxieme canal");
  const tAvoirs = cue("leurs avoirs");
  const tVar = cue("leurs variations");
  const tUnit = cue("un flux peut");
  const tMel = cue("mais un flux en dollars");
  const tTonnes = cue("les tonnes sont");
  const tCre = cue("les creations");
  const tClair = cue("mais les heures");
  const units = ["tonnes", "onces", "parts", "dollars"];

  return (
    <SceneShell eyebrow="F10 · Fonds cotés adossés à l'or" title="Du métal réel dans un coffre" durationInFrames={durationInFrames}>
      <Sfx file="pop.wav" at={tCanal} volume={0.4} />
      <Sfx file="whoosh.wav" at={tUnit} volume={0.4} />
      <Sfx file="bass.wav" at={tMel} volume={0.4} />
      <Sfx file="chime.wav" at={tTonnes} volume={0.45} />
      <Beat from={0} style={{ left: 0, top: 0 }}>
        <div style={{ position: "relative", width: STAGE_W, height: 690 }}>
          <div style={{ position: "absolute", left: 60, top: 20 }}>
            <Pop at={tCanal}>
              <Panel glow style={{ width: 620, padding: 26 }}>
                <Big size={30} color={C.accentBright}>le coffre du fonds</Big>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 16, width: 540 }}>
                  {Array.from({ length: 18 }).map((_, i) => (
                    <Pop key={i} at={tAvoirs + i * 2}>
                      <GoldBarIcon size={80} />
                    </Pop>
                  ))}
                </div>
                {frame >= tVar && <Label size={23} color={C.textPrimary}>ses variations : un canal de la demande d&apos;investissement</Label>}
              </Panel>
            </Pop>
          </div>
          <div style={{ position: "absolute", left: 780, top: 20, width: 940, display: "flex", flexDirection: "column", gap: 20 }}>
            {frame >= tUnit && (
              <Pop at={tUnit}>
                <div style={{ display: "flex", gap: 12 }}>
                  {units.map((u, i) => (
                    <Pop key={u} at={tUnit + i * 8}>
                      <Pill text={u} color={u === "tonnes" && frame >= tTonnes ? C.positive : u === "dollars" && frame >= tMel ? C.negative : C.context} size={28} filled={(u === "tonnes" && frame >= tTonnes) || (u === "dollars" && frame >= tMel)} />
                    </Pop>
                  ))}
                </div>
              </Pop>
            )}
            {frame >= tMel && (
              <Pop at={tMel}>
                <Panel style={{ padding: "14px 22px", borderColor: C.negative }}>
                  <Label size={25} color={C.textPrimary}>en dollars : quantité + variation du prix mélangées</Label>
                </Panel>
              </Pop>
            )}
            {frame >= tTonnes && (
              <Pop at={tTonnes}>
                <Panel style={{ padding: "14px 22px", borderColor: C.positive }}>
                  <Label size={25} color={C.textPrimary}>en tonnes : le stock physique, plus propre</Label>
                </Panel>
              </Pop>
            )}
            {frame >= tCre && (
              <Pop at={tCre}>
                <Label size={24} color={C.textPrimary}>créations et rachats de parts ↔ métal</Label>
              </Pop>
            )}
            {frame >= tClair && (
              <Pop at={tClair}>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  {["heures de clôture", "fonds couverts", "frais", "conversions de devises"].map((t) => (
                    <Pill key={t} text={t} size={22} />
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

