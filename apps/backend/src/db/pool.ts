import { Pool } from "pg";
import { loadAppConfig } from "../config/env";
import { SUPABASE_ROOT_CA_2021 } from "./supabaseRootCa";

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
 * TLS is verified strictly (`rejectUnauthorized: true`) against Supabase's
 * own pinned root CA (`supabaseRootCa.ts`), not disabled. The Session Pooler
 * (Supavisor, `*.pooler.supabase.com`) presents a certificate signed by
 * Supabase's private "Supabase Root 2021 CA" — a real root, but not a
 * publicly-trusted one, so Node's default CA bundle alone reports
 * `SELF_SIGNED_CERT_IN_CHAIN`. Pinning the actual root (same certificate
 * Supabase's own Dashboard offers for download under Database Settings)
 * gives genuine chain verification instead of turning it off.
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
      ssl: { rejectUnauthorized: true, ca: SUPABASE_ROOT_CA_2021 },
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
