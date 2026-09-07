import assert from "node:assert/strict";
import test from "node:test";
import {
  classifyBreadth,
  classifyPriceFlow,
  computeGldParticipationMetrics,
  type GldMetricRow,
} from "../apps/backend/src/real/f10ParticipationMetrics.ts";
import { classifyParticipationBreadth } from "@gold-terminal/contracts";
import {
  buildF10BreadthExplanation,
  buildF10EtfParticipationExplanation,
  buildF10FlowExtensionExplanation,
  buildF10FuturesExplanation,
  buildF10PriceFlowExplanation,
} from "../apps/frontend/src/content/f10Interpretation.ts";

function rows(count: number, tonnes: (index: number) => number, price: (index: number) => number = (index) => 100 + index): GldMetricRow[] {
  return Array.from({ length: count }, (_, index) => ({
    dateIso: new Date(Date.UTC(2024, 0, index + 1)).toISOString(),
    tonnesOfGold: tonnes(index),
    closingPrice: price(index),
  }));
}

test("GLD changes use valid observations and exact 1/5/20-observation offsets", () => {
  const source = rows(90, (index) => 1_000 + index * 2);
  const metrics = computeGldParticipationMetrics(source);

  assert.equal(metrics.change1, 2);
  assert.equal(metrics.change5, 10);
  assert.equal(metrics.change20, 40);
  assert.equal(metrics.persistence, "PERSISTENT_EXPANSION");
});

test("missing/holiday rows do not shift GLD windows", () => {
  const source: GldMetricRow[] = [
    ...rows(25, (index) => 1_000 + index),
    { dateIso: "2024-02-01T00:00:00.000Z", tonnesOfGold: null, closingPrice: null },
    { dateIso: "2024-02-02T00:00:00.000Z", tonnesOfGold: 1_025, closingPrice: 125 },
  ];
  const metrics = computeGldParticipationMetrics(source);

  assert.equal(metrics.change1, 1);
  assert.equal(metrics.change5, 5);
  assert.equal(metrics.change20, 20);
});

test("Z60 is unavailable with insufficient history or zero standard deviation", () => {
  assert.equal(computeGldParticipationMetrics(rows(60, (index) => 1_000 + index)).flowZ60, null);
  assert.equal(computeGldParticipationMetrics(rows(80, (index) => 1_000 + index)).flowZ60, null);
});

test("Z60 uses exactly the latest 60 daily physical changes", () => {
  const source = rows(81, (index) => 1_000 + index + (index === 80 ? 20 : 0));
  const metrics = computeGldParticipationMetrics(source);

  assert.ok(metrics.flowZ60 !== null);
  assert.ok(metrics.flowZ60 > 7, `expected an extreme latest expansion, got ${metrics.flowZ60}`);
});

test("ETF flow percentile ranks current 20-observation change without future lookahead", () => {
  const source = rows(800, (index) => 1_000 + index + (index >= 780 ? (index - 779) * 4 : 0));
  const metrics = computeGldParticipationMetrics(source);

  assert.ok(metrics.flow20Percentile !== null);
  assert.equal(metrics.flow20Percentile, 100);
});

test("ETF flow percentile is unavailable without enough historical 20D-flow observations", () => {
  assert.equal(computeGldParticipationMetrics(rows(100, (index) => 1_000 + index)).flow20Percentile, null);
});

test("price/flow matrix covers all directional combinations and flat state", () => {
  assert.equal(classifyPriceFlow(1, 1), "CONFIRMS_PRICE_STRENGTH");
  assert.equal(classifyPriceFlow(1, -1), "NEGATIVE_ETF_FLOW_DIVERGENCE");
  assert.equal(classifyPriceFlow(-1, 1), "POSITIVE_ETF_FLOW_DIVERGENCE");
  assert.equal(classifyPriceFlow(-1, -1), "CONFIRMS_PRICE_WEAKNESS");
  assert.equal(classifyPriceFlow(0, 1), "NEUTRAL_NON_CONFIRMATION");
});

test("breadth matrix covers broad, futures-led, ETF-led, de-risking and neutral", () => {
  assert.equal(classifyBreadth(1, 1), "BROAD_PARTICIPATION");
  assert.equal(classifyBreadth(1, -1), "FUTURES_LED_PARTICIPATION");
  assert.equal(classifyBreadth(-1, 1), "ETF_LED_PARTICIPATION");
  assert.equal(classifyBreadth(-1, -1), "BROAD_DE_RISKING");
  assert.equal(classifyBreadth(0, 1), "MIXED_PARTIAL_PARTICIPATION");
});

