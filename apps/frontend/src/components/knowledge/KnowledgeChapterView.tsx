"use client";
import Link from "next/link";
import type { KnowledgeChapterLike } from "@/content/knowledge";
import { getFamilyKnowledgeHref } from "@/content/knowledge/knowledgeMap";
import { useTranslation } from "@/i18n/useTranslation";
import styles from "./Knowledge.module.css";

// One entry per family with an explainer video. Adding a new family's video is
// a one-line addition here — no new branch in the component below.
const FAMILY_VIDEO: Partial<Record<KnowledgeChapterLike["familyId"], { src: string; poster: string }>> = {
  F2: { src: "/videos/f2-taux-reels.mp4", poster: "/videos/f2-taux-reels-poster.jpg" },
  F3: { src: "/videos/f3-fed-anticipations.mp4", poster: "/videos/f3-fed-anticipations-poster.jpg" },
  F4: { src: "/videos/f4-inflation.mp4", poster: "/videos/f4-inflation-poster.jpg" },
  F5: { src: "/videos/f5-emploi-croissance.mp4", poster: "/videos/f5-emploi-croissance-poster.jpg" },
  F6: { src: "/videos/f6-dollar-change.mp4", poster: "/videos/f6-dollar-change-poster.jpg" },
};

export function KnowledgeChapterView({ chapter }: { chapter: KnowledgeChapterLike }) {
  const { t, language } = useTranslation();
  const video = FAMILY_VIDEO[chapter.familyId];
  return <main className={styles.page}>
    <Link className={styles.backLink} href="/knowledge">{t("knowledge.backToIndex")}</Link>
    <header className={styles.chapterHeader}><span className={styles.familyCode}>{chapter.familyId}</span><h1 className={styles.chapterTitle}>{chapter.title[language]}</h1><p className={styles.intro}>{chapter.description[language]}</p>
      <h2 className={styles.metaTitle}>{t("knowledge.learningObjectives")}</h2><ul className={styles.list}>{chapter.learningObjectives.map((item, i) => <li key={i}>{item[language]}</li>)}</ul></header>
    {video && (
      <section className={styles.videoSection}>
        <h2 className={styles.metaTitle}>{t("knowledge.videoTitle")}</h2>
        <video
          className={styles.video}
          controls
          preload="metadata"
          poster={video.poster}
        >
          <source src={video.src} type="video/mp4" />
          {t("knowledge.videoUnsupported")}
        </video>
      </section>
    )}
    {chapter.sections.map((section) => <section className={styles.section} id={section.id} key={section.id}><h2 className={styles.sectionTitle}>{section.title[language]}</h2><p className={styles.summary}>{section.summary[language]}</p>
      {(section.paragraphs ?? []).map((item, i) => <p className={styles.paragraph} key={i}>{item[language]}</p>)}
      {section.bullets && <ul className={styles.list}>{section.bullets.map((item, i) => <li key={i}>{item[language]}</li>)}</ul>}
      {section.examples?.map((example) => <article className={styles.example} key={example.id}><h3 className={styles.exampleTitle}>{example.title[language]}</h3><p className={styles.paragraph}>{example.setup[language]}</p><ol className={styles.list}>{example.steps.map((step, i) => <li key={i}>{step[language]}</li>)}</ol><p className={styles.paragraph}>{example.conclusion[language]}</p></article>)}
    </section>)}
    <section className={styles.metaSection}><h2 className={styles.metaTitle}>{t("knowledge.glossary")}</h2><dl className={styles.glossary}>{chapter.glossary.map((entry) => <div key={entry.id}><dt>{entry.term}</dt><dd>{entry.definition[language]}</dd></div>)}</dl>
      <h2 className={styles.metaTitle}>{t("knowledge.keyTakeaways")}</h2><ul className={styles.list}>{chapter.takeaways.map((item, i) => <li key={i}>{item[language]}</li>)}</ul>
      <h2 className={styles.metaTitle}>{t("knowledge.relatedTopics")}</h2><nav className={styles.related}>{chapter.relatedTopics.map((id) => <Link className={styles.relatedLink} key={id} href={getFamilyKnowledgeHref(id as KnowledgeChapterLike["familyId"])}>{id}</Link>)}</nav></section>
  </main>;
}
