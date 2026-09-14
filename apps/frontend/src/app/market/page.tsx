"use client";

import { useCallback, useEffect, useState } from "react";
import type { MarketSnapshot } from "@gold-terminal/contracts";
import { fetchMarketSnapshot } from "@/lib/api/marketClient";
import { FamilyModule } from "@/components/market/FamilyModule";
import { GlobalReadSection } from "@/components/market/GlobalReadSection";
import { AiReportModal } from "@/components/market/AiReportModal";
import { useGlobalRead } from "@/context/GlobalReadContext";
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
  const [showGlobalRead, setShowGlobalRead] = useState(false);
  const { t, language } = useTranslation();
  const globalRead = useGlobalRead();

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
        <div className={styles.aiTriggers}>
          <button type="button" className={styles.aiTriggerButton} onClick={() => setShowGlobalRead(true)}>
            {t("globalRead.title")}
          </button>
        </div>
      </div>

      {showGlobalRead && (
        <AiReportModal onClose={() => setShowGlobalRead(false)}>
          <GlobalReadSection globalRead={globalRead} />
        </AiReportModal>
      )}

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

          {/* User-explicit re-layout (2026-09, second pass): the two AI
              briefing sections — Overnight Gold Recap and Global Read (the
              single most important feature: the fixed 12-step cross-family
              methodology) — no longer render inline here at all. They used
              to sit right above this grid, which pushed every family tile
              down and forced a scroll even while collapsed. They now live
              behind the two small buttons in the page header above, opened
              in `AiReportModal` — the grid's layout never shifts regardless
              of whether either report exists/is open. Still both
              manual-click-ONLY, both strictly separate from the per-KPI/
              per-family on-demand buttons inside the mosaic. */}

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
