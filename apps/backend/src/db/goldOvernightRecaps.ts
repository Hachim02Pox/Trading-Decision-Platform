import type { Pool } from "pg";
import type { GoldOvernightRecap, Language } from "@gold-terminal/contracts";
import { getPool } from "./pool";

// Durable "latest recap per language" store — see migrations/006's doc
// comment. One row per language, always upserted (never a history).

interface RecapRow {
  language: string;
  recap: GoldOvernightRecap;
}

export async function saveGoldOvernightRecapToDb(
  language: Language,
  recap: GoldOvernightRecap,
  pool: Pool = getPool()
): Promise<void> {
  await pool.query(
    `insert into public.gold_overnight_recaps (language, recap, updated_at)
     values ($1, $2::jsonb, now())
     on conflict (language) do update set recap = excluded.recap, updated_at = excluded.updated_at`,
    [language, JSON.stringify(recap)]
  );
}

export async function loadGoldOvernightRecapFromDb(
  language: Language,
  pool: Pool = getPool()
): Promise<GoldOvernightRecap | null> {
  const result = await pool.query<RecapRow>(
    "select language, recap from public.gold_overnight_recaps where language = $1",
    [language]
  );
  return result.rows[0]?.recap ?? null;
}
