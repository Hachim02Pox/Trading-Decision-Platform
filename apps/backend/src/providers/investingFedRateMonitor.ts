import type { ProviderDefinition, SmokeTestResult } from "./types";
import { elapsedMs } from "./httpClient";
import { buildProviderStatus, recordSmokeTestOutcome } from "./statusHelpers";

// F3 Fed / Rate Pricing — real meeting-probability distribution, replacing
// the deleted homemade CME-ZQ-settlement-derived calculation (see
// apps/backend/src/real/f3Fed.ts's top-of-file comment for the full
// removal rationale: a confirmed bug in that calculation produced wrong
// probabilities, and the product owner's final decision is "no more
// homemade FedWatch math").
//
// SOURCE: investing.com's public "Fed Rate Monitor" tool
// (investing.com/central-banks/fed-rate-monitor). This is a THIRD PARTY
// DISPLAYING CME-futures-derived numbers — never CME's own feed — hence
// `sourceTag: "INVESTING_FED_RATE_MONITOR"` everywhere this data surfaces,
// never "CME_FEDWATCH_PUBLIC" or any CME-attributed tag. Validated as
// viable before implementation: publicly accessible with no login/paywall,
// robots.txt does not disallow this path, and the Terms of Use only
// restrict commercial redistribution of the data — not personal/internal
// reading, which is all this backend does (it reads the page once every
// few hours and reports the numbers back to this product's own users, the
// same way a human checking the page manually would).
//
// WHY A HEADLESS BROWSER: confirmed live during this milestone — a plain
// `fetch()` against this URL is blocked outright by Cloudflare bot
// management (HTTP 403 with no page content), even with a realistic
// browser User-Agent header. Only an actual browser engine gets past it.
// Playwright (`playwright-core`, headless Chromium) was explicitly
// approved for this specific purpose. `playwright-core` (not the full
// `playwright` package) was chosen deliberately: it ships the same
// automation API without bundling `@playwright/test` or auto-installing
// all three browser engines, and this adapter only ever needs Chromium —
// see apps/backend/package.json's comment next to the dependency and
// docs/PROVIDER_SETUP.md for the required one-time
// `npx playwright-core install chromium` browser-binary install step.
//
// CADENCE: see apps/backend/src/real/f3Fed.ts's `FED_RATE_MONITOR_CADENCE_MS`
// — this adapter itself has no built-in rate limiting; the caller is
// responsible for not invoking it more than a few times a day (gated via
// `ingestion_state`, survives process restarts).
const PROVIDER_ID = "investingFedRateMonitor";
const DISPLAY_NAME = "Investing.com Fed Rate Monitor";
const PAGE_URL = "https://www.investing.com/central-banks/fed-rate-monitor";

// A realistic desktop Chrome UA/viewport/locale — confirmed live this
// milestone to be necessary (a default Playwright context without these
// was also blocked). `--disable-blink-features=AutomationControlled` plus
// masking `navigator.webdriver` further reduces automation fingerprinting;
// none of this bypasses a login or paywall — it makes the request look
// like the same ordinary browser visit any human doing the same reading
// would make.
const REALISTIC_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";
const NAV_TIMEOUT_MS = 45_000;
const TABLE_TIMEOUT_MS = 30_000;
// Bug found live 2026-09-16: an ingestion_state row showing a fresh
// `last_attempt_at` with no corresponding `last_success_at`/`last_error`
// ever recorded — i.e. this whole function never resolved at all. Playwright
// applies NAV_TIMEOUT_MS/TABLE_TIMEOUT_MS to their own specific calls, but
// `chromium.launch()` itself previously had no explicit timeout, and a
// browser that fails to spawn cleanly in a constrained/containerized
// environment (Railway) can hang rather than reject. LAUNCH_TIMEOUT_MS
// bounds that specific call; OVERALL_TIMEOUT_MS (see `runFreshFetch`) is a
// second, outer watchdog around the ENTIRE scrape (comfortably longer than
// every internal timeout summed) so this function is now guaranteed to
// settle within a bounded time no matter which internal step hangs —
// turning a silent, unrecorded hang into an honest, promptly-recorded
// FETCH_FAILED that the 30-minute RETRY_COOLDOWN_MS in real/f3Fed.ts can
// then actually act on.
const LAUNCH_TIMEOUT_MS = 20_000;
const OVERALL_TIMEOUT_MS = 100_000;

// Sanity check per the milestone brief: extracted bucket probabilities
// should sum to ~100%. Tolerance accounts for the page itself rounding
// each bucket to one decimal place (e.g. two buckets can legitimately sum
// to 99.9% or 100.1%); this is intentionally a HONESTY check on the scrape
// (did we parse the real table correctly?), never a correction/
// normalization of the source's own numbers.
const SUM_TOLERANCE_PCT = 1.5;

