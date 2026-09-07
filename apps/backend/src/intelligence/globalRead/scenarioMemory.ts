export type ScenarioStatus = "PROPOSED" | "WATCHING" | "ACTIVE" | "STRENGTHENING" | "WEAKENING" | "INVALIDATED" | "SUPERSEDED";

export interface RememberedScenario {
  id: string;
  status: ScenarioStatus;
  triggerRefs: string[];
  invalidationRefs: string[];
}

export interface ScenarioTransition {
  scenarioId: string;
  from: ScenarioStatus | null;
  to: ScenarioStatus;
  reason: "NO_MATERIAL_CHANGE" | "TRIGGER_OBSERVED" | "INVALIDATION_OBSERVED" | "MODEL_UPDATE" | "NEW_BRANCH";
}

export function updateScenarioMemory(
  previous: readonly RememberedScenario[],
  proposed: readonly RememberedScenario[],
  observedTriggers: ReadonlySet<string>,
  observedInvalidations: ReadonlySet<string>,
): { scenarios: RememberedScenario[]; transitions: ScenarioTransition[]; flipEstablished: false } {
  const previousById = new Map(previous.map((scenario) => [scenario.id, scenario]));
  const proposedById = new Map(proposed.map((scenario) => [scenario.id, scenario]));
  const ids = [...previous.map((scenario) => scenario.id), ...proposed.filter((scenario) => !previousById.has(scenario.id)).map((scenario) => scenario.id)];
  const transitions: ScenarioTransition[] = [];
  const scenarios = ids.map((id): RememberedScenario => {
    const before = previousById.get(id);
    const candidate = proposedById.get(id) ?? before!;
    let status = candidate.status;
    let reason: ScenarioTransition["reason"] = before ? "MODEL_UPDATE" : "NEW_BRANCH";
    if (candidate.invalidationRefs.some((ref) => observedInvalidations.has(ref))) {
      status = "INVALIDATED";
      reason = "INVALIDATION_OBSERVED";
    } else if (candidate.triggerRefs.some((ref) => observedTriggers.has(ref))) {
      status = "ACTIVE";
      reason = "TRIGGER_OBSERVED";
    } else if (before && before.status === candidate.status) {
      reason = "NO_MATERIAL_CHANGE";
    }
    transitions.push({ scenarioId: id, from: before?.status ?? null, to: status, reason });
    return { ...candidate, status };
  });
  // Invalidation only removes support. A separate opposite causal chain is required for a flip.
  return { scenarios, transitions, flipEstablished: false };
}
