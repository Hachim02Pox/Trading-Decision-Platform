import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "../theme";
import { Sfx, makeCue, Panel, TerminalGlyph } from "./shared";
import type { SceneProps } from "./shared";
import { Beat, Pop, Cursor } from "./characters";
import { SceneShell, Big, Label, STAGE_W } from "./stage";
import { Pill } from "./props5";

const C = theme.colors;

const Tag: React.FC<{ text: string; color: string; boxed?: boolean }> = ({ text, color, boxed = true }) => (
  <span style={{ color, fontSize: 14, fontFamily: theme.mono, fontWeight: 700, border: boxed ? `1px solid ${color}` : "none", borderRadius: 5, padding: boxed ? "1px 7px" : 0, whiteSpace: "nowrap" }}>{text}</span>
);

/** Face mini-cell, mirroring KpiMiniCell: label + RÉEL tag + "Contextuel", then previous → current value + unit. */
const Cell: React.FC<{ label: string; prev: string; value: string; unit: string; lit: boolean; tilde?: boolean; tildeLit?: boolean; prevLit?: boolean; ctxLit?: boolean }> = ({ label, prev, value, unit, lit, tilde, tildeLit, prevLit, ctxLit }) => (
  <div style={{ padding: "14px 18px", borderRadius: 14, background: lit ? `${C.accent}1f` : C.panel, border: `1px solid ${lit ? C.accent : C.hairline}`, marginBottom: 10 }}>
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <span style={{ color: C.textSecondary, fontSize: 20 }}>{label}</span>
      <Tag text="RÉEL" color={C.positive} />
      <span style={{ marginLeft: "auto", color: ctxLit ? C.context : C.textMuted, fontSize: 15, border: `1px solid ${ctxLit ? C.context : C.hairline}`, borderRadius: 6, padding: "1px 8px", boxShadow: ctxLit ? `0 0 16px ${C.context}` : undefined }}>Contextuel</span>
    </div>
    <div style={{ marginTop: 8, fontFamily: theme.mono, display: "flex", alignItems: "baseline", gap: 8 }}>
      <span style={{ color: prevLit ? C.accentBright : C.textMuted, fontSize: 21, textDecoration: prevLit ? "underline" : "none" }}>{prev}</span>
      <span style={{ color: C.textMuted, fontSize: 21 }}>→</span>
      <span style={{ color: C.textPrimary, fontSize: 34, fontWeight: 800 }}>{value}</span>
      {tilde && (
        <span style={{ color: C.accentBright, fontSize: 30, fontWeight: 900, borderRadius: "50%", padding: "0 6px", border: tildeLit ? `3px solid ${C.accentBright}` : "3px solid transparent", boxShadow: tildeLit ? `0 0 20px ${C.glow}` : undefined }}>~</span>
      )}
      <span style={{ color: C.textSecondary, fontSize: 20 }}>{unit}</span>
    </div>
  </div>
);

type Row = { l: string; v: string; state: "real" | "indisp" | "link"; src: "BLS" | "FRED" | "TE"; key: string };
const ROWS: Row[] = [
  { key: "unemp", l: "Unemployment Rate", v: "4,2 %", state: "real", src: "BLS" },
  { key: "pay", l: "Payrolls (Latest)", v: "165 k", state: "real", src: "BLS" },
  { key: "pay3", l: "Payrolls (3M Avg)", v: "128 k", state: "real", src: "BLS" },
  { key: "c4w", l: "Claims (4W Avg)", v: "224 k", state: "real", src: "FRED" },
  { key: "cini", l: "Initial Jobless Claims", v: "220 k", state: "real", src: "FRED" },
  { key: "ccont", l: "Continuing Claims", v: "1900 k", state: "real", src: "FRED" },
  { key: "ahe", l: "Average Hourly Earnings (MoM)", v: "0,3 %", state: "real", src: "BLS" },
  { key: "rev", l: "2M Net Revision", v: "—", state: "indisp", src: "BLS" },
  { key: "isms", l: "ISM Services", v: "—", state: "link", src: "TE" },
  { key: "ismm", l: "ISM Manufacturing", v: "—", state: "link", src: "TE" },
  { key: "gdp", l: "GDPNow", v: "2,5 %", state: "real", src: "FRED" },
];
const ROW_H = 44;
const ROWS_TOP = 186; // stage y of the first drawer row (checked on still frames)

