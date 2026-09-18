import React from "react";
import { useCurrentFrame } from "remotion";
import { theme } from "../theme";
import { SceneContainer, Panel, Chip, fadeSlideIn, cueFrame } from "./shared";
import type { SceneProps } from "./shared";

// Factual note (verified this pass): F4 has no dedicated face component (no
// F4Face.tsx, unlike F2/F3) — apps/frontend/src/components/market/
// FamilyModule.tsx's FamilyContent router falls through to the generic
// DefaultContent for familyId === "F4". Per apps/backend/src/mock/
// fixtures.ts's F4 block, exactly 4 KPIs are visibility:"cockpit" (shown on
// the resting card, clickable): f4-core-cpi-mom (emphasis + consensus/
// previous/surprise), f4-core-cpi-yoy, f4-core-pce-mom (also consensus/
// previous/surprise), f4-core-pce-yoy. 5 more are visibility:"deep" (only in
// the family drawer): headline CPI MoM/YoY, headline PCE YoY, Core CPI 3M
// annualized, PPI final demand. apps/backend/src/real/f4Inflation.ts shows
// CPI/PPI come from BLS and PCE from BEA, both real with no external-link
// fallback needed (unlike F3's CME FedWatch case). apps/backend/src/
// intelligence/mechanical/rules.ts marks every "f4-*" entry mode:
// "CONTEXTUAL" with supportiveDirection: null — F4 never tints the card or
// shows a directional arrow, so the RelationshipChip stays neutral. This
// scene's visual mirrors exactly that: a façade panel with the 4 real
// cockpit rows, a deeper panel for the 5 drawer-only KPIs, and a neutral
// "contextuel" chip — never a colored favorable/unfavorable badge.
export const TerminalUsage: React.FC<SceneProps> = ({ subtitles }) => {
  const frame = useCurrentFrame();

  // Cue indices verified against audio/timeline.json:
  // chunk 3  "Core CPI mensuel et annuel"                 -> Core CPI rows
  // chunk 4  "Core PCE mensuel et annuel"                  -> Core PCE rows
  // chunk 5  "Clique sur un chiffre"                        -> click-hint caption
  // chunk 11 "le tiroir de la famille donne aussi"          -> deep panel
  // chunk 12 "le CPI global"                                -> deep row 1
  // chunk 13 "le PPI les prix côté producteurs"              -> deep row 2
  // chunk 14 "et la tendance sur trois mois annualisée"      -> deep row 3
  // chunk 18 "Toujours neutre contextuel"                    -> neutral chip
  // chunk 21 "À toi de vérifier ensuite comment les"          -> closing note
  const coreCpiAt = cueFrame(subtitles, 3);
  const corePceAt = cueFrame(subtitles, 4);
  const clickHintAt = cueFrame(subtitles, 5);
  const deepPanelAt = cueFrame(subtitles, 11);
  const deepRow1At = cueFrame(subtitles, 12);
  const deepRow2At = cueFrame(subtitles, 13);
  const deepRow3At = cueFrame(subtitles, 14);
  const chipAt = cueFrame(subtitles, 18);
  const noteAt = cueFrame(subtitles, 21);

  return (
    <SceneContainer eyebrow="F4 · Dans le terminal" title="4 chiffres Core sur la façade, jamais de badge coloré">
      <div style={{ display: "flex", gap: 40, alignItems: "flex-start", flexWrap: "wrap" }}>
        <div style={{ ...fadeSlideIn(frame, coreCpiAt, 4) }}>
          <Panel style={{ width: 470 }}>
            <div
              style={{
                color: theme.colors.textMuted,
                fontSize: 18,
                fontFamily: theme.mono,
                marginBottom: 14,
                letterSpacing: 2,
              }}
            >
              FAÇADE F4
            </div>
            <div style={{ opacity: frame >= coreCpiAt ? 1 : 0 }}>
              <FaceRow label="Core CPI (mensuel)" value="+ 0,3 %" accent />
              <FaceRow label="Core CPI (annuel)" value="+ 3,1 %" />
            </div>
            <div style={{ ...fadeSlideIn(frame, corePceAt, 10) }}>
              <FaceRow label="Core PCE (mensuel)" value="+ 0,2 %" accent />
              <FaceRow label="Core PCE (annuel)" value="+ 2,8 %" />
            </div>
            <div
              style={{
                ...fadeSlideIn(frame, clickHintAt, 12),
                marginTop: 16,
                color: theme.colors.textSecondary,
                fontSize: 18,
                lineHeight: 1.5,
              }}
            >
              Clique un chiffre → attendu, précédent, au-dessus / en dessous.
            </div>
          </Panel>
        </div>

        <div style={{ ...fadeSlideIn(frame, deepPanelAt, 16) }}>
          <Panel style={{ width: 470, borderColor: theme.colors.hairline }}>
            <div style={{ color: theme.colors.textMuted, fontSize: 18, fontFamily: theme.mono, marginBottom: 14, letterSpacing: 2 }}>
              EN PROFONDEUR (TIROIR)
            </div>
            <div style={{ ...fadeSlideIn(frame, deepRow1At, 10) }}>
              <FaceRow label="CPI global" value="MoM / YoY" />
            </div>
            <div style={{ ...fadeSlideIn(frame, deepRow2At, 10) }}>
              <FaceRow label="PPI (prix producteurs)" value="MoM" />
            </div>
            <div style={{ ...fadeSlideIn(frame, deepRow3At, 10) }}>
              <FaceRow label="Core CPI — tendance 3 mois" value="Annualisée" />
            </div>
          </Panel>
        </div>
      </div>

      <div style={{ ...fadeSlideIn(frame, chipAt, 16), marginTop: 40, display: "flex", alignItems: "center", gap: 20 }}>
        <Chip label="Toujours neutre — contextuel" tone="context" />
        <span style={{ color: theme.colors.textSecondary, fontSize: 20 }}>jamais favorable / défavorable</span>
      </div>

      <div
        style={{
          ...fadeSlideIn(frame, noteAt, 16),
          marginTop: 28,
          color: theme.colors.textSecondary,
          fontSize: 24,
          maxWidth: 1300,
          lineHeight: 1.5,
        }}
      >
        Vérifie toujours ensuite comment les taux, le dollar et les attentes de la banque centrale ont vraiment réagi.
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
      padding: "10px 0",
      borderBottom: `1px solid ${theme.colors.hairlineSoft}`,
    }}
  >
    <span style={{ color: theme.colors.textSecondary, fontSize: 21 }}>{label}</span>
    <span
      style={{
        color: accent ? theme.colors.accentBright : theme.colors.textPrimary,
        fontSize: 22,
        fontWeight: 700,
        fontFamily: theme.mono,
      }}
    >
      {value}
    </span>
  </div>
);
