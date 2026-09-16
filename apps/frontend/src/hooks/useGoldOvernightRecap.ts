"use client";

import { useEffect, useState } from "react";
import type { GoldOvernightRecap, GoldOvernightRecapStatus, Language } from "@gold-terminal/contracts";
import { fetchCachedGoldOvernightRecap } from "@/lib/api/intelligenceClient";

export type GoldOvernightFetchPhase = "idle" | "checkingCache" | "ready";

export interface UseGoldOvernightRecapResult {
  phase: GoldOvernightFetchPhase;
  status: GoldOvernightRecapStatus | null;
  recap: GoldOvernightRecap | null;
  configuredProviderCount: number;
}

/** Read-only — the Night Recap has no manual trigger (2026-09-15 decision: automation-only, see apps/backend/src/jobs/goldOvernightAutoRecap.ts). */
export function useGoldOvernightRecap(language: Language): UseGoldOvernightRecapResult {
  const [phase, setPhase] = useState<GoldOvernightFetchPhase>("idle");
  const [status, setStatus] = useState<GoldOvernightRecapStatus | null>(null);
  const [recap, setRecap] = useState<GoldOvernightRecap | null>(null);
  const [configuredProviderCount, setConfiguredProviderCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setPhase("checkingCache");
    fetchCachedGoldOvernightRecap(language)
      .then((response) => {
        if (cancelled) return;
        setStatus(response.status);
        setRecap(response.recap);
        setConfiguredProviderCount(response.configuredProviderCount);
        setPhase("ready");
      })
      .catch(() => {
        if (cancelled) return;
        setPhase("ready");
      });
    return () => {
      cancelled = true;
    };
  }, [language]);

  return { phase, status, recap, configuredProviderCount };
}
