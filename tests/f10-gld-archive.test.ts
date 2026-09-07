import assert from "node:assert/strict";
import test from "node:test";
import ExcelJS from "exceljs";
import { parseGldWorkbook } from "../apps/backend/src/providers/spdrGld.ts";
import { deriveGldSnapshotFromRows } from "../apps/backend/src/real/f10Gld.ts";

// F10 GLD historical-archive parsing tests.
//
// Builds a small SYNTHETIC in-memory .xlsx workbook that mimics the real
// SPDR GLD historical-archive file's structure (verified live during this
// milestone): two worksheets ("Disclaimer" first, then a data sheet whose
// name contains "Historical Archive"), a header row naming its columns
// (including "Date" and "Tonnes of Gold" — the two this parser depends on),
// and daily rows in "DD-MMM-YYYY" date format. One row is marked a US
// holiday exactly the way the real file does it: every data column
// (including "Tonnes of Gold") holds the literal string "US Holiday"
// instead of a number. This is test fixture data, not a claim of live SPDR
// figures.

async function buildSyntheticGldWorkbook(): Promise<ArrayBuffer> {
  const workbook = new ExcelJS.Workbook();

  const disclaimerSheet = workbook.addWorksheet("Disclaimer");
  disclaimerSheet.getCell("A1").value = "SPDR GOLD SHARES HISTORICAL DATA — synthetic test fixture disclaimer text.";

  const dataSheet = workbook.addWorksheet("US GLD Historical Archive");
  dataSheet.addRow([
    "Date",
    "Closing Price",
    "Ounces of Gold per Share",
    "NAV/Share at 10:30am NYT",
    "Indicative Price per Share at 4:15pm NYT",
    "Mid point of bid/ask spread at 4:15pm NYT",
    "Premium/Discount of GLD Mid Point vs Indicative Value of GLD at 4:15pm NYT",
    "Daily Share Volume",
    "Total Ounces of Gold in the Trust",
    "Tonnes of Gold",
    "Total Net Asset Value in the Trust",
  ]);
  // Three ordinary trading days...
  dataSheet.addRow(["25-Aug-2027", 420.1, 0.0917, 419.5, 420.2, 420.15, 0.01, 9000000, 33700000, 1048.35, 155500000000]);
  dataSheet.addRow(["26-Aug-2027", 421.32, 0.0917, 420.9, 421.25, 421.35, 0.02, 9800000, 33613717.91, 1045.5, 155640847391]);
  // ...a holiday row where EVERY data column reads "US Holiday" (matching
  // the real file's exact convention) rather than being a numeric row...
  dataSheet.addRow([
    "27-Aug-2027",
    "US Holiday",
    "US Holiday",
    "US Holiday",
    "US Holiday",
    "US Holiday",
    "US Holiday",
    "US Holiday",
    "US Holiday",
    "US Holiday",
    "US Holiday",
  ]);
  // ...then two more real trading days — the two most recent MARKET days,
  // which is what the delta must be computed from (skipping the holiday).
  dataSheet.addRow(["30-Aug-2027", 422.6, 0.0917, 419.04, 422.45, 422.61, 0.04, 7000000, 33650403.89, 1046.64, 153704243463]);
  dataSheet.addRow(["31-Aug-2027", 408.89, 0.0917, 418.47, 408.81, 408.82, 0.0, 25000000, 33512833.02, 1042.36, 152866227351]);

  const buffer = await workbook.xlsx.writeBuffer();
  return buffer as ArrayBuffer;
}

test("parseGldWorkbook: parses the data sheet by name, locates columns by header name, and flags the holiday row", async () => {
  const buffer = await buildSyntheticGldWorkbook();
  const rows = await parseGldWorkbook(buffer);

  assert.ok(rows, "a well-formed synthetic workbook must parse");
  assert.equal(rows!.length, 5, "all 5 data rows must be read");

  const holidayRow = rows!.find((r) => r.dateIso.slice(0, 10) === "2027-08-27");
  assert.ok(holidayRow, "the holiday row must still be present in the output");
  assert.equal(holidayRow!.tonnesOfGold, null, "a holiday row's 'US Holiday' string must become tonnesOfGold: null, never a coerced/guessed number");

  const ordinaryRow = rows!.find((r) => r.dateIso.slice(0, 10) === "2027-08-31");
  assert.equal(ordinaryRow!.tonnesOfGold, 1042.36, "an ordinary numeric row must parse its Tonnes of Gold value exactly");
  assert.equal(ordinaryRow!.closingPrice, 408.89);
  assert.equal(ordinaryRow!.ouncesPerShare, 0.0917);
  assert.equal(ordinaryRow!.navPerShare, 418.47);
  assert.equal(ordinaryRow!.totalOunces, 33512833.02);
  assert.equal(ordinaryRow!.totalNav, 152866227351);
  assert.equal(holidayRow!.closingPrice, null);
});

test("deriveGldSnapshotFromRows: the delta skips the holiday row and uses the two most recent REAL trading days", async () => {
  const buffer = await buildSyntheticGldWorkbook();
  const rows = await parseGldWorkbook(buffer);
  const snapshot = deriveGldSnapshotFromRows(rows!);

  // Latest row (31-Aug) vs. the PRIOR TRADING day (30-Aug) — the holiday
  // row (27-Aug) must be skipped entirely, not treated as "the prior day".
  assert.equal(snapshot.latestDateIso.slice(0, 10), "2027-08-31");
  assert.equal(snapshot.priorDateIso.slice(0, 10), "2027-08-30");
  assert.equal(snapshot.latestTonnes, 1042.36);
  assert.equal(snapshot.priorTonnes, 1046.64);

  const delta = snapshot.latestTonnes - snapshot.priorTonnes;
  assert.ok(Math.abs(delta - -4.28) < 1e-9, `expected a -4.28 tonne delta, got ${delta}`);
});

test("deriveGldSnapshotFromRows: throws (never returns a guessed delta) when fewer than 2 real trading rows are present", () => {
  assert.throws(() => deriveGldSnapshotFromRows([{ dateIso: "2027-08-31T00:00:00.000Z", tonnesOfGold: 1042.36 }]));
  assert.throws(() =>
    deriveGldSnapshotFromRows([
      { dateIso: "2027-08-27T00:00:00.000Z", tonnesOfGold: null },
      { dateIso: "2027-08-31T00:00:00.000Z", tonnesOfGold: 1042.36 },
    ])
  );
});
