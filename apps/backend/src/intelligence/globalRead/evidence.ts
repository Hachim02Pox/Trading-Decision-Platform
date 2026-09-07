import type { GlobalReadAdmission, GlobalReadFact } from "@gold-terminal/contracts/dist/globalRead";

export const EVIDENCE_METHOD_VERSION = "global-evidence-2.0.0";

const AUTHORITIES: Readonly<Record<string, readonly string[]>> = {
  CORE_PCE_MOM: ["apps.bea.gov"], CORE_PCE_YOY: ["apps.bea.gov"], HEADLINE_PCE_YOY: ["apps.bea.gov"],
  CORE_CPI_MOM: ["api.bls.gov"], CORE_CPI_YOY: ["api.bls.gov"], HEADLINE_CPI_MOM: ["api.bls.gov"], HEADLINE_CPI_YOY: ["api.bls.gov"],
  PAYROLLS_CHANGE: ["api.bls.gov"], UNEMPLOYMENT: ["api.bls.gov"], AHE_MOM: ["api.bls.gov"],
  US2Y: ["home.treasury.gov"], US10Y: ["home.treasury.gov"], US10Y_REAL: ["home.treasury.gov"],
  COT_MM_NET: ["publicreporting.cftc.gov"], COT_MM_PERCENTILE: ["publicreporting.cftc.gov"],
  GLD_HOLDINGS: ["api.spdrgoldshares.com"], GLD_CHANGE: ["api.spdrgoldshares.com"],
  FED_TARGET_UPPER: ["www.federalreserve.gov"], FED_TARGET_LOWER: ["www.federalreserve.gov"],
  FED_IMPLIED_LEADING_BUCKET_PROBABILITY: ["www.investing.com"],
  FED_IMPLIED_CURRENT_BUCKET_PROBABILITY_CHANGE_1D: ["www.investing.com"],
};
const VERIFIED_PROVIDER_METRICS = new Set(["FED_IMPLIED_LEADING_BUCKET_PROBABILITY", "FED_IMPLIED_CURRENT_BUCKET_PROBABILITY_CHANGE_1D"]);

export function resolveAuthority(metric: string, url: string | null): boolean {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" && !parsed.username && !parsed.password && !parsed.port &&
      (AUTHORITIES[metric]?.includes(parsed.hostname) ?? false);
  } catch { return false; }
}

/** No made-up tolerance across different quotes/times. Not comparable is NOT contradictory. */
export function comparableIdentity(a: GlobalReadFact, b: GlobalReadFact): boolean {
  return (["metric", "unit", "period", "instrument", "transform", "seasonality", "observationAt"] as const)
    .every((key) => a[key] === b[key]);
}

export function admitEvidence(terminal: GlobalReadFact, observations: readonly GlobalReadFact[], informationSetAt: string): GlobalReadAdmission {
  const base = { ref: terminal.ref, terminalValue: terminal.value, admittedValue: null, selected: null, observations: [...observations] };
  const result = (status: GlobalReadAdmission["status"], reason: string): GlobalReadAdmission => ({ ...base, status, reason,
    provenance: status === "CONFLICT" ? "WEB_ONLY_CONFLICTED" : "UNVERIFIED" });
  const cutoff = Date.parse(informationSetAt);
  const primary = observations.filter((o) => o.verification === "STRUCTURED" && (o.sourceType === "PRIMARY" ||
      (o.sourceType === "SECONDARY" && VERIFIED_PROVIDER_METRICS.has(o.metric))) &&
    resolveAuthority(o.metric, o.sourceUrl) && o.value !== null &&
    (typeof o.value !== "number" || Number.isFinite(o.value)) && o.latestCheckedAt !== null && o.effectiveFreshnessStatus === "CURRENT");
  if (!primary.length) return result(terminal.value === null && !observations.length ? "UNAVAILABLE" : "UNVERIFIED", "No supported backend-parsed authoritative observation; model prose and source labels cannot verify a value.");
  const matching = primary.filter((o) => comparableIdentity(terminal, o));
  if (!matching.length) return result("NOT_COMPARABLE", "Different metric, period, instrument, timestamp, units or transformation; no value vote is possible.");
  const known = matching.filter((o) => [o.knownAt, o.retrievedAt, o.latestCheckedAt!].every((t) => Number.isFinite(Date.parse(t)) && Date.parse(t) <= cutoff));
  if (!known.length || !Number.isFinite(cutoff)) return result("LOOKAHEAD", "This vintage was not demonstrably available in the frozen information set.");
  const first = known[0];
  if (known.some((o) => o.value !== first.value || o.vintage !== first.vintage)) return result("CONFLICT", "Comparable authoritative records conflict; resolve their vintage/value before using this claim.");
  const corrected = terminal.value !== null && terminal.value !== first.value;
  const webOnly = terminal.value === null;
  return { ...base, status: corrected ? "CORRECTED" : "VERIFIED", admittedValue: first.value, selected: { ...first, ref: terminal.ref },
    provenance: webOnly ? "WEB_ONLY_VERIFIED" : corrected ? "TERMINAL_CORRECTED" : "TERMINAL_VERIFIED",
    reason: webOnly ? "Terminal source unavailable; value recovered and verified from the authoritative web source for this run only." :
      corrected ? "Primary source replaces the terminal value for this run only; terminal storage is unchanged." : "Identity and current authoritative payload verified by the backend; not an independent-source vote." };
}

export function isAdmitted(record: GlobalReadAdmission | undefined): boolean {
  return !!record?.selected && (record.status === "VERIFIED" || record.status === "CORRECTED");
}
