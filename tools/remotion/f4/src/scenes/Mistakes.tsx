import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { theme } from "../theme";
import { Sfx, cueFrame, Panel, GoldBarIcon } from "./shared";
import type { SceneProps } from "./shared";
import { Beat, Pop, clamp } from "./characters";
import { SceneShell, Center, Big, Label } from "./stage";
import { Speedometer } from "./props";

const Trap: React.FC<{ n: number }> = ({ n }) => (
  <div style={{ color: theme.colors.negative, fontFamily: theme.mono, fontSize: 24, letterSpacing: 3, fontWeight: 800, textAlign: "center" }}>PIÈGE {n}</div>
);

const Mini: React.FC<{ pts: number[]; color: string; from: number; label: string }> = ({ pts, color, from, label }) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [from, from + 40], [0, 1], { ...clamp, easing: theme.ease.inOut });
  return (
    <Panel style={{ width: 520 }}>
      <svg width="470" height="230" viewBox="0 0 470 230">
        <line x1="10" y1="115" x2="460" y2="115" stroke={theme.colors.hairline} strokeWidth="2" />
        <polyline points={pts.map((v, i) => `${10 + i * 90},${115 - v}`).join(" ")} fill="none" stroke={color} strokeWidth="6" strokeDasharray="700" strokeDashoffset={700 * (1 - p)} strokeLinecap="round" />
      </svg>
      <Big size={26} color={color}>{label}</Big>
    </Panel>
  );
};

export const Mistakes: React.FC<SceneProps> = ({ subtitles, durationInFrames }) => {
  const frame = useCurrentFrame();
  const c = (i: number) => cueFrame(subtitles, i);
  const CHAIN = ["Inflation", "Pari sur la banque centrale", "Taux réels", "Dollar"];

  return (
    <SceneShell eyebrow="F4 · Pièges" title="Cinq pièges à éviter" durationInFrames={durationInFrames}>
      {[c(1), c(5), c(9), c(13), c(15)].map((at, i) => (
        <Sfx key={i} file="bass.wav" at={at} volume={0.4} />
      ))}
      <Sfx file="chime.wav" at={c(19)} volume={0.45} />

      <Beat from={c(1)} to={c(5)} style={{ left: 0, top: 0 }}>
        <Center column gap={30}>
          <Trap n={1} />
          <div style={{ display: "flex", alignItems: "center", gap: 40 }}>
            <Mini pts={[0, 30, 52, 68, 78, 84]} color={theme.colors.accent} from={c(1)} label="Moins vite : les prix montent encore" />
            <div style={{ color: theme.colors.negative, fontSize: 90, fontWeight: 900 }}>≠</div>
            <Mini pts={[0, -14, -30, -44, -56, -66]} color={theme.colors.context} from={c(2)} label="Déflation : les prix baissent" />
          </div>
        </Center>
      </Beat>

      <Beat from={c(5)} to={c(9)} style={{ left: 0, top: 0 }}>
        <Center column gap={50}>
          <Trap n={2} />
          <div style={{ display: "flex", alignItems: "center", gap: 50 }}>
            <Pop at={c(6)}>
              <div style={{ textAlign: "center" }}>
                <div style={{ width: 140, height: 50, borderRadius: 10, background: theme.colors.context, margin: "0 auto" }} />
                <Big size={32}>sur un mois</Big>
              </div>
            </Pop>
            <div style={{ color: theme.colors.negative, fontSize: 90, fontWeight: 900 }}>≠</div>
            <Pop at={c(7)}>
              <div style={{ textAlign: "center" }}>
                <div style={{ width: 840, height: 50, borderRadius: 10, background: `repeating-linear-gradient(90deg, ${theme.colors.accent} 0 64px, ${theme.colors.accentDim} 64px 70px)`, margin: "0 auto" }} />
                <Big size={32}>sur un an (12 mois)</Big>
              </div>
            </Pop>
          </div>
          <Pop at={c(8)}>
            <Big size={36} color={theme.colors.accentBright}>Deux horizons différents</Big>
          </Pop>
        </Center>
      </Beat>

      <Beat from={c(9)} to={c(13)} style={{ left: 0, top: 0 }}>
        <Center column gap={30}>
          <Trap n={3} />
          <div style={{ display: "flex", gap: 120 }}>
            <Pop at={c(11)}>
              <div style={{ textAlign: "center" }}>
                <Speedometer value={frame >= c(11) ? 0.15 : 0} size={300} label="surprise" />
                <Big size={28}>Chiffre élevé, mais attendu</Big>
              </div>
            </Pop>
            <Pop at={c(12)}>
              <div style={{ textAlign: "center" }}>
                <Speedometer value={frame >= c(12) ? 0.88 : 0} size={300} label="surprise" />
                <Big size={28} color={theme.colors.accentBright}>Chiffre moyen, totalement inattendu</Big>
              </div>
            </Pop>
          </div>
          <Label size={24}>Et les révisions changent l&apos;histoire après coup</Label>
        </Center>
      </Beat>

      <Beat from={c(13)} to={c(15)} style={{ left: 0, top: 0 }}>
        <Center column gap={40}>
          <Trap n={4} />
          <div style={{ display: "flex", alignItems: "center", gap: 30 }}>
            <Panel glow style={{ padding: "26px 40px" }}>
              <Big size={44}>F4 seul</Big>
            </Panel>
            <div style={{ color: theme.colors.textMuted, fontSize: 60 }}>→</div>
            <GoldBarIcon size={110} />
            <div style={{ color: theme.colors.negative, fontSize: 110, fontWeight: 900 }}>?</div>
          </div>
          <Big size={34} color={theme.colors.accentBright}>Impossible d&apos;en déduire la direction de l&apos;or</Big>
        </Center>
      </Beat>

      <Beat from={c(15)} style={{ left: 0, top: 0 }}>
        <Center column gap={50}>
          <Trap n={5} />
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {CHAIN.map((t, i) => (
              <React.Fragment key={t}>
                {i > 0 && (
                  <Pop at={c(16) + i * 12 - 6}>
                    <svg width="70" height="40">
                      <path d="M4 20 H60 M50 10 L62 20 L50 30" stroke={theme.colors.accent} strokeWidth="4" fill="none" />
                    </svg>
                  </Pop>
                )}
                <Pop at={c(16) + i * 12}>
                  <Panel style={{ padding: "20px 26px" }}>
                    <Big size={28}>{t}</Big>
                  </Panel>
                </Pop>
              </React.Fragment>
            ))}
          </div>
          <Pop at={c(18)}>
            <Big size={32} color={theme.colors.negative}>Pas quatre preuves indépendantes…</Big>
          </Pop>
          <Pop at={c(19)}>
            <Big size={40} color={theme.colors.accentBright} glow>… souvent une seule et même chaîne</Big>
          </Pop>
        </Center>
      </Beat>
    </SceneShell>
  );
};
