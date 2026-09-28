"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { getPresentationRenderPlan } from "@/lib/sundayRead/presentationPlan";
import { fetchCurrentGoldRead, fetchGoldReadByRunId, fetchGoldReadHistory, orderGoldReadLineage, type GoldReadEnvelope, type GoldReadMeta } from "@/lib/api/goldReadClient";
import { GlossaryText } from "@/components/sundayRead/GlossaryText";
import { V4Presentation } from "@/components/sundayRead/V4Presentation";
import { V5EvolutionReview, V5FamilyReadout } from "@/components/sundayRead/V5FamilyReadout";
import { judgmentKeys, judgmentEvolution, matchingIntermediateSummary, materialUnknownReasons, rawJudgment, verdictDetail } from "@/lib/sundayRead/marketStoryNarrative";
import { useTranslation } from "@/i18n/useTranslation";
import { createEdgeCheck, fetchEdgeCheck, fetchLatestEdgeCheck, type EdgeCheck, type ManualOptionObservation } from "@/lib/api/goldEdgeCheckClient";
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

function titleForRun(presentation: any, read: any, language: "FR" | "EN"): string {
  const initial = read?.meta?.run_type !== "INTERMEDIATE";
  const prefix = language === "FR" ? (initial ? "Lecture initiale" : "Mise à jour intermédiaire")
    : (initial ? "Initial reading" : "Intermediate update");
  const title = typeof presentation?.title === "string" ? presentation.title : "";
  const week = title.match(language === "FR" ? /semaine du .+$/i : /week (?:of|from) .+$/i)?.[0];
  const fallback = read?.meta?.week_of
    ? new Intl.DateTimeFormat(language === "FR" ? "fr-FR" : "en-US", { dateStyle: "long", timeZone: "UTC" }).format(new Date(`${read.meta.week_of}T12:00:00Z`))
    : "";
  return `${prefix} — ${week ?? (language === "FR" ? `semaine du ${fallback}` : `week of ${fallback}`)}`;
}

export default function SundayReadPage() { return <Suspense fallback={<main className={styles.page}>Loading…</main>}><SundayReadContent /></Suspense>; }

function ManualOptionsForm({ language, disabled, onSubmit }: { language: "FR" | "EN"; disabled: boolean; onSubmit: (rows: ManualOptionObservation[]) => Promise<void> }) {
  const [metric, setMetric] = useState<ManualOptionObservation["metric"]>("IV");
  const [message, setMessage] = useState<string | null>(null);
  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setMessage(null);
    const form = new FormData(event.currentTarget); const observed = String(form.get("observed_at") ?? "");
    const observation: ManualOptionObservation = { instrument: String(form.get("instrument") ?? "").trim().toUpperCase(), source: String(form.get("source") ?? "").trim(), proof_url: String(form.get("proof_url") ?? "").trim(), observed_at: new Date(observed).toISOString(), expiry: String(form.get("expiry") ?? ""), metric, value: Number(form.get("value")), unit: String(form.get("unit") ?? "").trim(), ...(String(form.get("methodology") ?? "").trim() ? { methodology: String(form.get("methodology")).trim() } : {}), ...(metric === "GEX" ? { gex_basis: String(form.get("gex_basis")) as "ESTIMATED" | "DEALER_OBSERVED" } : {}) };
    if (!/^(GC|MGC)[A-Z0-9]{1,12}$/.test(observation.instrument) || !Number.isFinite(observation.value) || !observed) { setMessage(language === "FR" ? "Indiquez un contrat GC/MGC exact, une date et une valeur numerique." : "Enter an exact GC/MGC contract, timestamp and numeric value."); return; }
    await onSubmit([observation]);
  };
  return <details className={styles.manualOptions}><summary>{language === "FR" ? "Ajouter des mesures d'options manuelles" : "Add manual option observations"}</summary><p>{language === "FR" ? "Aucun signal achat/vente n'est produit. Une mesure n'est analysee que si le worker est configure." : "No buy/sell signal is produced. A measurement is analyzed only when the worker is configured."}</p><form onSubmit={submit} className={styles.optionsForm}>
    <label>{language === "FR" ? "Contrat exact" : "Exact contract"}<input name="instrument" required placeholder="GCZ6 or MGCZ6" pattern="(GC|MGC)[A-Za-z0-9]{1,12}" disabled={disabled} /></label><label>Source<input name="source" required disabled={disabled} /></label><label>{language === "FR" ? "Lien preuve" : "Proof link"}<input name="proof_url" type="url" required placeholder="https://" disabled={disabled} /></label><label>{language === "FR" ? "Mesuree le" : "Observed at"}<input name="observed_at" type="datetime-local" required disabled={disabled} /></label><label>{language === "FR" ? "Echeance" : "Expiry"}<input name="expiry" type="date" required disabled={disabled} /></label><label>Metric<select value={metric} onChange={(event) => setMetric(event.target.value as ManualOptionObservation["metric"])} disabled={disabled}><option value="IV">IV</option><option value="SKEW">Skew</option><option value="GEX">GEX</option></select></label><label>{language === "FR" ? "Valeur" : "Value"}<input name="value" type="number" step="any" required disabled={disabled} /></label><label>{language === "FR" ? "Unites" : "Units"}<input name="unit" required disabled={disabled} /></label><label>{language === "FR" ? "Methode si connue" : "Method if known"}<input name="methodology" disabled={disabled} /></label>{metric === "GEX" && <label>{language === "FR" ? "Statut GEX" : "GEX status"}<select name="gex_basis" defaultValue="ESTIMATED" disabled={disabled}><option value="ESTIMATED">{language === "FR" ? "Estime par un modele" : "Model estimate"}</option><option value="DEALER_OBSERVED">{language === "FR" ? "Observation source dealer" : "Source-reported dealer observation"}</option></select></label>}<button type="submit" className={styles.edgeCheckButton} disabled={disabled}>{language === "FR" ? "Soumettre pour controle manuel" : "Submit for manual check"}</button>
  </form>{message && <p className={styles.error}>{message}</p>}</details>;
}

