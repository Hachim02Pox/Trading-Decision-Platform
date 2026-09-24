import React from "react";
import { useCurrentFrame } from "remotion";
import { theme } from "../theme";
import { Sfx, makeCue, Panel, GoldBarIcon } from "./shared";
import type { SceneProps } from "./shared";
import { Beat, Pop } from "./characters";
import { SceneShell, Center, Big, Label } from "./stage";
import { CrossDraw, Stamp } from "./props5";
import { Coin, QuoteBoard, Seesaw } from "./props6";

const C = theme.colors;

const Trap: React.FC<{ n: number }> = ({ n }) => (
  <div style={{ color: C.negative, fontFamily: theme.mono, fontSize: 26, letterSpacing: 3, fontWeight: 800, textAlign: "center" }}>PIÈGE {n}</div>
);
const Neq = () => <div style={{ color: C.negative, fontSize: 96, fontWeight: 900, lineHeight: 1 }}>≠</div>;

export const Mistakes: React.FC<SceneProps> = ({ words, durationInFrames }) => {
  const frame = useCurrentFrame();
  const cue = makeCue(words);
  const t1 = cue("piege un");
  const t1b = cue("un niveau n est pas");
  const t2 = cue("piege deux");
  const t2b = cue("ou croire que le dxy");
  const t3 = cue("piege trois");
  const t4 = cue("piege quatre");
  const t4b = cue("ou compter le dollar");
  const t5 = cue("et piege cinq");
  const t5b = cue("en ordre d achat");

  return (
    <SceneShell eyebrow="F6 · Pièges" title="Cinq pièges à éviter" durationInFrames={durationInFrames}>
      {[t1, t2, t3, t4, t5].map((at, i) => (
        <Sfx key={i} file="bass.wav" at={at} volume={0.4} />
      ))}

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
        <Center column gap={40}>
          <Trap n={1} />
          <div style={{ display: "flex", alignItems: "center", gap: 50 }}>
            <Pop at={t1 + 10}>
              <Panel style={{ padding: "26px 40px", textAlign: "center" }}>
                <div style={{ fontFamily: theme.mono, fontSize: 80, fontWeight: 900, color: C.textPrimary }}>104</div>
                <Label size={24}>un niveau élevé</Label>
              </Panel>
            </Pop>
            <Neq />
            <Pop at={t1b}>
              <Panel style={{ padding: "26px 40px", textAlign: "center" }}>
                <Big size={40} color={C.negative}>une nouvelle pression</Big>
                <Label size={24}>il faut mesurer la variation</Label>
              </Panel>
            </Pop>
          </div>
        </Center>
      </Beat>

      <Beat from={t2} to={t3} style={{ left: 0, top: 0 }}>
        <Center column gap={40}>
          <Trap n={2} />
          <div style={{ display: "flex", alignItems: "center", gap: 40 }}>
            <Pop at={t2 + 10}>
              <QuoteBoard base="USD" quote="JPY" value="155,0" dir="up" />
            </Pop>
            <Big size={40} color={C.textMuted}>≠</Big>
            <Pop at={t2 + 20}>
              <QuoteBoard base="EUR" quote="USD" value="1,15" dir="up" />
            </Pop>
          </div>
          {frame >= t2b && (
            <Pop at={t2b}>
              <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                <Big size={32}>DXY = toutes les devises ?</Big>
                <CrossDraw at={t2b + 10} size={70} />
              </div>
            </Pop>
          )}
        </Center>
      </Beat>

      <Beat from={t3} to={t4} style={{ left: 0, top: 0 }}>
        <Center column gap={40}>
          <Trap n={3} />
          <Pop at={t3 + 10}>
            <Panel glow style={{ padding: "26px 40px", textAlign: "center" }}>
              <Big size={40} color={C.accentBright}>lecture du terminal = non officielle</Big>
              <Label size={26}>pas le flux sous licence de l&apos;opérateur</Label>
            </Panel>
          </Pop>
        </Center>
      </Beat>

      <Beat from={t4} to={t5} style={{ left: 0, top: 0 }}>
        <Center column gap={30}>
          <Trap n={4} />
          <div style={{ display: "flex", alignItems: "center", gap: 50 }}>
            <Pop at={t4 + 10}>
              <div style={{ position: "relative" }}>
                <Seesaw tilt={10} width={520} />
                <div style={{ position: "absolute", left: 200, top: 120 }}>
                  <CrossDraw at={t4 + 30} size={120} />
                </div>
              </div>
            </Pop>
            {frame >= t4b && (
              <Pop at={t4b}>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {["dollar", "taux", "pari sur la Fed"].map((t) => (
                    <Panel key={t} style={{ padding: "10px 22px" }}>
                      <Label size={26} color={C.textPrimary}>{t}</Label>
                    </Panel>
                  ))}
                  <Label size={24} color={C.accentBright}>= souvent une seule chaîne, pas 3 preuves</Label>
                </div>
              </Pop>
            )}
          </div>
        </Center>
      </Beat>

      <Beat from={t5} style={{ left: 0, top: 0 }}>
        <Center column gap={40}>
          <Trap n={5} />
          <div style={{ display: "flex", alignItems: "center", gap: 40 }}>
            <Pop at={t5 + 10}>
              <div style={{ display: "flex", gap: 16 }}>
                <span style={{ color: C.positive, border: `2px solid ${C.positive}`, borderRadius: 10, padding: "8px 20px", fontSize: 30, fontWeight: 800 }}>Favorable</span>
                <span style={{ color: C.negative, border: `2px solid ${C.negative}`, borderRadius: 10, padding: "8px 20px", fontSize: 30, fontWeight: 800 }}>Défavorable</span>
              </div>
            </Pop>
            <Neq />
            <Pop at={t5b}>
              <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                <Big size={40}>ACHAT / VENTE</Big>
                <GoldBarIcon size={70} />
                <Coin sym="$" size={60} color={C.positive} />
              </div>
            </Pop>
          </div>
          {frame >= t5b + 30 && <Stamp at={t5b + 30} text="JAMAIS" size={44} />}
        </Center>
      </Beat>
    </SceneShell>
  );
};
