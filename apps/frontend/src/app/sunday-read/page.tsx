"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { getPresentationRenderPlan } from "@/lib/sundayRead/presentationPlan";
import { fetchCurrentGoldRead, fetchGoldReadByRunId, fetchGoldReadHistory, orderGoldReadLineage, type GoldReadEnvelope, type GoldReadHistoryEntry, type GoldReadMeta } from "@/lib/api/goldReadClient";
import { ScenarioTree } from "@/components/sundayRead/ScenarioTree";
import { GlossaryText } from "@/components/sundayRead/GlossaryText";
import { V4Presentation } from "@/components/sundayRead/V4Presentation";
import { useTranslation } from "@/i18n/useTranslation";
import { createEdgeCheck, fetchEdgeCheck, fetchLatestEdgeCheck, type EdgeCheck } from "@/lib/api/goldEdgeCheckClient";
import { fetchNextRecap, type NextRecap } from "@/lib/api/goldNextRecapClient";
import styles from "./page.module.css";

const horizonKeys = ["tactical", "medium", "structural"] as const;
const orientation: Record<string, Record<string, string>> = { FR: { BULLISH: "HAUSSIER", BEARISH: "BAISSIER", MIXED: "MITIGÉ", UNCLEAR: "INCERTAIN" }, EN: { BULLISH: "BULLISH", BEARISH: "BEARISH", MIXED: "MIXED", UNCLEAR: "UNCLEAR" } };
// Fallback plain-language labels for direction_state's four fields when no
// V3 presentation display copy exists yet (e.g. an analytical-only document).
const stateLabels: Record<string, Record<string, string>> = {
  FR: { BULLISH: "Haussier", BEARISH: "Baissier", MIXED: "Mitigé", UNCLEAR: "Incertain", BALANCED: "Équilibré", UNKNOWN: "Inconnu", CROWDED: "Encombré", LATE: "Tardif", NO_EDGE: "Pas d'avantage" },
  EN: { BULLISH: "Bullish", BEARISH: "Bearish", MIXED: "Mixed", UNCLEAR: "Unclear", BALANCED: "Balanced", UNKNOWN: "Unknown", CROWDED: "Crowded", LATE: "Late", NO_EDGE: "No edge" },
};
const directionFieldTitles: Record<string, Record<string, string>> = {
  FR: { macro_direction: "Direction macro", directional_asymmetry: "Asymétrie directionnelle", positioning_asymmetry: "Asymétrie de positionnement", edge: "Avantage (edge)" },
  EN: { macro_direction: "Macro direction", directional_asymmetry: "Directional asymmetry", positioning_asymmetry: "Positioning asymmetry", edge: "Edge" },
};
const familyAuditLabel: Record<string, Record<string, string>> = {
  FR: { UPDATED: "Mise à jour", UNCHANGED: "Inchangé", PARTIAL: "Partiel", NOT_DUE: "Pas encore attendu", UNKNOWN: "Inconnu", INVALIDATED: "Invalidé" },
  EN: { UPDATED: "Updated", UNCHANGED: "Unchanged", PARTIAL: "Partial", NOT_DUE: "Not due yet", UNKNOWN: "Unknown", INVALIDATED: "Invalidated" },
};
const transitionLabel: Record<string, Record<string, string>> = {
  FR: {
    NOT_TESTED: "Non testé", CONDITION_TRIGGERED: "Condition déclenchée", TRANSMISSION_PARTIAL: "Transmission partielle",
    TRANSMISSION_CONFIRMED: "Transmission confirmée", FLOW_CONFIRMATION_PENDING: "En attente de confirmation par les flux",
    FLOW_CONFIRMED: "Confirmé par les flux", CONTRADICTED: "Contredit", INVALIDATED: "Invalidé", EXPIRED: "Expiré", SCENARIO_VALIDATED: "Scénario validé",
  },
  EN: {
    NOT_TESTED: "Not tested", CONDITION_TRIGGERED: "Condition triggered", TRANSMISSION_PARTIAL: "Transmission partial",
    TRANSMISSION_CONFIRMED: "Transmission confirmed", FLOW_CONFIRMATION_PENDING: "Awaiting flow confirmation",
    FLOW_CONFIRMED: "Flow confirmed", CONTRADICTED: "Contradicted", INVALIDATED: "Invalidated", EXPIRED: "Expired", SCENARIO_VALIDATED: "Scenario validated",
  },
};

function familyChipClass(status: string | undefined): string {
  if (status === "UPDATED") return styles.familyUpdated;
  if (status === "PARTIAL" || status === "UNKNOWN") return styles.familyPartial;
  if (status === "INVALIDATED") return styles.familyInvalidated;
  return styles.familyChip;
}

function formatNewYork(iso: string | null | undefined, language: "EN" | "FR"): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  try {
    return new Intl.DateTimeFormat(language === "FR" ? "fr-CA" : "en-US", {
      timeZone: "America/New_York",
      dateStyle: "long",
      timeStyle: "short",
    }).format(date);
  } catch {
    return iso;
  }
}

export default function SundayReadPage() { return <Suspense fallback={<main className={styles.page}>Loading…</main>}><SundayReadContent /></Suspense>; }

