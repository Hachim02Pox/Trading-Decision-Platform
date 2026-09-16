"use client";

import { useCallback, useEffect, useState } from "react";
import type { MarketSnapshot } from "@gold-terminal/contracts";
import { fetchMarketSnapshot } from "@/lib/api/marketClient";
import { FamilyModule } from "@/components/market/FamilyModule";
import { AsymmetrySignalBanner } from "@/components/market/AsymmetrySignalBanner";
import { FAMILY_DISPLAY_ORDER, FAMILY_VISUAL_TIER } from "@/config/familyLayout";
import { useTranslation } from "@/i18n/useTranslation";
import styles from "./page.module.css";

const SKELETON_TILE_COUNT = 6;
const MARKET_REFRESH_INTERVAL_MS = 10 * 60_000;

// Next.js requires useSearchParams() to be wrapped in a Suspense boundary
// during static prerendering (see /login's page.tsx for the same pattern).
export default function MarketPage() {
  return <MarketPageContent />;
}

function MarketPageContent() {
  const [snapshot, setSnapshot] = useState<MarketSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { t, language } = useTranslation();

  const load = useCallback((silent = false) => {
    if (!silent) setLoading(true);
    if (!silent) setError(null);
    fetchMarketSnapshot(language)
      .then((data) => {
        setSnapshot(data);
        if (!silent) setLoading(false);
      })
      .catch((err: unknown) => {
        if (!silent) {
          setError(err instanceof Error ? err.message : "Unknown error");
          setLoading(false);
        }
      });
  }, [language]);

  // Milestone 1E, section 8 — refetch the market snapshot on language
  // change so its language-aware driverSummary/event-title text stays in
  // sync with the selected language.
  useEffect(() => {
    load();
    const intervalId = window.setInterval(() => load(true), MARKET_REFRESH_INTERVAL_MS);
    return () => window.clearInterval(intervalId);
  }, [load]);

  return (
    <div>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>{t("pageTitle.market")}</h1>
      </div>

      <AsymmetrySignalBanner />

      {loading && (
        <div className={styles.grid}>
          {Array.from({ length: SKELETON_TILE_COUNT }).map((_, index) => (
            <div key={index} className={styles.skeletonTile} />
          ))}
        </div>
      )}

      {!loading && error && (
        <div className={styles.errorBox}>
          <span className={styles.errorMessage}>{t("market.failedToLoad", { error })}</span>
          <button type="button" className={styles.retryButton} onClick={() => load()}>
            {t("market.retry")}
          </button>
        </div>
      )}

      {!loading && !error && snapshot && (
        <>
          {/* F13's economic calendar is pulled out of the family mosaic and
              rendered as its own full-width section ABOVE the KPI grid —
              product-owner ask: the calendar should be the first thing seen
              on this page, not wherever F13 happens to fall in
              FAMILY_DISPLAY_ORDER. Still the same FamilyModule (same
              header/freshness-dot/drawer chrome), just moved out of the
              grid's own iteration so it can never end up "below/within"
              the mosaic. */}
          {snapshot.families
            .filter((family) => family.familyId === "F13")
            .map((family) => (
              <div key={family.familyId} className={styles.calendarSection}>
                <FamilyModule family={family} tier={FAMILY_VISUAL_TIER[family.familyId]} />
              </div>
            ))}

          <div className={styles.grid}>
            {[...snapshot.families]
              .filter((family) => family.familyId !== "F13")
              .sort((a, b) => FAMILY_DISPLAY_ORDER.indexOf(a.familyId) - FAMILY_DISPLAY_ORDER.indexOf(b.familyId))
              .map((family) => (
              <FamilyModule
                key={family.familyId}
                family={family}
                tier={FAMILY_VISUAL_TIER[family.familyId]}
              />
              ))}
          </div>
        </>
      )}
    </div>
  );
}
