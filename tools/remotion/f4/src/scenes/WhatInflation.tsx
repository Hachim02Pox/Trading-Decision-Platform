import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "../theme";
import { Sfx, cueFrame, Panel } from "./shared";
import type { SceneProps } from "./shared";
import { Beat, Pop, Person, clamp } from "./characters";
import { SceneShell, Center, Big, Label, STAGE_W } from "./stage";
import { Basket, Item, PriceTag, Speedometer } from "./props";

const LINES = [
  { key: "infl", label: "Inflation : ça monte vite", color: theme.colors.negative, pts: [0, 14, 30, 48, 68, 90] },
  { key: "disinfl", label: "Désinflation : ça monte moins vite", color: theme.colors.accent, pts: [0, 12, 22, 30, 36, 40] },
  { key: "defl", label: "Déflation : l'indice recule", color: theme.colors.context, pts: [0, -6, -14, -20, -28, -34] },
];

export const WhatInflation: React.FC<SceneProps> = ({ subtitles, durationInFrames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const c = (i: number) => cueFrame(subtitles, i);
  const itemCues = [c(2), c(2) + 22, c(3), c(3) + 22, c(4)];
  const squash = spring({ frame: frame - c(6), fps, config: theme.spring.smooth });
  const lineCues = [c(13), c(16), c(18)];
  const speed = interpolate(frame, [c(10), c(10) + 30, c(16), c(16) + 30], [0.15, 0.8, 0.8, 0.55], { ...clamp, easing: theme.ease.inOut });

  return (
    <SceneShell eyebrow="F4 · La base" title="Une vitesse, pas un niveau" durationInFrames={durationInFrames}>
      {itemCues.map((at, i) => (
        <Sfx key={i} file="pop.wav" at={at} volume={0.35} />
      ))}
      <Sfx file="whoosh.wav" at={c(6)} volume={0.45} />
      <Sfx file="chime.wav" at={c(8)} volume={0.5} />
      <Sfx file="bass.wav" at={c(10)} volume={0.45} />
      <Sfx file="bass.wav" at={c(21)} volume={0.45} />

      <Beat from={c(1)} to={c(9)} style={{ left: 0, top: 0 }}>
        <div style={{ position: "relative", width: STAGE_W, height: 690 }}>
          <div
            style={{
              position: "absolute",
              left: STAGE_W / 2 - 200,
              top: 150,
              transform: `scale(${interpolate(squash, [0, 1], [1, 0.45])})`,
              opacity: interpolate(squash, [0, 1], [1, 0.25]),
              transformOrigin: "50% 50%",
            }}
          >
            <Basket size={400}>
              {(["bread", "fuel", "house", "plane", "scissors"] as const).map((k, i) => (
                <Pop key={k} at={itemCues[i]}>
                  <Item kind={k} size={68} />
                </Pop>
              ))}
            </Basket>
          </div>
          {Array.from({ length: 14 }).map((_, i) => {
            const at = c(5) + i * 3;
            const fall = interpolate(frame, [at, at + 40], [-80, 120 + (i % 4) * 40], { ...clamp, easing: theme.ease.out });
            return frame >= at && frame < c(6) + 10 ? (
              <div key={i} style={{ position: "absolute", left: 120 + (i * 113) % 1500, top: fall, opacity: 0.85 }}>
                <PriceTag text={`${(1.2 + ((i * 37) % 90) / 10).toFixed(2).replace(".", ",")} $`} rotate={(i % 5) * 6 - 12} />
              </div>
            ) : null;
          })}
          <div style={{ position: "absolute", left: 0, right: 0, top: 270, display: "flex", justifyContent: "center" }}>
            <Pop at={c(7)}>
              <Panel glow style={{ padding: "26px 60px", textAlign: "center" }}>
                <Label color={theme.colors.textMuted} size={20}>UN SEUL NOMBRE</Label>
                <Big size={80} color={theme.colors.accentBright}>Indice 310</Big>
              </Panel>
            </Pop>
          </div>
        </div>
      </Beat>

      <Beat from={c(9)} to={c(21)} style={{ left: 0, top: 0 }}>
        <Center gap={90}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
            <Speedometer value={speed} size={330} label="vitesse de l'indice" />
            <Big size={36}>L&apos;inflation = la vitesse</Big>
            <Label size={24}>de l&apos;indice, par rapport à une date passée</Label>
          </div>
          <Panel style={{ width: 860 }}>
            <svg width="800" height="420" viewBox="0 0 800 420">
              <line x1="40" y1="220" x2="780" y2="220" stroke={theme.colors.hairline} strokeWidth="2" />
              <text x="40" y="410" fill={theme.colors.textMuted} fontSize="18" fontFamily={theme.mono}>
                niveau de l&apos;indice des prix dans le temps
              </text>
              {LINES.map((l, li) => {
                const p = interpolate(frame, [lineCues[li], lineCues[li] + 45], [0, 1], { ...clamp, easing: theme.ease.inOut });
                const pts = l.pts.map((v, i) => `${40 + i * 148},${220 - v * 2}`).join(" ");
                return (
                  <g key={l.key} opacity={p > 0 ? 1 : 0}>
                    <polyline points={pts} fill="none" stroke={l.color} strokeWidth="6" strokeDasharray="1000" strokeDashoffset={1000 * (1 - p)} strokeLinejoin="round" strokeLinecap="round" />
                    <text x="50" y={40 + li * 34} fill={l.color} fontSize="24" fontWeight="800" opacity={p}>
                      {l.label}
                    </text>
                  </g>
                );
              })}
            </svg>
          </Panel>
        </Center>
      </Beat>

      <Beat from={c(21)} style={{ left: 0, top: 0 }}>
        <div style={{ width: STAGE_W, display: "flex", flexDirection: "column", alignItems: "center", gap: 30, paddingTop: 10 }}>
          <Big size={48} color={theme.colors.accentBright}>
            Désinflation ≠ déflation
          </Big>
          <div style={{ display: "flex", gap: 46, alignItems: "flex-end" }}>
            {[
              { l: "Ménages", at: c(23) },
              { l: "Entreprises", at: c(23) + 20 },
              { l: "Gouvernements", at: c(25) },
              { l: "Banque centrale", at: c(25) + 25 },
              { l: "Investisseurs", at: c(26) },
            ].map((u, i) => (
              <Pop key={u.l} at={u.at}>
                <Person size={165} phase={i} color={[theme.colors.context, theme.colors.accentDim, theme.colors.textMuted, "#2d3a4a", theme.colors.positive][i]} label={u.l} />
              </Pop>
            ))}
          </div>
          <Pop at={c(27)}>
            <Panel style={{ display: "flex", alignItems: "center", gap: 30, padding: "22px 36px" }}>
              <Person size={120} color={theme.colors.accentDim} label="Toi" wave />
              <div>
                <Big size={32}>Aucun indice n&apos;est exactement ton coût de la vie</Big>
                <Label size={24}>Ton panier, ta ville, tes habitudes sont uniques</Label>
              </div>
            </Panel>
          </Pop>
        </div>
      </Beat>
    </SceneShell>
  );
};
