import type { CanonicalKpi } from "@gold-terminal/contracts";

const DELTA_HINT = /Δ|Today|5D %|1M %|Repricing|Revision/;

/**
 * Whether a KPI represents a change/delta rather than a level, per
 * DESIGN.md §5: "signed values always show their sign explicitly."
 * Deliberately narrow: only fields whose label reads as a delta/change
 * (price moves, WoW/1D/2W deltas, revisions) get a forced sign. Levels
 * (yields, CPI/PCE prints, probabilities, target ranges) are not signed,
 * matching conventional terminal formatting.
 */
export function isSignedField(kpi: Pick<CanonicalKpi, "label" | "unit">): boolean {
  return DELTA_HINT.test(kpi.label);
}

export function formatValue(
  value: number | null,
  decimals: number,
  signed = false
): string {
  if (value === null) return "—";
  const formatted = Math.abs(value).toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  if (value < 0) return `-${formatted}`;
  if (signed && value > 0) return `+${formatted}`;
  return formatted;
}

export function formatKpiValue(kpi: Pick<CanonicalKpi, "value" | "decimals" | "label" | "unit">): string {
  return formatValue(kpi.value, kpi.decimals, isSignedField(kpi));
}
