import type { EventItem } from "@gold-terminal/contracts";
import {
  fetchMostRecent10YearAuction,
  fetchUpcomingAuctions,
  fetchQraRelease,
  type UpcomingAuctionRecord,
  type QraRelease,
} from "../providers/treasury";
import { cached } from "./cache";
import { runTrackedIngestion } from "../db/ingestionRunner";
import { insertObservationIfChanged, type KpiObservationInput } from "../db/kpiObservations";
import { round, unavailableOverride, type FamilyOverrideResult, type KpiOverride } from "./types";

// Milestone 2B — F9 Treasury/Fiscal. Real: f9-auction-high-yield/btc/indirect
// (from the most recently COMPLETED 10-Year note auction — a documented
// selection choice: the terminal shows one "10Y auction stats" reading
// rather than mixing tenors). nextEvents are replaced with REAL
// upcoming-auction dates for the next 10Y note, next 30Y bond, and next
// TIPS auction, filtered from Treasury's `upcoming_auctions` calendar — any
// of the three not currently in the announced calendar window is simply
// omitted (never fabricated), and a fetch failure now clears nextEvents
// entirely (`[]`) rather than falling back to the mock placeholder date
// snapshotCache.ts would otherwise substitute — REAL mode never shows a
// fake event when the real source fails.
//
// Milestone (this pass) — f9-qra-borrowing/f9-qra-revision are now REAL,
// sourced directly from Treasury's quarterly "Marketable Borrowing
// Estimates" press release (prose, not a structured API field — see
// providers/treasury.ts's strict parser). NOT derived from Monthly
// Statement of the Public Debt deltas (a prior attempt at that approach did
// not cleanly work — see providers/treasury.ts's top-of-file QRA comment
// for the actual source/format finally used).
const AUCTION_STATS_TTL_MS = 6 * 60 * 60_000; // 6h — auctions are infrequent (roughly monthly per tenor)
const UPCOMING_TTL_MS = 6 * 60 * 60_000;
const SOURCE_TAG = "US_TREASURY";

// QRA releases happen ~4x/year (early Feb/May/Aug/Nov) — no need for
// frequent polling. A 24h TTL means at most one real fetch per day; DB
// persistence (below) only runs on an actual cache-miss fetch, and
// `insertObservationIfChanged` further dedupes identical repeat reads of
// the same still-current release, so polling daily between release windows
// is cheap and never grows the table beyond one row per genuine revision.
const QRA_TTL_MS = 24 * 60 * 60_000;
const QRA_JOB_KEY = "treasury:qra";
const QRA_SOURCE_TAG = "US_TREASURY_QRA";

// A reopened 10-Year note's `security_term` in the upcoming-auctions
// calendar reads as e.g. "9-Year 11-Month" rather than literally "10-Year"
// (VERIFIED live) — match both the original-issue and reopening forms.
const NEXT_10Y_TERM = /^(9|10)-Year/;
const NEXT_30Y_TERM = /^(29|30)-Year/;

function findNext10Y(events: UpcomingAuctionRecord[]): UpcomingAuctionRecord | undefined {
  return events.find((e) => e.securityType === "Note" && NEXT_10Y_TERM.test(e.securityTerm));
}
function findNext30Y(events: UpcomingAuctionRecord[]): UpcomingAuctionRecord | undefined {
  return events.find((e) => e.securityType === "Bond" && NEXT_30Y_TERM.test(e.securityTerm));
}
function findNextTips(events: UpcomingAuctionRecord[]): UpcomingAuctionRecord | undefined {
  // VERIFIED live: TIPS auctions carry `security_type === "TIPS Note"` in
  // this same dataset, both historically and for original-issue auctions.
  return events.find((e) => e.securityType === "TIPS Note");
}

function buildNextEvents(events: UpcomingAuctionRecord[]): EventItem[] {
  const result: EventItem[] = [];
  const next10y = findNext10Y(events);
  if (next10y) result.push({ id: "f9-ev-10y", title: "Next 10Y Auction", scheduledAt: next10y.auctionDateIso });
  const next30y = findNext30Y(events);
  if (next30y) result.push({ id: "f9-ev-30y", title: "Next 30Y Auction", scheduledAt: next30y.auctionDateIso });
  const nextTips = findNextTips(events);
  if (nextTips) result.push({ id: "f9-ev-tips", title: "Next TIPS Auction", scheduledAt: nextTips.auctionDateIso });
  return result;
}

/** Never lets a MySQL persistence failure affect the real-data response — mirrors this codebase's existing "DB config missing must never crash the app" rule (see db/pool.ts's DbNotConfiguredError). */
async function persistObservationSafely(input: KpiObservationInput): Promise<void> {
  try {
    await insertObservationIfChanged(input);
  } catch (err) {
    console.error("[real-data] F9 QRA: failed to persist KPI observation to MySQL:", err instanceof Error ? err.message : err);
  }
}

/** Rough estimate only, for `ingestion_state.expected_next_at` bookkeeping — Treasury's QRA releases historically land in early Feb/May/Aug/Nov, but this is NOT used to gate/skip fetches (the TTL above already does that); it is purely informational metadata. */
function estimateNextQraWindow(from: Date): Date {
  const releaseMonths = [1, 4, 7, 10]; // Feb, May, Aug, Nov (UTC month index)
  const year = from.getUTCFullYear();
  for (const month of releaseMonths) {
    const candidate = new Date(Date.UTC(year, month, 1));
    if (candidate.getTime() > from.getTime()) return candidate;
  }
  return new Date(Date.UTC(year + 1, releaseMonths[0], 1));
}

