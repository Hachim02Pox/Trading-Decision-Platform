import { closePool, getPool } from "../apps/backend/src/db/pool";

const pool = getPool();
const counts = async () => (await pool.query(`
  select 'gold_edge_checks' as table_name, count(*)::int as count from public.gold_edge_checks
  union all select 'gold_market_states', count(*)::int from public.gold_market_states
  union all select 'sunday_reads', count(*)::int from public.sunday_reads
  union all select 'holders', count(*)::int from public.holders
`)).rows;

async function main() {
try {
  console.log(JSON.stringify({ before: await counts() }));
  await pool.query("BEGIN");
  await pool.query("DELETE FROM public.gold_edge_checks");
  await pool.query("DELETE FROM public.gold_market_states");
  await pool.query("DELETE FROM public.sunday_reads");
  await pool.query("COMMIT");
  console.log(JSON.stringify({ after: await counts() }));
} catch (error) {
  await pool.query("ROLLBACK").catch(() => undefined);
  throw error;
} finally {
  await closePool();
}
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
