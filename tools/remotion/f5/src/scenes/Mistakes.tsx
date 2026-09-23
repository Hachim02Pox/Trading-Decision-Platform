import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { theme } from "../theme";
import { Sfx, makeCue, Panel } from "./shared";
import type { SceneProps } from "./shared";
import { Beat, Pop, Person, DocIcon, clamp } from "./characters";
import { SceneShell, Center, Big, Label } from "./stage";
import { Briefcase, Office, HouseGlyph, Gauge50, CrossDraw, ModelMachine, Stamp, Pill } from "./props5";

const C = theme.colors;

const Trap: React.FC<{ n: number }> = ({ n }) => (
  <div style={{ color: C.negative, fontFamily: theme.mono, fontSize: 26, letterSpacing: 3, fontWeight: 800, textAlign: "center" }}>PIÈGE {n}</div>
);

const Neq = () => <div style={{ color: C.negative, fontSize: 96, fontWeight: 900, lineHeight: 1 }}>≠</div>;

const Spike: React.FC<{ from: number }> = ({ from }) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [from, from + 36], [0, 1], { ...clamp, easing: theme.ease.inOut });
  const pts = [60, 58, 61, 59, 60, 20, 60, 59, 61, 60];
  return (
    <svg width="420" height="140" viewBox="0 0 420 120">
      <polyline points={pts.map((v, i) => `${10 + i * 44},${v}`).join(" ")} fill="none" stroke={C.negative} strokeWidth="5" strokeDasharray="700" strokeDashoffset={700 * (1 - p)} strokeLinejoin="round" />
    </svg>
  );
};

