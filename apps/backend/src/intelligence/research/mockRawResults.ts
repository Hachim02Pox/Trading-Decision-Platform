import type { RawSearchResult } from "./rawResult";
import type { TopicTag } from "./topicPlans";

// Patch 5/10 — a small canned RawSearchResult[] per topic, standing in for
// the "shared search" step until a real provider exists (see dataMode.ts).
// Deliberately illustrative rather than exhaustive: enough to prove every
// pipeline stage (dedupe-by-URL, wire-syndication collapse, near-duplicate
// merge, corroboration counting, and a genuine DISPUTED pair) actually
// works end to end. Topics with no entry return an empty array — a
// legitimate "no canned mock research for this topic yet" state, not a bug.
//
// The CPI_RELEASE set below is the "shared across F2/F3/F4/F6" example
// referenced throughout the milestone spec: one release, multiple KPIs.
export const MOCK_RAW_RESULTS: Partial<Record<TopicTag, RawSearchResult[]>> = {
  CPI_RELEASE: [
    {
      url: "https://www.reuters.com/markets/us/cpi-report-july-2026",
      publisher: "Reuters",
      byline: "Reuters",
      headline: "US core CPI rises 0.3% in July, matching estimates and keeping Fed on a cautious path",
      publishedAt: "2026-08-13T12:35:00.000Z",
      providerResultId: "cpi-r1",
      snippet: "The Bureau of Labor Statistics reported core CPI rose 0.3% in July...",
    },
    {
      url: "https://www.cnbc.com/2026/08/13/cpi-report-reuters-wire.html?utm_source=share",
      publisher: "CNBC",
      byline: "Reuters",
      headline: "US core CPI rises 0.3% in July, matching estimates and keeping Fed on a cautious path",
      publishedAt: "2026-08-13T12:41:00.000Z",
      providerResultId: "cpi-r2",
      snippet: "(Reuters) — The Bureau of Labor Statistics reported core CPI rose 0.3%...",
    },
    {
      url: "https://www.bloomberg.com/news/articles/2026-08-13/cpi-in-line",
      publisher: "Bloomberg",
      byline: "Bloomberg",
      headline: "Core CPI rises 0.3% in July, matching estimates, keeping Fed on a cautious path",
      publishedAt: "2026-08-13T12:44:00.000Z",
      providerResultId: "cpi-r3",
      snippet: "US core consumer prices rose 0.3% last month, in line with economist forecasts...",
    },
    {
      url: "https://www.wsj.com/economy/central-banking/cpi-holds-steady-2026",
      publisher: "WSJ",
      byline: "WSJ",
      headline: "Core CPI Holds Steady in July, Matching Forecasts",
      publishedAt: "2026-08-13T13:10:00.000Z",
      providerResultId: "cpi-r4",
      snippet: "Inflation data released Wednesday showed price pressures held steady...",
    },
    {
      url: "https://www.bls.gov/news.release/cpi.nr0.htm",
      publisher: "Bureau of Labor Statistics",
      headline: "Consumer Price Index Summary — core index up 0.3 percent in July",
      publishedAt: "2026-08-13T12:30:00.000Z",
      providerResultId: "cpi-r5",
      snippet: "The Consumer Price Index for All Urban Consumers rose 0.3 percent in July on a seasonally adjusted basis...",
    },
  ],
  FED_COMMUNICATION: [
    {
      url: "https://www.reuters.com/markets/rates-bonds/fomc-minutes-dovish-2026",
      publisher: "Reuters",
      byline: "Reuters",
      headline: "Fed funds futures price faster rate cuts after dovish FOMC minutes",
      publishedAt: "2026-08-20T18:05:00.000Z",
      providerResultId: "fed-r1",
      snippet: "Minutes from the Fed's last meeting showed growing concern about labor market softness...",
    },
    {
      url: "https://www.ft.com/content/fomc-minutes-dovish-repricing-2026",
      publisher: "Financial Times",
      byline: "Financial Times",
      headline: "Markets price in faster Fed rate cuts following dovish FOMC minutes",
      publishedAt: "2026-08-20T18:20:00.000Z",
      providerResultId: "fed-r2",
      snippet: "Traders added to bets on additional Fed easing after minutes revealed a more dovish tilt...",
    },
  ],
  LABOR_RELEASE: [
    {
      url: "https://www.bloomberg.com/news/articles/2026-08-15/fed-labor-cooling",
      publisher: "Bloomberg",
      byline: "Bloomberg",
      headline: "Fed officials increasingly convinced labor market is cooling meaningfully",
      publishedAt: "2026-08-15T14:00:00.000Z",
      providerResultId: "labor-r1",
      snippet: "Several Fed officials have grown more convinced that the labor market is losing momentum...",
    },
    {
      url: "https://www.wsj.com/economy/jobs/fed-downplays-labor-cooling-2026",
      publisher: "WSJ",
      byline: "WSJ",
      headline: "Fed officials downplay labor cooling, call recent payrolls miss noise not signal",
      publishedAt: "2026-08-15T16:30:00.000Z",
      providerResultId: "labor-r2",
      snippet: "Other Fed officials pushed back on the cooling narrative, characterizing the payrolls miss as noise...",
    },
  ],
  TREASURY_SUPPLY: [
    {
      url: "https://www.reuters.com/markets/rates-bonds/weak-10-year-auction-2026",
      publisher: "Reuters",
      byline: "Reuters",
      headline: "Weak demand at 10-year Treasury auction pushes yields higher",
      publishedAt: "2026-08-22T18:05:00.000Z",
      providerResultId: "tsy-r1",
      snippet: "A soft 10-year note auction saw a wider-than-expected tail as dealers absorbed more supply...",
    },
    {
      url: "https://www.treasurydirect.gov/auction-results/10y-aug-2026",
      publisher: "U.S. Treasury",
      headline: "Treasury 10-Year Note Auction Results: bid-to-cover 2.48",
      publishedAt: "2026-08-22T17:00:00.000Z",
      providerResultId: "tsy-r2",
      snippet: "High yield 4.31%, bid-to-cover ratio 2.48, indirect bidders awarded 68%...",
    },
  ],
  USD_DRIVERS: [
    {
      url: "https://www.reuters.com/markets/currencies/dollar-slips-fed-cuts-2026",
      publisher: "Reuters",
      byline: "Reuters",
      headline: "Dollar slips as traders price in faster Fed cuts",
      publishedAt: "2026-08-20T19:00:00.000Z",
      providerResultId: "usd-r1",
      snippet: "The dollar index fell against a basket of peers as rate-cut bets firmed...",
    },
  ],
  GOLD_VOL: [
    {
      url: "https://www.cmegroup.com/research-desk/gold-options-vol-catalysts-2026",
      publisher: "CME Research Desk",
      headline: "Gold options market prices bigger swings ahead of CPI and FOMC",
      publishedAt: "2026-08-11T15:00:00.000Z",
      providerResultId: "vol-r1",
      snippet: "Implied volatility on gold options has picked up into the CPI print and the upcoming FOMC decision...",
    },
  ],
};
