"use client";

import type { CanonicalFamilySnapshot } from "@gold-terminal/contracts";
import type { TranslateFn } from "@/i18n/useTranslation";
import { daysUntilLabel } from "@/lib/relativeTime";
import styles from "./FamilyModule.module.css";

function EventListBlock({
  title,
  events,
  t,
}: {
  title: string;
  events: { id: string; title: string; scheduledAt: string }[];
  t: TranslateFn;
}) {
  if (events.length === 0) return null;
  return (
    <div className={styles.eventBlock}>
      <span className={styles.sectionLabel}>{title}</span>
      <ul className={styles.eventList}>
        {events.slice(0, 3).map((event) => (
          <li key={event.id} className={styles.eventItem}>
            <span className={styles.eventTitle}>{event.title}</span>
            <span className={styles.eventWhen}>{daysUntilLabel(event.scheduledAt, t)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// Milestone 1E, section 3/14 — shared event-only rendering for F9 and F13,
// extracted from FamilyModule.tsx's former inline `EventOnlyContent`. F13
// additionally opts into `strip`: a compact, full-width horizontal band
// (Next Events + Active Catalyst laid out side by side) instead of a
// square-ish card, via the `.stripLayout` modifier class — presentation
// only, the underlying nextEvents/activeCatalyst data model is unchanged.
export function EventFamilyFace({
  family,
  t,
  strip = false,
}: {
  family: CanonicalFamilySnapshot;
  t: TranslateFn;
  strip?: boolean;
}) {
  const nextEvents = family.nextEvents ?? [];
  const hasCatalystField = family.activeCatalyst !== undefined;

  return (
    <div className={strip ? styles.stripLayout : styles.eventOnlyBlock}>
      <EventListBlock title={t("eventBlock.nextEvents")} events={nextEvents} t={t} />
      {hasCatalystField && (
        <div className={styles.eventBlock}>
          <span className={styles.sectionLabel}>{t("drawer.activeCatalyst")}</span>
          {family.activeCatalyst ? (
            <div className={styles.eventItem}>
              <span className={styles.eventTitle}>{family.activeCatalyst.title}</span>
            </div>
          ) : (
            <span className={styles.catalystNone}>{t("drawer.catalystNone")}</span>
          )}
        </div>
      )}
    </div>
  );
}
