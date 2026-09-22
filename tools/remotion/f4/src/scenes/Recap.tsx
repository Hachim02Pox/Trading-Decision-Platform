import React from "react";
import { useCurrentFrame } from "remotion";
import { theme } from "../theme";
import { Sfx, cueFrame, Panel, useBreathe, GoldBarIcon } from "./shared";
import type { SceneProps } from "./shared";
import { Beat, Pop, Person } from "./characters";
import { SceneShell, Big, Label, STAGE_W } from "./stage";
import { Speedometer, Rope } from "./props";

const Check = () => (
  <svg width="44" height="44" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10" stroke={theme.colors.accent} strokeWidth="2" fill="none" />
    <path d="M7 12.5 L10.5 16 L17 8.5" stroke={theme.colors.accent} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
  </svg>
);

export const Recap: React.FC<SceneProps> = ({ subtitles, durationInFrames }) => {
  const frame = useCurrentFrame();
  const c = (i: number) => cueFrame(subtitles, i);
  const breathe = useBreathe(0.3);

  const items = [
    { t: "L'inflation est une vitesse. Désinflation ≠ déflation", at: c(1) },
    { t: "CPI et PCE : périmètre, poids, formules et sources différents", at: c(4) },
    { t: "Composition et surprise comptent plus que le sens du chiffre", at: c(7) },
    { t: "Deux chemins opposés vers l'or", at: c(9) },
  ];

  return (
    <SceneShell eyebrow="F4 · À retenir" title="Ce qu'il faut garder de F4" durationInFrames={durationInFrames}>
      {items.map((it) => (
        <Sfx key={it.t} file="tick.wav" at={it.at} volume={0.4} />
      ))}
      <Sfx file="bass.wav" at={c(11)} volume={0.5} />
      <Sfx file="chime.wav" at={c(15)} volume={0.55} />

      <Beat from={c(1)} to={c(11)} style={{ left: 0, top: 0 }}>
        <div style={{ width: STAGE_W, display: "grid", gridTemplateColumns: "820px 820px", gap: 30, justifyContent: "center", paddingTop: 20 }}>
          {items.map((it, i) => (
            <Pop key={it.t} at={it.at}>
              <Panel style={{ display: "flex", alignItems: "center", gap: 22, minHeight: 190 }} glow={frame >= it.at && (i === items.length - 1 || frame < items[i + 1].at)}>
                {i === 0 ? <Speedometer value={0.55} size={140} /> : <Check />}
                <div>
                  <div style={{ color: theme.colors.accent, fontFamily: theme.mono, fontSize: 20 }}>0{i + 1}</div>
                  <Label color={theme.colors.textPrimary} size={29}>
                    <span style={{ textAlign: "left", display: "block" }}>{it.t}</span>
                  </Label>
                </div>
              </Panel>
            </Pop>
          ))}
        </div>
      </Beat>

      <Beat from={c(11)} style={{ left: 0, top: 0 }}>
        <div style={{ width: STAGE_W, display: "flex", flexDirection: "column", alignItems: "center", gap: 40, paddingTop: 50 }}>
          <div style={{ transform: `scale(${breathe.scale})` }}>
            <Big size={70} color={theme.colors.accentBright} glow>
              Ne devine jamais. Vérifie.
            </Big>
          </div>
          <Label size={28}>la vraie réponse du marché</Label>
          <div style={{ display: "flex", gap: 30 }}>
            {[
              { t: "F3 · le pari sur la Fed", at: c(13) },
              { t: "F2 · les taux réels", at: c(14) },
              { t: "F6 · le dollar", at: c(15) },
            ].map((s) => (
              <Pop key={s.t} at={s.at}>
                <Panel glow style={{ padding: "26px 40px" }}>
                  <Big size={32}>{s.t}</Big>
                </Panel>
              </Pop>
            ))}
          </div>
          <Pop at={c(12)}>
            <div style={{ display: "flex", alignItems: "center", marginTop: 10 }}>
              {[0, 1].map((i) => (
                <div key={i} style={{ transform: "rotate(-8deg)" }}>
                  <Person size={130} phase={i} run color={theme.colors.positive} />
                </div>
              ))}
              <Rope width={560} offset={Math.sin(frame / 25) * 120}>
                <GoldBarIcon size={90} />
              </Rope>
              {[0, 1].map((i) => (
                <div key={i} style={{ transform: "rotate(8deg) scaleX(-1)" }}>
                  <Person size={130} phase={i + 2} run color={theme.colors.negative} />
                </div>
              ))}
            </div>
          </Pop>
        </div>
      </Beat>
    </SceneShell>
  );
};
