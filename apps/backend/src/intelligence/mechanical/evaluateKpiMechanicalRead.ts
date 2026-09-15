import type { CanonicalKpi, DisplayRelationship, MechanicalEvaluation, MechanicalRuleDefinition } from "@gold-terminal/contracts";
import { getRuleForKpi } from "./rules";

function roundTo(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

/** Maps a signed delta onto SUPPORTIVE/ADVERSE via the rule's documented direction. Never called with a zero delta — callers resolve `NO_CHANGE` before reaching this. */
function directionalRead(delta: number, direction: "UP" | "DOWN"): DisplayRelationship {
  const rose = delta > 0;
  if (direction === "UP") return rose ? "SUPPORTIVE" : "ADVERSE";
  return rose ? "ADVERSE" : "SUPPORTIVE";
}

/**
 * Compares the two most recent distinct fetched observations of a LEVEL
 * (e.g. 10Y Real, DXY level) — never used for a KPI whose own value is
 * already a delta (see `evaluateCurrentSign`). `kpi.previousFetch` is
 * already correctly maintained by `rememberKpiObservation`
 * (intelligence/cloud/kpiHistory.ts), including the "identical refetch
 * keeps the real earlier observation" case — no change needed there.
 */
export function evaluateObservationDelta(rule: MechanicalRuleDefinition, kpi: CanonicalKpi): MechanicalEvaluation {
  const base = { ruleId: kpi.id, mode: "OBSERVATION_DELTA" as const, channelId: rule.channelId };

  if (kpi.dataState === "UNAVAILABLE") {
    return { ...base, previousValue: null, currentValue: null, delta: null, status: "UNAVAILABLE", read: "CONTEXTUAL" };
  }

  const previous = kpi.previousFetch?.value ?? null;
  const current = kpi.value;
  if (previous === null || current === null) {
    return { ...base, previousValue: previous, currentValue: current, delta: null, status: "INSUFFICIENT_HISTORY", read: "CONTEXTUAL" };
  }

  if (roundTo(previous, kpi.decimals) === roundTo(current, kpi.decimals)) {
    return { ...base, previousValue: previous, currentValue: current, delta: 0, status: "NO_CHANGE", read: "CONTEXTUAL" };
  }

  const previousUnit = kpi.previousFetch?.unit ?? null;
  if (previousUnit !== kpi.unit) {
    return { ...base, previousValue: previous, currentValue: current, delta: null, status: "NON_COMPARABLE", read: "CONTEXTUAL" };
  }

  if (rule.supportiveDirection === null) {
    throw new Error(`evaluateObservationDelta: rule for "${kpi.id}" has mode OBSERVATION_DELTA but no supportiveDirection.`);
  }
  const delta = current - previous;
  return { ...base, previousValue: previous, currentValue: current, delta, status: "EVALUATED", read: directionalRead(delta, rule.supportiveDirection) };
}

/**
 * The KPI's own value already IS a delta/flow (DXY Today %, MM WoW Δ, ETF
 * Holdings Δ) — reads its sign directly. Never compares to `previousFetch`:
 * doing so would be a delta-of-a-delta, the exact bug this refactor fixes
 * (see tests/mechanical-engine.test.ts's DXY Today CURRENT_SIGN regression
 * test).
 */
export function evaluateCurrentSign(rule: MechanicalRuleDefinition, kpi: CanonicalKpi): MechanicalEvaluation {
  const base = { ruleId: kpi.id, mode: "CURRENT_SIGN" as const, channelId: rule.channelId };

  if (kpi.dataState === "UNAVAILABLE" || kpi.value === null) {
    return { ...base, previousValue: null, currentValue: kpi.value, delta: null, status: "UNAVAILABLE", read: "CONTEXTUAL" };
  }

  if (kpi.value === 0) {
    return { ...base, previousValue: null, currentValue: kpi.value, delta: 0, status: "NO_CHANGE", read: "CONTEXTUAL" };
  }

  if (rule.supportiveDirection === null) {
    throw new Error(`evaluateCurrentSign: rule for "${kpi.id}" has mode CURRENT_SIGN but no supportiveDirection.`);
  }
  return { ...base, previousValue: null, currentValue: kpi.value, delta: kpi.value, status: "EVALUATED", read: directionalRead(kpi.value, rule.supportiveDirection) };
}

/** Trivial — a `CONTEXTUAL`-mode rule always resolves CONTEXTUAL, by design, never by data gap. */
export function evaluateContextual(rule: MechanicalRuleDefinition, kpi: CanonicalKpi): MechanicalEvaluation {
  return {
    ruleId: kpi.id,
    mode: "CONTEXTUAL",
    channelId: rule.channelId,
    previousValue: null,
    currentValue: kpi.value,
    delta: null,
    status: "CONTEXTUAL_BY_DESIGN",
    read: "CONTEXTUAL",
  };
}

/** Dispatches one KPI to the evaluator matching its registered rule mode. Throws if the resolved mode is `COMPOSITE` — no individual-KPI rule is ever COMPOSITE; F3's composite exists only at the family level (see families/f3.ts). */
export function evaluateKpiMechanicalRead(kpi: CanonicalKpi): MechanicalEvaluation {
  const rule = getRuleForKpi(kpi.id);
  if (rule.mode === "OBSERVATION_DELTA") return evaluateObservationDelta(rule, kpi);
  if (rule.mode === "CURRENT_SIGN") return evaluateCurrentSign(rule, kpi);
  if (rule.mode === "CONTEXTUAL") return evaluateContextual(rule, kpi);
  throw new Error(`evaluateKpiMechanicalRead: KPI "${kpi.id}" resolved mode "${rule.mode}" — COMPOSITE is family-level only.`);
}
