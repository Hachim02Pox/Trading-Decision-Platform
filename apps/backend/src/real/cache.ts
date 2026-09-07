// Milestone 2B — minimal per-key TTL cache for real-provider data. Real
// government/exchange data updates at most daily (Treasury/NY Fed) or as
// infrequently as monthly (BLS), so there is no need for sub-second
// freshness or a background polling loop/scheduler — this cache is refreshed
// lazily: a request after TTL expiry triggers exactly one fetch, and every
// request in between (and every concurrent request during a slow fetch,
// since `store` holds the in-flight promise) is served from memory.
//
// On fetch failure, the previous (possibly-fresh-looking but now-stale)
// entry is deliberately NOT served — the rejected promise propagates to the
// caller (see apps/backend/src/real/f*.ts, which each catch it and mark the
// affected KPI(s) UNAVAILABLE) and the cache slot for `key` is cleared so the
// next request retries from scratch, per "never silently keep old data on a
// failure" in the milestone brief.
//
// Bug B fix (foundation pass) — a fetcher returning `null` (several
// providers' fetchers are typed `Promise<T | null>` for "no usable data this
// attempt", e.g. providers/nyFed.ts's fetchEffrRate) was previously cached
// as if it were a valid successful result: a single transient failure got
// "frozen" behind a happy-looking cache entry for the FULL TTL (up to several hours for the
// monthly-cadence callers), so a retry only happened once the TTL expired on
// its own — never on the next request, unlike the already-correct
// thrown-error path just above. `isCacheableValue` below draws the same line
// this codebase already draws elsewhere (KpiOverride/unavailableOverride
// treat `value: null` as "no usable value" — see real/types.ts): `null`/
// `undefined` and `NaN` are never stored, so the very next call re-attempts
// the real fetch instead of replaying the failure for the rest of the TTL
// window. This does NOT change the "empty array" case (e.g. an FX leg's
// history fetch returning `[]`) — callers already decide what an empty
// array means for their own shape (see real/f2Rates.ts's
// `fetchSeriesHistorySafe`, which turns `[]` into `null` itself); the cache
// layer does not second-guess that.

interface CacheEntry<T> {
  promise: Promise<T>;
  fetchedAtMs: number;
}

const store = new Map<string, CacheEntry<unknown>>();

export interface CachedResult<T> {
  value: T;
  fetchedAtMs: number;
}

/** `null`/`undefined`/`NaN` are the only values this generic layer can universally recognize as "not a real result" across every fetcher shape used in apps/backend/src/real/*.ts — see the Bug B comment above. */
function isCacheableValue<T>(value: T): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === "number" && Number.isNaN(value)) return false;
  return true;
}

export async function cached<T>(key: string, ttlMs: number, fetcher: () => Promise<T>): Promise<CachedResult<T>> {
  const now = Date.now();
  const existing = store.get(key) as CacheEntry<T> | undefined;
  if (existing && now - existing.fetchedAtMs < ttlMs) {
    return { value: await existing.promise, fetchedAtMs: existing.fetchedAtMs };
  }

  const fetchedAtMs = now;
  const promise = fetcher();
  store.set(key, { promise, fetchedAtMs });
  try {
    const value = await promise;
    if (!isCacheableValue(value)) {
      // Never poison the cache with a "successful null" — see Bug B comment
      // above. The caller still gets this attempt's (null/NaN) value; only
      // the NEXT call is affected, and it will re-invoke `fetcher` for real.
      store.delete(key);
    }
    return { value, fetchedAtMs };
  } catch (err) {
    store.delete(key); // don't let a failed fetch poison the cache for the next attempt
    throw err;
  }
}

/** Test-only escape hatch. */
export function __clearRealDataCacheForTests(): void {
  store.clear();
}
