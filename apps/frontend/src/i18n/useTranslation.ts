"use client";

import { useSettings } from "@/context/SettingsContext";
import { en, type TranslationKey } from "./en";
import { fr } from "./fr";
import type { FamilyId } from "@gold-terminal/contracts";

const DICTIONARIES = { EN: en, FR: fr } as const;

function interpolate(template: string, vars?: Record<string, string>): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (match, key: string) => (key in vars ? vars[key] : match));
}

export interface TranslateFn {
  (key: TranslationKey, vars?: Record<string, string>): string;
}

/**
 * Deterministic frontend i18n. Returns `t(key)` reading the current
 * language's dictionary (`SettingsContext.language`) plus `tFamily(id)` for
 * the translatable family display-name lookup. Never used for KPI `label`
 * values from canonical backend data — those render exactly as sent, in
 * either language, per docs/KPI_INTELLIGENCE_ARCHITECTURE.md section (a).
 */
export function useTranslation(): { t: TranslateFn; tFamily: (familyId: FamilyId) => string; language: "EN" | "FR" } {
  const { language } = useSettings();
  const dictionary = DICTIONARIES[language];

  function t(key: TranslationKey, vars?: Record<string, string>): string {
    return interpolate(dictionary[key], vars);
  }

  function tFamily(familyId: FamilyId): string {
    return t(`family.${familyId}` as TranslationKey);
  }

  return { t, tFamily, language };
}
