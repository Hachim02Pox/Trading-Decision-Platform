"use client";

import { useTranslation } from "@/i18n/useTranslation";

interface SparklineProps {
  values: number[];
  width?: number;
  height?: number;
}

// Minimal inline SVG sparkline for a compact numeric series (e.g. F3's
// implied rate path). No charting dependency, per DESIGN.md §14: hairline
// baseline, state-blue overlay line — never `gold`, which is reserved for
// the literal XAUUSD price series only.
export function Sparkline({ values, width = 96, height = 24 }: SparklineProps) {
  const { t } = useTranslation();
  if (values.length < 2) return null;

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const stepX = width / (values.length - 1);

  const points = values
    .map((value, index) => {
      const x = index * stepX;
      const y = height - ((value - min) / range) * height;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  const baselineY = (height / 2).toFixed(1);

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={t("sparkline.impliedRatePath")}
    >
      <line
        x1={0}
        y1={baselineY}
        x2={width}
        y2={baselineY}
        stroke="var(--color-hairline)"
        strokeWidth={1}
      />
      <polyline
        points={points}
        fill="none"
        stroke="var(--color-state-blue)"
        strokeWidth={1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}
