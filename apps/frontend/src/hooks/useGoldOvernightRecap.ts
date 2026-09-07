"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { GoldOvernightRecap, GoldOvernightRecapStatus, Language } from "@gold-terminal/contracts";
import { fetchCachedGoldOvernightRecap, triggerGoldOvernightRecap } from "@/lib/api/intelligenceClient";

export type GoldOvernightFetchPhase = "idle" | "checkingCache" | "analyzing" | "ready";

export interface UseGoldOvernightRecapResult {
  phase: GoldOvernightFetchPhase;
  status: GoldOvernightRecapStatus | null;
  recap: GoldOvernightRecap | null;
  message: string | null;
  configuredProviderCount: number;
  cooldownRemainingMs: number;
  trigger: () => void;
}

export function useGoldOvernightRecap(language: Language): UseGoldOvernightRecapResult {
  const [phase, setPhase] = useState<GoldOvernightFetchPhase>("idle");
  const [status, setStatus] = useState<GoldOvernightRecapStatus | null>(null);
  const [recap, setRecap] = useState<GoldOvernightRecap | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [configuredProviderCount, setConfiguredProviderCount] = useState(0);
  const [cooldownUntil, setCooldownUntil] = useState<number | null>(null);
  const [, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setPhase("checkingCache");
    fetchCachedGoldOvernightRecap(language)
      .then((response) => {
        if (cancelled) return;
        setStatus(response.status);
        setRecap(response.recap);
        setMessage(response.message);
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
    triggerGoldOvernightRecap(language)
      .then((response) => {
        setStatus(response.status);
        setRecap(response.recap ?? recap);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language]);

  const cooldownRemainingMs = cooldownUntil !== null ? Math.max(0, cooldownUntil - Date.now()) : 0;

  return { phase, status, recap, message, configuredProviderCount, cooldownRemainingMs, trigger };
}
