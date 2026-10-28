import type { CanonicalFamilySnapshot, IntelligenceSnapshotResponse, KpiInterpretation, Language } from "@gold-terminal/contracts";

/**
 * Milestone 1E, section 6 — pure builder for the batch
 * `GET /api/intelligence/snapshot` response, factored out of server.ts so it
 * can be unit-tested without spinning up an HTTP server. Includes every
 * currently-available cockpit-visible KPI's interpretation, skipping any KPI
 * the intelligence layer has no interpretation for rather than failing the
 * whole request.
 *
 * Public routes supply bootstrap's cached-only reader. Missing KPI/language
 * entries are omitted without starting provider calls.
 */
export async function buildIntelligenceSnapshot(params: {
  families: CanonicalFamilySnapshot[];
  language: Language;
  dataMode: "DEV_MOCK" | "REAL";
  sessionId: string;
  getInterpretation: (kpiId: string, language: Language) => Promise<KpiInterpretation | null>;
}): Promise<IntelligenceSnapshotResponse> {
  const { families, language, dataMode, sessionId, getInterpretation } = params;

  const cockpitKpiIds: string[] = [];
  for (const family of families) {
    for (const kpi of family.kpis) {
      if (kpi.visibility === "cockpit") cockpitKpiIds.push(kpi.id);
    }
  }

  const entries = await Promise.all(
    cockpitKpiIds.map((kpiId) => getInterpretation(kpiId, language).then((interpretation) => [kpiId, interpretation] as const))
  );

  const interpretations: Record<string, KpiInterpretation> = {};
  for (const [kpiId, interpretation] of entries) {
    if (interpretation) interpretations[kpiId] = interpretation;
  }

  return {
    dataMode,
    sessionId,
    generatedAt: new Date().toISOString(),
    interpretations,
  };
}
