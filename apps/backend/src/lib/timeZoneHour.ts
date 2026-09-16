// Shared DST-aware "current hour in a given IANA timezone" helper — used by
// every ingestion/automation job that gates on a local wall-clock hour
// (America/New_York for F13 calendar ingestion, Night Recap auto-generation,
// etc.) instead of a fixed UTC offset, so results stay correct across the
// EDT/EST transition without any seasonal maintenance.

/** Current hour-of-day (0-23) in `timeZone` for `date`, DST-aware via Intl (never a fixed UTC offset). */
export function hourInTimeZone(date: Date, timeZone: string): number {
  const formatted = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "2-digit",
    hour12: false,
  }).format(date);
  const hour = Number(formatted);
  return hour === 24 ? 0 : hour; // some ICU implementations format midnight as "24"
}

/** Calendar date (YYYY-MM-DD) in `timeZone` for `date` — used to detect "already ran today" across a local midnight, not a UTC one. */
export function calendarDateInTimeZone(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone }).format(date); // en-CA formats as YYYY-MM-DD
}
