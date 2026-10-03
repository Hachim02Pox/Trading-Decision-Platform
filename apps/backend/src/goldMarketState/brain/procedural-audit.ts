// @ts-nocheck
// Pinned Brain da8eb64959b6c026128bde254c8d1703e419f19c: unchanged semantics; only local import suffixes adapted.
// Procedural-audit guard for new REAL Sunday and intermediate market states, and
// for their run completion records.
//
// A procedural trace proves that mandatory steps were ATTEMPTED, in a possible
// order, with a recorded outcome or an explicit limitation. It never proves the
// analysis is right, and it never records private reasoning: only phase status,
// artifacts, question outcomes, references, consulted source categories,
// recovery attempts, limits and timestamps. No volume threshold exists anywhere
// in this file: presence and coherence are checked, never counts of sources,
// facts, nodes or words. Contract: specs/GOLD_RUN_PROCEDURAL_AUDIT_SPEC.md.
import { createHash } from "node:crypto";

// --- Vocabulary -------------------------------------------------------------

export const COLLECTION_PHASES = ["weekly_recap", "F1", "F2", "F3", "F4", "F5", "F6"];
export const PHASE_ORDER = [
  "initialization", ...COLLECTION_PHASES, "collection_coverage_audit", "reasoning",
  "asymmetry_gate", "scenario_tree", "presentation", "json_and_reports",
];
// Weekly Recap and F1-F6 may run concurrently (RUN_PROTOCOL section 4), so they
// depend only on initialization. Every later phase is strictly sequential.
export const PREREQUISITES = {
  initialization: [],
  ...Object.fromEntries(COLLECTION_PHASES.map((id) => [id, ["initialization"]])),
  collection_coverage_audit: COLLECTION_PHASES,
  reasoning: ["collection_coverage_audit"],
  asymmetry_gate: ["reasoning"],
  scenario_tree: ["asymmetry_gate"],
  presentation: ["reasoning", "asymmetry_gate", "scenario_tree"],
  json_and_reports: ["presentation"],
};
export const COMPLETION_PHASE_ORDER = ["market_state_validation", "drive_readback", "handoff_generation", "handoff_validation"];
export const COMPLETION_PREREQUISITES = {
  market_state_validation: [],
  drive_readback: ["market_state_validation"],
  handoff_generation: ["market_state_validation", "drive_readback"],
  handoff_validation: ["handoff_generation"],
};
const LABELS = {
  collection_coverage_audit: "collection coverage audit", asymmetry_gate: "asymmetry gate", scenario_tree: "scenario tree",
  json_and_reports: "JSON and reports", weekly_recap: "Weekly Recap", market_state_validation: "market-state validation",
  drive_readback: "Drive readback", handoff_generation: "handoff", handoff_validation: "handoff validation",
};
const label = (id) => LABELS[id] ?? id;

// Mandatory questions per collection module, mirrored from
// GOLD_SUNDAY_READ_COLLECTION_EVIDENCE_SPEC.md sections 5 and 8-13. The table in
// GOLD_RUN_PROCEDURAL_AUDIT_SPEC.md is checked against this constant by the tests.
export const REQUIRED_QUESTIONS = {
  weekly_recap: ["WR.DAILY_PRICE_FACTS", "WR.BENCHMARK_CONTRACT", "WR.EVENTS", "WR.CROSS_ASSET_MOVES", "WR.REPORTED_ATTRIBUTION"],
  F1: ["F1.FED_PRICING", "F1.US2Y", "F1.FED_COMMUNICATION", "F1.NEXT_FOMC"],
  F2: ["F2.DFII10", "F2.NOMINAL_REAL_BREAKEVEN", "F2.LEADING_MATURITY", "F2.CURVE_2S10S", "F2.MOVE", "F2.F1_OVERLAP"],
  F3: ["F3.DXY", "F3.GOLD_DXY_30D", "F3.USDJPY", "F3.USDCNH", "F3.USD_LIQUIDITY"],
  F4: ["F4.MACRO_RELEASES", "F4.OIL", "F4.TREASURY_AUCTIONS", "F4.CREDIT_HY_IG"],
  F5: ["F5.COT", "F5.OPEN_INTEREST", "F5.ETF_FLOWS", "F5.OPTIONS", "F5.Q1_FLOW", "F5.Q2_FORCED_ACTOR", "F5.Q3_FUNDING", "F5.Q4_FUSE", "F5.Q5_MARGINAL_FLOW"],
  F6: ["F6.CENTRAL_BANK_DEMAND", "F6.CHINA_PHYSICAL", "F6.DEDOLLARIZATION", "F6.DEBASEMENT_THEME"],
};
// Reasoning components (manual 17.4) and where their output lives in the document.
export const REASONING_COMPONENTS = {
  COMPETING_HYPOTHESES: "competing_hypotheses", DOMINANT_DRIVER: "dominant_driver", TRANSMISSION_CHAINS: "transmission_chains",
  CROSS_ASSET_REALITY_TEST: "cross_asset_reality_test", CONTRADICTIONS: "contradictions", ANOMALIES: "anomalies",
  PRICED_IN: "priced_in", CONTEXTS_BY_HORIZON: "contexts", INVALIDATIONS: "invalidations", UNKNOWNS: "unknowns",
};
// Continuous recap protocol section 8.
export const EXOGENOUS_CATEGORIES = [
  "GEOPOLITICAL_ESCALATION", "ENERGY_SUPPLY_DISRUPTION", "FUNDING_COLLATERAL_STRESS", "CREDIT_EVENT_PROPAGATION",
  "FISCAL_POLITICAL_ACTION", "CENTRAL_BANK_INTERVENTION", "MARKET_FUNCTION_DISRUPTION", "FORCED_LIQUIDATION_EVIDENCE",
  "REGULATORY_SANCTIONS_ACTION",
];
export const PUBLISHED_ROLES = ["MARKET_STATE_JSON", "HUMAN_REPORT", "VALIDATION_REPORT", "RUN_REPORT"];
const SOURCE_CONSULTATION_REASONS = ["PUBLICATION_LAG", "SOURCE_NOT_FOUND", "SOURCE_INACCESSIBLE", "SOURCES_CONFLICT"];
const RECOVERY_REASONS = ["SOURCE_NOT_FOUND", "SOURCE_INACCESSIBLE"];
const NOT_APPLICABLE_REASONS = ["NOT_MATERIAL_THIS_RUN", "NOT_DUE_THIS_CYCLE", "STRUCTURALLY_NON_OBSERVABLE"];
const UNTESTED_TRANSITIONS = ["NOT_TESTED", "EXPIRED"];
const STRUCTURAL_GAP_KINDS = { FAILED: "PHASE_FAILED", PARTIAL: "PHASE_PARTIAL" };

