"use client";

import { useMemo } from "react";
import type { V6EditorialState } from "@/lib/sundayRead/v6Editorial";
import { adaptLearningScenarioTree } from "@/lib/sundayRead/learningScenarioTree";
import { ScenarioTree } from "./ScenarioTree";
import styles from "./ScenarioTree.module.css";

export function V6ScenarioGraph({ state, onMechanismSelect }: { state: V6EditorialState; onMechanismSelect?: (id: string) => void }) {
  const adapted = useMemo(() => adaptLearningScenarioTree(state.scenario_tree), [state.scenario_tree]);
  const learning = state.learning_experience;
  return <ScenarioTree {...adapted} conditional evidence={[]} sources={[]} language="FR" renderNodeDetails={id => {
    const node = state.scenario_tree.nodes.find(item => item.id === id);
    if (!node) return null;
    const explanation = learning?.scenario_explanations.find(item => item.node_id === id);
    const fields = [
      ["Condition", node.condition_fr], ["Chemin causal", node.causal_path_fr],
      ["Confirmation observable", node.observable_confirmation_fr], ["Horizon", node.time_window_fr],
      ["Éléments contraires", node.opposing_evidence_fr], ["Invalidation", node.invalidation_fr],
      ["Interprétation pratique", node.practical_interpretation_fr],
    ];
    const edges = state.scenario_tree.edges.filter(edge => edge.from_id === id || edge.to_id === id);
    return <>
      {fields.map(([label, value]) => <div className={styles.callout} key={label}><b>{label}</b><p>{value}</p></div>)}
      {explanation && <section className={styles.branchExplanation}>
        <h4>Comprendre ce scénario</h4>
        {[["Résumé", explanation.summary_fr], ["Principe de départ", explanation.first_principle_fr], ["Acteur", explanation.actor_fr], ["Pourquoi maintenant", explanation.why_now_fr], ["Limites", explanation.limits_fr]].map(([label, value]) => <p key={label}><b>{label}</b>{value}</p>)}
        {explanation.mechanism_refs.map(ref => {
          const mechanism = learning?.mechanisms.find(item => item.id === ref);
          return mechanism && onMechanismSelect ? <button className={styles.mechanismLink} key={ref} onClick={() => onMechanismSelect(ref)}>{mechanism.title_fr}</button> : null;
        })}
      </section>}
      {edges.length > 0 && <section className={styles.branchExplanation}><h4>Transitions reliées</h4>{edges.map((edge, index) => {
        const from = state.scenario_tree.nodes.find(item => item.id === edge.from_id);
        const to = state.scenario_tree.nodes.find(item => item.id === edge.to_id);
        return <div key={index}><h4>{from?.title_fr} → {to?.title_fr}</h4><p><b>Condition observable</b>{edge.observable_condition_fr}</p><p><b>Transmission causale</b>{edge.causal_explanation_fr}</p></div>;
      })}</section>}
    </>;
  }} />;
}
