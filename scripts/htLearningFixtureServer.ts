/** Local browser verification only. Never writes Drive, a database or market data. */
import { createServer } from "node:http";
import { readFileSync } from "node:fs";
import { projectPublicGoldEditorialV6, type GoldEditorialV6 } from "../apps/backend/src/goldMarketState/v6";

const rich = ["sunday", "intermediate"].map(kind => JSON.parse(readFileSync(
  new URL(`../tests/fixtures/learning/FIXTURE_learning_${kind}.json`, import.meta.url), "utf8"
)) as GoldEditorialV6);
const { learning_experience: _extension, ...canonical } = rich[0];
const archive = { ...canonical, meta: { ...canonical.meta, run_id: "FIXTURE-archive-without-learning" } } as GoldEditorialV6;
const unknown = { ...rich[0], meta: { ...rich[0].meta, run_id: "FIXTURE-unknown-learning-version" }, learning_experience: { version: "99.0" } } as unknown as GoldEditorialV6;
const runs = [...rich, archive, unknown];
const envelope = (state: GoldEditorialV6) => ({ run: projectPublicGoldEditorialV6(state), meta: {
  run_id: state.meta.run_id, run_type: state.meta.run_type, document_type: state.document_type,
  generated_at: state.meta.generated_at, as_of: state.meta.evidence_cutoff_end,
  parent_run_id: state.meta.parent_run_id, origin_sunday_run_id: state.meta.origin_sunday_run_id,
  presentation_complete: true, missing_presentation_sections: [], freshness: "CACHED",
} });
const port = Number(process.env.HT_FIXTURE_PORT ?? "4102");
createServer((req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "http://localhost:3100");
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  const path = new URL(req.url ?? "/", `http://localhost:${port}`).pathname;
  if (path === "/api/gold/read/history") {
    res.end(JSON.stringify({ history: rich.map(state => ({ ...envelope(state).meta, is_current: state === rich[1] })).reverse() }));
  } else if (path === "/api/gold/read/current") {
    res.end(JSON.stringify(envelope(rich[1])));
  } else if (path.startsWith("/api/gold/read/")) {
    const state = runs.find(item => item.meta.run_id === decodeURIComponent(path.slice("/api/gold/read/".length)));
    res.statusCode = state ? 200 : 404;
    res.end(JSON.stringify(state ? envelope(state) : { error: "FIXTURE_NOT_FOUND" }));
  } else if (path === "/api/gold/next-recap") {
    res.end(JSON.stringify({ status: "CLOSED", requested_at: null, timezone: "America/New_York", parent_state_run_id: rich[1].meta.run_id, retrieved_at: new Date().toISOString() }));
  } else {
    res.statusCode = 404;
    res.end(JSON.stringify({ error: "LOCAL_FIXTURE_ONLY" }));
  }
}).listen(port, "127.0.0.1", () => console.log(`FIXTURE API http://127.0.0.1:${port}; no production storage`));
