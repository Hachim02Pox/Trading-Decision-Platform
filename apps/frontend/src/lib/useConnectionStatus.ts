"use client";

import { useEffect, useState } from "react";

// Milestone 1E, section 9 — truthful status bar connection state, replacing
// the previously-hardcoded "Connected" caption. Derived from a lightweight
// periodic /health poll rather than the market-snapshot fetch lifecycle:
// the market snapshot is fetched once per page load/language change, which
// is far too infrequent to reflect real-time backend reachability.
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4001";
const POLL_INTERVAL_MS = 15_000;

export type ConnectionStatus = "CONNECTED" | "DISCONNECTED" | "RECONNECTING";

export function resolveConnectionPoll(
  currentFailures: number,
  succeeded: boolean
): { failures: number; status: ConnectionStatus } {
  if (succeeded) return { failures: 0, status: "CONNECTED" };
  const failures = currentFailures + 1;
  return { failures, status: failures > 1 ? "DISCONNECTED" : "RECONNECTING" };
}

export function useConnectionStatus(): ConnectionStatus {
  const [status, setStatus] = useState<ConnectionStatus>("RECONNECTING");

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let consecutiveFailures = 0;

    async function poll() {
      try {
        const res = await fetch(`${BACKEND_URL}/health`, { cache: "no-store" });
        if (!res.ok) throw new Error(String(res.status));
        if (!cancelled) {
          const next = resolveConnectionPoll(consecutiveFailures, true);
          consecutiveFailures = next.failures;
          setStatus(next.status);
        }
      } catch {
        if (!cancelled) {
          const next = resolveConnectionPoll(consecutiveFailures, false);
          consecutiveFailures = next.failures;
          setStatus(next.status);
        }
      } finally {
        if (!cancelled) timer = setTimeout(poll, POLL_INTERVAL_MS);
      }
    }

    void poll();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, []);

  return status;
}
