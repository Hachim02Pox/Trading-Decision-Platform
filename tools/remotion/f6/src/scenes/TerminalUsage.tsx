import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "../theme";
import { Sfx, makeCue, Panel, TerminalGlyph } from "./shared";
import type { SceneProps } from "./shared";
import { Beat, Pop, Cursor } from "./characters";
import { SceneShell, Big, Label, STAGE_W } from "./stage";
import { Pill } from "./props5";

const C = theme.colors;

const Tag: React.FC<{ text: string; color: string }> = ({ text, color }) => (
  <span style={{ color, fontSize: 14, fontFamily: theme.mono, fontWeight: 700, border: `1px solid ${color}`, borderRadius: 5, padding: "1px 7px", whiteSpace: "nowrap" }}>{text}</span>
);

/** Face mini-cell (KpiMiniCell): label + RÉEL + mechanical label, previous → current. */
const Cell: React.FC<{ label: string; prev: string; value: string; unit?: string; read: "Favorable" | "Défavorable"; lit: boolean; big?: boolean; readLit?: boolean }> = ({ label, prev, value, unit, read, lit, big, readLit }) => {
  const col = read === "Favorable" ? C.positive : C.negative;
  return (
    <div style={{ padding: "14px 18px", borderRadius: 14, background: lit ? `${C.accent}1f` : C.panel, border: `1px solid ${lit ? C.accent : C.hairline}`, marginBottom: 10 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ color: C.textSecondary, fontSize: 20 }}>{label}</span>
        <Tag text="RÉEL" color={C.positive} />
        <span style={{ marginLeft: "auto", color: col, fontSize: 15, border: `1px solid ${col}`, borderRadius: 6, padding: "1px 8px", boxShadow: readLit ? `0 0 16px ${col}` : undefined }}>{read}</span>
      </div>
      <div style={{ marginTop: 8, fontFamily: theme.mono, display: "flex", alignItems: "baseline", gap: 8 }}>
        <span style={{ color: C.textMuted, fontSize: 21 }}>{prev}</span>
        <span style={{ color: C.textMuted, fontSize: 21 }}>→</span>
        <span style={{ color: C.textPrimary, fontSize: big ? 44 : 32, fontWeight: 800 }}>{value}</span>
        {unit && <span style={{ color: C.textSecondary, fontSize: 20 }}>{unit}</span>}
      </div>
    </div>
  );
};

