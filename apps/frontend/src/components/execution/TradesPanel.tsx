"use client";

import type { ExecutionDashboard, TradesPageDto } from "@/lib/api/executionClient";
import { useTranslation } from "@/i18n/useTranslation";
import type { TranslationKey } from "@/i18n/en";
import workspace from "../workspace/Workspace.module.css";
import { SectionCard, pnlClass, useFormat } from "./shared";
import styles from "./Execution.module.css";

function HistoryTable({ page, onPageChange }: { page: TradesPageDto; onPageChange: (page: number) => void }) {
  const { t } = useTranslation();
  const f = useFormat();
  if (page.trades.length === 0) return <p className={workspace.empty}>{t("execution.history.empty")}</p>;
  return (
    <>
      <div className={workspace.tableWrap}>
        <table className={workspace.table}>
          <thead>
            <tr>
              <th>{t("execution.history.closed")}</th>
              <th>{t("execution.symbols.symbol")}</th>
              <th>{t("execution.history.side")}</th>
              <th className={workspace.numeric}>{t("execution.history.size")}</th>
              <th className={workspace.numeric}>{t("execution.history.open")}</th>
              <th className={workspace.numeric}>{t("execution.history.close")}</th>
              <th className={workspace.numeric}>{t("execution.history.pnl")}</th>
              <th className={workspace.numeric}>{t("execution.history.duration")}</th>
            </tr>
          </thead>
          <tbody>
            {page.trades.map((trade) => (
              <tr key={trade.id}>
                <td className={styles.mono}>{trade.closeTime ?? "—"}</td>
                <td>{trade.symbol}</td>
                <td><span className={styles.side}>{trade.side ? t(`execution.side.${trade.side}` as TranslationKey) : "—"}</span></td>
                <td className={workspace.numeric}>{f.number(trade.size, 2)}</td>
                <td className={workspace.numeric}>{f.number(trade.openPrice, 2)}</td>
                <td className={workspace.numeric}>{f.number(trade.closePrice, 2)}</td>
                <td className={`${workspace.numeric} ${pnlClass(trade.netPnl)}`}>{f.signedMoney(trade.netPnl)}</td>
                <td className={workspace.numeric}>{trade.duration ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className={styles.pager}>
        <button type="button" className={workspace.button} disabled={page.page <= 1} onClick={() => onPageChange(page.page - 1)}>{t("execution.history.prev")}</button>
        <span>{t("execution.history.page", { page: String(page.page), last: String(page.lastPage), total: String(page.total) })}</span>
        <button type="button" className={workspace.button} disabled={page.page >= page.lastPage} onClick={() => onPageChange(page.page + 1)}>{t("execution.history.next")}</button>
      </div>
    </>
  );
}

export function TradesPanel({ dashboard, onPageChange }: { dashboard: ExecutionDashboard; onPageChange: (page: number) => void }) {
  const { t } = useTranslation();
  const f = useFormat();
  return (
    <>
      <SectionCard title={t("execution.history.title")} section={dashboard.history}>
        {(page) => <HistoryTable page={page} onPageChange={onPageChange} />}
      </SectionCard>

      {dashboard.breaches ? (
        <SectionCard title={t("execution.breach.title")} section={dashboard.breaches}>
          {(breaches) => (
            <ul className={styles.ruleList}>
              {breaches.map((breach, index) => (
                <li key={`${breach.date}-${index}`} className={styles.ruleRow}>
                  <span>{breach.reason}{breach.date ? ` · ${breach.date}` : ""}</span>
                  <strong>{f.money(breach.equity)}</strong>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      ) : null}

      {dashboard.rules ? (
        <SectionCard title={t("execution.rules.title")} section={dashboard.rules}>
          {(rules) => (
            <>
              <ul className={styles.ruleList}>
                {rules.map((rule) => (
                  <li key={rule.condition} className={styles.ruleRow}><span>{rule.label}</span><strong>{rule.value}</strong></li>
                ))}
              </ul>
              <p className={workspace.notice}>{t("execution.rules.note")}</p>
            </>
          )}
        </SectionCard>
      ) : null}
    </>
  );
}
