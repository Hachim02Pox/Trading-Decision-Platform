import type { CanonicalFamilySnapshot, IntelligenceSnapshotResponse, KpiInterpretation, Language } from "@gold-terminal/contracts";

/**
 * Milestone 1E, section 6 — pure builder for the batch
 * `GET /api/intelligence/snapshot` response, factored out of server.ts so it
 * can be unit-tested without spinning up an HTTP server. Includes every
 * currently-available cockpit-visible KPI's interpretation, skipping any KPI
 * the intelligence layer has no interpretation for rather than failing the
 * whole request.
 *
 * Async since the real intelligence pilot: `getInterpretation` may now
 * involve genuine network calls for the 5 pilot KPIs (see bootstrap.ts).
 * All KPIs are resolved concurrently via Promise.all — the vast majority
 * (mock) resolve instantly either way, and concurrency for the real ones is
 * already bounded by bootstrap.ts's shared ConcurrencyLimiter, so nothing
 * extra needs bounding here.
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
