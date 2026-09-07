"use client";
import Link from "next/link";
import { KNOWLEDGE_CHAPTERS } from "@/content/knowledge";
import { getFamilyKnowledgeHref } from "@/content/knowledge/knowledgeMap";
import { useTranslation } from "@/i18n/useTranslation";
import styles from "./Knowledge.module.css";

export function KnowledgeIndex() {
  const { t, language } = useTranslation();
  return <main className={styles.page}>
    <h1 className={styles.pageTitle}>{t("pageTitle.knowledge")}</h1><p className={styles.intro}>{t("knowledge.indexIntro")}</p>
    <div className={styles.indexGrid}>{KNOWLEDGE_CHAPTERS.map((chapter) => <Link key={chapter.familyId} className={styles.chapterCard} href={getFamilyKnowledgeHref(chapter.familyId)}>
      <span className={styles.familyCode}>{chapter.familyId}</span><h2 className={styles.cardTitle}>{chapter.title[language]}</h2><p className={styles.cardDescription}>{chapter.description[language]}</p>
    </Link>)}</div>
  </main>;
}
