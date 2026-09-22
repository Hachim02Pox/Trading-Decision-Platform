import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "../theme";
import { Sfx, cueFrame, Panel, TerminalGlyph } from "./shared";
import type { SceneProps } from "./shared";
import { Beat, Pop, Cursor } from "./characters";
import { SceneShell, Big, Label, STAGE_W } from "./stage";

const Cell: React.FC<{ label: string; prev: string; value: string; lit: boolean; big?: boolean }> = ({ label, prev, value, lit, big }) => (
  <div
    style={{
      padding: "16px 18px",
      borderRadius: 14,
      background: lit ? `${theme.colors.accent}1f` : theme.colors.panel,
      border: `1px solid ${lit ? theme.colors.accent : theme.colors.hairline}`,
    }}
  >
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <span style={{ color: theme.colors.textSecondary, fontSize: 19 }}>{label}</span>
      <span style={{ color: theme.colors.textMuted, fontSize: 15, border: `1px solid ${theme.colors.hairline}`, borderRadius: 6, padding: "1px 8px" }}>Contextuel</span>
    </div>
    <div style={{ marginTop: 8, fontFamily: theme.mono }}>
      <span style={{ color: theme.colors.textMuted, fontSize: 20 }}>{prev} → </span>
      <span style={{ color: theme.colors.textPrimary, fontSize: big ? 38 : 30, fontWeight: 800 }}>{value}</span>
    </div>
  </div>
);

const ROWS = [
  { l: "Core CPI (MoM)", v: "0,28 %", src: "BLS", deep: false },
  { l: "Core CPI (YoY)", v: "3,0 %", src: "BLS", deep: false },
  { l: "Headline CPI (MoM)", v: "0,31 %", src: "BLS", deep: true },
  { l: "Headline CPI (YoY)", v: "3,4 %", src: "BLS", deep: true },
  { l: "Core PCE (MoM)", v: "0,24 %", src: "BEA", deep: false },
  { l: "Core PCE (YoY)", v: "2,8 %", src: "BEA", deep: false },
  { l: "Headline PCE (YoY)", v: "2,9 %", src: "BEA", deep: true },
  { l: "Core CPI 3M Annualized", v: "3,3 %", src: "BLS · calcul", deep: true },
  { l: "PPI Final Demand (MoM)", v: "0,20 %", src: "BLS", deep: true },
];

