"use client";

import { useState } from "react";
import type { CanonicalFamilySnapshot } from "@gold-terminal/contracts";
import { formatKpiValue } from "@/lib/formatKpi";
import { useTranslation } from "@/i18n/useTranslation";
import { getFamilyKnowledgeHref } from "@/content/knowledge/knowledgeMap";
import { getExternalSourceLink, type ExternalSourceLink } from "@/content/externalSourceLinks";
import { formatReadableDateTime } from "@/lib/formatDateTime";
import { useOnDemandKpiAnalysis } from "@/hooks/useOnDemandKpiAnalysis";
import { ExternalSourceModal } from "./ExternalSourceModal";
import { DataStateTag } from "./DataStateTag";
import Link from "next/link";
import styles from "./FamilyDetailDrawer.module.css";

// User-explicit simplification (2026-09): this used to be the full
// 6-question family view (What is this / Why Gold / Current read /
// Strengthen / Weaken / Nuance) plus a KPI-by-KPI reading list with
// consensus/previous/surprise metadata and a large collapsible
// provenance/audit footer. All of that is gone. Per the new spec this
// family-level drawer is exactly 4 blocks: HEADER (rendered by the parent
// shell, FamilyDetailDrawer, via the panel's own title bar — not repeated
// here), DATA FRESHNESS (a compact per-KPI value list, still clickable
// through to each KPI's own drawer), LECTURE IA DE LA FAMILLE (the
// automatic real synthesis — see onDemandAnalysis.ts's family branch,
// which reuses generateRealInterpretationForFamily unchanged), and EN
// SAVOIR PLUS (the Knowledge link).
export function FamilyDrawerView({
  family,
  onOpenKpi,
}: {
  family: CanonicalFamilySnapshot;
  onOpenKpi: (kpiId: string) => void;
}) {
  const { t, language } = useTranslation();
  const [externalSource, setExternalSource] = useState<{ kpiLabel: string; link: ExternalSourceLink } | null>(null);
  const allKpis = family.kpis;
  const hasEvents = (family.nextEvents && family.nextEvents.length > 0) || family.activeCatalyst !== undefined;

  // Opening this drawer is itself what triggers the automatic family-level
  // reading — same lazy-but-automatic-on-view model as KpiDrawerView.
  const onDemand = useOnDemandKpiAnalysis(`family:${family.familyId}`, language);
  const interpretation = onDemand.status === "OK" ? onDemand.interpretation : null;

  return (
    <div className={styles.body}>
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>{t("kpi.dataHeading")}</h3>
        {allKpis.length === 0 && <p className={styles.paragraph}>{t("drawer.renderPureEvents")}</p>}
        {allKpis.map((kpi) => {
          const externalLink = kpi.dataState === "UNAVAILABLE" ? getExternalSourceLink(kpi.id) : undefined;
          return (
            <button
              key={kpi.id}
              type="button"
              className={`${styles.readingRow} ${styles.readingRowClickable}`}
              onClick={() => (externalLink ? setExternalSource({ kpiLabel: kpi.label, link: externalLink }) : onOpenKpi(kpi.id))}
            >
              <span className={styles.readingLabel}>{kpi.label}</span>
              <span className={styles.readingValue}>
                {formatKpiValue(kpi)}
                {kpi.unit && <span className={styles.unit}>{kpi.unit}</span>}
                <DataStateTag dataState={kpi.dataState} unavailableReason={kpi.unavailableReason} />
              </span>
            </button>
          );
        })}

        {hasEvents && (
          <div className={styles.readingGroup}>
            <span className={styles.groupLabel}>{t("drawer.scheduling")}</span>
            {(family.nextEvents ?? []).map((event) => (
              <div key={event.id} className={styles.readingRow}>
                <span className={styles.readingLabel}>{event.title}</span>
                <span className={styles.readingValue} title={event.scheduledAt}>
                  {formatReadableDateTime(event.scheduledAt, language)}
                </span>
              </div>
            ))}
            {family.activeCatalyst !== undefined && (
              <div className={styles.readingRow}>
                <span className={styles.readingLabel}>{t("drawer.activeCatalyst")}</span>
                <span className={styles.readingValue}>
                  {family.activeCatalyst ? family.activeCatalyst.title : t("drawer.catalystNone")}
                </span>
              </div>
            )}
          </div>
        )}
      </section>

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>{t("kpi.aiReadingHeading")}</h3>

        {allKpis.length === 0 && !hasEvents && <p className={styles.paragraph}>{t("kpi.aiReadingNoData")}</p>}

        {(allKpis.length > 0 || hasEvents) && (
          <>
            {(onDemand.phase === "loading" || onDemand.phase === "pending") && (
              <p className={styles.paragraph}>{t("onDemand.pending")}</p>
            )}
            {onDemand.phase === "ready" && onDemand.status === "NOT_CONFIGURED" && (
              <p className={styles.warningLine}>{t("onDemand.notConfigured")}</p>
            )}
            {onDemand.phase === "ready" && onDemand.status === "UNAVAILABLE" && (
              <p className={styles.warningLine}>{onDemand.message ?? t("onDemand.autoUnavailable")}</p>
            )}
            {onDemand.phase === "ready" && onDemand.status === "OK" && interpretation && (
              <>
                {(interpretation.evidenceState === "CONFLICTED" || interpretation.evidenceState === "LIMITED") && (
                  <p className={styles.warningLine}>
                    {interpretation.evidenceState === "CONFLICTED" ? t("kpi.dataConflictWarning") : t("kpi.dataUnverifiedWarning")}
                  </p>
                )}
                <p className={styles.paragraph}>{interpretation.currentReadDetailed}</p>
                <p className={styles.paragraph}>{interpretation.whyNow}</p>
              </>
            )}
          </>
        )}
      </section>

      <section className={styles.section}>
        <Link className={styles.knowledgeLink} href={getFamilyKnowledgeHref(family.familyId)}>
          {t("knowledge.understandTopic")}
        </Link>
      </section>

      {externalSource && (
        <ExternalSourceModal
          kpiLabel={externalSource.kpiLabel}
          link={externalSource.link}
          onClose={() => setExternalSource(null)}
        />
      )}
    </div>
  );
}
