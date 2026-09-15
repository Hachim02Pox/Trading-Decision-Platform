"use client";

import { useRef, useState, type KeyboardEvent } from "react";
import type { CanonicalFamilySnapshot, CanonicalKpi } from "@gold-terminal/contracts";
import type { VisualTier } from "@/config/familyLayout";
import { FAMILY_GRID_SPAN_OVERRIDE, TIER_GRID_SPAN, TIER_ORDER } from "@/config/familyLayout";
import { useSettings } from "@/context/SettingsContext";
import { useTranslation, type TranslateFn } from "@/i18n/useTranslation";
import { familyMechanicalRead } from "@/lib/mechanicalRead";
import { localizedSectionLabel } from "@/lib/sectionLabel";
import { KpiMiniCell } from "./KpiMiniCell";
import { F2RatesFace } from "./F2RatesFace";
import { F3FedFace } from "./F3FedFace";
import { F13CalendarFace } from "./F13CalendarFace";
import { EventFamilyFace } from "./EventFamilyFace";
import { F10ParticipationFace } from "./F10ParticipationFace";
import { FreshnessDot } from "./FreshnessDot";
import { RelationshipChip } from "./RelationshipChip";
import { FamilyDetailDrawer, type DrawerView } from "./FamilyDetailDrawer";
import styles from "./FamilyModule.module.css";

interface FamilyModuleProps {
  family: CanonicalFamilySnapshot;
  tier: VisualTier;
}

// Milestone 1C, opt-in only: an explicit deviation from DESIGN.md §3
// ("a module's background never changes to signal state"). When
// Directional Coloring is ON, the whole card MAY also pick up a light tint
// driven by the family's deterministic `mechanicalFamilyRead` (see
// apps/backend/src/intelligence/mechanical/) — never a naive per-KPI vote;
// only KPIs sharing a documented mechanical channel are ever combined. See
// docs/REGLES_MECANIQUES_KPI.md.
const CARD_TINT_CLASS: Record<"SUPPORTIVE" | "ADVERSE" | "CONTEXTUAL", string> = {
  SUPPORTIVE: styles.cardTintSupport,
  ADVERSE: styles.cardTintAdverse,
  CONTEXTUAL: styles.cardTintContextual,
};

function groupBySection(kpis: CanonicalKpi[]): Array<[string | null, CanonicalKpi[]]> {
  const order: Array<string | null> = [];
  const groups = new Map<string | null, CanonicalKpi[]>();
  for (const kpi of kpis) {
    const key = kpi.section ?? null;
    if (!groups.has(key)) {
      groups.set(key, []);
      order.push(key);
    }
    groups.get(key)!.push(kpi);
  }
  return order.map((key) => [key, groups.get(key)!]);
}

function firstBpsId(kpis: CanonicalKpi[]): string | undefined {
  return kpis.find((k) => k.unit === "bps")?.id;
}

function DefaultContent({
  family,
  kpis,
  directionalColoring,
  onOpenKpi,
  t,
}: {
  family: CanonicalFamilySnapshot;
  kpis: CanonicalKpi[];
  directionalColoring: boolean;
  onOpenKpi: (kpiId: string) => void;
  t: TranslateFn;
}) {
  // F8: render the funding microstate as a quiet caption when NORMAL,
  // rather than a prominent row, and hide the raw KPI row for it.
  const microstate = kpis.find((k) => k.id === "f8-funding-microstate");
  const visibleKpis = kpis.filter((k) => k.id !== "f8-funding-microstate");
  const grouped = groupBySection(visibleKpis);
  const bpsId = firstBpsId(visibleKpis);

  return (
    <div className={styles.defaultBlock}>
      {grouped.map(([section, sectionKpis]) => (
        <div key={section ?? "_ungrouped"} className={styles.sectionGroup}>
          {section && <span className={styles.sectionLabel}>{localizedSectionLabel(section, t)}</span>}
          {sectionKpis.map((kpi) => (
            <div key={kpi.id} className={styles.kpiWithBadge}>
              <KpiMiniCell
                kpi={kpi}
                directionalColoring={directionalColoring}
                sizeClassName={kpi.emphasis ? styles.valueEmphasisSecondary : undefined}
                showBpsHint={kpi.id === bpsId}
                onOpenKpi={onOpenKpi}
              />
              {kpi.proxyFor != null && (
                <span className={styles.proxyBadge} title={kpi.proxyFor}>
                  {t("badge.proxy")}
                </span>
              )}
            </div>
          ))}
        </div>
      ))}

      {microstate && microstate.driverSummary === "NORMAL" && (
        <span className={styles.quietCaption}>{t("f8.fundingNormal")}</span>
      )}
      {microstate && microstate.driverSummary === "ANOMALOUS" && (
        <span className={styles.quietCaption}>{t("f8.fundingAnomalous")}</span>
      )}

      {family.kpis[0] && (
        <div className={styles.footer}>
          <RelationshipChip relationship={familyMechanicalRead(family)} />
        </div>
      )}
    </div>
  );
}

