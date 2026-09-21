"use client";

import type { CalendarDayDto, ExecutionDashboard, StatsDto, SymbolPerformanceDto } from "@/lib/api/executionClient";
import { cumulativePnl, currentMonthKey, firstWeekdayOffset, shiftMonth } from "@/lib/execution";
import { useTranslation } from "@/i18n/useTranslation";
import workspace from "../workspace/Workspace.module.css";
import { SectionCard, Tile, pnlClass, useFormat } from "./shared";
import styles from "./Execution.module.css";

function Stats({ stats }: { stats: StatsDto }) {
  const { t } = useTranslation();
  const f = useFormat();
  return (
    <div className={styles.tiles}>
      <Tile label={t("execution.perf.trades")} value={f.number(stats.trades, 0)} />
      <Tile label={t("execution.perf.winRate")} value={stats.trades > 0 ? f.percent(stats.winRate) : "—"} />
      <Tile label={t("execution.perf.profitFactor")} value={stats.trades > 0 ? f.number(stats.profitFactor, 2) : "—"} />
      <Tile label={t("execution.perf.avgRr")} value={stats.trades > 0 ? (stats.averageRr ?? "—") : "—"} />
      <Tile label={t("execution.perf.avgWin")} value={stats.trades > 0 ? f.signedMoney(stats.averageWin) : "—"} valueClassName={pnlClass(stats.averageWin)} />
      <Tile label={t("execution.perf.avgLoss")} value={stats.trades > 0 ? f.signedMoney(stats.averageLoss) : "—"} valueClassName={pnlClass(stats.averageLoss)} />
      <Tile label={t("execution.perf.best")} value={stats.trades > 0 ? f.signedMoney(stats.bestTrade) : "—"} valueClassName={pnlClass(stats.bestTrade)} />
      <Tile label={t("execution.perf.worst")} value={stats.trades > 0 ? f.signedMoney(stats.worstTrade) : "—"} valueClassName={pnlClass(stats.worstTrade)} />
    </div>
  );
}

function CumulativeChart({ days }: { days: CalendarDayDto[] }) {
  const { t } = useTranslation();
  const f = useFormat();
  const points = cumulativePnl(days);
  if (points.length < 2) return null;
  const values = points.map((point) => point.value);
  const min = Math.min(0, ...values);
  const max = Math.max(0, ...values);
  const span = max - min || 1;
  const x = (index: number) => (index / (points.length - 1)) * 100;
  const y = (value: number) => 100 - ((value - min) / span) * 100;
  const path = points.map((point, index) => `${index === 0 ? "M" : "L"}${x(index).toFixed(2)},${y(point.value).toFixed(2)}`).join(" ");
  const last = points[points.length - 1];
  return (
    <div>
      <div className={styles.meterMeta}>
        <span>{t("execution.calendar.cumulative")}</span>
        <span className={pnlClass(last.value)}>{f.signedMoney(last.value)}</span>
      </div>
      <svg className={styles.chart} viewBox="0 0 100 100" preserveAspectRatio="none" role="img" aria-label={t("execution.calendar.cumulative")}>
        <line className={styles.chartZero} x1="0" x2="100" y1={y(0)} y2={y(0)} />
        <path className={styles.chartLine} d={path} />
      </svg>
    </div>
  );
}

function Calendar({ month, days }: { month: string; days: CalendarDayDto[] }) {
  const f = useFormat();
  const offset = firstWeekdayOffset(month);
  const weekdays = ["L", "M", "M", "J", "V", "S", "D"];
  return (
    <div>
      <div className={styles.calHead}>{weekdays.map((label, index) => <span key={index}>{label}</span>)}</div>
      <div className={styles.calGrid}>
        {Array.from({ length: offset }, (_, index) => <div key={`pad-${index}`} className={`${styles.calCell} ${styles.calCellEmpty}`} />)}
        {days.map((day) => {
          const tone = day.trades === 0 ? "" : day.netPnl > 0 ? styles.calCellWin : day.netPnl < 0 ? styles.calCellLoss : "";
          return (
            <div key={day.date} className={`${styles.calCell} ${day.isWeekend ? styles.calCellWeekend : ""} ${tone}`}>
              <span className={styles.calDay}>{Number(day.date.slice(8, 10))}</span>
              {day.trades > 0 ? <span className={styles.calPnl}>{f.signedMoney(day.netPnl)}</span> : null}
              {day.trades > 0 ? <span className={styles.calTrades}>{day.trades}×</span> : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Symbols({ rows }: { rows: SymbolPerformanceDto[] }) {
  const { t } = useTranslation();
  const f = useFormat();
  if (rows.length === 0) return <p className={workspace.empty}>{t("execution.history.empty")}</p>;
  return (
    <div className={workspace.tableWrap}>
      <table className={workspace.table}>
        <thead><tr><th>{t("execution.symbols.symbol")}</th><th className={workspace.numeric}>{t("execution.symbols.trades")}</th><th className={workspace.numeric}>{t("execution.symbols.wins")}</th><th className={workspace.numeric}>{t("execution.symbols.profit")}</th></tr></thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.symbol}>
              <td>{row.symbol}</td>
              <td className={workspace.numeric}>{row.trades}</td>
              <td className={workspace.numeric}>{row.wins}</td>
              <td className={`${workspace.numeric} ${pnlClass(row.profit)}`}>{f.signedMoney(row.profit)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function PerformancePanel({ dashboard, month, onMonthChange }: { dashboard: ExecutionDashboard; month: string; onMonthChange: (month: string) => void }) {
  const { t } = useTranslation();
  const f = useFormat();
  const isCurrentMonth = month >= currentMonthKey();
  const monthNav = (
    <div className={styles.headerRight}>
      <button type="button" className={workspace.button} onClick={() => onMonthChange(shiftMonth(month, -1))} aria-label={t("execution.calendar.prev")}>‹</button>
      <span className={styles.mono}>{month}</span>
      <button type="button" className={workspace.button} onClick={() => onMonthChange(shiftMonth(month, 1))} disabled={isCurrentMonth} aria-label={t("execution.calendar.next")}>›</button>
    </div>
  );
  return (
    <>
      <SectionCard title={t("execution.perf.title")} section={dashboard.stats}>
        {(stats) => <Stats stats={stats} />}
      </SectionCard>

      <SectionCard title={t("execution.calendar.title")} section={dashboard.calendar} actions={monthNav}>
        {(calendar) => {
          const total = calendar.days.reduce((sum, day) => sum + day.netPnl, 0);
          return (
            <div className={styles.column}>
              <div className={styles.meterMeta}>
                <span>{t("execution.calendar.monthPnl")}</span>
                <span className={pnlClass(total)}>{f.signedMoney(total)}</span>
              </div>
              <Calendar month={calendar.month} days={calendar.days} />
              <CumulativeChart days={calendar.days} />
            </div>
          );
        }}
      </SectionCard>

      <SectionCard title={t("execution.symbols.title")} section={dashboard.symbols}>
        {(rows) => <Symbols rows={rows} />}
      </SectionCard>
    </>
  );
}
