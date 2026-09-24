import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "../theme";
import { Sfx, makeCue, Panel, TerminalGlyph, useBreathe, GoldBarIcon } from "./shared";
import type { SceneProps } from "./shared";
import { Beat, Pop, Cursor } from "./characters";
import { SceneShell, Big, Label, STAGE_W } from "./stage";
import { Pill } from "./props5";
import { Thermo, Umbrella } from "./props7";

const C = theme.colors;

const Tag: React.FC<{ text: string; color: string; boxed?: boolean }> = ({ text, color, boxed = true }) => (
  <span style={{ color, fontSize: 14, fontFamily: theme.mono, fontWeight: 700, border: boxed ? `1px solid ${color}` : "none", borderRadius: 5, padding: boxed ? "1px 7px" : 0, whiteSpace: "nowrap" }}>{text}</span>
);

const Cell: React.FC<{ label: string; prev?: string; value: string; unit?: string; lit: boolean; na?: boolean }> = ({ label, prev, value, unit, lit, na }) => (
  <div style={{ padding: "14px 18px", borderRadius: 14, background: lit ? `${C.accent}1f` : C.panel, border: `1px solid ${lit ? C.accent : C.hairline}`, marginBottom: 10 }}>
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <span style={{ color: C.textSecondary, fontSize: 20 }}>{label}</span>
      {na ? <span style={{ color: C.textMuted, fontSize: 16 }}>— <span style={{ border: `1px solid ${C.textMuted}`, borderRadius: "50%", padding: "0 6px", fontSize: 12 }}>i</span></span> : <Tag text="RÉEL" color={C.positive} />}
      <span style={{ marginLeft: "auto", color: C.textMuted, fontSize: 15, border: `1px solid ${C.hairline}`, borderRadius: 6, padding: "1px 8px" }}>Contextuel</span>
    </div>
    <div style={{ marginTop: 8, fontFamily: theme.mono, display: "flex", alignItems: "baseline", gap: 8 }}>
      {prev && <span style={{ color: C.textMuted, fontSize: 21 }}>{prev} →</span>}
      <span style={{ color: na ? C.textMuted : C.textPrimary, fontSize: 32, fontWeight: 800 }}>{value}</span>
      {unit && <span style={{ color: C.textSecondary, fontSize: 20 }}>{unit}</span>}
    </div>
  </div>
);

