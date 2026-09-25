// Pure, dependency-free discovery logic for the unified Gold market-state
// Drive folder (Sunday Reads V2/V3 + intermediate recaps) — mirrors
// apps/backend/src/sundayRead/ingestion/discovery.ts's separation of pure
// grouping logic from I/O. Unlike the legacy Sunday-only discovery, a run_id
// here is NOT grouped by calendar date (an INTERMEDIATE run can share its
// Sunday's calendar week, and several intermediates can exist in the same
// week) — every JSON file is its own independent candidate.
//
// Filenames are ONLY used to decide whether a file is even worth downloading
// (cheap defense-in-depth) — they are never trusted for validity. The real
// gate is the content check in ingest.ts: meta.document_type ===
// "GOLD_MARKET_STATE" and meta.frontend_eligible === true for any document
// carrying meta.run_type, plus full schema validation via validateFinalRead.

export interface DriveFileRef {
  id: string;
  name: string;
  modifiedTime: string;
}

export type GoldStateCandidateKind = "SUNDAY_FILENAME" | "INTERMEDIATE_FILENAME";

export interface GoldStateCandidate {
  /** Filename without its .json extension — used only as a stable dedupe/log key, never as the document's identity (meta.run_id is). */
  key: string;
  json: DriveFileRef;
  /** Best-effort companion Markdown report with the exact same basename, if present. */
  markdown?: DriveFileRef;
  kind: GoldStateCandidateKind;
}

// An exceptional/corrective Sunday retains the date and an immutable suffix.
// The JSON metadata, not that suffix, remains the authority on run identity.
const SUNDAY_JSON_RE = /^sunday_read_\d{4}-\d{2}-\d{2}(?:_[a-z0-9][a-z0-9_-]*)?\.json$/i;
const INTERMEDIATE_JSON_RE = /^gold_intermediate_\d{4}-\d{2}-\d{2}_\d+\.json$/i;

// Explicitly-excluded filename shapes — operational/audit artifacts that
// must NEVER be treated as a market-state candidate even if a bug elsewhere
// caused one to be uploaded to the Output folder instead of the Control
// folder. This is defense-in-depth; the Output/Control folder split (see
// config/env.ts's GoldDriveConfig) is the primary safeguard.
const EXCLUDED_NAME_RE = [/^NEXT_GOLD_RECAP/i, /HANDOFF/i, /^RUN_REPORT_/i, /^VALIDATION_REPORT_/i];

/** Every JSON file in the folder that matches a known Gold market-state filename shape, newest key first, each paired with its same-basename Markdown companion when one exists. */
export function listGoldStateCandidates(files: readonly DriveFileRef[]): GoldStateCandidate[] {
  const markdownByBase = new Map<string, DriveFileRef>();
  for (const file of files) {
    if (/\.md$/i.test(file.name)) markdownByBase.set(file.name.replace(/\.md$/i, "").toLowerCase(), file);
  }

  const candidates: GoldStateCandidate[] = [];
  for (const file of files) {
    if (!/\.json$/i.test(file.name)) continue;
    if (EXCLUDED_NAME_RE.some((re) => re.test(file.name))) continue;

    let kind: GoldStateCandidateKind | null = null;
    if (SUNDAY_JSON_RE.test(file.name)) kind = "SUNDAY_FILENAME";
    else if (INTERMEDIATE_JSON_RE.test(file.name)) kind = "INTERMEDIATE_FILENAME";
    if (!kind) continue;

    const base = file.name.replace(/\.json$/i, "");
    candidates.push({ key: base, json: file, markdown: markdownByBase.get(base.toLowerCase()), kind });
  }

  return candidates.sort((a, b) => (a.key < b.key ? 1 : -1));
}
