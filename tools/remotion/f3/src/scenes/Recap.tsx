import React from "react";
import { useCurrentFrame } from "remotion";
import { theme } from "../theme";
import { Sfx, cueFrame, Panel, useBreathe, WordReveal } from "./shared";
import type { SceneProps } from "./shared";
import { Beat, Pop, Person, FedSpeaker } from "./characters";
import { SceneShell, Big, Label, STAGE_W } from "./stage";

const Check = () => (
  <svg width="44" height="44" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10" stroke={theme.colors.accent} strokeWidth="2" fill="none" />
    <path d="M7 12.5 L10.5 16 L17 8.5" stroke={theme.colors.accent} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
  </svg>
);

export const Recap: React.FC<SceneProps> = ({ subtitles, durationInFrames }) => {
  const frame = useCurrentFrame();
  const c = (i: number) => cueFrame(subtitles, i);
  const breathe = useBreathe(0.5);

  const items = [
    { t: "Le marché échange l'écart avec le pari, pas l'étiquette", at: c(1) },
    { t: "Une probabilité est un poids, jamais une promesse", at: c(4) },
    { t: "Fourchette, prochaine réunion, trajectoire, variation : 4 choses", at: c(7) },
    { t: "Vérifier via 2 ans, taux réels et dollar, sans compter double", at: c(12) },
  ];

  return (
    <SceneShell eyebrow="F3 · À retenir" title="Ce qu'il faut garder de F3" durationInFrames={durationInFrames}>
      {items.map((it) => (
        <Sfx key={it.t} file="tick.wav" at={it.at} volume={0.4} />
      ))}
      <Sfx file="bass.wav" at={c(17)} volume={0.5} />
      <Sfx file="chime.wav" at={c(21)} volume={0.55} />

      <Beat from={c(1)} to={c(17)} style={{ left: 0, top: 0 }}>
        <div style={{ width: STAGE_W, display: "grid", gridTemplateColumns: "820px 820px", gap: 30, justifyContent: "center", paddingTop: 20 }}>
          {items.map((it, i) => (
            <Pop key={it.t} at={it.at}>
              <Panel style={{ display: "flex", alignItems: "center", gap: 22, minHeight: 190 }} glow={frame >= it.at && (i === items.length - 1 || frame < items[i + 1].at)}>
                <Check />
                <div>
                  <div style={{ color: theme.colors.accent, fontFamily: theme.mono, fontSize: 20 }}>0{i + 1}</div>
                  <Label color={theme.colors.textPrimary} size={30}>
                    <span style={{ textAlign: "left", display: "block" }}>{it.t}</span>
                  </Label>
                </div>
              </Panel>
            </Pop>
          ))}
        </div>
      </Beat>

      <Beat from={c(17)} style={{ left: 0, top: 0 }}>
        <div style={{ position: "relative", width: STAGE_W, height: 690 }}>
          <div style={{ position: "absolute", left: 60, top: 260 }}>
            <FedSpeaker size={280} talking={frame < c(20)} />
          </div>
          <div style={{ position: "absolute", right: 30, top: 380, display: "flex", gap: 14 }}>
            {[0, 1, 2, 3, 4, 5, 6].map((i) => (
              <Pop key={i} at={c(17) + i * 4}>
                <Person size={165} phase={i} color={[theme.colors.context, theme.colors.accentDim, theme.colors.textMuted][i % 3]} cheer={frame >= c(21) && i % 2 === 0} wave={frame >= c(19) && frame < c(21) && i % 2 === 1} />
              </Pop>
            ))}
          </div>
          <div style={{ position: "absolute", left: 0, right: 0, top: 10, display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
            <Label size={30}>La vraie question, à chaque réunion</Label>
            <div style={{ color: theme.colors.textMuted, fontSize: 40, fontWeight: 700, textDecoration: frame >= c(20) ? "line-through" : "none" }}>
              <WordReveal text="Qu'est-ce que la Fed a fait ?" delay={c(19)} per={3} />
            </div>
            <div style={{ transform: `scale(${breathe.scale})` }}>
              <Big size={62} color={theme.colors.accentBright} glow>
                <WordReveal text="Qu'est-ce que le marché attendait ?" delay={c(21)} per={3} style={{ justifyContent: "center" }} />
              </Big>
            </div>
          </div>
        </div>
      </Beat>
    </SceneShell>
  );
};
