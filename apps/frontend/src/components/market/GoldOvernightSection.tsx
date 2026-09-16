"use client";

import { useState } from "react";
import { useTranslation } from "@/i18n/useTranslation";
import { useGoldOvernightRecap } from "@/hooks/useGoldOvernightRecap";
import styles from "./GlobalReadSection.module.css";

/** Read-only display — no manual trigger (2026-09-15 decision: automation-only, see apps/backend/src/jobs/goldOvernightAutoRecap.ts). */
export function GoldOvernightSection({ compact = false }: { compact?: boolean }) {
  const { t, language } = useTranslation();
  const recap = useGoldOvernightRecap(language);
  const report = recap.status === "OK" ? recap.recap : null;
  const [collapsed, setCollapsed] = useState(true);

  return (
    <section className={`${styles.section} ${compact ? styles.compact : ""}`}>
      <div className={styles.headerRow}>
        <span className={styles.title}>{t("goldOvernight.title")}</span>
        {report && (
          <button type="button" className={styles.collapseButton} onClick={() => setCollapsed((c) => !c)}>
            {collapsed ? t("goldOvernight.expand") : t("goldOvernight.collapse")}
          </button>
        )}
      </div>
      <p className={styles.intro}>{t("goldOvernight.intro")}</p>

      {recap.phase === "ready" && recap.configuredProviderCount === 0 && (
        <p className={styles.statusText}>{t("goldOvernight.notConfigured")}</p>
      )}
      {recap.phase === "ready" && recap.configuredProviderCount > 0 && recap.status === "NONE" && (
        <p className={styles.statusText}>{t("goldOvernight.pending")}</p>
      )}

      {report && !collapsed && (
        <div className={styles.report}>
          <div className={styles.reportGroup}>
            <p className={styles.itemText}>{report.recapText}</p>
          </div>
        </div>
      )}
    </section>
  );
}
