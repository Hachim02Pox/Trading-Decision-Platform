import React from "react";
import { useCurrentFrame } from "remotion";
import { theme } from "../theme";
import { SceneContainer, Panel, Entrance, Chip, Sfx, cueWord } from "./shared";
import type { SceneProps } from "./shared";

const CurveSvg: React.FC<{ inverted?: boolean; revealFrom: number; frame: number; label: string }> = ({
  inverted,
  revealFrom,
  frame,
  label,
}) => {
  const local = Math.max(0, frame - revealFrom);
  const pathLen = 420;
  const dash = Math.min(pathLen, local * 9);
  const points = inverted ? [[10, 40], [150, 90], [290, 150]] : [[10, 150], [150, 90], [290, 40]];
  const d = `M ${points[0][0]} ${points[0][1]} Q ${points[1][0]} ${points[1][1] - 10} ${points[1][0]} ${points[1][1]} T ${points[2][0]} ${points[2][1]}`;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
      <svg width={300} height={180} viewBox="0 0 300 180">
        <line x1="10" y1="170" x2="290" y2="170" stroke={theme.colors.hairline} strokeWidth="1.5" />
        <path
          d={d}
          fill="none"
          stroke={inverted ? theme.colors.negative : theme.colors.positive}
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={pathLen}
          strokeDashoffset={pathLen - dash}
        />
        {points.map(([x, y], i) => {
          const dotP = Math.min(1, Math.max(0, (local - i * 14) / 10));
          return dotP > 0 ? (
            <circle key={i} cx={x} cy={y} r={5.5 * dotP} fill={inverted ? theme.colors.negative : theme.colors.positive} />
          ) : null;
        })}
      </svg>
      <div style={{ color: theme.colors.textSecondary, fontFamily: theme.mono, fontSize: 18 }}>{label}</div>
    </div>
  );
};

export const MaturitiesCurve: React.FC<SceneProps> = ({ subtitles, durationInFrames }) => {
  const frame = useCurrentFrame();

  const y2At = cueWord(subtitles, "2 ans, c'est surtout");
  const y10At = cueWord(subtitles, "10 ans, lui");
  const y30At = cueWord(subtitles, "30 ans va encore");
  const curveAt = cueWord(subtitles, "dessine une courbe");
  const invertAt = cueWord(subtitles, "courbe inversée");
  const contextAt = cueWord(subtitles, "pas un signal direct");

  return (
    <SceneContainer eyebrow="F2 · Courbe des taux" title="2 ans, 10 ans, 30 ans : trois histoires" durationInFrames={durationInFrames}>
      <Sfx file="pop.wav" at={y2At} volume={0.4} />
      <Sfx file="pop.wav" at={y10At} volume={0.4} />
      <Sfx file="pop.wav" at={y30At} volume={0.4} />
      <Sfx file="whoosh.wav" at={curveAt} volume={0.5} />
      <Sfx file="bass.wav" at={invertAt} volume={0.5} />

      <div style={{ display: "flex", gap: 32, marginBottom: 46 }}>
        <Entrance delay={y2At} y={30}>
          <MaturityChip label="2 ANS" desc="Pari sur la Fed, court terme" tone="accent" />
        </Entrance>
        <Entrance delay={y10At} y={30}>
          <MaturityChip label="10 ANS" desc="Court terme + vision longue" tone="context" />
        </Entrance>
        <Entrance delay={y30At} y={30}>
          <MaturityChip label="30 ANS" desc="Très long terme, prime de terme" tone="textSecondary" />
        </Entrance>
      </div>

      <div style={{ display: "flex", gap: 80, alignItems: "center" }}>
        <Entrance delay={curveAt} y={20}>
          <CurveSvg revealFrom={curveAt} frame={frame} label="Courbe normale (ascendante)" />
        </Entrance>
        <Entrance delay={invertAt} y={20}>
          <CurveSvg inverted revealFrom={invertAt} frame={frame} label="Courbe inversée" />
        </Entrance>
      </div>

      <Entrance delay={contextAt} y={20}>
        <p style={{ color: theme.colors.textSecondary, fontSize: 26, maxWidth: 1350, marginTop: 40, lineHeight: 1.5 }}>
          La forme de la courbe est un contexte, jamais un signal direct sur l&apos;or.
        </p>
      </Entrance>
    </SceneContainer>
  );
};

const MaturityChip: React.FC<{ label: string; desc: string; tone: "accent" | "context" | "textSecondary" }> = ({
  label,
  desc,
  tone,
}) => (
  <Panel style={{ width: 300, textAlign: "center" }}>
    <Chip label={label} tone={tone === "textSecondary" ? undefined : tone} />
    <div style={{ color: theme.colors.textSecondary, fontSize: 18, marginTop: 14, lineHeight: 1.4 }}>{desc}</div>
  </Panel>
);
