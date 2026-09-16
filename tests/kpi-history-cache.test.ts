import assert from "node:assert/strict";
import test, { after } from "node:test";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { CanonicalKpi } from "../packages/contracts/src/index";
import { rememberKpiObservation } from "../apps/backend/src/intelligence/cloud/kpiHistory.ts";

// NOTE on plan deviation: the approved plan named
// `tests/kpi-observations-persistence.test.ts` as the file to extend with
// this assertion, but that suite covers a completely different, unrelated
// Postgres-backed persistence layer (apps/backend/src/db/kpiObservations.ts).
// The behavior actually described — "a refetch at an identical
// observationAt/value must never fabricate a false 'before' value" — lives
// in apps/backend/src/intelligence/cloud/kpiHistory.ts (the mechanical
// engine's own previousFetch source), which had no dedicated test at all.
// This new file locks that down instead, without touching the unrelated
// Postgres suite.

const TEST_KPI_ID = "test:kpi-history-cache-mechanical-refetch";
const historyFile = join(process.cwd(), ".runtime", "cloud-kpi-observations.json");

function cleanupTestKey(): void {
  if (!existsSync(historyFile)) return;
  const raw = JSON.parse(readFileSync(historyFile, "utf8")) as Record<string, unknown>;
  if (TEST_KPI_ID in raw) {
    delete raw[TEST_KPI_ID];
    writeFileSync(historyFile, JSON.stringify(raw, null, 2), "utf8");
  }
}

function kpi(value: number, observationAt: string, retrievedAt: string): CanonicalKpi {
  return { id: TEST_KPI_ID, value, unit: "%", observationAt, retrievedAt } as unknown as CanonicalKpi;
}

after(cleanupTestKey);

test("rememberKpiObservation: an identical refetch never fabricates a false 'previous' value", () => {
  cleanupTestKey();
  try {
    // First-ever observation: no prior point exists yet.
    const first = rememberKpiObservation(kpi(1.5, "2026-09-01T00:00:00.000Z", "2026-09-01T00:05:00.000Z"));
    assert.equal(first, null);

    // Identical refetch (same value/observationAt/retrievedAt) — must still
    // report no prior point, never invent one from the current value.
    const identicalRefetch = rememberKpiObservation(kpi(1.5, "2026-09-01T00:00:00.000Z", "2026-09-01T00:05:00.000Z"));
    assert.equal(identicalRefetch, null);

    // A genuinely new value: the previous real observation is returned.
    const changed = rememberKpiObservation(kpi(1.8, "2026-09-02T00:00:00.000Z", "2026-09-02T00:05:00.000Z"));
    assert.equal(changed?.value, 1.5);

    // Another identical refetch of the NEW value must keep reporting the
    // real earlier observation (1.5) — never silently treat the current
    // value as its own "before" once it has stopped changing.
    const identicalAgain = rememberKpiObservation(kpi(1.8, "2026-09-02T00:00:00.000Z", "2026-09-02T00:05:00.000Z"));
    assert.equal(identicalAgain?.value, 1.5);
  } finally {
    cleanupTestKey();
  }
});

test("rememberKpiObservation: a real re-fetch (retrievedAt changes) of the SAME observation (value/observationAt unchanged) must never fabricate a same-value 'previous'", () => {
  // Bug found live 2026-09-16: a shorter TTL/prefetch trigger means a real
  // network re-fetch can land on a source that hasn't published a new
  // observation yet — value and observationAt unchanged, only retrievedAt
  // advances. The old logic compared retrievedAt too, so this shifted
  // "current" into "previous" every time, showing "ancienne valeur ->
  // valeur actuelle" as literally the same number on both sides.
  cleanupTestKey();
  try {
    const first = rememberKpiObservation(kpi(4.67, "2026-09-16T00:00:00.000Z", "2026-09-16T08:00:00.000Z"));
    assert.equal(first, null, "first-ever observation has no prior point");

    // A genuine re-fetch a few hours later (new retrievedAt) of the exact
    // same underlying observation (same value, same observationAt).
    const reFetchSameObservation = rememberKpiObservation(kpi(4.67, "2026-09-16T00:00:00.000Z", "2026-09-16T11:00:00.000Z"));
    assert.equal(reFetchSameObservation, null, "re-fetching the same unpublished-since observation must not manufacture a same-value 'previous'");

    // A genuinely new observation (source published a new value) DOES advance "previous".
    const genuinelyNew = rememberKpiObservation(kpi(4.70, "2026-09-17T00:00:00.000Z", "2026-09-17T08:00:00.000Z"));
    assert.equal(genuinelyNew?.value, 4.67);
  } finally {
    cleanupTestKey();
  }
});

test("rememberKpiObservation: self-heals an already-corrupted on-disk entry (previous === current) left over from before the 2026-09-16 fix", () => {
  // Product invariant (2026-09-16, explicit): "ancienne valeur" and "valeur
  // actuelle" must NEVER render as the same observation — not even as a
  // one-time leftover from data written by the old buggy comparison before
  // this fix shipped. Simulates that by writing a corrupted entry directly
  // (bypassing rememberKpiObservation, the way the old code would have).
  cleanupTestKey();
  try {
    const corrupted = {
      current: { value: 4.67, unit: "%", observationAt: "2026-09-14T20:00:00.000Z", retrievedAt: "2026-09-16T00:36:00.000Z" },
      previous: { value: 4.67, unit: "%", observationAt: "2026-09-14T20:00:00.000Z", retrievedAt: "2026-09-15T09:00:00.000Z" },
    };
    writeFileSync(historyFile, JSON.stringify({ [TEST_KPI_ID]: corrupted }, null, 2), "utf8");

    // Re-fetching the same still-current observation must return null
    // (sanitized), never the corrupted same-value "previous".
    const read = rememberKpiObservation(kpi(4.67, "2026-09-14T20:00:00.000Z", "2026-09-16T05:00:00.000Z"));
    assert.equal(read, null);

    // The on-disk file itself must be repaired too, not just this call's
    // return value — a fresh read (via another call) must stay healed.
    const readAgain = rememberKpiObservation(kpi(4.67, "2026-09-14T20:00:00.000Z", "2026-09-16T06:00:00.000Z"));
    assert.equal(readAgain, null);
  } finally {
    cleanupTestKey();
  }
});
