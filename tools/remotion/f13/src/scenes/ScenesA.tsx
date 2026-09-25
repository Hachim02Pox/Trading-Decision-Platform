// F13 v4 — scenes 01-07 (clock, calendar, importance, active catalyst, surprise, CPI example, transmission).
import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { theme } from "../theme";
import { Sfx, makeCue, Panel, GoldBarIcon, useBreathe } from "./shared";
import type { SceneProps } from "./shared";
import { Beat, Pop, Person, Bubble, ClockIcon, Domino, FedSpeaker, Bird, DollarIcon, ArrowGlyph, clamp } from "./characters";
import { SceneShell, Center, Big, Label, STAGE_W } from "./stage";
import { Pill, CrossDraw, CheckDraw, Stamp, CalendarPage, ShieldGlyph } from "./props5";
import { CalcLine } from "./props11";
import { Flow, Verdict } from "./dash";

const C = theme.colors;
const S: React.FC<{ children: React.ReactNode }> = ({ children }) => <div style={{ position: "relative", width: STAGE_W, height: 690 }}>{children}</div>;
const At: React.FC<{ x: number; y: number; children: React.ReactNode; w?: number }> = ({ x, y, children, w }) => (
  <div style={{ position: "absolute", left: x, top: y, width: w }}>{children}</div>
);

/** Big analog clock whose hands sweep from `from`. */
const MarketClock: React.FC<{ size?: number; from: number; hour?: number; minute?: number }> = ({ size = 300, from, hour = 8, minute = 30 }) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [from, from + 50], [0, 1], { ...clamp, easing: theme.ease.out });
  const mAng = (minute / 60) * 360 * p + 360 * (1 - p) * 0.2;
  const hAng = ((hour % 12) / 12) * 360 + (minute / 60) * 30;
  const r = size / 2;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={r} cy={r} r={r - 8} fill={C.panel} stroke={C.accent} strokeWidth={6} />
      {Array.from({ length: 12 }, (_, i) => {
        const a = (i / 12) * Math.PI * 2;
        return <line key={i} x1={r + Math.sin(a) * (r - 24)} y1={r - Math.cos(a) * (r - 24)} x2={r + Math.sin(a) * (r - 40)} y2={r - Math.cos(a) * (r - 40)} stroke={C.textSecondary} strokeWidth={i % 3 === 0 ? 5 : 2} />;
      })}
      <line x1={r} y1={r} x2={r + Math.sin((hAng * Math.PI) / 180) * r * 0.5} y2={r - Math.cos((hAng * Math.PI) / 180) * r * 0.5} stroke={C.textPrimary} strokeWidth={9} strokeLinecap="round" />
      <line x1={r} y1={r} x2={r + Math.sin((mAng * Math.PI) / 180) * r * 0.72} y2={r - Math.cos((mAng * Math.PI) / 180) * r * 0.72} stroke={C.accentBright} strokeWidth={6} strokeLinecap="round" />
      <circle cx={r} cy={r} r={10} fill={C.accentBright} />
    </svg>
  );
};

