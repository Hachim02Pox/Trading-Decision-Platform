"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "@/i18n/useTranslation";
import { useConnectionStatus, type ConnectionStatus } from "@/lib/useConnectionStatus";
import type { TranslationKey } from "@/i18n/en";
import styles from "./StatusBar.module.css";

function formatClock(date: Date, language: "EN" | "FR"): { utc: string; local: string } {
  const utc = date.toISOString().slice(11, 16);
  const local = date.toLocaleTimeString(language === "FR" ? "fr-FR" : "en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  return { utc, local };
}

// Milestone 1E, section 9 — replaces the previously-hardcoded "Connected"
// caption with a real, derived state.
const CONNECTION_LABEL_KEY: Record<ConnectionStatus, TranslationKey> = {
  CONNECTED: "status.connected",
  DISCONNECTED: "status.disconnected",
  RECONNECTING: "status.reconnecting",
};

const CONNECTION_CLASS: Record<ConnectionStatus, string> = {
  CONNECTED: styles.connected,
  DISCONNECTED: styles.connectionDisconnected,
  RECONNECTING: styles.connectionReconnecting,
};

export function StatusBar() {
  const [now, setNow] = useState<Date | null>(null);
  const { t, language } = useTranslation();
  const connectionStatus = useConnectionStatus();

  useEffect(() => {
    setNow(new Date());
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={styles.bar}>
      <span className={styles.spacer} />
      <span className={styles.mockCaption}>{t("status.mockData")}</span>
      <span className={styles.clock}>
        {now
          ? t("status.clock", { ...formatClock(now, language) })
          : t("status.clock", { utc: "--:--", local: "--:--" })}
      </span>
      <span className={CONNECTION_CLASS[connectionStatus]}>{t(CONNECTION_LABEL_KEY[connectionStatus])}</span>
    </div>
  );
}
