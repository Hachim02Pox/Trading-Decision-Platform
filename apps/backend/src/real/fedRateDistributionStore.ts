import type { FedRateDistribution } from "@gold-terminal/contracts";
import { getLatestObservation, insertObservationIfChanged } from "../db/kpiObservations";

// Durable (survives a process restart) persistence for F3's real Fed Rate
// Monitor distribution — see real/f3Fed.ts for the cadence/gating logic
// this supports. `kpi_observations.text_value` is VARCHAR(255) and this
// project's convention is "no big JSON blobs" here, so this stores a
// compact, purpose-built encoding rather than JSON — see `encode`/`decode`
// below. Only the CURRENT probability per bucket is persisted (not
// previous-day/previous-week) to comfortably fit the column even with
// several buckets; see `encode`'s doc comment for the honest tradeoff this
// implies on the "reuse persisted data" path.

/** Not a real CanonicalKpi id — a sentinel key scoping this one append-only history stream within the shared kpi_observations table. */
export const FED_RATE_MONITOR_OBSERVATION_KPI_ID = "f3-fed-rate-monitor";

const MAX_TEXT_VALUE_LENGTH = 255;

interface PersistableBucket {
  targetRangeLabel: string;
  probability: number;
}

interface DecodedDistribution {
  nextMeetingAt: string | null;
  buckets: PersistableBucket[];
}

/**
 * Compact encoding: `"<nextMeetingIsoOrEmpty>;<label>=<pct>|<label>=<pct>|..."`.
 * Returns `null` if the result would not fit `MAX_TEXT_VALUE_LENGTH` — the
 * caller treats that as "skip persistence this cycle" rather than
 * truncating (a truncated bucket list would silently misrepresent the
 * distribution on the next restart-reload).
 */
export function encodeDistributionForStorage(distribution: Pick<FedRateDistribution, "nextMeetingAt" | "buckets">): string | null {
  const meetingPart = distribution.nextMeetingAt ?? "";
  const bucketsPart = distribution.buckets.map((b) => `${b.targetRangeLabel}=${b.probability}`).join("|");
  const encoded = `${meetingPart};${bucketsPart}`;
  return encoded.length <= MAX_TEXT_VALUE_LENGTH ? encoded : null;
}

export function decodeDistributionFromStorage(text: string): DecodedDistribution | null {
  const separatorIndex = text.indexOf(";");
  if (separatorIndex === -1) return null;
  const meetingPart = text.slice(0, separatorIndex);
  const bucketsPart = text.slice(separatorIndex + 1);

  const buckets: PersistableBucket[] = [];
  for (const entry of bucketsPart.split("|")) {
    if (!entry) continue;
    const eqIndex = entry.lastIndexOf("=");
    if (eqIndex === -1) return null;
    const label = entry.slice(0, eqIndex);
    const probability = Number(entry.slice(eqIndex + 1));
    if (!label || !Number.isFinite(probability)) return null;
    buckets.push({ targetRangeLabel: label, probability });
  }
  if (buckets.length === 0) return null;

  return { nextMeetingAt: meetingPart.length > 0 ? meetingPart : null, buckets };
}

/**
 * Best-effort persistence of one successful fetch — logs and returns
 * normally on any DB failure rather than throwing, since a persistence
 * failure must never take down the (already-succeeded) live fetch this
 * cycle serves to the caller.
 */
export async function persistFedRateDistribution(distribution: FedRateDistribution): Promise<void> {
  const encoded = encodeDistributionForStorage(distribution);
  if (!encoded) {
    console.error(
      "[real-data] F3 (Investing.com Fed Rate Monitor) distribution has too many/long buckets to fit kpi_observations.text_value (255 chars) — skipping persistence this cycle, live data is unaffected"
    );
    return;
  }

  try {
    const topProbability = distribution.buckets.reduce((max, b) => Math.max(max, b.probability), 0);
    await insertObservationIfChanged({
      kpiId: FED_RATE_MONITOR_OBSERVATION_KPI_ID,
      observationAt: new Date(distribution.observationAt),
      retrievedAt: new Date(distribution.retrievedAt),
      numericValue: topProbability,
      textValue: encoded,
      sourceTag: distribution.sourceTag,
      provenance: "observed",
    });
  } catch (err) {
    console.error("[real-data] F3 (Investing.com Fed Rate Monitor) persistence failed:", err instanceof Error ? err.message : err);
  }
}

export interface LoadedPersistedDistribution {
  buckets: PersistableBucket[];
  nextMeetingAt: string | null;
  observationAt: string;
  retrievedAt: string;
}

/**
 * Reads back the most recent successfully-persisted distribution, or
 * `null` if none exists yet or the stored row failed to decode/is missing
 * a text value. Never throws. Callers decide their own staleness cutoff —
 * this function makes no freshness judgment.
 */
export async function loadPersistedFedRateDistribution(): Promise<LoadedPersistedDistribution | null> {
  try {
    const row = await getLatestObservation(FED_RATE_MONITOR_OBSERVATION_KPI_ID);
    if (!row || !row.textValue) return null;
    const decoded = decodeDistributionFromStorage(row.textValue);
    if (!decoded) return null;
    return {
      buckets: decoded.buckets,
      nextMeetingAt: decoded.nextMeetingAt,
      observationAt: row.observationAt.toISOString(),
      retrievedAt: row.retrievedAt.toISOString(),
    };
  } catch (err) {
    console.error("[real-data] F3 (Investing.com Fed Rate Monitor) persisted-read failed:", err instanceof Error ? err.message : err);
    return null;
  }
}
