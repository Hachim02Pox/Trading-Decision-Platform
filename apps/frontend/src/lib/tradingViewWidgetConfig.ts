interface TradingViewAdvancedChartConfigInput {
  symbol: string;
  interval: string;
  language: string;
}

export function buildTradingViewAdvancedChartConfig({ symbol, interval, language }: TradingViewAdvancedChartConfigInput) {
  return {
    autosize: true,
    symbol,
    interval,
    timezone: "Etc/UTC",
    theme: "dark",
    backgroundColor: "#05070a",
    gridColor: "rgba(44, 54, 68, 0.35)",
    style: "1",
    locale: language === "FR" ? "fr" : "en",
    withdateranges: true,
    hide_side_toolbar: false,
    hide_top_toolbar: false,
    hide_legend: false,
    hide_volume: false,
    allow_symbol_change: false,
    save_image: true,
    calendar: false,
    hotlist: false,
    details: true,
    show_popup_button: false,
    support_host: "https://www.tradingview.com",
  } as const;
}
