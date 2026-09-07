import { spawn } from "node:child_process";

// CLI-provider subprocess safety — the one place either CLI is actually
// spawned. Every safety constraint from the feature spec is enforced right
// here, structurally, not by convention:
//  - `shell` is never set to true — argv is always a plain array, so
//    nothing in a KPI's context data (labels, values, research topics —
//    never fully trusted) can be interpreted as shell syntax.
//  - `stdio[0]` (stdin) is always "ignore" — neither CLI is fed anything
//    over stdin, and this also avoids the Windows-specific hang where a
//    CLI that opportunistically reads "additional stdin" blocks forever on
//    an unclosed pipe (observed live while building this feature).
//  - A hard timeout always applies: on expiry the child is asked to exit
//    (SIGTERM) and force-killed (SIGKILL) shortly after if it hasn't, and
//    the caller gets back `timedOut: true` rather than a hang.
//  - This function NEVER throws and NEVER rejects — every outcome (clean
//    exit, non-zero exit, spawn error, timeout) resolves to a
//    `CliRunResult so callers uniformly treat any of them as "this
//    analyst's contribution failed for this run", never a crash of the
//    endpoint.

const FORCE_KILL_GRACE_MS = 3_000;

export interface CliInvocation {
  command: string;
  args: string[];
  cwd: string;
  timeoutMs: number;
}

export interface CliRunResult {
  stdout: string;
  stderr: string;
  /** null when the process never started (spawn error) or was killed. */
  exitCode: number | null;
  timedOut: boolean;
}

export function runCliSubprocess(invocation: CliInvocation): Promise<CliRunResult> {
  return new Promise((resolve) => {
    let settled = false;
    let stdout = "";
    let stderr = "";
    let timedOut = false;

    const child = spawn(invocation.command, invocation.args, {
      cwd: invocation.cwd,
      windowsHide: true,
      shell: false,
      stdio: ["ignore", "pipe", "pipe"],
    });

    const hardKillTimer = setTimeout(() => {
      try {
        child.kill("SIGKILL");
      } catch {
        // Process may already be gone — nothing further to do.
      }
    }, invocation.timeoutMs + FORCE_KILL_GRACE_MS);

    const timeoutTimer = setTimeout(() => {
      timedOut = true;
      try {
        child.kill("SIGTERM");
      } catch {
        // Process may already be gone — the hard-kill timer above is the backstop.
      }
    }, invocation.timeoutMs);

    const finish = (result: CliRunResult) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeoutTimer);
      clearTimeout(hardKillTimer);
      resolve(result);
    };

    child.stdout.on("data", (chunk: Buffer) => {
      stdout += chunk.toString("utf8");
    });
    child.stderr.on("data", (chunk: Buffer) => {
      stderr += chunk.toString("utf8");
    });
    child.on("error", (err) => {
      finish({ stdout, stderr: stderr.length > 0 ? `${stderr}\n${err.message}` : err.message, exitCode: null, timedOut });
    });
    child.on("close", (code) => {
      finish({ stdout, stderr, exitCode: code, timedOut });
    });
  });
}
