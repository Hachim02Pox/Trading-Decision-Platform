"use client";

import { GoldOvernightSection } from "@/components/market/GoldOvernightSection";
import { GoldNewsLive } from "@/components/workspace/GoldNewsLive";
import { useTranslation } from "@/i18n/useTranslation";
import styles from "./Workspace.module.css";

export function NewsWorkspace() {
  const { t } = useTranslation();
  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <div><h1 className={styles.pageTitle}>{t("pageTitle.news")}</h1><p className={styles.pageIntro}>{t("news.feedIntro")}</p></div>
      </header>
      <GoldOvernightSection compact />
      <GoldNewsLive />
    </div>
  );
}
