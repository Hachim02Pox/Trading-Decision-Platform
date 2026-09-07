#!/usr/bin/env node
// Patch 3 — deterministic APP_SESSION_ID wrapper.
//
// Generates ONE session id per invocation of this script, sets it as
// process.env.APP_SESSION_ID, then spawns the command passed after `--`
// (inheriting { ...process.env }, so the new var is visible to every
// descendant process). This makes APP_SESSION_ID stable across a `tsx
// watch` restart of the backend (tsx watch only restarts its own child
// process, not this wrapper, so the inherited env var persists) but
// freshly generated every time a human actually re-runs `npm run dev`
// from a stopped state.
//
// Usage: node scripts/with-session-id.js -- <command> [args...]

const { spawn } = require("node:child_process");
const { randomUUID } = require("node:crypto");

function parseArgs(argv) {
  const sepIndex = argv.indexOf("--");
  if (sepIndex === -1 || sepIndex === argv.length - 1) {
    console.error('Usage: node scripts/with-session-id.js -- "<command>" [args...]');
    process.exit(1);
  }
  return argv.slice(sepIndex + 1);
}

function main() {
  const commandArgs = parseArgs(process.argv.slice(2));
  const sessionId = randomUUID();

  console.log(`[with-session-id] APP_SESSION_ID=${sessionId}`);

  const env = { ...process.env, APP_SESSION_ID: sessionId };

  // The parent shell has already split commandArgs into the correct
  // tokens (a quoted sub-command like "npm run dev --workspace
  // apps/backend" arrives here as ONE array element containing spaces).
  // When re-spawning through a shell (needed so `concurrently` receives
  // its sub-commands as single arguments rather than being split again),
  // any token containing whitespace must be re-quoted — Node's
  // { shell: true } does NOT auto-quote array args, it simply
  // concatenates them, which silently re-splits unquoted multi-word
  // tokens on Windows (cmd.exe) and would misbehave on POSIX shells too.
  function quoteIfNeeded(token) {
    return /\s/.test(token) ? `"${token}"` : token;
  }

  const fullCommand = commandArgs.map(quoteIfNeeded).join(" ");
  const child = spawn(fullCommand, {
    env,
    stdio: "inherit",
    shell: true,
  });

  child.on("exit", (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal);
      return;
    }
    process.exit(code ?? 0);
  });

  child.on("error", (err) => {
    console.error("[with-session-id] failed to spawn child process:", err);
    process.exit(1);
  });
}

main();
