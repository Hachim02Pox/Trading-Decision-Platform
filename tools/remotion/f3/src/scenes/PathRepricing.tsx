import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { theme } from "../theme";
import { Sfx, cueFrame, Panel, GoldBarIcon } from "./shared";
import type { SceneProps } from "./shared";
import { Beat, Pop, Bird, clamp } from "./characters";
import { SceneShell, Big, Label } from "./stage";

const W = 900;
const H = 400;
const X = (m: number) => 60 + (m / 6) * W;
const Y = (cut: number) => 30 + (cut / 1.0) * (H - 60);

const stepPath = (steps: Array<[number, number]>) => {
  let d = `M ${X(0)} ${Y(0)}`;
  let len = 0;
  let px = X(0);
  let py = Y(0);
  for (const [m, cum] of steps) {
    const x = X(m);
    const y = Y(cum);
    d += ` L ${x} ${py} L ${x} ${y}`;
    len += Math.abs(x - px) + Math.abs(y - py);
    px = x;
    py = y;
  }
  d += ` L ${X(6)} ${py}`;
  len += Math.abs(X(6) - px);
  return { d, len };
};

const OLD = stepPath([[1, 0.25], [2.5, 0.5], [4, 0.75], [5.5, 1.0]]);
const NEW = stepPath([[1, 0.25], [2.5, 0.45], [4, 0.65]]);

export const PathRepricing: React.FC<SceneProps> = ({ subtitles, durationInFrames }) => {
  const frame = useCurrentFrame();
  const c = (i: number) => cueFrame(subtitles, i);
  const drawOld = interpolate(frame, [c(6), c(6) + 60], [0, 1], { ...clamp, easing: theme.ease.inOut });
  const drawNew = interpolate(frame, [c(9), c(9) + 60], [0, 1], { ...clamp, easing: theme.ease.inOut });
  const gapP = interpolate(frame, [c(13), c(13) + 20], [0, 1], { ...clamp, easing: theme.ease.out });

  return (
    <SceneShell eyebrow="F3 · Trajectoire" title="Le pari sur six mois, et comment il change" durationInFrames={durationInFrames}>
      <Sfx file="whoosh.wav" at={c(6)} volume={0.4} />
      <Sfx file="whoosh.wav" at={c(9)} volume={0.4} />
      <Sfx file="pop.wav" at={c(11)} volume={0.4} />
      <Sfx file="pop.wav" at={c(12)} volume={0.4} />
      <Sfx file="bass.wav" at={c(13)} volume={0.55} />
      <Sfx file="whoosh.wav" at={c(15) - 2} volume={0.45} />
      <Sfx file="chime.wav" at={c(19)} volume={0.5} />

      <Beat from={c(2)} style={{ left: 0, top: 20 }}>
        <svg width={W + 120} height={H + 60} style={{ overflow: "visible" }}>
          <line x1={X(0)} y1={Y(0)} x2={X(6)} y2={Y(0)} stroke={theme.colors.hairline} strokeWidth="2" />
          {[0, 1, 2, 3, 4, 5, 6].map((m) => (
            <text key={m} x={X(m)} y={Y(0) - 12} textAnchor="middle" fill={theme.colors.textMuted} fontSize="17" fontFamily={theme.mono}>
              {m === 0 ? "auj." : `M${m}`}
            </text>
          ))}
          {[0.25, 0.5, 0.75, 1.0].map((v) => (
            <g key={v}>
              <line x1={X(0)} y1={Y(v)} x2={X(6)} y2={Y(v)} stroke={theme.colors.hairlineSoft} strokeWidth="1" />
              <text x={X(0) - 12} y={Y(v) + 6} textAnchor="end" fill={theme.colors.textMuted} fontSize="16" fontFamily={theme.mono}>
                −{v.toFixed(2).replace(".", ",")}
              </text>
            </g>
          ))}
          <path d={OLD.d} fill="none" stroke={theme.colors.textSecondary} strokeWidth="4" strokeDasharray={`${OLD.len}`} strokeDashoffset={OLD.len * (1 - drawOld)} opacity={0.7} />
          <path d={NEW.d} fill="none" stroke={theme.colors.accent} strokeWidth="5" strokeDasharray={`${NEW.len}`} strokeDashoffset={NEW.len * (1 - drawNew)} />
          {drawOld > 0.98 && (
            <text x={X(6) + 14} y={Y(1.0) + 6} fill={theme.colors.textSecondary} fontSize="20" fontFamily={theme.mono}>
              il y a 2 sem. −1,00
            </text>
          )}
          {drawNew > 0.98 && (
            <text x={X(6) + 14} y={Y(0.65) + 6} fill={theme.colors.accentBright} fontSize="22" fontWeight="700" fontFamily={theme.mono}>
              aujourd&apos;hui −0,65
            </text>
          )}
          {gapP > 0 && (
            <g opacity={gapP}>
              <rect x={X(5.5)} y={Y(0.65)} width={X(6) - X(5.5)} height={(Y(1.0) - Y(0.65)) * gapP} fill={theme.colors.negative} opacity={0.25} />
              <text x={X(5.75)} y={Y(0.825) + 8} textAnchor="middle" fill={theme.colors.negative} fontSize="22" fontWeight="800" fontFamily={theme.mono}>
                −0,35
              </text>
            </g>
          )}
          <text x={X(0)} y={H + 50} fill={theme.colors.textMuted} fontSize="18" fontFamily={theme.mono}>
            baisses cumulées attendues (points de %)
          </text>
        </svg>
      </Beat>

      <div style={{ position: "absolute", left: 1180, top: 20, width: 540, display: "flex", flexDirection: "column", gap: 22 }}>
        <Pop at={c(11)}>
          <Panel>
            <Label color={theme.colors.textMuted}>LE NIVEAU</Label>
            <Big size={30}>Toujours des baisses attendues</Big>
          </Panel>
        </Pop>
        <Pop at={c(12)}>
          <Panel glow={frame >= c(13) && frame < c(17)}>
            <Label color={theme.colors.textMuted}>LA VARIATION</Label>
            <Big size={30} color={theme.colors.negative}>
              −0,35 point de baisses retiré en 2 semaines
            </Big>
          </Panel>
        </Pop>
        <Pop at={c(15)}>
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <Bird kind="hawk" size={120} />
            <Big size={30} color={theme.colors.negative}>
              Plus faucon qu&apos;avant
            </Big>
          </div>
        </Pop>
        <Pop at={c(17)}>
          <Panel glow={frame >= c(19)}>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <GoldBarIcon size={50} />
              <Label color={theme.colors.textPrimary} size={23}>
                Pour l&apos;or à court terme : c&apos;est le <b>changement de pari</b> qui compte le plus
              </Label>
            </div>
          </Panel>
        </Pop>
      </div>
    </SceneShell>
  );
};