// --- Helpers ----------------------------------------------------------------

const nonEmpty = (value) => typeof value === "string" && value.trim().length > 0;
const isDateOnly = (value) => typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
const asTime = (value) => {
  if (typeof value !== "string" || !value) return null;
  const t = Date.parse(isDateOnly(value) ? `${value}T00:00:00Z` : value);
  return Number.isNaN(t) ? null : t;
};
// A date-only observation is "after" a cutoff only when its calendar day is
// strictly later: a bare date cannot prove it follows a same-day timestamp.
const isAfterCutoff = (value, cutoff) => {
  if (isDateOnly(value)) return typeof cutoff === "string" && value > cutoff.slice(0, 10);
  const t = asTime(value); const c = asTime(cutoff);
  return t !== null && c !== null && t > c;
};
const weekday = (date) => new Date(`${date}T00:00:00Z`).getUTCDay();
const addDays = (date, days) => new Date(Date.parse(`${date}T00:00:00Z`) + days * 86400000).toISOString().slice(0, 10);

export function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value && typeof value === "object") return `{${Object.keys(value).sort().map((k) => `${JSON.stringify(k)}:${canonicalJson(value[k])}`).join(",")}}`;
  return JSON.stringify(value);
}
export const canonicalSha256 = (value) => createHash("sha256").update(canonicalJson(value)).digest("hex");

const getPath = (doc, path) => path.split(".").reduce((node, key) => (node == null ? undefined : node[key]), doc);
const hasContent = (value) => (Array.isArray(value) ? value.length > 0 : value && typeof value === "object" ? Object.keys(value).length > 0 : nonEmpty(value));

// The only documents a market-state ingestion may select (continuous recap
// protocol section 3). A completion record or a handoff never satisfies it.
export const isFrontendEligibleMarketState = (doc) => doc?.document_type === "GOLD_MARKET_STATE" && doc?.frontend_eligible === true;
// Control-plane file names that can never be one of the four immutable Output files.
const CONTROL_PLANE_NAME = /RUN_COMPLETION_RECORD|NEXT_GOLD_RECAP/i;

export function requiresProceduralAudit(doc) {
  return doc.meta?.data_mode === "REAL" && ["SUNDAY", "INTERMEDIATE"].includes(doc.meta?.run_type);
}

// --- Phase records and chronology -------------------------------------------

function phaseShapeProblems(id, phase, allowNotApplicable) {
  const problems = [];
  const name = label(id);
  if (phase.status === "NOT_APPLICABLE") {
    if (!allowNotApplicable) problems.push(`${name} cannot be NOT_APPLICABLE`);
    else if (!nonEmpty(phase.not_applicable_reason)) problems.push(`${name} is NOT_APPLICABLE without a reason`);
    return problems;
  }
  if (["COMPLETE", "PARTIAL", "FAILED"].includes(phase.status)) {
    const start = asTime(phase.started_at); const end = asTime(phase.completed_at);
    if (start === null || end === null) problems.push(`${name} is ${phase.status} without valid started_at and completed_at`);
    else if (start > end) problems.push(`${name} started_at is later than completed_at`);
  }
  if (["COMPLETE", "PARTIAL"].includes(phase.status) && !nonEmpty(phase.artifact)) problems.push(`${name} is ${phase.status} without a recorded artifact`);
  if (phase.status === "PARTIAL" && !phase.limitations?.length) problems.push(`${name} is PARTIAL without an explicit limitation`);
  if (phase.status === "FAILED" && !nonEmpty(phase.blocking_issue)) problems.push(`${name} is FAILED without a blocking issue`);
  return problems;
}

function orderingProblems(phases, prerequisites, order) {
  const problems = [];
  for (const id of order) {
    const phase = phases[id];
    if (!phase || !["COMPLETE", "PARTIAL"].includes(phase.status)) continue;
    const verb = phase.status === "COMPLETE" ? "completed" : "marked PARTIAL";
    for (const prereqId of prerequisites[id]) {
      const prereq = phases[prereqId];
      if (!prereq || prereq.status === "NOT_APPLICABLE") continue;
      if (["NOT_STARTED", "IN_PROGRESS"].includes(prereq.status)) {
        problems.push(`${label(id)} ${verb} before ${label(prereqId)} (${prereqId} is ${prereq.status})`);
        continue;
      }
      if (prereq.status === "FAILED") {
        if (phase.status === "COMPLETE") problems.push(`${label(id)} completed while prerequisite ${label(prereqId)} is FAILED`);
        else if (!phase.limitations?.length) problems.push(`${label(id)} is PARTIAL after failed ${label(prereqId)} without a recorded limitation`);
      }
      const start = asTime(phase.started_at); const end = asTime(phase.completed_at); const prereqEnd = asTime(prereq.completed_at);
      if (prereqEnd === null) continue;
      if (end !== null && end < prereqEnd) problems.push(`${label(id)} ${verb} before ${label(prereqId)} (completed_at ${phase.completed_at} precedes ${prereq.completed_at})`);
      else if (start !== null && start < prereqEnd) problems.push(`${label(id)} started before ${label(prereqId)} completed (started_at ${phase.started_at} precedes ${prereq.completed_at})`);
    }
  }
  return problems;
}

// --- Collection traces ------------------------------------------------------

