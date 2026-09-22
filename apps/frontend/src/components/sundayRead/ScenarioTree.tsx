"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./ScenarioTree.module.css";
import { GlossaryText, type GlossaryEntry } from "./GlossaryText";

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
const nodeWidth = 240;
const nodeHeight = 148;
const gapX = 62;
const gapY = 78;

// Analytical labels/ids are sometimes terse internal codes (e.g. "N-ROOT",
// "L2") meant for the reasoning layer, not for a reader. Never show one of
// these as the primary text — fall back to the node's descriptive sentence
// (or hide a code-like edge label entirely) instead.
function looksLikeInternalCode(value: string | undefined): boolean {
  if (!value) return true;
  const trimmed = value.trim();
  if (!trimmed) return true;
  if (/^[A-Z][A-Z0-9]*(-[A-Z0-9]+)+$/.test(trimmed)) return true;
  if (/^[A-Z]\d+$/.test(trimmed)) return true;
  if (/^[A-Z][A-Z0-9_]{1,7}$/.test(trimmed) && !/[a-z]/.test(trimmed)) return true;
  return false;
}

const DICT = {
  FR: {
    explanationHeading: "EXPLICATION DU SCÉNARIO",
    summary: "Résumé",
    meaning: "Ce que cela signifie",
    waitsFor: "Ce qu'on attend encore",
    invalidations: "Invalidations",
    triggerCondition: "CONDITION DE DÉCLENCHEMENT",
    evidenceGap: "LACUNE DE PREUVE",
    evidence: "Preuves",
    unresolved: "non résolu",
    walkthroughIntroFallback: "Ce que raconte ce scénario, étape par étape.",
    whyItMatters: "POURQUOI C'EST IMPORTANT",
    confirmationNeeded: "CE QUI CONFIRMERAIT CE POINT",
  },
  EN: {
    explanationHeading: "SCENARIO EXPLANATION",
    summary: "Summary",
    meaning: "What this means",
    waitsFor: "Still waiting on",
    invalidations: "Invalidations",
    triggerCondition: "TRIGGER CONDITION",
    evidenceGap: "EVIDENCE GAP",
    evidence: "Evidence",
    unresolved: "unresolved",
    walkthroughIntroFallback: "What this scenario tells you, step by step.",
    whyItMatters: "WHY THIS MATTERS",
    confirmationNeeded: "WHAT WOULD CONFIRM THIS",
  },
} as const;

const terminalOutcomeCopy = {
  FR: {
    BULLISH: "Scénario haussier exploitable",
    BEARISH: "Scénario baissier exploitable",
    NO_EDGE: "Pas d'avantage clair pour l'instant",
    UNRESOLVED: "Issue non résolue",
  },
  EN: {
    BULLISH: "Actionable bullish scenario",
    BEARISH: "Actionable bearish scenario",
    NO_EDGE: "No clear edge for now",
    UNRESOLVED: "Outcome not yet resolved",
  },
} as const;

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

// `why_it_matters`/`confirmation_needed`/`display_status`/`display_category`
// are V3-only (GOLD_PRESENTATION_V3_SPEC.md) — the page.tsx V3 adapter maps
// scenario_tree_v3 into this same NodeCopy/EdgeCopy shape (label <-
// display_title, description <- display_body) so this component renders
// both V2 and V3 documents without a structural rewrite; these extra fields
// are simply absent for V2.
type NodeCopy = { node_id: string; label: string; description: string; why_it_matters?: string; confirmation_needed?: string; display_status?: string; display_category?: string };
type EdgeCopy = { edge_id: string; label: string; explanation: string; confirmation_needed?: string };

