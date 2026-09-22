import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { theme } from "../theme";
import { Sfx, cueFrame, AnimatedNumber, GoldBarIcon } from "./shared";
import type { SceneProps } from "./shared";
import { Beat, Pop, Person, ArrowGlyph, clamp } from "./characters";
import { SceneShell, Center, Big, Label, STAGE_W } from "./stage";
import { CoffeeCup, PriceTag, Basket, Item, Receipt } from "./props";

export const Intro: React.FC<SceneProps> = ({ subtitles, durationInFrames }) => {
  const frame = useCurrentFrame();
  const c = (i: number) => cueFrame(subtitles, i);
  const pathP = interpolate(frame, [c(13), c(14) + 20], [0, 1], { ...clamp, easing: theme.ease.inOut });

  return (
    <SceneShell eyebrow="F4 · Inflation" title="Un chiffre, deux chemins vers l'or" durationInFrames={durationInFrames}>
      <Sfx file="pop.wav" at={c(1)} volume={0.45} />
      <Sfx file="chime.wav" at={c(2)} volume={0.5} />
      <Sfx file="pop.wav" at={c(3)} volume={0.4} />
      <Sfx file="tick.wav" at={c(5)} volume={0.35} />
      <Sfx file="whoosh.wav" at={c(10)} volume={0.45} />
      <Sfx file="bass.wav" at={c(14)} volume={0.5} />
      <Sfx file="chime.wav" at={c(17)} volume={0.5} />

      <Beat from={c(0)} to={c(5)} style={{ left: 0, top: 0 }}>
        <Center gap={110}>
          <Person size={250} color={theme.colors.context} label="Hachim" wave={frame > c(2) && frame < c(3)} />
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
            <CoffeeCup size={200} />
            {frame < c(2) && (
              <Pop at={c(1)}>
                <PriceTag text="2,00 $" />
              </Pop>
            )}
            {frame >= c(2) && (
              <Pop at={c(2)}>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <PriceTag text="2,00 $" color={theme.colors.textMuted} rotate={0} />
                  <ArrowGlyph up color={theme.colors.negative} size={40} />
                  <div style={{ color: theme.colors.negative, fontFamily: theme.mono, fontSize: 44, fontWeight: 900 }}>
                    <AnimatedNumber from={2} to={2.06} delay={c(2)} format={(n) => `${n.toFixed(2).replace(".", ",")} $`} />
                  </div>
                </div>
              </Pop>
            )}
          </div>
          <Pop at={c(3)}>
            <Basket size={300}>
              {(["bread", "fuel", "chicken", "health"] as const).map((k, i) => (
                <Pop key={k} at={c(3) + 6 + i * 6}>
                  <Item kind={k} size={62} />
                </Pop>
              ))}
            </Basket>
            <div style={{ display: "flex", justifyContent: "center", marginTop: 8 }}>
              <Pop at={c(4)}>
                <PriceTag text="+3 %" color={theme.colors.negative} />
              </Pop>
            </div>
          </Pop>
        </Center>
      </Beat>

      <Beat from={c(5)} to={c(7)} style={{ left: 0, top: 0 }}>
        <Center gap={120}>
          <Receipt
            from={c(5)}
            per={8}
            lines={[
              ["Café", "2,06"],
              ["Pain", "3,19"],
              ["Essence", "41,80"],
              ["Loyer", "1 285,00"],
              ["TOTAL", "+3 % sur un an"],
            ]}
          />
          <Big size={52}>L&apos;inflation, vue depuis la caisse</Big>
        </Center>
      </Beat>

      <Beat from={c(7)} style={{ left: 0, top: 0 }}>
        <div style={{ position: "relative", width: STAGE_W, height: 690 }}>
          <div style={{ position: "absolute", left: 120, top: 250 }}>
            <Pop at={c(7)}>
              <div style={{ background: theme.colors.panelAlt, border: `2px solid ${theme.colors.accent}`, borderRadius: 20, padding: "26px 34px", textAlign: "center" }}>
                <Label color={theme.colors.textMuted} size={18}>PUBLICATION</Label>
                <Big size={40}>Inflation</Big>
              </div>
            </Pop>
          </div>
          <svg width={STAGE_W} height={690} style={{ position: "absolute", left: 0, top: 0 }}>
            <path d="M 420 330 C 700 330, 800 120, 1200 140" stroke={theme.colors.positive} strokeWidth="8" fill="none" strokeDasharray="900" strokeDashoffset={900 * (1 - pathP)} strokeLinecap="round" />
            <path d="M 420 330 C 700 330, 800 560, 1200 540" stroke={theme.colors.negative} strokeWidth="8" fill="none" strokeDasharray="900" strokeDashoffset={900 * (1 - pathP)} strokeLinecap="round" />
          </svg>
          <div style={{ position: "absolute", left: 1220, top: 70 }}>
            <Pop at={c(10)}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <GoldBarIcon size={120} color={theme.colors.positive} />
                <ArrowGlyph up color={theme.colors.positive} size={70} />
                <Big size={36} color={theme.colors.positive}>monte</Big>
              </div>
            </Pop>
          </div>
          <div style={{ position: "absolute", left: 1220, top: 470 }}>
            <Pop at={c(11)}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <GoldBarIcon size={120} color={theme.colors.negative} />
                <ArrowGlyph up={false} color={theme.colors.negative} size={70} />
                <Big size={36} color={theme.colors.negative}>baisse</Big>
              </div>
            </Pop>
          </div>
          <div style={{ position: "absolute", left: 640, top: 290 }}>
            <Pop at={c(14)}>
              <div style={{ background: theme.colors.bg, padding: "6px 18px", borderRadius: 999, border: `2px solid ${theme.colors.accentBright}`, color: theme.colors.accentBright, fontSize: 26, fontWeight: 800 }}>
                2 chemins opposés
              </div>
            </Pop>
          </div>
          <div style={{ position: "absolute", left: 0, right: 0, top: 600, display: "flex", justifyContent: "center" }}>
            <Pop at={c(16)}>
              <Big size={40} color={theme.colors.accentBright} glow>
                Lequel gagne ? Tout l&apos;enjeu de F4
              </Big>
            </Pop>
          </div>
        </div>
      </Beat>
    </SceneShell>
  );
};
