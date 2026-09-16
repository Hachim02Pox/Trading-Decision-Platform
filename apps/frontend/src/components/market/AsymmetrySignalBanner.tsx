"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchSundayRead } from "@/lib/api/sundayReadClient";
import { useTranslation } from "@/i18n/useTranslation";
import styles from "./AsymmetrySignalBanner.module.css";

type AsymmetryEdge = "BULLISH" | "BEARISH" | "NO_EDGE" | "UNKNOWN";

interface LatestAsymmetry {
  edge: AsymmetryEdge;
  weekOf: string;
}

// Overnight session 2026-09-16, explicit request: the single most important
// conclusion of Histoire du Marché (its `asymmetry.edge`) used to only ever
// show up in that page's very last section — a reader had to scroll past
// the narrative, all 3 horizons and the entire scenario tree to see it. This
// banner surfaces the SAME field, unedited, at the top of the first page
// instead, with a link into the full reasoning rather than a summary that
// could drift out of sync with it.
function isAsymmetryEdge(value: unknown): value is AsymmetryEdge {
  return value === "BULLISH" || value === "BEARISH" || value === "NO_EDGE" || value === "UNKNOWN";
}

export function AsymmetrySignalBanner() {
  const { t } = useTranslation();
  const [state, setState] = useState<"loading" | "unavailable" | LatestAsymmetry>("loading");

  useEffect(() => {
    let cancelled = false;
    fetchSundayRead()
      .then((read) => {
        if (cancelled) return;
        const record = read as Record<string, unknown>;
        const asymmetry = record.asymmetry as Record<string, unknown> | undefined;
        const meta = record.meta as Record<string, unknown> | undefined;
        const edge = asymmetry?.edge;
        if (isAsymmetryEdge(edge) && typeof meta?.week_of === "string") {
          setState({ edge, weekOf: meta.week_of });
        } else {
          setState("unavailable");
        }
      })
      .catch(() => {
        if (!cancelled) setState("unavailable");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const toneClass =
    state === "loading" || state === "unavailable"
      ? styles.toneNeutral
      : state.edge === "BULLISH"
        ? styles.toneBullish
        : state.edge === "BEARISH"
          ? styles.toneBearish
          : styles.toneNeutral;

  const label =
    state === "loading"
      ? t("asymmetrySignal.loading")
      : state === "unavailable"
        ? t("asymmetrySignal.unavailable")
        : t(
            state.edge === "BULLISH"
              ? "asymmetrySignal.bullish"
              : state.edge === "BEARISH"
                ? "asymmetrySignal.bearish"
                : state.edge === "NO_EDGE"
                  ? "asymmetrySignal.noEdge"
                  : "asymmetrySignal.unknown"
          );

  return (
    <div className={`${styles.banner} ${toneClass}`}>
      <span className={styles.dot} aria-hidden="true" />
      <div className={styles.copy}>
        <span className={styles.label}>{label}</span>
        {typeof state === "object" && (
          <span className={styles.caption}>{t("asymmetrySignal.weekOf", { week: state.weekOf })}</span>
        )}
      </div>
      <Link href="/sunday-read" className={styles.button}>
        {t("asymmetrySignal.button")}
      </Link>
    </div>
  );
}
