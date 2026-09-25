// F13 v4 — scenes 08-14 (failures, scenario tree, before/during/after, pitfalls, terminal, glossary, recap).
import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { theme } from "../theme";
import { Sfx, makeCue, Panel, GoldBarIcon, useBreathe } from "./shared";
import type { SceneProps } from "./shared";
import { Beat, Pop, Person, Cursor, ClockIcon, DollarIcon, ArrowGlyph, clamp } from "./characters";
import { SceneShell, Center, Big, Label, STAGE_W } from "./stage";
import { Pill, CrossDraw, CalendarPage } from "./props5";
import { CheckItem, Verdict } from "./dash";

const C = theme.colors;
const S: React.FC<{ children: React.ReactNode }> = ({ children }) => <div style={{ position: "relative", width: STAGE_W, height: 690 }}>{children}</div>;
const At: React.FC<{ x: number; y: number; children: React.ReactNode; w?: number }> = ({ x, y, children, w }) => (
  <div style={{ position: "absolute", left: x, top: y, width: w }}>{children}</div>
);

// ---------------------------------------------------------------------------
export const WhenItFails: React.FC<SceneProps> = ({ words, durationInFrames }) => {
  const frame = useCurrentFrame();
  const cue = makeCue(words);
  const tBreaks = cue("et parfois la chaine casse");
  const tGrowth = cue("quand la peur pour la croissance");
  const tPriced = cue("quand la surprise etait deja");
  const tRev = cue("quand les revisions");
  const tLiq = cue("quand la liquidite est faible");
  const tConf = cue("ou quand un choc de confiance");
  const tRemember = cue("retiens une chose");
  const tF11 = cue("c est exactement ce qu on a vu dans f11");
  const CASES = [
    { at: tGrowth, t: "la peur pour la croissance l'emporte sur l'inflation" },
    { at: tPriced, t: "la surprise était déjà dans les prix" },
    { at: tRev, t: "les révisions compensent le chiffre du jour" },
    { at: tLiq, t: "liquidité faible, mouvements désordonnés" },
  ];
  const volCurve = Array.from({ length: 50 }, (_, i) => {
    const x = (i / 49) * 700;
    const y = i < 30 ? 200 - i * 5 : 200 - 150 + (i - 30) * 7 > 190 ? 190 : 200 - 150 + (i - 30) * 7;
    return `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
  const vp = interpolate(frame, [tF11, tF11 + 60], [0, 1], clamp);
  return (
    <SceneShell eyebrow="F13 · Quand la chaîne casse" title="La théorie ne se réalise pas toujours" durationInFrames={durationInFrames}>
      <Sfx file="bass.wav" at={tBreaks} volume={0.4} />
      {CASES.map((c) => (
        <Sfx key={c.t} file="pop.wav" at={c.at} volume={0.3} />
      ))}
      <Sfx file="bass.wav" at={tConf} volume={0.45} />
      <Sfx file="chime.wav" at={tRemember} volume={0.45} />
      <Beat from={tBreaks} to={tRemember} style={{ left: 0, top: 0 }}>
        <S>
          <At x={60} y={10} w={880}>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {CASES.map((c, i) => (
                <CheckItem key={c.t} at={c.at} n={String(i + 1)} text={c.t} color={C.negative} width={860} />
              ))}
            </div>
          </At>
          {frame >= tConf && (
            <At x={1000} y={40} w={700}>
              <Pop at={tConf}>
                <Panel glow style={{ textAlign: "center" }}>
                  <Label size={26} color={C.textPrimary}>choc de confiance : tout le monde cherche un refuge</Label>
                  <div style={{ display: "flex", justifyContent: "center", gap: 60, marginTop: 20 }}>
                    <div>
                      <DollarIcon size={110} />
                      <ArrowGlyph up color={C.positive} size={60} />
                    </div>
                    <div>
                      <GoldBarIcon size={110} />
                      <ArrowGlyph up color={C.positive} size={60} />
                    </div>
                  </div>
                  <Label size={26}>dollar ET or montent ensemble</Label>
                </Panel>
              </Pop>
            </At>
          )}
        </S>
      </Beat>
      <Beat from={tRemember} style={{ left: 0, top: 0 }}>
        <Center column gap={30}>
          <Big size={50}>volatilité d&apos;événement = risque de MOUVEMENT</Big>
          <Big size={44} color={C.negative}>pas sa direction</Big>
          {frame >= tF11 && (
            <Pop at={tF11}>
              <Panel style={{ textAlign: "center" }}>
                <Label size={24}>rappel F11 · volatilité implicite autour d&apos;une annonce</Label>
                <svg width={700} height={220}>
                  <path d={volCurve} stroke={C.violet} strokeWidth={5} fill="none" pathLength={1} strokeDasharray={`${vp} 1`} />
                  <line x1={420} x2={420} y1={0} y2={210} stroke={C.textMuted} strokeDasharray="6 6" />
                  <text x={430} y={24} fill={C.textSecondary} fontSize={20}>annonce</text>
                </svg>
                <Label size={24} color={C.textPrimary}>monte avant · s&apos;écrase juste après</Label>
              </Panel>
            </Pop>
          )}
        </Center>
      </Beat>
    </SceneShell>
  );
};

// ---------------------------------------------------------------------------
export const ScenarioTree: React.FC<SceneProps> = ({ words, durationInFrames }) => {
  const frame = useCurrentFrame();
  const cue = makeCue(words);
  const tHow = cue("alors comment se preparer");
  const tEve = cue("exemple la veille");
  const tBranches = cue("il ecrit trois branches");
  const tUp = cue("premiere branche");
  const tDown = cue("deuxieme branche");
  const tNear = cue("troisieme branche");
  const tValid = cue("et une reaction limitee");
  const tOrganize = cue("ces scenarios organisent");
  const BR = [
    { at: tUp, t: "surprise à la hausse", c: C.negative, lines: ["anticipations de taux ↑ ?", "taux réels et dollar ↑ ?", "pression sur l'or : à confirmer"] },
    { at: tDown, t: "surprise à la baisse", c: C.positive, lines: ["plus de baisses de taux ?", "peur pour la croissance → demande de dollars ?"] },
    { at: tNear, t: "proche du consensus", c: C.textSecondary, lines: ["révisions · salaires · positionnement", "réaction limitée = valide"] },
  ];
  const grow = (at: number) => interpolate(frame, [at, at + 24], [0, 1], { ...clamp, easing: theme.ease.out });
  return (
    <SceneShell eyebrow="F13 · Arbre de scénarios" title="Se préparer sans prédire" durationInFrames={durationInFrames}>
      <Sfx file="pop.wav" at={tEve} volume={0.35} />
      <Sfx file="whoosh.wav" at={tUp} volume={0.35} />
      <Sfx file="whoosh.wav" at={tDown} volume={0.35} />
      <Sfx file="whoosh.wav" at={tNear} volume={0.35} />
      <Sfx file="chime.wav" at={tOrganize} volume={0.45} />
      <S>
        <At x={20} y={200}>
          <Pop at={tEve}>
            <CalendarPage top="DEMAIN · EMPLOI" big="8:30" size={220} />
          </Pop>
        </At>
        {frame >= tBranches && (
          <svg width={STAGE_W} height={690} style={{ position: "absolute", left: 0, top: 0 }}>
            {BR.map((b, i) => {
              const y = 90 + i * 210;
              const g = grow(b.at);
              return <path key={b.t} d={`M260,${330} C360,${330} 380,${y} ${260 + 240 * g},${y}`} stroke={b.c} strokeWidth={5} fill="none" opacity={g} />;
            })}
          </svg>
        )}
        {BR.map((b, i) =>
          frame >= b.at ? (
            <At key={b.t} x={520} y={20 + i * 210} w={1160}>
              <Pop at={b.at}>
                <Panel style={{ padding: "14px 22px", borderColor: b.c }}>
                  <Big size={32} color={b.c}>{b.t}</Big>
                  <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 8 }}>
                    {b.lines.map((l) => (
                      <Pill key={l} text={l} size={22} color={b.c === C.textSecondary ? C.accentBright : b.c} />
                    ))}
                  </div>
                </Panel>
              </Pop>
            </At>
          ) : null,
        )}
        {frame >= tOrganize && (
          <At x={20} y={600} w={1700}>
            <Pop at={tOrganize}>
              <Pill text="organiser l'observation · ni ordres de trading, ni probabilités (sans modèle validé)" size={28} filled />
            </Pop>
          </At>
        )}
      </S>
    </SceneShell>
  );
};

// ---------------------------------------------------------------------------
export const BeforeAfter: React.FC<SceneProps> = ({ words, durationInFrames }) => {
  const frame = useCurrentFrame();
  const cue = makeCue(words);
  const tMethod = cue("la methode en trois temps");
  const tBefore = cue("avant l evenement");
  const tDuring = cue("pendant distingue");
  const tFed = cue("pendant une reunion de la fed");
  const tAfter = cue("apres compare");
  const tF3 = cue("puis examine f3");
  const tGold = cue("et seulement ensuite");
  const tKeep = cue("et garde les contradictions");
  const tAlt = cue("une explication alternative");
  const COLS = [
    { at: tBefore, t: "AVANT", col: C.amber, items: ["vérifier l'horloge", "écrire les canaux : « si ceci, je regarde cela »"] },
    { at: tDuring, t: "PENDANT", col: C.violet, items: ["préliminaire · révisé · complet", "le premier titre n'est pas toute l'histoire"] },
    { at: tAfter, t: "APRÈS", col: C.positive, items: ["réel vs référence", "F3 Fed · F2 taux · F6 dollar · F7 volatilité", "puis la réaction de l'or"] },
  ];
  return (
    <SceneShell eyebrow="F13 · La méthode" title="Avant, pendant, après" durationInFrames={durationInFrames}>
      <Sfx file="pop.wav" at={tBefore} volume={0.35} />
      <Sfx file="pop.wav" at={tDuring} volume={0.35} />
      <Sfx file="pop.wav" at={tAfter} volume={0.35} />
      <Sfx file="chime.wav" at={tKeep} volume={0.45} />
      <S>
        <At x={20} y={10} w={1700}>
          <div style={{ display: "flex", gap: 24 }}>
            {COLS.map((c) => (
              <div key={c.t} style={{ width: 550 }}>
                {frame >= c.at ? (
                  <Pop at={c.at}>
                    <Panel glow={frame < c.at + 150} style={{ borderColor: c.col, minHeight: 360 }}>
                      <Big size={44} color={c.col}>{c.t}</Big>
                      {c.items.map((it, i) => (
                        <Pop key={it} at={c.at + 30 + i * 40}>
                          <Label size={26} color={C.textPrimary}>• {it}</Label>
                        </Pop>
                      ))}
                      {c.t === "PENDANT" && frame >= tFed && <Label size={22} color={C.amber}>communiqué ≠ conférence de presse, parfois</Label>}
                      {c.t === "APRÈS" && frame >= tGold && <Label size={22} color={C.amber}>l&apos;or en DERNIER</Label>}
                    </Panel>
                  </Pop>
                ) : null}
              </div>
            ))}
          </div>
        </At>
        {frame >= tKeep && (
          <At x={20} y={440} w={1700}>
            <Pop at={tKeep}>
              <Panel style={{ display: "flex", alignItems: "center", gap: 30 }}>
                <Big size={36}>garde les contradictions</Big>
                {frame >= tAlt && <Label size={28} color={C.textPrimary}>une explication alternative n&apos;est pas une erreur : c&apos;est une information</Label>}
              </Panel>
            </Pop>
          </At>
        )}
      </S>
    </SceneShell>
  );
};

// ---------------------------------------------------------------------------
export const Mistakes: React.FC<SceneProps> = ({ words, durationInFrames }) => {
  const frame = useCurrentFrame();
  const cue = makeCue(words);
  const t1 = cue("piege un");
  const t2 = cue("piege deux");
  const tFedLabel = cue("reunion de la fed ne veut dire");
  const t3 = cue("et piege trois");
  const TRAPS = [
    { at: t1, t: "importance élevée = grand mouvement" },
    { at: t2, t: "titre de l'événement = prévision de direction" },
    { at: t3, t: "interpréter le premier titre avant les détails, les révisions et la réaction des marchés" },
  ];
  return (
    <SceneShell eyebrow="F13 · Pièges" title="Trois erreurs classiques" durationInFrames={durationInFrames}>
      <Sfx file="pop.wav" at={t1} volume={0.35} />
      <Sfx file="pop.wav" at={t2} volume={0.35} />
      <Sfx file="bass.wav" at={t3} volume={0.4} />
      <Center column gap={24}>
        {TRAPS.map((tr, i) =>
          frame >= tr.at ? (
            <Pop key={tr.t} at={tr.at}>
              <div style={{ position: "relative", width: 1400, padding: "20px 28px", borderRadius: 16, background: C.panel, border: `2px solid ${C.negative}` }}>
                <div style={{ color: C.negative, fontFamily: theme.mono, fontSize: 26, fontWeight: 900 }}>piège {i + 1}</div>
                <div style={{ color: C.textPrimary, fontSize: 34, fontWeight: 800 }}>{tr.t}</div>
                <div style={{ position: "absolute", right: 24, top: 20 }}>
                  <CrossDraw at={tr.at + 20} size={60} />
                </div>
                {i === 1 && frame >= tFedLabel && <Label size={24}>« Réunion de la Fed » ne dit ni hausse, ni baisse de l&apos;or</Label>}
              </div>
            </Pop>
          ) : (
            <div key={tr.t} style={{ height: 110 }} />
          ),
        )}
      </Center>
    </SceneShell>
  );
};

// ---------------------------------------------------------------------------
/** Faithful mock of apps/frontend/src/components/market/F13CalendarFace.tsx (day view). */
const CalendarFaceMock: React.FC<{ date: string; state: "events" | "empty" | "unavailable" | "unconfirmed"; hiNav?: boolean }> = ({ date, state, hiNav }) => {
  const EVENTS = [
    { n: "Core CPI m/m", e: "CPI hors alimentation et énergie, deux composantes volatiles — jugé plus représentatif de la tendance d'inflation sous-jacente, celle que la Fed surveille le plus attentivement." },
    { n: "CPI m/m", e: "Indice des prix à la consommation — mesure la vitesse à laquelle les prix des biens et services augmentent. C'est un baromètre d'inflation clé utilisé par les marchés pour anticiper la prochaine décision de la Fed." },
  ];
  return (
    <div style={{ width: 1100, background: C.panel, border: `1px solid ${C.hairline}`, borderRadius: 16, padding: "18px 22px", fontFamily: theme.font }}>
      <div style={{ color: C.textSecondary, fontSize: 18, letterSpacing: 2, marginBottom: 12 }}>F13 · ÉVÉNEMENTS</div>
      <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 16 }}>
        <div style={{ width: 44, height: 44, borderRadius: 10, border: `1.5px solid ${hiNav ? C.accent : C.hairline}`, color: C.textPrimary, fontSize: 28, display: "flex", alignItems: "center", justifyContent: "center" }}>‹</div>
        <span style={{ color: C.textPrimary, fontSize: 26, fontWeight: 800 }}>{date}</span>
        <div style={{ width: 44, height: 44, borderRadius: 10, border: `1.5px solid ${hiNav ? C.accent : C.hairline}`, color: C.textPrimary, fontSize: 28, display: "flex", alignItems: "center", justifyContent: "center" }}>›</div>
      </div>
      {state === "events" && (
        <div style={{ display: "flex", gap: 16 }}>
          {EVENTS.map((ev) => (
            <div key={ev.n} style={{ flex: 1, padding: "14px 16px", borderRadius: 12, background: C.panelAlt, border: `1px solid ${C.hairline}` }}>
              <div style={{ color: C.textPrimary, fontSize: 24, fontWeight: 800 }}>{ev.n}</div>
              <div style={{ color: C.textSecondary, fontSize: 18, lineHeight: 1.35, marginTop: 6 }}>{ev.e}</div>
            </div>
          ))}
        </div>
      )}
      {state === "empty" && <div style={{ color: C.textSecondary, fontSize: 22 }}>Aucun événement high-impact USD ce jour-là.</div>}
      {state === "unavailable" && <div style={{ color: C.textMuted, fontSize: 22 }}>Calendrier indisponible.</div>}
      {state === "unconfirmed" && <div style={{ color: C.textMuted, fontSize: 22 }}>Données non confirmées.</div>}
    </div>
  );
};

export const TerminalUsage: React.FC<SceneProps> = ({ words, durationInFrames }) => {
  const frame = useCurrentFrame();
  const cue = makeCue(words);
  const tNow = cue("dans le terminal maintenant");
  const tTop = cue("en haut la date");
  const tOnly = cue("le terminal n affiche que");
  const tSide = cue("plusieurs evenements le meme jour");
  const tTwo = cue("pour chacun deux choses");
  const tNever = cue("jamais de consensus");
  const tEmpty = cue("un jour sans evenement");
  const tSource = cue("et si la source ne repond pas");
  const tProvider = cue("le calendrier vient d un fournisseur");
  const tNoKpi = cue("il n y a aucun indicateur");
  const tReal = cue("pour les vrais chiffres");
  const tMeet = cue("f13 te donne le rendez vous");
  const state: "events" | "empty" | "unavailable" | "unconfirmed" = frame >= tSource + 90 ? "unconfirmed" : frame >= tSource ? "unavailable" : frame >= tEmpty ? "empty" : "events";
  const date = frame >= tEmpty && frame < tSource ? "sam. 27 sept." : "jeu. 25 sept.";
  return (
    <SceneShell eyebrow="F13 · Dans le terminal" title="Un calendrier, jour par jour" durationInFrames={durationInFrames}>
      <Sfx file="whoosh.wav" at={tNow} volume={0.4} />
      <Sfx file="click.wav" at={tTop + 40} volume={0.45} />
      <Sfx file="pop.wav" at={tTwo} volume={0.35} />
      <Sfx file="bass.wav" at={tNever} volume={0.4} />
      <Sfx file="click.wav" at={tEmpty} volume={0.45} />
      <Sfx file="chime.wav" at={tMeet} volume={0.45} />
      <Beat from={tNow} to={tProvider} style={{ left: 0, top: 0 }}>
        <S>
          <At x={40} y={10}>
            <CalendarFaceMock date={date} state={state} hiNav={frame >= tTop && frame < tOnly} />
            <Label size={18} color={C.textMuted}>reconstitution fidèle de la façade · exemple de jour</Label>
          </At>
          <At x={1180} y={10} w={520}>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {frame >= tTop && <Pop at={tTop}><Pill text="‹ jour précédent · jour suivant ›" size={24} /></Pop>}
              {frame >= tOnly && <Pop at={tOnly}><Pill text="seulement : fort impact · dollar US" size={24} color={C.amber} /></Pop>}
              {frame >= tSide && <Pop at={tSide}><Pill text="plusieurs le même jour : côte à côte" size={24} /></Pop>}
              {frame >= tTwo && <Pop at={tTwo}><Pill text="nom + explication simple" size={24} color={C.positive} /></Pop>}
              {frame >= tNever && (
                <Pop at={tNever}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {["consensus", "prévision", "chiffre précédent"].map((t) => (
                      <div key={t} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <CrossDraw at={tNever + 10} size={30} />
                        <Label size={24} color={C.textPrimary}>{t}</Label>
                      </div>
                    ))}
                    <Label size={20} color={C.amber}>volontaire</Label>
                  </div>
                </Pop>
              )}
              {frame >= tSource && <Pop at={tSource}><Pill text="il n'invente rien" size={26} filled /></Pop>}
            </div>
          </At>
          {frame >= tTop && frame < tOnly && (
            <Cursor
              path={[
                { at: tTop, x: 700, y: 300 },
                { at: tTop + 40, x: 300, y: 90, click: true },
              ]}
            />
          )}
          {frame >= tEmpty && frame < tSource && (
            <Cursor
              path={[
                { at: tEmpty - 10, x: 700, y: 300 },
                { at: tEmpty + 20, x: 300, y: 90, click: true },
              ]}
            />
          )}
        </S>
      </Beat>
      <Beat from={tProvider} style={{ left: 0, top: 0 }}>
        <S>
          <At x={60} y={20} w={1600}>
            <div style={{ display: "flex", gap: 24 }}>
              <Pop at={tProvider}>
                <Panel style={{ width: 520, textAlign: "center" }}>
                  <ClockIcon size={90} />
                  <Label size={26} color={C.textPrimary}>fournisseur de calendrier spécialisé</Label>
                  <Label size={24}>mis à jour une fois par jour</Label>
                </Panel>
              </Pop>
              {frame >= tNoKpi && (
                <Pop at={tNoKpi}>
                  <Panel style={{ width: 520, textAlign: "center" }}>
                    <Big size={36} color={C.textMuted}>aucun indicateur chiffré</Big>
                    <Big size={30} color={C.textMuted}>aucune étiquette favorable / défavorable</Big>
                  </Panel>
                </Pop>
              )}
            </div>
          </At>
          {frame >= tReal && (
            <At x={60} y={320} w={1600}>
              <Pop at={tReal}>
                <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
                  <Label size={30} color={C.textPrimary}>les vrais chiffres, une fois publiés :</Label>
                  <Pill text="F4 · inflation" size={30} color={C.negative} />
                  <Pill text="F5 · emploi" size={30} color={C.positive} />
                </div>
              </Pop>
            </At>
          )}
          {frame >= tMeet && (
            <At x={60} y={460} w={1600}>
              <Pop at={tMeet}>
                <Pill text="F13 = le rendez-vous · les autres familles = le contenu" size={34} filled />
              </Pop>
            </At>
          )}
        </S>
      </Beat>
    </SceneShell>
  );
};

// ---------------------------------------------------------------------------
export const GlossaryFlash: React.FC<SceneProps> = ({ words, durationInFrames }) => {
  const frame = useCurrentFrame();
  const cue = makeCue(words);
  const T = [
    { k: "catalyseur", d: "un événement d'information identifiable · sans direction propre", p: "catalyseur un evenement" },
    { k: "consensus", d: "un résumé des anticipations sondées · limites de méthode et de dispersion", p: "consensus un resume" },
    { k: "surprise", d: "résultat − référence attendue · définitions cohérentes", p: "surprise l ecart" },
    { k: "fenêtre active", d: "l'intervalle limité où l'information est publiée ou digérée", p: "fenetre active l intervalle" },
    { k: "transmission", d: "anticipations → taux → devises → flux → éventuellement l'or", p: "et transmission" },
  ];
  const ats = T.map((t) => cue(t.p));
  let cur = -1;
  ats.forEach((a, i) => {
    if (frame >= a) cur = i;
  });
  return (
    <SceneShell eyebrow="F13 · Glossaire" title="Le vocabulaire, en rafale" durationInFrames={durationInFrames}>
      {ats.map((a, i) => (
        <Sfx key={i} file="tick.wav" at={a} volume={0.3} />
      ))}
      <S>
        <At x={60} y={0} w={1600}>
          <div style={{ display: "flex", gap: 14 }}>
            {T.map((t, i) => (
              <div key={t.k} style={{ flex: 1, padding: "10px 12px", borderRadius: 10, textAlign: "center", border: `1.5px solid ${i === cur ? C.accent : C.hairline}`, background: i <= cur ? `${C.accent}18` : C.panel, color: i <= cur ? C.textPrimary : C.textMuted, fontSize: 24, fontWeight: 700 }}>
                {t.k}
              </div>
            ))}
          </div>
        </At>
        {cur >= 0 && (
          <At x={120} y={200} w={1500}>
            <Pop at={ats[cur]} key={cur}>
              <Panel glow style={{ textAlign: "center" }}>
                <Big size={70} color={C.accentBright}>{T[cur].k}</Big>
                <Big size={36}>{T[cur].d}</Big>
              </Panel>
            </Pop>
          </At>
        )}
      </S>
    </SceneShell>
  );
};

// ---------------------------------------------------------------------------
export const Recap: React.FC<SceneProps> = ({ words, durationInFrames }) => {
  const frame = useCurrentFrame();
  const cue = makeCue(words);
  const tGo = cue("pour resumer f13");
  const t1 = cue("un calendrier te dit quand");
  const t2 = cue("interprete la surprise");
  const t3 = cue("et actif ou aucun");
  const tEnd = cue("ne devine jamais");
  const breathe = useBreathe(0.3);
  return (
    <SceneShell eyebrow="F13 · Récap" title="Ce qu'il faut retenir" durationInFrames={durationInFrames}>
      <Sfx file="whoosh.wav" at={tGo} volume={0.35} />
      <Sfx file="pop.wav" at={t1} volume={0.3} />
      <Sfx file="pop.wav" at={t2} volume={0.3} />
      <Sfx file="pop.wav" at={t3} volume={0.3} />
      <Sfx file="chime.wav" at={tEnd} volume={0.55} />
      <Beat from={tGo} to={tEnd} style={{ left: 0, top: 0 }}>
        <Center column gap={20}>
          <CheckItem at={t1} n="1" text="un calendrier dit QUAND, pas QUOI ni la direction de l'or" width={1400} />
          <CheckItem at={t2} n="2" text="surprise vs référence définie, puis la chaîne flèche par flèche" width={1400} />
          <CheckItem at={t3} n="3" text="ACTIF / AUCUN : des états pratiques, jamais des signaux" width={1400} />
        </Center>
      </Beat>
      <Beat from={tEnd} style={{ left: 0, top: 0 }}>
        <Center column gap={30}>
          <div style={{ transform: `scale(${breathe.scale})` }}>
            <Big size={90} color={C.accentBright} glow>Ne devine jamais. Vérifie.</Big>
          </div>
          <Label size={30}>F13 · Événements et catalyseurs</Label>
        </Center>
      </Beat>
    </SceneShell>
  );
};

export const _keep = { Person, Verdict };
