import React from "react";
import { useCurrentFrame } from "remotion";
import { theme } from "../theme";
import { SceneContainer, Panel, fadeSlideIn, cueFrame, WorkerIcon, ExternalLinkIcon } from "./shared";
import type { SceneProps } from "./shared";

// Factual note (verified against apps/backend/src/real/f5Employment.ts,
// apps/frontend/src/components/market/FamilyModule.tsx, apps/backend/src/mock/
// fixtures.ts, apps/backend/src/intelligence/mechanical/rules.ts, apps/frontend/
// src/content/externalSourceLinks.ts):
// - F5 has NO dedicated face component (unlike F3FedFace/F2RatesFace) — it
//   falls through FamilyModule's FamilyContent to the generic DefaultContent
//   renderer, i.e. cockpit KPI tiles + a click-to-open detail drawer.
// - Directly visible on the card (visibility: "cockpit"): Unemployment Rate
//   (f5-unemployment), Payrolls Latest with its consensus/surprise badge
//   (f5-payrolls-latest), and GDPNow (f5-gdpnow, a continuously-updated
//   growth nowcast).
// - In the drawer (visibility: "deep"/"event"): 3-month payrolls average,
//   weekly initial/continuing jobless claims (+4-week average), average
//   hourly earnings, 2-month net revision.
// - ISM services/manufacturing are UNAVAILABLE in-house (NO_SOURCE, no free
//   data source) and only reachable via an external link to
//   tradingeconomics.com — same "external link, not a fake in-terminal
//   number" pattern as F3's CME FedWatch link.
// - rules.ts marks every F5 KPI CONTEXTUAL with supportiveDirection: null —
//   F5 never renders a favorable/adverse tag on its own.
export const TerminalUsage: React.FC<SceneProps> = ({ subtitles }) => {
  const frame = useCurrentFrame();

  const cardAt = cueFrame(subtitles, 1);
  const unemploymentAt = cueFrame(subtitles, 2);
  const payrollsAt = cueFrame(subtitles, 3);
  const gdpNowAt = cueFrame(subtitles, 5);
  const drawerAt = cueFrame(subtitles, 8);
  const avg3mAt = cueFrame(subtitles, 9);
  const claimsAt = cueFrame(subtitles, 10);
  const wagesAt = cueFrame(subtitles, 11);
  const externalAt = cueFrame(subtitles, 15);
  const noTagAt = cueFrame(subtitles, 17);
  const checkFedAt = cueFrame(subtitles, 19);

  return (
    <SceneContainer eyebrow="F5 · Dans le terminal" title="Ce que la carte affiche, et ce qu'il y a dans le tiroir">
      <div style={{ display: "flex", gap: 32, alignItems: "flex-start", flexWrap: "wrap" }}>
        <div style={{ ...fadeSlideIn(frame, cardAt, 14) }}>
          <Panel style={{ width: 400 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                color: theme.colors.textMuted,
                fontSize: 17,
                fontFamily: theme.mono,
                marginBottom: 12,
              }}
            >
              <WorkerIcon size={22} color={theme.colors.textMuted} />
              CARTE F5
            </div>
            <div style={{ ...fadeSlideIn(frame, unemploymentAt, 10) }}>
              <FaceRow label="Taux de chômage" value="4,1 %" />
            </div>
            <div style={{ ...fadeSlideIn(frame, payrollsAt, 10) }}>
              <FaceRow label="Emplois créés" value="142k (vs 150k att.)" accent />
            </div>
            <div style={{ ...fadeSlideIn(frame, gdpNowAt, 10) }}>
              <FaceRow label="GDPNow" value="2,3 %" accent />
            </div>
          </Panel>
        </div>

        <div style={{ ...fadeSlideIn(frame, drawerAt, 14) }}>
          <Panel style={{ width: 400 }}>
            <div
              style={{
                color: theme.colors.textMuted,
                fontSize: 17,
                fontFamily: theme.mono,
                marginBottom: 12,
              }}
            >
              DANS LE TIROIR
            </div>
            <div style={{ ...fadeSlideIn(frame, avg3mAt, 10) }}>
              <FaceRow label="Moyenne 3 mois" value="128k" />
            </div>
            <div style={{ ...fadeSlideIn(frame, claimsAt, 10) }}>
              <FaceRow label="Inscriptions chômage" value="224k" />
            </div>
            <div style={{ ...fadeSlideIn(frame, wagesAt, 10) }}>
              <FaceRow label="Salaires / Révision 2M" value="+0,3 % / −25k" />
            </div>
          </Panel>
        </div>

        <div style={{ ...fadeSlideIn(frame, externalAt, 16) }}>
          <Panel style={{ width: 400, borderColor: theme.colors.accent }}>
            <div style={{ color: theme.colors.accent, fontSize: 17, fontFamily: theme.mono, marginBottom: 12 }}>
              POUR ALLER PLUS LOIN
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <ExternalLinkIcon size={20} color={theme.colors.accentBright} />
              <span style={{ color: theme.colors.textPrimary, fontSize: 21, fontWeight: 700 }}>
                Enquêtes auprès des entreprises
              </span>
            </div>
            <div style={{ color: theme.colors.textSecondary, fontSize: 18, marginTop: 10, lineHeight: 1.5 }}>
              Pas encore de source directe gratuite dans le terminal — lien externe.
            </div>
          </Panel>
        </div>
      </div>

      <div
        style={{
          ...fadeSlideIn(frame, noTagAt, 16),
          marginTop: 40,
          color: theme.colors.context,
          fontSize: 24,
          maxWidth: 1350,
          lineHeight: 1.5,
        }}
      >
        F5 n&apos;affiche jamais d&apos;étiquette favorable ou défavorable pour l&apos;or, toute seule.
      </div>
      <div
        style={{
          ...fadeSlideIn(frame, checkFedAt, 16),
          marginTop: 10,
          color: theme.colors.textSecondary,
          fontSize: 22,
          maxWidth: 1350,
          lineHeight: 1.5,
        }}
      >
        Il faut toujours vérifier ensuite la réaction de la Fed, des taux, et du dollar.
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
      gap: 16,
    }}
  >
    <span style={{ color: theme.colors.textSecondary, fontSize: 19 }}>{label}</span>
    <span
      style={{
        color: accent ? theme.colors.accentBright : theme.colors.textPrimary,
        fontSize: 20,
        fontWeight: 700,
        fontFamily: theme.mono,
        whiteSpace: "nowrap",
      }}
    >
      {value}
    </span>
  </div>
);