// ---------------------------------------------------------------------------
export const Intro: React.FC<SceneProps> = ({ words, durationInFrames }) => {
  const frame = useCurrentFrame();
  const cue = makeCue(words);
  const tThu = cue("jeudi");
  const tWed = cue("mercredi soir");
  const tWhich = cue("mais dans quel sens");
  const tExactly = cue("c est exactement la question");
  const tWhen = cue("il dit quand");
  const tNeither = cue("il ne dit ni");
  const tF13 = cue("f13 c est l horloge");
  const tLook = cue("elle te dit quand regarder");
  const breathe = useBreathe(0.2);
  return (
    <SceneShell eyebrow="F13 · Événements et catalyseurs" title="L'horloge du marché" durationInFrames={durationInFrames}>
      <Sfx file="tick.wav" at={tThu} volume={0.4} />
      <Sfx file="pop.wav" at={tWed} volume={0.4} />
      <Sfx file="bass.wav" at={tWhich} volume={0.4} />
      <Sfx file="whoosh.wav" at={tExactly} volume={0.4} />
      <Sfx file="chime.wav" at={tF13} volume={0.55} />
      <Beat from={0} to={tExactly} style={{ left: 0, top: 0 }}>
        <S>
          <At x={120} y={60}>
            <Pop at={tThu}>
              <CalendarPage top="JEUDI · INFLATION" big="8:30" size={300} />
            </Pop>
          </At>
          {frame >= tWed && (
            <At x={760} y={200}>
              <Pop at={tWed}>
                <Person size={220} color={C.positive} label="Hachim" />
              </Pop>
            </At>
          )}
          {frame >= tWed + 30 && (
            <At x={980} y={80}>
              <Pop at={tWed + 30}>
                <Bubble text="gros chiffre demain… l'or va bouger fort !" width={440} tail="left" />
              </Pop>
            </At>
          )}
          {frame >= tWhich && (
            <At x={1100} y={330}>
              <Pop at={tWhich}>
                <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
                  <ArrowGlyph up color={C.positive} size={90} />
                  <Big size={80} color={C.amber}>?</Big>
                  <ArrowGlyph up={false} color={C.negative} size={90} />
                </div>
              </Pop>
            </At>
          )}
        </S>
      </Beat>
      <Beat from={tExactly} to={tF13} style={{ left: 0, top: 0 }}>
        <Center gap={100}>
          <MarketClock from={tExactly} size={320} />
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {frame >= tWhen && (
              <Pop at={tWhen}>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <CheckDraw at={tWhen + 6} size={50} />
                  <Big size={44}>QUAND l&apos;information arrive</Big>
                </div>
              </Pop>
            )}
            {frame >= tNeither && (
              <Pop at={tNeither}>
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <CrossDraw at={tNeither + 10} size={50} />
                    <Big size={40} color={C.textMuted}>ce qu&apos;elle contiendra</Big>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <CrossDraw at={tNeither + 40} size={50} />
                    <Big size={40} color={C.textMuted}>la direction de l&apos;or</Big>
                  </div>
                </div>
              </Pop>
            )}
          </div>
        </Center>
      </Beat>
      <Beat from={tF13} style={{ left: 0, top: 0 }}>
        <Center column gap={30}>
          <div style={{ transform: `scale(${breathe.scale})` }}>
            <Big size={80} color={C.accentBright} glow>F13 · l&apos;horloge du marché</Big>
          </div>
          {frame >= tLook && (
            <Pop at={tLook}>
              <div style={{ display: "flex", gap: 24 }}>
                <Pill text="QUAND regarder les autres familles" size={32} filled />
                <Pill text="pas QUOI en conclure" size={32} color={C.negative} />
              </div>
            </Pop>
          )}
        </Center>
      </Beat>
    </SceneShell>
  );
};

