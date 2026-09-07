import type { ProviderDefinition, SmokeTestResult } from "./types";
import { fetchJson, fetchText, elapsedMs } from "./httpClient";
import { buildProviderStatus, recordSmokeTestOutcome } from "./statusHelpers";

// U.S. Treasury Fiscal Data — F9 Treasury/Fiscal. No API key required
// (VERIFIED live in the research pass). See docs/PROVIDER_SETUP.md.
const PROVIDER_ID = "treasury";
const DISPLAY_NAME = "U.S. Treasury (Fiscal Data)";
const FISCAL_DATA_BASE = "https://api.fiscaldata.treasury.gov/services/api/fiscal_service/v1/accounting/od";
const AUCTIONS_QUERY_URL = `${FISCAL_DATA_BASE}/auctions_query?page[size]=1&sort=-record_date`;
const UPCOMING_AUCTIONS_URL = `${FISCAL_DATA_BASE}/upcoming_auctions?page[size]=1`;
// Separate `accounting/dts` (Daily Treasury Statement) namespace, distinct
// from the `accounting/od` base above — used by F8's TGA adapter, below.
const FISCAL_DATA_DTS_BASE = "https://api.fiscaldata.treasury.gov/services/api/fiscal_service/v1/accounting/dts";

interface FiscalDataEnvelope {
  data: Array<Record<string, unknown>>;
}

async function fetchAuctionsSample(): Promise<{ ok: boolean; sample: string | null; raw: unknown }> {
  const res = await fetchJson<FiscalDataEnvelope>(AUCTIONS_QUERY_URL);
  if (!res.ok || !res.body || !Array.isArray(res.body.data) || res.body.data.length === 0) {
    return { ok: false, sample: null, raw: res.raw };
  }
  const record = res.body.data[0];
  const cusip = record.cusip ?? "?";
  const securityTerm = record.security_term ?? "?";
  const recordDate = record.record_date ?? "?";
  return { ok: true, sample: `auctions_query: ${securityTerm} (${cusip}), record_date=${recordDate}`, raw: res.body };
}

async function fetchUpcomingSample(): Promise<boolean> {
  const res = await fetchJson<FiscalDataEnvelope>(UPCOMING_AUCTIONS_URL);
  return res.ok && !!res.body && Array.isArray(res.body.data);
}

async function runSmokeTest(): Promise<SmokeTestResult> {
  const startedAt = performance.now();
  try {
    const auctions = await fetchAuctionsSample();
    const upcomingOk = await fetchUpcomingSample();
    const latencyMs = elapsedMs(startedAt);

    if (!auctions.ok) {
      recordSmokeTestOutcome({
        providerId: PROVIDER_ID,
        status: "ERROR",
        markSuccessfulRequest: false,
        latencyMs,
        errorCode: "REQUEST_FAILED",
        safeErrorMessage: "auctions_query did not return the expected data envelope",
      });
      return {
        configured: true,
        auth: "N/A",
        request: "FAIL",
        capabilities: [{ label: "ENDPOINT: auctions_query", result: "FAIL" }],
        sampleValue: null,
        latencyMs,
        result: "FAIL",
        safeReason: "auctions_query did not return the expected data envelope",
      };
    }

    recordSmokeTestOutcome({
      providerId: PROVIDER_ID,
      status: "CONNECTED",
      markSuccessfulRequest: true,
      latencyMs,
      errorCode: null,
      safeErrorMessage: null,
    });

    return {
      configured: true,
      auth: "N/A",
      request: "PASS",
      capabilities: [
        { label: "ENDPOINT: auctions_query", result: "PASS" },
        { label: "ENDPOINT: upcoming_auctions", result: upcomingOk ? "PASS" : "FAIL" },
      ],
      sampleValue: auctions.sample,
      latencyMs,
      result: upcomingOk ? "PASS" : "FAIL",
      safeReason: upcomingOk ? null : "upcoming_auctions did not return the expected data envelope",
    };
  } catch (err) {
    const latencyMs = elapsedMs(startedAt);
    const safeReason = "network request failed or timed out";
    recordSmokeTestOutcome({
      providerId: PROVIDER_ID,
      status: "ERROR",
      markSuccessfulRequest: false,
      latencyMs,
      errorCode: "NETWORK_ERROR",
      safeErrorMessage: safeReason,
    });
    return {
      configured: true,
      auth: "N/A",
      request: "FAIL",
      capabilities: [{ label: "ENDPOINT: auctions_query", result: "FAIL" }],
      sampleValue: null,
      latencyMs,
      result: "FAIL",
      safeReason,
    };
  }
}

