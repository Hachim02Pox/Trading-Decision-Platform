"use client";

import { useEffect, useRef } from "react";
import type { Language } from "@gold-terminal/contracts";

const WIDGET_SCRIPT_SRC = "https://s3.tradingview.com/external-embedding/embed-widget-mini-symbol-overview.js";

interface TradingViewMiniSymbolOverviewProps {
  symbol: string;
  language: Language;
}

/**
 * TradingView's official "Mini Symbol Overview" embed widget — a real,
 * documented, sanctioned embedding mechanism (container div + widget div +
 * a <script> tag whose text content is a JSON config, exactly as
 * TradingView's own widget docs specify), NOT an attempt to frame
 * tradingview.com's main site (which blocks framing like every other
 * source here). Rebuilds the widget from scratch on symbol/language change
 * since the script only reads its config once, at load time.
 */
export function TradingViewMiniSymbolOverview({ symbol, language }: TradingViewMiniSymbolOverviewProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    container.innerHTML = ""; // clears to an empty string only — no untrusted content is ever assigned here

    const widgetDiv = document.createElement("div");
    widgetDiv.className = "tradingview-widget-container__widget";

    const script = document.createElement("script");
    script.src = WIDGET_SCRIPT_SRC;
    script.async = true;
    script.type = "text/javascript";
    script.text = JSON.stringify({
      symbol,
      width: "100%",
      height: 300,
      locale: language === "FR" ? "fr" : "en",
      dateRange: "3M",
      colorTheme: "dark",
      isTransparent: true,
      autosize: true,
    });

    container.appendChild(widgetDiv);
    container.appendChild(script);
  }, [symbol, language]);

  return <div ref={containerRef} className="tradingview-widget-container" style={{ width: "100%", minHeight: 300 }} />;
}