function questionProblems(q, family, phaseStatus, ctx) {
  const problems = [];
  const id = q.question_id;
  const tag = `${label(family)} marked ${phaseStatus}`;
  const evidenceRefs = q.evidence_refs ?? [];
  for (const ref of evidenceRefs) if (!ctx.evidenceIds.has(ref)) problems.push(`question ${id}: evidence_ref ${ref} does not resolve in evidence[]`);
  for (const ref of q.source_refs ?? []) if (!ctx.sourceIds.has(ref)) problems.push(`question ${id}: source_ref ${ref} does not resolve in sources[]`);
  const consulted = Boolean((q.source_refs ?? []).length || (q.source_categories ?? []).length);

  if (q.outcome === "ANSWERED") {
    if (!evidenceRefs.length) problems.push(`${tag} without evidence or explicit limitation: question ${id} is ANSWERED but cites no evidence`);
    if (!nonEmpty(q.as_of) && !nonEmpty(q.measurement_window)) problems.push(`question ${id} is ANSWERED without as_of or measurement_window`);
    if (!consulted) problems.push(`question ${id} is ANSWERED without sources or source categories consulted`);
    return problems;
  }

  const limitation = q.limitation;
  if (!limitation || !nonEmpty(limitation.reason) || !nonEmpty(limitation.explanation)) {
    problems.push(`${tag} without evidence or explicit limitation: question ${id} is ${q.outcome} with no explicit limitation`);
    return problems;
  }
  const reason = limitation.reason;
  if (q.outcome === "PUBLICATION_LAG" && reason !== "PUBLICATION_LAG") problems.push(`question ${id}: outcome PUBLICATION_LAG requires limitation reason PUBLICATION_LAG, got ${reason}`);
  if (reason === "PUBLICATION_LAG") {
    if (!["PUBLICATION_LAG", "PARTIAL"].includes(q.outcome)) problems.push(`question ${id}: limitation reason PUBLICATION_LAG requires outcome PUBLICATION_LAG or PARTIAL, got ${q.outcome}`);
    if (!nonEmpty(q.publication_limit)) problems.push(`question ${id}: publication lag is recorded without a publication_limit`);
  }
  if (q.outcome === "NOT_APPLICABLE" && !NOT_APPLICABLE_REASONS.includes(reason)) problems.push(`question ${id}: NOT_APPLICABLE requires a not-applicable or structural limitation reason, got ${reason}`);
  if (["NOT_MATERIAL_THIS_RUN", "NOT_DUE_THIS_CYCLE"].includes(reason) && q.outcome !== "NOT_APPLICABLE") problems.push(`question ${id}: limitation reason ${reason} requires outcome NOT_APPLICABLE, got ${q.outcome}`);
  if (SOURCE_CONSULTATION_REASONS.includes(reason) && !consulted) {
    problems.push(`question ${id} is ${q.outcome} (${reason}) but records no source or source category consulted; an unattempted question must be recorded as unresolved, not as ${q.outcome}`);
  }
  if (RECOVERY_REASONS.includes(reason)) {
    const recovery = q.source_recovery;
    const recorded = recovery && recovery.registry_consulted === true && ((recovery.attempts ?? []).length > 0 || nonEmpty(recovery.not_applicable_reason));
    if (!recorded) problems.push(`source recovery required but not recorded (question ${id}, ${reason}): record the registry consultation and attempts, or why recovery is not applicable`);
  }
  return problems;
}

function collectionProblems(audit, doc, ctx) {
  const problems = [];
  const families = audit.run_kind === "SUNDAY" ? COLLECTION_PHASES : COLLECTION_PHASES.slice(1);
  const gaps = audit.procedural_gaps ?? [];
  const covered = (kind, phase, questionId) => gaps.some((gap) => gap.kind === kind && gap.phase === phase && (questionId === undefined || gap.question_id === questionId));
  const unresolved = [];

  for (const family of families) {
    const phase = audit.phases?.[family];
    if (!phase) continue; // reported once as "<phase> missing from procedural audit"
    const trace = audit.collection?.[family];
    const status = phase.status;
    if (["COMPLETE", "PARTIAL"].includes(status) && !trace) {
      problems.push(`${label(family)} is ${status} but has no collection trace`);
      continue;
    }
    if (!trace) continue;
    const seen = new Set();
    for (const q of trace.questions ?? []) {
      const prefix = family === "weekly_recap" ? "WR." : `${family}.`;
      if (!String(q.question_id).startsWith(prefix)) problems.push(`question ${q.question_id} does not belong to ${label(family)} (expected prefix ${prefix})`);
      if (seen.has(q.question_id)) problems.push(`question ${q.question_id} is recorded twice in ${label(family)}`);
      seen.add(q.question_id);
      if (["COMPLETE", "PARTIAL"].includes(status)) problems.push(...questionProblems(q, family, status, ctx));
    }
    if (audit.run_kind === "SUNDAY") {
      for (const id of REQUIRED_QUESTIONS[family]) {
        if (seen.has(id)) continue;
        unresolved.push({ phase: family, question_id: id });
        if (status === "COMPLETE") problems.push(`${label(family)} marked COMPLETE without evidence or explicit limitation: required question ${id} has no recorded outcome`);
        else if (status === "PARTIAL" && !covered("UNRESOLVED_REQUIRED_QUESTION", family, id)) problems.push(`material procedural gap not declared: required question ${id} is unresolved in ${label(family)} but no UNRESOLVED_REQUIRED_QUESTION gap covers it`);
      }
    } else if (["COMPLETE", "PARTIAL"].includes(status) && !(trace.questions ?? []).length) {
      problems.push(`${label(family)} marked ${status} without any traced question`);
    }
  }
  return { problems, unresolved };
}

function coverageAuditProblems(audit, unresolved) {
  const problems = [];
  const report = audit.collection_coverage_audit;
  if (!report) return ["collection coverage audit content missing from procedural audit"];
  const families = audit.run_kind === "SUNDAY" ? COLLECTION_PHASES : COLLECTION_PHASES.slice(1);
  const reviewed = new Set(report.families_reviewed ?? []);
  for (const family of families) if (!reviewed.has(family)) problems.push(`collection coverage audit did not review ${label(family)}`);
  const key = (x) => `${x.phase}:${x.question_id}`;
  const declared = new Set((report.unresolved_required_questions ?? []).map(key));
  const actual = new Set(unresolved.map(key));
  for (const item of actual) if (!declared.has(item)) problems.push(`collection coverage audit omits unresolved required question ${item}`);
  for (const item of declared) if (!actual.has(item)) problems.push(`collection coverage audit reports ${item} as unresolved but the trace answers it`);
  const expectedOutcome = actual.size === 0 ? "ALL_REQUIRED_QUESTIONS_ADDRESSED" : "GAPS_RECORDED";
  if (report.outcome !== expectedOutcome) problems.push(`collection coverage audit outcome ${report.outcome} contradicts the trace (expected ${expectedOutcome})`);
  return problems;
}