// ---------------------------------------------------------------------------
// Milestone 2B — real data-fetching functions (F2 Rates, F9 Treasury/Fiscal).
// Reuses this file's existing httpClient helpers/URL base; adds no new
// dependency. Each function returns `null` (never throws) on a malformed/
// empty response so callers in apps/backend/src/real/* can treat "no usable
// data" uniformly, whether the cause was a network error (caller's try/catch)
// or a live-but-empty/malformed payload (this file's own validation).
//
// F2/F8 real-source-decisions pass — this par-yield CSV adapter previously
// went orphaned/unused once F2 moved to FRED (see the old top-of-file comment
// in real/f2Rates.ts). Per the DIRECT OFFICIAL > DIRECT FREE RELIABLE
// priority rule, F2's 2Y/10Y nominal (and, new this pass, 10Y real) move back
// onto this file's Treasury CSV feeds as the SOLE primary source (no FRED
// fallback) — see real/f2Rates.ts. This file also gained a Fiscal Data DTS
// Operating Cash Balance adapter for F8's TGA reading (below), replacing
// FRED's WDTGAL proxy per the same "official over proxy" rule.
// ---------------------------------------------------------------------------

/**
 * Daily Treasury Par Yield Curve Rates. VERIFIED live: fiscaldata.treasury.gov
 * does NOT expose this dataset as JSON — the CSV feed at home.treasury.gov is
 * the correct, currently-working source (confirmed live during this
 * milestone). CSV columns include quoted headers ("2 Yr", "10 Yr", etc.);
 * data rows are simple unquoted comma-separated values, so a full CSV parser
 * is not needed — a plain split is sufficient and avoids a new dependency.
 */
export interface ParYieldPoint {
  /** ISO date of the most recent published rate row (UTC midnight). */
  dateIso: string;
  y2: number;
  y10: number;
}

export type ParYieldHistoryPoint = ParYieldPoint;

/**
 * Daily Treasury Par REAL Yield Curve Rates (TIPS-derived). LIVE-VERIFIED
 * this pass at the same home.treasury.gov CSV feed with
 * `type=daily_treasury_real_yield_curve` — columns are `5 YR`/`7 YR`/`10
 * YR`/`20 YR`/`30 YR` (note: all-caps "YR", unlike the nominal curve's mixed-
 * case "10 Yr" — confirmed by inspecting the live header row, not assumed).
 * The 10Y point landed within ~0.02pp of FRED's `DFII10` on the same day
 * (both ultimately derive from the same underlying Treasury TIPS curve),
 * confirming this is a correct, clean, directly-official alternative to the
 * FRED proxy for `f2-10y-real`.
 */
export interface RealParYieldPoint {
  /** ISO date of the most recent published rate row (UTC midnight). */
  dateIso: string;
  y10: number;
}

type YieldCurveType = "daily_treasury_yield_curve" | "daily_treasury_real_yield_curve";

function treasuryYieldCsvUrl(year: number, type: YieldCurveType): string {
  return (
    "https://home.treasury.gov/resource-center/data-chart-center/interest-rates/daily-treasury-rates.csv/" +
    `${year}/all?type=${type}&field_tdr_date_value=${year}&page&_format=csv`
  );
}

function parseCsvRows(raw: string): string[][] {
  return raw
    .trim()
    .split(/\r?\n/)
    .map((line) => line.split(",").map((cell) => cell.replace(/^"|"$/g, "").trim()));
}

