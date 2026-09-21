import { loadAppConfig } from "../config/env";
import { findLatestPublishedSundayRead, findPublishedSundayReadByRunDate } from "../db/sundayReads";
import { loadFinalRead } from "./service";
import type { FinalRead } from "./schema";

// The single read path GET /api/sunday-read(/latest|/:runDate) all funnel
// through. When the DB is configured (every real deployment — Railway always
// has SUPABASE_* set), this is the ONLY source of truth: an empty/missing
// published run returns null, it never silently falls back to the local
// fixture. The local-disk fallback (gold-sunday-read/runs/**, via
// sundayRead/service.ts's loadFinalRead) only engages when the DB itself is
// entirely unconfigured — i.e. a bare local dev checkout with no
// apps/backend/.env DB settings at all — which is exactly today's existing
// `npm run sunday:fixture` workflow and must keep working unchanged.
export async function getPublishedSundayRead(runDate?: string): Promise<FinalRead | null> {
  const db = loadAppConfig().db;
  if (db) {
    const row = runDate ? await findPublishedSundayReadByRunDate(runDate) : await findLatestPublishedSundayRead();
    return (row?.jsonPayload as FinalRead | null | undefined) ?? null;
  }
  // A production process must never surface a checkout-local fixture or an
  // old JSON as if it were published market state.
  if (process.env.NODE_ENV === "production") return null;
  return loadFinalRead(runDate);
}
