import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { theme } from "../theme";
import { Sfx, cueFrame, Panel } from "./shared";
import type { SceneProps } from "./shared";
import { Beat, Pop, clamp } from "./characters";
import { SceneShell, Center, Big, Label, STAGE_W } from "./stage";

const Tok: React.FC<{ at: number; children: React.ReactNode; color?: string }> = ({ at, children, color = theme.colors.textPrimary }) => (
  <Pop at={at}>
    <span style={{ color, fontFamily: theme.mono, fontSize: 50, fontWeight: 800, margin: "0 6px" }}>{children}</span>
  </Pop>
);

const MONTHLY = [0.24, 0.22, 0.25, 0.23, 0.21, 0.24, 0.62, 0.22, 0.23, 0.24, 0.22, 0.23];

export const Annualized: React.FC<SceneProps> = ({ subtitles, durationInFrames }) => {
  const frame = useCurrentFrame();
  const c = (i: number) => cueFrame(subtitles, i);
  const stretch = interpolate(frame, [c(3), c(5) + 20], [0, 1], { ...clamp, easing: theme.ease.inOut });
  const drawP = interpolate(frame, [c(14), c(19) + 30], [0, 1], { ...clamp, easing: theme.ease.inOut });

  const ann3 = MONTHLY.map((_, i) => {
    if (i < 2) return null;
    const r = (1 + MONTHLY[i] / 100) * (1 + MONTHLY[i - 1] / 100) * (1 + MONTHLY[i - 2] / 100);
    return (Math.pow(r, 4) - 1) * 100;
  });
  const yoyish = MONTHLY.map((_, i) => 2.8 + (i >= 6 ? 0.05 * (i - 5) : 0));
  const X = (i: number) => 60 + i * 64;
  const Y = (v: number) => 360 - v * 38;
  const count = Math.floor(drawP * 11) + 1;
  const line = (arr: Array<number | null>) =>
    arr
      .map((v, i) => (v === null || i >= count ? null : `${X(i)},${Y(v)}`))
      .filter(Boolean)
      .join(" ");

  return (
    <SceneShell eyebrow="F4 · Tendance" title="L'annualisé sur trois mois" durationInFrames={durationInFrames}>
      <Sfx file="whoosh.wav" at={c(3)} volume={0.4} />
      {[c(7), c(8), c(9), c(10)].map((at, i) => (
        <Sfx key={i} file="tick.wav" at={at} volume={0.4} />
      ))}
      <Sfx file="chime.wav" at={c(10) + 20} volume={0.5} />
      <Sfx file="bass.wav" at={c(16)} volume={0.45} />
      <Sfx file="chime.wav" at={c(22)} volume={0.45} />

      <Beat from={c(0)} to={c(6)} style={{ left: 0, top: 0 }}>
        <Center column gap={40}>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 10 }}>
            {Array.from({ length: 12 }).map((_, i) => {
              const real = i < 3;
              const on = real || stretch * 9 > i - 3;
              return (
                <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                  <div
                    style={{
                      width: 90,
                      height: on ? 120 : 0,
                      borderRadius: 10,
                      background: real ? theme.colors.accent : "transparent",
                      border: real ? "none" : `3px dashed ${theme.colors.accentDim}`,
                    }}
                  />
                  <span style={{ color: real ? theme.colors.accentBright : theme.colors.textMuted, fontFamily: theme.mono, fontSize: 18 }}>M{i + 1}</span>
                </div>
              );
            })}
          </div>
          <Big size={40}>3 vrais mois, prolongés sur une année entière</Big>
        </Center>
      </Beat>

      <Beat from={c(6)} to={c(14)} style={{ left: 0, top: 0 }}>
        <Center column gap={46}>
          <Label color={theme.colors.textMuted} size={22}>LA VRAIE FORMULE (exemple)</Label>
          <Panel glow style={{ padding: "30px 40px" }}>
            <div style={{ display: "flex", alignItems: "center", flexWrap: "nowrap" }}>
              <Tok at={c(6)}>[ (</Tok>
              <Tok at={c(7)} color={theme.colors.accentBright}>310,93</Tok>
              <Tok at={c(8)}>÷</Tok>
              <Tok at={c(8) + 15} color={theme.colors.context}>309,01</Tok>
              <Tok at={c(9)}>)</Tok>
              <Pop at={c(9) + 10}>
                <span style={{ color: theme.colors.accentBright, fontFamily: theme.mono, fontSize: 36, fontWeight: 900, position: "relative", top: -26, marginRight: 6 }}>4</span>
              </Pop>
              <Tok at={c(10)}>− 1 ] × 100</Tok>
              <Tok at={c(10) + 20} color={theme.colors.accentBright}>= 2,51 %</Tok>
            </div>
          </Panel>
          <Pop at={c(10) + 30}>
            <Panel style={{ padding: "20px 36px", opacity: 0.9 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
                <span style={{ color: theme.colors.textMuted, fontFamily: theme.mono, fontSize: 34, textDecoration: "line-through" }}>(0,20 + 0,22 + 0,20) × 4</span>
                <span style={{ color: theme.colors.textSecondary, fontFamily: theme.mono, fontSize: 34 }}>= 2,48 %</span>
              </div>
              <Label size={22}>le raccourci : proche seulement quand les chiffres sont petits</Label>
            </Panel>
          </Pop>
        </Center>
      </Beat>

      <Beat from={c(14)} to={c(20)} style={{ left: 0, top: 0 }}>
        <Center gap={60}>
          <Panel style={{ width: 880 }}>
            <svg width="820" height="420" viewBox="0 0 820 420">
              {MONTHLY.map((v, i) => (
                <rect key={i} x={X(i) - 18} y={400 - v * 150} width="36" height={v * 150} rx="5" fill={i === 6 ? theme.colors.negative : theme.colors.hairline} opacity={i < count ? 1 : 0} />
              ))}
              <polyline points={line(ann3)} fill="none" stroke={theme.colors.accentBright} strokeWidth="5" strokeLinejoin="round" />
              <polyline points={line(yoyish)} fill="none" stroke={theme.colors.context} strokeWidth="5" strokeLinejoin="round" />
              <text x="60" y="30" fill={theme.colors.accentBright} fontSize="22" fontWeight="800">annualisé 3 mois : réagit vite, amplifie le bruit</text>
              <text x="60" y="60" fill={theme.colors.context} fontSize="22" fontWeight="800">sur un an : lisse, mais en retard</text>
            </svg>
          </Panel>
          <div style={{ display: "flex", flexDirection: "column", gap: 24, width: 560 }}>
            <Pop at={c(14)}>
              <Big size={32} color={theme.colors.positive}>+ On voit vite si ça accélère</Big>
            </Pop>
            <Pop at={c(16)}>
              <Big size={32} color={theme.colors.negative}>− Un seul mois agité peut dominer</Big>
            </Pop>
            <Pop at={c(19)}>
              <Big size={32} color={theme.colors.context}>Le chiffre sur un an réagit tard</Big>
            </Pop>
          </div>
        </Center>
      </Beat>

      <Beat from={c(20)} style={{ left: 0, top: 0 }}>
        <div style={{ width: STAGE_W, display: "flex", flexDirection: "column", alignItems: "center", gap: 40, paddingTop: 40 }}>
          <div style={{ display: "flex", gap: 50 }}>
            {["1 mois", "3 mois annualisé", "1 an", "composantes"].map((l, i) => (
              <Pop key={l} at={c(20) + i * 8}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
                  <svg width="150" height="150" viewBox="0 0 100 100">
                    <circle cx="42" cy="42" r="28" stroke={theme.colors.accentBright} strokeWidth="6" fill={`${theme.colors.accent}22`} />
                    <line x1="62" y1="62" x2="88" y2="88" stroke={theme.colors.accentBright} strokeWidth="9" strokeLinecap="round" />
                  </svg>
                  <Big size={26}>{l}</Big>
                </div>
              </Pop>
            ))}
          </div>
          <Pop at={c(22)}>
            <Big size={36} color={theme.colors.accentBright}>Des lectures calculées, pas de nouvelles observations</Big>
          </Pop>
        </div>
      </Beat>
    </SceneShell>
  );
};
