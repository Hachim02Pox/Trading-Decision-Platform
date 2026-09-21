"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchPositionSize, type PositionSizeDto } from "@/lib/api/executionClient";
import { calculateRiskPlan } from "@/lib/traderWorkspace";
import { useTranslation } from "@/i18n/useTranslation";
import workspace from "../workspace/Workspace.module.css";
import { Tile, useFormat } from "./shared";
import styles from "./Execution.module.css";

const STORAGE_KEY = "goldTerminal.executionCalculator.v1";
const DEFAULT_SYMBOL = "XAUUSD";
const DEFAULT_RISK_PERCENT = "0.50";
const LOTS_DEBOUNCE_MS = 600;

interface Draft { symbol: string; riskPercent: string; entry: string; stop: string }
const EMPTY: Draft = { symbol: DEFAULT_SYMBOL, riskPercent: DEFAULT_RISK_PERCENT, entry: "", stop: "" };

function readDraft(): Draft {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "null") as Partial<Draft> | null;
    return {
      symbol: typeof parsed?.symbol === "string" && parsed.symbol ? parsed.symbol : DEFAULT_SYMBOL,
      riskPercent: typeof parsed?.riskPercent === "string" ? parsed.riskPercent : DEFAULT_RISK_PERCENT,
      entry: typeof parsed?.entry === "string" ? parsed.entry : "",
      stop: typeof parsed?.stop === "string" ? parsed.stop : "",
    };
  } catch {
    return EMPTY;
  }
}

/** Compact risk calculator. The balance comes from the selected account; lots come from FundedNext's own calculator, with the local estimate as fallback. */
export function RiskCalculator({ balance }: { balance: number }) {
  const { t } = useTranslation();
  const f = useFormat();
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [hydrated, setHydrated] = useState(false);
  const [lots, setLots] = useState<PositionSizeDto | null>(null);

  useEffect(() => { setDraft(readDraft()); setHydrated(true); }, []);
  useEffect(() => {
    if (!hydrated) return;
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(draft)); } catch { /* optional */ }
  }, [draft, hydrated]);

  const plan = useMemo(() => calculateRiskPlan({
    accountBalance: balance,
    riskPercent: Number(draft.riskPercent),
    entryPrice: Number(draft.entry),
    stopPrice: Number(draft.stop),
  }), [balance, draft.riskPercent, draft.entry, draft.stop]);

  useEffect(() => {
    setLots(null);
    if (!plan || !/^[A-Za-z0-9._-]{2,20}$/.test(draft.symbol)) return;
    let cancelled = false;
    const timer = window.setTimeout(() => {
      fetchPositionSize({ symbol: draft.symbol, balance, riskPercent: Number(draft.riskPercent), entry: Number(draft.entry), stop: Number(draft.stop) })
        .then((result) => { if (!cancelled) setLots(result); })
        .catch(() => { if (!cancelled) setLots(null); });
    }, LOTS_DEBOUNCE_MS);
    return () => { cancelled = true; window.clearTimeout(timer); };
  }, [plan, balance, draft.symbol, draft.riskPercent, draft.entry, draft.stop]);

  function update<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  return (
    <section className={workspace.module}>
      <div className={styles.moduleHead}>
        <h2 className={styles.moduleTitleInline}>{t("execution.calc.title")}</h2>
        <span className={styles.updated}>{f.money(balance)}</span>
      </div>
      <div className={styles.calc}>
        <div className={styles.calcFields}>
          <label className={workspace.field}><span className={workspace.label}>{t("execution.calc.symbol")}</span><input name="symbol" autoComplete="off" className={workspace.input} value={draft.symbol} onChange={(event) => update("symbol", event.target.value.toUpperCase())} /></label>
          <label className={workspace.field}><span className={workspace.label}>{t("execution.calc.riskPercent")}</span><input name="riskPercent" autoComplete="off" type="number" min="0" max="100" step="any" inputMode="decimal" className={workspace.input} value={draft.riskPercent} onChange={(event) => update("riskPercent", event.target.value)} /></label>
          <label className={workspace.field}><span className={workspace.label}>{t("execution.calc.entry")}</span><input name="entry" autoComplete="off" type="number" min="0" step="any" inputMode="decimal" className={workspace.input} value={draft.entry} onChange={(event) => update("entry", event.target.value)} /></label>
          <label className={workspace.field}><span className={workspace.label}>{t("execution.calc.stop")}</span><input name="stop" autoComplete="off" type="number" min="0" step="any" inputMode="decimal" className={workspace.input} value={draft.stop} onChange={(event) => update("stop", event.target.value)} /></label>
        </div>
        <div className={styles.calcResults}>
          <Tile label={t("execution.calc.riskAmount")} value={plan ? f.money(plan.riskAmount) : "—"} />
          <Tile label={t("execution.calc.stopDistance")} value={plan ? f.number(plan.stopDistance, 2) : "—"} />
          <Tile label={t("execution.calc.lots")} value={lots?.recommendedLots !== null && lots?.recommendedLots !== undefined ? f.number(lots.recommendedLots, 2) : "—"} />
          <Tile label={t("execution.calc.units")} value={plan ? f.number(plan.approximateUnits, 4) : "—"} />
        </div>
        <p className={workspace.notice}>{t("execution.calc.note")}</p>
      </div>
    </section>
  );
}
