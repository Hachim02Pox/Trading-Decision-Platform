"use client";

import { useState } from "react";
import Link from "next/link";
import type { CanonicalFamilySnapshot } from "@gold-terminal/contracts";
import { formatKpiValue } from "@/lib/formatKpi";
import { useTranslation } from "@/i18n/useTranslation";
import { getFamilyKnowledgeHref } from "@/content/knowledge/knowledgeMap";
import { getExternalSourceLink, type ExternalSourceLink } from "@/content/externalSourceLinks";
import { formatReadableDateTime } from "@/lib/formatDateTime";
import { DISPLAY_RELATIONSHIP_LABEL_KEY } from "@/lib/relationshipColor";
import { ExternalSourceModal } from "./ExternalSourceModal";
import { DataStateTag } from "./DataStateTag";
import styles from "./FamilyDetailDrawer.module.css";

export function FamilyDrawerView({ family, onOpenKpi }: { family: CanonicalFamilySnapshot; onOpenKpi: (kpiId: string) => void }) {
  const { t, language } = useTranslation();
  const [externalSource, setExternalSource] = useState<{ kpiLabel: string; link: ExternalSourceLink } | null>(null);
  const familyRead = family.mechanicalFamilyRead;
  const contributors = familyRead ? family.kpis.filter((kpi) => kpi.mechanicalEvaluation.channelId && familyRead.contributingChannels.includes(kpi.mechanicalEvaluation.channelId)) : [];

  return <div className={styles.body}>
    {familyRead && <section className={styles.section}>
      <h3 className={styles.sectionTitle}>{t("family.mechanicalReadHeading")}</h3>
      <div className={styles.impactCard}><span>{t("kpi.impactOnGold")}</span><strong>{t(DISPLAY_RELATIONSHIP_LABEL_KEY[familyRead.read])}</strong><p>{contributors.length ? t("family.drivenBy", { kpis: contributors.map((kpi) => kpi.label).join(", ") }) : t("family.noDirectionalDriver")}</p></div>
      {contributors.map((kpi) => <div key={kpi.id} className={styles.readingRow}><span className={styles.readingLabel}>{kpi.label}</span><span className={styles.readingValue}>{t(DISPLAY_RELATIONSHIP_LABEL_KEY[kpi.mechanicalGoldRead])}</span></div>)}
      {familyRead.reasonCode === "CHANNELS_DISAGREE" && <p className={styles.warningLine}>{t("family.mixedSignals")}</p>}
    </section>}

    <section className={styles.section}>
      <h3 className={styles.sectionTitle}>{t("kpi.dataHeading")}</h3>
      {family.kpis.length === 0 && <p className={styles.paragraph}>{t("drawer.renderPureEvents")}</p>}
      {family.kpis.map((kpi) => {
        const externalLink = kpi.dataState === "UNAVAILABLE" ? getExternalSourceLink(kpi.id) : undefined;
        return <button key={kpi.id} type="button" className={`${styles.readingRow} ${styles.readingRowClickable}`} onClick={() => externalLink ? setExternalSource({ kpiLabel: kpi.label, link: externalLink }) : onOpenKpi(kpi.id)}>
          <span className={styles.readingLabel}>{kpi.label}</span><span className={styles.readingValue}>{formatKpiValue(kpi)}{kpi.unit && <span className={styles.unit}>{kpi.unit}</span>}<DataStateTag dataState={kpi.dataState} unavailableReason={kpi.unavailableReason} /></span>
        </button>;
      })}
      {(family.nextEvents?.length ?? 0) > 0 && family.nextEvents?.map((event) => <div key={event.id} className={styles.readingRow}><span className={styles.readingLabel}>{event.title}</span><span className={styles.readingValue}>{formatReadableDateTime(event.scheduledAt, language)}</span></div>)}
    </section>
    <Link className={styles.knowledgeLink} href={getFamilyKnowledgeHref(family.familyId)}>{t("knowledge.understandTopic")}</Link>
    {externalSource && <ExternalSourceModal kpiLabel={externalSource.kpiLabel} link={externalSource.link} onClose={() => setExternalSource(null)} />}
  </div>;
}
