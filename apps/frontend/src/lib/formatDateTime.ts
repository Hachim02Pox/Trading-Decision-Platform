import type { Language } from "@gold-terminal/contracts";

const LOCALE_BY_LANGUAGE: Record<Language, string> = { EN: "en-US", FR: "fr-FR" };

/**
 * Milestone 1E, section 10 — locale-aware human-reading presentation of an
 * ISO timestamp, keyed to the current UI language. Never replaces the exact
 * ISO string anywhere it currently exists for audit purposes (Data
 * Status/audit footers keep printing the raw ISO verbatim) — this is a
 * friendlier PARALLEL presentation for places where a timestamp is shown
 * primarily for human reading (e.g. the KPI drawer header's "Analyzed at").
 * Callers should also surface the exact ISO string as a `title` attribute
 * for hover.
 */
export function formatReadableDateTime(iso: string, language: Language): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  try {
    return new Intl.DateTimeFormat(LOCALE_BY_LANGUAGE[language], {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(date);
  } catch {
    return iso;
  }
}
