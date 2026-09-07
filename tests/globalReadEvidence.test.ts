import assert from "node:assert/strict";
import { test } from "node:test";
import { admitEvidence, comparableIdentity } from "../apps/backend/src/intelligence/globalRead/evidence";
import { admitLatestEvidence } from "../apps/backend/src/intelligence/globalRead/primaryData";
import type { GlobalReadFact } from "../packages/contracts/src/globalRead";

const at = "2026-09-05T12:00:00.000Z";
function fact(overrides: Partial<GlobalReadFact> = {}): GlobalReadFact {
  return { ref: "f4-core-pce-mom", metric: "CORE_PCE_MOM", definition: "Core PCE monthly percent change",
    value: 0.2, unit: "%", period: "2026-07", instrument: "US", transform: "MOM", seasonality: "SA",
    vintage: "current-retrieval", observationAt: "2026-07-31T00:00:00.000Z", knownAt: at, retrievedAt: at,
    latestCheckedAt: at, sourceUrl: "https://apps.bea.gov/api/data/", sourceType: "PRIMARY",
    verification: "STRUCTURED", expectedCadence: "MONTHLY", effectiveFreshnessStatus: "CURRENT", role: "BACKGROUND", dependencyRefs: [], releaseGroup: "PCE:2026-07",
    ...overrides };
}

test("primary PCE corrects terminal only within run; secondary majority never wins", () => {
  const terminal = fact({ verification: "NONE" });
  const official = fact({ value: 0.3 });
  const secondary = fact({ sourceType: "SECONDARY", sourceUrl: "https://example.com", value: 0.2 });
  const result = admitEvidence(terminal, [secondary, secondary, official], at);
  assert.equal(result.status, "CORRECTED");
  assert.equal(result.terminalValue, 0.2);
  assert.equal(result.admittedValue, 0.3);
  assert.equal(terminal.value, 0.2);
});
test("agreement and authoritative web-only recovery admit primary evidence", () => {
  const terminalVerified = admitEvidence(fact({ verification: "NONE" }), [fact()], at);
  assert.equal(terminalVerified.status, "VERIFIED");
  assert.equal(terminalVerified.provenance, "TERMINAL_VERIFIED");
  assert.equal(terminalVerified.selected?.sourceUrl, "https://apps.bea.gov/api/data/");

  const recovered = admitEvidence(fact({ value: null, verification: "NONE", sourceUrl: null }), [fact()], at);
  assert.equal(recovered.admittedValue, 0.2);
  assert.equal(recovered.provenance, "WEB_ONLY_VERIFIED");
  assert.match(recovered.reason, /terminal source unavailable/i);
});
test("conflicting primary observations fail closed", () => {
  const result = admitEvidence(fact(), [fact(), fact({ value: 0.3 })], at);
  assert.equal(result.status, "CONFLICT");
  assert.equal(result.provenance, "WEB_ONLY_CONFLICTED");
});

test("an authoritative primary observation beats two secondary repetitions", () => {
  const secondary = fact({ sourceType: "SECONDARY", sourceUrl: "https://example.com", value: 0.9 });
  const result = admitEvidence(fact(), [secondary, secondary, fact({ value: 0.3 })], at);
  assert.equal(result.admittedValue, 0.3);
  assert.equal(result.provenance, "TERMINAL_CORRECTED");
});
test("different COT week and ETF units are non-comparable, not contradictions", () => {
  assert.equal(comparableIdentity(fact(), fact({ period: "2026-08" })), false);
  assert.equal(comparableIdentity(fact({ metric: "GLD_HOLDINGS", unit: "tonnes" }), fact({ metric: "ETF_FLOW", unit: "USD" })), false);
});
test("live DXY timestamps do not create a false value conflict", () => {
  const current = fact({ metric: "DXY", instrument: "ICE:DXY", role: "TRANSMISSION" });
  assert.equal(comparableIdentity(current, { ...current, observationAt: "2026-09-05T11:59:00.000Z" }), false);
});
test("revised vintages unavailable at information cutoff are rejected", () => {
  assert.equal(admitEvidence(fact(), [fact()], "2026-09-01T00:00:00.000Z").status, "LOOKAHEAD");
});
test("stale observations stay visible but cannot be admitted as current decision evidence", () => {
  assert.equal(admitEvidence(fact(), [fact({ effectiveFreshnessStatus: "STALE" })], at).status, "UNVERIFIED");
});
test("a newer public period replaces a stale terminal period for this run without mutating terminal storage", () => {
  const terminal = fact({ period: "2026-06", observationAt: "2026-06-30T00:00:00.000Z", value: 0.4 });
  const latest = fact({ period: "2026-07", observationAt: "2026-07-31T00:00:00.000Z", value: 0.3 });
  const results = admitLatestEvidence(terminal, [latest], at);
  assert.equal(results[0]?.status, "NOT_COMPARABLE");
  assert.equal(results[1]?.ref, `latest:${terminal.ref}`);
  assert.equal(results[1]?.admittedValue, 0.3);
  assert.equal(results[1]?.provenance, "WEB_ONLY_VERIFIED");
  assert.equal(terminal.value, 0.4);
});
test("LLM prose, wrong expiry, spoofed primary domain, unknown metric cannot certify a claim", () => {
  assert.equal(admitEvidence(fact(), [fact({ verification: "NONE" })], at).status, "UNVERIFIED");
  assert.equal(comparableIdentity(fact({ instrument: "GC:2026-12:CALL:4000" }), fact({ instrument: "GC:2026-10:CALL:4000" })), false);
  assert.equal(admitEvidence(fact(), [fact({ sourceUrl: "https://apps.bea.gov.evil.test/" })], at).status, "UNVERIFIED");
  assert.equal(admitEvidence(fact({ metric: "OPTIONS_STRIKE" }), [fact({ metric: "OPTIONS_STRIKE" })], at).status, "UNVERIFIED");
});
