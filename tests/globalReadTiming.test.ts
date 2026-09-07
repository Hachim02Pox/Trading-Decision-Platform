import assert from "node:assert/strict";
import { test } from "node:test";
import { parseOfficialCalendar } from "../apps/backend/src/intelligence/globalRead/calendar";
import { testPriceResponse } from "../apps/backend/src/intelligence/globalRead/priceTest";
import { freezePriorView } from "../apps/backend/src/intelligence/globalRead/snapshot";
import { loadGlobalReadMethod } from "../apps/backend/src/intelligence/globalRead/method";

test("official calendar unfolds title, uses UTC, excludes cancelled and untimed events", () => {
  const ics = "BEGIN:VCALENDAR\r\nBEGIN:VEVENT\r\nUID:1\r\nSUMMARY:Consumer Price\r\n Index\r\nDTSTART:20260911T123000Z\r\nEND:VEVENT\r\nBEGIN:VEVENT\r\nUID:2\r\nSUMMARY:Cancelled\r\nSTATUS:CANCELLED\r\nDTSTART:20260911T123000Z\r\nEND:VEVENT\r\nEND:VCALENDAR";
  const events = parseOfficialCalendar(ics, "https://www.bls.gov/schedule/news_release/bls.ics");
  assert.equal(events.length, 1); assert.equal(events[0].title, "Consumer PriceIndex");
  assert.equal(events[0].scheduledAt, "2026-09-11T12:30:00.000Z");
});
test("missing reaction configuration stays INCONCLUSIVE; no arbitrary window or threshold", () => {
  assert.equal(testPriceResponse([], "2026-09-05T12:00:00Z", "GOLD_SUPPORTIVE", loadGlobalReadMethod({}), "2026-09-05T12:30:00Z").state, "INCONCLUSIVE");
});
test("reaction uses completed bars around event; never future or event-containing baseline", () => {
  const method = { ...loadGlobalReadMethod({}), referenceSymbol: "GC=F" as const, reactionWindowSeconds: 60, materialityPct: 0.1, maxBarDistanceSeconds: 0, referenceSourceAccepted: true };
  const event = Date.parse("2026-09-05T12:00:00Z") / 1000;
  const bars = [{ timestampSec: event - 60, close: 100 }, { timestampSec: event, close: 101 }, { timestampSec: event + 60, close: 90 }];
  assert.equal(testPriceResponse(bars, new Date(event * 1000).toISOString(), "GOLD_SUPPORTIVE", method, "2026-09-05T12:01:00Z").state, "CONFIRMS");
  assert.equal(testPriceResponse(bars, new Date(event * 1000).toISOString(), "GOLD_SUPPORTIVE", method, "2026-09-05T12:00:30Z").state, "INCONCLUSIVE");
});
test("adaptive materiality uses the p80 of completed 30-minute moves from the prior 20 trading dates", () => {
  const method = loadGlobalReadMethod({ GLOBAL_READ_REFERENCE_SYMBOL: "XAUUSD=X", GLOBAL_READ_REACTION_WINDOW_SECONDS: "1800", GLOBAL_READ_MAX_BAR_DISTANCE_SECONDS: "300", GLOBAL_READ_ADAPTIVE_LOOKBACK_SESSIONS: "20", GLOBAL_READ_ADAPTIVE_PERCENTILE: "80", GLOBAL_READ_ACCEPT_UNOFFICIAL_REFERENCE: "true" });
  const event = Date.parse("2026-09-05T12:00:00Z") / 1000;
  const bars = Array.from({ length: 20 }, (_, i) => {
    const start = event - (20 - i) * 86_400;
    return [{ timestampSec: start, close: 100 }, { timestampSec: start + 300, close: 100.1 }, { timestampSec: start + 1800, close: 101 }];
  }).flat().concat([{ timestampSec: event - 300, close: 100 }, { timestampSec: event + 1500, close: 101.1 }]);
  assert.equal(testPriceResponse(bars, new Date(event * 1000).toISOString(), "GOLD_SUPPORTIVE", method, "2026-09-05T12:30:00Z").state, "CONFIRMS");
});
test("empty prior reports missing coverage separately from payload purity", () => {
  const view = freezePriorView([], "2026-09-05T12:00:00Z", false);
  assert.equal(view.manifest.priorPurity, "CLEAN"); assert.equal(view.manifest.baselineQuality, "MISSING");
});
