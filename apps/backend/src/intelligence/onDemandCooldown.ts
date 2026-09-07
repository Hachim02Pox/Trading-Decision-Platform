// Cost/spam guard for the on-demand per-KPI "Analyze with AI" button
// (onDemandAnalysis.ts). Deliberately simple per the product-owner's scope:
// an in-memory per-(kpiId, language) last-triggered timestamp, NOT a
// persistent server-side rate-limit table. A process restart resets every
// cooldown, which is fine — the guard exists only to stop an accidental
// double-click from firing two paid analyses in quick succession, not to
// enforce a long-lived budget.

export const ON_DEMAND_COOLDOWN_MS = 45_000;

const lastTriggeredAtByKey = new Map<string, number>();

export interface CooldownCheckResult {
  allowed: boolean;
  /** 0 when allowed; otherwise how many milliseconds remain before this key may trigger again. */
  remainingMs: number;
}

/**
 * Checks whether `key` (an already-namespaced `${kpiId}::${language}` string
 * — see onDemandAnalysis.ts) is past its cooldown, and if so, immediately
 * records `now` as the new last-triggered timestamp (so a caller never needs
 * a separate "start" call — check-and-start is atomic within this
 * single-threaded module). `cooldownMs` defaults to `ON_DEMAND_COOLDOWN_MS`
 * (the per-KPI/per-family button's 45s) but callers with a much heavier
 * operation (see globalReadAnalysis.ts/goldOvernightAnalysis.ts) pass their
 * own, longer value — the same shared last-triggered map works for any key
 * namespace as long as keys never collide across features.
 */
export function checkAndStartCooldown(key: string, now: number = Date.now(), cooldownMs: number = ON_DEMAND_COOLDOWN_MS): CooldownCheckResult {
  const last = lastTriggeredAtByKey.get(key);
  if (last !== undefined) {
    const elapsed = now - last;
    if (elapsed < cooldownMs) {
      return { allowed: false, remainingMs: cooldownMs - elapsed };
    }
  }
  lastTriggeredAtByKey.set(key, now);
  return { allowed: true, remainingMs: 0 };
}

/** Test-only escape hatch. */
export function __resetOnDemandCooldownForTests(): void {
  lastTriggeredAtByKey.clear();
}
