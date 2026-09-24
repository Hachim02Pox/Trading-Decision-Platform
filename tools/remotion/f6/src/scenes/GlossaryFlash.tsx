import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "../theme";
import { Sfx, makeCue, Panel, BankIcon } from "./shared";
import type { SceneProps } from "./shared";
import { SceneShell, Big, Label, STAGE_W } from "./stage";
import { Coin, QuoteBoard, WeightBar, Seesaw } from "./props6";

const C = theme.colors;

export const GlossaryFlash: React.FC<SceneProps> = ({ words, durationInFrames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const cue = makeCue(words);

  const TERMS = [
    { term: "Devise de base", def: "La première devise d'une paire ; une unité est exprimée dans l'autre", at: cue("devise de base"), icon: <div style={{ transform: "scale(0.6)" }}><QuoteBoard base="EUR" quote="USD" value="1,10" highlight="base" /></div> },
    { term: "DXY", def: "L'indice du dollar américain : un panier géométrique fixe de six devises", at: cue("dxy", cue("devise de base")), icon: <div style={{ transform: "scale(0.22)", transformOrigin: "center" }}><WeightBar from={cue("dxy", cue("devise de base"))} width={1400} /></div> },
    { term: "Différentiel de taux", def: "L'écart de taux d'intérêt entre deux économies, sur un horizon comparable", at: cue("differentiel de taux"), icon: <div style={{ display: "flex", gap: 20 }}><BankIcon size={90} color={C.positive} /><BankIcon size={90} color={C.context} /></div> },
    { term: "Dynamique", def: "Le sens et l'ampleur d'une variation, sur une période clairement définie", at: cue("dynamique"), icon: <Coin sym="$" size={130} color={C.positive} spin /> },
    { term: "Toutes choses égales par ailleurs", def: "Une relation mécanique, énoncée en gardant fixes les autres forces", at: cue("et toutes choses"), icon: <div style={{ transform: "scale(0.4)" }}><Seesaw tilt={8} width={700} /></div> },
  ];

  const activeIdx = TERMS.reduce((acc, t, i) => (frame >= t.at ? i : acc), -1);

  return (
    <SceneShell eyebrow="F6 · Vocabulaire" title="Le vocabulaire, en rafale" durationInFrames={durationInFrames}>
      {TERMS.map((t) => (
        <Sfx key={t.term} file="chime.wav" at={t.at - 2} volume={0.4} />
      ))}
      <div style={{ position: "absolute", left: 0, top: 0, width: STAGE_W, display: "flex", gap: 12, justifyContent: "center" }}>
        {TERMS.map((t, i) => (
          <div key={t.term} style={{ padding: "8px 18px", borderRadius: 999, border: `1.5px solid ${i <= activeIdx ? C.accent : C.hairline}`, color: i === activeIdx ? C.bg : i < activeIdx ? C.accentBright : C.textMuted, background: i === activeIdx ? C.accent : "transparent", fontSize: 18, fontWeight: 700 }}>
            {t.term}
          </div>
        ))}
      </div>
      {TERMS.map((t, i) => {
        if (i !== activeIdx) return null;
        const p = spring({ frame: frame - t.at, fps, config: theme.spring.smooth });
        return (
          <div key={t.term} style={{ position: "absolute", left: STAGE_W / 2 - 600, top: 110, width: 1200, opacity: p, transform: p > 0.995 ? "none" : `perspective(1200px) rotateY(${interpolate(p, [0, 1], [70, 0])}deg) scale(${interpolate(p, [0, 1], [0.85, 1])})` }}>
            <Panel glow style={{ display: "flex", alignItems: "center", gap: 50, padding: 50, minHeight: 380 }}>
              <div style={{ width: 340, height: 280, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>{t.icon}</div>
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
