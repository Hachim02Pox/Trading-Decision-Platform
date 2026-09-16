"use client";

import type { CanonicalKpi, FedRateDistribution } from "@gold-terminal/contracts";
import { deriveFedSummary } from "@/lib/deriveFedSummary";
import { formatKpiValue } from "@/lib/formatKpi";
import { useTranslation } from "@/i18n/useTranslation";
import {
  DISPLAY_RELATIONSHIP_LABEL_KEY,
  DISPLAY_RELATIONSHIP_ROW_CLASS_KEY,
} from "@/lib/relationshipColor";
import { kpiMechanicalRead } from "@/lib/mechanicalRead";
import { formatFreshnessFromTimestamps } from "@/lib/formatFreshness";
import { DataStateTag } from "./DataStateTag";
import styles from "./FamilyModule.module.css";
import freshnessStyles from "./FreshnessDot.module.css";

// Milestone 1E, section 2/14 — F3's compact resting face (Target / Next /
// Probability), extracted from FamilyModule.tsx's former inline
// `F3CompactFace`. Section 2 asks that F3 read with real tactical-tier
// visual presence rather than reading as a weaker secondary-tier family:
// its values now use `kpi-primary`/tactical-tier typography
// (`.valuePrimarySize`, 22px/600 mono — DESIGN.md §26) instead of the
// generic 13px row value size, without restoring the old large-empty-space
// problem (still exactly three compact label:value lines, no filler).
//
// Removed-homemade-calc pass: the "Next"/"Probability" rows used to read
// three fixed Hold/-25bp/-50bp KPIs computed from a homemade (and buggy)
// CME-ZQ-settlement calculation. That calculation is gone entirely (see
// apps/backend/src/real/f3Fed.ts's top-of-file comment); this face now
// reads `fedRateDistribution` — a real, N-bucket distribution from
// investing.com's Fed Rate Monitor — and shows whichever bucket the
// source itself reports as most likely, generalized to any bucket count
// rather than a fixed three-outcome word (Hold/-25bp/-50bp).
export function F3FedFace({
  kpis,
  fedRateDistribution,
  directionalColoring,
  onOpenKpi,
}: {
  kpis: CanonicalKpi[];
  fedRateDistribution: FedRateDistribution | null | undefined;
  directionalColoring: boolean;
  onOpenKpi: (kpiId: string) => void;
}) {
  const { t, language } = useTranslation();
  const lower = kpis.find((k) => k.id === "f3-target-lower");
  const upper = kpis.find((k) => k.id === "f3-target-upper");
  const summary = deriveFedSummary(fedRateDistribution);
  // Target range itself (lower/upper) is real NY Fed data and always
  // renders; the Next/Probability rows fall back to an honest "not
  // available" state (rather than the whole face returning null) whenever
  // the real Fed Rate Monitor distribution is UNAVAILABLE.
  if (!lower || !upper) return null;
  // User-explicit absolute rule: no simulated data anywhere in the
  // terminal — same mechanical-first/real-on-click rule as KpiMiniCell.tsx.
  const relationship = kpiMechanicalRead(lower);
  const accentClass = directionalColoring ? styles[DISPLAY_RELATIONSHIP_ROW_CLASS_KEY[relationship]] : "";

  return (
    <div className={styles.tacticalBlock}>
      <div className={styles.row}>
        <span className={styles.rowLabel}>{t("f3.target")}</span>
        <span className={`${styles.rowValue} ${styles.valuePrimarySize}`}>
          {formatKpiValue(lower)}
          {"–"}
          {formatKpiValue(upper)}
          <span className={styles.unit}>%</span>
          <DataStateTag dataState={lower.dataState} unavailableReason={lower.unavailableReason} />
        </span>
      </div>
      {summary ? (
        <>
          <div className={styles.row}>
            <span className={styles.rowLabel}>{t("f3.next")}</span>
            <span className={`${styles.rowValue} ${styles.valuePrimarySize}`}>{summary.mostLikelyLabel}</span>
          </div>
          <div className={styles.row}>
            <span className={styles.rowLabel}>{t("f3.probability")}</span>
            <span className={`${styles.rowValue} ${styles.valuePrimarySize}`}>
              {summary.previousPct !== null && <><span className={styles.previousProbability}>{summary.previousPct}%</span><span className={styles.fedProbabilityArrow}>→</span></>}
              {summary.mostLikelyPct}<span className={styles.unit}>%</span>
            </span>
          </div>
          {/* User-reported trust gap: this reading had no visible freshness
              anywhere, so comparing it against a live CME FedWatch page
              looked like a bug when it was really just (a) a different
              third-party source computing its own number from the same
              underlying futures, and (b) a cache that only re-checks every
              5h (see f3Fed.ts) — a restart of `npm run dev` does NOT force a
              fresh scrape. Surfacing the real observation/retrieval age
              here lets the viewer judge staleness themselves before
              comparing to a live external page. */}
          {fedRateDistribution && fedRateDistribution.dataState === "REAL" && (
            <div className={styles.row}>
              <span className={freshnessStyles.compactWrapper}>
                <span className={`${freshnessStyles.dot} ${freshnessStyles.dotCompact} ${freshnessStyles.dotUpToDate}`} aria-hidden="true" />
                <span className={`${freshnessStyles.freshnessText} ${freshnessStyles.captionSecondary}`}>
                  {formatFreshnessFromTimestamps(fedRateDistribution.observationAt, fedRateDistribution.retrievedAt, "daily", language, t)}
                </span>
              </span>
            </div>
          )}
        </>
      ) : (
        <div className={styles.row}>
          <span className={styles.rowLabel}>{t("f3.next")}</span>
          <span className={styles.quietCaption}>{t("f3.summaryUnavailable")}</span>
        </div>
      )}
      <div className={`${styles.f3Read} ${accentClass}`}>
        <button
          type="button"
          className={styles.f3ReadButton}
          onClick={(event) => {
            event.stopPropagation();
            onOpenKpi(lower.id);
          }}
        >
          <span className={styles.stateLabel}>{t(DISPLAY_RELATIONSHIP_LABEL_KEY[relationship])}</span>
        </button>
      </div>
    </div>
  );
}
