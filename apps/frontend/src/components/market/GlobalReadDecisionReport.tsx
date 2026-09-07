"use client";

import type { GlobalReadDecision, GlobalReadFamilyAnalysis, GlobalReadScenario } from "@gold-terminal/contracts/dist/globalRead";
import styles from "./GlobalReadSection.module.css";
import { GlobalReadCausalMap } from "./GlobalReadCausalMap";

function sourceLabel(sourceUrl: string | null): string {
  if (!sourceUrl) return "source unknown";
  try {
    const host = new URL(sourceUrl).hostname.replace(/^www\./, "");
    if (host.includes("bea.gov")) return "BEA";
    if (host.includes("bls.gov")) return "BLS";
    if (host.includes("cftc.gov")) return "CFTC";
    if (host.includes("treasury.gov")) return "U.S. Treasury";
    if (host.includes("spdrgoldshares.com")) return "SPDR";
    if (host.includes("federalreserve.gov")) return "Federal Reserve";
    return host;
  } catch { return "source unknown"; }
}

function formatFactValue(value: number | string | null, french: boolean): string {
  return typeof value === "number" ? new Intl.NumberFormat(french ? "fr-FR" : "en-US", { maximumFractionDigits: 4 }).format(value) : String(value ?? "UNKNOWN");
}

const FAMILY_LABELS: Record<GlobalReadFamilyAnalysis["family"], string> = {
  RATES: "Taux", FED_PRICING: "Fed / anticipations", USD_FX: "USD / change", INFLATION: "Inflation",
  EMPLOYMENT_GROWTH: "Emploi / croissance", RISK_CREDIT_VOL: "Risque / crédit / vol", LIQUIDITY_FUNDING: "Liquidité / financement",
  STRUCTURAL: "Structurel / demande officielle", TREASURY_FISCAL: "Trésor / fiscal", GOLD_OPTIONS_VOL: "Options Or / vol", FLOWS_POSITIONING: "Flux / positionnement",
};
const FAMILY_LABELS_EN: Record<GlobalReadFamilyAnalysis["family"], string> = {
  RATES: "Rates", FED_PRICING: "Fed / expectations", USD_FX: "USD / FX", INFLATION: "Inflation", EMPLOYMENT_GROWTH: "Employment / growth",
  RISK_CREDIT_VOL: "Risk / credit / vol", LIQUIDITY_FUNDING: "Liquidity / funding", STRUCTURAL: "Structural / official demand",
  TREASURY_FISCAL: "Treasury / fiscal", GOLD_OPTIONS_VOL: "Gold options / vol", FLOWS_POSITIONING: "Flows / positioning",
};

function FamilyCard({ family, french }: { family: GlobalReadFamilyAnalysis; french: boolean }) {
  return <details className={styles.familyCard}><summary className={styles.familySummary}><span>{(french ? FAMILY_LABELS : FAMILY_LABELS_EN)[family.family]}</span><span>{family.goldImplicationCeterisParibus}</span></summary>
    <p className={styles.itemText}>{family.state}</p><p className={styles.itemText}><strong>{french ? "Pourquoi" : "Why"}:</strong> {family.causalMechanism}</p>
    <p className={styles.itemText}><strong>{french ? "Changement marginal" : "Marginal change"}:</strong> {family.marginalChange}</p><p className={styles.itemText}><strong>{french ? "Déjà pricé" : "Already priced"}:</strong> {family.alreadyPricedAssessment}</p>
    <p className={styles.itemText}><strong>Contradictions:</strong> {family.contradictions.join(" · ") || (french ? "Aucune établie" : "None established")}</p>
    <p className={styles.itemText}><strong>{french ? "Manque" : "Missing"}:</strong> {family.missingEvidence.join(" · ") || (french ? "Rien de critique déclaré" : "No critical gap declared")}</p></details>;
}

