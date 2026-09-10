import assert from "node:assert/strict";
import test from "node:test";
import { loadAppConfig } from "../apps/backend/src/config/env.ts";
import { getPool, closePool } from "../apps/backend/src/db/pool.ts";
import { insertObservationIfChanged, getLatestObservation } from "../apps/backend/src/db/kpiObservations.ts";
import { recordFailure } from "../apps/backend/src/db/ingestionState.ts";

// Foundation pass — the 4th required cache-bug-fix test: "a previously-stored
// valid kpi_observations row is never overwritten/deleted by a subsequent
// failed fetch." This exercises the REAL DB helpers against a real Postgres
// (Supabase) connection (apps/backend/.env's SUPABASE_* settings) rather
// than a mock — per the milestone brief's "do not fabricate a passing test
// that doesn't actually exercise real logic."
//
// This suite is SKIPPED (not silently passed) when Supabase config isn't
// present in the environment this test process was started with — `npm
// test` does not load apps/backend/.env by default. To actually run it:
//   tsx --env-file=apps/backend/.env --test tests/kpi-observations-persistence.test.ts
// All rows this suite writes use a `test:` -prefixed kpi_id and are deleted
// in a `finally` block, whether the test passes or fails.

const dbConfigured = loadAppConfig().db !== null;
const TEST_KPI_ID = "test:foundation-cache-bug-kpi";

test(
  "kpi_observations: dedup, revision-append, and survive-a-failed-fetch invariants (real Postgres)",
  { skip: dbConfigured ? false : "DB not configured in this process's environment — see file header for how to run this suite against the real Supabase Postgres instance." },
  async () => {
    const pool = getPool();
    try {
      await pool.query("delete from public.kpi_observations where kpi_id = $1", [TEST_KPI_ID]);
      await pool.query("delete from public.ingestion_state where job_key = $1", [`${TEST_KPI_ID}-job`]);

      const observationAt = new Date("2026-08-31T00:00:00Z");

      // 1. First insert of a genuinely new (kpi_id, observation_at) — must insert.
      const firstInsert = await insertObservationIfChanged({
        kpiId: TEST_KPI_ID,
        observationAt,
        retrievedAt: new Date("2026-08-31T12:00:00Z"),
        numericValue: 4.321,
        sourceTag: "TEST_SYNTHETIC",
        provenance: "observed",
      });
      assert.equal(firstInsert, true, "a genuinely new observation must be inserted");

      const afterFirst = await getLatestObservation(TEST_KPI_ID);
      assert.equal(afterFirst?.numericValue, 4.321);

      // 2. Re-fetching the SAME value for the same key must be a no-op (deduplicated).
      const duplicateInsert = await insertObservationIfChanged({
        kpiId: TEST_KPI_ID,
        observationAt,
        retrievedAt: new Date("2026-08-31T13:00:00Z"),
        numericValue: 4.321,
        sourceTag: "TEST_SYNTHETIC",
        provenance: "observed",
      });
      assert.equal(duplicateInsert, false, "an identical repeat value must not create a duplicate row");

      const countAfterDuplicate = await pool.query<{ c: string }>("select count(*) as c from public.kpi_observations where kpi_id = $1", [TEST_KPI_ID]);
      assert.equal(Number(countAfterDuplicate.rows[0].c), 1, "still exactly one row after a deduplicated repeat");

      // 3. A genuine revision (same key, DIFFERENT value) must APPEND a new row, never overwrite/delete the old one.
      const revisionInsert = await insertObservationIfChanged({
        kpiId: TEST_KPI_ID,
        observationAt,
        retrievedAt: new Date("2026-08-31T14:00:00Z"),
        numericValue: 4.5,
        sourceTag: "TEST_SYNTHETIC",
        provenance: "observed",
      });
      assert.equal(revisionInsert, true, "a genuine revision (different value) must insert a new row");

      const countAfterRevision = await pool.query<{ c: string }>("select count(*) as c from public.kpi_observations where kpi_id = $1", [TEST_KPI_ID]);
      assert.equal(Number(countAfterRevision.rows[0].c), 2, "the original row must still exist alongside the new revision");

      const originalRowStillIntact = await pool.query(
        "select numeric_value from public.kpi_observations where kpi_id = $1 and numeric_value = 4.321",
        [TEST_KPI_ID]
      );
      assert.equal(originalRowStillIntact.rows.length, 1, "the original 4.321 reading must still be present, untouched");

      // 4. The core invariant this test exists for: a SUBSEQUENT FAILED fetch
      // (simulated here via ingestion_state.recordFailure — the real call a
      // family's ingestion job would make on a provider error) must never
      // touch kpi_observations at all. The latest stored observation must be
      // exactly what it was before the failure.
      const beforeFailure = await getLatestObservation(TEST_KPI_ID);
      await recordFailure(`${TEST_KPI_ID}-job`, "simulated provider outage — safe, no stack trace");
      const afterFailure = await getLatestObservation(TEST_KPI_ID);

      assert.deepEqual(afterFailure, beforeFailure, "a failed fetch must never mutate a previously-stored valid observation");
      assert.equal(afterFailure?.numericValue, 4.5, "the latest (most recently retrieved) reading is still the revision, untouched by the failure");
    } finally {
      await pool.query("delete from public.kpi_observations where kpi_id = $1", [TEST_KPI_ID]);
      await pool.query("delete from public.ingestion_state where job_key = $1", [`${TEST_KPI_ID}-job`]);
      await closePool();
    }
  }
);
