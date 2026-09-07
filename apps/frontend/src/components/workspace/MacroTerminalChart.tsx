"use client";

import { memo, useEffect, useMemo, useState, type KeyboardEvent, type PointerEvent } from "react";
import { useTranslation } from "@/i18n/useTranslation";
import {
  fetchMacroChart,
  type MacroChartInstrumentId,
  type MacroChartPoint,
  type MacroChartRange,
  type MacroChartResponse,
} from "@/lib/api/marketClient";
import styles from "./Workspace.module.css";

interface MacroTerminalChartProps {
  instrumentId: MacroChartInstrumentId;
  range: MacroChartRange;
}

const WIDTH = 1000;
const HEIGHT = 520;
const PADDING = { top: 24, right: 82, bottom: 52, left: 28 };
const GRID_ROWS = 5;

interface ChartGeometry {
  path: string;
  coordinates: Array<{ x: number; y: number }>;
  min: number;
  max: number;
}

function buildGeometry(points: readonly MacroChartPoint[]): ChartGeometry | null {
  if (points.length === 0) return null;
  const values = points.map(({ value }) => value);
  const rawMin = Math.min(...values);
  const rawMax = Math.max(...values);
  const padding = (rawMax - rawMin || Math.max(Math.abs(rawMax), 1)) * 0.08;
  const min = rawMin - padding;
  const max = rawMax + padding;
  const plotWidth = WIDTH - PADDING.left - PADDING.right;
  const plotHeight = HEIGHT - PADDING.top - PADDING.bottom;
  const coordinates = points.map(({ value }, index) => ({
    x: PADDING.left + (plotWidth * index) / Math.max(points.length - 1, 1),
    y: PADDING.top + plotHeight - ((value - min) / (max - min)) * plotHeight,
  }));
  return {
    min,
    max,
    coordinates,
    path: coordinates.map(({ x, y }, index) => `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`).join(" "),
  };
}

