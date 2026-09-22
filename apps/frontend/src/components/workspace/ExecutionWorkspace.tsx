"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ExecutionApiError, fetchExecutionAccounts, fetchExecutionDashboard, fetchTradeAnnotations, saveTradeAnnotation,
  type ExecutionAccount, type ExecutionDashboard, type TradeAnnotationDto,
} from "@/lib/api/executionClient";
import { currentMonthKey } from "@/lib/execution";
import { nextUnclassifiedTrade, TRADE_REASON_OPTIONS, type TradeReason } from "@/lib/tradeFollowUp";
import { useTranslation } from "@/i18n/useTranslation";
import type { TranslationKey } from "@/i18n/en";
import { PerformancePanel } from "@/components/execution/PerformancePanel";
import { RiskCalculator } from "@/components/execution/RiskCalculator";
import { RiskPanel } from "@/components/execution/RiskPanel";
import { TradesPanel } from "@/components/execution/TradesPanel";
import { useFormat } from "@/components/execution/shared";
import executionStyles from "@/components/execution/Execution.module.css";
import styles from "./Workspace.module.css";

const AUTO_REFRESH_MS = 30_000;

// Execution tab, rebuilt 2026-09-21 on top of the FundedNext MCP (read-only).
// Progress and decisions: docs/EXECUTION_REBUILD_PROGRESS.md.

function accountLabel(account: ExecutionAccount): string {
  return `${account.title} · ${account.login}`;
}

