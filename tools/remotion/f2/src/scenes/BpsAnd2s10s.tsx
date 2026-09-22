import React from "react";
import { useCurrentFrame } from "remotion";
import { theme } from "../theme";
import { SceneContainer, Panel, Entrance, Sfx, cueWord } from "./shared";
import type { SceneProps } from "./shared";

const Term: React.FC<{ label: string; value: string; tone: string; highlight?: boolean }> = ({
  label,
  value,
  tone,
  highlight,
}) => (
  <Panel style={{ width: 280, textAlign: "center" }} glow={highlight}>
    <div style={{ color: theme.colors.textMuted, fontSize: 17, fontFamily: theme.mono, marginBottom: 12 }}>{label}</div>
    <div style={{ color: tone, fontSize: 40, fontWeight: 700, fontFamily: theme.mono }}>{value}</div>
  </Panel>
);

const Operator: React.FC<{ delay: number; symbol: string }> = ({ delay, symbol }) => (
  <Entrance delay={delay} y={10} scaleFrom={0.6} springConfig="bouncy">
    <div style={{ color: theme.colors.textMuted, fontSize: 44, fontFamily: theme.mono, fontWeight: 600 }}>{symbol}</div>
  </Entrance>
);

export const BpsAnd2s10s: React.FC<SceneProps> = ({ subtitles, durationInFrames }) => {
  const frame = useCurrentFrame();

  const bpAt = cueWord(subtitles, "un centième");
  const y2At = cueWord(subtitles, "2 ans est à 4,40");
  const y10At = cueWord(subtitles, "10 ans est à 4,10");
  const resultAt = cueWord(subtitles, "moins 30 points");
  const steepenAt = cueWord(subtitles, "pentifiée");
  const flattenAt = cueWord(subtitles, "pentification, ça veut dire");

  return (
    <SceneContainer eyebrow="F2 · Vocabulaire" title="Le point de base et le deux dix" durationInFrames={durationInFrames}>
      <Sfx file="chime.wav" at={bpAt} volume={0.45} />
      <Sfx file="pop.wav" at={y2At} volume={0.45} />
      <Sfx file="pop.wav" at={y10At} volume={0.45} />
      <Sfx file="bass.wav" at={resultAt} volume={0.55} />

      <Entrance delay={bpAt} y={20}>
        <div style={{ color: theme.colors.textSecondary, fontSize: 26, marginBottom: 46, maxWidth: 1300 }}>
          1 point de base = 0,01 % &nbsp;·&nbsp; 100 points de base = 1 %
        </div>
      </Entrance>

      <div style={{ display: "flex", alignItems: "center", gap: 26 }}>
        <Entrance delay={y10At} y={30}>
          <Term label="TAUX 10 ANS" value="4,10 %" tone={theme.colors.textPrimary} />
        </Entrance>
        <Operator delay={y10At + 6} symbol="−" />
        <Entrance delay={y2At} y={30}>
          <Term label="TAUX 2 ANS" value="4,40 %" tone={theme.colors.textPrimary} />
        </Entrance>
        <Operator delay={resultAt - 6} symbol="=" />
        <Entrance delay={resultAt} y={30}>
          <Term label="2S10S" value="−30 pb" tone={theme.colors.negative} highlight />
        </Entrance>
      </div>

      <div style={{ display: "flex", gap: 60, marginTop: 60 }}>
        <Entrance delay={steepenAt} y={20}>
          <RegimeArrow label="Pentification" desc="L'écart augmente" widen color={theme.colors.positive} />
        </Entrance>
        <Entrance delay={flattenAt} y={20}>
          <RegimeArrow label="Aplatissement" desc="L'écart diminue" widen={false} color={theme.colors.negative} />
        </Entrance>
      </div>
    </SceneContainer>
  );
};

const RegimeArrow: React.FC<{ label: string; desc: string; widen: boolean; color: string }> = ({
  label,
  desc,
  widen,
  color,
}) => {
  const frame = useCurrentFrame();
  const spread = 20 + (widen ? 1 : -1) * Math.min(18, Math.max(0, (frame % 90) / 3));
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
      <svg width={220} height={70} viewBox="0 0 220 70">
        <line x1={110 - spread} y1="55" x2={110 - spread} y2="15" stroke={color} strokeWidth="4" strokeLinecap="round" />
        <line x1={110 + spread} y1="55" x2={110 + spread} y2="15" stroke={color} strokeWidth="4" strokeLinecap="round" />
        <line x1={110 - spread} y1="35" x2={110 + spread} y2="35" stroke={color} strokeWidth="2" strokeDasharray="4 5" />
      </svg>
      <div style={{ color: theme.colors.textPrimary, fontSize: 22, fontWeight: 700 }}>{label}</div>
      <div style={{ color: theme.colors.textMuted, fontSize: 17 }}>{desc}</div>
    </div>
  );
};