// Primary card/drawer title for a node: presentation copy first, then a
// generic-but-always-safe human phrase for TERMINAL outcomes, then the
// analytical description (a full sentence per schema) if the analytical
// label itself looks like an internal code, and only then the raw label.
function primaryNodeText(node: ScenarioNode, copy: NodeCopy | undefined, language: "EN" | "FR"): { title: string; subtitle?: string } {
  if (copy?.label) return { title: copy.label, subtitle: copy.description };
  if (node.type === "TERMINAL") {
    const outcome = terminalOutcomeCopy[language][(node.terminal_outcome ?? "UNRESOLVED") as keyof typeof terminalOutcomeCopy["FR"]];
    if (outcome) return { title: outcome, subtitle: !looksLikeInternalCode(node.description) ? node.description : undefined };
  }
  if (looksLikeInternalCode(node.label) && node.description && !looksLikeInternalCode(node.description))
    return { title: node.description };
  return { title: node.label };
}
function primaryEdgeLabel(edge: Tree["edges"][number], copy: EdgeCopy | undefined): string | undefined {
  if (copy?.label) return copy.label;
  if (edge.label && !looksLikeInternalCode(edge.label)) return edge.label;
  return undefined;
}
// Native SVG <title> tooltips only accept plain text, so glossary tokens are
// stripped to their visible text there instead of resolved into a clickable
// popover (which the node drawer / walkthrough panel do support).
function stripGlossaryTokens(text: string | undefined): string | undefined {
  return text?.replace(/\[\[([^|\]]+)\|([^\]]+)\]\]/g, "$2");
}

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
    width: Math.max(320, max * (nodeWidth + gapX) + 72),
    height: Math.max(180, groups.size * (nodeHeight + gapY) + 36),
  };
}

