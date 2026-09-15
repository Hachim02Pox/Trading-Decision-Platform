"use client";

import Link from "next/link";
import type { CanonicalFamilySnapshot } from "@gold-terminal/contracts";
import { getKpiKnowledgeHref } from "@/content/knowledge/knowledgeMap";
import { getContextualExplanation, getMechanicalRationale } from "@/content/mechanicalRationale";
import { formatKpiValue } from "@/lib/formatKpi";
import { formatReadableDateTime } from "@/lib/formatDateTime";
import { calculateKpiChange, formatComparisonValue } from "@/lib/kpiComparison";
import { DISPLAY_RELATIONSHIP_LABEL_KEY } from "@/lib/relationshipColor";
import { kpiMechanicalRead } from "@/lib/mechanicalRead";
import { useTranslation } from "@/i18n/useTranslation";
import type { TranslationKey } from "@/i18n/en";
import { DataStateTag } from "./DataStateTag";
import styles from "./FamilyDetailDrawer.module.css";

export function KpiDrawerView({ kpiId, family, onBack }: { kpiId: string; family: CanonicalFamilySnapshot; onBack: () => void }) {
  const { t, language } = useTranslation();
  const kpi = family.kpis.find((item) => item.id === kpiId);
  if (!kpi) return <div className={styles.body}><button type="button" className={styles.backButton} onClick={onBack}>{t("drawer.back")}</button><p className={styles.paragraph}>{t("drawer.unknownKpi")}</p></div>;

  const relationship = kpiMechanicalRead(kpi);
  const rationale = getMechanicalRationale(kpi.id, kpi.mechanicalEvaluation.mode, language);
  const previous = kpi.previousFetch ?? null;
  const current = { value: kpi.value, unit: kpi.unit, observationAt: kpi.observationAt };
  const change = previous?.value != null && current.value != null ? calculateKpiChange(previous.value, current.value) : null;
  const summary = relationship === "CONTEXTUAL" ? getContextualExplanation(kpi.mechanicalEvaluation.status, language) : rationale.rule;

  return <div className={styles.body}>
    <button type="button" className={styles.backButton} onClick={onBack}>{t("drawer.back")}</button>
    <section className={styles.kpiHeader}>
      <h3 className={styles.sectionTitle}>{kpi.label}</h3>
      <div className={styles.kpiHeaderRow}>
        <span className={styles.kpiHeaderValue}>{formatKpiValue(kpi)}{kpi.unit && <span className={styles.unit}>{kpi.unit}</span>}<DataStateTag dataState={kpi.dataState} unavailableReason={kpi.unavailableReason} /></span>
        <span className={styles.kpiHeaderState}>{t(DISPLAY_RELATIONSHIP_LABEL_KEY[relationship])}</span>
      </div>
    </section>

    <section className={styles.section}>
      <h3 className={styles.sectionTitle}>{t("kpi.mechanicalHeading")}</h3>
      <div className={styles.impactCard}>
        <span>{t("kpi.impactOnGold")}</span>
        <strong>{t(DISPLAY_RELATIONSHIP_LABEL_KEY[relationship])}</strong>
        <p>{summary}</p>
      </div>
    </section>

    <section className={styles.section}>
      <h3 className={styles.sectionTitle}>{t("kpi.changeHeading")}</h3>
      <div className={styles.comparisonCard}>
        <div className={styles.comparisonPoint}><span className={styles.comparisonLabel}>{t("kpi.previousValue")}</span><strong>{previous?.value == null ? "—" : formatComparisonValue(previous.value)}{previous?.unit && <small>{previous.unit}</small>}</strong><span>{previous ? formatReadableDateTime(previous.observationAt, language) : t("kpi.firstRecordedValue")}</span></div>
        <div className={`${styles.comparisonArrow} ${change ? styles[`comparison${change.direction[0].toUpperCase()}${change.direction.slice(1)}`] : ""}`}><span aria-hidden="true">{change?.direction === "down" ? "↓" : change?.direction === "up" ? "↑" : "→"}</span>{change && <small>{change.absolute > 0 ? "+" : ""}{formatComparisonValue(change.absolute)}{current.unit ?? ""}</small>}</div>
        <div className={styles.comparisonPoint}><span className={styles.comparisonLabel}>{t("kpi.currentValue")}</span><strong>{current.value == null ? "—" : formatComparisonValue(current.value)}{current.unit && <small>{current.unit}</small>}</strong><span>{formatReadableDateTime(current.observationAt, language)}</span></div>
      </div>
      {!previous && <p className={styles.paragraph}>{t("kpi.comparisonPending")}</p>}
    </section>

    <section className={styles.section}>
      <p className={styles.paragraph}>{rationale.whatItMeasures}</p>
      <details className={styles.disclosure}><summary>{t("kpi.whyThisMatters")}</summary><p>{rationale.goldLink}</p></details>
      <details className={styles.disclosure}><summary>{t("kpi.ruleUsed")}</summary><p>{rationale.rule}</p><p className={styles.ruleStatus}>{t(`mechanicalStatus.${kpi.mechanicalEvaluation.status}` as TranslationKey)}</p></details>
      <details className={styles.disclosure}><summary>{t("kpi.limitations")}</summary><p>{rationale.limitation}</p></details>
    </section>

    <section className={styles.section}>
      <h3 className={styles.sectionTitle}>{t("kpi.dataHeading")}</h3>
      <div className={styles.statusRow}><span className={styles.statusLabel}>{t("kpi.periodLabel")}</span><span className={styles.statusMeta}>{formatReadableDateTime(kpi.observationAt, language)}</span></div>
      <div className={styles.statusRow}><span className={styles.statusLabel}>{t("kpi.fetchedLabel")}</span><span className={styles.statusMeta}>{formatReadableDateTime(kpi.retrievedAt, language)}</span></div>
      <div className={styles.statusRow}><span className={styles.statusLabel}>{t("kpi.sourceLabel")}</span><span className={styles.statusMeta}>{kpi.sourceTag}</span></div>
    </section>
    <Link className={styles.knowledgeLink} href={getKpiKnowledgeHref(kpi.id, kpi.familyId)}>{t("knowledge.understandMetric")}</Link>
  </div>;
}
