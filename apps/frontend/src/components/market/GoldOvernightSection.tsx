"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslation } from "@/i18n/useTranslation";
import { useGoldOvernightRecap } from "@/hooks/useGoldOvernightRecap";
import styles from "./GlobalReadSection.module.css";

const CONFIRMATION_VISIBLE_MS = 5000;

export function GoldOvernightSection() {
  const { t, language } = useTranslation();
  const recap = useGoldOvernightRecap(language);
  const isBusy = recap.phase === "analyzing";
  const cooldownActive = recap.cooldownRemainingMs > 0;
  const buttonDisabled = isBusy || cooldownActive || recap.status === "NOT_CONFIGURED";
  const report = recap.status === "OK" ? recap.recap : null;

  // User-requested (2026-09): hidden by default (even a cached, previously
  // generated recap starts collapsed on page load) — a "Show" button reveals
  // the last recap on demand. Re-running the analysis (a new click on the
  // button) both refreshes the content and re-opens it automatically, plus
  // surfaces a brief on-screen confirmation so a re-run doesn't look like
  // nothing happened.
  const [collapsed, setCollapsed] = useState(true);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const wasTriggeredRef = useRef(false);

  function handleTrigger() {
    wasTriggeredRef.current = true;
    recap.trigger();
  }

  useEffect(() => {
    if (!wasTriggeredRef.current || isBusy) return;
    wasTriggeredRef.current = false;
    if (recap.status === "OK") {
      setCollapsed(false);
      setShowConfirmation(true);
    }
  }, [isBusy, recap.status]);

  useEffect(() => {
    if (!showConfirmation) return;
    const id = setTimeout(() => setShowConfirmation(false), CONFIRMATION_VISIBLE_MS);
    return () => clearTimeout(id);
  }, [showConfirmation]);

  return (
    <section className={styles.section}>
      <div className={styles.headerRow}>
        <span className={styles.title}>{t("goldOvernight.title")}</span>
        {report && (
          <button type="button" className={styles.collapseButton} onClick={() => setCollapsed((c) => !c)}>
            {collapsed ? t("goldOvernight.expand") : t("goldOvernight.collapse")}
          </button>
        )}
      </div>
      <p className={styles.intro}>{t("goldOvernight.intro")}</p>

      <button type="button" className={styles.primaryButton} onClick={handleTrigger} disabled={buttonDisabled}>
        {isBusy ? t("goldOvernight.analyzing") : t("goldOvernight.button")}
      </button>

      {showConfirmation && <p className={styles.confirmationText}>{t("goldOvernight.confirmation")}</p>}

      {recap.status === "NOT_CONFIGURED" && <p className={styles.statusText}>{t("goldOvernight.notConfigured")}</p>}
      {recap.status === "COOLDOWN" && cooldownActive && (
        <p className={styles.statusText}>
          {t("goldOvernight.cooldownPrefix")} {Math.ceil(recap.cooldownRemainingMs / 60_000)} min {t("goldOvernight.cooldownSuffix")}
        </p>
      )}
      {recap.status === "UNAVAILABLE" && <p className={styles.errorText}>{recap.message ?? t("goldOvernight.unavailable")}</p>}

      {report && !collapsed && (
        <div className={styles.report}>
          <div className={styles.reportGroup}>
            <span className={styles.groupTitle}>{t("goldOvernight.summaryHeading")}</span>
            <p className={styles.itemText}>{report.combinedSummary}</p>
          </div>

          <div className={styles.reportGroup}>
            <span className={styles.groupTitle}>{t("goldOvernight.keyMovesHeading")}</span>
            <ul className={styles.plainList}>
              {report.combinedKeyMoves.map((m, i) => (
                <li key={i} className={styles.plainListItem}>
                  {m}
                </li>
              ))}
            </ul>
          </div>

          <div className={styles.reportGroup}>
            <span className={styles.groupTitle}>{t("goldOvernight.catalystsHeading")}</span>
            <ul className={styles.plainList}>
              {report.combinedCatalysts.map((c, i) => (
                <li key={i} className={styles.plainListItem}>
                  {c}
                </li>
              ))}
            </ul>
          </div>

        </div>
      )}
    </section>
  );
}
