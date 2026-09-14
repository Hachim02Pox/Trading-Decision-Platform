import assert from "node:assert/strict";
import test from "node:test";
import {
  groupDriveFilesByRunDate,
  candidateRunDatesNewestFirst,
  type DriveFileRef,
} from "../apps/backend/src/sundayRead/ingestion/discovery.ts";
import { sha256Hex } from "../apps/backend/src/sundayRead/ingestion/hash.ts";
import { runSundayReadDriveIngestion } from "../apps/backend/src/sundayRead/ingestion/ingest.ts";
import { createFixtureFinalRead, type FinalRead } from "../apps/backend/src/sundayRead/schema.ts";
import { loadAppConfig } from "../apps/backend/src/config/env.ts";
import { getPool, closePool } from "../apps/backend/src/db/pool.ts";
import {
  findPublishedSundayReadByRunDate,
  findLatestPublishedSundayRead,
} from "../apps/backend/src/db/sundayReads.ts";

// ---------------------------------------------------------------------------
// Pure unit tests — discovery grouping and hashing. No DB, no Drive, always run.
// ---------------------------------------------------------------------------

test("groupDriveFilesByRunDate: groups the four artifact kinds by filename date, ignores unrelated/invalid-date files", () => {
  const files: DriveFileRef[] = [
    { id: "j1", name: "sunday_read_2026-09-20.json", modifiedTime: "t" },
    { id: "m1", name: "SUNDAY_READ_2026-09-20.md", modifiedTime: "t" },
    { id: "r1", name: "RUN_REPORT_2026-09-20.md", modifiedTime: "t" },
    { id: "v1", name: "VALIDATION_REPORT_2026-09-20.md", modifiedTime: "t" },
    { id: "x1", name: "random_notes.txt", modifiedTime: "t" },
    { id: "j2", name: "sunday_read_2026-02-30.json", modifiedTime: "t" },
  ];
  const groups = groupDriveFilesByRunDate(files);
  assert.equal(groups.size, 1, "the calendar-invalid 2026-02-30 filename must be ignored");
  const group = groups.get("2026-09-20");
  assert.equal(group?.json?.id, "j1");
  assert.equal(group?.markdown?.id, "m1");
  assert.equal(group?.runReport?.id, "r1");
  assert.equal(group?.validationReport?.id, "v1");
});

test("candidateRunDatesNewestFirst: only run_dates with a JSON file are candidates, newest first", () => {
  const files: DriveFileRef[] = [
    { id: "j1", name: "sunday_read_2026-09-13.json", modifiedTime: "t" },
    { id: "m2", name: "SUNDAY_READ_2026-09-20.md", modifiedTime: "t" },
    { id: "j3", name: "sunday_read_2026-09-06.json", modifiedTime: "t" },
  ];
  const candidates = candidateRunDatesNewestFirst(groupDriveFilesByRunDate(files));
  assert.deepEqual(candidates.map((c) => c.runDate), ["2026-09-13", "2026-09-06"]);
});

test("sha256Hex: deterministic, content-sensitive, hex-encoded", () => {
  assert.equal(sha256Hex("hello"), sha256Hex("hello"));
  assert.notEqual(sha256Hex("hello"), sha256Hex("hello!"));
  assert.equal(sha256Hex("hello").length, 64);
});

// ---------------------------------------------------------------------------
// End-to-end ingestion tests against the real Postgres (Supabase), skipped
// when not configured — same convention as
// tests/kpi-observations-persistence.test.ts. Drive itself is always faked
// via the injected listFiles/downloadFileText deps (see ingest.ts's
// SundayReadIngestionDeps) — this suite never makes a live Google API call.
// Run with: tsx --env-file=apps/backend/.env --test tests/sunday-read-ingestion.test.ts
// ---------------------------------------------------------------------------

const dbConfigured = loadAppConfig().db !== null;
const RUN_DATE_A = "2026-08-30";
const RUN_DATE_B = "2026-09-06";
const JOB_KEY = "sunday-read:drive-sync";

