"use client";

import { useEffect, useRef, useState } from "react";
import type {
  GlobalReadAsymmetryVerdict,
  GlobalReadBlockId,
  GlobalReadComponentId,
  GlobalReadConfidence,
  GlobalReadHorizon,
  GlobalReadInterpretation,
  GlobalReadVerdict,
} from "@gold-terminal/contracts";
import { useTranslation } from "@/i18n/useTranslation";
import type { TranslateFn } from "@/i18n/useTranslation";
import type { TranslationKey } from "@/i18n/en";
import type { UseGlobalReadAnalysisResult } from "@/hooks/useGlobalReadAnalysis";
import styles from "./GlobalReadSection.module.css";
import { GlobalReadDecisionReport } from "./GlobalReadDecisionReport";

const BLOCK_LABEL_KEY: Record<GlobalReadBlockId, TranslationKey> = {
  FED_RATE_PRICING: "globalRead.block.FED_RATE_PRICING",
  RATES_REAL_YIELDS: "globalRead.block.RATES_REAL_YIELDS",
  USD_LIQUIDITY: "globalRead.block.USD_LIQUIDITY",
  INFLATION_GROWTH_FISCAL_CREDIT: "globalRead.block.INFLATION_GROWTH_FISCAL_CREDIT",
  FLOWS_POSITIONING: "globalRead.block.FLOWS_POSITIONING",
  STRUCTURAL: "globalRead.block.STRUCTURAL",
};

const COMPONENT_LABEL_KEY: Record<GlobalReadComponentId, TranslationKey> = {
  COT_POSITIONING: "globalRead.component.COT_POSITIONING",
  OPTIONS_VOL: "globalRead.component.OPTIONS_VOL",
  ETF_FLOWS: "globalRead.component.ETF_FLOWS",
  STRUCTURAL_CENTRAL_BANKS: "globalRead.component.STRUCTURAL_CENTRAL_BANKS",
  GEOPOLITICAL_FISCAL_CREDIT: "globalRead.component.GEOPOLITICAL_FISCAL_CREDIT",
};

const HORIZON_LABEL_KEY: Record<GlobalReadHorizon, TranslationKey> = {
  INTRADAY: "globalRead.horizon.INTRADAY",
  SWING: "globalRead.horizon.SWING",
  STRUCTURAL: "globalRead.horizon.STRUCTURAL",
};

const VERDICT_LABEL_KEY: Record<GlobalReadVerdict, TranslationKey> = {
  BULLISH: "globalRead.verdict.BULLISH",
  BEARISH: "globalRead.verdict.BEARISH",
  NEUTRAL: "globalRead.verdict.NEUTRAL",
};

const VERDICT_CLASS: Record<GlobalReadVerdict, string> = {
  BULLISH: styles.verdictBullish,
  BEARISH: styles.verdictBearish,
  NEUTRAL: styles.verdictNeutral,
};

const CONFIDENCE_LABEL_KEY: Record<GlobalReadConfidence, TranslationKey> = {
  HIGH: "globalRead.confidence.HIGH",
  MEDIUM: "globalRead.confidence.MEDIUM",
  LOW: "globalRead.confidence.LOW",
};

const ASYMMETRY_LABEL_KEY: Record<GlobalReadAsymmetryVerdict, TranslationKey> = {
  STRONG: "globalRead.asymmetry.STRONG",
  MEDIUM: "globalRead.asymmetry.MEDIUM",
  WEAK: "globalRead.asymmetry.WEAK",
  TRAP: "globalRead.asymmetry.TRAP",
};

