type CanonicalTree = {
  root_id?: string;
  nodes: Array<{ id: string; parent_id: string | null; title_fr: string; condition_fr: string; causal_path_fr: string }>;
  edges: Array<{ from_id: string; to_id: string; observable_condition_fr: string; causal_explanation_fr: string }>;
};

/** Structural only: v6 does not assign historical evidence statuses or outcomes. */
export function adaptLearningScenarioTree(tree: CanonicalTree) {
  const rootId = tree.root_id ?? tree.nodes.find(node => node.parent_id === null)?.id;
  const ordered = [...tree.nodes.filter(node => node.id === rootId), ...tree.nodes.filter(node => node.id !== rootId)];
  const edges = tree.edges.map((edge, index) => ({ id: `conditional-edge-${index}`, from: edge.from_id, to: edge.to_id, status: "CONDITIONAL" as const }));
  return {
    tree: { nodes: ordered.map(node => ({ id: node.id, label: node.title_fr, description: node.causal_path_fr, type: "CONDITION", status: "CONDITIONAL" as const, evidence_refs: [] as string[] })), edges },
    presentation: {
      nodes: ordered.map(node => ({ node_id: node.id, label: node.title_fr, description: node.condition_fr })),
      edges: tree.edges.map((edge, index) => ({ edge_id: edges[index].id, label: edge.observable_condition_fr, explanation: edge.causal_explanation_fr })),
    },
  };
}
