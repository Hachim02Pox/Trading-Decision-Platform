import express from "express";
import cors from "cors";
import { randomUUID } from "node:crypto";
import type {
  IntelligenceSnapshotResponse,
  KpiInterpretationResponse,
  Language,
  ProviderStatus,
} from "@gold-terminal/contracts";
import { getMarketSnapshot } from "./cache/snapshotCache";
import { initializeIntelligence } from "./intelligence/bootstrap";
import {
  ensureAutoKpiAnalysis,
  peekAutoKpiAnalysis,
  queueCloudKpiAnalyses,
} from "./intelligence/onDemandAnalysis";
import { getCachedGoldOvernightRecap } from "./intelligence/goldOvernightAnalysis";
import { runGuardedGoldOvernightAutoRecap } from "./jobs/goldOvernightAutoRecap";
import { buildIntelligenceSnapshot } from "./intelligence/snapshotResponse";
import { loadAppConfig } from "./config/env";
import { PROVIDER_REGISTRY } from "./providers/registry";
import { buildRealFamilyOverrides } from "./real/buildRealOverrides";
import {
  buildCalendarDayResponse,
  buildCalendarWeekResponse,
} from "./real/f13Calendar";
import { runF13CalendarIngestion } from "./jobs/f13CalendarIngestion";
import { runMonthlyReleasePrefetch } from "./jobs/monthlyReleasePrefetch";
import {
  buildMacroChartResponse,
  isMacroChartInstrumentId,
  isMacroChartRange,
} from "./real/macroChart";
import {
  fetchProxiedSourceHtml,
  fetchProxiedLinkHtml,
} from "./proxy/externalSourceProxy";
import { closePool } from "./db/pool";
import {
  deleteJournalEntry,
  insertJournalEntry,
  listJournalEntries,
  updateJournalEntryNotes,
  type JournalEntryInput,
  type TradeDirection,
} from "./db/journalEntries";
import { getGoldNewsSnapshot, subscribeGoldNews } from "./news/finnhubGoldNews";
import { requireHolder } from "./auth/supabaseAuth";
import { buildExecutionRouter } from "./fundednext";
import { requireIngestSecret } from "./auth/ingestSecret";
import { evidencePrompt, saveBrowserEvidence } from "./sundayRead/service";
import { getPublishedSundayRead } from "./sundayRead/publishedReadStore";
import { runSundayReadDriveIngestion } from "./sundayRead/ingestion/ingest";
import {
  forceRefreshGoldReadFromDrive,
  getCurrentGoldRead,
  getGoldReadByRunId,
  getGoldReadHistory,
} from "./goldMarketState/store";
import { EdgeCheckError, claimForRunner, edgeCheckResponse, failForRunner, getEdgeCheck, getLatestEdgeCheck, renewForRunner, requestEdgeCheck, runnerPayload, submitForRunner } from "./goldEdgeCheck/service";
import { wakeGoldEdgeCheckRunner } from "./goldEdgeCheck/runner";
import { getNextRecap } from "./goldNextRecap/service";

// Milestone 1D — accepts ?lang=EN|FR (default EN); any other/missing value
// falls back to EN rather than erroring, matching fetchKpiInterpretation's
// "never throw for a benign default" style elsewhere in this API.
function parseLanguage(value: unknown): Language {
  return value === "FR" ? "FR" : "EN";
}

function requestLanguage(query: Record<string, unknown>): Language {
  return parseLanguage(query.language ?? query.lang);
}

// Milestone 2A — loadAppConfig() is called ONCE here at boot; every other
// file that needs a port/origin/provider-credential fact reads it from this
// object, never from process.env directly. See apps/backend/src/config/env.ts.
const appConfig = loadAppConfig();

const app = express();

app.use(cors({ origin: appConfig.frontendOrigin }));
app.use(express.json());
// Execution tab — FundedNext account data, owner-only (see fundednext/routes.ts).
app.use("/api/execution", buildExecutionRouter());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

// Sunday Read — production data now comes from Drive ingestion, stored in
// public.sunday_reads and served through getPublishedSundayRead() (DB-first;
// falls back to the local gold-sunday-read/runs/** fixture ONLY when no DB
// is configured at all — see sundayRead/publishedReadStore.ts). All three
// routes below return the exact same FinalRead shape the frontend already
// expects — no payload transformation, so the existing sunday-read page and
// its ScenarioTree component need no changes.
async function respondWithSundayRead(runDate: string | undefined, res: express.Response): Promise<void> {
  try {
    const read = await getPublishedSundayRead(runDate);
    if (!read) {
      res
        .status(404)
        .json({
          error: {
            code: "SUNDAY_READ_NOT_FOUND",
            message: "No Sunday Read exists for this date.",
          },
        });
      return;
    }
    res.json(read);
  } catch (error) {
    console.error(
      `[sunday-read] load failed: ${error instanceof Error ? error.name : "UNKNOWN"}`,
    );
    res
      .status(503)
      .json({
        error: {
          code: "SUNDAY_READ_UNAVAILABLE",
          message: "The Sunday Read is temporarily unavailable.",
        },
      });
  }
}

