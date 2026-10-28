import assert from "node:assert/strict";
import test from "node:test";
import { loadAppConfig } from "../apps/backend/src/config/env";
import { closePool, getPool } from "../apps/backend/src/db/pool";

// Explicit opt-in: ordinary tests never require a live production migration.
test("browser database roles cannot bypass backend authorization", {
  skip: process.env.SECURITY_DB_TEST !== "1" || !loadAppConfig().db,
}, async () => {
  const tables = [
    "macro_events", "kpi_observations", "ingestion_state", "journal_entries",
    "sunday_reads", "gold_overnight_recaps", "kpi_latest_values",
    "gold_market_states", "gold_edge_checks", "execution_trade_annotations",
    "schema_migrations",
  ];
  try {
    const result = await getPool().query<{
      name: string; rls: boolean; role: string; readable: boolean;
      insertable: boolean; updatable: boolean; deletable: boolean;
    }>(`
      select c.relname as name, c.relrowsecurity as rls, r.role,
        has_table_privilege(r.role, c.oid, 'SELECT') as readable,
        has_table_privilege(r.role, c.oid, 'INSERT') as insertable,
        has_table_privilege(r.role, c.oid, 'UPDATE') as updatable,
        has_table_privilege(r.role, c.oid, 'DELETE') as deletable
      from pg_class c join pg_namespace n on n.oid = c.relnamespace
      cross join (values ('anon'), ('authenticated')) as r(role)
      where n.nspname = 'public' and c.relname = any($1::text[])
    `, [tables]);
    assert.equal(result.rows.length, tables.length * 2, "all protected tables must exist");
    for (const row of result.rows) {
      assert.equal(row.rls, true, `${row.name}: RLS must be enabled`);
      for (const permission of ["readable", "insertable", "updatable", "deletable"] as const) {
        assert.equal(row[permission], false, `${row.role} ${row.name}: ${permission}`);
      }
    }
  } finally {
    await closePool();
  }
});
