import styles from "@/app/sunday-read/page.module.css";

type Language = "FR" | "EN";
const copy = (value: any, language: Language) => value?.[language === "FR" ? "fr" : "en"];
const labels = {
  FR: { reasoning: "Raisonnement de la famille", established: "Faits établis", mechanism: "Mécanisme possible", counterevidence: "Éléments contraires", limits: "Limites", forward_test: "Prochaine condition à vérifier", unknown: "Ce qui manque et comment le résoudre", synthesis: "Synthèse globale", bridge: "Pont avec la semaine précédente" },
  EN: { reasoning: "Family reasoning", established: "Established facts", mechanism: "Possible mechanism", counterevidence: "Contrary evidence", limits: "Limits", forward_test: "Next condition to verify", unknown: "What is missing and how to resolve it", synthesis: "Global synthesis", bridge: "Bridge from the prior week" },
} as const;

function References({ refs, sources, evidence, language }: { refs: unknown; sources: any[]; evidence: any[]; language: Language }) {
  const byId = new Map(sources.map((source) => [source.source_id, source]));
  const evidenceById = new Map(evidence.map((item) => [item.id, item]));
  return <>{Array.isArray(refs) && refs.flatMap((id) => (evidenceById.get(id)?.source_refs ?? []).map((sourceId: string) => ({ item: evidenceById.get(id), source: byId.get(sourceId), sourceId }))).map(({ item, source, sourceId }: any) => source?.url ? <a key={`${item.id}-${sourceId}`} href={source.url} target="_blank" rel="noreferrer">{source.title ?? (language === "FR" ? "Source vérifiable" : "Verifiable source")}{item.as_of ? ` · ${item.as_of}` : ""}</a> : null)}</>;
}

export function V5FamilyReadout({ read, language }: { read: any; language: Language }) {
  const text = labels[language];
  const sources = Array.isArray(read?.sources) ? read.sources : [];
  const evidence = Array.isArray(read?.evidence) ? read.evidence : [];
  const families = Array.isArray(read?.family_readouts) ? read.family_readouts : [];
  return <div className={styles.v5Readout}>
    {families.map((family: any) => <section key={family.family_id} className={styles.familyReadout}>
      <h2>{copy(family.title, language) ?? family.family_id}</h2>
      {Array.isArray(family.questions) && <div className={styles.questionList}>{family.questions.map((question: any) => <article key={question.question_id}>
        <h3>{copy(question.question, language)}</h3><p>{copy(question.answer, language)}</p>
        {question.as_of && <small>{language === "FR" ? "Observation : " : "Observed: "}{question.as_of}</small>}
        {question.status !== "ANSWERED" && question.unknown_reason && <details><summary>{text.unknown}</summary><p>{copy(question.unknown_reason.explanation, language)}</p><p><b>{language === "FR" ? "Vérification tentée : " : "Check attempted: "}</b>{copy(question.unknown_reason.checked, language)}</p><p><b>{language === "FR" ? "Pour résoudre : " : "To resolve: "}</b>{copy(question.unknown_reason.next_action, language)}</p></details>}
        <References refs={question.evidence_refs} sources={sources} evidence={evidence} language={language} />
      </article>)}</div>}
      <div className={styles.reasoning}><h3>{text.reasoning}</h3>{["established", "mechanism", "counterevidence", "limits", "forward_test"].map((key) => { const item = family.family_reasoning?.[key]; return item ? <p key={key}><b>{text[key as keyof typeof text]}: </b>{copy(item, language)} <References refs={item.evidence_refs} sources={sources} evidence={evidence} language={language} /></p> : null; })}</div>
    </section>)}
    {read?.global_synthesis && <section className={styles.globalSynthesis}><h2>{text.synthesis}</h2>{["causal_chain", "alternatives", "contradictions", "priced_in", "forward_conditions", "invalidation", "unknowns", "edge_reasoning"].map((key) => { const item = read.global_synthesis[key]; return item ? <p key={key}>{copy(item, language)} <References refs={item.evidence_refs} sources={sources} evidence={evidence} language={language} /></p> : null; })}</section>}
    {read?.weekly_bridge && <section className={styles.weeklyBridge}><h2>{text.bridge}</h2>{["comparison_limit", "differences", "surviving_conclusions", "resolved_expectations", "failed_expectations"].map((key) => { const item = read.weekly_bridge[key]; return item ? <p key={key}>{copy(item, language)} <References refs={item.evidence_refs} sources={sources} evidence={evidence} language={language} /></p> : null; })}</section>}
  </div>;
}

export function V5EvolutionReview({ read, language }: { read: any; language: Language }) {
  const review = read?.evolution_review;
  if (!review) return null;
  const titles: Record<string, string> = language === "FR" ? { narrative: "Ce que nous avons appris depuis le parent", still_true: "Ce qui reste valable", new_observations: "Nouvelles observations", strengthened: "Ce qui renforce la thèse", weakened: "Ce qui l’affaiblit", invalidated: "Ce qui est invalidé", exogenous_factors: "Nouveaux facteurs extérieurs", unresolved: "Inconnues expliquées", next_checks: "Prochains contrôles" } : { narrative: "What we learned since the parent", still_true: "What remains valid", new_observations: "New observations", strengthened: "What strengthens the thesis", weakened: "What weakens it", invalidated: "What is invalidated", exogenous_factors: "New external factors", unresolved: "Explained unknowns", next_checks: "Next checks" };
  const sources = Array.isArray(read?.sources) ? read.sources : [];
  const evidence = Array.isArray(read?.evidence) ? read.evidence : [];
  return <div className={styles.updateAnswers}>{Object.entries(titles).map(([key, title]) => { const item = review[key]; return item ? <section key={key}><h3>{title}</h3><p>{copy(item, language)} <References refs={item.evidence_refs} sources={sources} evidence={evidence} language={language} /></p></section> : null; })}</div>;
}