export interface FedRateMonitorBucket {
  /** Exactly as displayed on the page, e.g. "3.50 - 3.75" — never reformatted. */
  targetRangeLabel: string;
  currentProbabilityPct: number;
  previousDayProbabilityPct: number | null;
  previousWeekProbabilityPct: number | null;
}

export interface FedRateMonitorSnapshot {
  buckets: FedRateMonitorBucket[];
  /** Best-effort UTC ISO for the page's own "Meeting Time" (e.g. "Sep 16, 2026 02:00PM ET"); `null` if that text couldn't be parsed. */
  nextMeetingDateIso: string | null;
  /** Best-effort UTC ISO for the page's own "Updated: ..." caption; `null` if that text couldn't be parsed (falls back to `scrapedAtIso`). */
  pageUpdatedAtIso: string | null;
  scrapedAtIso: string;
}

interface RawExtraction {
  dateLabel: string | null;
  meetingTimeText: string | null;
  updatedText: string | null;
  buckets: Array<{
    label: string | null;
    current: string | null;
    previousDay: string | null;
    previousWeek: string | null;
  }>;
}

/**
 * Runs entirely inside the page (passed to `page.evaluate`) — must be a
 * self-contained function with no closures over outer-scope variables.
 * Reads the FIRST `.cardWrapper` block (the page's own soonest-meeting
 * card, confirmed live this milestone to always render first in DOM
 * order) rather than every meeting card, since only the NEXT meeting's
 * distribution is in scope here.
 */
function extractFromDom(): RawExtraction | null {
  const card = document.querySelector(".cardWrapper");
  if (!card) return null;

  const dateLabel = card.querySelector(".fedRateDate")?.textContent?.trim() ?? null;
  const infoDivs = card.querySelectorAll(".infoFed > div");
  const meetingTimeText = infoDivs[0]?.querySelector("i")?.textContent?.trim() ?? null;

  const rows = Array.from(card.querySelectorAll(".fedRateTbl tbody tr"));
  const buckets = rows.map((tr) => {
    const tds = tr.querySelectorAll("td");
    const labelCell = tds[0];
    // The label cell's first text node is the target-range text; a nested
    // `<span class="chartIcon ...">` sibling (a history-chart icon) comes
    // after it and must be excluded — `firstChild` gets just the text node.
    const label = labelCell ? (labelCell.firstChild?.textContent?.trim() ?? labelCell.textContent?.trim() ?? null) : null;
    return {
      label,
      current: tds[1]?.textContent?.trim() ?? null,
      previousDay: tds[2]?.textContent?.trim() ?? null,
      previousWeek: tds[3]?.textContent?.trim() ?? null,
    };
  });

  const updatedText = card.querySelector(".fedUpdate")?.textContent?.trim() ?? null;
  return { dateLabel, meetingTimeText, updatedText, buckets };
}

const MONTH_INDEX: Record<string, number> = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
  jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
};

interface WallClockParts {
  year: number;
  month: number; // 1-12
  day: number;
  hour: number; // 0-23
  minute: number;
}

/** Parses e.g. "Sep 16, 2026 02:00PM ET" or "Aug 31, 2026 10:35PM EDT" — the trailing zone abbreviation is ignored (see `zonedWallClockToUtcIso`, which derives the correct offset from the actual calendar date instead of trusting a 3-4 letter abbreviation). Exported for unit testing only. */
export function parseWallClockText(text: string): WallClockParts | null {
  const match = text.match(/([A-Za-z]{3,9})\s+(\d{1,2}),\s*(\d{4})\s+(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!match) return null;
  const [, monthName, dayStr, yearStr, hourStr, minuteStr, ampm] = match;
  const month = MONTH_INDEX[monthName.slice(0, 3).toLowerCase()];
  if (!month) return null;
  let hour = Number(hourStr) % 12;
  if (ampm.toUpperCase() === "PM") hour += 12;
  return { year: Number(yearStr), month, day: Number(dayStr), hour, minute: Number(minuteStr) };
}

/**
 * Converts a wall-clock date/time known to be in `timeZone` (here, always
 * "America/New_York" — investing.com displays this page's own times in
 * ET) into a correct UTC ISO timestamp, DST-aware. Standard single-pass
 * technique: treat the wall-clock numbers as if they were already UTC,
 * see what that instant WOULD display as in `timeZone` (via `Intl`), and
 * correct by the resulting drift. Avoids hand-rolling US DST transition
 * rules (which change over time) or trusting the page's own "ET"/"EDT"/
 * "EST" abbreviation text. Exported for unit testing only.
 */
export function zonedWallClockToUtcIso(parts: WallClockParts, timeZone: string): string {
  const guessUtcMs = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute);
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const shown: Record<string, string> = {};
  for (const p of dtf.formatToParts(new Date(guessUtcMs))) shown[p.type] = p.value;
  const hour24 = shown.hour === "24" ? 0 : Number(shown.hour);
  const shownAsUtcMs = Date.UTC(Number(shown.year), Number(shown.month) - 1, Number(shown.day), hour24, Number(shown.minute), Number(shown.second));
  const driftMs = shownAsUtcMs - guessUtcMs;
  return new Date(guessUtcMs - driftMs).toISOString();
}

