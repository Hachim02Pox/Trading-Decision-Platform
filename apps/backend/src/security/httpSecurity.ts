import type { ErrorRequestHandler, Request, RequestHandler } from "express";
import { isIP } from "node:net";

type Environment = Record<string, string | undefined>;
const deployed = (env: Environment) => env.NODE_ENV === "production" || Boolean(env.RAILWAY_ENVIRONMENT_ID || env.VERCEL);

export function listenHost(env: Environment = process.env): string {
  return deployed(env) ? "0.0.0.0" : "127.0.0.1";
}

// Local CLI sessions have access to the owner's machine and account tools.
// They are never enabled automatically just because a binary is installed.
export function trustedLocalCliEnabled(env: Environment = process.env): boolean {
  return !deployed(env) && env.ALLOW_TRUSTED_LOCAL_CLI === "true";
}

export function clientIdentity(req: Request, env: Environment = process.env): string {
  if (req.holder?.id) return `holder:${req.holder.id}`;
  // Railway HTTP edge supplies X-Real-IP (documented networking contract).
  // This trust is ONLY valid behind its HTTP edge: never expose a TCP proxy
  // or direct public backend listener while enabling these Railway variables.
  const realIp = req.headers["x-real-ip"];
  if (env.RAILWAY_ENVIRONMENT_ID && env.RAILWAY_PUBLIC_DOMAIN && typeof realIp === "string" && isIP(realIp)) return `client:${realIp}`;
  return `socket:${req.socket.remoteAddress ?? "unknown"}`;
}

export function createRateLimiter(options: { max?: number; windowMs?: number; maxKeys?: number; now?: () => number; env?: Environment } = {}): RequestHandler {
  const { max = 600, windowMs = 60_000, maxKeys = 10_000, now = Date.now, env = process.env } = options;
  const clients = new Map<string, { count: number; expires: number }>();
  let lastSweep = 0;
  return (req, res, next) => {
    const time = now();
    if (time - lastSweep >= windowMs || clients.size >= maxKeys) {
      for (const [key, value] of clients) if (value.expires <= time) clients.delete(key);
      lastSweep = time;
    }
    const key = clientIdentity(req, env);
    const prior = clients.get(key);
    const current = prior && prior.expires > time ? prior : { count: 0, expires: time + windowMs };
    if ((!prior && clients.size >= maxKeys) || current.count >= max) {
      res.setHeader("Retry-After", Math.max(1, Math.ceil((current.expires - time) / 1000)));
      res.status(429).json({ error: { code: "RATE_LIMITED", message: "Too many requests. Please try again shortly." } });
      return;
    }
    clients.set(key, { count: current.count + 1, expires: current.expires });
    next();
  };
}

export function createStreamLimiter(maxTotal = 100, maxPerAddress = 5, env: Environment = process.env): RequestHandler {
  const counts = new Map<string, number>();
  let total = 0;
  return (req, res, next) => {
    const key = clientIdentity(req, env);
    const count = counts.get(key) ?? 0;
    // Unknown deployment proxy topology gets the global cap rather than
    // treating every visitor behind a shared edge as one five-tab client.
    const perClient = deployed(env) && key.startsWith("socket:") ? maxTotal : maxPerAddress;
    if (total >= maxTotal || count >= perClient) {
      res.status(429).json({ error: { code: "STREAM_LIMITED", message: "Too many active news streams." } });
      return;
    }
    total++;
    counts.set(key, count + 1);
    res.once("close", () => {
      total--;
      const remaining = (counts.get(key) ?? 1) - 1;
      if (remaining > 0) counts.set(key, remaining); else counts.delete(key);
    });
    next();
  };
}

export function createPublicRateLimiter(options: Parameters<typeof createRateLimiter>[0] = {}): RequestHandler {
  const limiter = createRateLimiter(options);
  return (req, res, next) => {
    if (req.path === "/health" || req.path.startsWith("/api/internal/") || req.path.startsWith("/internal/")) { next(); return; }
    limiter(req, res, next);
  };
}

export const sandboxProxyHtml: RequestHandler = (_req, res, next) => {
  // Applies even when the proxy URL is opened directly, outside our iframe.
  res.setHeader("Content-Security-Policy", "sandbox allow-scripts allow-popups");
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");
  next();
};

export const safeHttpError: ErrorRequestHandler = (error, _req, res, _next) => {
  if (res.headersSent) { res.end(); return; }
  const status = error?.type === "entity.too.large" ? 413 : error instanceof SyntaxError ? 400 : 500;
  res.status(status).json({ error: { code: status === 500 ? "INTERNAL_ERROR" : "INVALID_REQUEST", message: status === 500 ? "The request could not be completed." : "Invalid request body." } });
};