function reasoningProblems(audit, doc) {
  const problems = [];
  const seen = new Map();
  for (const c of audit.reasoning_components ?? []) {
    if (seen.has(c.component)) problems.push(`reasoning component ${c.component} is recorded twice`);
    seen.set(c.component, c);
  }
  for (const [component, path] of Object.entries(REASONING_COMPONENTS)) {
    const record = seen.get(component);
    if (!record) { problems.push(`reasoning component ${component} missing from procedural audit`); continue; }
    if (record.disposition === "PRODUCED") {
      if (record.output_path !== path || !hasContent(getPath(doc, path))) problems.push(`reasoning component ${component} is PRODUCED but ${path} is empty or absent`);
    } else if (!nonEmpty(record.reason)) {
      problems.push(`reasoning component ${component} is ${record.disposition} without a reason`);
    }
  }
  return problems;
}

function gapProblems(audit, doc, unresolved) {
  const problems = [];
  const surfaced = new Set([...(doc.unknowns ?? []), ...(doc.analysis_contract?.explicit_unknowns ?? [])]);
  const ids = new Set();
  for (const gap of audit.procedural_gaps ?? []) {
    if (ids.has(gap.gap_id)) problems.push(`procedural gap ${gap.gap_id} is recorded twice`);
    ids.add(gap.gap_id);
    if (!PHASE_ORDER.includes(gap.phase) && !COMPLETION_PHASE_ORDER.includes(gap.phase)) problems.push(`procedural gap ${gap.gap_id} names unknown phase ${gap.phase}`);
    if (["PHASE_FAILED", "PHASE_PARTIAL", "UNRESOLVED_REQUIRED_QUESTION"].includes(gap.kind) && gap.material !== true) problems.push(`procedural gap ${gap.gap_id} (${gap.kind}) is structural and must be material`);
    if (gap.material && !(nonEmpty(gap.surface_text) && surfaced.has(gap.surface_text))) problems.push(`material procedural gap not surfaced: ${gap.gap_id} must appear verbatim in unknowns[] or analysis_contract.explicit_unknowns[]`);
  }
  const covered = (kind, phase) => (audit.procedural_gaps ?? []).some((gap) => gap.kind === kind && gap.phase === phase);
  for (const id of PHASE_ORDER) {
    const status = audit.phases?.[id]?.status;
    const kind = STRUCTURAL_GAP_KINDS[status];
    if (kind && !covered(kind, id)) problems.push(`material procedural gap not declared: ${label(id)} is ${status} but no ${kind} gap covers it`);
  }
  if (doc.meta?.status === "COMPLETE") {
    for (const gap of audit.procedural_gaps ?? []) if (gap.material) problems.push(`meta.status is COMPLETE but material procedural gap ${gap.gap_id} is recorded`);
    for (const item of unresolved) problems.push(`meta.status is COMPLETE but required question ${item.question_id} is unresolved`);
  }
  return problems;
}

function stageArtifactProblems(audit, doc) {
  const problems = [];
  const done = (id) => ["COMPLETE"].includes(audit.phases?.[id]?.status);
  if (done("asymmetry_gate") && !(doc.direction_state && doc.asymmetry)) problems.push("asymmetry gate marked COMPLETE but direction_state or asymmetry is absent");
  if (done("scenario_tree") && !Array.isArray(doc.scenario_tree?.nodes)) problems.push("scenario tree marked COMPLETE but scenario_tree.nodes is absent");
  if (done("presentation") && !([3, 4].includes(doc.presentation?.version) && doc.presentation.fr && doc.presentation.en)) problems.push("presentation marked COMPLETE but the FR/EN localized presentation is absent");
  return problems;
}

// --- Run-kind proofs --------------------------------------------------------

