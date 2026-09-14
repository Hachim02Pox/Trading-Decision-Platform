import { runTrackedIngestion } from "../../db/ingestionRunner";
import {
  findExistingByRunDateAndHash,
  findLatestForRunDate,
  insertSundayReadRow,
  publishSundayReadRow,
} from "../../db/sundayReads";
import { validateFinalRead, type FinalRead } from "../schema";
import { downloadDriveFileText, listSundayReadDriveFiles } from "./driveClient";
import { candidateRunDatesNewestFirst, groupDriveFilesByRunDate, type RunDateFileGroup } from "./discovery";
import { sha256Hex } from "./hash";

// The production Sunday Read ingestion pipeline: Drive -> validate -> DB ->
// publish. This is the ONLY code path allowed to move a Drive candidate into
// `sunday_reads`. Every step follows this codebase's existing conventions:
// - wrapped in runTrackedIngestion (ingestion_state bookkeeping, like F13
//   calendar ingestion — see jobs/f13CalendarIngestion.ts)
// - a same-process single-flight guard on top of that (two near-simultaneous
//   triggers of the cron/internal endpoint never race each other)
// - never throws past the job-level wrapper for a single bad candidate —
//   only a genuine Drive/DB-layer failure (listing files, downloading the
//   JSON, or the DB itself) bubbles up and fails the whole job; a single
//   malformed/invalid CANDIDATE is recorded as REJECTED and processing
//   continues with the next run_date.
// - a previously PUBLISHED run is NEVER touched by a failing or rejected
//   candidate — publication only happens after full validation succeeds,
//   inside publishSundayReadRow's transaction (see db/sundayReads.ts).

export const SUNDAY_READ_INGEST_JOB_KEY = "sunday-read:drive-sync";

// How many of the newest run_dates (with a JSON candidate) to consider per
// poll — comfortably covers "this week's run, plus a late-arriving or
// corrected previous week's run", without unbounded work if the Drive folder
// accumulates many historical files.
const MAX_RUN_DATES_PER_POLL = 6;

export type SundayReadRunOutcome =
  | { runDate: string; outcome: "PUBLISHED" }
  | { runDate: string; outcome: "ALREADY_PUBLISHED" }
  | { runDate: string; outcome: "REJECTED"; reason: string }
  | { runDate: string; outcome: "SKIPPED_NO_CHANGE" }
  | { runDate: string; outcome: "SKIPPED_MISSING_JSON" };

export interface SundayReadIngestionSummary {
  filesSeen: number;
  runDatesConsidered: number;
  runs: SundayReadRunOutcome[];
}

function log(event: string, fields: Record<string, unknown> = {}): void {
  // Structured, single-line logs — never includes secrets or raw Drive
  // credentials/tokens, only run_date/file-id/status-shaped fields.
  console.log(JSON.stringify({ scope: "sunday-read-ingestion", event, ...fields, at: new Date().toISOString() }));
}

/** Never a full stack trace, never a secret — matches ingestion_state.last_error's contract (see db/ingestionState.ts) and this codebase's toSafeErrorMessage convention. */
function safeErrorMessage(err: unknown): string {
  const message = err instanceof Error ? err.message : String(err);
  return message.split("\n")[0].slice(0, 300);
}

/** Injectable Drive I/O — defaults to the real client (driveClient.ts); tests supply fakes so this suite never makes a live Google API call. Mirrors jobs/f13CalendarIngestion.ts's `deps.fetchRaw` convention. */
export interface SundayReadIngestionDeps {
  listFiles?: () => Promise<import("./discovery").DriveFileRef[]>;
  downloadFileText?: (fileId: string) => Promise<string>;
}

