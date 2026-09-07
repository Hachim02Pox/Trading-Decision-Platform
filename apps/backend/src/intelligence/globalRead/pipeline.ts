import { randomUUID } from "node:crypto";
import type { CanonicalFamilySnapshot, Language } from "@gold-terminal/contracts";
import type { GlobalReadAdmission, GlobalReadCatalyst, GlobalReadDecision, GlobalReadFact } from "@gold-terminal/contracts/dist/globalRead";
import { canonicalFacts, freezePriorView, hashObject } from "./snapshot";
import { verifyPrimaryFacts } from "./primaryData";
import { runSecureGlobalReadCli, type SecureGlobalReadResult } from "../providers/globalReadSecureCli";
import { GLOBAL_READ_METHOD_VERSION, parsePrior, parseProposal, PRIOR_SCHEMA, PROPOSAL_SCHEMA, priorPrompt, researchPrompt } from "./schema";
import { fetchGlobalReadCalendars } from "./calendar";
import { fetchPriceTest } from "./priceTest";
import { verifyWebCandidates } from "./safeFetch";
import { evaluateThesis } from "./thesis";
import { loadGlobalReadMethod, undefinedMethodFields, type GlobalReadMethod } from "./method";
import { isAdmitted } from "./evidence";

export interface GlobalReadPipelineDeps {
  runCli: typeof runSecureGlobalReadCli;
  verify: typeof verifyPrimaryFacts;
  calendars: typeof fetchGlobalReadCalendars;
  price: typeof fetchPriceTest;
  web: typeof verifyWebCandidates;
  method: GlobalReadMethod;
}
const defaults = (): GlobalReadPipelineDeps => ({ runCli: runSecureGlobalReadCli, verify: verifyPrimaryFacts, calendars: fetchGlobalReadCalendars, price: fetchPriceTest, web: verifyWebCandidates, method: loadGlobalReadMethod() });

export function globalReadSnapshotHash(families: readonly CanonicalFamilySnapshot[], method = loadGlobalReadMethod()): string {
  return hashObject({ methodVersion: GLOBAL_READ_METHOD_VERSION, method,
    families: families.map((f) => ({ familyId: f.familyId, kpis: f.kpis.map((k) => ({ id: k.id, value: k.value, dataState: k.dataState, observationAt: k.observationAt, source: k.sourceTag })),
      nextEvents: f.nextEvents, activeCatalyst: f.activeCatalyst, fedRateDistribution: f.fedRateDistribution })) });
}

function failedDecision(decision: GlobalReadDecision, code: string, detail: string): GlobalReadDecision {
  return { ...decision, blockers: [...decision.blockers, { code, detail, recoverable: false, resolver: null }],
    marginalDriver: "No validated causal conclusion available. Consult the audit; do not infer trade permission." };
}

