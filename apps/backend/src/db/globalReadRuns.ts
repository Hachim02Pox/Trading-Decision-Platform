import type { GlobalReadDecision } from "@gold-terminal/contracts/dist/globalRead";
import type { Language } from "@gold-terminal/contracts";
import { getPool } from "./pool";

/** Append-only audit history. No user credentials, raw CLI output, or hidden reasoning. */
export async function saveGlobalReadRun(report: GlobalReadDecision, language: Language): Promise<boolean> {
  try {
    await getPool().query(
      "insert into public.global_read_runs (run_id, method_version, snapshot_hash, language, readiness, as_of, report) values ($1, $2, $3, $4, $5, $6, $7)",
      [report.runId, report.methodVersion, report.snapshotHash, language, report.readiness, new Date(report.asOf), JSON.stringify(report)]
    );
    return true;
  } catch {
    console.error("[global-read] Durable run audit unavailable; check DB configuration/migration 004.");
    return false;
  }
}

export async function loadLatestGlobalReadRun(language: Language): Promise<GlobalReadDecision | null> {
  try {
    const result = await getPool().query<{ report: unknown }>(
      "select report from public.global_read_runs where language = $1 order by as_of desc limit 1",
      [language]
    );
    const raw = result.rows[0]?.report;
    const value = typeof raw === "string" ? (JSON.parse(raw) as unknown) : raw;
    if (!value || typeof value !== "object" || Array.isArray(value)) return null;
    const candidate = value as Partial<GlobalReadDecision>;
    return typeof candidate.runId === "string" && typeof candidate.methodVersion === "string" && candidate.rebuild ? (candidate as GlobalReadDecision) : null;
  } catch {
    return null;
  }
}
