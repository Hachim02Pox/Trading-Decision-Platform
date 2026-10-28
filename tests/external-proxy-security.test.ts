import assert from "node:assert/strict";
import test from "node:test";
import { fetchProxiedLinkHtml, fetchProxiedSourceHtml } from "../apps/backend/src/proxy/externalSourceProxy";

test("proxy rejects untrusted destinations before fetching", async () => {
  const original = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async () => { calls++; return new Response("<html>test</html>"); };
  try {
    for (const url of ["https://evil.tradingview.com/", "https://tradingview.com:444/", "https://user:pass@gold.org/", "http://gold.org/", "https://127.0.0.1/", "https://gold.org\n/", "https://gold.org.evil.test/"]) {
      assert.equal(await fetchProxiedLinkHtml(url), null, url);
    }
    assert.equal(await fetchProxiedSourceHtml("constructor"), null);
    assert.equal(await fetchProxiedSourceHtml("__proto__"), null);
    assert.equal(calls, 0);
  } finally { globalThis.fetch = original; }
});

test("proxy refuses redirects and contains network errors", async () => {
  const original = globalThis.fetch;
  let observedInit: RequestInit | undefined;
  globalThis.fetch = async (_url, init) => {
    observedInit = init;
    throw new TypeError("redirect refused");
  };
  try {
    assert.equal(await fetchProxiedLinkHtml("https://gold.org/"), null);
    assert.equal(observedInit?.redirect, "error");
    assert.ok(observedInit?.signal);
  }
  finally { globalThis.fetch = original; }
});

test("proxy bounds response bodies even without a Content-Length", async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async () => new Response("x".repeat(2 * 1024 * 1024 + 1));
  try { assert.equal(await fetchProxiedLinkHtml("https://gold.org/"), null); }
  finally { globalThis.fetch = original; }
});

test("proxy rewrites a valid exact-host HTML response", async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async () => new Response("<html><head></head><body>source</body></html>");
  try {
    const html = await fetchProxiedLinkHtml("https://www.gold.org/");
    assert.ok(html?.includes('<base href="https://www.gold.org/">'));
    assert.ok(html?.includes("source"));
  } finally { globalThis.fetch = original; }
});