/** Shared by both the nominal and real par-yield CSVs: row 0 is the header, row 1 is the most-recent (sorted descending) data row, first cell is `MM/DD/YYYY`. */
function parseYieldCsvDate(dataRow: string[]): string | null {
  const dateMatch = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(dataRow[0] ?? "");
  if (!dateMatch) return null;
  const [, mm, dd, yyyy] = dateMatch;
  return new Date(Date.UTC(Number(yyyy), Number(mm) - 1, Number(dd))).toISOString();
}

function parYieldFromCsv(raw: string): ParYieldPoint | null {
  return parseParYieldHistoryCsv(raw)[0] ?? null;
}

/** Parses every valid 2Y/10Y row from a Treasury par-yield CSV, preserving the provider's newest-first order. */
export function parseParYieldHistoryCsv(raw: string): ParYieldHistoryPoint[] {
  const rows = parseCsvRows(raw);
  if (rows.length < 2) return [];
  const header = rows[0];
  const idx2y = header.indexOf("2 Yr");
  const idx10y = header.indexOf("10 Yr");
  if (idx2y === -1 || idx10y === -1) return [];

  return rows.slice(1).flatMap((dataRow): ParYieldHistoryPoint[] => {
    const dateIso = parseYieldCsvDate(dataRow);
    const rawY2 = dataRow[idx2y];
    const rawY10 = dataRow[idx10y];
    const y2 = Number(rawY2);
    const y10 = Number(rawY10);
    return dateIso && rawY2 !== "" && rawY10 !== "" && Number.isFinite(y2) && Number.isFinite(y10)
      ? [{ dateIso, y2, y10 }]
      : [];
  });
}

function realYieldFromCsv(raw: string): RealParYieldPoint | null {
  const rows = parseCsvRows(raw);
  if (rows.length < 2) return null;
  const header = rows[0];
  const idx10y = header.indexOf("10 YR"); // all-caps on this curve — see RealParYieldPoint's doc comment
  if (idx10y === -1) return null;

  const dataRow = rows[1];
  const dateIso = parseYieldCsvDate(dataRow);
  const y10 = Number(dataRow[idx10y]);
  if (!dateIso || !Number.isFinite(y10)) return null;

  return { dateIso, y10 };
}

/** Falls back to the previous year's CSV for the first few days of January, when the new year's file may not have data yet. */
export async function fetchLatestParYield(): Promise<ParYieldPoint | null> {
  const year = new Date().getUTCFullYear();
  const primary = await fetchText(treasuryYieldCsvUrl(year, "daily_treasury_yield_curve"));
  if (primary.ok && primary.raw) {
    const parsed = parYieldFromCsv(primary.raw);
    if (parsed) return parsed;
  }
  const fallback = await fetchText(treasuryYieldCsvUrl(year - 1, "daily_treasury_yield_curve"));
  if (!fallback.ok || !fallback.raw) return null;
  return parYieldFromCsv(fallback.raw);
}

/** Fetches the current and previous calendar years, deduplicated and newest first, for terminal-native charts. */
export async function fetchParYieldHistory(): Promise<ParYieldHistoryPoint[]> {
  const currentYear = new Date().getUTCFullYear();
  const responses = await Promise.all(
    [currentYear, currentYear - 1].map((year) => fetchText(treasuryYieldCsvUrl(year, "daily_treasury_yield_curve")))
  );
  const byDate = new Map<string, ParYieldHistoryPoint>();
  for (const response of responses) {
    if (!response.ok || !response.raw) continue;
    for (const point of parseParYieldHistoryCsv(response.raw)) byDate.set(point.dateIso, point);
  }
  return [...byDate.values()].sort((a, b) => b.dateIso.localeCompare(a.dateIso));
}

/** Same year-boundary fallback as `fetchLatestParYield`, for the real (TIPS-derived) curve. */
export async function fetchLatestRealParYield(): Promise<RealParYieldPoint | null> {
  const year = new Date().getUTCFullYear();
  const primary = await fetchText(treasuryYieldCsvUrl(year, "daily_treasury_real_yield_curve"));
  if (primary.ok && primary.raw) {
    const parsed = realYieldFromCsv(primary.raw);
    if (parsed) return parsed;
  }
  const fallback = await fetchText(treasuryYieldCsvUrl(year - 1, "daily_treasury_real_yield_curve"));
  if (!fallback.ok || !fallback.raw) return null;
  return realYieldFromCsv(fallback.raw);
}

