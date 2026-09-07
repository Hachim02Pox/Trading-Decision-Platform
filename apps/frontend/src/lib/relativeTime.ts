import type { TranslateFn } from "@/i18n/useTranslation";

/**
 * Cockpit-face-safe "in Xd" scheduling label for a future ISO timestamp —
 * used for family-level "Next Events" lists and the KPI-level drawer's
 * next-scheduled-release line (Part C). This is scheduling/calendar
 * language, not the cockpit-face freshness vocabulary (`FreshnessDot`
 * stays relative-age-free per docs/MVP_COCKPIT_CONTRACT.md) — shown only
 * in event lists and the drawer, never as new chrome on the resting face.
 */
export function daysUntilLabel(iso: string, t: TranslateFn): string {
  const ms = new Date(iso).getTime() - Date.now();
  const days = Math.round(ms / 86_400_000);
  if (days <= 0) return t("time.today");
  if (days === 1) return t("time.inOneDay");
  return t("time.inDays", { days: String(days) });
}
