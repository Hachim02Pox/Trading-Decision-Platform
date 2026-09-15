"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslation } from "@/i18n/useTranslation";
import type { MacroChartRange } from "@/lib/api/marketClient";
import { CHART_INSTRUMENTS } from "@/lib/chartInstruments";
import { CHART_COMPARISON_PRESETS, getChartComparisonPreset } from "@/lib/chartComparisons";
import { MacroComparisonChart } from "./MacroComparisonChart";
import { MacroTerminalChart } from "./MacroTerminalChart";
import styles from "./Workspace.module.css";

const RANGES: ReadonlyArray<{ id: MacroChartRange; label: string }> = [
  { id: "1M", label: "1M" },
  { id: "3M", label: "3M" },
  { id: "6M", label: "6M" },
  { id: "1Y", label: "1Y" },
];

export function ChartWorkspace() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const requestedInstrumentId = searchParams.get("instrument");
  const requestedInstrument = CHART_INSTRUMENTS.find(({ id }) => id === requestedInstrumentId);
  const [view, setView] = useState<"solo" | "comparisons">("solo");
  const [instrument, setInstrument] = useState(() => requestedInstrument ?? CHART_INSTRUMENTS[0]);
  const [comparisonId, setComparisonId] = useState<string>(CHART_COMPARISON_PRESETS[0].id);
  const [range, setRange] = useState<MacroChartRange>("3M");
  const comparison = getChartComparisonPreset(comparisonId);

  useEffect(() => {
    if (requestedInstrument) setInstrument(requestedInstrument);
  }, [requestedInstrument]);

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
                {CHART_INSTRUMENTS.map((item) => <button type="button" key={item.id} className={`${styles.segment} ${instrument.id === item.id ? styles.segmentActive : ""}`} aria-pressed={instrument.id === item.id} onClick={() => setInstrument(item)}>{item.label}</button>)}
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
            <div className={styles.segmented} role="group" aria-label={t("chart.range")}>
              {RANGES.map((item) => <button type="button" key={item.id} className={`${styles.segment} ${range === item.id ? styles.segmentActive : ""}`} aria-pressed={range === item.id} onClick={() => setRange(item.id)}>{item.label}</button>)}
            </div>
          </div>
        </div>
      </header>
      <div
        className={styles.chartFrame}
        role="region"
        aria-label={view === "comparisons" ? t("chart.comparisonInternalLabel", { comparison: comparison.label }) : t("chart.internalLabel", { instrument: instrument.label })}
      >
        {view === "solo" ? (
          <MacroTerminalChart instrumentId={instrument.id} range={range} tradingViewUrl={instrument.tradingViewUrl} />
        ) : null}
        {view === "comparisons" ? <MacroComparisonChart key={comparison.id} preset={comparison} range={range} /> : null}
      </div>
      <p className={styles.notice}>{t("chart.disclaimer")}</p>
    </div>
  );
}
