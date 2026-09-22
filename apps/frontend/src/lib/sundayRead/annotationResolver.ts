export type V4Annotation = { id: string; locale: "fr" | "en"; path: string; anchor: string; glossary_id: string; occurrence?: number };

export function resolveV4Annotations(text: string, path: string, annotations: V4Annotation[] | undefined, locale: "fr" | "en", glossaryIds: Set<string>) {
  const matches: Array<{ start: number; end: number; annotation: V4Annotation }> = [];
  for (const annotation of (annotations ?? []).filter((item) => item.locale === locale && item.path === path && item.anchor && glossaryIds.has(item.glossary_id))) {
    let occurrence = 0; let start = text.indexOf(annotation.anchor);
    while (start >= 0) { occurrence += 1; if ((annotation.occurrence ?? 1) === occurrence) { matches.push({ start, end: start + annotation.anchor.length, annotation }); break; } start = text.indexOf(annotation.anchor, start + annotation.anchor.length); }
  }
  return matches.sort((a, b) => a.start - b.start || a.end - b.end).filter((match, index, all) => index === 0 || match.start >= all[index - 1].end);
}