// Static route registered BEFORE the "/:runDate" wildcard below — Express
// matches route registration order (same reason as the external-proxy
// "/link" route further down this file).
app.get("/api/sunday-read/latest", async (_req, res) => {
  await respondWithSundayRead(undefined, res);
});

app.get("/api/sunday-read/:runDate", async (req, res) => {
  const { runDate } = req.params;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(runDate)) {
    res
      .status(400)
      .json({ error: { code: "INVALID_DATE", message: "runDate must be YYYY-MM-DD." } });
    return;
  }
  await respondWithSundayRead(runDate, res);
});

// Back-compat query-string form the frontend already calls
// (?date=YYYY-MM-DD, or no date for "latest").
app.get("/api/sunday-read", async (req, res) => {
  const date =
    typeof req.query.date === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(req.query.date)
      ? req.query.date
      : undefined;
  await respondWithSundayRead(date, res);
});

// Internal/cron-only trigger — see auth/ingestSecret.ts. Never reachable
// without the X-Internal-Ingest-Secret header; never exposes Google
// credentials or Drive tokens in its response.
app.post("/api/internal/sunday-read/ingest", requireIngestSecret, async (_req, res) => {
  try {
    const summary = await runSundayReadDriveIngestion();
    res.json(summary);
  } catch (error) {
    console.error(
      `[sunday-read-ingest] failed: ${error instanceof Error ? error.name : "UNKNOWN"}`,
    );
    res
      .status(502)
      .json({
        error: {
          code: "SUNDAY_READ_INGEST_FAILED",
          message: "Sunday Read ingestion failed — the previously published run is unaffected.",
        },
      });
  }
});

// Unified Gold market-state API (Sunday Reads V2/V3 + intermediate recaps).
// ADDITIVE to the /api/sunday-read* routes above, which keep working
// unchanged for backward compatibility — see
// apps/backend/src/goldMarketState/store.ts's header comment. Static routes
// registered before the "/:runId" wildcard, same convention as
// /api/sunday-read/latest above.
app.get("/api/gold/next-recap", async (_req, res) => {
  // The service deliberately returns an honest UNAVAILABLE envelope instead
  // of leaking Drive errors or treating cached operational data as fresh.
  res.json(await getNextRecap());
});

app.get("/api/gold/read/current", async (_req, res) => {
  try {
    const { envelope, freshness, cacheAgeSeconds } = await getCurrentGoldRead();
    if (!envelope) {
      res.status(404).json({ error: { code: "GOLD_READ_NOT_FOUND", message: "No Gold market state has been published yet." } });
      return;
    }
    res.json({ run: envelope.run, meta: { ...envelope.meta, freshness, cache_age_seconds: cacheAgeSeconds } });
  } catch (error) {
    console.error(`[gold-read] current failed: ${error instanceof Error ? error.name : "UNKNOWN"}`);
    res.status(503).json({ error: { code: "GOLD_READ_UNAVAILABLE", message: "The Gold market state is temporarily unavailable." } });
  }
});

app.get("/api/gold/read/history", async (_req, res) => {
  try {
    const history = await getGoldReadHistory();
    res.json({ history });
  } catch (error) {
    console.error(`[gold-read] history failed: ${error instanceof Error ? error.name : "UNKNOWN"}`);
    res.status(503).json({ error: { code: "GOLD_READ_UNAVAILABLE", message: "Gold market state history is temporarily unavailable." } });
  }
});

app.get("/api/gold/read/:runId", async (req, res) => {
  try {
    const envelope = await getGoldReadByRunId(req.params.runId);
    if (!envelope) {
      res.status(404).json({ error: { code: "GOLD_READ_NOT_FOUND", message: "No published Gold market state exists for this run id." } });
      return;
    }
    res.json({ run: envelope.run, meta: envelope.meta });
  } catch (error) {
    console.error(`[gold-read] by-id failed: ${error instanceof Error ? error.name : "UNKNOWN"}`);
    res.status(503).json({ error: { code: "GOLD_READ_UNAVAILABLE", message: "The Gold market state is temporarily unavailable." } });
  }
});

// Manual edge-check queue. This route only creates a durable, authenticated
// request; it deliberately does not pretend the Drive refresh workflow is an
// analysis runner. A configured worker must consume QUEUED jobs separately.
app.post("/api/gold/edge-checks", requireHolder, async (req, res) => {
  const idempotencyKey = typeof req.body?.idempotency_key === "string" ? req.body.idempotency_key : "";
  try {
    const result = await requestEdgeCheck(req.holder!.id, idempotencyKey);
    // Deliberately detached: the browser receives QUEUED immediately while the
    // in-process worker claims through Postgres' SKIP LOCKED lease protocol.
    void wakeGoldEdgeCheckRunner().catch((error) => console.error(`[gold-edge-check] wake failed: ${error instanceof Error ? error.name : "UNKNOWN"}`));
    res.status(result.created ? 202 : 200).json({ ...edgeCheckResponse(result.row), idempotent_replay: !result.created });
  } catch (error) {
    if (error instanceof EdgeCheckError) {
      const status = error.code === "GOLD_READ_NOT_FOUND" ? 404 : error.code === "EDGE_CHECK_RATE_LIMITED" ? 429 : error.code === "INVALID_IDEMPOTENCY_KEY" ? 400 : 409;
      res.status(status).json({ error: { code: error.code, message: error.message } });
      return;
    }
    console.error(`[gold-edge-check] create failed: ${error instanceof Error ? error.name : "UNKNOWN"}`);
    res.status(503).json({ error: { code: "EDGE_CHECK_UNAVAILABLE", message: "The edge-check queue is temporarily unavailable." } });
  }
});

