import type { GlobalReadDecision } from "@gold-terminal/contracts/dist/globalRead";
import type { Language } from "@gold-terminal/contracts";
import { getPool } from "./pool";

/** Append-only audit history. No user credentials, raw CLI output, or hidden reasoning. */
export async function saveGlobalReadRun(report: GlobalReadDecision, language: Language): Promise<boolean> {
  try {
    await getPool().execute("INSERT INTO global_read_runs (run_id, method_version, snapshot_hash, language, readiness, as_of, report) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [report.runId, report.methodVersion, report.snapshotHash, language, report.readiness, report.asOf.slice(0, 23).replace("T", " "), JSON.stringify(report)]);
    return true;
  } catch {
    console.error("[global-read] Durable run audit unavailable; check DB configuration/migration 003.");
    return false;
  }
}

export async function loadLatestGlobalReadRun(language: Language): Promise<GlobalReadDecision | null> {
  try {
    const [rows] = await getPool().execute("SELECT report FROM global_read_runs WHERE language = ? ORDER BY as_of DESC LIMIT 1", [language]);
    const row = Array.isArray(rows) ? rows[0] as { report?: unknown } | undefined : undefined;
    const raw = row?.report;
    const value = typeof raw === "string" ? JSON.parse(raw) as unknown : raw;
    if (!value || typeof value !== "object" || Array.isArray(value)) return null;
    const candidate = value as Partial<GlobalReadDecision>;
    return typeof candidate.runId === "string" && typeof candidate.methodVersion === "string" && candidate.rebuild ? candidate as GlobalReadDecision : null;
  } catch {
    return null;
  }
}