function ScenarioCard({ scenario, french }: { scenario: GlobalReadScenario; french: boolean }) {
  return <article className={styles.scenarioCard}><div className={styles.scenarioHeader}><strong>{scenario.kind}</strong><span>{scenario.status ?? "PROPOSED"}</span></div>
    <p className={styles.itemText}>{scenario.description}</p>{scenario.mechanism && <p className={styles.itemText}><strong>{french ? "Mécanisme" : "Mechanism"}:</strong> {scenario.mechanism}</p>}
    <p className={styles.itemText}><strong>Trigger:</strong> {scenario.expectedObservations.join(" · ")}</p><p className={styles.itemText}><strong>{french ? "Pricé" : "Priced"}:</strong> {scenario.whatIsPriced ?? "UNKNOWN"}</p>
    {(scenario.triggerConditions ?? []).map((condition, index) => <p className={styles.itemText} key={`trigger-${index}`}>{condition.description}</p>)}
    <p className={styles.itemText}><strong>{french ? "Peut repricer" : "Could reprice"}:</strong> {scenario.whatCouldReprice ?? "UNKNOWN"}</p><p className={styles.itemText}><strong>Invalidation:</strong> {scenario.invalidatedBy}</p>
    {(scenario.invalidationConditions ?? []).map((condition, index) => <p className={styles.itemText} key={`invalidation-${index}`}>{condition.description}</p>)}</article>;
}

