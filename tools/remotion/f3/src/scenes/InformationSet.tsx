import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "../theme";
import { Sfx, cueFrame, Panel } from "./shared";
import type { SceneProps } from "./shared";
import { Beat, Pop, Bubble, FedSpeaker, LiveChart, DocIcon, ClockIcon, series, clamp } from "./characters";
import { SceneShell, Big, Label, STAGE_W } from "./stage";

const STATIONS = [
  { title: "Décision + communiqué", sub: "l'action et les mots" },
  { title: "Projections + graphique à points", sub: "4 fois par an" },
  { title: "Conférence de presse", sub: "renforce ou nuance" },
  { title: "Compte rendu", sub: "plusieurs semaines plus tard" },
];

const DOT_COLUMNS = ["An 1", "An 2", "An 3", "Long terme"];
const dotValue = (col: number, k: number) => {
  const centers = [3.9, 3.4, 3.1, 3.0];
  const spread = [0.3, 0.5, 0.6, 0.4];
  const s = Math.sin(col * 12.9898 + k * 78.233) * 43758.5453;
  const r = s - Math.floor(s);
  return Math.round((centers[col] + (r - 0.5) * 2 * spread[col]) * 8) / 8;
};

const waves = [...series(20, 11, 0, 0.3), 58, 62, 57, ...series(12, 5, 0, 0.5).map((v) => v + 6), 48, 44, 50, ...series(10, 9, 0, 0.4), 60, 64];