// ---------------------------------------------------------------------------
// F8 Liquidity — Daily Treasury Statement, Operating Cash Balance dataset
// (`dts/operating_cash_balance`). LIVE-INSPECTED this pass (per the explicit
// "don't guess the account_type, inspect the live response" instruction):
// the CURRENT schema's account_type values for this table are "Treasury
// General Account (TGA) Opening Balance" / "Total TGA Deposits (Table II)" /
// "Total TGA Withdrawals (Table II) (-)" / "Treasury General Account (TGA)
// Closing Balance" — an older "Federal Reserve Account" account_type (last
// seen live 2021-09-30) is a retired/legacy label, not the current one.
//
// A genuine schema quirk, confirmed live rather than assumed: for every row
// in the CURRENT schema, `close_today_bal` is literally the string "null" —
// the actual dollar figure for whichever quantity a row's `account_type`
// names lives in `open_today_bal` instead, regardless of "Opening"/"Closing"
// wording. Verified by the accounting identity that must hold if this
// reading is right: one date's "...Closing Balance" row's `open_today_bal`
// exactly equals the NEXT date's "...Opening Balance" row's `open_today_bal`
// (confirmed live across several consecutive business days). Because
// `close_today_bal` carries no usable data in this schema, the
// same-day `close_today_bal - open_today_bal` formula the milestone brief
// offered as the first option is not available; this adapter uses the
// documented fallback instead — the day-over-day diff of the "Closing
// Balance" row's own value — computed by the caller (real/f8Liquidity.ts)
// from the history this returns, mirroring f8-reserves-wow's existing
// pattern.
// ---------------------------------------------------------------------------

const DTS_OPERATING_CASH_BALANCE_URL = `${FISCAL_DATA_DTS_BASE}/operating_cash_balance`;
const TGA_CLOSING_BALANCE_ACCOUNT_TYPE = "Treasury General Account (TGA) Closing Balance";

export interface TgaBalancePoint {
  /** ISO date of this Daily Treasury Statement row (UTC midnight). */
  dateIso: string;
  /** Dollars, in millions — Fiscal Data's own unit for this dataset (see `dataFormats.close_today_bal` in a raw response: "$1,000,000"). */
  closeBalanceMillions: number;
}

function parseTgaRow(record: Record<string, unknown>): TgaBalancePoint | null {
  const recordDate = typeof record.record_date === "string" ? record.record_date : null;
  // See this section's top-of-file comment: `open_today_bal`, not
  // `close_today_bal`, carries the real figure for this account_type in the
  // current DTS schema.
  const closeBalanceMillions = Number(record.open_today_bal);
  if (!recordDate || !Number.isFinite(closeBalanceMillions)) return null;
  return { dateIso: new Date(`${recordDate}T00:00:00Z`).toISOString(), closeBalanceMillions };
}

/** Most recent `limit` TGA closing-balance points, newest first — enough history for a day-over-day delta (see this section's top-of-file comment). */
export async function fetchTgaBalanceHistory(limit: number): Promise<TgaBalancePoint[]> {
  const filterValue = `account_type:eq:${TGA_CLOSING_BALANCE_ACCOUNT_TYPE}`;
  const url = `${DTS_OPERATING_CASH_BALANCE_URL}?filter=${encodeURIComponent(filterValue)}&sort=-record_date&page[size]=${limit}`;
  const res = await fetchJson<FiscalDataEnvelope>(url);
  if (!res.ok || !res.body || !Array.isArray(res.body.data)) return [];

  const points: TgaBalancePoint[] = [];
  for (const record of res.body.data) {
    const point = parseTgaRow(record);
    if (point) points.push(point);
  }
  return points;
}

export interface CompletedAuctionRecord {
  securityTerm: string;
  auctionDateIso: string;
  highYieldPct: number;
  bidToCoverRatio: number;
  indirectBidderSharePct: number;
}