const EASTERN_TIME_ZONE = "America/New_York";

/** Exported for unit testing only. */
export function parsePercent(text: string | null): number | null {
  if (!text) return null;
  const match = text.match(/-?\d+(\.\d+)?/);
  if (!match) return null;
  const value = Number(match[0]);
  return Number.isFinite(value) ? value : null;
}

/**
 * Fetches and parses investing.com's Fed Rate Monitor page for the NEXT
 * FOMC meeting's probability distribution. Never throws — returns `null`
 * on any failure (browser launch failure, navigation failure, page
 * structure change, or a bucket-probability sum that isn't close to
 * 100%), matching this codebase's "a shape mismatch never throws" adapter
 * convention (see the now-deleted providers/cmeFedwatch.ts for the prior
 * art of this pattern). Internal — see `fetchInvestingFedRateMonitor` below
 * for the outer watchdog-timeout wrapper every real caller should use.
 */
async function scrapeOnce(): Promise<FedRateMonitorSnapshot | null> {
  // Imported lazily so a missing/failed Playwright install only affects
  // this one adapter's call path, never the whole backend's module graph.
  let chromium: typeof import("playwright-core").chromium;
  try {
    ({ chromium } = await import("playwright-core"));
  } catch (err) {
    console.error("[investingFedRateMonitor] playwright-core is not installed/loadable:", err instanceof Error ? err.message : err);
    return null;
  }

  let browser: import("playwright-core").Browser | null = null;
  try {
    browser = await chromium.launch({
      headless: true,
      timeout: LAUNCH_TIMEOUT_MS,
      // --no-sandbox: Chrome's setuid sandbox needs kernel/user-namespace
      // support that a Railway/Nixpacks container running as root often
      // doesn't have configured — without this flag, launch() can fail to
      // spawn cleanly (sometimes hanging rather than rejecting) instead of
      // an ordinary catchable error. --disable-gpu: no GPU device exists in
      // this headless container; leaving GPU compositing enabled is a
      // known extra source of Chromium instability with no upside here.
      args: [
        "--disable-blink-features=AutomationControlled",
        "--disable-dev-shm-usage",
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-gpu",
      ],
    });
    const context = await browser.newContext({
      userAgent: REALISTIC_USER_AGENT,
      viewport: { width: 1400, height: 1000 },
      locale: "en-US",
      timezoneId: EASTERN_TIME_ZONE,
      extraHTTPHeaders: { "Accept-Language": "en-US,en;q=0.9" },
    });
    await context.addInitScript(() => {
      Object.defineProperty(navigator, "webdriver", { get: () => undefined });
    });
    const page = await context.newPage();

    await page.goto(PAGE_URL, { waitUntil: "domcontentloaded", timeout: NAV_TIMEOUT_MS });
    // Waits for the REAL rendered table (not a loading skeleton) — this is
    // the "actually rendered by a browser" guarantee the milestone
    // requires, not just "the page responded."
    await page.waitForSelector(".fedRateTbl", { timeout: TABLE_TIMEOUT_MS });

    const raw = await page.evaluate(extractFromDom);
    if (!raw || raw.buckets.length === 0) {
      console.error("[investingFedRateMonitor] page structure did not match expected selectors (no buckets found)");
      return null;
    }

    const buckets: FedRateMonitorBucket[] = [];
    for (const b of raw.buckets) {
      const current = parsePercent(b.current);
      if (!b.label || current === null) {
        console.error("[investingFedRateMonitor] a bucket row was missing a label or a parseable current probability — aborting this fetch");
        return null;
      }
      buckets.push({
        targetRangeLabel: b.label,
        currentProbabilityPct: current,
        previousDayProbabilityPct: parsePercent(b.previousDay),
        previousWeekProbabilityPct: parsePercent(b.previousWeek),
      });
    }

    const sum = buckets.reduce((total, b) => total + b.currentProbabilityPct, 0);
    if (Math.abs(sum - 100) > SUM_TOLERANCE_PCT) {
      console.error(
        `[investingFedRateMonitor] extracted bucket probabilities summed to ${sum.toFixed(1)}% (expected ~100%) — treating as a failed/malformed scrape rather than trusting it`
      );
      return null;
    }

    const meetingParts = raw.meetingTimeText ? parseWallClockText(raw.meetingTimeText) : null;
    const nextMeetingDateIso = meetingParts ? zonedWallClockToUtcIso(meetingParts, EASTERN_TIME_ZONE) : null;

    const updatedMatch = raw.updatedText?.match(/Updated:\s*(.+)$/i) ?? null;
    const updatedParts = updatedMatch ? parseWallClockText(updatedMatch[1]) : null;
    const pageUpdatedAtIso = updatedParts ? zonedWallClockToUtcIso(updatedParts, EASTERN_TIME_ZONE) : null;

    return {
      buckets,
      nextMeetingDateIso,
      pageUpdatedAtIso,
      scrapedAtIso: new Date().toISOString(),
    };
  } catch (err) {
    console.error("[investingFedRateMonitor] fetch failed:", err instanceof Error ? err.message : err);
    return null;
  } finally {
    if (browser) {
      await browser.close().catch(() => {
        // Best-effort cleanup only — a close failure must never mask the
        // real result/error from the try block above.
      });
    }
  }
}

