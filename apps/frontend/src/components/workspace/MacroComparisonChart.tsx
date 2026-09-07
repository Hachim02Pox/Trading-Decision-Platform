"use client";

import { memo, useEffect, useMemo, useState, type KeyboardEvent, type PointerEvent } from "react";
import { useTranslation } from "@/i18n/useTranslation";
import type { ChartComparisonPreset, ChartComparisonTone } from "@/lib/chartComparisons";
import { normalizeComparisonPoints, type NormalizedComparisonPoint } from "@/lib/chartTransforms";
import {
  fetchMacroChart,
  type MacroChartInstrumentId,
  type MacroChartRange,
  type MacroChartResponse,
} from "@/lib/api/marketClient";
import comparisonStyles from "./MacroComparisonChart.module.css";
import styles from "./Workspace.module.css";

interface MacroComparisonChartProps {
  preset: ChartComparisonPreset;
  range: MacroChartRange;
}

interface SeriesFetchResult {
  instrumentId: MacroChartInstrumentId;
  response: MacroChartResponse | null;
}

interface LoadedSeries {
  instrumentId: MacroChartInstrumentId;
  tone: ChartComparisonTone;
  dashed: boolean;
  response: MacroChartResponse;
  points: NormalizedComparisonPoint[];
}

interface SeriesGeometry extends LoadedSeries {
  path: string;
  coordinates: Array<{ x: number; y: number }>;
}

interface ComparisonGeometry {
  series: SeriesGeometry[];
  minValue: number;
  maxValue: number;
  minTime: number;
  maxTime: number;
}

const WIDTH = 1000;
const HEIGHT = 500;
const PADDING = { top: 22, right: 72, bottom: 50, left: 30 };
const GRID_ROWS = 5;

const LINE_TONE_CLASSES: Record<ChartComparisonTone, string> = {
  gold: comparisonStyles.comparisonLineGold,
  blue: comparisonStyles.comparisonLineBlue,
  secondary: comparisonStyles.comparisonLineSecondary,
  tertiary: comparisonStyles.comparisonLineTertiary,
};

const POINT_TONE_CLASSES: Record<ChartComparisonTone, string> = {
  gold: comparisonStyles.comparisonPointGold,
  blue: comparisonStyles.comparisonPointBlue,
  secondary: comparisonStyles.comparisonPointSecondary,
  tertiary: comparisonStyles.comparisonPointTertiary,
};

function buildComparisonGeometry(series: readonly LoadedSeries[]): ComparisonGeometry | null {
  const allPoints = series.flatMap(({ points }) => points);
  if (allPoints.length === 0) return null;

  const values = allPoints.map(({ changePercent }) => changePercent);
  const times = allPoints.map(({ time }) => Date.parse(`${time}T00:00:00Z`));
  const rawMin = Math.min(...values);
  const rawMax = Math.max(...values);
  const valuePadding = (rawMax - rawMin || Math.max(Math.abs(rawMax), 1)) * 0.08;
  const minValue = rawMin - valuePadding;
  const maxValue = rawMax + valuePadding;
  const minTime = Math.min(...times);
  const maxTime = Math.max(...times);
  const timeSpan = Math.max(maxTime - minTime, 1);
  const plotWidth = WIDTH - PADDING.left - PADDING.right;
  const plotHeight = HEIGHT - PADDING.top - PADDING.bottom;

  const geometrySeries = series.map((item) => {
    const coordinates = item.points.map(({ time, changePercent }) => ({
      x: PADDING.left + ((Date.parse(`${time}T00:00:00Z`) - minTime) / timeSpan) * plotWidth,
      y: PADDING.top + plotHeight - ((changePercent - minValue) / (maxValue - minValue)) * plotHeight,
    }));
    return {
      ...item,
      coordinates,
      path: coordinates.map(({ x, y }, index) => `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`).join(" "),
    };
  });

  return { series: geometrySeries, minValue, maxValue, minTime, maxTime };
}

