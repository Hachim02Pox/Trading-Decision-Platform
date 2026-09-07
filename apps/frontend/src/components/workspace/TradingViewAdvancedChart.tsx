"use client";

import { memo, useEffect, useRef } from "react";
import { useTranslation } from "@/i18n/useTranslation";
import { buildTradingViewAdvancedChartConfig } from "@/lib/tradingViewWidgetConfig";
import styles from "./Workspace.module.css";

interface TradingViewAdvancedChartProps {
  symbol: string;
  symbolLabel: string;
  interval: string;
}

function TradingViewAdvancedChartComponent({ symbol, symbolLabel, interval }: TradingViewAdvancedChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { language } = useTranslation();

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    container.replaceChildren();

    // React development mode probes effects with an immediate setup/cleanup cycle.
    // Deferring the external script prevents that probe from orphaning an in-flight
    // TradingView script, which otherwise throws while locating its parent node.
    const initializationTimer = window.setTimeout(() => {
      if (!container.isConnected) return;

      const widget = document.createElement("div");
      widget.className = "tradingview-widget-container__widget";
      widget.style.height = "calc(100% - 24px)";
      widget.style.width = "100%";
      const attribution = document.createElement("div");
      attribution.className = styles.chartAttribution;
      const attributionLink = document.createElement("a");
      const [exchange, ticker] = symbol.split(":");
      attributionLink.href = `https://www.tradingview.com/symbols/${encodeURIComponent(ticker ?? symbol)}/?exchange=${encodeURIComponent(exchange ?? "")}`;
      attributionLink.target = "_blank";
      attributionLink.rel = "noopener nofollow";
      attributionLink.textContent = `${symbolLabel} chart by TradingView`;
      attributionLink.translate = false;
      attribution.append(attributionLink);
      const script = document.createElement("script");
      script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
      script.type = "text/javascript";
      script.async = true;
      script.text = JSON.stringify(buildTradingViewAdvancedChartConfig({ symbol, interval, language }));
      container.append(widget, attribution, script);
    }, 0);

    return () => {
      window.clearTimeout(initializationTimer);
      container.replaceChildren();
    };
  }, [interval, language, symbol, symbolLabel]);

  return <div ref={containerRef} className={`tradingview-widget-container ${styles.chartWidget}`} />;
}

export const TradingViewAdvancedChart = memo(TradingViewAdvancedChartComponent);
