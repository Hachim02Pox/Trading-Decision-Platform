"use client";

import { useEffect, useState } from "react";
import type { DisplayRelationship, Language } from "@gold-terminal/contracts";
import { peekOnDemandKpiAnalysis } from "@/lib/api/intelligenceClient";

/**
 * Read-only, zero-cost peek ONLY — never triggers a real analysis. User-
 * explicit absolute rule: no simulated data anywhere in the terminal. The
 * resting KPI badge must never show mock/invented content, but it SHOULD
 * reflect a genuinely real automatic analysis if one has already been run
 * (this session or a prior one — persisted server-side) without waiting for
 * the viewer to open that specific KPI's drawer. This hook mounts on every
 * visible mini-cell and does one cheap read each — safe because it can NEVER
 * fire a real (multi-second, CLI-subprocess-backed) analysis itself; only
 * opening a KPI/family's drawer does that (see useOnDemandKpiAnalysis.ts).
 * A resting badge may therefore lag slightly behind the very latest fetch
 * until its KPI is actually opened — an intentional, cost-safe tradeoff
 * (analyzing every visible KPI just because the mosaic rendered would be
 * unworkable at scale — see onDemandAnalysis.ts's file header).
 */
export function useCachedOnDemandBadge(kpiId: string, language: Language): { finalGoldRead: DisplayRelationship | null } {
  const [finalGoldRead, setFinalGoldRead] = useState<DisplayRelationship | null>(null);

  useEffect(() => {
    let cancelled = false;
    peekOnDemandKpiAnalysis(kpiId, language)
      .then((response) => {
        if (cancelled) return;
        setFinalGoldRead(response.status === "OK" && response.interpretation ? response.interpretation.finalGoldRead : null);
      })
      .catch(() => {
        if (cancelled) return;
        setFinalGoldRead(null);
      });
    return () => {
      cancelled = true;
    };
  }, [kpiId, language]);

  return { finalGoldRead };
}
