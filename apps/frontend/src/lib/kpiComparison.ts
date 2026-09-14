export type KpiChange = { direction: "up" | "down" | "flat"; absolute: number; percent: number | null };

export function calculateKpiChange(previous: number, current: number): KpiChange {
  const absolute = current - previous;
  return {
    direction: absolute > 0 ? "up" : absolute < 0 ? "down" : "flat",
    absolute,
    percent: previous === 0 ? null : (absolute / Math.abs(previous)) * 100,
  };
}

export function formatComparisonValue(value: number, maximumFractionDigits = 3): string {
  return new Intl.NumberFormat("fr-FR", { maximumFractionDigits, minimumFractionDigits: 0 }).format(value);
}
