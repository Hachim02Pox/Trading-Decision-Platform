"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ScenarioTree } from "@/components/sundayRead/ScenarioTree";
import { fetchCurrentGoldRead, fetchGoldReadByRunId, fetchGoldReadHistory, type GoldReadEnvelope } from "@/lib/api/goldReadClient";
import { getPresentationRenderPlan } from "@/lib/sundayRead/presentationPlan";
import { useTranslation } from "@/i18n/useTranslation";
import styles from "../sunday-read/page.module.css";

function scenarioPresentation(presentation: any) {
  const tree = presentation?.scenario_tree_v3;
  if (!tree) return presentation?.scenario_tree;
  return {
    nodes: (tree.nodes ?? []).map((node: any) => ({ node_id: node.node_id, label: node.display_title, description: node.display_body, why_it_matters: node.why_it_matters, confirmation_needed: node.confirmation_needed })),
    edges: (tree.edges ?? []).map((edge: any) => ({ edge_id: edge.edge_id, label: edge.display_label, explanation: edge.display_explanation, confirmation_needed: edge.confirmation_needed })),
  };
}

export default function ScenarioTreePage() {
  return <Suspense fallback={<main className={styles.page}>Loading scenario tree…</main>}><ScenarioTreeContent /></Suspense>;
}

function ScenarioTreeContent() {
  const { language } = useTranslation();
  const search = useSearchParams();
  const requestedRunId = search.get("runId");
  const [selected, setSelected] = useState<GoldReadEnvelope | null>(null);
  const [history, setHistory] = useState<GoldReadEnvelope[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const current = requestedRunId ? await fetchGoldReadByRunId(requestedRunId) : await fetchCurrentGoldRead();
        const entries = await fetchGoldReadHistory();
        const versions = await Promise.all(entries.filter((entry) => entry.origin_sunday_run_id === current.meta.origin_sunday_run_id).map((entry) => entry.run_id === current.meta.run_id ? current : fetchGoldReadByRunId(entry.run_id)));
        setSelected(current);
        setHistory(versions);
      } catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to load the scenario tree."); }
    };
    void load();
  }, [requestedRunId]);

  const locale = language === "FR" ? "fr" : "en";
  const presentation = useMemo(() => selected ? getPresentationRenderPlan(selected.run, locale).presentation as any : undefined, [selected, locale]);
  if (error) return <main className={styles.page}><p className={styles.error}>{error}</p></main>;
  if (!selected) return <main className={styles.page}>{language === "FR" ? "Chargement de l’arbre…" : "Loading scenario tree…"}</main>;
  const read: any = selected.run;
  return <main className={styles.page}>
    <header className={styles.header}><h1>{language === "FR" ? "Arbre des scénarios" : "Scenario tree"}</h1><p>{language === "FR" ? "Chaque branche décrit une suite possible, ce qui la confirmerait, ce qui la contredirait et les preuves encore manquantes. Aucun avantage n’est démontré tant que ces confirmations font défaut." : "Each branch describes a possible path, what would confirm or contradict it, and the evidence still missing. No edge is demonstrated while those confirmations are absent."}</p></header>
    {history.length > 1 && <section><h2>{language === "FR" ? "Versions de l’arbre" : "Tree versions"}</h2><div className={styles.familyAudit}>{history.map((version) => <a className={styles.historyToggle} key={version.meta.run_id} href={`/scenario-tree?runId=${encodeURIComponent(version.meta.run_id)}`}>{version.meta.run_type === "INTERMEDIATE" ? (language === "FR" ? "Mise à jour" : "Update") : "Sunday Read"} · {version.meta.as_of ?? version.meta.generated_at}</a>)}</div></section>}
    <ScenarioTree tree={read.scenario_tree} evidence={read.evidence} sources={read.sources} scenarioExplanations={read.scenario_explanations} presentation={scenarioPresentation(presentation)} walkthrough={presentation?.walkthrough} glossary={read.glossary ?? []} language={language} />
  </main>;
}
