import assert from "node:assert/strict";
import test from "node:test";
import type { CanonicalKpi } from "../packages/contracts/src/index";
import { aggregateF2 } from "../apps/backend/src/intelligence/mechanical/families/f2.ts";
import { aggregateF6 } from "../apps/backend/src/intelligence/mechanical/families/f6.ts";
import { aggregateF10 } from "../apps/backend/src/intelligence/mechanical/families/f10.ts";
import { combineChannelReads } from "../apps/backend/src/intelligence/mechanical/combineChannelReads.ts";

function kpi(id: string, familyId: CanonicalKpi["familyId"], value: number, previous: number, unit: string | null = "%"): CanonicalKpi {
  return {
    id,
    familyId,
    label: id,
    value,
    unit,
    decimals: 3,
    mechanicalGoldRead: "CONTEXTUAL",
    mechanicalEvaluation: { ruleId: id, mode: "CONTEXTUAL", channelId: null, previousValue: null, currentValue: null, delta: null, status: "CONTEXTUAL_BY_DESIGN", read: "CONTEXTUAL" },
    driverSummary: null,
    provenance: "observed",
    quality: "current",
    dataState: "REAL",
    sourceTag: "TEST",
    observationAt: "2026-09-14T00:00:00.000Z",
    retrievedAt: "2026-09-14T00:00:00.000Z",
    visibility: "cockpit",
    previousFetch: { value: previous, unit, observationAt: "2026-09-13T00:00:00.000Z", retrievedAt: "2026-09-13T00:00:00.000Z" },
  };
}

// --- F2: Real Yield (primary) + 2Y (secondary), fallback to 2Y + 10Y ------

test("F2: Real Yield falling + 2Y falling agree -> SUPPORTIVE, CHANNELS_AGREE", () => {
  const kpis = [kpi("f2-10y-real", "F2", 1.5, 1.8), kpi("f2-2y", "F2", 3.4, 3.6), kpi("f2-10y", "F2", 4.0, 4.2)];
  const result = aggregateF2(kpis);
  assert.equal(result.read, "SUPPORTIVE");
  assert.equal(result.reasonCode, "CHANNELS_AGREE");
});

test("F2: Real Yield falling alone (2Y unchanged/contextual) still wins as SINGLE_CHANNEL_AVAILABLE", () => {
  const kpis = [kpi("f2-10y-real", "F2", 1.5, 1.8), kpi("f2-2y", "F2", 3.5, 3.5), kpi("f2-10y", "F2", 4.0, 4.2)];
  const result = aggregateF2(kpis);
  assert.equal(result.read, "SUPPORTIVE");
  assert.equal(result.reasonCode, "SINGLE_CHANNEL_AVAILABLE");
});

test("F2: Real Yield and 2Y disagree -> CONTEXTUAL, CHANNELS_DISAGREE", () => {
  const kpis = [kpi("f2-10y-real", "F2", 1.8, 1.5), kpi("f2-2y", "F2", 3.4, 3.6), kpi("f2-10y", "F2", 4.0, 4.2)];
  const result = aggregateF2(kpis);
  assert.equal(result.read, "CONTEXTUAL");
  assert.equal(result.reasonCode, "CHANNELS_DISAGREE");
});

test("F2: Real Yield unusable falls back to 2Y + 10Y nominal", () => {
  const kpis = [kpi("f2-10y-real", "F2", 1.5, 1.5), kpi("f2-2y", "F2", 3.4, 3.6), kpi("f2-10y", "F2", 4.0, 4.2)];
  const result = aggregateF2(kpis);
  assert.equal(result.read, "SUPPORTIVE");
  assert.equal(result.contributingChannels.includes("NOMINAL_2Y"), true);
  assert.equal(result.contributingChannels.includes("NOMINAL_10Y"), true);
  assert.equal(result.contributingChannels.includes("REAL_YIELDS"), false);
});

// --- F6: Level + Today % + 5D % all one USD channel -----------------------

