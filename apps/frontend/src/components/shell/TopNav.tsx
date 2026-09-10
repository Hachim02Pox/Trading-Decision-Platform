"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "@/i18n/useTranslation";
import type { TranslationKey } from "@/i18n/en";
import { GyroscopeMark } from "@/components/brand/GyroscopeMark";
import styles from "./TopNav.module.css";

interface NavDestination {
  labelKey: TranslationKey;
  href: string;
}

const NAV_DESTINATIONS: NavDestination[] = [
  { labelKey: "nav.market", href: "/market" },
  { labelKey: "nav.chart", href: "/chart" },
  { labelKey: "nav.execution", href: "/execution" },
  { labelKey: "nav.news", href: "/news" },
  { labelKey: "nav.journal", href: "/journal" },
  { labelKey: "nav.knowledge", href: "/knowledge" },
  { labelKey: "nav.settings", href: "/settings" },
];

export function TopNav() {
  const pathname = usePathname();
  const { t } = useTranslation();

  return (
    <nav className={styles.bar} aria-label={t("nav.primaryLandmark")}>
      <Link href="/market" className={styles.brand} aria-label="Zenith Terminal">
        <GyroscopeMark size={22} />
        <span className={styles.wordmark}>Zenith</span>
      </Link>

      <div className={styles.tabs}>
        {NAV_DESTINATIONS.map((destination) => {
          const isActive = pathname?.startsWith(destination.href) ?? false;
          const label = t(destination.labelKey);
          return (
            <Link
              key={destination.href}
              href={destination.href}
              className={isActive ? `${styles.tab} ${styles.tabActive}` : styles.tab}
              aria-current={isActive ? "page" : undefined}
            >
              {label}
              <span className={styles.underline} aria-hidden="true" />
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
