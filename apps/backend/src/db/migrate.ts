import fs from "node:fs";
import path from "node:path";
import mysql from "mysql2/promise";
import { loadAppConfig } from "../config/env";

// Foundation pass — a deliberately minimal migration runner (no framework
// dependency, per "PAS d'ORM lourd si inutile"): read every *.sql file in
// ./migrations in filename order, skip any already recorded in
// `schema_migrations`, run + record the rest. Invoked via `npm run
// db:migrate` (root package.json).

const MIGRATIONS_DIR = path.join(__dirname, "migrations");

interface AppliedMigrationRow {
  filename: string;
}

async function run(): Promise<void> {
  const db = loadAppConfig().db;
  if (!db) {
    console.error(
      "[db:migrate] Database is not configured — set DB_HOST/DB_PORT/DB_USER/DB_PASSWORD/DB_NAME in apps/backend/.env, then re-run `npm run db:migrate`."
    );
    process.exitCode = 1;
    return;
  }

  const connection = await mysql.createConnection({
    host: db.host,
    port: db.port,
    user: db.user,
    password: db.password,
    database: db.database,
    multipleStatements: true, // each migration file may contain several CREATE TABLE statements
  });

  try {
    // Bootstrap: schema_migrations must exist before we can query it, even
    // before 001_init.sql (which also creates it, defensively) has run.
    await connection.query(
      `CREATE TABLE IF NOT EXISTS schema_migrations (
        filename VARCHAR(255) NOT NULL,
        applied_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (filename)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`
    );

    const [appliedRows] = await connection.query("SELECT filename FROM schema_migrations");
    const applied = new Set((appliedRows as AppliedMigrationRow[]).map((r) => r.filename));

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
      await connection.query(sql);
      await connection.query("INSERT INTO schema_migrations (filename) VALUES (?)", [file]);
      console.log(`[db:migrate] applied: ${file}`);
      appliedCount++;
    }

    console.log(`[db:migrate] done — ${appliedCount} new migration(s) applied, ${files.length - appliedCount} already up to date.`);
  } finally {
    await connection.end();
  }
}

run().catch((err) => {
  console.error("[db:migrate] fatal error:", err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
