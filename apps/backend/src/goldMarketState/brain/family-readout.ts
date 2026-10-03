// @ts-nocheck
// Pinned Brain da8eb64959b6c026128bde254c8d1703e419f19c: unchanged semantics; only local import suffixes adapted.
// V5 additive contract. The question IDs map to collection-spec sections;
// the research method and existing published snapshots remain unchanged.
export const FAMILY_READOUT_EFFECTIVE_AT = "2026-09-25T04:00:00Z";
export const FORWARD_DECISION_EFFECTIVE_AT = "2026-09-26T04:00:00Z";
export const FAMILY_QUESTIONS = Object.freeze({
  F1: ["F1_FED_PRICING", "F1_US2Y", "F1_FED_COMMUNICATION", "F1_NEXT_FOMC"],
  F2: ["F2_REAL_10Y", "F2_RATE_DECOMPOSITION", "F2_CURVE_LEADERSHIP", "F2_2S10S", "F2_EVENT_DYNAMICS", "F2_MOVE"],
  F3: ["F3_DXY", "F3_GOLD_DXY_30D", "F3_USDJPY", "F3_USDCNH", "F3_USD_LIQUIDITY"],
  F4: ["F4_RELEASES", "F4_OIL", "F4_AUCTIONS_FISCAL", "F4_CREDIT"],
  F5: ["F5_COT", "F5_OPEN_INTEREST", "F5_ETF_FLOWS", "F5_OPTIONS", "F5_MARGINAL_FLOW", "F5_FORCED_ACTOR", "F5_FUNDING", "F5_FUSE", "F5_PRICE_FLOW_DIVERGENCE"],
  F6: ["F6_CENTRAL_BANKS", "F6_CHINA_PHYSICAL", "F6_DEDOLLARIZATION", "F6_DEBASEMENT"],
});
const REASON_KINDS = new Set(["AWAITING_PUBLICATION", "SOURCE_NOT_RETRIEVED", "SOURCE_INACCESSIBLE", "COMPARABILITY_FAILED", "METHODOLOGY_NOT_VERIFIED", "STRUCTURALLY_UNOBSERVABLE", "CAUSE_UNDETERMINED", "NOT_MATERIAL"]);
const REASONING_FIELDS = ["established", "mechanism", "counterevidence", "limits", "forward_test"];
const SYNTHESIS_FIELDS = ["causal_chain", "alternatives", "contradictions", "priced_in", "forward_conditions", "invalidation", "unknowns", "edge_reasoning"];
const EVOLUTION_FIELDS = ["narrative", "still_true", "new_observations", "strengthened", "weakened", "invalidated", "exogenous_factors", "unresolved", "next_checks"];
const BRIDGE_FIELDS = ["comparison_limit", "differences", "surviving_conclusions", "resolved_expectations", "failed_expectations"];
const VERDICT_KEYS = ["macro_direction", "directional_asymmetry", "positioning_asymmetry", "edge", "opportunity_quality", "execution_readiness"];
const PLACEHOLDER = /explication localis[ée]e non publi[ée]e|localized explanation not published|\b(?:UNKNOWN|NO_EDGE|BEARISH|BULLISH|PARTIAL)\b|\bF[1-6][\s:–-]+(?:UPDATED|UNCHANGED|PARTIAL)\b/i;
const EMPTY_GAP = /la mesure demand[ée]e est absente, incompl[eè]te ou non comparable|the requested measurement is absent, incomplete or non-comparable|la source primaire et le dernier [ée]tat valid[ée] ont [ée]t[ée] v[ée]rifi[ée]s|primary sources and the last validated state were checked/i;
const FORWARD_CASE_FIELDS = ["current_case", "mechanism", "opposing_case", "why_preferred", "already_priced", "next_test", "invalidation", "practical_consequence"];

export function requiresForwardDecision(doc) {
  return isNewRealState(doc) && Date.parse(doc?.meta?.generated_at) >= Date.parse(FORWARD_DECISION_EFFECTIVE_AT);
}