function GlobalReadReport({ interpretation, t }: { interpretation: GlobalReadInterpretation; t: TranslateFn }) {
  return (
    <div className={styles.report}>
      <div className={styles.reportGroup}>
        <span className={styles.groupTitle}>{t("globalRead.blocksHeading")}</span>
        {interpretation.blockReadings.map((b) => (
          <div key={b.blockId}>
            <span className={styles.itemLabel}>{t(BLOCK_LABEL_KEY[b.blockId])}</span>
            <p className={styles.itemText}>{b.combinedReading}</p>
          </div>
        ))}
      </div>

      <div className={styles.reportGroup}>
        <span className={styles.groupTitle}>{t("globalRead.componentsHeading")}</span>
        {interpretation.componentDeepDives.map((c) => (
          <div key={c.componentId}>
            <span className={styles.itemLabel}>{t(COMPONENT_LABEL_KEY[c.componentId])}</span>
            <p className={styles.itemText}>{c.combinedFindings}</p>
          </div>
        ))}
      </div>

      <div className={styles.reportGroup}>
        <span className={styles.groupTitle}>{t("globalRead.dataVerificationHeading")}</span>
        <p className={styles.itemText}>{interpretation.dataVerificationNotes}</p>
      </div>

      <div className={styles.reportGroup}>
        <span className={styles.groupTitle}>{t("globalRead.hypothesesHeading")}</span>
        <ul className={styles.plainList}>
          {interpretation.competingHypotheses.map((h, i) => (
            <li key={i} className={styles.plainListItem}>
              {h}
            </li>
          ))}
        </ul>
      </div>

      <div className={styles.reportGroup}>
        <span className={styles.groupTitle}>{t("globalRead.dominantDriverHeading")}</span>
        <p className={styles.itemText}>{interpretation.dominantDriver}</p>
        <p className={styles.itemText}>{interpretation.independenceTestNotes}</p>
      </div>

      <div className={styles.reportGroup}>
        <span className={styles.groupTitle}>{t("globalRead.contradictionsHeading")}</span>
        <ul className={styles.plainList}>
          {interpretation.contradictions.map((c, i) => (
            <li key={i} className={styles.contradictionItem}>
              {c}
            </li>
          ))}
        </ul>
      </div>

      <div className={styles.reportGroup}>
        <span className={styles.groupTitle}>{t("globalRead.adversarialHeading")}</span>
        <p className={styles.itemText}>{interpretation.adversarialCase}</p>
      </div>

      <div className={styles.reportGroup}>
        <span className={styles.groupTitle}>{t("globalRead.horizonsHeading")}</span>
        <div className={styles.horizonGrid}>
          {interpretation.horizonVerdicts.map((h) => (
            <div key={h.horizon} className={styles.horizonCard}>
              <div className={styles.horizonHeader}>
                <span className={styles.horizonLabel}>{t(HORIZON_LABEL_KEY[h.horizon])}</span>
                <span className={`${styles.verdictBadge} ${VERDICT_CLASS[h.verdict]}`}>{t(VERDICT_LABEL_KEY[h.verdict])}</span>
              </div>
              <span className={styles.confidenceTag}>{t(CONFIDENCE_LABEL_KEY[h.confidence])}</span>
              <p className={styles.itemText}>{h.rationale}</p>
              <p className={styles.invalidationLine}>
                <strong>{t("globalRead.invalidationLabel")}</strong> {h.invalidationLevel}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.reportGroup}>
        <span className={styles.groupTitle}>{t("globalRead.asymmetryHeading")}</span>
        <div className={styles.asymmetryBox}>
          <span className={styles.verdictBadge}>{t(ASYMMETRY_LABEL_KEY[interpretation.asymmetry.verdict])}</span>
          <p className={styles.itemText}>{interpretation.asymmetry.combinedNotes}</p>
        </div>
      </div>

      <details className={styles.footerDetails}>
        <summary className={styles.footerSummary}>{t("globalRead.auditHeading")}</summary>
        <pre className={styles.itemText}>{JSON.stringify(interpretation.auditTrail, null, 2)}</pre>
      </details>
    </div>
  );
}

const CONFIRMATION_VISIBLE_MS = 5000;

export function GlobalReadSection({ globalRead }: { globalRead: UseGlobalReadAnalysisResult }) {
  const { t, language } = useTranslation();
  const isBusy = globalRead.phase === "analyzing";
  const cooldownActive = globalRead.cooldownRemainingMs > 0;
  const buttonDisabled = isBusy || globalRead.phase === "checkingCache" || globalRead.status === "NOT_CONFIGURED";
  const interpretation = globalRead.interpretation;

  // Same pattern as GoldOvernightSection: hidden by default (even a cached
  // report starts collapsed on page load), a "Show" button reveals it, and a
  // fresh manual trigger auto-reopens with a brief confirmation.
  const [collapsed, setCollapsed] = useState(true);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const wasTriggeredRef = useRef(false);

  function handleTrigger() {
    wasTriggeredRef.current = true;
    globalRead.trigger();
  }

  useEffect(() => {
    if (!wasTriggeredRef.current || isBusy) return;
    wasTriggeredRef.current = false;
    if (globalRead.status === "OK" || globalRead.status === "COOLDOWN") {
      setCollapsed(false);
      setShowConfirmation(true);
    }
  }, [isBusy, globalRead.status]);

  useEffect(() => {
    if (!showConfirmation) return;
    const id = setTimeout(() => setShowConfirmation(false), CONFIRMATION_VISIBLE_MS);
    return () => clearTimeout(id);
  }, [showConfirmation]);

  return (
    <section className={styles.section}>
      <div className={styles.headerRow}>
        <span className={styles.title}>{t("globalRead.title")}</span>
        {interpretation && (
          <button type="button" className={styles.collapseButton} onClick={() => setCollapsed((c) => !c)}>
            {collapsed ? t("globalRead.expand") : t("globalRead.collapse")}
          </button>
        )}
      </div>
      <p className={styles.intro}>{language === "FR" ? "Analyse manuelle : données vérifiées, deux lectures indépendantes, confrontation puis scénarios. Aucun appel IA au chargement." : "Manual analysis: verified data, two independent reads, cross-examination, then scenarios. No AI call on page load."}</p>

      <button type="button" className={styles.primaryButton} onClick={handleTrigger} disabled={buttonDisabled}>
        {isBusy ? t("globalRead.analyzing") : t("globalRead.button")}
      </button>

      {showConfirmation && <p aria-live="polite" className={styles.confirmationText}>{t("globalRead.confirmation")}</p>}

      {globalRead.status === "NOT_CONFIGURED" && <p className={styles.statusText}>{t("globalRead.notConfigured")}</p>}
      {globalRead.status === "COOLDOWN" && cooldownActive && (
        <p className={styles.statusText}>
          {t("globalRead.cooldownPrefix")} {Math.ceil(globalRead.cooldownRemainingMs / 60_000)} min {t("globalRead.cooldownSuffix")}
        </p>
      )}
      {/* The backend authors a distinct explanation per cooldown reason (same input
          snapshot → historical audit reused; run already in flight → no duplicate CLI
          call). Without this the "already running" case renders nothing at all, since
          it carries no countdown. */}
      {globalRead.status === "COOLDOWN" && globalRead.message && <p className={styles.statusText}>{globalRead.message}</p>}
      {globalRead.status === "UNAVAILABLE" && <p aria-live="polite" className={styles.errorText}>{globalRead.message ?? t("globalRead.unavailable")}</p>}

      {interpretation && !collapsed && (interpretation.decision
        ? <GlobalReadDecisionReport decision={interpretation.decision} french={language === "FR"} />
        : <GlobalReadReport interpretation={interpretation} t={t} />)}
    </section>
  );
}
