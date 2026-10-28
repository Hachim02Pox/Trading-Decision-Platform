import type { KpiInterpretation, Language } from "@gold-terminal/contracts";

/** Public reads have no generator capability: a missing language/KPI is null. */
export function createCachedInterpretationReader(cache: Readonly<Record<string, KpiInterpretation>>) {
  return async (kpiId: string, language: Language = "EN"): Promise<KpiInterpretation | null> => {
    const key = `${kpiId}::${language}`;
    return Object.prototype.hasOwnProperty.call(cache, key) ? cache[key] : null;
  };
}