test("breadth is unavailable when either channel is stale or not real", () => {
  assert.equal(classifyParticipationBreadth(-1, -1, { futuresUsable: false, etfUsable: true }), null);
  assert.equal(classifyParticipationBreadth(-1, -1, { futuresUsable: true, etfUsable: false }), null);
  assert.equal(classifyParticipationBreadth(-1, -1, { futuresUsable: true, etfUsable: true }), "BROAD_DE_RISKING");
});

test("systematic state vocabulary contains no prohibited trading narrative", () => {
  const vocabulary = [
    classifyBreadth(1, 1),
    classifyBreadth(-1, -1),
    classifyPriceFlow(1, -1),
    computeGldParticipationMetrics(rows(90, (index) => 1_000 + index)).persistence,
  ].join(" ").toLowerCase();

  for (const prohibited of ["buy", "sell", "smart money", "institutional", "fomo", "trap"]) {
    assert.equal(vocabulary.includes(prohibited), false);
  }
});

test("deterministic F10 explanations preserve fact/state/meaning consistency", () => {
  const reversal = buildF10EtfParticipationExplanation("EN", "SHORT_TERM_REVERSAL_DOWN", -7.13, 36.49);
  assert.match(reversal.explanation, /36\.49 tonnes above/);
  assert.match(reversal.explanation, /fallen 7\.13 tonnes/);
  assert.doesNotMatch(reversal.explanation, /persistent contraction/i);

  const confirms = buildF10PriceFlowExplanation("EN", "CONFIRMS_PRICE_STRENGTH", 9.88, 36.49);
  assert.match(confirms.explanation, /both increased/);
  assert.doesNotMatch(confirms.explanation, /divergence/i);

  const breadth = buildF10BreadthExplanation("EN", "ETF_LED_PARTICIPATION");
  assert.match(breadth.explanation, /GLD holdings increased/);
  assert.doesNotMatch(breadth.explanation, /broad participation/i);
});

test("F10 copy is reproducible, bilingual, and contains no unsupported trading claims", () => {
  const builds = [
    () => buildF10FuturesExplanation("EN", "REDUCING_NET_LONG_EXPOSURE", -1, 76),
    () => buildF10FuturesExplanation("FR", "REDUCING_NET_LONG_EXPOSURE", -1, 76),
    () => buildF10EtfParticipationExplanation("EN", "SHORT_TERM_REVERSAL_DOWN", -7.13, 36.49),
    () => buildF10EtfParticipationExplanation("FR", "SHORT_TERM_REVERSAL_DOWN", -7.13, 36.49),
    () => buildF10FlowExtensionExplanation("EN", 36.49, 95),
    () => buildF10FlowExtensionExplanation("FR", 36.49, 95),
    () => buildF10PriceFlowExplanation("EN", "CONFIRMS_PRICE_STRENGTH", 9.88, 36.49),
    () => buildF10BreadthExplanation("FR", "BROAD_DE_RISKING"),
  ];
  const first = builds.map((build) => build());
  const second = builds.map((build) => build());
  assert.deepEqual(first, second);

  const corpus = JSON.stringify(first).toLowerCase();
  for (const prohibited of [
    " buy ", " sell ", "smart money", "institutional accumulation", "institutions are buying",
    "institutions are selling", "fomo", "trap", "guaranteed", "will rise", "will fall",
    "buyers remaining", "seller remaining", "fuel score",
  ]) assert.equal(corpus.includes(prohibited), false, `unsupported phrase: ${prohibited}`);
});

test("F10 explanations remain unavailable when required facts are missing", () => {
  assert.equal(buildF10FuturesExplanation("EN", "REDUCING_NET_LONG_EXPOSURE", null, 76).available, false);
  assert.equal(buildF10EtfParticipationExplanation("EN", "SHORT_TERM_REVERSAL_DOWN", null, 36.49).available, false);
  assert.equal(buildF10FlowExtensionExplanation("EN", null, 95).available, false);
  assert.equal(buildF10PriceFlowExplanation("EN", "CONFIRMS_PRICE_STRENGTH", null, 36.49).available, false);
  assert.equal(buildF10BreadthExplanation("EN", null).available, false);
});
