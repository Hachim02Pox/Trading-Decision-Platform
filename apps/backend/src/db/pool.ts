import mysql from "mysql2/promise";
import type { Pool } from "mysql2/promise";
import { loadAppConfig } from "../config/env";

// Foundation pass — a plain mysql2/promise connection pool. No ORM (explicit
// product-owner instruction: "PAS d'ORM lourd si inutile"). Missing/
// incomplete DB config (see config/env.ts's DbConfig/loadDb()) must never
// crash the app at import time — this module creates nothing at import; the
// pool is created lazily, on first `getPool()` call, and only code paths
// that actually need DB access ever hit `DbNotConfiguredError`.

export class DbNotConfiguredError extends Error {
  constructor() {
    super(
      "Database is not configured — set DB_HOST/DB_PORT/DB_USER/DB_PASSWORD/DB_NAME in apps/backend/.env before using any DB-backed feature."
    );
    this.name = "DbNotConfiguredError";
  }
}

let pool: Pool | null = null;

/** Lazily creates (once) and returns the shared connection pool. Throws `DbNotConfiguredError` if DB config is missing — never called at module load, so an unconfigured DB never blocks app boot. */
export function getPool(): Pool {
  const db = loadAppConfig().db;
  if (!db) throw new DbNotConfiguredError();

  if (!pool) {
    pool = mysql.createPool({
      host: db.host,
      port: db.port,
      user: db.user,
      password: db.password,
      database: db.database,
      waitForConnections: true,
      connectionLimit: 10,
      timezone: "Z", // this codebase treats every stored timestamp as UTC (see macro_events.scheduled_at_utc's naming)
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
