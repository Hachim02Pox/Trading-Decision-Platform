import React from "react";
import { useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { theme } from "../theme";
import { Panel, Entrance, Chip, Sfx, cueWord, TerminalGlyph, SceneContainer } from "./shared";
import type { SceneProps } from "./shared";

const FaceKpi: React.FC<{ label: string; value: string; delay: number }> = ({ label, value, delay }) => (
  <Entrance delay={delay} y={20} scaleFrom={0.9}>
    <div
      style={{
        background: theme.colors.panelAlt,
        border: `1px solid ${theme.colors.hairline}`,
        borderRadius: 14,
        padding: "16px 26px",
        minWidth: 150,
        textAlign: "center",
      }}
    >
      <div style={{ color: theme.colors.textMuted, fontSize: 14, fontFamily: theme.mono, letterSpacing: 1.5 }}>{label}</div>
      <div style={{ color: theme.colors.textPrimary, fontSize: 28, fontWeight: 700, fontFamily: theme.mono, marginTop: 6 }}>
        {value}
      </div>
    </div>
  </Entrance>
);

export const TerminalUsage: React.FC<SceneProps> = ({ subtitles, durationInFrames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const faceAt = cueWord(subtitles, "façade de f2");
  const clickAt = cueWord(subtitles, "ouvrir le tiroir");
  const drawerAt = cueWord(subtitles, "taux réel à 10 ans, et");
  const crossF3At = cueWord(subtitles, "croiser ça avec f3");
  const crossInflAt = cueWord(subtitles, "données d'inflation");
  const crossF6At = cueWord(subtitles, "on regarde f6");

  const drawerP = spring({ frame: frame - clickAt, fps, config: theme.spring.smooth });
  const drawerY = interpolate(drawerP, [0, 1], [60, 0]);

  return (
    <SceneContainer eyebrow="F2 · Dans le terminal" title="Façade, puis tiroir de détail" durationInFrames={durationInFrames}>
      <Sfx file="pop.wav" at={faceAt} volume={0.4} />
      <Sfx file="click.wav" at={clickAt} volume={0.55} />
      <Sfx file="whoosh.wav" at={clickAt} volume={0.4} />
      <Sfx file="chime.wav" at={drawerAt} volume={0.5} />
      <Sfx file="pop.wav" at={crossF3At} volume={0.35} />
      <Sfx file="pop.wav" at={crossInflAt} volume={0.35} />
      <Sfx file="pop.wav" at={crossF6At} volume={0.35} />

      <Entrance delay={faceAt} y={26}>
        <Panel style={{ width: 760 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 22 }}>
            <TerminalGlyph size={30} />
            <span style={{ color: theme.colors.accent, fontFamily: theme.mono, fontSize: 18, letterSpacing: 2 }}>
              F2 · TAUX — FAÇADE
            </span>
          </div>
          <div style={{ display: "flex", gap: 20 }}>
            <FaceKpi label="2 ANS" value="4,40 %" delay={faceAt + 4} />
            <FaceKpi label="10 ANS" value="4,20 %" delay={faceAt + 9} />
            <FaceKpi label="2S10S" value="−20 pb" delay={faceAt + 14} />
          </div>
        </Panel>
      </Entrance>

      <div style={{ marginTop: 30, transform: `translateY(${drawerY}px)`, opacity: drawerP }}>
        <Panel style={{ width: 760 }} glow>
          <div style={{ color: theme.colors.textMuted, fontFamily: theme.mono, fontSize: 16, letterSpacing: 2, marginBottom: 18 }}>
            TIROIR DE DÉTAIL
          </div>
          <div style={{ display: "flex", gap: 20 }}>
            <Entrance delay={drawerAt} y={16}>
              <div
                style={{
                  background: `linear-gradient(160deg, ${theme.colors.accent}22, transparent)`,
                  border: `1px solid ${theme.colors.accent}`,
                  borderRadius: 14,
                  padding: "16px 26px",
                  minWidth: 220,
                }}
              >
                <div style={{ color: theme.colors.accentBright, fontSize: 14, fontFamily: theme.mono, letterSpacing: 1.5 }}>
                  TAUX RÉEL 10 ANS
                </div>
                <div style={{ color: theme.colors.textPrimary, fontSize: 30, fontWeight: 700, fontFamily: theme.mono, marginTop: 6 }}>
                  1,80 %
                </div>
              </div>
            </Entrance>
            <Entrance delay={drawerAt + 8} y={16}>
              <div
                style={{
                  background: theme.colors.panelAlt,
                  border: `1px solid ${theme.colors.hairline}`,
                  borderRadius: 14,
                  padding: "16px 26px",
                  minWidth: 220,
                }}
              >
                <div style={{ color: theme.colors.textMuted, fontSize: 14, fontFamily: theme.mono, letterSpacing: 1.5 }}>
                  INFLATION IMPLICITE (BE10)
                </div>
                <div style={{ color: theme.colors.textSecondary, fontSize: 30, fontWeight: 700, fontFamily: theme.mono, marginTop: 6 }}>
                  2,40 %
                </div>
              </div>
            </Entrance>
          </div>
        </Panel>
      </div>

      <div style={{ display: "flex", gap: 16, marginTop: 30 }}>
        <Entrance delay={crossF3At} y={16}>
          <Chip label="CROISER F3 → 2 ANS" tone="context" />
        </Entrance>
        <Entrance delay={crossInflAt} y={16}>
          <Chip label="CROISER INFLATION → BE10" tone="context" />
        </Entrance>
        <Entrance delay={crossF6At} y={16}>
          <Chip label="CROISER F6 → USD confirme ?" tone="context" />
        </Entrance>
      </div>
    </SceneContainer>
  );
};
