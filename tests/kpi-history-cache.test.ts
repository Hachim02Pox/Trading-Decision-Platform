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