async function fetchMostRecentAuctionRaw(filterExpr: string): Promise<Record<string, unknown> | null> {
  const url = `${FISCAL_DATA_BASE}/auctions_query?filter=${filterExpr}&sort=-auction_date&page[size]=1`;
  const res = await fetchJson<FiscalDataEnvelope>(url);
  if (!res.ok || !res.body || !Array.isArray(res.body.data) || res.body.data.length === 0) return null;
  return res.body.data[0];
}

/**
 * Extracts the 3 auction-quality stats this terminal tracks from a raw
 * `auctions_query` record. "Indirect bidder share" is not itself a dataset
 * field — VERIFIED live: it is the conventional
 * `indirect_bidder_accepted / total_accepted` ratio (cross-checked against a
 * live 10Y auction record; the result lands in the expected ~55-70% range
 * for 10Y notes).
 */
function extractAuctionStats(record: Record<string, unknown>): CompletedAuctionRecord | null {
  const securityTerm = typeof record.security_term === "string" ? record.security_term : null;
  const auctionDate = typeof record.auction_date === "string" ? record.auction_date : null;
  const highYieldPct = Number(record.high_yield);
  const bidToCoverRatio = Number(record.bid_to_cover_ratio);
  const indirectAccepted = Number(record.indirect_bidder_accepted);
  const totalAccepted = Number(record.total_accepted);

  if (
    !securityTerm ||
    !auctionDate ||
    !Number.isFinite(highYieldPct) ||
    !Number.isFinite(bidToCoverRatio) ||
    !Number.isFinite(indirectAccepted) ||
    !Number.isFinite(totalAccepted) ||
    totalAccepted === 0
  ) {
    return null;
  }

  return {
    securityTerm,
    auctionDateIso: new Date(auctionDate).toISOString(),
    highYieldPct,
    bidToCoverRatio,
    indirectBidderSharePct: (indirectAccepted / totalAccepted) * 100,
  };
}

/** Most recently COMPLETED 10-Year note auction (F9's "10Y auction stats" reading — see docs comment in apps/backend/src/real/f9Treasury.ts). */
export async function fetchMostRecent10YearAuction(): Promise<CompletedAuctionRecord | null> {
  const record = await fetchMostRecentAuctionRaw("security_term:eq:10-Year");
  return record ? extractAuctionStats(record) : null;
}

/** Upcoming (announced but not yet held) Treasury auctions from today onward. */
export interface UpcomingAuctionRecord {
  securityType: string;
  securityTerm: string;
  auctionDateIso: string;
}

export async function fetchUpcomingAuctions(): Promise<UpcomingAuctionRecord[]> {
  const todayIso = new Date().toISOString().slice(0, 10);
  const url = `${FISCAL_DATA_BASE}/upcoming_auctions?filter=auction_date:gte:${todayIso}&sort=auction_date&page[size]=100`;
  const res = await fetchJson<FiscalDataEnvelope>(url);
  if (!res.ok || !res.body || !Array.isArray(res.body.data)) return [];

  const events: UpcomingAuctionRecord[] = [];
  for (const record of res.body.data) {
    const securityType = record.security_type;
    const securityTerm = record.security_term;
    const auctionDate = record.auction_date;
    if (typeof securityType !== "string" || typeof securityTerm !== "string" || typeof auctionDate !== "string") continue;
    events.push({ securityType, securityTerm, auctionDateIso: new Date(auctionDate).toISOString() });
  }
  return events;
}

