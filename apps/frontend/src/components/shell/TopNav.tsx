"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "@/i18n/useTranslation";
import type { TranslationKey } from "@/i18n/en";
import { GyroscopeMark } from "@/components/brand/GyroscopeMark";
import { BRAND_EASTER_EGG_COPY } from "@/components/brand/brandEasterEgg";
import { AccountMenu } from "@/components/shell/AccountMenu";
import styles from "./TopNav.module.css";

interface NavDestination {
  labelKey: TranslationKey;
  href: string;
}

// Order confirmed by Hachim, 2026-09-16 overnight session: Market, Chart,
// Market Story, News, Knowledge, Execution, Journal. Execution moved to
// second-to-last (was 4th).
const NAV_DESTINATIONS: NavDestination[] = [
  { labelKey: "nav.market", href: "/market" },
  { labelKey: "nav.chart", href: "/chart" },
  { labelKey: "nav.sundayRead", href: "/sunday-read" },
  { labelKey: "nav.news", href: "/news" },
  { labelKey: "nav.knowledge", href: "/knowledge" },
  { labelKey: "nav.execution", href: "/execution" },
  { labelKey: "nav.journal", href: "/journal" },
];

export function TopNav() {
  const pathname = usePathname();
  const { t, language } = useTranslation();
  const easterEgg = BRAND_EASTER_EGG_COPY[language];

  return (
    <nav className={styles.bar} aria-label={t("nav.primaryLandmark")}>
      <Link href="/market" className={styles.brand} aria-label="HT Terminal" aria-describedby="ht-easter-egg">
        <GyroscopeMark size={22} />
        <span className={styles.wordmark}>HT</span>
        <span id="ht-easter-egg" className={styles.easterEgg} role="tooltip">
          <strong>{easterEgg.title}</strong>
          <span>{easterEgg.body}</span>
        </span>
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

      <div className={styles.accountSlot}>
        <AccountMenu />
      </div>
    </nav>
  );
}