function MacroTerminalChartComponent({ instrumentId, range }: MacroTerminalChartProps) {
  const { t, language } = useTranslation();
  const [chart, setChart] = useState<MacroChartResponse | null>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [retryToken, setRetryToken] = useState(0);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setChart(null);
    setError(false);
    setLoading(true);
    setHoveredIndex(null);
    fetchMacroChart(instrumentId, range, controller.signal)
      .then(setChart)
      .catch((reason: unknown) => {
        if (!(reason instanceof DOMException && reason.name === "AbortError")) setError(true);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [instrumentId, range, retryToken]);

  const geometry = useMemo(() => buildGeometry(chart?.points ?? []), [chart]);
  const points = chart?.points ?? [];
  const firstPoint = points[0] ?? null;
  const latestPoint = points.at(-1) ?? null;
  const selectedIndex = hoveredIndex ?? Math.max(points.length - 1, 0);
  const selectedPoint = points[selectedIndex] ?? latestPoint;
  const selectedCoordinate = geometry?.coordinates[selectedIndex] ?? null;
  const periodChange = firstPoint && latestPoint ? latestPoint.value - firstPoint.value : null;
  const locale = language === "FR" ? "fr-FR" : "en-US";
  const dateFormatter = useMemo(
    () => new Intl.DateTimeFormat(locale, { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" }),
    [locale]
  );
  const timestampFormatter = useMemo(
    () => new Intl.DateTimeFormat(locale, { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "UTC", timeZoneName: "short" }),
    [locale]
  );

  const formatDate = (time: string): string => dateFormatter.format(new Date(`${time}T00:00:00Z`));
  const formatTimestamp = (time: string | null): string => time ? timestampFormatter.format(new Date(time)) : "—";
  const formatValue = (value: number): string => {
    if (!chart) return String(value);
    const number = new Intl.NumberFormat(locale, {
      minimumFractionDigits: chart.instrument.decimals,
      maximumFractionDigits: chart.instrument.decimals,
    }).format(value);
    return chart.instrument.unit === "index" ? number : `${number} ${chart.instrument.unit}`;
  };

  const selectFromPointer = (event: PointerEvent<SVGSVGElement>): void => {
    if (!geometry || points.length === 0) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const svgX = ((event.clientX - rect.left) / rect.width) * WIDTH;
    const plotWidth = WIDTH - PADDING.left - PADDING.right;
    const ratio = Math.min(1, Math.max(0, (svgX - PADDING.left) / plotWidth));
    setHoveredIndex(Math.round(ratio * (points.length - 1)));
  };

  const moveSelectionWithKeyboard = (event: KeyboardEvent<SVGSVGElement>): void => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    const current = hoveredIndex ?? points.length - 1;
    setHoveredIndex(event.key === "ArrowLeft" ? Math.max(0, current - 1) : Math.min(points.length - 1, current + 1));
  };

  if (loading) {
    return (
      <div className={styles.nativeChartShell} aria-busy="true" role="status" aria-live="polite">
        <span className={styles.srOnly}>{t("chart.loading")}</span>
        <div className={styles.chartSkeleton} aria-hidden="true" />
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.nativeChartShell}>
        <div className={styles.nativeChartUnavailable} role="alert">
          <span className={styles.errorTag}>{t("chart.fetchFailed")}</span>
          <p>{t("chart.fetchFailedDetail")}</p>
          <button type="button" className={styles.retryButton} onClick={() => setRetryToken((value) => value + 1)}>{t("chart.retry")}</button>
        </div>
      </div>
    );
  }

  if (!chart || chart.status !== "OK" || !geometry || !latestPoint || !firstPoint) {
    return (
      <div className={styles.nativeChartShell}>
        <div className={styles.nativeChartUnavailable} role="status">
          <span className={styles.errorTag}>{t("chart.unavailable")}</span>
          <p>{t("chart.unavailableDetail")}</p>
          <button type="button" className={styles.retryButton} onClick={() => setRetryToken((value) => value + 1)}>{t("chart.retry")}</button>
        </div>
      </div>
    );
  }

  const yTicks = Array.from({ length: GRID_ROWS }, (_, index) => {
    const ratio = index / (GRID_ROWS - 1);
    return { y: PADDING.top + ratio * (HEIGHT - PADDING.top - PADDING.bottom), value: geometry.max - ratio * (geometry.max - geometry.min) };
  });
  const dateTickIndexes = [...new Set([0, Math.floor((points.length - 1) / 2), points.length - 1])];

  return (
    <div className={styles.nativeChartShell}>
      <header className={styles.nativeChartHeader}>
        <div className={styles.nativeChartQuote}>
          <span className={styles.moduleTitle}>{chart.instrument.label}</span>
          <strong className={styles.nativeChartValue}>{formatValue(selectedPoint?.value ?? latestPoint.value)}</strong>
          <span className={styles.nativeChartSelectedDate}>{selectedPoint ? formatDate(selectedPoint.time) : ""}</span>
        </div>
        <div className={styles.nativeChartMeta}>
          <span className={styles.realDataTag}>{t("chart.realData")}</span>
          {!chart.instrument.sourceOfficial ? <span className={styles.warningTag}>△ {t("chart.unofficialSource")}</span> : null}
          <span>{t("chart.dailySeries")}</span>
          <span>{t("chart.observedAt", { timestamp: formatTimestamp(chart.observationAt) })}</span>
          <span>{t("chart.retrievedAt", { timestamp: formatTimestamp(chart.retrievedAt) })}</span>
          <a href={chart.instrument.sourceUrl} target="_blank" rel="noopener noreferrer" translate="no">{chart.instrument.sourceTag}</a>
        </div>
      </header>

      <div className={styles.nativeChartPlot}>
        <svg
          className={styles.nativeChartSvg}
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          role="img"
          tabIndex={0}
          aria-label={t("chart.internalLabel", { instrument: chart.instrument.label })}
          onPointerMove={selectFromPointer}
          onPointerLeave={() => setHoveredIndex(null)}
          onFocus={() => setHoveredIndex(points.length - 1)}
          onKeyDown={moveSelectionWithKeyboard}
        >
          {yTicks.map(({ y, value }) => (
            <g key={y}>
              <line x1={PADDING.left} x2={WIDTH - PADDING.right} y1={y} y2={y} className={styles.chartGridLine} />
              <text x={WIDTH - PADDING.right + 10} y={y + 4} className={styles.chartAxisLabel}>{formatValue(value)}</text>
            </g>
          ))}
          {dateTickIndexes.map((index) => {
            const coordinate = geometry.coordinates[index];
            const anchor = index === 0 ? "start" : index === points.length - 1 ? "end" : "middle";
            return <text key={index} x={coordinate.x} y={HEIGHT - 18} textAnchor={anchor} className={styles.chartAxisLabel}>{formatDate(points[index].time)}</text>;
          })}
          <path d={geometry.path} className={styles.nativeChartLine} />
          {selectedCoordinate && selectedPoint ? (
            <g aria-hidden="true">
              <line x1={selectedCoordinate.x} x2={selectedCoordinate.x} y1={PADDING.top} y2={HEIGHT - PADDING.bottom} className={styles.chartCrosshair} />
              <circle cx={selectedCoordinate.x} cy={selectedCoordinate.y} r={4} className={styles.chartPoint} />
            </g>
          ) : null}
        </svg>
      </div>

      <footer className={styles.nativeChartStats}>
        <span><small>{t("chart.from")}</small>{formatDate(firstPoint.time)}</span>
        <span><small>{t("chart.asOf")}</small>{formatDate(latestPoint.time)}</span>
        <span><small>{t("chart.low")}</small>{formatValue(Math.min(...points.map(({ value }) => value)))}</span>
        <span><small>{t("chart.high")}</small>{formatValue(Math.max(...points.map(({ value }) => value)))}</span>
        <span><small>{t("chart.change")}</small>{periodChange === null ? "—" : `${periodChange >= 0 ? "▲ +" : "▼ "}${formatValue(periodChange)}`}</span>
      </footer>
    </div>
  );
}

export const MacroTerminalChart = memo(MacroTerminalChartComponent);