export const TerminalUsage: React.FC<SceneProps> = ({ subtitles, durationInFrames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const c = (i: number) => cueFrame(subtitles, i);
  const lit = (a: number, b: number) => frame >= a && frame < b;
  const drawerP = spring({ frame: frame - c(9), fps, config: theme.spring.smooth });
  const deepCues = [c(11), c(12), c(13), c(14), c(16)];
  let deepIdx = -1;

  return (
    <SceneShell eyebrow="F4 · Dans le terminal" title="La façade, puis le détail" durationInFrames={durationInFrames}>
      <Sfx file="pop.wav" at={c(1)} volume={0.4} />
      <Sfx file="click.wav" at={c(9)} volume={0.55} />
      <Sfx file="whoosh.wav" at={c(9)} volume={0.4} />
      <Sfx file="chime.wav" at={c(18)} volume={0.4} />
      <Sfx file="bass.wav" at={c(27)} volume={0.4} />
      <Sfx file="whoosh.wav" at={c(31)} volume={0.4} />

      <Beat from={c(1)} to={c(31)} style={{ left: 0, top: 0 }}>
        <div style={{ position: "relative", width: STAGE_W, height: 690 }}>
          <div style={{ position: "absolute", left: 20, top: 10 }}>
            <Panel style={{ width: 760, padding: 24 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                <TerminalGlyph size={30} />
                <span style={{ color: theme.colors.accent, fontFamily: theme.mono, fontSize: 18, letterSpacing: 2 }}>F4 · INFLATION — FAÇADE</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <Cell label="Core CPI (MoM)" prev="0,24" value="0,28 %" lit={lit(c(2), c(4))} big />
                <Cell label="Core CPI (YoY)" prev="2,9" value="3,0 %" lit={lit(c(4), c(5))} />
                <Cell label="Core PCE (MoM)" prev="0,21" value="0,24 %" lit={lit(c(5), c(6))} />
                <Cell label="Core PCE (YoY)" prev="2,7" value="2,8 %" lit={lit(c(6), c(7))} />
              </div>
              <div style={{ color: theme.colors.textMuted, fontFamily: theme.mono, fontSize: 14, marginTop: 10, textAlign: "right" }}>valeurs d&apos;exemple</div>
            </Panel>
          </div>

          <div style={{ position: "absolute", left: 20, top: 440, display: "flex", flexDirection: "column", gap: 14, width: 760 }}>
            <Pop at={c(7)}>
              <Label color={theme.colors.textPrimary} size={24}>Sur un mois = l&apos;impulsion du moment · sur un an = le contexte</Label>
            </Pop>
            <Pop at={c(23)}>
              <Label color={theme.colors.accentBright} size={24}>Tout est classé « Contextuel » · une carte de départ, pas un verdict</Label>
            </Pop>
            <Pop at={c(27)}>
              <Panel style={{ padding: "12px 20px", borderColor: theme.colors.negative }}>
                <Label color={theme.colors.textPrimary} size={22}>Le consensus n&apos;est pas affiché ici → compare toi-même à ce qui était attendu</Label>
              </Panel>
            </Pop>
          </div>

          {frame >= c(9) && (
            <div style={{ position: "absolute", left: 820, top: 10, width: 900, opacity: drawerP, transform: `translateX(${interpolate(drawerP, [0, 1], [240, 0])}px)` }}>
              <Panel glow style={{ padding: 22 }}>
                <div style={{ color: theme.colors.textMuted, fontFamily: theme.mono, fontSize: 16, letterSpacing: 2, marginBottom: 8 }}>DÉTAIL · DONNÉES</div>
                {ROWS.map((r) => {
                  const at = r.deep ? deepCues[++deepIdx] : -1;
                  const on = r.deep && frame >= at;
                  return (
                    <div
                      key={r.l}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "9px 16px",
                        borderRadius: 10,
                        background: on ? `${theme.colors.accent}1a` : "transparent",
                        border: `1px solid ${on ? theme.colors.accent : "transparent"}`,
                        opacity: r.deep ? 1 : 0.55,
                      }}
                    >
                      <span style={{ color: theme.colors.textSecondary, fontSize: 21 }}>{r.l}</span>
                      <span style={{ display: "flex", alignItems: "center", gap: 14 }}>
                        <span style={{ color: r.src.startsWith("BEA") ? theme.colors.context : theme.colors.accentBright, fontFamily: theme.mono, fontSize: 15, opacity: frame >= c(19) + (r.src.startsWith("BEA") ? 40 : 0) ? 1 : 0 }}>
                          {r.src}
                        </span>
                        <span style={{ color: theme.colors.textPrimary, fontFamily: theme.mono, fontSize: 22, fontWeight: 800 }}>{r.v}</span>
                      </span>
                    </div>
                  );
                })}
              </Panel>
            </div>
          )}

          <Cursor
            path={[
              { at: c(2) - 20, x: 700, y: 620 },
              { at: c(2), x: 200, y: 150 },
              { at: c(4), x: 560, y: 150 },
              { at: c(5), x: 200, y: 260 },
              { at: c(6), x: 560, y: 260 },
              { at: c(9), x: 420, y: 60, click: true },
              { at: c(12), x: 1500, y: 170 },
              { at: c(16), x: 1500, y: 460 },
            ]}
          />
        </div>
      </Beat>

      <Beat from={c(31)} style={{ left: 0, top: 0 }}>
        <div style={{ width: STAGE_W, display: "flex", flexDirection: "column", alignItems: "center", gap: 40, paddingTop: 30 }}>
          <Big size={46}>Le réflexe</Big>
          <div style={{ display: "flex", gap: 22, alignItems: "center" }}>
            {[
              { t: "Date de publication + horizon", at: c(32) },
              { t: "F3 : le pari sur la Fed", at: c(35) },
              { t: "F2 : taux réels, inflation implicite", at: c(37) },
              { t: "F6 : le dollar", at: c(38) + 20 },
              { t: "F13 : prochaine publication", at: c(39) },
            ].map((s, i) => (
              <React.Fragment key={s.t}>
                {i > 0 && <div style={{ color: theme.colors.accent, fontSize: 36 }}>→</div>}
                <Pop at={s.at}>
                  <Panel style={{ width: 270, textAlign: "center", padding: 24 }} glow={frame >= s.at}>
                    <div style={{ color: theme.colors.accent, fontFamily: theme.mono, fontSize: 20 }}>{i + 1}</div>
                    <Big size={25}>{s.t}</Big>
                  </Panel>
                </Pop>
              </React.Fragment>
            ))}
          </div>
        </div>
      </Beat>
    </SceneShell>
  );
};
