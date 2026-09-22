import assert from "node:assert/strict";
import test from "node:test";
import { layoutScenarioTree } from "../apps/frontend/src/lib/sundayRead/scenarioTreeLayout.ts";

const tree = (nodes: string[], edges: Array<[string, string]>) => ({ nodes: nodes.map((id) => ({ id })), edges: edges.map(([from, to]) => ({ from, to })) }) as any;

test("short tree dimensions follow the occupied node bounds", () => {
  const graph = layoutScenarioTree(tree(["root", "child"], [["root", "child"]]));
  assert.ok(graph.height < 500);
  assert.equal(graph.positions.size, 2);
});

test("layout retains every node and multi-branch edge endpoint", () => {
  const graph = layoutScenarioTree(tree(["root", "a", "b", "c", "d"], [["root", "a"], ["root", "b"], ["a", "c"], ["b", "d"]]));
  assert.equal(graph.positions.size, 5);
  assert.ok(graph.width >= 320);
  assert.ok(graph.height >= 180);
});

test("empty tree has compact usable dimensions", () => {
  const graph = layoutScenarioTree(tree([], []));
  assert.deepEqual([graph.width, graph.height], [320, 180]);
});
