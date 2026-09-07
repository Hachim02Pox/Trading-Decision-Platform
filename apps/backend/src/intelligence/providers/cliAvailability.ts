import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { resolveCliExecutable } from "./cliExecutableResolver";

// "Is this CLI provider available" — deliberately NOT an env var (unlike
// OPENAI_API_KEY/ANTHROPIC_API_KEY/GEMINI_API_KEY). Availability means: (a)
// the CLI binary actually resolves, and (b) it already has a valid,
// subscription-authenticated session — never a metered API key. Computed
// once per process and cached (see the module-level caches below), because
// the underlying checks below are cheap but not free (a short-timeout
// subprocess for Codex) and this feature must never re-pay that cost on
// every single on-demand click.
//
// Both checks are wrapped so a missing/misconfigured CLI NEVER throws or
// hangs the server: any error, non-zero exit, timeout, or unexpected output
// shape is treated as simply "not available" (fail closed), exactly like
// config/env.ts treats a missing API key as `null` rather than crashing.

const VERSION_CHECK_TIMEOUT_MS = 5_000;
const DOCTOR_CHECK_TIMEOUT_MS = 8_000;

function computeClaudeCliAvailable(): boolean {
  const resolved = resolveCliExecutable("claude");
  if (!resolved) return false;
  try {
    // Cheap non-interactive liveness check — confirms the binary actually
    // runs (not just that a file with this name exists on PATH).
    execFileSync(resolved.command, [...resolved.prefixArgs, "--version"], {
      timeout: VERSION_CHECK_TIMEOUT_MS,
      windowsHide: true,
      stdio: ["ignore", "ignore", "ignore"],
    });
  } catch {
    return false;
  }

  // Authentication check: Claude Code's own OAuth credential store. A
  // subscription-authenticated session has a `claudeAiOauth.subscriptionType`
  // (e.g. "pro"/"max") — a bare API-key-only setup never populates this file
  // the same way, and no file at all means never-logged-in. Only existence
  // and shape are inspected here — the token values themselves are never
  // read into any log or response.
  try {
    const credentialsPath = path.join(os.homedir(), ".claude", ".credentials.json");
    if (!existsSync(credentialsPath)) return false;
    const parsed = JSON.parse(readFileSync(credentialsPath, "utf8")) as {
      claudeAiOauth?: { subscriptionType?: unknown };
    };
    return typeof parsed.claudeAiOauth?.subscriptionType === "string" && parsed.claudeAiOauth.subscriptionType.length > 0;
  } catch {
    return false;
  }
}

interface CodexDoctorReport {
  checks?: Record<string, { status?: string } | undefined>;
}

function computeCodexCliAvailable(): boolean {
  const resolved = resolveCliExecutable("codex");
  if (!resolved) return false;
  try {
    // `codex doctor --json` reports a redacted, machine-parseable health
    // report including an `auth.credentials` check — the cleanest available
    // single signal for "is this installation actually logged in" without
    // hand-parsing codex's own auth storage format.
    const raw = execFileSync(resolved.command, [...resolved.prefixArgs, "doctor", "--json"], {
      timeout: DOCTOR_CHECK_TIMEOUT_MS,
      windowsHide: true,
      stdio: ["ignore", "pipe", "ignore"],
      encoding: "utf8",
    });
    const report = JSON.parse(raw) as CodexDoctorReport;
    return report.checks?.["auth.credentials"]?.status === "ok";
  } catch {
    return false;
  }
}

let claudeAvailableCache: boolean | null = null;
let codexAvailableCache: boolean | null = null;

export function isClaudeCliAvailable(): boolean {
  if (claudeAvailableCache === null) claudeAvailableCache = computeClaudeCliAvailable();
  return claudeAvailableCache;
}

export function isCodexCliAvailable(): boolean {
  if (codexAvailableCache === null) codexAvailableCache = computeCodexCliAvailable();
  return codexAvailableCache;
}

/**
 * Test-only escape hatch. Pass `null` for either argument to clear that
 * provider's cache (forcing the real, machine-dependent check to run again
 * next call) — pass `true`/`false` to force a deterministic value so tests
 * never depend on, or accidentally trigger, a real subprocess/credential
 * check.
 */
export function __setCliAvailabilityForTests(claude: boolean | null, codex: boolean | null): void {
  claudeAvailableCache = claude;
  codexAvailableCache = codex;
}
