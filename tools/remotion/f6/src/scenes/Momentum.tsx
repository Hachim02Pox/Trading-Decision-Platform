import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { theme } from "../theme";
import { Sfx, makeCue, Panel, GoldBarIcon } from "./shared";
import type { SceneProps } from "./shared";
import { Beat, Pop, clamp } from "./characters";
import { SceneShell, Center, Big, Label, STAGE_W } from "./stage";
import { Stamp, Pill } from "./props5";

const C = theme.colors;
// five sessions of DXY: up 0.42 % overall, last day -0.18 %
const SESS = [104.18, 104.3, 104.41, 104.63, 104.81, 104.62];

export const Momentum: React.FC<SceneProps> = ({ words, durationInFrames }) => {
  const frame = useCurrentFrame();
  const cue = makeCue(words);
  const t104 = cue("un dxy a 104");
  const tNiv = cue("c est un niveau");
  const tNi = cue("ni fort");
  const tHist = cue("il faut l historique");
  const tDeux = cue("deux variations");
  const tJour = cue("la variation du jour");
  const t5 = cue("et la variation sur cinq");
  const tEx = cue("exemple");
  const tVal = cue("le dxy vaut");
  const tBaisse = cue("il baisse de");
  const tMonte = cue("mais il monte");
  const tContra = cue("contradiction");
  const tRepli = cue("c est un repli");
  const tJourOr = cue("sur la journee");
  const t5Or = cue("sur cinq seances le dollar");
  const tDiv = cue("c est divergent");
  const tRegle = cue("la regle");

  const draw = interpolate(frame, [tVal, tMonte + 20], [0, 1], { ...clamp, easing: theme.ease.inOut });
  const W = 900;
  const H = 300;
  const min = 104.1;
  const max = 104.9;
  const px = (i: number) => 30 + (i / (SESS.length - 1)) * (W - 60);
  const py = (v: number) => H - ((v - min) / (max - min)) * (H - 40) - 20;
  const shown = Math.max(2, Math.floor(draw * (SESS.length - 1)) + 1);

  return (
    <SceneShell eyebrow="F6 · Lire les chiffres" title="Un niveau, et deux horloges" durationInFrames={durationInFrames}>
      <Sfx file="pop.wav" at={t104} volume={0.4} />
      <Sfx file="tick.wav" at={tJour} volume={0.4} />
      <Sfx file="tick.wav" at={t5} volume={0.4} />
      <Sfx file="whoosh.wav" at={tEx} volume={0.4} />
      <Sfx file="bass.wav" at={tContra} volume={0.4} />
      <Sfx file="chime.wav" at={tRepli} volume={0.45} />
      <Sfx file="bass.wav" at={tDiv} volume={0.5} />

      <Beat from={0} to={tEx} style={{ left: 0, top: 0 }}>
        <Center column gap={40}>
          <Pop at={t104}>
            <div style={{ fontFamily: theme.mono, fontSize: 160, fontWeight: 900, color: C.textPrimary, lineHeight: 1 }}>104</div>
          </Pop>
          {frame >= tNiv && (
            <Pop at={tNiv}>
              <Pill text="un niveau" size={32} filled />
            </Pop>
          )}
          {frame >= tNi && <Label size={28}>ni fort, ni faible… sans historique ni contexte</Label>}
          <div style={{ display: "flex", gap: 40, opacity: frame >= tDeux ? 1 : 0 }}>
            <Pop at={tJour}>
              <Panel glow={frame >= tJour && frame < t5} style={{ padding: "18px 30px", textAlign: "center" }}>
                <Big size={32}>variation du jour</Big>
                <Label size={22}>vs la référence de la veille</Label>
              </Panel>
            </Pop>
            <Pop at={t5}>
              <Panel glow={frame >= t5} style={{ padding: "18px 30px", textAlign: "center" }}>
                <Big size={32}>variation sur 5 séances</Big>
                <Label size={22}>vs cinq séances plus tôt</Label>
              </Panel>
            </Pop>
          </div>
          {frame >= tHist && frame < tDeux && <Label size={22}>il faut l&apos;historique, et le contexte</Label>}
        </Center>
      </Beat>

      <Beat from={tEx} style={{ left: 0, top: 0 }}>
        <div style={{ position: "relative", width: STAGE_W, height: 690 }}>
          <div style={{ position: "absolute", left: 20, top: 30 }}>
            <Panel style={{ padding: 20 }}>
              <svg width={W} height={H + 30}>
                {SESS.map((v, i) => (
                  <text key={i} x={px(i)} y={H + 24} textAnchor="middle" fill={C.textMuted} fontSize="16" fontFamily={theme.mono}>
                    {i === 0 ? "J-5" : i === SESS.length - 1 ? "aujourd'hui" : `J-${SESS.length - 1 - i}`}
                  </text>
                ))}
                <polyline points={SESS.slice(0, shown).map((v, i) => `${px(i)},${py(v)}`).join(" ")} fill="none" stroke={C.accentBright} strokeWidth="6" strokeLinejoin="round" strokeLinecap="round" />
                {SESS.slice(0, shown).map((v, i) => (
                  <circle key={i} cx={px(i)} cy={py(v)} r={i === shown - 1 ? 10 : 6} fill={i === SESS.length - 1 && shown === SESS.length ? C.positive : C.accentBright} />
                ))}
                {frame >= tMonte && (
                  <g>
                    <line x1={px(0)} y1={py(SESS[0])} x2={px(5)} y2={py(SESS[0])} stroke={C.hairline} strokeDasharray="6 6" />
                    <text x={px(0)} y={30} fill={C.negative} fontSize="22" fontWeight="800">+0,42 % sur 5 séances</text>
                  </g>
                )}
                {frame >= tBaisse && shown === SESS.length && (
                  <text x={px(5) - 10} y={py(SESS[5]) + 40} textAnchor="end" fill={C.positive} fontSize="22" fontWeight="800">−0,18 % aujourd&apos;hui</text>
                )}
              </svg>
            </Panel>
            <div style={{ display: "flex", justifyContent: "center", marginTop: 14 }}>
              <Pop at={tVal}>
                <Big size={44}>DXY 104,62</Big>
              </Pop>
            </div>
          </div>
          <div style={{ position: "absolute", left: 1000, top: 30, width: 720, display: "flex", flexDirection: "column", gap: 20 }}>
            {frame >= tContra && (
              <Pop at={tContra}>
                <Label size={30} color={C.textPrimary}>contradiction ? non.</Label>
              </Pop>
            )}
            {frame >= tRepli && (
              <Pop at={tRepli}>
                <Panel style={{ padding: "14px 22px" }}>
                  <Label size={26} color={C.accentBright}>un repli à l&apos;intérieur d&apos;une force récente</Label>
                </Panel>
              </Pop>
            )}
            {frame >= tJourOr && (
              <Pop at={tJourOr}>
                <Panel style={{ padding: "14px 22px", display: "flex", alignItems: "center", gap: 16, borderColor: C.positive }}>
                  <GoldBarIcon size={56} color={C.positive} />
                  <Label size={24} color={C.textPrimary}>sur la journée : dollar plus faible → pèse moins sur l&apos;or</Label>
                </Panel>
              </Pop>
            )}
            {frame >= t5Or && (
              <Pop at={t5Or}>
                <Panel style={{ padding: "14px 22px", display: "flex", alignItems: "center", gap: 16, borderColor: C.negative }}>
                  <GoldBarIcon size={56} color={C.negative} />
                  <Label size={24} color={C.textPrimary}>sur 5 séances : dollar plus fort → pèse davantage</Label>
                </Panel>
              </Pop>
            )}
            {frame >= tDiv && <Stamp at={tDiv} text="DIVERGENT" color={C.accentBright} size={44} />}
          </div>
          {frame >= tRegle && (
            <div style={{ position: "absolute", left: 0, right: 0, top: 560, display: "flex", justifyContent: "center" }}>
              <Pop at={tRegle}>
                <Pill text="même horizon pour le dollar et pour l'or" size={30} filled />
              </Pop>
            </div>
          )}
        </div>
      </Beat>
    </SceneShell>
  );
};
