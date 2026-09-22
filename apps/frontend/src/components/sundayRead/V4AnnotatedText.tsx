"use client";

import { useId, useState } from "react";
import styles from "./GlossaryText.module.css";
import type { GlossaryEntry } from "./GlossaryText";
import { resolveV4Annotations, type V4Annotation } from "@/lib/sundayRead/annotationResolver";

export type { V4Annotation } from "@/lib/sundayRead/annotationResolver";

export function V4AnnotatedText({ text, path, annotations, glossary, language }: { text: string; path: string; annotations?: V4Annotation[]; glossary?: GlossaryEntry[]; language: "FR" | "EN" }) {
  const [open, setOpen] = useState<string | null>(null);
  const dialogId = useId();
  const locale = language === "FR" ? "fr" : "en";
  const entries = new Map((glossary ?? []).map((entry) => [entry.id, entry[locale]]));
  const nonOverlapping = resolveV4Annotations(text, path, annotations, locale, new Set(entries.keys()));
  let cursor = 0;
  return <>{nonOverlapping.map((match) => {
    const entry = entries.get(match.annotation.glossary_id)!; const before = text.slice(cursor, match.start); cursor = match.end;
    const isOpen = open === match.annotation.id;
    return <span key={match.annotation.id}>{before}<span className={styles.term}>{match.annotation.anchor}<button type="button" aria-label={language === "FR" ? `Définition : ${entry.term}` : `Definition: ${entry.term}`} aria-expanded={isOpen} aria-controls={dialogId} onClick={() => setOpen(isOpen ? null : match.annotation.id)} onKeyDown={(event) => { if (event.key === "Escape") setOpen(null); }}>i</button>{isOpen && <span id={dialogId} className={styles.popover} role="dialog"><strong>{entry.term}</strong><span>{entry.short_definition}</span>{entry.why_it_matters && <span>{entry.why_it_matters}</span>}{entry.context_here && <span>{entry.context_here}</span>}<button type="button" aria-label={language === "FR" ? "Fermer la définition" : "Close definition"} onClick={() => setOpen(null)}>×</button></span>}</span></span>;
  })}{text.slice(cursor)}</>;
}
