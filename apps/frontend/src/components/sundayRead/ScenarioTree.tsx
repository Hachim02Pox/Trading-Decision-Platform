"use client";

import { useMemo, useState } from "react";
import styles from "./ScenarioTree.module.css";

type ScenarioNode = {
  id: string;
  label: string;
  description: string;
  type: string;
  status: "CONFIRMED" | "WATCH" | "PENDING" | "UNKNOWN" | "CONTRADICTED";
  evidence_refs: string[];
  terminal_outcome?: string;
  primary_value?: string;
  as_of?: string;
  measurement_window?: string;
  family_refs?: string[];
  owner?: string;
  role_in_story?: string;
  trigger_condition?: string;
  evidence_gap?: string;
};
type Tree = {
  nodes: ScenarioNode[];
  edges: {
    id?: string;
    from: string;
    to: string;
    label?: string;
    status?: ScenarioNode["status"];
  }[];
};
type Evidence = {
  id: string;
  statement: string;
  epistemic_status: string;
  type: string;
  status: string;
  notes: string;
  source_refs: string[];
};
type Source = { source_id: string; title: string; url: string };
type ScenarioExplanation = {
  id: string;
  title: string;
  summary: string;
  meaning: string;
  waits_for: string[];
  invalidations: string[];
  branch_node_ids: string[];
};
const nodeWidth = 218;
const nodeHeight = 112;
const gapX = 62;
const gapY = 78;

function layout(tree: Tree) {
  const parents = new Map<string, string[]>();
  tree.edges.forEach((edge) =>
    parents.set(edge.to, [...(parents.get(edge.to) ?? []), edge.from]),
  );
  const rank = new Map<string, number>();
  const visit = (id: string): number => {
    if (rank.has(id)) return rank.get(id)!;
    const parentRanks = (parents.get(id) ?? []).map(visit);
    const value = parentRanks.length ? Math.max(...parentRanks) + 1 : 0;
    rank.set(id, value);
    return value;
  };
  tree.nodes.forEach((node) => visit(node.id));
  const groups = new Map<number, ScenarioNode[]>();
  tree.nodes.forEach((node) =>
    groups.set(rank.get(node.id)!, [
      ...(groups.get(rank.get(node.id)!) ?? []),
      node,
    ]),
  );
  const max = Math.max(...[...groups.values()].map((nodes) => nodes.length), 1);
  const positions = new Map<string, { x: number; y: number }>();
  [...groups.entries()].forEach(([level, nodes]) =>
    nodes.forEach((node, index) =>
      positions.set(node.id, {
        x:
          36 +
          index * (nodeWidth + gapX) +
          ((max - nodes.length) * (nodeWidth + gapX)) / 2,
        y: 34 + level * (nodeHeight + gapY),
      }),
    ),
  );
  return {
    positions,
    width: Math.max(680, max * (nodeWidth + gapX) + 72),
    height: Math.max(330, groups.size * (nodeHeight + gapY) + 36),
  };
}
function statusIcon(status: ScenarioNode["status"]) {
  return {
    CONFIRMED: "✓",
    WATCH: "◉",
    PENDING: "○",
    UNKNOWN: "?",
    CONTRADICTED: "×",
  }[status];
}
function statusLabel(status: ScenarioNode["status"], language: "EN" | "FR") {
  const labels = language === "FR"
    ? { CONFIRMED: "CONFIRMÉ", WATCH: "À SURVEILLER", PENDING: "EN ATTENTE", UNKNOWN: "INCONNU", CONTRADICTED: "CONTREDIT" }
    : { CONFIRMED: "CONFIRMED", WATCH: "WATCH", PENDING: "PENDING", UNKNOWN: "UNKNOWN", CONTRADICTED: "CONTRADICTED" };
  return labels[status];
}
function typeLabel(type: string, language: "EN" | "FR") {
  const fr: Record<string, string> = { STATE: "ÉTAT ACTUEL", DRIVER: "MOTEUR", CATALYST: "CATALYSEUR", TRANSMISSION: "TRANSMISSION", CONDITION: "CONDITION", POSITIONING: "POSITIONNEMENT", FUNDING: "FINANCEMENT", OPTIONS: "OPTIONS", ASYMMETRY_GATE: "FILTRE D’ASYMÉTRIE", TERMINAL: "ISSUE DU SCÉNARIO", FACT: "FAIT" };
  return language === "FR" ? fr[type] ?? type : type.replace("_", " ");
}

