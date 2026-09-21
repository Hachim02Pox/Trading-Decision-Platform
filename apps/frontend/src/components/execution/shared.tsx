"use client";

import type { ReactNode } from "react";
import type { Section } from "@/lib/api/executionClient";
import { useTranslation } from "@/i18n/useTranslation";
import workspace from "../workspace/Workspace.module.css";
import styles from "./Execution.module.css";

export function useFormat() {
  const { language } = useTranslation();
  const locale = language === "FR" ? "fr-FR" : "en-US";
  const usd = new Intl.NumberFormat(locale, { style: "currency", currency: "USD", maximumFractionDigits: 2 });
  const signedUsd = new Intl.NumberFormat(locale, { style: "currency", currency: "USD", maximumFractionDigits: 2, signDisplay: "exceptZero" });
  const plain = (digits: number) => new Intl.NumberFormat(locale, { maximumFractionDigits: digits });
  return {
    money: (value: number | null | undefined) => (value === null || value === undefined ? "—" : usd.format(value)),
    signedMoney: (value: number | null | undefined) => (value === null || value === undefined ? "—" : signedUsd.format(value)),
    number: (value: number | null | undefined, digits = 2) => (value === null || value === undefined ? "—" : plain(digits).format(value)),
    percent: (value: number | null | undefined, digits = 1) => (value === null || value === undefined ? "—" : `${plain(digits).format(value)} %`),
    time: (iso: string) => new Date(iso).toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
  };
}

/** Existing P&L colouring from Workspace.module.css (also used by the journal). */
export function pnlClass(value: number | null | undefined): string {
  if (value === null || value === undefined || value === 0) return "";
  return value > 0 ? workspace.positive : workspace.negative;
}

interface SectionCardProps<T> {
  title: string;
  section: Section<T>;
  actions?: ReactNode;
  children: (data: T) => ReactNode;
}

/** A dashboard module that degrades on its own: a failing FundedNext endpoint shows its message here and nowhere else. */
export function SectionCard<T>({ title, section, actions, children }: SectionCardProps<T>) {
  const { t } = useTranslation();
  return (
    <section className={workspace.module}>
      <div className={styles.moduleHead}>
        <h2 className={styles.moduleTitleInline}>{title}</h2>
        {actions}
      </div>
      {section.status === "ok" && section.data !== null
        ? children(section.data)
        : <p className={styles.unavailable}>{t("execution.unavailable", { message: section.message ?? "—" })}</p>}
    </section>
  );
}

export function Tile({ label, value, sub, valueClassName }: { label: string; value: ReactNode; sub?: ReactNode; valueClassName?: string }) {
  return (
    <div className={styles.tile}>
      <span className={styles.tileLabel}>{label}</span>
      <strong className={`${styles.tileValue} ${valueClassName ?? ""}`}>{value}</strong>
      {sub ? <span className={styles.tileSub}>{sub}</span> : null}
    </div>
  );
}
