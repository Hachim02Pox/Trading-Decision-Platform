"use client";
import { useState, type ReactNode } from "react";
import {
  Field,
  CanonicalChanges,
  Calendar,
  Forces,
} from "./LearningCanonicalSections";
import type { V6EditorialState } from "@/lib/sundayRead/v6Editorial";
import {
  learningTabs,
  learningDate,
  retainLearningSelection,
  learningRelationLabels,
  type LearningTab,
  type LearningDepth,
} from "@/lib/sundayRead/learningReaderModel";
import { v6ValidityMessage } from "@/lib/sundayRead/v6ReaderModel";
import { V6ScenarioGraph } from "./LearningScenarioTree";
import styles from "./LearningExperienceReader.module.css";

export type LearningPreference = { tab: LearningTab; depth: LearningDepth };
const judgmentTitles: Record<string, string> = {
  macro_direction: "Direction macro",
  directional_asymmetry: "Asymétrie directionnelle",
  positioning_asymmetry: "Asymétrie de positionnement",
  evidence_quality: "Solidité des preuves",
  analysis_scope: "Portée fondamentale",
  fundamental_conclusion: "Conclusion par instrument",
};
const synthesisFields = [
  ["dominant_driver_fr", "Moteur dominant"],
  ["counter_case_fr", "Meilleur contraire"],
  ["why_preferred_or_mixed_fr", "Pourquoi cette lecture"],
  ["priced_in_fr", "Déjà intégré dans les prix"],
  ["conditional_outlook_fr", "Suite conditionnelle"],
  ["unresolved_fr", "Ce qui reste inconnu"],
  ["next_checks_fr", "Prochains tests"],
] as const;
export function LearningExperienceReader({
  state,
  preference,
  onPreferenceChange,
  baselineAvailable,
  timeline,
}: {
  state: V6EditorialState;
  preference?: LearningPreference;
  onPreferenceChange?: (value: LearningPreference) => void;
  baselineAvailable?: boolean;
  timeline?: ReactNode;
}) {
  const learning = state.learning_experience!;
  const [localPreference, setLocalPreference] = useState<LearningPreference>({
    tab: "La lecture",
    depth: "simple",
  });
  const current = preference ?? localPreference;
  const changePreference = (next: LearningPreference) => {
    setLocalPreference(next);
    onPreferenceChange?.(next);
  };
  const tab = current.tab;
  const deep = current.depth === "deep";
  const [mechanismId, setMechanismId] = useState<string | null>(null);
  const [conceptId, setConceptId] = useState<string | null>(null);
  const [pieceId, setPieceId] = useState<string | null>(null);
  const [localDeep, setLocalDeep] = useState<string | null>(null);
  const mechanism = learning.mechanisms.find(
    (item) =>
      item.id === retainLearningSelection(mechanismId, learning.mechanisms),
  );
  const concept = learning.concepts.find(
    (item) => item.id === retainLearningSelection(conceptId, learning.concepts),
  );
  const piece =
    learning.synthesis.pieces.find((item) => item.family_id === pieceId) ??
    learning.synthesis.pieces[0];
  const selectConcept = (id: string) => {
    setConceptId(id);
    changePreference({ ...current, tab: "Comprendre" });
  };
  const selectMechanism = (id: string) => {
    setMechanismId(id);
    changePreference({ ...current, tab: "La lecture" });
  };
  const rich = (text: string) => {
    const matches = learning.concepts
      .map((item) => ({
        item,
        index: text
          .toLocaleLowerCase("fr")
          .indexOf(item.term_fr.toLocaleLowerCase("fr")),
      }))
      .filter((match) => match.index >= 0)
      .sort((a, b) => a.index - b.index);
    const match = matches[0];
    return match ? (
      <>
        {text.slice(0, match.index)}
        <button
          type="button"
          className={styles.term}
          onClick={() => selectConcept(match.item.id)}
        >
          {text.slice(match.index, match.index + match.item.term_fr.length)}
        </button>
        {text.slice(match.index + match.item.term_fr.length)}
      </>
    ) : (
      text
    );
  };
  const mechanismLinks = (ids: string[]) => (
    <div className={styles.selectors}>
      {ids.map((id) => {
        const item = learning.mechanisms.find((entry) => entry.id === id);
        return item ? (
          <button type="button" key={id} onClick={() => selectMechanism(id)}>
            {item.title_fr}
          </button>
        ) : null;
      })}
    </div>
  );
  const factDetails = (ids: string[]) => (
    <>
      {learning.facts
        .filter((item) => ids.includes(item.id))
        .map((fact) => (
          <article key={fact.id} className={styles.question}>
            <h4>{fact.title_fr}</h4>
            <p>{fact.observation_fr}</p>
            <small>
              {
                {
                  OBSERVED: "Observation vérifiée",
                  UNVERIFIED: "Non vérifié",
                  NOT_APPLICABLE: "Non applicable",
                }[fact.status]
              }{" "}
              · Mesure : {learningDate(fact.measurement_as_of)} · Vérification :{" "}
              {learningDate(fact.checked_at)}
            </small>
            <p>{fact.measurement_window_fr}</p>
            <Field label="Limite">{fact.limits_fr}</Field>
          </article>
        ))}
    </>
  );
  return (
    <div className={styles.reader}>
      <div className={styles.heading}>
        <div>
          <small>HT TERMINAL · OR</small>
          <h1>Histoire du marché</h1>
        </div>
        <div className={styles.depth}>
          <span>Profondeur de lecture</span>
          <div>
            {(
              [
                ["simple", "En clair"],
                ["deep", "Au fond"],
              ] as const
            ).map(([value, title]) => (
              <button
                type="button"
                key={value}
                aria-pressed={current.depth === value}
                onClick={() => changePreference({ ...current, depth: value })}
              >
                {title}
              </button>
            ))}
          </div>
        </div>
      </div>
      {timeline}
      <div className={styles.context}>
        <div className={styles.contextMeta}>
          <strong>
            {state.meta.run_type === "SUNDAY"
              ? "Sunday récap"
              : "Intermédiaire"}
          </strong>
          <span>
            Faits au cutoff :{" "}
            {learningDate(
              state.time_scope?.evidence_cutoff_utc ??
                state.meta.evidence_cutoff_end,
            )}
          </span>
          {state.time_scope?.upcoming_week_start && (
            <span>
              Semaine : {state.time_scope.upcoming_week_start} —{" "}
              {state.time_scope.upcoming_week_end}
            </span>
          )}
        </div>
        <p className={styles.contextLimit}>{learning.context.limitation_fr}</p>
        <p role="status">{v6ValidityMessage(state.decision_panel)}</p>
        <p>
          <b>Échéance : </b>
          {learningDate(state.decision_panel.scheduled_expiry)}
          {state.decision_panel.earlier_expiry && (
            <>
              {" "}
              · <b>Plus tôt si : </b>
              {state.decision_panel.earlier_expiry}
            </>
          )}
        </p>
        <details className={styles.contextDetails}>
          <summary>Périmètre et décisions séparées</summary>
          <p>{learning.context.scope_fr}</p>
          <p>{state.decision_panel.scope}</p>
          <p>{state.decision_panel.separate_choices_fr}</p>
        </details>
      </div>
      <nav className={styles.tabs} aria-label="Explorer le récap">
        {learningTabs.map((title) => (
          <button
            type="button"
            key={title}
            aria-pressed={tab === title}
            onClick={() => changePreference({ ...current, tab: title })}
          >
            {title}
          </button>
        ))}
      </nav>
      <div className={styles.content} key={tab}>
        {tab === "La lecture" && (
          <>
            <section className={styles.hero}>
              <small>LA LECTURE AU CUTOFF</small>
              <h2>{learning.headline.title_fr}</h2>
              <p>{rich(learning.headline.summary_fr)}</p>
              <div className={styles.limit}>
                <Field label="Meilleur contraire">
                  {learning.synthesis.counter_case_fr}
                </Field>
                <Field label="Incertitudes">
                  {learning.synthesis.unresolved_fr}
                </Field>
                <Field label="Limites de validité">
                  {state.decision_panel.limit_fr}
                </Field>
              </div>
              <div className={styles.heroBottom}>
                {["macro_direction", "evidence_quality"].map((id) => {
                  const item = state.six_judgments.find(
                    (entry) => entry.id === id,
                  );
                  return item ? (
                    <div key={id}>
                      <small>{judgmentTitles[id]}</small>
                      <strong>{item.display}</strong>
                      <p>{item.body}</p>
                    </div>
                  ) : null;
                })}
                <div>
                  <small>Prochaine question</small>
                  <strong>{learning.headline.next_question_fr}</strong>
                </div>
              </div>
              <details open>
                <summary>Toute la thèse d’ouverture</summary>
                {state.opening_thesis.map((item, i) => (
                  <Field key={i} label={item.title_fr}>
                    {rich(item.body_fr)}
                  </Field>
                ))}
              </details>
            </section>
            <section>
              <h2>Le mécanisme, maillon par maillon</h2>
              <ol className={styles.chain}>
                {learning.mechanisms.map((item, index) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      aria-pressed={mechanism?.id === item.id}
                      onClick={() => setMechanismId(item.id)}
                    >
                      <small>{String(index + 1).padStart(2, "0")}</small>
                      <strong>{item.title_fr}</strong>
                      <span>{item.summary_fr}</span>
                    </button>
                  </li>
                ))}
              </ol>
              {mechanism && (
                <article className={styles.panel}>
                  <h3>{mechanism.title_fr}</h3>
                  <p>{rich(mechanism.summary_fr)}</p>
                  <Field label="Application présente">
                    {rich(mechanism.current_application_fr)}
                  </Field>
                  <Field label="Meilleur contraire">
                    {mechanism.alternative_fr}
                  </Field>
                  <Field label="Limites">{mechanism.limits_fr}</Field>
                  <Field label="Horizon">{mechanism.horizon_fr}</Field>
                  <Field label="Confirmation observable">
                    {mechanism.confirmation_fr}
                  </Field>
                  <Field label="Invalidation">
                    {mechanism.invalidation_fr}
                  </Field>
                  <details
                    open={
                      deep ||
                      localDeep === `${state.meta.run_id}:${mechanism.id}` ||
                      undefined
                    }
                  >
                    <summary
                      onClick={(event) => {
                        if (
                          !deep &&
                          localDeep !== `${state.meta.run_id}:${mechanism.id}`
                        ) {
                          event.preventDefault();
                          setLocalDeep(`${state.meta.run_id}:${mechanism.id}`);
                        }
                      }}
                    >
                      Remonter à la cause · acteurs, exemple et conditions
                    </summary>
                    {(
                      [
                        ["first_principle_fr", "Cause de départ"],
                        ["actor_fr", "Acteur"],
                        ["incentive_fr", "Incitation"],
                        ["transmission_fr", "Transmission"],
                      ] as const
                    ).map(([key, label]) => (
                      <Field key={key} label={label}>
                        {rich(mechanism[key])}
                      </Field>
                    ))}
                    {mechanism.examples.map((example, i) => (
                      <Field
                        key={i}
                        label={
                          example.kind === "ILLUSTRATIVE"
                            ? "Exemple fictif"
                            : "Exemple observé"
                        }
                      >
                        {example.text_fr}
                      </Field>
                    ))}
                    <div className={styles.selectors}>
                      {mechanism.concept_refs.map((id) => {
                        const item = learning.concepts.find(
                          (entry) => entry.id === id,
                        );
                        return item ? (
                          <button
                            key={id}
                            type="button"
                            onClick={() => selectConcept(id)}
                          >
                            {item.term_fr}
                          </button>
                        ) : null;
                      })}
                    </div>
                  </details>
                  <details>
                    <summary>Observations datées du maillon</summary>
                    {factDetails(mechanism.fact_refs)}
                  </details>
                </article>
              )}
              <div className={styles.links}>
                {learning.causal_links.map((link) => (
                  <article key={link.id}>
                    <strong>
                      {
                        learning.mechanisms.find(
                          (item) => item.id === link.from_id,
                        )?.title_fr
                      }{" "}
                      →{" "}
                      {
                        learning.mechanisms.find(
                          (item) => item.id === link.to_id,
                        )?.title_fr
                      }
                    </strong>
                    <small>{learningRelationLabels[link.relation]}</small>
                    <p>{link.explanation_fr}</p>
                    {link.dependency_group && (
                      <span>Mécanismes dépendants d’un même canal</span>
                    )}
                  </article>
                ))}
              </div>
            </section>
            <section className={styles.panel}>
              <h2>Le puzzle final</h2>
              <div className={styles.selectors}>
                {learning.synthesis.pieces.map((item) => (
                  <button
                    type="button"
                    key={item.family_id}
                    aria-pressed={piece?.family_id === item.family_id}
                    onClick={() => setPieceId(item.family_id)}
                  >
                    {item.title_fr}
                  </button>
                ))}
              </div>
              {piece && (
                <article className={styles.piece}>
                  <h3>{piece.title_fr}</h3>
                  <p>{piece.summary_fr}</p>
                  <Field label="Rôle dans l’ensemble">{piece.role_fr}</Field>
                  {piece.coverage !== "REVIEWED" && (
                    <p className={styles.limit}>
                      {piece.coverage === "INHERITED_NOT_RECHECKED"
                        ? "Héritée, non revérifiée par ce contrôle"
                        : "Partiellement revérifiée"}
                    </p>
                  )}
                  {mechanismLinks(piece.mechanism_refs)}
                  <details>
                    <summary>Faits datés de cette pièce</summary>
                    {factDetails(piece.fact_refs)}
                  </details>
                </article>
              )}
              <h3>Comment les pièces se relient</h3>
              {learning.synthesis.connections.map((connection, i) => (
                <article className={styles.question} key={i}>
                  <strong>
                    {
                      learning.synthesis.pieces.find(
                        (item) => item.family_id === connection.from_family_id,
                      )?.title_fr
                    }{" "}
                    →{" "}
                    {
                      learning.synthesis.pieces.find(
                        (item) => item.family_id === connection.to_family_id,
                      )?.title_fr
                    }
                  </strong>
                  <p>{connection.why_fr}</p>
                  <Field label="Où le lien cesse de fonctionner">
                    {connection.limit_fr}
                  </Field>
                  {mechanismLinks(connection.mechanism_refs)}
                </article>
              ))}
              <Field label="Pris ensemble">
                {rich(learning.synthesis.joint_reading_fr)}
              </Field>
              {synthesisFields.map(([key, label]) => (
                <Field key={key} label={label}>
                  {rich(learning.synthesis[key])}
                </Field>
              ))}
              {mechanismLinks(learning.synthesis.mechanism_refs)}
            </section>
            <section>
              <h2>{state.decision_panel.title_fr}</h2>
              <div className={styles.grid}>
                {state.decision_panel.instruments.map((item) => (
                  <article className={styles.panel} key={item.instrument}>
                    <h3>
                      {item.instrument === "FUTURES"
                        ? "GC / MGC Futures"
                        : item.instrument}
                    </h3>
                    <strong>
                      {(
                        {
                          LONG: "Sens haussier éligible",
                          SHORT: "Sens baissier éligible",
                          NEITHER: "Aucun sens éligible",
                        } as Record<string, string>
                      )[item.eligible_direction] ?? "Éligibilité non précisée"}
                    </strong>
                    <p>{item.answer_fr}</p>
                    <Field label="Pourquoi">{item.mechanism_fr}</Field>
                    <Field label="Horizon">
                      {state.decision_panel.horizon}
                    </Field>
                    <Field label="Contradiction principale">
                      {item.strongest_contradiction_fr}
                    </Field>
                    <Field label="Bascule ou réexamen">{item.flip_fr}</Field>
                    <Field label="Limites">
                      {state.decision_panel.limit_fr}
                    </Field>
                    <button
                      type="button"
                      className={styles.term}
                      onClick={() =>
                        changePreference({
                          ...current,
                          tab: "Les forces en jeu",
                        })
                      }
                    >
                      Voir les six jugements expliqués
                    </button>
                  </article>
                ))}
              </div>
              <Field label="Prochain réexamen">
                {state.decision_panel.recheck_fr}
              </Field>
            </section>
            <Calendar state={state} />
            <details className={styles.panel}>
              <summary>Toutes les observations datées</summary>
              {factDetails(learning.facts.map((item) => item.id))}
            </details>
          </>
        )}
        {tab === "Ce qui a changé" && (
          <>
            <h2>Ce qui a changé</h2>
            <section className={styles.panel}>
              <p>{learning.changes.summary_fr}</p>
              <p className={styles.limit}>
                {learning.changes.comparison_limit_fr}
              </p>
              {learning.changes.baseline_run_id &&
                baselineAvailable === false && (
                  <p role="status" className={styles.limit}>
                    La lecture de référence n’est pas accessible dans cet
                    historique. Les explications publiées restent disponibles;
                    la comparaison ne peut pas être revérifiée ici.
                  </p>
                )}
              {learning.changes.items.map((item, i) => (
                <article className={styles.question} key={i}>
                  <h3>{item.title_fr}</h3>
                  <div className={styles.grid}>
                    <Field label="Avant">{item.before_fr}</Field>
                    <Field label="Maintenant">{item.after_fr}</Field>
                  </div>
                  <Field label="Pourquoi">{item.why_fr}</Field>
                  <Field label="Conséquence">{item.consequence_fr}</Field>
                  {mechanismLinks(item.mechanism_refs)}
                  <details>
                    <summary>Faits associés</summary>
                    {factDetails(item.fact_refs)}
                  </details>
                </article>
              ))}
            </section>
            <CanonicalChanges state={state} />
          </>
        )}
        {tab === "Arbre de scénarios" && (
          <V6ScenarioGraph state={state} onMechanismSelect={selectMechanism} />
        )}
        {tab === "Les forces en jeu" && (
          <Forces state={state} learning={learning} />
        )}
        {tab === "Comprendre" && (
          <>
            <h2>Comprendre cette histoire</h2>
            <div className={styles.selectors}>
              {learning.concepts.map((item) => (
                <button
                  type="button"
                  key={item.id}
                  aria-pressed={concept?.id === item.id}
                  onClick={() => setConceptId(item.id)}
                >
                  {item.term_fr}
                </button>
              ))}
            </div>
            {concept && (
              <section className={styles.hero}>
                <h2>{concept.term_fr}</h2>
                <Field label="Définition">{concept.definition_fr}</Field>
                <Field label="Utilité économique">
                  {concept.why_it_matters_fr}
                </Field>
                <Field label="Lien avec ce récap">
                  {concept.current_application_fr}
                </Field>
                <Field
                  label={
                    concept.example_kind === "ILLUSTRATIVE"
                      ? "Exemple fictif"
                      : "Exemple observé"
                  }
                >
                  {concept.example_fr}
                </Field>
                <Field label="Erreur fréquente">
                  {concept.misconception_fr}
                </Field>
                <Field label="Limites">{concept.limits_fr}</Field>
                <details>
                  <summary>Faits liés au concept</summary>
                  {factDetails(concept.fact_refs)}
                </details>
              </section>
            )}
            <section>
              <h2>Teste ton raisonnement</h2>
              {learning.lessons.map((lesson) => (
                <article className={styles.panel} key={lesson.id}>
                  <h3>{lesson.question_fr}</h3>
                  <details>
                    <summary>Révéler la réponse et le raisonnement</summary>
                    <Field label="Réponse">{lesson.answer_fr}</Field>
                    <Field label="Raisonnement">{lesson.reasoning_fr}</Field>
                    <Field label="Limite">{lesson.limit_fr}</Field>
                    <div className={styles.selectors}>
                      {lesson.concept_refs.map((id) => {
                        const item = learning.concepts.find(
                          (entry) => entry.id === id,
                        );
                        return item ? (
                          <button
                            type="button"
                            key={id}
                            onClick={() => selectConcept(id)}
                          >
                            {item.term_fr}
                          </button>
                        ) : null;
                      })}
                    </div>
                    {factDetails(lesson.fact_refs)}
                  </details>
                </article>
              ))}
            </section>
            {state.glossary_fr && (
              <details className={styles.panel}>
                <summary>Glossaire canonique</summary>
                {Object.entries(state.glossary_fr).map(([term, definition]) => (
                  <Field key={term} label={term}>
                    {definition}
                  </Field>
                ))}
              </details>
            )}
          </>
        )}
      </div>
    </div>
  );
}
