import type { CanonicalKpi, Language } from "@gold-terminal/contracts";
import type { TranslateFn } from "@/i18n/useTranslation";
import { KPI_CADENCE } from "./kpiCadence";

const LOCALE_BY_LANGUAGE: Record<Language, string> = { EN: "en-US", FR: "fr-FR" };
const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;
const RECENT_WEEKDAY_WINDOW_MS = 6 * DAY_MS;

function formatDateOnly(iso: string, language: Language): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  try {
    return new Intl.DateTimeFormat(LOCALE_BY_LANGUAGE[language], { dateStyle: "medium" }).format(date);
  } catch {
    return iso;
  }
}

function formatWeekday(iso: string, language: Language): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  try {
    return new Intl.DateTimeFormat(LOCALE_BY_LANGUAGE[language], { weekday: "long" }).format(date);
  } catch {
    return iso;
  }
}

/**
 * BLS/BEA monthly series carry a reference month, not a release timestamp.
 * The backend represents that month as its final UTC day for correct
 * cadence math; UI must never relabel that internal anchor as a publication
 * date.
 */
export function formatMonthlyReferencePeriod(observationAtIso: string, language: Language): string {
  const date = new Date(observationAtIso);
  if (Number.isNaN(date.getTime())) return observationAtIso;
  try {
    return new Intl.DateTimeFormat(LOCALE_BY_LANGUAGE[language], {
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    }).format(date);
  } catch {
    return observationAtIso;
  }
}

/** "Data as of [jour]" within the last 6 days, else "Data as of [date]" — same convention for either cadence bucket that falls through to an as-of-date label. */
function dataAsOfLabel(observationAtIso: string, language: Language, t: TranslateFn): string {
  const ageMs = Date.now() - new Date(observationAtIso).getTime();
  if (ageMs >= 0 && ageMs <= RECENT_WEEKDAY_WINDOW_MS) {
    return t("freshness.dataAsOfDay", { day: formatWeekday(observationAtIso, language) });
  }
  return t("freshness.dataAsOfDate", { date: formatDateOnly(observationAtIso, language) });
}

/**
 * Cadence-aware freshness text for a REAL KPI. "Live" was removed entirely
 * (user-reported bug): NOTHING in this codebase is a genuine streaming/
 * websocket feed — every source, including the "daily"-cadence ones (DXY,
 * yields, VIX...), is polled at most once an hour. Showing "Live" for the
 * ~60s right after a poll implied the value ticks continuously, when in
 * reality it will not change again until the next hourly poll — an honest
 * label can only ever say "Updated X ago" or "Data as of [date]", never
 * imply real-time motion that isn't actually happening.
 *
 * "daily"-cadence KPIs (intraday-refreshed reference values: yields, DXY,
 * VIX, credit spreads, GVZ, funding spreads, TGA, GLD holdings) are judged
 * against `retrievedAt` — how long ago THIS backend actually re-fetched the
 * value. Once that gap exceeds a day (the poll has clearly stopped
 * refreshing, e.g. a market-closed weekend or an outage), this falls back
 * to the as-of-date label instead of an alarming "3,412 min ago".
 *
 * "weekly"/"monthly" KPIs (discrete official releases: CPI, NFP, COT,
 * Reserves, Treasury auctions, QRA) always use the as-of-date label —
 * these never "tick," so a relative-time counter would misrepresent a
 * monthly print as something that just changed.
 */
export function formatKpiFreshness(kpi: CanonicalKpi, language: Language, t: TranslateFn): string {
  const cadence = KPI_CADENCE[kpi.id] ?? "daily";
  return formatFreshnessFromTimestamps(kpi.observationAt, kpi.retrievedAt, cadence, language, t);
}

/**
 * Same cadence-aware freshness logic as `formatKpiFreshness`, for values
 * that aren't a `CanonicalKpi` — e.g. F3's `fedRateDistribution`, a
 * family-level structured field with its own `observationAt`/`retrievedAt`
 * but no KPI id to look up in `KPI_CADENCE`. Callers pass the cadence
 * bucket that actually matches the source's own publish rhythm.
 */
export function formatFreshnessFromTimestamps(
  observationAtIso: string,
  retrievedAtIso: string,
  cadence: "daily" | "weekly" | "monthly",
  language: Language,
  t: TranslateFn
): string {
  if (cadence !== "daily") {
    if (cadence === "monthly") return t("freshness.referencePeriod", { period: formatMonthlyReferencePeriod(observationAtIso, language) });
    return dataAsOfLabel(observationAtIso, language, t);
  }

  const retrievedMs = Date.now() - new Date(retrievedAtIso).getTime();
  if (!Number.isFinite(retrievedMs) || retrievedMs < 0) return dataAsOfLabel(observationAtIso, language, t);
  if (retrievedMs < MINUTE_MS) return t("freshness.updatedSecondsAgo");
  if (retrievedMs < HOUR_MS) return t("freshness.updatedMinutesAgo", { n: String(Math.max(1, Math.round(retrievedMs / MINUTE_MS))) });
  if (retrievedMs < DAY_MS) return t("freshness.updatedHoursAgo", { n: String(Math.max(1, Math.round(retrievedMs / HOUR_MS))) });
  return dataAsOfLabel(observationAtIso, language, t);
}