export function ScenarioTree({
  tree,
  evidence,
  sources,
  scenarioExplanations,
  presentation,
  walkthrough,
  language,
}: {
  tree: Tree;
  evidence: Evidence[];
  sources: Source[];
  scenarioExplanations?: ScenarioExplanation[];
  presentation?: { nodes?: { node_id: string; label: string; description: string }[]; edges?: { edge_id: string; label: string; explanation: string }[] };
  walkthrough?: { intro: string; steps: { id: string; node_refs: string[]; edge_refs?: string[]; text: string }[] };
  language: "EN" | "FR";
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const [interactionActive, setInteractionActive] = useState(false);
  const [zoom, setZoom] = useState(0.88);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [drag, setDrag] = useState<{ x: number; y: number } | null>(null);
  const [mode, setMode] = useState<"tree" | "guided">("tree");
  const [activeStep, setActiveStep] = useState<number | null>(null);
  const nodeCopyById = useMemo(() => new Map((presentation?.nodes ?? []).map((n) => [n.node_id, n])), [presentation]);
  const edgeCopyById = useMemo(() => new Map((presentation?.edges ?? []).map((e) => [e.edge_id, e])), [presentation]);
  const highlightedNodes = activeStep === null ? new Set<string>() : new Set(walkthrough?.steps[activeStep]?.node_refs ?? []);
  const highlightedEdges = activeStep === null ? new Set<string>() : new Set(walkthrough?.steps[activeStep]?.edge_refs ?? []);
  const graph = useMemo(() => layout(tree), [tree]);
  const selectedNode = tree.nodes.find((node) => node.id === selected) ?? null;
  const selectedExplanation = scenarioExplanations?.find((explanation) =>
    selectedNode
      ? explanation.branch_node_ids.includes(selectedNode.id)
      : false,
  );
  const evidenceById = new Map(evidence.map((item) => [item.id, item]));
  const sourceById = new Map(sources.map((item) => [item.source_id, item]));
  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <div>
          <span className={styles.eyebrow}>{language === "FR" ? "SCÉNARIOS" : "SCENARIOS"}</span>
          <h2>{language === "FR" ? "Arbre des scénarios" : "Scenario tree"}</h2>
        </div>
        <div className={styles.controls}>
          <button
            onClick={() => setZoom((value) => Math.max(0.35, value - 0.12))}
          >
            −
          </button>
          <span>{Math.round(zoom * 100)}%</span>
          <button
            onClick={() => setZoom((value) => Math.min(1.8, value + 0.12))}
          >
            +
          </button>
          <button
            onClick={() => {
              setZoom(0.88);
              setOffset({ x: 0, y: 0 });
            }}
          >
            Reset
          </button>
        </div>
      </div>
      {walkthrough?.steps && <div className={styles.modeToggle}><button className={mode === "tree" ? styles.activeMode : ""} onClick={() => setMode("tree")}>{language === "FR" ? "ARBRE" : "TREE"}</button><button className={mode === "guided" ? styles.activeMode : ""} onClick={() => setMode("guided")}>{language === "FR" ? "LECTURE GUIDÉE" : "GUIDED READING"}</button></div>}
      <div className={styles.legend}>
        <span>✓ confirmed</span>
        <span>◉ watch</span>
        <span>○ pending</span>
        <span>? unknown</span>
        <span>× contradicted</span>
        <span>Scroll: zoom · Drag: pan · Click: detail</span>
      </div>
      <div className={mode === "guided" ? styles.guidedLayout : undefined}>
      <div
        className={`${styles.viewport} ${interactionActive ? styles.interactionActive : ""}`}
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === "Escape") setInteractionActive(false);
        }}
        onWheel={(event) => {
          if (!interactionActive) return;
          event.preventDefault();
          setZoom((value) =>
            Math.min(
              1.8,
              Math.max(0.35, value * (event.deltaY < 0 ? 1.1 : 0.9)),
            ),
          );
        }}
        onMouseDown={(event) => {
          setInteractionActive(true);
          if ((event.target as HTMLElement).closest("button")) return;
          setDrag({ x: event.clientX - offset.x, y: event.clientY - offset.y });
        }}
        onMouseMove={(event) =>
          drag &&
          setOffset({ x: event.clientX - drag.x, y: event.clientY - drag.y })
        }
        onMouseUp={() => setDrag(null)}
        onMouseLeave={() => setDrag(null)}
      >
        <div
          className={styles.canvas}
          style={{
            width: graph.width,
            height: graph.height,
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
          }}
        >
          <svg
            width={graph.width}
            height={graph.height}
            className={styles.edges}
            aria-hidden="true"
          >
            {tree.edges.map((edge) => {
              const from = graph.positions.get(edge.from);
              const to = graph.positions.get(edge.to);
              if (!from || !to) return null;
              const mid = (from.y + nodeHeight + to.y) / 2;
              const dashed = ["PENDING", "UNKNOWN"].includes(edge.status ?? "");
              const edgeId = edge.id ?? `${edge.from}-${edge.to}`;
              return (
                <g key={edgeId} className={activeStep !== null && !highlightedEdges.has(edgeId) ? styles.dimmed : highlightedEdges.has(edgeId) ? styles.highlighted : ""}>
                  <path
                    d={`M ${from.x + nodeWidth / 2} ${from.y + nodeHeight} C ${from.x + nodeWidth / 2} ${mid} ${to.x + nodeWidth / 2} ${mid} ${to.x + nodeWidth / 2} ${to.y}`}
                    className={dashed ? styles.dashed : ""}
                  />
                  {(edgeCopyById.get(edgeId)?.label ?? edge.label) && (
                    <text x={(from.x + to.x + nodeWidth) / 2} y={mid - 5}>
                      {edgeCopyById.get(edgeId)?.label ?? edge.label}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
          {tree.nodes.map((node) => {
            const point = graph.positions.get(node.id)!;
            return (
              <button
                key={node.id}
                data-node
                className={`${styles.node} ${styles[node.status.toLowerCase()]} ${node.type === "TERMINAL" ? styles.terminal : ""} ${node.terminal_outcome === "BULLISH" ? styles.terminalBullish : node.terminal_outcome === "BEARISH" ? styles.terminalBearish : node.terminal_outcome === "NO_EDGE" ? styles.terminalNoEdge : node.type === "TERMINAL" ? styles.terminalUnresolved : ""} ${selected === node.id ? styles.selected : ""} ${activeStep !== null && !highlightedNodes.has(node.id) ? styles.dimmed : highlightedNodes.has(node.id) ? styles.highlighted : ""}`}
                style={{ left: point.x, top: point.y }}
                onClick={() =>
                  setSelected(selected === node.id ? null : node.id)
                }
              >
                <span className={styles.type}>
                  {typeLabel(node.type, language)}
                </span>
                <strong>{nodeCopyById.get(node.id)?.label ?? node.label}</strong>
                {node.primary_value && <em>{node.primary_value}</em>}
                <small>
                  {statusIcon(node.status)} {statusLabel(node.status, language)}
                  {node.as_of ? ` · ${node.as_of}` : ""}
                </small>
              </button>
            );
          })}
        </div>
      </div>
      {mode === "guided" && <aside className={styles.walkthrough}>{walkthrough?.steps.map((step, index) => <button key={step.id} onMouseEnter={() => setActiveStep(index)} onFocus={() => setActiveStep(index)} onClick={() => setActiveStep(index)} className={activeStep === index ? styles.activeStep : ""}>{step.text}</button>)}</aside>}
      </div>
      {selectedNode && (
        <aside className={styles.drawer}>
          <button className={styles.close} onClick={() => setSelected(null)}>
            ×
          </button>
          <div className={styles.badges}>
            <span>{typeLabel(selectedNode.type, language)}</span>
            <span>
              {statusIcon(selectedNode.status)} {statusLabel(selectedNode.status, language)}
            </span>
          </div>
          <h3>{selectedNode.label}</h3>
          <p>{selectedNode.description}</p>
          {selectedExplanation && (
            <section className={styles.branchExplanation}>
              <h4>EXPLICATION DU SCÉNARIO</h4>
              <p>
                <b>Résumé</b>
                {selectedExplanation.summary}
              </p>
              <p>
                <b>Ce que cela signifie</b>
                {selectedExplanation.meaning}
              </p>
              <div>
                <b>Attend encore</b>
                <ul>
                  {selectedExplanation.waits_for.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
              <div>
                <b>Invalidations</b>
                <ul>
                  {selectedExplanation.invalidations.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </section>
          )}
          {selectedNode.trigger_condition && (
            <div className={styles.callout}>
              <b>TRIGGER CONDITION</b>
              {selectedNode.trigger_condition}
            </div>
          )}
          {selectedNode.evidence_gap && (
            <div className={styles.callout}>
              <b>EVIDENCE GAP</b>
              {selectedNode.evidence_gap}
            </div>
          )}
          <dl>
            <dt>As-of</dt>
            <dd>{selectedNode.as_of ?? "UNKNOWN"}</dd>
            <dt>Measurement window</dt>
            <dd>{selectedNode.measurement_window ?? "UNKNOWN"}</dd>
            <dt>Families</dt>
            <dd>{selectedNode.family_refs?.join(", ") ?? "UNKNOWN"}</dd>
            <dt>Owner</dt>
            <dd>{selectedNode.owner ?? "UNKNOWN"}</dd>
            <dt>Role</dt>
            <dd>{selectedNode.role_in_story ?? "Scenario node"}</dd>
          </dl>
          <h4>Evidence</h4>
          {selectedNode.evidence_refs.map((id) => {
            const item = evidenceById.get(id);
            return item ? (
              <details key={id}>
                <summary>{item.statement}</summary>
                <p>
                  {item.epistemic_status} · {item.type} · {item.status}
                </p>
                <p>{item.notes}</p>
                {item.source_refs.map((sourceId) => {
                  const source = sourceById.get(sourceId);
                  return source ? (
                    <a
                      key={sourceId}
                      href={source.url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {source.title}
                    </a>
                  ) : null;
                })}
              </details>
            ) : (
              <p key={id}>{id} (unresolved)</p>
            );
          })}
        </aside>
      )}
    </section>
  );
}
