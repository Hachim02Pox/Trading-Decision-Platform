import React from "react";
import { useCurrentFrame } from "remotion";
import { theme } from "../theme";
import { SceneContainer, Panel, fadeSlideIn, cueFrame } from "./shared";
import type { SceneProps } from "./shared";

// Cue indices verified against the actual generated audio/timeline.json
// (scene 02 — dxy-explained), not guessed:
// chunk 5  "l'euro le yen japonais"                 -> EUR + JPY chips
// chunk 6  "la livre sterling"                       -> GBP chip
// chunk 7  "le dollar canadien"                      -> CAD chip
// chunk 8  "la couronne suédoise et le franc suisse"  -> SEK + CHF chips
// chunk 10 "moyenne L'euro pèse beaucoup plus lourd"  -> EUR chip grows/emphasized
// chunk 19 "DXY son niveau"                           -> facade row 1 label
// chunk 20 "par exemple 104,62"                       -> facade row 1 value
// chunk 21 "sa variation du jour"                     -> facade row 2 label
// chunk 22 "disons moins 0,18 %"                      -> facade row 2 value
// chunk 23 "et sa variation sur cinq jours"           -> facade row 3 label
// chunk 24 "plus 0,42 % ici"                          -> facade row 3 value
// chunk 25 "Ces deux pourcentages peuvent aller..."   -> divergent-note panel
// chunk 30 "Et cette lecture vient directement..."    -> provenance caption
const CURRENCIES = [
  { code: "EUR", heavy: true },
  { code: "JPY", heavy: false },
  { code: "GBP", heavy: false },
  { code: "CAD", heavy: false },
  { code: "SEK", heavy: false },
  { code: "CHF", heavy: false },
];

export const DxyExplained: React.FC<SceneProps> = ({ subtitles }) => {
  const frame = useCurrentFrame();

  const eurJpyAt = cueFrame(subtitles, 5);
  const gbpAt = cueFrame(subtitles, 6);
  const cadAt = cueFrame(subtitles, 7);
  const sekChfAt = cueFrame(subtitles, 8);
  const heavyAt = cueFrame(subtitles, 10);

  const rowLabelAt = [cueFrame(subtitles, 19), cueFrame(subtitles, 21), cueFrame(subtitles, 23)];
  const rowValueAt = [cueFrame(subtitles, 20), cueFrame(subtitles, 22), cueFrame(subtitles, 24)];
  const divergentAt = cueFrame(subtitles, 25);
  const provenanceAt = cueFrame(subtitles, 30);

  const chipAt: Record<string, number> = {
    EUR: eurJpyAt,
    JPY: eurJpyAt,
    GBP: gbpAt,
    CAD: cadAt,
    SEK: sekChfAt,
    CHF: sekChfAt,
  };

  const rows = [
    { label: "DXY (niveau)", value: "104,62" },
    { label: "Today %", value: "-0,18 %" },
    { label: "5D %", value: "+0,42 %" },
  ];

  return (
    <SceneContainer eyebrow="F6 · Le DXY" title="Un panier de six monnaies, pas une moyenne">
      <div style={{ display: "flex", gap: 18, marginBottom: 48 }}>
        {CURRENCIES.map((c) => {
          const at = chipAt[c.code];
          const style = fadeSlideIn(frame, at, 14);
          const isHeavy = c.heavy && frame >= heavyAt;
          return (
            <div
              key={c.code}
              style={{
                ...style,
                width: isHeavy ? 118 : 84,
                height: isHeavy ? 84 : 60,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: `2px solid ${isHeavy ? theme.colors.accentBright : theme.colors.hairline}`,
                borderRadius: 14,
                background: isHeavy ? theme.colors.panelAlt : theme.colors.panel,
                color: isHeavy ? theme.colors.accentBright : theme.colors.textSecondary,
                fontFamily: theme.mono,
                fontSize: isHeavy ? 24 : 19,
                fontWeight: 700,
                transition: "none",
                alignSelf: "flex-end",
              }}
            >
              {c.code}
            </div>
          );
        })}
      </div>

      <div style={{ display: "flex", gap: 40, alignItems: "flex-start" }}>
        <Panel style={{ width: 460 }}>
          <div
            style={{
              color: theme.colors.textMuted,
              fontSize: 18,
              fontFamily: theme.mono,
              marginBottom: 14,
              letterSpacing: 1.5,
            }}
          >
            FAÇADE F6
          </div>
          {rows.map((row, i) => (
            <div
              key={row.label}
              style={{
                ...fadeSlideIn(frame, rowLabelAt[i], 10),
                display: "flex",
                justifyContent: "space-between",
                padding: "12px 0",
                borderBottom: i < rows.length - 1 ? `1px solid ${theme.colors.hairlineSoft}` : "none",
              }}
            >
              <span style={{ color: theme.colors.textSecondary, fontSize: 22 }}>{row.label}</span>
              <span
                style={{
                  ...fadeSlideIn(frame, rowValueAt[i], 8),
                  color: theme.colors.accentBright,
                  fontSize: 24,
                  fontWeight: 700,
                  fontFamily: theme.mono,
                }}
              >
                {row.value}
              </span>
            </div>
          ))}
        </Panel>

        <div style={{ ...fadeSlideIn(frame, divergentAt, 16), width: 460 }}>
          <Panel style={{ borderColor: theme.colors.context }}>
            <div style={{ color: theme.colors.context, fontSize: 19, fontFamily: theme.mono, marginBottom: 10 }}>
              PAS UNE ERREUR
            </div>
            <div style={{ color: theme.colors.textPrimary, fontSize: 23, lineHeight: 1.5 }}>
              Plus faible aujourd&apos;hui, plus fort sur cinq jours — deux horloges différentes
            </div>
          </Panel>
        </div>
      </div>

      <div
        style={{
          ...fadeSlideIn(frame, provenanceAt, 16),
          marginTop: 40,
          color: theme.colors.textSecondary,
          fontSize: 22,
          maxWidth: 1300,
          lineHeight: 1.5,
        }}
      >
        Lecture directe issue d&apos;une source publique gratuite — pas le flux officiel payant, mais fiable.
      </div>
    </SceneContainer>
  );
};
