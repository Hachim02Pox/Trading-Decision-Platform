import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "../theme";
import { Sfx, makeCue, Panel, TerminalGlyph, GoldBarIcon, useBreathe } from "./shared";
import type { SceneProps } from "./shared";
import { Beat, Pop, Cursor } from "./characters";
import { SceneShell, Center, Big, Label, STAGE_W } from "./stage";
import { Pill, CrossDraw, CheckDraw, CalendarPage } from "./props5";
import { Gavel, YieldStack, Slip } from "./props9";

const C = theme.colors;

const Tag: React.FC<{ text: string; color: string }> = ({ text, color }) => (
  <span style={{ color, fontSize: 14, fontFamily: theme.mono, fontWeight: 700, border: `1px solid ${color}`, borderRadius: 5, padding: "1px 7px", whiteSpace: "nowrap" }}>{text}</span>
);

export const Mistakes: React.FC<SceneProps> = ({ words, durationInFrames }) => {
  const frame = useCurrentFrame();
  const cue = makeCue(words);
  const t1 = cue("piege un");
  const t1b = cue("ce sont trois choses");
  const t2 = cue("piege deux");
  const t3 = cue("et piege trois");
  const t3b = cue("plusieurs placements");
  const Trap: React.FC<{ n: number }> = ({ n }) => <div style={{ color: C.negative, fontFamily: theme.mono, fontSize: 26, letterSpacing: 3, fontWeight: 800 }}>PIÈGE {n}</div>;
  return (
    <SceneShell eyebrow="F9 · Pièges" title="Trois pièges à éviter" durationInFrames={durationInFrames}>
      {[t1, t2, t3].map((at, i) => (
        <Sfx key={i} file="bass.wav" at={at} volume={0.4} />
      ))}
      <Beat from={0} to={t2} style={{ left: 0, top: 0 }}>
        <Center column gap={30}>
          <Trap n={1} />
          <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
            {["gros déficit", "grosses émissions brutes", "enchère ratée"].map((t, i) => (
              <React.Fragment key={t}>
                {i > 0 && <Big size={60} color={C.negative}>≠</Big>}
                <Pop at={t1 + 8 + i * 10}>
                  <Panel style={{ padding: "22px 28px" }}>
                    <Big size={30}>{t}</Big>
                  </Panel>
                </Pop>
              </React.Fragment>
            ))}
          </div>
          {frame >= t1b && <Label size={28} color={C.accentBright}>trois choses différentes</Label>}
        </Center>
      </Beat>
      <Beat from={t2} to={t3} style={{ left: 0, top: 0 }}>
        <Center gap={60}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
            <Trap n={2} />
            <YieldStack from={t2 - 60} premium={80} height={300} />
          </div>
          <Big size={70} color={C.negative}>≠</Big>
          <Pop at={t2 + 20}>
            <div style={{ position: "relative" }}>
              <Panel style={{ padding: "22px 30px" }}>
                <Big size={32}>un prix observé</Big>
              </Panel>
              <div style={{ position: "absolute", right: -30, top: -30 }}>
                <CrossDraw at={t2 + 36} size={80} />
              </div>
            </div>
          </Pop>
        </Center>
      </Beat>
      <Beat from={t3} style={{ left: 0, top: 0 }}>
        <Center column gap={30}>
          <Trap n={3} />
          <div style={{ display: "flex", gap: 60, alignItems: "center" }}>
            <Pop at={t3 + 6}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
                <Gavel size={160} strikeAt={t3 + 10} />
                <Label size={24}>1 enchère faible = du bruit ?</Label>
              </div>
            </Pop>
            {frame >= t3b && (
              <Pop at={t3b}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
                  <div style={{ display: "flex", gap: 6 }}>
                    {["2 ans", "10 ans", "30 ans"].map((t, i) => (
                      <Pop key={t} at={t3b + i * 6}>
                        <Slip text={`${t} ✗`} color={C.negative} />
                      </Pop>
                    ))}
                  </div>
                  <Label size={24} color={C.accentBright}>plusieurs durées, plusieurs fois : une autre histoire</Label>
                </div>
              </Pop>
            )}
          </div>
        </Center>
      </Beat>
    </SceneShell>
  );
};

