"use client";

import { useState } from "react";
import { useTranslation } from "@/i18n/useTranslation";
import type { MacroChartRange } from "@/lib/api/marketClient";
import {
  CHART_INSTRUMENTS,
  createInitialChartSelection,
  selectChartInstrument,
} from "@/lib/chartInstruments";
import { CHART_COMPARISON_PRESETS, getChartComparisonPreset } from "@/lib/chartComparisons";
import { MacroComparisonChart } from "./MacroComparisonChart";
import { MacroTerminalChart } from "./MacroTerminalChart";
import { TradingViewAdvancedChart } from "./TradingViewAdvancedChart";
import styles from "./Workspace.module.css";

const INTERVALS = [
  { id: "15", label: "15m" },
  { id: "60", label: "1h" },
  { id: "240", label: "4h" },
  { id: "D", label: "1D" },
] as const;

const RANGES: ReadonlyArray<{ id: MacroChartRange; label: string }> = [
  { id: "1M", label: "1M" },
  { id: "3M", label: "3M" },
  { id: "6M", label: "6M" },
  { id: "1Y", label: "1Y" },
];

export function ChartWorkspace() {
  const { t } = useTranslation();
  const [view, setView] = useState<"solo" | "comparisons">("solo");
  const [selection, setSelection] = useState(createInitialChartSelection);
  const [comparisonId, setComparisonId] = useState<string>(CHART_COMPARISON_PRESETS[0].id);
  const [interval, setInterval] = useState<string>(INTERVALS[1].id);
  const [range, setRange] = useState<MacroChartRange>("3M");
  const { instrument, tradingViewInstrument } = selection;
  const comparison = getChartComparisonPreset(comparisonId);
  const intervals = instrument.chartKind === "tradingview" && instrument.intervalMode === "daily"
    ? INTERVALS.filter(({ id }) => id === "D")
    : INTERVALS;
  const activeInterval = instrument.chartKind === "tradingview" && instrument.intervalMode === "daily" ? "D" : interval;
  const tradingViewVisible = view === "solo" && instrument.chartKind === "tradingview";

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>{t("pageTitle.chart")}</h1>
          <p className={styles.pageIntro}>{t("chart.intro")}</p>
        </div>
        <div className={styles.chartControlStack}>
          <div className={styles.segmented} role="group" aria-label={t("chart.view")}>
            <button type="button" className={`${styles.segment} ${view === "solo" ? styles.segmentActive : ""}`} aria-pressed={view === "solo"} onClick={() => setView("solo")}>{t("chart.solo")}</button>
            <button type="button" className={`${styles.segment} ${view === "comparisons" ? styles.segmentActive : ""}`} aria-pressed={view === "comparisons"} onClick={() => setView("comparisons")}>{t("chart.comparisons")}</button>
          </div>
          <div className={styles.toolbar}>
            {view === "solo" ? (
              <div className={styles.segmented} role="group" aria-label={t("chart.instrument")}>
                {CHART_INSTRUMENTS.map((item) => <button type="button" key={item.id} className={`${styles.segment} ${instrument.id === item.id ? styles.segmentActive : ""}`} aria-pressed={instrument.id === item.id} onClick={() => setSelection((current) => selectChartInstrument(current, item))}>{item.label}</button>)}
              </div>
            ) : (
              <label className={styles.comparisonPicker}>
                <span>{t("chart.comparison")}</span>
                <select className={styles.select} name="chart-comparison" autoComplete="off" value={comparisonId} onChange={(event) => setComparisonId(event.target.value)}>
                  <optgroup label={t("chart.comparisonGroupGold")}>
                    {CHART_COMPARISON_PRESETS.filter(({ category }) => category === "GOLD").map((preset) => <option key={preset.id} value={preset.id}>{preset.label}</option>)}
                  </optgroup>
                  <optgroup label={t("chart.comparisonGroupRates")}>
                    {CHART_COMPARISON_PRESETS.filter(({ category }) => category === "RATES").map((preset) => <option key={preset.id} value={preset.id}>{preset.label}</option>)}
                  </optgroup>
                  <optgroup label={t("chart.comparisonGroupVolatility")}>
                    {CHART_COMPARISON_PRESETS.filter(({ category }) => category === "VOLATILITY").map((preset) => <option key={preset.id} value={preset.id}>{preset.label}</option>)}
                  </optgroup>
                </select>
              </label>
            )}
            {view === "solo" && instrument.chartKind === "tradingview" ? (
              <div className={styles.segmented} role="group" aria-label={t("chart.interval")}>
                {intervals.map((item) => <button type="button" key={item.id} className={`${styles.segment} ${activeInterval === item.id ? styles.segmentActive : ""}`} aria-pressed={activeInterval === item.id} onClick={() => setInterval(item.id)}>{item.label}</button>)}
              </div>
            ) : (
              <div className={styles.segmented} role="group" aria-label={t("chart.range")}>
                {RANGES.map((item) => <button type="button" key={item.id} className={`${styles.segment} ${range === item.id ? styles.segmentActive : ""}`} aria-pressed={range === item.id} onClick={() => setRange(item.id)}>{item.label}</button>)}
              </div>
            )}
          </div>
        </div>
      </header>
      <div
        className={styles.chartFrame}
        role="region"
        aria-label={view === "comparisons" ? t("chart.comparisonInternalLabel", { comparison: comparison.label }) : instrument.chartKind === "tradingview" ? t("chart.embeddedLabel") : t("chart.internalLabel", { instrument: instrument.label })}
      >
        <div
          className={`${styles.chartSurface} ${tradingViewVisible ? "" : styles.chartSurfaceHidden}`}
          aria-hidden={!tradingViewVisible}
        >
          <TradingViewAdvancedChart
            symbol={tradingViewInstrument.id}
            symbolLabel={tradingViewInstrument.label}
            interval={activeInterval}
          />
        </div>
        {view === "solo" && instrument.chartKind === "macro" ? (
          <MacroTerminalChart instrumentId={instrument.id} range={range} />
        ) : null}
        {view === "comparisons" ? <MacroComparisonChart key={comparison.id} preset={comparison} range={range} /> : null}
      </div>
      <p className={styles.notice}>{t("chart.disclaimer")}</p>
    </div>
  );
}
