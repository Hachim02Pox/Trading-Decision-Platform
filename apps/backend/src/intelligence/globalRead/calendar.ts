import type { GlobalReadCatalyst } from "@gold-terminal/contracts/dist/globalRead";
import { fetchEvidencePage } from "./safeFetch";
import { hashObject } from "./snapshot";
import { zonedWallClockToUtcIso } from "../../providers/investingFedRateMonitor";

const CALENDARS = ["https://www.bls.gov/schedule/news_release/bls.ics", "https://www.bea.gov/news/schedule/ics/online-calendar-subscription.ics"] as const;

export function parseOfficialCalendar(body: string, sourceUrl: string): GlobalReadCatalyst[] {
  if (!(CALENDARS as readonly string[]).includes(sourceUrl) || !body.includes("BEGIN:VCALENDAR")) return [];
  const unfolded = body.replace(/\r?\n[ \t]/g, "");
  return [...unfolded.matchAll(/BEGIN:VEVENT\r?\n([\s\S]*?)END:VEVENT/g)].flatMap(([, block]) => {
    if (/^STATUS:CANCELLED\s*$/m.test(block)) return [];
    const title = /^SUMMARY:(.*)$/m.exec(block)?.[1]?.trim().replace(/\\[,;]/g, (v) => v.slice(1));
    const start = /^DTSTART([^:]*):(\d{8}T\d{6})(Z?)\s*$/m.exec(block);
    if (!title || !start) return [];
    const raw = start[2];
    const parts = { year: Number(raw.slice(0, 4)), month: Number(raw.slice(4, 6)), day: Number(raw.slice(6, 8)), hour: Number(raw.slice(9, 11)), minute: Number(raw.slice(11, 13)) };
    if (parts.month < 1 || parts.month > 12 || parts.day < 1 || parts.day > 31 || parts.hour > 23 || parts.minute > 59 || raw.slice(13) !== "00") return [];
    let scheduledAt: string;
    if (start[3] === "Z") scheduledAt = new Date(Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute)).toISOString();
    else if (/TZID=(America\/New_York|US-Eastern|US\/Eastern)/.test(start[1])) scheduledAt = zonedWallClockToUtcIso(parts, "America/New_York");
    else return []; // Floating/all-day times are not silently given an execution time.
    const group = /Consumer Price/i.test(title) ? "CPI" : /Employment Situation/i.test(title) ? "EMPLOYMENT" : /Personal Income and Outlays/i.test(title) ? "PCE" : /Gross Domestic Product/i.test(title) ? "GDP" : "OTHER";
    return [{ ref: `calendar:${hashObject({ title, scheduledAt }).slice(0, 20)}`, title, scheduledAt, sourceUrl, verified: true, group: `${group}:${scheduledAt}`, phase: "RELEASE" }];
  });
}

export async function fetchGlobalReadCalendars(): Promise<{ events: GlobalReadCatalyst[]; warnings: string[]; complete: boolean }> {
  const results = await Promise.all(CALENDARS.map(async (url) => {
    try { return { events: parseOfficialCalendar(await fetchEvidencePage(url), url), failed: false }; }
    catch { return { events: [] as GlobalReadCatalyst[], failed: true }; }
  }));
  const now = new Date();
  const fed = await Promise.all([0, 1].map(async (offset) => {
    const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + offset, 1));
    const year = date.getUTCFullYear(), month = date.getUTCMonth() + 1;
    const monthName = date.toLocaleString("en-US", { month: "long", timeZone: "UTC" }).toLowerCase();
    const url = `https://www.federalreserve.gov/newsevents/${year}-${monthName}.htm`;
    try {
      const body = await fetchEvidencePage(url);
      return { events: parseFedMonthlyCalendar(body, url, year, month), failed: !body.includes("cal-nojs__rowTitle") };
    } catch { return { events: [] as GlobalReadCatalyst[], failed: true }; }
  }));
  const events = [...new Map([...results, ...fed].flatMap((r) => r.events).map((e) => [e.ref, e])).values()].sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt));
  return { events, complete: results.every((r) => !r.failed && r.events.some((e) => e.scheduledAt > now.toISOString())) && fed.every((r) => !r.failed), warnings: [
    ...results.flatMap((r, i) => r.failed || !r.events.length ? [`Calendar unavailable or unparsed: ${CALENDARS[i]}`] : []),
    ...(fed.some((r) => r.failed) ? ["Official FOMC monthly calendar coverage is incomplete."] : []),
    "Scheduled coverage: BLS, BEA and current/next-month Federal Reserve calendar only. Treasury auction times and unscheduled events are not fully covered. Calendar completeness is not absence of unexpected risk.",
  ] };
}

/** Official monthly calendar supplies the times; no assumed 14:00/14:30 or hardcoded meeting dates. */
export function parseFedMonthlyCalendar(body: string, sourceUrl: string, year: number, month: number): GlobalReadCatalyst[] {
  if (!/^https:\/\/www\.federalreserve\.gov\/newsevents\/\d{4}-[a-z]+\.htm$/.test(sourceUrl)) return [];
  return [...body.matchAll(/class="panel-body">([\s\S]*?class="col-xs-3">[\s\S]*?<\/div>)/g)].flatMap(([, block]) => {
    const title = /<p>(?:<a[^>]*>)?(FOMC Press Conference|FOMC Meeting)(?:<\/a>)?\s*<\/p>/.exec(block)?.[1];
    const time = /class="col-xs-2">\s*<p>(\d{1,2}):(\d{2})\s*([ap])\.m\./.exec(block);
    const day = Number(/class="col-xs-3">\s*<p>(\d{1,2})<\/p>/.exec(block)?.[1]);
    if (!title || !time || !day || day > 31 || Number(time[1]) > 12 || Number(time[2]) > 59) return [];
    const scheduledAt = zonedWallClockToUtcIso({ year, month, day, hour: Number(time[1]) % 12 + (time[3] === "p" ? 12 : 0), minute: Number(time[2]) }, "America/New_York");
    return [{ ref: `calendar:${hashObject({ title, scheduledAt }).slice(0, 20)}`, title, scheduledAt, sourceUrl, verified: true,
      group: `FOMC:${scheduledAt.slice(0, 10)}`, phase: title === "FOMC Meeting" ? "DECISION" : "PRESS_CONFERENCE" }];
  });
}
