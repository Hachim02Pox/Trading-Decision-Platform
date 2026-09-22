import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { theme } from "../theme";
import { Sfx, cueFrame, Panel, GoldBarIcon } from "./shared";
import type { SceneProps } from "./shared";
import { Beat, Pop, Bird, Person, DollarIcon, ArrowGlyph, clamp } from "./characters";
import { SceneShell, Center, Big, Label, STAGE_W } from "./stage";

const TrapTag: React.FC<{ n: number }> = ({ n }) => (
  <div style={{ color: theme.colors.negative, fontFamily: theme.mono, fontSize: 24, letterSpacing: 3, fontWeight: 800, textAlign: "center" }}>PIÈGE {n}</div>
);

const CHIPS = [
  { label: "2 ans", up: false },
  { label: "Taux réels", up: false },
  { label: "Dollar", up: false },
  { label: "Or", up: true },
];

export const MistakesFailures: React.FC<SceneProps> = ({ subtitles, durationInFrames }) => {
  const frame = useCurrentFrame();
  const c = (i: number) => cueFrame(subtitles, i);
  const pulse = 1 + Math.sin(frame / 6) * 0.04;
  const merge = interpolate(frame, [c(15), c(15) + 24], [0, 1], { ...clamp, easing: theme.ease.inOut });
  const runX = interpolate(frame, [c(21), c(24)], [0, 520], { ...clamp, easing: theme.ease.inOut });
  const goldDrop = interpolate(frame, [c(23), c(23) + 30], [0, 220], { ...clamp, easing: theme.ease.in });
  const chainBreak = interpolate(frame, [c(27), c(27) + 16], [0, 1], { ...clamp, easing: theme.ease.out });

  const circ = 2 * Math.PI * 110;
  const donutP = interpolate(frame, [c(1), c(1) + 30], [0, 1], { ...clamp, easing: theme.ease.out });

  return (
    <SceneShell eyebrow="F3 · Pièges" title="Les pièges à éviter" durationInFrames={durationInFrames}>
      {[c(1), c(3), c(7), c(11)].map((at, i) => (
        <Sfx key={i} file="bass.wav" at={at} volume={0.4} />
      ))}
      <Sfx file="whoosh.wav" at={c(15)} volume={0.5} />
      <Sfx file="chime.wav" at={c(16)} volume={0.45} />
      <Sfx file="whoosh.wav" at={c(21)} volume={0.45} />
      <Sfx file="pop.wav" at={c(27)} volume={0.5} />

      <Beat from={c(1)} to={c(3)} style={{ left: 0, top: 0 }}>
        <Center gap={100}>
          <svg width="300" height="300" viewBox="0 0 300 300" style={{ transform: "rotate(-90deg)" }}>
            <circle cx="150" cy="150" r="110" fill="none" stroke={theme.colors.hairline} strokeWidth="44" />
            <circle cx="150" cy="150" r="110" fill="none" stroke={theme.colors.textSecondary} strokeWidth="44" strokeDasharray={`${circ * 0.7 * donutP} ${circ}`} />
            <circle
              cx="150"
              cy="150"
              r="110"
              fill="none"
              stroke={theme.colors.negative}
              strokeWidth={44 * pulse}
              strokeDasharray={`${circ * 0.3 * donutP} ${circ}`}
              strokeDashoffset={-circ * 0.7 * donutP}
            />
          </svg>
          <div>
            <TrapTag n={1} />
            <Big size={50}>70 % n&apos;est pas une certitude</Big>
            <Pop at={c(2)}>
              <Big size={40} color={theme.colors.negative}>il reste 30 % ailleurs</Big>
            </Pop>
          </div>
        </Center>
      </Beat>

      <Beat from={c(3)} to={c(7)} style={{ left: 0, top: 0 }}>
        <Center column gap={30}>
          <TrapTag n={2} />
          <div style={{ display: "flex", alignItems: "center", gap: 60 }}>
            <Bird kind="hawk" size={220} />
            <Pop at={c(4)}>
              <div style={{ color: theme.colors.accentBright, fontSize: 200, fontWeight: 900, transform: `scale(${pulse})` }}>?</div>
            </Pop>
            <Bird kind="dove" size={220} flip />
          </div>
          <Pop at={c(4)}>
            <Big size={46}>Faucon ou colombe… par rapport à quoi ?</Big>
          </Pop>
        </Center>
      </Beat>

      <Beat from={c(7)} to={c(11)} style={{ left: 0, top: 0 }}>
        <Center column gap={50}>
          <TrapTag n={3} />
          <div style={{ display: "flex", gap: 50 }}>
            {["Fourchette actuelle", "Prochaine réunion", "Trajectoire sur 6 mois"].map((t, i) => (
              <Pop key={t} at={[c(7), c(8), c(9)][i]}>
                <Panel style={{ width: 420, textAlign: "center", padding: 44 }}>
                  <div style={{ color: theme.colors.accent, fontFamily: theme.mono, fontSize: 22 }}>QUESTION {i + 1}</div>
                  <Big size={36}>{t}</Big>
                </Panel>
              </Pop>
            ))}
          </div>
          <Pop at={c(10)}>
            <Big size={40} color={theme.colors.accentBright}>Trois questions différentes, à ne pas confondre</Big>
          </Pop>
        </Center>
      </Beat>

      <Beat from={c(11)} to={c(18)} style={{ left: 0, top: 0 }}>
        <div style={{ position: "relative", width: STAGE_W, height: 690 }}>
          <div style={{ position: "absolute", left: 0, right: 0, top: 0 }}>
            <TrapTag n={4} />
          </div>
          {CHIPS.map((chip, i) => {
            const spreadX = 150 + i * 390;
            const x = spreadX + (STAGE_W / 2 - 150 - spreadX) * merge;
            return (
              <div key={chip.label} style={{ position: "absolute", left: x, top: 160, opacity: 1 - merge }}>
                <Pop at={[c(11), c(12), c(13), c(14)][i]}>
                  <Panel style={{ width: 300, textAlign: "center" }}>
                    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 10 }}>
                      {chip.label === "Or" ? <GoldBarIcon size={50} /> : null}
                      <Big size={34}>{chip.label}</Big>
                      <ArrowGlyph up={chip.up} color={chip.up ? theme.colors.positive : theme.colors.context} size={36} />
                    </div>
                    <div style={{ color: theme.colors.positive, fontSize: 30, fontWeight: 900, marginTop: 8 }}>✓</div>
                  </Panel>
                </Pop>
              </div>
            );
          })}
          <div style={{ position: "absolute", left: 0, right: 0, top: 150, display: "flex", justifyContent: "center" }}>
            <Pop at={c(16)}>
              <Panel glow style={{ width: 700, textAlign: "center", padding: 40 }}>
                <Big size={46}>Une seule histoire</Big>
                <Label size={26}>vue quatre fois : le pari sur la Fed a changé</Label>
              </Panel>
            </Pop>
          </div>
          <div style={{ position: "absolute", left: 0, right: 0, top: 480, display: "flex", justifyContent: "center" }}>
            <Pop at={c(15)}>
              <Big size={34} color={theme.colors.negative}>Pas quatre confirmations indépendantes</Big>
            </Pop>
          </div>
        </div>
      </Beat>

      <Beat from={c(18)} style={{ left: 0, top: 0 }}>
        <div style={{ position: "relative", width: STAGE_W, height: 690 }}>
          <div style={{ position: "absolute", left: 0, right: 0, top: 0, textAlign: "center" }}>
            <div style={{ color: theme.colors.accent, fontFamily: theme.mono, fontSize: 24, letterSpacing: 3, fontWeight: 800 }}>RÉGIME D&apos;ÉCHEC</div>
            <Big size={40}>Baisse de taux… en pleine crise</Big>
          </div>
          <div style={{ position: "absolute", left: 60 + runX, top: 250, display: "flex", gap: 8 }}>
            {[0, 1, 2, 3, 4].map((i) => (
              <Pop key={i} at={c(19) + i * 4}>
                <Person size={130} phase={i * 1.7} run={frame >= c(21)} color={[theme.colors.context, theme.colors.accentDim, theme.colors.textMuted][i % 3]} />
              </Pop>
            ))}
          </div>
          <div style={{ position: "absolute", right: 120, top: 200 }}>
            <Pop at={c(21)}>
              <div style={{ transform: `scale(${pulse})` }}>
                <DollarIcon size={220} color={theme.colors.positive} />
              </div>
            </Pop>
          </div>
          <div style={{ position: "absolute", left: 180, top: 200 + goldDrop, opacity: frame >= c(23) ? 1 : 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <GoldBarIcon size={90} />
              <span style={{ color: theme.colors.negative, fontSize: 26, fontWeight: 800 }}>vendu pour des liquidités</span>
            </div>
          </div>
          <div style={{ position: "absolute", left: 0, right: 0, top: 560, display: "flex", justifyContent: "center", alignItems: "center", gap: 30 }}>
            <Pop at={c(25)}>
              <svg width="340" height="110" viewBox="-40 -15 340 110">
                <rect x={30 - chainBreak * 24} y="20" width="110" height="40" rx="20" fill="none" stroke={theme.colors.accent} strokeWidth="8" transform={`rotate(${-chainBreak * 12} 85 40)`} />
                <rect x={120 + chainBreak * 24} y="20" width="110" height="40" rx="20" fill="none" stroke={theme.colors.accent} strokeWidth="8" transform={`rotate(${chainBreak * 12} 175 40)`} />
              </svg>
            </Pop>
            <Pop at={c(27)}>
              <Big size={34} color={theme.colors.negative}>La chaîne favorable à l&apos;or peut casser, au début</Big>
            </Pop>
          </div>
        </div>
      </Beat>
    </SceneShell>
  );
};
