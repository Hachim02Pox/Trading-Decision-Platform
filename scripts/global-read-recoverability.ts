import { fetchYahooChart } from "../apps/backend/src/providers/yahooFinance";
import { fetchLatestObservations } from "../apps/backend/src/providers/fred";
import { getPool, closePool } from "../apps/backend/src/db/pool";

async function main() {
  const probes = [
    ...["GC=F", "DX-Y.NYB", "^VIX", "^GVZ", "^MOVE"].map((symbol) => ({
      name: `${symbol} 5d/1m`,
      run: async () => {
        const r = await fetchYahooChart(symbol, "5d", "1m");
        return { symbol: r.meta.symbol, name: r.meta.longName ?? r.meta.shortName,
          rows: r.history.length, first: r.history[0]?.timestampSec, last: r.history.at(-1)?.timestampSec };
      },
    })),
    ...["DGS2", "DGS10", "DFII10", "GVZCLS", "VIXCLS", "BAMLH0A0HYM2"].map((series) => ({
      name: series,
      run: async () => {
        const r = await fetchLatestObservations(series, 30);
        return { rows: r.length, first: r.at(-1)?.date, last: r[0]?.date, vintage: r[0]?.realtimeStart };
      },
    })),
  ];
  // Read-only probes: no LLM, no persistence, no credential output.
  for (let i = 0; i < probes.length; i += 3) {
    await Promise.all(probes.slice(i, i + 3).map(async (p) => {
      const started = performance.now();
      try { console.log(JSON.stringify({ probe: p.name, ...(await p.run()), ms: Math.round(performance.now() - started) })); }
      catch (error) { console.log(JSON.stringify({ probe: p.name, error: error instanceof Error ? error.name : "FAILED", ms: Math.round(performance.now() - started) })); }
    }));
  }
  try {
    const result = await getPool().query(
      "select kpi_id, count(*) as rows_count, min(observation_at) as first_observation, max(observation_at) as last_observation from public.kpi_observations group by kpi_id"
    );
    console.log(JSON.stringify({ localHistory: result.rows }));
  } catch (error) { console.log(JSON.stringify({ localHistoryError: error instanceof Error ? error.name : "FAILED" })); }
  finally { await closePool(); }
}
void main();