export async function buildGlobalReadDecision(families: readonly CanonicalFamilySnapshot[], language: Language,
  provider: "claude-cli" | "codex-cli", overrides: Partial<GlobalReadPipelineDeps> = {}): Promise<GlobalReadDecision> {
  const deps = { ...defaults(), ...overrides };
  const started = performance.now();
  const startedAt = new Date().toISOString();
  const facts = canonicalFacts(families);
  // The current terminal active-catalyst timestamps are not independently verified.
  // Never retrospectively anchor a blind prior or a price test to those labels.
  const priorView = freezePriorView(facts, startedAt, false);
  let decision: GlobalReadDecision = {
    methodVersion: GLOBAL_READ_METHOD_VERSION, runId: randomUUID(), asOf: startedAt, snapshotHash: globalReadSnapshotHash(families, deps.method),
    readiness: "NO_OPPORTUNITY", thesis: "UNCLEAR", lifecycle: "FORMATION", decisionUse: "AS_OF_SNAPSHOT", expiresAt: null,
    marginalDriver: "Analysis pending", priced: "UNVERIFIED", remainingEdge: "Not established", positioning: "No independently verified positioning conclusion",
    trap: "NOT_ESTABLISHED", keyFacts: [], decisionCriticalRefs: [], validWhile: [], invalidations: [], flip: null, nextCatalysts: [], scenarios: [], blockers: [], warnings: [],
    audit: { prior: null, priorManifest: priorView.manifest, priorHash: null, proposal: null, evidence: [], web: [],
      priceTest: { state: "INCONCLUSIVE", reason: "No independently timestamped active catalyst selected.", reference: deps.method.referenceSymbol, from: null, to: null, change: null, sourceUrl: null },
      timingsMs: { snapshot: Math.round(performance.now() - started) }, cli: [], undefinedConfig: undefinedMethodFields(deps.method) },
  };
  const finish = () => ({ ...decision, asOf: new Date().toISOString(), audit: { ...decision.audit, timingsMs: { ...decision.audit.timingsMs, total: Math.round(performance.now() - started) } } });
  const addCli = (run: SecureGlobalReadResult) => {
    decision = { ...decision, audit: { ...decision.audit, cli: [...decision.audit.cli, { provider: run.provider, phase: run.phase, durationMs: run.durationMs, isolation: run.isolation, error: run.error }] } };
  };
  const first = await deps.runCli({ provider, phase: "PRIOR", prompt: priorPrompt(priorView, language), schema: PRIOR_SCHEMA });
  addCli(first);
  const prior = first.isolation === "CONTROLLED" ? parsePrior(first.output) : null;
  if (!prior) { decision = failedDecision(decision, "PRIOR_UNAVAILABLE", first.error ?? "Prior output failed validation."); return finish(); }
  const priorRefs = [...prior.decisionCriticalRefs, ...prior.hypotheses.flatMap((h) => h.supportRefs)];
  if (priorRefs.some((ref) => !priorView.manifest.includedRefs.includes(ref))) {
    decision = failedDecision(decision, "PRIOR_UNKNOWN_REF", "The prior referenced evidence not present in its frozen input."); return finish();
  }
  decision = { ...decision, audit: { ...decision.audit, prior, priorHash: hashObject(prior), timingsMs: { ...decision.audit.timingsMs, prior: first.durationMs } } };
  const verificationStarted = performance.now();
  const [admissions, calendar] = await Promise.all([deps.verify(facts, prior.decisionCriticalRefs), deps.calendars()]);
  const now = new Date().toISOString();
  const upcoming = calendar.events.filter((e) => e.scheduledAt >= now).slice(0, 12);
  decision = { ...decision, nextCatalysts: upcoming, warnings: [...calendar.warnings], audit: { ...decision.audit, evidence: admissions,
    timingsMs: { ...decision.audit.timingsMs, verificationAndCalendar: Math.round(performance.now() - verificationStarted) } } };
  const research = await deps.runCli({ provider, phase: "RESEARCH", schema: PROPOSAL_SCHEMA,
    prompt: researchPrompt({ prior, priorHash: decision.audit.priorHash, manifest: priorView.manifest,
      admissions, currentCandidates: facts.filter((f) => f.value !== null),
      fedPricingContext: families.find((f) => f.familyId === "F3")?.fedRateDistribution ?? null,
      fedPricingWarning: "Secondary display; not an independently verified implied distribution. Not admissible as decision-critical evidence.",
      upcomingCatalysts: upcoming, recentVerifiedCatalysts: calendar.events.filter((e) => e.scheduledAt <= now).slice(-8), methodUndefined: decision.audit.undefinedConfig, priceTest: decision.audit.priceTest,
      calendarWarnings: calendar.warnings }, language) });
  addCli(research);
  const proposal = research.isolation === "CONTROLLED" ? parseProposal(research.output) : null;
  if (!proposal) { decision = failedDecision(decision, "RESEARCH_UNAVAILABLE", research.error ?? "Research output failed validation."); return finish(); }
  decision = { ...decision, audit: { ...decision.audit, proposal, timingsMs: { ...decision.audit.timingsMs, research: research.durationMs } } };
  const finalVerifyStarted = performance.now();
  const extraRefs = proposal.decisionCriticalRefs.filter((ref) => !admissions.some((e) => e.ref === ref));
  const [extra, web] = await Promise.all([deps.verify(facts, extraRefs), deps.web(proposal.webCandidates)]);
  const evidence: GlobalReadAdmission[] = [...admissions, ...extra];
  // Only an explicit, verified calendar ref may anchor an event reaction test; never choose the last headline.
  const catalyst = calendar.events.find((e) => proposal.catalystRefs.includes(e.ref) && e.verified && e.scheduledAt <= now);
  const priceTest = await deps.price(catalyst?.scheduledAt ?? null, proposal.thesis, deps.method);
  const evaluated = evaluateThesis({ proposal, evidence, now: new Date().toISOString(), priceTest, catalysts: upcoming,
    eventGuardSeconds: deps.method.eventGuardSeconds, isolationControlled: true, calendarComplete: calendar.complete });
  const unresolvedCandidates = proposal.webCandidates.filter((w) => !web.some((v) => v.candidate.ref === w.ref && v.status === "QUOTE_MATCH"));
  const allUsedRefs = [...proposal.invalidations.flatMap((c) => [c.leftRef, c.rightRef]), ...proposal.scenarios.flatMap((s) => s.catalystRefs)];
  const known = new Set([...evidence.map((e) => e.ref), ...calendar.events.map((e) => e.ref)]);
  const unknown = allUsedRefs.filter((ref) => !known.has(ref));
  const expiryCandidates = [
    ...(deps.method.maxReportAgeSeconds !== null && deps.method.maxReportAgeSeconds > 0 ? [Date.now() + deps.method.maxReportAgeSeconds * 1000] : []),
    ...upcoming.filter((e) => e.verified).map((e) => Date.parse(e.scheduledAt) - (deps.method.eventGuardSeconds ?? 0) * 1000),
  ].filter((ms) => ms > Date.now());
  decision = { ...decision, ...evaluated, thesis: proposal.thesis, marginalDriver: proposal.marginalDriver, priced: proposal.priced,
    remainingEdge: proposal.remainingEdge, positioning: proposal.positioning, decisionCriticalRefs: proposal.decisionCriticalRefs,
    keyFacts: evidence.filter((e) => isAdmitted(e) && proposal.decisionCriticalRefs.includes(e.ref)).slice(0, 5),
    validWhile: proposal.validWhile, invalidations: proposal.invalidations, scenarios: proposal.scenarios,
    expiresAt: expiryCandidates.length ? new Date(Math.min(...expiryCandidates)).toISOString() : null,
    warnings: [...decision.warnings, "AI causal interpretation is not a verified fact or a calibrated trading edge.",
      "No retrospective price test is inferred from an unverified active-catalyst label. Current mode is prospective.",
      ...(unresolvedCandidates.length ? [`${unresolvedCandidates.length} web candidate(s) failed quote/source checks; not admitted.`] : []),
      ...(extra.some((e) => e.status === "CORRECTED") ? ["A critical value was corrected after research; that narrative must be reassessed."] : [])],
    audit: { ...decision.audit, evidence, web, priceTest, timingsMs: { ...decision.audit.timingsMs, finalVerification: Math.round(performance.now() - finalVerifyStarted) } } };
  if (unknown.length || extra.some((e) => e.status === "CORRECTED")) decision = { ...decision, readiness: "NO_OPPORTUNITY", blockers: [...decision.blockers,
    { code: "POST_RESEARCH_EVIDENCE", detail: unknown.length ? `Unknown lifecycle/scenario refs: ${unknown.join(", ")}` : "Critical evidence changed after narrative generation.", recoverable: false, resolver: null }] };
  const crossed = calendar.events.filter((e) => e.verified && e.scheduledAt > startedAt && e.scheduledAt <= new Date().toISOString());
  if (crossed.length) decision = { ...decision, readiness: "NO_OPPORTUNITY", blockers: [...decision.blockers,
    { code: "CATALYST_DURING_RUN", detail: "A scheduled release occurred while this analysis was running. The input snapshot is no longer sufficient.", recoverable: true, resolver: "Refresh the released data and run a new analysis." }] };
  return finish();
}
