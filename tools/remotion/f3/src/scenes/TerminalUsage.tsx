import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "../theme";
import { Sfx, cueFrame, Panel, TerminalGlyph } from "./shared";
import type { SceneProps } from "./shared";
import { Beat, Pop, Cursor, clamp } from "./characters";
import { SceneShell, Big, Label, STAGE_W } from "./stage";

const Row: React.FC<{ label: string; value: React.ReactNode; lit: boolean }> = ({ label, value, lit }) => (
  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "baseline",
      padding: "16px 22px",
      borderRadius: 12,
      background: lit ? `${theme.colors.accent}1f` : "transparent",
      border: `1px solid ${lit ? theme.colors.accent : "transparent"}`,
    }}
  >
    <span style={{ color: theme.colors.textSecondary, fontSize: 24 }}>{label}</span>
    <span style={{ color: theme.colors.textPrimary, fontSize: 32, fontWeight: 700, fontFamily: theme.mono }}>{value}</span>
  </div>
);

const Note: React.FC<{ at: number; title: string; body: string }> = ({ at, title, body }) => (
  <Pop at={at}>
    <div style={{ borderLeft: `4px solid ${theme.colors.accent}`, paddingLeft: 20 }}>
      <div style={{ color: theme.colors.accentBright, fontSize: 23, fontWeight: 800 }}>{title}</div>
      <div style={{ color: theme.colors.textSecondary, fontSize: 19, lineHeight: 1.35, marginTop: 2 }}>{body}</div>
    </div>
  </Pop>
);

const LABELS = ["Favorable", "Défavorable", "Contextuel"];
const LABEL_COLORS = [theme.colors.positive, theme.colors.negative, theme.colors.textSecondary];

