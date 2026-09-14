# F13 Calendar Contract

Updated 2026-09-14 (Forex Factory redesign — see providers/forexFactory.ts and jobs/f13CalendarIngestion.ts for the full reasoning).

- The provider fetch is guarded to one request per UTC week (unchanged), plus a proactive GitHub Actions trigger every Saturday 16:00 UTC (`.github/workflows/calendar-ingest.yml`) so the week is fetched ahead of time rather than only lazily on first request.
- Source: Forex Factory's free public calendar feed (`https://nfs.faireconomy.media/ff_calendar_thisweek.json`), not JBlanked. No API key. Unofficial/undocumented feed — accepted tradeoff, see `providers/forexFactory.ts`'s header comment.
- The feed has no server-side filter params; the ingestion job filters to USD + High/Medium impact itself.
- The feed carries no "actual" (released) value — `macro_events.actual_value` stays null for every Forex-Factory-sourced row.
- The frontend (`F13CalendarFace.tsx`) shows ONE DAY at a time (default: today), with previous/next-day arrows — not a full week grid.
- Each event shows only its name and a plain-language bilingual explanation (`f13EventExplanations.ts`) — never a consensus/forecast/previous/actual number.
- A day with no High-impact USD event shows an explicit "no event" message; the arrows remain usable.
- An API or ingestion failure is shown as an unavailable/unconfirmed state; no mock calendar rows are fabricated.
- A local manual refresh is available with `npm run calendar:refresh` (`apps/backend/src/cli/calendarRefresh.ts`) — bypasses the weekly guard once.
- Internal trigger endpoint: `POST /api/internal/calendar/ingest`, protected by the `X-Internal-Ingest-Secret` header (same secret as the Sunday Read internal endpoint).