// ---------------------------------------------------------------------------
export const Calendar: React.FC<SceneProps> = ({ words, durationInFrames }) => {
  const frame = useCurrentFrame();
  const cue = makeCue(words);
  const tStart = cue("commencons par ce qu un calendrier");
  const tKnows = cue("il connait l heure");
  const tFed = cue("la decision de la fed");
  const tMatter = cue("ces publications comptent");
  const tNot = cue("ce qu il ne connait pas");
  const tRigor = cue("et meme l horaire demande");
  const tNY = cue("l inflation americaine sort a");
  const tParis = cue("c est aussi l heure de quebec");
  const tZones = cue("il faut gerer les fuseaux");
  const tVerify = cue("avant de dire qu un evenement");
  const KNOWN = ["heure", "identité de l'événement"];
  const UNKNOWN = ["résultat", "surprise", "ampleur du mouvement", "direction"];
  return (
    <SceneShell eyebrow="F13 · Le calendrier" title="Ce qui est connu à l'avance… et ce qui ne l'est pas" durationInFrames={durationInFrames}>
      <Sfx file="pop.wav" at={tKnows} volume={0.35} />
      <Sfx file="pop.wav" at={tFed} volume={0.35} />
      <Sfx file="bass.wav" at={tNot} volume={0.4} />
      <Sfx file="whoosh.wav" at={tRigor} volume={0.4} />
      <Sfx file="chime.wav" at={tVerify} volume={0.45} />
      <Beat from={tStart} to={tRigor} style={{ left: 0, top: 0 }}>
        <S>
          <At x={60} y={20} w={760}>
            <Panel style={{ borderColor: C.positive }}>
              <Big size={36} color={C.positive}>connu à l&apos;avance</Big>
              {KNOWN.map((k, i) =>
                frame >= tKnows + i * 20 ? (
                  <Pop key={k} at={tKnows + i * 20}>
                    <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 12 }}>
                      <CheckDraw at={tKnows + i * 20} size={40} />
                      <Label size={30} color={C.textPrimary}>{k}</Label>
                    </div>
                  </Pop>
                ) : null,
              )}
            </Panel>
            {frame >= tFed && (
              <div style={{ display: "flex", gap: 18, marginTop: 24 }}>
                <Pop at={tFed}>
                  <CalendarPage top="FED" big="14:00" size={170} />
                </Pop>
                <Pop at={tFed + 20}>
                  <CalendarPage top="INFLATION" big="8:30" size={170} />
                </Pop>
                <Pop at={tFed + 40}>
                  <CalendarPage top="EMPLOI" big="8:30" size={170} />
                </Pop>
              </div>
            )}
            {frame >= tMatter && <Label size={24}>elles mettent à jour ce que le marché croit : inflation · croissance · Fed</Label>}
          </At>
          {frame >= tNot && (
            <At x={900} y={20} w={780}>
              <Pop at={tNot}>
                <Panel style={{ borderColor: C.negative }}>
                  <Big size={36} color={C.negative}>inconnu</Big>
                  {UNKNOWN.map((k, i) => (
                    <div key={k} style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 12 }}>
                      <CrossDraw at={tNot + 20 + i * 18} size={40} />
                      <Label size={30} color={C.textPrimary}>{k}</Label>
                    </div>
                  ))}
                </Panel>
              </Pop>
            </At>
          )}
        </S>
      </Beat>
      <Beat from={tRigor} style={{ left: 0, top: 0 }}>
        <S>
          <At x={60} y={20} w={1600}>
            <div style={{ display: "flex", gap: 40 }}>
              {[
                { city: "New York", h: "8 h 30", at: tNY },
                { city: "Québec", h: "8 h 30", at: tParis },
                { city: "Paris", h: "14 h 30", at: tParis + 40 },
              ].map((c) =>
                frame >= c.at ? (
                  <Pop key={c.city} at={c.at}>
                    <Panel style={{ width: 460, textAlign: "center" }}>
                      <ClockIcon size={110} />
                      <Big size={40}>{c.h}</Big>
                      <Label size={26} color={C.textPrimary}>{c.city}</Label>
                    </Panel>
                  </Pop>
                ) : null,
              )}
            </div>
          </At>
          {frame >= tZones && (
            <At x={60} y={360} w={1600}>
              <Pop at={tZones}>
                <div style={{ display: "flex", gap: 18 }}>
                  <Pill text="fuseaux horaires" size={30} />
                  <Pill text="jours fériés" size={30} />
                  <Pill text="révisions des chiffres précédents" size={30} />
                </div>
              </Pop>
            </At>
          )}
          {frame >= tVerify && (
            <At x={60} y={470} w={1600}>
              <Pop at={tVerify}>
                <Pill text="« à venir » ou « en cours » ? → vérifier horodatage · fuseau · statut" size={32} filled />
              </Pop>
            </At>
          )}
        </S>
      </Beat>
    </SceneShell>
  );
};

