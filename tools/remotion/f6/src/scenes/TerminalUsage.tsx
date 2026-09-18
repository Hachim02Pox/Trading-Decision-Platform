import React from "react";
import { useCurrentFrame } from "remotion";
import { theme } from "../theme";
import { SceneContainer, Panel, fadeSlideIn, cueFrame } from "./shared";
import type { SceneProps } from "./shared";

// Factual note, verified against the real code (not guessed):
// - apps/backend/src/real/f6Currency.ts: F6's 3 cockpit KPIs (DXY level,
//   Today %, 5D %) are a DIRECT read of the ICE US Dollar Index via
//   Yahoo Finance's public/unofficial chart endpoint — no key required, not
//   the licensed ICE feed. If the fetch fails, all 4 KPIs go UNAVAILABLE,
//   never a silent fallback to a stale reconstruction.
// - apps/backend/src/mock/fixtures.ts (~L548-610): the resting F6 card
//   shows EXACTLY those 3 numbers (104.62 / -0.18% / +0.42%, matching the
//   "divergent clocks" example from scene 02). The 4th KPI, "USD State"
//   ("Divergent: weaker intraday, firmer over 5 days"), was moved OFF the
//   cockpit (Milestone 1D) — it only appears one click away, in the family
//   drawer.
// - apps/frontend/src/components/market/FamilyModule.tsx: F6 has no
//   dedicated face component (no F6*.tsx) — it falls through to
//   `DefaultContent`, the generic renderer every faceless family shares.
//   That renders the cockpit KPIs, then a footer `RelationshipChip`
//   (Favorable / Défavorable / Contextuel — apps/frontend/src/i18n/fr.ts)
//   driven by the deterministic mechanical read
//   (apps/backend/src/intelligence/mechanical/rules.ts: DXY down =
//   favorable to Gold, DXY up = adverse; "USD State" itself is purely
//   contextual, never fed back into that mechanical read).
// - apps/frontend/src/content/externalSourceLinks.ts: no entry for F6 at
//   all — unlike F3's CME FedWatch link, F6 never points outside the
//   terminal. This scene intentionally shows NO external-link chip.
//
// Cue indices verified against the actual generated audio/timeline.json
// (scene 04 — terminal-usage):
// chunk 2  "le niveau du DXY"                         -> facade row 1
// chunk 3  "sa variation du jour"                     -> facade row 2
// chunk 4  "et sa variation sur cinq jours"           -> facade row 3
// chunk 6  "En cliquant sur la carte"                 -> drawer panel appears
// chunk 9  "un état du dollar qui dit divergent"      -> USD State line
// chunk 14 "une étiquette de couleur résume le lien"  -> chip row appears
// chunk 17 "favorable défavorable ou contextuel"      -> 3 chips revealed, Contextuel highlighted
// chunk 19 "Contrairement à d'autres familles..."     -> "no external link" caption
export const TerminalUsage: React.FC<SceneProps> = ({ subtitles }) => {
  const frame = useCurrentFrame();

  const row1At = cueFrame(subtitles, 2);
  const row2At = cueFrame(subtitles, 3);
  const row3At = cueFrame(subtitles, 4);
  const drawerAt = cueFrame(subtitles, 6);
  const stateAt = cueFrame(subtitles, 9);
  const chipRowAt = cueFrame(subtitles, 14);
  const chipsAt = cueFrame(subtitles, 17);
  const noExternalAt = cueFrame(subtitles, 19);

  const rows = [
    { label: "DXY (niveau)", value: "104,62", at: row1At },
    { label: "Today %", value: "-0,18 %", at: row2At },
    { label: "5D %", value: "+0,42 %", at: row3At },
  ];

  const chips: Array<{ label: string; tone: keyof typeof theme.colors; active: boolean }> = [
    { label: "Favorable", tone: "positive", active: false },
    { label: "Défavorable", tone: "negative", active: false },
    { label: "Contextuel", tone: "context", active: true },
  ];

  return (
    <SceneContainer eyebrow="F6 · Dans le terminal" title="Ce que la carte affiche vraiment">
      <div style={{ display: "flex", gap: 40, alignItems: "flex-start", flexWrap: "wrap" }}>
        <Panel style={{ width: 440 }}>
          <div
            style={{
              color: theme.colors.textMuted,
              fontSize: 18,
              fontFamily: theme.mono,
              marginBottom: 14,
              letterSpacing: 1.5,
            }}
          >
            CARTE F6 (AU REPOS)
          </div>
          {rows.map((row, i) => (
            <div
              key={row.label}
              style={{
                ...fadeSlideIn(frame, row.at, 10),
                display: "flex",
                justifyContent: "space-between",
                padding: "12px 0",
                borderBottom: i < rows.length - 1 ? `1px solid ${theme.colors.hairlineSoft}` : "none",
              }}
            >
              <span style={{ color: theme.colors.textSecondary, fontSize: 22 }}>{row.label}</span>
              <span style={{ color: theme.colors.accentBright, fontSize: 24, fontWeight: 700, fontFamily: theme.mono }}>
                {row.value}
              </span>
            </div>
          ))}
        </Panel>

        <div style={{ ...fadeSlideIn(frame, drawerAt, 18) }}>
          <Panel style={{ width: 440, borderColor: theme.colors.context }}>
            <div style={{ color: theme.colors.context, fontSize: 18, fontFamily: theme.mono, marginBottom: 14 }}>
              TIROIR (UN CLIC)
            </div>
            <div style={{ ...fadeSlideIn(frame, stateAt, 14) }}>
              <div style={{ color: theme.colors.textSecondary, fontSize: 18, marginBottom: 6 }}>USD State</div>
              <div style={{ color: theme.colors.textPrimary, fontSize: 21, lineHeight: 1.4 }}>
                Divergent : plus faible aujourd&apos;hui, plus fort sur cinq jours
              </div>
            </div>
          </Panel>
        </div>
      </div>

      <div style={{ ...fadeSlideIn(frame, chipRowAt, 16), marginTop: 40 }}>
        <div style={{ color: theme.colors.textSecondary, fontSize: 20, marginBottom: 14 }}>
          En pied de carte, le lien mécanique avec l&apos;or, à cet instant
        </div>
        <div style={{ display: "flex", gap: 16 }}>
          {chips.map((chip) => {
            const visible = frame >= chipsAt;
            const isActive = visible && chip.active;
            return (
              <span
                key={chip.label}
                style={{
                  opacity: visible ? 1 : 0,
                  display: "inline-block",
                  border: `1px solid ${theme.colors[chip.tone]}`,
                  color: theme.colors[chip.tone],
                  background: isActive ? "rgba(255,255,255,0.06)" : "transparent",
                  borderRadius: 999,
                  padding: "10px 22px",
                  fontSize: 21,
                  fontFamily: theme.mono,
                  fontWeight: isActive ? 700 : 400,
                }}
              >
                {chip.label}
              </span>
            );
          })}
        </div>
      </div>

      <div
        style={{
          ...fadeSlideIn(frame, noExternalAt, 16),
          marginTop: 40,
          color: theme.colors.textSecondary,
          fontSize: 24,
          maxWidth: 1300,
          lineHeight: 1.5,
        }}
      >
        Contrairement à d&apos;autres familles du terminal, ici pas besoin d&apos;aller voir ailleurs — tout vient d&apos;une lecture directe.
      </div>
    </SceneContainer>
  );
};
