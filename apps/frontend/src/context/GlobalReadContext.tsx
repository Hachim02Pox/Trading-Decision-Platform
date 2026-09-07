"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useGlobalReadAnalysis, type UseGlobalReadAnalysisResult } from "@/hooks/useGlobalReadAnalysis";
import { useSettings } from "@/context/SettingsContext";

const GlobalReadContext = createContext<UseGlobalReadAnalysisResult | null>(null);

/** Keeps a manual Global Read alive when the trader changes terminal tabs. */
export function GlobalReadProvider({ children }: { children: ReactNode }) {
  const { language } = useSettings();
  const globalRead = useGlobalReadAnalysis(language);
  return <GlobalReadContext.Provider value={globalRead}>{children}</GlobalReadContext.Provider>;
}

export function useGlobalRead(): UseGlobalReadAnalysisResult {
  const context = useContext(GlobalReadContext);
  if (!context) throw new Error("useGlobalRead must be used within GlobalReadProvider.");
  return context;
}
