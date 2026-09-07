import type { GlobalReadFact, GlobalReadAdmission } from "@gold-terminal/contracts/dist/globalRead";
import { fetchNipaMonthlyTableData } from "../../providers/bea";
import { fetchSeriesHistoryWithCalculations } from "../../providers/bls";
import { fetchLatestParYield, fetchLatestRealParYield } from "../../providers/treasury";
import { fetchGldHistoricalArchive, parseGldWorkbook } from "../../providers/spdrGld";
import { fetchJson } from "../../providers/httpClient";
import { loadAppConfig } from "../../config/env";
import { DEFINITIONS } from "./snapshot";
import { admitEvidence } from "./evidence";

const BLS: Readonly<Record<string, { series: string; field: "level" | "net" | "pct"; lookback: "1" | "12" }>> = {
  "f4-core-cpi-mom": { series: "CUSR0000SA0L1E", field: "pct", lookback: "1" },
  "f4-core-cpi-yoy": { series: "CUUR0000SA0L1E", field: "pct", lookback: "12" },
  "f4-headline-cpi-mom": { series: "CUSR0000SA0", field: "pct", lookback: "1" },
  "f4-headline-cpi-yoy": { series: "CUUR0000SA0", field: "pct", lookback: "12" },
  "f5-payrolls-latest": { series: "CES0000000001", field: "net", lookback: "1" },
  "f5-unemployment": { series: "LNS14000000", field: "level", lookback: "1" },
  "f5-ahe-mom": { series: "CES0500000003", field: "pct", lookback: "1" },
};
const round = (v: number, decimals = 1) => Number(v.toFixed(decimals));
const monthEnd = (period: string) => new Date(Date.UTC(Number(period.slice(0, 4)), Number(period.slice(5, 7)), 0)).toISOString();

function sourceFact(base: GlobalReadFact, value: number, at: string, url: string): GlobalReadFact {
  const now = new Date().toISOString();
  const d = DEFINITIONS[base.ref];
  return { ...base, value, unit: d.unit, observationAt: at, period: at.slice(0, base.period.length),
    releaseGroup: `${d.group}:${at.slice(0, base.period.length)}`, knownAt: now, retrievedAt: now, latestCheckedAt: now,
    vintage: `retrieved:${now}`, sourceUrl: url, sourceType: "PRIMARY", verification: "STRUCTURED", effectiveFreshnessStatus: "CURRENT" };
}

/** Admit the current terminal claim and, when the authority has already published
 * a newer period, expose that latest observation as a separate run-local fact. */
export function admitLatestEvidence(terminal: GlobalReadFact, observations: readonly GlobalReadFact[], cutoff: string): GlobalReadAdmission[] {
  const admission = admitEvidence(terminal, observations, cutoff);
  const latest = observations[0];
  if (!latest || latest.period === terminal.period) return [admission];
  const latestPlaceholder = { ...latest, ref: `latest:${terminal.ref}`, value: null, sourceUrl: null, verification: "NONE" as const };
  return [admission, admitEvidence(latestPlaceholder, [latest], cutoff)];
}