app.get("/api/gold/edge-checks/latest", requireHolder, async (req, res) => {
  const baseRunId = typeof req.query.baseRunId === "string" ? req.query.baseRunId : "";
  if (!baseRunId || baseRunId.length > 200) { res.status(400).json({ error: { code: "INVALID_BASE_RUN_ID", message: "baseRunId is required." } }); return; }
  try { const current = await getCurrentGoldRead(); const row = await getLatestEdgeCheck(baseRunId, req.holder!.id); if (!row || current.envelope?.meta.run_id !== row.baseRunId) { res.status(404).json({ error: { code: "EDGE_CHECK_NOT_FOUND", message: "No compatible edge check exists for the current market state." } }); return; } res.json(edgeCheckResponse(row)); }
  catch { res.status(503).json({ error: { code: "EDGE_CHECK_UNAVAILABLE", message: "The edge-check queue is temporarily unavailable." } }); }
});

app.get("/api/gold/edge-checks/:checkId", requireHolder, async (req, res) => {
  const checkId = typeof req.params.checkId === "string" ? req.params.checkId : "";
  if (!/^[0-9a-f-]{36}$/i.test(checkId)) { res.status(400).json({ error: { code: "INVALID_CHECK_ID", message: "checkId is invalid." } }); return; }
  try { const row = await getEdgeCheck(checkId, req.holder!.id); if (!row) { res.status(404).json({ error: { code: "EDGE_CHECK_NOT_FOUND", message: "Edge check not found." } }); return; } res.json(edgeCheckResponse(row)); }
  catch { res.status(503).json({ error: { code: "EDGE_CHECK_UNAVAILABLE", message: "The edge-check queue is temporarily unavailable." } }); }
});

// Authorised analytical runner API.  It deliberately shares the existing
// server-to-server secret and never exposes this context through user routes.
function runnerInput(body: unknown): { workerId: string; leaseSeconds: number } | null {
  const value = body as Record<string, unknown>;
  const workerId = typeof value?.worker_id === "string" ? value.worker_id.trim() : "";
  const leaseSeconds = typeof value?.lease_seconds === "number" ? value.lease_seconds : 300;
  return /^[A-Za-z0-9._:-]{3,128}$/.test(workerId) && Number.isInteger(leaseSeconds) && leaseSeconds >= 30 && leaseSeconds <= 3600 ? { workerId, leaseSeconds } : null;
}
function edgeRunnerError(error: unknown, res: express.Response): void { const code = error instanceof EdgeCheckError ? error.code : "EDGE_CHECK_UNAVAILABLE"; const status = ["EDGE_CHECK_NOT_FOUND"].includes(code) ? 404 : ["ILLEGAL_TRANSITION","CONFLICTING_RESULT","RESULT_LINEAGE_MISMATCH"].includes(code) ? 409 : ["INVALID_RESULT","INVALID_RESULT_CHRONOLOGY","INVALID_FAILURE"].includes(code) ? 400 : 503; res.status(status).json({ error: { code, message: "The edge-check runner request could not be completed." } }); }
app.post("/api/internal/gold/edge-checks/claim", requireIngestSecret, async (req, res) => { const input=runnerInput(req.body); if(!input){res.status(400).json({error:{code:"INVALID_RUNNER_INPUT",message:"Invalid runner input."}});return;} try{const job=await claimForRunner(input.workerId,input.leaseSeconds); if(!job){res.status(204).end();return;}res.json({job:runnerPayload(job),lease_expires_at:job.leaseExpiresAt?.toISOString(),attempt_count:job.attemptCount});}catch(error){edgeRunnerError(error,res);} });
app.post("/api/internal/gold/edge-checks/:checkId/lease", requireIngestSecret, async (req,res)=>{const input=runnerInput(req.body);const checkId=typeof req.params.checkId==="string"?req.params.checkId:"";if(!input){res.status(400).json({error:{code:"INVALID_RUNNER_INPUT",message:"Invalid runner input."}});return;}try{const job=await renewForRunner(checkId,input.workerId,input.leaseSeconds);if(!job)throw new EdgeCheckError("ILLEGAL_TRANSITION","Lease unavailable.");res.json({check_id:job.id,status:job.status,lease_expires_at:job.leaseExpiresAt?.toISOString()});}catch(error){edgeRunnerError(error,res);}});
app.post("/api/internal/gold/edge-checks/:checkId/result", requireIngestSecret, async (req,res)=>{const checkId=typeof req.params.checkId==="string"?req.params.checkId:"";const workerId=typeof req.body?.worker_id==="string"?req.body.worker_id:"";try{const job=await submitForRunner(checkId,workerId,req.body?.result);res.json(edgeCheckResponse(job));}catch(error){edgeRunnerError(error,res);}});
app.post("/api/internal/gold/edge-checks/:checkId/failure", requireIngestSecret, async (req,res)=>{const checkId=typeof req.params.checkId==="string"?req.params.checkId:"";const workerId=typeof req.body?.worker_id==="string"?req.body.worker_id:"";const code=typeof req.body?.code==="string"?req.body.code:"";const message=typeof req.body?.message==="string"?req.body.message:"";try{const job=await failForRunner(checkId,workerId,code,message);res.json(edgeCheckResponse(job));}catch(error){edgeRunnerError(error,res);}});
app.post("/api/internal/gold/edge-checks/wake", requireIngestSecret, async (_req,res)=>{ void wakeGoldEdgeCheckRunner(); res.status(202).json({ status: "WAKING" }); });