function makeRealRead(runDate: string, overrides: Partial<FinalRead> = {}): FinalRead {
  const read = createFixtureFinalRead();
  return {
    ...read,
    ...overrides,
    meta: { ...read.meta, data_mode: "REAL", week_of: runDate, run_id: `test-${runDate}`, status: "PARTIAL" },
  };
}

async function cleanup(pool: ReturnType<typeof getPool>): Promise<void> {
  await pool.query("delete from public.sunday_reads where run_date in ($1, $2)", [RUN_DATE_A, RUN_DATE_B]);
  await pool.query("delete from public.ingestion_state where job_key = $1", [JOB_KEY]);
}

test(
  "Sunday Read Drive ingestion: validation gate, idempotency, revision handling and failure isolation (real Postgres)",
  {
    skip: dbConfigured
      ? false
      : "DB not configured in this process's environment — see file header for how to run this suite against the real Supabase Postgres instance.",
  },
  async () => {
    const pool = getPool();
    await cleanup(pool);
    try {
      // 1. A valid REAL run (with an explicitly PARTIAL meta.status/evidence,
      // per the "PARTIAL is valid" rule) is accepted and published.
      const validRead = makeRealRead(RUN_DATE_A);
      const listFilesA = async () => [{ id: "file-a-v1", name: `sunday_read_${RUN_DATE_A}.json`, modifiedTime: "v1" }];
      const downloadA = async (fileId: string) => {
        assert.equal(fileId, "file-a-v1");
        return JSON.stringify(validRead);
      };
      const summary1 = await runSundayReadDriveIngestion({ listFiles: listFilesA, downloadFileText: downloadA });
      assert.equal(summary1.runs[0]?.outcome, "PUBLISHED");
      const published1 = await findPublishedSundayReadByRunDate(RUN_DATE_A);
      assert.ok(published1, "a valid REAL/PARTIAL-evidence run must be published");
      assert.equal((published1?.jsonPayload as FinalRead).meta.run_id, validRead.meta.run_id);

      // 2. Re-ingesting the SAME Drive file version is a cheap metadata skip:
      // no re-download, no duplicate row (idempotent).
      let downloadCalled = false;
      const summary2 = await runSundayReadDriveIngestion({
        listFiles: listFilesA,
        downloadFileText: async (id) => {
          downloadCalled = true;
          return downloadA(id);
        },
      });
      assert.equal(summary2.runs[0]?.outcome, "ALREADY_PUBLISHED");
      assert.equal(downloadCalled, false, "an unchanged Drive file version must not be re-downloaded");
      const rowCountA = await pool.query("select count(*) as c from public.sunday_reads where run_date = $1", [RUN_DATE_A]);
      assert.equal(Number(rowCountA.rows[0].c), 1, "still exactly one row after a duplicate poll");

      // 3. Malformed JSON is rejected; the previously published run is untouched.
      const listFilesBroken = async () => [{ id: "file-a-broken", name: `sunday_read_${RUN_DATE_A}.json`, modifiedTime: "v2-broken" }];
      const summary3 = await runSundayReadDriveIngestion({ listFiles: listFilesBroken, downloadFileText: async () => "{not valid json" });
      assert.equal(summary3.runs[0]?.outcome, "REJECTED");
      assert.equal(
        (await findPublishedSundayReadByRunDate(RUN_DATE_A))?.contentHash,
        published1?.contentHash,
        "malformed JSON must never replace the currently published run"
      );

      // 4. Schema-invalid JSON (missing a required top-level section) is rejected.
      const missingSection = { ...makeRealRead(RUN_DATE_A) } as Record<string, unknown>;
      delete missingSection.asymmetry;
      const listFilesMissingSection = async () => [{ id: "file-a-missing", name: `sunday_read_${RUN_DATE_A}.json`, modifiedTime: "v3-missing" }];
      const summary4 = await runSundayReadDriveIngestion({ listFiles: listFilesMissingSection, downloadFileText: async () => JSON.stringify(missingSection) });
      assert.equal(summary4.runs[0]?.outcome, "REJECTED");

      // 4b. A broken scenario-tree reference (directional TERMINAL with no
      // ASYMMETRY_GATE ancestor) is rejected by the reused canonical validator.
      const brokenTree = makeRealRead(RUN_DATE_A);
      const terminal = brokenTree.scenario_tree.nodes.find((n) => n.id === "bull-terminal");
      if (terminal) terminal.terminal_outcome = "BULLISH";
      brokenTree.scenario_tree.edges = brokenTree.scenario_tree.edges.filter((e) => e.from !== "bull-gate");
      const listFilesBrokenTree = async () => [{ id: "file-a-brokentree", name: `sunday_read_${RUN_DATE_A}.json`, modifiedTime: "v3b-brokentree" }];
      const summary4b = await runSundayReadDriveIngestion({ listFiles: listFilesBrokenTree, downloadFileText: async () => JSON.stringify(brokenTree) });
      assert.equal(summary4b.runs[0]?.outcome, "REJECTED");

      // 5. FIXTURE data_mode never auto-publishes, even if structurally valid.
      const fixtureRead = makeRealRead(RUN_DATE_A, {});
      fixtureRead.meta.data_mode = "FIXTURE";
      const listFilesFixture = async () => [{ id: "file-a-fixture", name: `sunday_read_${RUN_DATE_A}.json`, modifiedTime: "v4-fixture" }];
      const summary5 = await runSundayReadDriveIngestion({ listFiles: listFilesFixture, downloadFileText: async () => JSON.stringify(fixtureRead) });
      assert.equal(summary5.runs[0]?.outcome, "REJECTED");
      assert.equal((await findPublishedSundayReadByRunDate(RUN_DATE_A))?.contentHash, published1?.contentHash);

      // 6. A genuine revision (same run_date, changed content) supersedes the
      // previous published version — at most one PUBLISHED row per run_date.
      const revisedRead = makeRealRead(RUN_DATE_A, { executive_narrative: "REVISED narrative for the same Sunday." });
      const listFilesRevised = async () => [{ id: "file-a-v5", name: `sunday_read_${RUN_DATE_A}.json`, modifiedTime: "v5-revised" }];
      const summary6 = await runSundayReadDriveIngestion({ listFiles: listFilesRevised, downloadFileText: async () => JSON.stringify(revisedRead) });
      assert.equal(summary6.runs[0]?.outcome, "PUBLISHED");
      const published2 = await findPublishedSundayReadByRunDate(RUN_DATE_A);
      assert.equal((published2?.jsonPayload as FinalRead).executive_narrative, revisedRead.executive_narrative);
      const publishedCountA = await pool.query(
        "select count(*) as c from public.sunday_reads where run_date = $1 and status = 'PUBLISHED'",
        [RUN_DATE_A]
      );
      assert.equal(Number(publishedCountA.rows[0].c), 1, "at most one PUBLISHED row must exist per run_date");
      const supersededCountA = await pool.query(
        "select count(*) as c from public.sunday_reads where run_date = $1 and status = 'SUPERSEDED'",
        [RUN_DATE_A]
      );
      assert.equal(Number(supersededCountA.rows[0].c), 1, "the previous published version is superseded, not deleted");

      // 7. Drive being unavailable must leave the currently published run
      // completely untouched and must surface as a failed ingestion job.
      await assert.rejects(() =>
        runSundayReadDriveIngestion({
          listFiles: async () => {
            throw new Error("Drive unreachable (simulated)");
          },
        })
      );
      assert.equal(
        (await findPublishedSundayReadByRunDate(RUN_DATE_A))?.contentHash,
        published2?.contentHash,
        "a Drive-layer failure must never touch the currently published run"
      );

      // 8. GET /api/sunday-read/latest's data source (findLatestPublishedSundayRead)
      // returns the most recent run_date among published runs, across two weeks.
      const secondWeekRead = makeRealRead(RUN_DATE_B);
      const listFilesB = async () => [{ id: "file-b-v1", name: `sunday_read_${RUN_DATE_B}.json`, modifiedTime: "b-v1" }];
      await runSundayReadDriveIngestion({ listFiles: listFilesB, downloadFileText: async () => JSON.stringify(secondWeekRead) });
      const latest = await findLatestPublishedSundayRead();
      assert.equal(latest?.runDate, RUN_DATE_B, "the newer run_date must be returned as the latest published run");
    } finally {
      await cleanup(pool);
      await closePool();
    }
  }
);
