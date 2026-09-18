import React from "react";
import { useCurrentFrame } from "remotion";
import { theme } from "../theme";
import { SceneContainer, Panel, Chip, fadeSlideIn, cueFrame, BasketIcon } from "./shared";
import type { SceneProps } from "./shared";

// Cue indices verified against audio/timeline.json (fr-FR-DeniseNeural, -2%):
// chunk 1  "américains Le CPI"                          -> CPI global panel
// chunk 7  "l'alimentation et l'énergie"                 -> food+energy struck through
// chunk 9  "Core CPI qui retire ces deux catégories"      -> Core CPI panel
// chunk 12 "PCE une mesure un peu plus large"             -> PCE chip
// chunk 16 "Imaginons Hachim fait ses courses..."         -> basket icon + Hachim setup
// chunk 17 "Ce mois-ci son panier coûte 0,3 % de"         -> monthly value
// chunk 19 "Ça c'est le rythme mensuel"                   -> monthly label
// chunk 22 "ses courses coûtent environ 3 % de plus"      -> yearly value
// chunk 23 "Ça c'est le rythme annuel"                    -> yearly label
export const HeadlineVsCore: React.FC<SceneProps> = ({ subtitles }) => {
  const frame = useCurrentFrame();

  const cpiAt = cueFrame(subtitles, 1);
  const excludedAt = cueFrame(subtitles, 7);
  const coreAt = cueFrame(subtitles, 9);
  const pceAt = cueFrame(subtitles, 12);
  const hachimAt = cueFrame(subtitles, 16);
  const monthlyValueAt = cueFrame(subtitles, 17);
  const monthlyLabelAt = cueFrame(subtitles, 19);
  const yearlyValueAt = cueFrame(subtitles, 22);
  const yearlyLabelAt = cueFrame(subtitles, 23);

  return (
    <SceneContainer eyebrow="F4 · CPI, Core, PCE" title="Le chiffre global cache la tendance de fond">
      <div style={{ display: "flex", gap: 40, alignItems: "stretch" }}>
        <div style={{ ...fadeSlideIn(frame, cpiAt, 14), flex: 1 }}>
          <Panel style={{ height: "100%" }}>
            <div style={{ color: theme.colors.textMuted, fontFamily: theme.mono, fontSize: 18, letterSpacing: 2, marginBottom: 14 }}>
              CPI GLOBAL
            </div>
            <div style={{ color: theme.colors.textPrimary, fontSize: 24, lineHeight: 1.6 }}>
              Tout le panier des ménages, y compris…
            </div>
            <div style={{ display: "flex", gap: 14, marginTop: 14 }}>
              <span
                style={{
                  ...fadeSlideIn(frame, excludedAt, 12),
                  color: theme.colors.textMuted,
                  fontSize: 22,
                  textDecoration: "line-through",
                  textDecorationColor: theme.colors.negative,
                }}
              >
                Alimentation
              </span>
              <span
                style={{
                  ...fadeSlideIn(frame, excludedAt, 12),
                  color: theme.colors.textMuted,
                  fontSize: 22,
                  textDecoration: "line-through",
                  textDecorationColor: theme.colors.negative,
                }}
              >
                Énergie
              </span>
            </div>
          </Panel>
        </div>

        <div style={{ ...fadeSlideIn(frame, coreAt, 14), flex: 1 }}>
          <Panel style={{ height: "100%", borderColor: theme.colors.accent }}>
            <div style={{ color: theme.colors.accent, fontFamily: theme.mono, fontSize: 18, letterSpacing: 2, marginBottom: 14 }}>
              CORE CPI
            </div>
            <div style={{ color: theme.colors.textPrimary, fontSize: 24, lineHeight: 1.6 }}>
              Le même panier, sans alimentation ni énergie
            </div>
            <div style={{ color: theme.colors.accentBright, fontSize: 20, marginTop: 14, fontWeight: 600 }}>
              → la tendance de fond, plus stable
            </div>
          </Panel>
        </div>
      </div>

      <div style={{ ...fadeSlideIn(frame, pceAt, 14), marginTop: 24 }}>
        <Chip label="PCE — objectif d'inflation de la banque centrale" tone="context" />
      </div>

      <div style={{ marginTop: 52, display: "flex", alignItems: "center", gap: 36 }}>
        <div style={{ ...fadeSlideIn(frame, hachimAt, 16) }}>
          <BasketIcon size={64} />
        </div>
        <div style={{ ...fadeSlideIn(frame, hachimAt, 16), color: theme.colors.textPrimary, fontSize: 26, maxWidth: 520, lineHeight: 1.45 }}>
          Hachim fait ses courses chaque mois.
        </div>

        <div style={{ display: "flex", gap: 24 }}>
          <div style={{ ...fadeSlideIn(frame, monthlyValueAt, 14) }}>
            <Panel style={{ padding: "18px 26px", minWidth: 200 }}>
              <div style={{ color: theme.colors.textPrimary, fontFamily: theme.mono, fontSize: 30, fontWeight: 700 }}>
                + 0,3 %
              </div>
              <div style={{ ...fadeSlideIn(frame, monthlyLabelAt, 12), color: theme.colors.textSecondary, fontSize: 18, marginTop: 8 }}>
                rythme mensuel
              </div>
            </Panel>
          </div>
          <div style={{ ...fadeSlideIn(frame, yearlyValueAt, 14) }}>
            <Panel style={{ padding: "18px 26px", minWidth: 200, borderColor: theme.colors.context }}>
              <div style={{ color: theme.colors.textPrimary, fontFamily: theme.mono, fontSize: 30, fontWeight: 700 }}>
                + 3 %
              </div>
              <div style={{ ...fadeSlideIn(frame, yearlyLabelAt, 12), color: theme.colors.textSecondary, fontSize: 18, marginTop: 8 }}>
                rythme annuel
              </div>
            </Panel>
          </div>
        </div>
      </div>
    </SceneContainer>
  );
};
