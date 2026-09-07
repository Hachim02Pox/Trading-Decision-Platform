"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { Language } from "@gold-terminal/contracts";

const DIRECTIONAL_COLORING_KEY = "goldTerminal.directionalColoring";
const LANGUAGE_KEY = "goldTerminal.language";
const DEFAULT_LANGUAGE: Language = "EN";

interface SettingsContextValue {
  directionalColoring: boolean;
  setDirectionalColoring: (value: boolean) => void;
  language: Language;
  setLanguage: (value: Language) => void;
}

const SettingsContext = createContext<SettingsContextValue>({
  directionalColoring: true,
  setDirectionalColoring: () => {},
  language: DEFAULT_LANGUAGE,
  setLanguage: () => {},
});

// Product decision: per-KPI directional coloring (VERT/ROUGE/GRIS) is a
// central feature, not an opt-in curiosity — it defaults to ON for every
// new viewer. Only an explicit prior "false" write (someone actually
// turned it off) overrides that default; an absent key is not the same as
// a stored "off".
function readStoredPreference(): boolean {
  try {
    const stored = window.localStorage.getItem(DIRECTIONAL_COLORING_KEY);
    return stored === null ? true : stored === "true";
  } catch {
    return true;
  }
}

function writeStoredPreference(value: boolean): void {
  try {
    window.localStorage.setItem(DIRECTIONAL_COLORING_KEY, String(value));
  } catch {
    // localStorage unavailable (private mode, disabled storage, etc.) —
    // preference simply won't persist across reloads.
  }
}

function readStoredLanguage(): Language {
  try {
    const stored = window.localStorage.getItem(LANGUAGE_KEY);
    return stored === "FR" ? "FR" : DEFAULT_LANGUAGE;
  } catch {
    return DEFAULT_LANGUAGE;
  }
}

function writeStoredLanguage(value: Language): void {
  try {
    window.localStorage.setItem(LANGUAGE_KEY, value);
  } catch {
    // localStorage unavailable — preference simply won't persist across reloads.
  }
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  // Default true/EN on both server and initial client render to avoid a
  // hydration mismatch; the real stored values are applied after mount.
  const [directionalColoring, setDirectionalColoringState] = useState(true);
  const [language, setLanguageState] = useState<Language>(DEFAULT_LANGUAGE);

  useEffect(() => {
    setDirectionalColoringState(readStoredPreference());
    setLanguageState(readStoredLanguage());
  }, []);

  // Keep <html lang="…"> in sync for accessibility/SEO — the initial
  // server-rendered value stays "en" (see app/layout.tsx) until the stored
  // preference is read on mount, matching the same SSR-safe pattern as the
  // rest of this context.
  useEffect(() => {
    document.documentElement.lang = language.toLowerCase();
  }, [language]);

  function setDirectionalColoring(value: boolean) {
    setDirectionalColoringState(value);
    writeStoredPreference(value);
  }

  function setLanguage(value: Language) {
    setLanguageState(value);
    writeStoredLanguage(value);
  }

  return (
    <SettingsContext.Provider
      value={{ directionalColoring, setDirectionalColoring, language, setLanguage }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings(): SettingsContextValue {
  return useContext(SettingsContext);
}