// ---------------------------------------------------------------------------
// F9 QRA (Quarterly Refunding) — Treasury's "Marketable Borrowing Estimates"
// press release. VERIFIED live (this milestone): fiscaldata.treasury.gov has
// no structured API field for net marketable borrowing — Treasury only
// publishes it as PROSE, in an HTML press release. Discovery path (both
// URLs VERIFIED live):
//   1. `QRA_INDEX_URL` — a STABLE index page ("Most Recent Quarterly
//      Refunding Documents") that always links the current quarter's
//      release under link text starting "Financing Estimates:" — VERIFIED
//      live structure: `<a href=/news/press-releases/sbNNNN>Financing
//      Estimates: <year> - <quarter>Quarter</a>` (note: unquoted href
//      attribute in Treasury's actual markup).
//   2. That link's target — a plain HTML press release, e.g.
//      "Treasury Announces Marketable Borrowing Estimates" — contains the
//      actual figures as prose, e.g. (VERIFIED live, Aug 2026 release):
//      "During the July–September 2026 quarter, Treasury expects to borrow
//      $739 billion in privately-held net marketable debt, assuming an
//      end-of-September cash balance of $950 billion." and "The borrowing
//      estimate is $68 billion higher than announced in May 2026, ...".
// This phrasing was cross-checked as Treasury's recurring quarter-to-quarter
// boilerplate (matches independent secondary coverage of prior quarters,
// e.g. ZeroHedge/PGPF write-ups quoting the same construction) — the parser
// below is a STRICT match on this exact phrasing, never a permissive/
// best-guess regex. Any release whose wording doesn't match this exactly
// yields `null`/a thrown error, which callers (apps/backend/src/real/
// f9Treasury.ts) turn into UNAVAILABLE — never a fabricated or partial
// value. Treasury's prose also uses U+00A0 (non-breaking space) between
// some words (VERIFIED live, e.g. "billion in", "privately-held
// net") — `\s+` is used in place of literal spaces at those exact spots so
// the strict match still recognizes the real text without becoming a vague/
// permissive pattern.
// ---------------------------------------------------------------------------

const QRA_INDEX_URL =
  "https://home.treasury.gov/policy-issues/financing-the-government/quarterly-refunding/most-recent-quarterly-refunding-documents";
const TREASURY_ORIGIN = "https://home.treasury.gov";

const QRA_INDEX_LINK_RE = /<a\s+href=["']?([^"'>\s]+)["']?>\s*Financing Estimates:[^<]*<\/a>/i;

const QRA_BORROW_SENTENCE_RE =
  /During the ([A-Za-z]+)[-‐-―]([A-Za-z]+) (\d{4}) quarter, Treasury expects to borrow \$([\d,]+)\s+billion\s+in\s+privately-held\s+net\s+marketable\s+debt, assuming an end-of-([A-Za-z]+) cash balance of \$([\d,]+) billion\./g;
const QRA_REVISION_SENTENCE_RE =
  /The borrowing estimate is \$([\d,]+)\s+billion\s+(higher|lower)\s+than\s+announced\s+in\s+([A-Za-z]+)\s+(\d{4})/;
const QRA_RELEASE_TITLE_DATE_RE = /Treasury Announces Marketable Borrowing Estimates\s+([A-Za-z]+ \d{1,2}, \d{4})/;

/** Strips tags/scripts/styles, decodes the small set of entities Treasury's press releases actually use, and collapses whitespace (including U+00A0) to single ASCII spaces — never a full DOM parser, this file only ever needs plain prose to run the strict sentence regexes above against. */
function htmlToPlainText(html: string): string {
  const withoutMarkup = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ");
  const decoded = withoutMarkup
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&rsquo;/g, "'")
    .replace(/&lsquo;/g, "'")
    .replace(/&ldquo;/g, '"')
    .replace(/&rdquo;/g, '"')
    .replace(/&mdash;/g, "—")
    .replace(/&ndash;/g, "–");
  return decoded.replace(/\s+/g, " ").trim();
}

/** Finds the current-quarter QRA press-release URL from Treasury's stable index page. Returns `null` if that exact "Financing Estimates:" link shape isn't found (page structure changed, or between-quarters content differs) — never a guess. */
async function findQraReleaseUrl(): Promise<string | null> {
  const res = await fetchText(QRA_INDEX_URL);
  if (!res.ok || !res.raw) return null;
  const match = QRA_INDEX_LINK_RE.exec(res.raw);
  if (!match) return null;
  const href = match[1];
  return href.startsWith("http") ? href : `${TREASURY_ORIGIN}${href}`;
}