export const TerminalUsage: React.FC<SceneProps> = ({ words, durationInFrames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const cue = makeCue(words);
  const tFace = cue("la facade de f6");
  const tLevel = cue("le niveau du dxy");
  const tJour = cue("la variation du jour");
  const t5 = cue("et la variation sur cinq");
  const tEtiq = cue("chacun porte");
  const tVar = cue("pour les variations");
  const tNiv = cue("pour le niveau");
  const tCanal = cue("les trois chiffres mesurent");
  const tCombine = cue("le terminal les combine");
  const tAccord = cue("s ils sont d accord");
  const tContre = cue("s ils se contredisent");
  const tDetail = cue("dans le detail");
  const tEtat = cue("aligne ou divergent");
  const tCalc = cue("c est une etiquette calculee");
  const tSource = cue("et la source est indiquee");
  const tRef = cue("ensuite le reflexe");
  const tF2 = cue("f2 pour les taux");
  const tF3 = cue("f3 f4 et f5");
  const tF7 = cue("f7 et f8");
  const tF10 = cue("f10 pour");
  const tF13 = cue("f13 pour");
  const tOr = cue("et surtout compare");

  const lit = (a: number, b: number) => frame >= a && frame < b;
  const drawerP = spring({ frame: frame - tDetail, fps, config: theme.spring.smooth });
  const combineP = interpolate(frame, [tCombine, tCombine + 30], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: theme.ease.inOut });

  return (
    <SceneShell eyebrow="F6 · Dans le terminal" title="Trois chiffres, un seul canal" durationInFrames={durationInFrames}>
      <Sfx file="pop.wav" at={tFace} volume={0.4} />
      <Sfx file="tick.wav" at={tLevel} volume={0.35} />
      <Sfx file="tick.wav" at={tJour} volume={0.35} />
      <Sfx file="tick.wav" at={t5} volume={0.35} />
      <Sfx file="whoosh.wav" at={tCombine} volume={0.4} />
      <Sfx file="bass.wav" at={tContre} volume={0.4} />
      <Sfx file="click.wav" at={tDetail} volume={0.55} />
      <Sfx file="whoosh.wav" at={tRef} volume={0.45} />

      <Beat from={tFace - 6} to={tRef} style={{ left: 0, top: 0 }}>
        <div style={{ position: "relative", width: STAGE_W, height: 690 }}>
          <div style={{ position: "absolute", left: 10, top: 0 }}>
            <Panel style={{ width: 720, padding: 22 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                <TerminalGlyph size={30} />
                <span style={{ color: C.textPrimary, fontSize: 22, fontWeight: 700 }}>USD / Change</span>
                <span style={{ marginLeft: "auto", width: 12, height: 12, borderRadius: "50%", background: C.positive }} />
              </div>
              <Cell label="DXY" prev="104,81" value="104,62" read="Favorable" big lit={lit(tLevel, tJour) || lit(tNiv, tCanal)} readLit={lit(tNiv, tCanal)} />
              <Cell label="Today %" prev="−0,05" value="−0,18" unit="%" read="Favorable" lit={lit(tJour, t5)} readLit={lit(tVar, tNiv)} />
              <Cell label="5D %" prev="+0,30" value="+0,42" unit="%" read="Défavorable" lit={lit(t5, tEtiq)} readLit={lit(tVar, tNiv)} />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
                <span style={{ color: C.textMuted, fontFamily: theme.mono, fontSize: 13 }}>valeurs d&apos;exemple</span>
                <span style={{ color: C.context, fontSize: 15, border: `1px solid ${C.context}`, borderRadius: 999, padding: "2px 12px", boxShadow: frame >= tContre ? `0 0 16px ${C.context}` : undefined }}>Contextuel</span>
              </div>
            </Panel>
          </div>
          {/* notes */}
          <div style={{ position: "absolute", left: 770, top: 0, width: 950, display: "flex", flexDirection: "column", gap: 16 }}>
            {frame >= tVar && frame < tDetail && (
              <Pop at={tVar}>
                <Panel style={{ padding: "14px 22px" }}>
                  <Label size={24} color={C.textPrimary}>variation négative = dollar en baisse → « Favorable » pour l&apos;or</Label>
                  {frame >= tNiv && <Label size={22}>le niveau : comparé au relevé précédent</Label>}
                </Panel>
              </Pop>
            )}
            {frame >= tCanal && frame < tDetail && (
              <Pop at={tCanal}>
                <Panel glow style={{ padding: "18px 22px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 18, justifyContent: "center" }}>
                    {["DXY", "Today %", "5D %"].map((t, i) => (
                      <div key={t} style={{ transform: `translateX(${(1 - i) * 140 * combineP}px)`, opacity: 1 - combineP * (i === 1 ? 0 : 0.6) }}>
                        <Pill text={t} color={C.context} size={22} />
                      </div>
                    ))}
                    <span style={{ fontSize: 34, color: C.accent }}>→</span>
                    <Pill text="1 canal : USD" size={24} filled />
                  </div>
                  <Label size={22}>une seule lecture, jamais trois votes</Label>
                </Panel>
              </Pop>
            )}
            {frame >= tAccord && frame < tDetail && (
              <Pop at={tAccord}>
                <div style={{ display: "flex", gap: 16 }}>
                  <Panel style={{ padding: "12px 18px", width: 450 }}>
                    <Label size={22} color={C.textPrimary}>d&apos;accord → la famille prend ce sens</Label>
                  </Panel>
                  {frame >= tContre && (
                    <Panel glow style={{ padding: "12px 18px", width: 470, borderColor: C.context }}>
                      <Label size={22} color={C.textPrimary}>en désaccord → « Contextuel » + message</Label>
                      <Label size={17}>« Les contributeurs mécaniques disponibles pointent dans des directions différentes. »</Label>
                    </Panel>
                  )}
                </div>
              </Pop>
            )}
          </div>
          {/* drawer */}
          {frame >= tDetail && (
            <div style={{ position: "absolute", left: 790, top: 0, width: 930, opacity: drawerP, transform: `translateX(${interpolate(drawerP, [0, 1], [240, 0])}px)` }}>
              <Panel glow style={{ padding: "18px 22px" }}>
                <div style={{ color: C.textMuted, fontFamily: theme.mono, fontSize: 14, letterSpacing: 1.5 }}>CE QUE CETTE FAMILLE DIT ACTUELLEMENT POUR L&apos;OR</div>
                <div style={{ display: "flex", alignItems: "center", gap: 14, margin: "8px 0 14px" }}>
                  <span style={{ color: C.textSecondary, fontSize: 18 }}>Impact sur l&apos;or</span>
                  <strong style={{ color: C.context, fontSize: 20 }}>Contextuel</strong>
                </div>
                <div style={{ color: C.textMuted, fontFamily: theme.mono, fontSize: 14, letterSpacing: 1.5, marginBottom: 4 }}>DONNÉE</div>
                {[
                  { l: "DXY", v: "104,62" },
                  { l: "Today %", v: "−0,18 %" },
                  { l: "5D %", v: "+0,42 %" },
                  { l: "USD State", v: "—", hi: true },
                ].map((r) => (
                  <div key={r.l} style={{ height: 50, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 14px", borderRadius: 9, background: r.hi && frame >= tEtat ? `${C.accent}1a` : "transparent", border: `1px solid ${r.hi && frame >= tEtat ? C.accent : "transparent"}` }}>
                    <span style={{ color: C.textSecondary, fontSize: 20 }}>{r.l}</span>
                    <span style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <span style={{ color: C.textPrimary, fontFamily: theme.mono, fontSize: 22, fontWeight: 800 }}>{r.v}</span>
                      <Tag text="RÉEL" color={C.positive} />
                    </span>
                  </div>
                ))}
              </Panel>
              <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 20 }}>
                {frame >= tEtat && (
                  <Pop at={tEtat}>
                    <div style={{ display: "flex", gap: 14 }}>
                      <Pill text="aligné" color={C.context} size={24} />
                      <Pill text="divergent" color={C.accentBright} size={24} filled />
                      <Label size={22} color={C.textPrimary}>entre le jour et les cinq séances</Label>
                    </div>
                  </Pop>
                )}
                {frame >= tCalc && (
                  <Pop at={tCalc}>
                    <Label size={22}>une étiquette calculée : aucune nouvelle donnée</Label>
                  </Pop>
                )}
                {frame >= tSource && (
                  <Pop at={tSource}>
                    <Pill text="source : Yahoo (non officielle)" color={C.negative} size={22} />
                  </Pop>
                )}
              </div>
            </div>
          )}
          <Cursor
            path={[
              { at: tLevel - 16, x: 700, y: 640 },
              { at: tLevel, x: 520, y: 130 },
              { at: tJour, x: 520, y: 250 },
              { at: t5, x: 520, y: 360 },
              { at: tDetail, x: 360, y: 40, click: true },
              { at: tEtat, x: 1500, y: 290 },
            ]}
          />
        </div>
      </Beat>

      <Beat from={tRef} style={{ left: 0, top: 0 }}>
        <div style={{ width: STAGE_W, height: 650, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 36 }}>
          <Big size={48}>Le réflexe</Big>
          <div style={{ display: "flex", gap: 16, alignItems: "stretch" }}>
            {[
              { t: "F2", d: "taux et écarts de taux réels", at: tF2 },
              { t: "F3 · F4 · F5", d: "déclencheurs monétaires", at: tF3 },
              { t: "F7 · F8", d: "stress et financement", at: tF7 },
              { t: "F10", d: "positionnement", at: tF10 },
              { t: "F13", d: "calendrier", at: tF13 },
            ].map((s) => (
              <Pop key={s.t} at={s.at}>
                <Panel glow={frame >= s.at} style={{ width: 300, textAlign: "center", padding: 22, minHeight: 170 }}>
                  <Big size={32} color={C.accentBright}>{s.t}</Big>
                  <Label size={22} color={C.textPrimary}>{s.d}</Label>
                </Panel>
              </Pop>
            ))}
          </div>
          {frame >= tOr && (
            <Pop at={tOr}>
              <Pill text="puis compare avec le vrai mouvement de l'or, sur la même fenêtre" size={28} filled />
            </Pop>
          )}
        </div>
      </Beat>
    </SceneShell>
  );
};
