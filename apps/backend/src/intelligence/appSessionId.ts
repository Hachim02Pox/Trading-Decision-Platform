import { randomUUID } from "node:crypto";

// Patch 3 — deterministic APP_SESSION_ID, replacing any heartbeat/timing
// heuristic. The root `npm run dev` wrapper (scripts/with-session-id.js)
// generates one session id and sets it as APP_SESSION_ID before spawning
// concurrently/tsx — that value survives a `tsx watch` restart because
// tsx watch only restarts THIS process, not the wrapper that set the env
// var. If this workspace's dev script is run standalone (bypassing the
// root wrapper), APP_SESSION_ID is unset, so we generate one on the spot
// and warn loudly — see docs/KPI_INTELLIGENCE_ARCHITECTURE.md.
export function resolveAppSessionId(): string {
  const fromEnv = process.env.APP_SESSION_ID;
  if (fromEnv && fromEnv.trim().length > 0) {
    return fromEnv;
  }

  const generated = randomUUID();
  // eslint-disable-next-line no-console
  console.warn(
    `[gold-terminal-backend] APP_SESSION_ID was not set — this workspace was not started via ` +
      `the root "npm run dev" wrapper (scripts/with-session-id.js). Generated a standalone ` +
      `session id for this process: ${generated}. Every restart of this process (e.g. tsx ` +
      `watch) will therefore look like a NEW session and re-run startup analysis.`
  );
  return generated;
}