export const Mistakes: React.FC<SceneProps> = ({ words, durationInFrames }) => {
  const frame = useCurrentFrame();
  const cue = makeCue(words);
  const t1 = cue("piege un");
  const t1a = cue("confondre des emplois");
  const t1b = cue("ou croire que");
  const t2 = cue("piege deux");
  const t2a = cue("un pic d inscriptions");
  const t2b = cue("un seul rapport");
  const t2c = cue("une seule mise a jour");
  const t2d = cue("une tendance confirmee");
  const t3 = cue("piege trois");
  const t3a = cue("comme une contraction");
  const t4 = cue("piege quatre");
  const t4a = cue("comme une prevision officielle");
  const t5 = cue("et piege cinq");
  const t5a = cue("reagir au titre");
  const t5b = cue("sans regarder");

  return (
    <SceneShell eyebrow="F5 · Pièges" title="Cinq pièges à éviter" durationInFrames={durationInFrames}>
      {[t1, t2, t3, t4, t5].map((at, i) => (
        <Sfx key={i} file="bass.wav" at={at} volume={0.4} />
      ))}
      <Sfx file="pop.wav" at={t2a} volume={0.35} />
      <Sfx file="pop.wav" at={t2b} volume={0.35} />
      <Sfx file="pop.wav" at={t2c} volume={0.35} />
      <Sfx file="tick.wav" at={t5b} volume={0.45} />

      <Beat from={0} to={t1 - 4} style={{ left: 0, top: 0 }}>
        <Center gap={40}>
          {[1, 2, 3, 4, 5].map((n) => (
            <Pop key={n} at={4 + n * 5}>
              <div style={{ transform: `rotate(${Math.sin(frame / 7 + n) * 6}deg)` }}>
                <svg width="170" height="160" viewBox="0 0 60 56">
                  <path d="M30 4 L57 52 H3 Z" fill={`${C.negative}22`} stroke={C.negative} strokeWidth="3" strokeLinejoin="round" />
                  <text x="30" y="44" textAnchor="middle" fontSize="24" fontWeight="900" fill={C.negative} fontFamily={theme.mono}>
                    {n}
                  </text>
                </svg>
              </div>
            </Pop>
          ))}
        </Center>
      </Beat>

      <Beat from={t1 - 4} to={t2} style={{ left: 0, top: 0 }}>
        <Center column gap={34}>
          <Trap n={1} />
          <div style={{ display: "flex", alignItems: "center", gap: 50 }}>
            <Pop at={t1a}>
              <Panel style={{ display: "flex", alignItems: "center", gap: 20, padding: 26 }}>
                <div style={{ display: "flex", gap: 6 }}>
                  <Briefcase size={60} />
                  <Briefcase size={60} color={C.accent} />
                </div>
                <Big size={32}>2 emplois</Big>
              </Panel>
            </Pop>
            <Neq />
            <Pop at={t1a + 10}>
              <Panel style={{ display: "flex", alignItems: "center", gap: 20, padding: 26 }}>
                <Person size={100} color={C.context} />
                <Big size={32}>1 personne</Big>
              </Panel>
            </Pop>
          </div>
          {frame >= t1b && (
            <Pop at={t1b}>
              <div style={{ display: "flex", alignItems: "center", gap: 40 }}>
                <Office size={120} lit />
                <Label size={28} color={C.textPrimary}>enquête établissements</Label>
                <Neq />
                <Label size={28} color={C.textPrimary}>enquête ménages</Label>
                <HouseGlyph size={110} lit />
              </div>
            </Pop>
          )}
        </Center>
      </Beat>

      <Beat from={t2} to={t3} style={{ left: 0, top: 0 }}>
        <Center column gap={34}>
          <Trap n={2} />
          <div style={{ display: "flex", gap: 24 }}>
            <Pop at={t2a}>
              <Panel style={{ padding: 20, textAlign: "center" }}>
                <Spike from={t2a} />
                <Label size={24} color={C.textPrimary}>un pic sur 1 semaine</Label>
              </Panel>
            </Pop>
            <Pop at={t2b}>
              <Panel style={{ padding: 20, textAlign: "center", width: 330 }}>
                <DocIcon size={120} />
                <Label size={24} color={C.textPrimary}>un seul rapport</Label>
              </Panel>
            </Pop>
            <Pop at={t2c}>
              <Panel style={{ padding: 20, textAlign: "center", width: 330 }}>
                <div style={{ display: "flex", justifyContent: "center" }}>
                  <ModelMachine size={150} display="2,8" />
                </div>
                <Label size={24} color={C.textPrimary}>une seule mise à jour d&apos;Atlanta</Label>
              </Panel>
            </Pop>
          </div>
          {frame >= t2d && (
            <Pop at={t2d}>
              <div style={{ display: "flex", alignItems: "center", gap: 30 }}>
                <Neq />
                <Big size={44} color={C.accentBright}>une tendance confirmée</Big>
              </div>
            </Pop>
          )}
        </Center>
      </Beat>

      <Beat from={t3} to={t4} style={{ left: 0, top: 0 }}>
        <Center gap={80}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
            <Trap n={3} />
            <Gauge50 value={49} size={400} label="ISM" />
          </div>
          <Neq />
          <Pop at={t3a}>
            <div style={{ position: "relative" }}>
              <Panel style={{ padding: "30px 40px" }}>
                <Big size={50} color={C.negative}>−1 % d&apos;activité</Big>
              </Panel>
              <div style={{ position: "absolute", left: 110, top: -20 }}>
                <CrossDraw at={t3a + 16} size={150} />
              </div>
            </div>
          </Pop>
        </Center>
      </Beat>

      <Beat from={t4} to={t5} style={{ left: 0, top: 0 }}>
        <Center gap={70}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
            <Trap n={4} />
            <ModelMachine size={320} display="2,5 %" />
            <Label size={24}>estimation d&apos;Atlanta</Label>
          </div>
          <Neq />
          <Pop at={t4a}>
            <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
              <DocIcon size={200} color={C.textPrimary} />
              <Label size={26} color={C.textPrimary}>prévision officielle du PIB</Label>
              <div style={{ position: "absolute", left: -10, top: 50 }}>
                <Stamp at={t4a + 20} text="FAUX" size={50} />
              </div>
            </div>
          </Pop>
        </Center>
      </Beat>

      <Beat from={t5} style={{ left: 0, top: 0 }}>
        <Center column gap={30}>
          <Trap n={5} />
          <div style={{ display: "flex", alignItems: "center", gap: 50 }}>
            <Pop at={t5a}>
              <Panel glow style={{ padding: "26px 40px", textAlign: "center" }}>
                <Label size={22}>le titre</Label>
                <Big size={56} color={C.positive}>+190 000</Big>
              </Panel>
            </Pop>
            {frame >= t5b && (
              <Pop at={t5b}>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <Pill text="révision mois −1 : −35 000" color={C.negative} size={26} />
                  <Pill text="révision mois −2 : −25 000" color={C.negative} size={26} />
                </div>
              </Pop>
            )}
          </div>
          {frame >= t5b + 20 && (
            <Pop at={t5b + 20}>
              <Big size={40} color={C.accentBright}>Lis toujours les révisions avant de réagir</Big>
            </Pop>
          )}
        </Center>
      </Beat>
    </SceneShell>
  );
};