export function ScenarioTree({
  tree,
  evidence,
  sources,
  scenarioExplanations,
  presentation,
  walkthrough,
  glossary,
  language,
}: {
  tree: Tree;
  evidence: Evidence[];
  sources: Source[];
  scenarioExplanations?: ScenarioExplanation[];
  presentation?: { nodes?: NodeCopy[]; edges?: EdgeCopy[] };
  walkthrough?: { intro: string; steps: { id: string; node_refs: string[]; edge_refs?: string[]; text: string }[] };
  glossary?: GlossaryEntry[];
  language: "EN" | "FR";
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const [interactionActive, setInteractionActive] = useState(false);
  const [zoom, setZoom] = useState(0.88);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [drag, setDrag] = useState<{ x: number; y: number } | null>(null);
  const [mode, setMode] = useState<"tree" | "guided">("tree");
  const [activeStep, setActiveStep] = useState<number | null>(null);
  const dict = DICT[language];
  const rich = (text: string | undefined) => <GlossaryText text={text ?? ""} glossary={glossary} language={language} />;
  const nodeCopyById = useMemo(() => new Map((presentation?.nodes ?? []).map((n) => [n.node_id, n])), [presentation]);
  const edgeCopyById = useMemo(() => new Map((presentation?.edges ?? []).map((e) => [e.edge_id, e])), [presentation]);
  const highlightedNodes = activeStep === null ? new Set<string>() : new Set(walkthrough?.steps[activeStep]?.node_refs ?? []);
  const highlightedEdges = activeStep === null ? new Set<string>() : new Set(walkthrough?.steps[activeStep]?.edge_refs ?? []);
  const graph = useMemo(() => layout(tree), [tree]);
  const viewportRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const node = viewportRef.current;
    if (!node) return;
    // React's onWheel is a passive listener, so event.preventDefault() inside
    // it is silently ignored by the browser and the page scrolls anyway.
    // A native, explicitly non-passive listener is the only reliable way to
    // stop the page from scrolling while the mouse is over the diagram.
    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();
      setZoom((value) => Math.min(1.8, Math.max(0.35, value * (event.deltaY < 0 ? 1.1 : 0.9))));
    };
    node.addEventListener("wheel", handleWheel, { passive: false });
    return () => node.removeEventListener("wheel", handleWheel);
  }, []);
  const selectedNode = tree.nodes.find((node) => node.id === selected) ?? null;
  const selectedCopy = selectedNode ? nodeCopyById.get(selectedNode.id) : undefined;
  const selectedText = selectedNode ? primaryNodeText(selectedNode, selectedCopy, language) : null;
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
        ref={viewportRef}
        className={`${styles.viewport} ${interactionActive ? styles.interactionActive : ""}`}
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === "Escape") setInteractionActive(false);
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
              const copy = edgeCopyById.get(edgeId);
              const label = stripGlossaryTokens(primaryEdgeLabel(edge, copy));
              const explanation = stripGlossaryTokens(copy?.explanation);
              // Edge labels used to render as permanent SVG <text>, which
              // overlapped illegibly wherever two edges' midpoints landed
              // close together. The label (and its longer explanation) now
              // surface on hover/focus via a native tooltip instead — the
              // full path is still readable, just without the clutter.
              const tooltip = [label, explanation].filter(Boolean).join(" — ");
              return (
                <g key={edgeId} className={activeStep !== null && !highlightedEdges.has(edgeId) ? styles.dimmed : highlightedEdges.has(edgeId) ? styles.highlighted : ""}>
                  {tooltip && <title>{tooltip}</title>}
                  <path
                    d={`M ${from.x + nodeWidth / 2} ${from.y + nodeHeight} C ${from.x + nodeWidth / 2} ${mid} ${to.x + nodeWidth / 2} ${mid} ${to.x + nodeWidth / 2} ${to.y}`}
                    className={dashed ? styles.dashed : ""}
                  />
                </g>
              );
            })}
          </svg>
          {tree.nodes.map((node) => {
            const point = graph.positions.get(node.id)!;
            const copy = nodeCopyById.get(node.id);
            const text = primaryNodeText(node, copy, language);
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
                <strong>{stripGlossaryTokens(text.title)}</strong>
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
      {mode === "guided" && (
        <aside className={styles.walkthrough}>
          <p className={styles.walkthroughIntro}>{rich(walkthrough?.intro || dict.walkthroughIntroFallback)}</p>
          {walkthrough?.steps.map((step, index) => (
            <button key={step.id} onMouseEnter={() => setActiveStep(index)} onFocus={() => setActiveStep(index)} onClick={() => setActiveStep(index)} className={activeStep === index ? styles.activeStep : ""}>
              {stripGlossaryTokens(step.text)}
            </button>
          ))}
        </aside>
      )}
      </div>
      {selectedNode && selectedText && (
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
          <h3>{selectedText.title}</h3>
          <p>{rich(selectedText.subtitle ?? selectedNode.description)}</p>
          {selectedCopy?.why_it_matters && (
            <div className={styles.callout}>
              <b>{dict.whyItMatters}</b>
              {rich(selectedCopy.why_it_matters)}
            </div>
          )}
          {selectedCopy?.confirmation_needed && (
            <div className={styles.callout}>
              <b>{dict.confirmationNeeded}</b>
              {rich(selectedCopy.confirmation_needed)}
            </div>
          )}
          {selectedExplanation && (
            <section className={styles.branchExplanation}>
              <h4>{dict.explanationHeading}</h4>
              <p>
                <b>{dict.summary}</b>
                {rich(selectedExplanation.summary)}
              </p>
              <p>
                <b>{dict.meaning}</b>
                {rich(selectedExplanation.meaning)}
              </p>
              <div>
                <b>{dict.waitsFor}</b>
                <ul>
                  {selectedExplanation.waits_for.map((item) => (
                    <li key={item}>{rich(item)}</li>
                  ))}
                </ul>
              </div>
              <div>
                <b>{dict.invalidations}</b>
                <ul>
                  {selectedExplanation.invalidations.map((item) => (
                    <li key={item}>{rich(item)}</li>
                  ))}
                </ul>
              </div>
            </section>
          )}
          {selectedNode.trigger_condition && (
            <div className={styles.callout}>
              <b>{dict.triggerCondition}</b>
              {rich(selectedNode.trigger_condition)}
            </div>
          )}
          {selectedNode.evidence_gap && (
            <div className={styles.callout}>
              <b>{dict.evidenceGap}</b>
              {rich(selectedNode.evidence_gap)}
            </div>
          )}
          <h4>{dict.evidence}</h4>
          {selectedNode.evidence_refs.map((id) => {
            const item = evidenceById.get(id);
            return item ? (
              <details key={id}>
                <summary>{stripGlossaryTokens(item.statement)}</summary>
                <p>
                  {item.epistemic_status} · {item.type} · {item.status}
                </p>
                <p>{rich(item.notes)}</p>
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
              <p key={id}>{id} ({dict.unresolved})</p>
            );
          })}
        </aside>
      )}
    </section>
  );
}
