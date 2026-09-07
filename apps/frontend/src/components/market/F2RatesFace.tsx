"use client";

import type { CanonicalKpi } from "@gold-terminal/contracts";
import { KpiMiniCell } from "./KpiMiniCell";
import styles from "./FamilyModule.module.css";

function firstBpsId(kpis: CanonicalKpi[]): string | undefined {
  return kpis.find((k) => k.unit === "bps")?.id;
}

// Milestone 1E, section 2/14 — F2's compact resting face: 2Y / 10Y / 2s10s
// on the cockpit face (10Y Real and BE10 stay in the drawer), each rendered
// as a KpiMiniCell so it carries value + semantic state + short AI read
// (section 2 explicitly asks this be verified/fixed for F2). Extracted from
// FamilyModule.tsx's former generic `TacticalContent` branch.
export function F2RatesFace({
  kpis,
  directionalColoring,
  onOpenKpi,
}: {
  kpis: CanonicalKpi[];
  directionalColoring: boolean;
  onOpenKpi: (kpiId: string) => void;
}) {
  const bpsId = firstBpsId(kpis);
  return (
    <div className={styles.tacticalBlock}>
      {kpis.map((kpi) => (
        <KpiMiniCell
          key={kpi.id}
          kpi={kpi}
          directionalColoring={directionalColoring}
          sizeClassName={kpi.emphasis ? styles.valuePrimarySize : undefined}
          showBpsHint={kpi.id === bpsId}
          onOpenKpi={onOpenKpi}
        />
      ))}
    </div>
  );
}
