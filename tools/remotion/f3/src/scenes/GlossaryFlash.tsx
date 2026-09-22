import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "../theme";
import { Sfx, cueFrame, Panel } from "./shared";
import type { SceneProps } from "./shared";
import { Person, Bird, Bubble, ArrowGlyph } from "./characters";
import { SceneShell, Big, Label, STAGE_W } from "./stage";

const RangeGlyph = () => (
  <svg width="220" height="120" viewBox="0 0 220 120">
    <line x1="10" y1="60" x2="210" y2="60" stroke={theme.colors.hairline} strokeWidth="4" />
    <rect x="80" y="36" width="60" height="48" rx="8" fill={theme.colors.accent} />
    <text x="80" y="110" textAnchor="middle" fill={theme.colors.textMuted} fontSize="16" fontFamily={theme.mono}>basse</text>
    <text x="140" y="110" textAnchor="middle" fill={theme.colors.textMuted} fontSize="16" fontFamily={theme.mono}>haute</text>
  </svg>
);

const DotsGlyph = () => (
  <svg width="220" height="140" viewBox="0 0 220 140">
    {Array.from({ length: 14 }).map((_, i) => (
      <circle key={i} cx={40 + (i % 4) * 46 + (i % 3) * 4} cy={30 + Math.floor(i / 4) * 26 + (i % 2) * 6} r="7" fill={theme.colors.accent} />
    ))}
  </svg>
);

export const GlossaryFlash: React.FC<SceneProps> = ({ subtitles, durationInFrames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const c = (i: number) => cueFrame(subtitles, i);

  const TERMS = [
    { term: "Fourchette cible", def: "Les bornes basse et haute fixées par la Fed", at: c(1) + 40, icon: <RangeGlyph /> },
    {
      term: "Le comité monétaire",
      def: "Le groupe de la Fed qui décide de la politique des taux",
      at: c(3) + 25,
      icon: (
        <div style={{ display: "flex", gap: 4 }}>
          {[0, 1, 2].map((i) => (
            <Person key={i} size={90} phase={i} color="#2d3a4a" />
          ))}
        </div>
      ),
    },
    {
      term: "Anticipations de taux",
      def: "Ce que le marché parie sur les décisions futures",
      at: c(6),
      icon: (
        <div style={{ display: "flex", alignItems: "flex-end", gap: 10 }}>
          <Person size={110} color={theme.colors.context} />
          <Bubble text="Baisse ?" width={150} tail="left" />
        </div>
      ),
    },
    {
      term: "Révision du pari",
      def: "Le changement de ces anticipations, par rapport à avant",
      at: c(8) + 40,
      icon: (
        <div style={{ display: "flex", gap: 20 }}>
          <ArrowGlyph up color={theme.colors.negative} size={90} />
          <ArrowGlyph up={false} color={theme.colors.positive} size={90} />
        </div>
      ),
    },
    { term: "Faucon", def: "Plus strict que ce qui était attendu", at: c(11), icon: <Bird kind="hawk" size={170} /> },
    { term: "Colombe", def: "Plus accommodant que ce qui était attendu", at: c(12) + 20, icon: <Bird kind="dove" size={170} /> },
    { term: "Graphique à points", def: "L'avis de chaque membre sur les taux futurs, sans engagement", at: c(13) + 40, icon: <DotsGlyph /> },
  ];

  const activeIdx = TERMS.reduce((acc, t, i) => (frame >= t.at ? i : acc), -1);

  return (
    <SceneShell eyebrow="F3 · Vocabulaire" title="Le vocabulaire, en rafale" durationInFrames={durationInFrames}>
      {TERMS.map((t) => (
        <Sfx key={t.term} file="chime.wav" at={t.at - 2} volume={0.4} />
      ))}

      <div style={{ position: "absolute", left: 0, top: 0, width: STAGE_W, display: "flex", gap: 12, justifyContent: "center" }}>
        {TERMS.map((t, i) => (
          <div
            key={t.term}
            style={{
              padding: "8px 16px",
              borderRadius: 999,
              border: `1.5px solid ${i <= activeIdx ? theme.colors.accent : theme.colors.hairline}`,
              color: i === activeIdx ? theme.colors.bg : i < activeIdx ? theme.colors.accentBright : theme.colors.textMuted,
              background: i === activeIdx ? theme.colors.accent : "transparent",
              fontSize: 17,
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
              left: STAGE_W / 2 - 520,
              top: 110,
              width: 1040,
              opacity: p,
              transform: `perspective(1200px) rotateY(${interpolate(p, [0, 1], [70, 0])}deg) scale(${interpolate(p, [0, 1], [0.85, 1])})`,
            }}
          >
            <Panel glow style={{ display: "flex", alignItems: "center", gap: 50, padding: 50, minHeight: 360 }}>
              <div style={{ width: 300, display: "flex", justifyContent: "center" }}>{t.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ color: theme.colors.accent, fontFamily: theme.mono, fontSize: 20 }}>
                  {i + 1} / {TERMS.length}
                </div>
                <Big size={56} color={theme.colors.accentBright}>
                  <span style={{ textAlign: "left", display: "block" }}>{t.term}</span>
                </Big>
                <div style={{ marginTop: 16 }}>
                  <Label color={theme.colors.textPrimary} size={28}>
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
