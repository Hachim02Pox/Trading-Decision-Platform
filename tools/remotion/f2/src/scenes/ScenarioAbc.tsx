import React from "react";
import { theme } from "../theme";
import { SceneContainer, Panel, Entrance, Sfx, cueWord, GoldBarIcon } from "./shared";
import type { SceneProps } from "./shared";

const Arrow: React.FC<{ up: boolean; color: string }> = ({ up, color }) => (
  <svg width={26} height={26} viewBox="0 0 26 26" style={{ transform: up ? "none" : "rotate(180deg)" }}>
    <path d="M13 22 V4 M13 4 L6 11 M13 4 L20 11" stroke={color} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
  </svg>
);

const CaseCard: React.FC<{
  delay: number;
  label: string;
  nominal: string;
  breakeven: string;
  real: string;
  realUp: boolean;
  realFlat?: boolean;
  goldUp: boolean | null;
  note: string;
}> = ({ delay, label, nominal, breakeven, real, realUp, realFlat, goldUp, note }) => (
  <Entrance delay={delay} y={40}>
    <Panel style={{ width: 400 }} glow={goldUp !== null}>
      <div style={{ color: theme.colors.accent, fontFamily: theme.mono, fontSize: 18, letterSpacing: 2, marginBottom: 16 }}>
        {label}
      </div>
      <Row label="Taux affiché" value={nominal} />
      <Row label="Inflation implicite" value={breakeven} />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 10, paddingTop: 14, borderTop: `1px solid ${theme.colors.hairlineSoft}` }}>
        <span style={{ color: theme.colors.textPrimary, fontSize: 20, fontWeight: 700 }}>Taux réel</span>
        <span style={{ display: "flex", alignItems: "center", gap: 8, color: realFlat ? theme.colors.textSecondary : realUp ? theme.colors.negative : theme.colors.positive, fontSize: 22, fontWeight: 700, fontFamily: theme.mono }}>
          {realFlat ? <span>≈</span> : <Arrow up={realUp} color={realUp ? theme.colors.negative : theme.colors.positive} />}
          {real}
        </span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 18 }}>
        <GoldBarIcon size={30} color={goldUp === null ? theme.colors.textMuted : goldUp ? theme.colors.positive : theme.colors.negative} />
        <span style={{ color: theme.colors.textSecondary, fontSize: 18 }}>{note}</span>
      </div>
    </Panel>
  </Entrance>
);

const Row: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
    <span style={{ color: theme.colors.textMuted, fontSize: 18 }}>{label}</span>
    <span style={{ color: theme.colors.textSecondary, fontSize: 18, fontFamily: theme.mono }}>{value}</span>
  </div>
);

export const ScenarioAbc: React.FC<SceneProps> = ({ subtitles, durationInFrames }) => {
  const case1At = cueWord(subtitles, "cas un");
  const case2At = cueWord(subtitles, "cas deux");
  const case3At = cueWord(subtitles, "cas trois");
  const punchAt = cueWord(subtitles, "ne jamais réagir");

  return (
    <SceneContainer eyebrow="F2 · Le piège classique" title="Même chiffre affiché, trois résultats" durationInFrames={durationInFrames}>
      <Sfx file="whoosh.wav" at={case1At} volume={0.4} />
      <Sfx file="whoosh.wav" at={case2At} volume={0.4} />
      <Sfx file="whoosh.wav" at={case3At} volume={0.4} />
      <Sfx file="bass.wav" at={punchAt} volume={0.5} />

      <div style={{ display: "flex", gap: 30 }}>
        <CaseCard
          delay={case1At}
          label="CAS 1"
          nominal="4,20 % → 4,00 %"
          breakeven="reste pareille"
          real="baisse"
          realUp={false}
          goldUp={true}
          note="Or plus attirant"
        />
        <CaseCard
          delay={case2At}
          label="CAS 2"
          nominal="4,20 % → 4,00 %"
          breakeven="baisse plus vite"
          real="augmente"
          realUp={true}
          goldUp={false}
          note="Or moins attirant"
        />
        <CaseCard
          delay={case3At}
          label="CAS 3"
          nominal="4,20 % → 4,50 %"
          breakeven="monte presque autant"
          real="quasi stable"
          realUp={false}
          realFlat
          goldUp={null}
          note="Presque rien pour l'or"
        />
      </div>

      <Entrance delay={punchAt} y={20}>
        <p style={{ color: theme.colors.accentBright, fontSize: 26, maxWidth: 1400, marginTop: 48, lineHeight: 1.5, fontWeight: 600 }}>
          Ne jamais réagir au taux affiché seul — toujours vérifier l&apos;inflation implicite derrière.
        </p>
      </Entrance>
    </SceneContainer>
  );
};
