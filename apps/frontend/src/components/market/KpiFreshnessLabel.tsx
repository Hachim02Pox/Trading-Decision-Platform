"use client";

import type { CanonicalKpi } from "@gold-terminal/contracts";
import { useTranslation } from "@/i18n/useTranslation";
import { formatKpiFreshness } from "@/lib/formatFreshness";
import { FreshnessDot } from "./FreshnessDot";
import styles from "./FreshnessDot.module.css";

interface KpiFreshnessLabelProps {
  kpi: CanonicalKpi;
}

/**
 * Per-KPI freshness, always visible but discreet — replaces the flat
 * À JOUR/PÉRIMÉ/INDISPONIBLE badge for REAL KPIs with the cadence-aware
 * Live / Updated X ago / Data as of [date] wording the product owner asked
 * for (see lib/formatFreshness.ts for the exact rules). Only REAL KPIs get
 * the new wording — a genuine cadence/observation date only exists once a
 * KPI is actually REAL; MOCK/UNAVAILABLE KPIs keep the original semantic
 * FreshnessDot exactly as before (nothing plausible to compute an as-of
 * date or "updated X ago" from for those, and inventing one would be
 * exactly the kind of dubious/derived presentation this pass avoids).
 */
export function KpiFreshnessLabel({ kpi }: KpiFreshnessLabelProps) {
  const { t, language } = useTranslation();

  if (kpi.dataState !== "REAL") {
    return <FreshnessDot quality={kpi.quality} familyId={kpi.familyId} compact />;
  }

  const label = formatKpiFreshness(kpi, language, t);
  const dotClass = kpi.quality === "current" ? styles.dotUpToDate : kpi.quality === "stale" ? styles.dotStale : styles.dotUnavailable;
  const captionClass = kpi.quality === "current" ? styles.captionSecondary : kpi.quality === "stale" ? styles.captionError : styles.captionUnavailable;

  return (
    <span className={styles.compactWrapper}>
      <span className={`${styles.dot} ${styles.dotCompact} ${dotClass}`} aria-hidden="true" />
      <span className={`${styles.freshnessText} ${captionClass}`}>{label}</span>
    </span>
  );
}
