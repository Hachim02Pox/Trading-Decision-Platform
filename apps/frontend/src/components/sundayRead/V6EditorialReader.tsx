import type { V6EditorialState, NarrativeCard } from "@/lib/sundayRead/v6Editorial";
import { v6JudgmentOrder } from "@/lib/sundayRead/v6Editorial";
import styles from "@/app/sunday-read/page.module.css";

const judgmentTitles: Record<string, string> = {
  macro_direction: "Direction macro",
  directional_asymmetry: "Asymétrie directionnelle",
  positioning_asymmetry: "Asymétrie de positionnement",
  evidence_quality: "Solidité des preuves",
  analysis_scope: "Portée fondamentale",
  fundamental_conclusion: "Conclusion par instrument",
};
const evolutionSections: Array<[keyof NonNullable<V6EditorialState["evolution_review"]>, string]> = [
  ["still_true", "Toujours vrai"], ["new_observations", "Nouveautés"], ["strengthened", "Renforcé"],
  ["weakened", "Affaibli"], ["invalidated", "Invalidé"], ["exogenous_factors", "Facteurs exogènes"],
  ["unresolved", "Non résolu"], ["next_checks", "Prochains tests"],
];

function Cards({ items }: { items: NarrativeCard[] }) {
  return <>{items.map((item) => <article key={`${item.title_fr}-${item.body_fr}`}><h3>{item.title_fr}</h3><p>{item.body_fr}</p></article>)}</>;
}

export function V6EditorialReader({ state }: { state: V6EditorialState }) {
  const judgments = new Map(state.six_judgments.map((item) => [item.id, item]));
  const nodeTitles = new Map(state.scenario_tree.nodes.map((node) => [node.id, node.title_fr]));
  const evolution = state.evolution_review;
  return <>
    <section className={styles.v6Hero}><h2>{state.title_fr}</h2>{state.opening_thesis.map((item) => <article key={item.title_fr}><h3>{item.title_fr}</h3><p>{item.body_fr}</p></article>)}</section>
    <section><h2>{state.decision_panel.title_fr || "Que puis-je envisager ?"}</h2><p><b>Horizon : </b>{state.decision_panel.horizon}</p><div className={styles.grid}>{state.decision_panel.instruments.map((item) => <article key={item.instrument}><h3>{item.instrument} — {item.eligible_direction}</h3><p>{item.answer_fr}</p><details><summary>Pourquoi et conditions</summary><p><b>Mécanisme : </b>{item.mechanism_fr}</p><p><b>Contradiction principale : </b>{item.strongest_contradiction_fr}</p><p><b>À réexaminer si : </b>{item.flip_fr}</p></details></article>)}</div><p><b>Réexamen : </b>{state.decision_panel.recheck_fr}</p>{state.decision_panel.limit_fr && <p><b>Limite : </b>{state.decision_panel.limit_fr}</p>}</section>
    {evolution && <section><h2>Depuis le dernier récap</h2><p>{evolution.summary_fr}</p>{evolutionSections.map(([key, title]) => { const items = evolution[key]; return Array.isArray(items) && items.length ? <details key={String(key)}><summary>{title}</summary><div className={styles.v6Cards}><Cards items={items as NarrativeCard[]} /></div></details> : null; })}<details><summary>Évolution des jugements et scénarios</summary>{evolution.judgment_changes.map((item) => <p key={item.judgment_id}><b>{judgmentTitles[item.judgment_id] ?? item.judgment_id} : </b>{item.previous_state} → {item.current_state}. {item.reason_fr} {item.consequence_fr}</p>)}{evolution.scenario_transitions.map((item) => <p key={item.scenario_id}><b>{nodeTitles.get(item.scenario_id) ?? "Scénario"} : </b>{item.explanation_fr}</p>)}</details></section>}
    <section><h2>Les six jugements</h2><div className={styles.judgmentGrid}>{v6JudgmentOrder.map((id) => { const item = judgments.get(id); return item ? <article key={id}><h3>{judgmentTitles[id]}</h3><strong>{item.display}</strong><p>{item.body}</p></article> : null; })}</div></section>
    <section><h2>Scénarios possibles</h2><div className={styles.v6Cards}>{state.scenario_tree.nodes.map((node) => <details key={node.id}><summary>{node.title_fr}</summary><p><b>Condition : </b>{node.condition_fr}</p><p><b>Chaîne causale : </b>{node.causal_path_fr}</p><p><b>Confirmation observable : </b>{node.observable_confirmation_fr}</p><p><b>Horizon : </b>{node.time_window_fr}</p><p><b>Éléments contraires : </b>{node.opposing_evidence_fr}</p><p><b>Invalidation : </b>{node.invalidation_fr}</p><p><b>Portée pratique : </b>{node.practical_interpretation_fr}</p></details>)}</div>{state.scenario_tree.edges.map((edge) => <details key={`${edge.from_id}-${edge.to_id}`}><summary>Transition de scénario</summary><p><b>Condition observable : </b>{edge.observable_condition_fr}</p><p><b>Transmission : </b>{edge.causal_explanation_fr}</p></details>)}</section>
    <section><h2>Lecture par familles</h2><div className={styles.v6Cards}>{state.family_readouts.map((family) => <details key={family.id}><summary>{family.title_fr}</summary><p>{family.local_interpretation_fr}</p>{family.questions.map((question) => <article key={question.id}><h3>{question.question_fr}</h3><p>{question.answer_fr}</p><small>{question.status} · {question.as_of}{question.refresh_status ? ` · ${question.refresh_status}` : ""}</small></article>)}</details>)}</div></section>
    <section><h2>Chronologie et calendrier</h2><div className={styles.split}><article>{state.chronology.map((item) => <p key={item.date_label_fr}><b>{item.date_label_fr} : </b>{item.event_fr}</p>)}</article><article>{state.calendar.map((item) => <p key={`${item.at}-${item.event}`}><b>{item.event} : </b>{item.watch}</p>)}</article></div></section>
    <section><h2>Facteurs exogènes et limites</h2><div className={styles.v6Cards}>{state.exogenous_review.map((item) => <article key={item.category}><h3>{item.category} — {item.status}</h3><p>{item.finding}</p></article>)}</div></section>
  </>;
}