function SundayReadContent() {
  const { t, language } = useTranslation();
  const searchParams = useSearchParams();
  const requestedRunId = searchParams.get("runId");
  const [read, setRead] = useState<any>(null);
  const [meta, setMeta] = useState<GoldReadMeta | null>(null);
  const [history, setHistory] = useState<GoldReadHistoryEntry[]>([]);
  const [allHistory, setAllHistory] = useState<GoldReadHistoryEntry[]>([]);
  const [lineageReads, setLineageReads] = useState<GoldReadEnvelope[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [edgeCheck, setEdgeCheck] = useState<EdgeCheck | null>(null);
  const [edgeCheckError, setEdgeCheckError] = useState<string | null>(null);
  const [nextRecap, setNextRecap] = useState<NextRecap | null>(null);
  useEffect(() => {
    setRead(null);
    setMeta(null);
    setError(null);
    setHistory([]); setAllHistory([]); setLineageReads([]);
    const task = Promise.all([
      requestedRunId ? fetchGoldReadByRunId(requestedRunId) : fetchCurrentGoldRead(),
      fetchGoldReadHistory(),
    ]).then(async ([env, fullHistory]) => {
      const lineage = orderGoldReadLineage(fullHistory, env.meta.run_id);
      setRead(env.run);
      setMeta(env.meta);
      setHistory(lineage); setAllHistory(fullHistory);
      const states = await Promise.all(lineage.map((entry) => entry.run_id === env.meta.run_id ? env : fetchGoldReadByRunId(entry.run_id)));
      setLineageReads(states);
    });
    task.catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Unable to load Sunday Read"));
  }, [requestedRunId]);

  useEffect(() => { fetchNextRecap().then(setNextRecap).catch(() => setNextRecap({ status: "UNAVAILABLE", requested_at: null, timezone: "America/New_York", reason: null, reason_fr: null, reason_en: null, minimum_confirmation_delay: null, parent_state_run_id: null, retrieved_at: new Date().toISOString() })); }, []);

  const locale = language === "FR" ? "fr" : "en";
  // The V3 locale object is a strict superset of the V2 shape (market_story,
  // horizons, priced_in, asymmetry, scenario_tree, walkthrough are unchanged;
  // direction_state/scenario_tree_v3 are additions) — accepting version 3
  // here is the only change needed for every existing V2-era section below
  // to render V3 documents correctly too.
  const renderPlan = getPresentationRenderPlan(read ?? {}, locale);
  const isV3 = renderPlan.kind === "v3" || renderPlan.kind === "v4";
  const isV4 = renderPlan.kind === "v4";
  // V3 is a final localized payload, never an invitation to fill gaps from
  // analytical fields (which are commonly English). Legacy adaptation stays
  // deliberately separate below for pre-V3 documents only.
  const presentation: any = renderPlan.presentation;
  const missingV3Sections = renderPlan.missingSections;
  const v3Unavailable = (section: string) => isV3 && missingV3Sections.includes(section);
  const story = presentation?.market_story;
  const glossary = read?.glossary ?? [];
  const rich = (value?: string) => <GlossaryText text={value ?? ""} glossary={glossary} language={language} />;
  const legacySurprises = () => (read?.priced_in?.surprise_candidates ?? []).map((item: any) => ({
    baseline_explained: item.baseline,
    surprise_explained: item.surprise_condition,
    transmission_explained: item.first_channel,
  }));

  // V3 standalone scenario-tree display copy adapts into the same
  // {nodes,edges} shape ScenarioTree already consumes for V2's
  // presentation.scenario_tree — see ScenarioTree.tsx's NodeCopy/EdgeCopy.
  const scenarioTreeV3 = presentation?.scenario_tree_v3;
  const scenarioTreePresentation = useMemo(() => {
    if (!scenarioTreeV3) return presentation?.scenario_tree;
    return {
      nodes: (scenarioTreeV3.nodes ?? []).map((n: any) => ({
        node_id: n.node_id, label: n.display_title, description: n.display_body,
        why_it_matters: n.why_it_matters, confirmation_needed: n.confirmation_needed,
        display_status: n.display_status, display_category: n.display_category,
      })),
      edges: (scenarioTreeV3.edges ?? []).map((e: any) => ({
        edge_id: e.edge_id, label: e.display_label, explanation: e.display_explanation, confirmation_needed: e.confirmation_needed,
      })),
    };
  }, [scenarioTreeV3, presentation]);

  const runType: "SUNDAY" | "INTERMEDIATE" | null = meta?.run_type ?? read?.meta?.run_type ?? null;
  const originSundayRunId = meta?.origin_sunday_run_id ?? read?.meta?.origin_sunday_run_id ?? null;
  const parentRunId = meta?.parent_run_id ?? read?.meta?.parent_run_id ?? null;
  const currentRunId = meta?.run_id ?? read?.meta?.run_id ?? null;
  const intermediateNumber: number | null = null;
  useEffect(() => { if (!currentRunId) return; fetchLatestEdgeCheck(currentRunId).then(setEdgeCheck).catch(() => setEdgeCheck(null)); }, [currentRunId]);
  useEffect(() => {
    if (!edgeCheck || !["QUEUED", "RUNNING"].includes(edgeCheck.status)) return;
    const timer = window.setInterval(() => fetchEdgeCheck(edgeCheck.check_id).then(setEdgeCheck).catch(() => setEdgeCheckError(language === "FR" ? "Impossible de lire l’état de la vérification." : "Unable to read edge-check status.")), 5000);
    return () => window.clearInterval(timer);
  }, [edgeCheck, language]);
  const startEdgeCheck = async () => {
    setEdgeCheckError(null);
    try { setEdgeCheck(await createEdgeCheck(crypto.randomUUID())); }
    catch (reason) { const code = reason instanceof Error ? reason.message : "EDGE_CHECK_FAILED"; setEdgeCheckError(code === "AUTH_REQUIRED" ? (language === "FR" ? "Connexion requise pour vérifier l’edge." : "Sign in is required to check the edge.") : (language === "FR" ? "La demande n’a pas pu être créée." : "The request could not be created.")); }
  };
  const directionState = read?.direction_state as Record<string, string> | undefined;
  const directionPresentation = presentation?.direction_state as Record<string, { value: string; display: string; explanation: string }> | undefined;
  const familyAudit = read?.family_audit as Record<string, { status: string; notes?: string }> | undefined;
  const scenarioTransitions = read?.scenario_transitions as { scenario_ref: string; transition_state: string }[] | undefined;

  if (error) return <main className={styles.page}><p className={error.includes("Aucun") ? styles.empty : styles.error}>{error.includes("Aucun") ? (language === "FR" ? "Aucun rapport actuel disponible. La prochaine production apparaîtra ici." : "No current report is available. The next production will appear here.") : error}</p></main>;
  if (!read) return <main className={styles.page}>{t("sunday.loading")}</main>;

  const generatedAtLocal = formatNewYork(meta?.generated_at ?? read?.meta?.generated_at, language);

  return <main className={styles.page}>
    <header className={styles.header}>
      <h1>{isV4 ? presentation?.title : presentation?.subtitle ?? read.meta.week_of}</h1>
      <div className={styles.badgeRow}>
        <span className={`${styles.badge} ${runType === "INTERMEDIATE" ? styles.badgeIntermediate : styles.badgeSunday}`}>
          {runType === "INTERMEDIATE"
            ? (language === "FR" ? `Mise à jour intermédiaire${intermediateNumber ? ` n°${intermediateNumber}` : ""}` : `Intermediate update${intermediateNumber ? ` #${intermediateNumber}` : ""}`)
            : (language === "FR" ? "Analyse" : "Analysis")}
        </span>
        {generatedAtLocal && <span className={styles.lineage}>{generatedAtLocal}</span>}
        {!isV4 && meta?.freshness === "CACHED_DRIVE_ERROR" && (
          <span className={styles.lineage}>{language === "FR" ? "Donnée en cache — actualisation Drive indisponible" : "Cached — Drive refresh unavailable"}</span>
        )}
      </div>
      {nextRecap && <aside className={styles.nextRecap} aria-live="polite">
        <strong>{language === "FR" ? "Prochaine mise à jour prévue" : "Next scheduled update"}</strong>
        {nextRecap.status === "SCHEDULED" && <span>{formatNewYork(nextRecap.requested_at, language)}</span>}
        {nextRecap.status === "DUE" && <span>{language === "FR" ? "Mise à jour attendue — en attente de traitement." : "Update is due — awaiting processing."}</span>}
        {nextRecap.status === "CONSUMED" && <span>{language === "FR" ? "La dernière mise à jour planifiée a été traitée." : "The previous scheduled update has been processed."}</span>}
        {["EXPIRED", "CANCELLED", "INVALID", "UNAVAILABLE"].includes(nextRecap.status) && <span>{language === "FR" ? "Aucune prochaine mise à jour confirmée." : "No next update is confirmed."}</span>}
        {["SCHEDULED", "DUE"].includes(nextRecap.status) && <>{(() => { const reason = language === "FR" ? nextRecap.reason_fr ?? nextRecap.reason : nextRecap.reason_en ?? nextRecap.reason; const delay = language === "FR" ? nextRecap.minimum_confirmation_delay?.fr : nextRecap.minimum_confirmation_delay?.en; return <>{reason ? <small>{reason}</small> : <small>{language === "FR" ? "La raison de cette mise à jour n’est pas disponible." : "The reason for this update is unavailable."}</small>}{delay && <small>{language === "FR" ? "Délai minimal de confirmation : " : "Minimum confirmation delay: "}{delay}</small>}</>; })()}</>}
      </aside>}
      {runType === "INTERMEDIATE" && (originSundayRunId || parentRunId) && (
        <p className={styles.lineage}>
          {language === "FR" ? "Origine : " : "Origin: "}
          {originSundayRunId && <a href={`?runId=${encodeURIComponent(originSundayRunId)}`}>{originSundayRunId}</a>}
          {parentRunId && parentRunId !== originSundayRunId && <> · {language === "FR" ? "état parent : " : "parent state: "}<a href={`?runId=${encodeURIComponent(parentRunId)}`}>{parentRunId}</a></>}
        </p>
      )}
      <div className={styles.archives}>
        <div>
          <button type="button" className={styles.historyToggle} onClick={() => setShowHistory((v) => !v)}>
            {showHistory ? (language === "FR" ? "Masquer l'historique" : "Hide history") : (language === "FR" ? `Historique (${history.length})` : `History (${history.length})`)}
          </button>
          {showHistory && (
            <ul className={styles.historyList}>
              {allHistory.filter((h) => h.origin_sunday_run_id !== originSundayRunId || h.run_id === currentRunId).map((h) => (
                <li key={h.run_id} className={h.run_id === currentRunId ? styles.historyCurrent : undefined}>
                  <a href={`?runId=${encodeURIComponent(h.run_id)}`}>
                    {h.run_type === "INTERMEDIATE" ? (language === "FR" ? "Intermédiaire" : "Intermediate") : (language === "FR" ? "Sunday Read" : "Sunday Read")} — {formatNewYork(h.generated_at, language) ?? h.as_of ?? h.run_id}
                  </a>
                  {h.run_id === currentRunId && <span>{language === "FR" ? "actuel" : "current"}</span>}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </header>

    {isV3 && missingV3Sections.length > 0 && <p className={styles.error} role="status">{language === "FR" ? "Présentation incomplète — certaines sections localisées n’ont pas été publiées." : "Incomplete presentation — some localized sections were not published."}</p>}

    {!isV4 && (!isV3 ? directionState : directionPresentation) && (
      <section>
        <h2>{language === "FR" ? "Direction, asymétrie et avantage" : "Direction, asymmetry and edge"}</h2>
        <div className={styles.direction4}>
          {(["macro_direction", "directional_asymmetry", "positioning_asymmetry", "edge"] as const).map((field) => {
            const raw = directionState?.[field];
            const display = directionPresentation?.[field];
            return (
              <article key={field}>
                <h4>{directionFieldTitles[language][field]}</h4>
                <strong>{isV3 ? display?.display : (display?.display ?? stateLabels[language][raw ?? ""] ?? raw)}</strong>
                <p>{rich(display?.explanation)}</p>
              </article>
            );
          })}
        </div>
        <div className={styles.edgeCheck} aria-live="polite">
          <button type="button" className={styles.edgeCheckButton} onClick={startEdgeCheck} disabled={!currentRunId || edgeCheck?.status === "QUEUED" || edgeCheck?.status === "RUNNING"}>
            {language === "FR" ? "Vérifier l’edge maintenant" : "Check the edge now"}
          </button>
          {edgeCheck && <p>{edgeCheck.status === "QUEUED" ? (language === "FR" ? "Demande en file d’attente : aucun verdict n’a encore été produit." : "Request queued: no verdict has been produced yet.") : edgeCheck.status === "RUNNING" ? (language === "FR" ? "Contrôle manuel en cours des changements matériels depuis le cutoff de l’état de base." : "Manual check in progress for material changes since the base-state cutoff.") : edgeCheck.status === "FAILED" ? (language === "FR" ? "La vérification a échoué techniquement. Aucun verdict n’a été produit." : "The check failed technically. No verdict was produced.") : `${language === "FR" ? "Dernier contrôle" : "Last check"}: ${formatNewYork(edgeCheck.completed_at ?? edgeCheck.created_at, language)}`}</p>}
          {edgeCheck?.status === "COMPLETED" && edgeCheck.result && <details><summary>{language === "FR" ? "Résultat du contrôle manuel (distinct du Sunday Read)" : "Manual check result (separate from the Sunday Read)"}</summary><p>{language === "FR" ? ({ NO_GAME_CHANGER: "Aucun changement fondamental majeur détecté", GAME_CHANGER_DETECTED: "Changement majeur détecté — edge suspendu", INSUFFICIENT_EVIDENCE: "Événement possible, confirmation insuffisante", FAILED: "Vérification impossible" }[String(edgeCheck.result.verdict)] ?? "Conclusion structurée disponible.") : ({ NO_GAME_CHANGER: "No major fundamental change detected", GAME_CHANGER_DETECTED: "Major change detected — edge suspended", INSUFFICIENT_EVIDENCE: "Possible event, insufficient confirmation", FAILED: "Verification unavailable" }[String(edgeCheck.result.verdict)] ?? "Structured conclusion available.")}</p><p>{String(edgeCheck.result.causal_transmission ?? edgeCheck.result.ordinary_market_context ?? "")}</p></details>}
          {edgeCheckError && <p className={styles.error}>{edgeCheckError}</p>}
          {currentRunId && <small>{language === "FR" ? "État de base" : "Base state"}: {currentRunId}</small>}
        </div>
      </section>
    )}

    {runType === "INTERMEDIATE" && (familyAudit || (scenarioTransitions && scenarioTransitions.length > 0)) && (
      <section>
        <h2>{language === "FR" ? "Ce qui a changé depuis la dernière analyse" : "What changed since the last analysis"}</h2>
        {familyAudit && (
          <div className={styles.familyAudit}>
            {(["F1", "F2", "F3", "F4", "F5", "F6"] as const).filter((f) => familyAudit[f]).map((f) => (
              <span key={f} className={`${styles.familyChip} ${familyChipClass(familyAudit[f].status)}`} title={familyAudit[f].notes}>
                {f} · {familyAuditLabel[language][familyAudit[f].status] ?? familyAudit[f].status}
              </span>
            ))}
          </div>
        )}
        {scenarioTransitions && scenarioTransitions.length > 0 && (
          <ul>
            {scenarioTransitions.map((tr) => (
              <li key={tr.scenario_ref}>{tr.scenario_ref} — {transitionLabel[language][tr.transition_state] ?? tr.transition_state}</li>
            ))}
          </ul>
        )}
      </section>
    )}

    <NarrativeMarketStory read={read} presentation={presentation} language={language} generatedAt={generatedAtLocal} nextRecap={nextRecap} lineage={lineageReads} />
    {isV4 && runType !== "SUNDAY" && <details className={styles.fullAnalysis}><summary>{language === "FR" ? "Voir l’analyse complète de cette mise à jour" : "See this update’s full analysis"}</summary><V4Presentation presentation={presentation} read={read} glossary={glossary} language={language} scenarioTree={<div id="scenarios"><ScenarioTree tree={read.scenario_tree} evidence={read.evidence} sources={read.sources} scenarioExplanations={read.scenario_explanations} presentation={scenarioTreePresentation} walkthrough={presentation?.walkthrough} glossary={glossary} language={language} /></div>} /></details>}
    {!isV4 && <section className={styles.story}><h2>{t("sunday.story")}</h2>
      {story ? <div className={styles.storyGrid}><article><h3>{t("sunday.past")}</h3><p>{rich(story.past_week)}</p></article><article><h3>{t("sunday.now")}</h3><p>{rich(story.current_setup)}</p></article><article><h3>{t("sunday.ahead")}</h3><p>{rich(story.week_ahead)}</p></article></div> : !isV3 && String(read.executive_narrative).split("\n\n").map((paragraph: string, i: number) => <p key={i}>{paragraph}</p>)}
    </section>}
    {!isV4 && !v3Unavailable("horizons") && <section><h2>{t("sunday.contexts")}</h2><div className={styles.grid}>{horizonKeys.map((key) => {
      const legacy = read.contexts[key]; const card = presentation?.horizons?.[key];
      return <article key={key}><span className={styles.orientation}>{!isV3 ? (orientation[language][legacy.orientation] ?? legacy.orientation) : ""}</span><h3>{t(`sunday.${key}` as never)}</h3><p>{rich(isV3 ? card?.summary : card?.summary ?? legacy.why)}</p><details><summary>{t("sunday.why")}</summary><p><b>{t("sunday.supports")}</b><br />{card?.supporting_points?.map((point: string, i: number) => <span key={i}>{rich(point)}<br /></span>)}</p><p><b>{t("sunday.contradicts")}</b><br />{rich(isV3 ? card?.counter_case : card?.counter_case ?? legacy.competing_thesis)}</p><p><b>{t("sunday.changes")}</b><br />{rich(isV3 ? card?.invalidation_explained : card?.invalidation_explained ?? legacy.invalidation)}</p></details></article>;
    })}</div></section>}
    {!isV4 && !v3Unavailable("priced_in") && <section><h2>{t("sunday.priced")}</h2><div className={styles.split}><article>{(isV3 ? presentation?.priced_in?.already_priced : presentation?.priced_in?.already_priced ?? read.priced_in.already_priced).map((item: string) => <p key={item}>{rich(item)}</p>)}</article><article><h3>{t("sunday.surprise")}</h3>{(isV3 ? presentation?.priced_in?.surprises : presentation?.priced_in?.surprises ?? legacySurprises()).map((item: any, i: number) => <div key={i} className={styles.surprise}>{item.title && <h4>{rich(item.title)}</h4>}<b>{t("sunday.expected")}</b><p>{rich(item.baseline_explained)}</p><b>{t("sunday.surpriseItem")}</b><p>{rich(item.surprise_explained)}</p><b>{t("sunday.firstReaction")}</b><p>{rich(item.transmission_explained)}</p>{item.gold_confirmation && <><b>{t("sunday.confirmation")}</b><p>{rich(item.gold_confirmation)}</p></>}</div>)}</article></div></section>}
    {!isV4 && <div id="scenarios"><ScenarioTree tree={read.scenario_tree} evidence={read.evidence} sources={read.sources} scenarioExplanations={read.scenario_explanations} presentation={scenarioTreePresentation} walkthrough={presentation?.walkthrough} glossary={glossary} language={language} /></div>}
    {!isV4 && !v3Unavailable("opportunity_quality") && <section><h2>{t("sunday.opportunity")}</h2><strong>{isV3 ? presentation?.opportunity_quality?.display : read.asymmetry.edge === "NO_EDGE" ? (presentation?.asymmetry?.headline ?? t("sunday.noEdge")) : orientation[language][read.asymmetry.edge] ?? read.asymmetry.edge}</strong><p>{rich(isV3 ? presentation?.opportunity_quality?.explanation : presentation?.asymmetry?.summary ?? read.asymmetry.summary)}</p></section>}
    {!isV4 && !v3Unavailable("execution_readiness") && <section><h2>{language === "FR" ? "Préparation à l’exécution" : "Execution readiness"}</h2><strong>{presentation?.execution_readiness?.display}</strong><p>{rich(presentation?.execution_readiness?.explanation)}</p></section>}
  </main>;
}

const judgmentKeys = ["macro_direction", "directional_asymmetry", "positioning_asymmetry", "edge", "opportunity_quality", "execution_readiness"] as const;

function narrativeText(value: unknown): string | null {
  if (typeof value === "string" && value.trim()) return value;
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === "string").join(" ") || null;
  return null;
}

function localizedSummary(summary: any, key: string, language: "FR" | "EN"): string | null {
  const item = summary?.[key];
  if (!item || typeof item !== "object") return null;
  return narrativeText(item[language === "FR" ? "fr" : "en"]);
}

function verdictDetail(presentation: any, key: string): { verdict: string | null; explanation: string | null } {
  const item = presentation?.verdict_explanations?.[key] ?? (key === "opportunity_quality" ? presentation?.opportunity_quality : key === "execution_readiness" ? presentation?.execution_readiness : presentation?.direction_state?.[key]);
  return { verdict: narrativeText(item?.verdict) ?? narrativeText(item?.display), explanation: narrativeText(item?.explanation) ?? narrativeText(item?.mechanism) ?? narrativeText(item?.practical_meaning) };
}

function NarrativeMarketStory({ read, presentation, language, generatedAt, nextRecap, lineage }: { read: any; presentation: any; language: "FR" | "EN"; generatedAt: string | null; nextRecap: NextRecap | null; lineage: GoldReadEnvelope[] }) {
  const isFrench = language === "FR";
  const summary = read?.intermediate_summary;
  const auditNotes = !isFrench ? Object.values(read?.family_audit ?? {}).map((entry: any) => narrativeText(entry?.notes)).filter(Boolean) as string[] : [];
  const limit = localizedSummary(summary, "decisive_limit", language) ?? narrativeText(presentation?.market_story?.decisive_limit) ?? (isFrench ? "Les données post-Fed de positionnement et une série comparable d’intérêt ouvert ou d’options ne sont pas encore disponibles de façon vérifiable." : narrativeText(read?.analysis_contract?.explicit_unknowns) ?? narrativeText(read?.unknowns) ?? narrativeText(read?.positioning_evidence?.price_open_interest?.diagnostic));
  const title = read?.meta?.run_type === "INTERMEDIATE" ? (isFrench ? `Mise à jour intermédiaire — semaine du ${read?.meta?.week_of ?? ""}` : `Intermediate update — week of ${read?.meta?.week_of ?? ""}`) : (isFrench ? `Lecture initiale — semaine du ${read?.meta?.week_of ?? ""}` : `Initial reading — week of ${read?.meta?.week_of ?? ""}`);
  return <>
    <section className={styles.currentState} aria-labelledby="current-state-title">
      <div><h2 id="current-state-title">{title}</h2><p>{read?.meta?.run_type === "INTERMEDIATE" ? (isFrench ? "Lecture intermédiaire" : "Intermediate reading") : (isFrench ? "Lecture initiale" : "Initial reading")} · {generatedAt ?? read?.meta?.as_of}</p></div>
      <p className={styles.edgeStatus}><b>{isFrench ? "Raison principale : " : "Main reason: "}</b>{narrativeText(presentation?.market_story?.current_setup) ?? narrativeText(read?.executive_narrative)}</p>
      <div className={styles.judgmentGrid}>{judgmentKeys.map((key) => { const detail = verdictDetail(presentation, key); return <article key={key}><h3>{judgmentLabels[language][key]}</h3><strong>{detail.verdict ?? (isFrench ? "État non déterminé" : "State not determined")}</strong>{detail.explanation && <p>{detail.explanation}</p>}</article>; })}</div>
      {limit && <div className={styles.currentNotes}><p><b>{isFrench ? "Limite décisive : " : "Decisive limit: "}</b>{limit}</p></div>}
      {nextRecap?.requested_at && <div className={styles.currentNotes}><p><b>{isFrench ? "Prochaine vérification : " : "Next check: "}</b>{formatNewYork(nextRecap.requested_at, language)}</p></div>}
    </section>
    {read?.meta?.run_type === "INTERMEDIATE" && <section><h2>{isFrench ? "Ce qui a changé depuis la dernière analyse" : "What changed since the last analysis"}</h2><div className={styles.currentNotes}><p>{localizedSummary(summary, "what_changed", language) ?? narrativeText(presentation?.market_story?.causal_assessment) ?? narrativeText(presentation?.market_story?.current_setup)}</p></div></section>}
    {lineage.length > 0 && <section className={styles.timeline} aria-labelledby="weekly-story-title"><h2 id="weekly-story-title">{isFrench ? "Histoire chronologique de la semaine" : "Chronological market story"}</h2>{lineage.map((state, index) => <NarrativeTimelineCard key={state.meta.run_id} state={state} parent={lineage[index - 1]} language={language} />)}</section>}
  </>;
}

function NarrativeTimelineCard({ state, parent, language }: { state: GoldReadEnvelope; parent: GoldReadEnvelope | undefined; language: "FR" | "EN" }) {
  const isFrench = language === "FR"; const read: any = state.run; const presentation: any = getPresentationRenderPlan(read, isFrench ? "fr" : "en").presentation;
  if (state.meta.run_type === "SUNDAY") return <article className={styles.originRead}><h3>{isFrench ? "Lecture initiale complète" : "Complete initial reading"}</h3><V4Presentation presentation={presentation} read={read} glossary={read.glossary ?? []} language={language} scenarioTree={null} /></article>;
  const parentRead: any = parent?.run; const parentPresentation: any = parentRead ? getPresentationRenderPlan(parentRead, isFrench ? "fr" : "en").presentation : undefined; const summary = read?.intermediate_summary; const summaryMatchesParent = !summary?.parent_run_id || summary.parent_run_id === parent?.meta?.run_id;
  const changed = judgmentKeys.map((key) => ({ key, before: verdictDetail(parentPresentation, key).verdict, after: verdictDetail(presentation, key).verdict, why: verdictDetail(presentation, key).explanation })).filter((item) => item.before !== item.after || item.why);
  const evidence = Array.isArray(read?.evidence) ? read.evidence.filter((item: any) => item?.as_of) : [];
  const observed = summaryMatchesParent ? localizedSummary(summary, "observed_since_parent", language) : null; const remains = summaryMatchesParent ? localizedSummary(summary, "what_remains_true", language) : null; const unknowns = summaryMatchesParent ? localizedSummary(summary, "unknowns", language) : null; const next = summaryMatchesParent ? localizedSummary(summary, "next_watch", language) : null; const inherited = parentPresentation?.market_story?.current_setup;
  return <article className={styles.intermediateCard}><header><h3>{isFrench ? "Mise à jour intermédiaire" : "Intermediate update"}</h3><time>{state.meta.as_of ?? state.meta.generated_at}</time></header><div className={styles.updateAnswers}><p><b>{isFrench ? "Ce qui a été observé : " : "What was observed: "}</b>{observed ?? narrativeText(presentation?.market_story?.current_setup) ?? narrativeText(read?.executive_narrative)}</p><p><b>{isFrench ? "Ce qui reste valable : " : "What remains valid: "}</b>{remains ?? inherited ?? (isFrench ? "Le parent ne publie pas de conclusion localisée comparable ; aucune persistance supplémentaire n’est affirmée." : "The parent does not publish a comparable localized conclusion; no additional persistence is asserted.")}</p><p><b>{isFrench ? "Ce qui manque encore : " : "What remains unknown: "}</b>{unknowns ?? (isFrench ? "Le positionnement post-Fed, l’intérêt ouvert comparable et les données d’options restent à vérifier." : narrativeText(read?.analysis_contract?.explicit_unknowns) ?? narrativeText(read?.unknowns))}</p><p><b>{isFrench ? "À surveiller ensuite : " : "What to watch next: "}</b>{next ?? narrativeText(presentation?.market_story?.week_ahead) ?? narrativeText(read?.dated_catalyst_assessment?.surprise_condition)}</p></div>{changed.length > 0 && <div className={styles.currentNotes}>{changed.map((item) => <p key={item.key}><b>{judgmentLabels[language][item.key]}: </b>{item.before ?? (isFrench ? "lecture précédente non publiée" : "previous reading not published")} → {item.after ?? (isFrench ? "lecture actuelle non publiée" : "current reading not published")}{item.why ? ` — ${item.why}` : ""}</p>)}</div>}<details><summary>{isFrench ? "Preuves et sources de cette mise à jour" : "Evidence and sources for this update"}</summary>{evidence.map((item: any) => <p key={item.id}>{item.statement}{item.as_of ? ` (${item.as_of})` : ""}</p>)}</details><a className={styles.historyToggle} href={`/scenario-tree?runId=${encodeURIComponent(state.meta.run_id)}`}>{isFrench ? "Voir l’arbre des scénarios" : "View the scenario tree"}</a></article>;
}
const judgmentLabels = { FR: { macro_direction: "Direction macro", directional_asymmetry: "Asymétrie directionnelle", positioning_asymmetry: "Asymétrie de positionnement", edge: "Avantage exploitable", opportunity_quality: "Qualité de l’opportunité", execution_readiness: "Préparation à l’exécution" }, EN: { macro_direction: "Macro direction", directional_asymmetry: "Directional asymmetry", positioning_asymmetry: "Positioning asymmetry", edge: "Actionable edge", opportunity_quality: "Opportunity quality", execution_readiness: "Execution readiness" } } as const;

function judgmentCopy(value: unknown, language: "FR" | "EN"): string | null {
  if (typeof value === "string") return value;
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  const localized = record[language === "FR" ? "display_fr" : "display_en"];
  if (typeof localized === "string") return localized;
  return typeof record.value === "string" ? record.value : null;
}

function CurrentStateSummary({ read, presentation, language, generatedAt, nextRecap }: { read: any; presentation: any; language: "FR" | "EN"; generatedAt: string | null; nextRecap: NextRecap | null }) {
  const locale = language === "FR" ? "fr" : "en";
  const verdicts = presentation?.verdict_explanations ?? {};
  const edge = read?.direction_state?.edge ?? verdicts.edge?.verdict;
  const unknown = arrayText(read?.unknowns, language) || arrayText(read?.contradictions, language);
  return <section className={styles.currentState} aria-labelledby="current-state-title">
    <div><h2 id="current-state-title">{language === "FR" ? "État actuel" : "Current state"}</h2><p>{generatedAt ?? (language === "FR" ? "Date de référence non publiée" : "Reference date not published")}</p></div>
    <p className={styles.edgeStatus}>{language === "FR" ? "Edge démontré ? " : "Edge demonstrated? "}<strong>{edge === "BULLISH" || edge === "BEARISH" ? edge : (language === "FR" ? "Non démontré" : "Not demonstrated")}</strong></p>
    <div className={styles.judgmentGrid}>{judgmentKeys.map((key) => <article key={key}><h3>{judgmentLabels[language][key]}</h3><strong>{judgmentCopy(verdicts[key]?.verdict, language) ?? judgmentCopy(read?.[key], language) ?? judgmentCopy(read?.direction_state?.[key], language) ?? (language === "FR" ? "Non publié" : "Not published")}</strong></article>)}</div>
    <div className={styles.currentNotes}><p><b>{language === "FR" ? "Raison principale : " : "Main reason: "}</b>{presentation?.market_story?.current_setup ?? (language === "FR" ? "Explication localisée non publiée." : "Localized explanation not published.")}</p><p><b>{language === "FR" ? "Limite décisive : " : "Decisive limit: "}</b>{unknown ?? (language === "FR" ? "Aucune limite localisée n’a été publiée." : "No localized limit was published.")}</p><p><b>{language === "FR" ? "Prochaine vérification : " : "Next check: "}</b>{nextRecap?.requested_at ? formatNewYork(nextRecap.requested_at, language) : (language === "FR" ? "À confirmer dans le prochain récap." : "To be confirmed in the next recap.")}</p></div>
  </section>;
}

function arrayText(value: unknown, language: "FR" | "EN"): string | null {
  // These analytical arrays have no locale-specific counterpart in the V4
  // contract.  Do not leak English copy into FR; state the limit instead.
  if (!Array.isArray(value) || !value.length) return null;
  return language === "FR" ? "Une limite est documentée, mais son explication française n’est pas publiée." : String(value[0]);
}

function RecapTimeline({ states, language }: { states: GoldReadEnvelope[]; language: "FR" | "EN" }) {
  const locale = language === "FR" ? "fr" : "en";
  return <section className={styles.timeline} aria-labelledby="weekly-story-title"><h2 id="weekly-story-title">{language === "FR" ? "Histoire chronologique de la semaine" : "Chronological week story"}</h2>
    {states.map((state, index) => {
      const plan = getPresentationRenderPlan(state.run, locale); const presentation: any = plan.presentation;
      if (state.meta.run_type === "SUNDAY") return <article key={state.meta.run_id} className={styles.originRead}><h3>{language === "FR" ? "Sunday Read d’origine" : "Original Sunday Read"}</h3><V4Presentation presentation={presentation} read={state.run} glossary={(state.run as any).glossary ?? []} language={language} scenarioTree={<ScenarioTree tree={(state.run as any).scenario_tree} evidence={(state.run as any).evidence} sources={(state.run as any).sources} scenarioExplanations={(state.run as any).scenario_explanations} presentation={undefined} walkthrough={presentation?.walkthrough} glossary={(state.run as any).glossary ?? []} language={language} />}/></article>;
      const previous = states[index - 1]?.run as any; const current = state.run as any;
      return <IntermediateCard key={state.meta.run_id} number={index} previous={previous} current={current} presentation={presentation} language={language} runId={state.meta.run_id} />;
    })}
  </section>;
}

function IntermediateCard({ number, previous, current, presentation, language, runId }: { number: number; previous: any; current: any; presentation: any; language: "FR" | "EN"; runId: string }) {
  const verdicts = presentation?.verdict_explanations ?? {}; const old = previous?.direction_state ?? {};
  const previousPresentation: any = getPresentationRenderPlan(previous ?? {}, language === "FR" ? "fr" : "en").presentation;
  const previousVerdicts = previousPresentation?.verdict_explanations ?? {};
  const audit = current?.family_audit ?? {}; const transitions = Array.isArray(current?.scenario_transitions) ? current.scenario_transitions : [];
  const evidence = Array.isArray(current?.evidence) ? current.evidence.filter((item: any) => item?.as_of && (!previous?.meta?.evidence_cutoff_end || Date.parse(item.as_of) > Date.parse(previous.meta.evidence_cutoff_end))) : [];
  return <article className={styles.intermediateCard}><header><h3>{language === "FR" ? `Mise à jour ${number}` : `Update ${number}`}</h3><time>{formatNewYork(current?.meta?.generated_at ?? current?.meta?.as_of, language)}</time></header>
    <div className={styles.updateAnswers}>{[["Qu’a-t-on appris ?", presentation?.market_story?.current_setup], ["Qu’est-ce qui a changé ?", presentation?.market_story?.causal_assessment], ["Qu’est-ce qui reste vrai ?", presentation?.market_story?.past_week], ["Qu’est-ce qui est encore inconnu ?", arrayText(current?.unknowns, language)], ["Que doit-on surveiller ensuite ?", presentation?.market_story?.week_ahead]].map(([label, text]) => <p key={String(label)}><b>{language === "FR" ? label : ({"Qu’a-t-on appris ?":"What did we learn?","Qu’est-ce qui a changé ?":"What changed?","Qu’est-ce qui reste vrai ?":"What remains true?","Qu’est-ce qui est encore inconnu ?":"What remains unknown?","Que doit-on surveiller ensuite ?":"What next?"}[String(label)] ?? String(label))}</b><br />{typeof text === "string" ? text : (language === "FR" ? "Explication localisée non publiée." : "Localized explanation not published.")}</p>)}</div>
    <div className={styles.judgmentGrid}>{judgmentKeys.map((key) => { const now = judgmentCopy(verdicts[key]?.verdict, language) ?? judgmentCopy(current?.direction_state?.[key], language) ?? judgmentCopy(current?.[key], language); const before = judgmentCopy(previousVerdicts[key]?.verdict, language) ?? judgmentCopy(old[key], language) ?? judgmentCopy(previous?.[key], language); return <article key={key}><h4>{judgmentLabels[language][key]}</h4><span>{before ?? (language === "FR" ? "non publié" : "not published")} → <strong>{now ?? (language === "FR" ? "non publié" : "not published")}</strong></span></article>; })}</div>
    <div className={styles.familyAudit}>{["F1","F2","F3","F4","F5","F6"].map((family) => <span key={family} className={styles.familyChip}>{family} · {audit[family]?.status ?? (language === "FR" ? "non publié" : "not published")}</span>)}</div>
    <p>{language === "FR" ? "Scénarios : " : "Scenarios: "}{transitions.length ? transitions.map((item: any) => transitionLabel[language][item.transition_state] ?? item.transition_state).join(" · ") : (language === "FR" ? "Aucune transition localisée publiée." : "No localized transition published.")}</p>
    <p>{language === "FR" ? "Nouvelles preuves datées : " : "New dated evidence: "}{evidence.length ? `${evidence.length}` : "0"}</p>
    <details><summary>{language === "FR" ? "Voir l’analyse complète et les sources" : "See full analysis and sources"}</summary><a href={`?runId=${encodeURIComponent(runId)}`}>{language === "FR" ? "Ouvrir cet état complet" : "Open this complete state"}</a></details>
  </article>;
}
