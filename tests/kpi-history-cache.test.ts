import assert from "node:assert/strict";
import test, { after } from "node:test";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { CanonicalKpi } from "../packages/contracts/src/index";
import { rememberKpiObservation } from "../apps/backend/src/intelligence/cloud/kpiHistory.ts";
import { loadAppConfig } from "../apps/backend/src/config/env.ts";
import { getPool } from "../apps/backend/src/db/pool.ts";
import { rememberLatestValue } from "../apps/backend/src/db/kpiLatestValues.ts";

const DB_TEST_KPI_ID = "test:kpi-history-cache-db-previous";

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

test("rememberKpiObservation: an identical refetch never fabricates a false 'previous' value", async () => {
  cleanupTestKey();
  try {
    // First-ever observation: no prior point exists yet.
    const first = await rememberKpiObservation(kpi(1.5, "2026-09-01T00:00:00.000Z", "2026-09-01T00:05:00.000Z"));
    assert.equal(first, null);

    // Identical refetch (same value/observationAt/retrievedAt) — must still
    // report no prior point, never invent one from the current value.
    const identicalRefetch = await rememberKpiObservation(kpi(1.5, "2026-09-01T00:00:00.000Z", "2026-09-01T00:05:00.000Z"));
    assert.equal(identicalRefetch, null);

    // A genuinely new value: the previous real observation is returned.
    const changed = await rememberKpiObservation(kpi(1.8, "2026-09-02T00:00:00.000Z", "2026-09-02T00:05:00.000Z"));
    assert.equal(changed?.value, 1.5);

    // Another identical refetch of the NEW value must keep reporting the
    // real earlier observation (1.5) — never silently treat the current
    // value as its own "before" once it has stopped changing.
    const identicalAgain = await rememberKpiObservation(kpi(1.8, "2026-09-02T00:00:00.000Z", "2026-09-02T00:05:00.000Z"));
    assert.equal(identicalAgain?.value, 1.5);
  } finally {
    cleanupTestKey();
  }
});

test("rememberKpiObservation: a real re-fetch (retrievedAt changes) of the SAME observation (value/observationAt unchanged) must never fabricate a same-value 'previous'", async () => {
  // Bug found live 2026-09-16: a shorter TTL/prefetch trigger means a real
  // network re-fetch can land on a source that hasn't published a new
  // observation yet — value and observationAt unchanged, only retrievedAt
  // advances. The old logic compared retrievedAt too, so this shifted
  // "current" into "previous" every time, showing "ancienne valeur ->
  // valeur actuelle" as literally the same number on both sides.
  cleanupTestKey();
  try {
    const first = await rememberKpiObservation(kpi(4.67, "2026-09-16T00:00:00.000Z", "2026-09-16T08:00:00.000Z"));
    assert.equal(first, null, "first-ever observation has no prior point");

    // A genuine re-fetch a few hours later (new retrievedAt) of the exact
    // same underlying observation (same value, same observationAt).
    const reFetchSameObservation = await rememberKpiObservation(kpi(4.67, "2026-09-16T00:00:00.000Z", "2026-09-16T11:00:00.000Z"));
    assert.equal(reFetchSameObservation, null, "re-fetching the same unpublished-since observation must not manufacture a same-value 'previous'");

    // A genuinely new observation (source published a new value) DOES advance "previous".
    const genuinelyNew = await rememberKpiObservation(kpi(4.70, "2026-09-17T00:00:00.000Z", "2026-09-17T08:00:00.000Z"));
    assert.equal(genuinelyNew?.value, 4.67);
  } finally {
    cleanupTestKey();
  }
});

test("rememberKpiObservation: self-heals an already-corrupted on-disk entry (previous === current) left over from before the 2026-09-16 fix", async () => {
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
    const read = await rememberKpiObservation(kpi(4.67, "2026-09-14T20:00:00.000Z", "2026-09-16T05:00:00.000Z"));
    assert.equal(read, null);

    // The on-disk file itself must be repaired too, not just this call's
    // return value — a fresh read (via another call) must stay healed.
    const readAgain = await rememberKpiObservation(kpi(4.67, "2026-09-14T20:00:00.000Z", "2026-09-16T06:00:00.000Z"));
    assert.equal(readAgain, null);
  } finally {
    cleanupTestKey();
  }
});

test("rememberKpiObservation: prefers a durable DB previous value (kpi_latest_values) over the ephemeral file when one exists", async () => {
  // Bug found live 2026-09-16: a real user opening the site right after a
  // backend restart/Railway redeploy saw "Première valeur enregistrée" (no
  // previous) for a KPI — like F2's 2Y — that has genuinely been observed
  // many times before, purely because the ephemeral file had just been
  // wiped. Simulates that exact scenario: public.kpi_latest_values (DB)
  // already holds a previous/current pair for this KPI (written the way
  // real/*.ts builders write it, via rememberLatestValue), but the
  // ephemeral file is empty (as if freshly restarted) — the DB's `previous`
  // must still be returned.
  const dbConfigured = loadAppConfig().db !== null;
  if (!dbConfigured) return; // see tests/kpi-observations-persistence.test.ts for the same DB-configured skip convention
  cleanupTestKey(); // ephemeral file has nothing for this KPI — simulates a fresh restart
  const pool = getPool();
  try {
    await pool.query("delete from public.kpi_latest_values where kpi_id = $1", [DB_TEST_KPI_ID]);
    await rememberLatestValue({
      kpiId: DB_TEST_KPI_ID,
      value: 4.67,
      observationAt: new Date("2026-09-14T20:00:00.000Z"),
      retrievedAt: new Date("2026-09-14T20:05:00.000Z"),
      sourceTag: "US_TREASURY",
      provenance: "observed",
    });
    // A genuinely different value advances current -> previous in kpi_latest_values.
    await rememberLatestValue({
      kpiId: DB_TEST_KPI_ID,
      value: 4.70,
      observationAt: new Date("2026-09-15T20:00:00.000Z"),
      retrievedAt: new Date("2026-09-15T20:05:00.000Z"),
      sourceTag: "US_TREASURY",
      provenance: "observed",
    });

    const previous = await rememberKpiObservation({
      id: DB_TEST_KPI_ID,
      value: 4.70, // unchanged from the DB row's current above
      unit: "%",
      observationAt: "2026-09-15T20:00:00.000Z",
      retrievedAt: new Date().toISOString(),
    } as unknown as CanonicalKpi);

    assert.equal(previous?.value, 4.67, "must find the durable DB previous value even though the ephemeral file has nothing for this KPI");
    assert.equal(previous?.observationAt, "2026-09-14T20:00:00.000Z");
  } finally {
    await pool.query("delete from public.kpi_latest_values where kpi_id = $1", [DB_TEST_KPI_ID]);
    cleanupTestKey();
  }
});
