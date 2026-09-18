import { getPool, closePool } from "../apps/backend/src/db/pool";

async function main() {
  const result = await getPool().query(
    "select id, run_date, status, error_code, error_message, content_hash from public.sunday_reads where run_date = '2026-09-13' order by created_at desc"
  );
  console.log(JSON.stringify(result.rows, null, 2));
}

main()
  .then(() => closePool())
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    return closePool().finally(() => process.exit(1));
  });
