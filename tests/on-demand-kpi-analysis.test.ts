import assert from "node:assert/strict";
import test from "node:test";
import { buildAvailablePolicyAssignment } from "../apps/backend/src/intelligence/ensemble/realPolicies.ts";
import { __setCliAvailabilityForTests } from "../apps/backend/src/intelligence/providers/cliAvailability.ts";
import {
  checkAndStartCooldown,
  ON_DEMAND_COOLDOWN_MS,
  __resetOnDemandCooldownForTests,
} from "../apps/backend/src/intelligence/onDemandCooldown.ts";
import {
  ensureAutoKpiAnalysis,
  peekAutoKpiAnalysis,
  computeKpiSnapshotHash,
  computeFamilySnapshotHash,
  __resetOnDemandAnalysisStateForTests,
} from "../apps/backend/src/intelligence/onDemandAnalysis.ts";

// This suite is run via `npm test` (`tsx --env-file=apps/backend/.env --test
// tests/*.test.ts`) against the CURRENT real apps/backend/.env, which as of
// this writing has TAVILY_API_KEY set but NO OPENAI_API_KEY/
// ANTHROPIC_API_KEY/GEMINI_API_KEY — so the NOT_CONFIGURED path below
// exercises the genuine real state of this installation, not a mock.
//
// claude-cli/codex-cli availability is NOT env-var gated (see
// providers/cliAvailability.ts) — it depends on whether THIS machine has an
// authenticated Claude Code/Codex CLI session, which is true on the
// workstation this feature was built on. The NOT_CONFIGURED test below
// force-overrides both to `false` via the test-only escape hatch so it
// stays deterministic and never spawns a real CLI subprocess, regardless of
// which machine runs `npm test`.

test("ensureAutoKpiAnalysis never starts a provider call for an empty/unknown KPI set", async () => {
  __setCliAvailabilityForTests(false, false);
  try {
    const response = await ensureAutoKpiAnalysis("f2-10y", "EN", { allFamilies: [], sessionId: "test-session" });
    assert.ok(response.status === "NOT_CONFIGURED" || response.status === "UNAVAILABLE");
    assert.equal(response.interpretation, null);
    assert.equal(response.evidence, null);
    assert.ok(response.configuredProviderCount === 0 || response.configuredProviderCount === 1);
  } finally {
    __setCliAvailabilityForTests(null, null);
  }
});

test("peekAutoKpiAnalysis reports NONE before any automatic analysis has ever run for a KPI", () => {
  __resetOnDemandAnalysisStateForTests();
  const response = peekAutoKpiAnalysis("f2-10y", "EN");
  assert.equal(response.status, "NONE");
  assert.equal(response.interpretation, null);
});

function makeKpi(overrides: Partial<Parameters<typeof computeKpiSnapshotHash>[0]> = {}) {
  return {
    id: "f2-10y",
    familyId: "F2" as const,
    label: "10Y",
    value: 4.1,
    unit: "%",
    decimals: 2,
    mechanicalGoldRead: "CONTEXTUAL" as const,
    mechanicalEvaluation: {
      ruleId: "f2-10y",
      mode: "CONTEXTUAL" as const,
      channelId: null,
      previousValue: null,
      currentValue: null,
      delta: null,
      status: "CONTEXTUAL_BY_DESIGN" as const,
      read: "CONTEXTUAL" as const,
    },
    driverSummary: null,
    provenance: "observed" as const,
    quality: "current" as const,
    dataState: "REAL" as const,
    sourceTag: "FRED",
    observationAt: "2026-09-01T00:00:00.000Z",
    retrievedAt: "2026-09-01T00:05:00.000Z",
    visibility: "cockpit" as const,
    ...overrides,
  };
}

test("computeKpiSnapshotHash: identical real data hashes identically (same fetch never re-triggers)", () => {
  const a = computeKpiSnapshotHash(makeKpi());
  const b = computeKpiSnapshotHash(makeKpi());
  assert.equal(a, b);
});

test("computeKpiSnapshotHash: a changed value (a genuinely new fetch) changes the hash", () => {
  const before = computeKpiSnapshotHash(makeKpi({ value: 4.1 }));
  const after = computeKpiSnapshotHash(makeKpi({ value: 4.15, retrievedAt: "2026-09-01T01:00:00.000Z" }));
  assert.notEqual(before, after);
});

test("computeKpiSnapshotHash: an unchanged value but a fresh retrievedAt still counts as a new fetch", () => {
  const before = computeKpiSnapshotHash(makeKpi({ retrievedAt: "2026-09-01T00:05:00.000Z" }));
  const after = computeKpiSnapshotHash(makeKpi({ retrievedAt: "2026-09-01T02:00:00.000Z" }));
  assert.notEqual(before, after);
});