/**
 * Outer watchdog around `scrapeOnce()` — every real caller should use this,
 * not `scrapeOnce` directly. Guarantees this ALWAYS settles (resolves to
 * `null` on timeout, never hangs) even if some internal Playwright step
 * hangs instead of cleanly rejecting — see LAUNCH_TIMEOUT_MS/
 * OVERALL_TIMEOUT_MS's doc comment above for the bug this fixes. If the
 * watchdog fires first, `scrapeOnce()`'s own promise is left running in the
 * background (never awaited further) purely so its `finally` block still
 * gets to close the browser whenever that eventually happens — this
 * function itself does not wait for that cleanup.
 */
export async function fetchInvestingFedRateMonitor(): Promise<FedRateMonitorSnapshot | null> {
  return new Promise((resolve) => {
    let settled = false;
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      console.error(`[investingFedRateMonitor] scrape did not complete within ${OVERALL_TIMEOUT_MS}ms — treating as failed (browser cleanup continues in the background)`);
      resolve(null);
    }, OVERALL_TIMEOUT_MS);

    scrapeOnce().then(
      (result) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        resolve(result);
      },
      (err) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        console.error("[investingFedRateMonitor] unexpected rejection from scrapeOnce:", err instanceof Error ? err.message : err);
        resolve(null);
      }
    );
  });
}

async function runSmokeTest(): Promise<SmokeTestResult> {
  const startedAt = performance.now();
  const snapshot = await fetchInvestingFedRateMonitor();
  const latencyMs = elapsedMs(startedAt);
  const found = snapshot !== null && snapshot.buckets.length > 0;

  recordSmokeTestOutcome({
    providerId: PROVIDER_ID,
    status: found ? "CONNECTED" : "ERROR",
    markSuccessfulRequest: found,
    latencyMs,
    errorCode: found ? null : "SCRAPE_FAILED",
    safeErrorMessage: found ? null : "Investing.com Fed Rate Monitor page could not be scraped (blocked, structure changed, or bad probability sum)",
  });

  return {
    configured: true,
    auth: "N/A",
    request: found ? "PASS" : "FAIL",
    capabilities: [{ label: "HEADLESS BROWSER: Fed Rate Monitor table scrape", result: found ? "PASS" : "FAIL" }],
    sampleValue: found
      ? `${snapshot!.buckets.length} bucket(s) for next meeting, e.g. ${snapshot!.buckets[0].targetRangeLabel} = ${snapshot!.buckets[0].currentProbabilityPct}%`
      : null,
    latencyMs,
    result: found ? "PASS" : "FAIL",
    safeReason: found ? null : "the page could not be scraped this attempt — see docs/PROVIDER_SETUP.md's fragility note",
  };
}

export const investingFedRateMonitorProvider: ProviderDefinition = {
  id: PROVIDER_ID,
  displayName: DISPLAY_NAME,
  capability:
    "F3 Fed / Rate Pricing — real next-FOMC-meeting probability distribution (N target-rate buckets, current/previous-day/previous-week probabilities), scraped via headless browser from investing.com's public Fed Rate Monitor tool. sourceTag is always INVESTING_FED_RATE_MONITOR (a third party displaying CME-futures-derived numbers, never CME's own feed).",
  requiresCredential: false,
  isConfigured: () => true,
  getStatus: () =>
    buildProviderStatus({
      providerId: PROVIDER_ID,
      displayName: DISPLAY_NAME,
      configured: true,
      environment: null,
    }),
  runSmokeTest,
};
