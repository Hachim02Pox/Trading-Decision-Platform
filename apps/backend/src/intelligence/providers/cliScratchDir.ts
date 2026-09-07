import { mkdirSync } from "node:fs";
import os from "node:os";
import path from "node:path";

// CLI-provider subprocess safety — working-directory isolation. Every
// claude/codex CLI subprocess this feature spawns runs with its CWD set to
// this dedicated scratch directory (created once, under the OS temp
// directory) — NEVER this repo's root and never any path inside it. This is
// what makes it structurally impossible for the CLI's own tool use to see
// (or, per the separate tool-restriction safeguard, ever attempt to write
// to) this codebase: the process simply has no ambient filesystem context
// pointing at it. Everything the CLI is meant to "see" about a KPI is
// passed explicitly in the prompt text instead.

let cachedScratchDir: string | null = null;

export function getCliScratchDir(): string {
  if (cachedScratchDir) return cachedScratchDir;
  const dir = path.join(os.tmpdir(), "gold-terminal-cli-scratch");
  mkdirSync(dir, { recursive: true });
  cachedScratchDir = dir;
  return dir;
}

/** Test-only escape hatch. */
export function __resetCliScratchDirForTests(): void {
  cachedScratchDir = null;
}
