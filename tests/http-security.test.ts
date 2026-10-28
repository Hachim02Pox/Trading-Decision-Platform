import assert from "node:assert/strict";
import test from "node:test";
import { clientIdentity, createPublicRateLimiter, createRateLimiter, createStreamLimiter, listenHost, trustedLocalCliEnabled, safeHttpError, sandboxProxyHtml } from "../apps/backend/src/security/httpSecurity";
import { runCliSubprocess } from "../apps/backend/src/intelligence/providers/cliSubprocess";
import type { Request, Response } from "express";
import express from "express";
import { once } from "node:events";
import type { AddressInfo } from "node:net";

function response() {
  let status = 200;
  const handlers: Record<string, () => void> = {};
  const res = { status(code: number) { status = code; return this; }, json() { return this; }, setHeader() {}, once(name: string, fn: () => void) { handlers[name] = fn; } } as unknown as Response;
  return { res, status: () => status, close: () => handlers.close?.() };
}
const req = (ip: string) => ({ socket: { remoteAddress: ip }, headers: {} }) as unknown as Request;

test("client identity ignores spoofed forwarding locally and validates Railway edge addresses", () => {
  const request = req("127.0.0.1");
  request.headers["x-real-ip"] = "192.0.2.1";
  request.headers["x-forwarded-for"] = "192.0.2.2";
  assert.equal(clientIdentity(request, {}), "socket:127.0.0.1");
  const railway = { RAILWAY_ENVIRONMENT_ID: "deployment", RAILWAY_PUBLIC_DOMAIN: "backend.up.railway.app" };
  assert.equal(clientIdentity(request, railway), "client:192.0.2.1");
  request.headers["x-real-ip"] = "192.0.2.1, 192.0.2.2";
  assert.equal(clientIdentity(request, railway), "socket:127.0.0.1");
  request.headers["x-real-ip"] = ["192.0.2.1", "192.0.2.2"];
  assert.equal(clientIdentity(request, railway), "socket:127.0.0.1");
  request.holder = { id: "verified-account", email: null };
  assert.equal(clientIdentity(request, railway), "holder:verified-account");
});

test("two Railway visitors behind one socket retain separate rate and stream limits", () => {
  const env = { RAILWAY_ENVIRONMENT_ID: "deployment", RAILWAY_PUBLIC_DOMAIN: "backend.up.railway.app" };
  const limit = createRateLimiter({ max: 1, env });
  const streams = createStreamLimiter(2, 1, env);
  let passed = 0;
  for (const ip of ["192.0.2.1", "192.0.2.2"]) {
    const request = req("127.0.0.1"); request.headers["x-real-ip"] = ip;
    limit(request, response().res, () => passed++);
    streams(request, response().res, () => passed++);
  }
  assert.equal(passed, 4);
});

test("guest throttle cannot consume health or internal cron availability", () => {
  const limit = createPublicRateLimiter({ max: 1 });
  const guest = { ...req("a"), path: "/public" } as unknown as Request;
  limit(guest, response().res, () => {});
  const blocked = response(); limit(guest, blocked.res, () => assert.fail("guest quota bypass")); assert.equal(blocked.status(), 429);
  for (const path of ["/health", "/api/internal/calendar/ingest", "/internal/gold/refresh"]) {
    let passed = false;
    limit({ ...guest, path } as Request, response().res, () => { passed = true; });
    assert.ok(passed);
  }
});

test("rate limiter rejects excess calls and expires its bounded window", () => {
  let now = 0;
  const limit = createRateLimiter({ max: 2, windowMs: 1000, maxKeys: 2, now: () => now });
  let passed = 0;
  for (let i = 0; i < 3; i++) { const r = response(); limit(req("a"), r.res, () => passed++); if (i === 2) assert.equal(r.status(), 429); }
  assert.equal(passed, 2);
  now = 1001;
  limit(req("a"), response().res, () => passed++);
  assert.equal(passed, 3);
});

test("rate limiter refuses new clients at capacity without evicting active limits", () => {
  const limit = createRateLimiter({ max: 1, windowMs: 1000, maxKeys: 1, now: () => 0 });
  limit(req("a"), response().res, () => {});
  const r = response(); limit(req("b"), r.res, () => assert.fail("capacity bypass")); assert.equal(r.status(), 429);
  const repeat = response(); limit(req("a"), repeat.res, () => assert.fail("limit evicted")); assert.equal(repeat.status(), 429);
});

