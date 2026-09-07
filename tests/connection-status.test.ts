import assert from "node:assert/strict";
import test from "node:test";
import { resolveConnectionPoll } from "../apps/frontend/src/lib/useConnectionStatus";

test("connection polling distinguishes reconnecting, disconnected, and recovered", () => {
  assert.deepEqual(resolveConnectionPoll(0, false), { failures: 1, status: "RECONNECTING" });
  assert.deepEqual(resolveConnectionPoll(1, false), { failures: 2, status: "DISCONNECTED" });
  assert.deepEqual(resolveConnectionPoll(2, true), { failures: 0, status: "CONNECTED" });
});