function SundayReadContent() {
  const { t, language } = useTranslation();
  const searchParams = useSearchParams();
  const requestedRunId = searchParams.get("runId");
  const [read, setRead] = useState<any>(null);
  const [meta, setMeta] = useState<GoldReadMeta | null>(null);
  const [lineageReads, setLineageReads] = useState<GoldReadEnvelope[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [edgeCheck, setEdgeCheck] = useState<EdgeCheck | null>(null);
  const [edgeCheckError, setEdgeCheckError] = useState<string | null>(null);
  const [nextRecap, setNextRecap] = useState<NextRecap | null>(null);
  useEffect(() => {
    setRead(null);
    setMeta(null);
    setError(null);
    setLineageReads([]);
    const task = Promise.all([
      requestedRunId ? fetchGoldReadByRunId(requestedRunId) : fetchCurrentGoldRead(),
      fetchGoldReadHistory(),
    ]).then(async ([env, fullHistory]) => {
      const lineage = orderGoldReadLineage(fullHistory, env.meta.run_id);
      setRead(env.run);
      setMeta(env.meta);
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
  const runType: "SUNDAY" | "INTERMEDIATE" | null = meta?.run_type ?? read?.meta?.run_type ?? null;
  const currentRunId = meta?.run_id ?? read?.meta?.run_id ?? null;
  const intermediateNumber: number | null = null;
  useEffect(() => { if (!currentRunId) return; fetchLatestEdgeCheck(currentRunId).then(setEdgeCheck).catch(() => setEdgeCheck(null)); }, [currentRunId]);
  useEffect(() => {
    if (!edgeCheck || !["QUEUED", "RUNNING"].includes(edgeCheck.status)) return;
    const timer = window.setInterval(() => fetchEdgeCheck(edgeCheck.check_id).then(setEdgeCheck).catch(() => setEdgeCheckError(language === "FR" ? "Impossible de lire l’état de la vérification." : "Unable to read edge-check status.")), 5000);
    return () => window.clearInterval(timer);
  }, [edgeCheck, language]);
  const startEdgeCheck = async (manualOptions: ManualOptionObservation[] = []) => {
    setEdgeCheckError(null);
    try { setEdgeCheck(await createEdgeCheck(crypto.randomUUID(), manualOptions)); }
    catch (reason) { const code = reason instanceof Error ? reason.message : "EDGE_CHECK_FAILED"; if (code === "EDGE_CHECK_ANALYSIS_UNAVAILABLE") { setEdgeCheckError(language === "FR" ? "Aucun worker analytique n'est configuré : les mesures n'ont pas été envoyées et aucune analyse n'a eu lieu." : "No analytical worker is configured: measurements were not sent and no analysis ran."); return; } setEdgeCheckError(code === "AUTH_REQUIRED" ? (language === "FR" ? "Connexion requise pour vérifier l’edge." : "Sign in is required to check the edge.") : (language === "FR" ? "La demande n’a pas pu être créée." : "The request could not be created.")); }
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
      <h1>{isV4 ? titleForRun(presentation, read, language) : presentation?.subtitle ?? read.meta.week_of}</h1>
      <div className={styles.badgeRow}>
        <span className={`${styles.badge} ${runType === "INTERMEDIATE" ? styles.badgeIntermediate : styles.badgeSunday}`}>
          {runType === "INTERMEDIATE"
            ? (language === "FR" ? `Mise à jour intermédiaire${intermediateNumber ? ` n°${intermediateNumber}` : ""}` : `Intermediate update${intermediateNumber ? ` #${intermediateNumber}` : ""}`)
            : (language === "FR" ? "Lecture initiale" : "Initial reading")}
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
        {nextRecap.status === "CLOSED" && <span>{language === "FR" ? "Cycle clos — aucune prochaine mise à jour n’est programmée." : "Cycle closed — no next update is scheduled."}</span>}
        {["EXPIRED", "CANCELLED", "INVALID", "UNAVAILABLE"].includes(nextRecap.status) && <span>{language === "FR" ? "Aucune prochaine mise à jour confirmée." : "No next update is confirmed."}</span>}
        {["SCHEDULED", "DUE"].includes(nextRecap.status) && <>{(() => { const reason = language === "FR" ? nextRecap.reason_fr ?? nextRecap.reason : nextRecap.reason_en ?? nextRecap.reason; const delay = language === "FR" ? nextRecap.minimum_confirmation_delay?.fr : nextRecap.minimum_confirmation_delay?.en; return <>{reason ? <small>{reason}</small> : <small>{language === "FR" ? "La raison de cette mise à jour n’est pas disponible." : "The reason for this update is unavailable."}</small>}{delay && <small>{language === "FR" ? "Délai minimal de confirmation : " : "Minimum confirmation delay: "}{delay}</small>}</>; })()}</>}
      </aside>}
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
          <button type="button" className={styles.edgeCheckButton} onClick={() => startEdgeCheck()} disabled={!currentRunId || edgeCheck?.status === "QUEUED" || edgeCheck?.status === "RUNNING"}>
            {language === "FR" ? "Vérifier l’edge maintenant" : "Check the edge now"}
          </button>
          <ManualOptionsForm language={language} disabled={!currentRunId || edgeCheck?.status === "QUEUED" || edgeCheck?.status === "RUNNING"} onSubmit={startEdgeCheck} />
          {edgeCheck && <p>{edgeCheck.status === "QUEUED" ? (language === "FR" ? "Demande en file d’attente : aucun verdict n’a encore été produit." : "Request queued: no verdict has been produced yet.") : edgeCheck.status === "RUNNING" ? (language === "FR" ? "Contrôle manuel en cours des changements matériels depuis le cutoff de l’état de base." : "Manual check in progress for material changes since the base-state cutoff.") : edgeCheck.status === "FAILED" ? (language === "FR" ? "La vérification a échoué techniquement. Aucun verdict n’a été produit." : "The check failed technically. No verdict was produced.") : `${language === "FR" ? "Dernier contrôle" : "Last check"}: ${formatNewYork(edgeCheck.completed_at ?? edgeCheck.created_at, language)}`}</p>}
          {edgeCheck?.status === "COMPLETED" && edgeCheck.result && <details><summary>{language === "FR" ? "Résultat du contrôle manuel (distinct du Sunday Read)" : "Manual check result (separate from the Sunday Read)"}</summary><p>{language === "FR" ? ({ NO_GAME_CHANGER: "Aucun changement fondamental majeur détecté", GAME_CHANGER_DETECTED: "Changement majeur détecté — edge suspendu", INSUFFICIENT_EVIDENCE: "Événement possible, confirmation insuffisante", FAILED: "Vérification impossible" }[String(edgeCheck.result.verdict)] ?? "Conclusion structurée disponible.") : ({ NO_GAME_CHANGER: "No major fundamental change detected", GAME_CHANGER_DETECTED: "Major change detected — edge suspended", INSUFFICIENT_EVIDENCE: "Possible event, insufficient confirmation", FAILED: "Verification unavailable" }[String(edgeCheck.result.verdict)] ?? "Structured conclusion available.")}</p><p>{String(edgeCheck.result.causal_transmission ?? edgeCheck.result.ordinary_market_context ?? "")}</p></details>}
          {edgeCheckError && <p className={styles.error}>{edgeCheckError}</p>}
          {currentRunId && <small>{language === "FR" ? "État de base" : "Base state"}: {currentRunId}</small>}
        </div>
      </section>
    )}

    <NarrativeMarketStory read={read} presentation={presentation} language={language} generatedAt={generatedAtLocal} nextRecap={nextRecap} lineage={lineageReads} />
    {!isV4 && <section className={styles.story}><h2>{t("sunday.story")}</h2>
      {story ? <div className={styles.storyGrid}><article><h3>{t("sunday.past")}</h3><p>{rich(story.past_week)}</p></article><article><h3>{t("sunday.now")}</h3><p>{rich(story.current_setup)}</p></article><article><h3>{t("sunday.ahead")}</h3><p>{rich(story.week_ahead)}</p></article></div> : !isV3 && String(read.executive_narrative).split("\n\n").map((paragraph: string, i: number) => <p key={i}>{paragraph}</p>)}
    </section>}
    {!isV4 && !v3Unavailable("horizons") && <section><h2>{t("sunday.contexts")}</h2><div className={styles.grid}>{horizonKeys.map((key) => {
      const legacy = read.contexts[key]; const card = presentation?.horizons?.[key];
      return <article key={key}><span className={styles.orientation}>{!isV3 ? (orientation[language][legacy.orientation] ?? legacy.orientation) : ""}</span><h3>{t(`sunday.${key}` as never)}</h3><p>{rich(isV3 ? card?.summary : card?.summary ?? legacy.why)}</p><details><summary>{t("sunday.why")}</summary><p><b>{t("sunday.supports")}</b><br />{card?.supporting_points?.map((point: string, i: number) => <span key={i}>{rich(point)}<br /></span>)}</p><p><b>{t("sunday.contradicts")}</b><br />{rich(isV3 ? card?.counter_case : card?.counter_case ?? legacy.competing_thesis)}</p><p><b>{t("sunday.changes")}</b><br />{rich(isV3 ? card?.invalidation_explained : card?.invalidation_explained ?? legacy.invalidation)}</p></details></article>;
    })}</div></section>}
    {!isV4 && !v3Unavailable("priced_in") && <section><h2>{t("sunday.priced")}</h2><div className={styles.split}><article>{(isV3 ? presentation?.priced_in?.already_priced : presentation?.priced_in?.already_priced ?? read.priced_in.already_priced).map((item: string) => <p key={item}>{rich(item)}</p>)}</article><article><h3>{t("sunday.surprise")}</h3>{(isV3 ? presentation?.priced_in?.surprises : presentation?.priced_in?.surprises ?? legacySurprises()).map((item: any, i: number) => <div key={i} className={styles.surprise}>{item.title && <h4>{rich(item.title)}</h4>}<b>{t("sunday.expected")}</b><p>{rich(item.baseline_explained)}</p><b>{t("sunday.surpriseItem")}</b><p>{rich(item.surprise_explained)}</p><b>{t("sunday.firstReaction")}</b><p>{rich(item.transmission_explained)}</p>{item.gold_confirmation && <><b>{t("sunday.confirmation")}</b><p>{rich(item.gold_confirmation)}</p></>}</div>)}</article></div></section>}
    {!isV4 && !v3Unavailable("opportunity_quality") && <section><h2>{t("sunday.opportunity")}</h2><strong>{isV3 ? presentation?.opportunity_quality?.display : read.asymmetry.edge === "NO_EDGE" ? (presentation?.asymmetry?.headline ?? t("sunday.noEdge")) : orientation[language][read.asymmetry.edge] ?? read.asymmetry.edge}</strong><p>{rich(isV3 ? presentation?.opportunity_quality?.explanation : presentation?.asymmetry?.summary ?? read.asymmetry.summary)}</p></section>}
    {!isV4 && !v3Unavailable("execution_readiness") && <section><h2>{language === "FR" ? "Préparation à l’exécution" : "Execution readiness"}</h2><strong>{presentation?.execution_readiness?.display}</strong><p>{rich(presentation?.execution_readiness?.explanation)}</p></section>}
  </main>;
}

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

function localizedLimit(read: any, presentation: any, summary: any, language: "FR" | "EN"): string | null {
  return localizedSummary(summary, "decisive_limit", language)
    ?? narrativeText(presentation?.market_story?.causal_assessment?.conclusion_limit)
    ?? (rawJudgment(read, "positioning_asymmetry") === "UNKNOWN"
      ? narrativeText(presentation?.direction_state?.positioning_asymmetry?.explanation) : null);
}

function NarrativeMarketStory({ read, presentation, language, generatedAt, nextRecap, lineage }: { read: any; presentation: any; language: "FR" | "EN"; generatedAt: string | null; nextRecap: NextRecap | null; lineage: GoldReadEnvelope[] }) {
  const isFrench = language === "FR";
  const selected = lineage.find((entry) => entry.meta.run_id === read?.meta?.run_id);
  const parent = lineage.find((entry) => entry.meta.run_id === read?.meta?.parent_run_id);
  const summary = selected ? matchingIntermediateSummary(read, parent?.meta.run_id) : null;
  const parentPresentation: any = parent ? getPresentationRenderPlan(parent.run, isFrench ? "fr" : "en").presentation : null;
  const evolution = judgmentEvolution(read, parent?.run, presentation, parentPresentation, language, judgmentLabels[language]);
  const limit = localizedLimit(read, presentation, summary, language);
  const gaps = materialUnknownReasons(read, language, summary);
  const macroReading = summary?.macro_reading;
  const causalLimit = narrativeText(presentation?.market_story?.causal_assessment?.reported);
  return <>
    <section className={styles.currentState} aria-labelledby="current-state-title">
      <div><h2 id="current-state-title">{isFrench ? "État actuel" : "Current state"}</h2><p>{read?.meta?.run_type === "INTERMEDIATE" ? (isFrench ? "Mise à jour intermédiaire" : "Intermediate update") : (isFrench ? "Lecture initiale" : "Initial reading")} · {generatedAt ?? read?.meta?.as_of}</p></div>
      <p className={styles.edgeStatus}><b>{isFrench ? "Raison principale : " : "Main reason: "}</b>{narrativeText(presentation?.market_story?.current_setup) ?? narrativeText(read?.executive_narrative)}</p>
      <div className={styles.judgmentGrid}>{judgmentKeys.map((key) => { const detail = verdictDetail(presentation, key); return <article key={key}><h3>{judgmentLabels[language][key]}</h3><strong>{detail.verdict ?? (isFrench ? "État non déterminé" : "State not determined")}</strong>{detail.explanation && <p>{detail.explanation}</p>}{key === "macro_direction" && <><p>{isFrench ? "Ce jugement décrit la situation observée à cette date. Il ne prédit pas à lui seul la prochaine baisse de Gold." : "This judgment describes the situation observed on this date. It does not, by itself, predict another Gold decline."}</p>{macroReading ? <><p><b>{isFrench ? "Cause et limites : " : "Cause and limits: "}</b>{localizedSummary(macroReading, "causal_assessment", language)}</p><p><b>{isFrench ? "Si la pression continue : " : "If pressure persists: "}</b>{localizedSummary(macroReading, "forward_conditions", language)}</p><p><b>{isFrench ? "Ce qui invaliderait cette lecture : " : "What would invalidate this reading: "}</b>{localizedSummary(macroReading, "invalidation", language)}</p></> : read?.meta?.run_type === "INTERMEDIATE" && causalLimit && <p><b>{isFrench ? "Cause établie ? " : "Established cause? "}</b>{causalLimit}</p>}</>}</article>; })}</div>
      {gaps.length > 0 && <GapDetails gaps={gaps} language={language} />}
      {limit && <div className={styles.currentNotes}><p><b>{isFrench ? "Limite décisive : " : "Decisive limit: "}</b>{limit}</p></div>}
      {nextRecap?.requested_at && <div className={styles.currentNotes}><p><b>{isFrench ? "Prochaine vérification : " : "Next check: "}</b>{formatNewYork(nextRecap.requested_at, language)}</p></div>}
    </section>
    {read?.meta?.run_type === "INTERMEDIATE" && !read?.evolution_review && <section><h2>{isFrench ? "Ce qui a changé depuis la dernière analyse" : "What changed since the last analysis"}</h2><div className={styles.currentNotes}>{summary && <p>{localizedSummary(summary, "what_changed", language)}</p>}{!summary && (evolution.changed.length ? evolution.changed.map((line) => <p key={line}>{line}</p>) : <p>{narrativeText(presentation?.market_story?.current_setup) ?? (isFrench ? "Aucun changement vérifiable n'est décrit." : "No verifiable change is described.")}</p>)}</div></section>}
    {lineage.length > 0 && <section className={styles.timeline} aria-labelledby="weekly-story-title"><h2 id="weekly-story-title">{isFrench ? "Histoire chronologique de la semaine" : "Chronological market story"}</h2>{lineage.map((state, index) => <NarrativeTimelineCard key={state.meta.run_id} state={state} parent={lineage[index - 1]} language={language} isCurrent={state.meta.run_id === read?.meta?.run_id} />)}</section>}
  </>;
}

function NarrativeTimelineCard({ state, parent, language, isCurrent }: { state: GoldReadEnvelope; parent: GoldReadEnvelope | undefined; language: "FR" | "EN"; isCurrent: boolean }) {
  const isFrench = language === "FR";
  const read: any = state.run;
  const presentation: any = getPresentationRenderPlan(read, isFrench ? "fr" : "en").presentation;
  if (state.meta.run_type === "SUNDAY") return <article className={styles.originRead}><h3>{isFrench ? "Lecture initiale complète" : "Complete initial reading"}</h3>{Array.isArray(read.family_readouts) ? <><div id="synthese"><V5FamilyReadout read={read} language={language} /></div><V4Presentation presentation={presentation} read={read} glossary={read.glossary ?? []} language={language} scenarioTree={null} mode="supplement" /></> : <V4Presentation presentation={presentation} read={read} glossary={read.glossary ?? []} language={language} scenarioTree={null} />}</article>;

  const previous: any = parent?.run;
  const previousPresentation: any = previous ? getPresentationRenderPlan(previous, isFrench ? "fr" : "en").presentation : null;
  const summary = matchingIntermediateSummary(read, parent?.meta.run_id);
  const evolution = judgmentEvolution(read, previous, presentation, previousPresentation, language, judgmentLabels[language]);
  const observed = localizedSummary(summary, "observed_since_parent", language)
    ?? narrativeText(presentation?.market_story?.current_setup) ?? narrativeText(read?.executive_narrative);
  const changed = localizedSummary(summary, "what_changed", language)
    ?? (evolution.changed.length ? evolution.changed.join(" ") : null);
  const remains = localizedSummary(summary, "what_remains_true", language);
  const unknowns = localizedSummary(summary, "unknowns", language)
    ?? narrativeText(presentation?.market_story?.causal_assessment?.conclusion_limit)
    ?? (rawJudgment(read, "positioning_asymmetry") === "UNKNOWN" ? narrativeText(presentation?.direction_state?.positioning_asymmetry?.explanation) : null);
  const next = localizedSummary(summary, "next_watch", language) ?? narrativeText(presentation?.market_story?.week_ahead);
  const gaps = materialUnknownReasons(read, language, summary);
  const priorIds = new Set((previous?.evidence ?? []).map((entry: any) => entry?.id));
  const evidence = Array.isArray(read?.evidence) ? read.evidence.filter((item: any) => item?.id && !priorIds.has(item.id)) : [];
  const sourceById = new Map<string, any>((read?.sources ?? []).map((item: any) => [item.source_id ?? item.id, item]));
  return <article className={styles.intermediateCard}><header><h3>{isFrench ? "Mise à jour intermédiaire" : "Intermediate update"}</h3><time>{formatNewYork(state.meta.generated_at ?? read?.meta?.generated_at, language) ?? state.meta.as_of}</time></header>
    {read.evolution_review ? <V5EvolutionReview read={read} language={language} /> : <div className={styles.updateAnswers}>
      {observed && <p><b>{isFrench ? "Ce qui a été observé : " : "What was observed: "}</b>{observed}</p>}
      {changed && <p><b>{isFrench ? "Ce qui a changé : " : "What changed: "}</b>{changed}</p>}
      <div><b>{isFrench ? "Ce qui reste valable : " : "What remains valid: "}</b>
        {remains ? <p>{remains}</p> : evolution.remains.length ? <>{evolution.remains.map((line) => <p key={line}>{line}</p>)}<p>{isFrench ? "Comparaison limitée aux jugements identiques dans les deux états et encore expliqués dans la mise à jour. Les autres affirmations de la lecture initiale ne sont pas confirmées ici." : "This comparison covers only judgments shared by both states and still explained in the update. Other claims from the initial reading are not confirmed here."}</p></>
          : <p>{isFrench ? "Les preuves disponibles ne permettent pas d'établir quelle conclusion du parent reste valable." : "Available evidence does not establish which conclusion from the parent remains valid."}</p>}
      </div>
      {unknowns && <p><b>{isFrench ? "Ce qui manque encore : " : "What remains unknown: "}</b>{unknowns}</p>}
      {gaps.length > 0 && !isCurrent && <GapDetails gaps={gaps} language={language} />}
      {next && <p><b>{isFrench ? "À surveiller ensuite : " : "What to watch next: "}</b>{next}</p>}
    </div>}
    {evidence.length > 0 && <details><summary>{isFrench ? "Nouvelles preuves et sources" : "New evidence and sources"}</summary>{evidence.map((item: any) => <p key={item.id}>{item.statement}{item.as_of ? ` (${item.as_of})` : ""}{(item.source_refs ?? []).map((id: string) => { const source = sourceById.get(id); return source?.url ? <span key={id}> · <a href={source.url} target="_blank" rel="noreferrer">{source.title ?? (isFrench ? "Source" : "Source")}</a></span> : null; })}</p>)}</details>}
    <a className={styles.historyToggle} href={`/scenario-tree?runId=${encodeURIComponent(state.meta.run_id)}`}>{isFrench ? "Voir l’arbre des scénarios" : "View the scenario tree"}</a>
  </article>;
}
const judgmentLabels = { FR: { macro_direction: "Direction macro", directional_asymmetry: "Asymétrie directionnelle", positioning_asymmetry: "Asymétrie de positionnement", edge: "Avantage exploitable", opportunity_quality: "Qualité de l’opportunité", execution_readiness: "Préparation à l’exécution" }, EN: { macro_direction: "Macro direction", directional_asymmetry: "Directional asymmetry", positioning_asymmetry: "Positioning asymmetry", edge: "Actionable edge", opportunity_quality: "Opportunity quality", execution_readiness: "Execution readiness" } } as const;


function GapDetails({ gaps, language }: { gaps: ReturnType<typeof materialUnknownReasons>; language: "FR" | "EN" }) {
  const fr = language === "FR";
  return <details className={styles.currentNotes}><summary>{fr ? "Pourquoi ces données manquent" : "Why these data are missing"}</summary>
    {gaps.map((gap, i) => <article key={gap.topic + i}><h4>{gap.label}</h4><p>{gap.explanation}</p>{gap.checked && <p><b>{fr ? "Vérification : " : "Checked: "}</b>{gap.checked}</p>}{gap.nextAction && <p><b>{fr ? "Pour lever l’incertitude : " : "To resolve the gap: "}</b>{gap.nextAction}</p>}</article>)}
  </details>;
}
