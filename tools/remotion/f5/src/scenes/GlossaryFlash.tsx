import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "../theme";
import { Sfx, makeCue, Panel } from "./shared";
import type { SceneProps } from "./shared";
import { Person } from "./characters";
import { SceneShell, Big, Label, STAGE_W } from "./stage";
import { Briefcase, Magnifier, Office, Gauge50, ModelMachine } from "./props5";

const C = theme.colors;

export const GlossaryFlash: React.FC<SceneProps> = ({ words, durationInFrames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const cue = makeCue(words);

  const TERMS = [
    {
      term: "Population active",
      def: "Les personnes en emploi, plus les chômeurs qui cherchent activement",
      at: cue("population active"),
      icon: (
        <div style={{ display: "flex", alignItems: "flex-end", gap: 6 }}>
          <Person size={110} color={C.positive} />
          <Briefcase size={44} />
          <Person size={110} color={C.context} />
          <Magnifier size={44} />
        </div>
      ),
    },
    {
      term: "Emplois salariés non agricoles",
      def: "L'estimation, faite auprès des employeurs, des emplois sur les fiches de paie américaines",
      at: cue("emplois salaries non agricoles"),
      icon: <Office size={200} lit />,
    },
    {
      term: "Révision",
      def: "La correction d'un chiffre déjà publié, quand de nouvelles données arrivent",
      at: cue("revision"),
      icon: (
        <div style={{ fontFamily: theme.mono, fontWeight: 900, fontSize: 50, color: C.accentBright, textAlign: "center" }}>
          <div style={{ color: C.textMuted, textDecoration: "line-through" }}>+160 000</div>
          <div>+125 000</div>
        </div>
      ),
    },
    { term: "Indice de diffusion", def: "La part des répondants qui voient une amélioration, une stabilité ou une dégradation", at: cue("indice de diffusion"), icon: <Gauge50 value={52} size={260} /> },
    { term: "Prévision immédiate", def: "L'estimation, par un modèle, de la période en cours, à partir des données déjà publiées", at: cue("et prevision immediate"), icon: <ModelMachine size={250} display="2,5 %" /> },
  ];

  const activeIdx = TERMS.reduce((acc, t, i) => (frame >= t.at ? i : acc), -1);

  return (
    <SceneShell eyebrow="F5 · Vocabulaire" title="Le vocabulaire, en rafale" durationInFrames={durationInFrames}>
      {TERMS.map((t) => (
        <Sfx key={t.term} file="chime.wav" at={t.at - 2} volume={0.4} />
      ))}
      <div style={{ position: "absolute", left: 0, top: 0, width: STAGE_W, display: "flex", gap: 12, justifyContent: "center" }}>
        {TERMS.map((t, i) => (
          <div
            key={t.term}
            style={{
              padding: "8px 18px",
              borderRadius: 999,
              border: `1.5px solid ${i <= activeIdx ? C.accent : C.hairline}`,
              color: i === activeIdx ? C.bg : i < activeIdx ? C.accentBright : C.textMuted,
              background: i === activeIdx ? C.accent : "transparent",
              fontSize: 18,
              fontWeight: 700,
            }}
          >
            {t.term}
          </div>
        ))}
      </div>
      {TERMS.map((t, i) => {
        if (i !== activeIdx) return null;
        const p = spring({ frame: frame - t.at, fps, config: theme.spring.smooth });
        return (
          <div
            key={t.term}
            style={{
              position: "absolute",
              left: STAGE_W / 2 - 600,
              top: 110,
              width: 1200,
              opacity: p,
              transform: p > 0.995 ? "none" : `perspective(1200px) rotateY(${interpolate(p, [0, 1], [70, 0])}deg) scale(${interpolate(p, [0, 1], [0.85, 1])})`,
            }}
          >
            <Panel glow style={{ display: "flex", alignItems: "center", gap: 50, padding: 50, minHeight: 380 }}>
              <div style={{ width: 340, display: "flex", justifyContent: "center" }}>{t.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ color: C.accent, fontFamily: theme.mono, fontSize: 20 }}>
                  {i + 1} / {TERMS.length}
                </div>
                <Big size={50} color={C.accentBright}>
                  <span style={{ textAlign: "left", display: "block" }}>{t.term}</span>
                </Big>
                <div style={{ marginTop: 16 }}>
                  <Label color={C.textPrimary} size={29}>
                    <span style={{ textAlign: "left", display: "block" }}>{t.def}</span>
                  </Label>
                </div>
              </div>
            </Panel>
          </div>
        );
      })}
    </SceneShell>
  );
};
