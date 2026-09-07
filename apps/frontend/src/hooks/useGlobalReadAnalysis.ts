"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { GlobalReadAnalysisStatus, GlobalReadInterpretation, Language } from "@gold-terminal/contracts";
import { fetchCachedGlobalRead, triggerGlobalRead } from "@/lib/api/intelligenceClient";

// Global Read — the single most important on-demand feature (user's own
// words). Manual-click-ONLY, same "cache-check on mount is free, trigger is
// the only thing that ever costs anything" contract as
// useOnDemandKpiAnalysis.ts, but a real run can take up to ~15 minutes
// (see backend/src/intelligence/globalReadAnalysis.ts) — the "analyzing"
// phase here is expected to last far longer than the per-KPI button's.

export type GlobalReadFetchPhase = "idle" | "checkingCache" | "analyzing" | "ready";

export interface UseGlobalReadAnalysisResult {
  phase: GlobalReadFetchPhase;
  status: GlobalReadAnalysisStatus | null;
  interpretation: GlobalReadInterpretation | null;
  message: string | null;
  configuredProviderCount: number;
  cooldownRemainingMs: number;
  trigger: () => void;
}

export function useGlobalReadAnalysis(language: Language): UseGlobalReadAnalysisResult {
  const [phase, setPhase] = useState<GlobalReadFetchPhase>("idle");
  const [status, setStatus] = useState<GlobalReadAnalysisStatus | null>(null);
  const [interpretation, setInterpretation] = useState<GlobalReadInterpretation | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [configuredProviderCount, setConfiguredProviderCount] = useState(0);
  const [cooldownUntil, setCooldownUntil] = useState<number | null>(null);
  const [, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setPhase("checkingCache");
    fetchCachedGlobalRead(language)
      .then((response) => {
        if (cancelled) return;
        setStatus(response.status);
        setInterpretation(response.interpretation);
        setMessage(response.message);
        setConfiguredProviderCount(response.configuredProviderCount);
        setPhase("ready");
      })
      .catch(() => {
        if (cancelled) return;
        setStatus("UNAVAILABLE");
        setMessage("Network error while reading the cached Global Read.");
        setPhase("ready");
      });
    return () => {
      cancelled = true;
    };
  }, [language]);

  useEffect(() => {
    if (cooldownUntil === null) return;
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [cooldownUntil]);

  const inFlight = useRef(false);

  const trigger = useCallback(() => {
    if (inFlight.current) return;
    inFlight.current = true;
    setPhase("analyzing");
    triggerGlobalRead(language)
      .then((response) => {
        setStatus(response.status);
        setInterpretation((current) => response.interpretation ?? current);
        setMessage(response.message);
        setConfiguredProviderCount(response.configuredProviderCount);
        if (response.status === "OK") {
          setCooldownUntil(null);
        } else if (response.status === "COOLDOWN" && response.cooldownRemainingMs !== null) {
          setCooldownUntil(Date.now() + response.cooldownRemainingMs);
        }
      })
      .catch(() => {
        setStatus("UNAVAILABLE");
        setMessage("Network error contacting the backend.");
      })
      .finally(() => {
        inFlight.current = false;
        setPhase("ready");
      });
  }, [language]);

  const cooldownRemainingMs = cooldownUntil !== null ? Math.max(0, cooldownUntil - Date.now()) : 0;

  return { phase, status, interpretation, message, configuredProviderCount, cooldownRemainingMs, trigger };
}
