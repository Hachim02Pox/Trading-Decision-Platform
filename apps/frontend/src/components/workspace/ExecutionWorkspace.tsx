"use client";

import { useEffect, useMemo, useState } from "react";
import { calculateRiskPlan } from "@/lib/traderWorkspace";
import { useTranslation } from "@/i18n/useTranslation";
import type { TranslationKey } from "@/i18n/en";
import styles from "./Workspace.module.css";

const STORAGE_KEY = "goldTerminal.executionWorkspace.v1";

// Overnight session 2026-09-16: the old 6-item pre-trade checklist and the
// free-text thesis/invalidation fields are gone (that job moves to the
// Journal instead, per Hachim). Replaced with 3 quick, non-persisted
// validation questions — same light "check before you trade" spirit,
// deliberately not an analyzed/saved artifact.
const VALIDATION_CHECKS: TranslationKey[] = [
  "execution.validation.macro",
  "execution.validation.fundamental",
  "execution.validation.risk",
];

// Broker/platform connection is a real open research item (see
// docs/OVERNIGHT_TASKLIST_2026-09-16.md §4.3): MetaQuotes has no free
// official MT5 API, and no major prop firm (FTMO, The 5%ers, etc.) exposes
// a public account-connection API — every path found requires a paid
// third-party bridge (MetaApi and similar). Rather than fake a connection
// that doesn't work, this stays an honest "coming soon" state.
const BROKER_PLATFORMS: TranslationKey[] = [
  "execution.brokerPlatform.mt5",
  "execution.brokerPlatform.propFirm",
  "execution.brokerPlatform.broker",
];

interface ExecutionDraft {
  accountBalance: string;
  riskPercent: string;
  entryPrice: string;
  stopPrice: string;
}

const EMPTY_DRAFT: ExecutionDraft = { accountBalance: "", riskPercent: "0.50", entryPrice: "", stopPrice: "" };

function readDraft(): ExecutionDraft {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "null") as Partial<ExecutionDraft> | null;
    if (!parsed) return EMPTY_DRAFT;
    return {
      accountBalance: typeof parsed.accountBalance === "string" ? parsed.accountBalance : "",
      riskPercent: typeof parsed.riskPercent === "string" ? parsed.riskPercent : "0.50",
      entryPrice: typeof parsed.entryPrice === "string" ? parsed.entryPrice : "",
      stopPrice: typeof parsed.stopPrice === "string" ? parsed.stopPrice : "",
    };
  } catch {
    return EMPTY_DRAFT;
  }
}

export function ExecutionWorkspace() {
  const { t, language } = useTranslation();
  const [draft, setDraft] = useState<ExecutionDraft>(EMPTY_DRAFT);
  const [hydrated, setHydrated] = useState(false);
  const [validation, setValidation] = useState<boolean[]>(VALIDATION_CHECKS.map(() => false));

  useEffect(() => { setDraft(readDraft()); setHydrated(true); }, []);
  useEffect(() => {
    if (!hydrated) return;
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(draft)); } catch { /* Local persistence is optional. */ }
  }, [draft, hydrated]);

  const riskPlan = useMemo(() => calculateRiskPlan({
    accountBalance: Number(draft.accountBalance),
    riskPercent: Number(draft.riskPercent),
    entryPrice: Number(draft.entryPrice),
    stopPrice: Number(draft.stopPrice),
  }), [draft.accountBalance, draft.entryPrice, draft.riskPercent, draft.stopPrice]);
  const money = (value: number) => new Intl.NumberFormat(language === "FR" ? "fr-FR" : "en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(value);

  function update<K extends keyof ExecutionDraft>(key: K, value: ExecutionDraft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <div><h1 className={styles.pageTitle}>{t("pageTitle.execution")}</h1><p className={styles.pageIntro}>{t("execution.intro")}</p></div>
        <button type="button" className={styles.dangerButton} onClick={() => { if (window.confirm(t("execution.resetConfirm"))) setDraft(EMPTY_DRAFT); }}>{t("execution.reset")}</button>
      </header>
      <div className={styles.gridTwo}>
        <section className={styles.module}>
          <span className={styles.moduleTitle}>{t("execution.riskTitle")}</span>
          <div className={styles.form}>
            <div className={styles.inlineFields}>
              <label className={styles.field}><span className={styles.label}>{t("execution.balance")}</span><input name="accountBalance" autoComplete="off" type="number" min="0" step="any" className={styles.input} inputMode="decimal" value={draft.accountBalance} onChange={(event) => update("accountBalance", event.target.value)} /></label>
              <label className={styles.field}><span className={styles.label}>{t("execution.riskPercent")}</span><input name="riskPercent" autoComplete="off" type="number" min="0" max="100" step="any" className={styles.input} inputMode="decimal" value={draft.riskPercent} onChange={(event) => update("riskPercent", event.target.value)} /></label>
              <label className={styles.field}><span className={styles.label}>{t("execution.entry")}</span><input name="entryPrice" autoComplete="off" type="number" min="0" step="any" className={styles.input} inputMode="decimal" value={draft.entryPrice} onChange={(event) => update("entryPrice", event.target.value)} /></label>
              <label className={styles.field}><span className={styles.label}>{t("execution.stop")}</span><input name="stopPrice" autoComplete="off" type="number" min="0" step="any" className={styles.input} inputMode="decimal" value={draft.stopPrice} onChange={(event) => update("stopPrice", event.target.value)} /></label>
            </div>
            <div className={styles.stats}>
              <div className={styles.stat}><span className={styles.statLabel}>{t("execution.riskAmount")}</span><strong className={styles.statValue}>{riskPlan ? money(riskPlan.riskAmount) : "—"}</strong></div>
              <div className={styles.stat}><span className={styles.statLabel}>{t("execution.stopDistance")}</span><strong className={styles.statValue}>{riskPlan ? riskPlan.stopDistance.toFixed(2) : "—"}</strong></div>
              <div className={styles.stat}><span className={styles.statLabel}>{t("execution.approxUnits")}</span><strong className={styles.statValue}>{riskPlan ? riskPlan.approximateUnits.toFixed(4) : "—"}</strong></div>
            </div>
            <p className={styles.notice}>{t("execution.riskDisclaimer")}</p>
          </div>

          <span className={styles.moduleTitle}>{t("execution.validationTitle")}</span>
          <ul className={styles.checklist}>
            {VALIDATION_CHECKS.map((key, index) => (
              <li key={key}>
                <label className={styles.checkRow}>
                  <input
                    name={`preTradeValidation${index + 1}`}
                    type="checkbox"
                    checked={validation[index]}
                    onChange={(event) => setValidation(validation.map((value, current) => (current === index ? event.target.checked : value)))}
                  />
                  <span>{t(key)}</span>
                </label>
              </li>
            ))}
          </ul>
          <p className={styles.notice}>{t("execution.validationNote")}</p>
        </section>

        <section className={styles.module}>
          <span className={styles.moduleTitle}>{t("execution.brokerTitle")}</span>
          <ul className={styles.checklist}>
            {BROKER_PLATFORMS.map((key) => (
              <li key={key} className={styles.checkRow}>
                <span>{t(key)}</span>
                <span className={styles.readiness}>{t("execution.brokerComingSoon")}</span>
              </li>
            ))}
          </ul>
          <button type="button" className={styles.button} disabled aria-disabled="true">
            {t("execution.brokerConnect")}
          </button>
          <p className={styles.notice}>{t("execution.brokerResearchNote")}</p>
        </section>
      </div>
    </div>
  );
}
