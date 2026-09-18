import React from "react";
import { useCurrentFrame } from "remotion";
import { theme } from "../theme";
import { SceneContainer, Panel, fadeSlideIn, cueFrame, GoldIcon } from "./shared";
import type { SceneProps } from "./shared";

// Cue indices verified against the actual generated audio/timeline.json
// (scene 03 — trap-example), not guessed:
// chunk 0  "Voici le lien entre dollar et or"        -> setup panel ("or coté en dollars")
// chunk 6  "Imaginons Hachim veut acheter une once d'or" -> Hachim example begins, $2400 panel
// chunk 9  "euro cette once lui coûte environ 2182 euros" -> left column (1,10 -> ~2182 €)
// chunk 16 "environ 2286 euros"                       -> right column (1,05 -> ~2286 €)
// chunk 17 "presque 5 % de plus"                      -> delta badge
// chunk 19 "Voilà le piège classique"                 -> trap panel
// chunk 24 "aussi monter ensemble"                    -> counter-example 1 (joint rally)
// chunk 28 "ou si la demande physique reste forte"    -> counter-example 2 (Gold resists)
// chunk 30 "c'est une tendance observée"               -> closing note
export const TrapExample: React.FC<SceneProps> = ({ subtitles }) => {
  const frame = useCurrentFrame();

  const setupAt = cueFrame(subtitles, 0);
  const hachimAt = cueFrame(subtitles, 6);
  const leftColAt = cueFrame(subtitles, 9);
  const rightColAt = cueFrame(subtitles, 16);
  const deltaAt = cueFrame(subtitles, 17);
  const trapAt = cueFrame(subtitles, 19);
  const counter1At = cueFrame(subtitles, 24);
  const counter2At = cueFrame(subtitles, 28);
  const closingAt = cueFrame(subtitles, 30);

  return (
    <SceneContainer eyebrow="F6 · Un piège classique" title="Un dollar fort n'est jamais automatiquement mauvais pour l'or">
      <div style={{ ...fadeSlideIn(frame, setupAt, 16), marginBottom: 28 }}>
        <Panel style={{ display: "inline-flex", alignItems: "center", gap: 16, padding: "18px 30px" }}>
          <GoldIcon size={30} color={theme.colors.accent} />
          <span style={{ color: theme.colors.textPrimary, fontSize: 25, fontFamily: theme.mono }}>
            L&apos;or est coté en dollars
          </span>
        </Panel>
      </div>

      <div style={{ ...fadeSlideIn(frame, hachimAt, 16), marginBottom: 16 }}>
        <span style={{ color: theme.colors.textSecondary, fontSize: 24 }}>
          Hachim veut une once d&apos;or à{" "}
          <span style={{ color: theme.colors.accentBright, fontFamily: theme.mono, fontWeight: 700 }}>2 400 $</span>
          , et raisonne en euros
        </span>
      </div>

      <div style={{ display: "flex", gap: 32 }}>
        <div style={{ ...fadeSlideIn(frame, leftColAt, 16), flex: 1 }}>
          <Panel>
            <div style={{ color: theme.colors.textMuted, fontFamily: theme.mono, fontSize: 18, marginBottom: 10 }}>
              1,10 $ POUR 1 €
            </div>
            <div style={{ color: theme.colors.textPrimary, fontSize: 30, fontWeight: 700, fontFamily: theme.mono }}>
              ≈ 2 182 €
            </div>
          </Panel>
        </div>
        <div style={{ ...fadeSlideIn(frame, rightColAt, 16), flex: 1 }}>
          <Panel style={{ borderColor: theme.colors.accent }}>
            <div style={{ color: theme.colors.accent, fontFamily: theme.mono, fontSize: 18, marginBottom: 10 }}>
              1,05 $ POUR 1 € (EURO PLUS FAIBLE)
            </div>
            <div style={{ color: theme.colors.accentBright, fontSize: 30, fontWeight: 700, fontFamily: theme.mono }}>
              ≈ 2 286 €
            </div>
          </Panel>
        </div>
        <div style={{ ...fadeSlideIn(frame, deltaAt, 14), display: "flex", alignItems: "center" }}>
          <div
            style={{
              border: `1px solid ${theme.colors.negative}`,
              color: theme.colors.negative,
              borderRadius: 999,
              padding: "10px 20px",
              fontFamily: theme.mono,
              fontSize: 20,
              whiteSpace: "nowrap",
            }}
          >
            +4,8 % en €, 0 % en $
          </div>
        </div>
      </div>

      <div style={{ ...fadeSlideIn(frame, trapAt, 16), marginTop: 32 }}>
        <Panel style={{ display: "inline-block", padding: "16px 28px", borderColor: theme.colors.textMuted }}>
          <span style={{ color: theme.colors.textSecondary, fontSize: 24, fontStyle: "italic" }}>
            Le piège : croire qu&apos;un dollar fort = un or toujours en baisse
          </span>
        </Panel>
      </div>

      <div style={{ display: "flex", gap: 28, marginTop: 24 }}>
        <div style={{ ...fadeSlideIn(frame, counter1At, 16), flex: 1 }}>
          <Panel style={{ borderColor: theme.colors.positive, height: "100%" }}>
            <span style={{ color: theme.colors.positive, fontSize: 22, fontWeight: 600, lineHeight: 1.4 }}>
              Or et dollar peuvent monter ensemble, en cas de peur sur les marchés
            </span>
          </Panel>
        </div>
        <div style={{ ...fadeSlideIn(frame, counter2At, 16), flex: 1 }}>
          <Panel style={{ borderColor: theme.colors.positive, height: "100%" }}>
            <span style={{ color: theme.colors.positive, fontSize: 22, fontWeight: 600, lineHeight: 1.4 }}>
              L&apos;or peut résister à un dollar fort, si les taux réels baissent ou la demande reste forte
            </span>
          </Panel>
        </div>
      </div>

      <div
        style={{
          ...fadeSlideIn(frame, closingAt, 16),
          marginTop: 28,
          color: theme.colors.textSecondary,
          fontSize: 24,
          maxWidth: 1300,
          lineHeight: 1.4,
        }}
      >
        Une tendance observée, jamais une loi absolue.
      </div>
    </SceneContainer>
  );
};