export const TerminalUsage: React.FC<SceneProps> = ({ words, durationInFrames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const cue = makeCue(words);
  const tFace = cue("la facade de f7");
  const tVix = cue("le vix", tFace);
  const tMove = cue("le move", tFace);
  const tHy = cue("et l ecart de credit des obligations a");
  const tCtx = cue("tous sont etiquetes");
  const tFred = cue("le vix et les ecarts");
  const tNa = cue("le move lui");
  const tPay = cue("c est un produit payant");
  const tPref = cue("le terminal prefere");
  const tClick = cue("un clic dessus");
  const tDet = cue("en ouvrant le detail");
  const tIg = cue("et l ecart de credit des obligations de");
  const tRef = cue("ensuite le reflexe");
  const tQual = cue("qualifie le regime");
  const tApres = cue("et seulement apres");
  const lit = (a: number, b: number) => frame >= a && frame < b;
  const drawerP = spring({ frame: frame - tDet, fps, config: theme.spring.smooth });

  return (
    <SceneShell eyebrow="F7 · Dans le terminal" title="Qualifier le stress, pas prédire l'or" durationInFrames={durationInFrames}>
      <Sfx file="pop.wav" at={tFace} volume={0.4} />
      <Sfx file="tick.wav" at={tVix} volume={0.35} />
      <Sfx file="tick.wav" at={tMove} volume={0.35} />
      <Sfx file="tick.wav" at={tHy} volume={0.35} />
      <Sfx file="bass.wav" at={tNa} volume={0.4} />
      <Sfx file="click.wav" at={tClick} volume={0.5} />
      <Sfx file="click.wav" at={tDet} volume={0.5} />
      <Sfx file="whoosh.wav" at={tRef} volume={0.45} />

      <Beat from={tFace - 6} to={tRef} style={{ left: 0, top: 0 }}>
        <div style={{ position: "relative", width: STAGE_W, height: 690 }}>
          <div style={{ position: "absolute", left: 10, top: 0 }}>
            <Panel style={{ width: 700, padding: 22 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                <TerminalGlyph size={30} />
                <span style={{ color: C.textPrimary, fontSize: 22, fontWeight: 700 }}>Risque / Crédit / Vol</span>
              </div>
              <Cell label="VIX" prev="17,82" value="18,40" lit={lit(tVix, tMove) || lit(tFred, tNa)} />
              <Cell label="MOVE" value="—" na lit={lit(tMove, tHy) || lit(tNa, tDet)} />
              <Cell label="HY OAS" prev="312" value="318" unit="bps" lit={lit(tHy, tCtx) || lit(tFred, tNa)} />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
                <span style={{ color: C.textMuted, fontFamily: theme.mono, fontSize: 13 }}>valeurs d&apos;exemple</span>
                <span style={{ color: C.context, fontSize: 15, border: `1px solid ${C.context}`, borderRadius: 999, padding: "2px 12px", boxShadow: lit(tCtx, tFred) ? `0 0 16px ${C.context}` : undefined }}>Contextuel</span>
              </div>
            </Panel>
          </div>
          <div style={{ position: "absolute", left: 760, top: 0, width: 960, display: "flex", flexDirection: "column", gap: 16 }}>
            {frame >= tCtx && frame < tDet && (
              <Pop at={tCtx}>
                <Label size={26} color={C.context}>tout est « Contextuel » : aucun sens fixe pour l&apos;or</Label>
              </Pop>
            )}
            {frame >= tFred && frame < tDet && (
              <Pop at={tFred}>
                <Pill text="VIX et écarts de crédit : base de la Fed de Saint-Louis" size={24} />
              </Pop>
            )}
            {frame >= tNa && frame < tDet && (
              <Pop at={tNa}>
                <Panel glow style={{ padding: "16px 22px", borderColor: C.negative }}>
                  <Big size={28} color={C.negative}>MOVE : volontairement indisponible</Big>
                  {frame >= tPay && <Label size={22} color={C.textPrimary}>produit payant · la seule source gratuite n&apos;a pas pu être validée</Label>}
                  {frame >= tPref && <Label size={22} color={C.accentBright}>plutôt rien qu&apos;un chiffre douteux</Label>}
                  {frame >= tClick && <Label size={22} color={C.textPrimary}>un clic dessus → l&apos;onglet Graphique</Label>}
                </Panel>
              </Pop>
            )}
          </div>
          {frame >= tDet && (
            <div style={{ position: "absolute", left: 770, top: 0, width: 950, opacity: drawerP, transform: `translateX(${interpolate(drawerP, [0, 1], [240, 0])}px)` }}>
              <Panel glow style={{ padding: "18px 22px" }}>
                <div style={{ color: C.textMuted, fontFamily: theme.mono, fontSize: 14, letterSpacing: 1.5 }}>CE QUE CETTE FAMILLE DIT ACTUELLEMENT POUR L&apos;OR</div>
                <div style={{ display: "flex", alignItems: "center", gap: 14, margin: "8px 0 14px" }}>
                  <span style={{ color: C.textSecondary, fontSize: 18 }}>Impact sur l&apos;or</span>
                  <strong style={{ color: C.context, fontSize: 20 }}>Contextuel</strong>
                </div>
                <div style={{ color: C.textMuted, fontFamily: theme.mono, fontSize: 14, letterSpacing: 1.5, marginBottom: 4 }}>DONNÉE</div>
                {[
                  { l: "VIX", v: "18,40" },
                  { l: "VIX (1D Δ)", v: "+0,58", hi: true },
                  { l: "MOVE", v: "—", link: true },
                  { l: "MOVE (1D Δ)", v: "—", link: true, hi: true },
                  { l: "HY OAS", v: "318 bps" },
                  { l: "HY OAS (1D Δ)", v: "+6 bps", hi: true },
                  { l: "IG OAS", v: "96 bps", ig: true },
                ].map((r) => {
                  const on = (r.hi && frame >= tDet + 10 && frame < tIg) || (r.ig && frame >= tIg);
                  return (
                    <div key={r.l} style={{ height: 46, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 14px", borderRadius: 9, background: on ? `${C.accent}1a` : "transparent", border: `1px solid ${on ? C.accent : "transparent"}` }}>
                      <span style={{ color: C.textSecondary, fontSize: 20 }}>{r.l}</span>
                      <span style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <span style={{ color: C.textPrimary, fontFamily: theme.mono, fontSize: 21, fontWeight: 800 }}>{r.v}</span>
                        {r.link ? <Tag text="Cliquer pour voir" color={C.accentBright} boxed={false} /> : <Tag text="RÉEL" color={C.positive} />}
                      </span>
                    </div>
                  );
                })}
              </Panel>
            </div>
          )}
          <Cursor
            path={[
              { at: tVix - 16, x: 700, y: 640 },
              { at: tVix, x: 500, y: 130 },
              { at: tMove, x: 500, y: 240 },
              { at: tHy, x: 500, y: 350 },
              { at: tClick, x: 300, y: 240, click: true },
              { at: tDet, x: 360, y: 40, click: true },
              { at: tIg, x: 1500, y: 430 },
            ]}
          />
        </div>
      </Beat>

      <Beat from={tRef} style={{ left: 0, top: 0 }}>
        <div style={{ width: STAGE_W, height: 650, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 34 }}>
          <Big size={48}>Le réflexe : tout au même moment</Big>
          <div style={{ display: "flex", gap: 14, flexWrap: "wrap", justifyContent: "center", maxWidth: 1500 }}>
            {[
              { t: "VIX", at: cue("le vix le move", tRef) },
              { t: "MOVE", at: cue("le vix le move", tRef) + 8 },
              { t: "écarts de crédit", at: cue("les ecarts de credit", tRef) },
              { t: "F2 · taux réels", at: cue("les taux reels dans f2") },
              { t: "F6 · dollar", at: cue("le dollar dans f6") },
              { t: "F8 · financement", at: cue("et le financement dans f8") },
            ].map((s) => (
              <Pop key={s.t} at={s.at}>
                <Panel glow style={{ padding: "18px 28px" }}>
                  <Big size={30}>{s.t}</Big>
                </Panel>
              </Pop>
            ))}
          </div>
          {frame >= tQual && (
            <Pop at={tQual}>
              <Pill text="1 · qualifie le régime de stress" size={30} filled />
            </Pop>
          )}
          {frame >= tApres && (
            <Pop at={tApres}>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <Pill text="2 · seulement après : regarde l'or" size={30} />
                <GoldBarIcon size={70} />
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
    { term: "Volatilité implicite", def: "La volatilité contenue dans le prix des options ; ce n'est pas la direction réalisée", at: cue("volatilite implicite"), icon: <Umbrella size={200} /> },
    { term: "OAS", def: "L'écart par rapport à la courbe des taux de l'État, après ajustement des options intégrées", at: cue("oas"), icon: <Thermo level={0.6} color={C.accent} size={260} /> },
    { term: "Point de base", def: "Un centième de point de pourcentage ; 100 points de base = 1 point de %", at: cue("et point de base"), icon: <div style={{ fontFamily: theme.mono, fontSize: 60, fontWeight: 900, color: C.accentBright, textAlign: "center" }}>100 pb<br />= 1 %</div> },
  ];
  const activeIdx = TERMS.reduce((acc, t, i) => (frame >= t.at ? i : acc), -1);
  return (
    <SceneShell eyebrow="F7 · Vocabulaire" title="Le vocabulaire, en rafale" durationInFrames={durationInFrames}>
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
            <Panel glow style={{ display: "flex", alignItems: "center", gap: 50, padding: 50, minHeight: 380 }}>
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
  const tA = cue("le vix le move");
  const tB = cue("la volatilite mesure");
  const tC = cue("alors avant toute");
  const tR = cue("refuge");
  const tNever = cue("ne devine jamais");
  return (
    <SceneShell eyebrow="F7 · À retenir" title="Ce qu'il faut garder de F7" durationInFrames={durationInFrames}>
      <Sfx file="tick.wav" at={tA} volume={0.4} />
      <Sfx file="tick.wav" at={tB} volume={0.4} />
      <Sfx file="bass.wav" at={tC} volume={0.45} />
      <Sfx file="chime.wav" at={tNever} volume={0.55} />
      <Beat from={0} style={{ left: 0, top: 0 }}>
        <div style={{ width: STAGE_W, height: 650, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 30 }}>
          <div style={{ display: "flex", gap: 24 }}>
            <Pop at={tA}>
              <Panel glow={frame < tB} style={{ width: 600, padding: 24, display: "flex", alignItems: "center", gap: 20 }}>
                <Thermo level={0.7} size={140} />
                <Label size={27} color={C.textPrimary}>VIX, MOVE, écarts de crédit : des risques différents</Label>
              </Panel>
            </Pop>
            <Pop at={tB}>
              <Panel glow={frame >= tB && frame < tC} style={{ width: 600, padding: 24, display: "flex", alignItems: "center", gap: 20 }}>
                <Umbrella size={110} />
                <Label size={27} color={C.textPrimary}>volatilité = ampleur et incertitude, pas direction de l&apos;or</Label>
              </Panel>
            </Pop>
          </div>
          {frame >= tC && (
            <Pop at={tC}>
              <Big size={34}>Avant toute conclusion : qualifie le régime</Big>
            </Pop>
          )}
          {frame >= tR && (
            <div style={{ display: "flex", gap: 16 }}>
              {["refuge", "pénurie de dollars", "vente forcée"].map((t, i) => (
                <Pop key={t} at={tR + i * 10}>
                  <Pill text={t} size={28} color={[C.positive, C.accentBright, C.negative][i]} />
                </Pop>
              ))}
            </div>
          )}
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