// Internal/cron-only trigger, called by .github/workflows/gold-state-refresh.yml
// after runtime/gold-refresh-trigger.json is updated (and by nothing else —
// GET /api/gold/read/current also self-heals on a stale/missing cache, this
// route only makes that refresh immediate). Same auth convention as every
// other internal route — see auth/ingestSecret.ts. Idempotent: re-running it
// for Drive content already ingested is a no-op (content-hash dedup in
// goldMarketState/ingestion/ingest.ts). Never returns Drive credentials or
// full document payloads — only minimal, safe result metadata.
app.post("/internal/gold/refresh", requireIngestSecret, async (req, res) => {
  try {
    const expectedRunId = typeof req.body?.expected_run_id === "string" ? req.body.expected_run_id : null;
    const result = await forceRefreshGoldReadFromDrive();
    if (!result.ok) {
      console.error(`[gold-refresh] drive re-sync failed: ${result.error ?? "unknown"}`);
      res.status(502).json({
        error: { code: "GOLD_REFRESH_FAILED", message: "Drive re-sync failed; the previously published state is unaffected." },
        current: result.current,
      });
      return;
    }
    res.json({
      status: "OK",
      run_id: result.current?.run_id ?? null,
      document_type: result.current?.document_type ?? null,
      run_type: result.current?.run_type ?? null,
      as_of: result.current?.as_of ?? null,
      generated_at: result.current?.generated_at ?? null,
      matched_expected_run_id: expectedRunId ? expectedRunId === result.current?.run_id : null,
      candidates_considered: result.summary?.candidatesConsidered ?? 0,
    });
  } catch (error) {
    console.error(`[gold-refresh] failed: ${error instanceof Error ? error.name : "UNKNOWN"}`);
    res.status(502).json({ error: { code: "GOLD_REFRESH_FAILED", message: "Gold market-state refresh failed." } });
  }
});

app.get("/api/sunday-research/family_1_fed", (req, res) => {
  const date =
    typeof req.query.date === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(req.query.date)
      ? req.query.date
      : null;
  if (!date) {
    res
      .status(400)
      .json({
        error: {
          code: "INVALID_DATE",
          message: "A YYYY-MM-DD date is required.",
        },
      });
    return;
  }
  res.json({
    prompt: evidencePrompt("family_1_fed", date),
    model: "perplexity/sonar-deep-research",
  });
});

app.post("/api/sunday-research/family_1_fed", async (req, res) => {
  const body = req.body as { date?: unknown; content?: unknown; raw?: unknown };
  if (typeof body.date !== "string" || typeof body.content !== "string") {
    res
      .status(400)
      .json({
        error: {
          code: "INVALID_RESEARCH_PAYLOAD",
          message: "date and content are required.",
        },
      });
    return;
  }
  try {
    res
      .status(201)
      .json(await saveBrowserEvidence(body.date, body.content, body.raw));
  } catch (error) {
    res
      .status(422)
      .json({
        error: {
          code: "INVALID_RESEARCH_RESPONSE",
          message:
            error instanceof Error ? error.message : "Could not save research.",
        },
      });
  }
});

app.get("/api/market/snapshot", async (req, res) => {
  const language = requestLanguage(req.query);
  const snapshot = await getMarketSnapshot(language);
  queueCloudKpiAnalyses(snapshot.families, "market-refresh");
  res.json(snapshot);
});

