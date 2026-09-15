"use client";

import { useState } from "react";
import styles from "./GlossaryText.module.css";

export type GlossaryLocaleEntry = { term: string; short_definition: string; why_it_matters?: string; context_here?: string };
export type GlossaryEntry = { id: string; fr: GlossaryLocaleEntry; en: GlossaryLocaleEntry };

export function GlossaryText({ text, glossary = [], language }: { text: string; glossary?: GlossaryEntry[]; language: "EN" | "FR" }) {
  const [open, setOpen] = useState<string | null>(null);
  const locale = language === "FR" ? "fr" : "en";
  const entries = new Map(glossary.map((entry) => [entry.id, entry[locale]]));
  const seen = new Set<string>();
  const parts = text.split(/(\[\[[^|\]]+\|[^\]]+\]\])/g);
  return <>{parts.map((part, index) => {
    const match = part.match(/^\[\[([^|\]]+)\|([^\]]+)\]\]$/);
    if (!match) return part;
    const [, id, visible] = match;
    const entry = entries.get(id);
    if (!entry || seen.has(id)) return visible;
    seen.add(id);
    return <span key={`${id}-${index}`} className={styles.term}>
      {visible}<button type="button" aria-label={`Learn about ${visible}`} aria-expanded={open === id} onClick={() => setOpen(open === id ? null : id)}>i</button>
      {open === id && <span className={styles.popover} role="dialog"><strong>{entry.term}</strong><span>{entry.short_definition}</span>{entry.why_it_matters && <span>{entry.why_it_matters}</span>}{entry.context_here && <span>{entry.context_here}</span>}<button type="button" onClick={() => setOpen(null)}>×</button></span>}
    </span>;
  })}</>;
}