test("F6: level, Today %, and 5D % all falling (USD weaker) agree -> SUPPORTIVE", () => {
  const kpis = [
    kpi("f6-dxy-recon-level", "F6", 103, 104, null),
    kpi("f6-dxy-recon-today", "F6", -0.3, 0, "%"),
    kpi("f6-dxy-recon-5d", "F6", -0.5, 0, "%"),
  ];
  const result = aggregateF6(kpis);
  assert.equal(result.read, "SUPPORTIVE");
  assert.equal(result.reasonCode, "CHANNELS_AGREE");
});

test("F6: Today % up but 5D % down disagree -> CONTEXTUAL", () => {
  const kpis = [
    kpi("f6-dxy-recon-level", "F6", 104, 104, null),
    kpi("f6-dxy-recon-today", "F6", 0.3, 0, "%"),
    kpi("f6-dxy-recon-5d", "F6", -0.5, 0, "%"),
  ];
  const result = aggregateF6(kpis);
  assert.equal(result.read, "CONTEXTUAL");
  assert.equal(result.reasonCode, "CHANNELS_DISAGREE");
});

// --- F10: FUTURES_POSITIONING vs ETF_FLOWS ---------------------------------

test("F10: both channels agree (rising MM net, rising ETF holdings) -> SUPPORTIVE", () => {
  const kpis = [
    kpi("f10-mm-net-pct", "F10", 40, 38, "%"),
    kpi("f10-mm-wow-pp", "F10", 1.2, 0, "pp"),
    kpi("f10-etf-holdings", "F10", 3220, 3210, "t"),
    kpi("f10-etf-delta", "F10", 10, 0, "t"),
  ];
  const result = aggregateF10(kpis);
  assert.equal(result.read, "SUPPORTIVE");
});

test("F10: one channel available (ETF unusable) -> that channel wins", () => {
  const kpis = [
    kpi("f10-mm-net-pct", "F10", 40, 38, "%"),
    kpi("f10-mm-wow-pp", "F10", 1.2, 0, "pp"),
    kpi("f10-etf-holdings", "F10", 3210, 3210, "t"),
    kpi("f10-etf-delta", "F10", 0, 0, "t"),
  ];
  const result = aggregateF10(kpis);
  assert.equal(result.read, "SUPPORTIVE");
  assert.equal(result.reasonCode, "SINGLE_CHANNEL_AVAILABLE");
});

test("F10: channels disagree (futures up, ETF down) -> CONTEXTUAL", () => {
  const kpis = [
    kpi("f10-mm-net-pct", "F10", 40, 38, "%"),
    kpi("f10-mm-wow-pp", "F10", 1.2, 0, "pp"),
    kpi("f10-etf-holdings", "F10", 3190, 3210, "t"),
    kpi("f10-etf-delta", "F10", -10, 0, "t"),
  ];
  const result = aggregateF10(kpis);
  assert.equal(result.read, "CONTEXTUAL");
  assert.equal(result.reasonCode, "CHANNELS_DISAGREE");
});

// --- Anti-double-counting: contributingChannels never exceeds distinct channels

test("contributingChannels never lists more entries than distinct channels (MM Net + MM WoW -> one FUTURES_POSITIONING entry)", () => {
  const combined = combineChannelReads([
    { channelId: "FUTURES_POSITIONING", read: "SUPPORTIVE" },
    { channelId: "FUTURES_POSITIONING", read: "SUPPORTIVE" },
  ]);
  assert.deepEqual(combined.contributingChannels, ["FUTURES_POSITIONING"]);
});

test("contributingChannels never lists more entries than distinct channels (DXY Level + Today + 5D -> one USD entry)", () => {
  const combined = combineChannelReads([
    { channelId: "USD", read: "ADVERSE" },
    { channelId: "USD", read: "ADVERSE" },
    { channelId: "USD", read: "ADVERSE" },
  ]);
  assert.deepEqual(combined.contributingChannels, ["USD"]);
});

test("combineChannelReads: no channel available -> CONTEXTUAL/NO_CHANNEL_AVAILABLE", () => {
  const combined = combineChannelReads([
    { channelId: "USD", read: "CONTEXTUAL" },
    { channelId: "USD", read: "CONTEXTUAL" },
  ]);
  assert.equal(combined.read, "CONTEXTUAL");
  assert.equal(combined.reasonCode, "NO_CHANNEL_AVAILABLE");
  assert.deepEqual(combined.contributingChannels, []);
});
