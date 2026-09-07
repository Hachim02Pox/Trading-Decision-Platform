"use client";

import { useEffect, useState } from "react";
import type { ProviderStatus, ProviderStatusState } from "@gold-terminal/contracts";
import { useSettings } from "@/context/SettingsContext";
import { useTranslation } from "@/i18n/useTranslation";
import { fetchProviderStatuses } from "@/lib/api/providersClient";
import type { TranslationKey } from "@/i18n/en";
import styles from "./page.module.css";

// Milestone 2A, section 13 — maps each ProviderStatusState to its localized
// display word. Never renders a key/token, even partially masked — this
// component only ever sees the sanitized `ProviderStatus` shape from the
// backend registry.
const STATUS_LABEL_KEY: Record<ProviderStatusState, TranslationKey> = {
  NOT_CONFIGURED: "providerStatus.notConfigured",
  READY: "providerStatus.ready",
  CONNECTING: "providerStatus.connecting",
  CONNECTED: "providerStatus.connected",
  DEGRADED: "providerStatus.degraded",
  UNAVAILABLE: "providerStatus.unavailable",
  ERROR: "providerStatus.error",
};

function DataSourcesSection() {
  const { t } = useTranslation();
  const [providers, setProviders] = useState<ProviderStatus[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchProviderStatuses()
      .then((result) => {
        if (!cancelled) setProviders(result);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className={styles.section}>
      <div className={styles.rowText}>
        <span className={styles.label}>{t("settings.dataSourcesLabel")}</span>
        <span className={styles.helper}>{t("settings.dataSourcesHelper")}</span>
      </div>

      {failed && <p className={styles.helper}>{t("settings.dataSourcesFailedToLoad")}</p>}
      {!failed && !providers && <p className={styles.helper}>{t("settings.dataSourcesLoading")}</p>}

      {providers && (
        <table className={styles.dataSourcesTable}>
          <thead>
            <tr>
              <th>{t("settings.dataSourcesProviderColumn")}</th>
              <th>{t("settings.dataSourcesStatusColumn")}</th>
            </tr>
          </thead>
          <tbody>
            {providers.map((provider) => (
              <tr key={provider.providerId}>
                <td>{provider.displayName}</td>
                <td>{t(STATUS_LABEL_KEY[provider.status])}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default function SettingsPage() {
  const { directionalColoring, setDirectionalColoring, language, setLanguage } = useSettings();
  const { t } = useTranslation();

  return (
    <div>
      <h1 className={styles.pageTitle}>{t("pageTitle.settings")}</h1>

      <div className={styles.section}>
        <div className={styles.row}>
          <div className={styles.rowText}>
            <span className={styles.label}>{t("settings.directionalColoringLabel")}</span>
            <span className={styles.helper}>{t("settings.directionalColoringHelper")}</span>
          </div>

          <div
            className={styles.segmented}
            role="group"
            aria-label={t("settings.directionalColoringLabel")}
          >
            <button
              type="button"
              className={`${styles.segment} ${!directionalColoring ? styles.segmentActive : ""}`}
              aria-pressed={!directionalColoring}
              onClick={() => setDirectionalColoring(false)}
            >
              {t("settings.off")}
            </button>
            <button
              type="button"
              className={`${styles.segment} ${directionalColoring ? styles.segmentActive : ""}`}
              aria-pressed={directionalColoring}
              onClick={() => setDirectionalColoring(true)}
            >
              {t("settings.on")}
            </button>
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.row}>
          <div className={styles.rowText}>
            <span className={styles.label}>{t("settings.languageLabel")}</span>
            <span className={styles.helper}>{t("settings.languageHelper")}</span>
          </div>

          <div className={styles.segmented} role="group" aria-label={t("settings.languageLabel")}>
            <button
              type="button"
              className={`${styles.segment} ${language === "EN" ? styles.segmentActive : ""}`}
              aria-pressed={language === "EN"}
              onClick={() => setLanguage("EN")}
            >
              {t("settings.languageEnglish")}
            </button>
            <button
              type="button"
              className={`${styles.segment} ${language === "FR" ? styles.segmentActive : ""}`}
              aria-pressed={language === "FR"}
              onClick={() => setLanguage("FR")}
            >
              {t("settings.languageFrench")}
            </button>
          </div>
        </div>
      </div>

      <DataSourcesSection />
    </div>
  );
}
