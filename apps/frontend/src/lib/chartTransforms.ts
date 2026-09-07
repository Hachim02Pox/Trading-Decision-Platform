import type { MacroChartPoint } from "@gold-terminal/contracts";

export interface NormalizedComparisonPoint {
  time: string;
  rawValue: number;
  changePercent: number;
}

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Rebase one non-zero market series to a zero-percent starting point.
 * Invalid observations and zero baselines are rejected instead of guessed.
 */
export function normalizeComparisonPoints(
  points: readonly MacroChartPoint[]
): NormalizedComparisonPoint[] {
  const validPoints = points.filter(
    ({ time, value }) => ISO_DATE_PATTERN.test(time) && Number.isFinite(value)
  );
  const baseline = validPoints[0]?.value;
  if (validPoints.length < 2 || baseline === undefined || baseline === 0) return [];

  return validPoints.map(({ time, value }) => ({
    time,
    rawValue: value,
    changePercent: ((value - baseline) / Math.abs(baseline)) * 100,
  }));
}
