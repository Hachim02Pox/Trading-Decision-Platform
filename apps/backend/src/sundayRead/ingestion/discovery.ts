// Pure, dependency-free grouping logic for Drive discovery — deliberately
// separated from driveClient.ts's I/O so it can be unit-tested with
// fabricated file lists (see tests/sunday-read-ingestion.test.ts). The
// ingestion pipeline MUST NOT rely on filenames alone for trust (schema/
// data_mode validation in ingest.ts is the real gate) — this module only
// uses filenames to figure out WHICH run_date a given Drive file belongs to.

export interface DriveFileRef {
  id: string;
  name: string;
  modifiedTime: string;
}

export interface RunDateFileGroup {
  runDate: string;
  json?: DriveFileRef;
  markdown?: DriveFileRef;
  runReport?: DriveFileRef;
  validationReport?: DriveFileRef;
}

const JSON_RE = /^sunday_read_(\d{4}-\d{2}-\d{2})\.json$/i;
const MARKDOWN_RE = /^SUNDAY_READ_(\d{4}-\d{2}-\d{2})\.md$/i;
const RUN_REPORT_RE = /^RUN_REPORT_(\d{4}-\d{2}-\d{2})\.md$/i;
const VALIDATION_REPORT_RE = /^VALIDATION_REPORT_(\d{4}-\d{2}-\d{2})\.md$/i;

/** Rejects a syntactically YYYY-MM-DD but calendar-invalid date (e.g. 2026-02-30) rather than silently accepting it as a run_date. */
function isValidCalendarDate(dateStr: string): boolean {
  const parsed = new Date(`${dateStr}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === dateStr;
}

type FileSlot = "json" | "markdown" | "runReport" | "validationReport";

/** Groups Drive files by the run_date encoded in their filename, across the four expected artifact kinds. Files that match no known pattern are ignored (never crash discovery). */
export function groupDriveFilesByRunDate(files: readonly DriveFileRef[]): Map<string, RunDateFileGroup> {
  const groups = new Map<string, RunDateFileGroup>();

  const assign = (regex: RegExp, slot: FileSlot) => {
    for (const file of files) {
      const match = regex.exec(file.name);
      if (!match) continue;
      const runDate = match[1];
      if (!isValidCalendarDate(runDate)) continue;
      const group = groups.get(runDate) ?? { runDate };
      group[slot] = file;
      groups.set(runDate, group);
    }
  };

  assign(JSON_RE, "json");
  assign(MARKDOWN_RE, "markdown");
  assign(RUN_REPORT_RE, "runReport");
  assign(VALIDATION_REPORT_RE, "validationReport");

  return groups;
}

/** Only groups that actually have a JSON candidate, newest run_date first — a group with only Markdown reports (JSON not yet uploaded, e.g. Work is still running) is not a candidate. */
export function candidateRunDatesNewestFirst(groups: Map<string, RunDateFileGroup>): RunDateFileGroup[] {
  return [...groups.values()].filter((group) => group.json).sort((a, b) => (a.runDate < b.runDate ? 1 : -1));
}