export interface QraRelease {
  sourceUrl: string;
  /** The release's own stated publication date (ISO), or `null` if that specific sub-pattern didn't match — a missing date does not itself invalidate the borrowing/revision figures below, each of which has its own independent strict match. */
  publicationDateIso: string | null;
  /** Current quarter's privately-held net marketable borrowing estimate, in $B, read directly from the release's prose. */
  currentQuarterBorrowingBillion: number;
  /** Signed $B delta vs. the estimate announced the prior quarter ("higher" => positive, "lower" => negative). `null` if that specific sentence wasn't found — independent of `currentQuarterBorrowingBillion` succeeding. */
  revisionBillion: number | null;
}

function parseBillions(raw: string): number {
  return Number(raw.replace(/,/g, ""));
}

function parseReleaseDateIso(text: string): string | null {
  const match = QRA_RELEASE_TITLE_DATE_RE.exec(text);
  if (!match) return null;
  const parsed = new Date(`${match[1]} UTC`);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

/**
 * Strictly parses a QRA press release's plain text. The FIRST "During the
 * ... quarter, Treasury expects to borrow ..." match is always the CURRENT
 * quarter's estimate — VERIFIED live: Treasury's own prose always states
 * the current quarter before the next quarter's estimate. Returns `null`
 * only when the borrowing sentence itself can't be found at all (the one
 * figure this KPI cannot do without); the revision figure is independently
 * optional (see `QraRelease.revisionBillion`).
 */
export function parseQraReleaseText(rawHtml: string, sourceUrl: string): QraRelease | null {
  const text = htmlToPlainText(rawHtml);
  const borrowMatches = [...text.matchAll(QRA_BORROW_SENTENCE_RE)];
  if (borrowMatches.length === 0) return null;

  const current = borrowMatches[0];
  const currentQuarterBorrowingBillion = parseBillions(current[4]);
  if (!Number.isFinite(currentQuarterBorrowingBillion)) return null;

  const revisionMatch = QRA_REVISION_SENTENCE_RE.exec(text);
  let revisionBillion: number | null = null;
  if (revisionMatch) {
    const magnitude = parseBillions(revisionMatch[1]);
    if (Number.isFinite(magnitude)) {
      revisionBillion = revisionMatch[2] === "higher" ? magnitude : -magnitude;
    }
  }

  return {
    sourceUrl,
    publicationDateIso: parseReleaseDateIso(text),
    currentQuarterBorrowingBillion,
    revisionBillion,
  };
}

/**
 * Discovers and fetches the current QRA press release, then strictly parses
 * it. Throws (never silently returns a guess) when the index page's
 * "Financing Estimates:" link can't be found, the release page can't be
 * fetched, or the borrowing sentence itself doesn't match the expected
 * structure — callers (apps/backend/src/real/f9Treasury.ts) already
 * try/catch around every real fetch and turn a thrown error into
 * UNAVAILABLE, exactly like `fetchMostRecent10YearAuction` above. A plain
 * network failure (DNS/timeout) also throws, from `fetchText` itself — same
 * convention as every other fetcher in this file.
 */
export async function fetchQraRelease(): Promise<QraRelease> {
  const releaseUrl = await findQraReleaseUrl();
  if (!releaseUrl) {
    throw new Error("QRA index page did not contain a recognizable 'Financing Estimates:' link — page structure may have changed");
  }
  const res = await fetchText(releaseUrl);
  if (!res.ok || !res.raw) {
    throw new Error(`QRA release page fetch failed (${releaseUrl})`);
  }
  const parsed = parseQraReleaseText(res.raw, releaseUrl);
  if (!parsed) {
    throw new Error("QRA release text did not match the expected borrowing-estimate sentence structure");
  }
  return parsed;
}

export const treasuryProvider: ProviderDefinition = {
  id: PROVIDER_ID,
  displayName: DISPLAY_NAME,
  capability:
    "F9 Treasury/Fiscal — auction results (auctions_query) and the announced auction calendar (upcoming_auctions). F2 Rates — Daily Par Yield Curve (2Y/10Y nominal) and Daily Par REAL Yield Curve (10Y TIPS-derived). F8 Liquidity — Daily Treasury Statement Operating Cash Balance (TGA level/daily delta). No API key required.",
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
