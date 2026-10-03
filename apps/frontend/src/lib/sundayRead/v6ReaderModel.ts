import type { V6EditorialState } from "./v6Editorial";
type Node = V6EditorialState["scenario_tree"]["nodes"][number];
export type ScenarioBranch = Node & { children: ScenarioBranch[] };
export function buildScenarioTopology(nodes: Node[]): ScenarioBranch[] {
  const byId = new Map(
    nodes.map((node) => [
      node.id,
      { ...node, children: [] as ScenarioBranch[] },
    ]),
  );
  const roots: ScenarioBranch[] = [];
  for (const node of nodes) {
    const branch = byId.get(node.id)!;
    const parent = node.parent_id ? byId.get(node.parent_id) : undefined;
    if (parent && parent !== branch) parent.children.push(branch);
    else roots.push(branch);
  }
  return roots;
}
export function v6ValidityMessage(
  panel: V6EditorialState["decision_panel"],
  now = new Date(),
): string {
  const expiry = panel.scheduled_expiry
    ? new Date(panel.scheduled_expiry)
    : null;
  if (
    expiry &&
    !Number.isNaN(expiry.getTime()) &&
    expiry.getTime() <= now.getTime()
  )
    return "Conclusion historique : son echeance planifiee est passee. Relire les conditions avant toute decision actuelle.";
  return panel.earlier_expiry
    ? `Valable jusqu'au prochain reexamen, sauf plus tot : ${panel.earlier_expiry}`
    : "Conclusion au cutoff : a reexaminer a la prochaine information materielle.";
}
export function humanStatus(status: string): string {
  return (
    (
      {
        CURRENT_EVIDENCE_INSUFFICIENT: "Preuves actuelles insuffisantes",
        MATERIAL: "Matériel",
        MATERIAL_WITH_LIMITS: "Matériel avec limites",
        MONITOR: "À surveiller",
        CONTEXT: "Contexte",
        PARTIAL_SCAN: "Revue partielle",
        STRUCTURAL_LAGGED: "Structurel, données retardées",
        NOT_TESTED: "Non testé",
        ANSWERED: "Repondu",
        PARTIAL: "Partiel",
        UNKNOWN: "Inconnu",
        NOT_APPLICABLE: "Non applicable",
        UPDATED: "Mis a jour",
        UNCHANGED: "Inchange",
        INVALIDATED: "Invalide",
        BULLISH: "Haussier",
        BEARISH: "Baissier",
        MIXED: "Mixte",
        UNCLEAR: "Indéterminé",
        UNESTABLISHED: "Non établi",
        NOT_DEMONSTRATED: "Non démontré",
        FUNDAMENTALS_ONLY: "Fondamentaux uniquement",
        MACRO_SUPPORTED_POSITIONING_PARTIAL:
          "Macro étayée, positions partiellement documentées",
        FUTURES_SHORT_CFD_NEITHER:
          "Futures : short éligible, CFD : aucun sens éligible",
        FUTURES_LONG_CFD_NEITHER:
          "Futures : long éligible, CFD : aucun sens éligible",
        FUTURES_NEITHER_CFD_NEITHER: "Aucun sens éligible",
        NOT_DUE: "Non attendu à cette date",
        OBSERVED: "Observé",
        UNVERIFIED: "Non vérifié",
        VERIFIED: "Vérifié",
        REJECTED: "Rejeté",
        CONFIRMED: "Confirmé",
        WATCH: "À surveiller",
        PENDING: "En attente",
        CONDITION_TRIGGERED: "Condition déclenchée",
        TRANSMISSION_PARTIAL: "Transmission partielle",
        TRANSMISSION_CONFIRMED: "Transmission confirmée",
        FLOW_CONFIRMATION_PENDING: "Confirmation des flux attendue",
        FLOW_CONFIRMED: "Flux confirmés",
        CONTRADICTED: "Contredit",
        EXPIRED: "Expiré",
        SCENARIO_VALIDATED: "Scénario validé",
      } as Record<string, string>
    )[status] ?? "Statut non precise"
  );
}
