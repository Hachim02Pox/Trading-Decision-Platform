import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { theme } from "../theme";
import { Sfx, cueFrame, Panel, GoldBarIcon } from "./shared";
import type { SceneProps } from "./shared";
import { Beat, Pop, Person, ArrowGlyph, clamp } from "./characters";
import { SceneShell, Big, Label, STAGE_W } from "./stage";
import { Rope } from "./props";

const Badge: React.FC<{ at: number; text: string }> = ({ at, text }) => (
  <Pop at={at}>
    <div style={{ display: "flex", alignItems: "center", gap: 6, background: theme.colors.panelAlt, border: `1px solid ${theme.colors.negative}`, borderRadius: 12, padding: "8px 14px" }}>
      <ArrowGlyph up color={theme.colors.negative} size={24} />
      <span style={{ color: theme.colors.textPrimary, fontSize: 21, fontWeight: 700 }}>{text}</span>
    </div>
  </Pop>
);

export const TwoChannels: React.FC<SceneProps> = ({ subtitles, durationInFrames }) => {
  const frame = useCurrentFrame();
  const c = (i: number) => cueFrame(subtitles, i);
  const offset = interpolate(
    frame,
    [c(3), c(8), c(9), c(18), c(19), c(20), c(23), c(24), c(31)],
    [0, -260, -260, 260, 260, 0, 220, 220, -240],
    { ...clamp, easing: theme.ease.inOut },
  );
  const leftPull = frame >= c(3) && frame < c(9) ? true : frame >= c(24) && frame < c(32);
  const rightPull = frame >= c(9) && frame < c(19) ? true : frame >= c(20) && frame < c(24);
  const goldUp = offset < -80;
  const goldDown = offset > 80;
  const ROPE_W = 1100;

  return (
    <SceneShell eyebrow="F4 · Le cœur" title="Deux canaux qui tirent en sens inverse" durationInFrames={durationInFrames}>
      <Sfx file="whoosh.wav" at={c(3)} volume={0.45} />
      <Sfx file="chime.wav" at={c(8)} volume={0.45} />
      <Sfx file="whoosh.wav" at={c(9)} volume={0.45} />
      {[c(11), c(12), c(13), c(14)].map((at, i) => (
        <Sfx key={i} file="tick.wav" at={at} volume={0.35} />
      ))}
      <Sfx file="bass.wav" at={c(18)} volume={0.5} />
      <Sfx file="bass.wav" at={c(19)} volume={0.45} />
      <Sfx file="chime.wav" at={c(32)} volume={0.5} />

      <div style={{ position: "absolute", left: 0, top: 0, width: STAGE_W, height: 330 }}>
        <div style={{ position: "absolute", left: 20, top: 40, display: "flex", gap: 0, opacity: frame >= c(3) ? 1 : 0.25 }}>
          {[0, 1, 2].map((i) => (
            <div key={i} style={{ transform: `rotate(${leftPull ? -10 : 0}deg)` }}>
              <Person size={185} phase={i * 1.3} run={leftPull} color={theme.colors.positive} />
            </div>
          ))}
        </div>
        <div style={{ position: "absolute", left: 20, top: 262, width: 440, textAlign: "center" }}>
          <Big size={26} color={theme.colors.positive}>Pouvoir d&apos;achat</Big>
        </div>
        <div style={{ position: "absolute", left: 320, top: 70 }}>
          <Rope width={ROPE_W} offset={offset}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <GoldBarIcon size={120} color={goldUp ? theme.colors.positive : goldDown ? theme.colors.negative : theme.colors.accent} />
              {(goldUp || goldDown) && <ArrowGlyph up={goldUp} color={goldUp ? theme.colors.positive : theme.colors.negative} size={40} />}
            </div>
          </Rope>
        </div>
        <div style={{ position: "absolute", right: 20, top: 40, display: "flex", opacity: frame >= c(9) ? 1 : 0.25 }}>
          {[0, 1, 2].map((i) => (
            <div key={i} style={{ transform: `rotate(${rightPull ? 10 : 0}deg) scaleX(-1)` }}>
              <Person size={185} phase={i * 1.1} run={rightPull} color={i === 1 ? "#2d3a4a" : theme.colors.negative} />
            </div>
          ))}
        </div>
        <div style={{ position: "absolute", right: 20, top: 262, width: 440, textAlign: "center" }}>
          <Big size={26} color={theme.colors.negative}>Réaction de la banque centrale</Big>
        </div>
      </div>

      <div style={{ position: "absolute", left: 0, top: 330, width: STAGE_W, height: 360 }}>
        <Beat from={c(3)} to={c(9)} style={{ left: 60, top: 20, width: 900 }}>
          <Panel style={{ borderColor: theme.colors.positive }}>
            <Big size={30} color={theme.colors.positive}>Canal 1 · le pouvoir d&apos;achat</Big>
            <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 10 }}>
              <Pop at={c(4)}>
                <Label color={theme.colors.textPrimary} size={24}>La confiance dans la monnaie s&apos;érode…</Label>
              </Pop>
              <Pop at={c(6)}>
                <Label color={theme.colors.textPrimary} size={24}>… on cherche des réserves de valeur rares</Label>
              </Pop>
              <Pop at={c(8)}>
                <Big size={30} color={theme.colors.positive}>→ l&apos;or monte</Big>
              </Pop>
            </div>
          </Panel>
        </Beat>

        <Beat from={c(9)} to={c(19)} style={{ left: 0, top: 20, width: STAGE_W, display: "flex", justifyContent: "flex-end" }}>
          <Panel style={{ borderColor: theme.colors.negative, width: 1150 }}>
            <Big size={30} color={theme.colors.negative}>Canal 2 · la réaction de la banque centrale</Big>
            <div style={{ marginTop: 16, display: "flex", gap: 14, flexWrap: "wrap" }}>
              <Badge at={c(11)} text="taux directeurs attendus" />
              <Badge at={c(12)} text="taux affichés" />
              <Badge at={c(13)} text="taux réels" />
              <Badge at={c(14)} text="parfois le dollar" />
            </div>
            <div style={{ marginTop: 16, display: "flex", gap: 30, alignItems: "center" }}>
              <Pop at={c(15)}>
                <Label color={theme.colors.textPrimary} size={23}>Coût de détenir l&apos;or ↑</Label>
              </Pop>
              <Pop at={c(16)}>
                <Label color={theme.colors.textPrimary} size={23}>Plus cher pour les acheteurs hors dollar</Label>
              </Pop>
              <Pop at={c(18)}>
                <Big size={30} color={theme.colors.negative}>→ l&apos;or baisse</Big>
              </Pop>
            </div>
          </Panel>
        </Beat>

        <Beat from={c(19)} to={c(32)} style={{ left: 0, top: 0, width: STAGE_W, display: "flex", gap: 40, justifyContent: "center" }}>
          <Pop at={c(20)}>
            <Panel style={{ width: 700, borderColor: theme.colors.negative }} glow={frame >= c(20) && frame < c(24)}>
              <Label color={theme.colors.textMuted} size={18}>RÉGIME A</Label>
              <Big size={28}>La banque centrale peut resserrer, de façon crédible</Big>
              <Label size={23}>→ inflation forte souvent défavorable d&apos;abord, via F3, F2 et F6</Label>
            </Panel>
          </Pop>
          <Pop at={c(24)}>
            <Panel style={{ width: 760, borderColor: theme.colors.positive }} glow={frame >= c(24)}>
              <Label color={theme.colors.textMuted} size={18}>RÉGIME B</Label>
              <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 6 }}>
                {[
                  { t: "crédibilité en baisse", at: c(24) },
                  { t: "taux réels négatifs", at: c(25) },
                  { t: "la dette publique dicte la politique", at: c(26) },
                  { t: "inflation d'offre, dure à soigner", at: c(28) },
                ].map((b) => (
                  <Pop key={b.t} at={b.at}>
                    <Label color={theme.colors.textPrimary} size={23}>• {b.t}</Label>
                  </Pop>
                ))}
              </div>
              <Pop at={c(31)}>
                <Label color={theme.colors.positive} size={24}>→ l&apos;or peut monter avec les anticipations d&apos;inflation</Label>
              </Pop>
            </Panel>
          </Pop>
        </Beat>

        <Beat from={c(32)} style={{ left: 0, top: 60, width: STAGE_W, display: "flex", justifyContent: "center" }}>
          <Panel glow style={{ padding: "24px 44px", textAlign: "center" }}>
            <Label color={theme.colors.textMuted} size={20}>DANS LE TERMINAL, TOUTES LES RELATIONS F4</Label>
            <Big size={52} color={theme.colors.accentBright}>Contextuel</Big>
          </Panel>
        </Beat>
      </div>
    </SceneShell>
  );
};