async function processRunDateGroup(group: RunDateFileGroup, deps: Required<SundayReadIngestionDeps>): Promise<SundayReadRunOutcome> {
  const { runDate, json, markdown, runReport: runReportFile, validationReport: validationReportFile } = group;
  if (!json) return { runDate, outcome: "SKIPPED_MISSING_JSON" };

  log("candidate_file_found", { runDate, driveJsonFileId: json.id, modifiedTime: json.modifiedTime });

  // Cheap skip: if we've already fully resolved this EXACT Drive file version
  // (same file id + modifiedTime) to a terminal state, don't re-download.
  const latestKnown = await findLatestForRunDate(runDate);
  if (
    latestKnown &&
    latestKnown.driveJsonFileId === json.id &&
    latestKnown.driveJsonModifiedTime === json.modifiedTime &&
    (latestKnown.status === "PUBLISHED" || latestKnown.status === "REJECTED")
  ) {
    log("skip_unchanged_file_version", { runDate, status: latestKnown.status });
    return latestKnown.status === "PUBLISHED"
      ? { runDate, outcome: "ALREADY_PUBLISHED" }
      : { runDate, outcome: "REJECTED", reason: latestKnown.errorMessage ?? "Previously rejected." };
  }

  // A download failure here bubbles up to the job-level runTrackedIngestion
  // wrapper (recorded against ingestion_state, job fails) — published state
  // is completely untouched, satisfying "Drive unavailable -> current
  // production run remains untouched."
  const rawText = await deps.downloadFileText(json.id);
  const contentHash = sha256Hex(rawText);
  log("downloaded", { runDate, contentHash, bytes: rawText.length });

  const existing = await findExistingByRunDateAndHash(runDate, contentHash);
  if (existing) {
    log("duplicate_content_hash", { runDate, contentHash, status: existing.status });
    if (existing.status === "PUBLISHED") return { runDate, outcome: "ALREADY_PUBLISHED" };
    if (existing.status === "REJECTED") return { runDate, outcome: "REJECTED", reason: existing.errorMessage ?? "Previously rejected." };
    // status === "VALID": a prior attempt validated but never finished
    // publishing (e.g. a transient DB error) — retry the publish step only.
    await publishSundayReadRow(existing.id, runDate);
    log("published", { runDate, contentHash });
    return { runDate, outcome: "PUBLISHED" };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawText);
  } catch (err) {
    const errorMessage = safeErrorMessage(err);
    await insertSundayReadRow({
      runDate,
      contentHash,
      status: "REJECTED",
      dataMode: null,
      generatedAt: null,
      asOf: null,
      jsonPayload: null,
      humanReport: null,
      runReport: null,
      validationReport: null,
      driveJsonFileId: json.id,
      driveJsonModifiedTime: json.modifiedTime,
      driveMarkdownFileId: markdown?.id ?? null,
      driveRunReportFileId: runReportFile?.id ?? null,
      driveValidationReportFileId: validationReportFile?.id ?? null,
      errorCode: "INVALID_JSON",
      errorMessage,
    });
    log("rejected", { runDate, code: "INVALID_JSON", errorMessage });
    return { runDate, outcome: "REJECTED", reason: "Invalid JSON syntax." };
  }

  const read = parsed as Partial<FinalRead>;
  const dataMode = read.meta?.data_mode ?? null;

  const rejectStructural = async (code: string, message: string): Promise<SundayReadRunOutcome> => {
    await insertSundayReadRow({
      runDate,
      contentHash,
      status: "REJECTED",
      dataMode,
      generatedAt: read.meta?.generated_at ?? null,
      asOf: read.meta?.as_of ?? null,
      jsonPayload: parsed,
      humanReport: null,
      runReport: null,
      validationReport: null,
      driveJsonFileId: json.id,
      driveJsonModifiedTime: json.modifiedTime,
      driveMarkdownFileId: markdown?.id ?? null,
      driveRunReportFileId: runReportFile?.id ?? null,
      driveValidationReportFileId: validationReportFile?.id ?? null,
      errorCode: code,
      errorMessage: message,
    });
    log("rejected", { runDate, code, message });
    return { runDate, outcome: "REJECTED", reason: message };
  };

  // Layer 1: canonical schema/structural validation — REUSES the existing
  // validator (schema.ts's validateFinalRead), never a competing/duplicate
  // one. This already enforces required sections and the
  // ASYMMETRY_GATE-before-directional-TERMINAL scenario-tree invariant.
  const schemaErrors = validateFinalRead(parsed);
  if (schemaErrors.length > 0) {
    return rejectStructural("SCHEMA_INVALID", schemaErrors.join("; ").slice(0, 480));
  }

  // Layer 2: data_mode gate — a FIXTURE/demo run must never auto-publish to
  // production, regardless of how structurally valid it is. PARTIAL/UNKNOWN
  // evidence status elsewhere in the document is explicitly NOT a rejection
  // reason (see meta.status, priced_in.status, evidence[].status — none of
  // those are checked here on purpose).
  if (dataMode !== "REAL") {
    return rejectStructural("DATA_MODE_NOT_REAL", `Refusing to publish a non-REAL run (data_mode=${String(dataMode)}).`);
  }

  // NOTE: an earlier revision of this function also rejected a run when
  // meta.week_of didn't exactly equal the Drive filename's run_date. Removed
  // (2026-09-14, live-confirmed against a real Work-generated run) —
  // meta.week_of is a "week of" date RANGE (e.g. "2026-09-07/2026-09-11",
  // the Mon-Fri trading week the read reflects), not the Sunday run_date
  // itself, so that check was rejecting genuinely valid real runs based on a
  // wrong assumption, not an actual data-integrity problem.

  // Best-effort companion Markdown reports — audit/debugging only, never
  // block publication (the JSON remains the sole source of truth).
  const [humanReport, runReportText, validationReportText] = await Promise.all([
    markdown
      ? deps.downloadFileText(markdown.id).catch((err) => {
          log("markdown_download_failed", { runDate, which: "sunday_read_md", error: safeErrorMessage(err) });
          return null;
        })
      : Promise.resolve(null),
    runReportFile
      ? deps.downloadFileText(runReportFile.id).catch((err) => {
          log("markdown_download_failed", { runDate, which: "run_report", error: safeErrorMessage(err) });
          return null;
        })
      : Promise.resolve(null),
    validationReportFile
      ? deps.downloadFileText(validationReportFile.id).catch((err) => {
          log("markdown_download_failed", { runDate, which: "validation_report", error: safeErrorMessage(err) });
          return null;
        })
      : Promise.resolve(null),
  ]);

  const row = await insertSundayReadRow({
    runDate,
    contentHash,
    status: "VALID",
    dataMode,
    generatedAt: read.meta?.generated_at ?? null,
    asOf: read.meta?.as_of ?? null,
    jsonPayload: parsed,
    humanReport,
    runReport: runReportText,
    validationReport: validationReportText,
    driveJsonFileId: json.id,
    driveJsonModifiedTime: json.modifiedTime,
    driveMarkdownFileId: markdown?.id ?? null,
    driveRunReportFileId: runReportFile?.id ?? null,
    driveValidationReportFileId: validationReportFile?.id ?? null,
    errorCode: null,
    errorMessage: null,
  });
  log("valid", { runDate, contentHash });

  await publishSundayReadRow(row.id, runDate);
  log("published", { runDate, contentHash });

  return { runDate, outcome: "PUBLISHED" };
}

