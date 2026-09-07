"use client";

import { useEffect, useState } from "react";
import type { ClaimRecord, KpiInterpretation, Language, OnDemandAnalysisStatus } from "@gold-terminal/contracts";
import { ensureOnDemandKpiAnalysis } from "@/lib/api/intelligenceClient";

// Automatic per-KPI/per-family analysis (2026-09) — replaces the old
// manual-button-click flow entirely. Opening a KPI/family's drawer is the
// ONLY thing that ever calls this — mounting it calls the backend's
// "ensure fresh" endpoint, which itself decides (by comparing a content hash
// of the current data against the last analysis) whether to reuse a cached
// read or start a new one in the background. While the backend reports
// "PENDING", this hook polls the same endpoint on an interval; the moment it
// reports "OK", the interpretation is guaranteed to match the CURRENT data
// snapshot exactly — never a stale one silently presented as current.
//
// There is no `trigger()` any more. Nothing here is ever a manual action.

const POLL_INTERVAL_MS = 4_000;

export type OnDemandFetchPhase = "idle" | "loading" | "pending" | "ready";

export interface UseOnDemandKpiAnalysisResult {
  phase: OnDemandFetchPhase;
  status: OnDemandAnalysisStatus | null;
  /** Only trustworthy as "the current read" when `status === "OK"` — see this file's header. */
  interpretation: KpiInterpretation | null;
  evidence: Record<string, ClaimRecord> | null;
  message: string | null;
  configuredProviderCount: number;
}

export function useOnDemandKpiAnalysis(kpiId: string | null, language: Language): UseOnDemandKpiAnalysisResult {
  const [phase, setPhase] = useState<OnDemandFetchPhase>("idle");
  const [status, setStatus] = useState<OnDemandAnalysisStatus | null>(null);
  const [interpretation, setInterpretation] = useState<KpiInterpretation | null>(null);
  const [evidence, setEvidence] = useState<Record<string, ClaimRecord> | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [configuredProviderCount, setConfiguredProviderCount] = useState(0);

  useEffect(() => {
    if (!kpiId) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    function poll(isFirst: boolean) {
      setPhase(isFirst ? "loading" : "pending");
      ensureOnDemandKpiAnalysis(kpiId!, language)
        .then((response) => {
          if (cancelled) return;
          setStatus(response.status);
          setInterpretation(response.interpretation);
          setEvidence(response.evidence);
          setMessage(response.message);
          setConfiguredProviderCount(response.configuredProviderCount);
          if (response.status === "PENDING") {
            setPhase("pending");
            timer = setTimeout(() => poll(false), POLL_INTERVAL_MS);
          } else {
            setPhase("ready");
          }
        })
        .catch(() => {
          if (cancelled) return;
          setStatus("UNAVAILABLE");
          setMessage("Network error contacting the backend.");
          setPhase("ready");
        });
    }

    poll(true);
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [kpiId, language]);

  return { phase, status, interpretation, evidence, message, configuredProviderCount };
}