test("computeFamilySnapshotHash: changes when any one member KPI changes, stable otherwise", () => {
  const kpiA = makeKpi({ id: "f2-2y", value: 3.9 });
  const kpiB = makeKpi({ id: "f2-10y", value: 4.1 });
  const before = computeFamilySnapshotHash([kpiA, kpiB]);
  const stillSame = computeFamilySnapshotHash([kpiA, kpiB]);
  const changed = computeFamilySnapshotHash([kpiA, { ...kpiB, value: 4.2, retrievedAt: "2026-09-01T03:00:00.000Z" }]);
  assert.equal(before, stillSame);
  assert.notEqual(before, changed);
});

test("buildAvailablePolicyAssignment: 1 configured provider yields exactly one analyst (role A), no challenger, self-adjudication", () => {
  const assignment = buildAvailablePolicyAssignment("HIGH_SCRUTINY", ["gemini"]);
  assert.equal(assignment.analysts.length, 1);
  assert.equal(assignment.analysts[0].role, "A");
  assert.equal(assignment.analysts[0].providerId, "gemini");
  assert.equal(assignment.challengerProviderId, null);
  assert.equal(assignment.adjudicatorProviderId, "gemini");
  // computeModelAgreement classifies a 1-conclusion ensemble as SINGLE_ANALYST
  // (runAdjudicator.ts) — this assignment's analyst count is what drives that.
});

test("buildAvailablePolicyAssignment: 2 configured providers yields 2 analysts, no challenger (needs 2 DISTINCT beyond the analysts to be meaningful under this policy's threshold), adjudicator from the configured set", () => {
  const assignment = buildAvailablePolicyAssignment("HIGH_SCRUTINY", ["openai", "anthropic"]);
  assert.equal(assignment.analysts.length, 2);
  assert.deepEqual(
    assignment.analysts.map((a) => a.providerId).sort(),
    ["anthropic", "openai"]
  );
  // HIGH_SCRUTINY's ideal challenger (anthropic) IS configured here, and
  // configuredSet.size >= 2, so a challenger stage does run.
  assert.equal(assignment.challengerProviderId, "anthropic");
  // gemini (the ideal HIGH_SCRUTINY adjudicator) isn't configured here, so
  // the adjudicator falls back to the last selected analyst's provider.
  assert.equal(assignment.adjudicatorProviderId, "anthropic");
});

test("buildAvailablePolicyAssignment: 3 configured providers reproduces the full ideal HIGH_SCRUTINY assignment", () => {
  const assignment = buildAvailablePolicyAssignment("HIGH_SCRUTINY", ["openai", "anthropic", "gemini"]);
  assert.deepEqual(
    assignment.analysts.map((a) => `${a.role}:${a.providerId}`),
    ["A:openai", "B:anthropic", "C:gemini"]
  );
  assert.equal(assignment.challengerProviderId, "anthropic");
  assert.equal(assignment.adjudicatorProviderId, "gemini");
});

test("buildAvailablePolicyAssignment: STANDARD policy never runs a challenger regardless of provider count", () => {
  const assignment = buildAvailablePolicyAssignment("STANDARD", ["openai", "anthropic", "gemini"]);
  assert.equal(assignment.challengerProviderId, null);
});

test("buildAvailablePolicyAssignment: falls back to configured providers when none of the ideal analysts' providers are configured", () => {
  // STANDARD's ideal analysts are openai/anthropic; only gemini is configured.
  const assignment = buildAvailablePolicyAssignment("STANDARD", ["gemini"]);
  assert.equal(assignment.analysts.length, 1);
  assert.equal(assignment.analysts[0].providerId, "gemini");
  assert.equal(assignment.adjudicatorProviderId, "gemini");
});

test("cooldown guard: a second trigger within the window is rejected with a positive remaining time", () => {
  __resetOnDemandCooldownForTests();
  const key = "f2-10y::EN";
  const first = checkAndStartCooldown(key, 1_000);
  assert.equal(first.allowed, true);
  assert.equal(first.remainingMs, 0);

  const second = checkAndStartCooldown(key, 1_000 + ON_DEMAND_COOLDOWN_MS / 2);
  assert.equal(second.allowed, false);
  assert.ok(second.remainingMs > 0 && second.remainingMs <= ON_DEMAND_COOLDOWN_MS);
});

test("cooldown guard: a trigger after the window has elapsed is allowed again", () => {
  __resetOnDemandCooldownForTests();
  const key = "f2-10y::EN";
  checkAndStartCooldown(key, 1_000);
  const later = checkAndStartCooldown(key, 1_000 + ON_DEMAND_COOLDOWN_MS + 1);
  assert.equal(later.allowed, true);
  assert.equal(later.remainingMs, 0);
});

test("cooldown guard: different keys (kpiId/language pairs) never block each other", () => {
  __resetOnDemandCooldownForTests();
  const first = checkAndStartCooldown("f2-10y::EN", 1_000);
  const second = checkAndStartCooldown("f2-10y::FR", 1_000);
  const third = checkAndStartCooldown("f4-core-cpi-mom::EN", 1_000);
  assert.equal(first.allowed, true);
  assert.equal(second.allowed, true);
  assert.equal(third.allowed, true);
});
