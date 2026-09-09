import type { NextFunction, Request, Response } from "express";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { loadAppConfig } from "../config/env";

// Auth is entirely delegated to Supabase Auth — this module never handles a
// password. `requireHolder` verifies the bearer JWT a signed-in holder sends
// on each request (issued by Supabase at sign-in) and attaches the holder's
// id/email to `req.holder`. See docs/AUTH_SUPABASE.md for the full flow.

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      holder?: { id: string; email: string | null };
    }
  }
}

let cachedClient: SupabaseClient | null = null;

/** Lazily creates the shared Supabase client used to verify holder tokens. Throws if Supabase is not configured — callers must check `loadAppConfig().supabase` first. */
function getSupabaseClient(): SupabaseClient {
  if (cachedClient) return cachedClient;
  const config = loadAppConfig().supabase;
  if (!config) throw new Error("Supabase is not configured — set SUPABASE_API_URL and SUPABASE_PUBLISHABLE_KEY/SUPABASE_API_ANON in apps/backend/.env.");
  cachedClient = createClient(config.url, config.anonKey, { auth: { persistSession: false } });
  return cachedClient;
}

/** Express middleware — rejects the request with 401 unless a valid Supabase-issued bearer token is present, then attaches `req.holder`. */
export async function requireHolder(req: Request, res: Response, next: NextFunction): Promise<void> {
  const config = loadAppConfig().supabase;
  if (!config) {
    res.status(503).json({ error: { code: "SUPABASE_NOT_CONFIGURED", message: "Authentication is not configured." } });
    return;
  }

  const header = req.header("authorization");
  const token = header?.startsWith("Bearer ") ? header.slice("Bearer ".length) : null;
  if (!token) {
    res.status(401).json({ error: { code: "MISSING_TOKEN", message: "Authorization: Bearer <token> is required." } });
    return;
  }

  try {
    const { data, error } = await getSupabaseClient().auth.getUser(token);
    if (error || !data.user) {
      res.status(401).json({ error: { code: "INVALID_TOKEN", message: "Session is invalid or expired." } });
      return;
    }
    req.holder = { id: data.user.id, email: data.user.email ?? null };
    next();
  } catch {
    res.status(503).json({ error: { code: "AUTH_CHECK_FAILED", message: "Could not verify the session right now." } });
  }
}

/** Test-only escape hatch — mirrors the __reset*ForTests() convention used elsewhere (config/env.ts, db/pool.ts). */
export function __resetSupabaseClientForTests(): void {
  cachedClient = null;
}
