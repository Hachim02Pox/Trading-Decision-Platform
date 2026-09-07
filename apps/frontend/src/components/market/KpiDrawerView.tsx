"use client";

import Link from "next/link";
import type { CanonicalFamilySnapshot } from "@gold-terminal/contracts";
import { getFamilyEducation } from "@/content/familyEducation";
import { getKpiKnowledgeHref } from "@/content/knowledge/knowledgeMap";
import { formatKpiValue } from "@/lib/formatKpi";
import { formatReadableDateTime } from "@/lib/formatDateTime";
import { DISPLAY_RELATIONSHIP_LABEL_KEY, canonicalToDisplayRelationship } from "@/lib/relationshipColor";
import { useOnDemandKpiAnalysis } from "@/hooks/useOnDemandKpiAnalysis";
import { useTranslation } from "@/i18n/useTranslation";
import { DataStateTag } from "./DataStateTag";
import styles from "./FamilyDetailDrawer.module.css";

// User-explicit simplification (2026-09): this drawer used to render the
// entire real on-demand interpretation (current read, why now, causal
// chain, evidence lists, contradictions, alternative explanations,
// unknowns, strengthen/invalidate, audit trail, per-agent breakdown, data
// status footer with model/prompt/session ids...). All of that content is
// now backend-only (still fully computed and persisted — see
// realInterpretationGenerator.ts/onDemandAnalysis.ts, untouched) but no
// longer shown here. This view shows exactly 5 things: the KPI's name, its
// data (value/period/publication/fetch/source/verification), a short static
// "what is this" blurb (reused from existing education content, never
// regenerated), ONE compact AI reading, and a link to Knowledge.
//
// No button anywhere in this file. Opening this drawer is itself what calls
// useOnDemandKpiAnalysis, which automatically ensures the AI reading matches
// the CURRENT data snapshot (see that hook's and onDemandAnalysis.ts's file
// headers) — there is nothing left for the user to click to "get" a reading.
export function KpiDrawerView({
  kpiId,
  family,
  onBack,
}: {
  kpiId: string;
  family: CanonicalFamilySnapshot;
  onBack: () => void;
}) {
  const { t, language } = useTranslation();
  const kpi = family.kpis.find((k) => k.id === kpiId);
  // Analyzing a value that doesn't exist makes no sense — the hook is simply
  // not asked to run for an UNAVAILABLE KPI (kpiId passed as null skips it).
  const onDemand = useOnDemandKpiAnalysis(kpi && kpi.dataState !== "UNAVAILABLE" ? kpiId : null, language);
  const interpretation = onDemand.status === "OK" ? onDemand.interpretation : null;
  const displayRelationship = interpretation?.finalGoldRead ?? (kpi ? canonicalToDisplayRelationship(kpi.relationship) : "CONTEXTUAL");
  const education = kpi ? getFamilyEducation(kpi.familyId, language) : null;

  return (
    <div className={styles.body}>
      <button type="button" className={styles.backButton} onClick={onBack}>
        {t("drawer.back")}
      </button>

      {!kpi && <p className={styles.paragraph}>{t("drawer.unknownKpi")}</p>}

      {kpi && (
        <>
          {/* NOM DU KPI + valeur immédiate */}
          <section className={styles.kpiHeader}>
            <h3 className={styles.sectionTitle}>{kpi.label}</h3>
            <div className={styles.kpiHeaderRow}>
              <span className={styles.kpiHeaderValue}>
                {formatKpiValue(kpi)}
                {kpi.unit && <span className={styles.unit}>{kpi.unit}</span>}
                <DataStateTag dataState={kpi.dataState} unavailableReason={kpi.unavailableReason} />
              </span>
              <span className={styles.kpiHeaderState}>{t(DISPLAY_RELATIONSHIP_LABEL_KEY[displayRelationship])}</span>
            </div>
          </section>

          {/* DONNÉE — quoi / de quand / publié quand / fetché quand / d'où.
              Never fabricates a publication date: only interpretation's
              evidenceLatestPublishedAt (a REAL date the AI actually found on
              a live source this run) is shown as "publication"; absent that,
              the line says explicitly "not available" rather than reusing
              observationAt or retrievedAt in its place. */}
          {kpi.dataState !== "UNAVAILABLE" && (
            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>{t("kpi.dataHeading")}</h3>
              <div className={styles.statusRow}>
                <span className={styles.statusLabel}>{t("kpi.periodLabel")}</span>
                <span className={styles.statusMeta}>{formatReadableDateTime(kpi.observationAt, language)}</span>
              </div>
              <div className={styles.statusRow}>
                <span className={styles.statusLabel}>{t("kpi.publicationLabel")}</span>
                <span className={styles.statusMeta}>
                  {interpretation?.evidenceLatestPublishedAt ? formatReadableDateTime(interpretation.evidenceLatestPublishedAt, language) : t("kpi.notAvailable")}
                </span>
              </div>
              <div className={styles.statusRow}>
                <span className={styles.statusLabel}>{t("kpi.fetchedLabel")}</span>
                <span className={styles.statusMeta}>{formatReadableDateTime(kpi.retrievedAt, language)}</span>
              </div>
              <div className={styles.statusRow}>
                <span className={styles.statusLabel}>{t("kpi.sourceLabel")}</span>
                <span className={styles.statusMeta}>{kpi.sourceTag}</span>
              </div>
            </section>
          )}

          {/* À QUOI SERT CET INDICATEUR — static, reused, never regenerated. */}
          {education && (
            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>{t("kpi.purposeHeading")}</h3>
              <p className={styles.paragraph}>{education.overview}</p>
              <p className={styles.paragraph}>{education.goldRelationship}</p>
            </section>
          )}

          {/* LECTURE IA — the one AI section. Automatic, no button. */}
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>{t("kpi.aiReadingHeading")}</h3>

            {kpi.dataState === "UNAVAILABLE" && <p className={styles.paragraph}>{t("kpi.aiReadingNoData")}</p>}

            {kpi.dataState !== "UNAVAILABLE" && (
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

          {/* EN SAVOIR PLUS */}
          <section className={styles.section}>
            <Link className={styles.knowledgeLink} href={getKpiKnowledgeHref(kpi.id, kpi.familyId)}>
              {t("knowledge.understandMetric")}
            </Link>
          </section>
        </>
      )}
    </div>
  );
}
