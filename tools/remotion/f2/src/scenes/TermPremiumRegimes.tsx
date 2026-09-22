import React from "react";
import { theme } from "../theme";
import { SceneContainer, Panel, Entrance, Sfx, cueWord } from "./shared";
import type { SceneProps } from "./shared";

const Arrow: React.FC<{ up: boolean; fast: boolean; color: string }> = ({ up, fast, color }) => (
  <svg width={30} height={44} viewBox="0 0 30 44" style={{ transform: up ? "none" : "rotate(180deg)" }}>
    <path
      d="M15 40 V4 M15 4 L6 14 M15 4 L24 14"
      stroke={color}
      strokeWidth={fast ? 4.5 : 2.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  </svg>
);

const RegimeCell: React.FC<{
  delay: number;
  title: string;
  shortUp: boolean;
  shortFast: boolean;
  longUp: boolean;
  longFast: boolean;
  cause: string;
}> = ({ delay, title, shortUp, shortFast, longUp, longFast, cause }) => (
  <Entrance delay={delay} y={34}>
    <Panel style={{ width: 400 }}>
      <div style={{ color: theme.colors.textPrimary, fontSize: 21, fontWeight: 700, marginBottom: 16 }}>{title}</div>
      <div style={{ display: "flex", gap: 30, alignItems: "flex-end", marginBottom: 14 }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
          <Arrow up={shortUp} fast={shortFast} color={theme.colors.context} />
          <span style={{ color: theme.colors.textMuted, fontSize: 15, fontFamily: theme.mono }}>COURT</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
          <Arrow up={longUp} fast={longFast} color={theme.colors.accent} />
          <span style={{ color: theme.colors.textMuted, fontSize: 15, fontFamily: theme.mono }}>LONG</span>
        </div>
      </div>
      <div style={{ color: theme.colors.textSecondary, fontSize: 17, lineHeight: 1.45 }}>{cause}</div>
    </Panel>
  </Entrance>
);

export const TermPremiumRegimes: React.FC<SceneProps> = ({ subtitles, durationInFrames }) => {
  const premiumAt = cueWord(subtitles, "sorte de prime");
  const growthAt = cueWord(subtitles, "croissance plus faible");
  const hawkishAt = cueWord(subtitles, "banque centrale plus stricte");
  const easingAt = cueWord(subtitles, "assouplissement attendu");
  const longUpAt = cueWord(subtitles, "taux longs qui montent");

  return (
    <SceneContainer eyebrow="F2 · Prime de terme" title="Même chiffre, causes différentes" durationInFrames={durationInFrames}>
      <Sfx file="whoosh.wav" at={premiumAt} volume={0.45} />
      <Sfx file="pop.wav" at={growthAt} volume={0.4} />
      <Sfx file="pop.wav" at={hawkishAt} volume={0.4} />
      <Sfx file="pop.wav" at={easingAt} volume={0.4} />
      <Sfx file="bass.wav" at={longUpAt} volume={0.5} />

      <Entrance delay={premiumAt} y={20}>
        <p style={{ color: theme.colors.textSecondary, fontSize: 22, maxWidth: 1400, marginBottom: 34, lineHeight: 1.45 }}>
          Le taux long n&apos;est pas qu'une moyenne des taux courts attendus — il porte aussi une prime pour l&apos;incertitude,
          estimée par modèle, jamais observée directement.
        </p>
      </Entrance>

      <div style={{ display: "grid", gridTemplateColumns: "400px 400px", gap: 24 }}>
        <RegimeCell
          delay={growthAt}
          title="Les deux baissent, le long plus vite"
          shortUp={false}
          shortFast={false}
          longUp={false}
          longFast={true}
          cause="Souvent lié à une croissance attendue plus faible"
        />
        <RegimeCell
          delay={hawkishAt}
          title="Le court monte plus vite"
          shortUp={true}
          shortFast={true}
          longUp={true}
          longFast={false}
          cause="Souvent lié à une banque centrale plus stricte"
        />
        <RegimeCell
          delay={easingAt}
          title="Le court baisse plus vite"
          shortUp={false}
          shortFast={true}
          longUp={false}
          longFast={false}
          cause="Souvent cohérent avec un assouplissement attendu"
        />
        <RegimeCell
          delay={longUpAt}
          title="Le long monte plus vite"
          shortUp={true}
          shortFast={false}
          longUp={true}
          longFast={true}
          cause="Croissance, inflation, ou prime de terme — à vérifier"
        />
      </div>
    </SceneContainer>
  );
};
