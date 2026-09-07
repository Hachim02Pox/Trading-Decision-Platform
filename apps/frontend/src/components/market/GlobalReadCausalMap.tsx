"use client";

import { useState } from "react";
import type { GlobalReadCausalGraph } from "@gold-terminal/contracts/dist/globalRead";
import styles from "./GlobalReadSection.module.css";

export function GlobalReadCausalMap({ graph, french }: { graph: GlobalReadCausalGraph; french: boolean }) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const nodes = (kind: "FAMILY" | "DRIVER" | "SCENARIO") => graph.nodes.filter((node) => node.kind === kind);
  const selectedNode = graph.nodes.find((node) => node.id === selected);
  const tr = (fr: string, en: string) => french ? fr : en;
  return <section className={styles.causalMapSection}>
    <button type="button" className={styles.mapToggle} aria-expanded={open} onClick={() => setOpen((value) => !value)}>
      {open ? tr("Fermer la carte macro", "Close macro map") : tr("Ouvrir la carte macro", "Open macro map")}
    </button>
    {open && <div className={styles.causalMap} aria-label={tr("Carte causale macro interactive", "Interactive macro causal map")}>
      <div className={styles.mapLegend}><span>● {tr("Établi", "Established")}</span><span>◇ {tr("Hypothèse", "Hypothesis")}</span><span>! {tr("Contesté", "Contested")}</span></div>
      <p className={styles.statusText}>{graph.changed ? tr("La structure contient des changements depuis la dernière lecture.", "The structure changed since the previous read.") : tr("Aucun changement majeur depuis la dernière lecture.", "No major change since the previous read.")}</p>
      <div className={styles.mapFlow}>
        <div className={styles.mapLane}><span className={styles.groupTitle}>{tr("Familles", "Families")}</span>{nodes("FAMILY").map((node) => <button type="button" className={styles.mapNode} data-status={node.status} onClick={() => setSelected(node.id)} key={node.id}><strong>{node.label}</strong><small>{node.status}</small></button>)}</div>
        <span className={styles.mapArrow} aria-hidden="true">→</span>
        <div className={styles.mapLane}><span className={styles.groupTitle}>{tr("Driver dominant", "Dominant driver")}</span>{nodes("DRIVER").map((node) => <button type="button" className={styles.mapNode} data-status={node.status} onClick={() => setSelected(node.id)} key={node.id}><strong>{node.label}</strong><small>{node.status}</small></button>)}</div>
        <span className={styles.mapArrow} aria-hidden="true">→</span>
        <div className={styles.mapLane}><span className={styles.groupTitle}>{tr("Scénarios", "Scenarios")}</span>{nodes("SCENARIO").map((node) => <button type="button" className={styles.mapNode} data-status={node.status} onClick={() => setSelected(node.id)} key={node.id}><strong>{node.label}</strong><small>{node.status}</small></button>)}</div>
      </div>
      {selectedNode && <aside className={styles.mapDetail} aria-live="polite"><strong>{selectedNode.label}</strong><p>{selectedNode.detail}</p><p>{tr("Preuves", "Evidence")}: {selectedNode.evidenceRefs.join(" · ") || tr("Hypothèse / preuve manquante", "Hypothesis / missing evidence")}</p></aside>}
    </div>}
  </section>;
}