// ---------------------------------------------------------------------------
export const Importance: React.FC<SceneProps> = ({ words, durationInFrames }) => {
  const frame = useCurrentFrame();
  const cue = makeCue(words);
  const tQ = cue("un evenement important");
  const tCond = cue("l importance est conditionnelle");
  const tTight = cue("un chiffre d inflation qui tombe pile");
  const tPol = cue("a l inverse une declaration politique");
  const tProx = cue("la proximite d un evenement change");
  const tBefore = cue("avant une annonce");
  const tNeither = cue("mais cette proximite n est ni");
  const tLook = cue("c est un moment ou il faudra regarder");
  const wiggle = (amp: number, seed: number) =>
    Array.from({ length: 60 }, (_, i) => `${i ? "L" : "M"}${(i / 59) * 620},${90 - Math.sin(i / 3 + seed) * amp * (i > 20 ? 1 : 0.2)}`).join(" ");
  return (
    <SceneShell eyebrow="F13 · L'importance" title="Important ne veut pas dire gros mouvement" durationInFrames={durationInFrames}>
      <Sfx file="pop.wav" at={tTight} volume={0.35} />
      <Sfx file="bass.wav" at={tPol} volume={0.45} />
      <Sfx file="whoosh.wav" at={tProx} volume={0.4} />
      <Sfx file="chime.wav" at={tLook} volume={0.45} />
      <Beat from={tQ} to={tProx} style={{ left: 0, top: 0 }}>
        <S>
          <At x={60} y={0} w={1600}>
            <Pop at={tCond}>
              <Pill text="l'importance est conditionnelle" size={34} filled />
            </Pop>
          </At>
          {frame >= tTight && (
            <At x={60} y={110} w={780}>
              <Pop at={tTight}>
                <Panel>
                  <Label size={26} color={C.textPrimary}>inflation pile sur un consensus très serré</Label>
                  <svg width={640} height={180}>
                    <path d={wiggle(6, 0)} stroke={C.accent} strokeWidth={4} fill="none" />
                  </svg>
                  <Label size={24}>→ presque rien</Label>
                </Panel>
              </Pop>
            </At>
          )}
          {frame >= tPol && (
            <At x={900} y={110} w={780}>
              <Pop at={tPol}>
                <Panel style={{ borderColor: C.negative }}>
                  <Label size={26} color={C.textPrimary}>déclaration politique que personne n&apos;attendait</Label>
                  <svg width={640} height={180}>
                    <path d={wiggle(70, 1)} stroke={C.negative} strokeWidth={4} fill="none" />
                  </svg>
                  <Label size={24}>→ domine toute la séance</Label>
                </Panel>
              </Pop>
            </At>
          )}
        </S>
      </Beat>
      <Beat from={tProx} style={{ left: 0, top: 0 }}>
        <S>
          <At x={80} y={40}>
            <CalendarPage top="DANS 1 H" big="!" size={220} />
          </At>
          {frame >= tBefore && (
            <At x={420} y={40} w={1200}>
              <Pop at={tBefore}>
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <Pill text="liquidité qui se réduit" size={30} />
                  <Pill text="intervenants qui se couvrent" size={30} />
                  <Pill text="moins de risque porté" size={30} />
                </div>
              </Pop>
            </At>
          )}
          {frame >= tNeither && (
            <At x={80} y={380} w={1600}>
              <Pop at={tNeither}>
                <div style={{ display: "flex", alignItems: "center", gap: 30 }}>
                  <Big size={48}>proximité</Big>
                  <Big size={60} color={C.negative}>≠</Big>
                  <Pill text="haussier" size={32} color={C.textMuted} />
                  <Pill text="baissier" size={32} color={C.textMuted} />
                </div>
              </Pop>
            </At>
          )}
          {frame >= tLook && (
            <At x={80} y={520} w={1600}>
              <Pop at={tLook}>
                <Pill text="pas un signal : un moment où il faudra regarder" size={34} filled />
              </Pop>
            </At>
          )}
        </S>
      </Beat>
    </SceneShell>
  );
};

