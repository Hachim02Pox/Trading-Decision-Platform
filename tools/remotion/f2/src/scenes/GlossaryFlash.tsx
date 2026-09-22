import React from "react";
import { theme } from "../theme";
import { SceneContainer, Panel, Entrance, Sfx, cueWord } from "./shared";
import type { SceneProps } from "./shared";

const TERMS: Array<{ term: string; def: string; needle: string }> = [
  { term: "Rendement", def: "Le retour offert par une obligation, vu son prix actuel", needle: "rendement." },
  { term: "Point de base", def: "Un centième de pourcent", needle: "point de base." },
  { term: "Taux réel", def: "Le rendement, une fois l'inflation retirée", needle: "taux réel." },
  { term: "Inflation implicite", def: "Ce que le marché parie sur l'inflation future", needle: "inflation implicite." },
  { term: "Deux dix", def: "L'écart entre le taux 10 ans et le taux 2 ans", needle: "deux dix." },
  { term: "Prime de terme", def: "La compensation pour prêter à long terme", needle: "prime de terme." },
  { term: "Duration", def: "La sensibilité du prix d'une obligation aux taux", needle: "duration." },
];

export const GlossaryFlash: React.FC<SceneProps> = ({ subtitles, durationInFrames }) => {
  return (
    <SceneContainer eyebrow="F2 · Vocabulaire" title="Le glossaire, en rafale" durationInFrames={durationInFrames}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        {TERMS.map((t, i) => {
          const delay = cueWord(subtitles, t.needle) || i * 24;
          return (
            <Entrance key={t.term} delay={delay} y={26} springConfig="snappy">
              <Panel style={{ padding: 24 }}>
                <Sfx file="chime.wav" at={delay} volume={0.4} />
                <div style={{ color: theme.colors.accentBright, fontSize: 22, fontWeight: 700, marginBottom: 6 }}>{t.term}</div>
                <div style={{ color: theme.colors.textSecondary, fontSize: 17, lineHeight: 1.4 }}>{t.def}</div>
              </Panel>
            </Entrance>
          );
        })}
      </div>
    </SceneContainer>
  );
};