export function GlobalReadDecisionReport({ decision: d, french }: { decision: GlobalReadDecision; french: boolean }) {
  const report = d.rebuild;
  const stale = d.decisionUse === "HISTORICAL_ONLY";
  const formatDate = (value: string) => new Intl.DateTimeFormat(french ? "fr-FR" : "en-US", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
  const tr = (fr: string, en: string) => french ? fr : en;
  if (!report) return <p className={styles.errorText}>{tr("Ce rapport ne suit pas encore la nouvelle spécification Global Read.", "This report does not yet follow the Global Read rebuild specification.")}</p>;
  return <div className={styles.report}>
    {report.previousRunId && <section className={styles.reportGroup}><h3 className={styles.sectionHeading}>{tr("Ce qui a changé depuis la dernière lecture", "What changed since the previous read")}</h3>
      <ul className={styles.plainList}>{report.whatChanged.map((change, index) => <li key={index} className={styles.plainListItem}>{change}</li>)}</ul></section>}

    <section className={styles.heroRead}><div className={styles.decisionLine}><span className={styles.actionBadge}>{stale ? "NO CLEAN EDGE" : report.operationalAction.replaceAll("_", " ")}</span><span>{d.thesis}</span></div>
      <h3 className={styles.sectionHeading}>{tr("1. Où en est le Gold ?", "1. Where does Gold stand?")}</h3><p className={styles.itemText}>{report.overview}</p>
      <p className={styles.itemText}><strong>{tr("Driver marginal", "Marginal driver")}:</strong> {d.marginalDriver}</p><p className={styles.itemText}><strong>{tr("Déjà pricé", "Already priced")}:</strong> {d.priced}</p>
      {d.keyFacts.length > 0 && <ul className={styles.plainList}>{d.keyFacts.map((fact) => <li key={fact.ref} className={styles.plainListItem}>
        {fact.selected?.definition ?? fact.ref}: {formatFactValue(fact.admittedValue, french)} {fact.selected?.unit ?? ""} ({fact.provenance === "WEB_ONLY_VERIFIED" ? `web-only: ${sourceLabel(fact.selected?.sourceUrl ?? null)}; terminal source unavailable` : sourceLabel(fact.selected?.sourceUrl ?? null)})
      </li>)}</ul>}
      {stale && <p role="status" className={styles.errorText}>{tr("Rapport historique ou expiré : actualise-le avant toute utilisation.", "Historical or expired report: refresh it before use.")}</p>}
      <p className={styles.disclaimer}>{tr("Contexte macro et mécanique uniquement. Ton setup technique, ton entrée et ton risque restent sous ta responsabilité.", "Macro and mechanical context only. Your technical setup, entry and risk remain your responsibility.")}</p></section>

    <section className={styles.reportGroup}><h3 className={styles.sectionHeading}>{tr("2. Le monde derrière le Gold", "2. The world behind Gold")}</h3>
      <div className={styles.familyGrid}>{report.synthesizedFamilies.map((family) => <FamilyCard family={family} french={french} key={family.family} />)}</div></section>

    {report.causalGraph && <GlobalReadCausalMap graph={report.causalGraph} french={french} />}

    <section className={styles.reportGroup}><h3 className={styles.sectionHeading}>{tr("3. Comment tout cela s’assemble", "3. How it fits together")}</h3><p className={styles.itemText}>{report.assembly}</p>
      {d.blockers.length > 0 && <details className={styles.footerDetails}><summary className={styles.footerSummary}>{tr("Pourquoi la lecture n’est pas exploitable", "Why the read is not exploitable")}</summary>
        {d.blockers.map((blocker, index) => <p key={index} className={styles.itemText}><strong>{blocker.code}</strong> — {blocker.detail}{blocker.resolver ? ` ${blocker.resolver}` : ""}</p>)}</details>}</section>

    <section className={styles.reportGroup}><h3 className={styles.sectionHeading}>{tr("4. Les questions qui comptent", "4. The questions that matter")}</h3><div className={styles.questionGrid}>
      {report.synthesizedQuestions.map((answer) => <details className={styles.familyCard} key={answer.question}><summary className={styles.footerSummary}>{tr("Question", "Question")} {answer.question}</summary>
        <p className={styles.itemText}>{answer.answer}</p>{answer.unknowns.length > 0 && <p className={styles.statusText}>{tr("Encore inconnu", "Still unknown")}: {answer.unknowns.join(" · ")}</p>}</details>)}</div></section>

    <section className={styles.reportGroup}><h3 className={styles.sectionHeading}>{tr("5. Le débat", "5. The debate")}</h3><p className={styles.itemText}>{report.debateSummary} <strong>{report.debateResolution}</strong></p>
      <div className={styles.debateGrid}><div><span className={styles.groupTitle}>{tr("Points solides", "Solid points")}</span>{report.solidPoints.map((point, index) => <p className={styles.itemText} key={index}>{point}</p>)}</div>
        <div><span className={styles.groupTitle}>{tr("Débat réel", "Real debate")}</span>{report.disputedPoints.map((point, index) => <p className={styles.itemText} key={index}>{point}</p>)}</div>
        <div><span className={styles.groupTitle}>{tr("Ce qui départagera", "What will decide")}</span>{report.whatWillDecide.map((point, index) => <p className={styles.itemText} key={index}>{point}</p>)}</div></div></section>

    <section className={styles.reportGroup}><h3 className={styles.sectionHeading}>{tr("6. Scénarios", "6. Scenarios")}</h3><div className={styles.scenarioGrid}>
      {report.scenarioTree.map((scenario) => <ScenarioCard scenario={scenario} french={french} key={scenario.id ?? scenario.kind} />)}</div></section>

    <section className={styles.reportGroup}><h3 className={styles.sectionHeading}>{tr("7. Positionnement et asymétrie", "7. Positioning and asymmetry")}</h3><p className={styles.itemText}>{d.positioning}</p>
      <p className={styles.itemText}><strong>Price response:</strong> {d.audit.priceTest.state} — {d.audit.priceTest.reason}</p><p className={styles.itemText}><strong>Trap:</strong> {d.trap}</p></section>

    <section className={styles.actionPanel}><h3 className={styles.sectionHeading}>{tr("8. Ce que je ferais maintenant", "8. What to do now")}</h3><strong>{stale ? "NO CLEAN EDGE" : report.operationalAction.replaceAll("_", " ")}</strong>
      <p className={styles.itemText}>{d.remainingEdge}</p><p className={styles.itemText}><strong>{tr("Ce qui affaiblit", "What weakens it")}:</strong> {report.weakening.join(" · ") || tr("Non établi", "Not established")}</p>
      <p className={styles.itemText}><strong>{tr("Prochains risques", "Next risks")}:</strong> {d.nextCatalysts.map((event) => `${event.title} — ${formatDate(event.scheduledAt)}`).join(" · ") || tr("Calendrier incomplet / aucun événement vérifié", "Incomplete calendar / no verified event")}</p></section>

    <details className={styles.footerDetails}><summary className={styles.footerSummary}>{tr("Audit complet — données, sources, analyses et confrontation", "Full audit — data, sources, analyses and debate")}</summary>
      <pre className={styles.auditJson}>{JSON.stringify({ evidence: d.audit.evidence, web: d.audit.web, timing: d.audit.timingsMs, cli: d.audit.cli, rebuild: report.audit }, null, 2)}</pre></details>
  </div>;
}
