"use client";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { fetchSundayRead } from "@/lib/api/sundayReadClient";
import { ScenarioTree } from "@/components/sundayRead/ScenarioTree";
import styles from "./page.module.css";

type Read = any;
export default function SundayReadPage() {
  return (
    <Suspense fallback={<main className={styles.page}>Chargement…</main>}>
      <SundayReadContent />
    </Suspense>
  );
}
function SundayReadContent() {
  const params = useSearchParams();
  const [read, setRead] = useState<Read>(null);
  const [error, setError] = useState<string | null>(null);
  const date = params.get("date") ?? undefined;
  useEffect(() => {
    fetchSundayRead(date)
      .then(setRead)
      .catch((reason: unknown) =>
        setError(reason instanceof Error ? reason.message : "Erreur inconnue"),
      );
  }, [date]);
  if (error)
    return (
      <main className={styles.page}>
        <h1>Gold Sunday Read</h1>
        <p className={styles.error}>{error}</p>
        <p>
          Exécutez <code>npm run sunday:fixture</code>, puis ouvrez avec{" "}
          <code>?date=YYYY-MM-DD</code>.
        </p>
      </main>
    );
  if (!read)
    return <main className={styles.page}>Chargement du Sunday Read…</main>;
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <span>GOLD WEEKLY / SUNDAY READ</span>
        <h1>{read.meta.week_of}</h1>
        <small
          className={read.meta.data_mode === "FIXTURE" ? styles.fixture : ""}
        >
          {read.meta.data_mode} · {read.meta.status} ·{" "}
          {read.meta.as_of ?? "AS-OF UNKNOWN"}
        </small>
      </header>
      <section>
        <h2>Market Story</h2>
        {String(read.executive_narrative)
          .split("\n\n")
          .map((paragraph: string, i: number) => (
            <p key={i}>{paragraph}</p>
          ))}
        <details className={styles.audit}>
          <summary>Audit / metadata</summary>
          <pre>
            {JSON.stringify(
              {
                meta: read.meta,
                confidence: read.qualitative_confidence,
                what_changed_this_week: read.what_changed_this_week,
                dominant_driver: read.dominant_driver,
                late: read.late,
                event_expiry: read.event_expiry,
              },
              null,
              2,
            )}
          </pre>
        </details>
      </section>
      <section>
        <h2>Contexts by horizon</h2>
        <div className={styles.grid}>
          {Object.entries(read.contexts).map(
            ([name, context]: [string, any]) => (
              <article key={name}>
                <span className={styles.orientation}>
                  {context.orientation}
                </span>
                <h3>{name}</h3>
                <p>{context.why}</p>
                <details>
                  <summary>Evidence, competing thesis, invalidation</summary>
                  <p>{context.competing_thesis}</p>
                  <p>{context.invalidation}</p>
                </details>
              </article>
            ),
          )}
        </div>
      </section>
      <section>
        <h2>What is priced / what can still surprise</h2>
        <div className={styles.split}>
          <article>
            <span className={styles.orientation}>ALREADY PRICED</span>
            <ul>
              {read.priced_in.already_priced.map((item: string) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
          <article>
            <span className={styles.orientation}>WHAT CAN STILL SURPRISE</span>
            {read.priced_in.surprise_candidates.map((item: any, i: number) => (
              <div key={i}>
                <strong>{item.surprise_condition}</strong>
                <p>
                  {item.baseline} · {item.first_channel}
                </p>
              </div>
            ))}
          </article>
        </div>
      </section>
      <ScenarioTree
        tree={read.scenario_tree}
        evidence={read.evidence}
        sources={read.sources}
        scenarioExplanations={read.scenario_explanations}
      />
      <section>
        <h2>Asymmetry / edge</h2>
        <p>{read.asymmetry.summary}</p>
        <strong>
          {read.asymmetry.opportunity} · {read.asymmetry.edge}
        </strong>
      </section>
      <section>
        <h2>Research audit trail</h2>
        <details>
          <summary>Competing hypotheses & cross-asset reality test</summary>
          <pre>
            {JSON.stringify(
              {
                hypotheses: read.competing_hypotheses,
                cross_asset_reality_test: read.cross_asset_reality_test,
                transmission_chains: read.transmission_chains,
              },
              null,
              2,
            )}
          </pre>
        </details>
        {[
          "catalysts",
          "invalidations",
          "contradictions",
          "anomalies",
          "unknowns",
          "weekly_timeline",
        ].map((key) => (
          <details key={key}>
            <summary>{key}</summary>
            <pre>{JSON.stringify(read[key], null, 2)}</pre>
          </details>
        ))}
        <details>
          <summary>Evidence & sources</summary>
          <pre>
            {JSON.stringify(
              { evidence: read.evidence, sources: read.sources },
              null,
              2,
            )}
          </pre>
        </details>
      </section>
    </main>
  );
}
