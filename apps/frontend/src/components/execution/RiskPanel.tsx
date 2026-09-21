"use client";

import type { ExecutionDashboard, LimitMeter, OverviewDto, TradeDto } from "@/lib/api/executionClient";
import { riskUsage } from "@/lib/execution";
import { useTranslation } from "@/i18n/useTranslation";
import type { TranslationKey } from "@/i18n/en";
import workspace from "../workspace/Workspace.module.css";
import { SectionCard, Tile, pnlClass, useFormat } from "./shared";
import styles from "./Execution.module.css";

const STATE_LABEL: Record<"ok" | "watch" | "critical", TranslationKey> = {
  ok: "execution.risk.state.ok",
  watch: "execution.risk.state.watch",
  critical: "execution.risk.state.critical",
};

function Meter({ label, meter }: { label: string; meter: LimitMeter }) {
  const { t } = useTranslation();
  const f = useFormat();
  const usage = riskUsage(meter.used, meter.limit);
  const fillClass = usage?.state === "critical" ? styles.barCritical : usage?.state === "watch" ? styles.barWatch : "";
  const stateClass = usage?.state === "critical" ? styles.stateCritical : usage?.state === "watch" ? styles.stateWatch : "";
  return (
    <div className={styles.meter}>
      <div className={styles.meterTop}>
        <span className={workspace.statLabel}>{label}</span>
        {usage ? <span className={`${styles.meterState} ${stateClass}`}>{t(STATE_LABEL[usage.state])}</span> : null}
      </div>
      <strong className={styles.meterRemaining}>{f.money(meter.remaining)}</strong>
      <span className={styles.tileLabel}>{t("execution.risk.remaining")}</span>
      <div className={styles.bar} role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={usage ? Math.round(usage.ratio * 100) : undefined}>
        <div className={`${styles.barFill} ${fillClass}`} style={{ width: `${usage ? usage.ratio * 100 : 0}%` }} />
      </div>
      <div className={styles.meterMeta}>
        <span>{t("execution.risk.used")} {f.money(meter.used)}</span>
        <span>{t("execution.risk.limit")} {f.money(meter.limit)}{meter.limitPercent !== null ? ` (${f.number(meter.limitPercent, 1)} %)` : ""}</span>
      </div>
    </div>
  );
}

function Where({ dashboard, overview }: { dashboard: ExecutionDashboard; overview: OverviewDto | null }) {
  const { t } = useTranslation();
  const f = useFormat();
  const balance = overview?.balance ?? dashboard.account.balance;
  const equity = overview?.equity ?? dashboard.account.equity;
  const target = overview?.profitTarget;
  return (
    <div className={styles.tiles}>
      <Tile label={t("execution.balance")} value={f.money(balance)} />
      <Tile label={t("execution.equity")} value={f.money(equity)} />
      <Tile label={t("execution.profit")} value={f.signedMoney(overview?.profit)} valueClassName={pnlClass(overview?.profit)} />
      <Tile label={t("execution.drawdown")} value={f.money(overview?.drawdown)} />
      <Tile
        label={t("execution.profitTarget")}
        value={target ? `${f.money(target.current)} / ${f.money(target.target)}` : "—"}
        sub={target?.percent !== null && target?.percent !== undefined ? f.percent(target.percent) : undefined}
      />
      <Tile
        label={t("execution.tradingDays")}
        value={overview?.tradingDays ? `${overview.tradingDays.current} / ${overview.tradingDays.target}` : "—"}
      />
      <Tile label={t("execution.accountStatus")} value={overview?.accountStatus ?? t(`execution.status.${dashboard.account.status}` as TranslationKey)} />
      <Tile label={t("execution.payoutDate")} value={overview?.cycle.payoutEligibleDate ?? "—"} />
    </div>
  );
}