export function forwardDecisionProblems(doc) {
  if (!requiresForwardDecision(doc)) return [];
  const problems = [];
  const ids = new Set((doc.evidence ?? []).map(entry => entry.id));
  for (const key of VERDICT_KEYS) {
    const entry = doc.forward_verdict_cases?.[key];
    if (!entry) { problems.push(`forward_verdict_cases.${key}: bilingual forward reasoning required`); continue; }
    const raw = key in (doc.direction_state ?? {}) ? doc.direction_state[key] : doc[key]?.value;
    if (entry.value !== raw) problems.push(`forward_verdict_cases.${key}.value must match the analytical verdict`);
    for (const field of FORWARD_CASE_FIELDS) narrative(entry[field], `forward_verdict_cases.${key}.${field}`, ids, problems,
      ["current_case", "mechanism", "why_preferred"].includes(field));
  }
  const coherent = doc.global_synthesis?.priced_in;
  if (!coherent || !coherent.evidence_refs?.length) problems.push("global_synthesis.priced_in: dated evidence and a fresh forward implication required");
  return problems;
}

export function isNewRealState(doc) {
  return doc?.meta?.data_mode === "REAL" &&
    ["SUNDAY", "INTERMEDIATE"].includes(doc?.meta?.run_type) &&
    Date.parse(doc?.meta?.generated_at) >= Date.parse(FAMILY_READOUT_EFFECTIVE_AT);
}

function localization(value, path, problems) {
  for (const lang of ["fr", "en"]) {
    const copy = value?.[lang];
    if (typeof copy !== "string" || copy.trim().length < 12 || PLACEHOLDER.test(copy))
      problems.push(`${path}.${lang}: meaningful localized text required`);
  }
}

function narrative(value, path, ids, problems, requireEvidence = false) {
  localization(value, path, problems);
  if (!Array.isArray(value?.evidence_refs)) problems.push(`${path}.evidence_refs: array required`);
  else {
    if (requireEvidence && !value.evidence_refs.length) problems.push(`${path}: dated evidence required`);
    for (const id of value.evidence_refs) if (!ids.has(id)) problems.push(`${path}: unresolved evidence ${id}`);
  }
}

