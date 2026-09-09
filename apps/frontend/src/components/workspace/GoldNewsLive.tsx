"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "@/i18n/useTranslation";
import styles from "./GoldNewsLive.module.css";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4001";

interface GoldNewsItem {
  id: number;
  category: string;
  headline: string;
  summary: string;
  source: string;
  url: string;
  publishedAt: string;
}

function sortGoldNews(items: GoldNewsItem[]): GoldNewsItem[] {
  return [...items].sort((left, right) => Date.parse(right.publishedAt) - Date.parse(left.publishedAt));
}

export function GoldNewsLive() {
  const { t, language } = useTranslation();
  const [items, setItems] = useState<GoldNewsItem[]>([]);
  const [status, setStatus] = useState<"connecting" | "live" | "error">("connecting");

  useEffect(() => {
    let isActive = true;
    let stream: EventSource | null = null;
    let reconnectTimer: number | undefined;
    let refreshTimer: number | undefined;

    const loadSnapshot = async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/api/news/gold`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const payload = (await response.json()) as { items?: GoldNewsItem[] };
        if (!isActive || !Array.isArray(payload.items)) return;
        setItems(sortGoldNews(payload.items));
        setStatus("live");
      } catch {
        if (isActive) setStatus("error");
      }
    };

    const connect = () => {
      if (!isActive) return;
      stream = new EventSource(`${BACKEND_URL}/api/news/gold/stream`);

      const handleConnected = () => {
        if (!isActive) return;
        setStatus("live");
        void loadSnapshot();
      };

      const handleNews = (event: MessageEvent<string>) => {
        if (!isActive) return;
        try {
          const nextItems = JSON.parse(event.data) as GoldNewsItem[];
          if (!Array.isArray(nextItems)) return;
          setItems(sortGoldNews(nextItems));
          setStatus("live");
        } catch {
          if (isActive) setStatus("error");
        }
      };

      const handleProviderError = () => {
        if (!isActive) return;
        setStatus("error");
        void loadSnapshot();
      };

      stream.addEventListener("connected", handleConnected);
      stream.addEventListener("news", handleNews);
      stream.addEventListener("provider-error", handleProviderError);
      stream.onerror = () => {
        if (!isActive) return;
        setStatus("error");
        stream?.close();
        reconnectTimer = window.setTimeout(() => {
          if (isActive) {
            connect();
          }
        }, 2_500);
      };
    };

    void loadSnapshot();
    connect();
    refreshTimer = window.setInterval(() => {
      if (isActive) {
        void loadSnapshot();
      }
    }, 15_000);

    return () => {
      isActive = false;
      if (reconnectTimer) window.clearTimeout(reconnectTimer);
      if (refreshTimer) window.clearInterval(refreshTimer);
      stream?.close();
    };
  }, []);

  return (
    <section className={styles.section} aria-labelledby="gold-news-title">
      <div className={styles.headerRow}>
        <div>
          <span className={styles.eyebrow}>{t("news.liveEyebrow")}</span>
          <h2 id="gold-news-title" className={styles.title}>{t("news.liveTitle")}</h2>
        </div>
        <span className={`${styles.status} ${status === "live" ? styles.statusLive : status === "error" ? styles.statusError : ""}`}>
          <span className={styles.statusDot} aria-hidden="true" />
          {status === "live" ? t("news.liveStatus") : status === "error" ? t("news.unavailableStatus") : t("news.connectingStatus")}
        </span>
      </div>

      {status === "error" && <p className={styles.message}>{t("news.liveError")}</p>}
      {status !== "error" && items.length === 0 && <p className={styles.message}>{t("news.liveWaiting")}</p>}
      {items.length > 0 && (
        <div className={styles.list}>
          {items.map((item) => (
            <article key={item.id} className={styles.item}>
              <div className={styles.itemMeta}>
                <span>{item.source}</span>
                <time dateTime={item.publishedAt}>{new Date(item.publishedAt).toLocaleString(language === "FR" ? "fr-FR" : "en-US", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</time>
              </div>
              <a className={styles.headline} href={item.url} target="_blank" rel="noreferrer">{item.headline}</a>
              {item.summary && <p className={styles.summary}>{item.summary}</p>}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}