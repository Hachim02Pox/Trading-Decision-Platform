import type { FamilyId, QualityState } from "@gold-terminal/contracts";
import { useTranslation, type TranslateFn } from "@/i18n/useTranslation";
import styles from "./FreshnessDot.module.css";

interface FreshnessDotProps {
  quality: QualityState;
  familyId: FamilyId;
  /**
   * Renders just the dot (no caption text) for inline per-KPI use, e.g.
   * next to a single row inside a family module that mixes REAL and MOCK
   * KPIs. Uses the exact same color/dot vocabulary as the full family-level
   * indicator (Section 18 of DESIGN.md) — no new taxonomy, no new color —
   * and exposes the same label via `title`/`aria-label` instead of visible
   * text, matching the hover-detail pattern already used by ProvenanceMark.
   */
  compact?: boolean;
}

// Cockpit-visible freshness label. Deliberately semantic, never relative —
// no "Xs/Xm/Xh ago" text anywhere. Milestone 1C simplifies the previous
// 5-state vocabulary (live/fresh/aging/stale/unavailable) down to 3 states
// (current/stale/unavailable). "current" was previously split into two
// display words depending on family — only F1 (Gold, the instrument
// itself) claimed a literal "LIVE" read — but F1 has since been removed
// from the product entirely (see docs/MVP_COCKPIT_CONTRACT.md's
// top-of-file note), so every remaining family now uses "UP TO DATE"
// unconditionally; the `familyId` prop is kept only because every call
// site already has it on hand, not because any family-specific branch
// remains here. Milestone 1D: these words are translated (EN: UP TO DATE/
// STALE/UNAVAILABLE, FR: À JOUR/PÉRIMÉ/INDISPONIBLE).
function labelFor(quality: QualityState, t: TranslateFn): string {
  if (quality === "current") return t("freshness.upToDate");
  if (quality === "stale") return t("freshness.updateExpected");
  return t("freshness.unavailable");
}

function captionClassFor(quality: QualityState): string {
  if (quality === "current") return styles.captionSecondary;
  if (quality === "stale") return styles.captionError;
  return styles.captionUnavailable;
}

function dotClassFor(quality: QualityState): string {
  if (quality === "current") return styles.dotUpToDate;
  if (quality === "stale") return styles.dotStale;
  return styles.dotUnavailable;
}

export function FreshnessDot({ quality, compact }: FreshnessDotProps) {
  const { t } = useTranslation();
  const label = labelFor(quality, t);
  // Section 3 requirement — STALE is not self-explanatory on its own, so it
  // gets the same inline "i" info-affordance already used elsewhere in this
  // codebase for driverSummary/bps clarification (KpiMiniCell's
  // .infoAffordance: small bordered circle, cursor: help, native title
  // tooltip) rather than a new interaction pattern. Only STALE gets this —
  // UP TO DATE/UNAVAILABLE are already self-explanatory.
  const staleExplanation = quality === "stale" ? t("freshness.staleTooltip") : null;

  if (compact) {
    return (
      <span className={styles.compactWrapper}>
        <span
          className={`${styles.dot} ${styles.dotCompact} ${dotClassFor(quality)}`}
          role="img"
          aria-label={label}
          title={label}
        />
        {staleExplanation && (
          <span className={styles.infoIcon} title={staleExplanation} aria-label={staleExplanation}>
            i
          </span>
        )}
      </span>
    );
  }

  return (
    <span className={styles.wrapper}>
      <span className={`${styles.dot} ${dotClassFor(quality)}`} aria-hidden="true" />
      <span className={captionClassFor(quality)}>{label}</span>
      {staleExplanation && (
        <span className={styles.infoIcon} title={staleExplanation} aria-label={staleExplanation}>
          i
        </span>
      )}
    </span>
  );
}
