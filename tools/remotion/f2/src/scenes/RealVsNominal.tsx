import React from "react";
import { useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { theme } from "../theme";
import { SceneContainer, Panel, Entrance, Sfx, cueWord, CashPopIcon } from "./shared";
import type { SceneProps } from "./shared";

const Term: React.FC<{ label: string; value: string; tone: string; highlight?: boolean }> = ({
  label,
  value,
  tone,
  highlight,
}) => (
  <Panel style={{ width: 300, textAlign: "center" }} glow={highlight}>
    <div style={{ color: theme.colors.textMuted, fontSize: 17, fontFamily: theme.mono, marginBottom: 12 }}>{label}</div>
    <div style={{ color: tone, fontSize: 42, fontWeight: 700, fontFamily: theme.mono }}>{value}</div>
  </Panel>
);

const Operator: React.FC<{ delay: number; symbol: string }> = ({ delay, symbol }) => (
  <Entrance delay={delay} y={10} scaleFrom={0.6} springConfig="bouncy">
    <div style={{ color: theme.colors.textMuted, fontSize: 46, fontFamily: theme.mono, fontWeight: 600 }}>{symbol}</div>
  </Entrance>
);

export const RealVsNominal: React.FC<SceneProps> = ({ subtitles, durationInFrames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const termAAt = cueWord(subtitles, "4 pourcent par année");
  const minusAt = cueWord(subtitles, "les prix, eux");
  const termBAt = cueWord(subtitles, "3 pourcent à cause");
  const equalsAt = cueWord(subtitles, "vrai gain, celui qui");
  const resultAt = cueWord(subtitles, "n'est que de 1");
  const namesAt = cueWord(subtitles, "taux réel");
  const captionAt = cueWord(subtitles, "décide");

  const resultP = spring({ frame: frame - resultAt, fps, config: theme.spring.bouncy });
  const resultScale = interpolate(resultP, [0, 1], [0.8, 1]);

  return (
    <SceneContainer eyebrow="F2 · Le piège" title="Le taux affiché n'est pas ton vrai gain" durationInFrames={durationInFrames}>
      <Sfx file="pop.wav" at={termAAt} volume={0.45} />
      <Sfx file="pop.wav" at={termBAt} volume={0.45} />
      <Sfx file="chime.wav" at={resultAt} volume={0.55} />

      <div style={{ display: "flex", alignItems: "center", gap: 26 }}>
        <Entrance delay={termAAt} y={30}>
          <Term label="TAUX AFFICHÉ" value="4 %" tone={theme.colors.textPrimary} />
        </Entrance>
        <Operator delay={minusAt} symbol="−" />
        <Entrance delay={termBAt} y={30}>
          <Term label="INFLATION" value="3 %" tone={theme.colors.negative} />
        </Entrance>
        <Operator delay={equalsAt} symbol="=" />
        <div style={{ transform: `scale(${resultScale})` }}>
          <Entrance delay={resultAt} y={30}>
            <div style={{ position: "relative" }}>
              <Term label="VRAI GAIN" value="1 %" tone={theme.colors.accentBright} highlight />
              <div style={{ position: "absolute", top: -30, right: -20 }}>
                <Entrance delay={resultAt + 6} y={10} scaleFrom={0.5} springConfig="bouncy">
                  <CashPopIcon size={34} />
                </Entrance>
              </div>
            </div>
          </Entrance>
        </div>
      </div>

      <Entrance delay={namesAt} y={20}>
        <p style={{ color: theme.colors.textSecondary, fontSize: 24, maxWidth: 1350, marginTop: 50, lineHeight: 1.5 }}>
          Les traders appellent ce vrai gain le <b style={{ color: theme.colors.textPrimary }}>taux réel</b>, et l&apos;inflation pariée par le marché,{" "}
          l&apos;<b style={{ color: theme.colors.textPrimary }}>inflation implicite</b>.
        </p>
      </Entrance>

      <Entrance delay={captionAt} y={18}>
        <p style={{ color: theme.colors.accentBright, fontSize: 27, maxWidth: 1350, marginTop: 20, lineHeight: 1.5, fontWeight: 600 }}>
          C&apos;est le taux réel qui décide — jamais le chiffre affiché tout seul.
        </p>
      </Entrance>
    </SceneContainer>
  );
};
