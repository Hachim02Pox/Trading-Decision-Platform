import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "../theme";
import { Sfx, makeCue, Panel, TerminalGlyph, GoldBarIcon, BankIcon, CoinStackIcon, useBreathe } from "./shared";
import type { SceneProps } from "./shared";
import { Beat, Pop, Person, ArrowGlyph, DocIcon } from "./characters";
import { SceneShell, Center, Big, Label, STAGE_W } from "./stage";
import { Pill, CrossDraw, CheckDraw } from "./props5";
import { Tank } from "./props8";

const C = theme.colors;

export const EtfMeaning: React.FC<SceneProps> = ({ words, durationInFrames }) => {
  const frame = useCurrentFrame();
  const cue = makeCue(words);
  const tQ = cue("que disent");
  const tIn = cue("des entrees");
  const tRetard = cue("mais elles peuvent aussi");
  const tOut = cue("des sorties");
  const tHors = cue("et surtout");
  const OTHERS = [
    { t: "banques centrales", at: cue("les achats des banques"), icon: <BankIcon size={80} color={C.accent} /> },
    { t: "contrats à terme", at: cue("les contrats a terme"), icon: <DocIcon size={70} /> },
    { t: "lingots", at: cue("les lingots"), icon: <GoldBarIcon size={80} /> },
    { t: "pièces", at: cue("les pieces"), icon: <CoinStackIcon size={80} /> },
    { t: "bijouterie", at: cue("la bijouterie"), icon: <svg width="80" height="80" viewBox="0 0 40 40"><circle cx="20" cy="22" r="11" stroke={C.accentBright} strokeWidth="3" fill="none" /><path d="M14 11 L20 5 L26 11 Z" fill={C.context} /></svg> },
    { t: "gré à gré", at: cue("et les echanges"), icon: <Person size={70} color={C.textSecondary} /> },
  ];

  return (
    <SceneShell eyebrow="F10 · Ce que disent les flux" title="Entrées, sorties… et tout ce qui échappe à la série" durationInFrames={durationInFrames}>
      <Sfx file="pop.wav" at={tIn} volume={0.4} />
      <Sfx file="pop.wav" at={tOut} volume={0.4} />
      <Sfx file="whoosh.wav" at={tHors} volume={0.4} />
      {OTHERS.map((o) => (
        <Sfx key={o.t} file="tick.wav" at={o.at} volume={0.3} />
      ))}
      <Beat from={0} to={tHors} style={{ left: 0, top: 0 }}>
        <Center gap={80}>
          <Pop at={tIn}>
            <Panel glow={frame < tOut} style={{ width: 700, padding: 24, borderColor: C.positive }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <ArrowGlyph up color={C.positive} size={60} />
                <Big size={32} color={C.positive}>entrées</Big>
              </div>
              <Label size={24} color={C.textPrimary}>les investisseurs ajoutent de l&apos;exposition</Label>
              {frame >= tRetard && <Label size={24} color={C.accentBright}>… ou suivent le mouvement, avec retard</Label>}
            </Panel>
          </Pop>
          <Pop at={tOut}>
            <Panel glow={frame >= tOut} style={{ width: 700, padding: 24, borderColor: C.negative }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <ArrowGlyph up={false} color={C.negative} size={60} />
                <Big size={32} color={C.negative}>sorties</Big>
              </div>
              {["prises de bénéfices", "changements d'allocation", "passage vers un autre produit"].map((t) => (
                <Label key={t} size={24} color={C.textPrimary}>{t}</Label>
              ))}
            </Panel>
          </Pop>
        </Center>
      </Beat>
      <Beat from={tHors} style={{ left: 0, top: 0 }}>
        <div style={{ position: "relative", width: STAGE_W, height: 690 }}>
          <div style={{ position: "absolute", left: STAGE_W / 2 - 150, top: 200 }}>
            <Tank level={0.5} label="série ETF" color={C.accent} w={300} h={300} />
          </div>
          {OTHERS.map((o, i) => {
            const x = i % 2 === 0 ? 220 : STAGE_W - 520;
            const y = 130 + Math.floor(i / 2) * 190;
            return (
              <div key={o.t} style={{ position: "absolute", left: x, top: y, width: 300, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                <Pop at={o.at}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                    {o.icon}
                    <Label size={28} color={C.textPrimary}>{o.t}</Label>
                  </div>
                </Pop>
              </div>
            );
          })}
          <div style={{ position: "absolute", left: 0, right: 0, top: 10, display: "flex", justifyContent: "center" }}>
            <Pop at={tHors}>
              <Big size={34} color={C.accentBright}>beaucoup de demande échappe à la série</Big>
            </Pop>
          </div>
        </div>
      </Beat>
    </SceneShell>
  );
};

export const Scenarios: React.FC<SceneProps> = ({ words, durationInFrames }) => {
  const frame = useCurrentFrame();
  const cue = makeCue(words);
  const tQ = cue("comment combiner");
  const t1 = cue("un declencheur macro");
  const tPlace = cue("peut laisser de la place");
  const tGar = cue("mais ca ne garantit");
  const t2 = cue("le meme declencheur");
  const tFaible = cue("peut donner une reaction");
  const tPourtant = cue("et pourtant");
  const tConf = cue("des entrees dans");

  return (
    <SceneShell eyebrow="F10 · Scénarios" title="Même déclencheur, positionnements différents" durationInFrames={durationInFrames}>
      <Sfx file="pop.wav" at={t1} volume={0.4} />
      <Sfx file="pop.wav" at={t2} volume={0.4} />
      <Sfx file="chime.wav" at={tConf} volume={0.5} />
      <Beat from={0} style={{ left: 0, top: 0 }}>
        <div style={{ width: STAGE_W, height: 660, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 30 }}>
          <Pop at={tQ}>
            <Big size={38}>Comment combiner ?</Big>
          </Pop>
          <div style={{ display: "flex", gap: 40 }}>
            <Pop at={t1}>
              <Panel glow={frame >= t1 && frame < t2} style={{ width: 760, padding: 24 }}>
                <Big size={28} color={C.positive}>déclencheur favorable + peu d&apos;exposition</Big>
                <div style={{ display: "flex", gap: 4, justifyContent: "center", marginTop: 16 }}>
                  {Array.from({ length: 8 }).map((_, i) => (
                    <Person key={i} size={70} phase={i} color={i < 2 ? C.positive : C.textMuted} />
                  ))}
                </div>
                {frame >= tPlace && <Label size={24} color={C.textPrimary}>de la place pour de nouveaux acheteurs</Label>}
                {frame >= tGar && <Label size={24} color={C.negative}>… sans garantie de hausse</Label>}
              </Panel>
            </Pop>
            <Pop at={t2}>
              <Panel glow={frame >= t2 && frame < tConf} style={{ width: 760, padding: 24 }}>
                <Big size={28} color={C.accentBright}>même déclencheur + exposition extrême</Big>
                <div style={{ display: "flex", gap: 4, justifyContent: "center", marginTop: 16 }}>
                  {Array.from({ length: 8 }).map((_, i) => (
                    <Person key={i} size={70} phase={i} color={C.positive} />
                  ))}
                </div>
                {frame >= tFaible && <Label size={24} color={C.textPrimary}>réaction plus faible, prises de bénéfices agitées</Label>}
                {frame >= tPourtant && <Label size={24} color={C.positive}>et pourtant, la tendance peut continuer</Label>}
              </Panel>
            </Pop>
          </div>
          {frame >= tConf && (
            <Pop at={tConf}>
              <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                {["flux ETF", "prix", "contrats à terme"].map((t, i) => (
                  <div key={t} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <CheckDraw at={tConf + i * 10} size={36} />
                    <Pill text={t} size={24} />
                  </div>
                ))}
                <Label size={24} color={C.accentBright}>= un ensemble de preuves plus large</Label>
              </div>
            </Pop>
          )}
        </div>
      </Beat>
    </SceneShell>
  );
};

export const Mistakes: React.FC<SceneProps> = ({ words, durationInFrames }) => {
  const frame = useCurrentFrame();
  const cue = makeCue(words);
  const t1 = cue("piege un");
  const t2 = cue("piege deux");
  const t3 = cue("et piege trois");
  const Trap: React.FC<{ n: number }> = ({ n }) => <div style={{ color: C.negative, fontFamily: theme.mono, fontSize: 26, letterSpacing: 3, fontWeight: 800 }}>PIÈGE {n}</div>;
  return (
    <SceneShell eyebrow="F10 · Pièges" title="Trois pièges à éviter" durationInFrames={durationInFrames}>
      {[t1, t2, t3].map((at, i) => (
        <Sfx key={i} file="bass.wav" at={at} volume={0.4} />
      ))}
      <Beat from={0} to={t2} style={{ left: 0, top: 0 }}>
        <div style={{ transform: "scale(1.45)" }}><Center column gap={30}>
          <Trap n={1} />
          <div style={{ display: "flex", alignItems: "center", gap: 30 }}>
            <Pop at={t1 + 6}>
              <Panel style={{ padding: "22px 30px" }}>
                <Big size={34}>rang extrême : 97e</Big>
              </Panel>
            </Pop>
            <Big size={60} color={C.negative}>≠</Big>
            <Pop at={t1 + 16}>
              <div style={{ position: "relative" }}>
                <svg width="120" height="120" viewBox="0 0 60 60">
                  <circle cx="30" cy="32" r="22" stroke={C.textSecondary} strokeWidth="3" fill="none" />
                  <line x1="30" y1="32" x2="30" y2="16" stroke={C.textSecondary} strokeWidth="3" />
                  <rect x="24" y="4" width="12" height="6" fill={C.textSecondary} />
                </svg>
                <div style={{ position: "absolute", left: 5, top: 5 }}>
                  <CrossDraw at={t1 + 30} size={110} />
                </div>
              </div>
            </Pop>
            <Label size={28} color={C.textPrimary}>minuteur de retournement</Label>
          </div>
        </Center></div>
      </Beat>
      <Beat from={t2} to={t3} style={{ left: 0, top: 0 }}>
        <div style={{ transform: "scale(1.45)" }}><Center column gap={30}>
          <Trap n={2} />
          <div style={{ display: "flex", alignItems: "center", gap: 30 }}>
            <Panel style={{ padding: "22px 30px", textAlign: "center" }}>
              <Big size={30}>CFTC</Big>
              <Label size={22}>au mardi</Label>
            </Panel>
            <Big size={60} color={C.negative}>≠</Big>
            <Panel style={{ padding: "22px 30px", textAlign: "center" }}>
              <Big size={30}>prix en direct</Big>
              <Label size={22}>maintenant</Label>
            </Panel>
          </div>
          <Label size={26} color={C.accentBright}>aligner les dates avant de comparer</Label>
        </Center></div>
      </Beat>
      <Beat from={t3} style={{ left: 0, top: 0 }}>
        <div style={{ transform: "scale(1.45)" }}><Center column gap={30}>
          <Trap n={3} />
          <div style={{ display: "flex", alignItems: "center", gap: 30 }}>
            <Tank level={0.5} label="un ensemble de fonds" color={C.accent} w={180} h={220} />
            <Big size={60} color={C.negative}>≠</Big>
            <div style={{ display: "flex", gap: 14 }}>
              <BankIcon size={90} color={C.accent} />
              <GoldBarIcon size={90} />
              <CoinStackIcon size={90} />
            </div>
          </div>
          <Label size={26} color={C.textPrimary}>toute la demande mondiale d&apos;or</Label>
        </Center></div>
      </Beat>
    </SceneShell>
  );
};

const Mini: React.FC<{ label: string; value: string; unit?: string; read?: "Favorable" | "Contextuel"; lit?: boolean }> = ({ label, value, unit, read = "Contextuel", lit }) => (
  <div style={{ padding: "8px 12px", borderRadius: 10, background: lit ? `${C.accent}22` : C.panel, border: `1px solid ${lit ? C.accent : C.hairline}` }}>
    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
      <span style={{ color: C.textSecondary, fontSize: 15 }}>{label}</span>
      <span style={{ marginLeft: "auto", color: read === "Favorable" ? C.positive : C.textMuted, fontSize: 12, border: `1px solid ${read === "Favorable" ? C.positive : C.hairline}`, borderRadius: 5, padding: "0 6px" }}>{read}</span>
    </div>
    <div style={{ fontFamily: theme.mono, color: C.textPrimary, fontSize: 22, fontWeight: 800 }}>
      {value}
      {unit && <span style={{ color: C.textSecondary, fontSize: 15 }}> {unit}</span>}
    </div>
  </div>
);

export const TerminalUsage: React.FC<SceneProps> = ({ words, durationInFrames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const cue = makeCue(words);
  const tFace = cue("la facade de f10");
  const tRappel = cue("elle commence par");
  const tB1 = cue("premier bloc");
  const tEtats = cue("avec deux etats");
  const tB2 = cue("deuxieme bloc");
  const tInt = cue("l intensite du flux");
  const tRend = cue("et le rendement du prix");
  const tLarg = cue("enfin la largeur");
  const tDate = cue("avec la date");
  const tMeca = cue("les variations portent");
  const tRef = cue("et le reflexe");
  const lit = (a: number, b: number) => frame >= a && frame < b;
  const p = spring({ frame: frame - tFace, fps, config: theme.spring.smooth });
  const Sect: React.FC<{ title: string; on: boolean; children: React.ReactNode }> = ({ title, on, children }) => (
    <div style={{ padding: 12, borderRadius: 12, border: `1px solid ${on ? C.accent : C.hairline}`, background: on ? `${C.accent}10` : "transparent", marginBottom: 10 }}>
      <div style={{ color: on ? C.accentBright : C.textMuted, fontFamily: theme.mono, fontSize: 14, letterSpacing: 1.5, marginBottom: 8 }}>{title}</div>
      {children}
    </div>
  );
  const State: React.FC<{ k: string; v: string; on?: boolean }> = ({ k, v, on }) => (
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 16, padding: "3px 4px", color: C.textSecondary, background: on ? `${C.accent}22` : "transparent", borderRadius: 6 }}>
      <span>{k}</span>
      <strong style={{ color: C.textPrimary }}>{v}</strong>
    </div>
  );

  return (
    <SceneShell eyebrow="F10 · Dans le terminal" title="La façade la plus détaillée" durationInFrames={durationInFrames}>
      <Sfx file="pop.wav" at={tFace} volume={0.4} />
      <Sfx file="tick.wav" at={tB1} volume={0.4} />
      <Sfx file="tick.wav" at={tB2} volume={0.4} />
      <Sfx file="tick.wav" at={tLarg} volume={0.4} />
      <Sfx file="chime.wav" at={tMeca} volume={0.45} />
      <Beat from={tFace - 6} style={{ left: 0, top: 0 }}>
        <div style={{ position: "relative", width: STAGE_W, height: 690 }}>
          <div style={{ position: "absolute", left: 10, top: -10, width: 1000, opacity: p, transform: `translateY(${interpolate(p, [0, 1], [30, 0])}px)` }}>
            <Panel style={{ padding: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <TerminalGlyph size={26} />
                <span style={{ color: C.textPrimary, fontSize: 20, fontWeight: 700 }}>Flux / Positionnement</span>
              </div>
              <div style={{ fontSize: 13, color: lit(tRappel, tB1) ? C.accentBright : C.textSecondary, marginBottom: 8, lineHeight: 1.35 }}>
                Le Managed Money CFTC et GLD sont deux canaux de positionnement observables. Ils ne représentent pas l&apos;ensemble du marché de l&apos;or. F10 décrit le contexte… ce n&apos;est pas un déclencheur d&apos;exécution.
              </div>
              <Sect title="FUTURES — MANAGED MONEY CFTC" on={lit(tB1, tB2)}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                  <Mini label="Managed Money Net % of OI" value="21,4" unit="%" read="Favorable" />
                  <Mini label="WoW Δ" value="+1,2" unit="pp" read="Favorable" />
                  <Mini label="156W Percentile" value="78" unit="pct" />
                </div>
                <div style={{ marginTop: 6 }}>
                  <State k="État" v="Ajout d'exposition nette longue" on={lit(tEtats, tB2)} />
                  <State k="Extension" v="Zone médiane" on={lit(tEtats + 40, tB2)} />
                </div>
              </Sect>
              <Sect title="ETF — SPDR GLD" on={lit(tB2, tLarg)}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                  <Mini label="GLD Holdings Δ (Tonnes)" value="+2,6" unit="t" read="Favorable" />
                  <Mini label="Change 5 obs." value="+7,1" unit="t" />
                  <Mini label="Change 20 obs." value="+18,4" unit="t" />
                  <Mini label="60-obs. Flow Z" value="1,3" unit="σ" lit={lit(tInt, tRend)} />
                  <Mini label="20-Obs. Flow Extension" value="84" unit="pct" lit={lit(tInt + 40, tRend)} />
                  <Mini label="GLD Price Return 20 obs." value="+3,2" unit="%" lit={lit(tRend, tLarg)} />
                </div>
              </Sect>
              <Sect title="LARGEUR DE PARTICIPATION" on={lit(tLarg, tMeca)}>
                <State k="Largeur de participation" v="Participation large" />
                <State k="Futures" v={`Ajout · Au ${"22 sept."}`} on={lit(tDate, tMeca)} />
                <State k="ETF" v={`Expansion · 5 obs. · Au ${"23 sept."}`} on={lit(tDate, tMeca)} />
              </Sect>
              <div style={{ color: C.textMuted, fontFamily: theme.mono, fontSize: 12 }}>valeurs d&apos;exemple · textes d&apos;explication abrégés</div>
            </Panel>
          </div>
          <div style={{ position: "absolute", left: 1040, top: 0, width: 680, display: "flex", flexDirection: "column", gap: 16 }}>
            {frame >= tRappel && frame < tB1 && (
              <Pop at={tRappel}>
                <Panel style={{ padding: "14px 20px" }}>
                  <Label size={24} color={C.textPrimary}>2 canaux ≠ tout le marché · un contexte, pas un déclencheur</Label>
                </Panel>
              </Pop>
            )}
            {frame >= tB1 && frame < tB2 && (
              <Pop at={tB1}>
                <Panel style={{ padding: "14px 20px" }}>
                  <Big size={26}>gérants de fonds spéculatifs (CFTC)</Big>
                  <Label size={22} color={C.textPrimary}>nette en % de l&apos;intérêt ouvert · variation sur 1 semaine · rang sur 156 semaines</Label>
                  {frame >= tEtats && <Label size={22} color={C.accentBright}>+ 2 états écrits en clair</Label>}
                </Panel>
              </Pop>
            )}
            {frame >= tB2 && frame < tLarg && (
              <Pop at={tB2}>
                <Panel style={{ padding: "14px 20px" }}>
                  <Big size={26}>fonds GLD, en tonnes (émetteur SPDR)</Big>
                  <Label size={22} color={C.textPrimary}>jour · 5 obs. · 20 obs. · intensité (écarts-types) · extension · prix sur 20 obs.</Label>
                </Panel>
              </Pop>
            )}
            {frame >= tLarg && frame < tMeca && (
              <Pop at={tLarg}>
                <Panel style={{ padding: "14px 20px" }}>
                  <Big size={26}>largeur de participation</Big>
                  <Label size={22} color={C.textPrimary}>large · menée par les futures · menée par le fonds · réduction</Label>
                  {frame >= tDate && <Label size={22} color={C.accentBright}>+ la date de chaque canal (le décalage !)</Label>}
                </Panel>
              </Pop>
            )}
            {frame >= tMeca && (
              <Pop at={tMeca}>
                <Panel glow style={{ padding: "14px 20px" }}>
                  <Label size={24} color={C.positive}>variations : étiquette mécanique (hausse = « Favorable »)</Label>
                  <Label size={24} color={C.textPrimary}>rangs et intensités : « Contextuel »</Label>
                </Panel>
              </Pop>
            )}
            {frame >= tRef && (
              <Pop at={tRef}>
                <Pill text="le moment vient des déclencheurs : F2, F13" size={26} filled />
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
    { term: "Intérêt ouvert", def: "Le nombre de contrats dérivés en cours", at: cue("interet ouvert"), icon: <DocIcon size={180} color={C.textPrimary} /> },
    { term: "Position nette", def: "Les positions à l'achat moins les positions à la vente, pour une catégorie définie", at: cue("position nette"), icon: <div style={{ display: "flex", gap: 4 }}>{[0, 1, 2, 3, 4].map((i) => <Person key={i} size={70} phase={i} color={i < 3 ? C.positive : C.negative} />)}</div> },
    { term: "Rang historique (percentile)", def: "Une place dans un échantillon passé, pas une probabilité", at: cue("rang historique"), icon: <div style={{ width: 300, height: 30, borderRadius: 15, background: `linear-gradient(90deg, ${C.context}55, ${C.negative}88)`, position: "relative" }}><div style={{ position: "absolute", left: "78%", top: -12, width: 8, height: 54, background: C.accentBright, borderRadius: 4 }} /></div> },
    { term: "Flux de fonds coté", def: "Une variation des parts, des actifs ou du métal attribué, sur une période et un ensemble de fonds définis", at: cue("et flux de fonds"), icon: <Tank level={0.6} label="GLD" color={C.accent} /> },
  ];
  const activeIdx = TERMS.reduce((acc, t, i) => (frame >= t.at ? i : acc), -1);
  return (
    <SceneShell eyebrow="F10 · Vocabulaire" title="Le vocabulaire, en rafale" durationInFrames={durationInFrames}>
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
  const tA = cue("le niveau d une position");
  const tB = cue("aligne toujours");
  const tC = cue("et les flux decrivent");
  const tNever = cue("ne devine jamais");
  return (
    <SceneShell eyebrow="F10 · À retenir" title="Ce qu'il faut garder de F10" durationInFrames={durationInFrames}>
      <Sfx file="tick.wav" at={tA} volume={0.4} />
      <Sfx file="tick.wav" at={tB} volume={0.4} />
      <Sfx file="tick.wav" at={tC} volume={0.4} />
      <Sfx file="chime.wav" at={tNever} volume={0.55} />
      <Beat from={0} style={{ left: 0, top: 0 }}>
        <div style={{ width: STAGE_W, height: 650, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 26 }}>
          {[
            { t: "Niveau de position ≠ variation ≠ rendement du prix", at: tA },
            { t: "Toujours aligner la date CFTC avec l'heure du marché", at: tB },
            { t: "Les flux décrivent la participation, pas la direction à eux seuls", at: tC },
          ].map((it) => (
            <Pop key={it.t} at={it.at}>
              <Panel style={{ width: 1200, display: "flex", alignItems: "center", gap: 20, padding: "20px 28px" }}>
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
