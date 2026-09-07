import assert from "node:assert/strict";
import test from "node:test";
import { cached, __clearRealDataCacheForTests } from "../apps/backend/src/real/cache.ts";

// Foundation pass — Bug B (negative-cache) regression tests. Covers exactly
// the three behaviors specified for apps/backend/src/real/cache.ts's shared
// `cached()` wrapper: a valid result is genuinely cached; a null result is
// never cached; a thrown error is never cached. (The 4th required case — a
// previously-stored valid MySQL kpi_observations row surviving a subsequent
// failed fetch — is covered separately in
// tests/kpi-observations-persistence.test.ts against the real DB helpers.)

test("cached: a valid result is served from cache within TTL (fetcher not re-invoked)", async () => {
  __clearRealDataCacheForTests();
  let calls = 0;
  const fetcher = async () => {
    calls++;
    return { ok: true, n: 42 };
  };

  const first = await cached("test:valid-result", 60_000, fetcher);
  const second = await cached("test:valid-result", 60_000, fetcher);

  assert.equal(calls, 1, "fetcher must be invoked exactly once — the second call should be a cache hit");
  assert.deepEqual(first.value, { ok: true, n: 42 });
  assert.deepEqual(second.value, { ok: true, n: 42 });
  assert.equal(second.fetchedAtMs, first.fetchedAtMs, "a cache hit reports the ORIGINAL fetch time, not a new one");
});

test("cached: a null result is never cached — the very next call re-invokes the fetcher", async () => {
  __clearRealDataCacheForTests();
  let calls = 0;
  const fetcher = async () => {
    calls++;
    return null;
  };

  const first = await cached("test:null-result", 60_000, fetcher);
  const second = await cached("test:null-result", 60_000, fetcher);

  assert.equal(first.value, null);
  assert.equal(second.value, null);
  assert.equal(calls, 2, "a null result must never poison the cache — the next call has to re-attempt the real fetch");
});

test("cached: a thrown error is never cached — the next call re-invokes the fetcher", async () => {
  __clearRealDataCacheForTests();
  let calls = 0;
  const fetcher = async () => {
    calls++;
    if (calls === 1) throw new Error("simulated transient provider failure");
    return { ok: true };
  };

  await assert.rejects(() => cached("test:throw-result", 60_000, fetcher), /simulated transient provider failure/);
  const second = await cached("test:throw-result", 60_000, fetcher);

  assert.equal(calls, 2, "a thrown error must never poison the cache — the next call has to re-attempt the real fetch");
  assert.deepEqual(second.value, { ok: true });
});

test("cached: a NaN numeric result is treated the same as null — never cached", async () => {
  __clearRealDataCacheForTests();
  let calls = 0;
  const fetcher = async () => {
    calls++;
    return NaN;
  };

  await cached("test:nan-result", 60_000, fetcher);
  await cached("test:nan-result", 60_000, fetcher);

  assert.equal(calls, 2, "NaN is not a usable value and must not be frozen behind a cache entry");
});
