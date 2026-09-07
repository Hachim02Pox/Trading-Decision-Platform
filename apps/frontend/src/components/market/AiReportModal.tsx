"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "@/i18n/useTranslation";
import { useFocusTrap } from "@/lib/useFocusTrap";
import styles from "./AiReportModal.module.css";

interface AiReportModalProps {
  onClose: () => void;
  children: ReactNode;
}

/**
 * Generic overlay for the two large AI briefing sections (Global Read, Gold
 * Overnight Recap) — user-explicit re-layout (2026-09): these used to sit
 * inline above the KPI grid, pushing every family tile down and forcing a
 * scroll even while collapsed; the "petits boutons + fenêtre modale" choice
 * moves them behind two small header buttons instead, so the dashboard's
 * layout never shifts. Reuses the same portal/backdrop/focus-trap pattern as
 * ExternalSourceModal, just sized for a long report instead of a short card.
 */
export function AiReportModal({ onClose, children }: AiReportModalProps) {
  const { t } = useTranslation();
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
      <div ref={panelRef} className={styles.panel} role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
        <button type="button" className={styles.closeButton} onClick={onClose} aria-label={t("drawer.close")}>
          ×
        </button>
        <div className={styles.scrollArea}>{children}</div>
      </div>
    </div>,
    document.body
  );
}
