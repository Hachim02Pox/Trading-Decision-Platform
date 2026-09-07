import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

// CLI-provider subprocess safety — executable resolution. Node's
// `child_process.spawn`/`execFileSync` cannot spawn a Windows npm shim
// (`<name>.cmd`) without `shell: true` (it throws EINVAL) — and `shell:
// true` string-concatenates argv instead of passing it as a safe array,
// which is exactly the shell-injection risk this feature must never
// introduce (a KPI's context data — labels, values, research topics — is
// never fully trusted, so it must never pass through a shell). This module
// resolves the REAL underlying entry point once per process (cached by the
// caller) so every actual invocation still goes through `spawn(command,
// args)` with `shell` left `false`.
//
// Resolution order, per binary name (e.g. "claude", "codex"):
//   1. A directly-spawnable native executable on PATH (`<name>.exe` on
//      Windows, or the bare name elsewhere / if already an .exe) — this is
//      what Claude Code's own installer produces, so this path is taken
//      for "claude" and needs no shim parsing at all.
//   2. Windows only: a `<name>.cmd` npm shim on PATH. Its generated content
//      always ends with `"%dp0%\<relative-js-path>" %*` — parsed with a
//      narrow regex (never executed, never passed to a shell) to recover
//      the actual JS entry point, which is then run via `process.execPath`
//      (the same node.exe already running this server) — still a plain
//      argv array, still no shell.
//   3. Last resort: the bare binary name, in case the OS loader can resolve
//      it directly (e.g. a Unix shebang script) — `spawn` will report
//      ENOENT if not, which callers already handle as "unavailable".

export interface ResolvedCliExecutable {
  /** The actual argv[0] to spawn — never a `.cmd`/`.bat` shim path. */
  command: string;
  /** Arguments that must precede the caller's own args (e.g. the shim's JS entry file when invoked via node.exe). */
  prefixArgs: string[];
}

function findOnPath(basename: string): string | null {
  const pathEnv = process.env.PATH ?? process.env.Path ?? "";
  const dirs = pathEnv.split(path.delimiter).filter((d) => d.length > 0);
  for (const dir of dirs) {
    const candidate = path.join(dir, basename);
    if (existsSync(candidate)) return candidate;
  }
  return null;
}

/**
 * Parses an npm-generated Windows `.cmd` shim's content to recover the
 * relative path (from the shim's own directory) of the JS file it ultimately
 * invokes via node.exe. Returns null if the shim doesn't match the expected
 * npm-generated shape — callers must treat that as "could not resolve",
 * never guess further.
 */
export function parseNpmCmdShimEntry(shimContents: string): string | null {
  const match = shimContents.match(/"%dp0%\\(.+?)"\s+%\*/);
  return match ? match[1] : null;
}

export function resolveCliExecutable(binaryName: string): ResolvedCliExecutable | null {
  const exeCandidate = process.platform === "win32" ? findOnPath(`${binaryName}.exe`) : findOnPath(binaryName);
  if (exeCandidate) return { command: exeCandidate, prefixArgs: [] };

  if (process.platform === "win32") {
    const cmdCandidate = findOnPath(`${binaryName}.cmd`);
    if (cmdCandidate) {
      try {
        const contents = readFileSync(cmdCandidate, "utf8");
        const relativeJsPath = parseNpmCmdShimEntry(contents);
        if (relativeJsPath) {
          const jsPath = path.join(path.dirname(cmdCandidate), relativeJsPath);
          if (existsSync(jsPath)) return { command: process.execPath, prefixArgs: [jsPath] };
        }
      } catch {
        // Fall through to the last-resort bare-name attempt below.
      }
    }
  }

  // Last resort — let spawn's own ENOENT (if any) surface as "unavailable".
  return { command: binaryName, prefixArgs: [] };
}
