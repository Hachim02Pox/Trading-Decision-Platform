import React from "react";
import { theme } from "../theme";
import { SceneContainer, Panel, Entrance, Sfx, cueWord } from "./shared";
import type { SceneProps } from "./shared";

const XIcon: React.FC = () => (
  <svg width={26} height={26} viewBox="0 0 26 26">
    <line x1="6" y1="6" x2="20" y2="20" stroke={theme.colors.negative} strokeWidth="3" strokeLinecap="round" />
    <line x1="20" y1="6" x2="6" y2="20" stroke={theme.colors.negative} strokeWidth="3" strokeLinecap="round" />
  </svg>
);

const AlertIcon: React.FC = () => (
  <svg width={26} height={26} viewBox="0 0 26 26">
    <polygon points="13,3 24,22 2,22" stroke={theme.colors.accent} strokeWidth="2.2" strokeLinejoin="round" fill="none" />
    <line x1="13" y1="10" x2="13" y2="16" stroke={theme.colors.accent} strokeWidth="2.2" strokeLinecap="round" />
    <circle cx="13" cy="19" r="1.2" fill={theme.colors.accent} />
  </svg>
);

const MistakeRow: React.FC<{ delay: number; text: string }> = ({ delay, text }) => (
  <Entrance delay={delay} y={22}>
    <div style={{ display: "flex", alignItems: "flex-start", gap: 16, marginBottom: 20 }}>
      <div style={{ marginTop: 2 }}>
        <XIcon />
      </div>
      <div style={{ color: theme.colors.textPrimary, fontSize: 23, lineHeight: 1.45, maxWidth: 950 }}>{text}</div>
    </div>
  </Entrance>
);

export const MistakesFailures: React.FC<SceneProps> = ({ subtitles, durationInFrames }) => {
  const m1At = cueWord(subtitles, "piège un");
  const m2At = cueWord(subtitles, "piège deux");
  const m3At = cueWord(subtitles, "piège trois");
  const f1At = cueWord(subtitles, "depuis 2022");
  const f2At = cueWord(subtitles, "choc de confiance");

  return (
    <SceneContainer eyebrow="F2 · Pièges" title="Les pièges à ne jamais reproduire" durationInFrames={durationInFrames}>
      <Sfx file="click.wav" at={m1At} volume={0.4} />
      <Sfx file="click.wav" at={m2At} volume={0.4} />
      <Sfx file="click.wav" at={m3At} volume={0.4} />
      <Sfx file="whoosh.wav" at={f1At} volume={0.45} />
      <Sfx file="bass.wav" at={f2At} volume={0.5} />

      <div style={{ display: "flex", gap: 70 }}>
        <div style={{ flex: 1 }}>
          <MistakeRow delay={m1At} text="10 ans en hausse ne veut pas dire or en baisse automatiquement." />
          <MistakeRow delay={m2At} text="Une courbe inversée n'est jamais un signal direct — c'est du contexte." />
          <MistakeRow delay={m3At} text="La prime de terme est une estimation de modèle, pas un fait certain." />
        </div>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 20 }}>
          <Entrance delay={f1At} y={30}>
            <Panel glow>
              <div style={{ display: "flex", gap: 14, alignItems: "center", marginBottom: 10 }}>
                <AlertIcon />
                <span style={{ color: theme.colors.accentBright, fontFamily: theme.mono, fontSize: 17 }}>RÉGIME D'ÉCHEC</span>
              </div>
              <div style={{ color: theme.colors.textSecondary, fontSize: 19, lineHeight: 1.5 }}>
                Depuis 2022, la forte demande des banques centrales étrangères a parfois affaibli le lien classique entre l&apos;or et les taux réels.
              </div>
            </Panel>
          </Entrance>
          <Entrance delay={f2At} y={30}>
            <Panel glow>
              <div style={{ display: "flex", gap: 14, alignItems: "center", marginBottom: 10 }}>
                <AlertIcon />
                <span style={{ color: theme.colors.accentBright, fontFamily: theme.mono, fontSize: 17 }}>RÉGIME D'ÉCHEC</span>
              </div>
              <div style={{ color: theme.colors.textSecondary, fontSize: 19, lineHeight: 1.5 }}>
                Un choc de confiance peut faire monter les taux longs et l&apos;or en même temps.
              </div>
            </Panel>
          </Entrance>
        </div>
      </div>
    </SceneContainer>
  );
};
