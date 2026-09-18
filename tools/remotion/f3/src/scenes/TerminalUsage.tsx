import React from "react";
import { useCurrentFrame, interpolate } from "remotion";
import { theme } from "../theme";
import { SceneContainer, Panel, fadeSlideIn, cueFrame, FedBuildingIcon, ClockIcon, ExternalLinkIcon } from "./shared";
import type { SceneProps } from "./shared";

// Factual note (round-3 fix): the terminal does NOT have a detail drawer
// showing "the full 6-month path" — that KPI (f3-path-6m) is UNAVAILABLE
// (no free data source). What F3FedFace.tsx actually renders, directly on
// the resting face with no click needed, is: the target range, the most
// likely next-meeting outcome ("Next"), its probability, and a
// previous-probability -> current-probability arrow when the read is
// fresh. Going further than that means leaving the terminal entirely, via
// the external CME FedWatch link (externalSourceLinks.ts). This scene's
// visual mirrors exactly that: facade rows, then an external-link chip —
// never a fake in-terminal trajectory chart.
export const TerminalUsage: React.FC<SceneProps> = ({ subtitles }) => {
  const frame = useCurrentFrame();

  // Cue indices re-verified against the round-4 (fr-FR-DeniseNeural) audio:
  // the new voice splits "la prochaine réunion et sa probabilité" into two
  // separate chunks (it was one chunk with the old Canadian-voice audio),
  // which shifted every subsequent chunk index by +1.
  // chunk 1 "F3 affiche la fourchette actuelle de la..." -> target range row
  // chunk 2 "Fed le scénario le plus probable pour..."  -> Next row
  // chunk 4 "et sa probabilité"                          -> Probability row
  // chunk 5 "avec une flèche qui montre si elle..."      -> previous->current arrow
  // chunk 8 "un lien renvoie vers CME FedWatch"           -> external link chip
  // chunk 9 "la référence externe gratuite qui suit ça"   -> caption under the chip
  const targetAt = cueFrame(subtitles, 1);
  const nextAt = cueFrame(subtitles, 2);
  const probabilityAt = cueFrame(subtitles, 4);
  const arrowAt = cueFrame(subtitles, 5);
  const linkAt = cueFrame(subtitles, 8);
  const linkCaptionAt = cueFrame(subtitles, 9);

  const arrowOpacity = interpolate(frame, [arrowAt, arrowAt + 12], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <SceneContainer eyebrow="F3 · Dans le terminal" title="Ce que la façade affiche, sans rien ouvrir">
      <div style={{ display: "flex", gap: 40, alignItems: "flex-start", flexWrap: "wrap" }}>
        <div style={{ ...fadeSlideIn(frame, targetAt, 4) }}>
          <Panel style={{ width: 460 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                color: theme.colors.textMuted,
                fontSize: 18,
                fontFamily: theme.mono,
                marginBottom: 14,
              }}
            >
              <FedBuildingIcon size={24} color={theme.colors.textMuted} />
              FAÇADE F3
            </div>
            <div style={{ opacity: frame >= targetAt ? 1 : 0 }}>
              <FaceRow label="Fourchette cible" value="4,25–4,50 %" />
            </div>
            <div style={{ ...fadeSlideIn(frame, nextAt, 10) }}>
              <FaceRow label="Prochaine réunion (Next)" value="Petite baisse" accent />
            </div>
            <div style={{ ...fadeSlideIn(frame, probabilityAt, 10) }}>
              <FaceRow
                label={
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                    Probabilité
                    <span style={{ opacity: arrowOpacity, display: "inline-flex" }}>
                      <ClockIcon size={18} color={theme.colors.context} />
                    </span>
                  </span>
                }
                value={
                  <>
                    <span style={{ opacity: arrowOpacity }}>
                      <span style={{ color: theme.colors.textMuted }}>55 %</span>{" "}
                      <span style={{ color: theme.colors.accent }}>→</span>{" "}
                    </span>
                    <span>60 %</span>
                  </>
                }
                accent
              />
            </div>
          </Panel>
        </div>

        <div style={{ ...fadeSlideIn(frame, linkAt, 16) }}>
          <Panel style={{ width: 460, borderColor: theme.colors.accent }}>
            <div style={{ color: theme.colors.accent, fontSize: 18, fontFamily: theme.mono, marginBottom: 14 }}>
              POUR ALLER PLUS LOIN
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <ExternalLinkIcon size={22} color={theme.colors.accentBright} />
              <span style={{ color: theme.colors.textPrimary, fontSize: 24, fontWeight: 700 }}>CME FedWatch</span>
            </div>
            <div
              style={{
                ...fadeSlideIn(frame, linkCaptionAt, 12),
                color: theme.colors.textSecondary,
                fontSize: 19,
                marginTop: 12,
                lineHeight: 1.5,
              }}
            >
              Référence externe gratuite, suivie en direct — hors du terminal.
            </div>
          </Panel>
        </div>
      </div>

      <div
        style={{
          ...fadeSlideIn(frame, arrowAt + 14, 16),
          marginTop: 48,
          color: theme.colors.textSecondary,
          fontSize: 25,
          maxWidth: 1250,
          lineHeight: 1.5,
        }}
      >
        Fourchette, scénario le plus probable, probabilité — tout est déjà sur la façade, sans rien ouvrir.
      </div>
    </SceneContainer>
  );
};

const FaceRow: React.FC<{ label: React.ReactNode; value: React.ReactNode; accent?: boolean }> = ({
  label,
  value,
  accent,
}) => (
  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      padding: "12px 0",
      borderBottom: `1px solid ${theme.colors.hairlineSoft}`,
    }}
  >
    <span style={{ color: theme.colors.textSecondary, fontSize: 22 }}>{label}</span>
    <span
      style={{
        color: accent ? theme.colors.accentBright : theme.colors.textPrimary,
        fontSize: 24,
        fontWeight: 700,
        fontFamily: theme.mono,
      }}
    >
      {value}
    </span>
  </div>
);