function FamilyContent({
  family,
  tier,
  directionalColoring,
  onOpenKpi,
  t,
}: {
  family: CanonicalFamilySnapshot;
  tier: VisualTier;
  directionalColoring: boolean;
  onOpenKpi: (kpiId: string) => void;
  t: TranslateFn;
}) {
  const cockpitKpis = family.kpis.filter((k) => k.visibility === "cockpit");
  const hasEvents = (family.nextEvents && family.nextEvents.length > 0) || family.activeCatalyst !== undefined;
  const isEventOnly = cockpitKpis.length === 0 && hasEvents;

  if (family.familyId === "F13") return <F13CalendarFace />;

  // User-explicit simplification (2026-09): F13 used to get its own
  // real week-strip calendar face (a full Mon..Sun grid with per-event
  // impact badge/time/previous-forecast-actual/countdown) — "trop grand,
  // juste une seule ligne avec juste le nom du truc qui vient, pas de
  // previous etc." F13 now falls through to the exact same generic
  // EventFamilyFace every other event-only family (F9) already uses:
  // one compact line per event (title + "in Xd"), nothing else. The
  // underlying real nextEvents/activeCatalyst data (High-impact, USD+JPY
  // — see real/f13Calendar.ts) is unchanged; only the rendering is gone.
  if (isEventOnly) {
    return <EventFamilyFace family={family} t={t} strip={tier === "strip"} />;
  }

  if (family.familyId === "F3") {
    return (
      <F3FedFace
        kpis={cockpitKpis}
        fedRateDistribution={family.fedRateDistribution}
        directionalColoring={directionalColoring}
        onOpenKpi={onOpenKpi}
      />
    );
  }

  if (family.familyId === "F2") {
    return <F2RatesFace kpis={cockpitKpis} directionalColoring={directionalColoring} onOpenKpi={onOpenKpi} />;
  }

  if (family.familyId === "F10") {
    return <F10ParticipationFace kpis={cockpitKpis} directionalColoring={directionalColoring} onOpenKpi={onOpenKpi} />;
  }

  return <DefaultContent family={family} kpis={cockpitKpis} directionalColoring={directionalColoring} onOpenKpi={onOpenKpi} t={t} />;
}

export function FamilyModule({ family, tier }: FamilyModuleProps) {
  const [drawerView, setDrawerView] = useState<DrawerView | null>(null);
  const { directionalColoring } = useSettings();
  const { t, tFamily } = useTranslation();
  const headerQuality = family.kpis[0]?.quality;
  // Section 12 asks for real <button> elements "wherever practical" in
  // place of `<div role="button">`. The individual KPI mini-cells below
  // (KpiMiniCell) are real <button>s; this outer card, however, WRAPS
  // those buttons to offer a secondary "click anywhere else on the card
  // opens the family drawer" affordance, and HTML forbids nesting
  // interactive controls inside a <button> — so the card itself stays a
  // div with an explicit role/keyboard handling, which is the one
  // deliberate exception to the real-<button> preference in this file.
  const triggerRef = useRef<HTMLDivElement | null>(null);

  const cardTintClass = directionalColoring ? CARD_TINT_CLASS[familyMechanicalRead(family)] : "";

  function openFamilyDrawer() {
    setDrawerView({ mode: "family" });
  }

  function openKpiDrawer(kpiId: string) {
    setDrawerView({ mode: "kpi", kpiId });
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.target !== event.currentTarget) return; // let nested KpiMiniCell buttons handle their own keys
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openFamilyDrawer();
    }
  }

  const gridColumn = FAMILY_GRID_SPAN_OVERRIDE[family.familyId] ?? TIER_GRID_SPAN[tier];

  return (
    <>
      <div
        ref={triggerRef}
        className={`${styles.module} ${cardTintClass}`}
        style={{ gridColumn: `span ${gridColumn}`, ["--tier-order" as string]: TIER_ORDER[tier] }}
        data-tier={tier}
        role="button"
        tabIndex={0}
        onClick={openFamilyDrawer}
        onKeyDown={handleKeyDown}
        aria-haspopup="dialog"
      >
        <div className={styles.header}>
          <span className={styles.title}>{tFamily(family.familyId)}</span>
          {headerQuality && <FreshnessDot quality={headerQuality} familyId={family.familyId} />}
        </div>

        {/* User-explicit simplification (2026-09): no inline family-analysis
            buttons any more. Clicking anywhere on this card (openFamilyDrawer)
            opens FamilyDrawerView, which triggers/displays the automatic
            family-level AI reading itself — see onDemandAnalysis.ts. */}

        <FamilyContent family={family} tier={tier} directionalColoring={directionalColoring} onOpenKpi={openKpiDrawer} t={t} />
      </div>

      {drawerView && (
        <FamilyDetailDrawer
          family={family}
          view={drawerView}
          onViewChange={setDrawerView}
          onClose={() => setDrawerView(null)}
        />
      )}
    </>
  );
}