app.get("/api/charts/macro/:instrument", async (req, res) => {
  const instrument = req.params.instrument.toUpperCase();
  const range =
    typeof req.query.range === "string" ? req.query.range.toUpperCase() : "1Y";
  if (!isMacroChartInstrumentId(instrument)) {
    res
      .status(404)
      .json({
        error: {
          code: "UNKNOWN_INSTRUMENT",
          message: "Unknown macro chart instrument.",
        },
      });
    return;
  }
  if (!isMacroChartRange(range)) {
    res
      .status(400)
      .json({
        error: {
          code: "INVALID_RANGE",
          message: "Range must be 1M, 3M, 6M, or 1Y.",
        },
      });
    return;
  }
  res.set("Cache-Control", "private, max-age=60");
  try {
    res.json(await buildMacroChartResponse(instrument, range));
  } catch (error) {
    console.error(
      `[macro-chart] unexpected route failure: ${error instanceof Error ? error.name : "UNKNOWN"}`,
    );
    res.status(503).json({
      error: {
        code: "MACRO_CHART_UNAVAILABLE",
        message: "The macro chart is temporarily unavailable.",
      },
    });
  }
});

// Milestone 2A, section 13 — status only, never triggers a live smoke test.
// Reflects each provider's last-known state; smoke tests run via
// `npm run provider:test -- <id>`, never automatically.
app.get("/api/providers/status", (_req, res) => {
  const statuses: ProviderStatus[] = PROVIDER_REGISTRY.map((provider) =>
    provider.getStatus(),
  );
  res.json(statuses);
});

// Verifies the Supabase session and returns the caller's own identity —
// the simplest possible proof the frontend<->Supabase<->backend chain
// works end to end. Every other holder-scoped route should use the same
// requireHolder middleware.
app.get("/api/auth/me", requireHolder, (req, res) => {
  res.json({ id: req.holder!.id, email: req.holder!.email });
});

app.get("/api/news/gold", async (_req, res) => {
  if (!appConfig.providers.finnhub) {
    res
      .status(503)
      .json({
        error: {
          code: "FINNHUB_NOT_CONFIGURED",
          message: "FINNHUB_API_KEY is not configured.",
        },
      });
    return;
  }
  try {
    res.json({
      source: "Finnhub, GDELT, Tavily",
      items: await getGoldNewsSnapshot(),
    });
  } catch (error) {
    console.error(
      `[gold-news] snapshot route failed: ${error instanceof Error ? error.name : "UNKNOWN"}`,
    );
    res
      .status(503)
      .json({
        error: {
          code: "GOLD_NEWS_UNAVAILABLE",
          message: "Gold news is temporarily unavailable.",
        },
      });
  }
});

app.get("/api/news/gold/stream", (req, res) => {
  if (!appConfig.providers.finnhub) {
    res
      .status(503)
      .json({
        error: {
          code: "FINNHUB_NOT_CONFIGURED",
          message: "FINNHUB_API_KEY is not configured.",
        },
      });
    return;
  }
  res.status(200).set({
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "Content-Type": "text/event-stream",
  });
  res.flushHeaders();
  void getGoldNewsSnapshot();
  const unsubscribe = subscribeGoldNews(res);
  req.on("close", unsubscribe);
});

// F13 Economic Calendar — dedicated routes for the week-strip/day-detail UI
// (apps/frontend's F13CalendarFace), distinct from the lightweight
// nextEvents/activeCatalyst carried on GET /api/market/snapshot's F13
// family entry. Both routes call runF13CalendarIngestion() internally (via
// real/f13Calendar.ts) — safe to hit on every page load: the ingestion job
// is itself guarded against JBlanked's 1-request/day limit via
// ingestion_state, so only the day's first call ever reaches the network.
app.get("/api/calendar/week", async (req, res) => {
  const requested = typeof req.query.start === "string" && /^\d{4}-\d{2}-\d{2}$/.test(req.query.start) ? new Date(`${req.query.start}T12:00:00.000Z`) : new Date();
  const officialOverrides = await buildRealFamilyOverrides();
  res.json(await buildCalendarWeekResponse(officialOverrides, new Date(), requested, requestLanguage(req.query)));
});

// Day-detail view — the frontend's F13CalendarFace now uses ONLY this route
// (one day at a time, with </>-style day-to-day arrows) per the 2026-09-14
// redesign: no more full-week grid in the UI. The /week route above is kept
// for backward compatibility (tests, potential future use) but is no longer
// called from the frontend.
app.get("/api/calendar/day/:date", async (req, res) => {
  const { date } = req.params;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    res
      .status(400)
      .json({ error: `Invalid date "${date}" — expected YYYY-MM-DD.` });
    return;
  }
  const officialOverrides = await buildRealFamilyOverrides();
  res.json(await buildCalendarDayResponse(date, officialOverrides, new Date(), requestLanguage(req.query)));
});

// Internal/cron-only trigger to proactively fetch the upcoming week's
// calendar ahead of time (Friday/Saturday), instead of relying only on the
// lazy first-request-of-the-week trigger inside real/f13Calendar.ts. Reuses
// the SAME shared secret as the Sunday Read ingestion endpoint — both are
// internal, cron-only, server-to-server triggers in this same app, so a
// single secret/header is sufficient trust boundary for both.
app.post("/api/internal/calendar/ingest", requireIngestSecret, async (_req, res) => {
  try {
    const result = await runF13CalendarIngestion();
    res.json(result);
  } catch (error) {
    console.error(
      `[calendar-ingest] failed: ${error instanceof Error ? error.name : "UNKNOWN"}`,
    );
    res
      .status(502)
      .json({ error: { code: "CALENDAR_INGEST_FAILED", message: "Calendar ingestion failed." } });
  }
});

