import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { theme } from "../theme";
import { Sfx, cueFrame, Panel, AnimatedNumber } from "./shared";
import type { SceneProps } from "./shared";
import { Beat, Pop, ArrowGlyph, clamp } from "./characters";
import { SceneShell, Big, Label, STAGE_W } from "./stage";
import { MonthWindow, PriceTag } from "./props";

const MONTHS = [0.45, 0.25, 0.28, 0.22, 0.3, 0.26, 0.24, 0.27, 0.25, 0.23, 0.25, 0.2, 0.35];

export const MomYoy: React.FC<SceneProps> = ({ subtitles, durationInFrames }) => {
  const frame = useCurrentFrame();
  const c = (i: number) => cueFrame(subtitles, i);
  const arcShort = interpolate(frame, [c(1), c(1) + 20], [0, 1], { ...clamp, easing: theme.ease.out });
  const arcLong = interpolate(frame, [c(3), c(3) + 30], [0, 1], { ...clamp, easing: theme.ease.out });
  const windowStart = interpolate(frame, [c(24), c(25) + 10], [0, 1], { ...clamp, easing: theme.ease.inOut });
  const values = frame >= c(18) ? MONTHS : MONTHS.slice(0, 12);
  const highlight = [...(frame >= c(18) ? [12] : []), ...(frame >= c(20) && frame < c(22) ? [11] : [])];
  const dropped = frame >= c(25) + 10 ? [0] : [];

  const X0 = 120;
  const X1 = X0 + 11 * 120;
  const X2 = 1560;

  return (
    <SceneShell eyebrow="F4 · Sur un mois, sur un an" title="Deux lectures d'un même indice" durationInFrames={durationInFrames}>
      <Sfx file="whoosh.wav" at={c(1)} volume={0.35} />
      <Sfx file="whoosh.wav" at={c(3)} volume={0.35} />
      <Sfx file="chime.wav" at={c(8)} volume={0.45} />
      <Sfx file="chime.wav" at={c(12)} volume={0.45} />
      <Sfx file="bass.wav" at={c(14)} volume={0.5} />
      <Sfx file="pop.wav" at={c(18)} volume={0.45} />
      <Sfx file="whoosh.wav" at={c(24)} volume={0.5} />
      <Sfx file="bass.wav" at={c(29)} volume={0.45} />

      <Beat from={c(0)} to={c(13)} style={{ left: 0, top: 0 }}>
        <div style={{ position: "relative", width: STAGE_W, height: 690 }}>
          <svg width={STAGE_W} height={690} style={{ position: "absolute", left: 0, top: 0 }}>
            <line x1={X0} y1="400" x2={X2} y2="400" stroke={theme.colors.hairline} strokeWidth="3" />
            {Array.from({ length: 13 }).map((_, i) => (
              <circle key={i} cx={X0 + i * 120} cy="400" r={i === 0 || i >= 11 ? 12 : 6} fill={i === 0 || i >= 11 ? theme.colors.accent : theme.colors.textMuted} />
            ))}
            <path d={`M ${X1} 380 Q ${(X1 + X2) / 2} 300 ${X2} 380`} stroke={theme.colors.context} strokeWidth="6" fill="none" strokeDasharray="400" strokeDashoffset={400 * (1 - arcShort)} />
            <path d={`M ${X0} 380 Q ${(X0 + X2) / 2} 60 ${X2} 380`} stroke={theme.colors.accentBright} strokeWidth="6" fill="none" strokeDasharray="1800" strokeDashoffset={1800 * (1 - arcLong)} />
          </svg>
          <div style={{ position: "absolute", left: X0 - 80, top: 430, width: 160, textAlign: "center" }}>
            <Label size={20}>il y a 1 an</Label>
            <Pop at={c(10)}>
              <Big size={36}>301,6</Big>
            </Pop>
          </div>
          <div style={{ position: "absolute", left: X1 - 80, top: 430, width: 160, textAlign: "center" }}>
            <Label size={20}>mois dernier</Label>
            <Pop at={c(6)}>
              <Big size={36}>310,0</Big>
            </Pop>
          </div>
          <div style={{ position: "absolute", left: X2 - 80, top: 430, width: 160, textAlign: "center" }}>
            <Label size={20}>ce mois</Label>
            <Pop at={c(6) + 30}>
              <Big size={36} color={theme.colors.accentBright}>310,93</Big>
            </Pop>
          </div>
          <div style={{ position: "absolute", left: X1 - 30, top: 220 }}>
            <Pop at={c(1)}>
              <Panel style={{ padding: "12px 20px", textAlign: "center" }}>
                <Label color={theme.colors.context} size={20}>SUR UN MOIS</Label>
                {frame >= c(8) && <AnimatedNumber from={0} to={0.3} delay={c(8)} format={(n) => `+${n.toFixed(2).replace(".", ",")} %`} style={{ color: theme.colors.textPrimary, fontSize: 36, fontWeight: 900, fontFamily: theme.mono }} />}
              </Panel>
            </Pop>
          </div>
          <div style={{ position: "absolute", left: 640, top: 60 }}>
            <Pop at={c(3)}>
              <Panel style={{ padding: "12px 24px", textAlign: "center" }} glow={frame >= c(12)}>
                <Label color={theme.colors.accentBright} size={20}>SUR UN AN</Label>
                {frame >= c(12) && <AnimatedNumber from={0} to={3.09} delay={c(12)} format={(n) => `≈ ${n.toFixed(2).replace(".", ",")} %`} style={{ color: theme.colors.textPrimary, fontSize: 40, fontWeight: 900, fontFamily: theme.mono }} />}
              </Panel>
            </Pop>
          </div>
        </div>
      </Beat>

      <Beat from={c(13)} style={{ left: 0, top: 0 }}>
        <div style={{ position: "relative", width: STAGE_W, height: 690 }}>
          <div style={{ position: "absolute", left: 0, top: 0 }}>
            <Pop at={c(14)}>
              <Big size={46} color={theme.colors.accentBright}>L&apos;effet de base</Big>
            </Pop>
          </div>
          <div style={{ position: "absolute", left: 10, top: 90 }}>
            {frame >= c(15) && <MonthWindow values={values} windowStart={windowStart} highlight={highlight} dropped={dropped} appearFrom={c(15)} />}
          </div>
          {frame >= c(25) + 10 && (
            <div style={{ position: "absolute", left: 20, top: 290 + interpolate(frame, [c(25) + 10, c(25) + 40], [0, 180], { ...clamp, easing: theme.ease.in }), opacity: interpolate(frame, [c(25) + 10, c(25) + 45], [1, 0], clamp) }}>
              <PriceTag text="0,45 sort" color={theme.colors.negative} />
            </div>
          )}
          <div style={{ position: "absolute", left: 1330, top: 60, width: 400 }}>
            <Pop at={c(16)}>
              <Panel glow style={{ textAlign: "center" }}>
                <Label color={theme.colors.textMuted} size={18}>SUR UN AN (somme de la fenêtre)</Label>
                <AnimatedNumber from={3.2} to={frame >= c(23) ? 3.1 : 3.2} delay={c(23)} format={(n) => `${n.toFixed(1).replace(".", ",")} %`} style={{ color: theme.colors.accentBright, fontSize: 64, fontWeight: 900, fontFamily: theme.mono }} />
                {frame >= c(23) && (
                  <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 8 }}>
                    <ArrowGlyph up={false} color={theme.colors.positive} size={30} />
                    <Label color={theme.colors.positive} size={22}>recule</Label>
                  </div>
                )}
              </Panel>
            </Pop>
          </div>
          <div style={{ position: "absolute", left: 0, top: 500, display: "flex", gap: 26, alignItems: "center" }}>
            <Pop at={c(21)}>
              <Panel style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 22px" }}>
                <ArrowGlyph up color={theme.colors.negative} size={30} />
                <span style={{ color: theme.colors.textPrimary, fontSize: 24, fontWeight: 800 }}>Sur un mois : 0,20 → 0,35, ça accélère</span>
              </Panel>
            </Pop>
            <Pop at={c(29)}>
              <div style={{ border: `4px solid ${theme.colors.accentBright}`, color: theme.colors.accentBright, fontSize: 36, fontWeight: 900, padding: "4px 22px", borderRadius: 12, transform: "rotate(-5deg)" }}>
                CONTRASTÉE
              </div>
            </Pop>
            <Pop at={c(31)}>
              <Panel style={{ padding: "14px 22px" }}>
                <span style={{ color: theme.colors.textPrimary, fontSize: 22 }}>
                  Le marché regarde la <b style={{ color: theme.colors.accentBright }}>surprise</b> vs le consensus
                </span>
              </Panel>
            </Pop>
          </div>
        </div>
      </Beat>
    </SceneShell>
  );
};