function sundayProblems(audit, doc) {
  const s = audit.sunday;
  if (!s) return ["Sunday procedural proof (sunday block) missing from procedural audit"];
  const problems = [];
  const { completed_week: week, benchmark, cutoff } = s;
  const partial = s.partial_week_exception;
  if (!week || !benchmark || !cutoff) return ["Sunday proof requires completed_week, benchmark and cutoff"];
  const startOk = isDateOnly(week.reviewed_week_start) && weekday(week.reviewed_week_start) === 1;
  const endOk = isDateOnly(week.reviewed_week_end) && weekday(week.reviewed_week_end) === (partial ? 4 : 5);
  if (!startOk) problems.push(`Sunday reviewed_week_start ${week.reviewed_week_start} is not a Monday date`);
  if (!endOk) problems.push(partial ? `Sunday reviewed_week_end ${week.reviewed_week_end} is not the declared Thursday` : `Sunday reviewed_week_end ${week.reviewed_week_end} is not a Friday date`);
  if (startOk && endOk && addDays(week.reviewed_week_start, partial ? 3 : 4) !== week.reviewed_week_end) problems.push("Sunday reviewed week dates are not consecutive Monday through documented end");
  if (partial) {
    if (partial.friday_date !== "2026-09-25") problems.push("exceptional partial Sunday is authorized only for 25 September 2026");
    if (week.analysis_of_completed_week_finished !== false) problems.push("partial week must explicitly say the full week is unfinished");
    if (partial.reviewed_through !== week.reviewed_week_end || partial.friday_date !== addDays(week.reviewed_week_end, 1)) problems.push("partial week proof dates disagree");
    const at = asTime(partial.friday_observation_cutoff);
    if (at === null || at !== asTime(cutoff.evidence_cutoff_end) || at < asTime(`${partial.friday_date}T04:00:00Z`) || at >= asTime(`${addDays(partial.friday_date, 1)}T00:00:00Z`)) problems.push("partial Friday cutoff must be inside Friday before market week ends and match evidence cutoff");
    if (!nonEmpty(partial.reason) || !nonEmpty(partial.previous_validated_run_id)) problems.push("partial week needs reason and prior validated run ID");
    if (doc.meta?.generated_at && asTime(doc.meta.generated_at) < at) problems.push("partial run generated before its evidence cutoff");
  } else if (week.analysis_of_completed_week_finished !== true) problems.push("Sunday run must record the completed week's analysis as finished");
  if (cutoff.sunday_night_trading_excluded !== true) problems.push("Sunday-night trading must be explicitly excluded from a Sunday run");
  if (cutoff.evidence_cutoff_end !== doc.meta?.evidence_cutoff_end) problems.push(`Sunday cutoff ${cutoff.evidence_cutoff_end} does not equal meta.evidence_cutoff_end ${doc.meta?.evidence_cutoff_end}`);
  if (endOk && !partial) {
    const cutoffTime = asTime(cutoff.evidence_cutoff_end);
    const weekClose = asTime(addDays(week.reviewed_week_end, 1));
    const sundayReopen = asTime(`${addDays(week.reviewed_week_end, 2)}T22:00:00Z`);
    const correction = s.corrective_rebuild;
    if (cutoffTime === null || cutoffTime < weekClose) problems.push(`Sunday cutoff ${cutoff.evidence_cutoff_end} is not after the completed week end ${week.reviewed_week_end}`);
    // A run may execute on Monday: its post-Friday facts are current setup
    // for the report week, not a corrective replacement of the prior week.
    else if (cutoffTime > sundayReopen && !doc.time_scope) {
      if (!correction) problems.push(`Sunday cutoff ${cutoff.evidence_cutoff_end} includes Sunday-night trading (Globex reopens ${new Date(sundayReopen).toISOString()}); corrective rebuild proof required`);
      else {
        const marketCutoff = asTime(correction.weekly_market_cutoff);
        const contextStart = asTime(correction.post_week_context_start);
        if (correction.target_sunday !== addDays(week.reviewed_week_end, 2)) problems.push("corrective rebuild target Sunday differs from the completed week's Sunday");
        const monday = addDays(week.reviewed_week_end, 3);
        if (String(doc.meta?.generated_at ?? "").slice(0, 10) !== monday) problems.push("corrective rebuild must be generated on the immediately following Monday");
        if (!nonEmpty(correction.superseded_run_id) || correction.superseded_run_id === doc.meta?.run_id) problems.push("corrective rebuild requires a different superseded run ID");
        if (!nonEmpty(correction.reason)) problems.push("corrective rebuild reason is missing");
        if (marketCutoff === null || marketCutoff < asTime(`${week.reviewed_week_end}T00:00:00Z`) || marketCutoff >= sundayReopen) problems.push("corrective rebuild weekly market cutoff must fall after Friday starts and before Sunday reopen");
        if (contextStart === null || contextStart < sundayReopen || contextStart > cutoffTime) problems.push("corrective rebuild post-week context starts before Sunday reopen or after evidence cutoff");
        if (Array.isArray(doc.weekly_timeline)) for (const entry of doc.weekly_timeline) {
          if (isDateOnly(entry.date) && entry.date > week.reviewed_week_end) problems.push(`corrective rebuild weekly timeline contains post-Friday entry ${entry.date}`);
        }
        if (!Array.isArray(correction.post_week_evidence_refs) || correction.post_week_evidence_refs.length === 0) problems.push("corrective rebuild requires dated post-week evidence references");
        else {
          const evidenceById = new Map((doc.evidence ?? []).map((e) => [e.id, e]));
          for (const id of correction.post_week_evidence_refs) {
            const item = evidenceById.get(id);
            if (!item) { problems.push(`corrective rebuild post-week evidence ${id} is missing`); continue; }
            const asOf = asTime(item.as_of);
            if (asOf === null || asOf < contextStart || asOf > cutoffTime) problems.push(`corrective rebuild evidence ${id} has an invalid post-week as_of date`);
            if (!item.source_refs?.length) problems.push(`corrective rebuild evidence ${id} lacks a source`);
          }
        }
      }
    } else if (correction) problems.push("corrective rebuild proof supplied without a post-Sunday evidence cutoff");
  }
  if (startOk && String(doc.meta?.evidence_cutoff_start ?? "").slice(0, 10) !== week.reviewed_week_start) problems.push(`meta.evidence_cutoff_start ${doc.meta?.evidence_cutoff_start} does not begin on the reviewed week start ${week.reviewed_week_start}`);
  const scope = doc.presentation?.scope;
  if (scope && (scope.reviewed_week_start !== week.reviewed_week_start || scope.reviewed_week_end !== week.reviewed_week_end)) problems.push("presentation.scope reviewed week contradicts the Sunday procedural proof");
  if (!nonEmpty(benchmark.instrument) || !nonEmpty(benchmark.contract)) problems.push("Sunday benchmark must identify its instrument and contract");
  if (benchmark.roll_in_window === true && !nonEmpty(benchmark.roll_disclosure)) problems.push("Sunday benchmark contract roll inside the window is not disclosed");
  return problems;
}

