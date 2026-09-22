import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "../theme";
import { Sfx, cueFrame, Panel, AnimatedNumber } from "./shared";
import type { SceneProps } from "./shared";
import { Beat, Pop, Person, Bubble, clamp } from "./characters";
import { SceneShell, Big, Label } from "./stage";

const NEUTRAL = "#3a4250";

export const Distribution: React.FC<SceneProps> = ({ subtitles, durationInFrames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const c = (i: number) => cueFrame(subtitles, i);

  const groupOf = (i: number) => (i < 25 ? 0 : i < 85 ? 1 : 2);
  const groupCue = [c(4), c(5), c(7)];
  const groupColor = [theme.colors.textSecondary, theme.colors.accent, theme.colors.context];
  const cutsHighlight = frame >= c(11) && frame < c(13);
  const modeHighlight = frame >= c(8) && frame < c(11);
  const otherHighlight = frame >= c(18) && frame < c(22);

  const bars = [
    { label: "Statu quo", pct: 25, color: groupColor[0], at: groupCue[0] },
    { label: "Baisse de 0,25", pct: 60, color: groupColor[1], at: groupCue[1] },
    { label: "Baisse de 0,50", pct: 15, color: groupColor[2], at: groupCue[2] },
  ];

  return (
    <SceneShell eyebrow="F3 · Distribution" title="Cent investisseurs votent" durationInFrames={durationInFrames}>
      <Sfx file="whoosh.wav" at={c(2)} volume={0.4} />
      <Sfx file="pop.wav" at={c(4)} volume={0.45} />
      <Sfx file="pop.wav" at={c(5)} volume={0.45} />
      <Sfx file="pop.wav" at={c(7)} volume={0.45} />
      <Sfx file="chime.wav" at={c(10)} volume={0.5} />
      <Sfx file="chime.wav" at={c(12)} volume={0.45} />
      <Sfx file="bass.wav" at={c(17)} volume={0.6} />

      <div style={{ position: "absolute", left: 40, top: 10, display: "grid", gridTemplateColumns: "repeat(10, 52px)", gap: "6px 6px" }}>
        {Array.from({ length: 100 }).map((_, i) => {
          const g = groupOf(i);
          const colored = frame >= groupCue[g] + (i % 10) * 1.2;
          const active =
            (modeHighlight && g === 1) || (cutsHighlight && g !== 0) || (otherHighlight && g !== 1);
          const dim = (modeHighlight || cutsHighlight || otherHighlight) && !active;
          return (
            <Pop key={i} at={c(2) + Math.floor(i / 10) * 3 + (i % 10)}>
              <div style={{ opacity: dim ? 0.25 : 1 }}>
                <Person
                  size={56}
                  phase={i * 0.7}
                  color={colored ? groupColor[g] : NEUTRAL}
                  skin={["#d9b99b", "#a87b5b", "#f0d2b6", "#7a5238"][i % 4]}
                  cheer={active && modeHighlight}
                  wave={active && otherHighlight}
                />
              </div>
            </Pop>
          );
        })}
      </div>

      <Beat from={c(4)} to={c(14)} style={{ left: 780, top: 60 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 34, width: 880 }}>
          {bars.map((b, i) => {
            const p = spring({ frame: frame - b.at, fps, config: theme.spring.smooth });
            const isMode = i === 1 && frame >= c(8);
            return (
              <div key={b.label} style={{ opacity: p }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                  <span style={{ color: theme.colors.textPrimary, fontSize: 26, fontWeight: 700 }}>
                    {b.label}
                    {isMode && (
                      <span style={{ marginLeft: 14, color: theme.colors.bg, background: theme.colors.accentBright, borderRadius: 999, padding: "2px 12px", fontSize: 16, fontFamily: theme.mono }}>
                        LE PLUS PROBABLE
                      </span>
                    )}
                  </span>
                  <AnimatedNumber from={0} to={b.pct} delay={b.at} format={(n) => `${Math.round(n)} %`} style={{ color: b.color, fontSize: 30, fontWeight: 800, fontFamily: theme.mono }} />
                </div>
                <div style={{ height: 34, borderRadius: 10, background: theme.colors.panelAlt, overflow: "hidden", border: `1px solid ${theme.colors.hairline}` }}>
                  <div
                    style={{
                      width: `${b.pct * p}%`,
                      height: "100%",
                      background: `linear-gradient(90deg, ${b.color}, ${b.color}88)`,
                      boxShadow: isMode ? `0 0 30px ${theme.colors.glow}` : undefined,
                    }}
                  />
                </div>
              </div>
            );
          })}
          <Pop at={c(11)}>
            <Panel style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }} glow={cutsHighlight}>
              <Label color={theme.colors.textPrimary} size={26}>60 % + 15 % = chances de baisse</Label>
              <AnimatedNumber from={0} to={75} delay={c(12)} format={(n) => `${Math.round(n)} %`} style={{ color: theme.colors.accentBright, fontSize: 44, fontWeight: 800, fontFamily: theme.mono }} />
            </Panel>
          </Pop>
        </div>
      </Beat>

      <Beat from={c(14)} to={c(22)} style={{ left: 820, top: 0 }}>
        <div style={{ position: "relative", width: 840, height: 680 }}>
          <div style={{ position: "absolute", left: 60, top: 240 }}>
            <Person size={230} color={theme.colors.context} label="Hachim" cheer={frame >= c(15) && frame < c(17)} />
          </div>
          <div style={{ position: "absolute", left: 0, top: 70 }}>
            <Pop at={c(15)}>
              <Bubble text="60 % ? C'est sûr !" width={340} />
            </Pop>
          </div>
          <div style={{ position: "absolute", left: 340, top: 120 }}>
            <Pop at={c(17)}>
              <div
                style={{
                  border: `6px solid ${theme.colors.negative}`,
                  color: theme.colors.negative,
                  fontSize: 92,
                  fontWeight: 900,
                  padding: "4px 30px",
                  borderRadius: 16,
                  transform: "rotate(-10deg)",
                  letterSpacing: 6,
                }}
              >
                FAUX
              </div>
            </Pop>
          </div>
          <div style={{ position: "absolute", left: 380, top: 380 }}>
            <Pop at={c(18)}>
              <Panel glow>
                <AnimatedNumber from={0} to={40} delay={c(18)} format={(n) => `${Math.round(n)} %`} style={{ color: theme.colors.accentBright, fontSize: 64, fontWeight: 900, fontFamily: theme.mono }} />
                <Label color={theme.colors.textPrimary}>de chances que ça se passe autrement</Label>
                <Label size={19}>25 % statu quo + 15 % baisse plus forte</Label>
              </Panel>
            </Pop>
          </div>
        </div>
      </Beat>

      <Beat from={c(22)} style={{ left: 820, top: 150 }}>
        <div style={{ width: 820, display: "flex", flexDirection: "column", gap: 30, alignItems: "center" }}>
          <Big size={44}>Des estimations</Big>
          <Label size={26}>déduites des prix du marché</Label>
          <div style={{ display: "flex", gap: 22, marginTop: 10 }}>
            <Pop at={c(24)}>
              <Panel style={{ padding: "18px 26px" }}>
                <span style={{ color: theme.colors.negative, fontSize: 24, fontWeight: 800 }}>✕ pas officiel</span>
              </Panel>
            </Pop>
            <Pop at={c(26)}>
              <Panel style={{ padding: "18px 26px" }}>
                <span style={{ color: theme.colors.negative, fontSize: 24, fontWeight: 800 }}>✕ pas certain</span>
              </Panel>
            </Pop>
          </div>
          <div
            style={{
              marginTop: 20,
              opacity: interpolate(frame, [c(27), c(27) + 15], [0, 1], { ...clamp, easing: theme.ease.out }),
            }}
          >
            <Big size={32} color={theme.colors.accentBright}>
              Le plus probable n&apos;est qu&apos;une partie de l&apos;histoire
            </Big>
          </div>
        </div>
      </Beat>
    </SceneShell>
  );
};
