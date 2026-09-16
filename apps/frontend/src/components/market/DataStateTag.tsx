"use client";

import type { MarketDataState, UnavailableReason } from "@gold-terminal/contracts";
import { useTranslation } from "@/i18n/useTranslation";
import styles from "./FamilyModule.module.css";

interface DataStateTagProps {
  dataState: MarketDataState;
  /** Only consulted when `dataState === "UNAVAILABLE"`. Missing/undefined falls back to the FETCH_FAILED (attention-drawing) treatment — the safer default when a KPI's real reason wasn't threaded through for some reason. */
  unavailableReason?: UnavailableReason;
  /**
   * Set when the caller already resolved an `ExternalSourceLink` for this
   * KPI (see content/externalSourceLinks.ts) and wired its click handler to
   * open it. Overnight session 2026-09-16, Hachim's explicit request for
   * F12 (Central Bank Net Buying / Total Gold Demand): a plain dead "—" or
   * "Indisponible" badge doesn't communicate that clicking the card opens
   * gold.org — replaced with an actionable "Click to view" label instead.
   */
  hasExternalLink?: boolean;
}

const CLASS_BY_STATE: Record<MarketDataState, string> = {
  REAL: "dataStateTagReal",
  MOCK: "dataStateTagMock",
  UNAVAILABLE: "dataStateTagUnavailable",
};

// User-facing REAL/MOCK/UNAVAILABLE distinction the user explicitly asked
// for ("réel" vs "fictif"): an always-visible text tag next to EVERY
// cockpit KPI value, in every family — including families that are still
// 100% mock (F6/F11/F13), never just a color or a dot that requires
// knowing a color code. Shared by every cockpit face that renders a raw KPI
// value outside of KpiMiniCell (F3FedFace's target range) so the label
// vocabulary/styling never drifts between call sites.
//
// UNAVAILABLE now splits into two visually distinct treatments (accuracy/
// UX pass): NO_SOURCE (no free public source exists for this KPI at all,
// by design — a permanent, expected gap, e.g. the MOVE index) renders quiet
// and non-alarming — no bordered badge, just a plain em-dash — since there
// is nothing to fix and nothing that will "come back." FETCH_FAILED (a
// real source exists and is normally wired, but this attempt failed) keeps
// the existing bordered "N/A"/"INDISP." badge, since it is a genuine,
// potentially-transient problem worth flagging. Both get the same "i"
// info-affordance convention already used elsewhere (KpiMiniCell's
// driverSummary icon, FreshnessDot's STALE explanation) so hovering either
// always explains which case applies, in the user's selected language.
export function DataStateTag({ dataState, unavailableReason, hasExternalLink }: DataStateTagProps) {
  const { t } = useTranslation();

  if (dataState === "UNAVAILABLE" && hasExternalLink) {
    return <span className={styles.dataStateLink}>{t("dataState.clickToView")}</span>;
  }

  if (dataState === "UNAVAILABLE" && unavailableReason === "NO_SOURCE") {
    return (
      <span className={styles.dataStateQuiet}>
        <span aria-hidden="true">—</span>
        <span className={styles.infoAffordance} title={t("dataState.noSourceTooltip")} aria-label={t("dataState.noSourceTooltip")}>
          i
        </span>
      </span>
    );
  }

  const label = dataState === "REAL" ? t("dataState.real") : dataState === "MOCK" ? t("dataState.mock") : t("dataState.unavailable");
  const unavailableTooltip = dataState === "UNAVAILABLE" ? t("dataState.fetchFailedTooltip") : null;

  return (
    <span className={styles.dataStateTagWrapper}>
      <span className={`${styles.dataStateTag} ${styles[CLASS_BY_STATE[dataState]]}`}>{label}</span>
      {unavailableTooltip && (
        <span className={styles.infoAffordance} title={unavailableTooltip} aria-label={unavailableTooltip}>
          i
        </span>
      )}
    </span>
  );
}
