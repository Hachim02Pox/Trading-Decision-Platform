"use client";

import { useEffect, useMemo, useState } from "react";
import type { CalendarDaySummary } from "@gold-terminal/contracts";
import { useSettings } from "@/context/SettingsContext";
import styles from "./FamilyModule.module.css";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4001";

function iso(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function todayUtc(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

const EMPTY_DAY_COPY = {
  EN: "No high-impact USD event this day.",
  FR: "Aucun événement high-impact USD ce jour-là.",
} as const;

const UNAVAILABLE_COPY = {
  EN: "Calendar unavailable.",
  FR: "Calendrier indisponible.",
} as const;

const UNCONFIRMED_COPY = {
  EN: "Data not confirmed yet.",
  FR: "Données non confirmées.",
} as const;

/**
 * Day-detail F13 calendar — one day at a time (High-impact USD only, per
 * product decision 2026-09-14), navigated with day-to-day arrows. Multiple
 * events on the same day render side by side (horizontally), each showing
 * only its name and a plain-language explanation — deliberately NEVER a
 * consensus/forecast/previous number.
 */
export function F13CalendarFace() {
  const { language } = useSettings();
  const [selectedDate, setSelectedDate] = useState(() => todayUtc());
  const [day, setDay] = useState<CalendarDaySummary | null>(null);
  const [error, setError] = useState(false);
  const dateKey = useMemo(() => iso(selectedDate), [selectedDate]);

  useEffect(() => {
    let cancelled = false;
    setDay(null);
    setError(false);
    fetch(`${BACKEND_URL}/api/calendar/day/${dateKey}?lang=${language}`, { cache: "no-store" })
      .then((response) => {
        if (!response.ok) throw new Error("calendar");
        return response.json() as Promise<CalendarDaySummary>;
      })
      .then((data) => {
        if (!cancelled) setDay(data);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [dateKey, language]);

  const shift = (days: number) => setSelectedDate((current) => new Date(current.getTime() + days * 86_400_000));

  return (
    <div className={styles.calendarCompact}>
      <div className={styles.calendarNav}>
        <button type="button" onClick={(event) => { event.stopPropagation(); shift(-1); }} aria-label={language === "FR" ? "Jour précédent" : "Previous day"}>‹</button>
        <span>{new Intl.DateTimeFormat(language === "FR" ? "fr-FR" : "en-US", { weekday: "short", day: "numeric", month: "short" }).format(new Date(`${dateKey}T12:00:00Z`))}</span>
        <button type="button" onClick={(event) => { event.stopPropagation(); shift(1); }} aria-label={language === "FR" ? "Jour suivant" : "Next day"}>›</button>
      </div>

      {error && <span className={styles.quietCaption}>{UNAVAILABLE_COPY[language]}</span>}
      {!error && !day && <span className={styles.quietCaption}>{language === "FR" ? "Chargement du calendrier…" : "Loading calendar…"}</span>}
      {day?.refreshFailed && <span className={styles.quietCaption}>{UNCONFIRMED_COPY[language]}</span>}

      {day && !day.refreshFailed && day.events.length === 0 && (
        <span className={styles.calendarEmptyDay}>{EMPTY_DAY_COPY[language]}</span>
      )}

      {day && day.events.length > 0 && (
        <div className={styles.calendarEventsRow}>
          {day.events.map((event) => (
            <div className={styles.calendarEventCard} key={event.id}>
              <span className={styles.calendarEventName}>{event.name}</span>
              <span className={styles.calendarEventExplanation}>{event.explanation}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
