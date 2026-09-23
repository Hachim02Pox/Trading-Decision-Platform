import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { theme } from "../theme";
import { Sfx, makeCue, Panel, useBreathe } from "./shared";
import type { SceneProps } from "./shared";
import { Beat, Pop, Person, clamp } from "./characters";
import { SceneShell, Big, Label, STAGE_W } from "./stage";
import { CheckDraw, StormCloud, HolidayGlyph, StrikeSign, ShieldGlyph, RulebookGlyph, Pill, Clipboard } from "./props5";

const C = theme.colors;

// 30 weekly readings (thousands): noise, one isolated spike (week 9), then a persistent rise from week 21
const WEEKS = [218, 224, 215, 221, 226, 219, 223, 217, 222, 292, 225, 218, 221, 227, 220, 224, 219, 226, 222, 228, 225, 236, 244, 251, 258, 266, 271, 279, 284, 290];
const MA4 = WEEKS.map((_, i) => (i < 3 ? null : (WEEKS[i] + WEEKS[i - 1] + WEEKS[i - 2] + WEEKS[i - 3]) / 4));
// weeks disturbed in beat B, with their cause
const SHOCKS = [
  { w: 3, kind: "rules" },
  { w: 9, kind: "holiday" },
  { w: 14, kind: "storm" },
  { w: 19, kind: "strike" },
  { w: 24, kind: "fraud" },
] as const;
const SHOCK_H = [262, 292, 280, 270, 275];

const y = (v: number) => 400 - (v - 180) * 3;
const xw = (i: number) => 70 + i * 54;

const ShockIcon: React.FC<{ kind: (typeof SHOCKS)[number]["kind"] }> = ({ kind }) =>
  kind === "rules" ? <RulebookGlyph size={90} /> : kind === "holiday" ? <HolidayGlyph size={90} /> : kind === "storm" ? <StormCloud size={96} /> : kind === "strike" ? <StrikeSign size={90} /> : <ShieldGlyph size={90} />;

const SHOCK_LABEL = { rules: "règles de l'État", holiday: "jour férié", storm: "tempête", strike: "grève", fraud: "anti-fraude" } as const;

