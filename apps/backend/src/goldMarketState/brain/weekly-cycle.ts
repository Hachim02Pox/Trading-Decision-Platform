// @ts-nocheck
// Pinned Brain da8eb64959b6c026128bde254c8d1703e419f19c: unchanged semantics; only local import suffixes adapted.
import { requiresForwardDecision } from "./family-readout";

// Compare wall-clock time in New York, including seconds/milliseconds and DST.
function easternParts(iso) {
  const value = new Date(iso);
  if (!Number.isFinite(value.valueOf())) return null;
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
  }).formatToParts(value).reduce((out, part) => ({ ...out, [part.type]: part.value }), {});
  return { day: `${parts.year}-${parts.month}-${parts.day}`,
    milliseconds: (Number(parts.hour) * 3600 + Number(parts.minute) * 60 + Number(parts.second)) * 1000 + value.getUTCMilliseconds() };
}
function fridayOf(weekOf) {
  if (typeof weekOf !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(weekOf)) return null;
  const monday = new Date(`${weekOf}T00:00:00Z`);
  if (!Number.isFinite(monday.valueOf()) || monday.getUTCDay() !== 1 || monday.toISOString().slice(0, 10) !== weekOf) return null;
  return new Date(monday.valueOf() + 4 * 86400000).toISOString().slice(0, 10);
}
export function withinIntermediateWindow(iso, weekOf) {
  const when = easternParts(iso), friday = fridayOf(weekOf);
  return !!when && !!friday && when.day >= weekOf &&
    (when.day < friday || (when.day === friday && when.milliseconds <= 10 * 3600000));
}
export function weeklyDeadlineReached(iso, weekOf) {
  const when = easternParts(iso), friday = fridayOf(weekOf);
  return !!when && !!friday && (when.day > friday || (when.day === friday && when.milliseconds >= 10 * 3600000));
}
// A conversational exception is evidence, not scheduler permission. It is scoped
// to one REAL v6 run, immediate parent and the same Friday before market close.
export function authorizedLateIntermediate(state, iso) {
  const a = state.research_audit?.manual_execution_authorization, m = state.meta;
  const requested = easternParts(a?.requested_at), end = easternParts(a?.expires_at), when = easternParts(iso);
  const friday = fridayOf(m?.week_of), cutoff = Date.parse(m?.evidence_cutoff_end);
  return state.format_version === "6.0" && m?.data_mode === "REAL" && m.run_type === "INTERMEDIATE" &&
    a?.kind === "USER_REQUESTED_LATE_INTERMEDIATE" && a.run_id === m.run_id && a.parent_run_id === m.parent_run_id &&
    a.automatic_scheduling_allowed === false && typeof a.request_text === "string" && a.request_text.trim().length >= 10 &&
    !!requested && !!end && !!when && requested.day === friday && end.day === friday && when.day === friday &&
    requested.milliseconds >= 10 * 3600000 && end.milliseconds <= 16 * 3600000 &&
    Date.parse(a.requested_at) <= cutoff && Date.parse(iso) >= Date.parse(a.requested_at) && Date.parse(iso) <= Date.parse(a.expires_at);
}
export function weeklyCycleProblems(state, parent = undefined) {
  if (!requiresForwardDecision(state)) return [];
  const problems = [], cycle = state.weekly_cycle;
  if (!cycle) return ["weekly_cycle: required for new REAL market states"];
  const index = cycle.intermediate_index;
  if (state.meta.run_type === "SUNDAY") {
    if (index !== 0 || cycle.origin_run_id !== state.meta.run_id)
      problems.push("Sunday weekly_cycle must start at index 0 with its own origin");
  } else {
    if (!Number.isInteger(index) || index < 1) problems.push("intermediate index must be a positive integer");
    if (cycle.origin_run_id !== state.meta.origin_sunday_run_id) problems.push("weekly_cycle.origin_run_id must equal meta.origin_sunday_run_id");
    if (!withinIntermediateWindow(state.meta.evidence_cutoff_end, state.meta.week_of) && !authorizedLateIntermediate(state, state.meta.evidence_cutoff_end))
      problems.push("intermediate cutoff must be in origin week, no later than Friday 10:00 America/New_York");
    if (!withinIntermediateWindow(state.meta.generated_at, state.meta.week_of) && !authorizedLateIntermediate(state, state.meta.generated_at))
      problems.push("intermediate generation must be in origin week, no later than Friday 10:00 America/New_York");
    if (parent?.weekly_cycle && (index !== parent.weekly_cycle.intermediate_index + 1 || cycle.origin_run_id !== parent.weekly_cycle.origin_run_id))
      problems.push("intermediate index and origin must continue directly from supplied parent");
    if (parent && state.meta.parent_run_id !== parent.meta?.run_id) problems.push("weekly-cycle parent must be the immediate parent state");
  }
  return problems;
}
export function weeklyHandoffProblems(handoff, state = undefined) {
  if (!state || !requiresForwardDecision(state)) return [];
  const problems = [], cycle = state.weekly_cycle;
  if (!cycle) return ["weekly-cycle state missing at handoff validation"];
  if (!handoff.weekly_cycle || handoff.weekly_cycle.intermediate_index !== cycle.intermediate_index || handoff.weekly_cycle.origin_run_id !== cycle.origin_run_id)
    problems.push("handoff weekly_cycle must match the sealed state");
  const closed = weeklyDeadlineReached(state.meta.evidence_cutoff_end, state.meta.week_of) || weeklyDeadlineReached(handoff.created_at, state.meta.week_of);
  if (closed && (handoff.handoff_status !== "CLOSED" || handoff.next_execution !== null))
    problems.push("at the Friday 10:00 deadline handoff must be CLOSED with no next_execution");
  if (handoff.handoff_status === "CLOSED" && handoff.next_execution !== null)
    problems.push("CLOSED handoff cannot schedule another intermediate");
  if (handoff.handoff_status === "ACTIVE") {
    const at = handoff.next_execution?.requested_at;
    if (!at) problems.push("ACTIVE handoff requires next_execution.requested_at");
    else {
      if (!withinIntermediateWindow(at, state.meta.week_of))
        problems.push("handoff requested intermediate must belong to origin week, no later than Friday 10:00 America/New_York");
      if (Date.parse(at) <= Date.parse(state.meta.evidence_cutoff_end))
        problems.push("handoff cannot request a recap before or at the current evidence cutoff");
    }
  }
  if (!["ACTIVE", "CLOSED"].includes(handoff.handoff_status)) problems.push("handoff_status must be ACTIVE or CLOSED");
  return problems;
}
