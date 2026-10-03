import type { ReactNode } from "react";
import type { V6EditorialState } from "@/lib/sundayRead/v6Editorial";
import { learningDate } from "@/lib/sundayRead/learningReaderModel";
import { humanStatus } from "@/lib/sundayRead/v6ReaderModel";
import styles from "./LearningExperienceReader.module.css";
type Learning = NonNullable<V6EditorialState["learning_experience"]>;
const judgmentTitles: Record<string, string> = {
  macro_direction: "Direction macro",
  directional_asymmetry: "Asymétrie directionnelle",
  positioning_asymmetry: "Asymétrie de positionnement",
  evidence_quality: "Solidité des preuves",
  analysis_scope: "Portée fondamentale",
  fundamental_conclusion: "Conclusion par instrument",
};
export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className={styles.field}>
      <strong>{label}</strong>
      <p>{children}</p>
    </div>
  );
}
function Judgments({ state }: { state: V6EditorialState }) {
  return (
    <section>
      <h2>Les six jugements distincts</h2>
      <div className={styles.grid}>
        {state.six_judgments.map((item) => (
          <article className={styles.panel} key={item.id}>
            <h3>{judgmentTitles[item.id] ?? item.title}</h3>
            <strong>{item.display}</strong>
            <p>{item.body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
export function CanonicalChanges({ state }: { state: V6EditorialState }) {
  const sections = [
    ["still_true", "Toujours vrai"],
    ["new_observations", "Nouvelles observations"],
    ["strengthened", "Renforcé"],
    ["weakened", "Affaibli"],
    ["invalidated", "Invalidé"],
    ["exogenous_factors", "Facteurs exogènes"],
    ["unresolved", "Non résolu"],
    ["next_checks", "Prochains tests"],
  ] as const;
  const evolution = state.evolution_review;
  return (
    <>
      {evolution && (
        <section className={styles.panel}>
          <h3>Évolution de la lecture canonique</h3>
          <p>{evolution.summary_fr}</p>
          {sections.map(([key, label]) => (
            <details key={key}>
              <summary>{label}</summary>
              {evolution[key].map((item, i) => (
                <Field key={i} label={item.title_fr}>
                  {item.body_fr}
                </Field>
              ))}
            </details>
          ))}
          <details>
            <summary>Changements des jugements et scénarios</summary>
            {evolution.judgment_changes.map((item, i) => (
              <Field
                key={i}
                label={judgmentTitles[item.judgment_id] ?? "Jugement"}
              >
                {humanStatus(item.previous_state)} →{" "}
                {humanStatus(item.current_state)}. {item.reason_fr}{" "}
                {item.consequence_fr}
              </Field>
            ))}
            {evolution.scenario_transitions.map((item, i) => (
              <Field
                key={i}
                label={
                  state.scenario_tree.nodes.find(
                    (node) => node.id === item.scenario_id,
                  )?.title_fr ?? "Scénario"
                }
              >
                {humanStatus(item.status)} · {item.explanation_fr}
              </Field>
            ))}
          </details>
        </section>
      )}
      {state.weekly_bridge && (
        <section className={styles.panel}>
          <h3>Comparaison hebdomadaire après gel indépendant</h3>
          <p>{state.weekly_bridge.comparison_limit_fr}</p>
          {(
            [
              ["changes", "Évolutions"],
              ["surviving_conclusions", "Conclusions conservées"],
              ["resolved_expectations", "Attentes résolues"],
              ["failed_expectations", "Attentes non confirmées"],
            ] as const
          ).map(([key, label]) => (
            <details key={key}>
              <summary>{label}</summary>
              {state.weekly_bridge?.[key]?.map((text, i) => (
                <p key={i}>{text}</p>
              ))}
            </details>
          ))}
        </section>
      )}
    </>
  );
}
export function Calendar({ state }: { state: V6EditorialState }) {
  return (
    <section className={styles.panel}>
      <h2>Horizons, calendrier et chronologie</h2>
      <details>
        <summary>Les horizons</summary>
        {Object.entries(state.horizons).map(([key, value]) => (
          <Field
            key={key}
            label={
              (
                {
                  tactical: "Tactique",
                  medium: "Moyen terme",
                  structural: "Structurel",
                } as Record<string, string>
              )[key] ?? "Horizon"
            }
          >
            {value}
          </Field>
        ))}
      </details>
      <details>
        <summary>Le calendrier complet</summary>
        {state.calendar.map((event, i) => (
          <article key={i}>
            <h3>
              {learningDate(event.at)} · {event.event}
            </h3>
            <p>{event.watch}</p>
            {event.expected && <Field label="Attendu">{event.expected}</Field>}
          </article>
        ))}
      </details>
      <details>
        <summary>La chronologie complète</summary>
        {state.chronology.map((event, i) => (
          <Field key={i} label={event.date_label_fr}>
            {event.event_fr}
          </Field>
        ))}
      </details>
      <details>
        <summary>Facteurs exogènes et limites</summary>
        {state.exogenous_review.map((item, i) => (
          <Field
            key={i}
            label={`${item.category} · ${humanStatus(item.status)}`}
          >
            {item.finding}
          </Field>
        ))}
      </details>
    </section>
  );
}
export function Forces({
  state,
  learning,
}: {
  state: V6EditorialState;
  learning: Learning;
}) {
  return (
    <>
      <h2>Les forces en jeu</h2>
      <div className={styles.grid}>
        {state.family_readouts.map((family) => (
          <article className={styles.panel} key={family.id}>
            <h3>{family.title_fr}</h3>
            <Field label="Lecture locale">
              {family.local_interpretation_fr}
            </Field>
            <Field label="Rôle dans l’ensemble">
              {
                learning.synthesis.pieces.find(
                  (piece) => piece.family_id === family.id,
                )?.role_fr
              }
            </Field>
            <details>
              <summary>
                Questions et réponses · {family.questions.length}
              </summary>
              {family.questions.map((question, questionIndex) => (
                <article className={styles.question} key={`${questionIndex}:${question.question_fr}`}>
                  <h4>{question.question_fr}</h4>
                  <p>{question.answer_fr}</p>
                  <small>
                    {humanStatus(question.status)} · Mesure :{" "}
                    {learningDate(question.as_of)}
                    {question.refresh_status &&
                      ` · ${humanStatus(question.refresh_status)}`}
                    {question.checked_at &&
                      ` · Vérifié le ${learningDate(question.checked_at)}`}
                  </small>
                  {question.missing_observation && (
                    <div className={styles.limit}>
                      <strong>Observation manquante</strong>
                      {question.missing_observation.obstacle && (
                        <Field label="Obstacle">
                          {question.missing_observation.obstacle}
                        </Field>
                      )}
                      {question.missing_observation.consequence_fr && (
                        <Field label="Conséquence">
                          {question.missing_observation.consequence_fr}
                        </Field>
                      )}
                      {question.missing_observation.next_recovery_action_fr && (
                        <Field label="Prochaine récupération">
                          {question.missing_observation.next_recovery_action_fr}
                        </Field>
                      )}
                    </div>
                  )}
                </article>
              ))}
            </details>
          </article>
        ))}
      </div>
      <Judgments state={state} />
    </>
  );
}
