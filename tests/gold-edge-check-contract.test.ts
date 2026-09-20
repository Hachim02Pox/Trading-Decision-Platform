import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";
import path from "node:path";

const root = path.join(__dirname, "..", "apps", "backend", "src");
const migration = fs.readFileSync(path.join(root, "db", "migrations", "010_gold_edge_checks.sql"), "utf8");
const service = fs.readFileSync(path.join(root, "goldEdgeCheck", "service.ts"), "utf8");
test("edge-check migration is additive, idempotent, and protects completed results", () => {
  assert.match(migration, /create table if not exists public\.gold_edge_checks/i);
  assert.match(migration, /unique \(requested_by, idempotency_key\)/i);
  assert.match(migration, /completed gold edge checks are immutable/i);
});
test("edge-check service requires a valid idempotency key and does not fabricate analytical results", () => {
  assert.match(service, /INVALID_IDEMPOTENCY_KEY/);
  assert.match(service, /GOLD_READ_NOT_FOUND/);
  assert.doesNotMatch(service, /EDGE_UNCHANGED/);
});