// ---------------------------------------------------------------------------
export const Active: React.FC<SceneProps> = ({ words, durationInFrames }) => {
  const frame = useCurrentFrame();
  const cue = makeCue(words);
  const tSecond = cue("deuxieme notion");
  const tThree = cue("un catalyseur actif doit avoir trois");
  const tNamed = cue("un evenement nomme");
  const tRule = cue("une regle qui dit");
  const tWindow = cue("et une fenetre de temps");
  const tFed = cue("prends une reunion de la fed");
  const tDecision = cue("il y a la decision");
  const tStatement = cue("le communique");
  const tProj = cue("parfois les projections");
  const tPress = cue("puis la conference de presse");
  const tChange = cue("l interpretation peut changer");
  const tFlip = cue("et le marche se retourne");
  const tNone = cue("et quand rien n est en cours");
  const tNotMissing = cue("ce n est pas une donnee manquante");
  const tInvent = cue("le terminal evite volontairement");
  const STAGES = [
    { t: "décision", h: "14:00", at: tDecision },
    { t: "communiqué", h: "14:00", at: tStatement },
    { t: "projections", h: "parfois", at: tProj },
    { t: "conférence de presse", h: "14:30", at: tPress },
  ];
  const winP = interpolate(frame, [tWindow, tWindow + 40], [0, 1], { ...clamp, easing: theme.ease.out });
  return (
    <SceneShell eyebrow="F13 · Catalyseur actif" title="Un statut, avec un début et une fin" durationInFrames={durationInFrames}>
      <Sfx file="pop.wav" at={tNamed} volume={0.35} />
      <Sfx file="pop.wav" at={tRule} volume={0.35} />
      <Sfx file="pop.wav" at={tWindow} volume={0.35} />
      <Sfx file="whoosh.wav" at={tFed} volume={0.4} />
      <Sfx file="bass.wav" at={tFlip} volume={0.45} />
      <Sfx file="chime.wav" at={tNone} volume={0.45} />
      <Beat from={tSecond} to={tFed} style={{ left: 0, top: 0 }}>
        <S>
          {frame < tNamed && (
            <At x={0} y={200} w={STAGE_W}>
              <Pop at={tSecond + 10}>
                <div style={{ display: "flex", justifyContent: "center", gap: 30, alignItems: "center" }}>
                  <Big size={64} color={C.accentBright}>catalyseur actif</Big>
                  <Pill text="un statut borné" size={34} />
                </div>
              </Pop>
            </At>
          )}
          <At x={60} y={20} w={1600}>
            <div style={{ display: "flex", gap: 30 }}>
              {[
                { at: tNamed, t: "un événement nommé", s: "ex. réunion de la Fed" },
                { at: tRule, t: "une règle d'activation", s: "quand il devient actif" },
                { at: tWindow, t: "une fenêtre bornée", s: "un début, une fin" },
              ].map((b, i) =>
                frame >= b.at ? (
                  <Pop key={b.t} at={b.at}>
                    <Panel glow={i === 2} style={{ width: 500, textAlign: "center" }}>
                      <Big size={60} color={C.accentBright}>{i + 1}</Big>
                      <Big size={32}>{b.t}</Big>
                      <Label size={24}>{b.s}</Label>
                    </Panel>
                  </Pop>
                ) : null,
              )}
            </div>
          </At>
          {frame >= tWindow && (
            <At x={60} y={380} w={1600}>
              <div style={{ position: "relative", height: 120 }}>
                <div style={{ position: "absolute", left: 0, right: 0, top: 56, height: 6, background: C.hairline, borderRadius: 3 }} />
                <div style={{ position: "absolute", left: 500, width: 600 * winP, top: 30, height: 60, background: `${C.accent}40`, border: `2px solid ${C.accent}`, borderRadius: 12 }} />
                <div style={{ position: "absolute", left: 520, top: 44, color: C.accentBright, fontSize: 26, fontWeight: 800, opacity: winP }}>fenêtre active</div>
              </div>
            </At>
          )}
        </S>
      </Beat>
      <Beat from={tFed} to={tNone} style={{ left: 0, top: 0 }}>
        <S>
          <At x={60} y={40}>
            <FedSpeaker size={220} talking={frame >= tPress} />
          </At>
          <At x={380} y={40} w={1320}>
            <div style={{ display: "flex", gap: 18 }}>
              {STAGES.map((s) =>
                frame >= s.at ? (
                  <Pop key={s.t} at={s.at}>
                    <Panel style={{ width: 300, textAlign: "center", padding: "18px 16px" }}>
                      <Big size={36} color={C.accentBright}>{s.h}</Big>
                      <Label size={24} color={C.textPrimary}>{s.t}</Label>
                    </Panel>
                  </Pop>
                ) : null,
              )}
            </div>
            <Label size={22}>heure de New York</Label>
          </At>
          {frame >= tChange && (
            <At x={380} y={300} w={1320}>
              <Pop at={tChange}>
                <div style={{ display: "flex", alignItems: "center", gap: 30 }}>
                  <Pill text="décision attendue" size={28} />
                  <div style={{ color: C.textSecondary, fontSize: 40 }}>→</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <Bird kind="hawk" size={120} />
                    <Pill text="conférence plus ferme que prévu" size={28} color={C.negative} />
                  </div>
                </div>
              </Pop>
            </At>
          )}
          {frame >= tFlip && (
            <At x={380} y={470} w={1320}>
              <Pop at={tFlip}>
                <Pill text="le marché se retourne → l'horodatage compte" size={32} filled />
              </Pop>
            </At>
          )}
        </S>
      </Beat>
      <Beat from={tNone} style={{ left: 0, top: 0 }}>
        <Center column gap={30}>
          <Panel glow style={{ padding: "22px 60px", textAlign: "center" }}>
            <Label size={24}>Catalyseur actif</Label>
            <Big size={80} color={C.textSecondary}>AUCUN</Big>
          </Panel>
          {frame >= tNotMissing && (
            <Pop at={tNotMissing}>
              <div style={{ display: "flex", gap: 18 }}>
                <Pill text="pas une donnée manquante" size={28} color={C.textMuted} />
                <Pill text="pas une promesse de calme" size={28} color={C.textMuted} />
                <Pill text="pas une direction" size={28} color={C.textMuted} />
              </div>
            </Pop>
          )}
          {frame >= tInvent && (
            <Pop at={tInvent}>
              <Big size={38} color={C.accentBright}>le terminal n&apos;invente pas de catalyseur pour remplir la case</Big>
            </Pop>
          )}
        </Center>
      </Beat>
    </SceneShell>
  );
};