function Flags({ overview }: { overview: OverviewDto }) {
  const { t } = useTranslation();
  const f = useFormat();
  const { quickStrike, riskLimit, newsTrade } = overview.riskFlags;
  if (!quickStrike && !riskLimit && !newsTrade) return null;
  return (
    <div>
      <span className={styles.tileLabel}>{t("execution.flags.title")}</span>
      <div className={styles.flags}>
        {quickStrike ? <span className={styles.flag}>{t("execution.flags.quickStrike")}<strong>{quickStrike.violation ?? "—"} · {f.number(quickStrike.percentage, 1)} / {f.number(quickStrike.maxPercentage, 0)} %</strong></span> : null}
        {riskLimit ? <span className={styles.flag}>{t("execution.flags.riskLimit")}<strong>{riskLimit.violation ?? "—"} · {f.number(riskLimit.highestRisk, 2)} / {f.number(riskLimit.currentPercent, 1)} %</strong></span> : null}
        {newsTrade ? <span className={styles.flag}>{t("execution.flags.newsTrade")}<strong>{f.number(newsTrade.count, 0)}</strong></span> : null}
      </div>
    </div>
  );
}

function RunningTable({ trades }: { trades: TradeDto[] }) {
  const { t } = useTranslation();
  const f = useFormat();
  if (trades.length === 0) return <p className={workspace.empty}>{t("execution.running.empty")}</p>;
  return (
    <div className={workspace.tableWrap}>
      <table className={workspace.table}>
        <thead><tr><th>{t("execution.symbols.symbol")}</th><th>{t("execution.history.side")}</th><th className={workspace.numeric}>{t("execution.history.size")}</th><th className={workspace.numeric}>{t("execution.history.open")}</th><th className={workspace.numeric}>{t("execution.history.pnl")}</th></tr></thead>
        <tbody>
          {trades.map((trade) => (
            <tr key={trade.id}>
              <td>{trade.symbol}</td>
              <td><span className={styles.side}>{trade.side ? t(`execution.side.${trade.side}` as TranslationKey) : "—"}</span></td>
              <td className={workspace.numeric}>{f.number(trade.size, 2)}</td>
              <td className={workspace.numeric}>{f.number(trade.openPrice, 2)}</td>
              <td className={`${workspace.numeric} ${pnlClass(trade.netPnl)}`}>{f.signedMoney(trade.netPnl)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function RiskPanel({ dashboard }: { dashboard: ExecutionDashboard }) {
  const { t } = useTranslation();
  const isBreached = dashboard.account.status === "breached";
  const overview = dashboard.overview.status === "ok" ? dashboard.overview.data : null;
  return (
    <>
      <section className={workspace.module}>
        <div className={styles.moduleHead}><h2 className={styles.moduleTitleInline}>{t("execution.where.title")}</h2></div>
        {dashboard.overview.status === "unavailable" ? <p className={styles.unavailable}>{t("execution.unavailable", { message: dashboard.overview.message ?? "—" })}</p> : null}
        <Where dashboard={dashboard} overview={overview} />
      </section>

      <section className={workspace.module}>
        <div className={styles.moduleHead}><h2 className={styles.moduleTitleInline}>{t("execution.risk.title")}</h2></div>
        {isBreached ? <p className={`${styles.banner} ${styles.bannerBreach}`}>{t("execution.risk.breachedNote")}</p> : null}
        {overview && (overview.dailyLoss || overview.overallLoss) ? (
          <div className={styles.meters}>
            {overview.dailyLoss ? <Meter label={t("execution.risk.daily")} meter={overview.dailyLoss} /> : null}
            {overview.overallLoss ? <Meter label={t("execution.risk.overall")} meter={overview.overallLoss} /> : null}
          </div>
        ) : <p className={styles.unavailable}>{overview ? t("execution.risk.notProvided") : t("execution.unavailable", { message: dashboard.overview.message ?? "—" })}</p>}
        {overview ? <Flags overview={overview} /> : null}
        <p className={workspace.notice}>{t("execution.risk.thresholdNote")}</p>
      </section>

      <SectionCard title={t("execution.running.title")} section={dashboard.running}>
        {(trades) => <RunningTable trades={trades} />}
      </SectionCard>
    </>
  );
}
