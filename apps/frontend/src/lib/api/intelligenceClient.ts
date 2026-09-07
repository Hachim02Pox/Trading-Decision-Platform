import type {
  GlobalReadAnalysisResponse,
  GoldOvernightRecapResponse,
  Language,
  OnDemandKpiAnalysisResponse,
} from "@gold-terminal/contracts";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4001";

/**
 * Automatic per-KPI/per-family AI analysis (2026-09) — no more manual
 * trigger. `ensureOnDemandKpiAnalysis` is what a KPI/family's drawer calls on
 * open and then polls while the response's `status` is "PENDING": the
 * backend automatically starts a background analysis whenever the
 * underlying data has changed since the last one (see
 * apps/backend/src/intelligence/onDemandAnalysis.ts), and this same call is
 * how the frontend finds out once it's ready. `peekOnDemandKpiAnalysis` is a
 * pure, NEVER-triggering read — used only by the resting mosaic badge so
 * simply rendering the grid can never itself cause a real CLI call.
 */
export async function ensureOnDemandKpiAnalysis(
  kpiId: string,
  language: Language = "EN"
): Promise<OnDemandKpiAnalysisResponse> {
  const res = await fetch(
    `${BACKEND_URL}/api/intelligence/kpi/${encodeURIComponent(kpiId)}/on-demand?language=${language}`,
    { cache: "no-store" }
  );
  if (!res.ok) throw new Error(`Failed to ensure on-demand analysis for "${kpiId}": ${res.status}`);
  return res.json();
}

export async function peekOnDemandKpiAnalysis(
  kpiId: string,
  language: Language = "EN"
): Promise<OnDemandKpiAnalysisResponse> {
  const res = await fetch(
    `${BACKEND_URL}/api/intelligence/kpi/${encodeURIComponent(kpiId)}/peek?language=${language}`,
    { cache: "no-store" }
  );
  if (!res.ok) throw new Error(`Failed to peek on-demand analysis for "${kpiId}": ${res.status}`);
  return res.json();
}

/**
 * Global Read — the cross-family, 12-step-methodology button. `trigger...`
 * can take up to ~15 minutes for a real run; the plain `fetch` here has no
 * client-side timeout (browsers impose none by default), matching the
 * backend's own disabled request timeout for this route (see server.ts).
 */
export async function fetchCachedGlobalRead(language: Language = "EN"): Promise<GlobalReadAnalysisResponse> {
  const res = await fetch(`${BACKEND_URL}/api/intelligence/global-read/on-demand?language=${language}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to fetch cached Global Read: ${res.status}`);
  return res.json();
}

export async function triggerGlobalRead(language: Language = "EN"): Promise<GlobalReadAnalysisResponse> {
  const res = await fetch(`${BACKEND_URL}/api/intelligence/global-read/analyze?language=${language}`, {
    method: "POST",
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Failed to trigger Global Read: ${res.status}`);
  return res.json();
}

/** Overnight Gold Recap — multi-language web-research briefing, second user-explicit button. */
export async function fetchCachedGoldOvernightRecap(language: Language = "EN"): Promise<GoldOvernightRecapResponse> {
  const res = await fetch(`${BACKEND_URL}/api/intelligence/gold-overnight/on-demand?language=${language}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to fetch cached Overnight Gold Recap: ${res.status}`);
  return res.json();
}

export async function triggerGoldOvernightRecap(language: Language = "EN"): Promise<GoldOvernightRecapResponse> {
  const res = await fetch(`${BACKEND_URL}/api/intelligence/gold-overnight/analyze?language=${language}`, {
    method: "POST",
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Failed to trigger Overnight Gold Recap: ${res.status}`);
  return res.json();
}