export function familyReadoutProblems(doc, priorSunday = undefined) {
  const problems = [];
  const ids = new Set((doc?.evidence ?? []).map((entry) => entry.id));
  const next = isNewRealState(doc);
  if (!next && !doc?.family_readouts && !doc?.global_synthesis && !doc?.evolution_review && !doc?.weekly_bridge) return problems;
  const sunday = doc?.meta?.run_type === "SUNDAY";
  if (sunday && (next || doc.family_readouts !== undefined)) {
    if (!Array.isArray(doc.family_readouts)) problems.push("new Sunday requires family_readouts for F1–F6");
    const seenFamilies = new Set();
    for (const [i, family] of (Array.isArray(doc.family_readouts) ? doc.family_readouts : []).entries()) {
      const path = `family_readouts[${i}]`;
      const wanted = FAMILY_QUESTIONS[family?.family_id];
      if (!wanted) { problems.push(`${path}.family_id is invalid`); continue; }
      if (seenFamilies.has(family.family_id)) problems.push(`${path}.family_id duplicated`);
      seenFamilies.add(family.family_id);
      localization(family.title, `${path}.title`, problems);
      const seenQuestions = new Set();
      if (!Array.isArray(family.questions)) problems.push(`${path}.questions array required`);
      for (const [qi, item] of (Array.isArray(family.questions) ? family.questions : []).entries()) {
        const qpath = `${path}.questions[${qi}]`;
        if (!wanted.includes(item?.question_id)) problems.push(`${qpath}.question_id is not in the collection catalog`);
        if (seenQuestions.has(item?.question_id)) problems.push(`${qpath}.question_id duplicated`);
        seenQuestions.add(item?.question_id);
        localization(item?.question, `${qpath}.question`, problems);
        localization(item?.answer, `${qpath}.answer`, problems);
        if (!["ANSWERED", "PARTIAL", "UNKNOWN", "NOT_APPLICABLE"].includes(item?.status)) problems.push(`${qpath}.status invalid`);
        if (!Array.isArray(item?.evidence_refs)) problems.push(`${qpath}.evidence_refs array required`);
        else {
          if (item.status === "ANSWERED" && item.evidence_refs.length === 0) problems.push(`${qpath}: answered fact requires dated evidence`);
          for (const id of item.evidence_refs) if (!ids.has(id)) problems.push(`${qpath}: unresolved evidence ${id}`);
        }
        if (item.status === "ANSWERED") {
          if (!item.as_of || Number.isNaN(Date.parse(item.as_of))) problems.push(`${qpath}: answered fact requires an actual as_of date`);
          if (item.unknown_reason) problems.push(`${qpath}: answered fact cannot have an unknown reason`);
        } else {
          const gap = item?.unknown_reason;
          if (!gap || !REASON_KINDS.has(gap.reason_kind)) problems.push(`${qpath}: actual missing-data reason required`);
          else {
            if (item.status === "NOT_APPLICABLE" && gap.reason_kind !== "NOT_MATERIAL") problems.push(`${qpath}: NOT_APPLICABLE must state why immaterial`);
            if (item.status !== "NOT_APPLICABLE" && gap.reason_kind === "NOT_MATERIAL") problems.push(`${qpath}: material gap cannot be NOT_MATERIAL`);
            for (const field of ["explanation", "checked", "next_action"]) localization(gap[field], `${qpath}.unknown_reason.${field}`, problems);
            if (requiresForwardDecision(doc)) {
              for (const field of ["explanation", "checked", "next_action"]) for (const lang of ["fr", "en"])
                if (EMPTY_GAP.test(gap[field]?.[lang] ?? "")) problems.push(`${qpath}.unknown_reason.${field}.${lang}: generic recovery boilerplate is forbidden`);
            }
            if (gap.reason_kind === "AWAITING_PUBLICATION" && (!gap.expected_at || Number.isNaN(Date.parse(gap.expected_at)))) problems.push(`${qpath}: publication time requires verified expected_at`);
            if (gap.reason_kind !== "AWAITING_PUBLICATION" && gap.expected_at) problems.push(`${qpath}: expected_at must not be invented`);
          }
        }
      }
      for (const id of wanted) if (!seenQuestions.has(id)) problems.push(`${path}: missing question ${id}`);
      for (const key of REASONING_FIELDS) narrative(family?.family_reasoning?.[key], `${path}.family_reasoning.${key}`, ids, problems, key === "established" || key === "mechanism");
    }
    for (const family of Object.keys(FAMILY_QUESTIONS)) if (!seenFamilies.has(family)) problems.push(`missing family ${family}`);
    for (const key of SYNTHESIS_FIELDS) narrative(doc?.global_synthesis?.[key], `global_synthesis.${key}`, ids, problems, key === "causal_chain");
    if (next || doc.weekly_bridge !== undefined) {
      if (!doc.weekly_bridge || typeof doc.weekly_bridge !== "object") problems.push("new Sunday requires weekly_bridge");
      else {
        if (doc.weekly_bridge.prior_run_id !== null && (typeof doc.weekly_bridge.prior_run_id !== "string" || !doc.weekly_bridge.prior_run_id)) problems.push("weekly_bridge.prior_run_id must identify the prior state or be null with a reason");
        if (priorSunday?.meta?.run_id && doc.weekly_bridge.prior_run_id !== priorSunday.meta.run_id) problems.push("weekly_bridge.prior_run_id differs from supplied last validated state");
        for (const key of BRIDGE_FIELDS) narrative(doc.weekly_bridge[key], `weekly_bridge.${key}`, ids, problems);
      }
    }
  }
  if (doc?.meta?.run_type === "INTERMEDIATE" && (next || doc.evolution_review !== undefined)) {
    const ev = doc.evolution_review;
    if (!ev || typeof ev !== "object") problems.push("new intermediate requires evolution_review against its immediate parent");
    else {
      if (!ev.parent_run_id || ev.parent_run_id !== doc.meta.parent_run_id) problems.push("evolution_review.parent_run_id must equal meta.parent_run_id");
      if (!["INTACT", "STRENGTHENED", "WEAKENED", "CHANGED", "INVALIDATED", "UNCLEAR"].includes(ev.thesis_status)) problems.push("evolution_review.thesis_status invalid");
      for (const key of EVOLUTION_FIELDS) narrative(ev[key], `evolution_review.${key}`, ids, problems, key === "new_observations");
    }
  }
  if (requiresForwardDecision(doc)) {
    for (const family of doc.family_readouts ?? []) for (const item of family.questions ?? []) {
      if (!["PARTIAL", "UNKNOWN", "NOT_APPLICABLE"].includes(item.status)) continue;
      const path = `family_readouts.${family.family_id}.${item.question_id}`;
      for (const field of ["explanation", "checked", "next_action"]) for (const lang of ["fr", "en"])
        if (EMPTY_GAP.test(item.unknown_reason?.[field]?.[lang] ?? "")) problems.push(`${path}.unknown_reason.${field}.${lang}: generic recovery boilerplate is forbidden`);
      if (item.status === "NOT_APPLICABLE") continue;
      const audited = (doc.procedural_audit?.collection?.[family.family_id]?.questions ?? [])
        .find(q => q.question_id === item.question_id);
      if (doc.procedural_audit && !audited) problems.push(`${path}: recovery audit must use the same canonical question_id`);
      if (!doc.procedural_audit || !audited) continue;
      const attempts = audited.source_recovery?.attempts;
      if (item.unknown_reason?.reason_kind === "AWAITING_PUBLICATION" || item.unknown_reason?.reason_kind === "STRUCTURALLY_UNOBSERVABLE") continue;
      if (!Array.isArray(attempts) || !attempts.length) problems.push(`${path}: at least one question-specific recovery attempt required`);
      else for (const [i, attempt] of attempts.entries()) {
        if (typeof attempt.url_or_provider !== "string" || attempt.url_or_provider.length < 7 ||
            !attempt.attempted_at || Number.isNaN(Date.parse(attempt.attempted_at)) ||
            typeof attempt.requested_observation !== "string" || attempt.requested_observation.length < 5 ||
            typeof attempt.result_detail !== "string" || attempt.result_detail.length < 12)
          problems.push(`${path}.source_recovery.attempts[${i}]: provider, time, exact requested observation and specific obstacle required`);
        if (/public quantwheel gex checked for options/i.test(attempt.url_or_provider) && family.family_id !== "F5")
          problems.push(`${path}: unrelated options recovery must not be copied across families`);
      }
    }
  }
  problems.push(...forwardDecisionProblems(doc));
  return problems;
}