async function fetchQraReleaseTracked(): Promise<QraRelease> {
  return runTrackedIngestion(QRA_JOB_KEY, fetchQraRelease, estimateNextQraWindow(new Date()));
}

async function buildQraOverrides(nowIso: string): Promise<Record<string, KpiOverride>> {
  try {
    const { value: release, fetchedAtMs } = await cached(QRA_JOB_KEY, QRA_TTL_MS, fetchQraReleaseTracked);
    const retrievedAtIso = new Date(fetchedAtMs).toISOString();
    // The release's own stated publication date is the correct "as of" —
    // fall back to retrieval time only in the unlikely case that specific
    // sub-pattern didn't match (see QraRelease.publicationDateIso's doc).
    const observationAtIso = release.publicationDateIso ?? retrievedAtIso;
    const observationAtDate = new Date(observationAtIso);

    const overrides: Record<string, KpiOverride> = {
      "f9-qra-borrowing": {
        value: round(release.currentQuarterBorrowingBillion, 0),
        sourceTag: QRA_SOURCE_TAG,
        dataState: "REAL",
        provenance: "observed",
        observationAtIso,
        retrievedAtIso,
      },
    };

    await persistObservationSafely({
      kpiId: "f9-qra-borrowing",
      observationAt: observationAtDate,
      retrievedAt: new Date(fetchedAtMs),
      numericValue: release.currentQuarterBorrowingBillion,
      sourceTag: QRA_SOURCE_TAG,
      provenance: "observed",
      status: release.sourceUrl,
    });

    if (release.revisionBillion !== null) {
      overrides["f9-qra-revision"] = {
        value: round(release.revisionBillion, 0),
        sourceTag: QRA_SOURCE_TAG,
        dataState: "REAL",
        provenance: "observed",
        observationAtIso,
        retrievedAtIso,
      };
      await persistObservationSafely({
        kpiId: "f9-qra-revision",
        observationAt: observationAtDate,
        retrievedAt: new Date(fetchedAtMs),
        numericValue: release.revisionBillion,
        sourceTag: QRA_SOURCE_TAG,
        provenance: "observed",
        status: release.sourceUrl,
      });
    } else {
      console.error("[real-data] F9 QRA: borrowing estimate parsed, but the 'higher/lower than announced' revision sentence did not match");
      overrides["f9-qra-revision"] = unavailableOverride(nowIso);
    }

    return overrides;
  } catch (err) {
    // Expected/honest outcomes here include "between release windows, the
    // index page doesn't yet point at a release matching this quarter's
    // wording" as well as a genuine network/parse failure — both report
    // UNAVAILABLE, never a fabricated or last-quarter's stale figure.
    console.error("[real-data] F9 QRA (Treasury) fetch/parse failed:", err instanceof Error ? err.message : err);
    return {
      "f9-qra-borrowing": unavailableOverride(nowIso),
      "f9-qra-revision": unavailableOverride(nowIso),
    };
  }
}

export async function buildF9Overrides(): Promise<FamilyOverrideResult> {
  const nowIso = new Date().toISOString();
  const kpiOverrides: Record<string, KpiOverride> = await buildQraOverrides(nowIso);

  try {
    const { value: auction, fetchedAtMs } = await cached("treasury:auction:10y", AUCTION_STATS_TTL_MS, fetchMostRecent10YearAuction);
    if (!auction) throw new Error("no usable completed 10Y auction record found");
    const retrievedAtIso = new Date(fetchedAtMs).toISOString();

    kpiOverrides["f9-auction-high-yield"] = {
      value: round(auction.highYieldPct, 2),
      sourceTag: SOURCE_TAG,
      dataState: "REAL",
      observationAtIso: auction.auctionDateIso,
      retrievedAtIso,
    };
    kpiOverrides["f9-auction-btc"] = {
      value: round(auction.bidToCoverRatio, 2),
      sourceTag: SOURCE_TAG,
      dataState: "REAL",
      observationAtIso: auction.auctionDateIso,
      retrievedAtIso,
    };
    kpiOverrides["f9-auction-indirect"] = {
      value: Math.round(auction.indirectBidderSharePct),
      sourceTag: SOURCE_TAG,
      dataState: "REAL",
      observationAtIso: auction.auctionDateIso,
      retrievedAtIso,
    };
  } catch (err) {
    console.error("[real-data] F9 completed 10Y auction (Treasury) fetch failed:", err instanceof Error ? err.message : err);
    kpiOverrides["f9-auction-high-yield"] = unavailableOverride(nowIso);
    kpiOverrides["f9-auction-btc"] = unavailableOverride(nowIso);
    kpiOverrides["f9-auction-indirect"] = unavailableOverride(nowIso);
  }

  let nextEvents: EventItem[];
  try {
    const { value: upcoming } = await cached("treasury:upcomingAuctions", UPCOMING_TTL_MS, fetchUpcomingAuctions);
    nextEvents = buildNextEvents(upcoming);
  } catch (err) {
    console.error("[real-data] F9 upcoming auctions (Treasury) fetch failed:", err instanceof Error ? err.message : err);
    // REAL mode: a failed real event source must never fall back to a
    // fabricated/mock placeholder date — explicit empty list, not
    // `undefined` (which snapshotCache.ts would otherwise treat as "keep
    // the mock fixture's events").
    nextEvents = [];
  }

  return { kpiOverrides, nextEvents };
}