export const InformationSet: React.FC<SceneProps> = ({ subtitles, durationInFrames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const c = (i: number) => cueFrame(subtitles, i);
  const stationCues = [c(4), c(7), c(14), c(17)];
  const lineP = interpolate(frame, [c(3), c(17) + 20], [0, 1], { ...clamp, easing: theme.ease.inOut });

  return (
    <SceneShell eyebrow="F3 · Les informations de la Fed" title="Une réunion, plusieurs vagues" durationInFrames={durationInFrames}>
      {stationCues.map((at, i) => (
        <Sfx key={i} file="pop.wav" at={at} volume={0.45} />
      ))}
      <Sfx file="tick.wav" at={c(9)} volume={0.35} />
      <Sfx file="whoosh.wav" at={c(21)} volume={0.45} />
      <Sfx file="chime.wav" at={c(23)} volume={0.45} />

      <div style={{ position: "absolute", left: 0, top: 0, width: STAGE_W, height: 170 }}>
        <div style={{ position: "absolute", left: 120, right: 120, top: 34, height: 4, background: theme.colors.hairline, borderRadius: 2 }}>
          <div style={{ width: `${lineP * 100}%`, height: "100%", background: theme.colors.accent, borderRadius: 2 }} />
        </div>
        {STATIONS.map((s, i) => {
          const active =
            (i === 0 && frame >= c(4) && frame < c(7)) ||
            (i === 1 && frame >= c(7) && frame < c(14)) ||
            (i === 2 && frame >= c(14) && frame < c(17)) ||
            (i === 3 && frame >= c(17) && frame < c(21));
          return (
            <div key={s.title} style={{ position: "absolute", left: 120 + i * 500 - 110, top: 0, width: 220, textAlign: "center" }}>
              <Pop at={stationCues[i]}>
                <div
                  style={{
                    width: 72,
                    height: 72,
                    margin: "0 auto",
                    borderRadius: "50%",
                    background: active ? theme.colors.accent : theme.colors.panelAlt,
                    border: `3px solid ${theme.colors.accent}`,
                    boxShadow: active ? `0 0 40px ${theme.colors.glow}` : undefined,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: active ? theme.colors.bg : theme.colors.accentBright,
                    fontSize: 28,
                    fontWeight: 900,
                    fontFamily: theme.mono,
                  }}
                >
                  {i + 1}
                </div>
                <div style={{ color: theme.colors.textPrimary, fontSize: 19, fontWeight: 700, marginTop: 10 }}>{s.title}</div>
                <div style={{ color: theme.colors.textMuted, fontSize: 16 }}>{s.sub}</div>
              </Pop>
            </div>
          );
        })}
      </div>

      <div style={{ position: "absolute", left: 0, top: 200, width: STAGE_W, height: 490 }}>
        <Beat from={c(4)} to={c(7)} style={{ left: 0, top: 0, width: STAGE_W, display: "flex", justifyContent: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 40 }}>
            <DocIcon size={200} color={theme.colors.textPrimary} />
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <Big size={40}>Ce que la Fed fait</Big>
              <Pop at={c(6)}>
                <Big size={40} color={theme.colors.accentBright}>… et avec quels mots</Big>
              </Pop>
            </div>
          </div>
        </Beat>

        <Beat from={c(7)} to={c(14)} style={{ left: 0, top: 0, width: STAGE_W, display: "flex", justifyContent: "center", gap: 60 }}>
          <Panel style={{ width: 820, padding: 28 }}>
            <svg width="760" height="330" viewBox="0 0 760 330">
              {[2.5, 3.0, 3.5, 4.0, 4.5].map((v) => {
                const y = 300 - (v - 2.25) * 120;
                return (
                  <g key={v}>
                    <line x1="70" x2="750" y1={y} y2={y} stroke={theme.colors.hairlineSoft} />
                    <text x="58" y={y + 6} textAnchor="end" fill={theme.colors.textMuted} fontSize="16" fontFamily={theme.mono}>
                      {v.toFixed(1).replace(".", ",")}
                    </text>
                  </g>
                );
              })}
              {DOT_COLUMNS.map((label, col) => (
                <g key={label}>
                  <text x={150 + col * 170} y="326" textAnchor="middle" fill={theme.colors.textSecondary} fontSize="17" fontFamily={theme.mono}>
                    {label}
                  </text>
                  {Array.from({ length: 19 }).map((_, k) => {
                    const v = dotValue(col, k);
                    const sameBefore = Array.from({ length: k }).filter((__, j) => dotValue(col, j) === v).length;
                    const targetY = 300 - (v - 2.25) * 120;
                    const x = 150 + col * 170 + (sameBefore - 2) * 15;
                    const at = c(9) + col * 14 + k * 1.5;
                    const p = spring({ frame: frame - at, fps, config: theme.spring.bouncy });
                    return <circle key={k} cx={x} cy={interpolate(p, [0, 1], [-20, targetY])} r={6} fill={theme.colors.accent} opacity={Math.min(1, p * 2)} />;
                  })}
                </g>
              ))}
            </svg>
          </Panel>
          <div style={{ display: "flex", flexDirection: "column", gap: 24, width: 480, justifyContent: "center" }}>
            <Pop at={c(10)}>
              <Label color={theme.colors.textPrimary} size={27}>Chaque point = l&apos;avis d&apos;un membre du comité sur les taux futurs</Label>
            </Pop>
            <Pop at={c(12)}>
              <Big size={32} color={theme.colors.accentBright}>Des avis conditionnels, pas des promesses</Big>
            </Pop>
          </div>
        </Beat>

        <Beat from={c(14)} to={c(17)} style={{ left: 0, top: 0, width: STAGE_W, display: "flex", justifyContent: "center", alignItems: "center", gap: 60 }}>
          <FedSpeaker size={260} />
          <div style={{ display: "flex", flexDirection: "column", gap: 30 }}>
            <Pop at={c(15)}>
              <Bubble text="Je renforce ce qui est écrit" tone={theme.colors.accentBright} width={420} tail="left" />
            </Pop>
            <Pop at={c(16)}>
              <Bubble text="…ou je le nuance" tone={theme.colors.context} width={420} tail="left" />
            </Pop>
          </div>
        </Beat>

        <Beat from={c(17)} to={c(21)} style={{ left: 0, top: 0, width: STAGE_W, display: "flex", justifyContent: "center", alignItems: "center", gap: 70 }}>
          <div style={{ display: "flex", gap: 16 }}>
            {[1, 2, 3].map((w) => (
              <Pop key={w} at={c(17) + w * 8}>
                <Panel style={{ width: 150, textAlign: "center", padding: 20 }}>
                  <Label color={theme.colors.textMuted} size={16}>SEMAINE</Label>
                  <Big size={48}>+{w}</Big>
                </Panel>
              </Pop>
            ))}
          </div>
          <div style={{ position: "relative" }}>
            <DocIcon size={190} color={theme.colors.textSecondary} />
            <div style={{ position: "absolute", left: 20, top: 70 }}>
              <Pop at={c(19)}>
                <div style={{ border: `4px solid ${theme.colors.negative}`, color: theme.colors.negative, fontWeight: 900, fontSize: 36, padding: "2px 16px", borderRadius: 10, transform: "rotate(-12deg)" }}>
                  PASSÉ
                </div>
              </Pop>
            </div>
          </div>
          <Label size={26}>Utile, mais ce n&apos;est pas la Fed d&apos;aujourd&apos;hui</Label>
        </Beat>

        <Beat from={c(21)} style={{ left: 0, top: 0, width: STAGE_W, display: "flex", justifyContent: "center", alignItems: "center", gap: 60 }}>
          <div style={{ position: "relative" }}>
            <LiveChart data={waves} width={1000} height={330} from={c(21)} drawFrames={120} color={theme.colors.accent} label="Le prix de l'or pendant et après la réunion" />
            {[0.38, 0.62, 0.9].map((x, i) => (
              <div key={x} style={{ position: "absolute", left: 1000 * x, top: 0 }}>
                <Pop at={c(21) + 40 + i * 30} style={{ marginTop: -28 }}>
                  <div style={{ color: theme.colors.accentBright, fontFamily: theme.mono, fontSize: 17, marginLeft: -24, height: 28 }}>vague {i + 1}</div>
                  <div style={{ width: 2, height: 330, borderLeft: `2px dashed ${theme.colors.textMuted}` }} />
                </Pop>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 18, width: 420 }}>
            <Pop at={c(23)}>
              <ClockIcon size={130} />
            </Pop>
            <Pop at={c(23) + 10}>
              <Big size={30}>Noter l&apos;heure de chaque observation</Big>
            </Pop>
            <Pop at={c(24) + 20}>
              <Big size={28} color={theme.colors.accentBright}>Jamais de conclusion sur le premier titre</Big>
            </Pop>
          </div>
        </Beat>
      </div>
    </SceneShell>
  );
};