async function discoverAndProcess(deps: Required<SundayReadIngestionDeps>): Promise<SundayReadIngestionSummary> {
  const files = await deps.listFiles();
  log("drive_listed", { fileCount: files.length });

  const groups = groupDriveFilesByRunDate(files);
  const candidates = candidateRunDatesNewestFirst(groups).slice(0, MAX_RUN_DATES_PER_POLL);

  const runs: SundayReadRunOutcome[] = [];
  for (const group of candidates) {
    // Sequential on purpose: at most a handful of weekly runs per poll, and
    // each one's DB writes (supersede + publish) are easier to reason about
    // without concurrent interleaving.
    // eslint-disable-next-line no-await-in-loop
    runs.push(await processRunDateGroup(group, deps));
  }

  return { filesSeen: files.length, runDatesConsidered: candidates.length, runs };
}

// Same-process single-flight guard on top of runTrackedIngestion's
// cross-process ingestion_state bookkeeping — mirrors
// jobs/f13CalendarIngestion.ts's runF13CalendarIngestion.
let inFlight: Promise<SundayReadIngestionSummary> | null = null;

export async function runSundayReadDriveIngestion(deps: SundayReadIngestionDeps = {}): Promise<SundayReadIngestionSummary> {
  if (inFlight) return inFlight;

  const resolvedDeps: Required<SundayReadIngestionDeps> = {
    listFiles: deps.listFiles ?? listSundayReadDriveFiles,
    downloadFileText: deps.downloadFileText ?? downloadDriveFileText,
  };

  const task = runTrackedIngestion(SUNDAY_READ_INGEST_JOB_KEY, () => discoverAndProcess(resolvedDeps));
  inFlight = task;
  try {
    return await task;
  } finally {
    inFlight = null;
  }
}
