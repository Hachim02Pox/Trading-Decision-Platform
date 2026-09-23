import React from "react";
import { useCurrentFrame } from "remotion";
import { theme } from "../theme";
import { Sfx, makeCue, Panel, useBreathe, GoldBarIcon } from "./shared";
import type { SceneProps } from "./shared";
import { Beat, Pop, DollarIcon } from "./characters";
import { SceneShell, Big, Label, STAGE_W } from "./stage";
import { CheckDraw, Gauge50, Bathtub } from "./props5";

const C = theme.colors;

export const Recap: React.FC<SceneProps> = ({ words, durationInFrames }) => {
  const frame = useCurrentFrame();
  const cue = makeCue(words);
  const breathe = useBreathe(0.3);
  const tA = cue("les chiffres de l emploi");
  const tB = cue("les revisions et la tendance");
  const tC = cue("l ism mesure");
  const tD = cue("et l estimation d atlanta");
  const tInd = cue("surtout le chemin");
  const tNever = cue("alors ne devine jamais");
  const tF3 = cue("le pari sur la banque");
  const tF2 = cue("les taux reels");
  const tF6 = cue("et le dollar");
  const tStress = cue("sous stress");

  const items = [
    { t: "Enquêtes, populations, stocks et flux différents", at: tA, icon: <Bathtub level={0.5} width={150} /> },
    { t: "Révisions et tendance peuvent renverser le premier titre", at: tB, icon: <CheckDraw at={tB + 6} size={60} /> },
    { t: "L'ISM mesure l'étendue des changements", at: tC, icon: <Gauge50 value={51} size={150} /> },
    { t: "L'estimation d'Atlanta : un modèle qui bouge, pas un PIB observé", at: tD, icon: <CheckDraw at={tD + 6} size={60} /> },
  ];

  return (
    <SceneShell eyebrow="F5 · À retenir" title="Ce qu'il faut garder de F5" durationInFrames={durationInFrames}>
      {items.map((it) => (
        <Sfx key={it.t} file="tick.wav" at={it.at} volume={0.4} />
      ))}
      <Sfx file="bass.wav" at={tInd} volume={0.5} />
      <Sfx file="chime.wav" at={tF6} volume={0.55} />

      <Beat from={tA - 4} to={tInd} style={{ left: 0, top: 0 }}>
        <div style={{ width: STAGE_W, height: 640, display: "grid", gridTemplateColumns: "820px 820px", gap: 30, justifyContent: "center", alignContent: "center" }}>
          {items.map((it, i) => (
            <Pop key={it.t} at={it.at}>
              <Panel style={{ display: "flex", alignItems: "center", gap: 22, minHeight: 210 }} glow={frame >= it.at && (i === items.length - 1 || frame < items[i + 1].at)}>
                <div style={{ width: 160, display: "flex", justifyContent: "center" }}>{it.icon}</div>
                <div>
                  <div style={{ color: C.accent, fontFamily: theme.mono, fontSize: 20 }}>0{i + 1}</div>
                  <Label color={C.textPrimary} size={29}>
                    <span style={{ textAlign: "left", display: "block" }}>{it.t}</span>
                  </Label>
                </div>
              </Panel>
            </Pop>
          ))}
        </div>
      </Beat>

      <Beat from={tInd} style={{ left: 0, top: 0 }}>
        <div style={{ width: STAGE_W, height: 640, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 34 }}>
          <Pop at={tInd}>
            <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
              <Big size={40}>Emploi & croissance</Big>
              <svg width="220" height="40">
                <path d="M6 20 Q 60 -10 110 20 T 210 20" stroke={C.accent} strokeWidth="4" strokeDasharray="10 8" strokeDashoffset={-frame} fill="none" />
              </svg>
              <GoldBarIcon size={90} />
              <Label size={26}>un chemin indirect</Label>
            </div>
          </Pop>
          {frame >= tNever && (
            <div style={{ transform: `scale(${breathe.scale})` }}>
              <Pop at={tNever}>
                <Big size={70} color={C.accentBright} glow>
                  Ne devine jamais. Vérifie.
                </Big>
              </Pop>
            </div>
          )}
          <div style={{ display: "flex", gap: 30 }}>
            {[
              { t: "F3 · le pari sur la Fed", at: tF3 },
              { t: "F2 · les taux réels", at: tF2 },
              { t: "F6 · le dollar", at: tF6, icon: <DollarIcon size={40} /> },
            ].map((s) => (
              <Pop key={s.t} at={s.at}>
                <Panel glow style={{ padding: "24px 40px" }}>
                  <Big size={32}>{s.t}</Big>
                </Panel>
              </Pop>
            ))}
          </div>
          {frame >= tStress && (
            <Pop at={tStress}>
              <Label size={28} color={C.negative}>… surtout quand le marché est sous stress</Label>
            </Pop>
          )}
        </div>
      </Beat>
    </SceneShell>
  );
};
