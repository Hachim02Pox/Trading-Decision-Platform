import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "../theme";
import { Sfx, cueFrame, Panel } from "./shared";
import type { SceneProps } from "./shared";
import { SceneShell, Big, Label, STAGE_W } from "./stage";
import { Basket, Item } from "./props";

const WindowGlyph = () => (
  <svg width="240" height="150" viewBox="0 0 240 150">
    {Array.from({ length: 8 }).map((_, i) => (
      <rect key={i} x={10 + i * 28} y={140 - [60, 40, 44, 38, 42, 40, 36, 52][i]} width="20" height={[60, 40, 44, 38, 42, 40, 36, 52][i]} rx="4" fill={i === 0 ? theme.colors.negative : theme.colors.context} opacity={i === 0 ? 0.5 : 1} />
    ))}
    <rect x="34" y="6" width="202" height="140" rx="12" fill="none" stroke={theme.colors.accent} strokeWidth="4" />
  </svg>
);

export const GlossaryFlash: React.FC<SceneProps> = ({ subtitles, durationInFrames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const c = (i: number) => cueFrame(subtitles, i);

  const TERMS = [
    {
      term: "CPI",
      def: "L'indice des prix à la consommation, basé sur ce que les ménages paient directement",
      at: c(1) + 35,
      icon: (
        <Basket size={220}>
          {(["bread", "fuel", "house"] as const).map((k) => (
            <Item key={k} kind={k} size={46} />
          ))}
        </Basket>
      ),
    },
    {
      term: "Inflation sous-jacente",
      def: "Sans alimentation ni énergie : moins agitée, pas forcément durable",
      at: c(4) + 25,
      icon: (
        <Basket size={220} color={theme.colors.accentBright}>
          {(["house", "car"] as const).map((k) => (
            <Item key={k} kind={k} size={50} />
          ))}
        </Basket>
      ),
    },
    {
      term: "Indice PCE",
      def: "Plus large, pondéré en chaîne : celui de l'objectif de la Fed",
      at: c(7),
      icon: (
        <Basket size={240} color={theme.colors.accentBright}>
          {(["bread", "house", "health"] as const).map((k) => (
            <Item key={k} kind={k} size={46} />
          ))}
        </Basket>
      ),
    },
    { term: "Effet de base", def: "Une variation sur un an causée par le mois qui entre, ou sort, de la fenêtre", at: c(10), icon: <WindowGlyph /> },
    {
      term: "Annualisé",
      def: "Un rythme sur une courte période, exprimé comme s'il durait un an",
      at: c(15),
      icon: (
        <div style={{ fontFamily: theme.mono, fontSize: 54, fontWeight: 900, color: theme.colors.accentBright }}>
          ( … )<sup>4</sup>
        </div>
      ),
    },
  ];

  const activeIdx = TERMS.reduce((acc, t, i) => (frame >= t.at ? i : acc), -1);

  return (
    <SceneShell eyebrow="F4 · Vocabulaire" title="Le vocabulaire, en rafale" durationInFrames={durationInFrames}>
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
              border: `1.5px solid ${i <= activeIdx ? theme.colors.accent : theme.colors.hairline}`,
              color: i === activeIdx ? theme.colors.bg : i < activeIdx ? theme.colors.accentBright : theme.colors.textMuted,
              background: i === activeIdx ? theme.colors.accent : "transparent",
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
              left: STAGE_W / 2 - 540,
              top: 110,
              width: 1080,
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
                <Big size={54} color={theme.colors.accentBright}>
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
