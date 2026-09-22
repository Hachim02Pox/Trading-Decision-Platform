import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { theme } from "../theme";
import { Sfx, cueFrame, Panel } from "./shared";
import type { SceneProps } from "./shared";
import { Beat, Pop, Person, clamp } from "./characters";
import { SceneShell, Center, Big, Label, STAGE_W } from "./stage";
import { Basket, Item, PriceTag } from "./props";

const WEIGHTS = [
  { l: "Logement", w: 0.9 },
  { l: "Transport", w: 0.45 },
  { l: "Alimentation", w: 0.35 },
  { l: "Énergie", w: 0.18 },
  { l: "Autres", w: 0.6 },
];

export const CoreCpi: React.FC<SceneProps> = ({ subtitles, durationInFrames }) => {
  const frame = useCurrentFrame();
  const c = (i: number) => cueFrame(subtitles, i);
  const shake = (k: number) => (frame >= c(12) ? Math.sin(frame / 2.2 + k) * 10 : 0);
  const lift = interpolate(frame, [c(10), c(11) + 10], [0, -150], { ...clamp, easing: theme.ease.out });

  const t = Math.max(0, frame - c(19));
  const housing = Math.min(1, t / 260) * 0.7;
  const cars = t < 90 ? (t / 90) * 0.85 : Math.max(0.15, 0.85 - ((t - 90) / 40) * 0.7);
  const medical = Math.min(0.75, Math.floor(t / 45) * 0.15);

  const smoothP = interpolate(frame, [c(25), c(26) + 20], [0, 1], { ...clamp, easing: theme.ease.inOut });
  const raw = Array.from({ length: 25 }, (_, i) => `${30 + i * 32},${170 - i * 3 - Math.sin(i * 1.3) * 38}`).join(" ");
  const smooth = Array.from({ length: 25 }, (_, i) => `${30 + i * 32},${170 - i * 3}`).join(" ");

  return (
    <SceneShell eyebrow="F4 · CPI" title="Le CPI, global ou sous-jacent" durationInFrames={durationInFrames}>
      <Sfx file="chime.wav" at={c(1)} volume={0.45} />
      <Sfx file="pop.wav" at={c(5)} volume={0.35} />
      <Sfx file="whoosh.wav" at={c(10)} volume={0.45} />
      <Sfx file="bass.wav" at={c(15)} volume={0.4} />
      <Sfx file="whoosh.wav" at={c(19)} volume={0.4} />
      <Sfx file="pop.wav" at={c(27)} volume={0.45} />

      <Beat from={c(0)} to={c(9)} style={{ left: 0, top: 0 }}>
        <Center gap={100}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
            <Pop at={c(1)}>
              <div style={{ fontSize: 150, fontWeight: 900, color: theme.colors.accentBright, letterSpacing: 6, textShadow: `0 0 50px ${theme.colors.glow}` }}>CPI</div>
            </Pop>
            <Label size={26}>Indice des prix à la consommation (États-Unis)</Label>
            <Pop at={c(3)}>
              <Label color={theme.colors.textMuted} size={22}>construit par le bureau des statistiques du travail (BLS)</Label>
            </Pop>
          </div>
          <div style={{ position: "relative", width: 380, height: 360 }}>
            <div style={{ position: "absolute", left: 100, top: 90 }}>
              <Pop at={c(5)}>
                <Person size={220} color="#2d3a4a" label="relevé des prix" />
              </Pop>
            </div>
            {["1,89 $", "4,20 $", "32 $", "1 285 $"].map((tx, i) => (
              <div key={tx} style={{ position: "absolute", left: [0, 250, 10, 240][i], top: [20, 30, 250, 260][i] }}>
                <Pop at={c(5) + 8 + i * 7}>
                  <PriceTag text={tx} rotate={[-10, 8, 6, -8][i]} />
                </Pop>
              </div>
            ))}
          </div>
          <Pop at={c(7)}>
            <Panel style={{ width: 440 }}>
              <Label color={theme.colors.textMuted} size={18}>POIDS DANS LE PANIER (illustratif)</Label>
              {WEIGHTS.map((w, i) => (
                <div key={w.l} style={{ marginTop: 14 }}>
                  <div style={{ color: theme.colors.textPrimary, fontSize: 20 }}>{w.l}</div>
                  <div style={{ height: 14, borderRadius: 7, background: theme.colors.panel, marginTop: 4 }}>
                    <div style={{ width: `${w.w * 100 * interpolate(frame, [c(7) + i * 5, c(7) + i * 5 + 20], [0, 1], { ...clamp, easing: theme.ease.out })}%`, height: "100%", borderRadius: 7, background: theme.colors.accent }} />
                  </div>
                </div>
              ))}
            </Panel>
          </Pop>
        </Center>
      </Beat>

      <Beat from={c(9)} to={c(18)} style={{ left: 0, top: 0 }}>
        <Center gap={160}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
            <Basket size={340}>
              {(["bread", "fuel", "house", "car", "health"] as const).map((k) => (
                <Item key={k} kind={k} size={66} />
              ))}
            </Basket>
            <Big size={38}>CPI global</Big>
            <Label size={22}>tout le panier</Label>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20, position: "relative" }}>
            <Beat from={c(10)} style={{ position: "relative" }}>
              <Basket size={340} color={theme.colors.accentBright}>
                {(["house", "car", "health"] as const).map((k) => (
                  <Item key={k} kind={k} size={66} />
                ))}
              </Basket>
            </Beat>
            <div style={{ position: "absolute", left: 70, top: 60 + lift, display: "flex", gap: 30, opacity: frame >= c(10) ? 1 : 0 }}>
              <div style={{ transform: `translate(${shake(0)}px, ${shake(2)}px) rotate(${shake(1)}deg)` }}>
                <Item kind="bread" size={90} />
              </div>
              <div style={{ transform: `translate(${shake(3)}px, ${shake(5)}px) rotate(${shake(4)}deg)` }}>
                <Item kind="fuel" size={90} />
              </div>
            </div>
            <Big size={38} color={theme.colors.accentBright}>CPI sous-jacent</Big>
            <Label size={22}>sans alimentation ni énergie</Label>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
            <Pop at={c(12)}>
              <Panel style={{ padding: 20 }}>
                <Label color={theme.colors.textMuted} size={17}>ALIMENTATION + ÉNERGIE, MOIS PAR MOIS</Label>
                <svg width="330" height="110" viewBox="0 0 330 110">
                  <polyline points={Array.from({ length: 12 }, (_, i) => `${10 + i * 28},${55 + Math.sin(i * 2.1) * 40}`).join(" ")} fill="none" stroke={theme.colors.negative} strokeWidth="4" />
                  <line x1="10" x2="320" y1="55" y2="55" stroke={theme.colors.accent} strokeWidth="3" strokeDasharray="6 6" />
                </svg>
                <Label size={18}>le bruit cache la tendance</Label>
              </Panel>
            </Pop>
            <Pop at={c(15)}>
              <PriceTag text="Ça compte quand même" color={theme.colors.textPrimary} rotate={0} />
            </Pop>
            <Pop at={c(17)}>
              <PriceTag text="Pas une prévision" color={theme.colors.negative} rotate={0} />
            </Pop>
          </div>
        </Center>
      </Beat>

      <Beat from={c(18)} to={c(25)} style={{ left: 0, top: 0 }}>
        <div style={{ width: STAGE_W, display: "flex", flexDirection: "column", alignItems: "center", gap: 34, paddingTop: 30 }}>
          <Big size={40}>Chaque morceau à son rythme</Big>
          {[
            { l: "Logement", sub: "lent : les loyers entrent avec retard", v: housing, at: c(19), kind: "house" as const },
            { l: "Voitures d'occasion", sub: "peuvent se retourner brutalement", v: cars, at: c(21), kind: "car" as const },
            { l: "Services médicaux", sub: "leur propre horloge", v: medical, at: c(22), kind: "health" as const },
          ].map((r) => (
            <Pop key={r.l} at={r.at}>
              <div style={{ display: "flex", alignItems: "center", gap: 24, width: 1400 }}>
                <Item kind={r.kind} size={70} />
                <div style={{ width: 360 }}>
                  <div style={{ color: theme.colors.textPrimary, fontSize: 26, fontWeight: 800 }}>{r.l}</div>
                  <div style={{ color: theme.colors.textMuted, fontSize: 19 }}>{r.sub}</div>
                </div>
                <div style={{ flex: 1, height: 26, borderRadius: 13, background: theme.colors.panelAlt, border: `1px solid ${theme.colors.hairline}` }}>
                  <div style={{ width: `${r.v * 100}%`, height: "100%", borderRadius: 13, background: `linear-gradient(90deg, ${theme.colors.accentDim}, ${theme.colors.accentBright})` }} />
                </div>
              </div>
            </Pop>
          ))}
          <Pop at={c(23)}>
            <Big size={32} color={theme.colors.accentBright}>Deux chiffres identiques, deux persistances différentes</Big>
          </Pop>
        </div>
      </Beat>

      <Beat from={c(25)} style={{ left: 0, top: 0 }}>
        <Center gap={70}>
          <Panel style={{ width: 880 }}>
            <Label color={theme.colors.textMuted} size={18}>CORRECTION DES SAISONS</Label>
            <svg width="820" height="260" viewBox="0 0 820 260">
              <polyline points={raw} fill="none" stroke={theme.colors.textMuted} strokeWidth="3" opacity={1 - smoothP * 0.6} />
              <polyline points={smooth} fill="none" stroke={theme.colors.accentBright} strokeWidth="5" strokeDasharray="900" strokeDashoffset={900 * (1 - smoothP)} />
              <text x="40" y="250" fill={theme.colors.textMuted} fontSize="18" fontFamily={theme.mono}>
                brut (gris) → corrigé des saisons (or)
              </text>
            </svg>
          </Panel>
          <Pop at={c(27)}>
            <div style={{ border: `5px solid ${theme.colors.negative}`, color: theme.colors.negative, fontSize: 60, fontWeight: 900, padding: "6px 26px", borderRadius: 14, transform: "rotate(-8deg)" }}>
              RÉVISABLE
            </div>
          </Pop>
        </Center>
      </Beat>
    </SceneShell>
  );
};
