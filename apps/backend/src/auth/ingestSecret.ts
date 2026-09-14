import type { NextFunction, Request, Response } from "express";
import { timingSafeEqual } from "node:crypto";
import { loadAppConfig } from "../config/env";

// Server-to-server auth for internal ingestion triggers — currently
// POST /api/internal/sunday-read/ingest AND POST /api/internal/calendar/ingest
// — a shared secret header, NOT requireHolder's Supabase end-user session
// pattern (auth/supabaseAuth.ts), which is the wrong shape for a cron/
// GitHub-Actions caller with no human session. Both internal routes share
// the SAME secret: they're both server-to-server, internal-only triggers in
// this one app, so a single trust boundary is sufficient — no need for a
// secret per feature.

const HEADER_NAME = "x-internal-ingest-secret";

/** Constant-time comparison — never a plain `===` on a secret. */
function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export function requireIngestSecret(req: Request, res: Response, next: NextFunction): void {
  const config = loadAppConfig().internalIngest;
  if (!config) {
    res.status(503).json({ error: { code: "INTERNAL_INGEST_NOT_CONFIGURED", message: "Ingestion is not configured." } });
    return;
  }

  const provided = req.header(HEADER_NAME);
  if (!provided || !safeEqual(provided, config.secret)) {
    res.status(401).json({ error: { code: "INVALID_INGEST_SECRET", message: `Missing or invalid ${HEADER_NAME} header.` } });
    return;
  }

  next();
}
