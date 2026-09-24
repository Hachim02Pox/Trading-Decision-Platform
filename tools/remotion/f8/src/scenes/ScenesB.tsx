import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "../theme";
import { Sfx, makeCue, Panel, TerminalGlyph, GoldBarIcon, BankIcon, useBreathe } from "./shared";
import type { SceneProps } from "./shared";
import { Beat, Pop, Cursor } from "./characters";
import { SceneShell, Center, Big, Label, STAGE_W } from "./stage";
import { Pill, CrossDraw, CheckDraw, CalendarPage } from "./props5";
import { Tank, Pipe } from "./props8";

const C = theme.colors;

const Tag: React.FC<{ text: string; color: string }> = ({ text, color }) => (
  <span style={{ color, fontSize: 14, fontFamily: theme.mono, fontWeight: 700, border: `1px solid ${color}`, borderRadius: 5, padding: "1px 7px", whiteSpace: "nowrap" }}>{text}</span>
);

export const Regimes: React.FC<SceneProps> = ({ words, durationInFrames }) => {
  const frame = useCurrentFrame();
  const cue = makeCue(words);
  const tQ = cue("comment lire f8");
  const t1 = cue("d abord regarde");
  const t2 = cue("ensuite examine");
  const tDure = cue("une pression qui dure");
  const tJour = cue("un mouvement d un jour");
  const tOr = cue("et pour l or");
  const bridges = [
    { t: "taux réels", at: cue("les taux reels") },
    { t: "dollar", at: cue("le dollar") },
    { t: "conditions de risque", at: cue("les conditions de risque") },
    { t: "désendettement forcé", at: cue("ou un desendettement") },
  ];
  const tSans = cue("sans ce pont");
  const bridgeP = interpolate(frame, [tOr, tOr + 40], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: theme.ease.inOut });

  return (
    <SceneShell eyebrow="F8 · Lire la plomberie" title="Réserves, TGA, écarts… puis le pont vers l'or" durationInFrames={durationInFrames}>
      <Sfx file="pop.wav" at={t1} volume={0.4} />
      <Sfx file="pop.wav" at={t2} volume={0.4} />
      <Sfx file="bass.wav" at={tDure} volume={0.4} />
      <Sfx file="whoosh.wav" at={tOr} volume={0.45} />
      {bridges.map((b) => (
        <Sfx key={b.t} file="tick.wav" at={b.at} volume={0.35} />
      ))}

      <Beat from={0} to={tOr} style={{ left: 0, top: 0 }}>
        <Center column gap={30}>
          <Pop at={tQ}>
            <Big size={40}>Comment lire F8 ?</Big>
          </Pop>
          <div style={{ display: "flex", gap: 30 }}>
            <Pop at={t1}>
              <Panel glow={frame >= t1 && frame < t2} style={{ padding: 24, display: "flex", alignItems: "center", gap: 18 }}>
                <Tank level={0.6} label="réserves" w={120} h={160} />
                <Big size={30} color={C.textMuted}>+</Big>
                <Tank level={0.4} label="TGA" color={C.accent} w={120} h={160} />
                <Label size={22} color={C.textPrimary}>1 · ensemble</Label>
              </Panel>
            </Pop>
            <Pop at={t2}>
              <Panel glow={frame >= t2 && frame < tDure} style={{ padding: 24, textAlign: "center" }}>
                <Big size={32}>SOFR − IORB</Big>
                <Big size={32}>EFFR − IORB</Big>
                <Label size={22} color={C.textPrimary}>2 · les écarts</Label>
              </Panel>
            </Pop>
          </div>
          <div style={{ display: "flex", gap: 30 }}>
            {frame >= tDure && (
              <Pop at={tDure}>
                <Panel style={{ padding: "14px 22px", borderColor: C.negative }}>
                  <Label size={24} color={C.textPrimary}>pression qui dure + confirmée par F7</Label>
                </Panel>
              </Pop>
            )}
            {frame >= tJour && (
              <Pop at={tJour}>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <Big size={40} color={C.textMuted}>≠</Big>
                  <div style={{ transform: "scale(0.45)", width: 100, height: 110, transformOrigin: "top left" }}>
                    <CalendarPage top="1 JOUR" big="!" size={220} />
                  </div>
                  <Label size={24}>un jour lié au calendrier</Label>
                </div>
              </Pop>
            )}
          </div>
        </Center>
      </Beat>

      <Beat from={tOr} style={{ left: 0, top: 0 }}>
        <div style={{ position: "relative", width: STAGE_W, height: 690 }}>
          <div style={{ position: "absolute", left: 60, top: 150 }}>
            <Tank level={0.5} label="F8 · plomberie" color={C.context} w={220} h={280} />
          </div>
          <svg width={STAGE_W} height={690} style={{ position: "absolute", left: 0, top: 0 }}>
            <path d="M 300 290 C 700 60, 1000 60, 1420 290" stroke={C.accentBright} strokeWidth="10" fill="none" strokeDasharray="1400" strokeDashoffset={1400 * (1 - bridgeP)} strokeLinecap="round" />
          </svg>
          <div style={{ position: "absolute", left: 1440, top: 200 }}>
            <GoldBarIcon size={200} />
          </div>
          <div style={{ position: "absolute", left: 420, top: 330, display: "flex", gap: 16 }}>
            {bridges.map((b) => (
              <Pop key={b.t} at={b.at}>
                <Pill text={b.t} size={26} />
              </Pop>
            ))}
          </div>
          <div style={{ position: "absolute", left: 0, right: 0, top: 40, display: "flex", justifyContent: "center" }}>
            <Pop at={tOr}>
              <Big size={36} color={C.accentBright}>exige un pont observé</Big>
            </Pop>
          </div>
          {frame >= tSans && (
            <div style={{ position: "absolute", left: 0, right: 0, top: 460, display: "flex", justifyContent: "center" }}>
              <Pop at={tSans}>
                <Pill text="sans pont : F8 reste du contexte" color={C.context} size={30} filled />
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
  const t1 = cue("piege un");
  const t2 = cue("piege deux");
  const t3 = cue("et piege trois");
  const Trap: React.FC<{ n: number }> = ({ n }) => <div style={{ color: C.negative, fontFamily: theme.mono, fontSize: 26, letterSpacing: 3, fontWeight: 800 }}>PIÈGE {n}</div>;
  return (
    <SceneShell eyebrow="F8 · Pièges" title="Trois pièges à éviter" durationInFrames={durationInFrames}>
      {[t1, t2, t3].map((at, i) => (
        <Sfx key={i} file="bass.wav" at={at} volume={0.4} />
      ))}
      <Beat from={0} to={t2} style={{ left: 0, top: 0 }}>
        <Center column gap={30}>
          <Trap n={1} />
          <div style={{ display: "flex", alignItems: "center", gap: 40 }}>
            <Pop at={t1 + 6}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <BankIcon size={160} color={C.accent} />
                <Label size={24}>bilan de la Fed</Label>
              </div>
            </Pop>
            <Big size={80} color={C.negative}>≠</Big>
            <Pop at={t1 + 16}>
              <Panel style={{ padding: "22px 30px", position: "relative" }}>
                <Big size={32}>liquidité immédiatement utilisable</Big>
                <div style={{ position: "absolute", right: -20, top: -20 }}>
                  <CrossDraw at={t1 + 30} size={80} />
                </div>
              </Panel>
            </Pop>
          </div>
        </Center>
      </Beat>
      <Beat from={t2} to={t3} style={{ left: 0, top: 0 }}>
        <Center column gap={30}>
          <Trap n={2} />
          <div style={{ display: "flex", gap: 40, alignItems: "flex-end" }}>
            {[{ l: 0.7, t: "−50 Md$" }, { l: 0.25, t: "−50 Md$" }].map((x, i) => (
              <Pop key={i} at={t2 + 6 + i * 10}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <Tank level={x.l} label={x.t} color={i ? C.negative : C.context} w={180} h={220} />
                  <Label size={22}>{i ? "système déjà tendu" : "réserves abondantes"}</Label>
                </div>
              </Pop>
            ))}
            <Label size={28} color={C.accentBright}>même baisse, pas le même resserrement</Label>
          </div>
        </Center>
      </Beat>
      <Beat from={t3} style={{ left: 0, top: 0 }}>
        <Center column gap={30}>
          <Trap n={3} />
          <div style={{ display: "flex", alignItems: "center", gap: 30 }}>
            <Pop at={t3 + 6}>
              <Tank level={0.5} label="1 chiffre" w={160} h={200} />
            </Pop>
            <Big size={60} color={C.textMuted}>→</Big>
            <div style={{ position: "relative" }}>
              <GoldBarIcon size={140} />
              <div style={{ position: "absolute", left: 20, top: 10 }}>
                <CrossDraw at={t3 + 30} size={110} />
              </div>
            </div>
          </div>
          <Label size={26} color={C.textPrimary}>relie-le aux taux, au dollar, au risque</Label>
        </Center>
      </Beat>
    </SceneShell>
  );
};

export const TerminalUsage: React.FC<SceneProps> = ({ words, durationInFrames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const cue = makeCue(words);
  const tFace = cue("la facade de f8");
  const tRes = cue("celle des reserves");
  const tTga = cue("et celle du tga");
  const tLigne = cue("juste en dessous");
  const tCalc = cue("le terminal la calcule");
  const tZone = cue("tant que cet ecart");
  const tAnorm = cue("au dela");
  const tChoix = cue("c est un choix");
  const tDet = cue("en ouvrant le detail");
  const tCtx = cue("tout est contextuel");
  const tSrc = cue("les sources sont officielles");
  const tFred = cue("les reserves viennent");
  const tTr = cue("le tga vient");
  const tNy = cue("et l effr vient");
  const tRef = cue("ensuite le reflexe");
  const lit = (a: number, b: number) => frame >= a && frame < b;
  const drawerP = spring({ frame: frame - tDet, fps, config: theme.spring.smooth });
  const anomalous = frame >= tAnorm && frame < tChoix;

  return (
    <SceneShell eyebrow="F8 · Dans le terminal" title="Deux variations et un voyant de financement" durationInFrames={durationInFrames}>
      <Sfx file="pop.wav" at={tFace} volume={0.4} />
      <Sfx file="tick.wav" at={tRes} volume={0.35} />
      <Sfx file="tick.wav" at={tTga} volume={0.35} />
      <Sfx file="pop.wav" at={tLigne} volume={0.4} />
      <Sfx file="bass.wav" at={tAnorm} volume={0.4} />
      <Sfx file="click.wav" at={tDet} volume={0.55} />
      <Sfx file="whoosh.wav" at={tRef} volume={0.45} />

      <Beat from={tFace - 6} to={tRef} style={{ left: 0, top: 0 }}>
        <div style={{ position: "relative", width: STAGE_W, height: 690 }}>
          <div style={{ position: "absolute", left: 10, top: 0 }}>
            <Panel style={{ width: 700, padding: 22 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                <TerminalGlyph size={30} />
                <span style={{ color: C.textPrimary, fontSize: 22, fontWeight: 700 }}>Liquidité / Financement</span>
              </div>
              {[
                { s: "RÉSERVES", l: "Reserves (WoW Δ)", p: "−18", v: "−42", lit: lit(tRes, tTga) || lit(tFred, tTr) },
                { s: "TGA", l: "TGA (Daily Δ)", p: "+35", v: "+61", lit: lit(tTga, tLigne) || lit(tTr, tNy) },
              ].map((r) => (
                <div key={r.l}>
                  <div style={{ color: C.textMuted, fontFamily: theme.mono, fontSize: 15, letterSpacing: 2, margin: "6px 0" }}>{r.s}</div>
                  <div style={{ padding: "14px 18px", borderRadius: 14, background: r.lit ? `${C.accent}1f` : C.panel, border: `1px solid ${r.lit ? C.accent : C.hairline}`, marginBottom: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ color: C.textSecondary, fontSize: 20 }}>{r.l}</span>
                      <Tag text="RÉEL" color={C.positive} />
                      <span style={{ marginLeft: "auto", color: C.textMuted, fontSize: 15, border: `1px solid ${C.hairline}`, borderRadius: 6, padding: "1px 8px" }}>Contextuel</span>
                    </div>
                    <div style={{ marginTop: 8, fontFamily: theme.mono }}>
                      <span style={{ color: C.textMuted, fontSize: 21 }}>{r.p} → </span>
                      <span style={{ color: C.textPrimary, fontSize: 38, fontWeight: 800 }}>{r.v}</span>
                      <span style={{ color: C.textSecondary, fontSize: 20 }}> $B</span>
                    </div>
                  </div>
                </div>
              ))}
              <div style={{ marginTop: 6, padding: "6px 10px", borderRadius: 8, color: anomalous ? C.negative : C.textSecondary, fontSize: 19, fontStyle: "italic", background: lit(tLigne, tDet) ? `${C.accent}14` : "transparent" }}>
                {anomalous ? "Financement : Anormal" : "Financement : Normal"}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 6 }}>
                <span style={{ color: C.textMuted, fontFamily: theme.mono, fontSize: 13 }}>valeurs d&apos;exemple</span>
                <span style={{ color: C.context, fontSize: 15, border: `1px solid ${C.context}`, borderRadius: 999, padding: "2px 12px" }}>Contextuel</span>
              </div>
            </Panel>
          </div>
          <div style={{ position: "absolute", left: 760, top: 0, width: 960, display: "flex", flexDirection: "column", gap: 16 }}>
            {frame >= tCalc && frame < tDet && (
              <Pop at={tCalc}>
                <Panel glow style={{ padding: 22 }}>
                  <Big size={30}>voyant = écart SOFR − IORB</Big>
                  <div style={{ position: "relative", height: 90, marginTop: 20 }}>
                    <div style={{ position: "absolute", left: 60, right: 60, top: 40, height: 6, background: C.hairline }} />
                    <div style={{ position: "absolute", left: "35%", width: "30%", top: 26, height: 34, borderRadius: 8, background: `${C.positive}33`, border: `2px solid ${C.positive}`, opacity: frame >= tZone ? 1 : 0 }} />
                    <div style={{ position: "absolute", left: "35%", top: 66, color: C.positive, fontFamily: theme.mono, fontSize: 18, transform: "translateX(-50%)" }}>−5 pb</div>
                    <div style={{ position: "absolute", left: "65%", top: 66, color: C.positive, fontFamily: theme.mono, fontSize: 18, transform: "translateX(-50%)" }}>+5 pb</div>
                    <div style={{ position: "absolute", left: `${anomalous ? 82 : 46 + Math.sin(frame / 10) * 5}%`, top: 18, width: 16, height: 50, borderRadius: 8, background: anomalous ? C.negative : C.accentBright }} />
                  </div>
                  {frame >= tZone && <Label size={22} color={C.positive}>dans ±5 pb : normal</Label>}
                  {frame >= tAnorm && <Label size={22} color={C.negative}>au-delà : anormal</Label>}
                  {frame >= tChoix && <Label size={21} color={C.accentBright}>un choix de présentation, pas un seuil officiel</Label>}
                </Panel>
              </Pop>
            )}
          </div>
          {frame >= tDet && (
            <div style={{ position: "absolute", left: 760, top: 0, width: 960, opacity: drawerP, transform: `translateX(${interpolate(drawerP, [0, 1], [240, 0])}px)` }}>
              <Panel glow style={{ padding: "18px 22px" }}>
                <div style={{ color: C.textMuted, fontFamily: theme.mono, fontSize: 14, letterSpacing: 1.5 }}>CE QUE CETTE FAMILLE DIT ACTUELLEMENT POUR L&apos;OR</div>
                <div style={{ display: "flex", alignItems: "center", gap: 14, margin: "8px 0 14px" }}>
                  <span style={{ color: C.textSecondary, fontSize: 18 }}>Impact sur l&apos;or</span>
                  <strong style={{ color: C.context, fontSize: 20, textShadow: frame >= tCtx ? `0 0 14px ${C.context}` : undefined }}>Contextuel</strong>
                </div>
                {[
                  { l: "Reserves", v: "3 210 $B", src: "FRED · mercredi", on: frame >= tFred && frame < tTr },
                  { l: "Reserves (WoW Δ)", v: "−42 $B", src: "FRED", on: false },
                  { l: "TGA", v: "812 $B", src: "Trésor · relevé quotidien", on: frame >= tTr && frame < tNy },
                  { l: "TGA (Daily Δ)", v: "+61 $B", src: "Trésor", on: false },
                  { l: "Funding Microstate", v: "—", src: "", on: false },
                  { l: "SOFR - IORB", v: "−3 bps", src: "FRED", on: frame >= tDet + 20 && frame < tCtx },
                  { l: "EFFR - IORB", v: "−7 bps", src: "Fed de New York + FRED", on: (frame >= tDet + 30 && frame < tCtx) || (frame >= tNy && frame < tRef) },
                ].map((r) => (
                  <div key={r.l} style={{ height: 50, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 14px", borderRadius: 9, background: r.on ? `${C.accent}1a` : "transparent", border: `1px solid ${r.on ? C.accent : "transparent"}` }}>
                    <span style={{ color: C.textSecondary, fontSize: 20 }}>{r.l}</span>
                    <span style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      {frame >= tSrc && r.src && <span style={{ color: C.accentBright, fontFamily: theme.mono, fontSize: 13 }}>{r.src}</span>}
                      <span style={{ color: C.textPrimary, fontFamily: theme.mono, fontSize: 21, fontWeight: 800 }}>{r.v}</span>
                      <Tag text="RÉEL" color={C.positive} />
                    </span>
                  </div>
                ))}
              </Panel>
            </div>
          )}
          <Cursor
            path={[
              { at: tRes - 16, x: 700, y: 640 },
              { at: tRes, x: 480, y: 170 },
              { at: tTga, x: 480, y: 310 },
              { at: tLigne, x: 300, y: 395 },
              { at: tDet, x: 360, y: 40, click: true },
              { at: tFred, x: 1400, y: 150 },
              { at: tTr, x: 1400, y: 250 },
              { at: tNy, x: 1400, y: 450 },
            ]}
          />
        </div>
      </Beat>

      <Beat from={tRef} style={{ left: 0, top: 0 }}>
        <div style={{ width: STAGE_W, height: 650, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 36 }}>
          <Big size={48}>Le réflexe</Big>
          <div style={{ display: "flex", gap: 18 }}>
            {[
              { t: "F7", d: "stress", at: cue("f7 pour le stress") },
              { t: "F9", d: "émissions de dette", at: cue("f9 pour") },
              { t: "F2 · F6", d: "taux et dollar", at: cue("f2 et f6") },
            ].map((s) => (
              <Pop key={s.t} at={s.at}>
                <Panel glow style={{ width: 320, textAlign: "center", padding: 24 }}>
                  <Big size={34} color={C.accentBright}>{s.t}</Big>
                  <Label size={24} color={C.textPrimary}>{s.d}</Label>
                </Panel>
              </Pop>
            ))}
          </div>
          {frame >= cue("et l or seulement") && (
            <Pop at={cue("et l or seulement")}>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <GoldBarIcon size={70} />
                <Pill text="l'or : seulement si le pont est là" size={28} filled />
              </div>
            </Pop>
          )}
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
    { term: "Réserves", def: "Les soldes des banques éligibles à la Réserve fédérale", at: cue("reserves", cue("en rafale")), icon: <Tank level={0.6} label="réserves" /> },
    { term: "TGA", def: "Le compte courant du Trésor américain à la Fed", at: cue("tga"), icon: <Tank level={0.4} label="TGA" color={C.accent} /> },
    { term: "SOFR", def: "Un large taux garanti au jour le jour, basé sur les pensions adossées aux obligations d'État", at: cue("sofr"), icon: <Pipe width={260} active label="nuit" /> },
    { term: "IORB", def: "Le taux que la Fed paie sur les soldes de réserve", at: cue("et iorb"), icon: <BankIcon size={180} color={C.positive} /> },
  ];
  const activeIdx = TERMS.reduce((acc, t, i) => (frame >= t.at ? i : acc), -1);
  return (
    <SceneShell eyebrow="F8 · Vocabulaire" title="Le vocabulaire, en rafale" durationInFrames={durationInFrames}>
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
          <div key={t.term} style={{ position: "absolute", left: STAGE_W / 2 - 600, top: 110, width: 1200, opacity: p, transform: p > 0.995 ? "none" : `perspective(1200px) rotateY(${interpolate(p, [0, 1], [70, 0])}deg) scale(${interpolate(p, [0, 1], [0.85, 1])})` }}>
            <Panel glow style={{ display: "flex", alignItems: "center", gap: 50, padding: 50, minHeight: 400 }}>
              <div style={{ width: 340, display: "flex", justifyContent: "center" }}>{t.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ color: C.accent, fontFamily: theme.mono, fontSize: 20 }}>
                  {i + 1} / {TERMS.length}
                </div>
                <Big size={50} color={C.accentBright}>
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
  const tA = cue("la liquidite est");
  const tB = cue("une pression de financement");
  const tC = cue("et f8 agit");
  const tNever = cue("ne devine jamais");
  return (
    <SceneShell eyebrow="F8 · À retenir" title="Ce qu'il faut garder de F8" durationInFrames={durationInFrames}>
      <Sfx file="tick.wav" at={tA} volume={0.4} />
      <Sfx file="tick.wav" at={tB} volume={0.4} />
      <Sfx file="tick.wav" at={tC} volume={0.4} />
      <Sfx file="chime.wav" at={tNever} volume={0.55} />
      <Beat from={0} style={{ left: 0, top: 0 }}>
        <div style={{ width: STAGE_W, height: 650, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 26 }}>
          {[
            { t: "La liquidité : un système de bilans, pas un chiffre unique", at: tA },
            { t: "Pression temporaire ≠ rareté persistante", at: tB },
            { t: "F8 agit sur l'or indirectement, sous conditions", at: tC },
          ].map((it) => (
            <Pop key={it.t} at={it.at}>
              <Panel style={{ width: 1100, display: "flex", alignItems: "center", gap: 20, padding: "20px 28px" }}>
                <CheckDraw at={it.at + 6} size={46} />
                <Label size={30} color={C.textPrimary}>{it.t}</Label>
              </Panel>
            </Pop>
          ))}
          {frame >= tNever && (
            <div style={{ transform: `scale(${breathe.scale})` }}>
              <Pop at={tNever}>
                <Big size={64} color={C.accentBright} glow>
                  Ne devine jamais. Vérifie le pont.
                </Big>
              </Pop>
            </div>
          )}
        </div>
      </Beat>
    </SceneShell>
  );
};