function closestPoint(points: readonly NormalizedComparisonPoint[], targetTime: number): NormalizedComparisonPoint | null {
  return points.reduce<NormalizedComparisonPoint | null>((closest, point) => {
    if (!closest) return point;
    const pointDistance = Math.abs(Date.parse(`${point.time}T00:00:00Z`) - targetTime);
    const closestDistance = Math.abs(Date.parse(`${closest.time}T00:00:00Z`) - targetTime);
    return pointDistance < closestDistance ? point : closest;
  }, null);
}

function MacroComparisonChartComponent({ preset, range }: MacroComparisonChartProps) {
  const { t, language } = useTranslation();
  const [results, setResults] = useState<readonly SeriesFetchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [retryToken, setRetryToken] = useState(0);
  const [selectedTime, setSelectedTime] = useState<number | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setResults([]);
    setLoading(true);
    setSelectedTime(null);

    const requests = preset.series.map(async ({ instrumentId }): Promise<SeriesFetchResult> => {
      try {
        return { instrumentId, response: await fetchMacroChart(instrumentId, range, controller.signal) };
      } catch {
        return { instrumentId, response: null };
      }
    });

    Promise.all(requests).then((nextResults) => {
      if (controller.signal.aborted) return;
      setResults(nextResults);
      setLoading(false);
    });

    return () => controller.abort();
  }, [preset, range, retryToken]);

  const availableSeries = useMemo<LoadedSeries[]>(() => preset.series.flatMap((definition) => {
    const response = results.find(({ instrumentId }) => instrumentId === definition.instrumentId)?.response;
    if (!response || response.status !== "OK") return [];
    const points = normalizeComparisonPoints(response.points);
    if (points.length < 2) return [];
    return [{
      instrumentId: definition.instrumentId,
      tone: definition.tone,
      dashed: definition.dashed ?? false,
      response,
      points,
    }];
  }), [preset, results]);

  const missingIds = useMemo(
    () => preset.series.map(({ instrumentId }) => instrumentId).filter((id) => !availableSeries.some((series) => series.instrumentId === id)),
    [availableSeries, preset]
  );
  const geometry = useMemo(() => buildComparisonGeometry(availableSeries), [availableSeries]);
  const locale = language === "FR" ? "fr-FR" : "en-US";
  const dateFormatter = useMemo(
    () => new Intl.DateTimeFormat(locale, { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" }),
    [locale]
  );
  const timestampFormatter = useMemo(
    () => new Intl.DateTimeFormat(locale, { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "UTC", timeZoneName: "short" }),
    [locale]
  );
  const allTimes = useMemo(
    () => [...new Set(availableSeries.flatMap(({ points }) => points.map(({ time }) => Date.parse(`${time}T00:00:00Z`))))].sort((a, b) => a - b),
    [availableSeries]
  );

  if (loading) {
    return (
      <div className={styles.nativeChartShell} aria-busy="true" role="status" aria-live="polite">
        <span className={styles.srOnly}>{t("chart.loading")}</span>
        <div className={styles.chartSkeleton} aria-hidden="true" />
      </div>
    );
  }

  if (!geometry) {
    return (
      <div className={styles.nativeChartShell}>
        <div className={styles.nativeChartUnavailable} role="alert">
          <span className={styles.errorTag}>{t("chart.fetchFailed")}</span>
          <p>{t("chart.comparisonUnavailable")}</p>
          <button type="button" className={styles.retryButton} onClick={() => setRetryToken((value) => value + 1)}>{t("chart.retry")}</button>
        </div>
      </div>
    );
  }

  const activeTime = selectedTime ?? geometry.maxTime;
  const selectedBySeries = geometry.series.map((series) => ({
    series,
    point: closestPoint(series.points, activeTime),
  }));
  const yTicks = Array.from({ length: GRID_ROWS }, (_, index) => {
    const ratio = index / (GRID_ROWS - 1);
    return {
      y: PADDING.top + ratio * (HEIGHT - PADDING.top - PADDING.bottom),
      value: geometry.maxValue - ratio * (geometry.maxValue - geometry.minValue),
    };
  });
  const xTickTimes = [geometry.minTime, geometry.minTime + (geometry.maxTime - geometry.minTime) / 2, geometry.maxTime];
  const crosshairX = PADDING.left + ((activeTime - geometry.minTime) / Math.max(geometry.maxTime - geometry.minTime, 1)) * (WIDTH - PADDING.left - PADDING.right);

  const formatDate = (timeMs: number): string => dateFormatter.format(new Date(timeMs));
  const formatTimestamp = (time: string | null): string => time ? timestampFormatter.format(new Date(time)) : "—";
  const formatPercent = (value: number): string => `${value >= 0 ? "+" : ""}${new Intl.NumberFormat(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value)}%`;
  const formatRawValue = (response: MacroChartResponse, value: number): string => {
    const number = new Intl.NumberFormat(locale, {
      minimumFractionDigits: response.instrument.decimals,
      maximumFractionDigits: response.instrument.decimals,
    }).format(value);
    return response.instrument.unit === "index" ? number : `${number} ${response.instrument.unit}`;
  };

  const selectFromPointer = (event: PointerEvent<SVGSVGElement>): void => {
    const rect = event.currentTarget.getBoundingClientRect();
    const svgX = ((event.clientX - rect.left) / rect.width) * WIDTH;
    const ratio = Math.min(1, Math.max(0, (svgX - PADDING.left) / (WIDTH - PADDING.left - PADDING.right)));
    setSelectedTime(geometry.minTime + ratio * (geometry.maxTime - geometry.minTime));
  };

  const moveSelectionWithKeyboard = (event: KeyboardEvent<SVGSVGElement>): void => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    const currentIndex = allTimes.reduce((bestIndex, time, index) => (
      Math.abs(time - activeTime) < Math.abs(allTimes[bestIndex] - activeTime) ? index : bestIndex
    ), Math.max(allTimes.length - 1, 0));
    const nextIndex = event.key === "ArrowLeft" ? Math.max(0, currentIndex - 1) : Math.min(allTimes.length - 1, currentIndex + 1);
    setSelectedTime(allTimes[nextIndex] ?? geometry.maxTime);
  };

  return (
    <div className={`${styles.nativeChartShell} ${comparisonStyles.comparisonChartShell}`}>
      <header className={styles.nativeChartHeader}>
        <div className={comparisonStyles.comparisonHeading}>
          <span className={`${styles.moduleTitle} ${comparisonStyles.comparisonModuleTitle}`}>{preset.label}</span>
          <strong>{t("chart.normalizedScale")}</strong>
          <span>{formatDate(activeTime)}</span>
        </div>
        <div className={styles.nativeChartMeta}>
          <span className={styles.realDataTag}>{t("chart.realData")}</span>
          {missingIds.length > 0 ? <span className={styles.warningTag}>△ {t("chart.partialData")}</span> : null}
          <span>{t("chart.dailySeries")}</span>
        </div>
      </header>

      <div className={comparisonStyles.comparisonLegend} aria-label={t("chart.comparisonLegend")}>
        {selectedBySeries.map(({ series, point }) => (
          <div className={comparisonStyles.comparisonLegendItem} key={series.instrumentId}>
            <div className={comparisonStyles.comparisonSeriesTop}>
              <span className={`${comparisonStyles.comparisonSwatch} ${LINE_TONE_CLASSES[series.tone]} ${series.dashed ? comparisonStyles.comparisonLineDashed : ""}`} aria-hidden="true" />
              <strong>{series.response.instrument.label}</strong>
              {!series.response.instrument.sourceOfficial ? <span className={comparisonStyles.warningGlyph} role="img" aria-label={t("chart.unofficialSource")}>△</span> : null}
            </div>
            <div className={comparisonStyles.comparisonSeriesValues}>
              <span>{point ? formatRawValue(series.response, point.rawValue) : "—"}</span>
              <span>{point ? formatPercent(point.changePercent) : "—"}</span>
            </div>
            <span className={comparisonStyles.comparisonTimestamp}>{t("chart.observedAt", { timestamp: formatTimestamp(series.response.observationAt) })}</span>
            <a href={series.response.instrument.sourceUrl} target="_blank" rel="noopener noreferrer" translate="no">{series.response.instrument.sourceTag}</a>
          </div>
        ))}
        {missingIds.map((instrumentId) => (
          <div className={`${comparisonStyles.comparisonLegendItem} ${comparisonStyles.comparisonLegendUnavailable}`} key={instrumentId}>
            <strong>{instrumentId}</strong>
            <span className={styles.errorTag}>{t("chart.seriesUnavailable")}</span>
          </div>
        ))}
      </div>

      <div className={styles.nativeChartPlot}>
        <svg
          className={styles.nativeChartSvg}
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          role="img"
          tabIndex={0}
          aria-label={t("chart.comparisonInternalLabel", { comparison: preset.label })}
          onPointerMove={selectFromPointer}
          onPointerLeave={() => setSelectedTime(null)}
          onFocus={() => setSelectedTime(geometry.maxTime)}
          onKeyDown={moveSelectionWithKeyboard}
        >
          {yTicks.map(({ y, value }) => (
            <g key={y}>
              <line x1={PADDING.left} x2={WIDTH - PADDING.right} y1={y} y2={y} className={styles.chartGridLine} />
              <text x={WIDTH - PADDING.right + 9} y={y + 4} className={styles.chartAxisLabel}>{formatPercent(value)}</text>
            </g>
          ))}
          <line x1={PADDING.left} x2={WIDTH - PADDING.right} y1={PADDING.top + (geometry.maxValue / (geometry.maxValue - geometry.minValue)) * (HEIGHT - PADDING.top - PADDING.bottom)} y2={PADDING.top + (geometry.maxValue / (geometry.maxValue - geometry.minValue)) * (HEIGHT - PADDING.top - PADDING.bottom)} className={comparisonStyles.comparisonZeroLine} />
          {xTickTimes.map((time, index) => (
            <text
              key={time}
              x={PADDING.left + (index / 2) * (WIDTH - PADDING.left - PADDING.right)}
              y={HEIGHT - 17}
              textAnchor={index === 0 ? "start" : index === 2 ? "end" : "middle"}
              className={styles.chartAxisLabel}
            >{formatDate(time)}</text>
          ))}
          {geometry.series.map((series) => (
            <path key={series.instrumentId} d={series.path} className={`${comparisonStyles.comparisonLine} ${LINE_TONE_CLASSES[series.tone]} ${series.dashed ? comparisonStyles.comparisonLineDashed : ""}`}>
              <title>{series.response.instrument.label}</title>
            </path>
          ))}
          <line x1={crosshairX} x2={crosshairX} y1={PADDING.top} y2={HEIGHT - PADDING.bottom} className={styles.chartCrosshair} aria-hidden="true" />
          {selectedBySeries.map(({ series, point }) => {
            if (!point) return null;
            const coordinate = series.coordinates[series.points.indexOf(point)];
            return <circle key={series.instrumentId} cx={coordinate.x} cy={coordinate.y} r={4} className={`${comparisonStyles.comparisonPoint} ${POINT_TONE_CLASSES[series.tone]}`} aria-hidden="true" />;
          })}
        </svg>
      </div>

      <footer className={comparisonStyles.comparisonMethod}>
        <span>{t("chart.comparisonMethod")}</span>
        <span>{t("chart.correlationWarning")}</span>
      </footer>
    </div>
  );
}

export const MacroComparisonChart = memo(MacroComparisonChartComponent);