// ---------------------------------------------------------------------------
export const Surprise: React.FC<SceneProps> = ({ words, durationInFrames }) => {
  const frame = useCurrentFrame();
  const cue = makeCue(words);
  const tThird = cue("troisieme notion");
  const tReact = cue("les marches ne reagissent pas");
  const tGap = cue("ils reagissent a l ecart");
  const tFormula = cue("pour une publication la surprise");
  const tSame = cue("a condition de comparer");
  const tRev = cue("les revisions des mois precedents");
  const tConsensus = cue("et le consensus lui meme");
  const tFed = cue("pour la fed la reference");
  const tUnchanged = cue("un taux inchange peut donc");
  const tSameEffect = cue("enfin une meme surprise");
  const expected = 0.2;
  const actual = frame >= tGap + 30 ? 0.3 : expected;
  return (
    <SceneShell eyebrow="F13 · La surprise" title="Le marché réagit à l'écart, pas au chiffre" durationInFrames={durationInFrames}>
      <Sfx file="bass.wav" at={tReact} volume={0.4} />
      <Sfx file="pop.wav" at={tGap + 30} volume={0.4} />
      <Sfx file="whoosh.wav" at={tFormula} volume={0.4} />
      <Sfx file="pop.wav" at={tConsensus} volume={0.35} />
      <Sfx file="whoosh.wav" at={tFed} volume={0.4} />
      <Sfx file="chime.wav" at={tSameEffect} volume={0.45} />
      <Beat from={tThird} to={tFed} style={{ left: 0, top: 0 }}>
        <S>
          <At x={80} y={20}>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 60, height: 380 }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ width: 170, height: 1000 * expected, background: C.context, borderRadius: 12 }} />
                <Label size={26} color={C.textPrimary}>attendu</Label>
              </div>
              {frame >= tGap && (
                <div style={{ textAlign: "center" }}>
                  <div style={{ width: 170, height: 1000 * actual * interpolate(frame, [tGap, tGap + 30], [0, 1], clamp), background: C.negative, borderRadius: 12 }} />
                  <Label size={26} color={C.textPrimary}>réel</Label>
                </div>
              )}
              {frame >= tGap + 40 && (
                <Pop at={tGap + 40}>
                  <Big size={38} color={C.amber}>← l&apos;écart = la surprise</Big>
                </Pop>
              )}
            </div>
          </At>
          <At x={1080} y={20} w={620}>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {frame >= tFormula && (
                <Pop at={tFormula}>
                  <Panel glow>
                    <Big size={38}>surprise = réel − consensus</Big>
                  </Panel>
                </Pop>
              )}
              {frame >= tSame && (
                <Pop at={tSame}>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
                    {["même définition", "même correction saisonnière", "même unité", "même période"].map((t) => (
                      <Pill key={t} text={t} size={24} />
                    ))}
                  </div>
                </Pop>
              )}
              {frame >= tRev && (
                <Pop at={tRev}>
                  <Pill text="+ les révisions des mois précédents" size={26} color={C.amber} />
                </Pop>
              )}
              {frame >= tConsensus && (
                <Pop at={tConsensus}>
                  <Panel style={{ padding: "12px 18px", borderColor: C.negative }}>
                    <Label size={25} color={C.textPrimary}>consensus = un résumé d&apos;anticipations</Label>
                    <Label size={23}>dispersion · parfois périmé · pas un fait sur l&apos;avenir</Label>
                  </Panel>
                </Pop>
              )}
            </div>
          </At>
        </S>
      </Beat>
      <Beat from={tFed} style={{ left: 0, top: 0 }}>
        <S>
          <At x={60} y={20} w={900}>
            <Panel>
              <Big size={34}>référence pour la Fed</Big>
              {["la décision anticipée", "la trajectoire future des taux", "la communication"].map((t, i) => (
                <Pop key={t} at={tFed + 30 + i * 25}>
                  <Label size={28} color={C.textPrimary}>+ {t}</Label>
                </Pop>
              ))}
            </Panel>
          </At>
          {frame >= tUnchanged && (
            <At x={1000} y={10} w={700}>
              <Pop at={tUnchanged}>
                <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                  <Panel style={{ padding: "12px 18px" }}>
                    <Label size={24}>taux</Label>
                    <Big size={40}>inchangé</Big>
                  </Panel>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <Bird kind="hawk" size={110} />
                    <Label size={22} color={C.negative}>plus ferme</Label>
                  </div>
                  <Label size={26}>ou</Label>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <Bird kind="dove" size={110} />
                    <Label size={22} color={C.positive}>plus accommodant</Label>
                  </div>
                </div>
              </Pop>
            </At>
          )}
          {frame >= tSameEffect && (
            <At x={60} y={380} w={1600}>
              <Pop at={tSameEffect}>
                <Panel glow style={{ textAlign: "center" }}>
                  <Big size={38}>même surprise ≠ même effet</Big>
                  <div style={{ display: "flex", gap: 16, justifyContent: "center", marginTop: 10 }}>
                    <Pill text="positionnement" size={26} />
                    <Pill text="liquidité" size={26} />
                    <Pill text="réaction de la Fed du moment" size={26} />
                  </div>
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
export const CpiExample: React.FC<SceneProps> = ({ words, durationInFrames }) => {
  const frame = useCurrentFrame();
  const cue = makeCue(words);
  const tEx = cue("un exemple pour calculer");
  const tWait = cue("imaginons que hachim attend");
  const tCons = cue("le consensus est a");
  const tOut = cue("et le chiffre sort a");
  const tStep1 = cue("premiere etape le calcul");
  const tBp = cue("soit 10 points de base");
  const tStep2 = cue("deuxieme etape les verifications");
  const tF3 = cue("dans f3");
  const tF2 = cue("dans f2");
  const tF6 = cue("dans f6");
  const tGold = cue("et enfin que fait l or");
  const tInfo = cue("la surprise inflationniste c est l information");
  const tVerify = cue("il la verifie");
  const CHECKS = [
    { at: tF3, fam: "F3", q: "le marché retire-t-il des baisses de taux ?" },
    { at: tF2, fam: "F2", q: "les taux réels montent-ils ?" },
    { at: tF6, fam: "F6", q: "le dollar se renforce-t-il ?" },
    { at: tGold, fam: "OR", q: "que fait l'or lui-même ?" },
  ];
  return (
    <SceneShell eyebrow="F13 · Exemple chiffré" title="Calculer d'abord, interpréter ensuite" durationInFrames={durationInFrames}>
      <Sfx file="pop.wav" at={tWait} volume={0.35} />
      <Sfx file="bass.wav" at={tOut} volume={0.4} />
      <Sfx file="click.wav" at={tBp} volume={0.45} />
      <Sfx file="whoosh.wav" at={tStep2} volume={0.4} />
      <Sfx file="chime.wav" at={tInfo} volume={0.45} />
      <Beat from={tEx} to={tStep2} style={{ left: 0, top: 0 }}>
        <S>
          <At x={80} y={80}>
            <Pop at={tWait}>
              <Person size={220} color={C.positive} label="Hachim" />
            </Pop>
          </At>
          <At x={440} y={30} w={1250}>
            <div style={{ display: "flex", gap: 24 }}>
              {[
                { at: tCons, k: "consensus", v: "0,2 %", col: C.context },
                { at: tCons + 50, k: "précédent", v: "0,2 %", col: C.textSecondary },
                { at: tOut, k: "réel", v: "0,3 %", col: C.negative },
              ].map((b) =>
                frame >= b.at ? (
                  <Pop key={b.k} at={b.at}>
                    <Panel style={{ width: 360, textAlign: "center", borderColor: b.col }}>
                      <Label size={26}>{b.k}</Label>
                      <Big size={64} color={b.col}>{b.v}</Big>
                    </Panel>
                  </Pop>
                ) : null,
              )}
            </div>
            <Label size={22}>inflation sous-jacente sur un mois · chiffres hypothétiques</Label>
          </At>
          <At x={440} y={330} w={1250}>
            <CalcLine at={tStep1} left="0,3 − 0,2 =" right="+0,1 point de pourcentage" size={46} />
            <div style={{ marginTop: 20 }}>
              <CalcLine at={tBp} left="=" right="+10 points de base" size={52} />
            </div>
          </At>
        </S>
      </Beat>
      <Beat from={tStep2} to={tInfo} style={{ left: 0, top: 0 }}>
        <S>
          <At x={80} y={20} w={1600}>
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              {CHECKS.map((c) =>
                frame >= c.at ? (
                  <Pop key={c.fam} at={c.at}>
                    <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
                      <div style={{ width: 110, height: 80, borderRadius: 14, background: c.fam === "OR" ? `${C.accent}33` : C.panel, border: `2px solid ${c.fam === "OR" ? C.accent : C.hairline}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {c.fam === "OR" ? <GoldBarIcon size={60} /> : <Big size={34} color={C.accentBright}>{c.fam}</Big>}
                      </div>
                      <Label size={32} color={C.textPrimary}>{c.q}</Label>
                      <Verdict at={c.at + 40} kind="doubt" text="à vérifier" />
                    </div>
                  </Pop>
                ) : null,
              )}
            </div>
          </At>
        </S>
      </Beat>
      <Beat from={tInfo} style={{ left: 0, top: 0 }}>
        <Center column gap={30}>
          <div style={{ display: "flex", gap: 30, alignItems: "center" }}>
            <Panel style={{ width: 620, textAlign: "center" }}>
              <Label size={24}>la surprise</Label>
              <Big size={38}>= l&apos;information</Big>
            </Panel>
            <Panel glow style={{ width: 720, textAlign: "center" }}>
              <Label size={24}>la transmission observée</Label>
              <Big size={38} color={C.accentBright}>= l&apos;interprétation pour l&apos;or</Big>
            </Panel>
          </div>
          {frame >= tVerify && (
            <Pop at={tVerify}>
              <Pill text="Hachim ne suppose pas la chaîne des manuels : il la vérifie" size={32} filled />
            </Pop>
          )}
        </Center>
      </Beat>
    </SceneShell>
  );
};

// ---------------------------------------------------------------------------
export const Transmission: React.FC<SceneProps> = ({ words, durationInFrames }) => {
  const frame = useCurrentFrame();
  const cue = makeCue(words);
  const tChain = cue("voici la chaine classique");
  const tS = cue("la surprise");
  const tFed = cue("puis moins d assouplissement");
  const tRates = cue("puis une hausse du taux");
  const tUsd = cue("puis un dollar plus fort");
  const tGold = cue("et au bout une pression sur l or");
  const tJobs = cue("avec un rapport sur l emploi plus faible");
  const tEach = cue("mais chaque fleche doit etre verifiee");
  const tLabel = cue("l etiquette de l evenement");
  const tInspect = cue("f13 te dit quand inspecter");
  const reversed = frame >= tJobs && frame < tEach;
  return (
    <SceneShell eyebrow="F13 · Transmission vers l'or" title="Une chaîne de dominos… à vérifier un par un" durationInFrames={durationInFrames}>
      <Sfx file="tick.wav" at={tS} volume={0.35} />
      <Sfx file="tick.wav" at={tFed} volume={0.35} />
      <Sfx file="tick.wav" at={tRates} volume={0.35} />
      <Sfx file="tick.wav" at={tUsd} volume={0.35} />
      <Sfx file="bass.wav" at={tGold} volume={0.4} />
      <Sfx file="whoosh.wav" at={tJobs} volume={0.4} />
      <Sfx file="chime.wav" at={tEach} volume={0.45} />
      <S>
        <At x={20} y={20} w={1700}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <Domino at={tS} label={reversed ? "emploi plus faible" : "surprise d'inflation"} icon={<CalendarPage top="SURPRISE" big="!" size={90} />} tone={C.amber} />
            <Domino at={tFed} label={reversed ? "plus de baisses de taux" : "moins d'assouplissement"} icon={<FedSpeaker size={110} talking={false} />} tone={C.context} />
            <Domino at={tRates} label={reversed ? "taux réels ↓" : "2 ans et taux réels ↑"} icon={<ArrowGlyph up={!reversed} color={reversed ? C.positive : C.negative} size={90} />} tone={C.violet} />
            <Domino at={tUsd} label={reversed ? "dollar ↓" : "dollar ↑"} icon={<DollarIcon size={90} color={reversed ? C.positive : C.negative} />} tone={C.flipBlue} />
            <Domino at={tGold} label={reversed ? "moins de pression sur l'or" : "pression sur l'or (coût d'opportunité)"} icon={<GoldBarIcon size={90} />} tone={reversed ? C.positive : C.negative} />
          </div>
        </At>
        {frame >= tEach && (
          <At x={20} y={330} w={1700}>
            <div style={{ display: "flex", justifyContent: "space-around", paddingLeft: 170, paddingRight: 170 }}>
              {[0, 1, 2, 3].map((i) => (
                <Verdict key={i} at={tEach + 20 + i * 15} kind="doubt" text="vérifier" />
              ))}
            </div>
          </At>
        )}
        {frame >= tLabel && (
          <At x={60} y={440} w={1600}>
            <Pop at={tLabel}>
              <Pill text="l'étiquette de l'événement ne fixe jamais le résultat" size={32} color={C.negative} />
            </Pop>
          </At>
        )}
        {frame >= tInspect && (
          <At x={60} y={530} w={1600}>
            <Pop at={tInspect}>
              <Pill text="F13 = QUAND inspecter · les autres familles = QUOI et PAR QUEL CANAL" size={32} filled />
            </Pop>
          </At>
        )}
      </S>
    </SceneShell>
  );
};

export const _keep = { Flow, Stamp, ShieldGlyph };