// Internal/cron-only trigger — pinged HOURLY by
// .github/workflows/monthly-release-prefetch.yml. Pre-fetches F4 (CPI/PPI/
// PCE) / F5 (Employment Situation) right after their official BLS/BEA
// release instead of waiting for the next lazy request after these
// families' normal multi-hour TTL — see jobs/monthlyReleasePrefetch.ts for
// the per-release dedup via `ingestion_state` (safe to ping every hour,
// every tick after the first for a given release is a cheap no-op). Reuses
// the SAME shared secret as the other internal routes above.
app.post("/api/internal/monthly-release-prefetch/run", requireIngestSecret, async (_req, res) => {
  try {
    const result = await runMonthlyReleasePrefetch();
    res.json(result);
  } catch (error) {
    console.error(
      `[monthly-release-prefetch] failed: ${error instanceof Error ? error.name : "UNKNOWN"}`,
    );
    res
      .status(502)
      .json({ error: { code: "MONTHLY_RELEASE_PREFETCH_FAILED", message: "Monthly release pre-fetch failed." } });
  }
});

// External-source-modal proxy — see proxy/externalSourceProxy.ts's file
// header for the safety model and why CME's FedWatch tool is never
// reachable through either of these routes.
//
// The literal "/link" route MUST be registered before the "/:key" wildcard
// below — Express matches route registration order, and "/:key" would
// otherwise swallow "/link" as if key === "link".
app.get("/api/external-proxy/link", async (req, res) => {
  const { url } = req.query;
  if (typeof url !== "string") {
    res.status(400).send("Missing url.");
    return;
  }
  const html = await fetchProxiedLinkHtml(url);
  if (html === null) {
    res
      .status(404)
      .send("This link is not available through the in-page viewer.");
    return;
  }
  res.set("Content-Type", "text/html; charset=utf-8");
  res.send(html);
});

app.get("/api/external-proxy/:key", async (req, res) => {
  const { key } = req.params;
  const html = await fetchProxiedSourceHtml(key);
  if (html === null) {
    res
      .status(404)
      .send("This source is not available through the in-page viewer.");
    return;
  }
  res.set("Content-Type", "text/html; charset=utf-8");
  res.send(html);
});

// Trade journal — user-explicit request (2026-09): moved off browser
// localStorage onto real Postgres (Supabase) persistence (see db/journalEntries.ts,
// migrations/002_journal_entries.sql). Every route below requires a signed-in
// holder (requireHolder) and every query is scoped to req.holder.id (see
// migrations/010_journal_entries_holder_id.sql) — this used to be a
// single-user tool with no per-holder scoping at all, which meant every
// account sharing this terminal saw everyone else's trades. A DB failure
// (including "not configured") surfaces as a plain 503 rather than silently
// falling back to any local storage — the whole point of this change was to
// stop the journal being something that vanishes when the browser's storage
// is cleared.
// New entries are LONG/SHORT only (user-explicit request, 2026-09). NO_TRADE
// remains a valid stored value for historical rows created before this
// change — listJournalEntries/toStoredEntry never validates against this
// list, only the creation path does.
const JOURNAL_DIRECTIONS = ["LONG", "SHORT"] as const;
const JOURNAL_SETUP_MAX_LEN = 120;
const JOURNAL_THESIS_MAX_LEN = 1000;
const JOURNAL_INVALIDATION_MAX_LEN = 1000;
const JOURNAL_NOTES_MAX_LEN = 2000;

function parseJournalEntryBody(
  body: unknown,
  holderId: string,
): { entry: JournalEntryInput } | { error: string } {
  if (!body || typeof body !== "object") return { error: "Invalid body." };
  const b = body as Record<string, unknown>;
  if (typeof b.tradedAt !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(b.tradedAt))
    return { error: "tradedAt must be YYYY-MM-DD." };
  if (
    typeof b.direction !== "string" ||
    !(JOURNAL_DIRECTIONS as readonly string[]).includes(b.direction)
  )
    return { error: "Invalid direction." };
  if (
    typeof b.setup !== "string" ||
    b.setup.trim().length === 0 ||
    b.setup.length > JOURNAL_SETUP_MAX_LEN
  )
    return { error: "Invalid setup." };
  if (
    typeof b.thesis !== "string" ||
    b.thesis.trim().length === 0 ||
    b.thesis.length > JOURNAL_THESIS_MAX_LEN
  )
    return { error: "Invalid thesis." };
  if (
    typeof b.invalidation !== "string" ||
    b.invalidation.trim().length === 0 ||
    b.invalidation.length > JOURNAL_INVALIDATION_MAX_LEN
  ) {
    return { error: "Invalid invalidation." };
  }
  if (
    b.outcomeR !== null &&
    (typeof b.outcomeR !== "number" || !Number.isFinite(b.outcomeR))
  )
    return { error: "outcomeR must be a finite number or null." };
  if (typeof b.followedPlan !== "boolean")
    return { error: "followedPlan must be a boolean." };
  if (typeof b.notes !== "string" || b.notes.length > JOURNAL_NOTES_MAX_LEN)
    return { error: "Invalid notes." };

  return {
    entry: {
      id: randomUUID(),
      holderId,
      createdAt: new Date(),
      tradedAt: b.tradedAt,
      instrument: "XAUUSD",
      direction: b.direction as TradeDirection,
      setup: b.setup.trim(),
      thesis: b.thesis.trim(),
      invalidation: b.invalidation.trim(),
      outcomeR: b.outcomeR as number | null,
      followedPlan: b.followedPlan,
      notes: b.notes.trim(),
    },
  };
}

