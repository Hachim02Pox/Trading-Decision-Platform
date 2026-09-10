import fs from "node:fs";
import path from "node:path";
import { Client } from "pg";
import { loadAppConfig } from "../config/env";
import { SUPABASE_ROOT_CA_2021 } from "./supabaseRootCa";

// Deliberately minimal migration runner (no framework dependency, per "PAS
// d'ORM lourd si inutile"): read every *.sql file in ./migrations in
// filename order, skip any already recorded in `schema_migrations`, run +
// record the rest. Invoked via `npm run db:migrate` (root package.json).
// 2026-09-09 — ported from mysql2 to `pg` when this project's DB moved off
// local MySQL onto Supabase Postgres; same runner shape, same convention.

const MIGRATIONS_DIR = path.join(__dirname, "migrations");

interface AppliedMigrationRow {
  filename: string;
}

async function run(): Promise<void> {
  const db = loadAppConfig().db;
  if (!db) {
    console.error(
      "[db:migrate] Database is not configured — set SUPABASE_API_URL and SUPABASE_DB_PASSWORD in apps/backend/.env, then re-run `npm run db:migrate`."
    );
    process.exitCode = 1;
    return;
  }

  const client = new Client({
    host: db.host,
    port: db.port,
    user: db.user,
    password: db.password,
    database: db.database,
    ssl: { rejectUnauthorized: true, ca: SUPABASE_ROOT_CA_2021 }, // see db/pool.ts's getPool() doc comment
  });
  await client.connect();

  try {
    // Bootstrap: schema_migrations must exist before we can query it, even
    // before 002_market_data.sql (the first real migration in this
    // Postgres-era numbering) has run.
    await client.query(
      `create table if not exists public.schema_migrations (
        filename varchar(255) primary key,
        applied_at timestamptz not null default now()
      )`
    );

    const appliedResult = await client.query<AppliedMigrationRow>("select filename from public.schema_migrations");
    const applied = new Set(appliedResult.rows.map((r) => r.filename));

    const files = fs
      .readdirSync(MIGRATIONS_DIR)
      .filter((f) => f.endsWith(".sql"))
      .sort();

    if (files.length === 0) {
      console.log("[db:migrate] no migration files found in", MIGRATIONS_DIR);
      return;
    }

    let appliedCount = 0;
    for (const file of files) {
      if (applied.has(file)) {
        console.log(`[db:migrate] already applied, skipping: ${file}`);
        continue;
      }

      const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), "utf8");
      console.log(`[db:migrate] applying: ${file}`);
      await client.query(sql);
      await client.query("insert into public.schema_migrations (filename) values ($1)", [file]);
      console.log(`[db:migrate] applied: ${file}`);
      appliedCount++;
    }

    console.log(`[db:migrate] done — ${appliedCount} new migration(s) applied, ${files.length - appliedCount} already up to date.`);
  } finally {
    await client.end();
  }
}

run().catch((err) => {
  console.error("[db:migrate] fatal error:", err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
