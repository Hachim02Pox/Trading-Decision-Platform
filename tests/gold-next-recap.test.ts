import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { deriveNextRecap } from "../apps/backend/src/goldNextRecap/service.ts";

const raw = fs.readFileSync(path.join(__dirname, "fixtures", "gold", "FIXTURE_next_gold_recap.json"), "utf8");
const fixture = JSON.parse(raw) as Record<string, any>;
const at = (value: Record<string, any>) => JSON.stringify(value);
const now = new Date("2026-09-25T12:00:00Z");
test("next recap derives scheduled, due, expired, cancelled and invalid honestly", () => {
  assert.equal(deriveNextRecap(raw, [], now).status, "SCHEDULED");
  const due = structuredClone(fixture); due.next_execution.requested_at = "2026-09-24T12:00:00Z";
  assert.equal(deriveNextRecap(at(due), [], now).status, "DUE");
  const expired = structuredClone(fixture); expired.expiry.expires_at = "2026-09-24T12:00:00Z";
  assert.equal(deriveNextRecap(at(expired), [], now).status, "EXPIRED");
  const cancelled = structuredClone(fixture); cancelled.expiry.cancelled = true;
  assert.equal(deriveNextRecap(at(cancelled), [], now).status, "CANCELLED");
  assert.equal(deriveNextRecap("{", [], now).status, "INVALID");
  const schemaInvalid = structuredClone(fixture); delete schemaInvalid.scenario_checks;
  assert.equal(deriveNextRecap(at(schemaInvalid), [], now).status, "INVALID");
});
test("consumption requires the exact canonical id/version/hash triplet", () => {
  const hash = createHash("sha256").update(raw).digest("hex");
  const state = { jsonPayload: { consumed_handoff_id: fixture.handoff_id, handoff_version: fixture.handoff_version, handoff_content_hash: hash } };
  assert.equal(deriveNextRecap(raw, [state], now).status, "CONSUMED");
  assert.equal(deriveNextRecap(raw, [{ jsonPayload: { ...state.jsonPayload, handoff_version: 99 } }], now).status, "SCHEDULED");
  assert.equal(deriveNextRecap(raw, [{ jsonPayload: { ...state.jsonPayload, handoff_content_hash: "other" } }], now).status, "SCHEDULED");
});
test("public response excludes control-plane instructions and converts only safe schedule fields", () => {
  const result = deriveNextRecap(raw, [], now, "2026-09-25T12:00:00.000Z");
  assert.deepEqual(Object.keys(result).sort(), ["minimum_confirmation_delay", "parent_state_run_id", "reason", "reason_en", "reason_fr", "requested_at", "retrieved_at", "status", "timezone"]);
  assert.equal(result.timezone, "America/New_York");
});

test("localized next-recap copy is passed through while historical handoffs retain their fallback", () => {
  const localized = structuredClone(fixture);
  localized.next_execution.reason_fr = "Contrôle après la publication.";
  localized.next_execution.reason_en = "Check after the release.";
  localized.next_execution.minimum_confirmation_delay_fr = "Attendre 30 minutes.";
  localized.next_execution.minimum_confirmation_delay_en = "Wait 30 minutes.";
  const result = deriveNextRecap(at(localized), [], now);
  assert.equal(result.reason_fr, "Contrôle après la publication.");
  assert.equal(result.reason_en, "Check after the release.");
  assert.equal(result.minimum_confirmation_delay?.fr, "Attendre 30 minutes.");
  assert.equal(result.minimum_confirmation_delay?.en, "Wait 30 minutes.");
  assert.equal(deriveNextRecap(raw, [], now).reason, fixture.next_execution.reason);
});
