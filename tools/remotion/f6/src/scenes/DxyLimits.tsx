import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { theme } from "../theme";
import { Sfx, makeCue, Panel, TerminalGlyph } from "./shared";
import type { SceneProps } from "./shared";
import { Beat, Pop, clamp } from "./characters";
import { SceneShell, Big, Label, STAGE_W } from "./stage";
import { CrossDraw, CheckDraw, CalendarPage, Pill } from "./props5";
import { Coin, CUR } from "./props6";

const C = theme.colors;

const TwoLines: React.FC<{ from: number }> = ({ from }) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [from, from + 50], [0, 1], { ...clamp, easing: theme.ease.inOut });
  const a = [70, 66, 60, 58, 50, 46, 40, 36];
  const b = [70, 72, 70, 74, 72, 76, 78, 80];
  const pts = (v: number[]) => v.map((y, i) => `${10 + i * 70},${y + 20}`).join(" ");
  return (
    <svg width="520" height="140">
      <polyline points={pts(a)} fill="none" stroke={C.accentBright} strokeWidth="5" strokeDasharray="600" strokeDashoffset={600 * (1 - p)} strokeLinecap="round" />
      <polyline points={pts(b)} fill="none" stroke={C.context} strokeWidth="5" strokeDasharray="600" strokeDashoffset={600 * (1 - p)} strokeLinecap="round" />
      <text x="500" y="52" textAnchor="end" fill={C.accentBright} fontSize="18" fontFamily={theme.mono}>DXY</text>
      <text x="500" y="122" textAnchor="end" fill={C.context} fontSize="18" fontFamily={theme.mono}>indice large</text>
    </svg>
  );
};

