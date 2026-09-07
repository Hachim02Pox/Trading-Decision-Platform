"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "@/i18n/useTranslation";
import { useFocusTrap } from "@/lib/useFocusTrap";
import type { ExternalSourceLink } from "@/content/externalSourceLinks";
import { TradingViewMiniSymbolOverview } from "./TradingViewMiniSymbolOverview";
import styles from "./ExternalSourceModal.module.css";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4001";

interface ExternalSourceModalProps {
  kpiLabel: string;
  link: ExternalSourceLink;
  onClose: () => void;
}

/**
 * NO_SOURCE cards (MOVE, CB Net Buying, Total Gold Demand, Implied Path/
 * Repricing, ISM Services/Manufacturing) never show a value we can't
 * genuinely back — clicking one opens the real external source instead.
 *
 * User-reported: an earlier version of this modal attempted a plain
 * `<iframe src={link.url}>` for every source. Every source actually in use
 * here (gold.org, cmegroup.com, tradingview.com, tradingeconomics.com)
 * sends X-Frame-Options/CSP frame-ancestors headers that block framing
 * their main pages — a browser security behavior no client-side code can
 * override or even reliably detect — so that iframe never rendered
 * anything but a broken-page icon on a large blank rectangle. This modal no
 * longer attempts a direct iframe to the source's own domain for any source.
 *
 * Where a provider separately publishes a genuine, documented embed
 * mechanism of their own (see `ExternalSourceLink.embed` — currently only
 * TradingView's official widget scripts), that renders instead. Where no
 * such widget exists, but the source has a `proxyKey` (user-explicit
 * request, 2026-09: never open a new tab), this loads our own backend's
 * `/api/external-proxy/:key` route in a sandboxed iframe — the backend
 * fetches that one allowlisted page server-side and re-serves it from our
 * origin, so the browser never sees the source's framing block. The sandbox
 * deliberately omits `allow-top-navigation` (so the proxied page's scripts
 * can never navigate this page away) AND `allow-same-origin` (security
 * review, 2026-09: allow-scripts + allow-same-origin together would let the
 * proxied page — fully uncontrolled third-party HTML we don't sanitize —
 * make same-origin fetch() calls straight to our backend's other routes,
 * including the POST analysis triggers, bypassing CORS entirely and
 * invisibly to the user; dropping allow-same-origin makes the iframe an
 * opaque/null origin instead, so any such call is just an ordinary
 * cross-origin request our backend's CORS policy already rejects). Also
 * omits `allow-forms`: not needed for read-only display, and a plain HTML
 * form submission isn't subject to CORS at all, so it would otherwise stay
 * a residual path for that same uncontrolled content to POST straight to
 * our backend's other routes (e.g. the analysis triggers, which have real
 * multi-minute cooldowns) even from a null origin.
 *
 * Sources with neither (currently only CME's FedWatch tool, whose Terms of
 * Use explicitly ban scripted/automated access — a proxy fetch would be
 * exactly that) get a clean, honest "open this on {host}" card instead.
 */
export function ExternalSourceModal({ kpiLabel, link, onClose }: ExternalSourceModalProps) {
  const { t, language } = useTranslation();
  const [mounted, setMounted] = useState(false);
  const panelRef = useFocusTrap(mounted);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    function handleKeyDown(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    if (!mounted) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mounted]);

  if (!mounted) return null;

  return createPortal(
    <div className={styles.backdrop} onClick={onClose}>
      <div
        ref={panelRef}
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-label={`${kpiLabel} — ${link.host}`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className={styles.header}>
          <span className={styles.headerTitle}>
            {kpiLabel} <span className={styles.headerHost}>{link.host}</span>
          </span>
          <button type="button" className={styles.closeButton} onClick={onClose} aria-label={t("drawer.close")}>
            ×
          </button>
        </div>
        {link.embed ? (
          <div className={styles.embedCard}>
            <TradingViewMiniSymbolOverview symbol={link.embed.symbol} language={language} />
            <a className={styles.openNewTabSmall} href={link.url} target="_blank" rel="noopener noreferrer">
              {t("externalSource.openNewTab")} — {link.host} ↗
            </a>
          </div>
        ) : link.proxyKey ? (
          <div className={styles.embedCard}>
            <iframe
              className={styles.proxyFrame}
              src={`${BACKEND_URL}/api/external-proxy/${link.proxyKey}`}
              sandbox="allow-scripts allow-popups"
              title={`${kpiLabel} — ${link.host}`}
            />
            <a className={styles.openNewTabSmall} href={link.url} target="_blank" rel="noopener noreferrer">
              {t("externalSource.openNewTab")} — {link.host} ↗
            </a>
          </div>
        ) : (
          <div className={styles.openExternalCard}>
            <p className={styles.noticeBar}>{t("externalSource.notice")}</p>
            <a className={styles.openNewTabLarge} href={link.url} target="_blank" rel="noopener noreferrer">
              {t("externalSource.openNewTab")} — {link.host} ↗
            </a>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
