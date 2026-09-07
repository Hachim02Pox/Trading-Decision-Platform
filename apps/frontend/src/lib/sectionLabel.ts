import type { TranslateFn } from "@/i18n/useTranslation";
import type { TranslationKey } from "@/i18n/en";

const SECTION_KEYS: Record<string, TranslationKey> = {
  ETF: "section.etf",
  GROWTH: "section.growth",
  LABOR: "section.labor",
  MANAGED_MONEY: "section.managedMoney",
  MICROSTATE: "section.microstate",
  RESERVES: "section.reserves",
  TARGET_RANGE: "section.targetRange",
  TGA: "section.tga",
};

export function localizedSectionLabel(section: string, t: TranslateFn): string {
  const key = SECTION_KEYS[section];
  return key ? t(key) : section;
}