export const DxyLimits: React.FC<SceneProps> = ({ words, durationInFrames }) => {
  const frame = useCurrentFrame();
  const cue = makeCue(words);
  const tAngle = cue("angles morts");
  const tYuan = cue("il exclut le yuan");
  const tEm = cue("monnaies emergentes");
  const tPoids = cue("ses poids sont historiques");
  const tLarge = cue("un indice plus large");
  const tAutre = cue("une autre histoire");
  const tRef = cue("le dxy est une reference");
  const tTerm = cue("et dans le terminal");
  const tYahoo = cue("page publique");
  const tLic = cue("ce n est pas le flux officiel");
  const tNonOff = cue("c est une source non officielle");
  const tNiveau = cue("mais c est bien le niveau");
  const tNuance = cue("cette nuance");
  const tSens = cue("pas le sens des variations");

  return (
    <SceneShell eyebrow="F6 · Les limites du DXY" title="Une référence utile… pas une carte complète" durationInFrames={durationInFrames}>
      <Sfx file="bass.wav" at={tAngle} volume={0.4} />
      <Sfx file="pop.wav" at={tYuan} volume={0.4} />
      <Sfx file="pop.wav" at={tEm} volume={0.35} />
      <Sfx file="tick.wav" at={tPoids} volume={0.4} />
      <Sfx file="whoosh.wav" at={tLarge} volume={0.4} />
      <Sfx file="whoosh.wav" at={tTerm} volume={0.45} />
      <Sfx file="bass.wav" at={tLic} volume={0.4} />
      <Sfx file="chime.wav" at={tNiveau} volume={0.45} />

      <Beat from={tAngle - 4} to={tTerm} style={{ left: 0, top: 0 }}>
        <div style={{ position: "relative", width: STAGE_W, height: 690 }}>
          {/* inside the basket */}
          <div style={{ position: "absolute", left: 30, top: 20, width: 780 }}>
            <Pop at={tAngle}>
              <Panel style={{ padding: 26 }}>
                <Label size={22}>dans le panier DXY</Label>
                <div style={{ display: "flex", gap: 12, marginTop: 14, justifyContent: "center" }}>
                  {(["EUR", "JPY", "GBP", "CAD", "SEK", "CHF"] as const).map((k) => (
                    <Coin key={k} sym={CUR[k].sym} size={86} color={CUR[k].color} />
                  ))}
                </div>
              </Panel>
            </Pop>
            <div style={{ display: "flex", gap: 24, marginTop: 26, alignItems: "center" }}>
              {[
                { sym: "¥", t: "yuan", at: tYuan },
                { sym: "R$", t: "réal", at: tEm },
                { sym: "₹", t: "roupie", at: tEm + 8 },
                { sym: "₩", t: "won", at: tEm + 16 },
              ].map((x) => (
                <Pop key={x.t} at={x.at}>
                  <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <Coin sym={x.sym} size={90} color={C.textMuted} />
                    <div style={{ position: "absolute", top: 0 }}>
                      <CrossDraw at={x.at + 8} size={90} />
                    </div>
                    <Label size={20}>{x.t}</Label>
                  </div>
                </Pop>
              ))}
              <Pop at={tEm}>
                <Label size={24} color={C.negative}>hors du panier</Label>
              </Pop>
            </div>
          </div>
          <div style={{ position: "absolute", left: 870, top: 20, width: 840, display: "flex", flexDirection: "column", gap: 24 }}>
            <Pop at={tPoids}>
              <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                <div style={{ transform: "scale(0.55)", transformOrigin: "left center", width: 130, height: 150 }}>
                  <CalendarPage top="POIDS" big="figés" size={220} />
                </div>
                <Label size={26} color={C.textPrimary}>des poids historiques, figés depuis longtemps</Label>
              </div>
            </Pop>
            {frame >= tLarge && (
              <Pop at={tLarge}>
                <Panel style={{ padding: 20 }}>
                  <TwoLines from={tLarge} />
                  {frame >= tAutre && <Label size={22}>un indice pondéré par le commerce réel peut raconter une autre histoire</Label>}
                </Panel>
              </Pop>
            )}
            {frame >= tRef && (
              <Pop at={tRef}>
                <Pill text="référence liquide et utile · pas une carte complète" size={24} />
              </Pop>
            )}
          </div>
        </div>
      </Beat>

      <Beat from={tTerm} style={{ left: 0, top: 0 }}>
        <div style={{ width: STAGE_W, height: 660, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 34 }}>
          <Pop at={tTerm}>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <TerminalGlyph size={54} />
              <Big size={44}>La source du DXY dans le terminal</Big>
            </div>
          </Pop>
          <div style={{ display: "flex", gap: 40 }}>
            <Pop at={tYahoo}>
              <Panel glow style={{ width: 620, padding: 28 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <CheckDraw at={tYahoo + 8} size={48} />
                  <Big size={32} color={C.accentBright}>page publique du site Yahoo</Big>
                </div>
                {frame >= tNonOff && <Label size={23}>non officielle · sans documentation</Label>}
                {frame >= tNiveau && <Label size={23} color={C.positive}>mais le niveau publié de l&apos;indice : lecture directe, pas une reconstruction</Label>}
              </Panel>
            </Pop>
            <Pop at={tLic}>
              <Panel style={{ width: 560, padding: 28, position: "relative" }}>
                <Big size={30} color={C.textMuted}>flux officiel sous licence</Big>
                <Label size={22}>de l&apos;opérateur qui publie l&apos;indice</Label>
                <div style={{ position: "absolute", right: 20, top: 20 }}>
                  <CrossDraw at={tLic + 10} size={60} />
                </div>
              </Panel>
            </Pop>
          </div>
          {frame >= tNuance && (
            <Pop at={tNuance}>
              <div style={{ display: "flex", gap: 30 }}>
                <Pill text="change : l'autorité de la source" color={C.negative} size={26} />
                {frame >= tSens && <Pill text="ne change pas : le sens des variations" color={C.positive} size={26} />}
              </div>
            </Pop>
          )}
        </div>
      </Beat>
    </SceneShell>
  );
};
