import assert from "node:assert/strict";
import test from "node:test";
import type { CanonicalFamilySnapshot, KpiInterpretation } from "@gold-terminal/contracts";
import { createCachedInterpretationReader } from "../apps/backend/src/intelligence/cachedInterpretation";
import { buildIntelligenceSnapshot } from "../apps/backend/src/intelligence/snapshotResponse";

test("public intelligence cache misses never call paid providers, including parallel FR requests", async () => {
  const original = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async () => { calls++; throw new Error("Paid provider must not run from a public read"); };
  try {
    const cached = { kpiId: "pilot" } as KpiInterpretation;
    const read = createCachedInterpretationReader({ "pilot::EN": cached });
    const families = [{ kpis: [{ id: "pilot", visibility: "cockpit" }] }] as CanonicalFamilySnapshot[];
    const responses = await Promise.all(Array.from({ length: 20 }, () => buildIntelligenceSnapshot({ families, language: "FR", dataMode: "REAL", sessionId: "security", getInterpretation: read })));
    assert.ok(responses.every((result) => Object.keys(result.interpretations).length === 0));
    assert.equal(await read("pilot", "FR"), null);
    assert.equal(await read("missing", "EN"), null);
    assert.equal(await read("pilot", "EN"), cached);
    assert.equal(calls, 0);
  } finally { globalThis.fetch = original; }
});
