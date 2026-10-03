export const learningTabs = [
  "La lecture",
  "Ce qui a changé",
  "Arbre de scénarios",
  "Les forces en jeu",
  "Comprendre",
] as const;
export type LearningTab = (typeof learningTabs)[number];
export type LearningDepth = "simple" | "deep";
export function learningAvailability(state: {
  learning_experience?: unknown;
  learning_experience_status?: string;
}): "AVAILABLE" | "ABSENT" | "UNSUPPORTED_VERSION" {
  if (state.learning_experience_status === "UNSUPPORTED_VERSION")
    return "UNSUPPORTED_VERSION";
  if (!state.learning_experience) return "ABSENT";
  return (state.learning_experience as { version?: unknown }).version === "1.0"
    ? "AVAILABLE"
    : "UNSUPPORTED_VERSION";
}
export function retainLearningSelection(
  selected: string | null,
  items: readonly { id: string }[],
): string | null {
  return items.some((item) => item.id === selected)
    ? selected
    : (items[0]?.id ?? null);
}
export function learningDate(value: string | null | undefined): string {
  if (!value) return "Date indisponible";
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : `${new Intl.DateTimeFormat("fr-FR", { timeZone: "America/New_York", dateStyle: "long", timeStyle: "short" }).format(date)} · New York`;
}
export const learningRelationLabels: Record<string, string> = {
  SUPPORTS: "Soutient",
  OPPOSES: "S’oppose",
  CONDITIONAL: "Lien conditionnel",
  SHARED_DRIVER: "Moteur commun",
};
