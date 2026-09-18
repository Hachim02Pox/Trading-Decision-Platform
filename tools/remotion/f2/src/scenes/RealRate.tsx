import React from "react";
import { useCurrentFrame, interpolate } from "remotion";
import { theme } from "../theme";
import { SceneContainer, Panel, fadeSlideIn, cueFrame } from "./shared";
import type { SceneProps } from "./shared";

export const RealRate: React.FC<SceneProps> = ({ subtitles }) => {
  const frame = useCurrentFrame();

  // Cue frames, one per subtitle chunk that first speaks the matching idea:
  //  3 "Si la banque paie 4 % par année"          -> Taux affiché term
  //  4 "mais que les prix augmentent de 3 %"      -> minus operator + Inflation term
  //  6 "le vrai gain"                              -> equals operator
  //  7 "lui n'est que de 1 %"                      -> Vrai gain result
  // 17 "C'est le vrai gain qui décide"             -> caption
  const termAAt = cueFrame(subtitles, 3);
  const minusAt = cueFrame(subtitles, 4);
  const termBAt = cueFrame(subtitles, 4) + 6;
  const equalsAt = cueFrame(subtitles, 6);
  const resultAt = cueFrame(subtitles, 7);
  const captionAt = cueFrame(subtitles, 17);

  const resultScale = interpolate(frame - resultAt, [0, 16], [0.85, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <SceneContainer eyebrow="F2 · Vrai gain" title="Le taux affiché n'est pas ton vrai gain">
      <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
        <div style={{ ...fadeSlideIn(frame, termAAt, 16) }}>
          <Term label="Taux affiché" value="4 %" tone={theme.colors.textPrimary} />
        </div>
        <Operator frame={frame} at={minusAt} symbol="−" />
        <div style={{ ...fadeSlideIn(frame, termBAt, 16) }}>
          <Term label="Inflation" value="3 %" tone={theme.colors.negative} />
        </div>
        <Operator frame={frame} at={equalsAt} symbol="=" />
        <div
          style={{
            ...fadeSlideIn(frame, resultAt, 16),
            transform: `scale(${resultScale})`,
          }}
        >
          <Term label="Vrai gain" value="1 %" tone={theme.colors.accentBright} highlight />
        </div>
      </div>

      <p
        style={{
          ...fadeSlideIn(frame, captionAt, 18),
          color: theme.colors.textSecondary,
          fontSize: 26,
          maxWidth: 1300,
          marginTop: 64,
          lineHeight: 1.55,
        }}
      >
        C&apos;est ce vrai gain qui compte pour l&apos;or — jamais le taux affiché tout seul.
      </p>
    </SceneContainer>
  );
};

const Term: React.FC<{ label: string; value: string; tone: string; highlight?: boolean }> = ({
  label,
  value,
  tone,
  highlight,
}) => (
  <Panel style={{ width: 300, textAlign: "center", borderColor: highlight ? theme.colors.accent : theme.colors.hairline }}>
    <div style={{ color: theme.colors.textMuted, fontSize: 18, fontFamily: theme.mono, marginBottom: 12 }}>
      {label}
    </div>
    <div style={{ color: tone, fontSize: 44, fontWeight: 700, fontFamily: theme.mono }}>{value}</div>
  </Panel>
);

const Operator: React.FC<{ frame: number; at: number; symbol: string }> = ({ frame, at, symbol }) => (
  <div
    style={{
      ...fadeSlideIn(frame, at, 12),
      color: theme.colors.textMuted,
      fontSize: 46,
      fontFamily: theme.mono,
      fontWeight: 600,
    }}
  >
    {symbol}
  </div>
);
