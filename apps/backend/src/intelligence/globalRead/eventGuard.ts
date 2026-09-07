import type { GlobalReadCatalyst, GlobalReadDecision } from "@gold-terminal/contracts/dist/globalRead";

const NOTICE_SECONDS = 24 * 60 * 60;
const LOCKOUT_SECONDS = 15 * 60 * 60;
const POST_RELEASE_SECONDS = 30 * 60;

export interface EventGuardAssessment {
  warnings: string[];
  blockers: GlobalReadDecision["blockers"];
  blocksOpportunity: boolean;
}

/**
 * Policy set by the trader: show a 24-hour notice, remove OPPORTUNITY during
 * the final 15 hours, and require a fresh manual read at least 30 minutes
 * after an official release. This is an event-risk guard, never causal proof.
 */
export function assessGlobalReadEventGuard(now: string, catalysts: readonly GlobalReadCatalyst[]): EventGuardAssessment {
  const nowMs = Date.parse(now);
  if (!Number.isFinite(nowMs)) return { warnings: [], blockers: [], blocksOpportunity: false };
  const relevant = catalysts.filter((event) => event.verified).map((event) => ({ event, seconds: (Date.parse(event.scheduledAt) - nowMs) / 1000 }))
    .filter(({ seconds }) => Number.isFinite(seconds));
  const warnings = relevant.filter(({ seconds }) => seconds >= 0 && seconds <= NOTICE_SECONDS)
    .map(({ event }) => `Upcoming high-impact catalyst within 24 hours: ${event.title} (${event.scheduledAt}).`);
  const blockers = relevant.flatMap(({ event, seconds }) => {
    if (seconds >= 0 && seconds <= LOCKOUT_SECONDS) return [{ code: "EVENT_GUARD", detail: `${event.title} is within the final 15-hour pre-release lockout.`, recoverable: true, resolver: `Wait for ${event.title}, verify the release and rerun Global Read.` }];
    if (seconds < 0 && seconds >= -POST_RELEASE_SECONDS) return [{ code: "POST_RELEASE_REFRESH", detail: `${event.title} was released less than 30 minutes ago.`, recoverable: true, resolver: "Wait until 30 minutes after the release, then refresh data and rerun Global Read." }];
    return [];
  });
  return { warnings, blockers, blocksOpportunity: blockers.length > 0 };
}
