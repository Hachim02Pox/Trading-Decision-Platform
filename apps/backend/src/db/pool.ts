import { Pool } from "pg";
import { loadAppConfig } from "../config/env";

// 2026-09-09 — moved off local MySQL entirely, onto the same Supabase
// Postgres project Supabase Auth already lives in (one database, one
// provider, for the whole backend). No ORM (explicit product-owner
// instruction: "PAS d'ORM lourd si inutile"). Missing/incomplete config must
// never crash the app at import time — this module creates nothing at
// import; the pool is created lazily, on first `getPool()` call, and only
// code paths that actually need DB access ever hit `DbNotConfiguredError`.

export class DbNotConfiguredError extends Error {
  constructor() {
    super("Database is not configured — set SUPABASE_API_URL and SUPABASE_DB_PASSWORD in apps/backend/.env before using any DB-backed feature.");
    this.name = "DbNotConfiguredError";
  }
}

let pool: Pool | null = null;

/**
 * Lazily creates (once) and returns the shared connection pool. Throws
 * `DbNotConfiguredError` if config is missing — never called at module load,
 * so an unconfigured DB never blocks app boot.
 *
 * `ssl.rejectUnauthorized: false` is a deliberate, documented choice, not an
 * oversight: Supabase's Session Pooler (Supavisor) has been observed to
 * present an incomplete intermediate certificate chain from this project's
 * network path, which fails strict verification with `self-signed
 * certificate in certificate chain` even though the connection is
 * genuinely to Supabase's own infrastructure over TLS (traffic is still
 * encrypted — only chain verification is relaxed). The realistic residual
 * risk is a routing-level MITM between this backend and Supabase's edge,
 * not an arbitrary untrusted host. See docs/AUTH_SUPABASE.md's "Bugs /
 * points d'attention connus" for the earlier, narrower version of this note
 * (written when this was only used in throwaway migration scripts — now
 * that it's the app's real persistence layer, the same tradeoff is made
 * explicitly here instead).
 */
export function getPool(): Pool {
  const db = loadAppConfig().db;
  if (!db) throw new DbNotConfiguredError();

  if (!pool) {
    pool = new Pool({
      host: db.host,
      port: db.port,
      user: db.user,
      password: db.password,
      database: db.database,
      max: 10,
      ssl: { rejectUnauthorized: false },
    });
  }
  return pool;
}

/** Closes the shared pool, if one was created. Safe to call even if `getPool()` was never called. */
export async function closePool(): Promise<void> {
  if (pool) {
    const toClose = pool;
    pool = null;
    await toClose.end();
  }
}

/** Test-only escape hatch — mirrors the __reset*ForTests() convention already used elsewhere in this codebase (see config/env.ts, real/cache.ts). */
export async function __resetPoolForTests(): Promise<void> {
  await closePool();
}
