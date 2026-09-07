import type {
  CanonicalFamilySnapshot,
  CanonicalKpi,
  ClaimRecord,
  EventItem,
  FamilyId,
  KpiInterpretation,
  Language,
  ResearchRun,
} from "@gold-terminal/contracts";
import { KPI_CONTEXT_DEPENDENCIES } from "./kpiDependencyMap";
import { claimsForKpi } from "./research/coordinator";

// Backend-internal only — deliberately NOT in packages/contracts. This is
// the assembled "everything the (mock, for now) AI layer would need to
// reason about one KPI" bundle, built strictly from KPI_CONTEXT_DEPENDENCIES
// (Patch 13) rather than any ad hoc runtime decision.
export interface KpiContextPackage {
  kpi: CanonicalKpi;
  siblingKpis: CanonicalKpi[];
  crossFamilyKpis: CanonicalKpi[];
  relevantEvents: Array<{ familyId: FamilyId; nextEvents: EventItem[]; activeCatalyst: EventItem | null | undefined }>;
  claims: ClaimRecord[];
  /**
   * The previous session's interpretation for this KPI, if any — supplied
   * strictly as CONTEXT for identifying what changed, NEVER as an anchor
   * the new interpretation must remain consistent with. See
   * ensemble/runAdjudicator.ts's `PREVIOUS_INTERPRETATION_CONTEXT_RULE` and
   * docs/KPI_INTELLIGENCE_ARCHITECTURE.md. A future real-LLM prompt must
   * carry this instruction literally; the current mock generator
   * demonstrates the principle via `MockScenario.continuity` on the
   * illustrative `f2-10y` KPI rather than reading this field directly.
   */
  previousInterpretation: KpiInterpretation | null;
  /** Milestone 1D — threaded from the request's `?lang=` query param. */
  outputLanguage: Language;
}

export interface ContextPackageBuilderInputs {
  allFamilies: CanonicalFamilySnapshot[];
  researchRun: ResearchRun | null;
  previousInterpretations: Record<string, KpiInterpretation>;
}

function indexKpisById(families: CanonicalFamilySnapshot[]): Map<string, CanonicalKpi> {
  const map = new Map<string, CanonicalKpi>();
  for (const family of families) {
    for (const kpi of family.kpis) map.set(kpi.id, kpi);
  }
  return map;
}

function indexFamiliesById(families: CanonicalFamilySnapshot[]): Map<FamilyId, CanonicalFamilySnapshot> {
  return new Map(families.map((f) => [f.familyId, f]));
}

export class KpiContextPackageBuilder {
  private readonly kpisById: Map<string, CanonicalKpi>;
  private readonly familiesById: Map<FamilyId, CanonicalFamilySnapshot>;
  private readonly researchRun: ResearchRun | null;
  private readonly previousInterpretations: Record<string, KpiInterpretation>;

  constructor(inputs: ContextPackageBuilderInputs) {
    this.kpisById = indexKpisById(inputs.allFamilies);
    this.familiesById = indexFamiliesById(inputs.allFamilies);
    this.researchRun = inputs.researchRun;
    this.previousInterpretations = inputs.previousInterpretations;
  }

  build(kpiId: string, outputLanguage: Language = "EN"): KpiContextPackage | null {
    const kpi = this.kpisById.get(kpiId);
    if (!kpi) return null;

    const deps = KPI_CONTEXT_DEPENDENCIES[kpiId];
    const siblingKpis = (deps?.siblingKpiIds ?? [])
      .map((id) => this.kpisById.get(id))
      .filter((k): k is CanonicalKpi => k !== undefined);
    const crossFamilyKpis = (deps?.crossFamilyKpiIds ?? [])
      .map((id) => this.kpisById.get(id))
      .filter((k): k is CanonicalKpi => k !== undefined);

    const relevantEvents = (deps?.relevantEventFamilies ?? [])
      .map((familyId) => this.familiesById.get(familyId))
      .filter((f): f is CanonicalFamilySnapshot => f !== undefined)
      .map((f) => ({ familyId: f.familyId, nextEvents: f.nextEvents ?? [], activeCatalyst: f.activeCatalyst }));

    const claims = this.researchRun ? claimsForKpi(this.researchRun, kpiId) : [];
    // Continuity lookup is intentionally pinned to the English-keyed
    // previous-session cache (`interpretations` is keyed `${kpiId}::${lang}`
    // — see bootstrap.ts) — it's context for the mock generator, not
    // rendered directly, so it doesn't need a per-language cache of its own.
    const previousInterpretation = this.previousInterpretations[`${kpiId}::EN`] ?? null;

    return { kpi, siblingKpis, crossFamilyKpis, relevantEvents, claims, previousInterpretation, outputLanguage };
  }
}