export const Claims: React.FC<SceneProps> = ({ words, durationInFrames }) => {
  const frame = useCurrentFrame();
  const cue = makeCue(words);
  const tIns = cue("il y a les inscriptions");
  const tWeek = cue("chaque semaine");
  const tInit = cue("inscriptions initiales");
  const tCont = cue("inscriptions continues");
  const tAlloc = cue("touchent encore");
  const tAtt = cue("attention");
  const tIso = cue("une semaine isolee");
  const tRules = cue("les regles propres");
  const tHol = cue("un jour ferie");
  const tStorm = cue("une tempete");
  const tStrike = cue("une greve");
  const tFraud = cue("contre la fraude");
  const tTerm = cue("c est pour ca");
  const tMa = cue("moyenne sur quatre");
  const tPic = cue("un pic isole");
  const tDure = cue("une hausse qui dure");
  const tConf = cue("confirmee par");
  const tBreadth = cue("et par l etendue");
  const tSignal = cue("vrai signal");
  const shockAt = [tRules, tHol, tStorm, tStrike, tFraud];
  const breathe = useBreathe(0.6);

  const weekIdx = frame < tWeek ? -1 : Math.floor((frame - tWeek) / 9) % 8;
  const lineP = interpolate(frame, [tMa, tPic + 10], [0, 1], { ...clamp, easing: theme.ease.inOut });
  const maPts = MA4.map((v, i) => (v == null ? null : `${xw(i) + 16},${y(v)}`)).filter(Boolean).join(" ");
  const riseLit = frame >= tDure;

  return (
    <SceneShell eyebrow="F5 · Inscriptions au chômage" title="Le signal de chaque semaine" durationInFrames={durationInFrames}>
      <Sfx file="pop.wav" at={tIns} volume={0.4} />
      <Sfx file="tick.wav" at={tWeek} volume={0.4} />
      <Sfx file="tick.wav" at={tWeek + 9} volume={0.3} />
      <Sfx file="tick.wav" at={tWeek + 18} volume={0.3} />
      <Sfx file="pop.wav" at={tInit} volume={0.4} />
      <Sfx file="pop.wav" at={tCont} volume={0.4} />
      <Sfx file="bass.wav" at={tAtt} volume={0.4} />
      {shockAt.map((t) => (
        <Sfx key={t} file="pop.wav" at={t} volume={0.45} />
      ))}
      <Sfx file="whoosh.wav" at={tTerm} volume={0.4} />
      <Sfx file="chime.wav" at={tSignal} volume={0.55} />

      {/* opening: what claims are, before the two panels */}
      <Beat from={0} to={tInit - 4} style={{ left: 0, top: 0 }}>
        <div style={{ width: STAGE_W, height: 690, display: "flex", alignItems: "center", justifyContent: "center", gap: 70, paddingTop: 60 }}>
          <Pop at={6}>
            <div style={{ transform: `rotate(${Math.sin(frame / 12) * 4}deg)` }}>
              <Clipboard size={230} />
            </div>
          </Pop>
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <Pop at={tIns}>
              <Big size={60} color={C.accentBright}>Inscriptions au chômage</Big>
            </Pop>
            <Pop at={tWeek}>
              <div style={{ display: "flex", gap: 14, justifyContent: "center" }}>
                <Pill text="un signal plus rapide" color={C.context} size={26} />
                <Pill text="chaque semaine" size={26} filled />
              </div>
            </Pop>
          </div>
        </div>
      </Beat>

      {/* A: weekly, initial vs continuing */}
      <Beat from={0} to={tAtt} style={{ left: 0, top: 0 }}>
        <div style={{ position: "relative", width: STAGE_W, height: 690 }}>
          <div style={{ position: "absolute", left: 0, right: 0, top: 0, display: "flex", justifyContent: "center", gap: 12 }}>
            {Array.from({ length: 8 }).map((_, i) => (
              <Pop key={i} at={4 + i * 3}>
                <div style={{ width: 150, padding: "14px 0", borderRadius: 14, textAlign: "center", border: `2px solid ${i === weekIdx ? C.accent : C.hairline}`, background: i === weekIdx ? `${C.accent}22` : C.panel, color: i === weekIdx ? C.accentBright : C.textMuted, fontFamily: theme.mono, fontSize: 20, fontWeight: 800 }}>
                  sem. {i + 1}
                </div>
              </Pop>
            ))}
          </div>
          <div style={{ position: "absolute", left: 40, top: 130, width: 800 }}>
            <Pop at={tInit + 2}>
              <Panel glow={frame >= tInit && frame < tCont} style={{ padding: 28, height: 440 }}>
                <Big size={32} color={C.accentBright}>Inscriptions initiales</Big>
                <Label size={22}>nouvelles demandes d&apos;assurance chômage</Label>
                <div style={{ position: "relative", height: 280, marginTop: 10 }}>
                  {/* door */}
                  <div style={{ position: "absolute", left: 520, top: 30, width: 150, height: 230, borderRadius: "14px 14px 0 0", border: `4px solid ${C.accent}`, background: `${C.accent}14` }}>
                    <div style={{ position: "absolute", left: 0, right: 0, top: -40, textAlign: "center", color: C.accent, fontFamily: theme.mono, fontSize: 18 }}>ASSURANCE</div>
                  </div>
                  {[0, 1, 2, 3].map((i) => {
                    const start = tInit + 10 + i * 18;
                    const x = interpolate(frame, [start, start + 40], [20, 540], { ...clamp, easing: theme.ease.inOut });
                    const o = interpolate(frame, [start + 32, start + 42], [1, 0], clamp);
                    return frame >= start ? (
                      <div key={i} style={{ position: "absolute", left: x, top: 90, opacity: o }}>
                        <Person size={120} phase={i} color={C.context} run />
                      </div>
                    ) : null;
                  })}
                </div>
              </Panel>
            </Pop>
          </div>
          <div style={{ position: "absolute", left: 880, top: 130, width: 820 }}>
            <Pop at={tCont}>
              <Panel glow={frame >= tCont} style={{ padding: 28, height: 440 }}>
                <Big size={32} color={C.context}>Inscriptions continues</Big>
                <Label size={22}>ceux qui touchent encore une allocation</Label>
                <div style={{ display: "flex", gap: 8, marginTop: 40, justifyContent: "center" }}>
                  {[0, 1, 2, 3, 4].map((i) => (
                    <div key={i} style={{ position: "relative" }}>
                      <Pop at={tCont + 8 + i * 4}>
                        <Person size={120} phase={i + 1} color={C.context} />
                      </Pop>
                      {frame >= tAlloc + i * 4 && (
                        <div style={{ position: "absolute", left: 40, top: -44 }}>
                          <Pop at={tAlloc + i * 4}>
                            <div style={{ width: 54, height: 34, borderRadius: 6, background: C.positive, display: "flex", alignItems: "center", justifyContent: "center", color: C.bg, fontWeight: 900, fontFamily: theme.mono, fontSize: 20 }}>$</div>
                          </Pop>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </Panel>
            </Pop>
          </div>
        </div>
      </Beat>

      {/* B1: not all the unemployed */}
      <Beat from={tAtt} to={tIso} style={{ left: 0, top: 0 }}>
        <div style={{ width: STAGE_W, display: "flex", flexDirection: "column", alignItems: "center", gap: 30, paddingTop: 30 }}>
          <div style={{ position: "relative", display: "flex", gap: 10 }}>
            {Array.from({ length: 11 }).map((_, i) => (
              <Pop key={i} at={tAtt + i * 2}>
                <Person size={110} phase={i} color={i < 5 ? C.context : C.textMuted} />
              </Pop>
            ))}
            <div style={{ position: "absolute", left: -20, top: -30, width: 5 * 98 + 30, height: 190, borderRadius: 30, border: `4px solid ${C.positive}`, opacity: interpolate(frame, [tAtt + 20, tAtt + 32], [0, 1], clamp) }}>
              <div style={{ position: "absolute", top: -40, left: 0, right: 0, textAlign: "center", color: C.positive, fontFamily: theme.mono, fontSize: 20, fontWeight: 800 }}>INSCRITS</div>
            </div>
          </div>
          <Pop at={tAtt + 26}>
            <Big size={40} color={C.accentBright}>≠ le nombre total de chômeurs</Big>
          </Pop>
        </div>
      </Beat>

      {/* B2 + C: weekly chart, shocks, then the 4-week average */}
      <Beat from={tIso} style={{ left: 0, top: 0 }}>
        <div style={{ position: "relative", width: STAGE_W, height: 690 }}>
          <svg width={STAGE_W} height={470} style={{ position: "absolute", left: 0, top: 180 }}>
            <line x1="50" y1="400" x2={STAGE_W - 40} y2="400" stroke={C.hairline} strokeWidth="2" />
            {WEEKS.map((v0, i) => {
              const si = SHOCKS.findIndex((s) => s.w === i);
              const inShockPhase = frame < tTerm;
              const shocked = si >= 0 && frame >= shockAt[si] && inShockPhase;
              const v = shocked ? SHOCK_H[si] : si >= 0 && inShockPhase ? 222 : v0;
              const a = interpolate(frame, [tIso + i * 1.5, tIso + i * 1.5 + 12], [0, 1], { ...clamp, easing: theme.ease.out });
              const h = (400 - y(v)) * a;
              const late = i >= 21 && riseLit;
              const isolated = i === 9 && !inShockPhase && frame >= tPic;
              const fill = shocked || isolated ? C.negative : late ? C.accentBright : C.context;
              return <rect key={i} x={xw(i)} y={400 - h} width={34} height={h} rx={6} fill={fill} opacity={frame >= tMa && !late && !isolated ? 0.45 : 0.85} />;
            })}
            {frame >= tMa && (
              <polyline points={maPts} fill="none" stroke={C.accentBright} strokeWidth="6" strokeLinejoin="round" strokeLinecap="round" strokeDasharray="2200" strokeDashoffset={2200 * (1 - lineP)} />
            )}
          </svg>
          {/* shock icons above their bars */}
          {frame < tTerm &&
            SHOCKS.map((s, i) =>
              frame >= shockAt[i] ? (
                <div key={s.kind} style={{ position: "absolute", left: xw(s.w) - 40, top: 180 + y(SHOCK_H[i]) - 150, width: 120, display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <Pop at={shockAt[i]}>
                    <ShockIcon kind={s.kind} />
                  </Pop>
                  <div style={{ color: C.textSecondary, fontSize: 17, whiteSpace: "nowrap" }}>{SHOCK_LABEL[s.kind]}</div>
                </div>
              ) : null,
            )}
          <div style={{ position: "absolute", left: 50, top: 0, display: "flex", gap: 16, alignItems: "center" }}>
            <Pill text="inscriptions · chaque semaine" color={C.context} size={22} />
            {frame >= tMa && (
              <Pop at={tMa}>
                <Pill text="moyenne sur 4 semaines" size={22} filled />
              </Pop>
            )}
          </div>
          {frame >= tPic && (
            <div style={{ position: "absolute", left: xw(9) - 60, top: 70 }}>
              <Pop at={tPic}>
                <Label size={24} color={C.negative}>pic isolé = peu d&apos;information</Label>
              </Pop>
            </div>
          )}
          {frame >= tDure && (
            <div style={{ position: "absolute", left: 1020, top: 0, width: 700, display: "flex", flexDirection: "column", gap: 10 }}>
              <Pop at={tDure}>
                <Label size={24} color={C.accentBright}>une hausse qui dure…</Label>
              </Pop>
              {frame >= tConf && (
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <CheckDraw at={tConf} size={36} />
                  <Label size={22}>confirmée par les inscriptions continues</Label>
                </div>
              )}
              {frame >= tBreadth && (
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <CheckDraw at={tBreadth} size={36} />
                  <Label size={22}>et par l&apos;étendue des créations d&apos;emplois</Label>
                </div>
              )}
            </div>
          )}
          {frame >= tSignal && (
            <div style={{ position: "absolute", left: 0, right: 0, top: 600, display: "flex", justifyContent: "center" }}>
              <Pop at={tSignal}>
                <div style={{ transform: `scale(${breathe.scale})` }}>
                  <Big size={40} color={C.accentBright} glow>
                    = un vrai signal de retournement
                  </Big>
                </div>
              </Pop>
            </div>
          )}
        </div>
      </Beat>
    </SceneShell>
  );
};