app.get("/api/journal", requireHolder, async (req, res) => {
  try {
    res.json({ entries: await listJournalEntries(req.holder!.id) });
  } catch (err) {
    res
      .status(503)
      .json({
        error: err instanceof Error ? err.message : "Database unavailable.",
      });
  }
});

app.post("/api/journal", requireHolder, async (req, res) => {
  const parsed = parseJournalEntryBody(req.body, req.holder!.id);
  if ("error" in parsed) {
    res.status(400).json({ error: parsed.error });
    return;
  }
  try {
    await insertJournalEntry(parsed.entry);
    const { holderId: _holderId, ...entry } = parsed.entry;
    res.status(201).json({ entry });
  } catch (err) {
    res
      .status(503)
      .json({
        error: err instanceof Error ? err.message : "Database unavailable.",
      });
  }
});

app.delete("/api/journal/:id", requireHolder, async (req, res) => {
  const entryId = typeof req.params.id === "string" ? req.params.id : "";
  if (!entryId) { res.status(400).json({ error: "Invalid journal entry id." }); return; }
  try {
    const deleted = await deleteJournalEntry(entryId, req.holder!.id);
    if (!deleted) {
      res.status(404).json({ error: "Journal entry not found." });
      return;
    }
    res.status(204).send();
  } catch (err) {
    res
      .status(503)
      .json({
        error: err instanceof Error ? err.message : "Database unavailable.",
      });
  }
});

// Review note — a post-trade debrief added after the entry already exists,
// not required at creation. Only touches `notes`; every other field is
// immutable once logged.
app.patch("/api/journal/:id", requireHolder, async (req, res) => {
  const entryId = typeof req.params.id === "string" ? req.params.id : "";
  if (!entryId) { res.status(400).json({ error: "Invalid journal entry id." }); return; }
  const body = req.body as Record<string, unknown> | undefined;
  const notes = body?.notes;
  if (typeof notes !== "string" || notes.length > JOURNAL_NOTES_MAX_LEN) {
    res.status(400).json({ error: "Invalid notes." });
    return;
  }
  try {
    const updated = await updateJournalEntryNotes(entryId, notes.trim(), req.holder!.id);
    if (!updated) {
      res.status(404).json({ error: "Journal entry not found." });
      return;
    }
    res.json({ entry: updated });
  } catch (err) {
    res
      .status(503)
      .json({
        error: err instanceof Error ? err.message : "Database unavailable.",
      });
  }
});

const PORT = appConfig.port;

