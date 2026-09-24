import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";
import path from "node:path";
import { listGoldStateCandidates, type DriveFileRef } from "../apps/backend/src/goldMarketState/ingestion/discovery.ts";
import { runGoldMarketStateIngestion } from "../apps/backend/src/goldMarketState/ingestion/ingest.ts";
import { loadAppConfig } from "../apps/backend/src/config/env.ts";
import { getPool, closePool } from "../apps/backend/src/db/pool.ts";
import { findGoldStateByRunId, listPublishedGoldStates } from "../apps/backend/src/db/goldMarketStates.ts";

const FIXTURES_DIR = path.join(__dirname, "fixtures", "gold");
function loadFixture(name: string): Record<string, any> {
  return JSON.parse(fs.readFileSync(path.join(FIXTURES_DIR, name), "utf8"));
}

// ---------------------------------------------------------------------------
// Pure unit tests — discovery. No DB, no Drive, always run.
// ---------------------------------------------------------------------------

test("listGoldStateCandidates: recognizes Sunday and intermediate filenames, pairs same-basename Markdown, excludes handoff/report artifacts", () => {
  const files: DriveFileRef[] = [
    { id: "j1", name: "sunday_read_2026-09-14.json", modifiedTime: "t" },
    { id: "m1", name: "SUNDAY_READ_2026-09-14.md", modifiedTime: "t" },
    { id: "j2", name: "gold_intermediate_2026-09-16_01.json", modifiedTime: "t" },
    { id: "m2", name: "GOLD_INTERMEDIATE_2026-09-16_01.md", modifiedTime: "t" },
    { id: "j3", name: "gold_intermediate_2026-09-17_02.json", modifiedTime: "t" },
    // Must NEVER be treated as a market-state candidate even though it lives in the same listing:
    { id: "x1", name: "NEXT_GOLD_RECAP.json", modifiedTime: "t" },
    { id: "x2", name: "RUN_REPORT_2026-09-14.md", modifiedTime: "t" },
    { id: "x3", name: "VALIDATION_REPORT_2026-09-14.md", modifiedTime: "t" },
    { id: "x4", name: "random_notes.txt", modifiedTime: "t" },
  ];
  const candidates = listGoldStateCandidates(files);
  assert.deepEqual(
    candidates.map((c) => c.json.id).sort(),
    ["j1", "j2", "j3"].sort()
  );
  const sunday = candidates.find((c) => c.json.id === "j1");
  assert.equal(sunday?.markdown?.id, "m1");
  assert.equal(sunday?.kind, "SUNDAY_FILENAME");
  assert.equal(candidates.find((c) => c.json.id === "j2")?.kind, "INTERMEDIATE_FILENAME");
  assert.equal(candidates.find((c) => c.json.id === "j2")?.markdown?.id, "m2");
});

test("listGoldStateCandidates: never selects the NEXT_GOLD_RECAP.json handoff file", () => {
  const files: DriveFileRef[] = [{ id: "h1", name: "NEXT_GOLD_RECAP.json", modifiedTime: "t" }];
  assert.deepEqual(listGoldStateCandidates(files), []);
});

// ---------------------------------------------------------------------------
// End-to-end ingestion tests against the real Postgres (Supabase), skipped
// when not configured — same convention as tests/sunday-read-ingestion.test.ts.
// Drive is always faked via injected listFiles/downloadFileText.
// ---------------------------------------------------------------------------

const dbConfigured = loadAppConfig().db !== null;
const JOB_KEY = "gold-market-state:drive-sync";

function makeSundayFixture(overrides: Record<string, any> = {}): Record<string, any> {
  const base = loadFixture("FIXTURE_sunday_v3_state.json");
  // The canonical fixture is intentionally meta.data_mode "FIXTURE" (never
  // real market evidence) — force "REAL" here so the "should publish" path
  // can be exercised; the dedicated data_mode test below restores "FIXTURE"
  // explicitly to prove that gate still fires.
  return { ...base, ...overrides, meta: { ...base.meta, data_mode: "REAL", ...(overrides.meta ?? {}) } };
}