export function continuityCheckpointProblems(handoff, state = undefined) {
  const problems = [];
  const newHandoff = Date.parse(handoff?.created_at) >= Date.parse(FAMILY_READOUT_EFFECTIVE_AT);
  if (newHandoff && handoff?.handoff_version < 7) problems.push("new handoff must increment handoff_version to 7+");
  if (handoff?.handoff_version < 7 && !handoff?.continuity_checkpoint) return problems;
  const c = handoff?.continuity_checkpoint;
  if (!c) return ["handoff version 7+ requires continuity_checkpoint"];
  if (c.source_run_id !== handoff.created_by_run_id || c.source_run_id !== handoff.parent_state_run_id) problems.push("continuity_checkpoint.source_run_id must equal created_by_run_id and parent_state_run_id");
  if (Date.parse(c.evidence_cutoff_end) !== Date.parse(handoff.prior_cutoff?.as_of)) problems.push("continuity_checkpoint.evidence_cutoff_end must match the handoff cutoff");
  if (typeof c.summary !== "string" || c.summary.trim().length < 12) problems.push("continuity_checkpoint.summary required");
  for (const key of ["durable_foundations", "live_questions", "branch_checks"]) if (!Array.isArray(c[key])) problems.push(`continuity_checkpoint.${key} array required`);
  const expected = { ...state?.direction_state, opportunity_quality: state?.opportunity_quality?.value, execution_readiness: state?.execution_readiness?.value };
  for (const key of VERDICT_KEYS) {
    if (typeof c.six_verdicts?.[key] !== "string" || !c.six_verdicts[key]) problems.push(`continuity_checkpoint.six_verdicts.${key} required`);
    else if (state && c.six_verdicts[key] !== expected[key]) problems.push(`continuity_checkpoint.six_verdicts.${key} differs from produced market state`);
  }
  return problems;
}
