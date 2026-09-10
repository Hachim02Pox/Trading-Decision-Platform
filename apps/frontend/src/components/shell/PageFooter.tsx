"use client";

import { useTranslation } from "@/i18n/useTranslation";
import styles from "./PageFooter.module.css";

/**
 * Replaces the old top StatusBar (clock + connection badge, a full-width
 * row directly under the nav). Per product decision, that row was too
 * prominent — this keeps only the data-provenance caption, small and at
 * the bottom of the page.
 */
export function PageFooter() {
  const { t } = useTranslation();

  return (
    <footer className={styles.footer}>
      <span className={styles.caption}>{t("status.mockData")}</span>
    </footer>
  );
}
