export interface GldMetricRow {
  dateIso: string;
  tonnesOfGold: number | null;
  closingPrice: number | null;
}

export type FlowPersistence =
  | "PERSISTENT_EXPANSION"
  | "PERSISTENT_CONTRACTION"
  | "SHORT_TERM_REVERSAL_UP"
  | "SHORT_TERM_REVERSAL_DOWN"
  | "MIXED_FLAT";

export type PriceFlowState =
  | "CONFIRMS_PRICE_STRENGTH"
  | "NEGATIVE_ETF_FLOW_DIVERGENCE"
  | "POSITIVE_ETF_FLOW_DIVERGENCE"
  | "CONFIRMS_PRICE_WEAKNESS"
  | "NEUTRAL_NON_CONFIRMATION";

export interface GldParticipationMetrics {
  latestDateIso: string;
  latestTonnes: number;
  change1: number | null;
  change5: number | null;
  change20: number | null;
  flowZ60: number | null;
  flow20Percentile: number | null;
  priceReturn5: number | null;
  priceReturn20: number | null;
  persistence: FlowPersistence;
  priceFlow: PriceFlowState;
}

const ETF_FLOW_PERCENTILE_LOOKBACK = 756;
const FLOW_Z_WINDOW = 60;

function signed(value: number | null): -1 | 0 | 1 {
  if (value === null || value === 0) return 0;
  return value > 0 ? 1 : -1;
}

function changeAt(values: readonly number[], offset: number): number | null {
  return values.length > offset ? values[values.length - 1] - values[values.length - 1 - offset] : null;
}

function returnAt(values: readonly number[], offset: number): number | null {
  if (values.length <= offset) return null;
  const prior = values[values.length - 1 - offset];
  return prior === 0 ? null : ((values[values.length - 1] / prior) - 1) * 100;
}

function classifyPersistence(change5: number | null, change20: number | null): FlowPersistence {
  const short = signed(change5);
  const medium = signed(change20);
  if (short > 0 && medium > 0) return "PERSISTENT_EXPANSION";
  if (short < 0 && medium < 0) return "PERSISTENT_CONTRACTION";
  if (short > 0 && medium < 0) return "SHORT_TERM_REVERSAL_UP";
  if (short < 0 && medium > 0) return "SHORT_TERM_REVERSAL_DOWN";
  return "MIXED_FLAT";
}

function rollingZScore(values: readonly number[], window: number): number | null {
  if (values.length < window) return null;
  const sample = values.slice(-window);
  const mean = sample.reduce((sum, value) => sum + value, 0) / sample.length;
  const variance = sample.reduce((sum, value) => sum + (value - mean) ** 2, 0) / sample.length;
  const std = Math.sqrt(variance);
  return std === 0 ? null : (sample[sample.length - 1] - mean) / std;
}

function percentileRank(current: number, history: readonly number[]): number {
  return (history.filter((value) => value <= current).length / history.length) * 100;
}

export function classifyPriceFlow(priceReturn20: number | null, physicalChange20: number | null): PriceFlowState {
  const price = signed(priceReturn20);
  const flow = signed(physicalChange20);
  if (price > 0 && flow > 0) return "CONFIRMS_PRICE_STRENGTH";
  if (price > 0 && flow < 0) return "NEGATIVE_ETF_FLOW_DIVERGENCE";
  if (price < 0 && flow > 0) return "POSITIVE_ETF_FLOW_DIVERGENCE";
  if (price < 0 && flow < 0) return "CONFIRMS_PRICE_WEAKNESS";
  return "NEUTRAL_NON_CONFIRMATION";
}

export function classifyBreadth(cftcWowChange: number | null, etfChange5: number | null): ParticipationBreadth {
  return classifyParticipationBreadth(cftcWowChange, etfChange5)!;
}

export function computeGldParticipationMetrics(rows: readonly GldMetricRow[]): GldParticipationMetrics {
  const valid = rows.filter(
    (row): row is GldMetricRow & { tonnesOfGold: number; closingPrice: number } =>
      row.tonnesOfGold !== null && row.closingPrice !== null
  );
  if (valid.length === 0) throw new Error("no valid GLD issuer observations");

  const tonnes = valid.map((row) => row.tonnesOfGold);
  const prices = valid.map((row) => row.closingPrice);
  const dailyFlows = tonnes.slice(1).map((value, index) => value - tonnes[index]);
  const flow20History = tonnes.slice(20).map((value, index) => value - tonnes[index]);
  const percentileHistory = flow20History.slice(-ETF_FLOW_PERCENTILE_LOOKBACK);
  const change5 = changeAt(tonnes, 5);
  const change20 = changeAt(tonnes, 20);
  const priceReturn20 = returnAt(prices, 20);

  return {
    latestDateIso: valid[valid.length - 1].dateIso,
    latestTonnes: tonnes[tonnes.length - 1],
    change1: changeAt(tonnes, 1),
    change5,
    change20,
    flowZ60: rollingZScore(dailyFlows, FLOW_Z_WINDOW),
    flow20Percentile:
      percentileHistory.length < ETF_FLOW_PERCENTILE_LOOKBACK
        ? null
        : percentileRank(percentileHistory[percentileHistory.length - 1], percentileHistory),
    priceReturn5: returnAt(prices, 5),
    priceReturn20,
    persistence: classifyPersistence(change5, change20),
    priceFlow: classifyPriceFlow(priceReturn20, change20),
  };
}
import { classifyParticipationBreadth, type ParticipationBreadth } from "@gold-terminal/contracts";
