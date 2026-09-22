import React from "react";
import { useCurrentFrame } from "remotion";
import { theme } from "../theme";
import { Sfx, cueFrame, Panel, GoldBarIcon } from "./shared";
import type { SceneProps } from "./shared";
import { Beat, Pop, Person, Bubble, FedSpeaker, LiveChart, series } from "./characters";
import { SceneShell, Center, Big, Label, STAGE_W } from "./stage";

const goldSpike = [...series(34, 7, 0, 0.35), 52, 58, 66, 71, 69, 74, 78, 76, 80];
const crowdWiggle = series(60, 3, 0, 1.6);

export const Intro: React.FC<SceneProps> = ({ subtitles, durationInFrames }) => {
  const frame = useCurrentFrame();
  const c = (i: number) => cueFrame(subtitles, i);

  return (
    <SceneShell eyebrow="F3 · Fed et anticipations" title="La décision ne suffit jamais" durationInFrames={durationInFrames}>
      <Sfx file="pop.wav" at={c(1) - 2} volume={0.5} />
      <Sfx file="whoosh.wav" at={c(4) - 2} volume={0.5} />
      <Sfx file="bass.wav" at={c(4) + 20} volume={0.5} />
      <Sfx file="whoosh.wav" at={c(6) - 2} volume={0.35} />
      <Sfx file="pop.wav" at={c(11)} volume={0.35} />
      <Sfx file="chime.wav" at={c(17)} volume={0.5} />

      <Beat from={c(0)} to={c(6)} style={{ left: 0, top: 0 }}>
        <div style={{ position: "relative", width: STAGE_W, height: 690 }}>
          <div style={{ position: "absolute", left: 120, top: 250 }}>
            <Person size={230} color={theme.colors.context} label="Hachim" />
          </div>
          <div style={{ position: "absolute", left: 60, top: 70 }}>
            <Pop at={c(2)}>
              <Bubble text="Rien ne bouge..." width={330} />
            </Pop>
          </div>
          <div style={{ position: "absolute", left: 470, top: 250 }}>
            <Pop at={c(1)}>
              <Panel style={{ width: 360, padding: 26 }} glow={frame < c(4)}>
                <div style={{ color: theme.colors.accent, fontFamily: theme.mono, fontSize: 16, letterSpacing: 2 }}>ALERTE · FED</div>
                <div style={{ color: theme.colors.textPrimary, fontSize: 30, fontWeight: 800, marginTop: 8 }}>Taux inchangés</div>
              </Panel>
            </Pop>
          </div>
          <div style={{ position: "absolute", left: 930, top: 110 }}>
            <Beat from={c(4)} style={{ position: "relative" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 12 }}>
                <GoldBarIcon size={44} />
                <span style={{ color: theme.colors.accentBright, fontSize: 26, fontWeight: 700 }}>Or · la minute suivante</span>
              </div>
              <LiveChart data={goldSpike} width={740} height={360} from={c(4)} drawFrames={70} color={theme.colors.accent} />
            </Beat>
          </div>
        </div>
      </Beat>

      <Beat from={c(6)} to={c(11)} style={{ left: 0, top: 0 }}>
        <Center gap={110}>
          <div style={{ display: "flex", flexDirection: "column", gap: 40, alignItems: "center" }}>
            <Pop at={c(7)}>
              <Panel style={{ width: 460, textAlign: "center" }}>
                <Label>Ce qui arrive</Label>
                <Big size={40}>La décision</Big>
              </Panel>
            </Pop>
            <Pop at={c(9)}>
              <Panel style={{ width: 460, textAlign: "center" }}>
                <Label>Ce que tout le monde avait parié</Label>
                <Big size={40}>Les attentes</Big>
              </Panel>
            </Pop>
          </div>
          <Pop at={c(10)}>
            <div style={{ display: "flex", alignItems: "center", gap: 26 }}>
              <svg width="60" height="300" viewBox="0 0 60 300">
                <path d="M10 10 Q50 10 50 150 Q50 290 10 290" stroke={theme.colors.accent} strokeWidth="4" fill="none" />
                <line x1="50" y1="150" x2="60" y2="150" stroke={theme.colors.accent} strokeWidth="4" />
              </svg>
              <Big color={theme.colors.accentBright} size={50} glow>
                L&apos;écart
                <br />
                fait bouger les prix
              </Big>
            </div>
          </Pop>
        </Center>
      </Beat>

      <Beat from={c(11)} style={{ left: 0, top: 0 }}>
        <div style={{ position: "relative", width: STAGE_W, height: 690 }}>
          <div style={{ position: "absolute", left: STAGE_W / 2 - 120, top: -10 }}>
            <FedSpeaker size={210} talking={frame > c(13)} />
          </div>
          <div style={{ position: "absolute", left: 0, top: 300, width: STAGE_W, display: "grid", gridTemplateColumns: "repeat(11, 96px)", justifyContent: "center", columnGap: 44, rowGap: 20 }}>
            {Array.from({ length: 22 }).map((_, i) => (
              <Pop key={i} at={c(11) + i * 2}>
                <div style={{ position: "relative" }}>
                  <Person
                    size={100}
                    phase={i * 1.3}
                    color={[theme.colors.context, theme.colors.accentDim, theme.colors.textMuted, theme.colors.positive][i % 4]}
                    skin={["#d9b99b", "#a87b5b", "#f0d2b6", "#7a5238"][i % 4]}
                    cheer={frame > c(15) && i % 3 === 0}
                    wave={frame > c(13) && frame < c(15) && i % 4 === 1}
                  />
                  {frame > c(13) && i % 3 === 1 && (
                    <div style={{ position: "absolute", top: -34, left: 22, color: theme.colors.accentBright, fontSize: 28, fontWeight: 800 }}>?</div>
                  )}
                </div>
              </Pop>
            ))}
          </div>
          <div style={{ position: "absolute", right: 30, top: 20 }}>
            <Beat from={c(15)} style={{ position: "relative" }}>
              <LiveChart data={crowdWiggle} width={420} height={170} from={c(15)} drawFrames={50} color={theme.colors.accentBright} label="Les prix bougent" />
            </Beat>
          </div>
          <div style={{ position: "absolute", left: 40, top: 40 }}>
            <Beat from={c(17)} style={{ position: "relative" }}>
              <Big color={theme.colors.accentBright} size={56} glow>
                Le cœur de F3
              </Big>
            </Beat>
          </div>
        </div>
      </Beat>
    </SceneShell>
  );
};