async function main() {
  // Milestone 1C — KPI Intelligence. Boot-time snapshot families are stable
  // (values are fixed at process boot per snapshotCache.ts); intelligence
  // is built against that same family list.
  const bootSnapshot = await getMarketSnapshot();
  const intelligence = await initializeIntelligence(bootSnapshot.families);

  app.get("/api/intelligence/meta", (_req, res) => {
    res.json({
      dataMode: intelligence.dataMode,
      sessionId: intelligence.sessionId,
      generatedAt: intelligence.generatedAt,
    });
  });

  // Milestone 1E, section 6 — batch cockpit intelligence fetch. Returns every
  // currently-available cockpit-visible KPI's interpretation for the
  // requested language, WITHOUT resolved evidence (kept light on purpose —
  // evidence stays resolved only via /api/intelligence/kpi/:kpiId below, for
  // lazy/deep/event KPI fetches and for resolving a cockpit KPI's full
  // evidence when its drawer is opened).
  app.get("/api/intelligence/snapshot", async (req, res) => {
    const language = requestLanguage(req.query);
    const currentSnapshot = await getMarketSnapshot(language);
    const response: IntelligenceSnapshotResponse =
      await buildIntelligenceSnapshot({
        families: currentSnapshot.families,
        language,
        dataMode: intelligence.dataMode,
        sessionId: intelligence.sessionId,
        getInterpretation: intelligence.getInterpretation,
      });
    res.json(response);
  });

  app.get("/api/intelligence/kpi/:kpiId", async (req, res) => {
    const { kpiId } = req.params;
    const language = requestLanguage(req.query);
    const currentSnapshot = await getMarketSnapshot();

    if (!intelligence.kpiExists(kpiId, currentSnapshot.families)) {
      res.status(404).json({ error: `Unknown kpiId "${kpiId}".` });
      return;
    }

    const interpretation = await intelligence.getInterpretation(
      kpiId,
      language,
    );
    if (!interpretation) {
      res
        .status(404)
        .json({
          error: `No intelligence interpretation available for kpiId "${kpiId}".`,
        });
      return;
    }

    const response: KpiInterpretationResponse = {
      interpretation,
      evidence: intelligence.resolveEvidence(interpretation),
    };
    res.json(response);
  });

  // Automatic per-KPI/per-family AI analysis (2026-09, replaces the old
  // manual "Analyze with AI" button entirely — see
  // apps/backend/src/intelligence/onDemandAnalysis.ts's file header for the
  // full state machine). Two routes:
  //   - GET .../peek: pure read-only, NEVER triggers anything — used by the
  //     resting mosaic badge so simply rendering the grid can never cause a
  //     real CLI call.
  //   - GET .../on-demand: the "ensure fresh" endpoint a KPI/family's drawer
  //     calls on open and then polls while PENDING. Automatically starts a
  //     background analysis when the underlying data has changed since the
  //     last one; never blocks this response on that background work.
  app.get("/api/intelligence/kpi/:kpiId/peek", (req, res) => {
    const { kpiId } = req.params;
    const language = requestLanguage(req.query);
    res.json(peekAutoKpiAnalysis(kpiId, language));
  });

  app.get("/api/intelligence/kpi/:kpiId/on-demand", async (req, res) => {
    const { kpiId } = req.params;
    const language = requestLanguage(req.query);
    const currentSnapshot = await getMarketSnapshot();

    if (!intelligence.kpiExists(kpiId, currentSnapshot.families)) {
      res.status(404).json({ error: `Unknown kpiId "${kpiId}".` });
      return;
    }

    const response = await ensureAutoKpiAnalysis(kpiId, language, {
      allFamilies: currentSnapshot.families,
      sessionId: intelligence.sessionId,
    });
    res.json(response);
  });

  // Overnight Gold Recap — EN/FR web-research-only briefing on Gold's own
  // recent price action. Pure AI-generated commentary, never treated as
  // canonical Gold data (F1 stays permanently removed). Read-only route —
  // no manual trigger (2026-09-15 decision: automation-only, see the
  // internal auto-run route below).
  app.get("/api/intelligence/gold-overnight/on-demand", async (req, res) => {
    const language = requestLanguage(req.query);
    res.json(await getCachedGoldOvernightRecap(language));
  });

  // Internal/cron-only trigger — pinged HOURLY by
  // .github/workflows/night-recap.yml; jobs/goldOvernightAutoRecap.ts's own
  // once-a-day/target-hour gate decides whether a given ping actually runs.
  // Reuses the SAME shared secret as the other internal ingestion routes
  // above (see auth/ingestSecret.ts).
  app.post("/api/internal/gold-overnight/auto-run", requireIngestSecret, async (_req, res) => {
    try {
      const result = await runGuardedGoldOvernightAutoRecap({ sessionId: intelligence.sessionId });
      res.json(result);
    } catch (error) {
      console.error(
        `[gold-overnight-auto-run] failed: ${error instanceof Error ? error.name : "UNKNOWN"}`,
      );
      res
        .status(502)
        .json({ error: { code: "GOLD_OVERNIGHT_AUTO_RUN_FAILED", message: "Night Recap auto-run failed." } });
    }
  });

  const server = app.listen(PORT, () => {
    console.log(
      `[gold-terminal-backend] listening on http://localhost:${PORT}`,
    );
    console.log(
      `[gold-terminal-backend] intelligence session=${intelligence.sessionId} dataMode=${intelligence.dataMode} ` +
        `cockpitKpis=${intelligence.cockpitKpiIds.length}`,
    );
  });
  // Light startup recovery for durable QUEUED and expired-lease work. The
  // single-flight guard prevents duplicate loops in this Railway process.
  void wakeGoldEdgeCheckRunner().catch((error) => console.error(`[gold-edge-check] startup recovery failed: ${error instanceof Error ? error.name : "UNKNOWN"}`));

  // Node's http.Server defaults to a 5-minute requestTimeout (since Node 18)
  // and a 60s headersTimeout — both disabled since this is a single-user
  // local tool; every route completes in well under a second regardless.
  server.requestTimeout = 0;
  server.headersTimeout = 0;

  let shuttingDown = false;
  const shutdown = (signal: string) => {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log(
      `[gold-terminal-backend] ${signal} received — closing HTTP server and DB pool.`,
    );
    server.close(async () => {
      try {
        await closePool();
        process.exit(0);
      } catch (err) {
        console.error(
          "[gold-terminal-backend] failed to close DB pool cleanly:",
          err,
        );
        process.exit(1);
      }
    });
  };
  process.once("SIGINT", () => shutdown("SIGINT"));
  process.once("SIGTERM", () => shutdown("SIGTERM"));
}

main().catch((err) => {
  console.error("[gold-terminal-backend] fatal startup error:", err);
  process.exit(1);
});
