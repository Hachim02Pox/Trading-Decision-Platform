import React from "react";
import { useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { theme } from "../theme";
import { SceneContainer, Panel, Entrance, AnimatedNumber, Sfx, cueWord } from "./shared";
import type { SceneProps } from "./shared";

export const BondBasics: React.FC<SceneProps> = ({ subtitles, durationInFrames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const promiseAt = cueWord(subtitles, "promesse");
  const priceAt = cueWord(subtitles, "prix de marché");
  const exAt = cueWord(subtitles, "100 dollars dans un an");
  const price96At = cueWord(subtitles, "96 dollars");
  const price98At = cueWord(subtitles, "98 dollars");
  const ruleAt = cueWord(subtitles, "règle numéro un");

  const liftP = spring({ frame: frame - price98At, fps, config: theme.spring.smooth });
  const priceValue = interpolate(liftP, [0, 1], [96, 98]);
  const yieldValue = 100 / priceValue - 1;

  const barHeight = interpolate(priceValue, [94, 100], [40, 100], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const yieldBarHeight = interpolate(yieldValue, [0.0, 0.05], [10, 100], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <SceneContainer eyebrow="F2 · Base" title="Une obligation, c'est une promesse" durationInFrames={durationInFrames}>
      <Sfx file="whoosh.wav" at={promiseAt} volume={0.4} />
      <Sfx file="pop.wav" at={price98At} volume={0.5} />
      <Sfx file="chime.wav" at={ruleAt} volume={0.5} />

      <div style={{ display: "flex", alignItems: "flex-end", gap: 70 }}>
        <Entrance delay={exAt} y={40}>
          <Panel style={{ width: 380 }}>
            <div style={{ color: theme.colors.textMuted, fontFamily: theme.mono, fontSize: 18, marginBottom: 10 }}>
              PROMESSE
            </div>
            <div style={{ color: theme.colors.textPrimary, fontSize: 28, fontWeight: 700, lineHeight: 1.35 }}>
              Recevoir 100 $ dans 1 an
            </div>
            <div style={{ color: theme.colors.textSecondary, fontSize: 19, marginTop: 14 }}>Ce montant ne change jamais.</div>
          </Panel>
        </Entrance>

        <Entrance delay={price96At} y={40} style={{ display: "flex", gap: 46, alignItems: "flex-end" }}>
          <BarColumn
            label="Prix payé"
            color={theme.colors.context}
            heightPct={barHeight}
            value={<AnimatedNumber from={96} to={priceValue} delay={0} format={(n) => `${n.toFixed(0)} $`} style={{ fontSize: 34, fontWeight: 700, color: theme.colors.context }} />}
          />
          <BarColumn
            label="Rendement"
            color={theme.colors.accentBright}
            heightPct={yieldBarHeight}
            value={
              <AnimatedNumber
                from={0.0417}
                to={yieldValue}
                delay={0}
                format={(n) => `${(n * 100).toFixed(2)} %`}
                style={{ fontSize: 34, fontWeight: 700, color: theme.colors.accentBright }}
              />
            }
          />
        </Entrance>
      </div>

      <Entrance delay={ruleAt} y={24}>
        <p style={{ color: theme.colors.textSecondary, fontSize: 27, maxWidth: 1350, marginTop: 66, lineHeight: 1.55 }}>
          Quand le prix d&apos;une obligation monte, son rendement baisse. Et l&apos;inverse aussi.
        </p>
      </Entrance>
    </SceneContainer>
  );
};

const BarColumn: React.FC<{ label: string; color: string; heightPct: number; value: React.ReactNode }> = ({
  label,
  color,
  heightPct,
  value,
}) => (
  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 160 }}>
    <div style={{ marginBottom: 14 }}>{value}</div>
    <div
      style={{
        width: 64,
        height: 160,
        borderRadius: 10,
        background: theme.colors.panelAlt,
        border: `1px solid ${theme.colors.hairline}`,
        display: "flex",
        alignItems: "flex-end",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          width: "100%",
          height: `${heightPct}%`,
          background: `linear-gradient(180deg, ${color}, ${color}55)`,
        }}
      />
    </div>
    <div style={{ color: theme.colors.textMuted, fontFamily: theme.mono, fontSize: 17, marginTop: 12 }}>{label}</div>
  </div>
);
