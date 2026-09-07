import type { GlobalReadAdmission, GlobalReadCatalyst, GlobalReadCondition, GlobalReadDecision, GlobalReadPriceTest, GlobalReadProposal } from "@gold-terminal/contracts/dist/globalRead";
import { isAdmitted } from "./evidence";

export function evaluateCondition(condition: GlobalReadCondition, evidence: readonly GlobalReadAdmission[]): "TRUE" | "FALSE" | "UNDEFINED" {
  const left = evidence.find((e) => e.ref === condition.leftRef);
  const right = evidence.find((e) => e.ref === condition.rightRef);
  if (!isAdmitted(left) || !isAdmitted(right) || typeof left?.admittedValue !== "number" || typeof right?.admittedValue !== "number") return "UNDEFINED";
  if (["metric", "unit", "instrument", "transform", "seasonality"].some((key) => left.selected![key as "metric"] !== right.selected![key as "metric"])) return "UNDEFINED";
  const result = condition.operator === "GT" ? left.admittedValue > right.admittedValue : condition.operator === "LT" ? left.admittedValue < right.admittedValue : left.admittedValue === right.admittedValue;
  return result ? "TRUE" : "FALSE";
}

export interface ThesisInput {
  proposal: GlobalReadProposal;
  evidence: readonly GlobalReadAdmission[];
  now: string;
  priceTest: GlobalReadPriceTest;
  catalysts: readonly GlobalReadCatalyst[];
  eventGuardSeconds: number | null;
  isolationControlled: boolean;
  calendarComplete: boolean;
  /** Must come from existing deterministic F10 logic and admitted underlying refs, never LLM prose. */
  verifiedExtension?: boolean;
}

export function evaluateThesis(input: ThesisInput): Pick<GlobalReadDecision, "readiness" | "thesis" | "lifecycle" | "blockers" | "trap" | "flip"> {
  const { proposal: p, evidence } = input;
  const blockers: GlobalReadDecision["blockers"] = [];
  const block = (code: string, detail: string, resolver: string | null = null) => blockers.push({ code, detail, recoverable: resolver !== null, resolver });
  const registry = new Map(evidence.map((e) => [e.ref, e]));
  if (!input.isolationControlled) block("CLI_ISOLATION", "Analysis execution was not isolated from external instructions/tools.");
  if (p.thesis === "UNCLEAR") block("NO_DIRECTIONAL_THESIS", "No independently supported marginal Gold thesis.");
  const chain = [...p.catalystRefs, ...p.expectationRefs, ...p.repricingRefs, ...p.transmissionRefs];
  if (!p.decisionCriticalRefs.length || chain.some((ref) => !p.decisionCriticalRefs.includes(ref))) block("CRITICAL_REFS_INCOMPLETE", "Every causal-chain premise must be declared decision-critical.");
  for (const ref of new Set(p.decisionCriticalRefs)) {
    if (!isAdmitted(registry.get(ref))) block("CRITICAL_UNVERIFIED", `${ref}: essential evidence is missing, conflicted, incomparable or not verified.`);
  }
  if (!p.catalystRefs.length || !p.catalystRefs.some((ref) => ["CATALYST", "BACKGROUND"].includes(registry.get(ref)?.selected?.role ?? ""))) block("CATALYST_UNSUPPORTED", "No identified release/catalyst supports the proposed marginal driver.");
  if (!p.expectationRefs.length || !p.expectationRefs.some((ref) => registry.get(ref)?.selected?.role === "EXPECTATION")) block("EXPECTATIONS_UNVERIFIED", "Actuals and current yields do not establish what the market expected or already priced.");
  if (!p.repricingRefs.length || !p.repricingRefs.some((ref) => registry.get(ref)?.selected?.role === "REPRICING")) block("REPRICING_UNVERIFIED", "No admissible measured change in pricing; a level or headline is insufficient.");
  if (!p.transmissionRefs.length || !p.transmissionRefs.some((ref) => registry.get(ref)?.selected?.role === "TRANSMISSION")) block("TRANSMISSION_UNVERIFIED", "Current causal transmission has not been established.");
  if (!p.invalidations.length) block("INVALIDATION_UNDEFINED", "No grounded falsification condition is defined.");
  for (const condition of p.invalidations) {
    const state = evaluateCondition(condition, evidence);
    if (state !== "FALSE") block(state === "TRUE" ? "INVALIDATION_ALREADY_TRUE" : "INVALIDATION_UNDEFINED", condition.description);
  }
  if (input.priceTest.state !== "CONFIRMS") block("PRICE_TEST_INCOMPLETE", input.priceTest.reason);
  if (input.eventGuardSeconds === null) block("EVENT_GUARD_UNDEFINED", "Event timing policy is not configured; no duration has been invented.");
  if (!input.calendarComplete) block("CALENDAR_COVERAGE", "Verified calendar coverage is incomplete. Absence of listed events is not absence of event risk.");
  if (input.eventGuardSeconds !== null) for (const event of input.catalysts) {
    const seconds = (Date.parse(event.scheduledAt) - Date.parse(input.now)) / 1000;
    if (event.verified && seconds >= 0 && seconds <= input.eventGuardSeconds)
      block("EVENT_GUARD", `${event.title}: ${event.scheduledAt}`, `Wait for ${event.title} (${event.scheduledAt}), verify the release and reassess transmission.`);
  }
  const trap = input.verifiedExtension && input.priceTest.state === "FAILS_TO_CONFIRM" ? "TRAP_CANDIDATE" : "NOT_ESTABLISHED";
  const newOpposite = p.flip.thesis !== "UNCLEAR" && p.flip.thesis !== p.thesis && p.flip.newEvidenceRefs.length > 0 &&
    p.flip.newEvidenceRefs.every((ref) => !p.decisionCriticalRefs.includes(ref) && isAdmitted(registry.get(ref)) &&
      ["CATALYST", "REPRICING"].includes(registry.get(ref)?.selected?.role ?? "")) &&
    p.flip.conditions.length > 0 && p.flip.conditions.every((c) => evaluateCondition(c, evidence) !== "UNDEFINED");
  const invalidated = blockers.some((b) => b.code === "INVALIDATION_ALREADY_TRUE");
  return { readiness: blockers.some((b) => !b.recoverable) ? "NO_OPPORTUNITY" : blockers.length ? "WATCH" : "OPPORTUNITY",
    thesis: p.thesis, lifecycle: invalidated ? "INVALIDATED" : blockers.length ? "FORMATION" : "ACTIVE", blockers, trap, flip: newOpposite ? p.flip : null };
}
