const nodeWidth = 240;
const nodeHeight = 148;
const gapX = 62;
const gapY = 78;

export type LayoutTree = { nodes: Array<{ id: string }>; edges: Array<{ from: string; to: string }> };

export function layoutScenarioTree(tree: LayoutTree) {
  const parents = new Map<string, string[]>();
  tree.edges.forEach((edge) => parents.set(edge.to, [...(parents.get(edge.to) ?? []), edge.from]));
  const rank = new Map<string, number>();
  const visit = (id: string): number => {
    if (rank.has(id)) return rank.get(id)!;
    const parentRanks = (parents.get(id) ?? []).map(visit);
    const value = parentRanks.length ? Math.max(...parentRanks) + 1 : 0;
    rank.set(id, value);
    return value;
  };
  tree.nodes.forEach((node) => visit(node.id));
  const groups = new Map<number, string[]>();
  tree.nodes.forEach((node) => groups.set(rank.get(node.id) ?? 0, [...(groups.get(rank.get(node.id) ?? 0) ?? []), node.id]));
  const max = Math.max(...[...groups.values()].map((nodes) => nodes.length), 1);
  const positions = new Map<string, { x: number; y: number }>();
  [...groups.entries()].forEach(([level, nodes]) => nodes.forEach((id, index) => positions.set(id, { x: 36 + index * (nodeWidth + gapX) + ((max - nodes.length) * (nodeWidth + gapX)) / 2, y: 34 + level * (nodeHeight + gapY) })));
  const bounds = [...positions.values()].reduce((result, point) => ({ right: Math.max(result.right, point.x + nodeWidth), bottom: Math.max(result.bottom, point.y + nodeHeight) }), { right: 0, bottom: 0 });
  return { positions, width: Math.max(320, bounds.right + 36), height: Math.max(180, bounds.bottom + 34) };
}
