import assert from "node:assert/strict";
import test from "node:test";
import nextConfig from "../apps/frontend/next.config";

test("every frontend route denies framing and browser capability access", async () => {
  assert.equal(nextConfig.poweredByHeader, false);
  const rules = await nextConfig.headers!();
  const globalRule = rules.find((rule) => rule.source === "/:path*");
  assert.ok(globalRule);
  const headers = new Map(globalRule.headers.map(({ key, value }) => [key, value]));
  assert.equal(headers.get("X-Frame-Options"), "DENY");
  assert.equal(headers.get("X-Content-Type-Options"), "nosniff");
  assert.match(headers.get("Content-Security-Policy")!, /frame-ancestors 'none'/);
  assert.match(headers.get("Content-Security-Policy")!, /base-uri 'self'/);
  assert.equal(headers.get("Referrer-Policy"), "strict-origin-when-cross-origin");
  assert.equal(headers.get("Permissions-Policy"), "camera=(), microphone=(), geolocation=()");
});
