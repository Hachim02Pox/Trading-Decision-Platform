import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";
import path from "node:path";

const root = path.join(__dirname, "..", "apps", "backend", "src");
const migration = fs.readFileSync(path.join(root, "db", "migrations", "010_gold_edge_checks.sql"), "utf8");
const runnerMigration = fs.readFileSync(path.join(root, "db", "migrations", "012_gold_edge_check_runner_queue.sql"), "utf8");
const queue = fs.readFileSync(path.join(root, "db", "goldEdgeChecks.ts"), "utf8");
const service = fs.readFileSync(path.join(root, "goldEdgeCheck", "service.ts"), "utf8");
test("edge-check migration is additive, idempotent, and protects completed results", () => {
  assert.match(migration, /create table if not exists public\.gold_edge_checks/i);
  assert.match(migration, /unique \(requested_by, idempotency_key\)/i);
  assert.match(migration, /completed gold edge checks are immutable/i);
});
test("runner queue has leases, atomic claiming, and validates result lineage", () => {
  assert.match(runnerMigration, /lease_expires_at/i);
  assert.match(runnerMigration, /attempt_count/i);
  assert.match(queue, /for update skip locked/i);
  assert.match(service, /RESULT_LINEAGE_MISMATCH/);
  assert.match(service, /CONFLICTING_RESULT/);
  assert.match(service, /INVALID_RESULT_CHRONOLOGY/);
  assert.match(service, /runnerPayload/);
});
test("edge-check service requires a valid idempotency key and accepts conclusions only through runner validation", () => {
  assert.match(service, /INVALID_IDEMPOTENCY_KEY/);
  assert.match(service, /GOLD_READ_NOT_FOUND/);
  assert.match(service, /validateRunnerResult/);
});
