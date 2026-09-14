"use client";

import { useState } from "react";
import type { CanonicalKpi } from "@gold-terminal/contracts";
import { useCachedOnDemandBadge } from "@/hooks/useCachedOnDemandBadge";
import { useTranslation } from "@/i18n/useTranslation";
import { formatKpiValue } from "@/lib/formatKpi";
import { calculateKpiChange, formatComparisonValue } from "@/lib/kpiComparison";
import {
  DISPLAY_RELATIONSHIP_LABEL_KEY,
  DISPLAY_RELATIONSHIP_ROW_CLASS_KEY,
  canonicalToDisplayRelationship,
} from "@/lib/relationshipColor";
import { getExternalSourceLink } from "@/content/externalSourceLinks";
import { ProvenanceMark } from "./ProvenanceMark";
import { KpiFreshnessLabel } from "./KpiFreshnessLabel";
import { DataStateTag } from "./DataStateTag";
import { ExternalSourceModal } from "./ExternalSourceModal";
import styles from "./FamilyModule.module.css";

export interface KpiMiniCellProps {
  kpi: CanonicalKpi;
  directionalColoring: boolean;
  sizeClassName?: string;
  showBpsHint?: boolean;
  onOpenKpi: (kpiId: string) => void;
}

// Milestone 1E — extracted from FamilyModule.tsx's former inline `KpiRow`.
// Restores the scan hierarchy SEMANTIC STATE -> VALUE -> CLICK (section 1):
// the SUPPORTIVE/ADVERSE/CONTEXTUAL text label is always rendered,
// independent of the Directional Coloring setting — that setting only
// adds/removes the color reinforcement (border/background/value tint) on
// top of the same text. The label is the real mechanical relationship by
// default, cache-checked (never triggered) against a genuine automatic AI
// result via useCachedOnDemandBadge.
//
// User-explicit simplification (2026-09): no inline "Analyze with AI" /
// "View last analysis" buttons any more — clicking the card is the only
// action, and it just opens the KPI's drawer (KpiDrawerView), which now
// triggers/displays the automatic analysis itself. See
// apps/backend/src/intelligence/onDemandAnalysis.ts's file header for the
// automatic pipeline this badge and the drawer both read from.
export function KpiMiniCell({ kpi, directionalColoring, sizeClassName, showBpsHint, onOpenKpi }: KpiMiniCellProps) {
  const { t, language } = useTranslation();
  const badge = useCachedOnDemandBadge(kpi.id, language);
  const [externalSourceOpen, setExternalSourceOpen] = useState(false);
  const externalLink = kpi.dataState === "UNAVAILABLE" ? getExternalSourceLink(kpi.id) : undefined;
  const previous = kpi.previousFetch;
  const change = previous?.value !== null && previous?.value !== undefined && kpi.value !== null
    ? calculateKpiChange(previous.value, kpi.value)
    : null;

  const displayRelationship = badge.finalGoldRead ?? canonicalToDisplayRelationship(kpi.relationship);
  const accentClass = directionalColoring ? styles[DISPLAY_RELATIONSHIP_ROW_CLASS_KEY[displayRelationship]] : "";

  return (
    <div className={styles.miniCell}>
      <button
        type="button"
        className={styles.miniCellButton}
        onClick={(event) => {
          event.stopPropagation();
          if (externalLink) {
            setExternalSourceOpen(true);
            return;
          }
          onOpenKpi(kpi.id);
        }}
      >
        <div className={`${styles.row} ${accentClass}`}>
          <span className={styles.rowLabel}>
            {kpi.label}
            {externalLink && (
              <span className={styles.externalSourceHint} aria-hidden="true">
                ↗ {externalLink.host}
              </span>
            )}
            {/* User-explicit requirement: EVERY cockpit KPI — including
                fully-mock families (F6/F11/F13) — always carries an
                unambiguous REAL/MOCK/UNAVAILABLE text tag, never just a dot
                color. */}
            <KpiFreshnessLabel kpi={kpi} />
            <DataStateTag dataState={kpi.dataState} unavailableReason={kpi.unavailableReason} />
          </span>
          <span className={styles.stateLabel}>{t(DISPLAY_RELATIONSHIP_LABEL_KEY[displayRelationship])}</span>
          <span className={`${styles.rowValue} ${sizeClassName ?? ""}`}>
            {previous?.value !== null && previous?.value !== undefined && (
              <span className={styles.inlinePreviousValue} title="Valeur du fetch précédent">
                {formatComparisonValue(previous.value)}{previous.unit ?? ""}
              </span>
            )}
            {previous?.value !== null && previous?.value !== undefined && (
              <span className={`${styles.inlineArrow} ${change?.direction === "up" ? styles.comparisonUp : change?.direction === "down" ? styles.comparisonDown : ""}`} aria-hidden="true">
                {change?.direction === "up" ? "↑" : change?.direction === "down" ? "↓" : "→"}
              </span>
            )}
            {formatKpiValue(kpi)}
            <ProvenanceMark provenance={kpi.provenance} />
            {kpi.unit && (
              <span className={styles.unit}>
                {kpi.unit}
                {showBpsHint && <span className={styles.bpsHint}> (0.01%)</span>}
              </span>
            )}
            {kpi.driverSummary && (
              <span className={styles.infoAffordance} title={kpi.driverSummary} aria-label={kpi.driverSummary}>
                i
              </span>
            )}
          </span>
          {previous?.value !== null && previous?.value !== undefined && (
            <span className={styles.previousInfo} title="À gauche : valeur du fetch précédent. À droite : valeur actuelle.">i</span>
          )}
        </div>
      </button>

      {externalSourceOpen && externalLink && (
        <ExternalSourceModal kpiLabel={kpi.label} link={externalLink} onClose={() => setExternalSourceOpen(false)} />
      )}
    </div>
  );
}