/** Only fixed, registered primary endpoints. No LLM URL or provider label reaches these fetches. */
export async function verifyPrimaryFacts(facts: readonly GlobalReadFact[], requestedRefs: readonly string[]): Promise<GlobalReadAdmission[]> {
  const requested = facts.filter((f) => requestedRefs.includes(f.ref));
  const records = new Map<string, GlobalReadFact[]>();
  const add = (f: GlobalReadFact) => records.set(f.ref, [f]);
  // These two claims are structured output from the existing browser parser for the named third-party
  // provider. Their definitions retain that limitation; they are never relabelled as Fed/CME primary data.
  for (const fact of requested) if (["FED_IMPLIED_LEADING_BUCKET_PROBABILITY", "FED_IMPLIED_CURRENT_BUCKET_PROBABILITY_CHANGE_1D"].includes(fact.metric) && fact.value !== null)
    add(fact);
  const jobs: Array<() => Promise<void>> = [];
  const blsFacts = requested.filter((f) => BLS[f.ref]);
  if (blsFacts.length) jobs.push(async () => {
    const bundle = await fetchSeriesHistoryWithCalculations([...new Set(blsFacts.map((f) => BLS[f.ref].series))], loadAppConfig().providers.bls?.apiKey);
    for (const f of blsFacts) {
      const d = BLS[f.ref];
      const latest = [...(bundle[d.series] ?? [])].filter((r) => /^M(0[1-9]|1[0-2])$/.test(r.period))
        .sort((a, b) => `${b.year}${b.period}`.localeCompare(`${a.year}${a.period}`))[0];
      if (!latest) continue;
      const value = d.field === "level" ? latest.value : d.field === "net" ? latest.calculations?.netChanges[d.lookback] : latest.calculations?.pctChanges[d.lookback];
      if (typeof value === "number" && Number.isFinite(value)) add(sourceFact(f, round(value, d.field === "net" ? 0 : 1), monthEnd(`${latest.year}-${latest.period.slice(1)}`), `https://api.bls.gov/publicAPI/v2/timeseries/data/${d.series}`));
    }
  });
  const pce = requested.filter((f) => f.metric.includes("PCE"));
  if (pce.length) jobs.push(async () => {
    const year = new Date().getUTCFullYear();
    const years = [year - 2, year - 1, year].map(String);
    const [indexes, changes] = await Promise.all([fetchNipaMonthlyTableData("T20804", years), fetchNipaMonthlyTableData("T20807", years)]);
    for (const f of pce) {
      const line = f.metric.startsWith("CORE") ? "25" : "1";
      const points = (f.transform === "MOM" ? changes : indexes)?.filter((p) => p.lineNumber === line && /^\d{4}M\d{2}$/.test(p.timePeriod))
        .sort((a, b) => b.timePeriod.localeCompare(a.timePeriod));
      const latest = points?.[0];
      if (!latest) continue;
      const previousYear = points?.find((p) => p.timePeriod === `${Number(latest.timePeriod.slice(0, 4)) - 1}${latest.timePeriod.slice(4)}`);
      const value = f.transform === "MOM" ? latest.dataValue : previousYear && previousYear.dataValue > 0 ? (latest.dataValue / previousYear.dataValue - 1) * 100 : null;
      if (value !== null && Number.isFinite(value)) add(sourceFact(f, round(value), monthEnd(latest.timePeriod.replace("M", "-")), "https://apps.bea.gov/api/data/"));
    }
  });
  const nominal = requested.filter((f) => f.metric === "US2Y" || f.metric === "US10Y");
  if (nominal.length) jobs.push(async () => {
    const row = await fetchLatestParYield();
    if (row) for (const f of nominal) add(sourceFact(f, f.metric === "US2Y" ? row.y2 : row.y10, row.dateIso, "https://home.treasury.gov/resource-center/data-chart-center/interest-rates/TextView?type=daily_treasury_yield_curve"));
  });
  const real = requested.find((f) => f.metric === "US10Y_REAL");
  if (real) jobs.push(async () => {
    const row = await fetchLatestRealParYield();
    if (row) add(sourceFact(real, row.y10, row.dateIso, "https://home.treasury.gov/resource-center/data-chart-center/interest-rates/TextView?type=daily_treasury_real_yield_curve"));
  });
  const cot = requested.find((f) => f.metric === "COT_MM_NET");
  if (cot) jobs.push(async () => {
    const url = "https://publicreporting.cftc.gov/resource/72hh-3qpy.json";
    const params = new URLSearchParams({ "$where": "cftc_contract_market_code='088691'", "$order": "report_date_as_yyyy_mm_dd DESC", "$limit": "1" });
    const r = await fetchJson<Array<Record<string, string>>>(`${url}?${params}`);
    const row = r.ok && Array.isArray(r.body) ? r.body[0] : null;
    if (!row || row.cftc_contract_market_code !== "088691") return;
    const [oi, long, short] = [row.open_interest_all, row.m_money_positions_long_all, row.m_money_positions_short_all].map((s) => s?.trim() ? Number(s) : NaN);
    if (oi > 0 && [long, short].every(Number.isFinite) && Number.isFinite(Date.parse(row.report_date_as_yyyy_mm_dd)))
      add(sourceFact(cot, round((long - short) / oi * 100), new Date(row.report_date_as_yyyy_mm_dd).toISOString(), url));
  });
  const gld = requested.find((f) => f.metric === "GLD_HOLDINGS");
  if (gld) jobs.push(async () => {
    const rows = await parseGldWorkbook(await fetchGldHistoricalArchive()) ?? [];
    const row = [...rows].filter((r) => r.tonnesOfGold !== null).sort((a, b) => b.dateIso.localeCompare(a.dateIso))[0];
    if (row?.tonnesOfGold != null) add(sourceFact(gld, round(row.tonnesOfGold, 0), row.dateIso, "https://api.spdrgoldshares.com/api/v1/historical-archive?product=gld&exchange=NYSE&lang=en"));
  });
  // Independent source requests in parallel. Failure is visible as an unverified admission, not a stale fallback.
  await Promise.allSettled(jobs.map((job) => job()));
  const cutoff = new Date().toISOString();
  return requested.flatMap((fact) => admitLatestEvidence(fact, records.get(fact.ref) ?? [], cutoff));
}