async function cleanup(pool: ReturnType<typeof getPool>, runIds: string[]): Promise<void> {
  if (runIds.length) await pool.query("delete from public.gold_market_states where run_id = any($1)", [runIds]);
  await pool.query("delete from public.ingestion_state where job_key = $1", [JOB_KEY]);
}

test(
  "Gold market-state Drive ingestion: eligibility gate, idempotency, and Drive-failure isolation (real Postgres)",
  {
    skip: dbConfigured
      ? false
      : "DB not configured in this process's environment — see tests/sunday-read-ingestion.test.ts for how to run this suite against the real Supabase Postgres instance.",
  },
  async () => {
    const pool = getPool();
    const sundayFixture = makeSundayFixture();
    const runId = sundayFixture.meta.run_id as string;
    const trackedRunIds = [runId];
    await cleanup(pool, trackedRunIds);
    try {
      // 1. A valid, fully-eligible V3 Sunday document publishes.
      const listFiles1 = async () => [{ id: "f1", name: "sunday_read_2026-09-14.json", modifiedTime: "v1" }];
      const summary1 = await runGoldMarketStateIngestion({ listFiles: listFiles1, downloadFileText: async () => JSON.stringify(sundayFixture) });
      assert.equal(summary1.runs[0]?.outcome, "PUBLISHED");
      const row1 = await findGoldStateByRunId(runId);
      assert.equal(row1?.status, "PUBLISHED");

      // Schema-level Sunday invariants are enforced through the real ingestion path.
      for (const [suffix, meta] of [["bad-parent", { parent_run_id: "other" }], ["bad-origin", { origin_sunday_run_id: "other" }]] as const) {
        const invalid = makeSundayFixture({ meta: { ...sundayFixture.meta, run_id: `${runId}-${suffix}`, ...meta } });
        trackedRunIds.push(invalid.meta.run_id);
        const result = await runGoldMarketStateIngestion({ listFiles: async () => [{ id: suffix, name: `sunday_read_2026-09-${suffix === "bad-parent" ? "23" : "24"}.json`, modifiedTime: "v1" }], downloadFileText: async () => JSON.stringify(invalid) });
        assert.equal(result.runs[0]?.outcome, "REJECTED");
      }

      const baseIntermediate = loadFixture("FIXTURE_intermediate_v3_state.json");
      const intermediate = { ...baseIntermediate, meta: { ...baseIntermediate.meta, data_mode: "REAL", run_id: `${runId}-intermediate`, parent_run_id: runId, origin_sunday_run_id: runId, evidence_cutoff_start: sundayFixture.meta.evidence_cutoff_end, evidence_cutoff_end: "2026-09-22T00:00:00Z" } };
      trackedRunIds.push(intermediate.meta.run_id);
      let intermediateFileNumber = 0;
      const ingestIntermediate = async (doc: any, name: string) => { intermediateFileNumber += 1; return runGoldMarketStateIngestion({ listFiles: async () => [{ id: name, name: `gold_intermediate_2026-09-22_${String(intermediateFileNumber).padStart(2, "0")}.json`, modifiedTime: "v1" }], downloadFileText: async () => JSON.stringify(doc) }); };
      assert.equal((await ingestIntermediate(intermediate, "valid")).runs[0]?.outcome, "PUBLISHED");
      for (const [suffix, change] of [["missing-parent", { parent_run_id: "missing" }], ["wrong-origin", { origin_sunday_run_id: "wrong" }], ["stale-cutoff", { evidence_cutoff_end: sundayFixture.meta.evidence_cutoff_end }]] as const) {
        const invalid = { ...intermediate, meta: { ...intermediate.meta, run_id: `${runId}-${suffix}`, ...change } };
        trackedRunIds.push(invalid.meta.run_id);
        assert.equal((await ingestIntermediate(invalid, suffix)).runs[0]?.outcome, "REJECTED");
      }
      const reusedHandoff = { ...intermediate, meta: { ...intermediate.meta, run_id: `${runId}-handoff-a`, evidence_cutoff_end: "2026-09-23T00:00:00Z" }, consumed_handoff_id: "handoff-1", handoff_version: 1, handoff_content_hash: "hash-1" };
      trackedRunIds.push(reusedHandoff.meta.run_id);
      assert.equal((await ingestIntermediate(reusedHandoff, "handoff-a")).runs[0]?.outcome, "PUBLISHED");
      const duplicateHandoff = { ...reusedHandoff, meta: { ...reusedHandoff.meta, run_id: `${runId}-handoff-b`, evidence_cutoff_end: "2026-09-24T00:00:00Z" } };
      trackedRunIds.push(duplicateHandoff.meta.run_id);
      assert.equal((await ingestIntermediate(duplicateHandoff, "handoff-b")).runs[0]?.outcome, "REJECTED");

      // 2. Re-ingesting byte-identical content is idempotent (no re-publish, no duplicate row).
      const summary2 = await runGoldMarketStateIngestion({ listFiles: listFiles1, downloadFileText: async () => JSON.stringify(sundayFixture) });
      assert.equal(summary2.runs[0]?.outcome, "ALREADY_PUBLISHED");
      const rowCount = await pool.query("select count(*) as c from public.gold_market_states where run_id = $1", [runId]);
      assert.equal(Number(rowCount.rows[0].c), 1);

      // 3. A document with meta.run_type set but frontend_eligible=false is rejected, never published.
      const notEligible = makeSundayFixture({ meta: { ...sundayFixture.meta, run_id: `${runId}-not-eligible`, frontend_eligible: false } });
      trackedRunIds.push(notEligible.meta.run_id);
      const listFilesNotEligible = async () => [{ id: "f2", name: "sunday_read_2026-09-21.json", modifiedTime: "v1" }];
      const summary3 = await runGoldMarketStateIngestion({ listFiles: listFilesNotEligible, downloadFileText: async () => JSON.stringify(notEligible) });
      assert.equal(summary3.runs[0]?.outcome, "REJECTED");
      assert.equal((await findGoldStateByRunId(notEligible.meta.run_id))?.status, "REJECTED");

      // 4. FIXTURE data_mode never auto-publishes even if otherwise structurally/lineage valid.
      const fixtureMode = makeSundayFixture({ meta: { ...sundayFixture.meta, run_id: `${runId}-fixture-mode`, data_mode: "FIXTURE" } });
      trackedRunIds.push(fixtureMode.meta.run_id);
      const listFilesFixtureMode = async () => [{ id: "f3", name: "sunday_read_2026-09-22.json", modifiedTime: "v1" }];
      const summary4 = await runGoldMarketStateIngestion({ listFiles: listFilesFixtureMode, downloadFileText: async () => JSON.stringify(fixtureMode) });
      assert.equal(summary4.runs[0]?.outcome, "REJECTED");

      // 5. Drive unavailable: the job fails, but the already-PUBLISHED row is untouched.
      await assert.rejects(() =>
        runGoldMarketStateIngestion({
          listFiles: async () => {
            throw new Error("Drive unreachable (simulated)");
          },
        })
      );
      const rowAfterFailure = await findGoldStateByRunId(runId);
      assert.equal(rowAfterFailure?.status, "PUBLISHED");
      assert.equal(rowAfterFailure?.contentHash, row1?.contentHash);

      // 6. The published set never includes the not-eligible/fixture-mode documents.
      const published = await listPublishedGoldStates();
      assert.ok(!published.some((r) => r.runId === notEligible.meta.run_id));
      assert.ok(!published.some((r) => r.runId === fixtureMode.meta.run_id));
    } finally {
      await cleanup(pool, trackedRunIds);
      await closePool();
    }
  }
);