export function ExecutionWorkspace() {
  const { t } = useTranslation();
  const f = useFormat();
  const [accounts, setAccounts] = useState<ExecutionAccount[] | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [month, setMonth] = useState(currentMonthKey());
  const [page, setPage] = useState(1);
  const [dashboard, setDashboard] = useState<ExecutionDashboard | null>(null);
  const [error, setError] = useState<ExecutionApiError | Error | null>(null);
  const [loading, setLoading] = useState(true);
  const [annotations, setAnnotations] = useState<TradeAnnotationDto[]>([]);
  const [savingReason, setSavingReason] = useState<TradeReason | null>(null);
  const [followUpError, setFollowUpError] = useState<string | null>(null);
  const dismissedTradeIds = useRef(new Set<string>());
  const requestId = useRef(0);

  const loadAccounts = useCallback(async (refresh = false) => {
    try {
      const list = await fetchExecutionAccounts(refresh);
      setAccounts(list);
      setSelectedId((current) => current ?? (list.find((account) => account.status === "active") ?? list[0])?.id ?? null);
      setError(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught : new Error("Unknown error"));
      setLoading(false);
    }
  }, []);

  const loadDashboard = useCallback(async (options: { silent?: boolean; refresh?: boolean } = {}) => {
    if (selectedId === null) return;
    const current = ++requestId.current;
    if (!options.silent) setLoading(true);
    try {
      const data = await fetchExecutionDashboard(selectedId, { month, page, refresh: options.refresh });
      if (current !== requestId.current) return;
      setDashboard(data);
      try {
        const stored = await fetchTradeAnnotations(selectedId);
        if (current === requestId.current) setAnnotations(stored);
      } catch {
        // FundedNext data remains useful if the optional personal follow-up store is unavailable.
      }
      setError(null);
    } catch (caught) {
      if (current !== requestId.current) return;
      setError(caught instanceof Error ? caught : new Error("Unknown error"));
    } finally {
      if (current === requestId.current) setLoading(false);
    }
  }, [selectedId, month, page]);

  useEffect(() => { void loadAccounts(); }, [loadAccounts]);
  useEffect(() => { void loadDashboard(); }, [loadDashboard]);

  const isActiveAccount = dashboard?.account.status === "active";
  useEffect(() => {
    if (!isActiveAccount) return;
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") void loadDashboard({ silent: true });
    }, AUTO_REFRESH_MS);
    return () => window.clearInterval(timer);
  }, [isActiveAccount, loadDashboard]);

  function selectAccount(id: number) {
    setSelectedId(id);
    setMonth(currentMonthKey());
    setPage(1);
    setDashboard(null);
    setAnnotations([]);
  }

  function changeMonth(next: string) {
    setMonth(next);
    setPage(1);
  }

  function refreshAll() {
    void loadAccounts(true);
    void loadDashboard({ refresh: true });
  }

  function errorMessage(caught: ExecutionApiError | Error): string {
    if (caught instanceof ExecutionApiError) {
      if (caught.code === "SIGN_IN_REQUIRED" || caught.status === 401) return t("execution.error.signIn");
      if (caught.code === "NOT_OWNER") return t("execution.error.notOwner");
      if (caught.code === "FUNDEDNEXT_NOT_CONFIGURED") return t("execution.error.notConfigured");
    }
    return t("execution.error.generic", { message: caught.message });
  }

  const activeAccounts = accounts?.filter((account) => account.status === "active") ?? [];
  const historyAccounts = accounts?.filter((account) => account.status !== "active") ?? [];
  const selected = accounts?.find((account) => account.id === selectedId) ?? null;
  const pendingTrade = useMemo(() => {
    if (!dashboard) return null;
    const knownIds = new Set(annotations.map((annotation) => annotation.tradeId));
    const sourceTrades = [
      ...(dashboard.running.data ?? []),
      ...(dashboard.history.data?.trades ?? []),
    ].filter((trade, index, list) => list.findIndex((candidate) => candidate.id === trade.id) === index);
    return nextUnclassifiedTrade(sourceTrades, new Set([...knownIds, ...dismissedTradeIds.current]));
  }, [annotations, dashboard]);

  async function classifyTrade(reason: TradeReason) {
    if (!pendingTrade || selectedId === null) return;
    setSavingReason(reason);
    setFollowUpError(null);
    try {
      const annotation = await saveTradeAnnotation(selectedId, pendingTrade.id, reason);
      setAnnotations((current) => [...current.filter((item) => item.tradeId !== annotation.tradeId), annotation]);
    } catch {
      setFollowUpError(t("execution.followUp.saveError"));
    } finally {
      setSavingReason(null);
    }
  }

  function dismissTradeForNow() {
    if (pendingTrade) dismissedTradeIds.current.add(pendingTrade.id);
    // A ref does not trigger a render; the small state update intentionally does.
    setFollowUpError(null);
    setAnnotations((current) => [...current]);
  }

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>{t("pageTitle.execution")}</h1>
          <p className={styles.pageIntro}>{t("execution.intro")}</p>
        </div>
        <div className={executionStyles.headerRight}>
          {dashboard ? <span className={executionStyles.updated}>{t("execution.updatedAt", { time: f.time(dashboard.fetchedAt) })}</span> : null}
          <button type="button" className={styles.button} onClick={refreshAll} disabled={loading || selectedId === null}>{t("execution.refresh")}</button>
        </div>
      </header>

      {error && !dashboard ? (
        <div className={styles.errorBox} role="alert">
          <span className={styles.errorMessage}>{errorMessage(error)}</span>
          <button type="button" className={styles.retryButton} onClick={refreshAll}>{t("execution.retry")}</button>
        </div>
      ) : null}

      {accounts && accounts.length === 0 ? <p className={styles.empty}>{t("execution.noAccounts")}</p> : null}

      {accounts && accounts.length > 0 ? (
        <div className={executionStyles.accountBar}>
          <div className={styles.segmented} role="tablist" aria-label={t("execution.accounts.active")}>
            {activeAccounts.map((account) => (
              <button
                key={account.id}
                type="button"
                role="tab"
                aria-selected={account.id === selectedId}
                className={`${styles.segment} ${account.id === selectedId ? styles.segmentActive : ""}`}
                onClick={() => selectAccount(account.id)}
              >
                {t(`execution.platform.${account.platform}` as TranslationKey)} · {account.title}
              </button>
            ))}
          </div>
          {historyAccounts.length > 0 ? (
            <label className={executionStyles.accountSelect}>
              <span className={styles.srOnly}>{t("execution.accounts.history")}</span>
              <select
                className={styles.select}
                value={selected && selected.status !== "active" ? selected.id : ""}
                onChange={(event) => { if (event.target.value) selectAccount(Number(event.target.value)); }}
              >
                <option value="">{t("execution.accounts.history")}…</option>
                {historyAccounts.map((account) => (
                  <option key={account.id} value={account.id}>{`${t(`execution.status.${account.status}` as TranslationKey)} · ${accountLabel(account)}`}</option>
                ))}
              </select>
            </label>
          ) : null}
          {selected ? (
            <>
              <span className={`${executionStyles.pill} ${selected.status === "breached" ? executionStyles.pillBreached : selected.status === "active" ? executionStyles.pillActive : ""}`}>{t(`execution.status.${selected.status}` as TranslationKey)}</span>
              <span className={executionStyles.pill}>{selected.server ?? t(`execution.platform.${selected.platform}` as TranslationKey)}</span>
            </>
          ) : null}
        </div>
      ) : null}

      {loading && !dashboard && !error ? <p className={styles.empty}>{t("execution.loading")}</p> : null}

      {dashboard ? (
        <div className={executionStyles.layout}>
          <div className={executionStyles.column}>
            <RiskPanel dashboard={dashboard} />
            <PerformancePanel dashboard={dashboard} month={month} onMonthChange={changeMonth} />
          </div>
          <div className={executionStyles.column}>
            <RiskCalculator balance={dashboard.overview.data?.balance ?? dashboard.account.balance} />
            <TradesPanel dashboard={dashboard} onPageChange={setPage} />
          </div>
        </div>
      ) : null}

      {pendingTrade ? (
        <div className={executionStyles.followUpBackdrop} role="presentation">
          <section className={executionStyles.followUpDialog} role="dialog" aria-modal="true" aria-labelledby="trade-follow-up-title">
            <span className={executionStyles.followUpEyebrow}>{t("execution.followUp.eyebrow")}</span>
            <h2 id="trade-follow-up-title">{t("execution.followUp.title")}</h2>
            <p>{t("execution.followUp.trade", { symbol: pendingTrade.symbol, side: pendingTrade.side ? t(`execution.side.${pendingTrade.side}` as TranslationKey) : "—" })}</p>
            <p className={executionStyles.followUpHint}>{t("execution.followUp.hint")}</p>
            <div className={executionStyles.followUpOptions}>
              {TRADE_REASON_OPTIONS.map((option) => (
                <button key={option.value} type="button" className={styles.button} disabled={savingReason !== null} onClick={() => void classifyTrade(option.value)}>
                  {savingReason === option.value ? t("execution.followUp.saving") : t(`execution.followUp.reason.${option.value}` as TranslationKey)}
                </button>
              ))}
            </div>
            {followUpError ? <p className={styles.errorMessage} role="alert">{followUpError}</p> : null}
            <button type="button" className={executionStyles.followUpLater} disabled={savingReason !== null} onClick={dismissTradeForNow}>{t("execution.followUp.later")}</button>
          </section>
        </div>
      ) : null}
    </div>
  );
}
