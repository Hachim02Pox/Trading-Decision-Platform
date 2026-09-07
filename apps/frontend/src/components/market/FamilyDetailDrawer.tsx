"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { CanonicalFamilySnapshot } from "@gold-terminal/contracts";
import { useTranslation } from "@/i18n/useTranslation";
import { useFocusTrap } from "@/lib/useFocusTrap";
import { FamilyDrawerView } from "./FamilyDrawerView";
import { KpiDrawerView } from "./KpiDrawerView";
import styles from "./FamilyDetailDrawer.module.css";

// Milestone 1C: the drawer is a two-mode component — family-level (the
// original 6-question view, unchanged) and KPI-level. Both modes live in
// this one shell component; switching modes is just a state change on
// `view`, with a "← Back to family" affordance in KPI mode.
//
// Milestone 1E, section 12/14 — the shell now owns drawer accessibility
// ergonomics: on open, focus moves into the drawer and is trapped there
// (Tab/Shift+Tab cycle within its focusable elements), background scroll is
// locked, the sibling main-content region is hidden from assistive tech via
// aria-hidden, Escape closes (unchanged, verified), and focus is restored
// to whatever triggered the drawer's opening when it closes. The two view
// bodies (FamilyDrawerView, KpiDrawerView) were extracted out for
// maintainability (section 14).
export type DrawerView = { mode: "family" } | { mode: "kpi"; kpiId: string };

interface FamilyDetailDrawerProps {
  family: CanonicalFamilySnapshot;
  view: DrawerView;
  onViewChange: (view: DrawerView) => void;
  onClose: () => void;
}

const APP_SHELL_ID = "app-shell-root";

export function FamilyDetailDrawer({ family, view, onViewChange, onClose }: FamilyDetailDrawerProps) {
  const { t, tFamily } = useTranslation();
  const [mounted, setMounted] = useState(false);
  const panelRef = useFocusTrap(mounted);

  useEffect(() => setMounted(true), []);

  // Escape closes (pre-existing behavior, verified still present).
  useEffect(() => {
    function handleKeyDown(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Lock background scroll while the drawer is open, restored on close.
  useEffect(() => {
    if (!mounted) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mounted]);

  // Hide the main content region from assistive tech while the drawer is
  // open (the drawer itself renders outside that region, as a sibling).
  useEffect(() => {
    if (!mounted) return;
    const appShell = document.getElementById(APP_SHELL_ID);
    if (!appShell) return;
    const previousInert = appShell.inert;
    appShell.setAttribute("aria-hidden", "true");
    appShell.inert = true;
    return () => {
      appShell.removeAttribute("aria-hidden");
      appShell.inert = previousInert;
    };
  }, [mounted]);

  const activeKpiId = view.mode === "kpi" ? view.kpiId : null;
  const activeKpi = activeKpiId ? family.kpis.find((k) => k.id === activeKpiId) : undefined;

  if (!mounted) return null;

  return createPortal(
    <div className={styles.backdrop} onClick={onClose}>
      <div
        ref={panelRef}
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-label={
          view.mode === "kpi"
            ? `${activeKpi?.label ?? "KPI"} ${t("drawer.detailSuffix")}`
            : `${tFamily(family.familyId)} ${t("drawer.detailSuffix")}`
        }
        onClick={(event) => event.stopPropagation()}
      >
        <div className={styles.header}>
          <span className={styles.headerTitle}>
            {view.mode === "kpi" ? `${tFamily(family.familyId)} / ${activeKpi?.label ?? activeKpiId}` : tFamily(family.familyId)}
          </span>
          <button type="button" className={styles.closeButton} onClick={onClose} aria-label={t("drawer.close")}>
            ×
          </button>
        </div>

        {view.mode === "family" ? (
          <FamilyDrawerView family={family} onOpenKpi={(kpiId) => onViewChange({ mode: "kpi", kpiId })} />
        ) : (
          <KpiDrawerView kpiId={view.kpiId} family={family} onBack={() => onViewChange({ mode: "family" })} />
        )}
      </div>
    </div>,
    document.body
  );
}
