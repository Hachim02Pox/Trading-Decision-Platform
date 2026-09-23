import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "../theme";
import { Sfx, makeCue, Panel, AnimatedNumber } from "./shared";
import type { SceneProps } from "./shared";
import { Beat, Pop, Person, Bubble, DocIcon, clamp } from "./characters";
import { SceneShell, Center, Big, Label, STAGE_W } from "./stage";
import { Briefcase, Tractor, Stamp, Office, Magnifier, Pill, CalendarPage } from "./props5";

const C = theme.colors;
const K = 380 / 220; // px per thousand jobs in the example chart

/** Example chart bar: height animates between values (in thousands). */
const JobBar: React.FC<{ x: number; value: number; label: string; color: string; lost?: number; lostAt?: number }> = ({ x, value, label, color, lost = 0, lostAt = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const shrink = lost ? spring({ frame: frame - lostAt, fps, config: theme.spring.smooth }) : 0;
  const v = value - lost * shrink;
  const fall = interpolate(frame, [lostAt, lostAt + 40], [0, 260], { ...clamp, easing: theme.ease.in });
  const fallO = interpolate(frame, [lostAt + 20, lostAt + 40], [1, 0], clamp);
  return (
    <div style={{ position: "absolute", left: x, bottom: 60, width: 150, display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div style={{ color: C.textPrimary, fontFamily: theme.mono, fontWeight: 900, fontSize: 30, marginBottom: 8 }}>+{Math.round(v)} 000</div>
      <div style={{ position: "relative", width: 130, height: v * K, borderRadius: "12px 12px 4px 4px", background: `linear-gradient(180deg, ${color}, ${color}66)` }}>
        {lost > 0 && frame >= lostAt && (
          <div style={{ position: "absolute", left: 0, top: -lost * K, width: 130, height: lost * K, borderRadius: 12, background: C.negative, opacity: fallO, transform: `translateY(${fall}px) rotate(${fall / 12}deg)`, display: "flex", alignItems: "center", justifyContent: "center", color: C.textPrimary, fontFamily: theme.mono, fontWeight: 900, fontSize: 24 }}>
            −{lost} 000
          </div>
        )}
      </div>
      <div style={{ position: "absolute", bottom: -44, color: C.textSecondary, fontSize: 21, whiteSpace: "nowrap" }}>{label}</div>
    </div>
  );
};

const NOISY = [150, 205, 95, 185, 140, 225, 150, 195, 170, 70, 30, 10];
const avg3 = NOISY.map((_, i) => (i < 2 ? null : (NOISY[i] + NOISY[i - 1] + NOISY[i - 2]) / 3));

export const Payrolls: React.FC<SceneProps> = ({ words, durationInFrames }) => {
  const frame = useCurrentFrame();
  const cue = makeCue(words);
  const tTitle = cue("les creations d emplois salaries");
  const tAtt = cue("on compte des emplois");
  const tPers = cue("pas des personnes");
  const tTwo = cue("deux emplois peut");
  const tTwice = cue("compte deux fois");
  const tAgri = cue("les travailleurs agricoles");
  const tExcl = cue("sont exclus");
  const tEst = cue("et ce chiffre est une estimation");
  const tSample = cue("echantillon d employeurs");
  const tRecal = cue("il est recale");
  const tDef = cue("jamais definitif");
  const tRev = cue("les deux mois precedents");
  const tLate = cue("arrivees en retard");
  const tSeas = cue("corrections saisonnieres");
  const tEx = cue("exemple", tSeas);
  const t190 = cue("cent quatre vingt dix");
  const tCons = cue("le consensus attendait");
  const tHachim = cue("hachim voit");
  const tDit = cue("c est plus fort");
  const tSurp = cue("la surprise");
  const tLook = cue("mais regarde");
  const tM1 = cue("le mois d avant");
  const tM2 = cue("celui d avant encore");
  const tNet = cue("revision nette");
  const tNot = cue("le rapport n est donc pas");
  const tMix = cue("il est contraste");
  const t3m = cue("c est aussi pour ca");
  const tLisse = cue("elle lisse");
  const tSlow = cue("se retourne plus lentement");

  const chartDraw = interpolate(frame, [t3m + 10, tLisse + 20], [0, 1], { ...clamp, easing: theme.ease.inOut });
  const pts = avg3.map((v, i) => (v == null ? null : [60 + i * 125 + 40, 420 - v * 1.6])).filter(Boolean) as number[][];

  return (
    <SceneShell eyebrow="F5 · Créations d'emplois" title="Le chiffre qui fait bouger les marchés" durationInFrames={durationInFrames}>
      <Sfx file="whoosh.wav" at={tTitle} volume={0.4} />
      <Sfx file="pop.wav" at={tTwo} volume={0.4} />
      <Sfx file="pop.wav" at={tTwice} volume={0.4} />
      <Sfx file="bass.wav" at={tExcl} volume={0.45} />
      <Sfx file="whoosh.wav" at={tEst} volume={0.35} />
      <Sfx file="tick.wav" at={tSample} volume={0.35} />
      <Sfx file="bass.wav" at={tDef + 6} volume={0.5} />
      <Sfx file="whoosh.wav" at={tEx} volume={0.4} />
      <Sfx file="pop.wav" at={t190} volume={0.45} />
      <Sfx file="tick.wav" at={tCons} volume={0.4} />
      <Sfx file="chime.wav" at={tDit} volume={0.45} />
      <Sfx file="bass.wav" at={tM1} volume={0.45} />
      <Sfx file="bass.wav" at={tM2} volume={0.45} />
      <Sfx file="tick.wav" at={tNet} volume={0.45} />
      <Sfx file="bass.wav" at={tMix} volume={0.55} />
      <Sfx file="whoosh.wav" at={t3m} volume={0.4} />

      {/* A: jobs, not people; farms excluded */}
      <Beat from={0} to={tEst} style={{ left: 0, top: 0 }}>
        <div style={{ width: STAGE_W, height: 650, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 36 }}>
          <Pop at={tTitle}>
            <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
              {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                <Pop key={i} at={tTitle + i * 3}>
                  <Briefcase size={54} color={i % 2 ? C.positive : C.accent} />
                </Pop>
              ))}
            </div>
          </Pop>
          <Pop at={tTitle + 6}>
            <Big size={44} color={C.accentBright}>Emplois salariés non agricoles</Big>
          </Pop>
          <div style={{ display: "flex", gap: 60, marginTop: 10 }}>
            <Pop at={tAtt}>
              <Panel glow={frame >= tTwo && frame < tAgri} style={{ width: 760, display: "flex", alignItems: "center", gap: 30, padding: 30 }}>
                <div style={{ position: "relative" }}>
                  <Person size={170} color={C.context} label="1 personne" />
                  {frame >= tTwo && (
                    <>
                      <div style={{ position: "absolute", left: -20, top: -30 }}>
                        <Pop at={tTwo}>
                          <Briefcase size={60} />
                        </Pop>
                      </div>
                      <div style={{ position: "absolute", left: 90, top: -30 }}>
                        <Pop at={tTwo + 8}>
                          <Briefcase size={60} color={C.accent} />
                        </Pop>
                      </div>
                    </>
                  )}
                </div>
                <div>
                  <Big size={34}>On compte des emplois</Big>
                  {frame >= tPers && <Label size={24}>pas des personnes</Label>}
                  {frame >= tTwice && (
                    <Pop at={tTwice}>
                      <div style={{ marginTop: 12 }}>
                        <Pill text="compté 2 fois" color={C.accentBright} size={26} />
                      </div>
                    </Pop>
                  )}
                </div>
              </Panel>
            </Pop>
            <Pop at={tAgri}>
              <Panel style={{ width: 620, display: "flex", flexDirection: "column", alignItems: "center", gap: 10, padding: 30 }}>
                <div style={{ position: "relative" }}>
                  <Tractor size={220} />
                  <div style={{ position: "absolute", left: 20, top: 40 }}>
                    <Stamp at={tExcl} text="EXCLU" />
                  </div>
                </div>
                <Label size={24}>agriculture + quelques autres catégories</Label>
              </Panel>
            </Pop>
          </div>
        </div>
      </Beat>

      {/* B: an estimate, revised */}
      <Beat from={tEst} to={tEx} style={{ left: 0, top: 0 }}>
        <div style={{ position: "relative", width: STAGE_W, height: 690 }}>
          <div style={{ position: "absolute", left: 30, top: 10, display: "grid", gridTemplateColumns: "repeat(6, 110px)", gap: 8 }}>
            {Array.from({ length: 18 }).map((_, i) => {
              const inSample = [1, 4, 8, 9, 13, 16].includes(i);
              const lit = (frame >= tSample && inSample) || frame >= tRecal + 10;
              return (
                <Pop key={i} at={tEst + i * 2}>
                  <div style={{ opacity: lit ? 1 : 0.45 }}>
                    <Office size={100} lit={lit} />
                  </div>
                </Pop>
              );
            })}
          </div>
          {frame >= tSample && (
            <div style={{ position: "absolute", left: 60 + Math.sin(frame / 14) * 240 + 240, top: 60 + Math.cos(frame / 17) * 110 + 110 }}>
              <Magnifier size={110} />
            </div>
          )}
          <div style={{ position: "absolute", left: 30, top: 360, width: 700, display: "flex", gap: 14, flexWrap: "wrap" }}>
            <Pop at={tSample}>
              <Pill text="un échantillon d'employeurs" size={22} />
            </Pop>
            <Pop at={tRecal}>
              <Pill text="recalé plus tard sur des données complètes" color={C.context} size={22} />
            </Pop>
          </div>
          <div style={{ position: "absolute", left: 180, top: 540 }}>
            <Stamp at={tDef} text="PROVISOIRE" size={46} />
          </div>
          {/* revised months */}
          <div style={{ position: "absolute", left: 860, top: 0, width: 860 }}>
            <Pop at={tRev}>
              <Panel style={{ padding: "26px 30px" }}>
                <Label size={22}>à chaque rapport</Label>
                <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "center", gap: 50, height: 300, marginTop: 10 }}>
                  {[0, 1, 2].map((i) => {
                    const wob = i < 2 && frame >= tRev ? Math.sin(frame / (7 + i * 2) + i) * 26 : 0;
                    const h = [170, 190, 210][i] + wob;
                    return (
                      <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                        {i < 2 && frame >= tRev + 10 && <div style={{ color: C.negative, fontFamily: theme.mono, fontSize: 20, fontWeight: 800, marginBottom: 6 }}>révisé</div>}
                        <div style={{ width: 130, height: h, borderRadius: 12, background: i < 2 ? `linear-gradient(180deg, ${C.context}, ${C.context}55)` : `linear-gradient(180deg, ${C.accentBright}, ${C.accent}66)`, border: i < 2 && frame >= tRev ? `2px dashed ${C.negative}` : "none" }} />
                        <div style={{ color: C.textSecondary, fontSize: 21, marginTop: 8 }}>{["mois −2", "mois −1", "nouveau"][i]}</div>
                      </div>
                    );
                  })}
                </div>
              </Panel>
            </Pop>
            <div style={{ display: "flex", gap: 30, marginTop: 24, justifyContent: "center", alignItems: "center" }}>
              <Pop at={tLate}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  {[0, 1, 2].map((i) => (
                    <div key={i} style={{ transform: `translateY(${Math.sin(frame / 6 + i) * 6}px)` }}>
                      <DocIcon size={56} color={C.textSecondary} />
                    </div>
                  ))}
                  <Label size={22}>réponses en retard</Label>
                </div>
              </Pop>
              <Pop at={tSeas}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ transform: "scale(0.45)", width: 100, height: 110, transformOrigin: "top left" }}>
                    <CalendarPage top="SAISONS" big="±" size={220} />
                  </div>
                  <Label size={22}>corrections saisonnières</Label>
                </div>
              </Pop>
            </div>
          </div>
        </div>
      </Beat>

      {/* C + D: the headline beat, then the revisions */}
      <Beat from={tEx} to={t3m} style={{ left: 0, top: 0 }}>
        <div style={{ position: "relative", width: STAGE_W, height: 690 }}>
          <div style={{ position: "absolute", left: 40, top: 40 }}>
            <Pop at={tHachim}>
              <div style={{ position: "relative" }}>
                <Person size={220} color={C.accent} label="Hachim" cheer={frame >= tDit && frame < tLook} />
                <div style={{ position: "absolute", left: 120, top: -40 }}>
                  {frame >= tDit && frame < tLook && (
                    <Pop at={tDit}>
                      <Bubble text="Plus fort que prévu !" tone={C.positive} width={300} tail="bottom" />
                    </Pop>
                  )}
                  {frame >= tMix && (
                    <Pop at={tMix}>
                      <Bubble text="Hmm… contrasté." tone={C.accentBright} width={260} tail="bottom" />
                    </Pop>
                  )}
                </div>
              </div>
            </Pop>
          </div>
          <div style={{ position: "absolute", left: 520, top: 0, width: 1200, height: 560 }}>
            <Pop at={tLook} style={{ position: "absolute", left: 0, top: 0, width: 1200, height: 560 }}>
              <div>
                <JobBar x={60} value={150} label="mois −2" color={C.context} lost={25} lostAt={tM2} />
                <JobBar x={300} value={160} label="mois −1" color={C.context} lost={35} lostAt={tM1} />
              </div>
            </Pop>
            {frame >= t190 && <JobBar x={560} value={190} label="ce mois-ci" color={C.positive} />}
            {frame >= tCons && (
              <div style={{ position: "absolute", left: 520, width: 240, bottom: 60 + 170 * K, borderTop: `4px dashed ${C.accentBright}`, opacity: interpolate(frame, [tCons, tCons + 10], [0, 1], clamp) }}>
                <div style={{ color: C.accentBright, fontFamily: theme.mono, fontSize: 20, marginTop: 4, marginLeft: 250, whiteSpace: "nowrap", position: "absolute" }}>consensus 170 000</div>
              </div>
            )}
            {frame >= tSurp && (
              <div style={{ position: "absolute", left: 880, top: 60 }}>
                <Pop at={tSurp}>
                  <Pill text="surprise +20 000" color={C.positive} size={26} filled />
                </Pop>
              </div>
            )}
            {frame >= tNet && (
              <div style={{ position: "absolute", left: 800, top: 270 }}>
                <Pop at={tNet}>
                  <Panel glow style={{ padding: "18px 26px", borderColor: C.negative }}>
                    <Label size={22}>révision nette sur 2 mois</Label>
                    <Big size={48} color={C.negative}>
                      <AnimatedNumber from={0} to={-60} delay={tNet} durationFrames={24} format={(n) => `${Math.round(n)} 000`} />
                    </Big>
                  </Panel>
                </Pop>
              </div>
            )}
            {frame >= tNot && (
              <div style={{ position: "absolute", left: 800, top: 420 }}>
                <Pop at={tNot}>
                  <Label size={24} color={C.textPrimary}>pas simplement « +20 000 plus fort »</Label>
                </Pop>
              </div>
            )}
            {frame >= tMix && (
              <div style={{ position: "absolute", left: 860, top: 470 }}>
                <Stamp at={tMix} text="CONTRASTÉ" color={C.accentBright} size={46} />
              </div>
            )}
          </div>
          <div style={{ position: "absolute", right: 20, bottom: 0, color: C.textMuted, fontFamily: theme.mono, fontSize: 15 }}>valeurs d&apos;exemple</div>
        </div>
      </Beat>

      {/* E: the three-month average */}
      <Beat from={t3m} style={{ left: 0, top: 0 }}>
        <div style={{ position: "relative", width: STAGE_W, height: 690 }}>
          <svg width={STAGE_W} height={520} style={{ position: "absolute", left: 0, top: 30 }}>
            <line x1="40" y1="420" x2={STAGE_W - 40} y2="420" stroke={C.hairline} strokeWidth="2" />
            {NOISY.map((v, i) => {
              const a = interpolate(frame, [t3m + i * 3, t3m + i * 3 + 14], [0, 1], { ...clamp, easing: theme.ease.out });
              const late = i >= 9 && frame >= tSlow;
              return <rect key={i} x={60 + i * 125 + 10} y={420 - v * 1.6 * a} width={60} height={v * 1.6 * a} rx={8} fill={late ? C.negative : C.context} opacity={0.75} />;
            })}
            <polyline
              points={pts.map((q) => `${q[0]},${q[1]}`).join(" ")}
              fill="none"
              stroke={C.accentBright}
              strokeWidth="7"
              strokeLinejoin="round"
              strokeLinecap="round"
              strokeDasharray="2400"
              strokeDashoffset={2400 * (1 - chartDraw)}
            />
            {frame >= tSlow && (
              <g>
                <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r={16 + Math.sin(frame / 4) * 4} fill={C.accentBright} opacity={0.3} />
                <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r={8} fill={C.accentBright} />
              </g>
            )}
          </svg>
          <div style={{ position: "absolute", left: 60, top: 0, display: "flex", gap: 20 }}>
            <Pill text="chaque mois (bruité)" color={C.context} size={22} />
            {frame >= t3m + 20 && (
              <Pop at={t3m + 20}>
                <Pill text="moyenne sur 3 mois" size={22} filled />
              </Pop>
            )}
          </div>
          <div style={{ position: "absolute", left: 60, top: 570, display: "flex", gap: 40 }}>
            <Pop at={tLisse}>
              <Label size={26} color={C.accentBright}>✓ lisse le bruit d&apos;un seul mois</Label>
            </Pop>
            <Pop at={tSlow}>
              <Label size={26} color={C.negative}>… mais se retourne avec retard</Label>
            </Pop>
          </div>
        </div>
      </Beat>
    </SceneShell>
  );
};
