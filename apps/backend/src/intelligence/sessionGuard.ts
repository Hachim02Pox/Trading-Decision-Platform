import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

// Patch 3 — simple, fully deterministic session check, replacing any
// previously-planned heartbeat-based guard. `.runtime/` is an ephemeral
// dev/session cache (Patch 4) — see docs/KPI_INTELLIGENCE_ARCHITECTURE.md.
// Never durable storage; that role belongs to MySQL once persistence is
// implemented (not this milestone).
//
// Deliberately anchored to the repo root via __dirname rather than
// process.cwd(): `npm run dev --workspace apps/backend` sets cwd to
// apps/backend, not the repo root, so a cwd-relative path would create
// apps/backend/.runtime/ — INSIDE the directory tree `tsx watch` watches,
// which would make our own writes to .runtime/*.json trigger spurious
// watch restarts. This file lives at apps/backend/src/intelligence/ (4
// path segments below the repo root), so four levels up is the repo root
// in both dev (tsx running from src/) and prod (compiled to dist/, same
// relative depth: apps/backend/dist/intelligence).
export const RUNTIME_DIR = join(__dirname, "..", "..", "..", "..", ".runtime");
const SESSION_FILE = join(RUNTIME_DIR, "session.json");

export interface SessionRecord {
  sessionId: string;
  startupAnalysisCompletedAt: string | null;
  runtimeSignature?: string;
}

function ensureRuntimeDir(): void {
  if (!existsSync(RUNTIME_DIR)) {
    mkdirSync(RUNTIME_DIR, { recursive: true });
  }
}

function readSessionRecord(): SessionRecord | null {
  if (!existsSync(SESSION_FILE)) return null;
  try {
    const raw = readFileSync(SESSION_FILE, "utf-8");
    return JSON.parse(raw) as SessionRecord;
  } catch (err) {
    // Corrupt/partial file — recover by treating it as "no prior session"
    // (a fresh/new session) rather than crashing, but this must never be a
    // *silent* recovery — emit a structured warning so a malformed
    // .runtime/*.json is observable (Milestone 1E, section 16).
    console.warn(
      JSON.stringify({
        msg: "malformed runtime state, regenerating",
        file: SESSION_FILE,
        error: err instanceof Error ? err.message : String(err),
      })
    );
    return null;
  }
}

export interface SessionGuardResult {
  isNewSession: boolean;
  sessionId: string;
  previous: SessionRecord | null;
}

/**
 * If `storedSessionId === currentSessionId` (the APP_SESSION_ID just read),
 * this is the same logical session (hot reload, or a request within the
 * same run) — the caller should NOT re-run startup analysis and should
 * reuse whatever is cached in .runtime/interpretations.json. Otherwise
 * (different id, or no file yet) this is a new session and the caller
 * should run startup analysis and then call `writeSessionRecord`.
 */
export function checkSession(currentSessionId: string, runtimeSignature = "legacy"): SessionGuardResult {
  ensureRuntimeDir();
  const previous = readSessionRecord();
  const isNewSession = previous === null || previous.sessionId !== currentSessionId || previous.runtimeSignature !== runtimeSignature;
  return { isNewSession, sessionId: currentSessionId, previous };
}

export function writeSessionRecord(sessionId: string, startupAnalysisCompletedAt: string, runtimeSignature = "legacy"): void {
  ensureRuntimeDir();
  const record: SessionRecord = { sessionId, startupAnalysisCompletedAt, runtimeSignature };
  writeFileSync(SESSION_FILE, JSON.stringify(record, null, 2), "utf-8");
}