function intermediateProblems(audit, doc, ctx) {
  const i = audit.intermediate;
  if (!i) return ["Intermediate procedural proof (intermediate block) missing from procedural audit"];
  const problems = [];
  const meta = doc.meta ?? {};
  const phases = audit.phases ?? {};
  const intake = i.intake;

  if (!intake) problems.push("intermediate intake (latest validated state, lineage, handoff, idempotence) not recorded");
  else {
    const candidates = intake.state_candidates ?? [];
    const selected = candidates.find((c) => c.run_id === intake.selected_parent_run_id);
    if (intake.selected_parent_run_id !== meta.parent_run_id) problems.push(`intermediate parent ${meta.parent_run_id} is not the selected latest validated state ${intake.selected_parent_run_id}`);
    if (!selected || selected.validated !== true) problems.push(`selected parent ${intake.selected_parent_run_id} is not a validated candidate`);
    else {
      const newer = candidates.find((c) => c.validated === true && asTime(c.evidence_cutoff_end) > asTime(selected.evidence_cutoff_end));
      if (newer) problems.push(`a newer validated state ${newer.run_id} exists than the selected parent ${selected.run_id}`);
      if (selected.evidence_cutoff_end !== meta.evidence_cutoff_start) problems.push(`meta.evidence_cutoff_start ${meta.evidence_cutoff_start} does not equal the parent cutoff ${selected.evidence_cutoff_end}`);
    }
    const chain = intake.lineage_chain ?? [];
    if (chain[0] !== meta.parent_run_id) problems.push(`lineage chain must start at the parent ${meta.parent_run_id}`);
    if (chain[chain.length - 1] !== meta.origin_sunday_run_id) problems.push(`lineage chain does not reach the origin Sunday run ${meta.origin_sunday_run_id}`);
    if (new Set(chain).size !== chain.length || chain.includes(meta.run_id)) problems.push("lineage chain contains a cycle or the run itself");

    const h = intake.consumed_handoff;
    if (!h) problems.push("consumed handoff not recorded in the intermediate intake");
    else {
      if (h.handoff_id !== doc.consumed_handoff_id) problems.push(`intake handoff ${h.handoff_id} does not match consumed_handoff_id ${doc.consumed_handoff_id}`);
      if (h.handoff_version !== doc.handoff_version) problems.push(`intake handoff version ${h.handoff_version} does not match handoff_version ${doc.handoff_version}`);
      if (h.content_sha256 !== doc.handoff_content_hash) problems.push("intake handoff hash does not match handoff_content_hash");
      if (h.created_by_run_id !== meta.parent_run_id) problems.push(`consumed handoff was created by ${h.created_by_run_id}, not by the parent state ${meta.parent_run_id}`);
      const read = asTime(h.read_at); const validated = asTime(h.validated_at);
      if (read === null || validated === null || read > validated) problems.push("handoff must be read before it is validated (read_at/validated_at)");
      const firstCollectionStart = Math.min(...COLLECTION_PHASES.map((id) => asTime(phases[id]?.started_at)).filter((t) => t !== null));
      if (validated !== null && Number.isFinite(firstCollectionStart) && validated > firstCollectionStart) problems.push("handoff was read and validated after collection began");
      const initEnd = asTime(phases.initialization?.completed_at);
      if (validated !== null && initEnd !== null && validated > initEnd) problems.push("handoff validation is not inside the initialization phase");
    }
    const idem = intake.idempotence;
    if (!idem) problems.push("idempotence check not recorded in the intermediate intake");
    else {
      const prior = idem.prior_consumers ?? [];
      if (idem.outcome === "FIRST_CONSUMPTION" && prior.length) problems.push(`idempotence violated: handoff version already consumed by ${prior.join(", ")}`);
      if (idem.outcome === "RESUME_OF_SAME_RUN" && !(prior.length === 1 && prior[0] === meta.run_id)) problems.push("idempotence violated: handoff version was consumed by a run other than this one");
    }
  }

  // New information: every evidence item is either new or an identified baseline.
  const roles = new Map((i.evidence_roles ?? []).map((r) => [r.evidence_ref, r]));
  const cutoff = meta.evidence_cutoff_start;
  const sourceById = new Map((doc.sources ?? []).map((s) => [s.source_id, s]));
  for (const evidence of doc.evidence ?? []) {
    const role = roles.get(evidence.id);
    if (!role) { problems.push(`evidence ${evidence.id} has no new-versus-baseline classification`); continue; }
    if (role.role === "BASELINE") {
      if (!nonEmpty(role.baseline_label)) problems.push(`evidence ${evidence.id} is a BASELINE without a baseline label`);
      continue;
    }
    if (!isAfterCutoff(evidence.as_of, cutoff)) {
      problems.push(`intermediate evidence predates parent cutoff without baseline label: ${evidence.id} (as_of ${evidence.as_of}) is labelled ${role.role} but is not after ${cutoff}`);
      continue;
    }
    if (role.role === "NEW_POST_CUTOFF") {
      for (const ref of evidence.source_refs ?? []) {
        const published = sourceById.get(ref)?.published_at;
        if (published && !isAfterCutoff(published, cutoff)) problems.push(`intermediate evidence predates parent cutoff without baseline label: ${evidence.id} cites source ${ref} published ${published}`);
      }
    }
  }
  for (const ref of roles.keys()) if (!(doc.evidence ?? []).some((e) => e.id === ref)) problems.push(`evidence_roles names unknown evidence ${ref}`);
  const isNew = (ref) => roles.get(ref) && roles.get(ref).role !== "BASELINE";

  // Prior-week history stays inherited, or corrections are recorded with evidence.
  const history = i.weekly_history;
  if (!history) problems.push("prior-week history preservation not recorded");
  else {
    if (history.inherited_from_run_id !== meta.parent_run_id) problems.push(`weekly history is inherited from ${history.inherited_from_run_id}, not from the parent ${meta.parent_run_id}`);
    if (history.treatment === "INHERITED_UNCHANGED" && history.inherited_weekly_timeline_sha256 !== canonicalSha256(doc.weekly_timeline ?? [])) problems.push("prior-week history was altered without a recorded correction");
    if (history.treatment === "INHERITED_WITH_VERIFIED_CORRECTION") {
      if (!(history.corrections ?? []).length) problems.push("weekly history correction is declared without any recorded correction");
      for (const c of history.corrections ?? []) {
        if (!nonEmpty(c.reason) || !(c.evidence_refs ?? []).some((r) => ctx.evidenceIds.has(r))) problems.push("a weekly history correction needs a reason and resolvable evidence");
      }
    }
  }

  // Inherited scenarios are tested (or explicitly not tested) and transitions recorded.
  const transitions = new Map((doc.scenario_transitions ?? []).map((t) => [t.scenario_ref, t]));
  const inherited = new Map((i.inherited_scenarios ?? []).map((s) => [s.scenario_ref, s]));
  for (const ref of intake?.consumed_handoff?.scenario_refs ?? []) if (!inherited.has(ref)) problems.push(`inherited scenario ${ref} was not tested or explicitly deferred`);
  for (const [ref, entry] of inherited) {
    const t = transitions.get(ref);
    if (!t) { problems.push(`inherited scenario ${ref} has no recorded scenario transition`); continue; }
    if (t.transition_state === "NOT_TESTED") {
      if (entry.tested !== false || !nonEmpty(entry.not_tested_reason)) problems.push(`scenario ${ref} is NOT_TESTED without a recorded reason`);
    } else if (entry.tested !== true) problems.push(`scenario ${ref} has transition ${t.transition_state} but is recorded as not tested`);
  }
  for (const t of doc.scenario_transitions ?? []) {
    if (UNTESTED_TRANSITIONS.includes(t.transition_state)) continue;
    if (!(t.evidence_refs ?? []).some(isNew)) problems.push(`scenario transition ${t.scenario_ref} (${t.transition_state}) rests only on baseline evidence; a pre-cutoff observation cannot be new confirmation`);
  }

  // Exogenous scan: every category is scanned, a material factor records its structural decision.
  const scan = i.exogenous_scan;
  if (!scan || scan.performed !== true) problems.push("intermediate exogenous-factor scan not recorded");
  else {
    const seen = new Map((scan.categories ?? []).map((c) => [c.category, c]));
    for (const category of EXOGENOUS_CATEGORIES) if (!seen.has(category)) problems.push(`exogenous scan omits category ${category}`);
    let material = false;
    for (const [category, c] of seen) {
      if (c.outcome === "MATERIAL_FACTOR_FOUND") {
        material = true;
        if (!(c.evidence_refs ?? []).some((r) => ctx.evidenceIds.has(r))) problems.push(`exogenous category ${category} is MATERIAL_FACTOR_FOUND without resolvable evidence`);
      } else if (["UNKNOWN", "NOT_APPLICABLE"].includes(c.outcome) && !nonEmpty(c.limitation)) problems.push(`exogenous category ${category} is ${c.outcome} without an explicit limitation`);
    }
    const decision = scan.scenario_structure_decision;
    if (!decision) problems.push("exogenous scan records no scenario-structure decision");
    else if ((material || decision.decision !== "KEPT") && !nonEmpty(decision.reason)) problems.push("a material exogenous factor or a changed scenario structure requires a recorded reason");
    const done = asTime(scan.completed_at); const reasoningStart = asTime(phases.reasoning?.started_at); const initEnd = asTime(phases.initialization?.completed_at);
    if (done === null) problems.push("exogenous scan has no valid completed_at");
    else {
      if (reasoningStart !== null && done > reasoningStart) problems.push("exogenous scan completed after reasoning started");
      if (initEnd !== null && done < initEnd) problems.push("exogenous scan completed before initialization finished");
    }
  }

  // Targeted F1-F6 audit (continuous recap protocol section 7).
  const familyAudit = doc.family_audit ?? {};
  for (const family of COLLECTION_PHASES.slice(1)) {
    const entry = familyAudit[family];
    if (!entry) { problems.push(`${family} missing from family_audit (intermediate F1-F6 audit is mandatory)`); continue; }
    if (entry.status === "UNCHANGED" && entry.checked_against_new_evidence !== true) problems.push(`family ${family} is UNCHANGED without being checked against the new evidence window`);
    const questions = audit.collection?.[family]?.questions ?? [];
    if (entry.status === "UPDATED" && !questions.some((q) => q.outcome === "ANSWERED")) problems.push(`family ${family} is UPDATED but no traced question is ANSWERED`);
    if (entry.status === "NOT_DUE" && questions.some((q) => q.outcome !== "NOT_APPLICABLE")) problems.push(`family ${family} is NOT_DUE but a traced question is not NOT_APPLICABLE`);
  }
  if (phases.weekly_recap && phases.weekly_recap.status !== "NOT_APPLICABLE") problems.push("an intermediate run must not rerun the Weekly Recap (weekly_recap must be NOT_APPLICABLE)");
  return problems;
}

