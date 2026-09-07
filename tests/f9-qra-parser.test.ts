import assert from "node:assert/strict";
import test from "node:test";
import { parseQraReleaseText } from "../apps/backend/src/providers/treasury.ts";

// F9 QRA (Quarterly Refunding) strict-parser tests.
//
// The HTML fixtures below are SYNTHETIC test data — they reproduce
// Treasury's real, publicly-documented "Treasury Announces Marketable
// Borrowing Estimates" press-release phrasing/structure (verified live
// against home.treasury.gov during this milestone, including its use of
// U+00A0 non-breaking spaces between some words, e.g. "billion in")
// with made-up figures and dates — this is a test fixture, not a claim of
// live Treasury data.
const NBSP = " ";

function syntheticWellFormedRelease(): string {
  return `<!doctype html><html><head><title>Treasury Announces Marketable Borrowing Estimates</title></head>
  <body>
    <h1>Press Releases</h1>
    <p>Treasury Announces Marketable Borrowing Estimates November 3, 2027</p>
    <p>Sources and Uses Table</p>
    <p>WASHINGTON -- The U.S. Department of the Treasury today announced its current estimates of privately-held
    net marketable borrowing for the October–December 2027 and January–March 2028 quarters.</p>
    <p>During the October–December 2027 quarter, Treasury expects to borrow $512${NBSP}billion${NBSP}in${NBSP}privately-held${NBSP}net${NBSP}marketable${NBSP}debt, assuming an end-of-December cash balance of $700 billion.
    The borrowing estimate is $23 billion lower than announced in August 2027, primarily due to higher receipts.
    During the January–March 2028 quarter, Treasury expects to borrow $410 billion in privately-held net marketable debt, assuming an end-of-March cash balance of $650 billion.</p>
    <p>During the July–September 2027 quarter, Treasury borrowed $498 billion in privately-held net marketable debt and ended the quarter with a cash balance of $690 billion.</p>
  </body></html>`;
}

function syntheticMalformedRelease(): string {
  // Deliberately does NOT contain the "During the ... quarter, Treasury
  // expects to borrow $X billion..." sentence at all — simulates a page
  // whose structure/wording has changed (or a wrong/unrelated page).
  return `<!doctype html><html><body>
    <p>Treasury Announces Marketable Borrowing Estimates November 3, 2027</p>
    <p>WASHINGTON -- The Treasury Department released updated guidance today regarding debt issuance plans.
    Further details will be provided in a subsequent release.</p>
  </body></html>`;
}

test("parseQraReleaseText: parses a well-formed release into the current-quarter borrowing estimate and signed revision", () => {
  const parsed = parseQraReleaseText(syntheticWellFormedRelease(), "https://example.test/sb-synthetic");
  assert.ok(parsed, "a well-formed release must parse successfully");
  assert.equal(parsed!.currentQuarterBorrowingBillion, 512, "must pick the FIRST 'During the...' sentence (current quarter), not the second (next quarter)");
  assert.equal(parsed!.revisionBillion, -23, "'lower than announced' must be a NEGATIVE signed delta");
  assert.equal(parsed!.publicationDateIso?.slice(0, 10), "2027-11-03");
  assert.equal(parsed!.sourceUrl, "https://example.test/sb-synthetic");
});

test("parseQraReleaseText: an explicit 'higher than announced' sentence yields a POSITIVE signed delta", () => {
  const html = syntheticWellFormedRelease().replace(
    "The borrowing estimate is $23 billion lower than announced in August 2027",
    "The borrowing estimate is $23 billion higher than announced in August 2027"
  );
  const parsed = parseQraReleaseText(html, "https://example.test/sb-synthetic");
  assert.equal(parsed!.revisionBillion, 23);
});

test("parseQraReleaseText: returns null (never a best-guess partial parse) when the borrowing sentence structure isn't present", () => {
  const parsed = parseQraReleaseText(syntheticMalformedRelease(), "https://example.test/sb-synthetic");
  assert.equal(parsed, null, "a page that doesn't match the exact known phrasing must fail safe to null, never a guessed value");
});

test("parseQraReleaseText: the revision figure is independently optional — borrowing still parses when only the revision sentence is missing", () => {
  const html = syntheticWellFormedRelease().replace(
    /The borrowing estimate is \$23 billion lower than announced in August 2027, primarily due to higher receipts\.\s*/,
    ""
  );
  const parsed = parseQraReleaseText(html, "https://example.test/sb-synthetic");
  assert.ok(parsed, "borrowing must still parse even though the revision sentence was removed");
  assert.equal(parsed!.currentQuarterBorrowingBillion, 512);
  assert.equal(parsed!.revisionBillion, null, "revision must be null, never fabricated, when its sentence is absent");
});
