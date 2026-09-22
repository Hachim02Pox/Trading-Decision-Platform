import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "../theme";
import { Sfx, cueFrame, Panel } from "./shared";
import type { SceneProps } from "./shared";
import { Beat, Pop, Person, ArrowGlyph, clamp } from "./characters";
import { SceneShell, Center, Big, Label, STAGE_W } from "./stage";
import { Basket, Item, PriceTag } from "./props";

export const PceVsCpi: React.FC<SceneProps> = ({ subtitles, durationInFrames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const c = (i: number) => cueFrame(subtitles, i);
  const walk = interpolate(frame, [c(10), c(10) + 50], [0, 330], { ...clamp, easing: theme.ease.inOut });
  const walking = frame >= c(10) && frame < c(10) + 50;
  const flame = 1 + Math.sin(frame / 3) * 0.08;
  const arrowP = spring({ frame: frame - c(17), fps, config: theme.spring.snappy });
  const swapped = frame >= c(11);

  return (
    <SceneShell eyebrow="F4 · PCE contre CPI" title="Deux indices qui se complètent" durationInFrames={durationInFrames}>
      <Sfx file="pop.wav" at={c(1)} volume={0.4} />
      <Sfx file="pop.wav" at={c(5)} volume={0.4} />
      <Sfx file="bass.wav" at={c(9)} volume={0.45} />
      <Sfx file="whoosh.wav" at={c(10)} volume={0.4} />
      <Sfx file="chime.wav" at={c(11)} volume={0.45} />
      <Sfx file="bass.wav" at={c(17) + 10} volume={0.5} />
      <Sfx file="chime.wav" at={c(23)} volume={0.45} />

      <Beat from={c(0)} to={c(9)} style={{ left: 0, top: 0 }}>
        <Center gap={140}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
            <Basket size={300}>
              {(["bread", "fuel", "house"] as const).map((k) => (
                <Item key={k} kind={k} size={62} />
              ))}
            </Basket>
            <Big size={46}>CPI</Big>
            <Label size={22}>payé directement par les ménages · BLS</Label>
          </div>
          <Pop at={c(1)}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
              <Basket size={400} color={theme.colors.accentBright}>
                {(["bread", "fuel", "house"] as const).map((k) => (
                  <Item key={k} kind={k} size={62} />
                ))}
                <Pop at={c(5)}>
                  <Item kind="health" size={78} />
                </Pop>
              </Basket>
              <Big size={46} color={theme.colors.accentBright}>PCE</Big>
              <Label size={22}>univers plus large · bureau d&apos;analyse économique (BEA)</Label>
              <Pop at={c(6)}>
                <PriceTag text="+ santé payée pour toi" color={theme.colors.positive} rotate={0} />
              </Pop>
            </div>
          </Pop>
          <Pop at={c(8)}>
            <Panel style={{ width: 330, textAlign: "center" }}>
              <svg width="220" height="80" viewBox="0 0 220 80">
                {[0, 1, 2].map((i) => (
                  <rect key={i} x={10 + i * 66} y="20" width="80" height="40" rx="20" fill="none" stroke={theme.colors.accent} strokeWidth="7" />
                ))}
              </svg>
              <Big size={30}>Pondéré en chaîne</Big>
              <Label size={20}>suit les changements d&apos;habitudes</Label>
            </Panel>
          </Pop>
        </Center>
      </Beat>

      <Beat from={c(9)} to={c(16)} style={{ left: 0, top: 0 }}>
        <div style={{ position: "relative", width: STAGE_W, height: 690 }}>
          <div style={{ position: "absolute", left: 60, top: 170, display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
            <div style={{ transform: `scale(${flame})` }}>
              <Item kind="beef" size={140} />
            </div>
            <PriceTag text="Bœuf ↑↑" color={theme.colors.negative} />
          </div>
          <div style={{ position: "absolute", left: 420, top: 170, display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
            <Item kind="chicken" size={140} />
            <PriceTag text="Poulet" color={theme.colors.positive} />
          </div>
          <div style={{ position: "absolute", left: 180 + walk, top: 360 }}>
            <Person size={200} color={theme.colors.context} label="Hachim" run={walking} />
          </div>
          <div style={{ position: "absolute", left: 820, top: 60, display: "flex", gap: 60 }}>
            <Pop at={c(11)}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                <Basket size={300} color={theme.colors.accentBright}>
                  <Item kind={swapped ? "chicken" : "beef"} size={80} />
                  <Item kind="bread" size={56} />
                </Basket>
                <Big size={34} color={theme.colors.accentBright}>PCE</Big>
                <Label size={21}>capte le passage au poulet</Label>
              </div>
            </Pop>
            <Pop at={c(12) + 20}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                <Basket size={300}>
                  <Item kind="beef" size={80} />
                  <Item kind="bread" size={56} />
                </Basket>
                <Big size={34}>CPI</Big>
                <Label size={21}>autres poids, autres formules</Label>
              </div>
            </Pop>
          </div>
        </div>
      </Beat>

      <Beat from={c(16)} style={{ left: 0, top: 0 }}>
        <Center gap={120}>
          <div style={{ position: "relative", width: 360, height: 360 }}>
            <svg width="360" height="360" viewBox="0 0 360 360">
              {[160, 120, 80, 40].map((r, i) => (
                <circle key={r} cx="180" cy="180" r={r} fill={i % 2 ? theme.colors.panelAlt : theme.colors.panel} stroke={theme.colors.accent} strokeWidth="3" />
              ))}
              <text x="180" y="192" textAnchor="middle" fill={theme.colors.accentBright} fontSize="40" fontWeight="900">
                2 %
              </text>
              <line x1={180 + 320 * (1 - arrowP)} y1={180 - 320 * (1 - arrowP)} x2={220 + 320 * (1 - arrowP)} y2={140 - 320 * (1 - arrowP)} stroke={theme.colors.textPrimary} strokeWidth="6" strokeLinecap="round" opacity={arrowP > 0 ? 1 : 0} />
            </svg>
            <div style={{ position: "absolute", left: 0, right: 0, bottom: -60, textAlign: "center" }}>
              <Big size={30}>Objectif de la Fed</Big>
              <Label color={theme.colors.accentBright} size={24}>défini sur le PCE global</Label>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 26, width: 760 }}>
            <Pop at={c(19)}>
              <Panel>
                <Big size={30}>PCE sous-jacent</Big>
                <Label size={22}>très surveillé pour la tendance de fond</Label>
              </Panel>
            </Pop>
            <Pop at={c(21)}>
              <Panel>
                <Label color={theme.colors.textMuted} size={18}>DANS LE MOIS</Label>
                <div style={{ position: "relative", height: 90, marginTop: 10 }}>
                  <div style={{ position: "absolute", left: 0, right: 0, top: 44, height: 4, background: theme.colors.hairline }} />
                  <div style={{ position: "absolute", left: 140, top: 0, textAlign: "center" }}>
                    <div style={{ color: theme.colors.textPrimary, fontSize: 24, fontWeight: 800 }}>CPI</div>
                    <div style={{ width: 18, height: 18, borderRadius: "50%", background: theme.colors.context, margin: "6px auto" }} />
                    <Label size={17}>plus tôt</Label>
                  </div>
                  <div style={{ position: "absolute", left: 540, top: 0, textAlign: "center" }}>
                    <div style={{ color: theme.colors.accentBright, fontSize: 24, fontWeight: 800 }}>PCE</div>
                    <div style={{ width: 18, height: 18, borderRadius: "50%", background: theme.colors.accent, margin: "6px auto" }} />
                    <Label size={17}>plus tard</Label>
                  </div>
                  <div style={{ position: "absolute", left: 230, top: 20 }}>
                    <ArrowGlyph up={false} color={theme.colors.textMuted} size={1} />
                    <svg width="290" height="30">
                      <path d="M0 15 H270 M258 5 L272 15 L258 25" stroke={theme.colors.accent} strokeWidth="3" fill="none" />
                    </svg>
                  </div>
                </div>
                <Label size={20}>le CPI oriente ce qu&apos;on attend du PCE</Label>
              </Panel>
            </Pop>
            <Pop at={c(23)}>
              <Big size={34} color={theme.colors.accentBright}>Complémentaires, pas interchangeables</Big>
            </Pop>
          </div>
        </Center>
      </Beat>
    </SceneShell>
  );
};