test("stream limiter bounds clients and releases slots on close", () => {
  const limit = createStreamLimiter(1, 1);
  const first = response(); limit(req("a"), first.res, () => {});
  const denied = response(); limit(req("b"), denied.res, () => assert.fail("stream cap bypass")); assert.equal(denied.status(), 429);
  first.close();
  let passed = false; limit(req("b"), response().res, () => { passed = true; }); assert.ok(passed);
});

test("local CLI requires explicit opt-in and cannot run in deployment", () => {
  assert.equal(trustedLocalCliEnabled({}), false);
  assert.equal(trustedLocalCliEnabled({ ALLOW_TRUSTED_LOCAL_CLI: "true" }), true);
  assert.equal(trustedLocalCliEnabled({ ALLOW_TRUSTED_LOCAL_CLI: "true", NODE_ENV: "production" }), false);
  assert.equal(trustedLocalCliEnabled({ ALLOW_TRUSTED_LOCAL_CLI: "true", RAILWAY_ENVIRONMENT_ID: "x" }), false);
  assert.equal(listenHost({}), "127.0.0.1");
  assert.equal(listenHost({ NODE_ENV: "production" }), "0.0.0.0");
});

test("CLI execution fails closed before attempting any executable", async () => {
  const old = process.env.ALLOW_TRUSTED_LOCAL_CLI;
  delete process.env.ALLOW_TRUSTED_LOCAL_CLI;
  try {
    const result = await runCliSubprocess({ command: "must-never-execute", args: [], cwd: process.cwd(), timeoutMs: 10 });
    assert.equal(result.exitCode, null);
    assert.equal(result.stderr, "Local CLI execution is disabled.");
  } finally {
    if (old === undefined) delete process.env.ALLOW_TRUSTED_LOCAL_CLI; else process.env.ALLOW_TRUSTED_LOCAL_CLI = old;
  }
});

test("HTTP errors do not expose internal error strings", () => {
  let body: unknown;
  let status: number | undefined;
  const res = { headersSent: false, status(code: number) { status = code; return this; }, json(value: unknown) { body = value; } } as unknown as Response;
  safeHttpError(new Error("postgres credentials/private/path"), req("a"), res, () => {});
  assert.equal(status, 500);
  assert.ok(!JSON.stringify(body).includes("postgres"));
  safeHttpError(new SyntaxError("sensitive body contents"), req("a"), res, () => {});
  assert.equal(status, 400);
  assert.ok(!JSON.stringify(body).includes("sensitive"));
});

test("proxy HTML is sandboxed independently of its embedding iframe", () => {
  const headers: Record<string, string> = {};
  const res = { setHeader(key: string, value: string) { headers[key] = value; } } as unknown as Response;
  let passed = false;
  sandboxProxyHtml(req("a"), res, () => { passed = true; });
  assert.ok(passed);
  assert.equal(headers["Content-Security-Policy"], "sandbox allow-scripts allow-popups");
  assert.equal(headers["Cache-Control"], "no-store");
  assert.equal(headers["X-Content-Type-Options"], "nosniff");
});

test("HTTP integration keeps public reads available and rejects malformed uploads safely", async () => {
  const app = express();
  app.use(createRateLimiter({ max: 3 }));
  app.use(express.json({ limit: "1kb" }));
  app.get("/public", (_req, res) => res.json({ ok: true }));
  app.post("/body", (_req, res) => res.json({ ok: true }));
  app.use(safeHttpError);
  const server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  const url = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  try {
    assert.equal((await fetch(`${url}/public`)).status, 200);
    const bad = await fetch(`${url}/body`, { method: "POST", headers: { "Content-Type": "application/json" }, body: '{"secret":invalid}' });
    assert.equal(bad.status, 400);
    assert.ok(!(await bad.text()).includes("secret"));
    const oversized = await fetch(`${url}/body`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ value: "x".repeat(2000) }) });
    assert.equal(oversized.status, 413);
    assert.equal((await fetch(`${url}/public`)).status, 429);
  } finally { server.closeAllConnections(); await new Promise<void>((resolve) => server.close(() => resolve())); }
});