export const TerminalUsage: React.FC<SceneProps> = ({ subtitles, durationInFrames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const c = (i: number) => cueFrame(subtitles, i);
  const lit = (a: number, b: number) => frame >= a && frame < b;
  const labelIdx = frame >= c(19) ? Math.floor((frame - c(19)) / 22) % 3 : 0;
  const drawerP = spring({ frame: frame - c(20), fps, config: theme.spring.smooth });
  const modalP = spring({ frame: frame - (c(24) + 25), fps, config: theme.spring.bouncy });

  return (
    <SceneShell eyebrow="F3 · Dans le terminal" title="Lire la façade F3, puis le détail" durationInFrames={durationInFrames}>
      <Sfx file="pop.wav" at={c(1)} volume={0.4} />
      <Sfx file="click.wav" at={c(20)} volume={0.55} />
      <Sfx file="whoosh.wav" at={c(20)} volume={0.4} />
      <Sfx file="click.wav" at={c(24) + 25} volume={0.55} />
      <Sfx file="chime.wav" at={c(30)} volume={0.4} />

      <Beat from={c(1)} to={c(27)} style={{ left: 0, top: 0 }}>
        <div style={{ position: "relative", width: STAGE_W, height: 690 }}>
          <div style={{ position: "absolute", left: 40, top: 30, transform: `translateX(${-interpolate(drawerP, [0, 1], [0, 20])}px)` }}>
            <Panel style={{ width: 720, padding: 28 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                <TerminalGlyph size={32} />
                <span style={{ color: theme.colors.accent, fontFamily: theme.mono, fontSize: 19, letterSpacing: 2 }}>F3 · FED ET ANTICIPATIONS</span>
              </div>
              <Row label="Cible" value="4,00–4,25 %" lit={lit(c(2), c(4))} />
              <Row label="Prochaine" value="3.75 - 4.00" lit={lit(c(4), c(7))} />
              <Row
                label="Probabilité"
                lit={lit(c(7), c(14))}
                value={
                  <>
                    <span style={{ color: theme.colors.textMuted, fontSize: 24, opacity: frame >= c(10) ? 1 : 0 }}>62 %</span>
                    <span style={{ color: theme.colors.textMuted, fontSize: 24, margin: "0 10px", opacity: frame >= c(10) ? 1 : 0 }}>→</span>
                    68 %
                  </>
                }
              />
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "12px 22px",
                  borderRadius: 12,
                  border: `1px solid ${lit(c(14), c(17)) ? theme.colors.accent : "transparent"}`,
                }}
              >
                <span style={{ width: 10, height: 10, borderRadius: "50%", background: theme.colors.positive, display: "inline-block" }} />
                <span style={{ color: theme.colors.textMuted, fontSize: 19 }}>fraîcheur de la donnée</span>
              </div>
              <div style={{ marginTop: 14, padding: "0 22px" }}>
                <span
                  style={{
                    display: "inline-block",
                    border: `1.5px solid ${LABEL_COLORS[labelIdx]}`,
                    color: LABEL_COLORS[labelIdx],
                    borderRadius: 10,
                    padding: "8px 20px",
                    fontSize: 22,
                    fontWeight: 700,
                    boxShadow: lit(c(17), c(20)) ? `0 0 26px ${theme.colors.glow}` : undefined,
                  }}
                >
                  {LABELS[labelIdx]}
                </span>
              </div>
            </Panel>
          </div>

          <div style={{ position: "absolute", left: 830, top: 30, width: 880, height: 640 }}>
            <Beat from={c(2)} to={c(20)} style={{ left: 0, top: 0, width: 880, display: "flex", flexDirection: "column", gap: 16 }}>
              <Note at={c(2)} title="Cible" body="La fourchette actuelle de la Fed : borne basse, borne haute." />
              <Note at={c(4)} title="Prochaine" body="La fourchette jugée la plus probable pour la prochaine réunion, telle que la source l'affiche." />
              <Note at={c(7)} title="Probabilité" body="Le poids de cette issue. Pas la probabilité totale de baisse, pas une certitude." />
              <Note at={c(10)} title="Veille → aujourd'hui" body="Le pari se renforce ou s'affaiblit ?" />
              <Note at={c(14)} title="Fraîcheur" body="À regarder avant de comparer avec un autre site." />
              <Note at={c(17)} title="Étiquette" body="La lecture mécanique : favorable, défavorable ou contextuel." />
            </Beat>

            {frame >= c(20) && (
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  width: 880,
                  opacity: drawerP,
                  transform: `translateX(${interpolate(drawerP, [0, 1], [240, 0])}px)`,
                }}
              >
                <Panel style={{ padding: 26 }} glow>
                  <div style={{ color: theme.colors.textMuted, fontFamily: theme.mono, fontSize: 17, letterSpacing: 2, marginBottom: 12 }}>DÉTAIL · DONNÉES</div>
                  <Row label="Target Range (Lower)" value="4,00" lit={lit(c(21), c(22))} />
                  <Row label="Target Range (Upper)" value="4,25" lit={lit(c(21), c(22))} />
                  {["Implied Path (6M)", "Repricing (2W Δ)"].map((l) => (
                    <div
                      key={l}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "16px 22px",
                        borderRadius: 12,
                        border: `1px solid ${lit(c(22), c(27)) ? theme.colors.accent : "transparent"}`,
                      }}
                    >
                      <span style={{ color: theme.colors.textSecondary, fontSize: 24 }}>{l}</span>
                      <span style={{ display: "flex", gap: 10, alignItems: "center" }}>
                        <span style={{ color: theme.colors.negative, fontFamily: theme.mono, fontSize: 18, border: `1px solid ${theme.colors.negative}`, borderRadius: 6, padding: "2px 8px" }}>INDISP.</span>
                        <span style={{ color: theme.colors.context, fontSize: 18 }}>Cliquer pour voir ↗</span>
                      </span>
                    </div>
                  ))}
                </Panel>
                {frame >= c(24) + 25 && (
                  <div style={{ marginTop: 22, opacity: modalP, transform: `scale(${interpolate(modalP, [0, 1], [0.8, 1])})` }}>
                    <Panel style={{ padding: 24 }}>
                      <Label color={theme.colors.textMuted} size={18}>SOURCE EXTERNE</Label>
                      <Big size={32}>cmegroup.com · outil de probabilités</Big>
                      <div style={{ marginTop: 12, display: "inline-block", background: theme.colors.accent, color: theme.colors.bg, borderRadius: 10, padding: "8px 18px", fontSize: 20, fontWeight: 800 }}>
                        Ouvrir dans un nouvel onglet
                      </div>
                    </Panel>
                  </div>
                )}
              </div>
            )}
          </div>

          <Cursor
            path={[
              { at: c(2) - 20, x: 700, y: 640 },
              { at: c(2), x: 560, y: 150 },
              { at: c(4), x: 560, y: 225 },
              { at: c(7), x: 560, y: 300 },
              { at: c(14), x: 300, y: 370 },
              { at: c(17), x: 150, y: 440 },
              { at: c(20), x: 560, y: 225, click: true },
              { at: c(22), x: 1300, y: 330 },
              { at: c(24) + 25, x: 1560, y: 330, click: true },
            ]}
          />
        </div>
      </Beat>

      <Beat from={c(27)} style={{ left: 0, top: 0 }}>
        <div style={{ width: STAGE_W, display: "flex", flexDirection: "column", alignItems: "center", gap: 40, paddingTop: 30 }}>
          <Big size={46}>Le réflexe</Big>
          <div style={{ display: "flex", gap: 30, alignItems: "center" }}>
            {[
              { t: "Comparer à l'état précédent", at: c(28) },
              { t: "Trouver le déclencheur", at: c(29) },
              { t: "F2 : 2 ans et taux réels", at: c(30) },
              { t: "F6 : le dollar", at: c(32) },
            ].map((s, i) => (
              <React.Fragment key={s.t}>
                {i > 0 && <div style={{ color: theme.colors.accent, fontSize: 40 }}>→</div>}
                <Pop at={s.at}>
                  <Panel style={{ width: 330, textAlign: "center", padding: 30 }} glow={i >= 2 && frame >= s.at}>
                    <div style={{ color: theme.colors.accent, fontFamily: theme.mono, fontSize: 20 }}>{i + 1}</div>
                    <Big size={28}>{s.t}</Big>
                  </Panel>
                </Pop>
              </React.Fragment>
            ))}
          </div>
          <Pop at={c(34)}>
            <Big size={34} color={theme.colors.accentBright}>Le pari change mais rien ne confirme ? Ça reste du contexte</Big>
          </Pop>
        </div>
      </Beat>
    </SceneShell>
  );
};
