import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { theme } from "../theme";
import { Sfx, cueFrame, Panel, GoldBarIcon } from "./shared";
import type { SceneProps } from "./shared";
import { Beat, Pop, Bird, Domino, DollarIcon, ArrowGlyph, clamp } from "./characters";
import { SceneShell, Big, Label, STAGE_W } from "./stage";

const Tag: React.FC<{ text: string; color: string; at: number }> = ({ text, color, at }) => (
  <Pop at={at}>
    <span style={{ display: "inline-block", border: `2px solid ${color}`, color, borderRadius: 999, padding: "6px 20px", fontSize: 22, fontWeight: 800, fontFamily: theme.mono }}>
      {text}
    </span>
  </Pop>
);

export const Transmission: React.FC<SceneProps> = ({ subtitles, durationInFrames }) => {
  const frame = useCurrentFrame();
  const c = (i: number) => cueFrame(subtitles, i);
  const dominoCues = [c(4), c(5) + 15, c(6) + 20, c(7), c(8), c(10)];
  const hawkX = interpolate(frame, [c(11), c(12) + 40], [STAGE_W, -300], { ...clamp, easing: theme.ease.inOut });
  const rangeShift = interpolate(frame, [c(20), c(20) + 20, c(22), c(22) + 20], [0, 40, 40, -40], { ...clamp, easing: theme.ease.inOut });
  const sig1 = frame >= c(22) ? "adverse" : frame >= c(20) ? "supportive" : null;

  const rev = frame >= c(11) && frame < c(13);
  const tone = rev ? theme.colors.negative : theme.colors.positive;
  const down = () => <ArrowGlyph up={rev} color={tone} size={70} />;

  return (
    <SceneShell eyebrow="F3 · Transmission" title="De la Fed jusqu'à l'or, domino par domino" durationInFrames={durationInFrames}>
      {dominoCues.map((at, i) => (
        <Sfx key={i} file="click.wav" at={at} volume={0.5} />
      ))}
      <Sfx file="whoosh.wav" at={c(11)} volume={0.5} />
      <Sfx file="tick.wav" at={c(14)} volume={0.4} />
      <Sfx file="whoosh.wav" at={c(16)} volume={0.4} />
      <Sfx file="chime.wav" at={c(21)} volume={0.45} />
      <Sfx file="bass.wav" at={c(23)} volume={0.45} />
      <Sfx file="chime.wav" at={c(30)} volume={0.45} />

      <Beat from={c(2)} to={c(16)} style={{ left: 0, top: 0 }}>
        <div style={{ position: "relative", width: STAGE_W, height: 690 }}>
          <div style={{ position: "absolute", left: 10, top: 150, display: "flex", gap: 60 }}>
            <Domino
              at={dominoCues[0]}
              label={rev ? "Fed plus faucon que prévu" : "Fed plus colombe que prévu"}
              icon={<Bird kind={rev ? "hawk" : "dove"} size={110} />}
              tone={tone}
            />
            <Domino at={dominoCues[1]} label="Trajectoire de taux" icon={down()} tone={tone} />
            <Domino at={dominoCues[2]} label="Taux à 2 ans" icon={down()} tone={tone} />
            <Domino at={dominoCues[3]} label="Taux réels" icon={down()} tone={tone} />
            <Domino at={dominoCues[4]} label="Dollar" icon={<DollarIcon size={80} color={theme.colors.textSecondary} />} tone={tone} />
            <Domino at={dominoCues[5]} label="Coût de détenir l'or" icon={<GoldBarIcon size={90} color={rev ? theme.colors.negative : theme.colors.accent} />} tone={rev ? theme.colors.negative : theme.colors.accent} />
          </div>
          {frame >= c(13) &&
            [0, 1, 2, 3, 4].map((i) => (
              <div key={i} style={{ position: "absolute", left: 235 + i * 290, top: 60 }}>
                <Pop at={c(13) + i * 6}>
                  <svg width="70" height="70" viewBox="0 0 70 70">
                    <circle cx="28" cy="28" r="18" stroke={theme.colors.accentBright} strokeWidth="4" fill={`${theme.colors.bg}cc`} />
                    <line x1="41" y1="41" x2="60" y2="60" stroke={theme.colors.accentBright} strokeWidth="6" strokeLinecap="round" />
                    <text x="28" y="36" textAnchor="middle" fontSize="22" fontWeight="800" fill={theme.colors.accentBright}>?</text>
                  </svg>
                </Pop>
              </div>
            ))}
          {frame >= c(11) && frame < c(13) && (
            <div style={{ position: "absolute", left: hawkX, top: -20, display: "flex", alignItems: "center", gap: 20 }}>
              <Bird kind="hawk" size={150} flip />
              <Big size={32} color={theme.colors.negative}>Faucon : la chaîne s&apos;inverse</Big>
            </div>
          )}
          <div style={{ position: "absolute", left: 0, right: 0, top: 560, display: "flex", justifyContent: "center" }}>
            <Beat from={c(14)} style={{ position: "relative" }}>
              <Big size={32} color={theme.colors.accentBright}>Chaque flèche est un lien à vérifier, jamais une vérité automatique</Big>
            </Beat>
          </div>
        </div>
      </Beat>

      <Beat from={c(16)} style={{ left: 0, top: 0 }}>
        <div style={{ display: "flex", gap: 50, width: STAGE_W, justifyContent: "center", paddingTop: 10 }}>
          <Pop at={c(18)}>
            <Panel style={{ width: 640, minHeight: 560 }} glow={frame >= c(18) && frame < c(23)}>
              <Label color={theme.colors.accent}>SIGNAL 1 · LA FOURCHETTE CIBLE</Label>
              <svg width="580" height="250" viewBox="0 0 580 250" style={{ marginTop: 20 }}>
                <line x1="290" y1="10" x2="290" y2="240" stroke={theme.colors.hairline} strokeWidth="3" />
                <rect x="190" y={100 + rangeShift} width="200" height="50" rx="10" fill={theme.colors.accent} opacity={0.9} />
                <text x="290" y={133 + rangeShift} textAnchor="middle" fontSize="22" fontWeight="800" fill={theme.colors.bg} fontFamily={theme.mono}>
                  fourchette
                </text>
                <text x="420" y="40" fill={theme.colors.textMuted} fontSize="18" fontFamily={theme.mono}>plus haut</text>
                <text x="420" y="230" fill={theme.colors.textMuted} fontSize="18" fontFamily={theme.mono}>plus bas</text>
              </svg>
              <div style={{ display: "flex", justifyContent: "center", gap: 16, marginTop: 10, minHeight: 60 }}>
                {sig1 === "supportive" && <Tag text="Baisse → Favorable" color={theme.colors.positive} at={c(21)} />}
                {sig1 === "adverse" && <Tag text="Hausse → Défavorable" color={theme.colors.negative} at={c(23) - 10} />}
              </div>
            </Panel>
          </Pop>
          <Pop at={c(23)}>
            <Panel style={{ width: 900, minHeight: 560 }} glow={frame >= c(24)}>
              <Label color={theme.colors.accent}>SIGNAL 2 · LE MOUVEMENT MOYEN ATTENDU</Label>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 22, height: 170, marginTop: 26, justifyContent: "center" }}>
                {[
                  { l: "0", p: 25 },
                  { l: "−25 pb", p: 60 },
                  { l: "−50 pb", p: 15 },
                ].map((b, i) => (
                  <div key={b.l} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                    <div
                      style={{
                        width: 90,
                        height: interpolate(frame, [c(26) + i * 5, c(26) + i * 5 + 18], [0, b.p * 2.2], { ...clamp, easing: theme.ease.out }),
                        background: `linear-gradient(180deg, ${theme.colors.context}, ${theme.colors.context}55)`,
                        borderRadius: 8,
                      }}
                    />
                    <span style={{ color: theme.colors.textSecondary, fontFamily: theme.mono, fontSize: 17 }}>{b.l}</span>
                  </div>
                ))}
                <div style={{ color: theme.colors.textMuted, fontSize: 40, margin: "0 10px 30px" }}>→</div>
                <Pop at={c(27)}>
                  <div style={{ display: "flex", gap: 18 }}>
                    <Panel style={{ padding: "14px 20px", textAlign: "center" }}>
                      <Label color={theme.colors.textMuted} size={17}>VEILLE</Label>
                      <div style={{ color: theme.colors.textSecondary, fontSize: 30, fontWeight: 800, fontFamily: theme.mono }}>−16 pb</div>
                    </Panel>
                    <Panel style={{ padding: "14px 20px", textAlign: "center" }} glow>
                      <Label color={theme.colors.textMuted} size={17}>AUJOURD&apos;HUI</Label>
                      <div style={{ color: theme.colors.accentBright, fontSize: 30, fontWeight: 800, fontFamily: theme.mono }}>−22 pb</div>
                    </Panel>
                  </div>
                </Pop>
              </div>
              <div style={{ color: theme.colors.textMuted, fontFamily: theme.mono, fontSize: 15, textAlign: "right", marginTop: 6 }}>chiffres d&apos;exemple</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
                  <Tag text="Plus de baisses qu'hier → Favorable" color={theme.colors.positive} at={c(29)} />
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
                  <Tag text="Moins de baisses → Défavorable" color={theme.colors.negative} at={c(31)} />
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
                  <Tag text="Rien n'a changé ou données incomplètes → Contextuel" color={theme.colors.textSecondary} at={c(32) + 20} />
                </div>
              </div>
            </Panel>
          </Pop>
        </div>
      </Beat>
    </SceneShell>
  );
};
