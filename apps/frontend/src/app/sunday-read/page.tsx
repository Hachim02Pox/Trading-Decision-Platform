"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { fetchSundayRead } from "@/lib/api/sundayReadClient";
import { ScenarioTree } from "@/components/sundayRead/ScenarioTree";
import { GlossaryText } from "@/components/sundayRead/GlossaryText";
import { useTranslation } from "@/i18n/useTranslation";
import styles from "./page.module.css";

const horizonKeys = ["tactical", "medium", "structural"] as const;
const orientation: Record<string, Record<string, string>> = { FR: { BULLISH: "HAUSSIER", BEARISH: "BAISSIER", MIXED: "MITIGÉ", UNCLEAR: "INCERTAIN" }, EN: { BULLISH: "BULLISH", BEARISH: "BEARISH", MIXED: "MIXED", UNCLEAR: "UNCLEAR" } };

export default function SundayReadPage() { return <Suspense fallback={<main className={styles.page}>Loading…</main>}><SundayReadContent /></Suspense>; }
function SundayReadContent() {
  const { t, language } = useTranslation();
  const params = useSearchParams();
  const [read, setRead] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const date = params.get("date") ?? undefined;
  useEffect(() => { fetchSundayRead(date).then(setRead).catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Unable to load Sunday Read")); }, [date]);
  if (error) return <main className={styles.page}><p className={styles.error}>{error}</p></main>;
  if (!read) return <main className={styles.page}>{t("sunday.loading")}</main>;
  const locale = language === "FR" ? "fr" : "en";
  const presentation = read.presentation?.version === 2 ? read.presentation[locale] : undefined;
  const story = presentation?.market_story;
  const glossary = read.glossary ?? [];
  const rich = (value?: string) => <GlossaryText text={value ?? ""} glossary={glossary} language={language} />;
  const legacySurprises = () => read.priced_in.surprise_candidates.map((item: any) => ({
    baseline_explained: item.baseline,
    surprise_explained: item.surprise_condition,
    transmission_explained: item.first_channel,
  }));
  return <main className={styles.page}>
    <header className={styles.header}>
      <span>{t("sunday.title")}</span>
      <h1>{presentation?.subtitle ?? read.meta.week_of}</h1>
    </header>
    <section className={styles.story}><h2>{t("sunday.story")}</h2>
      {story ? <div className={styles.storyGrid}><article><h3>{t("sunday.past")}</h3><p>{rich(story.past_week)}</p></article><article><h3>{t("sunday.now")}</h3><p>{rich(story.current_setup)}</p></article><article><h3>{t("sunday.ahead")}</h3><p>{rich(story.week_ahead)}</p></article></div> : String(read.executive_narrative).split("\n\n").map((paragraph: string, i: number) => <p key={i}>{paragraph}</p>)}
    </section>
    <section><h2>{t("sunday.contexts")}</h2><div className={styles.grid}>{horizonKeys.map((key) => {
      const legacy = read.contexts[key]; const card = presentation?.horizons?.[key];
      return <article key={key}><span className={styles.orientation}>{orientation[language][legacy.orientation] ?? legacy.orientation}</span><h3>{t(`sunday.${key}` as never)}</h3><p>{rich(card?.summary ?? legacy.why)}</p><details><summary>{t("sunday.why")}</summary><p>{rich(card?.summary ?? legacy.why)}</p><p><b>{t("sunday.supports")}</b><br />{card?.supporting_points ? card.supporting_points.map((point: string, i: number) => <span key={i}>{rich(point)}<br /></span>) : null}</p><p><b>{t("sunday.contradicts")}</b><br />{rich(card?.counter_case ?? legacy.competing_thesis)}</p><p><b>{t("sunday.changes")}</b><br />{rich(card?.invalidation_explained ?? legacy.invalidation)}</p></details></article>;
    })}</div></section>
    <section><h2>{t("sunday.priced")}</h2><div className={styles.split}><article>{(presentation?.priced_in?.already_priced ?? read.priced_in.already_priced).map((item: string) => <p key={item}>{rich(item)}</p>)}</article><article><h3>{t("sunday.surprise")}</h3>{(presentation?.priced_in?.surprises ?? legacySurprises()).map((item: any, i: number) => <div key={i} className={styles.surprise}>{item.title && <h4>{rich(item.title)}</h4>}<b>{t("sunday.expected")}</b><p>{rich(item.baseline_explained)}</p><b>{t("sunday.surpriseItem")}</b><p>{rich(item.surprise_explained)}</p><b>{t("sunday.firstReaction")}</b><p>{rich(item.transmission_explained)}</p>{item.gold_confirmation && <><b>{t("sunday.confirmation")}</b><p>{rich(item.gold_confirmation)}</p></>}</div>)}</article></div></section>
    <ScenarioTree tree={read.scenario_tree} evidence={read.evidence} sources={read.sources} scenarioExplanations={read.scenario_explanations} presentation={presentation?.scenario_tree} walkthrough={presentation?.walkthrough} glossary={glossary} language={language} />
    <section><h2>{t("sunday.opportunity")}</h2><strong>{read.asymmetry.edge === "NO_EDGE" ? (presentation?.asymmetry?.headline ?? t("sunday.noEdge")) : orientation[language][read.asymmetry.edge] ?? read.asymmetry.edge}</strong><p>{rich(presentation?.asymmetry?.summary ?? read.asymmetry.summary)}</p>{presentation?.asymmetry?.why && <details><summary>{t("sunday.why")}</summary><p>{rich(presentation.asymmetry.why)}</p><p>{rich(presentation.asymmetry.what_would_change_it)}</p></details>}</section>
  </main>;
}
