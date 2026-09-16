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
import {
  getCachedGlobalRead,
  runGlobalReadAnalysis,
} from "./intelligence/globalReadAnalysis";
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
import { requireIngestSecret } from "./auth/ingestSecret";
import { evidencePrompt, saveBrowserEvidence } from "./sundayRead/service";
import { getPublishedSundayRead } from "./sundayRead/publishedReadStore";
import { runSundayReadDriveIngestion } from "./sundayRead/ingestion/ingest";

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
// migrations/002_journal_entries.sql). Single-user tool: no auth, no
// per-user scoping — every row belongs to the one trader using this
// terminal. A DB failure (including "not configured") surfaces as a plain
// 503 rather than silently falling back to any local storage — the whole
// point of this change was to stop the journal being something that
// vanishes when the browser's storage is cleared.
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

app.get("/api/journal", async (_req, res) => {
  try {
    res.json({ entries: await listJournalEntries() });
  } catch (err) {
    res
      .status(503)
      .json({
        error: err instanceof Error ? err.message : "Database unavailable.",
      });
  }
});

app.post("/api/journal", async (req, res) => {
  const parsed = parseJournalEntryBody(req.body);
  if ("error" in parsed) {
    res.status(400).json({ error: parsed.error });
    return;
  }
  try {
    await insertJournalEntry(parsed.entry);
    res.status(201).json({ entry: parsed.entry });
  } catch (err) {
    res
      .status(503)
      .json({
        error: err instanceof Error ? err.message : "Database unavailable.",
      });
  }
});

app.delete("/api/journal/:id", async (req, res) => {
  try {
    const deleted = await deleteJournalEntry(req.params.id);
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
app.patch("/api/journal/:id", async (req, res) => {
  const body = req.body as Record<string, unknown> | undefined;
  const notes = body?.notes;
  if (typeof notes !== "string" || notes.length > JOURNAL_NOTES_MAX_LEN) {
    res.status(400).json({ error: "Invalid notes." });
    return;
  }
  try {
    const updated = await updateJournalEntryNotes(req.params.id, notes.trim());
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

  // Global Read — the cross-family, 12-step-methodology button. Read-only
  // cache check (safe on page load) + the actual manual-click-ONLY trigger,
  // same two-route pattern as the per-KPI button above. This is by far the
  // heaviest real-provider call in the app (multiple minutes) — see
  // globalReadAnalysis.ts's file header for why it is CLI-only, never
  // metered.
  app.get("/api/intelligence/global-read/on-demand", (req, res) => {
    const language = requestLanguage(req.query);
    res.json(getCachedGlobalRead(language));
  });

  app.post("/api/intelligence/global-read/analyze", async (req, res) => {
    const language = requestLanguage(req.query);
    const currentSnapshot = await getMarketSnapshot();
    const response = await runGlobalReadAnalysis(language, {
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

  // Node's http.Server defaults to a 5-minute requestTimeout (since Node 18)
  // and a 60s headersTimeout — both far too short for Global Read's up to
  // 15-minute real CLI analysis (see globalReadAnalysis.ts). This is a
  // single-user local tool, so disabling both server-side is safe; every
  // other route completes in well under a second regardless.
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
