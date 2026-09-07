// Milestone 2A — minimal shared HTTP helper for provider adapters. Uses
// Node's native global `fetch` (no new HTTP client dependency, per the
// "no overengineering" instruction). Every adapter call is expected to be
// wrapped in try/catch by its caller — this helper does not swallow errors,
// it just applies a bounded timeout so one slow/unreachable provider can
// never hang a smoke test indefinitely.

export const DEFAULT_TIMEOUT_MS = 10_000;

export interface FetchJsonResult<T> {
  ok: boolean;
  status: number;
  body: T | null;
  raw: string;
}

/**
 * Fetches `url`, applies a hard timeout, and best-effort parses the response
 * body as JSON (falls back to `body: null` with the raw text preserved if
 * parsing fails — e.g. an HTML error page). Never logs headers or the
 * request init object; callers must not pass credentials in a way that
 * would end up in a thrown error message either.
 */
export async function fetchJson<T>(
  url: string,
  init?: RequestInit,
  timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<FetchJsonResult<T>> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...init, signal: controller.signal });
    const raw = await res.text();
    let body: T | null = null;
    try {
      body = raw.length > 0 ? (JSON.parse(raw) as T) : null;
    } catch {
      body = null;
    }
    return { ok: res.ok, status: res.status, body, raw };
  } finally {
    clearTimeout(timeout);
  }
}

/** Same as fetchJson but returns the raw response text unparsed (e.g. XML feeds). */
export async function fetchText(
  url: string,
  init?: RequestInit,
  timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<{ ok: boolean; status: number; raw: string }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...init, signal: controller.signal });
    const raw = await res.text();
    return { ok: res.ok, status: res.status, raw };
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Same shape as fetchText/fetchJson but for binary responses (e.g. the SPDR
 * GLD historical-archive XLSX file — see apps/backend/src/providers/
 * spdrGld.ts). Never parses the body; callers own that. `buffer` is `null`
 * whenever `ok` is false so a non-2xx response never gets handed to a
 * binary parser as if it were real file content.
 */
export async function fetchArrayBuffer(
  url: string,
  init?: RequestInit,
  timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<{ ok: boolean; status: number; buffer: ArrayBuffer | null }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...init, signal: controller.signal });
    const buffer = res.ok ? await res.arrayBuffer() : null;
    return { ok: res.ok, status: res.status, buffer };
  } finally {
    clearTimeout(timeout);
  }
}

export function elapsedMs(startedAt: number): number {
  return Math.round(performance.now() - startedAt);
}
