import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { theme } from "../theme";
import { Sfx, cueFrame, Panel, GoldBarIcon } from "./shared";
import type { SceneProps } from "./shared";
import { Beat, Pop, Bird, Bubble, FedSpeaker, ArrowGlyph, clamp } from "./characters";
import { SceneShell, Center, Big, Label, STAGE_W } from "./stage";

const Reading: React.FC<{ label: string; up: boolean; color: string; at: number }> = ({ label, up, color, at }) => (
  <Pop at={at}>
    <div style={{ display: "flex", alignItems: "center", gap: 8, background: theme.colors.panelAlt, borderRadius: 14, padding: "10px 18px", border: `1px solid ${theme.colors.hairline}` }}>
      <ArrowGlyph up={up} color={color} size={30} />
      <span style={{ color: theme.colors.textPrimary, fontSize: 22, fontWeight: 700 }}>{label}</span>
    </div>
  </Pop>
);

export const Surprise: React.FC<SceneProps> = ({ subtitles, durationInFrames }) => {
  const frame = useCurrentFrame();
  const c = (i: number) => cueFrame(subtitles, i);
  const needle = interpolate(frame, [c(5), c(5) + 25], [-80, -55], { ...clamp, easing: theme.ease.out });

  return (
    <SceneShell eyebrow="F3 · Surprise" title="Inchangé peut quand même surprendre" durationInFrames={durationInFrames}>
      <Sfx file="pop.wav" at={c(1)} volume={0.45} />
      <Sfx file="tick.wav" at={c(3)} volume={0.4} />
      <Sfx file="whoosh.wav" at={c(7)} volume={0.45} />
      <Sfx file="bass.wav" at={c(13)} volume={0.5} />
      <Sfx file="chime.wav" at={c(17)} volume={0.5} />
      <Sfx file="whoosh.wav" at={c(18)} volume={0.45} />

      <Beat from={c(0)} to={c(7)} style={{ left: 0, top: 0 }}>
        <Center gap={120}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
            <Pop at={c(1)}>
              <Panel style={{ padding: "14px 28px" }} glow>
                <Big size={34}>Taux inchangés</Big>
              </Panel>
            </Pop>
            <FedSpeaker size={250} talking={false} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 34, width: 700 }}>
            <Pop at={c(2)}>
              <Label color={theme.colors.textMuted}>LE PARI AVANT LA RÉUNION</Label>
              <div style={{ display: "flex", height: 70, borderRadius: 14, overflow: "hidden", marginTop: 12, border: `1px solid ${theme.colors.hairline}` }}>
                <div
                  style={{
                    width: `${interpolate(frame, [c(3), c(3) + 25], [0, 70], { ...clamp, easing: theme.ease.out })}%`,
                    background: theme.colors.textSecondary,
                    display: "flex",
                    alignItems: "center",
                    paddingLeft: 20,
                    color: theme.colors.bg,
                    fontSize: 24,
                    fontWeight: 800,
                  }}
                >
                  Statu quo 70 %
                </div>
                <div
                  style={{
                    flex: 1,
                    background: `${theme.colors.context}66`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: theme.colors.textPrimary,
                    fontSize: 22,
                    fontWeight: 700,
                    opacity: frame >= c(4) ? 1 : 0,
                  }}
                >
                  Baisse 30 %
                </div>
              </div>
            </Pop>
            <Pop at={c(5)}>
              <div style={{ display: "flex", alignItems: "center", gap: 30 }}>
                <svg width="200" height="120" viewBox="0 0 200 120">
                  <path d="M20 110 A80 80 0 0 1 180 110" stroke={theme.colors.hairline} strokeWidth="14" fill="none" />
                  <path d="M20 110 A80 80 0 0 1 60 42" stroke={theme.colors.positive} strokeWidth="14" fill="none" />
                  <line x1="100" y1="110" x2="100" y2="40" stroke={theme.colors.accentBright} strokeWidth="5" strokeLinecap="round" style={{ transform: `rotate(${needle}deg)`, transformOrigin: "100px 110px" }} />
                  <circle cx="100" cy="110" r="8" fill={theme.colors.accentBright} />
                </svg>
                <div>
                  <Big size={34}>Première surprise</Big>
                  <Label size={26}>limitée : c&apos;était le plus probable</Label>
                </div>
              </div>
            </Pop>
          </div>
        </Center>
      </Beat>

      <Beat from={c(7)} to={c(18)} style={{ left: 0, top: 0 }}>
        <div style={{ position: "relative", width: STAGE_W, height: 690 }}>
          <div style={{ position: "absolute", left: 40, top: 150 }}>
            <FedSpeaker size={280} talking />
          </div>
          <div style={{ position: "absolute", left: 380, top: 40, display: "flex", alignItems: "center", gap: 26, transform: "scale(1.15)", transformOrigin: "left center" }}>
            <Pop at={c(8)}>
              <Bubble text="Pas de nouvelles baisses" tone={theme.colors.negative} width={330} tail="left" />
            </Pop>
            <Reading label="Pari 6 mois" up color={theme.colors.negative} at={c(9)} />
            <Reading label="2 ans" up color={theme.colors.negative} at={c(11)} />
            <Reading label="Taux réels" up color={theme.colors.negative} at={c(12)} />
            <Pop at={c(13)}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Bird kind="hawk" size={110} />
                <GoldBarIcon size={44} color={theme.colors.negative} />
                <ArrowGlyph up={false} color={theme.colors.negative} size={34} />
              </div>
            </Pop>
          </div>
          <div style={{ position: "absolute", left: 380, top: 400, display: "flex", alignItems: "center", gap: 26, transform: "scale(1.15)", transformOrigin: "left center" }}>
            <Pop at={c(14)}>
              <Bubble text="Des baisses arrivent" tone={theme.colors.positive} width={330} tail="left" />
            </Pop>
            <Reading label="Paris futurs" up={false} color={theme.colors.positive} at={c(16)} />
            <Pop at={c(17)}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Bird kind="dove" size={110} />
                <GoldBarIcon size={44} color={theme.colors.positive} />
                <ArrowGlyph up color={theme.colors.positive} size={34} />
              </div>
            </Pop>
          </div>
        </div>
      </Beat>

      <Beat from={c(18)} style={{ left: 0, top: 0 }}>
        <Center column gap={40}>
          <Panel style={{ padding: "22px 50px" }}>
            <Label color={theme.colors.textMuted}>MÊME ÉTIQUETTE</Label>
            <Big size={58}>STATU QUO</Big>
          </Panel>
          <div style={{ display: "flex", gap: 240, alignItems: "center" }}>
            <Pop at={c(19)}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <Bird kind="hawk" size={130} />
                <Big size={40} color={theme.colors.negative}>Faucon</Big>
              </div>
            </Pop>
            <Pop at={c(19) + 10}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <Big size={40} color={theme.colors.positive}>Colombe</Big>
                <Bird kind="dove" size={130} flip />
              </div>
            </Pop>
          </div>
          <Pop at={c(21)}>
            <Big size={36} color={theme.colors.accentBright} glow>
              C&apos;est l&apos;écart avec le pari qui décide, pas l&apos;étiquette
            </Big>
          </Pop>
        </Center>
      </Beat>
    </SceneShell>
  );
};