export const TerminalUsage: React.FC<SceneProps> = ({ words, durationInFrames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const cue = makeCue(words);
  const tFace = cue("la facade de f5");
  const tEmpSec = cue("dans la partie emploi");
  const tUnemp = cue("le taux de chomage");
  const tPay = cue("les dernieres creations");
  const tGroSec = cue("dans la partie croissance");
  const tGdp = cue("l estimation de la fed");
  const tTilde = cue("un petit tilde");
  const tPrev = cue("chaque chiffre montre");
  const tNew = cue("puis la nouvelle");
  const tCtx = cue("etiquete contextuel");
  const tOpen = cue("en ouvrant le detail");
  const t3m = cue("la moyenne des creations");
  const tCalc = cue("calculee par le terminal");
  const tClaims = cue("les inscriptions au chomage");
  const t4w = cue("la moyenne sur quatre");
  const tIni = cue("les initiales");
  const tAhe = cue("le gain horaire moyen");
  const tRev = cue("et la revision nette");
  const tIndisp = cue("celle ci peut afficher");
  const tVu = cue("le terminal doit avoir vu");
  const tInvent = cue("il n invente rien");
  const tIsm = cue("pareil pour l ism");
  const tClick = cue("un clic ouvre");
  const tBls = cue("les chiffres d emploi viennent");
  const tFred = cue("les inscriptions et l estimation");
  const tCons = cue("le consensus n est pas");
  const tRef = cue("ensuite le reflexe");
  const tSurp = cue("compare la surprise");
  const tTrans = cue("verifie la transmission");
  const tF7 = cue("regarde f7");
  const tF13 = cue("et f13");

  const drawerP = spring({ frame: frame - tOpen, fps, config: theme.spring.smooth });
  const rowLit: Record<string, [number, number]> = {
    pay3: [t3m, tClaims],
    c4w: [t4w, tAhe],
    cini: [tIni, tAhe],
    ccont: [tIni + 12, tAhe],
    ahe: [tAhe, tRev],
    rev: [tRev, tIsm],
    isms: [tIsm, tBls],
    ismm: [tIsm + 6, tBls],
  };
  const lit = (a: number, b: number) => frame >= a && frame < b;
  const rowY = (key: string) => ROWS_TOP + ROWS.findIndex((r) => r.key === key) * ROW_H + ROW_H / 2;

  return (
    <SceneShell eyebrow="F5 · Dans le terminal" title="La façade, puis le détail" durationInFrames={durationInFrames}>
      <Sfx file="pop.wav" at={tFace} volume={0.4} />
      <Sfx file="tick.wav" at={tUnemp} volume={0.35} />
      <Sfx file="tick.wav" at={tPay} volume={0.35} />
      <Sfx file="tick.wav" at={tGdp} volume={0.35} />
      <Sfx file="pop.wav" at={tTilde} volume={0.4} />
      <Sfx file="chime.wav" at={tCtx} volume={0.4} />
      <Sfx file="click.wav" at={tOpen} volume={0.55} />
      <Sfx file="whoosh.wav" at={tOpen} volume={0.4} />
      <Sfx file="bass.wav" at={tIndisp} volume={0.4} />
      <Sfx file="click.wav" at={tClick} volume={0.55} />
      <Sfx file="tick.wav" at={tBls} volume={0.35} />
      <Sfx file="tick.wav" at={tFred} volume={0.35} />
      <Sfx file="bass.wav" at={tCons} volume={0.4} />
      <Sfx file="whoosh.wav" at={tRef} volume={0.45} />

      <Beat from={tFace - 6} to={tRef} style={{ left: 0, top: 0 }}>
        <div style={{ position: "relative", width: STAGE_W, height: 690 }}>
          {/* FACE */}
          <div style={{ position: "absolute", left: 10, top: 0 }}>
            <Panel style={{ width: 760, padding: 22 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                <TerminalGlyph size={30} />
                <span style={{ color: C.textPrimary, fontSize: 22, fontWeight: 700 }}>Emploi / Croissance</span>
                <span style={{ marginLeft: "auto", width: 12, height: 12, borderRadius: "50%", background: C.positive }} />
              </div>
              <div style={{ color: lit(tEmpSec, tGroSec) ? C.accentBright : C.textMuted, fontFamily: theme.mono, fontSize: 16, letterSpacing: 2, margin: "4px 0 8px" }}>EMPLOI</div>
              <Cell label="Unemployment Rate" prev="4,1" value="4,2" unit="%" lit={lit(tUnemp, tPay)} prevLit={lit(tPrev, tNew)} ctxLit={lit(tCtx, tOpen)} />
              <Cell label="Payrolls (Latest)" prev="142" value="165" unit="k" lit={lit(tPay, tGroSec)} ctxLit={lit(tCtx, tOpen)} />
              <div style={{ color: lit(tGroSec, tPrev) ? C.accentBright : C.textMuted, fontFamily: theme.mono, fontSize: 16, letterSpacing: 2, margin: "10px 0 8px" }}>CROISSANCE</div>
              <Cell label="GDPNow" prev="2,1" value="2,5" unit="%" tilde tildeLit={lit(tTilde, tPrev)} lit={lit(tGdp, tPrev)} ctxLit={lit(tCtx, tOpen)} />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
                <span style={{ color: C.textMuted, fontFamily: theme.mono, fontSize: 13 }}>valeurs d&apos;exemple</span>
                <span style={{ color: C.context, fontSize: 15, border: `1px solid ${C.context}`, borderRadius: 999, padding: "2px 12px" }}>Contextuel</span>
              </div>
            </Panel>
          </div>
          {/* notes under the face */}
          <div style={{ position: "absolute", left: 10, top: 555, width: 780, display: "flex", flexDirection: "column", gap: 8 }}>
            {frame >= tTilde && frame < tPrev && (
              <Pop at={tTilde}>
                <Label size={23} color={C.accentBright}>~ = valeur de modèle (estimée)</Label>
              </Pop>
            )}
            {frame >= tPrev && frame < tCtx && (
              <Pop at={tPrev}>
                <Label size={23} color={C.accentBright}>à gauche l&apos;ancienne valeur → à droite la nouvelle</Label>
              </Pop>
            )}
            {frame >= tCtx && frame < tCons && (
              <Pop at={tCtx}>
                <Label size={23} color={C.context}>tout est « Contextuel » : une carte de départ, pas un verdict</Label>
              </Pop>
            )}
            {frame >= tCons && (
              <Pop at={tCons}>
                <Panel style={{ padding: "10px 18px", borderColor: C.negative }}>
                  <Label size={22} color={C.textPrimary}>Consensus non affiché → compare toi-même à ce qui était attendu</Label>
                </Panel>
              </Pop>
            )}
          </div>

          {/* DRAWER */}
          {frame >= tOpen && (
            <div style={{ position: "absolute", left: 820, top: 0, width: 900, opacity: drawerP, transform: `translateX(${interpolate(drawerP, [0, 1], [260, 0])}px)` }}>
              <Panel glow style={{ padding: "18px 22px" }}>
                <div style={{ color: C.textMuted, fontFamily: theme.mono, fontSize: 14, letterSpacing: 1.5 }}>CE QUE CETTE FAMILLE DIT ACTUELLEMENT POUR L&apos;OR</div>
                <div style={{ display: "flex", alignItems: "center", gap: 14, margin: "8px 0 4px" }}>
                  <span style={{ color: C.textSecondary, fontSize: 18 }}>Impact sur l&apos;or</span>
                  <strong style={{ color: C.context, fontSize: 20 }}>Contextuel</strong>
                </div>
                <div style={{ color: C.textMuted, fontSize: 14, marginBottom: 10 }}>Aucun contributeur mécanique directionnel n&apos;est actuellement disponible pour cette famille.</div>
                <div style={{ color: C.textMuted, fontFamily: theme.mono, fontSize: 14, letterSpacing: 1.5, marginBottom: 4 }}>DONNÉE</div>
                {ROWS.map((r) => {
                  const w = rowLit[r.key];
                  const on = w ? lit(w[0], w[1]) : false;
                  const srcShown = (r.src === "BLS" && frame >= tBls) || (r.src === "FRED" && frame >= tFred) || (r.src === "TE" && frame >= tIsm);
                  const srcColor = r.src === "BLS" ? C.accentBright : r.src === "FRED" ? C.context : C.textSecondary;
                  const pulse = r.key === "rev" && lit(tIndisp, tIsm) ? 1 + Math.sin(frame / 4) * 0.08 : 1;
                  return (
                    <div key={r.key} style={{ height: ROW_H, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 14px", borderRadius: 9, background: on ? `${C.accent}1a` : "transparent", border: `1px solid ${on ? C.accent : "transparent"}` }}>
                      <span style={{ color: C.textSecondary, fontSize: 19 }}>{r.l}</span>
                      <span style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        {srcShown && <span style={{ color: srcColor, fontFamily: theme.mono, fontSize: 13 }}>{r.src === "TE" ? "↗ tradingeconomics.com" : r.src}</span>}
                        {r.key === "pay3" && frame >= tCalc && <span style={{ color: C.accentBright, fontFamily: theme.mono, fontSize: 13 }}>calcul</span>}
                        <span style={{ color: C.textPrimary, fontFamily: theme.mono, fontSize: 20, fontWeight: 800 }}>{r.v}</span>
                        {r.state === "real" && <Tag text="RÉEL" color={C.positive} />}
                        {r.state === "indisp" && (
                          <span style={{ transform: `scale(${pulse})`, display: "inline-block" }}>
                            <Tag text="INDISP." color={C.negative} />
                          </span>
                        )}
                        {r.state === "link" && <Tag text="Cliquer pour voir" color={C.accentBright} boxed={false} />}
                      </span>
                    </div>
                  );
                })}
                <div style={{ color: C.accent, fontSize: 15, fontWeight: 700, marginTop: 6 }}>COMPRENDRE CE SUJET →</div>
              </Panel>
            </div>
          )}
          {/* explanation bubbles on the drawer */}
          {frame >= tVu && frame < tIsm && (
            <div style={{ position: "absolute", left: 830, top: rowY("rev") - 150 }}>
              <Pop at={tVu}>
                <Panel style={{ padding: "12px 18px", borderColor: C.accentBright }}>
                  <Label size={21} color={C.textPrimary}>le même mois publié au moins 2 fois → vraie révision</Label>
                  {frame >= tInvent && <Label size={21} color={C.accentBright}>sinon : indisponible. Il n&apos;invente rien.</Label>}
                </Panel>
              </Pop>
            </div>
          )}
          {frame >= tClick && frame < tBls && (
            <div style={{ position: "absolute", left: 1060, top: rowY("isms") - 190 }}>
              <Pop at={tClick + 6}>
                <Panel glow style={{ padding: "14px 20px" }}>
                  <Label size={20}>ISM Services · source externe</Label>
                  <Big size={24} color={C.accentBright}>↗ tradingeconomics.com</Big>
                  <Label size={17}>aucune source gratuite branchée pour l&apos;instant</Label>
                </Panel>
              </Pop>
            </div>
          )}
          <Cursor
            path={[
              { at: tUnemp - 16, x: 700, y: 640 },
              { at: tUnemp, x: 520, y: 150 },
              { at: tPay, x: 520, y: 262 },
              { at: tGdp, x: 520, y: 412 },
              { at: tTilde, x: 330, y: 440 },
              { at: tOpen, x: 380, y: 40, click: true },
              { at: t3m, x: 1500, y: rowY("pay3") },
              { at: tAhe, x: 1500, y: rowY("ahe") },
              { at: tRev, x: 1500, y: rowY("rev") },
              { at: tClick, x: 1400, y: rowY("isms"), click: true },
              { at: tBls, x: 1640, y: 660 },
            ]}
          />
        </div>
      </Beat>

      <Beat from={tRef} style={{ left: 0, top: 0 }}>
        <div style={{ width: STAGE_W, height: 640, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 40 }}>
          <Big size={48}>Le réflexe</Big>
          <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
            {[
              { t: "Surprise vs révisions et composition", at: tSurp },
              { t: "F3 → F2 → F6 : la transmission", at: tTrans },
              { t: "F7 : le stress de marché", at: tF7 },
              { t: "F13 : la prochaine publication", at: tF13 },
            ].map((s, i) => (
              <React.Fragment key={s.t}>
                {i > 0 && (
                  <Pop at={s.at - 4}>
                    <div style={{ color: C.accent, fontSize: 40 }}>→</div>
                  </Pop>
                )}
                <Pop at={s.at}>
                  <Panel style={{ width: 340, textAlign: "center", padding: 26, minHeight: 190 }} glow={frame >= s.at}>
                    <div style={{ color: C.accent, fontFamily: theme.mono, fontSize: 22 }}>{i + 1}</div>
                    <Big size={30}>{s.t}</Big>
                  </Panel>
                </Pop>
              </React.Fragment>
            ))}
          </div>
          {frame >= tF13 + 40 && (
            <Pop at={tF13 + 40}>
              <Pill text="la façade = une carte de départ, pas un verdict" size={26} />
            </Pop>
          )}
        </div>
      </Beat>
    </SceneShell>
  );
};