// --- Public entry points ----------------------------------------------------

export function proceduralAuditProblems(doc) {
  const audit = doc.procedural_audit;
  if (!audit) return requiresProceduralAudit(doc) ? [`procedural_audit missing: a new REAL ${doc.meta.run_type} run cannot claim completion without a procedural audit`] : [];
  const problems = [];
  const runType = doc.meta?.run_type;
  if (audit.run_kind !== runType) problems.push(`procedural_audit.run_kind ${audit.run_kind} contradicts meta.run_type ${runType}`);
  const ctx = { evidenceIds: new Set((doc.evidence ?? []).map((e) => e.id)), sourceIds: new Set((doc.sources ?? []).map((s) => s.source_id)) };

  const phases = audit.phases ?? {};
  for (const id of PHASE_ORDER) {
    const phase = phases[id];
    if (!phase) { problems.push(`${id} missing from procedural audit`); continue; }
    const allowNotApplicable = id === "weekly_recap" && audit.run_kind === "INTERMEDIATE";
    problems.push(...phaseShapeProblems(id, phase, allowNotApplicable));
    if (["NOT_STARTED", "IN_PROGRESS"].includes(phase.status)) problems.push(`${label(id)} is ${phase.status}; a published run cannot leave a phase unfinished`);
    if (doc.meta?.status === "COMPLETE" && !["COMPLETE", "NOT_APPLICABLE"].includes(phase.status)) problems.push(`meta.status is COMPLETE but ${label(id)} is ${phase.status}`);
  }
  problems.push(...orderingProblems(phases, PREREQUISITES, PHASE_ORDER));

  const { problems: collection, unresolved } = collectionProblems(audit, doc, ctx);
  problems.push(...collection, ...coverageAuditProblems(audit, unresolved), ...reasoningProblems(audit, doc), ...gapProblems(audit, doc, unresolved), ...stageArtifactProblems(audit, doc));
  if (audit.run_kind === "SUNDAY") problems.push(...sundayProblems(audit, doc));
  if (audit.run_kind === "INTERMEDIATE") problems.push(...intermediateProblems(audit, doc, ctx));
  return [...new Set(problems)];
}

// A child state must agree with its parent state when both are available.
export function parentConsistencyProblems(child, parent) {
  if (!child.meta?.run_type || !parent?.meta) return [];
  const problems = [];
  if (child.meta.run_type === "INTERMEDIATE") {
    if (parent.meta.origin_sunday_run_id !== child.meta.origin_sunday_run_id) problems.push(`child origin ${child.meta.origin_sunday_run_id} differs from parent origin ${parent.meta.origin_sunday_run_id}`);
    if (parent.meta.evidence_cutoff_end !== child.meta.evidence_cutoff_start) problems.push(`child evidence_cutoff_start ${child.meta.evidence_cutoff_start} differs from parent evidence_cutoff_end ${parent.meta.evidence_cutoff_end}`);
    const history = child.procedural_audit?.intermediate?.weekly_history;
    if (history && history.inherited_weekly_timeline_sha256 !== canonicalSha256(parent.weekly_timeline ?? [])) problems.push("inherited weekly history hash does not match the parent's weekly_timeline");
  }
  return problems;
}

