"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "@/i18n/useTranslation";
import type { TranslationKey } from "@/i18n/en";
import styles from "./NavRail.module.css";

interface NavDestination {
  labelKey: TranslationKey;
  href: string;
  /** Short compact-width fallback shown at the laptop breakpoint (section 11) — this codebase has no icon set wired up yet (DESIGN.md's Phosphor Icons are not actually installed anywhere), so "icon-only" is approximated with a short glyph-like abbreviation rather than introducing a new icon dependency for this milestone. The full label stays the element's accessible name via aria-label. */
  abbr: string;
}

const NAV_DESTINATIONS: NavDestination[] = [
  { labelKey: "nav.market", href: "/market", abbr: "MKT" },
  { labelKey: "nav.chart", href: "/chart", abbr: "CHT" },
  { labelKey: "nav.execution", href: "/execution", abbr: "EXE" },
  { labelKey: "nav.news", href: "/news", abbr: "NWS" },
  { labelKey: "nav.journal", href: "/journal", abbr: "JNL" },
  { labelKey: "nav.knowledge", href: "/knowledge", abbr: "KNW" },
  { labelKey: "nav.settings", href: "/settings", abbr: "SET" },
];

export function NavRail() {
  const pathname = usePathname();
  const { t } = useTranslation();

  return (
    <nav className={styles.rail} aria-label={t("nav.primaryLandmark")}>
      <div className={styles.brand}>Gold Terminal</div>
      <div className={styles.nav}>
        {NAV_DESTINATIONS.map((destination) => {
          const isActive = pathname?.startsWith(destination.href) ?? false;
          const label = t(destination.labelKey);
          return (
            <Link
              key={destination.href}
              href={destination.href}
              className={isActive ? `${styles.item} ${styles.itemActive}` : styles.item}
              aria-current={isActive ? "page" : undefined}
              aria-label={label}
            >
              <span className={styles.itemLabelFull}>{label}</span>
              <span className={styles.itemLabelShort} aria-hidden="true">
                {destination.abbr}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
