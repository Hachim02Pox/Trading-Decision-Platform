"use client";

import { GoldOvernightSection } from "@/components/market/GoldOvernightSection";
import { useTranslation } from "@/i18n/useTranslation";
import styles from "./Workspace.module.css";

export function NewsWorkspace() {
  const { t } = useTranslation();
  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <div><h1 className={styles.pageTitle}>{t("pageTitle.news")}</h1><p className={styles.pageIntro}>{t("news.intro")}</p></div>
      </header>
      <section className={styles.module}>
        <span className={styles.moduleTitle}>{t("news.processTitle")}</span>
        <div className={styles.researchFlow}>
          <div className={styles.researchStep}>{t("news.step1")}</div>
          <div className={styles.researchStep}>{t("news.step2")}</div>
          <div className={styles.researchStep}>{t("news.step3")}</div>
          <div className={styles.researchStep}>{t("news.step4")}</div>
        </div>
      </section>
      <GoldOvernightSection />
      <p className={styles.notice}>{t("news.costNotice")}</p>
    </div>
  );
}