export function completionRecordProblems(record, state) {
  const problems = [];
  const phases = record.phases ?? {};
  for (const id of COMPLETION_PHASE_ORDER) {
    const phase = phases[id];
    if (!phase) { problems.push(`${id} missing from completion record`); continue; }
    problems.push(...phaseShapeProblems(id, phase, false));
  }
  problems.push(...orderingProblems(phases, COMPLETION_PREREQUISITES, COMPLETION_PHASE_ORDER));

  const files = record.market_state?.published_files ?? [];
  for (const role of PUBLISHED_ROLES) {
    const matches = files.filter((f) => f.role === role);
    if (matches.length !== 1) problems.push(`published file role ${role} must be recorded exactly once (found ${matches.length})`);
  }
  const jsonFile = files.find((f) => f.role === "MARKET_STATE_JSON");
  if (jsonFile && jsonFile.content_sha256 !== record.market_state?.content_sha256) problems.push("the read-back MARKET_STATE_JSON hash differs from the sealed market_state.content_sha256");
  for (const f of files) if (CONTROL_PLANE_NAME.test(String(f.name))) problems.push(`${f.role} names ${f.name}: the completion record and the handoff are control-plane files, never one of the four immutable Output files`);
  // Nothing reaches the Output folder before the local validation passed.
  const validation = phases.market_state_validation;
  const validationEnd = asTime(validation?.completed_at);
  const uploadStart = asTime(phases.drive_readback?.started_at); const uploadEnd = asTime(phases.drive_readback?.completed_at);
  for (const f of files) {
    const uploaded = asTime(f.uploaded_at);
    if (uploaded === null) { problems.push(`${f.role} has no valid uploaded_at`); continue; }
    if (validation?.status !== "COMPLETE" || validationEnd === null || uploaded < validationEnd) problems.push(`${f.role} was uploaded before the local market-state validation passed`);
    if ((uploadStart !== null && uploaded < uploadStart) || (uploadEnd !== null && uploaded > uploadEnd)) problems.push(`upload of ${f.role} is outside the Drive readback phase`);
    const back = asTime(f.readback_at);
    if (back !== null && back < uploaded) problems.push(`readback of ${f.role} precedes its upload`);
  }
  const readback = phases.drive_readback;
  if (readback?.status === "COMPLETE") {
    const start = asTime(readback.started_at); const end = asTime(readback.completed_at);
    for (const f of files) {
      if (f.readback_verified !== true) problems.push(`Drive readback marked COMPLETE but ${f.role} was not verified`);
      const at = asTime(f.readback_at);
      if (at === null || (start !== null && at < start) || (end !== null && at > end)) problems.push(`readback of ${f.role} is outside the Drive readback phase`);
    }
  }

  const h = record.handoff ?? {};
  const generation = phases.handoff_generation;
  if (generation && ["COMPLETE", "PARTIAL"].includes(generation.status)) {
    if (h.active_handoff_count_after !== 1) problems.push(`exactly one active handoff must exist after the write (found ${h.active_handoff_count_after})`);
    if (h.post_write_parse_valid !== true) problems.push("handoff write was not read back and parsed as valid JSON");
    const pre = asTime(h.pre_write_readback_at); const post = asTime(h.post_write_readback_at);
    const start = asTime(generation.started_at); const end = asTime(generation.completed_at);
    if (pre === null || (start !== null && pre < start) || (post !== null && pre > post)) problems.push("the active handoff was not read back before it was replaced");
    if (post === null || (end !== null && post > end) || (pre !== null && post < pre)) problems.push("the handoff was not read back after it was written");
  }
  if (h.previous_handoff_id && h.previous_handoff_id === h.handoff_id) problems.push("a new handoff must have a handoff_id different from the one it replaces");
  if (record.run_type === "SUNDAY") {
    if (h.created_by_run_id !== record.run_id) problems.push("a new Sunday handoff must be created by the Sunday run itself");
    if (h.origin_sunday_run_id !== record.run_id) problems.push("a new Sunday handoff must name the Sunday run as its origin");
    if (h.parent_state_run_id !== record.run_id) problems.push("a new Sunday handoff must name the Sunday state as its parent state");
    if (record.parent_run_id !== null) problems.push("Sunday parent_run_id must be null");
    if (record.origin_sunday_run_id !== record.run_id) problems.push("Sunday origin_sunday_run_id must equal its own run_id");
  }
  if (record.run_type === "INTERMEDIATE") {
    if (h.created_by_run_id !== record.run_id || h.parent_state_run_id !== record.run_id) problems.push("an intermediate handoff must be created by, and point at, the state just produced");
    if (h.origin_sunday_run_id !== record.origin_sunday_run_id) problems.push("an intermediate handoff must keep the origin Sunday run");
    if (h.write_mode !== "UPDATED_IN_PLACE") problems.push("an intermediate handoff must replace the active handoff in place");
    if (!record.parent_run_id) problems.push("an intermediate completion record must name its parent run");
  }
  const allComplete = COMPLETION_PHASE_ORDER.every((id) => phases[id]?.status === "COMPLETE");
  if (record.run_state === "COMPLETE" && !allComplete) {
    const open = COMPLETION_PHASE_ORDER.find((id) => phases[id]?.status !== "COMPLETE");
    problems.push(`run_state is COMPLETE but ${label(open)} is ${phases[open]?.status ?? "missing"}`);
  }

  if (state) {
    const meta = state.meta ?? {};
    for (const key of ["run_id", "run_type", "origin_sunday_run_id"]) if (record[key] !== meta[key]) problems.push(`completion record ${key} ${record[key]} differs from the market state ${meta[key]}`);
    if ((record.parent_run_id ?? null) !== (meta.parent_run_id ?? null)) problems.push(`completion record parent_run_id ${record.parent_run_id} differs from the market state ${meta.parent_run_id}`);
    if (record.market_state?.run_id !== meta.run_id) problems.push("completion record market_state.run_id differs from the market state");
    if (record.market_state?.content_sha256 !== canonicalSha256(state)) problems.push("completion record content_sha256 does not match the market-state JSON it seals");
    const built = asTime(state.procedural_audit?.phases?.json_and_reports?.completed_at); const validationStart = asTime(phases.market_state_validation?.started_at);
    if (built !== null && validationStart !== null && validationStart < built) problems.push("market-state validation started before the JSON and reports were produced");
  }
  return [...new Set(problems)];
}
