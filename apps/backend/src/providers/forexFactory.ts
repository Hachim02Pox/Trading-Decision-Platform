// Forex Factory's own public calendar JSON feed — the same feed their
// website's calendar widget uses internally. Chosen 2026-09-14 to replace
// JBlanked as F13's real economic-calendar source: JBlanked's free tier
// turned out to require paid credits (live-confirmed 401 on every calendar
// endpoint, see docs/PROVIDER_SETUP.md), and the two OTHER providers already
// keyed in this project (Finnhub, Financial Modeling Prep) were both
// live-tested against their real configured keys and both gate their own
// economic-calendar endpoint behind a paid plan too. This feed needed
// neither an account nor a credit card and was live-verified working.
//
// UNOFFICIAL / undocumented: this is not a contracted public API — no SLA,
// no versioning guarantee, can change or disappear without notice. It has
// been relied on by the retail-trading-bot community for years, but that is
// not the same thing as an official integration. Accepted tradeoff given
// this product's actual usage is a single fetch per week (see
// jobs/f13CalendarIngestion.ts) and the product deliberately never displays
// forecast/previous/actual numbers anyway (see f13EventExplanations.ts).
//
// Known shape differences from JBlanked (providers/jblanked.ts, kept
// in-repo but unused for now — trivial to revert to if this feed ever
// breaks and JBlanked credits are purchased):
// - Fields are `title`/`country`/`date`/`impact`/`forecast`/`previous` —
//   NOT `Name`/`Currency`/`Date`/`Impact`/`Forecast`/`Previous`.
// - `date` is already a proper ISO-8601 string with the feed's own real UTC
//   offset applied (e.g. "2026-09-16T14:00:00-04:00") — no local-time/
//   timezone guessing needed, unlike JBlanked's ambiguous "YYYY.MM.DD
//   HH:MM:SS" format (see f13EventTypes.ts's parseJblankedLocalDateToUtc).
// - There is NO "actual" (released) value field at all in this feed.
//   macro_events.actual_value simply stays null for every Forex-Factory-
//   sourced row — real/f13Calendar.ts's resolveDisplayActual already
//   handles a permanently-null actual gracefully (falls back to an
//   official-source cross-reference when one exists, otherwise shows none).
// - The feed has no server-side currency/impact filter params — it returns
//   every country's every event for the week; callers filter client-side
//   (see jobs/f13CalendarIngestion.ts).
// - Live-confirmed (2026-09-14) anti-abuse rate limiting: a handful of
//   rapid requests trips a "Rate Limited" HTML page instead of JSON.
//   Irrelevant at this product's real cadence (see above) but handled below
//   as a typed, recoverable error rather than an uncaught JSON.parse crash.

const FEED_URL = "https://nfs.faireconomy.media/ff_calendar_thisweek.json";

export type ForexFactoryErrorCode = "RATE_LIMITED" | "HTTP_ERROR" | "INVALID_RESPONSE";

export class ForexFactoryApiError extends Error {
  code: ForexFactoryErrorCode;
  constructor(code: ForexFactoryErrorCode, message: string) {
    super(message);
    this.name = "ForexFactoryApiError";
    this.code = code;
  }
}

export interface ForexFactoryRawEvent {
  title: string;
  /** Currency code the event is filed under, e.g. "USD", "EUR" — despite the field name, this is a currency, not a country. */
  country: string;
  /** ISO-8601 with a real UTC offset already applied. */
  date: string;
  impact: "High" | "Medium" | "Low" | string;
  /** Always a string, possibly empty (never fabricated — an empty string means the feed has no forecast for this event). */
  forecast: string;
  previous: string;
}

function isRawEvent(value: unknown): value is ForexFactoryRawEvent {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.title === "string" &&
    typeof record.country === "string" &&
    typeof record.date === "string" &&
    typeof record.impact === "string"
  );
}

/**
 * Fetches the full current-week calendar — every country, every impact
 * level (this feed has no server-side filter params). Throws
 * `ForexFactoryApiError` for any transport/shape failure; never returns a
 * partial/guessed result.
 */
export async function fetchForexFactoryThisWeek(): Promise<ForexFactoryRawEvent[]> {
  let response: Response;
  try {
    response = await fetch(FEED_URL, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; GoldTerminal/1.0; +https://gold-terminal.local)" },
    });
  } catch (err) {
    throw new ForexFactoryApiError("HTTP_ERROR", `Forex Factory feed unreachable: ${err instanceof Error ? err.message : String(err)}`);
  }

  const text = await response.text();

  if (!response.ok) {
    throw new ForexFactoryApiError("HTTP_ERROR", `Forex Factory feed returned HTTP ${response.status}.`);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    // Observed live: a throttled request answers 200 with an HTML "Rate
    // Limited" page rather than a non-2xx status — detected from the body.
    const rateLimited = /rate limit/i.test(text);
    throw new ForexFactoryApiError(
      rateLimited ? "RATE_LIMITED" : "INVALID_RESPONSE",
      rateLimited ? "Forex Factory feed is rate-limiting this request." : "Forex Factory feed returned a non-JSON response."
    );
  }

  if (!Array.isArray(parsed) || !parsed.every(isRawEvent)) {
    throw new ForexFactoryApiError("INVALID_RESPONSE", "Forex Factory feed returned an unexpected shape.");
  }

  return parsed;
}

/** No credential required — always true. Kept for symmetry with every other provider's isConfigured() convention (see providers/jblanked.ts, config/env.ts). */
export function isForexFactoryConfigured(): boolean {
  return true;
}
