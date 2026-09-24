import React from "react";
import { useCurrentFrame } from "remotion";
import { theme } from "../theme";
import { Sfx, makeCue, Panel, useBreathe, GoldBarIcon } from "./shared";
import type { SceneProps } from "./shared";
import { Beat, Pop } from "./characters";
import { SceneShell, Big, Label, STAGE_W } from "./stage";
import { CheckDraw } from "./props5";
import { Coin, QuoteBoard, Seesaw } from "./props6";

const C = theme.colors;

export const Recap: React.FC<SceneProps> = ({ words, durationInFrames }) => {
  const frame = useCurrentFrame();
  const cue = makeCue(words);
  const breathe = useBreathe(0.3);
  const tA = cue("la force d une devise");
  const tB = cue("le dxy est un panier");
  const tC = cue("separe le niveau");
  const tD = cue("enfin le canal");
  const tNever = cue("alors ne devine jamais");
  const tV = cue("verifie les taux");

  const items = [
    { t: "La force est relative, le sens de la paire décide de la lecture", at: tA, icon: <div style={{ transform: "scale(0.4)" }}><QuoteBoard base="EUR" quote="USD" value="1,10" /></div> },
    { t: "DXY = panier pondéré de six devises ; source du terminal non officielle, affichée", at: tB, icon: <Coin sym="$" size={90} color={C.positive} /> },
    { t: "Niveau ≠ variation du jour ≠ variation sur 5 séances ; même horizon pour l'or", at: tC, icon: <CheckDraw at={tC + 6} size={60} /> },
    { t: "Le canal inverse dollar-or : mécanique, mais conditionnel", at: tD, icon: <div style={{ transform: "scale(0.25)" }}><Seesaw tilt={10} width={700} /></div> },
  ];

  return (
    <SceneShell eyebrow="F6 · À retenir" title="Ce qu'il faut garder de F6" durationInFrames={durationInFrames}>
      {items.map((it) => (
        <Sfx key={it.t} file="tick.wav" at={it.at} volume={0.4} />
      ))}
      <Sfx file="bass.wav" at={tNever} volume={0.5} />
      <Sfx file="chime.wav" at={tV + 20} volume={0.55} />

      <Beat from={tA - 4} to={tNever} style={{ left: 0, top: 0 }}>
        <div style={{ width: STAGE_W, height: 640, display: "grid", gridTemplateColumns: "820px 820px", gap: 30, justifyContent: "center", alignContent: "center" }}>
          {items.map((it, i) => (
            <Pop key={it.t} at={it.at}>
              <Panel style={{ display: "flex", alignItems: "center", gap: 22, minHeight: 210 }} glow={frame >= it.at && (i === items.length - 1 || frame < items[i + 1].at)}>
                <div style={{ width: 170, height: 150, display: "flex", justifyContent: "center", alignItems: "center", overflow: "hidden" }}>{it.icon}</div>
                <div>
                  <div style={{ color: C.accent, fontFamily: theme.mono, fontSize: 20 }}>0{i + 1}</div>
                  <Label color={C.textPrimary} size={28}>
                    <span style={{ textAlign: "left", display: "block" }}>{it.t}</span>
                  </Label>
                </div>
              </Panel>
            </Pop>
          ))}
        </div>
      </Beat>

      <Beat from={tNever} style={{ left: 0, top: 0 }}>
        <div style={{ width: STAGE_W, height: 640, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 34 }}>
          <div style={{ transform: `scale(${breathe.scale})` }}>
            <Big size={70} color={C.accentBright} glow>
              Ne devine jamais. Vérifie.
            </Big>
          </div>
          <div style={{ display: "flex", gap: 24 }}>
            {["les taux", "le stress", "les flux", "la vraie réaction de l'or"].map((t, i) => (
              <Pop key={t} at={tV + i * 12}>
                <Panel glow style={{ padding: "22px 34px", display: "flex", alignItems: "center", gap: 12 }}>
                  {i === 3 && <GoldBarIcon size={50} />}
                  <Big size={30}>{t}</Big>
                </Panel>
              </Pop>
            ))}
          </div>
        </div>
      </Beat>
    </SceneShell>
  );
};