export const TerminalUsage: React.FC<SceneProps> = ({ words, durationInFrames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const cue = makeCue(words);
  const tEv = cue("f9 est une famille");
  const tFace = cue("sa facade");
  const tEnch = cue("les prochaines encheres");
  const tJours = cue("avec le nombre de jours");
  const tDet = cue("en ouvrant le detail");
  const tQra = cue("l emprunt net negociable");
  const tTrim = cue("communique trimestriel");
  const tAuc = cue("puis trois mesures");
  const tHaut = cue("le taux haut", tAuc);
  const tBtc = cue("le ratio de couverture", tAuc);
  const tInd = cue("et la part des encherisseurs");
  const tCtx = cue("tout est contextuel");
  const tNot = cue("attention le terminal");
  const tToi = cue("ces calculs la");
  const tRef = cue("le reflexe");
  const tAvant = cue("avant une enchere");
  const tApres = cue("apres compare");
  const tVerif = cue("puis verifie");
  const lit = (a: number, b: number) => frame >= a && frame < b;
  const drawerP = spring({ frame: frame - tDet, fps, config: theme.spring.smooth });

  const EVENTS = [
    { t: "Next 2Y Auction", d: "dans 3j" },
    { t: "Next 5Y Auction", d: "dans 4j" },
    { t: "Next 10Y Auction", d: "dans 11j" },
  ];

  return (
    <SceneShell eyebrow="F9 · Dans le terminal" title="Une famille d'événements" durationInFrames={durationInFrames}>
      <Sfx file="pop.wav" at={tFace} volume={0.4} />
      <Sfx file="tick.wav" at={tEnch} volume={0.35} />
      <Sfx file="click.wav" at={tDet} volume={0.55} />
      <Sfx file="bass.wav" at={tNot} volume={0.4} />
      <Sfx file="whoosh.wav" at={tRef} volume={0.45} />

      <Beat from={tEv - 6} to={tRef} style={{ left: 0, top: 0 }}>
        <div style={{ position: "relative", width: STAGE_W, height: 690 }}>
          <div style={{ position: "absolute", left: 10, top: 0 }}>
            <Pop at={tEv}>
              <Panel style={{ width: 640, padding: 22 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                  <TerminalGlyph size={30} />
                  <span style={{ color: C.textPrimary, fontSize: 22, fontWeight: 700 }}>Trésor / Fiscal</span>
                </div>
                <div style={{ color: lit(tFace, tDet) ? C.accentBright : C.textMuted, fontFamily: theme.mono, fontSize: 15, letterSpacing: 2, marginBottom: 10 }}>PROCHAINS ÉVÉNEMENTS</div>
                {EVENTS.map((e, i) => (
                  <Pop key={e.t} at={tEnch + i * 8}>
                    <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 14px", borderRadius: 10, background: lit(tEnch + i * 8, tJours + 30) ? `${C.accent}1a` : C.panel, border: `1px solid ${C.hairline}`, marginBottom: 8 }}>
                      <span style={{ color: C.textPrimary, fontSize: 21 }}>{e.t}</span>
                      <span style={{ color: frame >= tJours ? C.accentBright : C.textSecondary, fontFamily: theme.mono, fontSize: 20, fontWeight: 800 }}>{e.d}</span>
                    </div>
                  </Pop>
                ))}
                <div style={{ color: C.textMuted, fontFamily: theme.mono, fontSize: 13, marginTop: 6 }}>dates d&apos;exemple · jusqu&apos;à 3 affichées</div>
              </Panel>
            </Pop>
          </div>
          {frame >= tFace && frame < tDet && (
            <div style={{ position: "absolute", left: 700, top: 40, width: 1000 }}>
              <Pop at={tFace}>
                <Label size={28} color={C.textPrimary}>pas de chiffres sur la façade : le calendrier des prochaines enchères</Label>
              </Pop>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 24 }}>
                {["2 ans", "5 ans", "10 ans", "20 ans", "30 ans", "indexées (TIPS)"].map((t, i) => (
                  <Pop key={t} at={tEnch + i * 6}>
                    <Pill text={t} color={C.context} size={24} />
                  </Pop>
                ))}
              </div>
            </div>
          )}
          {frame >= tDet && (
            <div style={{ position: "absolute", left: 690, top: 0, width: 1030, opacity: drawerP, transform: `translateX(${interpolate(drawerP, [0, 1], [240, 0])}px)` }}>
              <Panel glow style={{ padding: "18px 22px" }}>
                <div style={{ color: C.textMuted, fontFamily: theme.mono, fontSize: 14, letterSpacing: 1.5 }}>CE QUE CETTE FAMILLE DIT ACTUELLEMENT POUR L&apos;OR</div>
                <div style={{ display: "flex", alignItems: "center", gap: 14, margin: "8px 0 14px" }}>
                  <span style={{ color: C.textSecondary, fontSize: 18 }}>Impact sur l&apos;or</span>
                  <strong style={{ color: C.context, fontSize: 20, textShadow: frame >= tCtx ? `0 0 14px ${C.context}` : undefined }}>Contextuel</strong>
                </div>
                {[
                  { l: "Net Marketable Borrowing", v: "760 $B", on: lit(tQra, tAuc), src: "Trésor · trimestriel" },
                  { l: "Borrowing Est. Revision vs Prior", v: "+13 $B", on: lit(tQra + 20, tAuc), src: "Trésor · trimestriel" },
                  { l: "High Yield", v: "4,305 %", on: lit(tHaut, tBtc), src: "dernière adj. 10 ans" },
                  { l: "Bid-to-Cover", v: "2,48", on: lit(tBtc, tInd), src: "dernière adj. 10 ans" },
                  { l: "Indirect Bidder Share", v: "68,1 %", on: lit(tInd, tCtx), src: "dernière adj. 10 ans" },
                ].map((r) => (
                  <div key={r.l} style={{ height: 52, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 14px", borderRadius: 9, background: r.on ? `${C.accent}1a` : "transparent", border: `1px solid ${r.on ? C.accent : "transparent"}` }}>
                    <span style={{ color: C.textSecondary, fontSize: 20 }}>{r.l}</span>
                    <span style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      {frame >= tTrim && <span style={{ color: C.accentBright, fontFamily: theme.mono, fontSize: 13 }}>{r.src}</span>}
                      <span style={{ color: C.textPrimary, fontFamily: theme.mono, fontSize: 21, fontWeight: 800 }}>{r.v}</span>
                      <Tag text="RÉEL" color={C.positive} />
                    </span>
                  </div>
                ))}
                <div style={{ height: 1, background: C.hairline, margin: "8px 0" }} />
                {EVENTS.map((e) => (
                  <div key={e.t} style={{ height: 40, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 14px" }}>
                    <span style={{ color: C.textSecondary, fontSize: 18 }}>{e.t}</span>
                    <span style={{ color: C.textMuted, fontFamily: theme.mono, fontSize: 17 }}>date</span>
                  </div>
                ))}
              </Panel>
              {frame >= tNot && (
                <div style={{ marginTop: 16, display: "flex", gap: 14, alignItems: "center" }}>
                  <Pop at={tNot}>
                    <Pill text="non affichés : écart de fin d'adjudication · prime de terme" color={C.negative} size={24} />
                  </Pop>
                  {frame >= tToi && (
                    <Pop at={tToi}>
                      <Label size={24} color={C.accentBright}>→ à calculer toi-même</Label>
                    </Pop>
                  )}
                </div>
              )}
            </div>
          )}
          <Cursor
            path={[
              { at: tEnch - 16, x: 600, y: 640 },
              { at: tEnch, x: 480, y: 150 },
              { at: tJours, x: 560, y: 150 },
              { at: tDet, x: 300, y: 40, click: true },
              { at: tQra, x: 1500, y: 150 },
              { at: tHaut, x: 1500, y: 250 },
              { at: tInd, x: 1500, y: 350 },
            ]}
          />
        </div>
      </Beat>

      <Beat from={tRef} style={{ left: 0, top: 0 }}>
        <div style={{ width: STAGE_W, height: 660, display: "flex", alignItems: "center", justifyContent: "center", gap: 30 }}>
          <Pop at={tAvant}>
            <Panel glow={frame < tApres} style={{ width: 520, padding: 24 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ transform: "scale(0.4)", width: 90, height: 100, transformOrigin: "top left" }}>
                  <CalendarPage top="AVANT" big="J-1" size={220} />
                </div>
                <Big size={30}>Avant l&apos;enchère</Big>
              </div>
              {["durée", "montant", "contexte", "autres règlements du jour"].map((t, i) => (
                <div key={t} style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8 }}>
                  <CheckDraw at={tAvant + 10 + i * 8} size={30} />
                  <Label size={23} color={C.textPrimary}>{t}</Label>
                </div>
              ))}
            </Panel>
          </Pop>
          <Pop at={tApres}>
            <Panel glow={frame >= tApres && frame < tVerif} style={{ width: 560, padding: 24 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <Gavel size={80} strikeAt={tApres + 4} />
                <Big size={30}>Après</Big>
              </div>
              {["taux haut vs marché", "ratio vs historique", "allocations", "réaction des taux 5 à 30 min"].map((t, i) => (
                <div key={t} style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8 }}>
                  <CheckDraw at={tApres + 10 + i * 8} size={30} />
                  <Label size={23} color={C.textPrimary}>{t}</Label>
                </div>
              ))}
            </Panel>
          </Pop>
          <Pop at={tVerif}>
            <Panel glow={frame >= tVerif} style={{ width: 460, padding: 24 }}>
              <Big size={30}>Puis vérifie</Big>
              {["F2 · taux réels", "F6 · dollar", "F7 · volatilité des taux", "F8 · financement"].map((t, i) => (
                <Pop key={t} at={tVerif + 8 + i * 12}>
                  <div style={{ marginTop: 10 }}>
                    <Pill text={t} size={24} />
                  </div>
                </Pop>
              ))}
            </Panel>
          </Pop>
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
    { term: "Écart de fin d'adjudication (tail)", def: "Le taux haut de l'enchère, moins le taux de marché juste avant", at: cue("ecart de fin"), icon: <Gavel size={220} strikeAt={cue("ecart de fin") + 10} /> },
    { term: "Ratio de couverture (bid-to-cover)", def: "Les offres reçues, divisées par le montant accepté", at: cue("ratio de couverture"), icon: <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>{[1, 2, 3].map((i) => <Slip key={i} text={`offre ${i}`} />)}</div> },
    { term: "Prime de terme", def: "La compensation estimée pour porter un titre long et son incertitude, au-delà des taux courts attendus", at: cue("et prime de terme"), icon: <YieldStack from={cue("et prime de terme")} premium={70} height={260} /> },
  ];
  const activeIdx = TERMS.reduce((acc, t, i) => (frame >= t.at ? i : acc), -1);
  return (
    <SceneShell eyebrow="F9 · Vocabulaire" title="Le vocabulaire, en rafale" durationInFrames={durationInFrames}>
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
            <Panel glow style={{ display: "flex", alignItems: "center", gap: 40, padding: 44, minHeight: 440 }}>
              <div style={{ width: 380, display: "flex", justifyContent: "center" }}>{t.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ color: C.accent, fontFamily: theme.mono, fontSize: 20 }}>
                  {i + 1} / {TERMS.length}
                </div>
                <Big size={44} color={C.accentBright}>
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
  const tA = cue("separe");
  const tB = cue("les mesures d enchere");
  const tC = cue("et avant de relier");
  const tNever = cue("ne devine jamais");
  return (
    <SceneShell eyebrow="F9 · À retenir" title="Ce qu'il faut garder de F9" durationInFrames={durationInFrames}>
      <Sfx file="tick.wav" at={tA} volume={0.4} />
      <Sfx file="tick.wav" at={tB} volume={0.4} />
      <Sfx file="tick.wav" at={tC} volume={0.4} />
      <Sfx file="chime.wav" at={tNever} volume={0.55} />
      <Beat from={0} style={{ left: 0, top: 0 }}>
        <div style={{ width: STAGE_W, height: 650, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 26 }}>
          {[
            { t: "Emprunt net ≠ émissions brutes ≠ mélange des durées", at: tA },
            { t: "Une mesure d'enchère n'a de sens qu'avec l'historique et le contexte", at: tB },
            { t: "Avant de relier le budget à l'or : décomposer le mouvement des taux", at: tC },
          ].map((it) => (
            <Pop key={it.t} at={it.at}>
              <Panel style={{ width: 1200, display: "flex", alignItems: "center", gap: 20, padding: "20px 28px" }}>
                <CheckDraw at={it.at + 6} size={46} />
                <Label size={30} color={C.textPrimary}>{it.t}</Label>
              </Panel>
            </Pop>
          ))}
          {frame >= tNever && (
            <div style={{ transform: `scale(${breathe.scale})`, display: "flex", alignItems: "center", gap: 20 }}>
              <Pop at={tNever}>
                <Big size={64} color={C.accentBright} glow>
                  Ne devine jamais. Vérifie.
                </Big>
              </Pop>
              <GoldBarIcon size={70} />
            </div>
          )}
        </div>
      </Beat>
    </SceneShell>
  );
};
